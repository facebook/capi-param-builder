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
use FacebookAds\RequestContextAdaptor;
use FacebookAds\AppendixProvider;

require_once __DIR__ . '/../src/ParamBuilder.php';
require_once __DIR__ . '/../src/util/RequestContextAdaptor.php';
require_once __DIR__ . '/../src/util/AppendixProvider.php';
require_once __DIR__ . '/../src/model/PlainDataObject.php';
require_once __DIR__ . '/../src/model/Constants.php';

final class ReferrerUrlTest extends TestCase
{
    private $original_server;
    private $original_get;
    private $original_cookie;
    private $no_change_suffix;
    private $net_new_suffix;

    protected function setUp(): void
    {
        $this->original_server = $_SERVER ?? [];
        $this->original_get = $_GET ?? [];
        $this->original_cookie = $_COOKIE ?? [];
        $this->no_change_suffix =
            '.' . AppendixProvider::getAppendix(APPENDIX_NO_CHANGE);
        $this->net_new_suffix =
            '.' . AppendixProvider::getAppendix(APPENDIX_NET_NEW);
    }

    protected function tearDown(): void
    {
        $_SERVER = $this->original_server;
        $_GET = $this->original_get;
        $_COOKIE = $this->original_cookie;
    }

    private function resetGlobals(): void
    {
        $_SERVER = [];
        $_GET = [];
        $_COOKIE = [];
    }

    // =========================================================================
    // Referrer stored before fbclid extraction
    // =========================================================================

    public function testReferrerWithFbclidIsPreservedFully(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://facebook.com/ad?fbclid=abc123&utm_source=fb';
        $builder->processRequest(
            'example.com',
            [],
            [],
            $referer
        );
        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerWithFbclidInQueryParamsViaContext(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://www.facebook.com/ads?fbclid=xyz789&campaign=summer';
        $data = new PlainDataObject(
            'example.com',
            ['fbclid' => 'different_value'],
            [],
            $referer,
            null,
            null
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerWithOnlyFbclidParam(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://l.facebook.com/l.php?fbclid=longvalue123';
        $builder->processRequest(
            'example.com',
            [],
            [],
            $referer
        );
        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    // =========================================================================
    // Referrer with various URL formats
    // =========================================================================

    public function testReferrerHttpUrl(): void
    {
        $builder = new ParamBuilder();
        $referer = 'http://insecure.example.com/page';
        $builder->processRequest('example.com', [], [], $referer);
        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerHttpsUrl(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://secure.example.com/page';
        $builder->processRequest('example.com', [], [], $referer);
        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerWithPath(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://blog.example.com/2024/01/post-title';
        $builder->processRequest('example.com', [], [], $referer);
        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerWithQueryParams(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://search.example.com/results?q=test&page=3&lang=en';
        $builder->processRequest('example.com', [], [], $referer);
        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerWithFragment(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://docs.example.com/guide#section-2';
        $builder->processRequest('example.com', [], [], $referer);
        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerWithQueryAndFragment(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://app.example.com/search?q=test#results';
        $builder->processRequest('example.com', [], [], $referer);
        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerWithInternationalizedDomain(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://xn--e1afmapc.xn--p1ai/path';
        $builder->processRequest('example.com', [], [], $referer);
        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerWithPort(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://dev.example.com:8443/api/callback';
        $builder->processRequest('example.com', [], [], $referer);
        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    // =========================================================================
    // Referrer via processRequest() with all 6 params
    // =========================================================================

    public function testReferrerViaProcessRequestWithAllParams(): void
    {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'shop.example.com',
            ['fbclid' => 'click123', 'utm_source' => 'fb'],
            ['_fbp' => 'fb.1.1234567890.9876543210'],
            'https://facebook.com/ads/click',
            '203.0.113.50',
            '10.0.0.1'
        );
        $this->assertEquals(
            'https://facebook.com/ads/click' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerViaProcessRequestWithNullOptionalParams(): void
    {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'example.com',
            [],
            [],
            'https://referrer.com/page',
            null,
            null
        );
        $this->assertEquals(
            'https://referrer.com/page' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    // =========================================================================
    // Referrer via processRequestFromContext() with PlainDataObject
    // =========================================================================

    public function testReferrerFromPlainDataObject(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'example.com',
            [],
            [],
            'https://partner.example.com/landing',
            null,
            null
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            'https://partner.example.com/landing' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerFromPlainDataObjectWithAllFields(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'shop.example.com',
            ['q' => 'shoes'],
            [],
            'https://google.com/search?q=shoes',
            '198.51.100.10',
            '192.168.1.1',
            'https',
            '/products?category=shoes'
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            'https://google.com/search?q=shoes' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    // =========================================================================
    // Referrer via processRequestFromContext() with server array
    // =========================================================================

    public function testReferrerFromServerArray(): void
    {
        $this->resetGlobals();
        $builder = new ParamBuilder();
        $builder->processRequestFromContext([
            'HTTP_HOST' => 'example.com',
            'HTTP_REFERER' => 'https://facebook.com/ad',
        ]);
        $this->assertEquals(
            'https://facebook.com/ad' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerFromServerArrayWithFullContext(): void
    {
        $this->resetGlobals();
        $builder = new ParamBuilder();
        $builder->processRequestFromContext([
            'HTTP_HOST' => 'shop.example.com',
            'HTTP_REFERER' => 'https://instagram.com/stories',
            'HTTPS' => 'on',
            'REQUEST_URI' => '/checkout',
            'REMOTE_ADDR' => '10.0.0.1',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.50',
        ]);
        $this->assertEquals(
            'https://instagram.com/stories' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerFromServerArrayNoReferer(): void
    {
        $this->resetGlobals();
        $builder = new ParamBuilder();
        $builder->processRequestFromContext([
            'HTTP_HOST' => 'example.com',
            'HTTPS' => 'on',
            'REQUEST_URI' => '/page',
        ]);
        $this->assertNull($builder->getReferrerUrl());
    }

    // =========================================================================
    // Reset behavior between consecutive calls
    // =========================================================================

    public function testReferrerResetsBetweenProcessRequestCalls(): void
    {
        $builder = new ParamBuilder();

        $builder->processRequest(
            'example.com',
            [],
            [],
            'https://first-referrer.com/page'
        );
        $this->assertEquals(
            'https://first-referrer.com/page' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );

        $builder->processRequest('example.com', [], [], null);
        $this->assertNull($builder->getReferrerUrl());
    }

    public function testReferrerResetsBetweenFromContextCalls(): void
    {
        $builder = new ParamBuilder();

        $data1 = new PlainDataObject(
            'example.com',
            [],
            [],
            'https://first.com',
            null,
            null
        );
        $builder->processRequestFromContext($data1);
        $this->assertEquals(
            'https://first.com' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );

        $data2 = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null
        );
        $builder->processRequestFromContext($data2);
        $this->assertNull($builder->getReferrerUrl());
    }

    public function testReferrerUpdatesToNewValueBetweenCalls(): void
    {
        $builder = new ParamBuilder();

        $builder->processRequest(
            'example.com',
            [],
            [],
            'https://first.com/page'
        );
        $this->assertEquals(
            'https://first.com/page' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );

        $builder->processRequest(
            'example.com',
            [],
            [],
            'https://second.com/other'
        );
        $this->assertEquals(
            'https://second.com/other' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerResetsBetweenMixedCalls(): void
    {
        $builder = new ParamBuilder();

        $builder->processRequest(
            'example.com',
            [],
            [],
            'https://via-processrequest.com'
        );
        $this->assertEquals(
            'https://via-processrequest.com' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );

        $data = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null
        );
        $builder->processRequestFromContext($data);
        $this->assertNull($builder->getReferrerUrl());
    }

    // =========================================================================
    // Null vs empty string referer
    // =========================================================================

    public function testReferrerNullReferer(): void
    {
        $builder = new ParamBuilder();
        $builder->processRequest('example.com', [], [], null);
        $this->assertNull($builder->getReferrerUrl());
    }

    public function testReferrerEmptyStringReferer(): void
    {
        $builder = new ParamBuilder();
        $builder->processRequest('example.com', [], [], '');
        $this->assertEquals('', $builder->getReferrerUrl());
    }

    public function testReferrerNullRefererViaPlainDataObject(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null
        );
        $builder->processRequestFromContext($data);
        $this->assertNull($builder->getReferrerUrl());
    }

    public function testReferrerEmptyStringRefererViaPlainDataObject(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'example.com',
            [],
            [],
            '',
            null,
            null
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals('', $builder->getReferrerUrl());
    }

    // =========================================================================
    // Referrer independence from event_source_url
    // =========================================================================

    public function testReferrerDoesNotAffectEventSourceUrl(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'shop.example.com',
            [],
            [],
            'https://facebook.com/ad',
            null,
            null,
            'https',
            '/products'
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            'https://facebook.com/ad' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
        $this->assertEquals(
            'https://shop.example.com/products' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    public function testEventSourceUrlDoesNotAffectReferrer(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'shop.example.com',
            [],
            [],
            null,
            null,
            null,
            'https',
            '/checkout'
        );
        $builder->processRequestFromContext($data);
        $this->assertNull($builder->getReferrerUrl());
        $this->assertEquals(
            'https://shop.example.com/checkout' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    public function testReferrerAndEventSourceUrlBothSetIndependently(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'www.myshop.com',
            [],
            [],
            'https://facebook.com/campaign',
            null,
            null,
            'https',
            '/landing?utm=fb'
        );
        $builder->processRequestFromContext($data);

        $this->assertEquals(
            'https://facebook.com/campaign' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
        $this->assertEquals(
            'https://www.myshop.com/landing?utm=fb' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    public function testProcessRequestSetsReferrerButNotEventSourceUrl(): void
    {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'example.com',
            [],
            [],
            'https://referrer.com/page'
        );
        $this->assertEquals(
            'https://referrer.com/page' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
        $this->assertNull($builder->getEventSourceUrl());
    }
}
