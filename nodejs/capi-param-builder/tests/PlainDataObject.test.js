/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const PlainDataObject = require('../src/model/PlainDataObject');

describe('PlainDataObject', () => {
  const DEFAULT_HOST = 'example.com';
  const DEFAULT_QUERY_PARAMS = {fbclid: 'test123'};
  const DEFAULT_COOKIES = {_fbp: 'fb.1.123.456'};
  const DEFAULT_REFERER = 'https://facebook.com/ad';
  const DEFAULT_X_FORWARDED_FOR = '203.0.113.50';
  const DEFAULT_REMOTE_ADDRESS = '10.0.0.1';

  // ===========================================================================
  // Backward Compatibility — 6-param Construction
  // ===========================================================================

  describe('Backward compatibility with 6-param construction', () => {
    test('scheme defaults to null when only 6 params provided', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        DEFAULT_REFERER,
        DEFAULT_X_FORWARDED_FOR,
        DEFAULT_REMOTE_ADDRESS,
      );

      expect(pdo.scheme).toBeNull();
    });

    test('request_uri defaults to null when only 6 params provided', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        DEFAULT_REFERER,
        DEFAULT_X_FORWARDED_FOR,
        DEFAULT_REMOTE_ADDRESS,
      );

      expect(pdo.request_uri).toBeNull();
    });

    test('all 6 original fields are set correctly', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        DEFAULT_REFERER,
        DEFAULT_X_FORWARDED_FOR,
        DEFAULT_REMOTE_ADDRESS,
      );

      expect(pdo.host).toBe(DEFAULT_HOST);
      expect(pdo.query_params).toBe(DEFAULT_QUERY_PARAMS);
      expect(pdo.cookies).toBe(DEFAULT_COOKIES);
      expect(pdo.referer).toBe(DEFAULT_REFERER);
      expect(pdo.x_forwarded_for).toBe(DEFAULT_X_FORWARDED_FOR);
      expect(pdo.remote_address).toBe(DEFAULT_REMOTE_ADDRESS);
    });

    test('nullable original fields accept null', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        null,
        null,
        null,
      );

      expect(pdo.host).toBe(DEFAULT_HOST);
      expect(pdo.query_params).toBe(DEFAULT_QUERY_PARAMS);
      expect(pdo.cookies).toBe(DEFAULT_COOKIES);
      expect(pdo.referer).toBeNull();
      expect(pdo.x_forwarded_for).toBeNull();
      expect(pdo.remote_address).toBeNull();
      expect(pdo.scheme).toBeNull();
      expect(pdo.request_uri).toBeNull();
    });
  });

  // ===========================================================================
  // Scheme Field
  // ===========================================================================

  describe('scheme field', () => {
    test('accepts https', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        null,
        null,
        null,
        'https',
      );

      expect(pdo.scheme).toBe('https');
    });

    test('accepts http', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        null,
        null,
        null,
        'http',
      );

      expect(pdo.scheme).toBe('http');
    });

    test('accepts explicit null', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        null,
        null,
        null,
        null,
      );

      expect(pdo.scheme).toBeNull();
    });

    test('original fields unchanged when scheme is set', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        DEFAULT_REFERER,
        DEFAULT_X_FORWARDED_FOR,
        DEFAULT_REMOTE_ADDRESS,
        'https',
      );

      expect(pdo.host).toBe(DEFAULT_HOST);
      expect(pdo.query_params).toBe(DEFAULT_QUERY_PARAMS);
      expect(pdo.cookies).toBe(DEFAULT_COOKIES);
      expect(pdo.referer).toBe(DEFAULT_REFERER);
      expect(pdo.x_forwarded_for).toBe(DEFAULT_X_FORWARDED_FOR);
      expect(pdo.remote_address).toBe(DEFAULT_REMOTE_ADDRESS);
    });
  });

  // ===========================================================================
  // Request URI Field
  // ===========================================================================

  describe('request_uri field', () => {
    test('accepts a simple path', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        null,
        null,
        null,
        null,
        '/products/shoes',
      );

      expect(pdo.request_uri).toBe('/products/shoes');
    });

    test('accepts a path with query string', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        null,
        null,
        null,
        null,
        '/search?q=test&page=2',
      );

      expect(pdo.request_uri).toBe('/search?q=test&page=2');
    });

    test('accepts a path with special characters', () => {
      const uri = '/path/to/resource?key=val%20ue&other=a+b&special=%26%3D';
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        null,
        null,
        null,
        null,
        uri,
      );

      expect(pdo.request_uri).toBe(uri);
    });

    test('empty string is distinct from null', () => {
      const pdoEmpty = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        null,
        null,
        null,
        null,
        '',
      );

      const pdoNull = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        null,
        null,
        null,
        null,
        null,
      );

      expect(pdoEmpty.request_uri).toBe('');
      expect(pdoNull.request_uri).toBeNull();
      expect(pdoEmpty.request_uri).not.toEqual(pdoNull.request_uri);
    });

    test('accepts explicit null', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        null,
        null,
        null,
        null,
        null,
      );

      expect(pdo.request_uri).toBeNull();
    });

    test('original fields unchanged when request_uri is set', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        DEFAULT_REFERER,
        DEFAULT_X_FORWARDED_FOR,
        DEFAULT_REMOTE_ADDRESS,
        null,
        '/some/path',
      );

      expect(pdo.host).toBe(DEFAULT_HOST);
      expect(pdo.query_params).toBe(DEFAULT_QUERY_PARAMS);
      expect(pdo.cookies).toBe(DEFAULT_COOKIES);
      expect(pdo.referer).toBe(DEFAULT_REFERER);
      expect(pdo.x_forwarded_for).toBe(DEFAULT_X_FORWARDED_FOR);
      expect(pdo.remote_address).toBe(DEFAULT_REMOTE_ADDRESS);
    });
  });

  // ===========================================================================
  // Full 8-param Construction
  // ===========================================================================

  describe('Full 8-param construction', () => {
    test('all fields set correctly with both new params', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        DEFAULT_REFERER,
        DEFAULT_X_FORWARDED_FOR,
        DEFAULT_REMOTE_ADDRESS,
        'https',
        '/checkout?step=1',
      );

      expect(pdo.host).toBe(DEFAULT_HOST);
      expect(pdo.query_params).toBe(DEFAULT_QUERY_PARAMS);
      expect(pdo.cookies).toBe(DEFAULT_COOKIES);
      expect(pdo.referer).toBe(DEFAULT_REFERER);
      expect(pdo.x_forwarded_for).toBe(DEFAULT_X_FORWARDED_FOR);
      expect(pdo.remote_address).toBe(DEFAULT_REMOTE_ADDRESS);
      expect(pdo.scheme).toBe('https');
      expect(pdo.request_uri).toBe('/checkout?step=1');
    });

    test('scheme set without request_uri leaves request_uri null', () => {
      const pdo = new PlainDataObject(
        DEFAULT_HOST,
        DEFAULT_QUERY_PARAMS,
        DEFAULT_COOKIES,
        null,
        null,
        null,
        'https',
      );

      expect(pdo.scheme).toBe('https');
      expect(pdo.request_uri).toBeNull();
    });
  });
});
