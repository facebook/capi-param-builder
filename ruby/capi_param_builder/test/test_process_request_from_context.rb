# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

require 'minitest/autorun'
require_relative '../lib/capi_param_builder'
require 'test_etld_plus_one_resolver'

# Pin appendix output to known constants for the whole test file.
APPENDIX_NET_NEW_V1_0_1 = "AQUCAQAB"
APPENDIX_MODIFIED_NEW_V1_0_1 = "AQUDAQAB"
APPENDIX_NO_CHANGE_V1_0_1 = "AQUAAQAB"

ORIGINAL_VERSION_PRFC = ReleaseConfig::VERSION
ReleaseConfig.send(:remove_const, :VERSION)
ReleaseConfig::VERSION = "1.0.1"
Minitest.after_run do
  ReleaseConfig.send(:remove_const, :VERSION)
  ReleaseConfig::VERSION = ORIGINAL_VERSION_PRFC
end

class FakeRackRequest
  attr_reader :env
  def initialize(env)
    @env = env
  end
end

def cookie_by_name(cookies, name)
  cookies.find { |c| c.name == name }
end


# =============================================================================
# PlainDataObject Input
# =============================================================================
class TestPlainDataObjectInput < Minitest::Test
  def test_basic_plain_data_object_with_fbclid
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com", { "fbclid" => "test123" }, {}, nil, nil, nil
    )

    result = builder.process_request_from_context(data)

    assert_equal(2, result.size)
    fbc = cookie_by_name(result, "_fbc")
    refute_nil(fbc)
    assert(fbc.value.end_with?(".test123.#{APPENDIX_NET_NEW_V1_0_1}"))
    refute_nil(builder.get_fbp)
  end

  def test_existing_cookies_appends_no_change_token
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com",
      {},
      { "_fbc" => "fb.1.123456.abc", "_fbp" => "fb.1.123456.7890" },
      nil, nil, nil
    )

    builder.process_request_from_context(data)

    assert_equal("fb.1.123456.abc.#{APPENDIX_NO_CHANGE_V1_0_1}", builder.get_fbc)
    assert_equal("fb.1.123456.7890.#{APPENDIX_NO_CHANGE_V1_0_1}", builder.get_fbp)
  end

  def test_no_fbclid_still_generates_fbp
    builder = ParamBuilder.new
    data = PlainDataObject.new("example.com", {}, {}, nil, nil, nil)

    result = builder.process_request_from_context(data)

    assert_equal(1, result.size)
    fbp = cookie_by_name(result, "_fbp")
    refute_nil(fbp)
    assert(fbp.value.end_with?(".#{APPENDIX_NET_NEW_V1_0_1}"))
    assert_nil(builder.get_fbc)
  end

  def test_referer_fallback_when_query_empty
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "landing.example.com",
      {},
      {},
      "https://facebook.com/ad?fbclid=IwAR_fromReferer",
      nil, nil
    )

    builder.process_request_from_context(data)

    refute_nil(builder.get_fbc)
    assert(builder.get_fbc.end_with?(".IwAR_fromReferer.#{APPENDIX_NET_NEW_V1_0_1}"))
  end

  def test_query_takes_precedence_over_referer
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com",
      { "fbclid" => "fromQuery" },
      {},
      "https://facebook.com/ad?fbclid=fromReferer",
      nil, nil
    )

    builder.process_request_from_context(data)

    assert(builder.get_fbc.end_with?(".fromQuery.#{APPENDIX_NET_NEW_V1_0_1}"))
  end

  def test_ignores_unused_ip_fields
    # x_forwarded_for and remote_address are extracted by the adapter but
    # the current Ruby ParamBuilder doesn't yet consume them; this test
    # just confirms passing them does not break processing.
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com",
      { "fbclid" => "ipTest" },
      {},
      nil,
      "203.0.113.50, 10.0.0.1",
      "10.0.0.1"
    )

    result = builder.process_request_from_context(data)

    assert_equal(2, result.size)
    assert(builder.get_fbc.end_with?(".ipTest.#{APPENDIX_NET_NEW_V1_0_1}"))
  end
end


# =============================================================================
# Rack-style Env Input
# =============================================================================
class TestRackEnvInput < Minitest::Test
  def test_raw_rack_env_dict
    builder = ParamBuilder.new
    env = {
      "HTTP_HOST" => "api.example.com",
      "REMOTE_ADDR" => "192.168.1.100",
      "QUERY_STRING" => "fbclid=fromQS"
    }

    result = builder.process_request_from_context(env)

    assert_equal(2, result.size)
    assert(builder.get_fbc.end_with?(".fromQS.#{APPENDIX_NET_NEW_V1_0_1}"))
  end

  def test_rack_env_cookie_header_parsed
    builder = ParamBuilder.new
    env = {
      "HTTP_HOST" => "example.com",
      "HTTP_COOKIE" => "_fbc=fb.1.123.abc; _fbp=fb.1.456.7890"
    }

    builder.process_request_from_context(env)

    assert_equal("fb.1.123.abc.#{APPENDIX_NO_CHANGE_V1_0_1}", builder.get_fbc)
    assert_equal("fb.1.456.7890.#{APPENDIX_NO_CHANGE_V1_0_1}", builder.get_fbp)
  end

  def test_rack_env_referer_used_when_query_empty
    builder = ParamBuilder.new
    env = {
      "HTTP_HOST" => "landing.example.com",
      "HTTP_REFERER" => "https://facebook.com/ad?fbclid=IwAR_referer"
    }

    builder.process_request_from_context(env)

    assert(builder.get_fbc.end_with?(".IwAR_referer.#{APPENDIX_NET_NEW_V1_0_1}"))
  end

  def test_rack_request_object_with_env_method
    builder = ParamBuilder.new
    request = FakeRackRequest.new(
      "HTTP_HOST" => "rack-app.com",
      "QUERY_STRING" => "fbclid=rackTest",
      "HTTP_COOKIE" => "_fbp=fb.1.999.existingFbp"
    )

    builder.process_request_from_context(request)

    assert(builder.get_fbc.end_with?(".rackTest.#{APPENDIX_NET_NEW_V1_0_1}"))
    assert_equal("fb.1.999.existingFbp.#{APPENDIX_NO_CHANGE_V1_0_1}", builder.get_fbp)
  end
end


# =============================================================================
# Empty Input
# =============================================================================
class TestEmptyInput < Minitest::Test
  def test_nil_context_returns_only_fbp_with_empty_host
    # No context -> adapter returns defaults (host=""); fbp is generated
    # with subdomain index 0 (NOT -1) and a nil cookie domain.
    builder = ParamBuilder.new

    result = builder.process_request_from_context(nil)

    assert_nil(builder.get_fbc)
    assert_equal(1, result.size)
    fbp = cookie_by_name(result, "_fbp")
    refute_nil(fbp)
    assert(
      fbp.value.start_with?("fb.0."),
      "expected fbp to start with fb.0., got #{fbp.value}"
    )
    assert(fbp.value.end_with?(".#{APPENDIX_NET_NEW_V1_0_1}"))
    assert_nil(fbp.domain)
  end

  def test_empty_hash_context_returns_only_fbp
    builder = ParamBuilder.new

    result = builder.process_request_from_context({})

    assert_nil(builder.get_fbc)
    assert_equal(1, result.size)
    fbp = cookie_by_name(result, "_fbp")
    assert(fbp.value.start_with?("fb.0."))
  end
end


# =============================================================================
# Equivalence with process_request
# =============================================================================
class TestEquivalenceWithProcessRequest < Minitest::Test
  def test_plain_data_object_equivalent_to_process_request
    host = "shop.example.com"
    queries = { "fbclid" => "equivalenceTest" }
    cookies = {}
    referer = "https://facebook.com/ad"

    builder1 = ParamBuilder.new
    result1 = builder1.process_request(host, queries, cookies, referer)

    builder2 = ParamBuilder.new
    data = PlainDataObject.new(host, queries, cookies, referer, nil, nil)
    result2 = builder2.process_request_from_context(data)

    assert_equal(result1.size, result2.size)
    # Compare fbc and fbp payloads (ignoring timestamp at index 2 and the
    # random fbp payload at index 3, both of which legitimately differ).
    [
      [builder1.get_fbc, builder2.get_fbc, "fbc"],
      [builder1.get_fbp, builder2.get_fbp, "fbp"]
    ].each do |a, b, label|
      a_parts = a.split(".")
      b_parts = b.split(".")
      assert_equal(a_parts[0], b_parts[0], "#{label} prefix mismatch")
      assert_equal(a_parts[1], b_parts[1], "#{label} subdomain index mismatch")
      assert_equal(a_parts.last, b_parts.last, "#{label} appendix mismatch")
    end
    # fbc payload is deterministic from fbclid so should also match.
    assert_equal(builder1.get_fbc.split(".")[3], builder2.get_fbc.split(".")[3])
  end

  def test_existing_cookies_produce_equivalent_fbc_fbp
    host = "example.com"
    queries = {}
    cookies = {
      "_fbc" => "fb.1.123.existingPayload",
      "_fbp" => "fb.1.456.existingFbp"
    }

    builder1 = ParamBuilder.new
    builder1.process_request(host, queries, cookies)

    builder2 = ParamBuilder.new
    data = PlainDataObject.new(host, queries, cookies, nil, nil, nil)
    builder2.process_request_from_context(data)

    assert_equal(builder1.get_fbc, builder2.get_fbc)
    assert_equal(builder1.get_fbp, builder2.get_fbp)
  end
end


# =============================================================================
# Cookie Update Behavior
# =============================================================================
class TestCookieUpdateBehavior < Minitest::Test
  def test_updates_fbc_when_payload_changes
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com",
      { "fbclid" => "newPayload" },
      { "_fbc" => "fb.1.123.oldPayload" },
      nil, nil, nil
    )

    builder.process_request_from_context(data)

    assert(builder.get_fbc.end_with?(".newPayload.#{APPENDIX_MODIFIED_NEW_V1_0_1}"))
  end

  def test_preserves_fbc_when_payload_is_same
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com",
      { "fbclid" => "samePayload" },
      { "_fbc" => "fb.1.123.samePayload" },
      nil, nil, nil
    )

    builder.process_request_from_context(data)

    # Existing cookie gets the no-change token appended; payload not rewritten.
    assert_equal(
      "fb.1.123.samePayload.#{APPENDIX_NO_CHANGE_V1_0_1}", builder.get_fbc
    )
  end

  def test_preserves_existing_fbp
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com",
      {},
      { "_fbp" => "fb.1.999.existingFbp" },
      nil, nil, nil
    )

    builder.process_request_from_context(data)

    assert_equal(
      "fb.1.999.existingFbp.#{APPENDIX_NO_CHANGE_V1_0_1}", builder.get_fbp
    )
  end
end


# =============================================================================
# Domain Handling
# =============================================================================
class TestDomainHandling < Minitest::Test
  def test_domain_list_resolves_correct_etld_plus_one
    builder = ParamBuilder.new(["example.com", "test.com"])
    data = PlainDataObject.new(
      "shop.subdomain.test.com",
      { "fbclid" => "domainTest" },
      {},
      nil, nil, nil
    )

    result = builder.process_request_from_context(data)

    refute_empty(result)
    result.each { |cookie| assert_equal("test.com", cookie.domain) }
  end

  def test_custom_resolver_used
    builder = ParamBuilder.new(TestEtldPlusOneResolver.new)
    data = PlainDataObject.new(
      "balabala.test.example.co.uk",
      { "fbclid" => "resolverTest" },
      {},
      nil, nil, nil
    )

    result = builder.process_request_from_context(data)

    refute_empty(result)
    # TestEtldPlusOneResolver returns the host as-is.
    result.each do |cookie|
      assert_equal("balabala.test.example.co.uk", cookie.domain)
    end
  end

  def test_ipv4_host_with_port
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "127.0.0.1:8080", { "fbclid" => "ipv4Test" }, {}, nil, nil, nil
    )

    builder.process_request_from_context(data)

    assert(builder.get_fbc.end_with?(".ipv4Test.#{APPENDIX_NET_NEW_V1_0_1}"))
  end

  def test_ipv6_host_bracketed_with_port
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "[::1]:8080", { "fbclid" => "ipv6Test" }, {}, nil, nil, nil
    )

    builder.process_request_from_context(data)

    assert(builder.get_fbc.end_with?(".ipv6Test.#{APPENDIX_NET_NEW_V1_0_1}"))
  end
end


# =============================================================================
# Edge Cases
# =============================================================================
class TestEdgeCases < Minitest::Test
  def test_invalid_cookie_format_is_rejected
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com",
      {},
      {
        "_fbc" => "invalid.format.with.too.many.parts.here",
        "_fbp" => "also.invalid.format.too.many"
      },
      nil, nil, nil
    )

    builder.process_request_from_context(data)

    assert_nil(builder.get_fbc)
    refute_nil(builder.get_fbp)
    assert(builder.get_fbp.end_with?(".#{APPENDIX_NET_NEW_V1_0_1}"))
  end

  def test_cookie_with_invalid_language_token_is_rejected
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com",
      {},
      {
        "_fbc" => "fb.1.123.abc.INVALID",
        "_fbp" => "fb.1.456.7890.INVALID"
      },
      nil, nil, nil
    )

    builder.process_request_from_context(data)

    assert_nil(builder.get_fbc)
    assert(builder.get_fbp.end_with?(".#{APPENDIX_NET_NEW_V1_0_1}"))
  end

  def test_cookie_with_valid_language_token_is_preserved
    builder = ParamBuilder.new
    # "BQ" is the original Ruby language token in SUPPORTED_LANGUAGE_TOKENS.
    data = PlainDataObject.new(
      "example.com",
      {},
      {
        "_fbc" => "fb.1.123.abc.BQ",
        "_fbp" => "fb.1.456.7890.BQ"
      },
      nil, nil, nil
    )

    builder.process_request_from_context(data)

    assert_equal("fb.1.123.abc.BQ", builder.get_fbc)
    assert_equal("fb.1.456.7890.BQ", builder.get_fbp)
  end

  def test_get_cookies_to_set_matches_return_value
    builder = ParamBuilder.new
    data = PlainDataObject.new(
      "example.com",
      { "fbclid" => "getCookiesTest" },
      {},
      nil, nil, nil
    )

    result = builder.process_request_from_context(data)
    cookies = builder.get_cookies_to_set

    assert_equal(result, cookies)
    assert_equal(2, cookies.size)
  end
end
