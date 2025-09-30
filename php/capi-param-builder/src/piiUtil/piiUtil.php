<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;

require_once __DIR__ . '/../model/Constants.php';

class PIIUtil
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

    return $normalizedPII;
  }
}
