/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
const pb = require('../src/ParamBuilder');
const ParamBuilder = pb.ParamBuilder;
const FbcParamConfig = require('../src/model/FbcParamConfig');
const DummyLocalHostTestResolver = require('./DummyLocalHostTestResolver').DummyLocalHostTestResolver;
const DUMMY_TIMESTAMP = 1234567890;
const DUMMY_FBP_PAYLOAD = 2147483647;
const DUMMY_LANGUAGE_TOKEN = 'BA';
const DUMMY_FBC_VALUE = "fb.1." + DUMMY_TIMESTAMP + ".abcd." + DUMMY_LANGUAGE_TOKEN;
const DUMMY_FBP_VALUE = "fb.1."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN;

describe('ParamBuilder base unit test', () => {
  beforeAll(() => {
    const MOCK_TIMESTAMP = 1234567890;
    jest.spyOn(Date, 'now').mockImplementation(() => MOCK_TIMESTAMP);
    jest.spyOn(Math, 'random').mockImplementation(() => 1);
  });

  test('testProcessRequestWithDummyResolver', () => {
    const dummy_resolver = new DummyLocalHostTestResolver('example.com');
    const builder = new ParamBuilder(dummy_resolver);
    const updated_cookies = builder.processRequest('a.builder.example.com:8080', {fbclid: 'abcd'}, '');
    expect(updated_cookies.length).toEqual(2);

    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toEqual(DUMMY_FBC_VALUE);
        expect(cookie.domain).toEqual("example.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toEqual(DUMMY_FBP_VALUE);
      }
    }
  });

  test('testProcessRequestWithDomainList', () => {
    const builder = new ParamBuilder(['example.com', 'test.com']);
    const updated_cookies = builder.processRequest('https://a.builder.example.com:8080', {fbclid: 'abcd'}, '');

    expect(updated_cookies.length).toEqual(2);
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toEqual(DUMMY_FBC_VALUE);
        expect(cookie.domain).toEqual("example.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toEqual(DUMMY_FBP_VALUE);
      }
    }
  });

  test('testProcessRequestWithDomainListWithHttp', () => {
    const builder = new ParamBuilder(['http://example.com:8080', 'https://test.com']);
    const updated_cookies = builder.processRequest('http://a.builder.example.com', {fbclid: 'abcd'}, '');

    expect(updated_cookies.length).toEqual(2);
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toEqual(DUMMY_FBC_VALUE);
        expect(cookie.domain).toEqual("example.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toEqual(DUMMY_FBP_VALUE);
      }
    }
  });

  test('testProcessRequestWithEmptyInput', () => {
    const builder = new ParamBuilder();
    const updated_cookies = builder.processRequest('a.builder.example.com:8080', {fbclid: 'abcde'}, '');

    expect(updated_cookies.length).toEqual(2);
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toEqual("fb.2." + DUMMY_TIMESTAMP + ".abcde." + DUMMY_LANGUAGE_TOKEN);
        expect(cookie.domain).toEqual("builder.example.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toEqual("fb.2."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);
      }
    }
  });

  test('testProcessRequestWithExistingCookie, add language token', () => {
    const sampleEtldPlus1Resolver = new DummyLocalHostTestResolver();
    const builder = new ParamBuilder(sampleEtldPlus1Resolver);
    const updated_cookies = builder.processRequest(
      'a.builder.example.com:8080',
      {
        fbclid: 'abc',
      },
      {
        '_fbc': 'fb.1.123.abc',
      }
    );
    // fbc not upated
    expect(updated_cookies.length).toEqual(2);
    expect(builder.getFbc()).toEqual('fb.1.123.abc.BA');
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toEqual('fb.1.123.abc.BA');
        expect(cookie.domain).toEqual("a.builder.example.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toEqual("fb.3."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);
        expect(cookie.domain).toEqual("a.builder.example.com");
      }
    }
  });

  test('testProcessRequestWithOutdatedCookie', () => {
    const builder = new ParamBuilder();
    const updated_cookies = builder.processRequest(
      'a.builder.example.com:8080',
      {
        fbclid: 'def',
      },
      {
        '_fbc':'fb.1.123.abc',
      }
    );
    expect(updated_cookies.length).toEqual(2);
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toEqual('fb.2.' + DUMMY_TIMESTAMP + '.def.BA');
        expect(cookie.domain).toEqual("builder.example.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toEqual("fb.2."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);
      }
    }
  });

  test('testProcessRequest with invalid existing cookie', () => {
    const builder = new ParamBuilder();
    const invalid_cookie_1 = builder.processRequest(
      'a.builder.example.com:8080',
      {},
      {
        '_fbc':'fb.1.123.abc.invalid', // invalid format
        '_fbp': 'fb.1.123.', // invalid format
      }
    );
    expect(invalid_cookie_1.length).toEqual(1);
    expect(builder.getFbc()).toEqual(null);
    expect(invalid_cookie_1[0].name).toEqual("_fbp");
    expect(invalid_cookie_1[0].value).toEqual("fb.2."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);

     const invalid_cookie_2 = builder.processRequest(
      'a.builder.example.com:8080',
      {},
      {
        '_fbc':'fb1.1.123.abc', // invalid format
        '_fbp':'fb.1b.123.', // invalid format
      }
    );
    expect(invalid_cookie_2.length).toEqual(1);
    expect(invalid_cookie_2[0].name).toEqual("_fbp");
    expect(invalid_cookie_2[0].value).toEqual("fb.2."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);

    const invalid_cookie_3 = builder.processRequest(
      'a.builder.example.com:8080',
      {},
      {
        '_fbc':'fb.1.123aa.abc', // invalid format
        '_fbp':'fb.000000.123_1.test', // invalid format
      }
    );
    expect(invalid_cookie_3.length).toEqual(1);
    expect(invalid_cookie_3[0].name).toEqual("_fbp");
    expect(invalid_cookie_3[0].value).toEqual("fb.2."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);
  });

  test('testProcessRequestWithExistingCookie, contains language token', () => {
    const builder = new ParamBuilder(['http://example.com:8080', 'https://test.com']);
    const updated_cookies = builder.processRequest(
      'a.builder.example.com:8080',
      null,
      {
        '_fbc':'fb.1.123.abc.Bg', // contains language token
      }
    );
    expect(updated_cookies.length).toEqual(1);
    expect(updated_cookies[0].name).toEqual("_fbp");
    expect(updated_cookies[0].value).toEqual("fb.1."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);
    expect(builder.getFbc()).toEqual('fb.1.123.abc.Bg');
  });

  test('testProcessRequestWithIP', () => {
    const etldPlus1Resolver = (host) => {throw new Error('')};
    const builder = new ParamBuilder(etldPlus1Resolver);
    const updated_cookies = builder.processRequest(
        '127.0.0.1:8080',
        {
          fbclid: 'abc',
        },
        null
    );
    expect(updated_cookies.length).toEqual(2);
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toEqual("fb.0."+ DUMMY_TIMESTAMP + ".abc." + DUMMY_LANGUAGE_TOKEN);
        expect(cookie.domain).toEqual("127.0.0.1");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toEqual("fb.0."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);
      }
    }
  });

  test('testProcessRequestWithIPv6', () => {
    const etldPlus1Resolver = (host) => {throw new Error('')};
    const builder = new ParamBuilder(etldPlus1Resolver);
    const updated_cookies = builder.processRequest(
        '[::1]:8080',
        {
          fbclid: 'abcd',
        },
        {},
        'example.com'
    );
    expect(updated_cookies.length).toEqual(2);
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toEqual("fb.0."+ DUMMY_TIMESTAMP + ".abcd." + DUMMY_LANGUAGE_TOKEN);
        expect(cookie.domain).toEqual("[::1]");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toEqual("fb.0."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);
      }
    }
  });


  test('testProcessRequestWithReferralWithoutProtocol', () => {
    const builder = new ParamBuilder();
    const updated_cookies = builder.processRequest(
        '[::1]:8080',
        null,
        undefined,
        'example.com?fbclid=test123'
    );
    expect(updated_cookies.length).toEqual(2);
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toEqual("fb.0."+ DUMMY_TIMESTAMP + ".test123." + DUMMY_LANGUAGE_TOKEN);
        expect(cookie.domain).toEqual("[::1]");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toEqual("fb.0."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);
      }
    }
  });

  test('testProcessRequestWithQueryAndReferer', () => {
    const builder = new ParamBuilder();
    const updated_cookies = builder.processRequest(
        'https://a.builder.example.com:8080',
        {'fbclid': 'test123'},
        null,
        'example.com?fbclid=456test'
    );
    expect(updated_cookies.length).toEqual(2);
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toEqual("fb.2."+ DUMMY_TIMESTAMP + ".test123." + DUMMY_LANGUAGE_TOKEN);
        expect(cookie.domain).toEqual("builder.example.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toEqual("fb.2."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);
      }
    }
  });

  test('testProcessRequestWithParamConfig', () => {
    const builder = new ParamBuilder();
    // Override existing value for unit test only
    builder.fbc_param_configs = [
      new FbcParamConfig('fbclid', '', 'clickID'),
      new FbcParamConfig('query', 'test', 'test123')
    ];
    const updated_cookies = builder.processRequest(
        'https://a.builder.example.com:8080',
        {
          'fbclid': 'test123',
          'query': 'placeholder'
        },
        null,
        'example.com?fbclid=456test'
    );
    expect(updated_cookies.length).toEqual(2);
    expect(builder.getFbc()).toEqual("fb.2."+ DUMMY_TIMESTAMP + ".test123_test_placeholder." + DUMMY_LANGUAGE_TOKEN);
    expect(builder.getFbp()).toEqual("fb.2."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);
  });

  test('testProcessRequestWithParamConfigMixReferrerAndQuery', () => {
    const builder = new ParamBuilder();
    // Override existing value for unit test only
    builder.fbc_param_configs = [
      new FbcParamConfig('fbclid', '', 'clickID'),
      new FbcParamConfig('query', 'test', 'test123')
    ];
    const updated_cookies = builder.processRequest(
        'https://a.builder.example.com:8080',
        {
          'balabala': 'test123',
          'query': 'placeholder'
        },
        null,
        'example.com?fbclid=456test'
    );
    expect(updated_cookies.length).toEqual(2);
    expect(builder.getFbc()).toEqual("fb.2."+ DUMMY_TIMESTAMP + ".456test_test_placeholder." + DUMMY_LANGUAGE_TOKEN);
    expect(builder.getFbp()).toEqual("fb.2."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);
  });

  test('testProcessRequestWithParamConfigNoMatched', () => {
    const builder = new ParamBuilder();
    // Override existing value for unit test only
    builder.fbc_param_configs = [
      new FbcParamConfig('fbclid', '', 'clickID'),
      new FbcParamConfig('query', 'test', 'test123')
    ];
    const updated_cookies = builder.processRequest(
        'https://a.builder.example.com:8080',
        {
          'balabala': 'test123',
          'tmp': 'placeholder'
        },
        null,
        'example.com?fbclidtest=456test'
    );
    expect(updated_cookies.length).toEqual(1);
    expect(builder.getFbc()).toEqual(null);
    expect(builder.getFbp()).toEqual("fb.2."+ DUMMY_TIMESTAMP + "." + DUMMY_FBP_PAYLOAD + "." + DUMMY_LANGUAGE_TOKEN);
  });
});
