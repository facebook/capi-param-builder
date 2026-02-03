/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const PlainDataObject = require('../model/PlainDataObject');

/**
 * Helper: Safe Splitter for parsing cookie strings
 * @param {string} str - The string to parse
 * @param {string} delimiter - The delimiter to split on
 * @returns {Object.<string, string>} - The parsed key-value pairs
 */
function strToMap(str, delimiter) {
  try {
    return str.split(delimiter)
      .map(v => v.split('='))
      .reduce((acc, v) => {
        if (v.length === 2) {
          acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
        }
        return acc;
      }, {});
  } catch (e) {
    return {};
  }
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

    if (!req) {
      return new PlainDataObject(
        host,
        query_params,
        cookies,
        referer,
        x_forwarded_for,
        remote_address
      );
    }

    try {
      // 2. Drill down to native request safely (Unwraps Wrappers)
      const request = req.req || req.raw || req;
      const headers = request.headers || {};

      // Host
      host = headers['host'] || '';

      // Referer & XFF
      referer = headers['referer'] || headers['referrer'] || null;
      x_forwarded_for = headers['x-forwarded-for'] || null;

      // Remote Address (Socket check)
      if (request.socket && request.socket.remoteAddress) {
        remote_address = request.socket.remoteAddress;
      }

      // Query Params (Try framework first, then fallback to manual)
      if (req.query && typeof req.query === 'object') {
        query_params = req.query;
      } else if (request.url) {
        // Fallback: Manually parse using our safe helper
        query_params = parseQueryString(request.url);
      }

      // Cookies (Try framework first, then fallback to manual)
      if (req.cookies && typeof req.cookies === 'object') {
        cookies = req.cookies;
      } else if (headers['cookie']) {
        cookies = strToMap(headers['cookie'], ';');
      }

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
      remote_address
    );
  }
}

module.exports = RequestContextAdaptor;
