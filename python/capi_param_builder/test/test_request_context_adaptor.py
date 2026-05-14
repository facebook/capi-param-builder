# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

import unittest

from capi_param_builder.model import PlainDataObject
from capi_param_builder.util import RequestContextAdaptor


def _h(name: str, value: str):
    """Build an ASGI header tuple (latin-1 bytes)."""
    return (name.encode("latin-1"), value.encode("latin-1"))


class _AsgiRequest:
    """Minimal stand-in for a Starlette/FastAPI Request."""

    def __init__(self, scope):
        self.scope = scope


class _WsgiRequest:
    """Minimal stand-in for a Flask/Werkzeug Request."""

    def __init__(self, environ):
        self.environ = environ


class _DjangoRequest:
    """Minimal stand-in for a Django HttpRequest."""

    def __init__(self, meta):
        self.META = meta


class TestRequestContextAdaptorBasics(unittest.TestCase):
    def test_extract_returns_plain_data_object(self):
        result = RequestContextAdaptor.extract(None)
        self.assertIsInstance(result, PlainDataObject)

    def test_extract_with_no_args_returns_defaults(self):
        result = RequestContextAdaptor.extract()
        self.assertEqual(result.host, "")
        self.assertEqual(result.query_params, {})
        self.assertEqual(result.cookies, {})
        self.assertIsNone(result.referer)
        self.assertIsNone(result.x_forwarded_for)
        self.assertIsNone(result.remote_address)

    def test_extract_with_none_returns_defaults(self):
        result = RequestContextAdaptor.extract(None)
        self.assertEqual(result.host, "")
        self.assertEqual(result.query_params, {})
        self.assertEqual(result.cookies, {})
        self.assertIsNone(result.referer)
        self.assertIsNone(result.x_forwarded_for)
        self.assertIsNone(result.remote_address)

    def test_extract_with_empty_dict_returns_defaults(self):
        result = RequestContextAdaptor.extract({})
        self.assertEqual(result.host, "")
        self.assertEqual(result.query_params, {})
        self.assertEqual(result.cookies, {})
        self.assertIsNone(result.referer)
        self.assertIsNone(result.x_forwarded_for)
        self.assertIsNone(result.remote_address)

    def test_extract_with_unsupported_type_returns_defaults(self):
        # Strings, ints, lists are not request-like.
        for bad in ("not a request", 42, ["a", "b"]):
            result = RequestContextAdaptor.extract(bad)
            self.assertEqual(result.host, "")
            self.assertIsNone(result.referer)


class TestRequestContextAdaptorWSGI(unittest.TestCase):
    def test_extract_host_from_http_host(self):
        environ = {"HTTP_HOST": "www.example.com"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.host, "www.example.com")

    def test_extract_host_with_port(self):
        environ = {"HTTP_HOST": "localhost:8080"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.host, "localhost:8080")

    def test_extract_referer(self):
        environ = {"HTTP_REFERER": "https://google.com/search?q=test"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.referer, "https://google.com/search?q=test")

    def test_extract_x_forwarded_for(self):
        environ = {"HTTP_X_FORWARDED_FOR": "203.0.113.195, 70.41.3.18, 150.172.238.178"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(
            result.x_forwarded_for, "203.0.113.195, 70.41.3.18, 150.172.238.178"
        )

    def test_extract_remote_address(self):
        environ = {"REMOTE_ADDR": "192.168.1.100"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.remote_address, "192.168.1.100")

    def test_extract_all_headers(self):
        environ = {
            "HTTP_HOST": "api.example.com",
            "HTTP_REFERER": "https://referrer.com",
            "HTTP_X_FORWARDED_FOR": "8.8.8.8",
            "REMOTE_ADDR": "10.0.0.1",
        }
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.host, "api.example.com")
        self.assertEqual(result.referer, "https://referrer.com")
        self.assertEqual(result.x_forwarded_for, "8.8.8.8")
        self.assertEqual(result.remote_address, "10.0.0.1")

    def test_extract_query_params_from_query_string(self):
        environ = {
            "HTTP_HOST": "example.com",
            "QUERY_STRING": "param1=value1&param2=value2",
        }
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(
            result.query_params, {"param1": ["value1"], "param2": ["value2"]}
        )

    def test_extract_query_params_url_decodes(self):
        environ = {
            "QUERY_STRING": "name=John%20Doe&email=test%40example.com",
        }
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.query_params["name"], ["John Doe"])
        self.assertEqual(result.query_params["email"], ["test@example.com"])

    def test_extract_query_params_repeated_keys_preserved(self):
        environ = {"QUERY_STRING": "tag=a&tag=b&tag=c"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.query_params["tag"], ["a", "b", "c"])

    def test_extract_query_params_empty_query_string(self):
        environ = {"QUERY_STRING": ""}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.query_params, {})

    def test_extract_query_params_blank_value_preserved(self):
        environ = {"QUERY_STRING": "empty=&normal=value"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.query_params["empty"], [""])
        self.assertEqual(result.query_params["normal"], ["value"])

    def test_extract_cookies_from_http_cookie(self):
        environ = {
            "HTTP_HOST": "example.com",
            "HTTP_COOKIE": "cookie1=value1; cookie2=value2",
        }
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.cookies, {"cookie1": "value1", "cookie2": "value2"})

    def test_extract_cookies_with_empty_value(self):
        environ = {"HTTP_COOKIE": "empty=; normal=value"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.cookies["empty"], "")
        self.assertEqual(result.cookies["normal"], "value")

    def test_extract_cookies_with_equals_sign_in_value(self):
        # Base64 padding contains literal '='; the parser must split only on the
        # first '=' so the value retains the trailing padding.
        environ = {"HTTP_COOKIE": "token=YWJjZA=="}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.cookies["token"], "YWJjZA==")

    def test_extract_cookies_preserves_literal_plus(self):
        # Literal '+' in cookie values (common in base64 / JWT) must NOT
        # be converted to space — manual parser preserves it.
        environ = {"HTTP_COOKIE": "token=abc+def==; jwt=eyJ+payload"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.cookies["token"], "abc+def==")
        self.assertEqual(result.cookies["jwt"], "eyJ+payload")

    def test_extract_cookies_preserves_quoted_value(self):
        # SimpleCookie used to strip RFC-2109 quotes; manual parser keeps
        # the raw value, matching JS / PHP / Ruby behavior.
        environ = {"HTTP_COOKIE": 'k="quoted value"'}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.cookies["k"], '"quoted value"')

    def test_extract_cookies_malformed_pair_does_not_drop_others(self):
        # SimpleCookie used to return {} for the entire batch when one
        # cookie had a name it considered invalid (e.g. spaces, brackets).
        # Manual parser isolates per-pair: the bad ones are skipped,
        # everything else (including critical _fbc / _fbp) survives.
        environ = {
            "HTTP_COOKIE": ("_fbp=fb.1.111.222; bad name=v; a[]=v; _fbc=fb.1.333.abc")
        }
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.cookies["_fbp"], "fb.1.111.222")
        self.assertEqual(result.cookies["_fbc"], "fb.1.333.abc")
        # The "bad name" pair has key "bad name" after trim — manual parser
        # keeps it because it doesn't apply SimpleCookie's stricter regex.
        # The crucial regression we're guarding is that _fbc / _fbp survive.

    def test_extract_cookies_skips_empty_key(self):
        environ = {"HTTP_COOKIE": "=orphan_value; valid=value"}
        result = RequestContextAdaptor.extract(environ)
        self.assertNotIn("", result.cookies)
        self.assertEqual(result.cookies["valid"], "value")

    def test_extract_cookies_skips_pair_with_no_equals(self):
        environ = {"HTTP_COOKIE": "valid=value; no_equals_pair; another=test"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.cookies["valid"], "value")
        self.assertEqual(result.cookies["another"], "test")
        self.assertNotIn("no_equals_pair", result.cookies)

    def test_extract_cookies_empty_header(self):
        environ = {"HTTP_COOKIE": ""}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.cookies, {})

    def test_host_falls_back_to_server_name_when_http_host_missing(self):
        environ = {"SERVER_NAME": "example.com", "SERVER_PORT": "80"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.host, "example.com")

    def test_host_falls_back_to_server_name_with_non_default_port(self):
        environ = {"SERVER_NAME": "example.com", "SERVER_PORT": "8080"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.host, "example.com:8080")

    def test_host_falls_back_to_server_name_https_default_port(self):
        environ = {
            "SERVER_NAME": "secure.example.com",
            "SERVER_PORT": "443",
            "wsgi.url_scheme": "https",
        }
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.host, "secure.example.com")

    def test_extract_from_flask_environ_attr(self):
        request = _WsgiRequest({"HTTP_HOST": "flask-app.com", "REMOTE_ADDR": "1.2.3.4"})
        result = RequestContextAdaptor.extract(request)
        self.assertEqual(result.host, "flask-app.com")
        self.assertEqual(result.remote_address, "1.2.3.4")

    def test_extract_from_django_meta_attr(self):
        request = _DjangoRequest(
            {
                "HTTP_HOST": "django-app.com",
                "HTTP_REFERER": "https://django.example.com",
                "REMOTE_ADDR": "10.0.0.5",
                "QUERY_STRING": "page=1",
            }
        )
        result = RequestContextAdaptor.extract(request)
        self.assertEqual(result.host, "django-app.com")
        self.assertEqual(result.referer, "https://django.example.com")
        self.assertEqual(result.remote_address, "10.0.0.5")
        self.assertEqual(result.query_params, {"page": ["1"]})


class TestRequestContextAdaptorASGI(unittest.TestCase):
    def _build_scope(self, **overrides):
        scope = {
            "type": "http",
            "headers": [],
            "query_string": b"",
            "client": ("127.0.0.1", 12345),
        }
        scope.update(overrides)
        return scope

    def test_extract_from_starlette_request(self):
        scope = self._build_scope(
            headers=[
                _h("host", "asgi-app.com"),
                _h("referer", "https://asgi.example.com"),
                _h("x-forwarded-for", "203.0.113.50"),
                _h("cookie", "session=abc123; user=alice"),
            ],
            query_string=b"page=1&sort=name",
            client=("10.0.0.1", 54321),
        )
        request = _AsgiRequest(scope)
        result = RequestContextAdaptor.extract(request)
        self.assertEqual(result.host, "asgi-app.com")
        self.assertEqual(result.referer, "https://asgi.example.com")
        self.assertEqual(result.x_forwarded_for, "203.0.113.50")
        self.assertEqual(result.remote_address, "10.0.0.1")
        self.assertEqual(result.query_params, {"page": ["1"], "sort": ["name"]})
        self.assertEqual(result.cookies, {"session": "abc123", "user": "alice"})

    def test_extract_from_raw_asgi_scope_dict(self):
        scope = self._build_scope(
            headers=[_h("host", "raw-scope.com")],
            query_string=b"key=value",
        )
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.host, "raw-scope.com")
        self.assertEqual(result.query_params, {"key": ["value"]})
        self.assertEqual(result.remote_address, "127.0.0.1")

    def test_extract_websocket_scope(self):
        scope = self._build_scope(
            type="websocket",
            headers=[_h("host", "ws.example.com")],
        )
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.host, "ws.example.com")

    def test_extract_query_string_decoded_from_bytes(self):
        scope = self._build_scope(
            headers=[_h("host", "example.com")],
            query_string=b"name=John%20Doe&fbclid=IwAR3xyz",
        )
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.query_params["name"], ["John Doe"])
        self.assertEqual(result.query_params["fbclid"], ["IwAR3xyz"])

    def test_extract_client_remote_address_from_tuple(self):
        scope = self._build_scope(client=("192.168.1.100", 8080))
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.remote_address, "192.168.1.100")

    def test_extract_client_none_returns_no_remote_address(self):
        scope = self._build_scope(client=None)
        result = RequestContextAdaptor.extract(scope)
        self.assertIsNone(result.remote_address)

    def test_extract_multiple_cookie_headers_joined(self):
        # HTTP/2 is allowed to split Cookie across multiple headers (RFC 7540).
        scope = self._build_scope(
            headers=[
                _h("host", "h2.example.com"),
                _h("cookie", "a=1"),
                _h("cookie", "b=2"),
                _h("cookie", "c=3"),
            ],
        )
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.cookies, {"a": "1", "b": "2", "c": "3"})

    def test_extract_multiple_x_forwarded_for_joined(self):
        scope = self._build_scope(
            headers=[
                _h("host", "example.com"),
                _h("x-forwarded-for", "203.0.113.1"),
                _h("x-forwarded-for", "70.41.3.18"),
            ],
        )
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.x_forwarded_for, "203.0.113.1, 70.41.3.18")

    def test_host_falls_back_to_server_tuple_with_non_default_port(self):
        scope = self._build_scope(
            headers=[],
            server=("fallback.example.com", 8000),
        )
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.host, "fallback.example.com:8000")

    def test_host_falls_back_to_server_tuple_omits_default_port(self):
        scope = self._build_scope(
            headers=[],
            scheme="https",
            server=("secure.example.com", 443),
        )
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.host, "secure.example.com")

    def test_server_none_does_not_raise(self):
        scope = self._build_scope(headers=[], server=None)
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.host, "")

    def test_missing_client_and_server_keys_do_not_raise(self):
        scope = {"type": "http", "headers": [], "query_string": b""}
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.host, "")
        self.assertIsNone(result.remote_address)

    def test_server_port_as_string_normalized_for_default_port(self):
        # Some non-spec ASGI servers may pass the port as a string;
        # default-port comparison must still drop it.
        scope = self._build_scope(
            headers=[],
            scheme="https",
            server=("secure.example.com", "443"),
        )
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.host, "secure.example.com")

    def test_server_ipv6_literal_is_bracketed_with_port(self):
        scope = self._build_scope(
            headers=[],
            server=("2001:db8::1", 8000),
        )
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.host, "[2001:db8::1]:8000")

    def test_server_ipv6_literal_default_port_not_bracketed(self):
        scope = self._build_scope(
            headers=[],
            server=("2001:db8::1", 80),
        )
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.host, "2001:db8::1")

    def test_object_with_unrelated_scope_attr_uses_wsgi_path(self):
        # Object whose .scope is a dict but not an ASGI HTTP scope should
        # not be treated as ASGI; it should fall through to the WSGI path.
        class NotAsgi:
            def __init__(self):
                self.scope = {"type": "lifespan"}
                self.environ = {
                    "HTTP_HOST": "wsgi-fallback.com",
                    "REMOTE_ADDR": "10.0.0.1",
                }

        result = RequestContextAdaptor.extract(NotAsgi())
        self.assertEqual(result.host, "wsgi-fallback.com")
        self.assertEqual(result.remote_address, "10.0.0.1")

    def test_asgi_authority_used_as_host_fallback(self):
        # HTTP/2 may carry only `:authority`. Without the fallback the
        # adapter would drop to scope["server"] which is the bind address.
        scope = self._build_scope(
            headers=[_h(":authority", "http2-pure.example.com")],
            server=("127.0.0.1", 8000),
        )
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.host, "http2-pure.example.com")

    def test_asgi_host_takes_precedence_over_authority(self):
        scope = self._build_scope(
            headers=[
                _h("host", "host.example.com"),
                _h(":authority", "authority.example.com"),
            ],
        )
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.host, "host.example.com")

    def test_asgi_mixed_case_header_keys_are_matched(self):
        # ASGI spec mandates lowercase, but raw test scopes / non-spec
        # servers may carry mixed case. _get_asgi_headers should still
        # match defensively rather than silently dropping them.
        scope = self._build_scope(
            headers=[
                (b"Host", b"mixed-case.example.com"),
                (b"Cookie", b"_fbp=fb.1.123.456"),
            ],
        )
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.host, "mixed-case.example.com")
        self.assertEqual(result.cookies["_fbp"], "fb.1.123.456")

    def test_object_with_both_scope_and_environ_prefers_asgi(self):
        # If the request looks like ASGI, ASGI wins.
        class Hybrid:
            scope = {
                "type": "http",
                "headers": [_h("host", "asgi.com")],
                "query_string": b"",
                "client": ("1.1.1.1", 80),
            }
            environ = {"HTTP_HOST": "wsgi.com"}

        result = RequestContextAdaptor.extract(Hybrid())
        self.assertEqual(result.host, "asgi.com")


class TestRequestContextAdaptorEdgeCases(unittest.TestCase):
    def test_empty_strings_in_environ(self):
        environ = {
            "HTTP_HOST": "",
            "HTTP_REFERER": "",
            "HTTP_X_FORWARDED_FOR": "",
            "REMOTE_ADDR": "",
        }
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.host, "")
        self.assertIsNone(result.referer)
        self.assertIsNone(result.x_forwarded_for)
        self.assertIsNone(result.remote_address)

    def test_very_long_hostname(self):
        long_host = "a" * 255 + ".example.com"
        environ = {"HTTP_HOST": long_host}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.host, long_host)

    def test_very_long_query_string(self):
        long_value = "x" * 10000
        environ = {"QUERY_STRING": f"long_param={long_value}"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.query_params["long_param"], [long_value])

    def test_many_cookies(self):
        cookie_header = "; ".join(f"cookie{i}=value{i}" for i in range(50))
        environ = {"HTTP_COOKIE": cookie_header}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(len(result.cookies), 50)
        self.assertEqual(result.cookies["cookie0"], "value0")
        self.assertEqual(result.cookies["cookie49"], "value49")

    def test_unicode_in_query_params(self):
        environ = {
            "QUERY_STRING": "name=%E6%97%A5%E6%9C%AC%E8%AA%9E&emoji=%F0%9F%9A%80"
        }
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.query_params["name"], ["日本語"])
        self.assertEqual(result.query_params["emoji"], ["🚀"])

    def test_ipv6_remote_address(self):
        environ = {
            "HTTP_HOST": "ipv6.example.com",
            "REMOTE_ADDR": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        }
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(
            result.remote_address, "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
        )

    def test_ipv6_in_x_forwarded_for(self):
        environ = {"HTTP_X_FORWARDED_FOR": "2001:db8::1, 2001:db8::2"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.x_forwarded_for, "2001:db8::1, 2001:db8::2")

    def test_potentially_malicious_host_header_passes_through(self):
        # Extraction is raw; validation is the consumer's responsibility.
        environ = {"HTTP_HOST": "evil.com\r\nX-Injected: header"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.host, "evil.com\r\nX-Injected: header")

    def test_script_tags_in_query_params_pass_through(self):
        environ = {"QUERY_STRING": "xss=%3Cscript%3Ealert(1)%3C%2Fscript%3E"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.query_params["xss"], ["<script>alert(1)</script>"])

    def test_does_not_modify_input_environ(self):
        environ = {"HTTP_HOST": "example.com", "HTTP_REFERER": "https://referrer.com"}
        original = dict(environ)
        RequestContextAdaptor.extract(environ)
        self.assertEqual(environ, original)


class TestRequestContextAdaptorMetaCookies(unittest.TestCase):
    def test_fbp_cookie(self):
        environ = {"HTTP_COOKIE": "_fbp=fb.1.1234567890123.1234567890"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.cookies["_fbp"], "fb.1.1234567890123.1234567890")

    def test_fbc_cookie(self):
        environ = {"HTTP_COOKIE": "_fbc=fb.1.1234567890123.AbCdEfGhIjKlMnOp"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.cookies["_fbc"], "fb.1.1234567890123.AbCdEfGhIjKlMnOp")

    def test_fbclid_in_query_params(self):
        environ = {"QUERY_STRING": "fbclid=IwAR3xYz_test_fbclid_value"}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.query_params["fbclid"], ["IwAR3xYz_test_fbclid_value"])

    def test_landing_page_with_utm_params(self):
        environ = {
            "HTTP_HOST": "landing.example.com",
            "HTTP_REFERER": "https://www.facebook.com/",
            "REMOTE_ADDR": "8.8.8.8",
            "QUERY_STRING": (
                "utm_source=facebook&utm_medium=cpc&utm_campaign=spring_sale"
                "&fbclid=IwAR3abc123"
            ),
        }
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.query_params["utm_source"], ["facebook"])
        self.assertEqual(result.query_params["fbclid"], ["IwAR3abc123"])
        self.assertEqual(result.referer, "https://www.facebook.com/")


class TestRequestContextAdaptorErrorRecovery(unittest.TestCase):
    def test_consistent_results_on_repeated_calls(self):
        environ = {
            "HTTP_HOST": "consistent.example.com",
            "HTTP_REFERER": "https://referrer.com",
            "REMOTE_ADDR": "8.8.8.8",
        }
        first = RequestContextAdaptor.extract(environ)
        second = RequestContextAdaptor.extract(environ)
        self.assertEqual(first.host, second.host)
        self.assertEqual(first.referer, second.referer)
        self.assertEqual(first.remote_address, second.remote_address)

    def test_malformed_asgi_headers_do_not_raise(self):
        # Headers value is invalid; the broad except should swallow the error
        # and return the fully-default PlainDataObject.
        scope = {
            "type": "http",
            "headers": "not-a-list-of-tuples",
            "query_string": b"",
            "client": ("127.0.0.1", 0),
        }
        result = RequestContextAdaptor.extract(scope)
        self.assertEqual(result.host, "")
        self.assertEqual(result.query_params, {})
        self.assertEqual(result.cookies, {})
        self.assertIsNone(result.referer)
        self.assertIsNone(result.x_forwarded_for)
        self.assertIsNone(result.remote_address)

    def test_environ_with_integer_server_port_does_not_raise(self):
        # Some test fixtures pass SERVER_PORT as an int; should not raise.
        environ = {"SERVER_NAME": "example.com", "SERVER_PORT": 8080}
        result = RequestContextAdaptor.extract(environ)
        self.assertEqual(result.host, "example.com:8080")
