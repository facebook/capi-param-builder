<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

use PHPUnit\Framework\TestCase;
use FacebookAds\ParamBuilder;
use FacebookAds\PlainDataObject;
use FacebookAds\AppendixProvider;

require_once 'ETLDPlus1ResolverForUnitTest.php';
require_once __DIR__ . '/../src/ParamBuilder.php';
require_once __DIR__ . '/../src/util/AppendixProvider.php';
require_once __DIR__ . '/../src/util/RequestAdaptor.php';
require_once __DIR__ . '/../src/model/PlainDataObject.php';
require_once __DIR__ . '/../src/model/Constants.php';

/**
 * Unit tests for ParamBuilder::processRequestFromContext
 *
 * Tests cover:
 * - PlainDataObject input handling
 * - Server array (context) input handling
 * - Null input handling (uses globals)
 * - Various PHP framework patterns
 * - Edge cases and error handling
 * - Equivalence with processRequest
 */
final class ProcessRequestFromContextTest extends TestCase
{
    private $original_server;
    private $original_get;
    private $original_cookie;
    private $appendix_net_new;
    private $appendix_modified_new;
    private $appendix_no_change;

    protected function setUp(): void
    {
        // Backup global variables
        $this->original_server = $_SERVER ?? [];
        $this->original_get = $_GET ?? [];
        $this->original_cookie = $_COOKIE ?? [];

        // Get the actual appendix values from AppendixProvider
        $this->appendix_net_new =
            AppendixProvider::getAppendix(APPENDIX_NET_NEW);
        $this->appendix_modified_new =
            AppendixProvider::getAppendix(APPENDIX_MODIFIED_NEW);
        $this->appendix_no_change =
            AppendixProvider::getAppendix(APPENDIX_NO_CHANGE);
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
    // PlainDataObject Input Tests
    // =========================================================================

    public function testProcessRequestFromContextWithPlainDataObject(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            ['fbclid' => 'test123'],
            [],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        $this->assertIsArray($result);
        $this->assertNotEmpty($result);
        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.test123.' . $this->appendix_net_new, $builder->getFbc());
        $this->assertIsString($builder->getFbp());
    }

    public function testProcessRequestFromContextWithPlainDataObjectFullData(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'shop.example.com',
            ['fbclid' => 'IwAR3xyz', 'utm_source' => 'facebook'],
            ['_fbp' => 'fb.1.1234567890.9876543210.' . $this->appendix_no_change],
            'https://facebook.com/ad',
            '203.0.113.50',
            '10.0.0.1'
        );

        $result = $builder->processRequestFromContext($dataObject);

        $this->assertIsArray($result);
        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.IwAR3xyz.' . $this->appendix_net_new, $builder->getFbc());
        // Existing fbp should be preserved
        $this->assertEquals(
            'fb.1.1234567890.9876543210.' . $this->appendix_no_change,
            $builder->getFbp()
        );
    }

    public function testProcessRequestFromContextWithPlainDataObjectExistingCookies(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            [],
            [
                '_fbc' => 'fb.1.123456.abc',
                '_fbp' => 'fb.1.123456.7890'
            ],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        // Should append language token to existing cookies
        $this->assertEquals('fb.1.123456.abc.' . $this->appendix_no_change, $builder->getFbc());
        $this->assertEquals('fb.1.123456.7890.' . $this->appendix_no_change, $builder->getFbp());
    }

    public function testProcessRequestFromContextWithPlainDataObjectEmptyValues(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            '',
            [],
            [],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        // Should still generate fbp even with empty host
        $this->assertNull($builder->getFbc());
        $this->assertIsString($builder->getFbp());
        $this->assertStringEndsWith('.' . $this->appendix_net_new, $builder->getFbp());
    }

    // =========================================================================
    // Server Array (Context) Input Tests
    // =========================================================================

    public function testProcessRequestFromContextWithServerArray(): void
    {
        $this->resetGlobals();
        $_GET = ['fbclid' => 'fromGlobalGet'];

        $builder = new ParamBuilder();

        $context = [
            'HTTP_HOST' => 'api.example.com',
            'REMOTE_ADDR' => '192.168.1.100',
        ];

        $result = $builder->processRequestFromContext($context);

        $this->assertIsArray($result);
        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.fromGlobalGet.' . $this->appendix_net_new, $builder->getFbc());
        $this->assertIsString($builder->getFbp());
    }

    public function testProcessRequestFromContextWithServerArrayAndQueryString(): void
    {
        $this->resetGlobals();
        $_GET = [];

        $builder = new ParamBuilder();

        $context = [
            'HTTP_HOST' => 'shop.example.com',
            'QUERY_STRING' => 'fbclid=IwAR123&page=checkout',
            'REMOTE_ADDR' => '8.8.8.8',
        ];

        $result = $builder->processRequestFromContext($context);

        $this->assertIsArray($result);
        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.IwAR123.' . $this->appendix_net_new, $builder->getFbc());
    }

    public function testProcessRequestFromContextWithServerArrayAndCookieHeader(): void
    {
        $this->resetGlobals();
        $_COOKIE = [];

        $builder = new ParamBuilder();

        $context = [
            'HTTP_HOST' => 'example.com',
            'HTTP_COOKIE' => '_fbc=fb.1.123.abc; _fbp=fb.1.456.7890',
        ];

        $result = $builder->processRequestFromContext($context);

        $this->assertEquals('fb.1.123.abc.' . $this->appendix_no_change, $builder->getFbc());
        $this->assertEquals('fb.1.456.7890.' . $this->appendix_no_change, $builder->getFbp());
    }

    public function testProcessRequestFromContextWithServerArrayAndReferer(): void
    {
        $this->resetGlobals();
        $_GET = [];

        $builder = new ParamBuilder();

        $context = [
            'HTTP_HOST' => 'landing.example.com',
            'HTTP_REFERER' => 'https://facebook.com/ad?fbclid=IwAR_referer',
            'REMOTE_ADDR' => '203.0.113.1',
        ];

        $result = $builder->processRequestFromContext($context);

        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.IwAR_referer.' . $this->appendix_net_new, $builder->getFbc());
    }

    public function testProcessRequestFromContextWithServerArrayAndXForwardedFor(): void
    {
        $this->resetGlobals();
        $_GET = ['fbclid' => 'test'];
        $_COOKIE = ['_fbi' => '8.8.8.8.en'];

        $builder = new ParamBuilder();

        $context = [
            'HTTP_HOST' => 'example.com',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.50, 10.0.0.1',
            'REMOTE_ADDR' => '10.0.0.1',
        ];

        $result = $builder->processRequestFromContext($context);

        $this->assertIsString($builder->getFbc());
        // Client IP should be extracted from x_forwarded_for
        $clientIp = $builder->getClientIpAddress();
        // Should have processed client IP
        $this->assertNotNull($clientIp);
    }

    // =========================================================================
    // Null Input Tests (Uses Global Variables)
    // =========================================================================

    public function testProcessRequestFromContextWithNullUsesGlobals(): void
    {
        $_SERVER = [
            'HTTP_HOST' => 'global.example.com',
            'REMOTE_ADDR' => '192.168.1.1',
        ];
        $_GET = ['fbclid' => 'globalFbclid'];
        $_COOKIE = [];

        $builder = new ParamBuilder();

        $result = $builder->processRequestFromContext(null);

        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.globalFbclid.' . $this->appendix_net_new, $builder->getFbc());
        $this->assertIsString($builder->getFbp());
    }

    public function testProcessRequestFromContextWithNullAndGlobalCookies(): void
    {
        $_SERVER = [
            'HTTP_HOST' => 'example.com',
        ];
        $_GET = [];
        $_COOKIE = [
            '_fbc' => 'fb.1.111.existingFbc',
            '_fbp' => 'fb.1.222.existingFbp',
        ];

        $builder = new ParamBuilder();

        $result = $builder->processRequestFromContext(null);

        $this->assertEquals('fb.1.111.existingFbc.' . $this->appendix_no_change, $builder->getFbc());
        $this->assertEquals('fb.1.222.existingFbp.' . $this->appendix_no_change, $builder->getFbp());
    }

    public function testProcessRequestFromContextWithEmptyGlobals(): void
    {
        $this->resetGlobals();

        $builder = new ParamBuilder();

        $result = $builder->processRequestFromContext(null);

        $this->assertNull($builder->getFbc());
        $this->assertIsString($builder->getFbp());
        $this->assertStringEndsWith('.' . $this->appendix_net_new, $builder->getFbp());
    }

    // =========================================================================
    // Equivalence Tests (processRequestFromContext vs processRequest)
    // =========================================================================

    public function testProcessRequestFromContextEquivalentToProcessRequest(): void
    {
        $host = 'shop.example.com';
        $queries = ['fbclid' => 'equivalenceTest'];
        $cookies = [];
        $referer = 'https://facebook.com/ad';
        $x_forwarded_for = '203.0.113.50';
        $remote_address = '10.0.0.1';

        // Using processRequest directly
        $builder1 = new ParamBuilder();
        $result1 = $builder1->processRequest(
            $host,
            $queries,
            $cookies,
            $referer,
            $x_forwarded_for,
            $remote_address
        );

        // Using processRequestFromContext with PlainDataObject
        $builder2 = new ParamBuilder();
        $dataObject = new PlainDataObject(
            $host,
            $queries,
            $cookies,
            $referer,
            $x_forwarded_for,
            $remote_address
        );
        $result2 = $builder2->processRequestFromContext($dataObject);

        // Results should be equivalent (except for timestamps)
        $this->assertEquals(count($result1), count($result2));

        // Compare fbc payload (excluding timestamp)
        $fbc1Parts = explode('.', $builder1->getFbc());
        $fbc2Parts = explode('.', $builder2->getFbc());
        $this->assertEquals($fbc1Parts[0], $fbc2Parts[0]); // prefix
        $this->assertEquals($fbc1Parts[1], $fbc2Parts[1]); // subdomain index
        // Skip timestamp comparison (index 2)
        $this->assertEquals($fbc1Parts[3], $fbc2Parts[3]); // payload
        $this->assertEquals(end($fbc1Parts), end($fbc2Parts)); // appendix
    }

    public function testProcessRequestFromContextWithExistingCookiesEquivalent(): void
    {
        $host = 'example.com';
        $queries = [];
        $cookies = [
            '_fbc' => 'fb.1.123.existingPayload',
            '_fbp' => 'fb.1.456.existingFbp',
        ];
        $referer = null;
        $x_forwarded_for = null;
        $remote_address = null;

        $builder1 = new ParamBuilder();
        $builder1->processRequest($host, $queries, $cookies, $referer, $x_forwarded_for, $remote_address);

        $builder2 = new ParamBuilder();
        $dataObject = new PlainDataObject($host, $queries, $cookies, $referer, $x_forwarded_for, $remote_address);
        $builder2->processRequestFromContext($dataObject);

        $this->assertEquals($builder1->getFbc(), $builder2->getFbc());
        $this->assertEquals($builder1->getFbp(), $builder2->getFbp());
    }

    // =========================================================================
    // PHP Framework Simulation Tests
    // =========================================================================

    public function testLaravelRequestSimulation(): void
    {
        $this->resetGlobals();
        $_GET = ['page' => '1', 'fbclid' => 'laravelTest'];
        $_COOKIE = ['laravel_session' => 'abc123'];

        $builder = new ParamBuilder();

        // Simulating Laravel's $_SERVER
        $context = [
            'HTTP_HOST' => 'laravel.test',
            'HTTP_REFERER' => 'https://laravel.test/dashboard',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.50',
            'REMOTE_ADDR' => '127.0.0.1',
            'QUERY_STRING' => 'page=1&fbclid=laravelTest',
        ];

        $result = $builder->processRequestFromContext($context);

        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.laravelTest.' . $this->appendix_net_new, $builder->getFbc());
    }

    public function testSymfonyRequestSimulation(): void
    {
        $this->resetGlobals();
        $_GET = ['fbclid' => 'symfonyTest'];
        $_COOKIE = ['PHPSESSID' => 'session123'];

        $builder = new ParamBuilder();

        $context = [
            'HTTP_HOST' => 'symfony.local:8000',
            'HTTP_REFERER' => 'https://symfony.local/app',
            'REMOTE_ADDR' => '::1',
        ];

        $result = $builder->processRequestFromContext($context);

        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.symfonyTest.' . $this->appendix_net_new, $builder->getFbc());
    }

    public function testWordPressRequestSimulation(): void
    {
        $this->resetGlobals();
        $_GET = ['p' => '123', 'fbclid' => 'wpTest'];
        $_COOKIE = ['wordpress_logged_in_abc' => 'user123'];

        $builder = new ParamBuilder();

        $context = [
            'HTTP_HOST' => 'wordpress.local',
            'REMOTE_ADDR' => '192.168.1.50',
        ];

        $result = $builder->processRequestFromContext($context);

        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.wpTest.' . $this->appendix_net_new, $builder->getFbc());
    }

    public function testMagentoRequestSimulation(): void
    {
        $this->resetGlobals();
        $_GET = ['product_id' => '42', 'fbclid' => 'magentoTest'];
        $_COOKIE = [
            'frontend' => 'abc123',
            'store' => 'default',
        ];

        $builder = new ParamBuilder();

        $context = [
            'HTTP_HOST' => 'magento.shop.com',
            'HTTP_REFERER' => 'https://magento.shop.com/catalog',
            'HTTP_X_FORWARDED_FOR' => '8.8.8.8, 10.0.0.1',
            'REMOTE_ADDR' => '10.0.0.1',
        ];

        $result = $builder->processRequestFromContext($context);

        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.magentoTest.' . $this->appendix_net_new, $builder->getFbc());
    }

    public function testDrupalRequestSimulation(): void
    {
        $this->resetGlobals();
        $_GET = ['q' => 'node/123', 'fbclid' => 'drupalTest'];
        $_COOKIE = ['SESS123' => 'drupal_session'];

        $builder = new ParamBuilder();

        $context = [
            'HTTP_HOST' => 'drupal.example.com',
            'HTTP_REFERER' => 'https://drupal.example.com/admin',
            'REMOTE_ADDR' => '10.0.0.5',
        ];

        $result = $builder->processRequestFromContext($context);

        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.drupalTest.' . $this->appendix_net_new, $builder->getFbc());
    }

    // =========================================================================
    // Cookie Update Tests
    // =========================================================================

    public function testProcessRequestFromContextUpdatesFbcWhenPayloadChanges(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            ['fbclid' => 'newPayload'],
            ['_fbc' => 'fb.1.123.oldPayload'],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        // fbc should be updated with new payload
        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.newPayload.' . $this->appendix_modified_new, $builder->getFbc());
    }

    public function testProcessRequestFromContextPreservesFbcWhenPayloadSame(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            ['fbclid' => 'samePayload'],
            ['_fbc' => 'fb.1.123.samePayload'],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        // fbc should be preserved with no_change appendix
        $this->assertEquals('fb.1.123.samePayload.' . $this->appendix_no_change, $builder->getFbc());
    }

    public function testProcessRequestFromContextGeneratesNewFbpWhenMissing(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            [],
            [], // No existing fbp
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        $this->assertIsString($builder->getFbp());
        $this->assertStringStartsWith('fb.', $builder->getFbp());
        $this->assertStringEndsWith('.' . $this->appendix_net_new, $builder->getFbp());
    }

    public function testProcessRequestFromContextPreservesExistingFbp(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            [],
            ['_fbp' => 'fb.1.999.existingFbp'],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        // Existing fbp should be preserved with appendix added
        $this->assertEquals('fb.1.999.existingFbp.' . $this->appendix_no_change, $builder->getFbp());
    }

    // =========================================================================
    // Domain Handling Tests
    // =========================================================================

    public function testProcessRequestFromContextWithDomainList(): void
    {
        $builder = new ParamBuilder(['example.com', 'test.com']);

        $dataObject = new PlainDataObject(
            'shop.subdomain.test.com',
            ['fbclid' => 'domainTest'],
            [],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        $this->assertIsArray($result);
        $this->assertNotEmpty($result);
        // Check that domain is correctly resolved
        foreach ($result as $cookie) {
            $this->assertEquals('test.com', $cookie->domain);
        }
    }

    public function testProcessRequestFromContextWithResolver(): void
    {
        $builder = new ParamBuilder(new ETLDPlus1ResolverForUnitTest());

        $dataObject = new PlainDataObject(
            'my.custom.domain.com',
            ['fbclid' => 'resolverTest'],
            [],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        $this->assertIsArray($result);
        $this->assertNotEmpty($result);
        // ETLDPlus1ResolverForUnitTest returns the host as-is
        foreach ($result as $cookie) {
            $this->assertEquals('my.custom.domain.com', $cookie->domain);
        }
    }

    public function testProcessRequestFromContextWithIPv4Host(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            '127.0.0.1:8080',
            ['fbclid' => 'ipv4Test'],
            [],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.ipv4Test.' . $this->appendix_net_new, $builder->getFbc());
    }

    public function testProcessRequestFromContextWithIPv6Host(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            '[::1]:8080',
            ['fbclid' => 'ipv6Test'],
            [],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.ipv6Test.' . $this->appendix_net_new, $builder->getFbc());
    }

    // =========================================================================
    // Client IP Tests
    // =========================================================================

    public function testProcessRequestFromContextExtractsClientIpFromXForwardedFor(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            '203.0.113.50, 10.0.0.1',
            '10.0.0.1'
        );

        $builder->processRequestFromContext($dataObject);

        // Client IP should be the first public IP from X-Forwarded-For
        $clientIp = $builder->getClientIpAddress();
        $this->assertNotNull($clientIp);
        $this->assertStringStartsWith('203.0.113.50', $clientIp);
    }

    public function testProcessRequestFromContextExtractsClientIpFromRemoteAddress(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null, // No X-Forwarded-For
            '8.8.8.8'
        );

        $builder->processRequestFromContext($dataObject);

        $clientIp = $builder->getClientIpAddress();
        $this->assertNotNull($clientIp);
        $this->assertStringStartsWith('8.8.8.8', $clientIp);
    }

    public function testProcessRequestFromContextWithFBICookie(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            [],
            ['_fbi' => '8.8.8.8.en'],
            null,
            '203.0.113.50',
            null
        );

        $builder->processRequestFromContext($dataObject);

        $clientIp = $builder->getClientIpAddress();
        // Should prioritize cookie IP if it's a valid public IP
        $this->assertNotNull($clientIp);
    }

    // =========================================================================
    // Referer Handling Tests
    // =========================================================================

    public function testProcessRequestFromContextExtractsFbclidFromReferer(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'landing.example.com',
            [], // No query params
            [],
            'https://facebook.com/ad?fbclid=IwAR_fromReferer',
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.IwAR_fromReferer.' . $this->appendix_net_new, $builder->getFbc());
    }

    public function testProcessRequestFromContextQueryParamsTakePrecedenceOverReferer(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            ['fbclid' => 'fromQueryParams'],
            [],
            'https://facebook.com/ad?fbclid=fromReferer',
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        // Query params should take precedence
        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.fromQueryParams.' . $this->appendix_net_new, $builder->getFbc());
    }

    public function testProcessRequestFromContextWithRefererWithoutFbclid(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            [],
            [],
            'https://google.com/search?q=test', // No fbclid
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        // No fbc should be generated
        $this->assertNull($builder->getFbc());
        $this->assertIsString($builder->getFbp());
    }

    // =========================================================================
    // Edge Cases and Error Handling
    // =========================================================================

    public function testProcessRequestFromContextWithInvalidCookieFormat(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            [],
            [
                '_fbc' => 'invalid.format.with.too.many.parts.here',
                '_fbp' => 'also.invalid.format.too.many'
            ],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        // Invalid cookies should be ignored, new ones generated
        $this->assertNull($builder->getFbc());
        $this->assertIsString($builder->getFbp());
        $this->assertStringEndsWith('.' . $this->appendix_net_new, $builder->getFbp());
    }

    public function testProcessRequestFromContextWithInvalidLanguageToken(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            [],
            [
                '_fbc' => 'fb.1.123.abc.INVALID',
                '_fbp' => 'fb.1.456.7890.INVALID'
            ],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        // Cookies with invalid language tokens should be invalidated
        $this->assertNull($builder->getFbc());
        $this->assertIsString($builder->getFbp());
        $this->assertStringEndsWith('.' . $this->appendix_net_new, $builder->getFbp());
    }

    public function testProcessRequestFromContextWithValidLanguageToken(): void
    {
        $builder = new ParamBuilder();

        $langToken = SUPPORTED_LANGUAGES_TOKEN[0]; // Get first valid token

        $dataObject = new PlainDataObject(
            'example.com',
            [],
            [
                '_fbc' => 'fb.1.123.abc.' . $langToken,
                '_fbp' => 'fb.1.456.7890.' . $langToken
            ],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        // Cookies with valid language tokens should be preserved
        $this->assertEquals('fb.1.123.abc.' . $langToken, $builder->getFbc());
        $this->assertEquals('fb.1.456.7890.' . $langToken, $builder->getFbp());
    }

    public function testProcessRequestFromContextMultipleCallsResetState(): void
    {
        $builder = new ParamBuilder();

        // First call
        $dataObject1 = new PlainDataObject(
            'first.example.com',
            ['fbclid' => 'firstCall'],
            [],
            null,
            null,
            null
        );
        $builder->processRequestFromContext($dataObject1);
        $fbc1 = $builder->getFbc();
        $fbp1 = $builder->getFbp();

        // Second call with different data
        $dataObject2 = new PlainDataObject(
            'second.example.com',
            ['fbclid' => 'secondCall'],
            [],
            null,
            null,
            null
        );
        $builder->processRequestFromContext($dataObject2);
        $fbc2 = $builder->getFbc();
        $fbp2 = $builder->getFbp();

        // Values should be different
        $this->assertStringEndsWith('.firstCall.' . $this->appendix_net_new, $fbc1);
        $this->assertStringEndsWith('.secondCall.' . $this->appendix_net_new, $fbc2);
        $this->assertNotEquals($fbp1, $fbp2);
    }

    public function testProcessRequestFromContextWithSpecialCharactersInFbclid(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            ['fbclid' => 'IwAR3_test-special.chars'],
            [],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        $this->assertIsString($builder->getFbc());
        // Fbclid with special characters should be preserved
        $this->assertStringContains('IwAR3_test-special.chars', $builder->getFbc());
    }

    public function testProcessRequestFromContextWithUnicodeInHost(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com', // Punycode would be used in practice
            ['fbclid' => 'unicodeHost'],
            [],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.unicodeHost.' . $this->appendix_net_new, $builder->getFbc());
    }

    public function testProcessRequestFromContextReturnsCorrectCookieSettings(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'shop.sub.example.com',
            ['fbclid' => 'cookieSettingsTest'],
            [],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        $this->assertIsArray($result);
        $this->assertCount(2, $result); // fbc and fbp

        foreach ($result as $cookie) {
            $this->assertTrue(property_exists($cookie, 'name'), 'Cookie should have name property');
            $this->assertTrue(property_exists($cookie, 'value'), 'Cookie should have value property');
            $this->assertTrue(property_exists($cookie, 'domain'), 'Cookie should have domain property');
            $this->assertTrue(property_exists($cookie, 'max_age'), 'Cookie should have max_age property');

            $this->assertTrue(in_array($cookie->name, ['_fbc', '_fbp']));
            $this->assertEquals(DEFAULT_1PC_AGE, $cookie->max_age);
        }
    }

    public function testProcessRequestFromContextWithEmptyQueryParams(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            [], // Empty query params
            [],
            null,
            null,
            null
        );

        $result = $builder->processRequestFromContext($dataObject);

        $this->assertNull($builder->getFbc());
        $this->assertIsString($builder->getFbp());
    }

    public function testProcessRequestFromContextGetCookiesToSet(): void
    {
        $builder = new ParamBuilder();

        $dataObject = new PlainDataObject(
            'example.com',
            ['fbclid' => 'getCookiesTest'],
            [],
            null,
            null,
            null
        );

        $builder->processRequestFromContext($dataObject);

        $cookies = $builder->getCookiesToSet();

        $this->assertIsArray($cookies);
        $this->assertEquals(2, count($cookies));
    }

    /**
     * Helper method to check if string contains substring
     */
    private function assertStringContains(string $needle, string $haystack): void
    {
        $this->assertTrue(
            strpos($haystack, $needle) !== false,
            "Failed asserting that '$haystack' contains '$needle'"
        );
    }
}
