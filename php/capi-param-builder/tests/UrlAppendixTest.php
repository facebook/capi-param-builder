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

require_once __DIR__ . '/../src/ParamBuilder.php';
require_once __DIR__ . '/../src/model/PlainDataObject.php';
require_once __DIR__ . '/../src/model/Constants.php';
require_once __DIR__ . '/../src/util/AppendixProvider.php';

/**
 * Covers the appendix-appending transformation applied to:
 *   - referrer_url   (suffix: '.' + AppendixProvider::getAppendix(APPENDIX_NO_CHANGE))
 *   - event_source_url (suffix: '.' + AppendixProvider::getAppendix(APPENDIX_NET_NEW))
 *
 * The appendix string is dynamic (derived from SDK version), so we compute the
 * expected suffix via AppendixProvider rather than hard-coding it.
 */
final class UrlAppendixTest extends TestCase
{
    private $no_change_suffix;
    private $net_new_suffix;

    protected function setUp(): void
    {
        $this->no_change_suffix =
            '.' . AppendixProvider::getAppendix(APPENDIX_NO_CHANGE);
        $this->net_new_suffix =
            '.' . AppendixProvider::getAppendix(APPENDIX_NET_NEW);
    }

    // =========================================================================
    // referrer_url: appends APPENDIX_NO_CHANGE
    // =========================================================================

    public function testReferrerUrlGetsNoChangeAppendixViaProcessRequest(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://facebook.com/ad';
        $builder->processRequest('example.com', [], [], $referer);

        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerUrlGetsNoChangeAppendixViaContext(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://google.com/search?q=shoes';
        $data = new PlainDataObject(
            'shop.example.com',
            [],
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

    public function testReferrerUrlAppendixWithComplexUrl(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://app.example.com/search?q=test&page=3#results';
        $builder->processRequest('example.com', [], [], $referer);

        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    // =========================================================================
    // referrer_url: skips appendix for null / empty / non-string
    // =========================================================================

    public function testReferrerUrlNullSkipsAppendix(): void
    {
        $builder = new ParamBuilder();
        $builder->processRequest('example.com', [], [], null);

        $this->assertNull($builder->getReferrerUrl());
    }

    public function testReferrerUrlEmptyStringSkipsAppendix(): void
    {
        $builder = new ParamBuilder();
        $builder->processRequest('example.com', [], [], '');

        $this->assertEquals('', $builder->getReferrerUrl());
    }

    public function testReferrerUrlNullViaContextSkipsAppendix(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'example.com', [], [], null, null, null
        );
        $builder->processRequestFromContext($data);

        $this->assertNull($builder->getReferrerUrl());
    }

    // =========================================================================
    // referrer_url: idempotency — consecutive calls do not double-append
    //
    // Each processRequest() begins with `$this->referrer_url = $referer;`
    // (reassignment, not concatenation), so the appendix is applied at most
    // once per call regardless of prior state.
    // =========================================================================

    public function testReferrerUrlIdempotencyAcrossConsecutiveCalls(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://example.com/page';

        $builder->processRequest('example.com', [], [], $referer);
        $first = $builder->getReferrerUrl();

        $builder->processRequest('example.com', [], [], $referer);
        $second = $builder->getReferrerUrl();

        $this->assertEquals($first, $second);
        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $second
        );
        // Critical: the appendix is not concatenated twice
        $this->assertEquals(
            1,
            substr_count($second, $this->no_change_suffix),
            'Appendix must appear exactly once after consecutive calls'
        );
    }

    public function testReferrerUrlChangesValueBetweenCalls(): void
    {
        $builder = new ParamBuilder();

        $builder->processRequest('example.com', [], [], 'https://first.com');
        $this->assertEquals(
            'https://first.com' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );

        $builder->processRequest('example.com', [], [], 'https://second.com');
        $this->assertEquals(
            'https://second.com' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    public function testReferrerUrlClearedThenSetAcrossCalls(): void
    {
        $builder = new ParamBuilder();

        $builder->processRequest('example.com', [], [], 'https://first.com');
        $this->assertEquals(
            'https://first.com' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );

        $builder->processRequest('example.com', [], [], null);
        $this->assertNull($builder->getReferrerUrl());

        $builder->processRequest('example.com', [], [], 'https://third.com');
        $this->assertEquals(
            'https://third.com' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
    }

    // =========================================================================
    // event_source_url: appends APPENDIX_NET_NEW
    // =========================================================================

    public function testEventSourceUrlGetsNetNewAppendix(): void
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
            '/products'
        );
        $builder->processRequestFromContext($data);

        $this->assertEquals(
            'https://shop.example.com/products' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    public function testEventSourceUrlAppendixWithQueryAndFragment(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'www.myshop.com',
            [],
            [],
            null,
            null,
            null,
            'https',
            '/landing?utm=fb&campaign=summer#section'
        );
        $builder->processRequestFromContext($data);

        // Locks in current behavior: the appendix is concatenated at the
        // absolute end, AFTER the fragment, producing an invalid URL fragment.
        // This is intentional documentation — see the open URL-corruption
        // question with the user.
        $this->assertEquals(
            'https://www.myshop.com/landing?utm=fb&campaign=summer#section'
                . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    public function testEventSourceUrlAppendixWithEmptyRequestUri(): void
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
            null
        );
        $builder->processRequestFromContext($data);

        $this->assertEquals(
            'http://example.com' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );
    }

    // =========================================================================
    // event_source_url: skips appendix when constructEventSourceUrl returns null
    //
    // constructEventSourceUrl early-returns null when data is null, host is
    // empty, or scheme is empty — the appendix guard then sees a null/empty
    // value and skips, leaving the field as null.
    // =========================================================================

    public function testEventSourceUrlNullWhenHostMissing(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            '',
            [],
            [],
            null,
            null,
            null,
            'https',
            '/products'
        );
        $builder->processRequestFromContext($data);

        $this->assertNull($builder->getEventSourceUrl());
    }

    public function testEventSourceUrlNullWhenSchemeMissing(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            '/products'
        );
        $builder->processRequestFromContext($data);

        $this->assertNull($builder->getEventSourceUrl());
    }

    public function testEventSourceUrlNullWhenSchemeEmptyString(): void
    {
        $builder = new ParamBuilder();
        $data = new PlainDataObject(
            'example.com',
            [],
            [],
            null,
            null,
            null,
            '',
            '/products'
        );
        $builder->processRequestFromContext($data);

        $this->assertNull($builder->getEventSourceUrl());
    }

    public function testEventSourceUrlNullWhenProcessRequestUsedDirectly(): void
    {
        // processRequest() does not call constructEventSourceUrl(), so the
        // event_source_url stays at its constructor default (null).
        $builder = new ParamBuilder();
        $builder->processRequest('example.com', [], [], 'https://r.com');

        $this->assertNull($builder->getEventSourceUrl());
    }

    // =========================================================================
    // event_source_url: idempotency — consecutive calls do not double-append
    //
    // processRequestFromContext() resets `event_source_url = null` before
    // delegating, and constructEventSourceUrl() rebuilds `$url` locally before
    // assigning, so the appendix is applied at most once per call.
    // =========================================================================

    public function testEventSourceUrlIdempotencyAcrossConsecutiveCalls(): void
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
            '/products'
        );

        $builder->processRequestFromContext($data);
        $first = $builder->getEventSourceUrl();

        $builder->processRequestFromContext($data);
        $second = $builder->getEventSourceUrl();

        $this->assertEquals($first, $second);
        $this->assertEquals(
            'https://shop.example.com/products' . $this->net_new_suffix,
            $second
        );
        // Critical: the appendix is not concatenated twice
        $this->assertEquals(
            1,
            substr_count($second, $this->net_new_suffix),
            'Appendix must appear exactly once after consecutive calls'
        );
    }

    public function testEventSourceUrlClearedThenSetAcrossCalls(): void
    {
        $builder = new ParamBuilder();

        $data1 = new PlainDataObject(
            'shop.example.com',
            [],
            [],
            null,
            null,
            null,
            'https',
            '/products'
        );
        $builder->processRequestFromContext($data1);
        $this->assertEquals(
            'https://shop.example.com/products' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );

        // Second call with missing scheme → constructEventSourceUrl returns
        // null, and the appendix guard correctly leaves it as null.
        $data2 = new PlainDataObject(
            'shop.example.com',
            [],
            [],
            null,
            null,
            null,
            null,
            '/products'
        );
        $builder->processRequestFromContext($data2);
        $this->assertNull($builder->getEventSourceUrl());
    }

    // =========================================================================
    // Cross-field: referrer and event_source_url get different appendix tokens
    // =========================================================================

    public function testReferrerAndEventSourceUseDifferentAppendixTokens(): void
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
            '/checkout'
        );
        $builder->processRequestFromContext($data);

        $this->assertEquals(
            'https://facebook.com/ad' . $this->no_change_suffix,
            $builder->getReferrerUrl()
        );
        $this->assertEquals(
            'https://shop.example.com/checkout' . $this->net_new_suffix,
            $builder->getEventSourceUrl()
        );

        // Sanity: the two suffixes differ because the type byte differs
        // (APPENDIX_NO_CHANGE = 0x00 vs APPENDIX_NET_NEW = 0x02).
        $this->assertNotEquals(
            $this->no_change_suffix,
            $this->net_new_suffix
        );
    }

    // =========================================================================
    // Appendix format sanity: '.' + 8-char base64url string
    // =========================================================================

    public function testReferrerUrlAppendixHasExpectedShape(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://example.com/p';
        $builder->processRequest('example.com', [], [], $referer);
        $result = $builder->getReferrerUrl();

        // Tolerate both v2 (8-char base64url) and v1 fallback (LANGUAGE_TOKEN,
        // 2 chars) — VersionProvider returns "" when composer.json is missing,
        // which routes AppendixProvider through the legacy token path.
        $this->assertEquals(
            1,
            preg_match(
                '#^https://example\.com/p\.[A-Za-z0-9_\-]+$#',
                $result
            ),
            "Expected '<url>.<base64url-token>' but got: $result"
        );

        // Tighter check: the trailing token after the final '.' must equal
        // the suffix computed via AppendixProvider in setUp. This proves we
        // appended the correct token (NO_CHANGE), not just any token-shaped
        // string.
        $last_dot = strrpos($result, '.');
        $this->assertNotFalse(
            $last_dot,
            "Result must contain at least one '.': $result"
        );
        $trailing = '.' . substr($result, $last_dot + 1);
        $this->assertEquals($this->no_change_suffix, $trailing);
    }

    public function testEventSourceUrlAppendixHasExpectedShape(): void
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
            '/p'
        );
        $builder->processRequestFromContext($data);
        $result = $builder->getEventSourceUrl();

        $this->assertEquals(
            1,
            preg_match(
                '#^https://example\.com/p\.[A-Za-z0-9_\-]+$#',
                $result
            ),
            "Expected '<url>.<base64url-token>' but got: $result"
        );

        $last_dot = strrpos($result, '.');
        $this->assertNotFalse(
            $last_dot,
            "Result must contain at least one '.': $result"
        );
        $trailing = '.' . substr($result, $last_dot + 1);
        $this->assertEquals($this->net_new_suffix, $trailing);
    }

    // =========================================================================
    // Documentation tests: feeding output back as input DOUBLE-APPENDS.
    //
    // The SDK has no dedup logic — it does not detect that an input value
    // already ends in the appendix and will happily concatenate another one.
    // The earlier "idempotency" tests only prove the builder resets cleanly
    // between calls when given the original raw input each time; they do NOT
    // prove that feeding getReferrerUrl() back as the referer arg is safe.
    //
    // These tests lock in the current (intentional or otherwise) behavior so
    // a future refactor that adds dedup will trigger an explicit decision.
    // =========================================================================

    public function testReferrerUrlDoubleAppendsWhenFedOutputBack(): void
    {
        $builder = new ParamBuilder();
        $referer = 'https://example.com/page';

        $builder->processRequest('example.com', [], [], $referer);
        $first = $builder->getReferrerUrl();
        $this->assertEquals(
            $referer . $this->no_change_suffix,
            $first
        );

        // Feed the output back in. Current behavior: appendix is appended
        // AGAIN, producing '<url>.<suffix>.<suffix>'.
        $builder->processRequest('example.com', [], [], $first);
        $second = $builder->getReferrerUrl();

        $this->assertEquals(
            $referer . $this->no_change_suffix . $this->no_change_suffix,
            $second
        );
        $this->assertEquals(
            2,
            substr_count($second, $this->no_change_suffix),
            'SDK does not dedup: feeding output back yields a double append'
        );
    }

    public function testEventSourceUrlDoubleAppendsWhenFedRequestUriBack(): void
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
            '/products'
        );
        $builder->processRequestFromContext($data);
        $first = $builder->getEventSourceUrl();
        $this->assertEquals(
            'https://shop.example.com/products' . $this->net_new_suffix,
            $first
        );

        // Construct a new PlainDataObject whose request_uri already contains
        // the appendix suffix appended to the path. Current behavior: the
        // appendix is added AGAIN on top.
        $contaminated = new PlainDataObject(
            'shop.example.com',
            [],
            [],
            null,
            null,
            null,
            'https',
            '/products' . $this->net_new_suffix
        );
        $builder->processRequestFromContext($contaminated);
        $second = $builder->getEventSourceUrl();

        $this->assertEquals(
            'https://shop.example.com/products'
                . $this->net_new_suffix
                . $this->net_new_suffix,
            $second
        );
        $this->assertEquals(
            2,
            substr_count($second, $this->net_new_suffix),
            'SDK does not dedup: feeding suffixed path back yields double append'
        );
    }
}
