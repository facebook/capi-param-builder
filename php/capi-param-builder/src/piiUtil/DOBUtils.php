<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;

require_once __DIR__ . '/SharedUtils.php';

class DOBUtils
{

  // Helper: Check if a date is valid
  private static function isValidDate($year, $month, $day)
  {
    $currentYear = intval(date('Y'));
    if ($year < 1800 || $year > $currentYear + 1) {
      return false;
    }
    if ($month < 1 || $month > 12) {
      return false;
    }
    if ($day < 1 || $day > 31) {
      return false;
    }
    return true;
  }

  // Helper: Replace all non-digit characters with spaces
  private static function replaceNonDigitsWithSpaces($input)
  {
    return preg_replace('/\D/', ' ', $input);
  }

  // Helper: Get year, month, day from three numbers
  private static function getYearMonthDayFromNumbers($n1, $n2, $n3)
  {
    $year = 0;
    $month = 0;
    $day = 0;

    if ($n1 > 31) {
      $year = $n1;
      $month = $n2 > 12 ? $n3 : $n2;
      $day = $n2 > 12 ? $n2 : $n3;
    } elseif ($n2 > 31) {
      $year = $n2;
      $month = $n3 > 12 ? $n1 : $n3;
      $day = $n3 > 12 ? $n3 : $n1;
    } else {
      $year = $n3;
      $month = $n1 > 12 ? $n2 : $n1;
      $day = $n1 > 12 ? $n1 : $n2;
    }

    if (DOBUtils::isValidDate($year, $month, $day)) {
      return str_pad($year, 4, '0', STR_PAD_LEFT) .
        str_pad($month, 2, '0', STR_PAD_LEFT) .
        str_pad($day, 2, '0', STR_PAD_LEFT);
    }
    return null;
  }

  // Parse date from various formats
  private static function parseDateOfBirth($input)
  {
    $cleanedInput = trim(DOBUtils::replaceNonDigitsWithSpaces($input));

    $digitGroups = array_values(
      array_filter(
        explode(' ', $cleanedInput),
        function ($group) {
          return strlen($group) > 0;
        }
      )
    );

    if (count($digitGroups) >= 3) {
      $n1 = intval($digitGroups[0]);
      $n2 = intval($digitGroups[1]);
      $n3 = intval($digitGroups[2]);
      $maybeResult = DOBUtils::getYearMonthDayFromNumbers($n1, $n2, $n3);

      if ($maybeResult !== null) {
        return $maybeResult;
      }
    }

    if (count($digitGroups) === 1 && strlen($digitGroups[0]) === 8) {
      return $digitGroups[0];
    }

    return null;
  }

  // Main function: Normalize DOB
  public static function getNormalizedDOB($dob)
  {
    try {
      if (SharedUtils::looksLikeHashed($dob)) {
        return $dob;
      }
      return DOBUtils::parseDateOfBirth($dob);
    } catch (\Exception $e) {
      error_log('Failed to normalize dob: ' . $e->getMessage());
    }
    return null;
  }
}
