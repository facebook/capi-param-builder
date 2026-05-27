# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

"""
Covers the appendix-appending transformation applied to:
  - referrer_url      (suffix: '.' + appendix_no_change)
  - event_source_url  (suffix: '.' + appendix_net_new)

The appendix string is dynamic (derived from SDK version), so we compute the
expected suffix via a probe ParamBuilder instance rather than hard-coding it.
"""

import unittest
from unittest.mock import patch

from capi_param_builder.model import PlainDataObject
from capi_param_builder.param_builder import ParamBuilder


class _BaseTest(unittest.TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.version_patcher = patch(
            "capi_param_builder.param_builder.ParamBuilder._get_version"
        )
        self.mock_version = self.version_patcher.start()
        self.mock_version.return_value = "1.0.1"
        _probe = ParamBuilder()
        self.no_change_suffix: str = "." + _probe.appendix_no_change
        self.net_new_suffix: str = "." + _probe.appendix_net_new

    def tearDown(self) -> None:
        super().tearDown()
        self.version_patcher.stop()


# =========================================================================
# referrer_url: appends APPENDIX_NO_CHANGE
# =========================================================================
class TestReferrerUrlAppendix(_BaseTest):
    def test_via_process_request(self):
        builder = ParamBuilder()
        referer = "https://facebook.com/ad"
        builder.process_request("example.com", {}, {}, referer)
        self.assertEqual(builder.get_referrer_url(), referer + self.no_change_suffix)

    def test_via_process_request_from_context(self):
        builder = ParamBuilder()
        referer = "https://google.com/search?q=shoes"
        data = PlainDataObject("shop.example.com", {}, {}, referer, None, None)
        builder.process_request_from_context(data)
        self.assertEqual(builder.get_referrer_url(), referer + self.no_change_suffix)

    def test_with_complex_url(self):
        builder = ParamBuilder()
        referer = "https://app.example.com/search?q=test&page=3#results"
        builder.process_request("example.com", {}, {}, referer)
        self.assertEqual(builder.get_referrer_url(), referer + self.no_change_suffix)


# =========================================================================
# referrer_url: skips appendix on null / empty
# =========================================================================
class TestReferrerUrlSkipsAppendix(_BaseTest):
    def test_none_referer(self):
        builder = ParamBuilder()
        builder.process_request("example.com", {}, {}, None)
        self.assertIsNone(builder.get_referrer_url())

    def test_empty_string_referer(self):
        builder = ParamBuilder()
        builder.process_request("example.com", {}, {}, "")
        self.assertEqual(builder.get_referrer_url(), "")

    def test_none_via_context(self):
        builder = ParamBuilder()
        data = PlainDataObject("example.com", {}, {}, None, None, None)
        builder.process_request_from_context(data)
        self.assertIsNone(builder.get_referrer_url())


# =========================================================================
# referrer_url idempotency: each process_request() reassigns from input,
# so the appendix is applied at most once per call.
# =========================================================================
class TestReferrerUrlIdempotency(_BaseTest):
    def test_consecutive_calls_with_same_input_do_not_double_append(self):
        builder = ParamBuilder()
        referer = "https://example.com/page"

        builder.process_request("example.com", {}, {}, referer)
        first = builder.get_referrer_url()

        builder.process_request("example.com", {}, {}, referer)
        second = builder.get_referrer_url()

        self.assertEqual(first, second)
        self.assertEqual(second, referer + self.no_change_suffix)
        self.assertEqual(second.count(self.no_change_suffix), 1)

    def test_value_changes_between_calls(self):
        builder = ParamBuilder()

        builder.process_request("example.com", {}, {}, "https://first.com")
        self.assertEqual(
            builder.get_referrer_url(),
            "https://first.com" + self.no_change_suffix,
        )

        builder.process_request("example.com", {}, {}, "https://second.com")
        self.assertEqual(
            builder.get_referrer_url(),
            "https://second.com" + self.no_change_suffix,
        )

    def test_cleared_then_set(self):
        builder = ParamBuilder()

        builder.process_request("example.com", {}, {}, "https://first.com")
        self.assertEqual(
            builder.get_referrer_url(),
            "https://first.com" + self.no_change_suffix,
        )

        builder.process_request("example.com", {}, {}, None)
        self.assertIsNone(builder.get_referrer_url())

        builder.process_request("example.com", {}, {}, "https://third.com")
        self.assertEqual(
            builder.get_referrer_url(),
            "https://third.com" + self.no_change_suffix,
        )


# =========================================================================
# event_source_url: appends APPENDIX_NET_NEW
# =========================================================================
class TestEventSourceUrlAppendix(_BaseTest):
    def test_with_path(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "shop.example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/products",
        )
        builder.process_request_from_context(data)
        self.assertEqual(
            builder.get_event_source_url(),
            "https://shop.example.com/products" + self.net_new_suffix,
        )

    def test_with_query_and_fragment(self):
        # Locks in current behavior: the appendix is concatenated at the
        # absolute end, AFTER the fragment, producing an invalid URL fragment.
        builder = ParamBuilder()
        data = PlainDataObject(
            "www.myshop.com",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/landing?utm=fb&campaign=summer#section",
        )
        builder.process_request_from_context(data)
        self.assertEqual(
            builder.get_event_source_url(),
            "https://www.myshop.com/landing?utm=fb&campaign=summer#section"
            + self.net_new_suffix,
        )

    def test_host_only(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="http",
            request_uri=None,
        )
        builder.process_request_from_context(data)
        self.assertEqual(
            builder.get_event_source_url(),
            "http://example.com" + self.net_new_suffix,
        )


# =========================================================================
# event_source_url: skips appendix when _construct_event_source_url is None
# =========================================================================
class TestEventSourceUrlNull(_BaseTest):
    def test_null_when_host_empty(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/products",
        )
        builder.process_request_from_context(data)
        self.assertIsNone(builder.get_event_source_url())

    def test_null_when_scheme_none(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {},
            None,
            None,
            None,
            scheme=None,
            request_uri="/products",
        )
        builder.process_request_from_context(data)
        self.assertIsNone(builder.get_event_source_url())

    def test_null_when_scheme_empty(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="",
            request_uri="/products",
        )
        builder.process_request_from_context(data)
        self.assertIsNone(builder.get_event_source_url())

    def test_null_when_process_request_used_directly(self):
        # process_request() does not call _construct_event_source_url and
        # resets event_source_url to None at the top of every call.
        builder = ParamBuilder()
        builder.process_request("example.com", {}, {}, "https://r.com")
        self.assertIsNone(builder.get_event_source_url())


# =========================================================================
# event_source_url idempotency
# =========================================================================
class TestEventSourceUrlIdempotency(_BaseTest):
    def test_consecutive_calls_with_same_input_do_not_double_append(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "shop.example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/products",
        )

        builder.process_request_from_context(data)
        first = builder.get_event_source_url()

        builder.process_request_from_context(data)
        second = builder.get_event_source_url()

        self.assertEqual(first, second)
        self.assertEqual(
            second,
            "https://shop.example.com/products" + self.net_new_suffix,
        )
        self.assertEqual(second.count(self.net_new_suffix), 1)

    def test_cleared_then_set(self):
        builder = ParamBuilder()

        data1 = PlainDataObject(
            "shop.example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/products",
        )
        builder.process_request_from_context(data1)
        self.assertEqual(
            builder.get_event_source_url(),
            "https://shop.example.com/products" + self.net_new_suffix,
        )

        data2 = PlainDataObject(
            "shop.example.com",
            {},
            {},
            None,
            None,
            None,
            scheme=None,
            request_uri="/products",
        )
        builder.process_request_from_context(data2)
        self.assertIsNone(builder.get_event_source_url())


# =========================================================================
# Cross-field: referrer and event_source_url use different appendix tokens
# =========================================================================
class TestCrossFieldAppendixTokensDiffer(_BaseTest):
    def test_referrer_uses_no_change_event_source_uses_net_new(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "shop.example.com",
            {},
            {},
            "https://facebook.com/ad",
            None,
            None,
            scheme="https",
            request_uri="/checkout",
        )
        builder.process_request_from_context(data)

        self.assertEqual(
            builder.get_referrer_url(),
            "https://facebook.com/ad" + self.no_change_suffix,
        )
        self.assertEqual(
            builder.get_event_source_url(),
            "https://shop.example.com/checkout" + self.net_new_suffix,
        )
        # Sanity: the two suffixes differ because the type byte differs.
        self.assertNotEqual(self.no_change_suffix, self.net_new_suffix)


# =========================================================================
# Documentation tests: feeding output back as input DOUBLE-APPENDS.
#
# The SDK has no dedup logic. These tests lock in the current behavior so a
# future refactor that adds dedup will trigger an explicit decision.
# =========================================================================
class TestDoubleAppendDocumentation(_BaseTest):
    def test_referrer_doubles_when_output_fed_back(self):
        builder = ParamBuilder()
        referer = "https://example.com/page"

        builder.process_request("example.com", {}, {}, referer)
        first = builder.get_referrer_url()
        self.assertEqual(first, referer + self.no_change_suffix)

        builder.process_request("example.com", {}, {}, first)
        second = builder.get_referrer_url()

        self.assertEqual(
            second,
            referer + self.no_change_suffix + self.no_change_suffix,
        )
        self.assertEqual(second.count(self.no_change_suffix), 2)

    def test_event_source_doubles_when_request_uri_fed_back(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "shop.example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/products",
        )
        builder.process_request_from_context(data)
        first = builder.get_event_source_url()
        self.assertEqual(
            first,
            "https://shop.example.com/products" + self.net_new_suffix,
        )

        contaminated = PlainDataObject(
            "shop.example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/products" + self.net_new_suffix,
        )
        builder.process_request_from_context(contaminated)
        second = builder.get_event_source_url()

        self.assertEqual(
            second,
            "https://shop.example.com/products"
            + self.net_new_suffix
            + self.net_new_suffix,
        )
        self.assertEqual(second.count(self.net_new_suffix), 2)
