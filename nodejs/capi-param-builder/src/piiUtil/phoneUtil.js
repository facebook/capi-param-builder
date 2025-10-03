/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { looksLikeHashed } = require('./commonUtil');

const PHONE_IGNORE_CHAR_SET_IMPROVED = /[^0-9]/giu;
const PHONE_DROP_PREFIX_ZEROS = /^0*/;

function getNormalizedPhone(phone) {
    if (phone == null || phone === undefined) {
        return null;
    }
    if (looksLikeHashed(phone)) {
        return phone;
    }
    return String(phone)
        .replace(PHONE_IGNORE_CHAR_SET_IMPROVED, '')
        .replace(PHONE_DROP_PREFIX_ZEROS, '');
}

module.exports = { getNormalizedPhone };
