<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;

require_once __DIR__ . '/../model/Constants.php';
require_once __DIR__ . '/EmailUtils.php';
require_once __DIR__ . '/PhoneUtils.php';
require_once __DIR__ . '/DOBUtils.php';
require_once __DIR__ . '/GenderUtils.php';
require_once __DIR__ . '/StringUtils.php';
require_once __DIR__ . '/ZipCodeUtils.php';
require_once __DIR__ . '/SharedUtils.php';
require_once __DIR__ . '/../util/AppendixProvider.php';

class PIIUtils
{

  public static function getNormalizedPII($piiValue, $dataType)
  {
    // Check for undefined, null, empty, and type
    if (
      !isset($piiValue) || !isset($dataType) ||
      !is_string($piiValue) || $piiValue === ''
    ) {
      return null;
    }

    $dataType = StringUtils::getNormalizedExternalID($dataType);
    if (!in_array($dataType, PII_DATA_TYPE::values(), true)) {
      return null;
    }

    $normalizedPII = $piiValue;

    if ($dataType === PII_DATA_TYPE::EMAIL) {
      $normalizedPII = EmailUtils::getNormalizedEmail($piiValue);
    } else if ($dataType === PII_DATA_TYPE::PHONE) {
      $normalizedPII = PhoneUtils::getNormalizedPhone($piiValue);
    } else if ($dataType === PII_DATA_TYPE::DATE_OF_BIRTH) {
      $normalizedPII = DOBUtils::getNormalizedDOB($piiValue);
    } else if ($dataType === PII_DATA_TYPE::GENDER) {
      $normalizedPII = GenderUtils::getNormalizedGender($piiValue);
    } else if (
      $dataType === PII_DATA_TYPE::FIRST_NAME ||
      $dataType === PII_DATA_TYPE::LAST_NAME
    ) {
      $normalizedPII = StringUtils::getNormalizedName($piiValue);
    } else if ($dataType === PII_DATA_TYPE::CITY) {
      $normalizedPII = StringUtils::getNormalizedCity($piiValue);
    } else if ($dataType === PII_DATA_TYPE::STATE) {
      $normalizedPII = StringUtils::getNormalizedState($piiValue);
    } else if ($dataType === PII_DATA_TYPE::COUNTRY) {
      $normalizedPII = StringUtils::getNormalizedCountry($piiValue);
    } else if ($dataType === PII_DATA_TYPE::EXTERNAL_ID) {
      $normalizedPII = StringUtils::getNormalizedExternalID($piiValue);
    } else if ($dataType === PII_DATA_TYPE::ZIP_CODE) {
      $normalizedPII = ZipCodeUtils::getNormalizedZipCode($piiValue);
    }

    return $normalizedPII;
  }

  public static function getNormalizedAndHashedPII($piiValue, $dataType)
  {
    if (!isset($piiValue) || !is_string($piiValue) || $piiValue === '') {
      return null;
    }

    if (SharedUtils::looksLikeHashed($piiValue)) {
      return mb_strtolower($piiValue) . '.' .
        AppendixProvider::getAppendix(false);
    } else {
      $normalizedPII = PIIUtils::getNormalizedPII($piiValue, $dataType);
      if ($normalizedPII === null || $normalizedPII === '') {
        return null;
      }
      return hash('sha256', $normalizedPII) . '.' .
        AppendixProvider::getAppendix(true);
    }
  }
}
