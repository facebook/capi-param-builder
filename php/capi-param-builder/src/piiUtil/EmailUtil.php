<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;

require_once __DIR__ . '/SharedUtil.php';

class EmailUtil
{
  private static function isEmail($email)
  {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
  }

  public static function getNormalizedEmail($email)
  {
    if (SharedUtil::looksLikeHashed($email)) {
      return $email;
    }
    $normalizedEmail = trim(strtolower($email));
    return EmailUtil::isEmail($normalizedEmail) ? $normalizedEmail : null;
  }
}
