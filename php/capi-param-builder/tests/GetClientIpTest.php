<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

use PHPUnit\Framework\TestCase;
use FacebookAds\ParamBuilder;
use FacebookAds\Constants;

final class GetClientIpTest extends TestCase
{
    private $paramBuilder;
    private $reflection;

    protected function setUp(): void
    {
        $this->paramBuilder = new ParamBuilder();
        $this->reflection = new ReflectionClass($this->paramBuilder);
    }

    /**
     * Helper method to invoke private methods
     */
    private function invokePrivateMethod($methodName, ...$args)
    {
        $method = $this->reflection->getMethod($methodName);
        $method->setAccessible(true);
        return $method->invokeArgs($this->paramBuilder, $args);
    }

    /**
     * Helper method to get private static method
     */
    private function invokePrivateStaticMethod($methodName, ...$args)
    {
        $method = $this->reflection->getMethod($methodName);
        $method->setAccessible(true);
        return $method->invokeArgs(null, $args);
    }

    // Test data constants
    const IPV4_PUBLIC = '8.8.8.8';
    const IPV4_PRIVATE = '192.168.1.1';
    const IPV6_PUBLIC = '2001:4860:4860::8888';
    const IPV6_PRIVATE = 'fe80::1';
    const INVALID_IP = 'not.an.ip';

    public function testGetClientIpBasicFunctionality()
    {
        // Test null when no valid IPs provided
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [],
            null,
            null
        );
        $this->assertNull($result);

        // Test null when all IPs are invalid
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::INVALID_IP],
            self::INVALID_IP,
            self::INVALID_IP
        );
        $this->assertNull($result);

        // Test null when all IPs are private
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV4_PRIVATE],
            self::IPV4_PRIVATE,
            self::IPV4_PRIVATE
        );
        $this->assertNull($result);
    }

    public function testGetClientIpIPv6PublicPrioritization()
    {
        // IPv6 public from cookie should beat IPv4 public from request
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV6_PUBLIC],
            self::IPV4_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV6_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // IPv6 public from request should beat IPv4 public from cookie
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV4_PUBLIC],
            self::IPV6_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV6_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // IPv6 public from cookie should beat IPv6 public from request (cookie priority)
        $anotherIPv6Public = '2001:db8::1';
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV6_PUBLIC],
            $anotherIPv6Public,
            null
        );
        $this->assertEquals(self::IPV6_PUBLIC . '.' . LANGUAGE_TOKEN, $result);
    }

    public function testGetClientIpIPv4PublicHandling()
    {
        // IPv4 public from cookie should beat IPv4 public from request
        $anotherIPv4Public = '1.1.1.1';
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV4_PUBLIC],
            $anotherIPv4Public,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // IPv4 public from request when no cookie available
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [],
            self::IPV4_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // IPv4 public from remote address when no other sources
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [],
            null,
            self::IPV4_PUBLIC
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);
    }

    public function testGetClientIpPublicOverPrivatePrioritization()
    {
        // Public IPv4 from request should beat private IPv6 from cookie
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV6_PRIVATE],
            self::IPV4_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // Public IPv4 from request should beat private IPv4 from cookie
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV4_PRIVATE],
            self::IPV4_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // Public IPv6 from request should beat private IPv4 from cookie
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV4_PRIVATE],
            self::IPV6_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV6_PUBLIC . '.' . LANGUAGE_TOKEN, $result);
    }

    public function testGetClientIpLanguageTokenHandling()
    {
        // Use first supported language token for testing
        $langToken = SUPPORTED_LANGUAGES_TOKEN[0];

        // Should preserve existing language token from cookie
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV4_PUBLIC . '.' . $langToken],
            null,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . $langToken, $result);

        // Should use default language token when no token in cookie
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV4_PUBLIC],
            null,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // Should use default language token for request-sourced IPs
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [],
            self::IPV4_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);
    }

    public function testGetClientIpFromCookieHelper()
    {
        // Should extract IP from FBI cookie
        $result = $this->invokePrivateStaticMethod(
            'getClientIpFromCookie',
            [FBI_NAME => self::IPV4_PUBLIC]
        );
        $this->assertEquals(self::IPV4_PUBLIC, $result);

        // Should extract IP and remove language token
        $langToken = SUPPORTED_LANGUAGES_TOKEN[0];
        $result = $this->invokePrivateStaticMethod(
            'getClientIpFromCookie',
            [FBI_NAME => self::IPV4_PUBLIC . '.' . $langToken]
        );
        $this->assertEquals(self::IPV4_PUBLIC, $result);

        // Should return null if no FBI cookie
        $result = $this->invokePrivateStaticMethod(
            'getClientIpFromCookie',
            []
        );
        $this->assertNull($result);

        // Should return null if empty cookies
        $result = $this->invokePrivateStaticMethod(
            'getClientIpFromCookie',
            [FBI_NAME => '']
        );
        $this->assertNull($result);
    }

    public function testGetClientIpLanguageTokenFromCookieHelper()
    {
        $langToken = SUPPORTED_LANGUAGES_TOKEN[0];

        // Should extract language token from FBI cookie
        $result = $this->invokePrivateStaticMethod(
            'getClientIpLanguageTokenFromCookie',
            [FBI_NAME => self::IPV4_PUBLIC . '.' . $langToken]
        );
        $this->assertEquals($langToken, $result);

        // Should return null if no language token
        $result = $this->invokePrivateStaticMethod(
            'getClientIpLanguageTokenFromCookie',
            [FBI_NAME => self::IPV4_PUBLIC]
        );
        $this->assertNull($result);

        // Should return null if no FBI cookie
        $result = $this->invokePrivateStaticMethod(
            'getClientIpLanguageTokenFromCookie',
            []
        );
        $this->assertNull($result);
    }

    public function testGetClientIpFromRequestHelper()
    {
        // Should extract IP from X-Forwarded-For header
        $result = $this->invokePrivateStaticMethod(
            'getClientIpFromRequest',
            self::IPV4_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC, $result);

        // Should extract IP from remote address if no X-Forwarded-For
        $result = $this->invokePrivateStaticMethod(
            'getClientIpFromRequest',
            null,
            self::IPV4_PUBLIC
        );
        $this->assertEquals(self::IPV4_PUBLIC, $result);

        // Should prefer public IP from X-Forwarded-For over private IP
        $result = $this->invokePrivateStaticMethod(
            'getClientIpFromRequest',
            self::IPV4_PUBLIC,
            self::IPV4_PRIVATE
        );
        $this->assertEquals(self::IPV4_PUBLIC, $result);

        // Should fall back to remote address if X-Forwarded-For is private
        $result = $this->invokePrivateStaticMethod(
            'getClientIpFromRequest',
            self::IPV4_PRIVATE,
            self::IPV4_PUBLIC
        );
        $this->assertEquals(self::IPV4_PUBLIC, $result);

        // Should handle multiple IPs in X-Forwarded-For (take first public)
        $result = $this->invokePrivateStaticMethod(
            'getClientIpFromRequest',
            self::IPV4_PUBLIC . ', ' . self::IPV4_PRIVATE,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC, $result);
    }

    public function testLanguageTokenHelpers()
    {
        $langToken = SUPPORTED_LANGUAGES_TOKEN[0];

        // Test getLanguageToken
        $result = $this->invokePrivateStaticMethod(
            'getLanguageToken',
            self::IPV4_PUBLIC . '.' . $langToken
        );
        $this->assertEquals($langToken, $result);

        $result = $this->invokePrivateStaticMethod(
            'getLanguageToken',
            self::IPV4_PUBLIC . '.XX'  // Invalid token
        );
        $this->assertNull($result);

        $result = $this->invokePrivateStaticMethod(
            'getLanguageToken',
            self::IPV4_PUBLIC  // No dot
        );
        $this->assertNull($result);

        // Test removeLanguageToken
        $result = $this->invokePrivateStaticMethod(
            'removeLanguageToken',
            self::IPV4_PUBLIC . '.' . $langToken
        );
        $this->assertEquals(self::IPV4_PUBLIC, $result);

        $result = $this->invokePrivateStaticMethod(
            'removeLanguageToken',
            self::IPV4_PUBLIC . '.XX'  // Invalid token, should not remove
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.XX', $result);

        $result = $this->invokePrivateStaticMethod(
            'removeLanguageToken',
            self::IPV4_PUBLIC  // No dot
        );
        $this->assertEquals(self::IPV4_PUBLIC, $result);
    }

    public function testIPValidationHelpers()
    {
        // Test isIPv4
        $this->assertTrue($this->invokePrivateStaticMethod('isIPv4', self::IPV4_PUBLIC));
        $this->assertTrue($this->invokePrivateStaticMethod('isIPv4', self::IPV4_PRIVATE));
        $this->assertFalse($this->invokePrivateStaticMethod('isIPv4', self::IPV6_PUBLIC));
        $this->assertFalse($this->invokePrivateStaticMethod('isIPv4', self::INVALID_IP));

        // Test isIPv6
        $this->assertTrue($this->invokePrivateStaticMethod('isIPv6', self::IPV6_PUBLIC));
        $this->assertTrue($this->invokePrivateStaticMethod('isIPv6', self::IPV6_PRIVATE));
        $this->assertFalse($this->invokePrivateStaticMethod('isIPv6', self::IPV4_PUBLIC));
        $this->assertFalse($this->invokePrivateStaticMethod('isIPv6', self::INVALID_IP));

        // Test isPublicIP
        $this->assertTrue($this->invokePrivateStaticMethod('isPublicIP', self::IPV4_PUBLIC));
        $this->assertTrue($this->invokePrivateStaticMethod('isPublicIP', self::IPV6_PUBLIC));
        $this->assertFalse($this->invokePrivateStaticMethod('isPublicIP', self::IPV4_PRIVATE));
        $this->assertFalse($this->invokePrivateStaticMethod('isPublicIP', self::IPV6_PRIVATE));
        $this->assertFalse($this->invokePrivateStaticMethod('isPublicIP', '127.0.0.1')); // Loopback
        $this->assertFalse($this->invokePrivateStaticMethod('isPublicIP', '::1')); // IPv6 loopback
    }

    public function testEdgeCasesAndErrorHandling()
    {
        // Test with null cookies
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            null,
            self::IPV4_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // Test with empty cookies array
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [],
            self::IPV4_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // Test with empty FBI cookie value
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => ''],
            self::IPV4_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // Test with whitespace in IP values
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => '   '],
            '  ',
            "\t"
        );
        $this->assertNull($result);

        // Test with malformed cookie values
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => 'malformed.ip.value'],
            self::IPV4_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);
    }

    public function testComplexPrioritizationScenarios()
    {
        // IPv6 public from cookie vs IPv6 private from request
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV6_PUBLIC],
            self::IPV6_PRIVATE,
            null
        );
        $this->assertEquals(self::IPV6_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // IPv4 private from cookie vs IPv6 public from request
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV4_PRIVATE],
            self::IPV6_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV6_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // Mixed valid and invalid IPs
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::INVALID_IP],
            self::IPV4_PUBLIC,
            self::INVALID_IP
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);
    }

    public function testRealWorldScenarios()
    {
        $langToken = SUPPORTED_LANGUAGES_TOKEN[0];

        // Typical web server setup
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV4_PRIVATE . '.' . $langToken],
            self::IPV4_PUBLIC,
            self::IPV4_PRIVATE
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // Load balancer scenario with IPv6
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV4_PRIVATE],
            self::IPV6_PUBLIC,
            self::IPV4_PRIVATE
        );
        $this->assertEquals(self::IPV6_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // CDN scenario with multiple forwarded IPs
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [],
            self::IPV4_PUBLIC . ', 203.0.113.1, 198.51.100.1',
            '198.51.100.1'
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // Proxy chain scenario
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV6_PRIVATE],
            self::IPV6_PUBLIC,
            self::IPV4_PRIVATE
        );
        $this->assertEquals(self::IPV6_PUBLIC . '.' . LANGUAGE_TOKEN, $result);
    }

    public function testSpecialIPAddresses()
    {
        // Test private and reserved IPv4 addresses that should return null
        $privateIPv4Addresses = [
            '127.0.0.1',      // Loopback
            '169.254.1.1',    // Link-local
            '10.0.0.1',       // Private range
            '172.16.0.1',     // Private range
            '192.168.1.1',    // Private range
        ];

        foreach ($privateIPv4Addresses as $ip) {
            $result = $this->invokePrivateStaticMethod('getClientIp', [], $ip, null);
            $this->assertNull($result, "Expected null for private IPv4 address: $ip");
        }

        // Test private and reserved IPv6 addresses that should return null
        $privateIPv6Addresses = [
            '::1',          // Loopback
            'fe80::1',      // Link-local
            'fc00::1',      // Unique local
            'fd00::1',      // Unique local
        ];

        foreach ($privateIPv6Addresses as $ip) {
            $result = $this->invokePrivateStaticMethod('getClientIp', [], $ip, null);
            $this->assertNull($result, "Expected null for private IPv6 address: $ip");
        }

        // Test some IPv4 addresses that are considered public by PHP's filter_var
        // (Note: PHP's FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE doesn't filter out all special ranges)
        $publicByPHPFilterIPv4 = [
            '224.0.0.1',      // Multicast - PHP considers this public
            '8.8.8.8',        // Google DNS - genuinely public
            '1.1.1.1',        // Cloudflare DNS - genuinely public
        ];

        foreach ($publicByPHPFilterIPv4 as $ip) {
            $result = $this->invokePrivateStaticMethod('getClientIp', [], $ip, null);
            $this->assertEquals($ip . '.' . LANGUAGE_TOKEN, $result, "Expected processed result for IP: $ip");
        }

        // Test some IPv6 addresses that should be considered public
        $publicIPv6Addresses = [
            '2001:4860:4860::8888',  // Google DNS
            '2606:4700:4700::1111',  // Cloudflare DNS
        ];

        foreach ($publicIPv6Addresses as $ip) {
            $result = $this->invokePrivateStaticMethod('getClientIp', [], $ip, null);
            $this->assertEquals($ip . '.' . LANGUAGE_TOKEN, $result, "Expected processed result for IPv6: $ip");
        }

        // Test IPv6 multicast addresses - PHP's filter_var treats these as public
        // so our implementation will process them as public IPs
        $ipv6MulticastAddresses = [
            'ff00::1',      // IPv6 multicast
            'ff01::1',      // IPv6 multicast
            'ffff::1',      // IPv6 multicast
        ];

        foreach ($ipv6MulticastAddresses as $ip) {
            $result = $this->invokePrivateStaticMethod('getClientIp', [], $ip, null);
            $this->assertEquals($ip . '.' . LANGUAGE_TOKEN, $result, "Expected processed result for IPv6 multicast: $ip");
        }
    }

    public function testLanguageTokenEdgeCases()
    {
        // Test with invalid language token
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV4_PUBLIC . '.XX'], // Invalid token
            null,
            null
        );
        // Since getClientIpFromCookie returns the full string, and it's not a valid IP, should return null
        $this->assertNull($result);

        // Test with multiple dots in cookie value
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => self::IPV4_PUBLIC . '.extra.data'],
            null,
            null
        );
        // Since getClientIpFromCookie returns the full string, and it's not a valid IP, should return null
        $this->assertNull($result);

        // Test with various supported language tokens
        foreach (array_slice(SUPPORTED_LANGUAGES_TOKEN, 0, 5) as $token) {
            $result = $this->invokePrivateStaticMethod(
                'getClientIp',
                [FBI_NAME => self::IPV4_PUBLIC . '.' . $token],
                null,
                null
            );
            $this->assertEquals(self::IPV4_PUBLIC . '.' . $token, $result);
        }
    }

    public function testIntegrationWithProcessRequest()
    {
        // Test that getClientIp is properly called during processRequest
        $builder = new ParamBuilder();

        // Mock cookies with FBI cookie
        $cookies = [FBI_NAME => self::IPV4_PUBLIC];

        $result = $builder->processRequest(
            'example.com',
            ['fbclid' => 'test123'],
            $cookies,
            null,
            null, // x_forwarded_for
            null  // remote_address
        );

        // Verify that FBI was set
        $fbi = $builder->getFbi();
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $fbi);
    }

    public function testBoundaryConditions()
    {
        // Test with very long IP strings (should be invalid)
        $longInvalidIP = str_repeat('a', 1000);
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => $longInvalidIP],
            self::IPV4_PUBLIC,
            null
        );
        $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);

        // Test with empty string IP
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [],
            '',
            null
        );
        $this->assertNull($result);

        // Test with only whitespace IPs
        $result = $this->invokePrivateStaticMethod(
            'getClientIp',
            [FBI_NAME => '   '],
            '  ',
            "\t"
        );
        $this->assertNull($result);
    }

    public function testPerformanceConsiderations()
    {
        // Test rapid successive calls (should not modify inputs)
        $originalCookies = [FBI_NAME => self::IPV4_PUBLIC];
        $originalXForwardedFor = self::IPV4_PRIVATE;
        $originalRemoteAddress = self::IPV6_PRIVATE;

        for ($i = 0; $i < 10; $i++) {
            $result = $this->invokePrivateStaticMethod(
                'getClientIp',
                $originalCookies,
                $originalXForwardedFor,
                $originalRemoteAddress
            );
            $this->assertEquals(self::IPV4_PUBLIC . '.' . LANGUAGE_TOKEN, $result);
        }

        // Verify inputs were not modified
        $this->assertEquals([FBI_NAME => self::IPV4_PUBLIC], $originalCookies);
        $this->assertEquals(self::IPV4_PRIVATE, $originalXForwardedFor);
        $this->assertEquals(self::IPV6_PRIVATE, $originalRemoteAddress);
    }
}
