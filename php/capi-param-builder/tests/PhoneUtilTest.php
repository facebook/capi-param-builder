<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

use PHPUnit\Framework\TestCase;
use FacebookAds\PhoneUtil;

require_once __DIR__ . '/../src/piiUtil/PhoneUtil.php';

final class PhoneUtilTest extends TestCase
{
  public function testGetNormalizedPhoneWithExampleData1()
  {
    $phone = '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d';
    $expected = '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithExampleData2()
  {
    $phone = '+1 (616) 954-78 88';
    $expected = '16169547888';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithExampleData3()
  {
    $phone = '1(650)123-4567';
    $expected = '16501234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithExampleData4()
  {
    $phone = '+001 (616) 954-78 88';
    $expected = '16169547888';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithExampleData5()
  {
    $phone = '01(650)123-4567';
    $expected = '16501234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithExampleData6()
  {
    $phone = '  4792813113';
    $expected = '4792813113';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithExampleData7()
  {
    $phone = '  3227352263';
    $expected = '3227352263';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithExampleData8()
  {
    $phone = "alreadyHasPhoneCode: false; countryCode: 'US'; phoneCode: '1'; phoneNumber: '(650)123-4567'";
    $expected = '16501234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithExampleData9()
  {
    $phone = "alreadyHasPhoneCode: false; phoneCode: '+86'; phoneNumber: '12345678'";
    $expected = '8612345678';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithExampleData10()
  {
    $phone = "alreadyHasPhoneCode: true; phoneNumber: '322-735-2263'";
    $expected = '3227352263';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithBasicUSFormat()
  {
    $phone = '(555) 123-4567';
    $expected = '5551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithDashesFormat()
  {
    $phone = '555-123-4567';
    $expected = '5551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithSpacesFormat()
  {
    $phone = '555 123 4567';
    $expected = '5551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithDotsFormat()
  {
    $phone = '555.123.4567';
    $expected = '5551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithCountryCodeFormat()
  {
    $phone = '+1 (555) 123-4567';
    $expected = '15551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithCountryCodeNoDashes()
  {
    $phone = '+15551234567';
    $expected = '15551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithLeadingZeros()
  {
    $phone = '0015551234567';
    $expected = '15551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithMultipleLeadingZeros()
  {
    $phone = '0000015551234567';
    $expected = '15551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithLeadingZeroLocal()
  {
    $phone = '05551234567';
    $expected = '5551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithAlreadyNormalizedPhone()
  {
    $phone = '5551234567';
    $expected = '5551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithComplexFormat()
  {
    $phone = '+1-(555)-123-4567 ext. 123';
    $expected = '15551234567123';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithInternationalFormat()
  {
    $phone = '+44 20 1234 5678';
    $expected = '442012345678';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithExtension()
  {
    $phone = '555-123-4567 x123';
    $expected = '5551234567123';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithSha256Hash()
  {
    // SHA256 hash (64 hex characters)
    $hashedPhone = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = PhoneUtil::getNormalizedPhone($hashedPhone);
    $this->assertEquals($hashedPhone, $result);
  }

  public function testGetNormalizedPhoneWithMd5Hash()
  {
    // MD5 hash (32 hex characters)
    $hashedPhone = 'd41d8cd98f00b204e9800998ecf8427e';
    $result = PhoneUtil::getNormalizedPhone($hashedPhone);
    $this->assertEquals($hashedPhone, $result);
  }

  public function testGetNormalizedPhoneWithMixedCaseSha256Hash()
  {
    // SHA256 hash with mixed case
    $hashedPhone = 'A665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = PhoneUtil::getNormalizedPhone($hashedPhone);
    $this->assertEquals($hashedPhone, $result);
  }

  public function testGetNormalizedPhoneWithEmptyString()
  {
    $phone = '';
    $expected = '';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithOnlySpaces()
  {
    $phone = '   ';
    $expected = '';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithOnlyNonDigits()
  {
    $phone = '()- +.';
    $expected = '';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithOnlyZeros()
  {
    $phone = '0000';
    $expected = '';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithMixedZerosAndDigits()
  {
    $phone = '000123';
    $expected = '123';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithNumberAsInteger()
  {
    $phone = 5551234567;
    $expected = '5551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithNumberAsIntegerWithLeadingZeros()
  {
    // PHP interprets numbers with leading zeros as octal, so use a string
    $phone = '0015551234567';
    $expected = '15551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithSpecialCharacters()
  {
    $phone = '✆ 555-123-4567 📞';
    $expected = '5551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithLetters()
  {
    $phone = '1-800-FLOWERS';
    $expected = '1800';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithMixedLettersAndNumbers()
  {
    $phone = 'Call 555-HELP (4357) now!';
    $expected = '5554357';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithWhitespaceAndTabs()
  {
    $phone = "  \t 555 \n 123 \r 4567  \t ";
    $expected = '5551234567';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithVeryLongNumber()
  {
    $phone = '+1-555-123-4567-890-123-456-789';
    $expected = '15551234567890123456789';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithShortNumber()
  {
    $phone = '123';
    $expected = '123';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithSingleDigit()
  {
    $phone = '5';
    $expected = '5';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPhoneWithLeadingZeroSingleDigit()
  {
    $phone = '05';
    $expected = '5';
    $result = PhoneUtil::getNormalizedPhone($phone);
    $this->assertEquals($expected, $result);
  }
}
