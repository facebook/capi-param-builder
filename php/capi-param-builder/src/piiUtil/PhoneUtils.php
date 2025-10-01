<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;

require_once __DIR__ . '/SharedUtils.php';

class PhoneUtils
{
  public static function getNormalizedPhone($phone)
  {
    if (SharedUtils::looksLikeHashed($phone)) {
      return $phone;
    }
    // Remove all non-digit characters
    $normalized = preg_replace('/\D/', '', strval($phone));
    // Remove leading zeros
    $normalized = preg_replace('/^0+/', '', $normalized);
    return $normalized;
  }
}
