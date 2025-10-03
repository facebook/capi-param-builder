<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;

require_once __DIR__ . '/SharedUtils.php';

class GenderUtils
{
  const MALE = 'm';
  const FEMALE = 'f';

  private static $MALE_SET = [
    'man',
    'male',
    'boy',
    'gentleman',
    'guy',
    'sir',
    'mister',
    'mr',
    'son',
    'father',
    'dad',
    'daddy',
    'papa',
    'uncle',
    'nephew',
    'brother',
    'husband',
    'boyfriend',
    'groom',
    'widower',
    'king',
    'prince',
    'duke',
    'count',
    'emperor',
    'god',
    'lord',
    'lad',
    'fellow',
    'chap',
    'bloke',
    'dude',
    'he',
    'him',
    'his',
    'himself',
    'm'
  ];

  private static $FEMALE_SET = [
    'woman',
    'female',
    'girl',
    'lady',
    'miss',
    'ms',
    'mrs',
    'madam',
    "ma'am",
    'daughter',
    'mother',
    'mom',
    'mama',
    'mommy',
    'aunt',
    'niece',
    'sister',
    'wife',
    'girlfriend',
    'bride',
    'widow',
    'queen',
    'princess',
    'duchess',
    'countess',
    'empress',
    'goddess',
    'maiden',
    'lass',
    'gal',
    'chick',
    'dame',
    'belle',
    'she',
    'her',
    'hers',
    'herself',
    'f'
  ];

  // Main function: Normalize gender
  public static function getNormalizedGender($gender)
  {
    if (SharedUtils::looksLikeHashed($gender)) {
      return $gender;
    }
    $normalizedGender = trim(mb_strtolower($gender));
    if (in_array($normalizedGender, GenderUtils::$MALE_SET, true)) {
      return GenderUtils::MALE;
    } elseif (in_array($normalizedGender, GenderUtils::$FEMALE_SET, true)) {
      return GenderUtils::FEMALE;
    } else {
      return null;
    }
  }
}
