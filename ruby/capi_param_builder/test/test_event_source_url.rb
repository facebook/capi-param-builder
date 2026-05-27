# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

require 'minitest/autorun'
require_relative '../lib/capi_param_builder'
require 'test_etld_plus_one_resolver'

ORIGINAL_VERSION_TESU = ReleaseConfig::VERSION
ReleaseConfig.send(:remove_const, :VERSION)
ReleaseConfig::VERSION = "1.0.1"
Minitest.after_run do
  ReleaseConfig.send(:remove_const, :VERSION)
  ReleaseConfig::VERSION = ORIGINAL_VERSION_TESU
end

# Computed once after the version override so the suffix reflects v1.0.1.
_probe_tesu = ParamBuilder.new
NO_CHANGE_SUFFIX_TESU = "." + _probe_tesu.instance_variable_get(:@appendix_no_change)
NET_NEW_SUFFIX_TESU = "." + _probe_tesu.instance_variable_get(:@appendix_net_new)

class FakeRackRequest
  attr_reader :env
  def initialize(env)
    @env = env
  end
end


# =============================================================================
# construct_event_source_url scheme variants
# =============================================================================
class TestEventSourceUrlSchemeVariants < Minitest::Test
  def test_https_scheme_with_host_and_uri
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", {}, {}, nil, nil, nil, "https", "/path/to/page"
    )
    builder.process_request_from_context(data)

    assert_equal(
      "https://example.com/path/to/page" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )
  end

  def test_http_scheme_with_host_and_uri
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", {}, {}, nil, nil, nil, "http", "/landing"
    )
    builder.process_request_from_context(data)

    assert_equal(
      "http://example.com/landing" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )
  end

  def test_nil_scheme_returns_nil
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", {}, {}, nil, nil, nil, nil, "/some/path"
    )
    builder.process_request_from_context(data)

    assert_nil(builder.get_event_source_url)
  end

  def test_empty_scheme_returns_nil
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", {}, {}, nil, nil, nil, "", "/some/path"
    )
    builder.process_request_from_context(data)

    assert_nil(builder.get_event_source_url)
  end
end


# =============================================================================
# Nil host returns nil
# =============================================================================
class TestEventSourceUrlNilHost < Minitest::Test
  def test_nil_host_returns_nil
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      nil, {}, {}, nil, nil, nil, "https", "/path"
    )
    builder.process_request_from_context(data)

    assert_nil(builder.get_event_source_url)
  end

  def test_empty_host_returns_nil
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "", {}, {}, nil, nil, nil, "https", "/path"
    )
    builder.process_request_from_context(data)

    assert_nil(builder.get_event_source_url)
  end
end


# =============================================================================
# All nil returns nil
# =============================================================================
class TestEventSourceUrlAllNil < Minitest::Test
  def test_all_nil_returns_nil
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      nil, {}, {}, nil, nil, nil, nil, nil
    )
    builder.process_request_from_context(data)

    assert_nil(builder.get_event_source_url)
  end

  def test_returns_nil_before_any_processing
    builder = ParamBuilder.new

    assert_nil(builder.get_event_source_url)
  end
end


# =============================================================================
# Host with port preserved
# =============================================================================
class TestEventSourceUrlHostWithPort < Minitest::Test
  def test_host_with_port_preserved
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com:8080", {}, {}, nil, nil, nil, "https", "/app"
    )
    builder.process_request_from_context(data)

    assert_equal(
      "https://example.com:8080/app" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )
  end

  def test_host_with_port_no_uri
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "localhost:3000", {}, {}, nil, nil, nil, "http", nil
    )
    builder.process_request_from_context(data)

    assert_equal(
      "http://localhost:3000" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )
  end
end


# =============================================================================
# Query string preserved
# =============================================================================
class TestEventSourceUrlQueryString < Minitest::Test
  def test_query_string_in_request_uri_preserved
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "shop.example.com", {}, {}, nil, nil, nil,
      "https", "/products?category=shoes&page=2"
    )
    builder.process_request_from_context(data)

    assert_equal(
      "https://shop.example.com/products?category=shoes&page=2" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )
  end

  def test_uri_without_query_string
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", {}, {}, nil, nil, nil, "https", "/clean-path"
    )
    builder.process_request_from_context(data)

    assert_equal(
      "https://example.com/clean-path" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )
  end
end


# =============================================================================
# process_request sets event_source_url to nil
# =============================================================================
class TestEventSourceUrlViaProcessRequest < Minitest::Test
  def test_process_request_returns_nil_for_event_source_url
    builder = ParamBuilder.new
    builder.process_request("example.com", { "fbclid" => "test" }, {})

    assert_nil(builder.get_event_source_url)
  end

  def test_process_request_with_referer_still_returns_nil
    builder = ParamBuilder.new
    builder.process_request(
      "example.com", {}, {}, "https://facebook.com/ad"
    )

    assert_nil(builder.get_event_source_url)
  end
end


# =============================================================================
# process_request_from_context sets event_source_url
# =============================================================================
class TestEventSourceUrlViaProcessRequestFromContext < Minitest::Test
  def test_plain_data_object_sets_event_source_url
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", { "fbclid" => "ctx1" }, {}, nil, nil, nil,
      "https", "/checkout"
    )
    builder.process_request_from_context(data)

    assert_equal(
      "https://example.com/checkout" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )
  end

  def test_plain_data_object_without_uri
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", {}, {}, nil, nil, nil, "https", nil
    )
    builder.process_request_from_context(data)

    assert_equal(
      "https://example.com" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )
  end

  def test_rack_env_hash_sets_event_source_url
    builder = ParamBuilder.new
    env = {
      "HTTP_HOST" => "shop.example.com",
      "QUERY_STRING" => "fbclid=abc123",
      "REQUEST_SCHEME" => "https",
      "REQUEST_URI" => "/products?fbclid=abc123"
    }
    builder.process_request_from_context(env)

    assert_equal(
      "https://shop.example.com/products?fbclid=abc123" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )
  end

  def test_rack_env_hash_without_scheme_returns_nil
    builder = ParamBuilder.new
    env = {
      "HTTP_HOST" => "example.com",
      "QUERY_STRING" => "",
      "PATH_INFO" => "/page"
    }
    builder.process_request_from_context(env)

    assert_nil(builder.get_event_source_url)
  end

  def test_rack_request_object_sets_event_source_url
    builder = ParamBuilder.new
    request = FakeRackRequest.new(
      "HTTP_HOST" => "rack-app.com",
      "QUERY_STRING" => "",
      "REQUEST_SCHEME" => "https",
      "REQUEST_URI" => "/dashboard"
    )
    builder.process_request_from_context(request)

    assert_equal(
      "https://rack-app.com/dashboard" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )
  end
end


# =============================================================================
# Reset between consecutive calls
# =============================================================================
class TestEventSourceUrlResetBetweenCalls < Minitest::Test
  def test_event_source_url_resets_to_nil_when_scheme_missing
    builder = ParamBuilder.new
    data_with = PlainDataObject.new(
      "example.com", {}, {}, nil, nil, nil, "https", "/first"
    )
    builder.process_request_from_context(data_with)
    assert_equal(
      "https://example.com/first" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )

    data_without = PlainDataObject.new(
      "example.com", {}, {}, nil, nil, nil, nil, "/second"
    )
    builder.process_request_from_context(data_without)
    assert_nil(builder.get_event_source_url)
  end

  def test_event_source_url_updates_on_second_call
    builder = ParamBuilder.new
    data1 = PlainDataObject.new(
      "first.com", {}, {}, nil, nil, nil, "https", "/a"
    )
    builder.process_request_from_context(data1)
    assert_equal(
      "https://first.com/a" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )

    data2 = PlainDataObject.new(
      "second.com", {}, {}, nil, nil, nil, "http", "/b"
    )
    builder.process_request_from_context(data2)
    assert_equal(
      "http://second.com/b" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )
  end

  def test_event_source_url_resets_when_process_request_called
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", {}, {}, nil, nil, nil, "https", "/page"
    )
    builder.process_request_from_context(data)
    assert_equal(
      "https://example.com/page" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )

    builder.process_request("example.com", {}, {})
    assert_nil(builder.get_event_source_url)
  end
end


# =============================================================================
# Independence from referrer_url
# =============================================================================
class TestEventSourceUrlIndependentFromReferrer < Minitest::Test
  def test_event_source_url_set_regardless_of_referer
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", {}, {}, "https://facebook.com/ad", nil, nil,
      "https", "/landing"
    )
    builder.process_request_from_context(data)

    assert_equal(
      "https://example.com/landing" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )
    assert_equal(
      "https://facebook.com/ad" + NO_CHANGE_SUFFIX_TESU,
      builder.get_referrer_url
    )
  end

  def test_event_source_url_nil_does_not_affect_referer
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      nil, {}, {}, "https://facebook.com/ad", nil, nil, "https", "/path"
    )
    builder.process_request_from_context(data)

    assert_nil(builder.get_event_source_url)
    assert_equal(
      "https://facebook.com/ad" + NO_CHANGE_SUFFIX_TESU,
      builder.get_referrer_url
    )
  end

  def test_referer_nil_does_not_affect_event_source_url
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", {}, {}, nil, nil, nil, "https", "/page"
    )
    builder.process_request_from_context(data)

    assert_equal(
      "https://example.com/page" + NET_NEW_SUFFIX_TESU,
      builder.get_event_source_url
    )
    assert_nil(builder.get_referrer_url)
  end
end
