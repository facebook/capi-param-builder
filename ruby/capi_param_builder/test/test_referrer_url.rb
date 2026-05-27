# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

require 'minitest/autorun'
require_relative '../lib/capi_param_builder'
require 'test_etld_plus_one_resolver'

ORIGINAL_VERSION_TRU = ReleaseConfig::VERSION
ReleaseConfig.send(:remove_const, :VERSION)
ReleaseConfig::VERSION = "1.0.1"
Minitest.after_run do
  ReleaseConfig.send(:remove_const, :VERSION)
  ReleaseConfig::VERSION = ORIGINAL_VERSION_TRU
end

# Computed once after the version override so the suffix reflects v1.0.1.
# A probe builder reads the actual appendix values produced by the SDK.
_probe_tru = ParamBuilder.new
NO_CHANGE_SUFFIX_TRU = "." + _probe_tru.instance_variable_get(:@appendix_no_change)
NET_NEW_SUFFIX_TRU = "." + _probe_tru.instance_variable_get(:@appendix_net_new)

class FakeRackRequest
  attr_reader :env
  def initialize(env)
    @env = env
  end
end


# =============================================================================
# Referrer stored before fbclid extraction
# =============================================================================
class TestReferrerPreservedBeforeFbclidExtraction < Minitest::Test
  def test_referrer_url_preserved_when_fbclid_in_referer
    builder = ParamBuilder.new
    referer = "https://facebook.com/ad?fbclid=IwAR_click123&utm=campaign"
    builder.process_request("example.com", {}, {}, referer)

    assert_equal(referer + NO_CHANGE_SUFFIX_TRU, builder.get_referrer_url)
  end

  def test_referrer_url_preserved_when_fbclid_in_both_query_and_referer
    builder = ParamBuilder.new
    referer = "https://facebook.com/ad?fbclid=fromReferer"
    builder.process_request(
      "example.com", { "fbclid" => "fromQuery" }, {}, referer
    )

    assert_equal(referer + NO_CHANGE_SUFFIX_TRU, builder.get_referrer_url)
  end

  def test_referrer_url_not_mutated_by_fbclid_extraction
    builder = ParamBuilder.new
    referer = "https://landing.example.com/page?fbclid=abc123&foo=bar"
    original_referer = referer.dup
    builder.process_request("example.com", {}, {}, referer)

    assert_equal(original_referer + NO_CHANGE_SUFFIX_TRU, builder.get_referrer_url)
    refute_nil(builder.get_fbc)
  end
end


# =============================================================================
# get_referrer_url returns nil when no referer
# =============================================================================
class TestReferrerUrlNil < Minitest::Test
  def test_returns_nil_when_referer_not_provided
    builder = ParamBuilder.new
    builder.process_request("example.com", { "fbclid" => "test" }, {})

    assert_nil(builder.get_referrer_url)
  end

  def test_returns_nil_when_referer_is_nil
    builder = ParamBuilder.new
    builder.process_request("example.com", {}, {}, nil)

    assert_nil(builder.get_referrer_url)
  end

  def test_returns_nil_before_any_processing
    builder = ParamBuilder.new

    assert_nil(builder.get_referrer_url)
  end
end


# =============================================================================
# get_referrer_url via process_request with all params
# =============================================================================
class TestReferrerUrlViaProcessRequest < Minitest::Test
  def test_referer_stored_with_all_params
    builder = ParamBuilder.new
    referer = "https://referrer.example.com/landing"
    builder.process_request(
      "shop.example.com",
      { "fbclid" => "click1", "utm" => "campaign" },
      { "_fbc" => "fb.1.100.oldPayload", "_fbp" => "fb.1.200.oldFbp" },
      referer
    )

    assert_equal(referer + NO_CHANGE_SUFFIX_TRU, builder.get_referrer_url)
  end

  def test_referer_stored_with_empty_query_and_cookies
    builder = ParamBuilder.new
    referer = "https://example.com/page"
    builder.process_request("example.com", {}, {}, referer)

    assert_equal(referer + NO_CHANGE_SUFFIX_TRU, builder.get_referrer_url)
  end

  def test_referer_stored_with_no_scheme
    builder = ParamBuilder.new
    referer = "example.com/some-page?param=value"
    builder.process_request("example.com", {}, {}, referer)

    assert_equal(referer + NO_CHANGE_SUFFIX_TRU, builder.get_referrer_url)
  end
end


# =============================================================================
# get_referrer_url via process_request_from_context
# =============================================================================
class TestReferrerUrlViaProcessRequestFromContext < Minitest::Test
  def test_plain_data_object_with_referer
    builder = ParamBuilder.new
    referer = "https://facebook.com/ad?utm=test"
    data = PlainDataObject.new(
      "example.com", { "fbclid" => "ctx1" }, {}, referer, nil, nil
    )

    builder.process_request_from_context(data)

    assert_equal(referer + NO_CHANGE_SUFFIX_TRU, builder.get_referrer_url)
  end

  def test_plain_data_object_without_referer
    builder = ParamBuilder.new
    data = PlainDataObject.new("example.com", {}, {}, nil, nil, nil)

    builder.process_request_from_context(data)

    assert_nil(builder.get_referrer_url)
  end

  def test_rack_env_hash_with_referer
    builder = ParamBuilder.new
    env = {
      "HTTP_HOST" => "shop.example.com",
      "QUERY_STRING" => "fbclid=rackRef",
      "HTTP_REFERER" => "https://facebook.com/ad?ref=rack"
    }

    builder.process_request_from_context(env)

    assert_equal(
      "https://facebook.com/ad?ref=rack" + NO_CHANGE_SUFFIX_TRU,
      builder.get_referrer_url
    )
  end

  def test_rack_env_hash_without_referer
    builder = ParamBuilder.new
    env = {
      "HTTP_HOST" => "example.com",
      "QUERY_STRING" => "fbclid=noRef"
    }

    builder.process_request_from_context(env)

    assert_nil(builder.get_referrer_url)
  end

  def test_rack_request_object_with_referer
    builder = ParamBuilder.new
    request = FakeRackRequest.new(
      "HTTP_HOST" => "rack-app.com",
      "QUERY_STRING" => "fbclid=rackObj",
      "HTTP_REFERER" => "https://source.example.com/link"
    )

    builder.process_request_from_context(request)

    assert_equal(
      "https://source.example.com/link" + NO_CHANGE_SUFFIX_TRU,
      builder.get_referrer_url
    )
  end
end


# =============================================================================
# Reset between consecutive calls
# =============================================================================
class TestReferrerUrlResetBetweenCalls < Minitest::Test
  def test_referrer_resets_to_nil_on_second_call
    builder = ParamBuilder.new
    builder.process_request(
      "example.com", {}, {}, "https://first-referer.com/page"
    )
    assert_equal(
      "https://first-referer.com/page" + NO_CHANGE_SUFFIX_TRU,
      builder.get_referrer_url
    )

    builder.process_request("example.com", {}, {}, nil)
    assert_nil(builder.get_referrer_url)
  end

  def test_referrer_updates_on_second_call
    builder = ParamBuilder.new
    builder.process_request(
      "example.com", {}, {}, "https://first.com"
    )
    assert_equal(
      "https://first.com" + NO_CHANGE_SUFFIX_TRU, builder.get_referrer_url
    )

    builder.process_request(
      "other.example.com", {}, {}, "https://second.com"
    )
    assert_equal(
      "https://second.com" + NO_CHANGE_SUFFIX_TRU, builder.get_referrer_url
    )
  end

  def test_referrer_resets_via_process_request_from_context
    builder = ParamBuilder.new
    data_with = PlainDataObject.new(
      "example.com", {}, {}, "https://has-referer.com", nil, nil
    )
    builder.process_request_from_context(data_with)
    assert_equal(
      "https://has-referer.com" + NO_CHANGE_SUFFIX_TRU,
      builder.get_referrer_url
    )

    data_without = PlainDataObject.new("example.com", {}, {}, nil, nil, nil)
    builder.process_request_from_context(data_without)
    assert_nil(builder.get_referrer_url)
  end
end


# =============================================================================
# nil vs empty string
# =============================================================================
class TestReferrerUrlNilVsEmptyString < Minitest::Test
  def test_nil_referer_returns_nil
    builder = ParamBuilder.new
    builder.process_request("example.com", {}, {}, nil)

    assert_nil(builder.get_referrer_url)
  end

  def test_empty_string_referer_returns_empty_string
    builder = ParamBuilder.new
    builder.process_request("example.com", {}, {}, "")

    assert_equal("", builder.get_referrer_url)
  end

  def test_nil_and_empty_string_are_distinct
    builder = ParamBuilder.new

    builder.process_request("example.com", {}, {}, nil)
    nil_result = builder.get_referrer_url

    builder.process_request("example.com", {}, {}, "")
    empty_result = builder.get_referrer_url

    assert_nil(nil_result)
    assert_equal("", empty_result)
    refute_equal(nil_result, empty_result)
  end
end
