# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

require 'minitest/autorun'
require_relative '../lib/capi_param_builder'

class TestPlainDataObjectBackwardCompat < Minitest::Test
    def test_six_positional_args_leaves_scheme_nil
        pdo = PlainDataObject.new('host', {}, {}, 'ref', 'xff', 'addr')
        assert_nil(pdo.scheme)
    end

    def test_six_positional_args_leaves_request_uri_nil
        pdo = PlainDataObject.new('host', {}, {}, 'ref', 'xff', 'addr')
        assert_nil(pdo.request_uri)
    end

    def test_three_positional_args_leaves_all_optional_nil
        pdo = PlainDataObject.new('host', {'k' => 'v'}, {'c' => 'cv'})
        assert_nil(pdo.referer)
        assert_nil(pdo.x_forwarded_for)
        assert_nil(pdo.remote_address)
        assert_nil(pdo.scheme)
        assert_nil(pdo.request_uri)
    end

    def test_six_positional_args_preserves_original_fields
        pdo = PlainDataObject.new('example.com', {'a' => '1'}, {'b' => '2'}, 'ref', 'xff', '1.2.3.4')
        assert_equal('example.com', pdo.host)
        assert_equal({'a' => '1'}, pdo.query_params)
        assert_equal({'b' => '2'}, pdo.cookies)
        assert_equal('ref', pdo.referer)
        assert_equal('xff', pdo.x_forwarded_for)
        assert_equal('1.2.3.4', pdo.remote_address)
    end
end

class TestPlainDataObjectScheme < Minitest::Test
    def test_scheme_https_via_constructor
        pdo = PlainDataObject.new('h', {}, {}, nil, nil, nil, 'https')
        assert_equal('https', pdo.scheme)
    end

    def test_scheme_http_via_constructor
        pdo = PlainDataObject.new('h', {}, {}, nil, nil, nil, 'http')
        assert_equal('http', pdo.scheme)
    end

    def test_scheme_nil_via_constructor
        pdo = PlainDataObject.new('h', {}, {}, nil, nil, nil, nil)
        assert_nil(pdo.scheme)
    end

    def test_scheme_set_via_accessor
        pdo = PlainDataObject.new('h', {}, {})
        pdo.scheme = 'https'
        assert_equal('https', pdo.scheme)
    end

    def test_scheme_reset_to_nil_via_accessor
        pdo = PlainDataObject.new('h', {}, {}, nil, nil, nil, 'https')
        pdo.scheme = nil
        assert_nil(pdo.scheme)
    end

    def test_scheme_does_not_affect_original_fields
        pdo = PlainDataObject.new('myhost', {'q' => 'v'}, {'c' => 'cv'}, 'ref', 'xff', 'addr', 'https')
        assert_equal('myhost', pdo.host)
        assert_equal({'q' => 'v'}, pdo.query_params)
        assert_equal({'c' => 'cv'}, pdo.cookies)
        assert_equal('ref', pdo.referer)
        assert_equal('xff', pdo.x_forwarded_for)
        assert_equal('addr', pdo.remote_address)
    end
end

class TestPlainDataObjectRequestUri < Minitest::Test
    def test_request_uri_simple_path
        pdo = PlainDataObject.new('h', {}, {}, nil, nil, nil, nil, '/path/to/resource')
        assert_equal('/path/to/resource', pdo.request_uri)
    end

    def test_request_uri_with_query_string
        pdo = PlainDataObject.new('h', {}, {}, nil, nil, nil, nil, '/search?q=test&page=1')
        assert_equal('/search?q=test&page=1', pdo.request_uri)
    end

    def test_request_uri_with_special_chars
        pdo = PlainDataObject.new('h', {}, {}, nil, nil, nil, nil, '/path?key=hello%20world&foo=bar%26baz')
        assert_equal('/path?key=hello%20world&foo=bar%26baz', pdo.request_uri)
    end

    def test_request_uri_with_unicode_percent_encoded
        pdo = PlainDataObject.new('h', {}, {}, nil, nil, nil, nil, '/search?q=%E6%97%A5%E6%9C%AC')
        assert_equal('/search?q=%E6%97%A5%E6%9C%AC', pdo.request_uri)
    end

    def test_request_uri_empty_string
        pdo = PlainDataObject.new('h', {}, {}, nil, nil, nil, nil, '')
        assert_equal('', pdo.request_uri)
    end

    def test_request_uri_nil_via_constructor
        pdo = PlainDataObject.new('h', {}, {}, nil, nil, nil, nil, nil)
        assert_nil(pdo.request_uri)
    end

    def test_request_uri_empty_string_vs_nil
        pdo_empty = PlainDataObject.new('h', {}, {}, nil, nil, nil, nil, '')
        pdo_nil = PlainDataObject.new('h', {}, {}, nil, nil, nil, nil, nil)
        refute_nil(pdo_empty.request_uri)
        assert_nil(pdo_nil.request_uri)
        refute_equal(pdo_empty.request_uri, pdo_nil.request_uri)
    end

    def test_request_uri_set_via_accessor
        pdo = PlainDataObject.new('h', {}, {})
        pdo.request_uri = '/new/path'
        assert_equal('/new/path', pdo.request_uri)
    end

    def test_request_uri_reset_to_nil_via_accessor
        pdo = PlainDataObject.new('h', {}, {}, nil, nil, nil, nil, '/path')
        pdo.request_uri = nil
        assert_nil(pdo.request_uri)
    end

    def test_request_uri_does_not_affect_original_fields
        pdo = PlainDataObject.new('myhost', {'q' => 'v'}, {'c' => 'cv'}, 'ref', 'xff', 'addr', nil, '/uri')
        assert_equal('myhost', pdo.host)
        assert_equal({'q' => 'v'}, pdo.query_params)
        assert_equal({'c' => 'cv'}, pdo.cookies)
        assert_equal('ref', pdo.referer)
        assert_equal('xff', pdo.x_forwarded_for)
        assert_equal('addr', pdo.remote_address)
    end
end

class TestPlainDataObjectAllFields < Minitest::Test
    def test_all_eight_fields_via_constructor
        pdo = PlainDataObject.new(
            'example.com',
            {'fbclid' => 'abc'},
            {'_fbc' => 'fb.1.2.xyz'},
            'https://referrer.com',
            '10.0.0.1',
            '192.168.1.1',
            'https',
            '/landing?fbclid=abc'
        )
        assert_equal('example.com', pdo.host)
        assert_equal({'fbclid' => 'abc'}, pdo.query_params)
        assert_equal({'_fbc' => 'fb.1.2.xyz'}, pdo.cookies)
        assert_equal('https://referrer.com', pdo.referer)
        assert_equal('10.0.0.1', pdo.x_forwarded_for)
        assert_equal('192.168.1.1', pdo.remote_address)
        assert_equal('https', pdo.scheme)
        assert_equal('/landing?fbclid=abc', pdo.request_uri)
    end

    def test_setting_new_fields_via_accessor_preserves_original
        pdo = PlainDataObject.new('host', {'k' => 'v'}, {'c' => 'cv'}, 'ref', 'xff', 'addr')
        pdo.scheme = 'http'
        pdo.request_uri = '/page?id=42'
        assert_equal('host', pdo.host)
        assert_equal({'k' => 'v'}, pdo.query_params)
        assert_equal({'c' => 'cv'}, pdo.cookies)
        assert_equal('ref', pdo.referer)
        assert_equal('xff', pdo.x_forwarded_for)
        assert_equal('addr', pdo.remote_address)
        assert_equal('http', pdo.scheme)
        assert_equal('/page?id=42', pdo.request_uri)
    end
end
