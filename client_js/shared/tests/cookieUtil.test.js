/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  readPackedCookie,
  readCookieRaw,
  writeNewCookie,
  writeExistingCookie,
  mintDomainScopedBrowserIDCookieValue,
  updateClickIdCookieIfNecessary,
  updateDomainScopedBrowserIdCookieIfNecessary,
} from '../utils/cookieUtil.js';

jest.mock('../version.js', () => ({
  getVersionInfo: () => ({
    version: '1.0.0',
    buildDate: '2025-01-01T00:00:00.000Z',
  }),
}));

jest.mock('../model/constants.js', () => ({
  MAX_INT_9_DECIMAL_DIGITS: 999999999,
  NINETY_DAYS_IN_MS: 90 * 24 * 60 * 60 * 1000,
  CLICK_ID_PARAMETER: 'fbclid',
  CLICKTHROUGH_COOKIE_NAME: '_fbc',
  DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME: '_fbp',
  LANGUAGE_TOKEN: 'Bg',
  NUM_OF_EXPECTED_COOKIE_COMPONENTS: 4,
  NUM_OF_EXPECTED_COOKIE_COMPONENTS_WITH_LANGUAGE_TOKEN: 5,
  VALID_PARAM_BUILDER_TOKENS: ['AQ', 'Ag', 'Aw', 'BA', 'BQ', 'Bg'],
  ONLY_VALID_VERSION_SO_FAR: 'fb',
  DEFAULT_FBC_PARAMS: [
    { query: 'fbclid', prefix: '', ebp_path: 'clickID' },
    { query: 'query', prefix: 'test', ebp_path: 'clickID_sample' },
  ],
  DEFAULT_FORMAT: 0x01,
  LANGUAGE_TOKEN_INDEX: 0x06,
  APPENDIX_LENGTH_V2: 8,
  APPENDIX_GENERAL_NEW: 0x01,
  APPENDIX_NET_NEW: 0x02,
  APPENDIX_MODIFIED_NEW: 0x03,
  APPENDIX_NO_CHANGE: 0x00,
}));

describe('Test cookieUtil', () => {
  let originalCookie;
  // Expected appendix values for version 1.0.0
  const APPENDIX_NET_NEW_STR = 'AQYCAQAA';
  const APPENDIX_MODIFIED_NEW_STR = 'AQYDAQAA';
  const APPENDIX_NO_CHANGE_STR = 'AQYAAQAA';
  beforeAll(() => {
    originalCookie = document.cookie;
  });
  afterAll(() => {
    Object.defineProperty(document, 'cookie', {
      value: originalCookie,
      writable: true,
    });
  });
  beforeEach(() => {
    // Clear all cookies before each test
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
      configurable: true,
    });
    delete window.location;
    window.location = { href: 'http://test.com/', hostname: 'test.com' };
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    console.warn.mockRestore();
    jest.resetModules();
    jest.resetAllMocks();
  });

  test('readPackedCookie valid', () => {
    document.cookie = '_fbc=fb.1.4567.testPayload.Bg';
    const cookie = readPackedCookie('_fbc');
    expect(cookie).toEqual({
      creationTime: 4567,
      subdomainIndex: 1,
      appendix: 'Bg',
      payload: 'testPayload',
    });
  });

  test('readPackedCookie invalid', () => {
    document.cookie = '_fbc=fb.1.4567.testPayload.Bg';
    const cookie = readPackedCookie('fbc');
    expect(cookie).toBeNull();
  });

  test('readCookieRaw with multiple cookies', () => {
    document.cookie = '_fbc=fb.1.4567.testCookie.Bg;';
    document.cookie = '_test=value.123.test';
    const cookie = readCookieRaw('_test');
    expect(cookie).toEqual('value.123.test');
  });

  test('writeNewCookie success case', () => {
    const newCookie = writeNewCookie('_fbc', 'cookiePayload');
    expect(document.cookie).toEqual(
      expect.stringContaining('_fbc=' + newCookie)
    );
  });

  test('writeExistingCookie success case', () => {
    Object.defineProperty(document, 'cookie', {
      value: '_fbc=fb.1.4567.testCookie;',
      writable: true,
    });
    const existing_cookie = readPackedCookie('_fbc');
    const write_existing_cookie = writeExistingCookie('_fbc', existing_cookie);
    expect(document.cookie).toEqual(
      expect.stringContaining('_fbc=' + write_existing_cookie)
    );
    expect(write_existing_cookie).toEqual(
      expect.stringContaining('fb.1.4567.testCookie.' + APPENDIX_NO_CHANGE_STR)
    );
  });

  test('mintDomainScopedBrowserIDCookieValue', () => {
    const browserID = mintDomainScopedBrowserIDCookieValue();
    expect(browserID.length).toBeLessThan(19); // equal or less than 18
  });

  test('updateClickIdCookieIfNecessary when url updated', () => {
    Object.defineProperty(document, 'cookie', {
      value: '_fbc=fb.1.4567.testCookie',
      writable: true,
    });
    const updated_cookie = updateClickIdCookieIfNecessary(
      'http://test.com/?fbclid=testFbc'
    );
    expect(updated_cookie).toEqual(
      expect.stringContaining('.testFbc.' + APPENDIX_MODIFIED_NEW_STR)
    );
    expect(document.cookie).toEqual(
      expect.stringContaining('_fbc=' + updated_cookie)
    );
  });

  test('updateClickIdCookieIfNecessary, persis the same fbc when no new fbclid input', () => {
    const fbc_string = '_fbc=fb.1.4567.testCookie';
    Object.defineProperty(document, 'cookie', {
      value: fbc_string,
      writable: true,
    });
    updateClickIdCookieIfNecessary('http://test.com/');
    expect(document.cookie).toEqual(
      expect.stringContaining(fbc_string + '.' + APPENDIX_NO_CHANGE_STR)
    );
  });

  test('updateClickIdCookieIfNecessary, update fbc from window.location.href when no fbclid from input url', () => {
    const fbc_string = '_fbc=fb.1.4567.testCookie';
    Object.defineProperty(document, 'cookie', {
      value: fbc_string,
      writable: true,
    });
    Object.defineProperty(window.location, 'href', {
      writable: true,
      value: 'http://test.com/?fbclid=testFbc',
    });
    const updated_cookie = updateClickIdCookieIfNecessary('http://abc.com/');
    expect(updated_cookie).toEqual(
      expect.stringContaining('.testFbc.' + APPENDIX_MODIFIED_NEW_STR)
    );
    expect(document.cookie).toEqual(
      expect.stringContaining('_fbc=' + updated_cookie)
    );
  });

  test('updateClickIdCookieIfNecessary with multiple paramConfig', () => {
    const updated_cookie = updateClickIdCookieIfNecessary(
      'http://abc.com/?fbclid=test123&query=test456'
    );
    expect(updated_cookie).toEqual(
      expect.stringContaining('.test123_test_test456.' + APPENDIX_NET_NEW_STR)
    );
    expect(document.cookie).toEqual(
      expect.stringContaining('_fbc=' + updated_cookie)
    );
  });

  test('updateClickIdCookieIfNecessary with partially matched paramConfig', () => {
    const updated_cookie = updateClickIdCookieIfNecessary(
      'http://abc.com/?query=test456'
    );
    expect(updated_cookie).toEqual(
      expect.stringContaining('.test_test456.' + APPENDIX_NET_NEW_STR)
    );
    expect(document.cookie).toEqual(
      expect.stringContaining('_fbc=' + updated_cookie)
    );
  });

  test('updateClickIdCookieIfNecessary with paramConfig duplication value', () => {
    const updated_cookie = updateClickIdCookieIfNecessary(
      'http://abc.com/?fbclid=test123_test_balabla&query=test456'
    );
    expect(updated_cookie).toEqual(
      expect.stringContaining('.test123_test_balabla.' + APPENDIX_NET_NEW_STR)
    );
    expect(document.cookie).toEqual(
      expect.stringContaining('_fbc=' + updated_cookie)
    );
  });

  test('updateDomainScopedBrowserIdCookieIfNecessary, no updates, contains fbp already', () => {
    Object.defineProperty(document, 'cookie', {
      value: '_fbp=fb.1.4567.1234567',
      writable: true,
    });
    updateDomainScopedBrowserIdCookieIfNecessary();
    expect(document.cookie).toEqual(
      expect.stringContaining('_fbp=fb.1.4567.1234567.' + APPENDIX_NO_CHANGE_STR)
    );
  });

  test('updateDomainScopedBrowserIdCookieIfNecessary, update add', () => {
    updateDomainScopedBrowserIdCookieIfNecessary();
    expect(document.cookie).toEqual(expect.stringContaining('_fbp=fb.'));
    expect(document.cookie).toEqual(
      expect.stringContaining('.' + APPENDIX_NET_NEW_STR)
    );
  });
});
