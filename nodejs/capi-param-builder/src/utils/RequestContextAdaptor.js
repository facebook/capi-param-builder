/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const PlainDataObject = require('../model/PlainDataObject');

/**
 * Helper: Safe Splitter for parsing cookie strings.
 *
 * Splits each pair on the FIRST `=` only, so values containing literal `=`
 * (e.g. base64 padding in `_fbc=fb.1.123.YWJjZA==`) are preserved intact.
 * Decode failures are isolated per pair so one malformed `%XX` does not
 * drop every cookie.
 *
 * @param {string} str - The string to parse
 * @param {string} delimiter - The delimiter to split on
 * @returns {Object.<string, string>} - The parsed key-value pairs
 */
function strToMap(str, delimiter) {
  const acc = {};
  for (const pair of str.split(delimiter)) {
    const eq = pair.indexOf('=');
    if (eq <= 0) {
      // Skip malformed pairs (no `=`) and pairs with empty key.
      continue;
    }
    const rawKey = pair.substring(0, eq).trim();
    const rawVal = pair.substring(eq + 1).trim();
    try {
      acc[decodeURIComponent(rawKey)] = decodeURIComponent(rawVal);
    } catch (e) {
      // Per-pair isolation: skip only the malformed pair, keep the rest.
    }
  }
  return acc;
}

/**
 * Helper: Parse query parameters safely from a URL path.
 * Uses a dummy base to handle relative URLs without needing the real Host header.
 * @param {string} path - The URL path (e.g., "/page?id=123")
 * @returns {Object.<string, string>}
 */
function parseQueryString(path) {
  try {
    // We use a dummy base ('http://n') because the URL constructor requires one
    // for relative paths. We only care about searchParams, so the base is irrelevant.
    const urlObj = new URL(path, 'http://n');
    return Object.fromEntries(urlObj.searchParams);
  } catch (e) {
    return {};
  }
}

/**
 * Universal Request Context Adaptor for Node.js
 * Extracts request data from various Node.js HTTP request objects.
 */
class RequestContextAdaptor {
  /**
   * Extracts request data from a Node.js HTTP request object.
   * Supports native http.IncomingMessage and common framework wrappers (Express, Fastify, etc.)
   *
   * @param {Object|null} req - The HTTP request object
   * @returns {PlainDataObject} - The extracted request data
   */
  static extract(req = null) {
    // 1. Initialize Defaults (matching PlainDataObject types)
    let host = '';
    let query_params = {};
    let cookies = {};
    let referer = null;
    let x_forwarded_for = null;
    let remote_address = null;
    let scheme = null;
    let request_uri = null;

    if (!req) {
      return new PlainDataObject(
        host,
        query_params,
        cookies,
        referer,
        x_forwarded_for,
        remote_address,
        scheme,
        request_uri
      );
    }

    try {
      // 2. Drill down to native request safely (Unwraps Wrappers)
      const request = req.req || req.raw || req;
      const headers = request.headers || {};

      // Host. HTTP/2 requests may only provide `:authority` (Node's http2
      // server does not synthesize a `host` header), so fall back to it.
      host = headers['host'] || headers[':authority'] || '';

      // Referer & XFF
      referer = headers['referer'] || headers['referrer'] || null;
      x_forwarded_for = headers['x-forwarded-for'] || null;

      // Remote Address (Socket check)
      if (request.socket && request.socket.remoteAddress) {
        remote_address = request.socket.remoteAddress;
      }

      // Query Params (Try framework first, then fallback to manual).
      // Reject arrays explicitly: `typeof [] === 'object'` is true in JS
      // and an array would silently get stored as the query bag, breaking
      // downstream `queries[paramName]` lookups.
      if (req.query && typeof req.query === 'object' && !Array.isArray(req.query)) {
        query_params = req.query;
      } else if (request.url) {
        // Fallback: Manually parse using our safe helper
        query_params = parseQueryString(request.url);
      }

      // Cookies (Try framework first, then fallback to manual). Same
      // array-rejection rationale as above.
      if (req.cookies && typeof req.cookies === 'object' && !Array.isArray(req.cookies)) {
        cookies = req.cookies;
      } else if (headers['cookie']) {
        cookies = strToMap(headers['cookie'], ';');
      }

      // Scheme
      if (req.protocol) {
        scheme = req.protocol;
      } else {
        scheme = (request.socket && request.socket.encrypted) ? 'https' : 'http';
      }

      // Request URI
      request_uri = req.originalUrl || request.url || null;

    } catch (e) {
      // Silently ignore exceptions and return the object with default values
    }

    // 3. Return the Data Object
    return new PlainDataObject(
      host,
      query_params,
      cookies,
      referer,
      x_forwarded_for,
      remote_address,
      scheme,
      request_uri
    );
  }
}

module.exports = RequestContextAdaptor;
