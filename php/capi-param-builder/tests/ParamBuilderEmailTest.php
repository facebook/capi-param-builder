<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

use PHPUnit\Framework\TestCase;
use FacebookAds\ParamBuilder;
use FacebookAds\PII_DATA_TYPE;
use FacebookAds\AppendixProvider;

require_once __DIR__ . '/../src/ParamBuilder.php';
require_once __DIR__ . '/../src/model/Constants.php';
require_once __DIR__ . '/../src/util/AppendixProvider.php';

// Public email-hashing entry point: exact valid, reject, and prehash output.
final class ParamBuilderEmailTest extends TestCase
{
  private $appendix_net_new;
  private $appendix_no_change;

  protected function setUp(): void
  {
    $this->appendix_net_new = AppendixProvider::getAppendix(APPENDIX_NET_NEW);
    $this->appendix_no_change =
      AppendixProvider::getAppendix(APPENDIX_NO_CHANGE);
  }

  public function testBuilderHashesValidEmailWithGoldenDigest()
  {
    // Golden from sha256sum of test.user@example.com.
    $builder = new ParamBuilder();
    $expected =
      'a97d7a4513204a9cc7cb2f11d72d41a59b18d1ba633d22e58d53c625518f5203' .
      '.' . $this->appendix_net_new;
    $this->assertEquals(
      $expected,
      $builder->getNormalizedAndHashedPII(
        '  Test.User@Example.COM  ', PII_DATA_TYPE::EMAIL
      )
    );
  }

  public function testBuilderRejectsInvalidEmail()
  {
    $builder = new ParamBuilder();
    $this->assertNull(
      $builder->getNormalizedAndHashedPII('invalid-email', PII_DATA_TYPE::EMAIL)
    );
    $this->assertNull(
      $builder->getNormalizedAndHashedPII('', PII_DATA_TYPE::EMAIL)
    );
    $this->assertNull(
      $builder->getNormalizedAndHashedPII(null, PII_DATA_TYPE::EMAIL)
    );
  }

  public function testBuilderPassesPrehashedEmailWithNoChangeAppendix()
  {
    $builder = new ParamBuilder();
    $hashed =
      'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    $this->assertEquals(
      $hashed . '.' . $this->appendix_no_change,
      $builder->getNormalizedAndHashedPII($hashed, PII_DATA_TYPE::EMAIL)
    );
  }

  public function testBuilderEmailOutputFeedbackIsIdempotent()
  {
    $builder = new ParamBuilder();
    $first = $builder->getNormalizedAndHashedPII(
      '  Test.User@Example.COM  ', PII_DATA_TYPE::EMAIL
    );
    $second = $builder->getNormalizedAndHashedPII($first, PII_DATA_TYPE::EMAIL);
    $this->assertEquals($first, $second);
    $this->assertEquals(
      1, substr_count($second, '.' . $this->appendix_net_new)
    );
  }

  public function testBuilderEmailHashOutputFormat()
  {
    $builder = new ParamBuilder();
    $result = $builder->getNormalizedAndHashedPII(
      'user@domain.com', PII_DATA_TYPE::EMAIL
    );
    $this->assertEquals(73, strlen($result));
    $this->assertRegExp(
      '/^[a-f0-9]{64}\.' . preg_quote($this->appendix_net_new, '/') . '$/',
      $result
    );
  }
}
