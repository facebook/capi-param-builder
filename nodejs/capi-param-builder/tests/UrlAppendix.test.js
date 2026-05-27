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

jest.mock('../package.json', () => ({version: '1.0.0'}));

// Computed after the package.json mock so the suffix reflects v1.0.0.
const NO_CHANGE_SUFFIX = `.${getAppendixInfo(Constants.APPENDIX_NO_CHANGE)}`;
const NET_NEW_SUFFIX = `.${getAppendixInfo(Constants.APPENDIX_NET_NEW)}`;

/**
 * Covers the appendix-appending transformation applied to:
 *   - referrerUrl    (suffix: '.' + getAppendixInfo(APPENDIX_NO_CHANGE))
 *   - eventSourceUrl (suffix: '.' + getAppendixInfo(APPENDIX_NET_NEW))
 *
 * The appendix string is dynamic (derived from SDK version), so we compute the
 * expected suffix via AppendixProvider rather than hard-coding it.
 */
describe('ParamBuilder URL appendix transformation', () => {

  // =========================================================================
  // referrerUrl: appends APPENDIX_NO_CHANGE
  // =========================================================================

  describe('referrerUrl gets NO_CHANGE appendix', () => {
    test('via processRequest with simple URL', () => {
      const builder = new ParamBuilder();
      const referer = 'https://facebook.com/ad';
      builder.processRequest('example.com', {}, {}, referer);
      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });

    test('via processRequestFromContext', () => {
      const builder = new ParamBuilder();
      const referer = 'https://google.com/search?q=shoes';
      const data = new PlainDataObject(
        'shop.example.com', {}, {}, referer, null, null
      );
      builder.processRequestFromContext(data);
      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });

    test('with complex URL (query + fragment)', () => {
      const builder = new ParamBuilder();
      const referer = 'https://app.example.com/search?q=test&page=3#results';
      builder.processRequest('example.com', {}, {}, referer);
      expect(builder.getReferrerUrl()).toBe(referer + NO_CHANGE_SUFFIX);
    });
  });

  // =========================================================================
  // referrerUrl: skips appendix for null / empty / undefined
  // =========================================================================

  describe('referrerUrl skips appendix on null / empty', () => {
    test('null referer stays null', () => {
      const builder = new ParamBuilder();
      builder.processRequest('example.com', {}, {}, null);
      expect(builder.getReferrerUrl()).toBeNull();
    });

    test('undefined referer (default param) stays null', () => {
      const builder = new ParamBuilder();
      builder.processRequest('example.com', {}, {});
      expect(builder.getReferrerUrl()).toBeNull();
    });

    test('empty string referer stays empty (no appendix appended)', () => {
      const builder = new ParamBuilder();
      builder.processRequest('example.com', {}, {}, '');
      expect(builder.getReferrerUrl()).toBe('');
    });

    test('null referer via PlainDataObject stays null', () => {
      const builder = new ParamBuilder();
      const data = new PlainDataObject(
        'example.com', {}, {}, null, null, null
      );
      builder.processRequestFromContext(data);
      expect(builder.getReferrerUrl()).toBeNull();
    });
  });

  // =========================================================================
  // referrerUrl: idempotency — consecutive calls do not double-append
  //
  // Each processRequest() begins with `this.referrerUrl = referer;`
  // (reassignment, not concatenation), so the appendix is applied at most
  // once per call regardless of prior state.
  // =========================================================================

  describe('referrerUrl idempotency', () => {
    test('consecutive calls with the same input do not double-append', () => {
      const builder = new ParamBuilder();
      const referer = 'https://example.com/page';

      builder.processRequest('example.com', {}, {}, referer);
      const first = builder.getReferrerUrl();

      builder.processRequest('example.com', {}, {}, referer);
      const second = builder.getReferrerUrl();

      expect(first).toBe(second);
      expect(second).toBe(referer + NO_CHANGE_SUFFIX);
      // The appendix is not concatenated twice.
      const count = second.split(NO_CHANGE_SUFFIX).length - 1;
      expect(count).toBe(1);
    });

    test('value changes between calls', () => {
      const builder = new ParamBuilder();

      builder.processRequest('example.com', {}, {}, 'https://first.com');
      expect(builder.getReferrerUrl()).toBe(
        'https://first.com' + NO_CHANGE_SUFFIX
      );

      builder.processRequest('example.com', {}, {}, 'https://second.com');
      expect(builder.getReferrerUrl()).toBe(
        'https://second.com' + NO_CHANGE_SUFFIX
      );
    });

    test('cleared then set across calls', () => {
      const builder = new ParamBuilder();

      builder.processRequest('example.com', {}, {}, 'https://first.com');
      expect(builder.getReferrerUrl()).toBe(
        'https://first.com' + NO_CHANGE_SUFFIX
      );

      builder.processRequest('example.com', {}, {}, null);
      expect(builder.getReferrerUrl()).toBeNull();

      builder.processRequest('example.com', {}, {}, 'https://third.com');
      expect(builder.getReferrerUrl()).toBe(
        'https://third.com' + NO_CHANGE_SUFFIX
      );
    });
  });

  // =========================================================================
  // eventSourceUrl: appends APPENDIX_NET_NEW
  // =========================================================================

  describe('eventSourceUrl gets NET_NEW appendix', () => {
    test('with path', () => {
      const builder = new ParamBuilder();
      const data = new PlainDataObject(
        'shop.example.com', {}, {}, null, null, null, 'https', '/products'
      );
      builder.processRequestFromContext(data);
      expect(builder.getEventSourceUrl()).toBe(
        'https://shop.example.com/products' + NET_NEW_SUFFIX
      );
    });

    test('with query and fragment (appendix sits after the fragment)', () => {
      const builder = new ParamBuilder();
      const data = new PlainDataObject(
        'www.myshop.com', {}, {}, null, null, null, 'https',
        '/landing?utm=fb&campaign=summer#section'
      );
      builder.processRequestFromContext(data);
      expect(builder.getEventSourceUrl()).toBe(
        'https://www.myshop.com/landing?utm=fb&campaign=summer#section' + NET_NEW_SUFFIX
      );
    });

    test('with empty request_uri (host only)', () => {
      const builder = new ParamBuilder();
      const data = new PlainDataObject(
        'example.com', {}, {}, null, null, null, 'http', null
      );
      builder.processRequestFromContext(data);
      expect(builder.getEventSourceUrl()).toBe(
        'http://example.com' + NET_NEW_SUFFIX
      );
    });
  });

  // =========================================================================
  // eventSourceUrl: skips appendix when _constructEventSourceUrl returns null
  // =========================================================================

  describe('eventSourceUrl is null when host or scheme missing', () => {
    test('null when host empty', () => {
      const builder = new ParamBuilder();
      const data = new PlainDataObject(
        '', {}, {}, null, null, null, 'https', '/products'
      );
      builder.processRequestFromContext(data);
      expect(builder.getEventSourceUrl()).toBeNull();
    });

    test('null when scheme null', () => {
      const builder = new ParamBuilder();
      const data = new PlainDataObject(
        'example.com', {}, {}, null, null, null, null, '/products'
      );
      builder.processRequestFromContext(data);
      expect(builder.getEventSourceUrl()).toBeNull();
    });

    test('null when scheme empty string', () => {
      const builder = new ParamBuilder();
      const data = new PlainDataObject(
        'example.com', {}, {}, null, null, null, '', '/products'
      );
      builder.processRequestFromContext(data);
      expect(builder.getEventSourceUrl()).toBeNull();
    });

    test('null when processRequest used directly (no constructEventSourceUrl call)', () => {
      const builder = new ParamBuilder();
      builder.processRequest('example.com', {}, {}, 'https://r.com');
      expect(builder.getEventSourceUrl()).toBeNull();
    });
  });

  // =========================================================================
  // eventSourceUrl idempotency
  //
  // processRequest() resets eventSourceUrl = null before delegating, and
  // _constructEventSourceUrl returns a freshly-built string each call, so
  // the appendix is applied at most once per call.
  // =========================================================================

  describe('eventSourceUrl idempotency', () => {
    test('consecutive calls with same input do not double-append', () => {
      const builder = new ParamBuilder();
      const data = new PlainDataObject(
        'shop.example.com', {}, {}, null, null, null, 'https', '/products'
      );

      builder.processRequestFromContext(data);
      const first = builder.getEventSourceUrl();

      builder.processRequestFromContext(data);
      const second = builder.getEventSourceUrl();

      expect(first).toBe(second);
      expect(second).toBe(
        'https://shop.example.com/products' + NET_NEW_SUFFIX
      );
      const count = second.split(NET_NEW_SUFFIX).length - 1;
      expect(count).toBe(1);
    });

    test('cleared then set across calls', () => {
      const builder = new ParamBuilder();

      const data1 = new PlainDataObject(
        'shop.example.com', {}, {}, null, null, null, 'https', '/products'
      );
      builder.processRequestFromContext(data1);
      expect(builder.getEventSourceUrl()).toBe(
        'https://shop.example.com/products' + NET_NEW_SUFFIX
      );

      const data2 = new PlainDataObject(
        'shop.example.com', {}, {}, null, null, null, null, '/products'
      );
      builder.processRequestFromContext(data2);
      expect(builder.getEventSourceUrl()).toBeNull();
    });
  });

  // =========================================================================
  // Cross-field: referrer and eventSource use different appendix tokens
  // =========================================================================

  describe('cross-field appendix tokens differ', () => {
    test('referrerUrl uses NO_CHANGE, eventSourceUrl uses NET_NEW', () => {
      const builder = new ParamBuilder();
      const data = new PlainDataObject(
        'shop.example.com', {}, {},
        'https://facebook.com/ad', null, null,
        'https', '/checkout'
      );
      builder.processRequestFromContext(data);

      expect(builder.getReferrerUrl()).toBe(
        'https://facebook.com/ad' + NO_CHANGE_SUFFIX
      );
      expect(builder.getEventSourceUrl()).toBe(
        'https://shop.example.com/checkout' + NET_NEW_SUFFIX
      );
      // Sanity: the two suffixes differ because the appendix type byte differs.
      expect(NO_CHANGE_SUFFIX).not.toBe(NET_NEW_SUFFIX);
    });
  });

  // =========================================================================
  // Documentation tests: feeding output back as input DOUBLE-APPENDS.
  //
  // The SDK has no dedup logic. These tests lock in the current behavior so a
  // future refactor that adds dedup will trigger an explicit decision.
  // =========================================================================

  describe('feeding output back as input double-appends (no dedup)', () => {
    test('referrer: feeding getReferrerUrl() back as referer doubles the suffix', () => {
      const builder = new ParamBuilder();
      const referer = 'https://example.com/page';

      builder.processRequest('example.com', {}, {}, referer);
      const first = builder.getReferrerUrl();
      expect(first).toBe(referer + NO_CHANGE_SUFFIX);

      builder.processRequest('example.com', {}, {}, first);
      const second = builder.getReferrerUrl();

      expect(second).toBe(referer + NO_CHANGE_SUFFIX + NO_CHANGE_SUFFIX);
      const count = second.split(NO_CHANGE_SUFFIX).length - 1;
      expect(count).toBe(2);
    });

    test('event source: feeding suffixed request_uri back doubles the suffix', () => {
      const builder = new ParamBuilder();
      const data = new PlainDataObject(
        'shop.example.com', {}, {}, null, null, null, 'https', '/products'
      );
      builder.processRequestFromContext(data);
      const first = builder.getEventSourceUrl();
      expect(first).toBe(
        'https://shop.example.com/products' + NET_NEW_SUFFIX
      );

      // Construct a contaminated PlainDataObject whose request_uri already
      // contains the suffix appended to the path.
      const contaminated = new PlainDataObject(
        'shop.example.com', {}, {}, null, null, null,
        'https', '/products' + NET_NEW_SUFFIX
      );
      builder.processRequestFromContext(contaminated);
      const second = builder.getEventSourceUrl();

      expect(second).toBe(
        'https://shop.example.com/products' + NET_NEW_SUFFIX + NET_NEW_SUFFIX
      );
      const count = second.split(NET_NEW_SUFFIX).length - 1;
      expect(count).toBe(2);
    });
  });
});
