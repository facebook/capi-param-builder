# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

import unittest
from unittest.mock import patch

from capi_param_builder.model import PlainDataObject
from capi_param_builder.param_builder import ParamBuilder


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
        self.version_patcher = patch(
            "capi_param_builder.param_builder.ParamBuilder._get_version"
        )
        self.mock_version = self.version_patcher.start()
        self.mock_version.return_value = "1.0.1"
        # Compute expected suffixes via a probe builder so the values stay
        # in sync with the appendix algorithm and the mocked version.
        _probe = ParamBuilder()
        self.no_change_suffix: str = "." + _probe.appendix_no_change
        self.net_new_suffix: str = "." + _probe.appendix_net_new

    def tearDown(self) -> None:
        super().tearDown()
        self.version_patcher.stop()


class TestReferrerUrlViaProcessRequest(_BaseTest):
    def test_referrer_stored_before_fbclid_extraction(self):
        builder = ParamBuilder()
        referer = "https://facebook.com/ad?fbclid=IwAR_clickId123"
        builder.process_request("example.com", {}, {}, referer)

        self.assertEqual(builder.get_referrer_url(), referer + self.no_change_suffix)

    def test_returns_none_when_no_referer(self):
        builder = ParamBuilder()
        builder.process_request("example.com", {"fbclid": ["test"]}, {})

        self.assertIsNone(builder.get_referrer_url())

    def test_returns_none_when_referer_is_none(self):
        builder = ParamBuilder()
        builder.process_request("example.com", {}, {}, None)

        self.assertIsNone(builder.get_referrer_url())

    def test_preserves_full_url_with_all_params(self):
        builder = ParamBuilder()
        referer = (
            "https://www.facebook.com/ads?fbclid=abc123&utm_source=fb&utm_medium=cpc"
        )
        builder.process_request(
            "shop.example.com",
            {"fbclid": ["fromQuery"]},
            {"_fbc": "fb.1.123.old", "_fbp": "fb.1.456.existing"},
            referer,
        )

        self.assertEqual(builder.get_referrer_url(), referer + self.no_change_suffix)

    def test_reset_between_consecutive_calls(self):
        builder = ParamBuilder()

        referer1 = "https://facebook.com/ad1?fbclid=first"
        builder.process_request("example.com", {}, {}, referer1)
        self.assertEqual(builder.get_referrer_url(), referer1 + self.no_change_suffix)

        referer2 = "https://facebook.com/ad2?fbclid=second"
        builder.process_request("example.com", {}, {}, referer2)
        self.assertEqual(builder.get_referrer_url(), referer2 + self.no_change_suffix)

    def test_reset_to_none_on_subsequent_call_without_referer(self):
        builder = ParamBuilder()

        builder.process_request(
            "example.com", {}, {}, "https://facebook.com/ad?fbclid=abc"
        )
        self.assertIsNotNone(builder.get_referrer_url())

        builder.process_request("example.com", {}, {})
        self.assertIsNone(builder.get_referrer_url())

    def test_empty_string_referer(self):
        builder = ParamBuilder()
        builder.process_request("example.com", {}, {}, "")

        self.assertEqual(builder.get_referrer_url(), "")

    def test_none_vs_empty_string(self):
        builder = ParamBuilder()

        builder.process_request("example.com", {}, {}, None)
        self.assertIsNone(builder.get_referrer_url())

        builder.process_request("example.com", {}, {}, "")
        self.assertIsNotNone(builder.get_referrer_url())
        self.assertEqual(builder.get_referrer_url(), "")


class TestReferrerUrlViaProcessRequestFromContext(_BaseTest):
    def test_plain_data_object_with_referer(self):
        builder = ParamBuilder()
        referer = "https://facebook.com/ad?fbclid=pdoTest"
        data = PlainDataObject(
            "example.com", {"fbclid": ["test"]}, {}, referer, None, None
        )

        builder.process_request_from_context(data)

        self.assertEqual(builder.get_referrer_url(), referer + self.no_change_suffix)

    def test_plain_data_object_without_referer(self):
        builder = ParamBuilder()
        data = PlainDataObject("example.com", {}, {}, None, None, None)

        builder.process_request_from_context(data)

        self.assertIsNone(builder.get_referrer_url())

    def test_wsgi_environ_with_referer(self):
        builder = ParamBuilder()
        referer = "https://facebook.com/ad?fbclid=wsgiTest"
        environ = {
            "HTTP_HOST": "example.com",
            "HTTP_REFERER": referer,
        }

        builder.process_request_from_context(environ)

        self.assertEqual(builder.get_referrer_url(), referer + self.no_change_suffix)

    def test_wsgi_environ_without_referer(self):
        builder = ParamBuilder()
        environ = {
            "HTTP_HOST": "example.com",
            "QUERY_STRING": "fbclid=test123",
        }

        builder.process_request_from_context(environ)

        self.assertIsNone(builder.get_referrer_url())

    def test_django_request_with_referer(self):
        builder = ParamBuilder()
        referer = "https://facebook.com/ad?fbclid=djangoRef"
        request = _DjangoRequest(
            {
                "HTTP_HOST": "django-app.com",
                "HTTP_REFERER": referer,
            }
        )

        builder.process_request_from_context(request)

        self.assertEqual(builder.get_referrer_url(), referer + self.no_change_suffix)

    def test_flask_request_with_referer(self):
        builder = ParamBuilder()
        referer = "https://facebook.com/ad?fbclid=flaskRef"
        request = _FlaskRequest(
            {
                "HTTP_HOST": "flask-app.com",
                "HTTP_REFERER": referer,
            }
        )

        builder.process_request_from_context(request)

        self.assertEqual(builder.get_referrer_url(), referer + self.no_change_suffix)

    def test_asgi_scope_with_referer(self):
        builder = ParamBuilder()
        referer = "https://facebook.com/ad?fbclid=asgiRef"
        scope = _build_asgi_scope(
            headers=[
                _h("host", "asgi-app.com"),
                _h("referer", referer),
            ],
        )

        builder.process_request_from_context(scope)

        self.assertEqual(builder.get_referrer_url(), referer + self.no_change_suffix)

    def test_asgi_request_with_referer(self):
        builder = ParamBuilder()
        referer = "https://facebook.com/ad?fbclid=asgiReqRef"
        scope = _build_asgi_scope(
            headers=[
                _h("host", "starlette-app.com"),
                _h("referer", referer),
            ],
        )
        request = _AsgiRequest(scope)

        builder.process_request_from_context(request)

        self.assertEqual(builder.get_referrer_url(), referer + self.no_change_suffix)

    def test_asgi_scope_without_referer(self):
        builder = ParamBuilder()
        scope = _build_asgi_scope(
            headers=[_h("host", "asgi-app.com")],
            query_string=b"fbclid=noRefTest",
        )

        builder.process_request_from_context(scope)

        self.assertIsNone(builder.get_referrer_url())

    def test_reset_between_pdo_calls(self):
        builder = ParamBuilder()

        referer1 = "https://facebook.com/ad1"
        data1 = PlainDataObject("example.com", {}, {}, referer1, None, None)
        builder.process_request_from_context(data1)
        self.assertEqual(builder.get_referrer_url(), referer1 + self.no_change_suffix)

        data2 = PlainDataObject("example.com", {}, {}, None, None, None)
        builder.process_request_from_context(data2)
        self.assertIsNone(builder.get_referrer_url())


class TestReferrerUrlInitialState(_BaseTest):
    def test_initial_state_is_none(self):
        builder = ParamBuilder()

        self.assertIsNone(builder.get_referrer_url())
