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

class PIIUtils
{

  public static function getNormalizedPII($piiValue, $dataType)
  {
    // Check for undefined, null, empty, and type
    if (
      !isset($piiValue) || !isset($dataType) ||
      !is_string($piiValue) || $piiValue === '' ||
      !in_array($dataType, PII_DATA_TYPE::values(), true)
    ) {
      return null;
    }

    $normalizedPII = $piiValue;

    if ($dataType === PII_DATA_TYPE::EMAIL) {
      $normalizedPII = EmailUtils::getNormalizedEmail($piiValue);
    } else if ($dataType === PII_DATA_TYPE::PHONE) {
      $normalizedPII = PhoneUtils::getNormalizedPhone($piiValue);
    } else if ($dataType === PII_DATA_TYPE::DATE_OF_BIRTH) {
      $normalizedPII = DOBUtils::getNormalizedDOB($piiValue);
    }

    return $normalizedPII;
  }
}
