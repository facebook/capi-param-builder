/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

class PlainDataObject {
  /**
   * @param {string} host
   * @param {Object.<string, string>} query_params
   * @param {Object.<string, string>} cookies
   * @param {?string} referer
   * @param {?string} x_forwarded_for
   * @param {?string} remote_address
   */
  constructor(
    host,
    query_params,
    cookies,
    referer,
    x_forwarded_for,
    remote_address
  ) {
    this.host = host;
    this.query_params = query_params;
    this.cookies = cookies;
    this.referer = referer;
    this.x_forwarded_for = x_forwarded_for;
    this.remote_address = remote_address;
  }
}

module.exports = PlainDataObject;
