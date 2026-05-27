# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

import unittest
from unittest.mock import patch

from capi_param_builder.model import PlainDataObject
from capi_param_builder.param_builder import ParamBuilder


def _h(name: str, value: str):
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


# =============================================================================
# _construct_event_source_url — scheme string variants
# =============================================================================
class TestConstructEventSourceUrl(_BaseTest):
    def test_https_scheme_with_host_and_uri(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/path/to/page",
        )

        builder.process_request_from_context(data)

        self.assertEqual(
            builder.get_event_source_url(),
            "https://example.com/path/to/page" + self.net_new_suffix,
        )

    def test_http_scheme_with_host_and_uri(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="http",
            request_uri="/page",
        )

        builder.process_request_from_context(data)

        self.assertEqual(
            builder.get_event_source_url(),
            "http://example.com/page" + self.net_new_suffix,
        )

    def test_scheme_none_returns_none(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {},
            None,
            None,
            None,
            scheme=None,
            request_uri="/page",
        )

        builder.process_request_from_context(data)

        self.assertIsNone(builder.get_event_source_url())

    def test_host_empty_returns_none(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/page",
        )

        builder.process_request_from_context(data)

        self.assertIsNone(builder.get_event_source_url())

    def test_all_empty_returns_none(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "",
            {},
            {},
            None,
            None,
            None,
            scheme=None,
            request_uri=None,
        )

        builder.process_request_from_context(data)

        self.assertIsNone(builder.get_event_source_url())

    def test_host_with_port_preserved(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com:8443",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/api/v1",
        )

        builder.process_request_from_context(data)

        self.assertEqual(
            builder.get_event_source_url(),
            "https://example.com:8443/api/v1" + self.net_new_suffix,
        )

    def test_query_string_preserved(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/search?q=test&page=1",
        )

        builder.process_request_from_context(data)

        self.assertEqual(
            builder.get_event_source_url(),
            "https://example.com/search?q=test&page=1" + self.net_new_suffix,
        )

    def test_scheme_and_host_only_no_uri(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri=None,
        )

        builder.process_request_from_context(data)

        self.assertEqual(
            builder.get_event_source_url(),
            "https://example.com" + self.net_new_suffix,
        )

    def test_empty_host_returns_none(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/page",
        )

        builder.process_request_from_context(data)

        self.assertIsNone(builder.get_event_source_url())

    def test_empty_scheme_returns_none(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="",
            request_uri="/page",
        )

        builder.process_request_from_context(data)

        self.assertIsNone(builder.get_event_source_url())


# =============================================================================
# process_request() vs process_request_from_context() behavior
# =============================================================================
class TestProcessRequestDoesNotSetUrl(_BaseTest):
    def test_process_request_leaves_event_source_url_none(self):
        builder = ParamBuilder()

        builder.process_request("example.com", {}, {})

        self.assertIsNone(builder.get_event_source_url())

    def test_process_request_resets_event_source_url_to_none(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/first",
        )
        builder.process_request_from_context(data)
        self.assertIsNotNone(builder.get_event_source_url())

        builder.process_request("example.com", {}, {})

        self.assertIsNone(builder.get_event_source_url())


# =============================================================================
# Reset between calls
# =============================================================================
class TestEventSourceUrlReset(_BaseTest):
    def test_reset_between_context_calls(self):
        builder = ParamBuilder()

        data1 = PlainDataObject(
            "first.example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/page1",
        )
        builder.process_request_from_context(data1)
        self.assertEqual(
            builder.get_event_source_url(),
            "https://first.example.com/page1" + self.net_new_suffix,
        )

        data2 = PlainDataObject(
            "second.example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="http",
            request_uri="/page2",
        )
        builder.process_request_from_context(data2)
        self.assertEqual(
            builder.get_event_source_url(),
            "http://second.example.com/page2" + self.net_new_suffix,
        )

    def test_reset_to_none_when_second_call_has_no_scheme(self):
        builder = ParamBuilder()

        data1 = PlainDataObject(
            "example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/page",
        )
        builder.process_request_from_context(data1)
        self.assertIsNotNone(builder.get_event_source_url())

        data2 = PlainDataObject(
            "example.com",
            {},
            {},
            None,
            None,
            None,
            scheme=None,
            request_uri="/page",
        )
        builder.process_request_from_context(data2)
        self.assertIsNone(builder.get_event_source_url())


# =============================================================================
# Independence from referrer_url
# =============================================================================
class TestEventSourceUrlIndependenceFromReferrer(_BaseTest):
    def test_referrer_does_not_affect_event_source_url(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {},
            "https://facebook.com/ad?fbclid=ref123",
            None,
            None,
            scheme="https",
            request_uri="/landing",
        )

        builder.process_request_from_context(data)

        self.assertEqual(
            builder.get_event_source_url(),
            "https://example.com/landing" + self.net_new_suffix,
        )
        self.assertEqual(
            builder.get_referrer_url(),
            "https://facebook.com/ad?fbclid=ref123" + self.no_change_suffix,
        )

    def test_event_source_url_set_without_referrer(self):
        builder = ParamBuilder()
        data = PlainDataObject(
            "example.com",
            {},
            {},
            None,
            None,
            None,
            scheme="https",
            request_uri="/page",
        )

        builder.process_request_from_context(data)

        self.assertEqual(
            builder.get_event_source_url(),
            "https://example.com/page" + self.net_new_suffix,
        )
        self.assertIsNone(builder.get_referrer_url())


# =============================================================================
# Via WSGI mock request objects
# =============================================================================
class TestEventSourceUrlViaWsgi(_BaseTest):
    def test_wsgi_environ_sets_event_source_url(self):
        builder = ParamBuilder()
        environ = {
            "HTTP_HOST": "wsgi-app.com",
            "REQUEST_SCHEME": "https",
            "PATH_INFO": "/api/v1/resource",
        }

        builder.process_request_from_context(environ)

        self.assertEqual(
            builder.get_event_source_url(),
            "https://wsgi-app.com/api/v1/resource" + self.net_new_suffix,
        )

    def test_wsgi_environ_with_query_string(self):
        builder = ParamBuilder()
        environ = {
            "HTTP_HOST": "wsgi-app.com",
            "wsgi.url_scheme": "https",
            "PATH_INFO": "/search",
            "QUERY_STRING": "q=test",
        }

        builder.process_request_from_context(environ)

        self.assertEqual(
            builder.get_event_source_url(),
            "https://wsgi-app.com/search?q=test" + self.net_new_suffix,
        )

    def test_django_request_sets_event_source_url(self):
        builder = ParamBuilder()
        request = _DjangoRequest(
            {
                "HTTP_HOST": "django-app.com",
                "REQUEST_SCHEME": "https",
                "PATH_INFO": "/dashboard",
            }
        )

        builder.process_request_from_context(request)

        self.assertEqual(
            builder.get_event_source_url(),
            "https://django-app.com/dashboard" + self.net_new_suffix,
        )

    def test_flask_request_sets_event_source_url(self):
        builder = ParamBuilder()
        request = _FlaskRequest(
            {
                "HTTP_HOST": "flask-app.com",
                "wsgi.url_scheme": "http",
                "PATH_INFO": "/health",
            }
        )

        builder.process_request_from_context(request)

        self.assertEqual(
            builder.get_event_source_url(),
            "http://flask-app.com/health" + self.net_new_suffix,
        )


# =============================================================================
# Via ASGI mock request objects
# =============================================================================
class TestEventSourceUrlViaAsgi(_BaseTest):
    def test_asgi_scope_sets_event_source_url(self):
        builder = ParamBuilder()
        scope = _build_asgi_scope(
            scheme="https",
            path="/api/data",
            headers=[_h("host", "asgi-app.com")],
        )

        builder.process_request_from_context(scope)

        self.assertEqual(
            builder.get_event_source_url(),
            "https://asgi-app.com/api/data" + self.net_new_suffix,
        )

    def test_asgi_scope_with_query_string(self):
        builder = ParamBuilder()
        scope = _build_asgi_scope(
            scheme="https",
            path="/search",
            query_string=b"q=hello",
            headers=[_h("host", "asgi-app.com")],
        )

        builder.process_request_from_context(scope)

        self.assertEqual(
            builder.get_event_source_url(),
            "https://asgi-app.com/search?q=hello" + self.net_new_suffix,
        )

    def test_starlette_request_sets_event_source_url(self):
        builder = ParamBuilder()
        scope = _build_asgi_scope(
            scheme="https",
            path="/endpoint",
            headers=[_h("host", "starlette-app.com")],
        )
        request = _AsgiRequest(scope)

        builder.process_request_from_context(request)

        self.assertEqual(
            builder.get_event_source_url(),
            "https://starlette-app.com/endpoint" + self.net_new_suffix,
        )


# =============================================================================
# Initial state
# =============================================================================
class TestEventSourceUrlInitialState(_BaseTest):
    def test_initial_state_is_none(self):
        builder = ParamBuilder()

        self.assertIsNone(builder.get_event_source_url())
