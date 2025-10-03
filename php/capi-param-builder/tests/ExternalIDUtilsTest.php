<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

use PHPUnit\Framework\TestCase;
use FacebookAds\StringUtils;

require_once __DIR__ . '/../src/piiUtil/StringUtils.php';

final class ExternalIDUtilsTest extends TestCase
{
  public function testWithExampleData1()
  {
    $externalId = ' 12345';
    $expected = '12345';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData2()
  {
    $externalId = 'abc-12345';
    $expected = 'abc-12345';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithSimpleId()
  {
    $externalId = 'user123';
    $expected = 'user123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithUpperCase()
  {
    $externalId = 'USER123';
    $expected = 'user123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithMixedCase()
  {
    $externalId = 'UsEr123';
    $expected = 'user123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithLowerCase()
  {
    $externalId = 'customer456';
    $expected = 'customer456';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithLeadingWhitespace()
  {
    $externalId = '   user123';
    $expected = 'user123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithTrailingWhitespace()
  {
    $externalId = 'user123   ';
    $expected = 'user123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithSurroundingWhitespace()
  {
    $externalId = '  user123  ';
    $expected = 'user123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithMultipleSpaces()
  {
    $externalId = 'user   123';
    $expected = 'user123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithTabs()
  {
    $externalId = "\tuser123\t";
    $expected = 'user123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithNewlines()
  {
    $externalId = "\nuser123\n";
    $expected = 'user123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithMixedWhitespace()
  {
    $externalId = " \t\n user123 \t\n ";
    $expected = 'user123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithHyphen()
  {
    $externalId = 'user-123';
    $expected = 'user-123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithUnderscore()
  {
    $externalId = 'user_123';
    $expected = 'user_123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithDots()
  {
    $externalId = 'user.123';
    $expected = 'user.123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithSpecialCharacters()
  {
    $externalId = 'user@domain.com';
    $expected = 'user@domain.com';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithPunctuation()
  {
    $externalId = 'user,123!';
    $expected = 'user,123!';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithParentheses()
  {
    $externalId = 'user(123)';
    $expected = 'user(123)';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithBrackets()
  {
    $externalId = 'user[123]';
    $expected = 'user[123]';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithCurlyBraces()
  {
    $externalId = 'user{123}';
    $expected = 'user{123}';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithSlashes()
  {
    $externalId = 'user/123\\456';
    $expected = 'user/123\\456';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithColonsSemicolons()
  {
    $externalId = 'user:123;456';
    $expected = 'user:123;456';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithQuotes()
  {
    $externalId = '"user\'123"';
    $expected = '"user\'123"';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithNumbers()
  {
    $externalId = '123456789';
    $expected = '123456789';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithAlphanumeric()
  {
    $externalId = 'User123ABC456def';
    $expected = 'user123abc456def';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithUUID()
  {
    $externalId = '550e8400-e29b-41d4-a716-446655440000';
    $expected = '550e8400-e29b-41d4-a716-446655440000';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithUpperCaseUUID()
  {
    $externalId = '550E8400-E29B-41D4-A716-446655440000';
    $expected = '550e8400-e29b-41d4-a716-446655440000';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithGUID()
  {
    $externalId = '{12345678-1234-5678-9012-123456789012}';
    $expected = '{12345678-1234-5678-9012-123456789012}';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithEmailFormat()
  {
    $externalId = 'user@example.com';
    $expected = 'user@example.com';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithMixedCaseEmail()
  {
    $externalId = 'User@Example.COM';
    $expected = 'user@example.com';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithUrl()
  {
    $externalId = 'https://example.com/user/123';
    $expected = 'https://example.com/user/123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithBase64Like()
  {
    $externalId = 'dXNlcjEyMw==';
    $expected = 'dxnlcjeymw=='; // Corrected expectation
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithPhoneNumber()
  {
    $externalId = '+1-555-123-4567';
    $expected = '+1-555-123-4567';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithComplexId()
  {
    $externalId = 'Company_User-123.456@domain.com';
    $expected = 'company_user-123.456@domain.com';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithUnicodeCharacters()
  {
    $externalId = 'Üser123';
    $expected = 'üser123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithAccentedCharacters()
  {
    $externalId = 'Frédéric123';
    $expected = 'frédéric123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithAsianCharacters()
  {
    $externalId = 'ユーザー123';
    $expected = 'ユーザー123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithArabicCharacters()
  {
    $externalId = 'مستخدم123';
    $expected = 'مستخدم123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithEmoji()
  {
    $externalId = 'user👤123';
    $expected = 'user👤123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithEmptyString()
  {
    $externalId = '';
    $expected = '';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithOnlyWhitespace()
  {
    $externalId = '   ';
    $expected = '';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithOnlyTabs()
  {
    $externalId = "\t\t\t";
    $expected = '';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithOnlyNewlines()
  {
    $externalId = "\n\n\n";
    $expected = '';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithMixedWhitespaceOnly()
  {
    $externalId = " \t\n\r ";
    $expected = '';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithNullInput()
  {
    $externalId = null;
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertNull($result);
  }

  public function testGetNormalizedExternalIDWithSha256Hash()
  {
    // SHA256 hash (64 hex characters)
    $hashedExternalId = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = StringUtils::getNormalizedExternalID($hashedExternalId);
    $this->assertEquals($hashedExternalId, $result);
  }

  public function testGetNormalizedExternalIDWithMd5Hash()
  {
    // MD5 hash (32 hex characters)
    $hashedExternalId = 'd41d8cd98f00b204e9800998ecf8427e';
    $result = StringUtils::getNormalizedExternalID($hashedExternalId);
    $this->assertEquals($hashedExternalId, $result);
  }

  public function testGetNormalizedExternalIDWithMixedCaseSha256Hash()
  {
    // SHA256 hash with mixed case
    $hashedExternalId = 'A665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = StringUtils::getNormalizedExternalID($hashedExternalId);
    $this->assertEquals($hashedExternalId, $result);
  }

  public function testGetNormalizedExternalIDWithSha1Hash()
  {
    // SHA1 hash (40 hex characters)
    $hashedExternalId = 'da39a3ee5e6b4b0d3255bfef95601890afd80709';
    $result = StringUtils::getNormalizedExternalID($hashedExternalId);
    $this->assertEquals($hashedExternalId, $result);
  }

  public function testGetNormalizedExternalIDWithSha256HashUppercase()
  {
    // SHA256 hash in uppercase
    $hashedExternalId = 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
    $result = StringUtils::getNormalizedExternalID($hashedExternalId);
    $this->assertEquals($hashedExternalId, $result);
  }

  public function testGetNormalizedExternalIDWithHashLikeButNotHash()
  {
    // Looks like a hash but has non-hex characters
    $notAHash = 'a665a45920422f9g417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $expected = 'a665a45920422f9g417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = StringUtils::getNormalizedExternalID($notAHash);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithShortHex()
  {
    // Short hex string (not a standard hash length)
    $shortHex = 'abc123def456';
    $expected = 'abc123def456';
    $result = StringUtils::getNormalizedExternalID($shortHex);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithLongString()
  {
    $longId = 'very_long_external_id_with_many_characters_and_underscores_and_numbers_123456789';
    $expected = 'very_long_external_id_with_many_characters_and_underscores_and_numbers_123456789';
    $result = StringUtils::getNormalizedExternalID($longId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithSingleCharacter()
  {
    $externalId = 'A';
    $expected = 'a';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithSingleNumber()
  {
    $externalId = '9';
    $expected = '9';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithJSONLike()
  {
    $externalId = '{"userId": 123, "company": "ABC"}';
    $expected = '{"userid":123,"company":"abc"}'; // Spaces are removed
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithXMLLike()
  {
    $externalId = '<userId>123</userId>';
    $expected = '<userid>123</userid>';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithBase64Padding()
  {
    $externalId = 'SGVsbG8gV29ybGQ=';
    $expected = 'sgvsbg8gv29ybgq=';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithJWT()
  {
    $jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    $expected = 'eyjhbgcioijiuzi1niisinr5cci6ikpxvcj9.eyjzdwiioiixmjm0nty3odkwiiwibmftzsi6ikpvag4grg9liiwiawf0ijoxnte2mjm5mdiyfq.sflkxwrjsmekkf2qt4fwpmejf36pok6yjv_adqssw5c';
    $result = StringUtils::getNormalizedExternalID($jwt);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithVersionedId()
  {
    $externalId = 'v2.USER.123.ABC';
    $expected = 'v2.user.123.abc';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithNamespacedId()
  {
    $externalId = 'com.company.app::user::123';
    $expected = 'com.company.app::user::123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithDatabaseId()
  {
    $externalId = 'db1.table1.user_id_123';
    $expected = 'db1.table1.user_id_123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithMixedCaseDatabaseId()
  {
    $externalId = 'DB1.TABLE1.USER_ID_123';
    $expected = 'db1.table1.user_id_123';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithConsecutiveWhitespace()
  {
    $externalId = "user\t\t  \n\n  123";
    $expected = 'user123'; // All whitespace is removed
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithLeadingTrailingAndInternalWhitespace()
  {
    $externalId = "  \t user 123 abc \n  ";
    $expected = 'user123abc'; // All whitespace is removed
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithOnlySpecialCharacters()
  {
    $externalId = '!@#$%^&*()';
    $expected = '!@#$%^&*()';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithHexWithPrefix()
  {
    $externalId = '0x123ABC';
    $expected = '0x123abc';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithBinaryPrefix()
  {
    $externalId = '0b101010';
    $expected = '0b101010';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedExternalIDWithOctalPrefix()
  {
    $externalId = '0o777';
    $expected = '0o777';
    $result = StringUtils::getNormalizedExternalID($externalId);
    $this->assertEquals($expected, $result);
  }
}
