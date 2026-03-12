/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  PII_DATA_TYPE,
  VALID_PARAM_BUILDER_TOKENS,
  APPENDIX_LENGTH_V2,
  APPENDIX_NO_CHANGE,
  APPENDIX_NET_NEW,
} from '../../model/constants.js';
import { getNormalizedEmail } from './emailUtil.js';
import { getNormalizedPhone } from './phoneUtil.js';
import { getNormalizedDOB } from './dobUtil.js';
import { getNormalizedGender } from './genderUtil.js';
import { getNormalizedZipCode } from './zipCodeUtil.js';
import {
  getNormalizedCity,
  getNormalizedCountry,
  getNormalizedExternalID,
  getNormalizedName,
  getNormalizedState,
} from './stringUtil.js';
import { sha256_main } from './sha256_with_dependencies_new.js';
import { getAppendix } from '../appendixUtil.js';

const TRIM_REGEX = /^\s+|\s+$/g;
const SHA_256_REGEX = /^[a-f0-9]{64}$/i;
const SHA_256_OR_MD5_REGEX = /^[A-Fa-f0-9]{64}$|^[A-Fa-f0-9]{32}$/;
const STRIP_WHITESPACE_REGEX = /\s+/g;
// Punctuation characters: !"#$%&'()*+,-./:;<=>?@ [\]^_`{|}~
const STRIP_WHITESPACE_AND_PUNCTUATION_REGEX =
  /[!"#\$%&'\(\)\*\+,\-\.\/:;<=>\?@ \[\\\]\^_`\{\|\}~\s]+/g;
const STRIP_NON_LATIN_ALPHA_NUMERIC_REGEX = /[^a-zA-Z0-9]+/g;

function getNormalizedAndHashedPII(piiValue, dataType) {
  if (!piiValue || typeof piiValue !== 'string') {
    return null;
  }

  if (SHA_256_OR_MD5_REGEX.test(piiValue.trim())) {
    return piiValue.trim().toLowerCase() + '.' + getAppendix(APPENDIX_NO_CHANGE);
  } else if (isAlreadyNormalizedAndHashedByParamBuilder(piiValue.trim())) {
    return piiValue.trim();
  } else {
    const normalizedPII = getNormalizedPII(piiValue, dataType);
    if (!normalizedPII) {
      return null;
    }
    return sha256_main(normalizedPII) + '.' + getAppendix(APPENDIX_NET_NEW);
  }
}

function isAlreadyNormalizedAndHashedByParamBuilder(input) {
  // Find the position of the last dot
  const lastDot = input.lastIndexOf('.');
  if (lastDot !== -1) {
    const suffix = input.substring(lastDot + 1);
    if (
      VALID_PARAM_BUILDER_TOKENS.includes(suffix) ||
      suffix.length === APPENDIX_LENGTH_V2
    ) {
      return SHA_256_OR_MD5_REGEX.test(input.substring(0, lastDot));
    }
  }
  return false;
}

function getNormalizedPII(piiValue, dataType) {
  if (
    !piiValue ||
    !dataType ||
    typeof piiValue !== 'string' ||
    typeof dataType !== 'string'
  ) {
    return null;
  }

  dataType = getNormalizedExternalID(dataType);
  if (!Object.values(PII_DATA_TYPE).includes(dataType)) {
    return null;
  }

  let normalizedPII = piiValue;
  if (dataType === PII_DATA_TYPE.EMAIL) {
    normalizedPII = getNormalizedEmail(piiValue);
  } else if (dataType === PII_DATA_TYPE.PHONE) {
    normalizedPII = getNormalizedPhone(piiValue);
  } else if (dataType === PII_DATA_TYPE.DATE_OF_BIRTH) {
    normalizedPII = getNormalizedDOB(piiValue);
  } else if (dataType === PII_DATA_TYPE.GENDER) {
    normalizedPII = getNormalizedGender(piiValue);
  } else if (
    dataType === PII_DATA_TYPE.FIRST_NAME ||
    dataType === PII_DATA_TYPE.LAST_NAME
  ) {
    normalizedPII = getNormalizedName(piiValue);
  } else if (dataType === PII_DATA_TYPE.CITY) {
    normalizedPII = getNormalizedCity(piiValue);
  } else if (dataType === PII_DATA_TYPE.STATE) {
    normalizedPII = getNormalizedState(piiValue);
  } else if (dataType === PII_DATA_TYPE.COUNTRY) {
    normalizedPII = getNormalizedCountry(piiValue);
  } else if (dataType === PII_DATA_TYPE.EXTERNAL_ID) {
    normalizedPII = getNormalizedExternalID(piiValue);
  } else if (dataType === PII_DATA_TYPE.ZIP_CODE) {
    normalizedPII = getNormalizedZipCode(piiValue);
  }

  return normalizedPII;
}

/**
 * Type-tolerating trimmer. Also, removes not just space-whitespace.
 */
function trim(obj) {
  return typeof obj === 'string' ? obj.replace(TRIM_REGEX, '') : '';
}

function looksLikeHashed(input) {
  return typeof input === 'string' && SHA_256_REGEX.test(input);
}

function strip(obj, mode = 'whitespace_only') {
  let result = '';
  if (typeof obj === 'string') {
    switch (mode) {
      case 'whitespace_only':
        result = obj.replace(STRIP_WHITESPACE_REGEX, '');
        break;
      case 'whitespace_and_punctuation':
        result = obj.replace(STRIP_WHITESPACE_AND_PUNCTUATION_REGEX, '');
        break;
      case 'all_non_latin_alpha_numeric':
        result = obj.replace(STRIP_NON_LATIN_ALPHA_NUMERIC_REGEX, '');
        break;
    }
  }
  return result;
}

export {
  getNormalizedPII,
  getNormalizedAndHashedPII,
  looksLikeHashed,
  trim,
  strip,
};
