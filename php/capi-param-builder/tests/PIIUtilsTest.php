<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

use PHPUnit\Framework\TestCase;
use FacebookAds\PIIUtils;
use FacebookAds\PII_DATA_TYPE;
use FacebookAds\AppendixProvider;

require_once __DIR__ . '/../src/piiUtil/PIIUtils.php';
require_once __DIR__ . '/../src/model/Constants.php';

final class PIIUtilsTest extends TestCase
{
  private $appendix_net_new;
  private $appendix_no_change;

  protected function setUp(): void
  {
    // Get the actual appendix values from AppendixProvider
    $this->appendix_net_new = AppendixProvider::getAppendix(APPENDIX_NET_NEW);
    $this->appendix_no_change = AppendixProvider::getAppendix(APPENDIX_NO_CHANGE);
  }


  public function testGetNormalizedPIIWithValidEmail()
  {
    $email = '  John.Doe@Example.COM  ';
    $expected = 'john.doe@example.com';
    $result = PIIUtils::getNormalizedPII($email, PII_DATA_TYPE::EMAIL);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPIIWithValidPhone()
  {
    $phone = '+1 (555) 123-4567';
    $expected = '15551234567'; // No + prefix in PHP implementation
    $result = PIIUtils::getNormalizedPII($phone, PII_DATA_TYPE::PHONE);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPIIWithValidDOB()
  {
    $dob = '01/15/1990';
    $expected = '19900115';
    $result = PIIUtils::getNormalizedPII($dob, PII_DATA_TYPE::DATE_OF_BIRTH);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPIIWithValidGender()
  {
    $gender = '  Male  ';
    $expected = 'm';
    $result = PIIUtils::getNormalizedPII($gender, PII_DATA_TYPE::GENDER);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPIIWithValidFirstName()
  {
    $firstName = '  John Smith  ';
    $expected = 'johnsmith';
    $result = PIIUtils::getNormalizedPII($firstName, PII_DATA_TYPE::FIRST_NAME);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPIIWithValidLastName()
  {
    $lastName = '  Mary Johnson  ';
    $expected = 'maryjohnson';
    $result = PIIUtils::getNormalizedPII($lastName, PII_DATA_TYPE::LAST_NAME);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPIIWithValidCity()
  {
    $city = '  New York  ';
    $expected = 'newyork';
    $result = PIIUtils::getNormalizedPII($city, PII_DATA_TYPE::CITY);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPIIWithValidState()
  {
    $state = '  California  ';
    $expected = 'ca';
    $result = PIIUtils::getNormalizedPII($state, PII_DATA_TYPE::STATE);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPIIWithValidCountry()
  {
    $country = '  United States  ';
    $expected = 'us';
    $result = PIIUtils::getNormalizedPII($country, PII_DATA_TYPE::COUNTRY);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPIIWithValidExternalID()
  {
    $externalId = '  User123  ';
    $expected = 'user123';
    $result = PIIUtils::getNormalizedPII($externalId, PII_DATA_TYPE::EXTERNAL_ID);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPIIWithValidZipCode()
  {
    $zipCode = '  12345-6789  ';
    $expected = '12345';
    $result = PIIUtils::getNormalizedPII($zipCode, PII_DATA_TYPE::ZIP_CODE);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPIIWithNullValue()
  {
    $result = PIIUtils::getNormalizedPII(null, PII_DATA_TYPE::EMAIL);
    $this->assertNull($result);
  }

  public function testGetNormalizedPIIWithEmptyString()
  {
    $result = PIIUtils::getNormalizedPII('', PII_DATA_TYPE::EMAIL);
    $this->assertNull($result);
  }

  public function testGetNormalizedPIIWithNonStringValue()
  {
    $result = PIIUtils::getNormalizedPII(123, PII_DATA_TYPE::EMAIL);
    $this->assertNull($result);
  }

  public function testGetNormalizedPIIWithArrayValue()
  {
    $result = PIIUtils::getNormalizedPII(['test@example.com'], PII_DATA_TYPE::EMAIL);
    $this->assertNull($result);
  }

  public function testGetNormalizedPIIWithBooleanValue()
  {
    $result = PIIUtils::getNormalizedPII(true, PII_DATA_TYPE::EMAIL);
    $this->assertNull($result);
  }

  public function testGetNormalizedPIIWithNullDataType()
  {
    $result = PIIUtils::getNormalizedPII('test@example.com', null);
    $this->assertNull($result);
  }

  public function testGetNormalizedPIIWithInvalidDataType()
  {
    $result = PIIUtils::getNormalizedPII('test@example.com', 'INVALID_TYPE');
    $this->assertNull($result);
  }

  public function testGetNormalizedPIIWithUnsupportedDataType()
  {
    // Test with a data type that doesn't have specific handling (should return original value)
    $input = 'some value';
    $result = PIIUtils::getNormalizedPII($input, 'SOME_OTHER_TYPE');
    $this->assertNull($result); // Should return null for invalid data type
  }

  public function testGetNormalizedPIIWithHashedEmail()
  {
    $hashedEmail = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = PIIUtils::getNormalizedPII($hashedEmail, PII_DATA_TYPE::EMAIL);
    $this->assertEquals($hashedEmail, $result);
  }

  public function testGetNormalizedPIIWithInvalidEmail()
  {
    $invalidEmail = 'invalid-email';
    $result = PIIUtils::getNormalizedPII($invalidEmail, PII_DATA_TYPE::EMAIL);
    $this->assertNull($result);
  }

  public function testGetNormalizedPIIWithInvalidPhone()
  {
    $invalidPhone = 'abc123';
    $expected = '123'; // PhoneUtils extracts digits from invalid input
    $result = PIIUtils::getNormalizedPII($invalidPhone, PII_DATA_TYPE::PHONE);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedPIIWithInvalidDOB()
  {
    $invalidDOB = 'invalid-date';
    $result = PIIUtils::getNormalizedPII($invalidDOB, PII_DATA_TYPE::DATE_OF_BIRTH);
    $this->assertNull($result);
  }

  public function testGetNormalizedPIIWithInvalidGender()
  {
    $invalidGender = 'unknown';
    $result = PIIUtils::getNormalizedPII($invalidGender, PII_DATA_TYPE::GENDER);
    $this->assertNull($result);
  }

  // Tests for getNormalizedAndHashedPII function

  public function testGetNormalizedAndHashedPIIWithValidEmail()
  {
    $email = '  Test.User@Example.COM  ';
    $expectedHash = hash('sha256', 'test.user@example.com') . '.' . $this->appendix_net_new;
    $result = PIIUtils::getNormalizedAndHashedPII($email, PII_DATA_TYPE::EMAIL);
    $this->assertEquals($expectedHash, $result);
  }

  public function testGetNormalizedAndHashedPIIWithValidPhone()
  {
    $phone = '+1 (555) 123-4567';
    $expectedHash = hash('sha256', '15551234567') . '.' . $this->appendix_net_new; // No + prefix in PHP implementation
    $result = PIIUtils::getNormalizedAndHashedPII($phone, PII_DATA_TYPE::PHONE);
    $this->assertEquals($expectedHash, $result);
  }

  public function testGetNormalizedAndHashedPIIWithValidFirstName()
  {
    $firstName = '  John Smith  ';
    $expectedHash = hash('sha256', 'johnsmith') . '.' . $this->appendix_net_new;
    $result = PIIUtils::getNormalizedAndHashedPII($firstName, PII_DATA_TYPE::FIRST_NAME);
    $this->assertEquals($expectedHash, $result);
  }

  public function testGetNormalizedAndHashedPIIWithSha256Hash()
  {
    // SHA256 hash (64 hex characters) - implementation appends appendix
    $hashedValue = 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
    $expected = mb_strtolower($hashedValue) . '.' . $this->appendix_no_change;
    $result = PIIUtils::getNormalizedAndHashedPII($hashedValue, PII_DATA_TYPE::EMAIL);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedAndHashedPIIWithMd5Hash()
  {
    // MD5 hash (32 hex characters) - implementation appends appendix
    $hashedValue = 'D41D8CD98F00B204E9800998ECF8427E';
    $expected = mb_strtolower($hashedValue) . '.' . $this->appendix_no_change;
    $result = PIIUtils::getNormalizedAndHashedPII($hashedValue, PII_DATA_TYPE::EMAIL);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedAndHashedPIIWithLowercaseSha256Hash()
  {
    // Already lowercase SHA256 hash - implementation appends no_change appendix
    $hashedValue = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $expected = $hashedValue . '.' . $this->appendix_no_change;
    $result = PIIUtils::getNormalizedAndHashedPII($hashedValue, PII_DATA_TYPE::EMAIL);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedAndHashedPIIWithMixedCaseSha256Hash()
  {
    // Mixed case SHA256 hash - implementation appends no_change appendix
    $hashedValue = 'A665a45920422f9D417e4867efdc4FB8a04a1f3fff1fa07E998e86f7f7a27ae3';
    $expected = mb_strtolower($hashedValue) . '.' . $this->appendix_no_change;
    $result = PIIUtils::getNormalizedAndHashedPII($hashedValue, PII_DATA_TYPE::EMAIL);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedAndHashedPIIWithNullValue()
  {
    $result = PIIUtils::getNormalizedAndHashedPII(null, PII_DATA_TYPE::EMAIL);
    $this->assertNull($result);
  }

  public function testGetNormalizedAndHashedPIIWithEmptyString()
  {
    $result = PIIUtils::getNormalizedAndHashedPII('', PII_DATA_TYPE::EMAIL);
    $this->assertNull($result);
  }

  public function testGetNormalizedAndHashedPIIWithNonStringValue()
  {
    $result = PIIUtils::getNormalizedAndHashedPII(123, PII_DATA_TYPE::EMAIL);
    $this->assertNull($result);
  }

  public function testGetNormalizedAndHashedPIIWithArrayValue()
  {
    $result = PIIUtils::getNormalizedAndHashedPII(['test@example.com'], PII_DATA_TYPE::EMAIL);
    $this->assertNull($result);
  }

  public function testGetNormalizedAndHashedPIIWithInvalidEmail()
  {
    // Invalid email should result in null normalization, then null result
    $invalidEmail = 'invalid-email';
    $result = PIIUtils::getNormalizedAndHashedPII($invalidEmail, PII_DATA_TYPE::EMAIL);
    $this->assertNull($result);
  }

  public function testGetNormalizedAndHashedPIIWithInvalidPhone()
  {
    // Invalid phone gets normalized to digits only, then hashed
    $invalidPhone = 'abc123';
    $expectedHash = hash('sha256', '123') . '.' . $this->appendix_net_new; // Only digits remain
    $result = PIIUtils::getNormalizedAndHashedPII($invalidPhone, PII_DATA_TYPE::PHONE);
    $this->assertEquals($expectedHash, $result);
  }

  public function testGetNormalizedAndHashedPIIWithInvalidDOB()
  {
    // Invalid DOB should result in null normalization, then null result
    $invalidDOB = 'invalid-date';
    $result = PIIUtils::getNormalizedAndHashedPII($invalidDOB, PII_DATA_TYPE::DATE_OF_BIRTH);
    $this->assertNull($result);
  }

  public function testGetNormalizedAndHashedPIIWithValidDOB()
  {
    $dob = '01/15/1990';
    $expectedHash = hash('sha256', '19900115') . '.' . $this->appendix_net_new;
    $result = PIIUtils::getNormalizedAndHashedPII($dob, PII_DATA_TYPE::DATE_OF_BIRTH);
    $this->assertEquals($expectedHash, $result);
  }

  public function testGetNormalizedAndHashedPIIWithValidGender()
  {
    $gender = '  Female  ';
    $expectedHash = hash('sha256', 'f') . '.' . $this->appendix_net_new;
    $result = PIIUtils::getNormalizedAndHashedPII($gender, PII_DATA_TYPE::GENDER);
    $this->assertEquals($expectedHash, $result);
  }

  public function testGetNormalizedAndHashedPIIWithValidCity()
  {
    $city = '  San Francisco  ';
    $expectedHash = hash('sha256', 'sanfrancisco') . '.' . $this->appendix_net_new;
    $result = PIIUtils::getNormalizedAndHashedPII($city, PII_DATA_TYPE::CITY);
    $this->assertEquals($expectedHash, $result);
  }

  public function testGetNormalizedAndHashedPIIWithValidState()
  {
    $state = '  New York  ';
    $expectedHash = hash('sha256', 'ny') . '.' . $this->appendix_net_new;
    $result = PIIUtils::getNormalizedAndHashedPII($state, PII_DATA_TYPE::STATE);
    $this->assertEquals($expectedHash, $result);
  }

  public function testGetNormalizedAndHashedPIIWithValidCountry()
  {
    $country = '  Germany  ';
    $expectedHash = hash('sha256', 'de') . '.' . $this->appendix_net_new;
    $result = PIIUtils::getNormalizedAndHashedPII($country, PII_DATA_TYPE::COUNTRY);
    $this->assertEquals($expectedHash, $result);
  }

  public function testGetNormalizedAndHashedPIIWithValidExternalID()
  {
    $externalId = '  Customer123  ';
    $expectedHash = hash('sha256', 'customer123') . '.' . $this->appendix_net_new;
    $result = PIIUtils::getNormalizedAndHashedPII($externalId, PII_DATA_TYPE::EXTERNAL_ID);
    $this->assertEquals($expectedHash, $result);
  }

  public function testGetNormalizedAndHashedPIIWithValidZipCode()
  {
    $zipCode = '  90210-1234  ';
    $expectedHash = hash('sha256', '90210') . '.' . $this->appendix_net_new;
    $result = PIIUtils::getNormalizedAndHashedPII($zipCode, PII_DATA_TYPE::ZIP_CODE);
    $this->assertEquals($expectedHash, $result);
  }

  public function testGetNormalizedAndHashedPIIWithHashThatLooksLikeHex()
  {
    // String that looks like hex but isn't a valid hash length - should be treated as regular input
    $notAHash = 'abcdef123456';
    $expectedHash = hash('sha256', $notAHash) . '.' . $this->appendix_net_new; // Should be treated as regular input with net_new appendix
    $result = PIIUtils::getNormalizedAndHashedPII($notAHash, PII_DATA_TYPE::EXTERNAL_ID);
    $this->assertEquals($expectedHash, $result);
  }

  public function testGetNormalizedAndHashedPIIWithSha1Hash()
  {
    // SHA1 hash (40 hex characters) - not recognized as hash, should be treated as regular input
    $sha1Hash = 'da39a3ee5e6b4b0d3255bfef95601890afd80709';
    $expectedHash = hash('sha256', $sha1Hash) . '.' . $this->appendix_net_new; // Should be treated as regular input with net_new appendix
    $result = PIIUtils::getNormalizedAndHashedPII($sha1Hash, PII_DATA_TYPE::EXTERNAL_ID);
    $this->assertEquals($expectedHash, $result);
  }

  public function testGetNormalizedAndHashedPIIHashOutputFormat()
  {
    // Verify that the hash output is always 64 characters + '.$appendix' = 73 characters (SHA256 + appendix)
    $input = 'test@example.com';
    $result = PIIUtils::getNormalizedAndHashedPII($input, PII_DATA_TYPE::EMAIL);
    $this->assertEquals(73, strlen($result));
    $this->assertRegExp('/^[a-f0-9]{64}\.' . preg_quote($this->appendix_net_new, '/') . '$/', $result);
  }

  public function testGetNormalizedAndHashedPIIConsistentHashing()
  {
    // Verify that the same input always produces the same hash
    $input = 'test@example.com';
    $result1 = PIIUtils::getNormalizedAndHashedPII($input, PII_DATA_TYPE::EMAIL);
    $result2 = PIIUtils::getNormalizedAndHashedPII($input, PII_DATA_TYPE::EMAIL);
    $this->assertEquals($result1, $result2);
  }

  public function testGetNormalizedAndHashedPIIDifferentInputsDifferentHashes()
  {
    // Verify that different inputs produce different hashes
    $input1 = 'test1@example.com';
    $input2 = 'test2@example.com';
    $result1 = PIIUtils::getNormalizedAndHashedPII($input1, PII_DATA_TYPE::EMAIL);
    $result2 = PIIUtils::getNormalizedAndHashedPII($input2, PII_DATA_TYPE::EMAIL);
    $this->assertNotEquals($result1, $result2);
  }

  public function testGetNormalizedAndHashedPIIWithComplexInput()
  {
    // Test with complex input that requires normalization
    $email = '  Test.User+Tag@EXAMPLE.COM  ';
    $normalizedEmail = 'test.user+tag@example.com';
    $expectedHash = hash('sha256', $normalizedEmail) . '.' . $this->appendix_net_new;
    $result = PIIUtils::getNormalizedAndHashedPII($email, PII_DATA_TYPE::EMAIL);
    $this->assertEquals($expectedHash, $result);
  }
}
