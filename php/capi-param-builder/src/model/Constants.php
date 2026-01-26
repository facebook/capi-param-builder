<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;

class PII_DATA_TYPE
{
    const EMAIL = 'email';
    const PHONE = 'phone';
    const DATE_OF_BIRTH = 'date_of_birth';
    const GENDER = 'gender';
    const FIRST_NAME = 'first_name';
    const LAST_NAME = 'last_name';
    const CITY = 'city';
    const STATE = 'state';
    const ZIP_CODE = 'zip_code';
    const COUNTRY = 'country';
    const EXTERNAL_ID = 'external_id';

    public static function values()
    {
        return [
            self::EMAIL,
            self::PHONE,
            self::DATE_OF_BIRTH,
            self::GENDER,
            self::FIRST_NAME,
            self::LAST_NAME,
            self::CITY,
            self::STATE,
            self::ZIP_CODE,
            self::COUNTRY,
            self::EXTERNAL_ID,
        ];
    }
}

define('DEFAULT_1PC_AGE', 90 *  24 * 3600);
define('LANGUAGE_TOKEN', 'AQ');
define('DEFAULT_FORMAT', 0x01);
define('LANGUAGE_TOKEN_INDEX', 0x01); // PHP language token index
define('APPENDIX_LENGTH_V1', 2);
define('APPENDIX_LENGTH_V2', 8);
define('MIN_PAYLOAD_SPLIT_LENGTH', 4);
define('PAYLOAD_SPLIT_LENGTH_WITH_LANGUAGE_TOKEN', 5);
define('SUPPORTED_LANGUAGES_TOKEN', array('AQ', 'Ag', 'Aw', 'BA', 'BQ', 'Bg'));
define('FBC_NAME', '_fbc');
define('FBP_NAME', '_fbp');
define('FBI_NAME', '_fbi');
define('FBCLID', 'fbclid');
define('CLICK_ID_STRING', 'click_id');
define('FB_PREFIX', 'fb');
define('APPENDIX_GENERAL_NEW', 0x01);
define('APPENDIX_NET_NEW', 0x02);
define('APPENDIX_MODIFIED_NEW', 0x03);
define('APPENDIX_NO_CHANGE', 0x00);
