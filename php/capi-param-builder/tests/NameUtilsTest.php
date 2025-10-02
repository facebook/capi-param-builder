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

final class NameUtilsTest extends TestCase
{
  public function testWithExampleData1()
  {
    $name = 'John';
    $expected = 'john';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData2()
  {
    $name = "    Na'than-Boile    ";
    $expected = 'nathanboile';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData3()
  {
    $name = '정';
    $expected = '정';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData4()
  {
    $name = 'Valéry';
    $expected = 'valéry';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData5()
  {
    $name = 'Doe';
    $expected = 'doe';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData6()
  {
    $name = '    Doe-Doe    ';
    $expected = 'doedoe';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithSimpleName()
  {
    $name = 'John';
    $expected = 'john';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithFullName()
  {
    $name = 'John Smith';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithUpperCase()
  {
    $name = 'JOHN SMITH';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithMixedCase()
  {
    $name = 'JoHn SmItH';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithLowerCase()
  {
    $name = 'john smith';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithLeadingWhitespace()
  {
    $name = '   John Smith';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithTrailingWhitespace()
  {
    $name = 'John Smith   ';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithMultipleSpaces()
  {
    $name = 'John    Smith';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithTabs()
  {
    $name = "John\tSmith";
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithNewlines()
  {
    $name = "John\nSmith";
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithHyphen()
  {
    $name = 'Mary-Jane';
    $expected = 'maryjane';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithApostrophe()
  {
    $name = "O'Connor";
    $expected = 'oconnor';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithDot()
  {
    $name = 'John.Smith';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithComma()
  {
    $name = 'Smith, John';
    $expected = 'smithjohn';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithMultiplePunctuation()
  {
    $name = 'O\'Brien-Smith, Jr.';
    $expected = 'obriensmithjr';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithParentheses()
  {
    $name = 'John (Johnny) Smith';
    $expected = 'johnjohnnysmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithBrackets()
  {
    $name = 'John [Jack] Smith';
    $expected = 'johnjacksmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithSpecialCharacters()
  {
    $name = 'John@#$%Smith';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithNumbers()
  {
    $name = 'John2Smith3';
    $expected = 'john2smith3';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithUnicodeCharacters()
  {
    $name = 'José María';
    $expected = 'josémaría';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithAccentedCharacters()
  {
    $name = 'François Müller';
    $expected = 'françoismüller';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithAsianCharacters()
  {
    $name = '李小明';
    $expected = '李小明';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithArabicCharacters()
  {
    $name = 'محمد علي';
    $expected = 'محمدعلي';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithEmptyString()
  {
    $name = '';
    $expected = '';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithOnlyWhitespace()
  {
    $name = '   ';
    $expected = '';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithOnlyPunctuation()
  {
    $name = '!@#$%^&*()';
    $expected = '';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithSha256Hash()
  {
    // SHA256 hash (64 hex characters)
    $hashedName = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = StringUtils::getNormalizedName($hashedName);
    $this->assertEquals($hashedName, $result);
  }

  public function testGetNormalizedNameWithMd5Hash()
  {
    // MD5 hash (32 hex characters)
    $hashedName = 'd41d8cd98f00b204e9800998ecf8427e';
    $result = StringUtils::getNormalizedName($hashedName);
    $this->assertEquals($hashedName, $result);
  }

  public function testGetNormalizedNameWithMixedCaseSha256Hash()
  {
    // SHA256 hash with mixed case
    $hashedName = 'A665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = StringUtils::getNormalizedName($hashedName);
    $this->assertEquals($hashedName, $result);
  }

  public function testGetNormalizedNameWithThreePartName()
  {
    $name = 'John Michael Smith';
    $expected = 'johnmichaelsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithTitle()
  {
    $name = 'Dr. John Smith';
    $expected = 'drjohnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithSuffix()
  {
    $name = 'John Smith Jr.';
    $expected = 'johnsmithjr';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithMultipleHyphens()
  {
    $name = 'Mary-Jane-Smith';
    $expected = 'maryjanesmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithUnderscores()
  {
    $name = 'John_Smith';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithSlashes()
  {
    $name = 'John/Jane Smith';
    $expected = 'johnjanesmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithColons()
  {
    $name = 'John:Smith';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithSemicolons()
  {
    $name = 'John;Smith';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithQuotes()
  {
    $name = '"John Smith"';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithSingleQuotes()
  {
    $name = "'John Smith'";
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithBackticks()
  {
    $name = '`John Smith`';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithCurlyBraces()
  {
    $name = '{John Smith}';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithPipe()
  {
    $name = 'John|Smith';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithTilde()
  {
    $name = 'John~Smith';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithComplexPunctuation()
  {
    $name = 'O\'Brien-MacDonald, Jr. (Johnny)';
    $expected = 'obrienmacdonaldjrjohnny';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithConsecutivePunctuation()
  {
    $name = 'John!!!Smith???';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithSingleCharacter()
  {
    $name = 'J';
    $expected = 'j';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithLongName()
  {
    $name = 'Wolfeschlegelsteinhausenbergerdorff';
    $expected = 'wolfeschlegelsteinhausenbergerdorff';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithMixedWhitespaceAndPunctuation()
  {
    $name = '  John , , Smith  ! ! ';
    $expected = 'johnsmith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithNullInput()
  {
    $name = null;
    $result = StringUtils::getNormalizedName($name);
    $this->assertNull($result);
  }

  public function testGetNormalizedNameWithNumericString()
  {
    $name = '123456';
    $expected = '123456';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedNameWithAlphanumeric()
  {
    $name = 'John123Smith';
    $expected = 'john123smith';
    $result = StringUtils::getNormalizedName($name);
    $this->assertEquals($expected, $result);
  }
}
