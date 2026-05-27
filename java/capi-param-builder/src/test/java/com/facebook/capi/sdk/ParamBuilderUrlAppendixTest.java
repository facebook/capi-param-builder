/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk;

import static org.assertj.core.api.Assertions.assertThat;

import com.facebook.capi.sdk.model.Constants;
import com.facebook.capi.sdk.model.FbcParamConfig;
import com.facebook.capi.sdk.model.PlainDataObject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * Covers the appendix-appending transformation applied to:
 *
 * <ul>
 *   <li>{@code referrerUrl} (suffix: {@code "." + APPENDIX_NO_CHANGE})
 *   <li>{@code eventSourceUrl} (suffix: {@code "." + APPENDIX_NET_NEW})
 * </ul>
 *
 * <p>The appendix string is derived from the SDK version. With {@code SDK_VERSION="1.0.1"} and the
 * Java {@code LANGUAGE_TOKEN_INDEX=0x03}, the base64url-encoded tokens are:
 *
 * <ul>
 *   <li>NO_CHANGE (type 0x00): bytes {@code [01 03 00 01 00 01]} → {@code "AQMAAQAB"}
 *   <li>NET_NEW (type 0x02): bytes {@code [01 03 02 01 00 01]} → {@code "AQMCAQAB"}
 * </ul>
 */
public class ParamBuilderUrlAppendixTest {

  private static final String SDK_VERSION = "1.0.1";
  private static final String NO_CHANGE_SUFFIX = ".AQMAAQAB";
  private static final String NET_NEW_SUFFIX = ".AQMCAQAB";

  private ParamBuilder builder;

  @BeforeEach
  void setup() {
    builder = new ParamBuilder(new TestETLDPlusOneResolver());
    builder.setCookieUtils(
        new ArrayList<FbcParamConfig>(
            Arrays.asList(
                new FbcParamConfig(Constants.FBCLID_STRING, "", Constants.CLICK_ID_STRING))),
        SDK_VERSION);
  }

  private static PlainDataObject pdo(
      String host, String referer, String scheme, String requestUri) {
    return new PlainDataObject(
        host,
        new HashMap<String, List<String>>(),
        new HashMap<String, String>(),
        referer,
        null,
        null,
        scheme,
        requestUri);
  }

  // ===========================================================================
  // referrerUrl: appends APPENDIX_NO_CHANGE
  // ===========================================================================

  @Nested
  @DisplayName("referrerUrl gets NO_CHANGE appendix")
  class ReferrerAppendixApplied {

    @Test
    @DisplayName("via processRequest with simple URL")
    void testViaProcessRequest() {
      String referer = "https://facebook.com/ad";
      builder.processRequest("example.com", new HashMap<String, String[]>(), null, referer);
      assertThat(builder.getReferrerUrl()).isEqualTo(referer + NO_CHANGE_SUFFIX);
    }

    @Test
    @DisplayName("via processRequestFromContext")
    void testViaContext() {
      String referer = "https://google.com/search?q=shoes";
      builder.processRequestFromContext(pdo("shop.example.com", referer, null, null));
      assertThat(builder.getReferrerUrl()).isEqualTo(referer + NO_CHANGE_SUFFIX);
    }

    @Test
    @DisplayName("with complex URL (query + fragment)")
    void testWithComplexUrl() {
      String referer = "https://app.example.com/search?q=test&page=3#results";
      builder.processRequest("example.com", new HashMap<String, String[]>(), null, referer);
      assertThat(builder.getReferrerUrl()).isEqualTo(referer + NO_CHANGE_SUFFIX);
    }
  }

  // ===========================================================================
  // referrerUrl: skips appendix on null / empty
  // ===========================================================================

  @Nested
  @DisplayName("referrerUrl skips appendix on null / empty")
  class ReferrerSkipsAppendix {

    @Test
    @DisplayName("null referer stays null")
    void testNullReferer() {
      builder.processRequest("example.com", new HashMap<String, String[]>(), null, null);
      assertThat(builder.getReferrerUrl()).isNull();
    }

    @Test
    @DisplayName("empty string referer stays empty (no appendix appended)")
    void testEmptyStringReferer() {
      builder.processRequest("example.com", new HashMap<String, String[]>(), null, "");
      assertThat(builder.getReferrerUrl()).isEmpty();
    }

    @Test
    @DisplayName("null referer via PlainDataObject stays null")
    void testNullRefererViaContext() {
      builder.processRequestFromContext(pdo("example.com", null, null, null));
      assertThat(builder.getReferrerUrl()).isNull();
    }
  }

  // ===========================================================================
  // referrerUrl idempotency: each processRequest reassigns from input, so the
  // appendix is applied at most once per call.
  // ===========================================================================

  @Nested
  @DisplayName("referrerUrl idempotency across consecutive calls")
  class ReferrerIdempotency {

    @Test
    @DisplayName("consecutive calls with same input do not double-append")
    void testConsecutiveCallsDoNotDoubleAppend() {
      String referer = "https://example.com/page";
      builder.processRequest("example.com", new HashMap<String, String[]>(), null, referer);
      String first = builder.getReferrerUrl();

      builder.processRequest("example.com", new HashMap<String, String[]>(), null, referer);
      String second = builder.getReferrerUrl();

      assertThat(first).isEqualTo(second);
      assertThat(second).isEqualTo(referer + NO_CHANGE_SUFFIX);
      assertThat(countOccurrences(second, NO_CHANGE_SUFFIX)).isEqualTo(1);
    }

    @Test
    @DisplayName("value changes between calls")
    void testValueChangesBetweenCalls() {
      builder.processRequest(
          "example.com", new HashMap<String, String[]>(), null, "https://first.com");
      assertThat(builder.getReferrerUrl()).isEqualTo("https://first.com" + NO_CHANGE_SUFFIX);

      builder.processRequest(
          "example.com", new HashMap<String, String[]>(), null, "https://second.com");
      assertThat(builder.getReferrerUrl()).isEqualTo("https://second.com" + NO_CHANGE_SUFFIX);
    }

    @Test
    @DisplayName("cleared then set")
    void testClearedThenSet() {
      builder.processRequest(
          "example.com", new HashMap<String, String[]>(), null, "https://first.com");
      assertThat(builder.getReferrerUrl()).isEqualTo("https://first.com" + NO_CHANGE_SUFFIX);

      builder.processRequest("example.com", new HashMap<String, String[]>(), null, null);
      assertThat(builder.getReferrerUrl()).isNull();

      builder.processRequest(
          "example.com", new HashMap<String, String[]>(), null, "https://third.com");
      assertThat(builder.getReferrerUrl()).isEqualTo("https://third.com" + NO_CHANGE_SUFFIX);
    }
  }

  // ===========================================================================
  // eventSourceUrl: appends APPENDIX_NET_NEW
  // ===========================================================================

  @Nested
  @DisplayName("eventSourceUrl gets NET_NEW appendix")
  class EventSourceAppendixApplied {

    @Test
    @DisplayName("with path")
    void testWithPath() {
      builder.processRequestFromContext(pdo("shop.example.com", null, "https", "/products"));
      assertThat(builder.getEventSourceUrl())
          .isEqualTo("https://shop.example.com/products" + NET_NEW_SUFFIX);
    }

    @Test
    @DisplayName("with query and fragment (appendix sits after the fragment)")
    void testWithQueryAndFragment() {
      builder.processRequestFromContext(
          pdo("www.myshop.com", null, "https", "/landing?utm=fb&campaign=summer#section"));
      assertThat(builder.getEventSourceUrl())
          .isEqualTo(
              "https://www.myshop.com/landing?utm=fb&campaign=summer#section" + NET_NEW_SUFFIX);
    }

    @Test
    @DisplayName("with empty request_uri (host only)")
    void testHostOnly() {
      builder.processRequestFromContext(pdo("example.com", null, "http", null));
      assertThat(builder.getEventSourceUrl()).isEqualTo("http://example.com" + NET_NEW_SUFFIX);
    }
  }

  // ===========================================================================
  // eventSourceUrl: returns null when constructEventSourceUrl returns null
  // ===========================================================================

  @Nested
  @DisplayName("eventSourceUrl is null when host or scheme missing")
  class EventSourceNullCases {

    @Test
    @DisplayName("null when host empty")
    void testNullWhenHostEmpty() {
      builder.processRequestFromContext(pdo("", null, "https", "/products"));
      assertThat(builder.getEventSourceUrl()).isNull();
    }

    @Test
    @DisplayName("null when scheme null")
    void testNullWhenSchemeNull() {
      builder.processRequestFromContext(pdo("example.com", null, null, "/products"));
      assertThat(builder.getEventSourceUrl()).isNull();
    }

    @Test
    @DisplayName("null when scheme empty string")
    void testNullWhenSchemeEmpty() {
      builder.processRequestFromContext(pdo("example.com", null, "", "/products"));
      assertThat(builder.getEventSourceUrl()).isNull();
    }

    @Test
    @DisplayName("null when processRequest used directly (no constructEventSourceUrl call)")
    void testNullWhenProcessRequestDirect() {
      builder.processRequest("example.com", new HashMap<String, String[]>(), null, "https://r.com");
      assertThat(builder.getEventSourceUrl()).isNull();
    }
  }

  // ===========================================================================
  // eventSourceUrl idempotency
  // ===========================================================================

  @Nested
  @DisplayName("eventSourceUrl idempotency")
  class EventSourceIdempotency {

    @Test
    @DisplayName("consecutive calls with same input do not double-append")
    void testConsecutiveCallsDoNotDoubleAppend() {
      PlainDataObject data = pdo("shop.example.com", null, "https", "/products");
      builder.processRequestFromContext(data);
      String first = builder.getEventSourceUrl();

      builder.processRequestFromContext(data);
      String second = builder.getEventSourceUrl();

      assertThat(first).isEqualTo(second);
      assertThat(second).isEqualTo("https://shop.example.com/products" + NET_NEW_SUFFIX);
      assertThat(countOccurrences(second, NET_NEW_SUFFIX)).isEqualTo(1);
    }

    @Test
    @DisplayName("cleared then set")
    void testClearedThenSet() {
      builder.processRequestFromContext(pdo("shop.example.com", null, "https", "/products"));
      assertThat(builder.getEventSourceUrl())
          .isEqualTo("https://shop.example.com/products" + NET_NEW_SUFFIX);

      builder.processRequestFromContext(pdo("shop.example.com", null, null, "/products"));
      assertThat(builder.getEventSourceUrl()).isNull();
    }
  }

  // ===========================================================================
  // Cross-field: referrer and event_source_url use different appendix tokens
  // ===========================================================================

  @Nested
  @DisplayName("cross-field appendix tokens differ")
  class CrossFieldTokens {

    @Test
    @DisplayName("referrerUrl uses NO_CHANGE, eventSourceUrl uses NET_NEW")
    void testTokensDiffer() {
      builder.processRequestFromContext(
          pdo("shop.example.com", "https://facebook.com/ad", "https", "/checkout"));

      assertThat(builder.getReferrerUrl()).isEqualTo("https://facebook.com/ad" + NO_CHANGE_SUFFIX);
      assertThat(builder.getEventSourceUrl())
          .isEqualTo("https://shop.example.com/checkout" + NET_NEW_SUFFIX);
      assertThat(NO_CHANGE_SUFFIX).isNotEqualTo(NET_NEW_SUFFIX);
    }
  }

  // ===========================================================================
  // Documentation tests: feeding output back as input DOUBLE-APPENDS.
  //
  // The SDK has no dedup logic. These tests lock in the current behavior so a
  // future refactor that adds dedup will trigger an explicit decision.
  // ===========================================================================

  @Nested
  @DisplayName("feeding output back as input double-appends (no dedup)")
  class DoubleAppendDocumentation {

    @Test
    @DisplayName("referrer: feeding getReferrerUrl() back as referer doubles the suffix")
    void testReferrerDoublesWhenOutputFedBack() {
      String referer = "https://example.com/page";
      builder.processRequest("example.com", new HashMap<String, String[]>(), null, referer);
      String first = builder.getReferrerUrl();
      assertThat(first).isEqualTo(referer + NO_CHANGE_SUFFIX);

      builder.processRequest("example.com", new HashMap<String, String[]>(), null, first);
      String second = builder.getReferrerUrl();
      assertThat(second).isEqualTo(referer + NO_CHANGE_SUFFIX + NO_CHANGE_SUFFIX);
      assertThat(countOccurrences(second, NO_CHANGE_SUFFIX)).isEqualTo(2);
    }

    @Test
    @DisplayName("event source: feeding suffixed request_uri back doubles the suffix")
    void testEventSourceDoublesWhenRequestUriFedBack() {
      builder.processRequestFromContext(pdo("shop.example.com", null, "https", "/products"));
      String first = builder.getEventSourceUrl();
      assertThat(first).isEqualTo("https://shop.example.com/products" + NET_NEW_SUFFIX);

      // Contaminated request_uri already contains the appendix on the path.
      builder.processRequestFromContext(
          pdo("shop.example.com", null, "https", "/products" + NET_NEW_SUFFIX));
      String second = builder.getEventSourceUrl();
      assertThat(second)
          .isEqualTo("https://shop.example.com/products" + NET_NEW_SUFFIX + NET_NEW_SUFFIX);
      assertThat(countOccurrences(second, NET_NEW_SUFFIX)).isEqualTo(2);
    }
  }

  private static int countOccurrences(String haystack, String needle) {
    int count = 0;
    int idx = 0;
    while ((idx = haystack.indexOf(needle, idx)) != -1) {
      count++;
      idx += needle.length();
    }
    return count;
  }
}
