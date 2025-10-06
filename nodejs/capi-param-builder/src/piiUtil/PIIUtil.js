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
const {
    getNormalizedName,
    getNormalizedCity,
    getNormalizedState,
    getNormalizedCountry,
    getNormalizedExternalID
} = require('./stringUtil');

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
};
