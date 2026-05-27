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

// Computed once after the package.json mock so the suffix reflects v1.0.0.
const NO_CHANGE_SUFFIX = `.${getAppendixInfo(Constants.APPENDIX_NO_CHANGE)}`;
const NET_NEW_SUFFIX = `.${getAppendixInfo(Constants.APPENDIX_NET_NEW)}`;

describe('ParamBuilder.getReferrerUrl', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => DUMMY_TIMESTAMP);
    jest.spyOn(Math, 'random').mockImplementation(() => 1);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // =========================================================================
  // Referrer Preserved Before fbclid Extraction
  // =========================================================================

  describe('Referrer preserved before fbclid extraction', () => {
    test('full referrer URL with fbclid is preserved as-is', () => {
      const builder = new ParamBuilder();
      const referer = 'https://facebook.com/ad?fbclid=IwAR_test123&utm=campaign';

      builder.processRequest('example.com', {}, {}, referer);

      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });

    test('referrer with fbclid in query is not stripped or modified', () => {
      const builder = new ParamBuilder();
      const referer = 'https://landing.page.com/path?fbclid=abc123&other=value';

      builder.processRequest('example.com', null, null, referer);

      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
      expect(builder.getReferrerUrl()).toContain('fbclid=abc123');
    });

    test('referrer without protocol and with fbclid is preserved', () => {
      const builder = new ParamBuilder();
      const referer = 'example.com?fbclid=noProtocol';

      builder.processRequest('[::1]:8080', null, undefined, referer);

      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });
  });

  // =========================================================================
  // getReferrerUrl Returns Null When No Referer
  // =========================================================================

  describe('getReferrerUrl returns null when no referer', () => {
    test('returns null when referer is not provided (default)', () => {
      const builder = new ParamBuilder();

      builder.processRequest('example.com', {fbclid: 'test'}, {});

      expect(builder.getReferrerUrl()).toBeNull();
    });

    test('returns null when referer is explicitly null', () => {
      const builder = new ParamBuilder();

      builder.processRequest('example.com', {}, {}, null);

      expect(builder.getReferrerUrl()).toBeNull();
    });

    test('returns null before any processRequest call', () => {
      const builder = new ParamBuilder();

      expect(builder.getReferrerUrl()).toBeNull();
    });
  });

  // =========================================================================
  // getReferrerUrl via processRequest with All Params
  // =========================================================================

  describe('getReferrerUrl via processRequest with all params', () => {
    test('referrer is stored when all params provided', () => {
      const builder = new ParamBuilder();
      const referer = 'https://facebook.com/ad';

      builder.processRequest(
        'shop.example.com',
        {fbclid: 'click123'},
        {_fbp: 'fb.1.123.456'},
        referer,
        '203.0.113.50',
        '10.0.0.1'
      );

      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });

    test('referrer stored even when fbclid comes from query not referer', () => {
      const builder = new ParamBuilder();
      const referer = 'https://google.com/search?q=test';

      builder.processRequest(
        'example.com',
        {fbclid: 'fromQuery'},
        {},
        referer
      );

      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
      expect(builder.getFbc()).toMatch(/\.fromQuery\./);
    });
  });

  // =========================================================================
  // getReferrerUrl via processRequestFromContext
  // =========================================================================

  describe('getReferrerUrl via processRequestFromContext', () => {
    test('with PlainDataObject containing referer', () => {
      const builder = new ParamBuilder();
      const referer = 'https://facebook.com/ad?fbclid=IwAR_pdo';

      const dataObject = new PlainDataObject(
        'example.com',
        {fbclid: 'test'},
        {},
        referer,
        null,
        null
      );

      builder.processRequestFromContext(dataObject);

      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });

    test('with PlainDataObject without referer', () => {
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

      expect(builder.getReferrerUrl()).toBeNull();
    });

    test('with raw request object containing referer header', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {
          host: 'landing.example.com',
          referer: 'https://facebook.com/ad?fbclid=IwAR_raw',
        },
        socket: {remoteAddress: '203.0.113.1'},
        url: '/landing',
      };

      builder.processRequestFromContext(req);

      expect(builder.getReferrerUrl()).toBe(
        'https://facebook.com/ad?fbclid=IwAR_raw' + NO_CHANGE_SUFFIX
      );
    });

    test('with raw request object without referer header', () => {
      const builder = new ParamBuilder();

      const req = {
        headers: {host: 'example.com'},
        url: '/?fbclid=test',
      };

      builder.processRequestFromContext(req);

      expect(builder.getReferrerUrl()).toBeNull();
    });
  });

  // =========================================================================
  // Reset Between Consecutive Calls
  // =========================================================================

  describe('Reset between consecutive calls', () => {
    test('referrer resets on each processRequest call', () => {
      const builder = new ParamBuilder();

      builder.processRequest(
        'first.example.com',
        {},
        {},
        'https://first-referer.com'
      );
      expect(builder.getReferrerUrl()).toBe(
        'https://first-referer.com' + NO_CHANGE_SUFFIX
      );

      builder.processRequest(
        'second.example.com',
        {},
        {},
        'https://second-referer.com'
      );
      expect(builder.getReferrerUrl()).toBe(
        'https://second-referer.com' + NO_CHANGE_SUFFIX
      );
    });

    test('referrer resets to null when second call has no referer', () => {
      const builder = new ParamBuilder();

      builder.processRequest(
        'example.com',
        {},
        {},
        'https://has-referer.com'
      );
      expect(builder.getReferrerUrl()).toBe(
        'https://has-referer.com' + NO_CHANGE_SUFFIX
      );

      builder.processRequest('example.com', {}, {});
      expect(builder.getReferrerUrl()).toBeNull();
    });

    test('referrer resets between processRequestFromContext calls', () => {
      const builder = new ParamBuilder();

      const dataObject1 = new PlainDataObject(
        'first.example.com',
        {},
        {},
        'https://first.com/page',
        null,
        null
      );
      builder.processRequestFromContext(dataObject1);
      expect(builder.getReferrerUrl()).toBe(
        'https://first.com/page' + NO_CHANGE_SUFFIX
      );

      const dataObject2 = new PlainDataObject(
        'second.example.com',
        {},
        {},
        'https://second.com/page',
        null,
        null
      );
      builder.processRequestFromContext(dataObject2);
      expect(builder.getReferrerUrl()).toBe(
        'https://second.com/page' + NO_CHANGE_SUFFIX
      );
    });
  });

  // =========================================================================
  // Null vs Empty String
  // =========================================================================

  describe('Null vs empty string', () => {
    test('null referer returns null', () => {
      const builder = new ParamBuilder();

      builder.processRequest('example.com', {}, {}, null);

      expect(builder.getReferrerUrl()).toBeNull();
    });

    test('undefined referer (default param) returns null', () => {
      const builder = new ParamBuilder();

      builder.processRequest('example.com', {}, {});

      expect(builder.getReferrerUrl()).toBeNull();
    });

    test('empty string referer returns empty string', () => {
      const builder = new ParamBuilder();

      builder.processRequest('example.com', {}, {}, '');

      expect(builder.getReferrerUrl()).toBe('');
    });
  });

  // =========================================================================
  // Various URL Formats
  // =========================================================================

  describe('Various URL formats', () => {
    test('HTTP URL', () => {
      const builder = new ParamBuilder();
      const referer = 'http://example.com/page';

      builder.processRequest('landing.com', {}, {}, referer);

      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });

    test('HTTPS URL', () => {
      const builder = new ParamBuilder();
      const referer = 'https://secure.example.com/page';

      builder.processRequest('landing.com', {}, {}, referer);

      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });

    test('URL with query parameters', () => {
      const builder = new ParamBuilder();
      const referer = 'https://example.com/search?q=test&lang=en';

      builder.processRequest('landing.com', {}, {}, referer);

      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });

    test('URL with fragment', () => {
      const builder = new ParamBuilder();
      const referer = 'https://example.com/page#section-2';

      builder.processRequest('landing.com', {}, {}, referer);

      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });

    test('URL with query and fragment', () => {
      const builder = new ParamBuilder();
      const referer = 'https://example.com/page?key=value#anchor';

      builder.processRequest('landing.com', {}, {}, referer);

      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });

    test('URL with port', () => {
      const builder = new ParamBuilder();
      const referer = 'https://example.com:8443/path';

      builder.processRequest('landing.com', {}, {}, referer);

      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });

    test('URL without protocol (bare hostname)', () => {
      const builder = new ParamBuilder();
      const referer = 'example.com/path?query=1';

      builder.processRequest('landing.com', {}, {}, referer);

      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });
  });
});
