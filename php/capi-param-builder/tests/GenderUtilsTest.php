<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

use PHPUnit\Framework\TestCase;
use FacebookAds\GenderUtils;

require_once __DIR__ . '/../src/piiUtil/GenderUtils.php';

final class GenderUtilsTest extends TestCase
{
  public function testWithExampleData1()
  {
    $gender = 'male';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData2()
  {
    $gender = 'Male';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData3()
  {
    $gender = 'Boy';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData4()
  {
    $gender = 'M';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData5()
  {
    $gender = 'm';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData6()
  {
    $gender = 'Girl';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData7()
  {
    $gender = '        Woman         ';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData8()
  {
    $gender = 'Female';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testWithExampleData9()
  {
    $gender = 'female';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermM()
  {
    $gender = 'M';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermF()
  {
    $gender = 'F';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermMan()
  {
    $gender = 'man';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermWoman()
  {
    $gender = 'woman';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermMale()
  {
    $gender = 'male';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermFemale()
  {
    $gender = 'female';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermBoy()
  {
    $gender = 'boy';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermGirl()
  {
    $gender = 'girl';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermGentleman()
  {
    $gender = 'gentleman';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermLady()
  {
    $gender = 'lady';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermSir()
  {
    $gender = 'sir';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermMadam()
  {
    $gender = 'madam';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermFather()
  {
    $gender = 'father';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermMother()
  {
    $gender = 'mother';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermHusband()
  {
    $gender = 'husband';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermWife()
  {
    $gender = 'wife';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermKing()
  {
    $gender = 'king';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermQueen()
  {
    $gender = 'queen';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMalePronounHe()
  {
    $gender = 'he';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemalePronounShe()
  {
    $gender = 'she';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMalePronounHim()
  {
    $gender = 'him';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemalePronounHer()
  {
    $gender = 'her';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithUpperCaseMale()
  {
    $gender = 'MALE';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithUpperCaseFemale()
  {
    $gender = 'FEMALE';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMixedCaseMale()
  {
    $gender = 'MaLe';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMixedCaseFemale()
  {
    $gender = 'FeMaLe';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithWhitespaceMale()
  {
    $gender = '  male  ';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithWhitespaceFemale()
  {
    $gender = '  female  ';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithInvalidGender()
  {
    $gender = 'unknown';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertNull($result);
  }

  public function testGetNormalizedGenderWithNonBinaryGender()
  {
    $gender = 'non-binary';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertNull($result);
  }

  public function testGetNormalizedGenderWithOtherGender()
  {
    $gender = 'other';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertNull($result);
  }

  public function testGetNormalizedGenderWithEmptyString()
  {
    $gender = '';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertNull($result);
  }

  public function testGetNormalizedGenderWithOnlyWhitespace()
  {
    $gender = '   ';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertNull($result);
  }

  public function testGetNormalizedGenderWithSha256Hash()
  {
    // SHA256 hash (64 hex characters)
    $hashedGender = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = GenderUtils::getNormalizedGender($hashedGender);
    $this->assertEquals($hashedGender, $result);
  }

  public function testGetNormalizedGenderWithMd5Hash()
  {
    // MD5 hash (32 hex characters)
    $hashedGender = 'd41d8cd98f00b204e9800998ecf8427e';
    $result = GenderUtils::getNormalizedGender($hashedGender);
    $this->assertEquals($hashedGender, $result);
  }

  public function testGetNormalizedGenderWithMixedCaseSha256Hash()
  {
    // SHA256 hash with mixed case
    $hashedGender = 'A665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $result = GenderUtils::getNormalizedGender($hashedGender);
    $this->assertEquals($hashedGender, $result);
  }

  public function testGetNormalizedGenderWithNumbers()
  {
    $gender = '123';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertNull($result);
  }

  public function testGetNormalizedGenderWithSpecialCharacters()
  {
    $gender = '@#$%';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertNull($result);
  }

  public function testGetNormalizedGenderWithMaleTermDad()
  {
    $gender = 'dad';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermMom()
  {
    $gender = 'mom';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermUncle()
  {
    $gender = 'uncle';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermAunt()
  {
    $gender = 'aunt';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermBrother()
  {
    $gender = 'brother';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermSister()
  {
    $gender = 'sister';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermBoyfriend()
  {
    $gender = 'boyfriend';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermGirlfriend()
  {
    $gender = 'girlfriend';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermGroom()
  {
    $gender = 'groom';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermBride()
  {
    $gender = 'bride';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermPrince()
  {
    $gender = 'prince';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermPrincess()
  {
    $gender = 'princess';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermDuke()
  {
    $gender = 'duke';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermDuchess()
  {
    $gender = 'duchess';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermGod()
  {
    $gender = 'god';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermGoddess()
  {
    $gender = 'goddess';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleSlangTermDude()
  {
    $gender = 'dude';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleSlangTermGuy()
  {
    $gender = 'guy';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleSlangTermGal()
  {
    $gender = 'gal';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleSlangTermChick()
  {
    $gender = 'chick';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithPartialMatch()
  {
    $gender = 'males'; // Should not match 'male'
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertNull($result);
  }

  public function testGetNormalizedGenderWithPartialMatchFemale()
  {
    $gender = 'females'; // Should not match 'female'
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertNull($result);
  }

  public function testGetNormalizedGenderWithMaleTermWidower()
  {
    $gender = 'widower';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermWidow()
  {
    $gender = 'widow';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithMaleTermMr()
  {
    $gender = 'mr';
    $expected = 'm';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermMrs()
  {
    $gender = 'mrs';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermMs()
  {
    $gender = 'ms';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }

  public function testGetNormalizedGenderWithFemaleTermMiss()
  {
    $gender = 'miss';
    $expected = 'f';
    $result = GenderUtils::getNormalizedGender($gender);
    $this->assertEquals($expected, $result);
  }
}
