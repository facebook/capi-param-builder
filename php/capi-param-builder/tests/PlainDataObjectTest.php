<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

use PHPUnit\Framework\TestCase;
use FacebookAds\PlainDataObject;

require_once __DIR__ . '/../src/model/PlainDataObject.php';
require_once __DIR__ . '/../src/model/Constants.php';

final class PlainDataObjectTest extends TestCase
{
    private $original_server;
    private $original_get;
    private $original_cookie;

    protected function setUp(): void
    {
        $this->original_server = $_SERVER ?? [];
        $this->original_get = $_GET ?? [];
        $this->original_cookie = $_COOKIE ?? [];
    }

    protected function tearDown(): void
    {
        $_SERVER = $this->original_server;
        $_GET = $this->original_get;
        $_COOKIE = $this->original_cookie;
    }

    // =========================================================================
    // Backward compatibility — 6-param construction
    // =========================================================================

    public function testSixParamConstructionSetsAllOriginalFields(): void
    {
        $obj = new PlainDataObject(
            'example.com',
            ['key' => 'value'],
            ['session' => 'abc123'],
            'https://referrer.com',
            '203.0.113.50',
            '10.0.0.1'
        );
        $this->assertEquals('example.com', $obj->host);
        $this->assertEquals(['key' => 'value'], $obj->query_params);
        $this->assertEquals(['session' => 'abc123'], $obj->cookies);
        $this->assertEquals('https://referrer.com', $obj->referer);
        $this->assertEquals('203.0.113.50', $obj->x_forwarded_for);
        $this->assertEquals('10.0.0.1', $obj->remote_address);
    }

    public function testSixParamConstructionDefaultsSchemeToNull(): void
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

    public function testSixParamConstructionDefaultsRequestUriToNull(): void
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

    public function testSixParamConstructionWithNonNullOriginalFields(): void
    {
        $obj = new PlainDataObject(
            'shop.example.com',
            ['fbclid' => 'abc', 'utm_source' => 'fb'],
            ['_fbp' => 'fb.1.123.456'],
            'https://facebook.com/ad',
            '2001:db8::1',
            '192.168.1.100'
        );
        $this->assertNull($obj->scheme);
        $this->assertNull($obj->request_uri);
        $this->assertEquals('shop.example.com', $obj->host);
        $this->assertEquals(
            ['fbclid' => 'abc', 'utm_source' => 'fb'],
            $obj->query_params
        );
        $this->assertEquals(['_fbp' => 'fb.1.123.456'], $obj->cookies);
        $this->assertEquals('https://facebook.com/ad', $obj->referer);
        $this->assertEquals('2001:db8::1', $obj->x_forwarded_for);
        $this->assertEquals('192.168.1.100', $obj->remote_address);
    }

    // =========================================================================
    // Property assignment — set scheme and request_uri via public property
    // =========================================================================

    public function testSchemeCanBeSetViaPropertyAssignment(): void
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
        $obj->scheme = 'https';
        $this->assertSame('https', $obj->scheme);
    }

    public function testRequestUriCanBeSetViaPropertyAssignment(): void
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
        $obj->request_uri = '/new/path';
        $this->assertEquals('/new/path', $obj->request_uri);
    }

    public function testPropertyAssignmentOverridesConstructorValue(): void
    {
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            'https',
            '/original'
        );
        $obj->scheme = 'http';
        $obj->request_uri = '/overridden';
        $this->assertSame('http', $obj->scheme);
        $this->assertEquals('/overridden', $obj->request_uri);
    }

    // =========================================================================
    // Original fields unaffected by new fields
    // =========================================================================

    public function testOriginalFieldsUnchangedWhenNewFieldsAreSet(): void
    {
        $obj = new PlainDataObject(
            'store.example.com',
            ['q' => 'shoes'],
            ['cart' => 'xyz'],
            'https://google.com',
            '198.51.100.1',
            '172.16.0.1',
            'https',
            '/products/shoes?color=red'
        );
        $this->assertEquals('store.example.com', $obj->host);
        $this->assertEquals(['q' => 'shoes'], $obj->query_params);
        $this->assertEquals(['cart' => 'xyz'], $obj->cookies);
        $this->assertEquals('https://google.com', $obj->referer);
        $this->assertEquals('198.51.100.1', $obj->x_forwarded_for);
        $this->assertEquals('172.16.0.1', $obj->remote_address);
    }

    public function testOriginalFieldsUnchangedAfterPropertyAssignmentOfNewFields(): void
    {
        $obj = new PlainDataObject(
            'api.example.com',
            ['token' => 'abc'],
            ['sid' => '999'],
            'https://app.example.com',
            '10.0.0.1',
            '192.168.0.1'
        );
        $obj->scheme = 'https';
        $obj->request_uri = '/api/v2/data';
        $this->assertEquals('api.example.com', $obj->host);
        $this->assertEquals(['token' => 'abc'], $obj->query_params);
        $this->assertEquals(['sid' => '999'], $obj->cookies);
        $this->assertEquals('https://app.example.com', $obj->referer);
        $this->assertEquals('10.0.0.1', $obj->x_forwarded_for);
        $this->assertEquals('192.168.0.1', $obj->remote_address);
    }

    // =========================================================================
    // scheme — string behavior
    // =========================================================================

    public function testSchemeHttpsIsStrictlyHttps(): void
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

    public function testSchemeHttpIsStrictlyHttp(): void
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

    public function testSchemeNullIsStrictlyNull(): void
    {
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            null
        );
        $this->assertSame(null, $obj->scheme);
    }

    public function testSchemeHttpsIsNotNull(): void
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
        $this->assertNotNull($obj->scheme);
    }

    public function testSchemeHttpIsNotNull(): void
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
        $this->assertNotNull($obj->scheme);
    }

    // =========================================================================
    // request_uri — edge cases
    // =========================================================================

    public function testRequestUriWithSpecialCharacters(): void
    {
        $uri = '/path/to/page?key=val%20ue&foo=bar%26baz';
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            $uri
        );
        $this->assertEquals($uri, $obj->request_uri);
    }

    public function testRequestUriWithUnicodePath(): void
    {
        $uri = '/produkte/schuhe/größe-42';
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            $uri
        );
        $this->assertEquals($uri, $obj->request_uri);
    }

    public function testRequestUriWithEncodedUnicode(): void
    {
        $uri = '/search?q=%E4%B8%AD%E6%96%87';
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            $uri
        );
        $this->assertEquals($uri, $obj->request_uri);
    }

    public function testRequestUriVeryLong(): void
    {
        $uri = '/' . str_repeat('a', 8000) . '?param=' . str_repeat('b', 2000);
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            $uri
        );
        $this->assertEquals($uri, $obj->request_uri);
        $this->assertGreaterThan(10000, strlen($obj->request_uri));
    }

    public function testRequestUriEmptyStringIsNotNull(): void
    {
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            ''
        );
        $this->assertNotNull($obj->request_uri);
        $this->assertSame('', $obj->request_uri);
    }

    public function testRequestUriNullIsNotEmptyString(): void
    {
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            null
        );
        $this->assertNull($obj->request_uri);
        $this->assertNotSame('', $obj->request_uri);
    }

    public function testRequestUriWithFragmentAndQueryString(): void
    {
        $uri = '/checkout?step=3&coupon=SAVE10#summary';
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            $uri
        );
        $this->assertEquals($uri, $obj->request_uri);
    }

    public function testRequestUriWithMultipleSlashes(): void
    {
        $uri = '//admin///dashboard//';
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            $uri
        );
        $this->assertEquals($uri, $obj->request_uri);
    }

    public function testRequestUriWithDotSegments(): void
    {
        $uri = '/a/b/../c/./d';
        $obj = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            $uri
        );
        $this->assertEquals($uri, $obj->request_uri);
    }

    // =========================================================================
    // Full 8-param construction
    // =========================================================================

    public function testEightParamConstructionSetsAllFields(): void
    {
        $obj = new PlainDataObject(
            'www.shop.example.com',
            ['fbclid' => 'click123', 'source' => 'ig'],
            ['_fbp' => 'fb.1.111.222', 'consent' => 'yes'],
            'https://instagram.com/p/abc',
            '203.0.113.50, 198.51.100.1',
            '10.0.0.50',
            'https',
            '/cart/checkout?step=payment'
        );
        $this->assertEquals('www.shop.example.com', $obj->host);
        $this->assertEquals(
            ['fbclid' => 'click123', 'source' => 'ig'],
            $obj->query_params
        );
        $this->assertEquals(
            ['_fbp' => 'fb.1.111.222', 'consent' => 'yes'],
            $obj->cookies
        );
        $this->assertEquals('https://instagram.com/p/abc', $obj->referer);
        $this->assertEquals('203.0.113.50, 198.51.100.1', $obj->x_forwarded_for);
        $this->assertEquals('10.0.0.50', $obj->remote_address);
        $this->assertSame('https', $obj->scheme);
        $this->assertEquals('/cart/checkout?step=payment', $obj->request_uri);
    }
}
