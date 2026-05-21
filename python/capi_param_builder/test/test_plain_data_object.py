# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

import unittest

from capi_param_builder.model import PlainDataObject


class TestPlainDataObjectBackwardCompat(unittest.TestCase):
    def test_six_positional_args_defaults_new_fields_to_none(self):
        pdo = PlainDataObject(
            host="example.com",
            query_params={"q": ["test"]},
            cookies={"session": "abc"},
            referer="https://referrer.com",
            x_forwarded_for="1.2.3.4",
            remote_address="10.0.0.1",
        )
        self.assertIsNone(pdo.scheme)
        self.assertIsNone(pdo.request_uri)

    def test_original_fields_preserved_with_six_positional_args(self):
        pdo = PlainDataObject(
            host="example.com",
            query_params={"q": ["test"]},
            cookies={"session": "abc"},
            referer="https://referrer.com",
            x_forwarded_for="1.2.3.4",
            remote_address="10.0.0.1",
        )
        self.assertEqual(pdo.host, "example.com")
        self.assertEqual(pdo.query_params, {"q": ["test"]})
        self.assertEqual(pdo.cookies, {"session": "abc"})
        self.assertEqual(pdo.referer, "https://referrer.com")
        self.assertEqual(pdo.x_forwarded_for, "1.2.3.4")
        self.assertEqual(pdo.remote_address, "10.0.0.1")


class TestPlainDataObjectScheme(unittest.TestCase):
    def test_scheme_https(self):
        pdo = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
            scheme="https",
        )
        self.assertEqual(pdo.scheme, "https")

    def test_scheme_http(self):
        pdo = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
            scheme="http",
        )
        self.assertEqual(pdo.scheme, "http")

    def test_scheme_none(self):
        pdo = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
            scheme=None,
        )
        self.assertIsNone(pdo.scheme)

    def test_scheme_does_not_affect_original_fields(self):
        pdo = PlainDataObject(
            host="api.example.com",
            query_params={"page": ["1"]},
            cookies={"_fbp": "fb.1.123.456"},
            referer="https://referrer.com/path",
            x_forwarded_for="203.0.113.50",
            remote_address="192.168.1.1",
            scheme="https",
        )
        self.assertEqual(pdo.host, "api.example.com")
        self.assertEqual(pdo.query_params, {"page": ["1"]})
        self.assertEqual(pdo.cookies, {"_fbp": "fb.1.123.456"})
        self.assertEqual(pdo.referer, "https://referrer.com/path")
        self.assertEqual(pdo.x_forwarded_for, "203.0.113.50")
        self.assertEqual(pdo.remote_address, "192.168.1.1")


class TestPlainDataObjectRequestUri(unittest.TestCase):
    def test_request_uri_with_path(self):
        pdo = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
            request_uri="/api/v1/users",
        )
        self.assertEqual(pdo.request_uri, "/api/v1/users")

    def test_request_uri_with_query_string(self):
        pdo = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
            request_uri="/search?q=hello&page=2",
        )
        self.assertEqual(pdo.request_uri, "/search?q=hello&page=2")

    def test_request_uri_with_special_chars(self):
        pdo = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
            request_uri="/path/to/resource%20with%20spaces?key=%E6%97%A5%E6%9C%AC",
        )
        self.assertEqual(
            pdo.request_uri,
            "/path/to/resource%20with%20spaces?key=%E6%97%A5%E6%9C%AC",
        )

    def test_request_uri_empty_string_vs_none(self):
        pdo_empty = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
            request_uri="",
        )
        pdo_none = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
            request_uri=None,
        )
        self.assertEqual(pdo_empty.request_uri, "")
        self.assertIsNone(pdo_none.request_uri)
        self.assertNotEqual(pdo_empty, pdo_none)

    def test_request_uri_does_not_affect_original_fields(self):
        pdo = PlainDataObject(
            host="api.example.com",
            query_params={"page": ["1"]},
            cookies={"_fbc": "fb.1.333.abc"},
            referer="https://referrer.com/path",
            x_forwarded_for="203.0.113.50",
            remote_address="192.168.1.1",
            request_uri="/checkout?step=3",
        )
        self.assertEqual(pdo.host, "api.example.com")
        self.assertEqual(pdo.query_params, {"page": ["1"]})
        self.assertEqual(pdo.cookies, {"_fbc": "fb.1.333.abc"})
        self.assertEqual(pdo.referer, "https://referrer.com/path")
        self.assertEqual(pdo.x_forwarded_for, "203.0.113.50")
        self.assertEqual(pdo.remote_address, "192.168.1.1")


class TestPlainDataObjectEqualityAndRepr(unittest.TestCase):
    def test_equality_with_same_fields(self):
        kwargs = {
            "host": "example.com",
            "query_params": {"q": ["test"]},
            "cookies": {"k": "v"},
            "referer": "https://ref.com",
            "x_forwarded_for": "1.2.3.4",
            "remote_address": "10.0.0.1",
            "scheme": "https",
            "request_uri": "/path",
        }
        self.assertEqual(PlainDataObject(**kwargs), PlainDataObject(**kwargs))

    def test_inequality_when_scheme_differs(self):
        pdo_https = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
            request_uri="/path",
            scheme="https",
        )
        pdo_http = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
            request_uri="/path",
            scheme="http",
        )
        self.assertNotEqual(pdo_https, pdo_http)

    def test_inequality_when_request_uri_differs(self):
        pdo_a = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
            scheme="https",
            request_uri="/a",
        )
        pdo_b = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
            scheme="https",
            request_uri="/b",
        )
        self.assertNotEqual(pdo_a, pdo_b)

    def test_repr_includes_new_fields(self):
        pdo = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
            scheme="https",
            request_uri="/index",
        )
        r = repr(pdo)
        self.assertIn("scheme='https'", r)
        self.assertIn("request_uri='/index'", r)

    def test_repr_includes_none_for_default_new_fields(self):
        pdo = PlainDataObject(
            host="example.com",
            query_params={},
            cookies={},
            referer=None,
            x_forwarded_for=None,
            remote_address=None,
        )
        r = repr(pdo)
        self.assertIn("scheme=None", r)
        self.assertIn("request_uri=None", r)

    def test_both_new_fields_set_together(self):
        pdo = PlainDataObject(
            host="example.com",
            query_params={"fbclid": ["IwAR3xyz"]},
            cookies={"_fbp": "fb.1.111.222"},
            referer="https://facebook.com/",
            x_forwarded_for="8.8.8.8",
            remote_address="10.0.0.1",
            scheme="https",
            request_uri="/landing?utm_source=facebook",
        )
        self.assertEqual(pdo.scheme, "https")
        self.assertEqual(pdo.request_uri, "/landing?utm_source=facebook")
        self.assertEqual(pdo.host, "example.com")
        self.assertEqual(pdo.query_params, {"fbclid": ["IwAR3xyz"]})
        self.assertEqual(pdo.cookies, {"_fbp": "fb.1.111.222"})
        self.assertEqual(pdo.referer, "https://facebook.com/")
        self.assertEqual(pdo.x_forwarded_for, "8.8.8.8")
        self.assertEqual(pdo.remote_address, "10.0.0.1")
