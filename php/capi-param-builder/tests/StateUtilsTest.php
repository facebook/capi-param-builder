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

final class StateUtilsTest extends TestCase
{
  public function testWithExampleData1()
  {
    $state = '    California.   ';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData2()
  {
    $state = 'CA';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData3()
  {
    $state = '  TE';
    $expected = 'te';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData4()
  {
    $state = '    C/a/lifo,rnia.  ';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  // US States - Full Names
  public function testGetNormalizedStateWithUSStateFullNames()
  {
    $testCases = [
      ['Alabama', 'al'],
      ['Alaska', 'ak'],
      ['Arizona', 'az'],
      ['Arkansas', 'ar'],
      ['California', 'ca'],
      ['Colorado', 'co'],
      ['Connecticut', 'ct'],
      ['Delaware', 'de'],
      ['Florida', 'fl'],
      ['Georgia', 'ga'],
      ['Hawaii', 'hi'],
      ['Idaho', 'id'],
      ['Illinois', 'il'],
      ['Indiana', 'in'],
      ['Iowa', 'ia'],
      ['Kansas', 'ks'],
      ['Kentucky', 'ky'],
      ['Louisiana', 'la'],
      ['Maine', 'me'],
      ['Maryland', 'md'],
      ['Massachusetts', 'ma'],
      ['Michigan', 'mi'],
      ['Minnesota', 'mn'],
      ['Mississippi', 'ms'],
      ['Missouri', 'mo'],
      ['Montana', 'mt'],
      ['Nebraska', 'ne'],
      ['Nevada', 'nv'],
      ['New Hampshire', 'nh'],
      ['New Jersey', 'nj'],
      ['New Mexico', 'nm'],
      ['New York', 'ny'],
      ['North Carolina', 'nc'],
      ['North Dakota', 'nd'],
      ['Ohio', 'oh'],
      ['Oklahoma', 'ok'],
      ['Oregon', 'or'],
      ['Pennsylvania', 'pa'],
      ['Rhode Island', 'ri'],
      ['South Carolina', 'sc'],
      ['South Dakota', 'sd'],
      ['Tennessee', 'tn'],
      ['Texas', 'tx'],
      ['Utah', 'ut'],
      ['Vermont', 'vt'],
      ['Virginia', 'va'],
      ['Washington', 'wa'],
      ['West Virginia', 'wv'],
      ['Wisconsin', 'wi'],
      ['Wyoming', 'wy']
    ];

    foreach ($testCases as $testCase) {
      $input = $testCase[0];
      $expected = $testCase[1];
      $result = StringUtils::getNormalizedState($input);
      $this->assertEquals($expected, $result, "Failed for US state: $input");
    }
  }

  // Canadian Provinces - Full Names
  public function testGetNormalizedStateWithCanadianProvinceFullNames()
  {
    $testCases = [
      ['Ontario', 'on'],
      ['Quebec', 'qc'],
      ['British Columbia', 'bc'],
      ['Alberta', 'ab'],
      ['Saskatchewan', 'sk'],
      ['Manitoba', 'mb'],
      ['Nova Scotia', 'ns'],
      ['New Brunswick', 'nb'],
      ['Prince Edward Island', 'pe'],
      ['Newfoundland and Labrador', 'nl'],
      ['Yukon', 'yt'],
      ['Northwest Territories', 'nt'],
      ['Nunavut', 'nu']
    ];

    foreach ($testCases as $testCase) {
      $input = $testCase[0];
      $expected = $testCase[1];
      $result = StringUtils::getNormalizedState($input);
      $this->assertEquals($expected, $result, "Failed for Canadian province: $input");
    }
  }

  // US States - Abbreviations
  public function testGetNormalizedStateWithUSStateAbbreviations()
  {
    $testCases = [
      ['AL', 'al'],
      ['AK', 'ak'],
      ['AZ', 'az'],
      ['AR', 'ar'],
      ['CA', 'ca'],
      ['CO', 'co'],
      ['CT', 'ct'],
      ['DE', 'de'],
      ['FL', 'fl'],
      ['GA', 'ga'],
      ['HI', 'hi'],
      ['ID', 'id'],
      ['IL', 'il'],
      ['IN', 'in'],
      ['IA', 'ia'],
      ['KS', 'ks'],
      ['KY', 'ky'],
      ['LA', 'la'],
      ['ME', 'me'],
      ['MD', 'md'],
      ['MA', 'ma'],
      ['MI', 'mi'],
      ['MN', 'mn'],
      ['MS', 'ms'],
      ['MO', 'mo'],
      ['MT', 'mt'],
      ['NE', 'ne'],
      ['NV', 'nv'],
      ['NH', 'nh'],
      ['NJ', 'nj'],
      ['NM', 'nm'],
      ['NY', 'ny'],
      ['NC', 'nc'],
      ['ND', 'nd'],
      ['OH', 'oh'],
      ['OK', 'ok'],
      ['OR', 'or'],
      ['PA', 'pa'],
      ['RI', 'ri'],
      ['SC', 'sc'],
      ['SD', 'sd'],
      ['TN', 'tn'],
      ['TX', 'tx'],
      ['UT', 'ut'],
      ['VT', 'vt'],
      ['VA', 'va'],
      ['WA', 'wa'],
      ['WV', 'wv'],
      ['WI', 'wi'],
      ['WY', 'wy']
    ];

    foreach ($testCases as $testCase) {
      $input = $testCase[0];
      $expected = $testCase[1];
      $result = StringUtils::getNormalizedState($input);
      $this->assertEquals($expected, $result, "Failed for US abbreviation: $input");
    }
  }

  // Canadian Provinces - Abbreviations
  public function testGetNormalizedStateWithCanadianProvinceAbbreviations()
  {
    $testCases = [
      ['ON', 'on'],
      ['QC', 'qc'],
      ['BC', 'bc'],
      ['AB', 'ab'],
      ['SK', 'sk'],
      ['MB', 'mb'],
      ['NS', 'ns'],
      ['NB', 'nb'],
      ['PE', 'pe'],
      ['NL', 'nl'],
      ['YT', 'yt'],
      ['NT', 'nt'],
      ['NU', 'nu']
    ];

    foreach ($testCases as $testCase) {
      $input = $testCase[0];
      $expected = $testCase[1];
      $result = StringUtils::getNormalizedState($input);
      $this->assertEquals($expected, $result, "Failed for Canadian abbreviation: $input");
    }
  }

  public function testGetNormalizedStateWithLowerCaseInput()
  {
    $state = 'california';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithUpperCaseInput()
  {
    $state = 'CALIFORNIA';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithMixedCaseInput()
  {
    $state = 'CaLiFoRnIa';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithLeadingWhitespace()
  {
    $state = '   Texas';
    $expected = 'tx';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithTrailingWhitespace()
  {
    $state = 'Florida   ';
    $expected = 'fl';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithSurroundingWhitespace()
  {
    $state = '  New York  ';
    $expected = 'ny';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithMultipleSpaces()
  {
    $state = 'New    York';
    $expected = 'ny';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithTabs()
  {
    $state = "New\tYork";
    $expected = 'ny';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithNewlines()
  {
    $state = "New\nYork";
    $expected = 'ny';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithPunctuation()
  {
    $state = 'New-York';
    $expected = 'ny';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithDots()
  {
    $state = 'N.Y.';
    $expected = 'ny';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithSpecialCharacters()
  {
    $state = 'C@A#$%';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithValidTwoLetterCode()
  {
    $state = 'ca';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithInvalidTwoLetterCode()
  {
    $state = 'XX';
    $expected = 'xx';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithPartialMatch()
  {
    $state = 'InvalidState'; // Contains 'in' which matches 'indiana' => 'in'
    $expected = 'in';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithLongInvalidString()
  {
    $state = 'SomeRandomLongStateName';
    $expected = 'so'; // Truncated to 2 characters
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithEmptyString()
  {
    $state = '';
    $result = StringUtils::getNormalizedState($state);
    $this->assertNull($result);
  }

  public function testGetNormalizedStateWithOnlyWhitespace()
  {
    $state = '   ';
    $result = StringUtils::getNormalizedState($state);
    $this->assertNull($result);
  }

  public function testGetNormalizedStateWithOnlyPunctuation()
  {
    $state = '!@#$%^&*()';
    $result = StringUtils::getNormalizedState($state);
    $this->assertNull($result);
  }

  public function testGetNormalizedStateWithNullInput()
  {
    $state = null;
    $result = StringUtils::getNormalizedState($state);
    $this->assertNull($result);
  }

  public function testGetNormalizedStateWithNumbersOnly()
  {
    $state = '123';
    $result = StringUtils::getNormalizedState($state);
    $this->assertNull($result); // Starts with numbers, fails regex test
  }

  public function testGetNormalizedStateWithNumbersFirst()
  {
    $state = '123CA';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result); // Numbers are stripped, leaving 'ca'
  }

  public function testGetNormalizedStateWithNumbersInMiddle()
  {
    $state = 'CA123';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithSha256Hash()
  {
    // SHA256 hash (64 hex characters)
    $hashedState = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = StringUtils::getNormalizedState($hashedState);
    $this->assertEquals($hashedState, $result);
  }

  public function testGetNormalizedStateWithMd5Hash()
  {
    // MD5 hash (32 hex characters)
    $hashedState = 'd41d8cd98f00b204e9800998ecf8427e';
    $result = StringUtils::getNormalizedState($hashedState);
    $this->assertEquals($hashedState, $result);
  }

  public function testGetNormalizedStateWithMixedCaseSha256Hash()
  {
    // SHA256 hash with mixed case
    $hashedState = 'A665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = StringUtils::getNormalizedState($hashedState);
    $this->assertEquals($hashedState, $result);
  }

  public function testGetNormalizedStateWithAccentedCharacters()
  {
    $state = 'Québec';
    $expected = 'qu'; // Accents are stripped, becomes 'qubec', truncated to 'qu'
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithNonLatinCharacters()
  {
    $state = '加州'; // California in Chinese
    $result = StringUtils::getNormalizedState($state);
    $this->assertNull($result); // Non-Latin characters stripped, leaving nothing
  }

  public function testGetNormalizedStateWithMixedLatinAndNonLatin()
  {
    $state = 'CA加州';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithSingleCharacter()
  {
    $state = 'C';
    $expected = 'c';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithThreeCharacters()
  {
    $state = 'CAL';
    $expected = 'ca'; // Truncated to 2 characters
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithFourCharacters()
  {
    $state = 'CALI';
    $expected = 'ca'; // Truncated to 2 characters
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithComplexPunctuation()
  {
    $state = 'C.A.L.I.F.O.R.N.I.A.';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithConsecutivePunctuation()
  {
    $state = 'CA!!!???';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithUnderscores()
  {
    $state = 'New_York';
    $expected = 'ny';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithHyphens()
  {
    $state = 'New-York';
    $expected = 'ny';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithSlashes()
  {
    $state = 'CA/NY';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithParentheses()
  {
    $state = '(CA)';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithBrackets()
  {
    $state = '[CA]';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithQuotes()
  {
    $state = '"California"';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithSingleQuotes()
  {
    $state = "'California'";
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithBackticks()
  {
    $state = '`California`';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithCurlyBraces()
  {
    $state = '{California}';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithPipe()
  {
    $state = 'CA|NY';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithTilde()
  {
    $state = 'CA~NY';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithMixedWhitespaceAndPunctuation()
  {
    $state = '  C , A , L , I  ! ! ';
    $expected = 'ca';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  // Edge cases for partial matching
  public function testGetNormalizedStateWithGeorgiaMatch()
  {
    $state = 'George'; // Normalized to 'george', truncated to 'ge'
    $expected = 'ge';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithOregonMatch()
  {
    $state = 'Oregon State'; // Contains 'oregon' which should match => 'or'
    $expected = 'or';
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedStateWithNoMatch()
  {
    $state = 'XYZ';
    $expected = 'xy'; // No match found, falls back to lowercase + truncate
    $result = StringUtils::getNormalizedState($state);
    $this->assertEquals($expected, $result);
  }
}
