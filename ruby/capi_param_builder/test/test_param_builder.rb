# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

# minitest
require 'minitest/autorun'
require_relative '../lib/capi_param_builder'
require 'test_etld_plus_one_resolver'
require_relative '../lib/model/fbc_param_configs'


class TestParamBuilder < Minitest::Test
    def test_process_request_with_fbc_fbp_updated
        builder = ParamBuilder.new()
        cookie_to_update = builder.process_request(
            "localhost",
            {"fbclid"=>"test123", "utm"=>"test"},
            {"test"=>"value", "_fbc"=>"fb.1.2.test_fbc"},
            "example.com?fbclid=test345")
        assert_equal(2, cookie_to_update.size())
        assert_contains(".test123", builder.get_fbc())
        assert_contains("fb.0.", builder.get_fbp())
        for cookie in cookie_to_update do
            if cookie.name == '_fbc'
                assert cookie.value.end_with?(".test123.BQ")
                assert_contains('fb.0.', cookie.value)
                assert_contains("localhost", cookie.domain)
            else
                assert_equal(ParamBuilder::FBP_NAME, cookie.name)
                assert cookie.value.end_with?(".BQ")
                assert_equal("localhost", cookie.domain)
            end
        end
        assert_equal(cookie_to_update, builder.get_cookies_to_set())
    end

    def test_process_request_with_fbc_fbp_update_no_cookie
        builder = ParamBuilder.new(["example.com"])
        cookie_to_update = builder.process_request(
            "https://balablaba.example.com:9090",
            {"fbclid"=>"test123", "utm"=>"test"},
            {},
            "example.com")
        assert_equal(2, cookie_to_update.size())
        assert builder.get_fbc().end_with?(".test123.BQ")
        assert_contains("fb.1.", builder.get_fbp())
        assert builder.get_fbp().end_with?(".BQ")
        for cookie in cookie_to_update do
            if cookie.name == '_fbc'
                assert cookie.value.end_with?(".test123.BQ")
                assert_contains('fb.1.', cookie.value)
                assert_equal("example.com", cookie.domain)
            else
                assert_equal(ParamBuilder::FBP_NAME, cookie.name)
                assert_contains("fb.1.", cookie.value)
                assert cookie.value.end_with?(".BQ")
                assert_equal("example.com", cookie.domain)
            end
        end
        assert_equal(cookie_to_update, builder.get_cookies_to_set())
    end

    def test_process_request_with_with_resolver
        builder = ParamBuilder.new(TestEtldPlusOneResolver.new())
        cookie_to_update = builder.process_request(
            "this.is.a.test.com",
            {"test"=>"test123", "utm"=>"test", "fbclid"=>"test"},
            {"_fbp"=>"fb.1.123.value", "_fbc"=>"fb.1.2.test_fbc"},
            nil)
        # add language token
        assert_equal(2, cookie_to_update.size())
        for cookie in cookie_to_update do
            if cookie.name == ParamBuilder::FBC_NAME
                assert_contains(".test.BQ", cookie.value)
                assert_contains("fb.4.", cookie.value)
                assert_equal("this.is.a.test.com", cookie.domain)
            else
                assert_equal(ParamBuilder::FBP_NAME, cookie.name)
                assert_equal("fb.1.123.value.BQ", cookie.value)
                assert_equal("this.is.a.test.com", cookie.domain)
            end
        end
        assert_equal(cookie_to_update, builder.get_cookies_to_set())
    end

    def test_process_request_with_with_empty_constructor
        builder = ParamBuilder.new()
        cookie_to_update = builder.process_request(
            "this.is.a.test.co.uk:9000",
            {"test"=>"test123", "utm"=>"test", "fbclid"=>"test"},
            {"_fbp"=>"fb.1.123.test.BQ"},
            "https://example.com?fbclid=wer")
        assert_equal(1, cookie_to_update.size())
        for cookie in cookie_to_update do
            assert_contains(".test.BQ", cookie.value)
            assert_contains("fb.4.", cookie.value)
            assert_equal("is.a.test.co.uk", cookie.domain)
        end
        assert_equal(cookie_to_update, builder.get_cookies_to_set())
    end

    def test_process_request_with_with_invali_string_domain_list
        # invalid domain list, fall back to default
        builder = ParamBuilder.new("https://example.com")
        cookie_to_update = builder.process_request(
            "this.is.a.test.example.com:9000",
            {"test"=>"test123", "utm"=>"test", "fbclid"=>"test"},
            {"_fbp"=>"fb.1.123.test.BQ"},
            "https://example.com?fbclid=wer")
        assert_equal(1, cookie_to_update.size())
        for cookie in cookie_to_update do
            assert_contains(".test.BQ", cookie.value)
            assert_contains("fb.4.", cookie.value)
            assert_equal("is.a.test.example.com", cookie.domain)
        end
        assert_equal(cookie_to_update, builder.get_cookies_to_set())
    end

    def test_process_request_with_with_referer
        builder = ParamBuilder.new()
        cookie_to_update = builder.process_request(
            "this.is.a.test.co.uk:9000",
            {"test"=>"test123", "utm"=>"test"},
            {"_fbp"=>"fb.1.123.value.invalid"},
            "https://example.com?fbclid=wer")
        assert_equal(2, cookie_to_update.size())
        for cookie in cookie_to_update do
            if cookie.name == ParamBuilder::FBC_NAME
                assert_contains(".wer.BQ", cookie.value)
                assert_contains("fb.4.", cookie.value)
                assert_equal("is.a.test.co.uk", cookie.domain)
            else
                assert_equal(ParamBuilder::FBP_NAME, cookie.name)
                assert_contains("fb.4.", cookie.value)
                assert_contains(".BQ", cookie.value)
                assert_equal("is.a.test.co.uk", cookie.domain)
            end
        end
        assert_equal(cookie_to_update, builder.get_cookies_to_set())
    end

    def test_process_request_with_with_duplicate_referer_params
        builder = ParamBuilder.new()
        cookie_to_update = builder.process_request(
            "this.is.a.test.co.uk:9000",
            {"test"=>"test123", "utm"=>"test"},
            {"_fbp"=>"value"},#invalid fbp
            "https://example.com?fbclid=wer&fbclid=test123")
        assert_equal(2, cookie_to_update.size())
        for cookie in cookie_to_update do
            if cookie.name == ParamBuilder::FBC_NAME
                assert_contains(".wer.BQ", cookie.value)
                assert_contains("fb.4.", cookie.value)
                assert_equal("is.a.test.co.uk", cookie.domain)
            else
                assert_equal(ParamBuilder::FBP_NAME, cookie.name)
                assert_contains("fb.4.", cookie.value)
                assert_contains(".BQ", cookie.value)
            end
        end
        assert_equal(cookie_to_update, builder.get_cookies_to_set())
    end

    def test_process_request_with_param_config_update
        builder = ParamBuilder.new(["https://example.com"])
        builder.instance_variable_set(:@fbc_params_configs,
            [
                FbcParamConfigs.new("fbclid", "", "clickID"),
                FbcParamConfigs.new("query", "test1", "placeholder")
            ])
        cookie_to_update = builder.process_request(
            "this.is.a.test.example.com:9000",
            {"fbclid"=>"test123", "query"=>"test2"},
            {},
        )
        assert_equal(2, cookie_to_update.size())
        for cookie in cookie_to_update do
            if cookie.name == ParamBuilder::FBC_NAME
                assert_contains(".test123_test1_test2.BQ", cookie.value)
                assert_contains("fb.1.", cookie.value)
                assert_equal("example.com", cookie.domain)
            else
                assert_equal(ParamBuilder::FBP_NAME, cookie.name)
                assert_contains("fb.1.", cookie.value)
                assert_contains(".BQ", cookie.value)
            end
        end
        assert_equal(cookie_to_update, builder.get_cookies_to_set())
    end


    def test_process_request_with_param_config_update_referer
        builder = ParamBuilder.new(["https://example.com"])
        builder.instance_variable_set(:@fbc_params_configs,
            [
                FbcParamConfigs.new("fbclid", "", "clickID"),
                FbcParamConfigs.new("query", "test1", "placeholder")
            ])
        cookie_to_update = builder.process_request(
            "this.is.a.test.example.com:9000",
            {"utm"=>"test"},
            {},
            "https://example.com?fbclid=wer&query=test3"
        )
        assert_equal(2, cookie_to_update.size())
        for cookie in cookie_to_update do
            if cookie.name == ParamBuilder::FBC_NAME
                assert_contains(".wer_test1_test3.BQ", cookie.value)
                assert_contains("fb.1.", cookie.value)
                assert_equal("example.com", cookie.domain)
            else
                assert_equal(ParamBuilder::FBP_NAME, cookie.name)
                assert_contains("fb.1.", cookie.value)
                assert_contains(".BQ", cookie.value)
            end
        end
        assert_equal(cookie_to_update, builder.get_cookies_to_set())
    end

    def test_process_request_with_with_mutiple_domain_list
        builder = ParamBuilder.new(["https://example.com:9000", "test.co.uk:8989", "https://example.co.uk:1234"])
        cookie_to_update = builder.process_request(
            "this.is.a.test.example.co.uk",
            nil,
            {"_fbc"=>"fb.1.2.test_fbc"})
        assert_equal(2, cookie_to_update.size())
        for cookie in cookie_to_update do
            if cookie.name == ParamBuilder::FBC_NAME
                assert_equal("fb.1.2.test_fbc.BQ", cookie.value)
                assert_equal("example.co.uk", cookie.domain)
            else
                assert_equal(ParamBuilder::FBP_NAME, cookie.name)
                assert_contains(".BQ", cookie.value)
                assert_equal("example.co.uk", cookie.domain)
            end
        end
        assert_equal(cookie_to_update, builder.get_cookies_to_set())
    end

    def test_process_request_with_with_mutiple_domain_exact_match
        builder = ParamBuilder.new(["https://example.com:9000", "test.co.uk:8989", "https://example.CO.uk:1234"])
        cookie_to_update = builder.process_request(
            "https://EXAMPLE.co.uk:8080",
            nil,
            {"_fbc"=>"fb.1.2.test_fbc.BQ"})
        assert_equal(1, cookie_to_update.size())
        for cookie in cookie_to_update do
            assert_equal(ParamBuilder::FBP_NAME, cookie.name)
            assert_contains("fb.2.", cookie.value)
            assert_equal("example.co.uk", cookie.domain)
        end
        assert_equal("fb.1.2.test_fbc.BQ", builder.get_fbc())
        assert_equal(cookie_to_update, builder.get_cookies_to_set())
    end

    def test_process_request_with_no_update
        builder = ParamBuilder.new()
        cookie_to_update = builder.process_request(
            "localhost",
            {"test"=>"test123", "utm"=>"test"},
            {"_fbp"=>"fb.1.123.345.BQ", "_fbc"=>"fb.1.2.test_fbc.Bg"},
            nil)
        assert_equal(0, cookie_to_update.size())
        assert_equal("fb.1.2.test_fbc.Bg", builder.get_fbc())
        assert_equal("fb.1.123.345.BQ", builder.get_fbp())
        assert_equal(cookie_to_update, builder.get_cookies_to_set())
    end

    def test_process_request_with_valie_cookies_with_language_update
        builder = ParamBuilder.new()
        cookie_to_update = builder.process_request(
            "localhost",
            {"test"=>"test123", "utm"=>"test"},
            {"_fbp"=>"fb.1.123.345", "_fbc"=>"fb.1.2.test_fbc"},
            nil)
        assert_equal(2, cookie_to_update.size())
        assert_equal("fb.1.2.test_fbc.BQ", builder.get_fbc())
        assert_equal("fb.1.123.345.BQ", builder.get_fbp())
        for cookie in cookie_to_update do
            if cookie.name == ParamBuilder::FBC_NAME
                assert_equal("fb.1.2.test_fbc.BQ", cookie.value)
                assert_equal("localhost", cookie.domain)
            else
                assert_equal(ParamBuilder::FBP_NAME, cookie.name)
                assert_equal("fb.1.123.345.BQ", cookie.value)
                assert_equal("localhost", cookie.domain)
            end
        end
        assert_equal(cookie_to_update, builder.get_cookies_to_set())
    end

    def test_extract_host_from_http_host_with_protocol_and_port
        builder = ParamBuilder.new()
        host_name = builder.send(:extract_host_from_http_host, "https://example.com:3030")
        assert_equal("example.com", host_name)
    end

    def test_extract_host_from_http_host_with_ipv6
        builder = ParamBuilder.new()
        host_name = builder.send(:extract_host_from_http_host, "[::1]:8080")
        assert_equal("::1", host_name)
    end

    def test_extract_host_from_http_host_with_ipv4
        builder = ParamBuilder.new()
        host_name = builder.send(:extract_host_from_http_host, "192.168.0.1:9000")
        assert_equal("192.168.0.1", host_name)
    end

    def test_extract_host_from_http_host_with_localhost
        builder = ParamBuilder.new()
        host_name = builder.send(:extract_host_from_http_host, "localhost")
        assert_equal("localhost", host_name)
    end

    def test_is_ip_address_with_localhost
        builder = ParamBuilder.new()
        host_name = builder.send(:is_ip_address, "localhost")
        assert_equal(false, host_name)
    end

    def test_is_ip_address_with_ipv4
        builder = ParamBuilder.new()
        host_name = builder.send(:is_ip_address, "192.168.0.1")
        assert_equal(true, host_name)
    end

    def test_is_ip_address_with_ipv6
        builder = ParamBuilder.new()
        host_name = builder.send(:is_ip_address, "::1")
        assert_equal(true, host_name)
    end

    def test_maybe_bracket_ipv6
        builder = ParamBuilder.new()
        host_name = builder.send(:maybe_bracket_ipv6, "::1")
        assert_equal("[::1]", host_name)
    end

    def test_maybe_bracket_ipv6_when_ipv4
        builder = ParamBuilder.new()
        host_name = builder.send(:maybe_bracket_ipv6, "127.0.0.1")
        assert_equal("127.0.0.1", host_name)
    end

    def assert_contains(expected_substring, string)
        assert string.include?(expected_substring)
    end
end
