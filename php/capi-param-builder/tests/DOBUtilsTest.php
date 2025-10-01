<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

use PHPUnit\Framework\TestCase;
use FacebookAds\DOBUtils;

require_once __DIR__ . '/../src/piiUtil/DOBUtils.php';

final class DOBUtilsTest extends TestCase
{
  public function testWithExampleData1()
  {
    $dob = '2/16/1997 (mm/dd/yyyy)';
    $expected = '19970216';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData2()
  {
    $dob = '16–2–1997 (dd-mm-yyyy)';
    $expected = '19970216';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithValidDateMDY()
  {
    $dob = '12/25/1985';
    $expected = '19851225';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithValidDateDMY()
  {
    $dob = '25/12/1985';
    $expected = '19851225';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithValidDateYMD()
  {
    $dob = '1985/12/25';
    $expected = '19851225';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithValidDateYDM()
  {
    $dob = '1985/25/12';
    $expected = '19851225';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithHyphens()
  {
    $dob = '1985-12-25';
    $expected = '19851225';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithDots()
  {
    $dob = '25.12.1985';
    $expected = '19851225';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithSpaces()
  {
    $dob = '25 12 1985';
    $expected = '19851225';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithMixedSeparators()
  {
    $dob = '25-12/1985';
    $expected = '19851225';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithAlreadyFormattedDate()
  {
    $dob = '19851225';
    $expected = '19851225';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithSha256Hash()
  {
    // SHA256 hash (64 hex characters)
    $hashedDOB = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = DOBUtils::getNormalizedDOB($hashedDOB);
    $this->assertEquals($hashedDOB, $result);
  }

  public function testGetNormalizedDOBWithMd5Hash()
  {
    // MD5 hash (32 hex characters)
    $hashedDOB = 'd41d8cd98f00b204e9800998ecf8427e';
    $result = DOBUtils::getNormalizedDOB($hashedDOB);
    $this->assertEquals($hashedDOB, $result);
  }

  public function testGetNormalizedDOBWithMixedCaseSha256Hash()
  {
    // SHA256 hash with mixed case
    $hashedDOB = 'A665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = DOBUtils::getNormalizedDOB($hashedDOB);
    $this->assertEquals($hashedDOB, $result);
  }

  public function testGetNormalizedDOBWithInvalidYear()
  {
    $dob = '01/15/1799'; // Year too old
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertNull($result);
  }

  public function testGetNormalizedDOBWithFutureYear()
  {
    $futureYear = intval(date('Y')) + 2;
    $dob = "01/15/{$futureYear}"; // Year too far in future
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertNull($result);
  }

  public function testGetNormalizedDOBWithInvalidMonth()
  {
    $dob = '13/15/1990'; // Month 13 is invalid
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertNull($result);
  }

  public function testGetNormalizedDOBWithInvalidDay()
  {
    $dob = '01/32/1990'; // Day 32 is invalid
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertNull($result);
  }

  public function testGetNormalizedDOBWithZeroMonth()
  {
    $dob = '00/15/1990'; // Month 0 is invalid
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertNull($result);
  }

  public function testGetNormalizedDOBWithZeroDay()
  {
    $dob = '01/00/1990'; // Day 0 is invalid
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertNull($result);
  }

  public function testGetNormalizedDOBWithTwoDigitYear()
  {
    $dob = '01/15/90';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertNull($result); // Two-digit years should be invalid
  }

  public function testGetNormalizedDOBWithSingleDigitComponents()
  {
    $dob = '1/5/1990';
    $expected = '19900105';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithPaddedComponents()
  {
    $dob = '01/05/1990';
    $expected = '19900105';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithEmptyString()
  {
    $dob = '';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertNull($result);
  }

  public function testGetNormalizedDOBWithOnlyWhitespace()
  {
    $dob = '   ';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertNull($result);
  }

  public function testGetNormalizedDOBWithLetters()
  {
    $dob = 'January 15, 1990';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertNull($result);
  }

  public function testGetNormalizedDOBWithInsufficientComponents()
  {
    $dob = '01/15'; // Missing year
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertNull($result);
  }

  public function testGetNormalizedDOBWithTooManyComponents()
  {
    $dob = '01/15/1990/extra';
    $expected = '19900115'; // Should use first three components
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithCurrentYear()
  {
    $currentYear = intval(date('Y'));
    $dob = "01/15/{$currentYear}";
    $expected = "{$currentYear}0115";
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithNextYear()
  {
    $nextYear = intval(date('Y')) + 1;
    $dob = "01/15/{$nextYear}";
    $expected = "{$nextYear}0115";
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithValidOldDate()
  {
    $dob = '01/15/1800'; // Boundary year
    $expected = '18000115';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithLeapYearFebruary29()
  {
    $dob = '29/02/2000'; // Leap year
    $expected = '20000229';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithFebruary29NonLeapYear()
  {
    $dob = '29/02/1900'; // Not a leap year (divisible by 100 but not 400)
    $expected = '19000229';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result); // DOBUtils doesn't validate actual calendar dates
  }

  public function testGetNormalizedDOBWithExtraWhitespace()
  {
    $dob = '  01 / 15 / 1990  ';
    $expected = '19900115';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithMixedWhitespaceAndSeparators()
  {
    $dob = '01 - 15 / 1990';
    $expected = '19900115';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithAlphanumericChars()
  {
    $dob = '01abc15def1990';
    $expected = '19900115';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithSpecialCharacters()
  {
    $dob = '01@#$15%^&1990';
    $expected = '19900115';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedDOBWithIncorrectFormat8Digits()
  {
    $dob = '15011990'; // DDMMYYYY format
    $expected = '15011990';
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertEquals($expected, $result); // Returns as-is if 8 digits
  }

  public function testGetNormalizedDOBWithIncorrectFormat7Digits()
  {
    $dob = '1501990'; // 7 digits - invalid
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertNull($result);
  }

  public function testGetNormalizedDOBWithIncorrectFormat9Digits()
  {
    $dob = '150119901'; // 9 digits - invalid
    $result = DOBUtils::getNormalizedDOB($dob);
    $this->assertNull($result);
  }
}
