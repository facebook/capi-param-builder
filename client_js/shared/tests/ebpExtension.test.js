/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { setup_android, setup_ios } from './mock/ebpUnitTestMock.js';

function timeout(func, ms) {
  return new Promise((resolve) =>
    setTimeout(() => {
      func();
      resolve();
    }, ms)
  );
}
jest.mock('../version.js', () => ({
  getVersionInfo: () => ({
    version: '1.0.0',
    buildDate: '2025-01-01T00:00:00.000Z',
  }),
}));

describe('ebpExtension test', () => {
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
    // Clear all cookies before each test
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
      configurable: true,
    });
    delete window.location;
    window.location = { href: 'http://test.com/', hostname: 'test.com' };
  });
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    jest.dontMock('../model/constants.js');
  });

  test('collectParams ios', async () => {
    setup_ios();
    const { collectParams } = require('../ext/ebpExtension.js');
    const clickID = await collectParams();
    expect(clickID).toEqual('iosClickID');
  });

  test('collectParams ios with multiple params config', async () => {
    jest.doMock('../model/constants.js', () => ({
      CLICK_ID_PARAMETER: 'fbclid',
      DEFAULT_FBC_PARAMS: [
        { query: 'fbclid', prefix: '', ebp_path: 'clickID' },
        { query: 'query', prefix: 'test', ebp_path: 'sampleTest' },
      ],
    }));
    setup_ios();
    const { collectParams } = require('../ext/ebpExtension.js');
    const result = await collectParams();
    expect(result).toEqual('iosClickID_test_iosSampleTest');
  });

  test('collectParams ios with random config only', async () => {
    jest.doMock('../model/constants.js', () => ({
      CLICK_ID_PARAMETER: 'fbclid',
      DEFAULT_FBC_PARAMS: [
        { query: 'query', prefix: 'test', ebp_path: 'sampleTest' },
      ],
    }));
    setup_ios();
    const { collectParams } = require('../ext/ebpExtension.js');
    const result = await collectParams();
    expect(result).toEqual('test_iosSampleTest');
  });

  test('collectParams ios with multiple config with duplication', async () => {
    jest.doMock('../model/constants.js', () => ({
      CLICK_ID_PARAMETER: 'fbclid',
      DEFAULT_FBC_PARAMS: [
        { query: 'fbclid', prefix: '', ebp_path: 'clickID' },
        { query: 'query', prefix: 'test', ebp_path: 'sampleTest' },
      ],
    }));
    setup_ios('iosClickID_test_sample', null);
    const { collectParams } = require('../ext/ebpExtension.js');
    const result = await collectParams();
    expect(result).toEqual('iosClickID_test_sample');
  });

  test('collectParams android with multiple config', async () => {
    setup_android();
    jest.doMock('../model/constants.js', () => ({
      CLICK_ID_PARAMETER: 'fbclid',
      DEFAULT_FBC_PARAMS: [
        { query: 'fbclid', prefix: '', ebp_path: 'clickID' },
        { query: 'query', prefix: 'test', ebp_path: 'sampleTest' },
      ],
    }));
    const { collectParams } = require('../ext/ebpExtension.js');
    const clickID = await collectParams();
    expect(clickID).toEqual('androidClickID_test_androidSampleTest');
  });

  test('collectParams android with single config', async () => {
    setup_android();
    jest.doMock('../model/constants.js', () => ({
      CLICK_ID_PARAMETER: 'fbclid',
      DEFAULT_FBC_PARAMS: [
        { query: 'query', prefix: 'test', ebp_path: 'sampleTest' },
      ],
    }));
    const { collectParams } = require('../ext/ebpExtension.js');
    const clickID = await collectParams();
    expect(clickID).toEqual('test_androidSampleTest');
  });

  test('collectParams android with multiple configs duplication value', async () => {
    setup_android(null, 'androidClickID_test_sample', null);
    jest.doMock('../model/constants.js', () => ({
      CLICK_ID_PARAMETER: 'fbclid',
      DEFAULT_FBC_PARAMS: [
        { query: 'fbclid', prefix: '', ebp_path: 'clickID' },
        { query: 'query', prefix: 'test', ebp_path: 'sampleTest' },
      ],
    }));
    const { collectParams } = require('../ext/ebpExtension.js');
    const clickID = await collectParams();
    expect(clickID).toEqual('androidClickID_test_sample');
  });

  test('decorateUrl ios, without fbclid', async () => {
    setup_ios();
    const { decorateUrl } = require('../ext/ebpExtension.js');
    const url = await decorateUrl('https://test.com');
    expect(url).toEqual('https://test.com/?fbclid=iosClickID');
  });

  test('decorateUrl ios, with fbclid in url', async () => {
    setup_ios();
    const { decorateUrl } = require('../ext/ebpExtension.js');
    const url = await decorateUrl('https://test.com?fbclid=test123');
    expect(url).toEqual('https://test.com?fbclid=test123');
  });

  test('decorateUrl android, without fbclid', async () => {
    setup_android();
    const { decorateUrl } = require('../ext/ebpExtension.js');
    const url = await decorateUrl('https://test.com');
    expect(url).toEqual('https://test.com/?fbclid=androidClickID');
  });

  test('decorateUrl android, with fbclid in url', async () => {
    setup_android();
    const { decorateUrl } = require('../ext/ebpExtension.js');
    const url = await decorateUrl('https://test.com?fbclid=test123');
    expect(url).toEqual('https://test.com?fbclid=test123');
  });

  test('collectAndSetParams ios, contains fbp, update fbc', async () => {
    setup_ios();
    Object.defineProperty(document, 'cookie', {
      value: '_fbp=fb.1.123.456',
      writable: true,
    });
    const { collectAndSetParams } = require('../ext/ebpExtension.js');
    const result = await collectAndSetParams(true);
    expect(result).toEqual(true);
    expect(document.cookie).toEqual(
      expect.stringContaining('.iosClickID.' + APPENDIX_NET_NEW_STR)
    );
  });

  test('collectAndSetParams ios, contains fbc, update fbp', async () => {
    setup_ios();
    Object.defineProperty(document, 'cookie', {
      value: '_fbc=fb.1.123.test',
      writable: true,
    });
    const { collectAndSetParams } = require('../ext/ebpExtension.js');
    const result = await collectAndSetParams(true);
    expect(result).toEqual(true);
    expect(document.cookie).toEqual(expect.stringContaining('fb.0.'));
  });

  test('collectAndSetParams android, contains fbp, update fbc', async () => {
    setup_android();
    Object.defineProperty(document, 'cookie', {
      value: '_fbc=fb.1.123.test',
      writable: true,
    });
    const { collectAndSetParams } = require('../ext/ebpExtension.js');
    const result = await collectAndSetParams(true);
    expect(result).toEqual(true);
    expect(document.cookie).toEqual(expect.stringContaining('fb.0.'));
  });

  test('collectAndSetParams android, contains fbc, update fbp', async () => {
    setup_android();
    Object.defineProperty(document, 'cookie', {
      value: '_fbp=fb.1.123.1234',
      writable: true,
    });
    const { collectAndSetParams } = require('../ext/ebpExtension.js');
    const result = await collectAndSetParams(true);
    expect(result).toEqual(true);
    expect(document.cookie).toEqual(
      expect.stringContaining('.androidClickID.' + APPENDIX_NET_NEW_STR)
    );
  });

  test('collectAndSetParams android with IG UA, contains fbp', async () => {
    setup_android(
      'Mozilla/5.0 (Linux; Android 10; SM-G960U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 264.0.0.0.7 Android (29/10; 320dpi; 720x1384; samsung; SM-G960U; starqltesq; qcom; en_US; 1)'
    );
    Object.defineProperty(document, 'cookie', {
      value: '_fbp=fb.1.123.1234',
      writable: true,
    });
    const { collectAndSetParams } = require('../ext/ebpExtension.js');
    const result = await collectAndSetParams(true);
    expect(result).toEqual(true);
    expect(document.cookie).toEqual(
      expect.stringContaining('.androidClickID.' + APPENDIX_NET_NEW_STR)
    );
  });

  test('collectAndSetParams android with IG UA, contains fbp but version is too low', async () => {
    setup_android(
      'Mozilla/5.0 (Linux; Android 10; SM-G960U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 263.0.0.0.7 Android (29/10; 320dpi; 720x1384; samsung; SM-G960U; starqltesq; qcom; en_US; 1)'
    );
    Object.defineProperty(document, 'cookie', {
      value: '_fbp=fb.1.123.1234',
      writable: true,
    });
    const { collectAndSetParams } = require('../ext/ebpExtension.js');
    const result = await collectAndSetParams(true);
    expect(result).toEqual(false); // no update on cookie
    expect(document.cookie).toEqual('_fbp=fb.1.123.1234'); // only fbp is set
  });
});
