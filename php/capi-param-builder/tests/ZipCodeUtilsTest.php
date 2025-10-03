<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

use PHPUnit\Framework\TestCase;
use FacebookAds\ZipCodeUtils;

require_once __DIR__ . '/../src/piiUtil/ZipCodeUtils.php';

final class ZipCodeUtilsTest extends TestCase
{
  public function testWithExampleData1()
  {
    $zipCode = '  37221';
    $expected = '37221';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData2()
  {
    $zipCode = '37221-3312';
    $expected = '37221';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithValidUSZip()
  {
    $zipCode = '12345';
    $expected = '12345';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithValidUSZipPlus4()
  {
    $zipCode = '12345-6789';
    $expected = '12345';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithUpperCaseCanadian()
  {
    $zipCode = 'K1A 0A6';
    $expected = 'k1a 0a6';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithLowerCaseCanadian()
  {
    $zipCode = 'k1a 0a6';
    $expected = 'k1a 0a6';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithMixedCaseCanadian()
  {
    $zipCode = 'K1a 0A6';
    $expected = 'k1a 0a6';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithUKPostalCode()
  {
    $zipCode = 'SW1A 1AA';
    $expected = 'sw1a 1aa';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithGermanPostalCode()
  {
    $zipCode = '10115';
    $expected = '10115';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithLeadingWhitespace()
  {
    $zipCode = '   12345';
    $expected = '12345';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithTrailingWhitespace()
  {
    $zipCode = '12345   ';
    $expected = '12345';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithSurroundingWhitespace()
  {
    $zipCode = '  12345  ';
    $expected = '12345';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithTabs()
  {
    $zipCode = "\t12345\t";
    $expected = '12345';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithNewlines()
  {
    $zipCode = "\n12345\n";
    $expected = '12345';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithMixedWhitespace()
  {
    $zipCode = " \t\n 12345 \t\n ";
    $expected = '12345';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithMultipleDashes()
  {
    $zipCode = '12345-6789-0123';
    $expected = '12345';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithAlphanumericZip()
  {
    $zipCode = 'ABC123';
    $expected = 'abc123';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithUpperCaseAlphanumeric()
  {
    $zipCode = 'ABC-123';
    $expected = 'abc';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithFrenchPostalCode()
  {
    $zipCode = '75001';
    $expected = '75001';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithJapanesePostalCode()
  {
    $zipCode = '100-0001';
    $expected = '100';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithAustralianPostcode()
  {
    $zipCode = '2000';
    $expected = '2000';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithSingleCharacter()
  {
    $zipCode = 'A';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertNull($result); // Too short, minimum 2 characters
  }

  public function testGetNormalizedZipCodeWithTwoCharacters()
  {
    $zipCode = 'AB';
    $expected = 'ab';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithEmptyString()
  {
    $zipCode = '';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertNull($result);
  }

  public function testGetNormalizedZipCodeWithOnlyWhitespace()
  {
    $zipCode = '   ';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertNull($result);
  }

  public function testGetNormalizedZipCodeWithOnlyDash()
  {
    $zipCode = '-';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertNull($result);
  }

  public function testGetNormalizedZipCodeWithDashOnly()
  {
    $zipCode = '---';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertNull($result);
  }

  public function testGetNormalizedZipCodeWithNullInput()
  {
    $zipCode = null;
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertNull($result);
  }

  public function testGetNormalizedZipCodeWithNonStringInput()
  {
    $zipCode = 12345;
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertNull($result);
  }

  public function testGetNormalizedZipCodeWithArrayInput()
  {
    $zipCode = ['12345'];
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertNull($result);
  }

  public function testGetNormalizedZipCodeWithBooleanInput()
  {
    $zipCode = true;
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertNull($result);
  }

  public function testGetNormalizedZipCodeWithSha256Hash()
  {
    // SHA256 hash (64 hex characters)
    $hashedZipCode = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = ZipCodeUtils::getNormalizedZipCode($hashedZipCode);
    $this->assertEquals($hashedZipCode, $result);
  }

  public function testGetNormalizedZipCodeWithMd5Hash()
  {
    // MD5 hash (32 hex characters)
    $hashedZipCode = 'd41d8cd98f00b204e9800998ecf8427e';
    $result = ZipCodeUtils::getNormalizedZipCode($hashedZipCode);
    $this->assertEquals($hashedZipCode, $result);
  }

  public function testGetNormalizedZipCodeWithMixedCaseSha256Hash()
  {
    // SHA256 hash with mixed case
    $hashedZipCode = 'A665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = ZipCodeUtils::getNormalizedZipCode($hashedZipCode);
    $this->assertEquals($hashedZipCode, $result);
  }

  public function testGetNormalizedZipCodeWithSha1Hash()
  {
    // SHA1 hash (40 hex characters)
    $hashedZipCode = 'da39a3ee5e6b4b0d3255bfef95601890afd80709';
    $result = ZipCodeUtils::getNormalizedZipCode($hashedZipCode);
    $this->assertEquals($hashedZipCode, $result);
  }

  public function testGetNormalizedZipCodeWithLongNumericString()
  {
    $zipCode = '1234567890';
    $expected = '1234567890';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithSpecialCharacters()
  {
    $zipCode = '12345@#$';
    $expected = '12345@#$';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithInternationalFormat()
  {
    $zipCode = 'NL-1234AB';
    $expected = 'nl';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithBrazilianCEP()
  {
    $zipCode = '01310-100';
    $expected = '01310';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithIndianPincode()
  {
    $zipCode = '110001';
    $expected = '110001';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithChinesePostalCode()
  {
    $zipCode = '100000';
    $expected = '100000';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithRussianPostalCode()
  {
    $zipCode = '101000';
    $expected = '101000';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithItalianPostalCode()
  {
    $zipCode = '00118';
    $expected = '00118';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithSpanishPostalCode()
  {
    $zipCode = '28001';
    $expected = '28001';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithDutchPostalCode()
  {
    $zipCode = '1012 AB';
    $expected = '1012 ab';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithSwedishPostalCode()
  {
    $zipCode = '111 22';
    $expected = '111 22';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithNorwegianPostalCode()
  {
    $zipCode = '0150';
    $expected = '0150';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithDanishPostalCode()
  {
    $zipCode = '1000';
    $expected = '1000';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithFinnishPostalCode()
  {
    $zipCode = '00100';
    $expected = '00100';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithBelgianPostalCode()
  {
    $zipCode = '1000';
    $expected = '1000';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithSwissPostalCode()
  {
    $zipCode = '8001';
    $expected = '8001';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithAustrianPostalCode()
  {
    $zipCode = '1010';
    $expected = '1010';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithPortuguesePostalCode()
  {
    $zipCode = '1000-001';
    $expected = '1000';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithMexicanPostalCode()
  {
    $zipCode = '01000';
    $expected = '01000';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithArgentinianPostalCode()
  {
    $zipCode = 'C1000AAA';
    $expected = 'c1000aaa';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithSouthAfricanPostalCode()
  {
    $zipCode = '8001';
    $expected = '8001';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithNewZealandPostcode()
  {
    $zipCode = '1010';
    $expected = '1010';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithSingaporePostalCode()
  {
    $zipCode = '018956';
    $expected = '018956';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithMalaysianPostcode()
  {
    $zipCode = '50000';
    $expected = '50000';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithThaiPostalCode()
  {
    $zipCode = '10100';
    $expected = '10100';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithIndonesianPostalCode()
  {
    $zipCode = '10110';
    $expected = '10110';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithPhilippinePostalCode()
  {
    $zipCode = '1000';
    $expected = '1000';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithVietnamPostalCode()
  {
    $zipCode = '100000';
    $expected = '100000';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithSouthKoreanPostalCode()
  {
    $zipCode = '03051';
    $expected = '03051';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithTaiwanesePostalCode()
  {
    $zipCode = '100';
    $expected = '100';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithHongKongPostalCode()
  {
    $zipCode = '999077';
    $expected = '999077';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithComplexCanadianPostalCode()
  {
    $zipCode = '  K1A-0A6  ';
    $expected = 'k1a';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithComplexUKPostalCode()
  {
    $zipCode = 'SW1A-1AA';
    $expected = 'sw1a';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithLeadingZeros()
  {
    $zipCode = '00123';
    $expected = '00123';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithOnlyZeros()
  {
    $zipCode = '00000';
    $expected = '00000';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithUnicodeCharacters()
  {
    $zipCode = '12345ñ';
    $expected = '12345ñ';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedZipCodeWithAccentedCharacters()
  {
    $zipCode = '12345é';
    $expected = '12345é';
    $result = ZipCodeUtils::getNormalizedZipCode($zipCode);
    $this->assertEquals($expected, $result);
  }
}
