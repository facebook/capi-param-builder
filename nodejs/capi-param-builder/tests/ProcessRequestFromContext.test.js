/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const pb = require('../src/ParamBuilder');
const ParamBuilder = pb.ParamBuilder;
const PlainDataObject = require('../src/model/PlainDataObject');
const Constants = require('../src/model/Constants');
const DummyLocalHostTestResolver =
  require('./DummyLocalHostTestResolver').DummyLocalHostTestResolver;

const DUMMY_TIMESTAMP = 1234567890;
const DUMMY_APPENDIX_NO_CHANGE = 'AQQAAQAA';
const DUMMY_APPENDIX_NET_NEW = 'AQQCAQAA';
const DUMMY_APPENDIX_MODIFIED_NEW = 'AQQDAQAA';

jest.mock('../package.json', () => ({version: '1.0.0'}));

/**
 * Unit tests for ParamBuilder.processRequestFromContext
 *
 * Tests cover:
 * - PlainDataObject input handling
 * - Raw HTTP request object input handling (Express, Fastify, Koa, native http)
 * - Null / empty input handling
 * - Equivalence with processRequest
 * - Cookie update behavior
 * - Domain handling
 * - Client IP extraction
 * - Referer handling
 * - Edge cases and error handling
 */
describe('ParamBuilder.processRequestFromContext', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => DUMMY_TIMESTAMP);
    jest.spyOn(Math, 'random').mockImplementation(() => 1);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // =========================================================================
  // PlainDataObject Input Tests
  // =========================================================================

  describe('PlainDataObject Input', () => {
    test('basic PlainDataObject with fbclid query param', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {fbclid: 'test123'},
        {},
        null,
        null,
        null
      );

      const result = builder.processRequestFromContext(dataObject);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.test123\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
      expect(typeof builder.getFbp()).toBe('string');
    });

    test('PlainDataObject with full data', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'shop.example.com',
        {fbclid: 'IwAR3xyz', utm_source: 'facebook'},
        {_fbp: `fb.1.1234567890.9876543210.${DUMMY_APPENDIX_NO_CHANGE}`},
        'https://facebook.com/ad',
        '203.0.113.50',
        '10.0.0.1'
      );

      const result = builder.processRequestFromContext(dataObject);

      expect(Array.isArray(result)).toBe(true);
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.IwAR3xyz\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
      // Existing fbp should be preserved
      expect(builder.getFbp()).toBe(
        `fb.1.1234567890.9876543210.${DUMMY_APPENDIX_NO_CHANGE}`
      );
    });

    test('PlainDataObject with existing cookies appends language token', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {
          _fbc: 'fb.1.123456.abc',
          _fbp: 'fb.1.123456.7890',
        },
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getFbc()).toBe(
        `fb.1.123456.abc.${DUMMY_APPENDIX_NO_CHANGE}`
      );
      expect(builder.getFbp()).toBe(
        `fb.1.123456.7890.${DUMMY_APPENDIX_NO_CHANGE}`
      );
    });

    test('PlainDataObject with no fbclid still generates fbp', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {},
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getFbc()).toBeNull();
      expect(typeof builder.getFbp()).toBe('string');
      expect(builder.getFbp()).toMatch(
        new RegExp(`\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });
  });

  // =========================================================================
  // Raw HTTP Request Object Input Tests
  // =========================================================================

  describe('Raw HTTP Request Object Input', () => {
    test('native http.IncomingMessage with query and host', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {host: 'api.example.com'},
        socket: {remoteAddress: '192.168.1.100'},
        url: '/path?fbclid=fromUrl',
      };

      builder.processRequestFromContext(req);

      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.fromUrl\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
      expect(typeof builder.getFbp()).toBe('string');
    });

    test('request with cookie header', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {
          host: 'example.com',
          cookie: '_fbc=fb.1.123.abc; _fbp=fb.1.456.7890',
        },
      };

      builder.processRequestFromContext(req);

      expect(builder.getFbc()).toBe(`fb.1.123.abc.${DUMMY_APPENDIX_NO_CHANGE}`);
      expect(builder.getFbp()).toBe(
        `fb.1.456.7890.${DUMMY_APPENDIX_NO_CHANGE}`
      );
    });

    test('request with referer containing fbclid', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {
          host: 'landing.example.com',
          referer: 'https://facebook.com/ad?fbclid=IwAR_referer',
        },
        socket: {remoteAddress: '203.0.113.1'},
        url: '/landing',
      };

      builder.processRequestFromContext(req);

      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.IwAR_referer\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });

    test('request with x-forwarded-for header', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {
          host: 'example.com',
          'x-forwarded-for': '203.0.113.50, 10.0.0.1',
          cookie: '_fbi=8.8.8.8.BA',
        },
        socket: {remoteAddress: '10.0.0.1'},
        url: '/?fbclid=test',
      };

      builder.processRequestFromContext(req);

      expect(typeof builder.getFbc()).toBe('string');
      const clientIp = builder.getClientIpAddress();
      expect(clientIp).not.toBeNull();
    });
  });

  // =========================================================================
  // Minimal Request Input Tests
  // =========================================================================

  describe('Minimal Request Input', () => {
    test('request with only host header still generates fbp', () => {
      const builder = new ParamBuilder();

      const req = {headers: {host: 'example.com'}};

      builder.processRequestFromContext(req);

      // No fbc payload available, but fbp should still be created
      expect(builder.getFbc()).toBeNull();
      expect(typeof builder.getFbp()).toBe('string');
      expect(builder.getFbp()).toMatch(
        new RegExp(`\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });

    test('request with host and url query string', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {host: 'example.com'},
        url: '/path?fbclid=minimalTest',
      };

      const result = builder.processRequestFromContext(req);

      expect(Array.isArray(result)).toBe(true);
      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.minimalTest\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });
  });

  // =========================================================================
  // Equivalence Tests (processRequestFromContext vs processRequest)
  // =========================================================================

  describe('Equivalence with processRequest', () => {
    test('PlainDataObject input is equivalent to direct processRequest', () => {
      const host = 'shop.example.com';
      const queries = {fbclid: 'equivalenceTest'};
      const cookies = {};
      const referer = 'https://facebook.com/ad';
      const xForwardedFor = '203.0.113.50';
      const remoteAddress = '10.0.0.1';

      const builder1 = new ParamBuilder();
      const result1 = builder1.processRequest(
        host,
        queries,
        cookies,
        referer,
        xForwardedFor,
        remoteAddress
      );

      const builder2 = new ParamBuilder();
      const dataObject = new PlainDataObject(
        host,
        queries,
        cookies,
        referer,
        xForwardedFor,
        remoteAddress
      );
      const result2 = builder2.processRequestFromContext(dataObject);

      expect(result1.length).toBe(result2.length);
      expect(builder1.getFbc()).toBe(builder2.getFbc());
      expect(builder1.getFbp()).toBe(builder2.getFbp());
    });

    test('existing cookies produce equivalent results', () => {
      const host = 'example.com';
      const queries = {};
      const cookies = {
        _fbc: 'fb.1.123.existingPayload',
        _fbp: 'fb.1.456.existingFbp',
      };

      const builder1 = new ParamBuilder();
      builder1.processRequest(host, queries, cookies, null, null, null);

      const builder2 = new ParamBuilder();
      const dataObject = new PlainDataObject(
        host,
        queries,
        cookies,
        null,
        null,
        null
      );
      builder2.processRequestFromContext(dataObject);

      expect(builder1.getFbc()).toBe(builder2.getFbc());
      expect(builder1.getFbp()).toBe(builder2.getFbp());
    });
  });

  // =========================================================================
  // Node.js Framework Simulation Tests
  // =========================================================================

  describe('Node.js Framework Simulations', () => {
    test('Express request', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {
          host: 'express-app.com',
          referer: 'https://express-app.com/dashboard',
          'x-forwarded-for': '203.0.113.50',
        },
        socket: {remoteAddress: '127.0.0.1'},
        query: {page: '1', fbclid: 'expressTest'},
        cookies: {express_session: 'abc123'},
      };

      builder.processRequestFromContext(req);

      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.expressTest\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });

    test('Fastify request (wrapped in .raw)', () => {
      const builder = new ParamBuilder();

      const nativeReq = {
        headers: {
          host: 'fastify-app.com',
          referer: 'https://example.com',
          'x-forwarded-for': '8.8.8.8',
        },
        socket: {remoteAddress: '127.0.0.1'},
        url: '/api/data?fbclid=fastifyTest',
      };

      const fastifyReq = {
        raw: nativeReq,
        query: {fbclid: 'fastifyTest'},
        cookies: {fastify_session: 'session123'},
      };

      builder.processRequestFromContext(fastifyReq);

      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.fastifyTest\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });

    test('Koa request (wrapped in .req)', () => {
      const builder = new ParamBuilder();

      const nativeReq = {
        headers: {
          host: 'koa-app.com',
          'x-forwarded-for': '1.2.3.4',
        },
        socket: {remoteAddress: '10.0.0.1'},
        url: '/api?fbclid=koaTest',
      };

      const koaCtx = {
        req: nativeReq,
        query: {fbclid: 'koaTest'},
        cookies: {koa_session: 'sess_koa123'},
      };

      builder.processRequestFromContext(koaCtx);

      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.koaTest\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });

    test('Native http.IncomingMessage', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {
          host: 'native-app.com',
          cookie: 'native_cookie=value',
        },
        socket: {remoteAddress: '172.16.0.1'},
        url: '/api/native?fbclid=nativeTest',
      };

      builder.processRequestFromContext(req);

      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.nativeTest\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });

    test('Next.js API route request', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {
          host: 'nextjs-app.vercel.app',
          referer: 'https://nextjs.org',
          'x-forwarded-for': '203.0.113.100',
        },
        socket: {remoteAddress: '10.0.0.1'},
        query: {fbclid: 'nextTest'},
        cookies: {next_session: 'next123'},
        url: '/api/posts?fbclid=nextTest',
      };

      builder.processRequestFromContext(req);

      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.nextTest\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });
  });

  // =========================================================================
  // Cookie Update Tests
  // =========================================================================

  describe('Cookie Update Behavior', () => {
    test('updates fbc when payload changes', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {fbclid: 'newPayload'},
        {_fbc: 'fb.1.123.oldPayload'},
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.newPayload\\.${DUMMY_APPENDIX_MODIFIED_NEW}$`)
      );
    });

    test('preserves fbc when payload is the same', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {fbclid: 'samePayload'},
        {_fbc: 'fb.1.123.samePayload'},
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      // Existing cookie gets language-token appended; payload not rewritten
      expect(builder.getFbc()).toBe(
        `fb.1.123.samePayload.${DUMMY_APPENDIX_NO_CHANGE}`
      );
    });

    test('generates new fbp when missing', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {},
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(typeof builder.getFbp()).toBe('string');
      expect(builder.getFbp().startsWith('fb.')).toBe(true);
      expect(builder.getFbp()).toMatch(
        new RegExp(`\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });

    test('preserves existing fbp', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {_fbp: 'fb.1.999.existingFbp'},
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getFbp()).toBe(
        `fb.1.999.existingFbp.${DUMMY_APPENDIX_NO_CHANGE}`
      );
    });
  });

  // =========================================================================
  // Domain Handling Tests
  // =========================================================================

  describe('Domain Handling', () => {
    test('with domain list resolves correct domain', () => {
      const builder = new ParamBuilder(['example.com', 'test.com']);

      const dataObject = new PlainDataObject(
        'shop.subdomain.test.com',
        {fbclid: 'domainTest'},
        {},
        null,
        null,
        null
      );

      const result = builder.processRequestFromContext(dataObject);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      for (const cookie of result) {
        expect(cookie.domain).toBe('test.com');
      }
    });

    test('with custom resolver', () => {
      const builder = new ParamBuilder(
        new DummyLocalHostTestResolver('custom.domain.com')
      );

      const dataObject = new PlainDataObject(
        'sub.custom.domain.com',
        {fbclid: 'resolverTest'},
        {},
        null,
        null,
        null
      );

      const result = builder.processRequestFromContext(dataObject);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      for (const cookie of result) {
        expect(cookie.domain).toBe('custom.domain.com');
      }
    });

    test('with IPv4 host (with port)', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        '127.0.0.1:8080',
        {fbclid: 'ipv4Test'},
        {},
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.ipv4Test\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });

    test('with IPv6 host (bracketed, with port)', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        '[::1]:8080',
        {fbclid: 'ipv6Test'},
        {},
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.ipv6Test\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });
  });

  // =========================================================================
  // Client IP Tests
  // =========================================================================

  describe('Client IP Extraction', () => {
    test('extracts client IP from x-forwarded-for', () => {
      const builder = new ParamBuilder();

      // fbclid is required so processRequest doesn't early-return before
      // computing the client IP
      const dataObject = new PlainDataObject(
        'example.com',
        {fbclid: 'ipTest'},
        {},
        null,
        '203.0.113.50, 10.0.0.1',
        '10.0.0.1'
      );

      builder.processRequestFromContext(dataObject);

      const clientIp = builder.getClientIpAddress();
      expect(clientIp).not.toBeNull();
      expect(clientIp.startsWith('203.0.113.50')).toBe(true);
    });

    test('falls back to remote_address when x-forwarded-for is null', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {fbclid: 'ipTest'},
        {},
        null,
        null,
        '8.8.8.8'
      );

      builder.processRequestFromContext(dataObject);

      const clientIp = builder.getClientIpAddress();
      expect(clientIp).not.toBeNull();
      expect(clientIp.startsWith('8.8.8.8')).toBe(true);
    });

    test('uses _fbi cookie when present and valid', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {fbclid: 'ipTest'},
        {_fbi: '8.8.8.8.BA'},
        null,
        '203.0.113.50',
        null
      );

      builder.processRequestFromContext(dataObject);

      const clientIp = builder.getClientIpAddress();
      expect(clientIp).not.toBeNull();
    });
  });

  // =========================================================================
  // Referer Handling Tests
  // =========================================================================

  describe('Referer Handling', () => {
    test('extracts fbclid from referer when query is empty', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'landing.example.com',
        {},
        {},
        'https://facebook.com/ad?fbclid=IwAR_fromReferer',
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.IwAR_fromReferer\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });

    test('query params take precedence over referer', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {fbclid: 'fromQueryParams'},
        {},
        'https://facebook.com/ad?fbclid=fromReferer',
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc()).toMatch(
        new RegExp(`\\.fromQueryParams\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });

    test('referer without fbclid does not generate fbc', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {},
        'https://google.com/search?q=test',
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getFbc()).toBeNull();
      expect(typeof builder.getFbp()).toBe('string');
    });
  });

  // =========================================================================
  // Edge Cases and Error Handling
  // =========================================================================

  describe('Edge Cases and Error Handling', () => {
    test('invalid cookie format is rejected', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {
          _fbc: 'invalid.format.with.too.many.parts.here',
          _fbp: 'also.invalid.format.too.many',
        },
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getFbc()).toBeNull();
      expect(typeof builder.getFbp()).toBe('string');
      expect(builder.getFbp()).toMatch(
        new RegExp(`\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });

    test('cookie with invalid language token is rejected', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {
          _fbc: 'fb.1.123.abc.INVALID',
          _fbp: 'fb.1.456.7890.INVALID',
        },
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getFbc()).toBeNull();
      expect(typeof builder.getFbp()).toBe('string');
      expect(builder.getFbp()).toMatch(
        new RegExp(`\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });

    test('cookie with valid language token is preserved', () => {
      const builder = new ParamBuilder();

      const langToken = Constants.SUPPORTED_PARAM_BUILDER_LANGUAGES_TOKEN[0];

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {
          _fbc: `fb.1.123.abc.${langToken}`,
          _fbp: `fb.1.456.7890.${langToken}`,
        },
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getFbc()).toBe(`fb.1.123.abc.${langToken}`);
      expect(builder.getFbp()).toBe(`fb.1.456.7890.${langToken}`);
    });

    test('multiple calls reset state', () => {
      const builder = new ParamBuilder();

      const dataObject1 = new PlainDataObject(
        'first.example.com',
        {fbclid: 'firstCall'},
        {},
        null,
        null,
        null
      );
      builder.processRequestFromContext(dataObject1);
      const fbc1 = builder.getFbc();

      const dataObject2 = new PlainDataObject(
        'second.example.com',
        {fbclid: 'secondCall'},
        {},
        null,
        null,
        null
      );
      builder.processRequestFromContext(dataObject2);
      const fbc2 = builder.getFbc();

      expect(fbc1).toMatch(
        new RegExp(`\\.firstCall\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
      expect(fbc2).toMatch(
        new RegExp(`\\.secondCall\\.${DUMMY_APPENDIX_NET_NEW}$`)
      );
    });

    test('special characters in fbclid are preserved', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {fbclid: 'IwAR3_test-special'},
        {},
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(typeof builder.getFbc()).toBe('string');
      expect(builder.getFbc().includes('IwAR3_test-special')).toBe(true);
    });

    test('returns CookieSettings array with required properties', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'shop.sub.example.com',
        {fbclid: 'cookieSettingsTest'},
        {},
        null,
        null,
        null
      );

      const result = builder.processRequestFromContext(dataObject);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // _fbc and _fbp

      for (const cookie of result) {
        expect(cookie).toHaveProperty('name');
        expect(cookie).toHaveProperty('value');
        expect(cookie).toHaveProperty('domain');
        expect(cookie).toHaveProperty('maxAge');
        expect([
          Constants.FBC_NAME_STRING,
          Constants.FBP_NAME_STRING,
        ]).toContain(cookie.name);
        expect(cookie.maxAge).toBe(Constants.DEFAULT_1PC_AGE);
      }
    });

    test('empty query params produces no fbc', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {},
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getFbc()).toBeNull();
      expect(typeof builder.getFbp()).toBe('string');
    });

    test('getCookiesToSet returns the same array as the return value', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {fbclid: 'getCookiesTest'},
        {},
        null,
        null,
        null
      );

      const result = builder.processRequestFromContext(dataObject);
      const cookies = builder.getCookiesToSet();

      expect(Array.isArray(cookies)).toBe(true);
      expect(cookies.length).toBe(2);
      expect(cookies).toBe(result);
    });
  });
});
