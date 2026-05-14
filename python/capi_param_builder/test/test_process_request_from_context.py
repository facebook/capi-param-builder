# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

import unittest
from unittest.mock import patch

from capi_param_builder.model import PlainDataObject
from capi_param_builder.param_builder import ParamBuilder

from .test_etld_plus_one_resolver import TestEtldPlusOneResolver

APPENDIX_NO_CHANGE_V1_0_1 = "AQIAAQAB"
APPENDIX_NET_NEW_V1_0_1 = "AQICAQAB"
APPENDIX_MODIFIED_NEW_V1_0_1 = "AQIDAQAB"


def _h(name: str, value: str):
    """Build an ASGI header tuple (latin-1 bytes)."""
    return (name.encode("latin-1"), value.encode("latin-1"))


def _build_asgi_scope(**overrides):
    scope = {
        "type": "http",
        "headers": [],
        "query_string": b"",
        "client": ("127.0.0.1", 12345),
    }
    scope.update(overrides)
    return scope


class _AsgiRequest:
    def __init__(self, scope):
        self.scope = scope


class _DjangoRequest:
    def __init__(self, meta):
        self.META = meta


class _FlaskRequest:
    def __init__(self, environ):
        self.environ = environ


class _BaseTest(unittest.TestCase):
    def setUp(self) -> None:
        super().setUp()
        # Mock _get_version so appendix values are deterministic across the suite.
        self.version_patcher = patch(
            "capi_param_builder.param_builder.ParamBuilder._get_version"
        )
        self.mock_version = self.version_patcher.start()
        self.mock_version.return_value = "1.0.1"

    def tearDown(self) -> None:
        super().tearDown()
        self.version_patcher.stop()

    def _cookie_by_name(self, cookies, name):
        for c in cookies:
            if c.name == name:
                return c
        return None


# =============================================================================
# PlainDataObject Input
# =============================================================================
class TestPlainDataObjectInput(_BaseTest):
    def test_basic_plain_data_object_with_fbclid(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com", {"fbclid": ["test123"]}, {}, None, None, None
        )

        result = builder.process_request_from_context(data)

        self.assertEqual(len(result), 2)
        fbc = self._cookie_by_name(result, "_fbc")
        self.assertIsNotNone(fbc)
        self.assertTrue(fbc.value.endswith(f".test123.{APPENDIX_NET_NEW_V1_0_1}"))
        self.assertIsNotNone(builder.get_fbp())

    def test_plain_data_object_with_existing_cookies_appends_no_change_token(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {
                "_fbc": "fb.1.123456.abc",
                "_fbp": "fb.1.123456.7890",
            },
            None,
            None,
            None,
        )

        builder.process_request_from_context(data)

        self.assertEqual(
            builder.get_fbc(), f"fb.1.123456.abc.{APPENDIX_NO_CHANGE_V1_0_1}"
        )
        self.assertEqual(
            builder.get_fbp(), f"fb.1.123456.7890.{APPENDIX_NO_CHANGE_V1_0_1}"
        )

    def test_plain_data_object_with_no_fbclid_still_generates_fbp(self):
        builder = ParamBuilder()
        data = PlainDataObject("example.com", {}, {}, None, None, None)

        result = builder.process_request_from_context(data)

        self.assertEqual(len(result), 1)
        fbp = self._cookie_by_name(result, "_fbp")
        self.assertIsNotNone(fbp)
        self.assertTrue(fbp.value.endswith(f".{APPENDIX_NET_NEW_V1_0_1}"))
        self.assertIsNone(builder.get_fbc())

    def test_plain_data_object_with_referer_fallback(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "landing.example.com",
            {},
            {},
            "https://facebook.com/ad?fbclid=IwAR_fromReferer",
            None,
            None,
        )

        builder.process_request_from_context(data)

        self.assertIsNotNone(builder.get_fbc())
        self.assertTrue(
            builder.get_fbc().endswith(f".IwAR_fromReferer.{APPENDIX_NET_NEW_V1_0_1}")
        )

    def test_plain_data_object_query_takes_precedence_over_referer(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {"fbclid": "fromQuery"},
            {},
            "https://facebook.com/ad?fbclid=fromReferer",
            None,
            None,
        )

        builder.process_request_from_context(data)

        self.assertTrue(
            builder.get_fbc().endswith(f".fromQuery.{APPENDIX_NET_NEW_V1_0_1}")
        )

    def test_plain_data_object_ignores_unused_ip_fields(self):
        # x_forwarded_for and remote_address are extracted by the adapter but
        # the current Python ParamBuilder doesn't yet consume them; this test
        # just confirms passing them does not break processing.
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {"fbclid": "ipTest"},
            {},
            None,
            "203.0.113.50, 10.0.0.1",
            "10.0.0.1",
        )

        result = builder.process_request_from_context(data)

        self.assertEqual(len(result), 2)
        self.assertTrue(
            builder.get_fbc().endswith(f".ipTest.{APPENDIX_NET_NEW_V1_0_1}")
        )


# =============================================================================
# WSGI Environ Input
# =============================================================================
class TestWsgiInput(_BaseTest):
    def test_raw_wsgi_environ_dict(self):
        builder = ParamBuilder()
        environ = {
            "HTTP_HOST": "api.example.com",
            "REMOTE_ADDR": "192.168.1.100",
            "QUERY_STRING": "fbclid=fromQS",
        }

        result = builder.process_request_from_context(environ)

        self.assertEqual(len(result), 2)
        self.assertTrue(
            builder.get_fbc().endswith(f".fromQS.{APPENDIX_NET_NEW_V1_0_1}")
        )

    def test_wsgi_environ_cookie_header_parsed(self):
        builder = ParamBuilder()
        environ = {
            "HTTP_HOST": "example.com",
            "HTTP_COOKIE": "_fbc=fb.1.123.abc; _fbp=fb.1.456.7890",
        }

        builder.process_request_from_context(environ)

        self.assertEqual(builder.get_fbc(), f"fb.1.123.abc.{APPENDIX_NO_CHANGE_V1_0_1}")
        self.assertEqual(
            builder.get_fbp(), f"fb.1.456.7890.{APPENDIX_NO_CHANGE_V1_0_1}"
        )

    def test_wsgi_environ_referer_used_when_query_empty(self):
        builder = ParamBuilder()
        environ = {
            "HTTP_HOST": "landing.example.com",
            "HTTP_REFERER": "https://facebook.com/ad?fbclid=IwAR_referer",
        }

        builder.process_request_from_context(environ)

        self.assertTrue(
            builder.get_fbc().endswith(f".IwAR_referer.{APPENDIX_NET_NEW_V1_0_1}")
        )

    def test_django_request_with_meta(self):
        builder = ParamBuilder()
        request = _DjangoRequest(
            {
                "HTTP_HOST": "django-app.com",
                "QUERY_STRING": "fbclid=djangoTest",
                "REMOTE_ADDR": "10.0.0.5",
            }
        )

        builder.process_request_from_context(request)

        self.assertTrue(
            builder.get_fbc().endswith(f".djangoTest.{APPENDIX_NET_NEW_V1_0_1}")
        )

    def test_flask_request_with_environ(self):
        builder = ParamBuilder()
        request = _FlaskRequest(
            {
                "HTTP_HOST": "flask-app.com",
                "QUERY_STRING": "fbclid=flaskTest",
                "HTTP_COOKIE": "_fbp=fb.1.999.existingFbp",
            }
        )

        builder.process_request_from_context(request)

        self.assertTrue(
            builder.get_fbc().endswith(f".flaskTest.{APPENDIX_NET_NEW_V1_0_1}")
        )
        self.assertEqual(
            builder.get_fbp(), f"fb.1.999.existingFbp.{APPENDIX_NO_CHANGE_V1_0_1}"
        )


# =============================================================================
# ASGI Scope Input
# =============================================================================
class TestAsgiInput(_BaseTest):
    def test_starlette_request_with_scope_attr(self):
        builder = ParamBuilder()
        scope = _build_asgi_scope(
            headers=[
                _h("host", "asgi-app.com"),
                _h("cookie", "_fbp=fb.1.111.existingFbp"),
            ],
            query_string=b"fbclid=asgiTest",
        )
        request = _AsgiRequest(scope)

        builder.process_request_from_context(request)

        self.assertTrue(
            builder.get_fbc().endswith(f".asgiTest.{APPENDIX_NET_NEW_V1_0_1}")
        )
        self.assertEqual(
            builder.get_fbp(), f"fb.1.111.existingFbp.{APPENDIX_NO_CHANGE_V1_0_1}"
        )

    def test_raw_asgi_scope_dict(self):
        builder = ParamBuilder()
        scope = _build_asgi_scope(
            headers=[_h("host", "raw-scope.com")],
            query_string=b"fbclid=rawScopeTest",
        )

        builder.process_request_from_context(scope)

        self.assertTrue(
            builder.get_fbc().endswith(f".rawScopeTest.{APPENDIX_NET_NEW_V1_0_1}")
        )

    def test_asgi_referer_extracted_when_query_empty(self):
        builder = ParamBuilder()
        scope = _build_asgi_scope(
            headers=[
                _h("host", "landing.example.com"),
                _h("referer", "https://facebook.com/ad?fbclid=IwAR_asgi"),
            ],
        )

        builder.process_request_from_context(scope)

        self.assertTrue(
            builder.get_fbc().endswith(f".IwAR_asgi.{APPENDIX_NET_NEW_V1_0_1}")
        )

    def test_asgi_multiple_cookie_headers_joined(self):
        # HTTP/2 may split Cookie across multiple headers; the adapter joins
        # them with "; " before parsing.
        builder = ParamBuilder()
        scope = _build_asgi_scope(
            headers=[
                _h("host", "h2.example.com"),
                _h("cookie", "_fbc=fb.1.123.abc"),
                _h("cookie", "_fbp=fb.1.456.7890"),
            ],
        )

        builder.process_request_from_context(scope)

        self.assertEqual(builder.get_fbc(), f"fb.1.123.abc.{APPENDIX_NO_CHANGE_V1_0_1}")
        self.assertEqual(
            builder.get_fbp(), f"fb.1.456.7890.{APPENDIX_NO_CHANGE_V1_0_1}"
        )


# =============================================================================
# None / Empty Input
# =============================================================================
class TestEmptyInput(_BaseTest):
    def test_none_context_returns_only_fbp_with_empty_host(self):
        # No context -> adapter returns defaults (host=""); fbp is generated
        # since cookies are empty.
        builder = ParamBuilder()

        result = builder.process_request_from_context(None)

        self.assertIsNone(builder.get_fbc())
        self.assertEqual(len(result), 1)
        fbp = self._cookie_by_name(result, "_fbp")
        self.assertIsNotNone(fbp)
        self.assertTrue(fbp.value.endswith(f".{APPENDIX_NET_NEW_V1_0_1}"))

    def test_empty_dict_context_returns_only_fbp_with_empty_host(self):
        builder = ParamBuilder()

        result = builder.process_request_from_context({})

        self.assertIsNone(builder.get_fbc())
        self.assertEqual(len(result), 1)


# =============================================================================
# Equivalence with process_request
# =============================================================================
class TestEquivalenceWithProcessRequest(_BaseTest):
    def test_plain_data_object_equivalent_to_process_request(self):
        host = "shop.example.com"
        queries = {"fbclid": ["equivalenceTest"]}
        cookies = {}
        referer = "https://facebook.com/ad"

        builder1 = ParamBuilder()
        result1 = builder1.process_request(host, queries, cookies, referer)

        builder2 = ParamBuilder()
        data = PlainDataObject(host, queries, cookies, referer, None, None)
        result2 = builder2.process_request_from_context(data)

        self.assertEqual(len(result1), len(result2))
        # Compare fbc payload (excluding timestamp at index 2)
        fbc1_parts = builder1.get_fbc().split(".")
        fbc2_parts = builder2.get_fbc().split(".")
        self.assertEqual(fbc1_parts[0], fbc2_parts[0])
        self.assertEqual(fbc1_parts[1], fbc2_parts[1])
        self.assertEqual(fbc1_parts[3], fbc2_parts[3])  # payload
        self.assertEqual(fbc1_parts[-1], fbc2_parts[-1])  # appendix

    def test_existing_cookies_produce_equivalent_fbc_fbp(self):
        host = "example.com"
        queries = {}
        cookies = {
            "_fbc": "fb.1.123.existingPayload",
            "_fbp": "fb.1.456.existingFbp",
        }

        builder1 = ParamBuilder()
        builder1.process_request(host, queries, cookies)

        builder2 = ParamBuilder()
        data = PlainDataObject(host, queries, cookies, None, None, None)
        builder2.process_request_from_context(data)

        self.assertEqual(builder1.get_fbc(), builder2.get_fbc())
        self.assertEqual(builder1.get_fbp(), builder2.get_fbp())


# =============================================================================
# Cookie Update Behavior
# =============================================================================
class TestCookieUpdateBehavior(_BaseTest):
    def test_updates_fbc_when_payload_changes(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {"fbclid": "newPayload"},
            {"_fbc": "fb.1.123.oldPayload"},
            None,
            None,
            None,
        )

        builder.process_request_from_context(data)

        self.assertTrue(
            builder.get_fbc().endswith(f".newPayload.{APPENDIX_MODIFIED_NEW_V1_0_1}")
        )

    def test_preserves_fbc_when_payload_is_same(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {"fbclid": "samePayload"},
            {"_fbc": "fb.1.123.samePayload"},
            None,
            None,
            None,
        )

        builder.process_request_from_context(data)

        # Existing cookie gets language-token appended; payload not rewritten.
        self.assertEqual(
            builder.get_fbc(), f"fb.1.123.samePayload.{APPENDIX_NO_CHANGE_V1_0_1}"
        )

    def test_preserves_existing_fbp(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {"_fbp": "fb.1.999.existingFbp"},
            None,
            None,
            None,
        )

        builder.process_request_from_context(data)

        self.assertEqual(
            builder.get_fbp(), f"fb.1.999.existingFbp.{APPENDIX_NO_CHANGE_V1_0_1}"
        )


# =============================================================================
# Domain Handling
# =============================================================================
class TestDomainHandling(_BaseTest):
    def test_domain_list_resolves_correct_etld_plus_one(self):
        builder = ParamBuilder(["example.com", "test.com"])
        data = PlainDataObject(
            "shop.subdomain.test.com",
            {"fbclid": "domainTest"},
            {},
            None,
            None,
            None,
        )

        result = builder.process_request_from_context(data)

        self.assertGreater(len(result), 0)
        for cookie in result:
            self.assertEqual(cookie.domain, "test.com")

    def test_custom_resolver_used(self):
        builder = ParamBuilder(TestEtldPlusOneResolver())
        data = PlainDataObject(
            "balabala.test.example.co.uk",
            {"fbclid": "resolverTest"},
            {},
            None,
            None,
            None,
        )

        result = builder.process_request_from_context(data)

        self.assertGreater(len(result), 0)
        # TestEtldPlusOneResolver returns the host as-is.
        for cookie in result:
            self.assertEqual(cookie.domain, "balabala.test.example.co.uk")

    def test_ipv4_host_with_port(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "127.0.0.1:8080", {"fbclid": "ipv4Test"}, {}, None, None, None
        )

        builder.process_request_from_context(data)

        self.assertTrue(
            builder.get_fbc().endswith(f".ipv4Test.{APPENDIX_NET_NEW_V1_0_1}")
        )

    def test_ipv6_host_bracketed_with_port(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "[::1]:8080", {"fbclid": "ipv6Test"}, {}, None, None, None
        )

        builder.process_request_from_context(data)

        self.assertTrue(
            builder.get_fbc().endswith(f".ipv6Test.{APPENDIX_NET_NEW_V1_0_1}")
        )


# =============================================================================
# Edge Cases
# =============================================================================
class TestEdgeCases(_BaseTest):
    def test_invalid_cookie_format_is_rejected(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {
                "_fbc": "invalid.format.with.too.many.parts.here",
                "_fbp": "also.invalid.format.too.many",
            },
            None,
            None,
            None,
        )

        builder.process_request_from_context(data)

        self.assertIsNone(builder.get_fbc())
        # New fbp should be generated since the existing one was invalid.
        self.assertIsNotNone(builder.get_fbp())
        self.assertTrue(builder.get_fbp().endswith(f".{APPENDIX_NET_NEW_V1_0_1}"))

    def test_cookie_with_invalid_language_token_is_rejected(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {
                "_fbc": "fb.1.123.abc.INVALID",
                "_fbp": "fb.1.456.7890.INVALID",
            },
            None,
            None,
            None,
        )

        builder.process_request_from_context(data)

        self.assertIsNone(builder.get_fbc())
        self.assertTrue(builder.get_fbp().endswith(f".{APPENDIX_NET_NEW_V1_0_1}"))

    def test_cookie_with_valid_language_token_is_preserved(self):
        builder = ParamBuilder()
        # "Bg" is one of the supported language tokens for Python.
        data = PlainDataObject(
            "example.com",
            {},
            {
                "_fbc": "fb.1.123.abc.Bg",
                "_fbp": "fb.1.456.7890.Bg",
            },
            None,
            None,
            None,
        )

        builder.process_request_from_context(data)

        self.assertEqual(builder.get_fbc(), "fb.1.123.abc.Bg")
        self.assertEqual(builder.get_fbp(), "fb.1.456.7890.Bg")

    def test_multiple_calls_reset_state(self):
        builder = ParamBuilder()
        data1 = PlainDataObject(
            "first.example.com",
            {"fbclid": "firstCall"},
            {},
            None,
            None,
            None,
        )
        builder.process_request_from_context(data1)
        fbc1 = builder.get_fbc()

        data2 = PlainDataObject(
            "second.example.com",
            {"fbclid": "secondCall"},
            {},
            None,
            None,
            None,
        )
        builder.process_request_from_context(data2)
        fbc2 = builder.get_fbc()

        self.assertTrue(fbc1.endswith(f".firstCall.{APPENDIX_NET_NEW_V1_0_1}"))
        self.assertTrue(fbc2.endswith(f".secondCall.{APPENDIX_NET_NEW_V1_0_1}"))

    def test_get_cookies_to_set_matches_return_value(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {"fbclid": "getCookiesTest"},
            {},
            None,
            None,
            None,
        )

        result = builder.process_request_from_context(data)
        cookies = builder.get_cookies_to_set()

        self.assertEqual(result, cookies)
        self.assertEqual(len(cookies), 2)
