<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;

class SharedUtils
{
  public static function looksLikeHashed($input)
  {
    // it could be sha256 or md5
    return is_string($input) && (preg_match('/^[A-Fa-f0-9]{64}$/', $input) ||
      preg_match('/^[a-f0-9]{32}$/', $input));
  }
}
