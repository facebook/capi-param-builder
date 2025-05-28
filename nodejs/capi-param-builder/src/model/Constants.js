/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
class Constants {
    static DEFAULT_1PC_AGE = 90 * 24 * 3600; // 90 days
    static LANGUAGE_TOKEN = 'BA'; // nodejs
    static SUPPORTED_PARAM_BUILDER_LANGUAGES_TOKEN = ['AQ', 'Ag', 'Aw', 'BA', 'BQ', 'Bg'];
    static MIN_PAYLOAD_SPLIT_LENGTH = 4;
    static MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_SPLIT_LENGTH = 5;
    static IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    static IPV6_SEG_REGEX = /^[0-9a-fA-F]{1,4}$/;
    static FBCLID_STRING = 'fbclid';
    static CLICK_ID_STRING = 'clickid';
    static FBC_NAME_STRING = '_fbc';
    static FBP_NAME_STRING = '_fbp';
}
module.exports = Constants;
