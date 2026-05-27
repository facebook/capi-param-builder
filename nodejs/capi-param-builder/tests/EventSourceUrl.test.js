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
const { getAppendixInfo } = require('../src/utils/AppendixProvider');

const DUMMY_TIMESTAMP = 1234567890;

jest.mock('../package.json', () => ({version: '1.0.0'}));

const NO_CHANGE_SUFFIX = `.${getAppendixInfo(Constants.APPENDIX_NO_CHANGE)}`;
const NET_NEW_SUFFIX = `.${getAppendixInfo(Constants.APPENDIX_NET_NEW)}`;

describe('ParamBuilder.getEventSourceUrl', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => DUMMY_TIMESTAMP);
    jest.spyOn(Math, 'random').mockImplementation(() => 1);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // =========================================================================
  // Scheme Variants
  // =========================================================================

  describe('Scheme variants', () => {
    test('scheme=https with host and URI produces https URL', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {},
        null,
        null,
        null,
        'https',
        '/path/to/page'
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getEventSourceUrl()).toBe(
        'https://example.com/path/to/page' + NET_NEW_SUFFIX
      );
    });

    test('scheme=http with host and URI produces http URL', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {},
        null,
        null,
        null,
        'http',
        '/landing'
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getEventSourceUrl()).toBe(
        'http://example.com/landing' + NET_NEW_SUFFIX
      );
    });

    test('scheme=null with host and URI returns null', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {},
        null,
        null,
        null,
        null,
        '/page'
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getEventSourceUrl()).toBeNull();
    });
  });

  // =========================================================================
  // Host With Port
  // =========================================================================

  describe('Host with port', () => {
    test('host with port is preserved in event_source_url', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com:8080',
        {},
        {},
        null,
        null,
        null,
        'https',
        '/path/to/page'
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getEventSourceUrl()).toBe(
        'https://example.com:8080/path/to/page' + NET_NEW_SUFFIX
      );
    });
  });

  // =========================================================================
  // Null / Empty Cases
  // =========================================================================

  describe('Null and empty cases', () => {
    test('all null/empty returns null', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        null,
        {},
        {},
        null,
        null,
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getEventSourceUrl()).toBeNull();
    });

    test('empty string host returns null', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        '',
        {},
        {},
        null,
        null,
        null,
        'https',
        '/path'
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getEventSourceUrl()).toBeNull();
    });

    test('host only (no scheme, no URI) returns null', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {},
        null,
        null,
        null,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getEventSourceUrl()).toBeNull();
    });

    test('host with empty URI produces URL with host only', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {},
        null,
        null,
        null,
        'https',
        ''
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getEventSourceUrl()).toBe(
        'https://example.com' + NET_NEW_SUFFIX
      );
    });
  });

  // =========================================================================
  // Query String Preserved
  // =========================================================================

  describe('Query string preserved', () => {
    test('URI with query string is preserved in event_source_url', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'shop.example.com',
        {},
        {},
        null,
        null,
        null,
        'https',
        '/products?category=shoes&page=2'
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getEventSourceUrl()).toBe(
        'https://shop.example.com/products?category=shoes&page=2' + NET_NEW_SUFFIX
      );
    });

    test('URI with fbclid in query string is preserved', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {fbclid: 'test123'},
        {},
        null,
        null,
        null,
        'https',
        '/landing?fbclid=test123&utm=campaign'
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getEventSourceUrl()).toBe(
        'https://example.com/landing?fbclid=test123&utm=campaign' + NET_NEW_SUFFIX
      );
    });
  });

  // =========================================================================
  // processRequestFromContext Sets URL, processRequest Does Not
  // =========================================================================

  describe('processRequestFromContext vs processRequest', () => {
    test('processRequestFromContext sets event_source_url', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {},
        null,
        null,
        null,
        'https',
        '/page'
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getEventSourceUrl()).toBe(
        'https://example.com/page' + NET_NEW_SUFFIX
      );
    });

    test('processRequest returns null for event_source_url', () => {
      const builder = new ParamBuilder();

      builder.processRequest('example.com', {}, {});

      expect(builder.getEventSourceUrl()).toBeNull();
    });

    test('processRequest resets event_source_url set by prior processRequestFromContext', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {},
        null,
        null,
        null,
        'https',
        '/first'
      );

      builder.processRequestFromContext(dataObject);
      expect(builder.getEventSourceUrl()).toBe(
        'https://example.com/first' + NET_NEW_SUFFIX
      );

      builder.processRequest('example.com', {}, {});
      expect(builder.getEventSourceUrl()).toBeNull();
    });
  });

  // =========================================================================
  // Reset Between Calls
  // =========================================================================

  describe('Reset between calls', () => {
    test('event_source_url resets between processRequestFromContext calls', () => {
      const builder = new ParamBuilder();

      const dataObject1 = new PlainDataObject(
        'first.example.com',
        {},
        {},
        null,
        null,
        null,
        'https',
        '/first-page'
      );
      builder.processRequestFromContext(dataObject1);
      expect(builder.getEventSourceUrl()).toBe(
        'https://first.example.com/first-page' + NET_NEW_SUFFIX
      );

      const dataObject2 = new PlainDataObject(
        'second.example.com',
        {},
        {},
        null,
        null,
        null,
        'http',
        '/second-page'
      );
      builder.processRequestFromContext(dataObject2);
      expect(builder.getEventSourceUrl()).toBe(
        'http://second.example.com/second-page' + NET_NEW_SUFFIX
      );
    });

    test('event_source_url resets to null when second call has no host', () => {
      const builder = new ParamBuilder();

      const dataObject1 = new PlainDataObject(
        'example.com',
        {},
        {},
        null,
        null,
        null,
        'https',
        '/page'
      );
      builder.processRequestFromContext(dataObject1);
      expect(builder.getEventSourceUrl()).toBe(
        'https://example.com/page' + NET_NEW_SUFFIX
      );

      const dataObject2 = new PlainDataObject(
        null,
        {},
        {},
        null,
        null,
        null,
        null,
        null
      );
      builder.processRequestFromContext(dataObject2);
      expect(builder.getEventSourceUrl()).toBeNull();
    });

    test('event_source_url is null before any call', () => {
      const builder = new ParamBuilder();

      expect(builder.getEventSourceUrl()).toBeNull();
    });
  });

  // =========================================================================
  // Via Raw Request Objects
  // =========================================================================

  describe('Via raw request objects', () => {
    test('Express-style mock with protocol and originalUrl', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {
          host: 'express-app.com',
        },
        socket: {remoteAddress: '127.0.0.1'},
        protocol: 'https',
        originalUrl: '/dashboard?tab=overview',
        url: '/dashboard?tab=overview',
      };

      builder.processRequestFromContext(req);

      expect(builder.getEventSourceUrl()).toBe(
        'https://express-app.com/dashboard?tab=overview' + NET_NEW_SUFFIX
      );
    });

    test('native http mock with encrypted socket (https)', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {
          host: 'secure.example.com',
        },
        socket: {
          remoteAddress: '203.0.113.1',
          encrypted: true,
        },
        url: '/api/data?key=value',
      };

      builder.processRequestFromContext(req);

      expect(builder.getEventSourceUrl()).toBe(
        'https://secure.example.com/api/data?key=value' + NET_NEW_SUFFIX
      );
    });

    test('native http mock without encrypted socket (http)', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {
          host: 'plain.example.com',
        },
        socket: {remoteAddress: '10.0.0.1'},
        url: '/page',
      };

      builder.processRequestFromContext(req);

      expect(builder.getEventSourceUrl()).toBe(
        'http://plain.example.com/page' + NET_NEW_SUFFIX
      );
    });

    test('request with only host header produces URL with host', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {host: 'minimal.example.com'},
      };

      builder.processRequestFromContext(req);

      expect(builder.getEventSourceUrl()).toBe(
        'http://minimal.example.com' + NET_NEW_SUFFIX
      );
    });
  });

  // =========================================================================
  // Independence From referrer_url
  // =========================================================================

  describe('Independence from referrer_url', () => {
    test('event_source_url is set regardless of referer', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'landing.example.com',
        {},
        {},
        'https://facebook.com/ad?fbclid=IwAR_test',
        null,
        null,
        'https',
        '/landing'
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getEventSourceUrl()).toBe(
        'https://landing.example.com/landing' + NET_NEW_SUFFIX
      );
      expect(builder.getReferrerUrl()).toBe(
        'https://facebook.com/ad?fbclid=IwAR_test' + NO_CHANGE_SUFFIX
      );
    });

    test('event_source_url is set when referer is null', () => {
      const builder = new ParamBuilder();

      const dataObject = new PlainDataObject(
        'example.com',
        {},
        {},
        null,
        null,
        null,
        'https',
        '/page'
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getEventSourceUrl()).toBe(
        'https://example.com/page' + NET_NEW_SUFFIX
      );
      expect(builder.getReferrerUrl()).toBeNull();
    });

    test('referer does not influence event_source_url value', () => {
      const builder = new ParamBuilder();

      const dataObjectWithReferer = new PlainDataObject(
        'example.com',
        {},
        {},
        'https://other-site.com/page',
        null,
        null,
        'https',
        '/my-page'
      );

      builder.processRequestFromContext(dataObjectWithReferer);
      const urlWithReferer = builder.getEventSourceUrl();

      const dataObjectWithoutReferer = new PlainDataObject(
        'example.com',
        {},
        {},
        null,
        null,
        null,
        'https',
        '/my-page'
      );

      builder.processRequestFromContext(dataObjectWithoutReferer);
      const urlWithoutReferer = builder.getEventSourceUrl();

      expect(urlWithReferer).toBe(urlWithoutReferer);
      expect(urlWithReferer).toBe(
        'https://example.com/my-page' + NET_NEW_SUFFIX
      );
    });
  });
});
