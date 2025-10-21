/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Constants = require('../model/Constants');
const { getNormalizedEmail } = require('./emailUtil');
const { getNormalizedPhone } = require('./phoneUtil');
const { getNormalizedDOB } = require('./dobUtil');
const { getNormalizedGender } = require('./genderUtil');
const { getNormalizedZipCode } = require('./zipCodeUtil');
const { sha256_main } = require('./sha256_with_dependencies_new');
const {
    getNormalizedName,
    getNormalizedCity,
    getNormalizedState,
    getNormalizedCountry,
    getNormalizedExternalID
} = require('./stringUtil');
const { getAppendixInfo } = require('../utils/AppendixProvider');

const SHA_256_OR_MD5_REGEX = /^[A-Fa-f0-9]{64}$|^[A-Fa-f0-9]{32}$/;

function getNormalizedAndHashedPII(piiValue, dataType) {
    if (!piiValue || typeof piiValue !== 'string') {
        return null;
    }

    if (SHA_256_OR_MD5_REGEX.test(piiValue.trim())) {
        return piiValue.trim().toLowerCase() + '.' + getAppendixInfo(false);
    } else if (isAlreadyNormalizedAndHashedByParamBuilder(piiValue.trim())) {
        return piiValue.trim();
    } else {
        const normalizedPII = getNormalizedPII(piiValue, dataType);
        if (!normalizedPII) {
            return null;
        }
        return sha256_main(normalizedPII) + '.' + getAppendixInfo(true);
    }
}

function isAlreadyNormalizedAndHashedByParamBuilder(input) {
    // Find the position of the last dot
    const lastDot = input.lastIndexOf('.');
    if (lastDot !== -1) {
        const suffix = input.substring(lastDot + 1);
        if (Constants.SUPPORTED_PARAM_BUILDER_LANGUAGES_TOKEN.includes(suffix) || suffix.length === Constants.APPENDIX_LENGTH_V2) {
            return SHA_256_OR_MD5_REGEX.test(input.substring(0, lastDot));
        }
    }
    return false;
}

function getNormalizedPII(piiValue, dataType) {
    if (
        !piiValue ||
        !dataType ||
        typeof piiValue !== 'string' || typeof dataType !== 'string'
    ) {
        return null;
    }

    dataType = getNormalizedExternalID(dataType);
    if (!Object.values(Constants.PII_DATA_TYPE).includes(dataType)) {
        return null;
    }

    let normalizedPII = piiValue;
    if (dataType === Constants.PII_DATA_TYPE.EMAIL) {
        normalizedPII = getNormalizedEmail(piiValue);
    } else if (dataType === Constants.PII_DATA_TYPE.PHONE) {
        normalizedPII = getNormalizedPhone(piiValue);
    } else if (dataType === Constants.PII_DATA_TYPE.DATE_OF_BIRTH) {
        normalizedPII = getNormalizedDOB(piiValue);
    } else if (dataType === Constants.PII_DATA_TYPE.GENDER) {
        normalizedPII = getNormalizedGender(piiValue);
    } else if (
        dataType === Constants.PII_DATA_TYPE.FIRST_NAME ||
        dataType === Constants.PII_DATA_TYPE.LAST_NAME
    ) {
        normalizedPII = getNormalizedName(piiValue);
    } else if (dataType === Constants.PII_DATA_TYPE.CITY) {
        normalizedPII = getNormalizedCity(piiValue);
    } else if (dataType === Constants.PII_DATA_TYPE.STATE) {
        normalizedPII = getNormalizedState(piiValue);
    } else if (dataType === Constants.PII_DATA_TYPE.COUNTRY) {
        normalizedPII = getNormalizedCountry(piiValue);
    } else if (dataType === Constants.PII_DATA_TYPE.EXTERNAL_ID) {
        normalizedPII = getNormalizedExternalID(piiValue);
    } else if (dataType === Constants.PII_DATA_TYPE.ZIP_CODE) {
        normalizedPII = getNormalizedZipCode(piiValue);
    }

    return normalizedPII;
}

module.exports = {
    getNormalizedPII,
    getNormalizedAndHashedPII
};
