/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getFbc, getFbp, getClientIpAddress } from '../utils/commonUtil.js';

describe('commonUtil test', () => {
  let originalCookie;

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

  test('getFbc from cookie, fbc exist', () => {
    const fbc_string = 'fb.1.4567.testPayload.Bg';
    Object.defineProperty(document, 'cookie', {
      value: '_fbc=' + fbc_string,
      writable: true,
    });
    const fbc = getFbc();
    expect(fbc).toEqual(fbc_string);
  });

  test('getFbc from cookie, fbc not exist', () => {
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
    });
    const fbc = getFbc();
    expect(fbc).toEqual('');
  });

  test('getFbp from cookie, fbp exist', () => {
    const fbp_string = 'fb.1.4567.testPayload.Bg';
    Object.defineProperty(document, 'cookie', {
      value: '_fbp=' + fbp_string,
      writable: true,
    });
    const fbc = getFbp();
    expect(fbc).toEqual(fbp_string);
  });

  test('getFbc from cookie, fbc not exist', () => {
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
    });
    const fbc = getFbp();
    expect(fbc).toEqual('');
  });

  test('getClientIpAddress from cookie, fbi exist', () => {
    const fbi_string = '192.168.1.1.AQYCAQAA';
    Object.defineProperty(document, 'cookie', {
      value: '_fbi=' + fbi_string,
      writable: true,
    });
    const fbi = getClientIpAddress();
    expect(fbi).toEqual(fbi_string);
  });

  test('getClientIpAddress from cookie, fbi not exist', () => {
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
    });
    const fbi = getClientIpAddress();
    expect(fbi).toEqual('');
  });
});
