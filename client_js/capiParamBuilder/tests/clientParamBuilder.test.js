/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  processAndCollectParams,
  processAndCollectAllParams,
} from '../src/clientParamBuilder.js';
import {
  setup_android,
  setup_ios,
} from '../../shared/tests/mock/ebpUnitTestMock.js';
import {
  CLICKTHROUGH_COOKIE_NAME,
  DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME,
} from '../../shared/model/constants.js';
jest.mock('../../shared/version.js', () => ({
  getVersionInfo: () => ({
    version: '1.0.0',
    buildDate: '2025-01-01T00:00:00.000Z',
  }),
}));

describe('Test clientParamBuilder', () => {
  let originalCookie;
  // Expected appendix value for version 1.0.0
  const APPENDIX_NET_NEW_STR = 'AQYCAQAA';

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
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { href: 'http://test.com/', hostname: 'test.com' },
      writable: true,
      configurable: true,
    });
  });
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  test('processAndCollectParams with fbp only, no fbc pass in from url', () => {
    const params = processAndCollectParams('http://test.com/?test=abc');
    expect(Object.keys(params).length).toEqual(1);
    expect(params[DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME]).toMatch(
      new RegExp(`^fb.0.[0-9]+.[0-9]+.${APPENDIX_NET_NEW_STR}$`)
    );
  });

  test('processAndCollectParams with fbp and fbc. fbclid input from url', () => {
    const params = processAndCollectParams('http://test.com/?fbclid=abc123');
    expect(Object.keys(params).length).toEqual(2);
    expect(params[DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME]).toMatch(
      new RegExp(`^fb.0.[0-9]+.[0-9]+.${APPENDIX_NET_NEW_STR}$`)
    );
    expect(params[CLICKTHROUGH_COOKIE_NAME]).toMatch(
      new RegExp(`^fb.0.[0-9]+.abc123.${APPENDIX_NET_NEW_STR}$`)
    );
  });

  test('processAndCollectParams with fbc from cookie', () => {
    document.cookie = '_fbc=fb.1.4567.testCookie.Bg;';
    const params = processAndCollectParams('http://test.com');
    expect(params[CLICKTHROUGH_COOKIE_NAME]).toEqual('fb.1.4567.testCookie.Bg');
  });

  test('processAndCollectParams with fbp from cookie', () => {
    document.cookie = '_fbp=fb.1.4567.1234567.Bg;';
    const params = processAndCollectParams('http://test.com');
    expect(params[DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME]).toEqual(
      'fb.1.4567.1234567.Bg'
    );
  });

  test('processAndCollectAllParams android, fetch clickID from ebp', async () => {
    setup_android();
    const params = await processAndCollectAllParams('http://test.com');
    expect(params[CLICKTHROUGH_COOKIE_NAME]).toMatch(
      new RegExp(`^fb.0.[0-9]+.androidClickID.${APPENDIX_NET_NEW_STR}$`)
    );
  });

  test('processAndCollectAllParams ios, fetch clickID from ebp', async () => {
    setup_ios();
    const params = await processAndCollectAllParams('http://test.com');
    expect(params[CLICKTHROUGH_COOKIE_NAME]).toMatch(
      new RegExp(`^fb.0.[0-9]+.iosClickID.${APPENDIX_NET_NEW_STR}$`)
    );
  });
});
