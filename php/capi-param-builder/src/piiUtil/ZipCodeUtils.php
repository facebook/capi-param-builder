<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;

require_once __DIR__ . '/SharedUtils.php';

class ZipCodeUtils
{
  public static function getNormalizedZipCode($zipCode)
  {
    $normalizedZipCode = null;

    if ($zipCode !== null && is_string($zipCode)) {
      if (SharedUtils::looksLikeHashed($zipCode)) {
        $normalizedZipCode = $zipCode;
      } else {
        $maybeZIP = trim(explode('-', mb_strtolower(strval($zipCode)), 2)[0]);

        if (strlen($maybeZIP) >= 2) {
          $normalizedZipCode = $maybeZIP;
        }
      }
    }

    return $normalizedZipCode;
  }
}
