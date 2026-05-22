# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

require 'minitest/autorun'
require_relative '../lib/capi_param_builder'

# Minimal stand-in for a Rack/Rails/Sinatra request that exposes #env.
class FakeRackRequest
  attr_reader :env
  def initialize(env)
    @env = env
  end
end

# Object whose #env returns a non-Hash — should fall back to defaults.
class BadEnvRequest
  def env
    'not-a-hash'
  end
end

class TestRequestContextAdaptorBasics < Minitest::Test
  def test_extract_returns_plain_data_object
    result = RequestContextAdaptor.extract(nil)
    assert_kind_of(PlainDataObject, result)
  end

  def test_extract_with_no_args_returns_defaults
    result = RequestContextAdaptor.extract
    assert_equal('', result.host)
    assert_equal({}, result.query_params)
    assert_equal({}, result.cookies)
    assert_nil(result.referer)
    assert_nil(result.x_forwarded_for)
    assert_nil(result.remote_address)
  end

  def test_extract_with_nil_returns_defaults
    result = RequestContextAdaptor.extract(nil)
    assert_equal('', result.host)
    assert_equal({}, result.query_params)
    assert_equal({}, result.cookies)
    assert_nil(result.referer)
    assert_nil(result.x_forwarded_for)
    assert_nil(result.remote_address)
  end

  def test_extract_with_empty_hash_returns_defaults
    result = RequestContextAdaptor.extract({})
    assert_equal('', result.host)
    assert_equal({}, result.query_params)
    assert_equal({}, result.cookies)
    assert_nil(result.referer)
    assert_nil(result.x_forwarded_for)
    assert_nil(result.remote_address)
  end

  def test_extract_with_unsupported_type_returns_defaults
    ['not a request', 42, [1, 2, 3]].each do |bad|
      result = RequestContextAdaptor.extract(bad)
      assert_equal('', result.host)
      assert_nil(result.referer)
    end
  end

  def test_request_with_non_hash_env_returns_defaults
    result = RequestContextAdaptor.extract(BadEnvRequest.new)
    assert_equal('', result.host)
    assert_equal({}, result.cookies)
  end
end

class TestRequestContextAdaptorRackEnv < Minitest::Test
  def test_extract_host_from_http_host
    env = { 'HTTP_HOST' => 'www.example.com' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('www.example.com', result.host)
  end

  def test_extract_host_with_port
    env = { 'HTTP_HOST' => 'localhost:8080' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('localhost:8080', result.host)
  end

  def test_extract_referer
    env = { 'HTTP_REFERER' => 'https://google.com/search?q=test' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('https://google.com/search?q=test', result.referer)
  end

  def test_extract_x_forwarded_for
    env = { 'HTTP_X_FORWARDED_FOR' => '203.0.113.195, 70.41.3.18, 150.172.238.178' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('203.0.113.195, 70.41.3.18, 150.172.238.178', result.x_forwarded_for)
  end

  def test_extract_remote_address
    env = { 'REMOTE_ADDR' => '192.168.1.100' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('192.168.1.100', result.remote_address)
  end

  def test_extract_all_headers
    env = {
      'HTTP_HOST' => 'api.example.com',
      'HTTP_REFERER' => 'https://referrer.com',
      'HTTP_X_FORWARDED_FOR' => '8.8.8.8',
      'REMOTE_ADDR' => '10.0.0.1'
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal('api.example.com', result.host)
    assert_equal('https://referrer.com', result.referer)
    assert_equal('8.8.8.8', result.x_forwarded_for)
    assert_equal('10.0.0.1', result.remote_address)
  end

  def test_extract_query_params_from_query_string
    env = {
      'HTTP_HOST' => 'example.com',
      'QUERY_STRING' => 'param1=value1&param2=value2'
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal({ 'param1' => ['value1'], 'param2' => ['value2'] }, result.query_params)
  end

  def test_extract_query_params_url_decodes
    env = { 'QUERY_STRING' => 'name=John%20Doe&email=test%40example.com' }
    result = RequestContextAdaptor.extract(env)
    assert_equal(['John Doe'], result.query_params['name'])
    assert_equal(['test@example.com'], result.query_params['email'])
  end

  def test_extract_query_params_repeated_keys_preserved
    env = { 'QUERY_STRING' => 'tag=a&tag=b&tag=c' }
    result = RequestContextAdaptor.extract(env)
    assert_equal(['a', 'b', 'c'], result.query_params['tag'])
  end

  def test_extract_query_params_empty_query_string
    env = { 'QUERY_STRING' => '' }
    result = RequestContextAdaptor.extract(env)
    assert_equal({}, result.query_params)
  end

  def test_extract_cookies_from_http_cookie
    env = {
      'HTTP_HOST' => 'example.com',
      'HTTP_COOKIE' => 'cookie1=value1; cookie2=value2'
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal({ 'cookie1' => 'value1', 'cookie2' => 'value2' }, result.cookies)
  end

  def test_extract_cookies_with_url_encoded_values
    env = { 'HTTP_COOKIE' => 'encoded=hello%20world; special=a%3Db%26c%3Dd' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('hello world', result.cookies['encoded'])
    assert_equal('a=b&c=d', result.cookies['special'])
  end

  def test_extract_cookies_with_equals_in_value
    # base64 padding contains literal '=' — the parser must split only on the
    # first '=' so the value retains the trailing padding.
    env = { 'HTTP_COOKIE' => 'token=YWJjZA==' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('YWJjZA==', result.cookies['token'])
  end

  def test_extract_cookies_preserves_literal_plus
    # Cookies are not query strings: a literal `+` (common in base64 / JWT
    # values) must NOT be converted to space. Our percent-decoder must
    # preserve `+` while still decoding `%`-escapes.
    env = { 'HTTP_COOKIE' => 'token=abc+def==; jwt=eyJ+payload' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('abc+def==', result.cookies['token'])
    assert_equal('eyJ+payload', result.cookies['jwt'])
  end

  def test_extract_cookies_decodes_multibyte_utf8
    # %E6%97%A5 -> "日" (Japanese for "day"). A correct percent-decoder
    # must produce a valid UTF-8 string, not raw bytes.
    env = { 'HTTP_COOKIE' => 'lang=%E6%97%A5%E6%9C%AC%E8%AA%9E' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('日本語', result.cookies['lang'])
    assert(result.cookies['lang'].valid_encoding?)
  end

  def test_extract_cookies_handles_preexisting_utf8_with_escape
    # REGRESSION: Without `.b` (force binary) before gsub, this raised
    # Encoding::CompatibilityError because the receiver is UTF-8 and
    # pack("H2") produces ASCII-8BIT bytes. The exception used to bubble
    # out of percent_decode and lose the entire cookies hash.
    env = { 'HTTP_COOKIE' => 'mixed=日本+%E6%97%A5' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('日本+日', result.cookies['mixed'])
    assert(result.cookies['mixed'].valid_encoding?)
  end

  def test_extract_cookies_scrubs_invalid_percent_encoded_bytes
    # %FF%FF is not valid UTF-8. Without `.scrub`, the cookie value would
    # be a String tagged as UTF-8 but with valid_encoding? == false,
    # which crashes downstream JSON serialization / hashing.
    env = { 'HTTP_COOKIE' => 'corrupt=%FF%FF; valid=ok' }
    result = RequestContextAdaptor.extract(env)
    assert(result.cookies['corrupt'].valid_encoding?)
    # The valid cookie next to the corrupt one must survive.
    assert_equal('ok', result.cookies['valid'])
  end

  def test_extract_cookies_per_pair_isolation_keeps_meta_cookies
    # Co-tenant cookie that previously triggered an encoding error must
    # not wipe out the critical _fbc / _fbp cookies in the same header.
    env = {
      'HTTP_COOKIE' =>
        '_fbp=fb.1.111.222; mixed=日本+%E6%97%A5; _fbc=fb.1.333.abc'
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal('fb.1.111.222', result.cookies['_fbp'])
    assert_equal('fb.1.333.abc', result.cookies['_fbc'])
  end

  def test_extract_cookies_with_empty_value
    env = { 'HTTP_COOKIE' => 'empty=; normal=value' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('', result.cookies['empty'])
    assert_equal('value', result.cookies['normal'])
  end

  def test_extract_cookies_empty_header
    env = { 'HTTP_COOKIE' => '' }
    result = RequestContextAdaptor.extract(env)
    assert_equal({}, result.cookies)
  end

  def test_extract_cookies_skips_malformed_pairs
    env = { 'HTTP_COOKIE' => 'valid=value; invalid_no_equals; another=test' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('value', result.cookies['valid'])
    assert_equal('test', result.cookies['another'])
    refute(result.cookies.key?('invalid_no_equals'))
  end

  def test_host_falls_back_to_server_name_when_http_host_missing
    env = { 'SERVER_NAME' => 'example.com', 'SERVER_PORT' => '80' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('example.com', result.host)
  end

  def test_host_falls_back_to_server_name_with_non_default_port
    env = { 'SERVER_NAME' => 'example.com', 'SERVER_PORT' => '8080' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('example.com:8080', result.host)
  end

  def test_host_falls_back_to_server_name_https_default_port
    env = {
      'SERVER_NAME' => 'secure.example.com',
      'SERVER_PORT' => '443',
      'rack.url_scheme' => 'https'
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal('secure.example.com', result.host)
  end

  def test_host_falls_back_to_server_name_ipv6_bracketed
    env = { 'SERVER_NAME' => '2001:db8::1', 'SERVER_PORT' => '8000' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('[2001:db8::1]:8000', result.host)
  end

  def test_host_server_name_ipv6_default_port_still_bracketed
    # Bare IPv6 literals must always be bracketed so downstream host parsers
    # don't truncate at the first/last `:`.
    env = { 'SERVER_NAME' => '2001:db8::1', 'SERVER_PORT' => '80' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('[2001:db8::1]', result.host)
  end

  def test_host_server_name_ipv6_no_port_still_bracketed
    env = { 'SERVER_NAME' => '2001:db8::1' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('[2001:db8::1]', result.host)
  end

  def test_extract_from_rack_request_with_env_method
    request = FakeRackRequest.new(
      'HTTP_HOST' => 'rack-app.com',
      'REMOTE_ADDR' => '1.2.3.4',
      'QUERY_STRING' => 'page=1'
    )
    result = RequestContextAdaptor.extract(request)
    assert_equal('rack-app.com', result.host)
    assert_equal('1.2.3.4', result.remote_address)
    assert_equal({ 'page' => ['1'] }, result.query_params)
  end
end

class TestRequestContextAdaptorEdgeCases < Minitest::Test
  def test_empty_strings_in_env_become_nil_for_optional_fields
    env = {
      'HTTP_HOST' => '',
      'HTTP_REFERER' => '',
      'HTTP_X_FORWARDED_FOR' => '',
      'REMOTE_ADDR' => ''
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal('', result.host)
    assert_nil(result.referer)
    assert_nil(result.x_forwarded_for)
    assert_nil(result.remote_address)
  end

  def test_very_long_hostname
    long_host = ('a' * 255) + '.example.com'
    env = { 'HTTP_HOST' => long_host }
    result = RequestContextAdaptor.extract(env)
    assert_equal(long_host, result.host)
  end

  def test_very_long_query_string
    long_value = 'x' * 10_000
    env = { 'QUERY_STRING' => "long_param=#{long_value}" }
    result = RequestContextAdaptor.extract(env)
    assert_equal([long_value], result.query_params['long_param'])
  end

  def test_many_cookies
    cookie_header = (0...50).map { |i| "cookie#{i}=value#{i}" }.join('; ')
    env = { 'HTTP_COOKIE' => cookie_header }
    result = RequestContextAdaptor.extract(env)
    assert_equal(50, result.cookies.size)
    assert_equal('value0', result.cookies['cookie0'])
    assert_equal('value49', result.cookies['cookie49'])
  end

  def test_unicode_in_query_params
    env = { 'QUERY_STRING' => 'name=%E6%97%A5%E6%9C%AC%E8%AA%9E&emoji=%F0%9F%9A%80' }
    result = RequestContextAdaptor.extract(env)
    assert_equal(['日本語'], result.query_params['name'])
    assert_equal(['🚀'], result.query_params['emoji'])
  end

  def test_ipv6_remote_address
    env = {
      'HTTP_HOST' => 'ipv6.example.com',
      'REMOTE_ADDR' => '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal('2001:0db8:85a3:0000:0000:8a2e:0370:7334', result.remote_address)
  end

  def test_ipv6_in_x_forwarded_for
    env = { 'HTTP_X_FORWARDED_FOR' => '2001:db8::1, 2001:db8::2' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('2001:db8::1, 2001:db8::2', result.x_forwarded_for)
  end

  def test_potentially_malicious_host_header_passes_through
    # Extraction is raw; validation is the consumer's responsibility.
    env = { 'HTTP_HOST' => "evil.com\r\nX-Injected: header" }
    result = RequestContextAdaptor.extract(env)
    assert_equal("evil.com\r\nX-Injected: header", result.host)
  end

  def test_does_not_modify_input_env
    env = {
      'HTTP_HOST' => 'example.com',
      'HTTP_REFERER' => 'https://referrer.com'
    }
    original = env.dup
    RequestContextAdaptor.extract(env)
    assert_equal(original, env)
  end
end

class TestRequestContextAdaptorMetaCookies < Minitest::Test
  def test_fbp_cookie
    env = { 'HTTP_COOKIE' => '_fbp=fb.1.1234567890123.1234567890' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('fb.1.1234567890123.1234567890', result.cookies['_fbp'])
  end

  def test_fbc_cookie
    env = { 'HTTP_COOKIE' => '_fbc=fb.1.1234567890123.AbCdEfGhIjKlMnOp' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('fb.1.1234567890123.AbCdEfGhIjKlMnOp', result.cookies['_fbc'])
  end

  def test_fbclid_in_query_params
    env = { 'QUERY_STRING' => 'fbclid=IwAR3xYz_test_fbclid_value' }
    result = RequestContextAdaptor.extract(env)
    assert_equal(['IwAR3xYz_test_fbclid_value'], result.query_params['fbclid'])
  end

  def test_landing_page_with_utm_params
    env = {
      'HTTP_HOST' => 'landing.example.com',
      'HTTP_REFERER' => 'https://www.facebook.com/',
      'REMOTE_ADDR' => '8.8.8.8',
      'QUERY_STRING' =>
        'utm_source=facebook&utm_medium=cpc&utm_campaign=spring_sale&fbclid=IwAR3abc123'
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal(['facebook'], result.query_params['utm_source'])
    assert_equal(['IwAR3abc123'], result.query_params['fbclid'])
    assert_equal('https://www.facebook.com/', result.referer)
  end
end

class TestRequestContextAdaptorErrorRecovery < Minitest::Test
  def test_consistent_results_on_repeated_calls
    env = {
      'HTTP_HOST' => 'consistent.example.com',
      'HTTP_REFERER' => 'https://referrer.com',
      'REMOTE_ADDR' => '8.8.8.8'
    }
    first = RequestContextAdaptor.extract(env)
    second = RequestContextAdaptor.extract(env)
    assert_equal(first.host, second.host)
    assert_equal(first.referer, second.referer)
    assert_equal(first.remote_address, second.remote_address)
  end

  def test_env_with_integer_server_port_does_not_raise
    # Some test fixtures pass SERVER_PORT as an integer; should not raise.
    env = { 'SERVER_NAME' => 'example.com', 'SERVER_PORT' => 8080 }
    result = RequestContextAdaptor.extract(env)
    assert_equal('example.com:8080', result.host)
  end
end

class TestRequestContextAdaptorScheme < Minitest::Test
  def test_scheme_from_request_scheme
    env = { 'REQUEST_SCHEME' => 'https' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('https', result.scheme)
  end

  def test_scheme_from_request_scheme_case_insensitive
    env = { 'REQUEST_SCHEME' => 'HTTPS' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('https', result.scheme)
  end

  def test_scheme_from_rack_url_scheme
    env = { 'rack.url_scheme' => 'https' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('https', result.scheme)
  end

  def test_request_scheme_takes_precedence_over_rack_url_scheme
    env = {
      'REQUEST_SCHEME' => 'https',
      'rack.url_scheme' => 'http'
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal('https', result.scheme)
  end

  def test_scheme_https_fallback_on
    env = { 'HTTPS' => 'on' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('https', result.scheme)
  end

  def test_scheme_https_fallback_nonstandard_truthy
    env = { 'HTTPS' => '1' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('https', result.scheme)
  end

  def test_scheme_https_fallback_off
    env = { 'HTTPS' => 'off' }
    result = RequestContextAdaptor.extract(env)
    assert_nil(result.scheme)
  end

  def test_scheme_https_fallback_empty_string
    env = { 'HTTPS' => '' }
    result = RequestContextAdaptor.extract(env)
    assert_nil(result.scheme)
  end

  def test_scheme_nil_when_no_scheme_env_vars
    env = { 'HTTP_HOST' => 'example.com' }
    result = RequestContextAdaptor.extract(env)
    assert_nil(result.scheme)
  end

  def test_scheme_nil_for_nil_request
    result = RequestContextAdaptor.extract(nil)
    assert_nil(result.scheme)
  end

  def test_scheme_nil_for_empty_request
    result = RequestContextAdaptor.extract
    assert_nil(result.scheme)
  end

  def test_scheme_http_explicit
    env = { 'REQUEST_SCHEME' => 'http' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('http', result.scheme)
  end

  def test_scheme_from_rack_request_object
    request = FakeRackRequest.new('rack.url_scheme' => 'https')
    result = RequestContextAdaptor.extract(request)
    assert_equal('https', result.scheme)
  end
end

class TestRequestContextAdaptorRequestUri < Minitest::Test
  def test_request_uri_from_request_uri
    env = { 'REQUEST_URI' => '/path/to/resource?key=val' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('/path/to/resource?key=val', result.request_uri)
  end

  def test_request_uri_from_script_name_and_path_info
    env = {
      'SCRIPT_NAME' => '/app',
      'PATH_INFO' => '/page'
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal('/app/page', result.request_uri)
  end

  def test_request_uri_from_path_info_only
    env = { 'PATH_INFO' => '/hello' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('/hello', result.request_uri)
  end

  def test_request_uri_from_script_name_only
    env = { 'SCRIPT_NAME' => '/myapp' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('/myapp', result.request_uri)
  end

  def test_request_uri_fallback_with_query_string
    env = {
      'SCRIPT_NAME' => '/app',
      'PATH_INFO' => '/index',
      'QUERY_STRING' => 'foo=bar&baz=qux'
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal('/app/index?foo=bar&baz=qux', result.request_uri)
  end

  def test_request_uri_takes_precedence_over_fallback
    env = {
      'REQUEST_URI' => '/original?a=1',
      'SCRIPT_NAME' => '/app',
      'PATH_INFO' => '/other',
      'QUERY_STRING' => 'b=2'
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal('/original?a=1', result.request_uri)
  end

  def test_request_uri_nil_when_no_path_components
    env = { 'HTTP_HOST' => 'example.com' }
    result = RequestContextAdaptor.extract(env)
    assert_nil(result.request_uri)
  end

  def test_request_uri_empty_path_with_query_prepends_slash
    env = { 'QUERY_STRING' => 'fbclid=abc123' }
    result = RequestContextAdaptor.extract(env)
    assert_equal('/?fbclid=abc123', result.request_uri)
  end

  def test_request_uri_nil_for_nil_request
    result = RequestContextAdaptor.extract(nil)
    assert_nil(result.request_uri)
  end

  def test_request_uri_nil_for_empty_request
    result = RequestContextAdaptor.extract
    assert_nil(result.request_uri)
  end

  def test_request_uri_fallback_ignores_empty_query_string
    env = {
      'PATH_INFO' => '/page',
      'QUERY_STRING' => ''
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal('/page', result.request_uri)
  end

  def test_request_uri_from_rack_request_object
    request = FakeRackRequest.new(
      'REQUEST_URI' => '/api/v1/data'
    )
    result = RequestContextAdaptor.extract(request)
    assert_equal('/api/v1/data', result.request_uri)
  end
end

class TestRequestContextAdaptorSchemeRequestUriWithExistingFields < Minitest::Test
  def test_scheme_and_request_uri_alongside_other_fields
    env = {
      'HTTP_HOST' => 'api.example.com',
      'HTTP_REFERER' => 'https://referrer.com',
      'HTTP_X_FORWARDED_FOR' => '8.8.8.8',
      'REMOTE_ADDR' => '10.0.0.1',
      'QUERY_STRING' => 'page=1',
      'HTTP_COOKIE' => '_fbp=fb.1.111.222',
      'REQUEST_SCHEME' => 'https',
      'REQUEST_URI' => '/v2/events?page=1'
    }
    result = RequestContextAdaptor.extract(env)
    assert_equal('api.example.com', result.host)
    assert_equal('https://referrer.com', result.referer)
    assert_equal('8.8.8.8', result.x_forwarded_for)
    assert_equal('10.0.0.1', result.remote_address)
    assert_equal({ 'page' => ['1'] }, result.query_params)
    assert_equal('fb.1.111.222', result.cookies['_fbp'])
    assert_equal('https', result.scheme)
    assert_equal('/v2/events?page=1', result.request_uri)
  end

  def test_empty_hash_returns_defaults_for_scheme_and_request_uri
    result = RequestContextAdaptor.extract({})
    assert_nil(result.scheme)
    assert_nil(result.request_uri)
  end
end
