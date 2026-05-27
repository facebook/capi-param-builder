# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

require 'minitest/autorun'
require_relative '../lib/capi_param_builder'

# Covers the appendix-appending transformation applied to:
#   - referrer_url      (suffix: '.' + appendix_no_change)
#   - event_source_url  (suffix: '.' + appendix_net_new)
#
# The appendix string is dynamic (derived from SDK version), so we compute the
# expected suffix via a probe ParamBuilder instance rather than hard-coding it.

ORIGINAL_VERSION_TUA = ReleaseConfig::VERSION
ReleaseConfig.send(:remove_const, :VERSION)
ReleaseConfig::VERSION = "1.0.1"
Minitest.after_run do
  ReleaseConfig.send(:remove_const, :VERSION)
  ReleaseConfig::VERSION = ORIGINAL_VERSION_TUA
end

_probe_tua = ParamBuilder.new
NO_CHANGE_SUFFIX_TUA = "." + _probe_tua.instance_variable_get(:@appendix_no_change)
NET_NEW_SUFFIX_TUA = "." + _probe_tua.instance_variable_get(:@appendix_net_new)


# =============================================================================
# referrer_url: appends APPENDIX_NO_CHANGE
# =============================================================================
class TestReferrerUrlAppendixApplied < Minitest::Test
  def test_via_process_request
    builder = ParamBuilder.new
    referer = "https://facebook.com/ad"
    builder.process_request("example.com", {}, {}, referer)

    assert_equal(referer + NO_CHANGE_SUFFIX_TUA, builder.get_referrer_url)
  end

  def test_via_process_request_from_context
    builder = ParamBuilder.new
    referer = "https://google.com/search?q=shoes"
    data = PlainDataObject.new(
      "shop.example.com", {}, {}, referer, nil, nil
    )
    builder.process_request_from_context(data)

    assert_equal(referer + NO_CHANGE_SUFFIX_TUA, builder.get_referrer_url)
  end

  def test_with_complex_url
    builder = ParamBuilder.new
    referer = "https://app.example.com/search?q=test&page=3#results"
    builder.process_request("example.com", {}, {}, referer)

    assert_equal(referer + NO_CHANGE_SUFFIX_TUA, builder.get_referrer_url)
  end
end


# =============================================================================
# referrer_url: skips appendix for nil / empty
# =============================================================================
class TestReferrerUrlSkipsAppendix < Minitest::Test
  def test_nil_referer
    builder = ParamBuilder.new
    builder.process_request("example.com", {}, {}, nil)

    assert_nil(builder.get_referrer_url)
  end

  def test_empty_string_referer
    builder = ParamBuilder.new
    builder.process_request("example.com", {}, {}, "")

    assert_equal("", builder.get_referrer_url)
  end

  def test_nil_via_context
    builder = ParamBuilder.new
    data = PlainDataObject.new("example.com", {}, {}, nil, nil, nil)
    builder.process_request_from_context(data)

    assert_nil(builder.get_referrer_url)
  end
end


# =============================================================================
# referrer_url idempotency: each process_request reassigns from input,
# so the appendix is applied at most once per call.
# =============================================================================
class TestReferrerUrlIdempotency < Minitest::Test
  def test_consecutive_calls_with_same_input_do_not_double_append
    builder = ParamBuilder.new
    referer = "https://example.com/page"

    builder.process_request("example.com", {}, {}, referer)
    first = builder.get_referrer_url

    builder.process_request("example.com", {}, {}, referer)
    second = builder.get_referrer_url

    assert_equal(first, second)
    assert_equal(referer + NO_CHANGE_SUFFIX_TUA, second)
    assert_equal(1, second.scan(NO_CHANGE_SUFFIX_TUA).count)
  end

  def test_value_changes_between_calls
    builder = ParamBuilder.new

    builder.process_request("example.com", {}, {}, "https://first.com")
    assert_equal(
      "https://first.com" + NO_CHANGE_SUFFIX_TUA, builder.get_referrer_url
    )

    builder.process_request("example.com", {}, {}, "https://second.com")
    assert_equal(
      "https://second.com" + NO_CHANGE_SUFFIX_TUA, builder.get_referrer_url
    )
  end

  def test_cleared_then_set
    builder = ParamBuilder.new

    builder.process_request("example.com", {}, {}, "https://first.com")
    assert_equal(
      "https://first.com" + NO_CHANGE_SUFFIX_TUA, builder.get_referrer_url
    )

    builder.process_request("example.com", {}, {}, nil)
    assert_nil(builder.get_referrer_url)

    builder.process_request("example.com", {}, {}, "https://third.com")
    assert_equal(
      "https://third.com" + NO_CHANGE_SUFFIX_TUA, builder.get_referrer_url
    )
  end
end


# =============================================================================
# event_source_url: appends APPENDIX_NET_NEW
# =============================================================================
class TestEventSourceUrlAppendixApplied < Minitest::Test
  def test_with_path
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "shop.example.com", {}, {}, nil, nil, nil, "https", "/products"
    )
    builder.process_request_from_context(data)

    assert_equal(
      "https://shop.example.com/products" + NET_NEW_SUFFIX_TUA,
      builder.get_event_source_url
    )
  end

  def test_with_query_and_fragment
    # Locks in current behavior: the appendix is concatenated at the absolute
    # end, AFTER the fragment, producing an invalid URL fragment.
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "www.myshop.com", {}, {}, nil, nil, nil,
      "https", "/landing?utm=fb&campaign=summer#section"
    )
    builder.process_request_from_context(data)

    assert_equal(
      "https://www.myshop.com/landing?utm=fb&campaign=summer#section" + NET_NEW_SUFFIX_TUA,
      builder.get_event_source_url
    )
  end

  def test_host_only
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", {}, {}, nil, nil, nil, "http", nil
    )
    builder.process_request_from_context(data)

    assert_equal(
      "http://example.com" + NET_NEW_SUFFIX_TUA,
      builder.get_event_source_url
    )
  end
end


# =============================================================================
# event_source_url: skips appendix when construct_event_source_url returns nil
# =============================================================================
class TestEventSourceUrlNil < Minitest::Test
  def test_nil_when_host_empty
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "", {}, {}, nil, nil, nil, "https", "/products"
    )
    builder.process_request_from_context(data)

    assert_nil(builder.get_event_source_url)
  end

  def test_nil_when_scheme_nil
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", {}, {}, nil, nil, nil, nil, "/products"
    )
    builder.process_request_from_context(data)

    assert_nil(builder.get_event_source_url)
  end

  def test_nil_when_scheme_empty
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", {}, {}, nil, nil, nil, "", "/products"
    )
    builder.process_request_from_context(data)

    assert_nil(builder.get_event_source_url)
  end

  def test_nil_when_process_request_used_directly
    # process_request() resets event_source_url = nil at the top and does not
    # call construct_event_source_url.
    builder = ParamBuilder.new
    builder.process_request("example.com", {}, {}, "https://r.com")

    assert_nil(builder.get_event_source_url)
  end
end


# =============================================================================
# event_source_url idempotency
# =============================================================================
class TestEventSourceUrlIdempotency < Minitest::Test
  def test_consecutive_calls_with_same_input_do_not_double_append
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "shop.example.com", {}, {}, nil, nil, nil, "https", "/products"
    )

    builder.process_request_from_context(data)
    first = builder.get_event_source_url

    builder.process_request_from_context(data)
    second = builder.get_event_source_url

    assert_equal(first, second)
    assert_equal(
      "https://shop.example.com/products" + NET_NEW_SUFFIX_TUA, second
    )
    assert_equal(1, second.scan(NET_NEW_SUFFIX_TUA).count)
  end

  def test_cleared_then_set
    builder = ParamBuilder.new

    data1 = PlainDataObject.new(
      "shop.example.com", {}, {}, nil, nil, nil, "https", "/products"
    )
    builder.process_request_from_context(data1)
    assert_equal(
      "https://shop.example.com/products" + NET_NEW_SUFFIX_TUA,
      builder.get_event_source_url
    )

    data2 = PlainDataObject.new(
      "shop.example.com", {}, {}, nil, nil, nil, nil, "/products"
    )
    builder.process_request_from_context(data2)
    assert_nil(builder.get_event_source_url)
  end
end


# =============================================================================
# Cross-field: referrer and event_source_url use different appendix tokens
# =============================================================================
class TestCrossFieldAppendixTokensDiffer < Minitest::Test
  def test_referrer_uses_no_change_event_source_uses_net_new
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "shop.example.com", {}, {},
      "https://facebook.com/ad", nil, nil,
      "https", "/checkout"
    )
    builder.process_request_from_context(data)

    assert_equal(
      "https://facebook.com/ad" + NO_CHANGE_SUFFIX_TUA,
      builder.get_referrer_url
    )
    assert_equal(
      "https://shop.example.com/checkout" + NET_NEW_SUFFIX_TUA,
      builder.get_event_source_url
    )
    # Sanity: the two suffixes differ because the type byte differs.
    refute_equal(NO_CHANGE_SUFFIX_TUA, NET_NEW_SUFFIX_TUA)
  end
end


# =============================================================================
# Documentation tests: feeding output back as input DOUBLE-APPENDS.
#
# The SDK has no dedup logic. These tests lock in the current behavior so a
# future refactor that adds dedup will trigger an explicit decision.
# =============================================================================
class TestDoubleAppendDocumentation < Minitest::Test
  def test_referrer_doubles_when_output_fed_back
    builder = ParamBuilder.new
    referer = "https://example.com/page"

    builder.process_request("example.com", {}, {}, referer)
    first = builder.get_referrer_url
    assert_equal(referer + NO_CHANGE_SUFFIX_TUA, first)

    builder.process_request("example.com", {}, {}, first)
    second = builder.get_referrer_url

    assert_equal(
      referer + NO_CHANGE_SUFFIX_TUA + NO_CHANGE_SUFFIX_TUA, second
    )
    assert_equal(2, second.scan(NO_CHANGE_SUFFIX_TUA).count)
  end

  def test_event_source_doubles_when_request_uri_fed_back
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "shop.example.com", {}, {}, nil, nil, nil, "https", "/products"
    )
    builder.process_request_from_context(data)
    first = builder.get_event_source_url
    assert_equal(
      "https://shop.example.com/products" + NET_NEW_SUFFIX_TUA, first
    )

    contaminated = PlainDataObject.new(
      "shop.example.com", {}, {}, nil, nil, nil,
      "https", "/products" + NET_NEW_SUFFIX_TUA
    )
    builder.process_request_from_context(contaminated)
    second = builder.get_event_source_url

    assert_equal(
      "https://shop.example.com/products" + NET_NEW_SUFFIX_TUA + NET_NEW_SUFFIX_TUA,
      second
    )
    assert_equal(2, second.scan(NET_NEW_SUFFIX_TUA).count)
  end
end
