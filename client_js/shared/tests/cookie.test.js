/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  cookiePack,
  cookieUnpack,
  maybeUpdatePayload,
} from '../model/cookies.js';

jest.mock('../version.js', () => ({
  getVersionInfo: () => ({
    version: '1.0.0',
    buildDate: '2025-01-01T00:00:00.000Z',
  }),
}));

describe('Cookies.js test', () => {
  // Expected appendix values for version 1.0.0
  const APPENDIX_GENERAL_NEW_STR = 'AQYBAQAA';
  const APPENDIX_NET_NEW_STR = 'AQYCAQAA';
  const APPENDIX_MODIFIED_NEW_STR = 'AQYDAQAA';
  const TIMESTAMP = 1234567890;
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => TIMESTAMP);
  });
  test('cookiePack success', () => {
    expect(cookiePack(1, 2, 'testpayload')).toEqual('fb.1.2.testpayload');
    expect(cookiePack(1, 2, 'testpayload', null)).toEqual('fb.1.2.testpayload');
    expect(cookiePack(1, 2, 'testpayload', 'appendix')).toEqual(
      'fb.1.2.testpayload.appendix'
    );
  });

  test('cookieUnpack valid case', () => {
    const result_with_legacy_appendix = cookieUnpack('fb.1.2.testpayload.Bg');
    expect(result_with_legacy_appendix).toEqual({
      creationTime: 2,
      subdomainIndex: 1,
      appendix: 'Bg',
      payload: 'testpayload',
    });

    const result_without_appendix = cookieUnpack('fb.1.2.testpayload');
    expect(result_without_appendix).toEqual({
      creationTime: 2,
      subdomainIndex: 1,
      payload: 'testpayload',
    });

    const result_with_new_appendix = cookieUnpack(
      'fb.1.2.testpayload.' + APPENDIX_GENERAL_NEW_STR
    );
    expect(result_with_new_appendix).toEqual({
      creationTime: 2,
      subdomainIndex: 1,
      payload: 'testpayload',
      appendix: APPENDIX_GENERAL_NEW_STR,
    });
  });

  test('cookieUnpack invalid case', () => {
    expect(cookieUnpack('fb.1.2')).toBeNull();
    expect(cookieUnpack('fb2.1.1533706565.someCl1ckID')).toBeNull();
    expect(cookieUnpack('gclick.1.1533706565.someCl1ckID')).toBeNull();
    expect(cookieUnpack('fb.1.pusheen.someCl1ckID')).toBeNull();
    expect(cookieUnpack('fb.1.1533706565')).toBeNull();
    expect(cookieUnpack('fb.1.1533706565.beep.blorp')).toBeNull();
    expect(cookieUnpack('fb.1.1533706565.someCl1ckID.AB')).toBeNull();
  });

  test('maybeUpdatePayload has existing cookie, no update', () => {
    const existing_cookie = {
      creationTime: 2,
      subdomainIndex: 1,
      appendix: 'Bg',
      payload: 'testpayload',
    };
    const cookie_result = maybeUpdatePayload(existing_cookie, 'testpayload');
    expect(cookie_result).toEqual(existing_cookie);
  });

  test('maybeUpdatePayload with existing cookie and changed payload', () => {
    const existing_cookie = {
      creationTime: 2,
      subdomainIndex: 1,
      appendix: 'Bg',
      payload: 'testpayload',
    };
    const cookie_result = maybeUpdatePayload(existing_cookie, 'updateCookie');
    expect(cookie_result).toEqual({
      creationTime: TIMESTAMP,
      subdomainIndex: 1,
      payload: 'updateCookie',
      appendix: APPENDIX_MODIFIED_NEW_STR,
    });
  });

  test('maybeUpdatePayload with null existingCookie uses NET_NEW appendix', () => {
    const cookie_result = maybeUpdatePayload(null, 'newPayload');
    expect(cookie_result).toEqual({
      creationTime: TIMESTAMP,
      subdomainIndex: null,
      payload: 'newPayload',
      appendix: APPENDIX_NET_NEW_STR,
    });
  });
});
