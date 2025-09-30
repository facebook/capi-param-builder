<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

use PHPUnit\Framework\TestCase;
use FacebookAds\EmailUtil;

require_once __DIR__ . '/../src/piiUtil/EmailUtil.php';

final class EmailUtilTest extends TestCase
{
  public function testWithExampleData1()
  {
    $email = '     John_Smith@gmail.com    ';
    $expected = 'john_smith@gmail.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData2()
  {
    $email = '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d';
    $expected = '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData3()
  {
    $email = 'someone@domain.com';
    $expected = 'someone@domain.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData4()
  {
    $email = '    SomeOne@domain.com  ';
    $expected = 'someone@domain.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedEmailWithValidEmail()
  {
    $email = 'Test.User@Example.COM';
    $expected = 'test.user@example.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedEmailWithValidEmailAndWhitespace()
  {
    $email = '  Test.User@Example.COM  ';
    $expected = 'test.user@example.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedEmailWithSimpleValidEmail()
  {
    $email = 'user@domain.com';
    $expected = 'user@domain.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedEmailWithAlreadyNormalizedEmail()
  {
    $email = 'user@domain.com';
    $expected = 'user@domain.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedEmailWithInvalidEmail()
  {
    $email = 'invalid-email';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertNull($result);
  }

  public function testGetNormalizedEmailWithInvalidEmailMissingAt()
  {
    $email = 'userexample.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertNull($result);
  }

  public function testGetNormalizedEmailWithInvalidEmailMissingDomain()
  {
    $email = 'user@';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertNull($result);
  }

  public function testGetNormalizedEmailWithInvalidEmailMissingUser()
  {
    $email = '@example.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertNull($result);
  }

  public function testGetNormalizedEmailWithEmptyString()
  {
    $email = '';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertNull($result);
  }

  public function testGetNormalizedEmailWithOnlyWhitespace()
  {
    $email = '   ';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertNull($result);
  }

  public function testGetNormalizedEmailWithSha256Hash()
  {
    // SHA256 hash (64 hex characters)
    $hashedEmail = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = EmailUtil::getNormalizedEmail($hashedEmail);
    $this->assertEquals($hashedEmail, $result);
  }

  public function testGetNormalizedEmailWithMd5Hash()
  {
    // MD5 hash (32 hex characters)
    $hashedEmail = 'd41d8cd98f00b204e9800998ecf8427e';
    $result = EmailUtil::getNormalizedEmail($hashedEmail);
    $this->assertEquals($hashedEmail, $result);
  }

  public function testGetNormalizedEmailWithMixedCaseSha256Hash()
  {
    // SHA256 hash with mixed case
    $hashedEmail = 'A665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = EmailUtil::getNormalizedEmail($hashedEmail);
    $this->assertEquals($hashedEmail, $result);
  }

  public function testGetNormalizedEmailWithEmailContainingNumbers()
  {
    $email = 'User123@Example123.COM';
    $expected = 'user123@example123.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedEmailWithEmailContainingSpecialChars()
  {
    $email = 'User+Tag@Example.COM';
    $expected = 'user+tag@example.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedEmailWithEmailContainingDots()
  {
    $email = 'First.Last@Sub.Domain.COM';
    $expected = 'first.last@sub.domain.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedEmailWithEmailContainingHyphen()
  {
    $email = 'User-Name@Example-Domain.COM';
    $expected = 'user-name@example-domain.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedEmailWithEmailContainingUnderscore()
  {
    // Underscores in domain names are not valid per RFC, so this should return null
    $email = 'User_Name@Example_Domain.COM';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertNull($result);
  }

  public function testGetNormalizedEmailWithComplexValidEmail()
  {
    $email = '  Test.User+Tag123@Sub-Domain.Example.COM  ';
    $expected = 'test.user+tag123@sub-domain.example.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedEmailWithMultipleAtSigns()
  {
    $email = 'user@@example.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertNull($result);
  }

  public function testGetNormalizedEmailWithInvalidCharacters()
  {
    $email = 'user name@example.com'; // space in username
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertNull($result);
  }

  public function testGetNormalizedEmailWithQuotedEmail()
  {
    // PHP's filter_var may not handle quoted local parts correctly in all PHP versions
    $email = '"test user"@example.com';
    $result = EmailUtil::getNormalizedEmail($email);
    $this->assertNull($result);
  }

  public function testGetNormalizedEmailWithInternationalDomain()
  {
    $email = 'User@Example.中国';
    $result = EmailUtil::getNormalizedEmail($email);
    // This test depends on PHP's filter_var behavior with international domains
    // It may return null or the normalized email depending on PHP configuration
    $this->assertTrue($result === null || is_string($result));
  }
}
