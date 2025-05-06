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

  test('testProcessRequestWithDummyResolver', () => {
    const dummy_resolver = new DummyLocalHostTestResolver('example.com');
    const builder = new ParamBuilder(dummy_resolver);
    const updated_cookies = builder.processRequest('a.builder.example.com:8080', {fbclid: 'abc'}, '');
    expect(updated_cookies.length).toEqual(2);

    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toContain(".abc.Ag");
        expect(cookie.domain).toEqual("example.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toContain(".Ag");
      }
    }
  });

  test('testProcessRequestWithDomainList', () => {
    const builder = new ParamBuilder(['example.com', 'test.com']);
    const updated_cookies = builder.processRequest('https://a.builder.example.com:8080', {fbclid: 'abcde'}, '');

    expect(updated_cookies.length).toEqual(2);
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toContain(".abcde.Ag");
        expect(cookie.domain).toEqual("example.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toContain(".Ag");
      }
    }
  });

  test('testProcessRequestWithDomainListWithHttp', () => {
    const builder = new ParamBuilder(['http://example.com:8080', 'https://test.com']);
    const updated_cookies = builder.processRequest('http://a.builder.example.com', {fbclid: 'abcde'}, '');

    expect(updated_cookies.length).toEqual(2);
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toContain(".abcde.Ag");
        expect(cookie.domain).toEqual("example.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toContain(".Ag");
      }
    }
  });

  test('testProcessRequestWithEmptyInput', () => {
    const builder = new ParamBuilder();
    const updated_cookies = builder.processRequest('a.builder.example.com:8080', {fbclid: 'abcde'}, '');

    expect(updated_cookies.length).toEqual(2);
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toContain(".abcde.Ag");
        expect(cookie.domain).toEqual("builder.example.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toContain(".Ag");
      }
    }
  });

  test('testProcessRequestWithExistingCookie, add language token', () => {
    const walmartEtldPlus1Resolver = new DummyLocalHostTestResolver();
    const builder = new ParamBuilder(walmartEtldPlus1Resolver);
    const updated_cookies = builder.processRequest(
      'a.builder.walmart.com:8080',
      {
        fbclid: 'abc',
      },
      {
        '_fbc': 'fb.1.123.abc',
      }
    );
    // fbc not upated
    expect(updated_cookies.length).toEqual(2);
    expect(builder.getFbc()).toEqual('fb.1.123.abc.Ag');
    expect(builder.getFbc()).toContain('.Ag');
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toEqual('fb.1.123.abc.Ag');
        expect(cookie.domain).toEqual("a.builder.walmart.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toContain('.Ag');
        expect(cookie.domain).toEqual("a.builder.walmart.com");
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
        expect(cookie.value).toContain('.def.Ag');
        expect(cookie.domain).toEqual("builder.example.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toContain('.Ag');
      }
    }
  });

  test('testProcessRequest with invalid existing cookie', () => {
    const builder = new ParamBuilder();
    const updated_cookies = builder.processRequest(
      'a.builder.example.com:8080',
      {},
      {
        '_fbc':'fb.1.123.abc.invalid',
        '_fbp': 'fb.1.123.',
      }
    );
    expect(updated_cookies.length).toEqual(1);
    expect(updated_cookies[0].name).toEqual("_fbp");
    expect(updated_cookies[0].value).toContain('.Ag');
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
    expect(updated_cookies[0].value).toContain('.Ag');
    expect(builder.getFbc()).toContain('fb.1.123.abc');
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
        expect(cookie.value).toContain('.abc.Ag');
        expect(cookie.domain).toEqual("127.0.0.1");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toContain('.Ag');
      }
    }
  });

  test('testProcessRequestWithIPv6', () => {
    const etldPlus1Resolver = (host) => {throw new Error('')};
    const builder = new ParamBuilder(etldPlus1Resolver);
    const updated_cookies = builder.processRequest(
        '[::1]:8080',
        {
          fbclid: 'abc',
        },
        {},
        'example.com'
    );
    expect(updated_cookies.length).toEqual(2);
    for (const cookie of updated_cookies) {
      if (cookie.name === '_fbc') {
        expect(cookie.value).toContain('.abc.Ag');
        expect(cookie.domain).toEqual("[::1]");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toContain('.Ag');
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
        expect(cookie.value).toContain('.test123.Ag');
        expect(cookie.domain).toEqual("[::1]");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toContain('.Ag');
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
        expect(cookie.value).toContain('.test123.Ag');
        expect(cookie.domain).toEqual("builder.example.com");
      } else {
        expect(cookie.name).toEqual("_fbp");
        expect(cookie.value).toContain('.Ag');
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
    expect(builder.getFbc()).toContain('.test123_test_placeholder.Ag');
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
    expect(builder.getFbc()).toContain('.456test_test_placeholder.Ag');
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
    expect(builder.getFbp()).toContain('.Ag');
  });
