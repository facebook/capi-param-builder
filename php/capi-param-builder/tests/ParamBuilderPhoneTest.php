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
use FacebookAds\PIIUtils;
use FacebookAds\PhoneUtils;

require_once __DIR__ . '/../src/ParamBuilder.php';
require_once __DIR__ . '/../src/piiUtil/PIIUtils.php';
require_once __DIR__ . '/../src/piiUtil/PhoneUtils.php';

final class ParamBuilderPhoneTest extends TestCase
{
  // SHA-256 fixtures computed independently from the normalized digit strings.
  private const PHONE_SHA =
    'd6736136ea896c1bfdc553e0e86e702c70d060d805696ca3e4e9e0961353860a';
  private const NATIONAL_PHONE_SHA =
    '3c95277da5fd0da6a1a44ee3fdf56d20af6c6d242695a40e18e6e90dc3c5872c';
  private const SHA =
    'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
  private const SHA_DIGITS = '66545920422941748674804131079988677273';
  private const SHA_DIGITS_HASH =
    '5b5cd26286f3ed59a0368dfccebade2abb0bf040c75a81eb99e5b6b033e05393';
  private const MD5 = '5d41402abc4b2a76b9719d911017c592';

  private $appendix_net_new;
  private $appendix_no_change;

  protected function setUp(): void
  {
    $path = __DIR__ . '/../composer.json';
    $this->assertFileExists($path);
    $package = json_decode(file_get_contents($path), true);
    $this->assertTrue(
      is_array($package),
      'Package metadata must be valid JSON'
    );
    $this->assertArrayHasKey('version', $package);
    $this->assertTrue(
      is_string($package['version']),
      'Package version must be a string'
    );
    $this->assertRegExp('/^\d+\.\d+\.\d+$/', $package['version']);
    $version = array_map('intval', explode('.', $package['version']));
    foreach ($version as $byte) {
      $this->assertGreaterThanOrEqual(
        0,
        $byte,
        'Version components must fit an appendix byte'
      );
      $this->assertLessThanOrEqual(
        255,
        $byte,
        'Version components must fit an appendix byte'
      );
    }
    $this->appendix_net_new = $this->encodeAppendix(0x02, $version);
    $this->appendix_no_change = $this->encodeAppendix(0x00, $version);
  }

  private function encodeAppendix($type, $version)
  {
    $bytes = array_merge([0x01, 0x01, $type], $version);
    return rtrim(strtr(base64_encode(pack('C*', ...$bytes)), '+/', '-_'), '=');
  }

  public function testBuilderHashesFormattedPhoneWithGoldenDigest()
  {
    $builder = new ParamBuilder();
    $this->assertSame('15551234567', PIIUtils::getNormalizedPII(
      '  +1 (555) 123-4567  ', PII_DATA_TYPE::PHONE
    ));
    $expected = self::PHONE_SHA . '.' . $this->appendix_net_new;
    $this->assertSame($expected, PIIUtils::getNormalizedAndHashedPII(
      '  +1 (555) 123-4567  ', PII_DATA_TYPE::PHONE
    ));
    $actual = $builder->getNormalizedAndHashedPII(
      '  001 (555) 123-4567  ', PII_DATA_TYPE::PHONE
    );
    $this->assertSame($expected, $actual);
    $suffix = explode('.', $actual)[1];
    $bytes = array_values(unpack(
      'C*', base64_decode(strtr($suffix, '-_', '+/'))
    ));
    $package = json_decode(
      file_get_contents(__DIR__ . '/../composer.json'), true
    );
    $this->assertSame(
      array_merge(
        [0x01, 0x01, 0x02],
        array_map('intval', explode('.', $package['version']))
      ),
      $bytes
    );
  }

  public function testBuilderDoesNotAddCountryCode()
  {
    $builder = new ParamBuilder();
    $this->assertSame(
      self::NATIONAL_PHONE_SHA . '.' . $this->appendix_net_new,
      $builder->getNormalizedAndHashedPII('555-123-4567', PII_DATA_TYPE::PHONE)
    );
  }

  public function testEmptyNormalizedPhoneIsNotHashed()
  {
    $builder = new ParamBuilder();
    $cases = [['', null], ['not-a-number', ''], ['0000', ''], [" \t\r\n ", '']];
    foreach ($cases as $case) {
      $this->assertSame(
        $case[1], PIIUtils::getNormalizedPII($case[0], PII_DATA_TYPE::PHONE)
      );
      $this->assertNull(PIIUtils::getNormalizedAndHashedPII(
        $case[0], PII_DATA_TYPE::PHONE
      ));
      $this->assertNull($builder->getNormalizedAndHashedPII(
        $case[0], PII_DATA_TYPE::PHONE
      ));
    }
  }

  public function testDispatcherRejectsNonStringPhoneInput()
  {
    $builder = new ParamBuilder();
    foreach ([
      null, true, false, 0, [], ['15551234567'], new stdClass()
    ] as $input) {
      $this->assertNull(PIIUtils::getNormalizedPII(
        $input, PII_DATA_TYPE::PHONE
      ));
      $this->assertNull(PIIUtils::getNormalizedAndHashedPII(
        $input, PII_DATA_TYPE::PHONE
      ));
      $this->assertNull($builder->getNormalizedAndHashedPII(
        $input, PII_DATA_TYPE::PHONE
      ));
    }
  }

  public function testDirectNumericCoercionDoesNotBypassDispatcherValidation()
  {
    $this->assertSame('123', PhoneUtils::getNormalizedPhone(123));
    $this->assertNull(PIIUtils::getNormalizedPII(123, PII_DATA_TYPE::PHONE));
    $this->assertNull(PIIUtils::getNormalizedAndHashedPII(
      123, PII_DATA_TYPE::PHONE
    ));
  }

  public function testRawMd5PassthroughAndHashedApiNoChangeAppendix()
  {
    $this->assertSame(self::MD5, PhoneUtils::getNormalizedPhone(self::MD5));
    $this->assertSame(
      self::MD5, PIIUtils::getNormalizedPII(self::MD5, PII_DATA_TYPE::PHONE)
    );
    $this->assertSame(
      self::MD5 . '.' . $this->appendix_no_change,
      PIIUtils::getNormalizedAndHashedPII(self::MD5, PII_DATA_TYPE::PHONE)
    );
  }

  public function testRawShaPreservesCaseButPaddedShaNormalizesAsDigits()
  {
    $this->assertSame(
      strtoupper(self::SHA),
      PhoneUtils::getNormalizedPhone(strtoupper(self::SHA))
    );
    $input = ' ' . strtoupper(self::SHA) . ' ';
    $this->assertSame(self::SHA_DIGITS, PhoneUtils::getNormalizedPhone($input));
    $this->assertSame(
      self::SHA_DIGITS, PIIUtils::getNormalizedPII($input, PII_DATA_TYPE::PHONE)
    );
  }

  public function testBuilderTrimsAndLowercasesPaddedPrehashes()
  {
    $builder = new ParamBuilder();
    foreach ([self::SHA, self::MD5] as $hash) {
      $input = ' ' . strtoupper($hash) . ' ';
      $expected = $hash . '.' . $this->appendix_no_change;
      $this->assertSame($expected, PIIUtils::getNormalizedAndHashedPII(
        $input, PII_DATA_TYPE::PHONE
      ));
      $this->assertSame($expected, $builder->getNormalizedAndHashedPII(
        $input, PII_DATA_TYPE::PHONE
      ));
    }
  }

  public function testAcceptedAppendicesPassThroughUnchanged()
  {
    $builder = new ParamBuilder();
    $inputs = [
      self::SHA . '.BA',
      strtoupper(self::SHA) . '.ZZZZZZZZ',
      self::MD5 . '.AQYCAQAA',
    ];
    foreach ($inputs as $input) {
      $this->assertSame($input, $builder->getNormalizedAndHashedPII(
        ' ' . $input . ' ', PII_DATA_TYPE::PHONE
      ));
    }
  }

  public function testUnacceptedAppendicesFallBackToPhoneDigitHashing()
  {
    $cases = [
      ['.XX', self::SHA_DIGITS, self::SHA_DIGITS_HASH],
      [
        '.1234567', self::SHA_DIGITS . '1234567',
        'e01845a1f2b09082036ee26c4feefd627d2b3eb0d71c6ff65809c7dd398655dd',
      ],
      [
        '.123456789', self::SHA_DIGITS . '123456789',
        '692f31c4cf9c7c6991028a6bbb426a4c3c54c867f6208384b8fb5dbf07437ceb',
      ],
    ];
    $builder = new ParamBuilder();
    foreach ($cases as $case) {
      $input = self::SHA . $case[0];
      $this->assertSame(
        $case[1],
        PIIUtils::getNormalizedPII($input, PII_DATA_TYPE::PHONE),
        $input
      );
      $this->assertSame(
        $case[2] . '.' . $this->appendix_net_new,
        $builder->getNormalizedAndHashedPII($input, PII_DATA_TYPE::PHONE),
        $input
      );
    }
  }

  public function testInvalidHashPrefixDoesNotPassThroughWithAcceptedAppendix()
  {
    $builder = new ParamBuilder();
    $input = 'g' . substr(self::SHA, 1) . '.AQYCAQAA';
    $this->assertSame(
      self::SHA_DIGITS_HASH . '.' . $this->appendix_net_new,
      $builder->getNormalizedAndHashedPII($input, PII_DATA_TYPE::PHONE)
    );
  }

  public function testBuilderPhoneHashFeedbackPreservesExactOutput()
  {
    $builder = new ParamBuilder();
    $expected = self::PHONE_SHA . '.' . $this->appendix_net_new;
    $first = $builder->getNormalizedAndHashedPII(
      '+1 (555) 123-4567', PII_DATA_TYPE::PHONE
    );
    $this->assertSame($expected, $first);
    $this->assertSame($expected, $builder->getNormalizedAndHashedPII(
      $first, PII_DATA_TYPE::PHONE
    ));
  }
}
