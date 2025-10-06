/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { looksLikeHashed, trim } = require('./commonUtil');

function getNormalizedZipCode(zipCode) {
    let normalizedZipCode = null;

    if (zipCode != null && typeof zipCode === 'string') {
        if (looksLikeHashed(zipCode)) {
            normalizedZipCode = zipCode;
        } else {
            const maybeZIP = trim(String(zipCode).toLowerCase().split('-', 1)[0]);

            if (maybeZIP.length >= 2) {
                normalizedZipCode = maybeZIP;
            }
        }
    }

    return normalizedZipCode;
}

module.exports = { getNormalizedZipCode };
