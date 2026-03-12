/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
export const DEFAULT_FBC_PARAMS = [
  {
    prefix: '',
    query: 'fbclid',
    ebp_path: 'clickID',
  },
];
export const MAX_INT_9_DECIMAL_DIGITS = 999999999;
export const NINETY_DAYS_IN_MS = 90 * 24 * 60 * 60 * 1000;
export const ONE_DAY_IN_MS = 1 * 24 * 60 * 60 * 1000;

export const ONLY_VALID_VERSION_SO_FAR = 'fb';
export const CLICK_ID_PARAMETER = 'fbclid';
export const CLICKTHROUGH_COOKIE_NAME = '_fbc';
export const DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME = '_fbp';
export const IP_COOKIE_NAME = '_fbi';
export const NUM_OF_EXPECTED_COOKIE_COMPONENTS = 4;
export const NUM_OF_EXPECTED_COOKIE_COMPONENTS_WITH_LANGUAGE_TOKEN = 5;
export const LANGUAGE_TOKEN = 'Bg';
export const VALID_PARAM_BUILDER_TOKENS = ['AQ', 'Ag', 'Aw', 'BA', 'BQ', 'Bg'];

// Appendix-related constants
export const DEFAULT_FORMAT = 0x01;
export const LANGUAGE_TOKEN_INDEX = 0x06; // ClientJS token index
export const APPENDIX_LENGTH_V2 = 8;

// Appendix type constants (for breakdown differentiation)
export const APPENDIX_GENERAL_NEW = 0x01;
export const APPENDIX_NET_NEW = 0x02;
export const APPENDIX_MODIFIED_NEW = 0x03;
export const APPENDIX_NO_CHANGE = 0x00;

// PII data type Enum
export const PII_DATA_TYPE = Object.freeze({
  PHONE: 'phone',
  EMAIL: 'email',
  FIRST_NAME: 'first_name',
  LAST_NAME: 'last_name',
  DATE_OF_BIRTH: 'date_of_birth',
  GENDER: 'gender',
  CITY: 'city',
  STATE: 'state',
  ZIP_CODE: 'zip_code',
  COUNTRY: 'country',
  EXTERNAL_ID: 'external_id',
});
