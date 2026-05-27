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

final class EventSourceUrlTest extends TestCase
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
    // PlainDataObject — new URL fields
    // =========================================================================

    public function testPlainDataObjectDefaultsSchemeToNull(): void
    {
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null
        );
        $this->assertNull($obj->scheme);
    }

    public function testPlainDataObjectDefaultsRequestUriToNull(): void
    {
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null
        );
        $this->assertNull($obj->request_uri);
    }

    public function testPlainDataObjectAcceptsScheme(): void
    {
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            'https',
            null
        );
        $this->assertSame('https', $obj->scheme);
    }

    public function testPlainDataObjectAcceptsRequestUri(): void
    {
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            '/path/to/page'
        );
        $this->assertEquals('/path/to/page', $obj->request_uri);
    }

    public function testPlainDataObjectAcceptsBothUrlFields(): void
    {
        $obj = new PlainDataObject(
            'www.example.com',
            [],
            [],
            null,
            null,
            null,
            'https',
            '/checkout?step=2'
        );
        $this->assertSame('https', $obj->scheme);
        $this->assertEquals('/checkout?step=2', $obj->request_uri);
    }

    public function testPlainDataObjectSchemeHttp(): void
    {
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            'http',
            null
        );
        $this->assertSame('http', $obj->scheme);
    }

    // =========================================================================
    // RequestContextAdaptor — extracts scheme and request_uri
    // =========================================================================

    public function testAdaptorExtractsSchemeHttpsFromOn(): void
    {
        $this->resetGlobals();
        $result = RequestContextAdaptor::extract([
            'HTTP_HOST' => 'example.com',
            'HTTPS' => 'on',
        ]);
        $this->assertSame('https', $result->scheme);
    }

    public function testAdaptorExtractsSchemeHttpsFromAnyValue(): void
    {
        $this->resetGlobals();
        $result = RequestContextAdaptor::extract([
            'HTTP_HOST' => 'example.com',
            'HTTPS' => 'anyvalue',
        ]);
        $this->assertSame('https', $result->scheme);
    }

    public function testAdaptorExtractsSchemeHttpsFromOne(): void
    {
        $this->resetGlobals();
        $result = RequestContextAdaptor::extract([
            'HTTP_HOST' => 'example.com',
            'HTTPS' => '1',
        ]);
        $this->assertSame('https', $result->scheme);
    }

    public function testAdaptorExtractsSchemeHttpFromEmptyString(): void
    {
        $this->resetGlobals();
        $result = RequestContextAdaptor::extract([
            'HTTP_HOST' => 'example.com',
            'HTTPS' => '',
        ]);
        $this->assertSame('http', $result->scheme);
    }

    public function testAdaptorExtractsSchemeHttpFromOff(): void
    {
        $this->resetGlobals();
        $result = RequestContextAdaptor::extract([
            'HTTP_HOST' => 'example.com',
            'HTTPS' => 'off',
        ]);
        $this->assertSame('http', $result->scheme);
    }

    public function testAdaptorExtractsSchemeHttpFromOffMixedCase(): void
    {
        $this->resetGlobals();
        $result = RequestContextAdaptor::extract([
            'HTTP_HOST' => 'example.com',
            'HTTPS' => 'OFF',
        ]);
        $this->assertSame('http', $result->scheme);
    }

    public function testAdaptorExtractsSchemeHttpWhenMissing(): void
    {
        $this->resetGlobals();
        $result = RequestContextAdaptor::extract([
            'HTTP_HOST' => 'example.com',
        ]);
        $this->assertSame('http', $result->scheme);
    }

    public function testAdaptorExtractsRequestUri(): void
    {
        $this->resetGlobals();
        $result = RequestContextAdaptor::extract([
            'HTTP_HOST' => 'example.com',
            'REQUEST_URI' => '/path/to/page',
        ]);
        $this->assertEquals('/path/to/page', $result->request_uri);
    }

    public function testAdaptorExtractsRequestUriWithQueryString(): void
    {
        $this->resetGlobals();
        $result = RequestContextAdaptor::extract([
            'HTTP_HOST' => 'example.com',
            'REQUEST_URI' => '/search?q=test&page=1',
        ]);
        $this->assertEquals('/search?q=test&page=1', $result->request_uri);
    }

    public function testAdaptorExtractsRequestUriNull(): void
    {
        $this->resetGlobals();
        $result = RequestContextAdaptor::extract([
            'HTTP_HOST' => 'example.com',
        ]);
        $this->assertNull($result->request_uri);
    }

    public function testAdaptorRespectsOverridesForScheme(): void
    {
        $_SERVER = ['HTTPS' => 'on'];
        $result = RequestContextAdaptor::extract([
            'HTTP_HOST' => 'example.com',
            'HTTPS' => 'off',
        ]);
        $this->assertSame('http', $result->scheme);
    }

    public function testAdaptorRespectsOverridesForRequestUri(): void
    {
        $_SERVER = ['REQUEST_URI' => '/global/path'];
        $result = RequestContextAdaptor::extract([
            'HTTP_HOST' => 'example.com',
            'REQUEST_URI' => '/override/path',
        ]);
        $this->assertEquals('/override/path', $result->request_uri);
    }

    // =========================================================================
    // constructEventSourceUrl — canonical test cases
    // =========================================================================

    public function testEventSourceUrlHttpsWithHostAndUri(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'www.example.com',
            [],
            [],
            null,
            null,
            null,
            'https',
            '/path'
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            'https://www.example.com/path' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    public function testEventSourceUrlHttpWithHostAndUri(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'www.example.com',
            [],
            [],
            null,
            null,
            null,
            'http',
            '/path'
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            'http://www.example.com/path' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    public function testEventSourceUrlNullWhenSchemeNull(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'www.example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            '/path'
        );
        $builder->processRequestFromContext($data);
        $this->assertNull($builder->getEventSourceUrl());
    }

    public function testEventSourceUrlNullWhenAllNull(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            '',
            [],
            [],
            null,
            null,
            null,
            null,
            null
        );
        $builder->processRequestFromContext($data);
        $this->assertNull($builder->getEventSourceUrl());
    }

    public function testEventSourceUrlNullWhenHostOnlyNoScheme(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'host.example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            null
        );
        $builder->processRequestFromContext($data);
        $this->assertNull($builder->getEventSourceUrl());
    }

    public function testEventSourceUrlPreservesQueryString(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'www.example.com',
            [],
            [],
            null,
            null,
            null,
            'https',
            '/search?q=test&page=2'
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            'https://www.example.com/search?q=test&page=2' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    public function testEventSourceUrlHostOnlyWithHttps(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'secure.example.com',
            [],
            [],
            null,
            null,
            null,
            'https',
            null
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            'https://secure.example.com' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    // =========================================================================
    // constructEventSourceUrl — via RequestContextAdaptor (server array)
    // =========================================================================

    public function testEventSourceUrlFromServerArrayHttps(): void
    {
        $this->resetGlobals();
        $builder = new ParamBuilder();
        $builder->processRequestFromContext([
            'HTTP_HOST' => 'www.example.com',
            'HTTPS' => 'on',
            'REQUEST_URI' => '/path',
        ]);
        $this->assertEquals(
            'https://www.example.com/path' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    public function testEventSourceUrlFromServerArrayHttpsEmptyString(): void
    {
        $this->resetGlobals();
        $builder = new ParamBuilder();
        $builder->processRequestFromContext([
            'HTTP_HOST' => 'www.example.com',
            'HTTPS' => '',
            'REQUEST_URI' => '/path',
        ]);
        $this->assertEquals(
            'http://www.example.com/path' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    public function testEventSourceUrlFromServerArrayHttpsOff(): void
    {
        $this->resetGlobals();
        $builder = new ParamBuilder();
        $builder->processRequestFromContext([
            'HTTP_HOST' => 'www.example.com',
            'HTTPS' => 'off',
            'REQUEST_URI' => '/path',
        ]);
        $this->assertEquals(
            'http://www.example.com/path' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    // =========================================================================
    // getReferrerUrl — returns stored referer
    // =========================================================================

    public function testGetReferrerUrlReturnsReferer(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'example.com',
            [],
            [],
            'https://facebook.com/ad',
            null,
            null
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            'https://facebook.com/ad' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testGetReferrerUrlReturnsNullWhenNoReferer(): void
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

    public function testGetReferrerUrlFromProcessRequest(): void
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
    }

    // =========================================================================
    // processRequestFromContext — getEventSourceUrl returns constructed URL
    // =========================================================================

    public function testProcessRequestFromContextSetsEventSourceUrl(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'shop.example.com',
            ['fbclid' => 'test123'],
            [],
            'https://facebook.com/ad',
            null,
            null,
            'https',
            '/products?id=42'
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            'https://shop.example.com/products?id=42' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    public function testProcessRequestFromContextWithServerContextSetsEventSourceUrl(): void
    {
        $this->resetGlobals();
        $builder = new ParamBuilder();
        $builder->processRequestFromContext([
            'HTTP_HOST' => 'shop.example.com',
            'HTTPS' => 'on',
            'REQUEST_URI' => '/checkout',
        ]);
        $this->assertEquals(
            'https://shop.example.com/checkout' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    // =========================================================================
    // processRequest — getEventSourceUrl returns null
    // =========================================================================

    public function testProcessRequestEventSourceUrlIsNull(): void
    {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'www.example.com',
            ['fbclid' => 'test'],
            [],
            null
        );
        $this->assertNull($builder->getEventSourceUrl());
    }

    public function testProcessRequestEventSourceUrlIsNullEvenWithReferer(): void
    {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'www.example.com',
            [],
            [],
            'https://facebook.com/ad',
            '203.0.113.50',
            '10.0.0.1'
        );
        $this->assertNull($builder->getEventSourceUrl());
    }

    // =========================================================================
    // Event source URL is reset between calls
    // =========================================================================

    public function testEventSourceUrlResetBetweenFromContextAndProcessRequest(): void
    {
        $builder = new ParamBuilder();

        $data = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            'https',
            '/first'
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            'https://example.com/first' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );

        // processRequest() does not reset event_source_url (it's owned by processRequestFromContext)
        $builder->processRequest('example.com', [], [], null);
        $this->assertEquals(
            'https://example.com/first' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );

        // processRequestFromContext() with empty host resets it
        $emptyData = new PlainDataObject('', [], [], null, null, null);
        $builder->processRequestFromContext($emptyData);
        $this->assertNull($builder->getEventSourceUrl());
    }

    public function testEventSourceUrlResetBetweenFromContextCalls(): void
    {
        $builder = new ParamBuilder();

        $data1 = new PlainDataObject(
            'first.example.com',
            [],
            [],
            null,
            null,
            null,
            'https',
            '/page1'
        );
        $builder->processRequestFromContext($data1);
        $this->assertEquals(
            'https://first.example.com/page1' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );

        $data2 = new PlainDataObject(
            '',
            [],
            [],
            null,
            null,
            null,
            null,
            null
        );
        $builder->processRequestFromContext($data2);
        $this->assertNull($builder->getEventSourceUrl());
    }

    // =========================================================================
    // Edge cases
    // =========================================================================

    public function testEventSourceUrlWithUriFragmentAndParams(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            'http',
            '/path?key=val&foo=bar#section'
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            'http://example.com/path?key=val&foo=bar#section' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    public function testEventSourceUrlWithEmptyRequestUri(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            'https',
            ''
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            'https://example.com' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    public function testEventSourceUrlWithRootUri(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            'http',
            '/'
        );
        $builder->processRequestFromContext($data);
        $this->assertEquals(
            'http://example.com/' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }
}
