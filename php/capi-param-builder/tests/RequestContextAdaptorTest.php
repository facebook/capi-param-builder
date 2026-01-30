<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

use PHPUnit\Framework\TestCase;
use FacebookAds\RequestContextAdaptor;
use FacebookAds\PlainDataObject;

require_once __DIR__ . '/../src/util/RequestContextAdaptor.php';
require_once __DIR__ . '/../src/model/PlainDataObject.php';

/**
 * Unit tests for RequestContextAdaptor
 *
 * Tests cover:
 * - Basic extraction functionality
 * - Various PHP framework patterns (Laravel, Symfony, WordPress, etc.)
 * - Edge cases and error handling
 * - Global variable scenarios
 */
final class RequestContextAdaptorTest extends TestCase
{
    private $original_server;
    private $original_get;
    private $original_cookie;

    protected function setUp(): void
    {
        // Backup global variables
        $this->original_server = $_SERVER ?? [];
        $this->original_get = $_GET ?? [];
        $this->original_cookie = $_COOKIE ?? [];
    }

    protected function tearDown(): void
    {
        // Restore global variables
        $_SERVER = $this->original_server;
        $_GET = $this->original_get;
        $_COOKIE = $this->original_cookie;
    }

    /**
     * Helper to reset global variables to empty state
     */
    private function resetGlobals(): void
    {
        $_SERVER = [];
        $_GET = [];
        $_COOKIE = [];
    }

    // =========================================================================
    // Basic Functionality Tests
    // =========================================================================

    public function testExtractReturnsPlainDataObject(): void
    {
        $result = RequestContextAdaptor::extract([]);
        $this->assertInstanceOf(PlainDataObject::class, $result);
    }

    public function testExtractWithNullServerOverridesUsesGlobalServer(): void
    {
        $_SERVER = [
            'HTTP_HOST' => 'example.com',
            'REMOTE_ADDR' => '192.168.1.1',
        ];

        $result = RequestContextAdaptor::extract(null);

        $this->assertEquals('example.com', $result->host);
        $this->assertEquals('192.168.1.1', $result->remote_address);
    }

    public function testExtractWithEmptyServerOverrides(): void
    {
        $result = RequestContextAdaptor::extract([]);

        $this->assertEquals('', $result->host);
        $this->assertEquals([], $result->query_params);
        $this->assertEquals([], $result->cookies);
        $this->assertNull($result->referer);
        $this->assertNull($result->x_forwarded_for);
        $this->assertNull($result->remote_address);
    }

    // =========================================================================
    // Header Extraction Tests
    // =========================================================================

    public function testExtractHost(): void
    {
        $server = ['HTTP_HOST' => 'www.example.com'];
        $result = RequestContextAdaptor::extract($server);
        $this->assertEquals('www.example.com', $result->host);
    }

    public function testExtractHostWithPort(): void
    {
        $server = ['HTTP_HOST' => 'localhost:8080'];
        $result = RequestContextAdaptor::extract($server);
        $this->assertEquals('localhost:8080', $result->host);
    }

    public function testExtractReferer(): void
    {
        $server = ['HTTP_REFERER' => 'https://google.com/search?q=test'];
        $result = RequestContextAdaptor::extract($server);
        $this->assertEquals('https://google.com/search?q=test', $result->referer);
    }

    public function testExtractXForwardedFor(): void
    {
        $server = ['HTTP_X_FORWARDED_FOR' => '203.0.113.195, 70.41.3.18, 150.172.238.178'];
        $result = RequestContextAdaptor::extract($server);
        $this->assertEquals('203.0.113.195, 70.41.3.18, 150.172.238.178', $result->x_forwarded_for);
    }

    public function testExtractRemoteAddress(): void
    {
        $server = ['REMOTE_ADDR' => '192.168.1.100'];
        $result = RequestContextAdaptor::extract($server);
        $this->assertEquals('192.168.1.100', $result->remote_address);
    }

    public function testExtractAllHeaders(): void
    {
        $server = [
            'HTTP_HOST' => 'api.example.com',
            'HTTP_REFERER' => 'https://referrer.com',
            'HTTP_X_FORWARDED_FOR' => '8.8.8.8',
            'REMOTE_ADDR' => '10.0.0.1',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('api.example.com', $result->host);
        $this->assertEquals('https://referrer.com', $result->referer);
        $this->assertEquals('8.8.8.8', $result->x_forwarded_for);
        $this->assertEquals('10.0.0.1', $result->remote_address);
    }

    // =========================================================================
    // Query Parameter Tests
    // =========================================================================

    public function testExtractQueryParamsFromGlobalGet(): void
    {
        $this->resetGlobals();
        $_GET = ['foo' => 'bar', 'baz' => 'qux'];

        $result = RequestContextAdaptor::extract(['HTTP_HOST' => 'example.com']);

        $this->assertEquals(['foo' => 'bar', 'baz' => 'qux'], $result->query_params);
    }

    public function testExtractQueryParamsFromQueryString(): void
    {
        $this->resetGlobals();
        $_GET = [];

        $server = [
            'HTTP_HOST' => 'example.com',
            'QUERY_STRING' => 'param1=value1&param2=value2',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals(['param1' => 'value1', 'param2' => 'value2'], $result->query_params);
    }

    public function testExtractQueryParamsGlobalGetTakesPrecedence(): void
    {
        $this->resetGlobals();
        $_GET = ['from_get' => 'true'];

        $server = [
            'HTTP_HOST' => 'example.com',
            'QUERY_STRING' => 'from_query_string=true',
        ];

        $result = RequestContextAdaptor::extract($server);

        // $_GET should take precedence over QUERY_STRING
        $this->assertEquals(['from_get' => 'true'], $result->query_params);
    }

    public function testExtractQueryParamsWithSpecialCharacters(): void
    {
        $this->resetGlobals();
        $_GET = [];

        $server = [
            'QUERY_STRING' => 'name=John%20Doe&email=test%40example.com&tags[]=a&tags[]=b',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('John Doe', $result->query_params['name']);
        $this->assertEquals('test@example.com', $result->query_params['email']);
    }

    public function testExtractQueryParamsWithEmptyQueryString(): void
    {
        $this->resetGlobals();
        $_GET = [];

        $server = [
            'QUERY_STRING' => '',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals([], $result->query_params);
    }

    // =========================================================================
    // Cookie Extraction Tests
    // =========================================================================

    public function testExtractCookiesFromGlobalCookie(): void
    {
        $this->resetGlobals();
        $_COOKIE = ['session_id' => 'abc123', 'user_pref' => 'dark_mode'];

        $result = RequestContextAdaptor::extract(['HTTP_HOST' => 'example.com']);

        $this->assertEquals(['session_id' => 'abc123', 'user_pref' => 'dark_mode'], $result->cookies);
    }

    public function testExtractCookiesFromHttpCookieHeader(): void
    {
        $this->resetGlobals();
        $_COOKIE = [];

        $server = [
            'HTTP_HOST' => 'example.com',
            'HTTP_COOKIE' => 'cookie1=value1; cookie2=value2',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals(['cookie1' => 'value1', 'cookie2' => 'value2'], $result->cookies);
    }

    public function testExtractCookiesGlobalCookieTakesPrecedence(): void
    {
        $this->resetGlobals();
        $_COOKIE = ['from_global' => 'true'];

        $server = [
            'HTTP_HOST' => 'example.com',
            'HTTP_COOKIE' => 'from_header=true',
        ];

        $result = RequestContextAdaptor::extract($server);

        // $_COOKIE should take precedence over HTTP_COOKIE
        $this->assertEquals(['from_global' => 'true'], $result->cookies);
    }

    public function testExtractCookiesWithUrlEncodedValues(): void
    {
        $this->resetGlobals();
        $_COOKIE = [];

        $server = [
            'HTTP_COOKIE' => 'encoded=hello%20world; special=a%3Db%26c%3Dd',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('hello world', $result->cookies['encoded']);
        $this->assertEquals('a=b&c=d', $result->cookies['special']);
    }

    public function testExtractCookiesWithWhitespace(): void
    {
        $this->resetGlobals();
        $_COOKIE = [];

        $server = [
            'HTTP_COOKIE' => '  cookie1=value1  ;   cookie2=value2  ; cookie3=value3',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertArrayHasKey('cookie1', $result->cookies);
        $this->assertArrayHasKey('cookie2', $result->cookies);
        $this->assertArrayHasKey('cookie3', $result->cookies);
    }

    public function testExtractCookiesWithMalformedPairs(): void
    {
        $this->resetGlobals();
        $_COOKIE = [];

        $server = [
            'HTTP_COOKIE' => 'valid=value; invalid_no_equals; another=test',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('value', $result->cookies['valid']);
        $this->assertEquals('test', $result->cookies['another']);
        // 'invalid_no_equals' should not be included (count($parts) !== 2)
        $this->assertArrayNotHasKey('invalid_no_equals', $result->cookies);
    }

    public function testExtractCookiesWithEmptyValue(): void
    {
        $this->resetGlobals();
        $_COOKIE = [];

        $server = [
            'HTTP_COOKIE' => 'empty=; normal=value',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('', $result->cookies['empty']);
        $this->assertEquals('value', $result->cookies['normal']);
    }

    // =========================================================================
    // PHP Framework Simulation Tests
    // =========================================================================

    /**
     * Test simulating Laravel/Symfony typical request environment
     */
    public function testLaravelSymfonyTypicalRequest(): void
    {
        $this->resetGlobals();
        $_GET = ['page' => '1', 'sort' => 'name'];
        $_COOKIE = ['laravel_session' => 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9'];

        $server = [
            'HTTP_HOST' => 'myapp.test',
            'HTTP_REFERER' => 'https://myapp.test/dashboard',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.50',
            'REMOTE_ADDR' => '127.0.0.1',
            'QUERY_STRING' => 'page=1&sort=name',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('myapp.test', $result->host);
        $this->assertEquals(['page' => '1', 'sort' => 'name'], $result->query_params);
        $this->assertEquals(['laravel_session' => 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9'], $result->cookies);
        $this->assertEquals('https://myapp.test/dashboard', $result->referer);
        $this->assertEquals('203.0.113.50', $result->x_forwarded_for);
        $this->assertEquals('127.0.0.1', $result->remote_address);
    }

    /**
     * Test simulating WordPress typical request environment
     */
    public function testWordPressTypicalRequest(): void
    {
        $this->resetGlobals();
        $_GET = ['p' => '123', 'preview' => 'true'];
        $_COOKIE = [
            'wordpress_logged_in_abc123' => 'admin%7C1234567890%7Cabcdef',
            'wp-settings-1' => 'hidetb%3D1%26editor%3Dtinymce',
        ];

        $server = [
            'HTTP_HOST' => 'wordpress.local',
            'REMOTE_ADDR' => '192.168.1.50',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('wordpress.local', $result->host);
        $this->assertEquals(['p' => '123', 'preview' => 'true'], $result->query_params);
        $this->assertArrayHasKey('wordpress_logged_in_abc123', $result->cookies);
    }

    /**
     * Test simulating Drupal typical request environment
     */
    public function testDrupalTypicalRequest(): void
    {
        $this->resetGlobals();
        $_GET = ['q' => 'node/123'];
        $_COOKIE = ['SESS123456' => 'drupal_session_id_here'];

        $server = [
            'HTTP_HOST' => 'drupal.example.com',
            'HTTP_REFERER' => 'https://drupal.example.com/admin',
            'REMOTE_ADDR' => '10.0.0.5',
            'QUERY_STRING' => 'q=node/123',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('drupal.example.com', $result->host);
        $this->assertEquals(['q' => 'node/123'], $result->query_params);
    }

    /**
     * Test simulating CodeIgniter typical request environment
     */
    public function testCodeIgniterTypicalRequest(): void
    {
        $this->resetGlobals();
        $_GET = ['c' => 'home', 'm' => 'index'];
        $_COOKIE = ['ci_session' => 'a:5:{s:10:"session_id";s:32:"..."}'];

        $server = [
            'HTTP_HOST' => 'ci.local',
            'REMOTE_ADDR' => '172.16.0.1',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('ci.local', $result->host);
        $this->assertEquals(['c' => 'home', 'm' => 'index'], $result->query_params);
    }

    /**
     * Test simulating Magento/OpenMage typical request environment
     */
    public function testMagentoTypicalRequest(): void
    {
        $this->resetGlobals();
        $_GET = ['id' => '42', 'category' => '10'];
        $_COOKIE = [
            'frontend' => 'b3e4d5c6a7f8g9h0i1j2k3l4m5n6o7p8',
            'store' => 'default',
        ];

        $server = [
            'HTTP_HOST' => 'shop.example.com',
            'HTTP_REFERER' => 'https://shop.example.com/catalog',
            'HTTP_X_FORWARDED_FOR' => '8.8.8.8, 10.0.0.1',
            'REMOTE_ADDR' => '10.0.0.1',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('shop.example.com', $result->host);
        $this->assertEquals('8.8.8.8, 10.0.0.1', $result->x_forwarded_for);
    }

    /**
     * Test simulating Yii Framework typical request environment
     */
    public function testYiiTypicalRequest(): void
    {
        $this->resetGlobals();
        $_GET = ['r' => 'site/index'];
        $_COOKIE = ['PHPSESSID' => 'abc123def456'];

        $server = [
            'HTTP_HOST' => 'yii.local:8000',
            'QUERY_STRING' => 'r=site/index',
            'REMOTE_ADDR' => '127.0.0.1',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('yii.local:8000', $result->host);
        $this->assertEquals(['r' => 'site/index'], $result->query_params);
    }

    // =========================================================================
    // Proxy and Load Balancer Tests
    // =========================================================================

    public function testBehindNginxReverseProxy(): void
    {
        $server = [
            'HTTP_HOST' => 'api.production.com',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.195, 70.41.3.18',
            'HTTP_X_REAL_IP' => '203.0.113.195',
            'REMOTE_ADDR' => '10.0.0.1',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('api.production.com', $result->host);
        $this->assertEquals('203.0.113.195, 70.41.3.18', $result->x_forwarded_for);
        $this->assertEquals('10.0.0.1', $result->remote_address);
    }

    public function testBehindAWSLoadBalancer(): void
    {
        $server = [
            'HTTP_HOST' => 'app.example.com',
            'HTTP_X_FORWARDED_FOR' => '54.239.28.85',
            'HTTP_X_FORWARDED_PROTO' => 'https',
            'HTTP_X_FORWARDED_PORT' => '443',
            'REMOTE_ADDR' => '172.31.0.1',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('54.239.28.85', $result->x_forwarded_for);
        $this->assertEquals('172.31.0.1', $result->remote_address);
    }

    public function testBehindCloudflare(): void
    {
        $server = [
            'HTTP_HOST' => 'protected.example.com',
            'HTTP_CF_CONNECTING_IP' => '203.0.113.50',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.50, 172.64.0.1',
            'REMOTE_ADDR' => '172.64.0.1',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('203.0.113.50, 172.64.0.1', $result->x_forwarded_for);
    }

    // =========================================================================
    // IPv6 Tests
    // =========================================================================

    public function testIPv6RemoteAddress(): void
    {
        $server = [
            'HTTP_HOST' => 'ipv6.example.com',
            'REMOTE_ADDR' => '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('2001:0db8:85a3:0000:0000:8a2e:0370:7334', $result->remote_address);
    }

    public function testIPv6InXForwardedFor(): void
    {
        $server = [
            'HTTP_HOST' => 'example.com',
            'HTTP_X_FORWARDED_FOR' => '2001:db8::1, 2001:db8::2',
            'REMOTE_ADDR' => '::1',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('2001:db8::1, 2001:db8::2', $result->x_forwarded_for);
        $this->assertEquals('::1', $result->remote_address);
    }

    // =========================================================================
    // Edge Cases and Error Handling
    // =========================================================================

    public function testNullValuesInServerArray(): void
    {
        $server = [
            'HTTP_HOST' => null,
            'HTTP_REFERER' => null,
            'HTTP_X_FORWARDED_FOR' => null,
            'REMOTE_ADDR' => null,
        ];

        $result = RequestContextAdaptor::extract($server);

        // null ?? '' returns '', null ?? null returns null
        $this->assertEquals('', $result->host);
        $this->assertNull($result->referer);
        $this->assertNull($result->x_forwarded_for);
        $this->assertNull($result->remote_address);
    }

    public function testEmptyStringsInServerArray(): void
    {
        $server = [
            'HTTP_HOST' => '',
            'HTTP_REFERER' => '',
            'HTTP_X_FORWARDED_FOR' => '',
            'REMOTE_ADDR' => '',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('', $result->host);
        $this->assertEquals('', $result->referer);
        $this->assertEquals('', $result->x_forwarded_for);
        $this->assertEquals('', $result->remote_address);
    }

    public function testVeryLongHostname(): void
    {
        $longHost = str_repeat('a', 255) . '.example.com';
        $server = ['HTTP_HOST' => $longHost];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals($longHost, $result->host);
    }

    public function testVeryLongQueryString(): void
    {
        $this->resetGlobals();
        $_GET = [];

        $longValue = str_repeat('x', 10000);
        $server = ['QUERY_STRING' => 'long_param=' . $longValue];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals($longValue, $result->query_params['long_param']);
    }

    public function testManyCookies(): void
    {
        $this->resetGlobals();
        $_COOKIE = [];

        $cookieParts = [];
        for ($i = 0; $i < 50; $i++) {
            $cookieParts[] = "cookie$i=value$i";
        }
        $server = ['HTTP_COOKIE' => implode('; ', $cookieParts)];

        $result = RequestContextAdaptor::extract($server);

        $this->assertCount(50, $result->cookies);
        $this->assertEquals('value0', $result->cookies['cookie0']);
        $this->assertEquals('value49', $result->cookies['cookie49']);
    }

    public function testSpecialCharactersInReferer(): void
    {
        $server = [
            'HTTP_REFERER' => 'https://example.com/path?query=hello%20world&special=<script>',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals(
            'https://example.com/path?query=hello%20world&special=<script>',
            $result->referer
        );
    }

    public function testUnicodeInQueryParams(): void
    {
        $this->resetGlobals();
        $_GET = ['name' => '日本語', 'emoji' => '🚀'];

        $result = RequestContextAdaptor::extract(['HTTP_HOST' => 'example.com']);

        $this->assertEquals('日本語', $result->query_params['name']);
        $this->assertEquals('🚀', $result->query_params['emoji']);
    }

    public function testUnicodeInCookies(): void
    {
        $this->resetGlobals();
        $_COOKIE = ['lang' => 'العربية'];

        $result = RequestContextAdaptor::extract(['HTTP_HOST' => 'example.com']);

        $this->assertEquals('العربية', $result->cookies['lang']);
    }

    // =========================================================================
    // Consistency Tests
    // =========================================================================

    public function testMultipleCallsProduceSameResult(): void
    {
        $server = [
            'HTTP_HOST' => 'consistent.example.com',
            'HTTP_REFERER' => 'https://referrer.com',
            'REMOTE_ADDR' => '8.8.8.8',
        ];

        $result1 = RequestContextAdaptor::extract($server);
        $result2 = RequestContextAdaptor::extract($server);

        $this->assertEquals($result1->host, $result2->host);
        $this->assertEquals($result1->referer, $result2->referer);
        $this->assertEquals($result1->remote_address, $result2->remote_address);
    }

    public function testDoesNotModifyInputArray(): void
    {
        $server = [
            'HTTP_HOST' => 'example.com',
            'HTTP_REFERER' => 'https://referrer.com',
        ];
        $originalServer = $server;

        RequestContextAdaptor::extract($server);

        $this->assertEquals($originalServer, $server);
    }

    // =========================================================================
    // Facebook/Meta Specific Cookie Tests (FBI Cookie)
    // =========================================================================

    public function testFBICookieExtraction(): void
    {
        $this->resetGlobals();
        $_COOKIE = ['_fbi' => '8.8.8.8.en'];

        $result = RequestContextAdaptor::extract(['HTTP_HOST' => 'example.com']);

        $this->assertEquals('8.8.8.8.en', $result->cookies['_fbi']);
    }

    public function testFBPCookieExtraction(): void
    {
        $this->resetGlobals();
        $_COOKIE = ['_fbp' => 'fb.1.1234567890123.1234567890'];

        $result = RequestContextAdaptor::extract(['HTTP_HOST' => 'example.com']);

        $this->assertEquals('fb.1.1234567890123.1234567890', $result->cookies['_fbp']);
    }

    public function testFBCCookieExtraction(): void
    {
        $this->resetGlobals();
        $_COOKIE = ['_fbc' => 'fb.1.1234567890123.AbCdEfGhIjKlMnOpQrStUvWxYz'];

        $result = RequestContextAdaptor::extract(['HTTP_HOST' => 'example.com']);

        $this->assertEquals('fb.1.1234567890123.AbCdEfGhIjKlMnOpQrStUvWxYz', $result->cookies['_fbc']);
    }

    public function testFbclidInQueryParams(): void
    {
        $this->resetGlobals();
        $_GET = ['fbclid' => 'IwAR3xYz_test_fbclid_value'];

        $result = RequestContextAdaptor::extract(['HTTP_HOST' => 'example.com']);

        $this->assertEquals('IwAR3xYz_test_fbclid_value', $result->query_params['fbclid']);
    }

    // =========================================================================
    // Security-Related Tests
    // =========================================================================

    public function testPotentiallyMaliciousHostHeader(): void
    {
        $server = [
            'HTTP_HOST' => 'evil.com\r\nX-Injected: header',
        ];

        $result = RequestContextAdaptor::extract($server);

        // The class should extract as-is without modification
        // Security validation should be done by the consumer
        $this->assertEquals('evil.com\r\nX-Injected: header', $result->host);
    }

    public function testScriptTagsInQueryParams(): void
    {
        $this->resetGlobals();
        $_GET = ['xss' => '<script>alert("xss")</script>'];

        $result = RequestContextAdaptor::extract(['HTTP_HOST' => 'example.com']);

        // Raw extraction - no sanitization
        $this->assertEquals('<script>alert("xss")</script>', $result->query_params['xss']);
    }

    public function testSQLInjectionInQueryParams(): void
    {
        $this->resetGlobals();
        $_GET = ['id' => "1'; DROP TABLE users; --"];

        $result = RequestContextAdaptor::extract(['HTTP_HOST' => 'example.com']);

        // Raw extraction - no sanitization
        $this->assertEquals("1'; DROP TABLE users; --", $result->query_params['id']);
    }

    // =========================================================================
    // API/CLI Context Tests (No $_SERVER globals)
    // =========================================================================

    public function testAPIContextWithOverrides(): void
    {
        // Simulate API testing context where globals are empty
        $this->resetGlobals();

        $server = [
            'HTTP_HOST' => 'api.example.com',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.50',
            'REMOTE_ADDR' => '127.0.0.1',
            'QUERY_STRING' => 'api_key=abc123&format=json',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('api.example.com', $result->host);
        $this->assertEquals('203.0.113.50', $result->x_forwarded_for);
        $this->assertEquals(['api_key' => 'abc123', 'format' => 'json'], $result->query_params);
    }

    public function testCLIContextWithMinimalData(): void
    {
        $this->resetGlobals();

        // CLI context typically has minimal server data
        $result = RequestContextAdaptor::extract([]);

        $this->assertEquals('', $result->host);
        $this->assertEquals([], $result->query_params);
        $this->assertEquals([], $result->cookies);
        $this->assertNull($result->referer);
        $this->assertNull($result->x_forwarded_for);
        $this->assertNull($result->remote_address);
    }

    // =========================================================================
    // HTTPS/SSL Tests
    // =========================================================================

    public function testHTTPSRequest(): void
    {
        $server = [
            'HTTP_HOST' => 'secure.example.com',
            'HTTPS' => 'on',
            'SERVER_PORT' => '443',
            'REMOTE_ADDR' => '192.168.1.1',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('secure.example.com', $result->host);
    }

    // =========================================================================
    // Cookie Edge Cases
    // =========================================================================

    public function testCookieWithEqualsSignInValue(): void
    {
        $this->resetGlobals();
        $_COOKIE = [];

        $server = [
            'HTTP_COOKIE' => 'base64=dGVzdD1pbj1kYXRh',
        ];

        $result = RequestContextAdaptor::extract($server);

        // Should handle equals signs in cookie values correctly
        $this->assertEquals('dGVzdD1pbj1kYXRh', $result->cookies['base64']);
    }

    public function testCookieWithMultipleEqualsSignsInValue(): void
    {
        $this->resetGlobals();
        $_COOKIE = [];

        $server = [
            'HTTP_COOKIE' => 'complex=a=b=c=d',
        ];

        $result = RequestContextAdaptor::extract($server);

        // explode with limit 2 should preserve all equals after the first
        $this->assertEquals('a=b=c=d', $result->cookies['complex']);
    }

    public function testEmptyCookieHeader(): void
    {
        $this->resetGlobals();
        $_COOKIE = [];

        $server = [
            'HTTP_COOKIE' => '',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals([], $result->cookies);
    }

    // =========================================================================
    // Real-World E-commerce Scenarios
    // =========================================================================

    public function testEcommerceCheckoutPage(): void
    {
        $this->resetGlobals();
        $_GET = [
            'step' => 'payment',
            'cart_id' => 'abc123',
        ];
        $_COOKIE = [
            'session_id' => 'sess_xyz789',
            '_fbp' => 'fb.1.1234567890.987654321',
            '_fbc' => 'fb.1.1234567890.IwAR123456',
            'cart' => 'encoded_cart_data',
        ];

        $server = [
            'HTTP_HOST' => 'shop.example.com',
            'HTTP_REFERER' => 'https://shop.example.com/cart',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.50',
            'REMOTE_ADDR' => '10.0.0.1',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('shop.example.com', $result->host);
        $this->assertEquals('payment', $result->query_params['step']);
        $this->assertArrayHasKey('_fbp', $result->cookies);
        $this->assertArrayHasKey('_fbc', $result->cookies);
        $this->assertEquals('https://shop.example.com/cart', $result->referer);
    }

    public function testLandingPageWithUTMParams(): void
    {
        $this->resetGlobals();
        $_GET = [
            'utm_source' => 'facebook',
            'utm_medium' => 'cpc',
            'utm_campaign' => 'spring_sale',
            'fbclid' => 'IwAR3abc123',
        ];
        $_COOKIE = [];

        $server = [
            'HTTP_HOST' => 'landing.example.com',
            'HTTP_REFERER' => 'https://www.facebook.com/',
            'REMOTE_ADDR' => '8.8.8.8',
        ];

        $result = RequestContextAdaptor::extract($server);

        $this->assertEquals('facebook', $result->query_params['utm_source']);
        $this->assertEquals('IwAR3abc123', $result->query_params['fbclid']);
        $this->assertEquals('https://www.facebook.com/', $result->referer);
    }

    // =========================================================================
    // Merge Logic Tests - Overrides take priority over global $_SERVER
    // =========================================================================

    /**
     * Test that overrides take priority over global $_SERVER values
     */
    public function testMergeLogicOverridesTakePriority(): void
    {
        $_SERVER = [
            'HTTP_HOST' => 'global.example.com',
            'REMOTE_ADDR' => '10.0.0.1',
            'HTTP_REFERER' => 'https://global-referer.com',
        ];

        $overrides = [
            'HTTP_HOST' => 'override.example.com',
            'REMOTE_ADDR' => '192.168.1.1',
        ];

        $result = RequestContextAdaptor::extract($overrides);

        // Overrides should win
        $this->assertEquals('override.example.com', $result->host);
        $this->assertEquals('192.168.1.1', $result->remote_address);
        // Global value should be used when not overridden
        $this->assertEquals('https://global-referer.com', $result->referer);
    }

    /**
     * Test that global $_SERVER values are used as fallback when not overridden
     */
    public function testMergeLogicGlobalFallback(): void
    {
        $_SERVER = [
            'HTTP_HOST' => 'global.example.com',
            'REMOTE_ADDR' => '10.0.0.1',
            'HTTP_REFERER' => 'https://global-referer.com',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.50',
        ];

        // Only override host
        $overrides = [
            'HTTP_HOST' => 'override.example.com',
        ];

        $result = RequestContextAdaptor::extract($overrides);

        // Override wins for host
        $this->assertEquals('override.example.com', $result->host);
        // Global values used for everything else
        $this->assertEquals('10.0.0.1', $result->remote_address);
        $this->assertEquals('https://global-referer.com', $result->referer);
        $this->assertEquals('203.0.113.50', $result->x_forwarded_for);
    }

    /**
     * Test merge with empty overrides uses all global values
     */
    public function testMergeLogicEmptyOverridesUsesGlobals(): void
    {
        $_SERVER = [
            'HTTP_HOST' => 'global.example.com',
            'REMOTE_ADDR' => '10.0.0.1',
            'HTTP_REFERER' => 'https://global-referer.com',
        ];

        $result = RequestContextAdaptor::extract([]);

        // All global values should be used
        $this->assertEquals('global.example.com', $result->host);
        $this->assertEquals('10.0.0.1', $result->remote_address);
        $this->assertEquals('https://global-referer.com', $result->referer);
    }

    /**
     * Test merge with null overrides uses all global values
     */
    public function testMergeLogicNullOverridesUsesGlobals(): void
    {
        $_SERVER = [
            'HTTP_HOST' => 'global.example.com',
            'REMOTE_ADDR' => '10.0.0.1',
        ];

        $result = RequestContextAdaptor::extract(null);

        $this->assertEquals('global.example.com', $result->host);
        $this->assertEquals('10.0.0.1', $result->remote_address);
    }

    /**
     * Test that overrides can add new keys not present in global $_SERVER
     */
    public function testMergeLogicOverridesAddNewKeys(): void
    {
        $_SERVER = [
            'HTTP_HOST' => 'global.example.com',
        ];

        $overrides = [
            'REMOTE_ADDR' => '192.168.1.1',
            'HTTP_REFERER' => 'https://override-referer.com',
            'HTTP_X_FORWARDED_FOR' => '8.8.8.8',
        ];

        $result = RequestContextAdaptor::extract($overrides);

        // Global host is used
        $this->assertEquals('global.example.com', $result->host);
        // New keys from overrides are added
        $this->assertEquals('192.168.1.1', $result->remote_address);
        $this->assertEquals('https://override-referer.com', $result->referer);
        $this->assertEquals('8.8.8.8', $result->x_forwarded_for);
    }

    /**
     * Test that overrides can set values to null to effectively override global values
     */
    public function testMergeLogicOverridesCanSetNull(): void
    {
        $_SERVER = [
            'HTTP_HOST' => 'global.example.com',
            'HTTP_REFERER' => 'https://global-referer.com',
        ];

        $overrides = [
            'HTTP_REFERER' => null,
        ];

        $result = RequestContextAdaptor::extract($overrides);

        // Host from global
        $this->assertEquals('global.example.com', $result->host);
        // Referer is null because override set it to null
        $this->assertNull($result->referer);
    }

    /**
     * Test that overrides can set values to empty string
     */
    public function testMergeLogicOverridesCanSetEmptyString(): void
    {
        $_SERVER = [
            'HTTP_HOST' => 'global.example.com',
            'HTTP_REFERER' => 'https://global-referer.com',
        ];

        $overrides = [
            'HTTP_HOST' => '',
            'HTTP_REFERER' => '',
        ];

        $result = RequestContextAdaptor::extract($overrides);

        // Override empty string should win
        $this->assertEquals('', $result->host);
        $this->assertEquals('', $result->referer);
    }

    /**
     * Test merge behavior in typical web server context
     * Global $_SERVER has connection info, overrides have custom headers
     */
    public function testMergeLogicTypicalWebServerContext(): void
    {
        // Simulate typical $_SERVER from web server
        $_SERVER = [
            'HTTP_HOST' => 'www.example.com',
            'REMOTE_ADDR' => '172.31.0.1', // Load balancer internal IP
            'SERVER_PORT' => '443',
            'HTTPS' => 'on',
            'REQUEST_METHOD' => 'GET',
        ];

        // Override with actual client info from proxy headers
        $overrides = [
            'HTTP_X_FORWARDED_FOR' => '203.0.113.50, 172.31.0.1',
            'HTTP_REFERER' => 'https://facebook.com/ad',
        ];

        $result = RequestContextAdaptor::extract($overrides);

        // Global values preserved
        $this->assertEquals('www.example.com', $result->host);
        $this->assertEquals('172.31.0.1', $result->remote_address);
        // Override values added
        $this->assertEquals('203.0.113.50, 172.31.0.1', $result->x_forwarded_for);
        $this->assertEquals('https://facebook.com/ad', $result->referer);
    }

    /**
     * Test merge with QUERY_STRING from both sources
     */
    public function testMergeLogicQueryStringFromOverride(): void
    {
        $this->resetGlobals();
        $_GET = []; // Empty $_GET so QUERY_STRING is used

        $_SERVER = [
            'HTTP_HOST' => 'example.com',
            'QUERY_STRING' => 'global_param=global_value',
        ];

        $overrides = [
            'QUERY_STRING' => 'override_param=override_value',
        ];

        $result = RequestContextAdaptor::extract($overrides);

        // Override QUERY_STRING should win
        $this->assertEquals(['override_param' => 'override_value'], $result->query_params);
    }

    /**
     * Test merge with HTTP_COOKIE from both sources
     */
    public function testMergeLogicHttpCookieFromOverride(): void
    {
        $this->resetGlobals();
        $_COOKIE = []; // Empty $_COOKIE so HTTP_COOKIE is used

        $_SERVER = [
            'HTTP_HOST' => 'example.com',
            'HTTP_COOKIE' => 'global_cookie=global_value',
        ];

        $overrides = [
            'HTTP_COOKIE' => 'override_cookie=override_value',
        ];

        $result = RequestContextAdaptor::extract($overrides);

        // Override HTTP_COOKIE should win
        $this->assertEquals(['override_cookie' => 'override_value'], $result->cookies);
    }

    /**
     * Test that all header extraction works with merged server array
     */
    public function testMergeLogicAllHeadersFromMixedSources(): void
    {
        $_SERVER = [
            'HTTP_HOST' => 'global.example.com',
            'REMOTE_ADDR' => '10.0.0.1',
        ];

        $overrides = [
            'HTTP_HOST' => 'override.example.com',
            'HTTP_REFERER' => 'https://override-referer.com',
            'HTTP_X_FORWARDED_FOR' => '8.8.8.8',
        ];

        $result = RequestContextAdaptor::extract($overrides);

        // Verify all headers are correctly extracted from merged array
        $this->assertEquals('override.example.com', $result->host);
        $this->assertEquals('https://override-referer.com', $result->referer);
        $this->assertEquals('8.8.8.8', $result->x_forwarded_for);
        $this->assertEquals('10.0.0.1', $result->remote_address);
    }

    /**
     * Test merge with complex real-world scenario
     */
    public function testMergeLogicComplexRealWorldScenario(): void
    {
        // Simulate production web server with load balancer
        $_SERVER = [
            'HTTP_HOST' => 'api.example.com',
            'REMOTE_ADDR' => '10.0.0.1', // Internal LB IP
            'SERVER_PORT' => '443',
            'HTTPS' => 'on',
            'REQUEST_URI' => '/api/v1/users',
            'HTTP_USER_AGENT' => 'Mozilla/5.0',
        ];
        $_GET = ['page' => '1', 'limit' => '10'];
        $_COOKIE = ['session' => 'abc123'];

        // Overrides from application layer (e.g., testing or custom handling)
        $overrides = [
            'HTTP_X_FORWARDED_FOR' => '203.0.113.50, 10.0.0.1',
            'HTTP_REFERER' => 'https://app.example.com/dashboard',
            'HTTP_X_REQUEST_ID' => 'req-12345',
        ];

        $result = RequestContextAdaptor::extract($overrides);

        // Global values preserved
        $this->assertEquals('api.example.com', $result->host);
        $this->assertEquals('10.0.0.1', $result->remote_address);
        // Override values
        $this->assertEquals('203.0.113.50, 10.0.0.1', $result->x_forwarded_for);
        $this->assertEquals('https://app.example.com/dashboard', $result->referer);
        // Global $_GET and $_COOKIE still work
        $this->assertEquals(['page' => '1', 'limit' => '10'], $result->query_params);
        $this->assertEquals(['session' => 'abc123'], $result->cookies);
    }

    /**
     * Test merge handles globals with many keys efficiently
     */
    public function testMergeLogicWithManyGlobalKeys(): void
    {
        // Simulate real $_SERVER with many keys
        $_SERVER = [
            'HTTP_HOST' => 'example.com',
            'REMOTE_ADDR' => '127.0.0.1',
            'SERVER_NAME' => 'example.com',
            'SERVER_PORT' => '80',
            'REQUEST_METHOD' => 'GET',
            'REQUEST_URI' => '/',
            'SCRIPT_NAME' => '/index.php',
            'PHP_SELF' => '/index.php',
            'DOCUMENT_ROOT' => '/var/www/html',
            'HTTP_ACCEPT' => 'text/html',
            'HTTP_ACCEPT_LANGUAGE' => 'en-US',
            'HTTP_ACCEPT_ENCODING' => 'gzip, deflate',
            'HTTP_CONNECTION' => 'keep-alive',
        ];

        // Simple override
        $overrides = [
            'HTTP_HOST' => 'override.example.com',
            'HTTP_X_FORWARDED_FOR' => '8.8.8.8',
        ];

        $result = RequestContextAdaptor::extract($overrides);

        // Override wins
        $this->assertEquals('override.example.com', $result->host);
        $this->assertEquals('8.8.8.8', $result->x_forwarded_for);
        // Global fallback
        $this->assertEquals('127.0.0.1', $result->remote_address);
    }

    /**
     * Test that partial overrides work correctly
     * Only override specific headers, keep rest from global
     */
    public function testMergeLogicPartialOverride(): void
    {
        $_SERVER = [
            'HTTP_HOST' => 'global.example.com',
            'REMOTE_ADDR' => '192.168.1.1',
            'HTTP_REFERER' => 'https://global-referer.com',
            'HTTP_X_FORWARDED_FOR' => '10.0.0.1',
        ];

        // Only override X-Forwarded-For (common pattern for proxies)
        $overrides = [
            'HTTP_X_FORWARDED_FOR' => '203.0.113.50, 10.0.0.1',
        ];

        $result = RequestContextAdaptor::extract($overrides);

        // All global values except the overridden one
        $this->assertEquals('global.example.com', $result->host);
        $this->assertEquals('192.168.1.1', $result->remote_address);
        $this->assertEquals('https://global-referer.com', $result->referer);
        // Override wins for X-Forwarded-For
        $this->assertEquals('203.0.113.50, 10.0.0.1', $result->x_forwarded_for);
    }
}
