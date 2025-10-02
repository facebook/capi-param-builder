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

final class CityUtilsTest extends TestCase
{
  public function testWithExampleData1()
  {
    $city = 'London';
    $expected = 'london';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData2()
  {
    $city = 'Menlo Park';
    $expected = 'menlopark';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData3()
  {
    $city = '    Menlo-Park  ';
    $expected = 'menlopark';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithSimpleCity()
  {
    $city = 'Boston';
    $expected = 'boston';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithTwoWordCity()
  {
    $city = 'Las Vegas';
    $expected = 'lasvegas';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithUpperCase()
  {
    $city = 'CHICAGO';
    $expected = 'chicago';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithMixedCase()
  {
    $city = 'SeAtTlE';
    $expected = 'seattle';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithLowerCase()
  {
    $city = 'miami';
    $expected = 'miami';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithLeadingWhitespace()
  {
    $city = '   Denver';
    $expected = 'denver';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithTrailingWhitespace()
  {
    $city = 'Portland   ';
    $expected = 'portland';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithMultipleSpaces()
  {
    $city = 'Salt    Lake    City';
    $expected = 'saltlakecity';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithTabs()
  {
    $city = "New\tOrleans";
    $expected = 'neworleans';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithNewlines()
  {
    $city = "San\nDiego";
    $expected = 'sandiego';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithHyphen()
  {
    $city = 'Winston-Salem';
    $expected = 'winstonsalem';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithApostrophe()
  {
    $city = "Coeur d'Alene";
    $expected = 'coeurdalene';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithDot()
  {
    $city = 'St. Louis';
    $expected = 'stlouis';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithComma()
  {
    $city = 'City, State';
    $expected = 'citystate';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithMultiplePunctuation()
  {
    $city = 'St. Mary\'s-on-the-Hill';
    $expected = 'stmarysonthehill';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithParentheses()
  {
    $city = 'City (Township)';
    $expected = 'citytownship';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithBrackets()
  {
    $city = 'City [County]';
    $expected = 'citycounty';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithSpecialCharacters()
  {
    $city = 'City@#$%Name';
    $expected = 'cityname';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithNumbers()
  {
    $city = 'City123';
    $expected = 'city123';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithNumbersAndLetters()
  {
    $city = 'Area51City';
    $expected = 'area51city';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithAccentedCharacters()
  {
    $city = 'São Paulo';
    $expected = 'sopaulo';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithGermanUmlaut()
  {
    $city = 'München';
    $expected = 'mnchen';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithFrenchAccents()
  {
    $city = 'Montréal';
    $expected = 'montral';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithStartingWithNumber()
  {
    $city = '123 Main City';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertNull($result);
  }

  public function testGetNormalizedCityWithOnlyNumbers()
  {
    $city = '123456';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertNull($result);
  }

  public function testGetNormalizedCityWithNumbersFirst()
  {
    $city = '1st Avenue City';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertNull($result);
  }

  public function testGetNormalizedCityWithEmptyString()
  {
    $city = '';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertNull($result);
  }

  public function testGetNormalizedCityWithOnlyWhitespace()
  {
    $city = '   ';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertNull($result);
  }

  public function testGetNormalizedCityWithOnlyPunctuation()
  {
    $city = '!@#$%^&*()';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertNull($result);
  }

  public function testGetNormalizedCityWithOnlySpecialCharacters()
  {
    $city = '---...___';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertNull($result);
  }

  public function testGetNormalizedCityWithSha256Hash()
  {
    // SHA256 hash (64 hex characters)
    $hashedCity = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = StringUtils::getNormalizedCity($hashedCity);
    $this->assertEquals($hashedCity, $result);
  }

  public function testGetNormalizedCityWithMd5Hash()
  {
    // MD5 hash (32 hex characters)
    $hashedCity = 'd41d8cd98f00b204e9800998ecf8427e';
    $result = StringUtils::getNormalizedCity($hashedCity);
    $this->assertEquals($hashedCity, $result);
  }

  public function testGetNormalizedCityWithMixedCaseSha256Hash()
  {
    // SHA256 hash with mixed case
    $hashedCity = 'A665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = StringUtils::getNormalizedCity($hashedCity);
    $this->assertEquals($hashedCity, $result);
  }

  public function testGetNormalizedCityWithThreeWordCity()
  {
    $city = 'New York City';
    $expected = 'newyorkcity';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithDirection()
  {
    $city = 'North Miami Beach';
    $expected = 'northmiamibeach';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithSaintAbbreviation()
  {
    $city = 'St. Petersburg';
    $expected = 'stpetersburg';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithMultipleHyphens()
  {
    $city = 'Wilkes-Barre-Scranton';
    $expected = 'wilkesbarrescranton';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithUnderscores()
  {
    $city = 'City_Name';
    $expected = 'cityname';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithSlashes()
  {
    $city = 'Minneapolis/St. Paul';
    $expected = 'minneapolisstpaul';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithColons()
  {
    $city = 'City:Name';
    $expected = 'cityname';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithSemicolons()
  {
    $city = 'City;Name';
    $expected = 'cityname';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithQuotes()
  {
    $city = '"City Name"';
    $expected = 'cityname';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithSingleQuotes()
  {
    $city = "'City Name'";
    $expected = 'cityname';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithBackticks()
  {
    $city = '`City Name`';
    $expected = 'cityname';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithCurlyBraces()
  {
    $city = '{City Name}';
    $expected = 'cityname';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithPipe()
  {
    $city = 'City|Name';
    $expected = 'cityname';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithTilde()
  {
    $city = 'City~Name';
    $expected = 'cityname';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithComplexPunctuation()
  {
    $city = 'St. Mary\'s-on-the-Sea, Inc.';
    $expected = 'stmarysontheseainc';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithConsecutivePunctuation()
  {
    $city = 'City!!!Name???';
    $expected = 'cityname';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithSingleCharacter()
  {
    $city = 'A';
    $expected = 'a';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithLongName()
  {
    $city = 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch';
    $expected = 'llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithMixedWhitespaceAndPunctuation()
  {
    $city = '  City , , Name  ! ! ';
    $expected = 'cityname';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithNullInput()
  {
    $city = null;
    $result = StringUtils::getNormalizedCity($city);
    $this->assertNull($result);
  }

  public function testGetNormalizedCityWithAsianCharacters()
  {
    $city = '北京'; // Beijing in Chinese
    $result = StringUtils::getNormalizedCity($city);
    $this->assertNull($result); // Non-Latin characters are stripped, leaving nothing
  }

  public function testGetNormalizedCityWithArabicCharacters()
  {
    $city = 'القاهرة'; // Cairo in Arabic
    $result = StringUtils::getNormalizedCity($city);
    $this->assertNull($result); // Non-Latin characters are stripped, leaving nothing
  }

  public function testGetNormalizedCityWithMixedLatinAndNonLatin()
  {
    $city = 'New北京York';
    $expected = 'newyork';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithAlphanumeric()
  {
    $city = 'City123Name456';
    $expected = 'city123name456';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithLeadingNumbers()
  {
    $city = '123ABC';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertNull($result); // Starts with numbers, fails regex test
  }

  public function testGetNormalizedCityWithNumbersInMiddle()
  {
    $city = 'ABC123DEF';
    $expected = 'abc123def';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithSpacesAroundNumbers()
  {
    $city = 'City 123 Name';
    $expected = 'city123name';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedCityWithPunctuationAndNumbers()
  {
    $city = 'City-123-Name';
    $expected = 'city123name';
    $result = StringUtils::getNormalizedCity($city);
    $this->assertEquals($expected, $result);
  }
}
