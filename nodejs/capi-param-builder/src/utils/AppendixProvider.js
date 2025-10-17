/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { version } = require('../../package.json');
const { LANGUAGE_TOKEN , LANGUAGE_TOKEN_INDEX , DEFAULT_FORMAT } = require('../model/Constants');

function getAppendixInfo(is_new) {
    try {
      // Validate version format: must be exactly 3 numeric parts separated by dots
      if (!/^\d+(\.\d+){2}$/.test(version)) {
        return LANGUAGE_TOKEN;
      }

      const [major, minor, patch] = version.split('.').map(Number);

      // Validate byte range (0-255) - regex doesn't check this
      if (major > 255 || minor > 255 || patch > 255) {
        return LANGUAGE_TOKEN;
      }

      const is_new_byte = is_new === true ? 0x01 : 0x00;
      const bytes = [DEFAULT_FORMAT, LANGUAGE_TOKEN_INDEX, is_new_byte, major, minor, patch];
      const buf = Buffer.from(bytes);
      const base64urlSafe = buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return base64urlSafe;
    } catch (error) {
      console.error("Exception when parsing appendix version number:" + error);
      return LANGUAGE_TOKEN;
    }
  }

  module.exports = {
    getAppendixInfo
};
