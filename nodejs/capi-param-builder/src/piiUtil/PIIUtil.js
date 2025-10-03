/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Constants = require('../model/Constants');

function getNormalizedPII(piiValue, dataType) {
    if (
        !piiValue ||
        !dataType ||
        typeof piiValue !== 'string' ||
        !Object.values(Constants.PII_DATA_TYPE).includes(dataType)
    ) {
        return null;
    }
    let normalizedPII = piiValue;

    return normalizedPII;
}

module.exports = {
    getNormalizedPII,
};
