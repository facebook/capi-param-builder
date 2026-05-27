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

public class ParamBuilderEventSourceUrlTest {

  private static final String SDK_VERSION = "1.0.1";
  // Base64url-encoded appendix tokens for SDK_VERSION="1.0.1" with the Java
  // LANGUAGE_TOKEN_INDEX (0x03). Bytes: [DEFAULT_FORMAT=0x01, LANG_INDEX=0x03,
  // type_byte, major, minor, patch].
  //   NO_CHANGE (type 0x00) → [01 03 00 01 00 01] → "AQMAAQAB"
  //   NET_NEW   (type 0x02) → [01 03 02 01 00 01] → "AQMCAQAB"
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

  @Nested
  @DisplayName("constructEventSourceUrl — scheme variants")
  class SchemeVariants {

    @Test
    @DisplayName("scheme=https + host + URI -> https://host/uri")
    void testHttpsScheme() {
      builder.processRequestFromContext(pdo("www.example.com", null, "https", "/path"));
      assertThat(builder.getEventSourceUrl())
          .isEqualTo("https://www.example.com/path" + NET_NEW_SUFFIX);
    }

    @Test
    @DisplayName("scheme=http + host + URI -> http://host/uri")
    void testHttpScheme() {
      builder.processRequestFromContext(pdo("www.example.com", null, "http", "/path"));
      assertThat(builder.getEventSourceUrl())
          .isEqualTo("http://www.example.com/path" + NET_NEW_SUFFIX);
    }

    @Test
    @DisplayName("scheme=null + host + URI -> null (no scheme default)")
    void testNullScheme() {
      builder.processRequestFromContext(pdo("www.example.com", null, null, "/path"));
      assertThat(builder.getEventSourceUrl()).isNull();
    }

    @Test
    @DisplayName("scheme=empty + host + URI -> null")
    void testEmptyScheme() {
      builder.processRequestFromContext(pdo("www.example.com", null, "", "/path"));
      assertThat(builder.getEventSourceUrl()).isNull();
    }
  }

  @Nested
  @DisplayName("constructEventSourceUrl — null-return conditions (OR logic)")
  class NullReturnConditions {

    @Test
    @DisplayName("host=null -> null")
    void testNullHost() {
      builder.processRequestFromContext(pdo(null, null, "https", "/path"));
      assertThat(builder.getEventSourceUrl()).isNull();
    }

    @Test
    @DisplayName("host=empty -> null")
    void testEmptyHost() {
      builder.processRequestFromContext(pdo("", null, "https", "/path"));
      assertThat(builder.getEventSourceUrl()).isNull();
    }

    @Test
    @DisplayName("All null -> null")
    void testAllNull() {
      builder.processRequestFromContext(pdo(null, null, null, null));
      assertThat(builder.getEventSourceUrl()).isNull();
    }

    @Test
    @DisplayName("scheme present, host missing -> null")
    void testSchemePresentHostMissing() {
      builder.processRequestFromContext(pdo(null, null, "https", null));
      assertThat(builder.getEventSourceUrl()).isNull();
    }

    @Test
    @DisplayName("host present, scheme missing -> null")
    void testHostPresentSchemeMissing() {
      builder.processRequestFromContext(pdo("example.com", null, null, null));
      assertThat(builder.getEventSourceUrl()).isNull();
    }
  }

  @Nested
  @DisplayName("constructEventSourceUrl — requestUri handling")
  class RequestUriHandling {

    @Test
    @DisplayName("Host only (no requestUri) -> scheme://host")
    void testHostOnly() {
      builder.processRequestFromContext(pdo("example.com", null, "https", null));
      assertThat(builder.getEventSourceUrl()).isEqualTo("https://example.com" + NET_NEW_SUFFIX);
    }

    @Test
    @DisplayName("Empty requestUri -> scheme://host")
    void testEmptyRequestUri() {
      builder.processRequestFromContext(pdo("example.com", null, "https", ""));
      assertThat(builder.getEventSourceUrl()).isEqualTo("https://example.com" + NET_NEW_SUFFIX);
    }

    @Test
    @DisplayName("Query string preserved")
    void testQueryStringPreserved() {
      builder.processRequestFromContext(
          pdo("www.example.com", null, "https", "/search?q=test&page=2"));
      assertThat(builder.getEventSourceUrl())
          .isEqualTo("https://www.example.com/search?q=test&page=2" + NET_NEW_SUFFIX);
    }

    @Test
    @DisplayName("Host with port preserved")
    void testHostWithPort() {
      builder.processRequestFromContext(pdo("localhost:8080", null, "http", "/api/test"));
      assertThat(builder.getEventSourceUrl())
          .isEqualTo("http://localhost:8080/api/test" + NET_NEW_SUFFIX);
    }

    @Test
    @DisplayName("Fragment and params preserved")
    void testFragmentAndParams() {
      builder.processRequestFromContext(
          pdo("example.com", null, "https", "/path?key=val&foo=bar#section"));
      assertThat(builder.getEventSourceUrl())
          .isEqualTo("https://example.com/path?key=val&foo=bar#section" + NET_NEW_SUFFIX);
    }

    @Test
    @DisplayName("Root path /")
    void testRootPath() {
      builder.processRequestFromContext(pdo("example.com", null, "https", "/"));
      assertThat(builder.getEventSourceUrl()).isEqualTo("https://example.com/" + NET_NEW_SUFFIX);
    }
  }

  @Nested
  @DisplayName("processRequest vs processRequestFromContext")
  class ProcessRequestBehavior {

    @Test
    @DisplayName("processRequestFromContext sets eventSourceUrl")
    void testFromContextSetsUrl() {
      builder.processRequestFromContext(pdo("shop.example.com", null, "https", "/products?id=42"));
      assertThat(builder.getEventSourceUrl())
          .isEqualTo("https://shop.example.com/products?id=42" + NET_NEW_SUFFIX);
    }

    @Test
    @DisplayName("processRequest returns null for eventSourceUrl")
    void testDirectProcessRequestReturnsNull() {
      builder.processRequest(
          "example.com", new HashMap<String, String[]>(), null, "https://ref.com");
      assertThat(builder.getEventSourceUrl()).isNull();
    }

    @Test
    @DisplayName("eventSourceUrl is null before any call")
    void testInitialStateNull() {
      assertThat(builder.getEventSourceUrl()).isNull();
    }
  }

  @Nested
  @DisplayName("Reset between calls")
  class ResetBehavior {

    @Test
    @DisplayName("eventSourceUrl resets between processRequestFromContext calls")
    void testResetBetweenContextCalls() {
      builder.processRequestFromContext(pdo("first.com", null, "https", "/page1"));
      assertThat(builder.getEventSourceUrl()).isEqualTo("https://first.com/page1" + NET_NEW_SUFFIX);

      builder.processRequestFromContext(pdo(null, null, null, null));
      assertThat(builder.getEventSourceUrl()).isNull();
    }

    @Test
    @DisplayName("eventSourceUrl resets when processRequest called after processRequestFromContext")
    void testResetOnDirectProcessRequest() {
      builder.processRequestFromContext(pdo("example.com", null, "https", "/first"));
      assertThat(builder.getEventSourceUrl())
          .isEqualTo("https://example.com/first" + NET_NEW_SUFFIX);

      builder.processRequest("example.com", new HashMap<String, String[]>(), null);
      assertThat(builder.getEventSourceUrl()).isNull();
    }

    @Test
    @DisplayName("eventSourceUrl updates to new value on subsequent context call")
    void testUpdateOnSubsequentCall() {
      builder.processRequestFromContext(pdo("first.com", null, "https", "/a"));
      assertThat(builder.getEventSourceUrl()).isEqualTo("https://first.com/a" + NET_NEW_SUFFIX);

      builder.processRequestFromContext(pdo("second.com", null, "http", "/b"));
      assertThat(builder.getEventSourceUrl()).isEqualTo("http://second.com/b" + NET_NEW_SUFFIX);
    }
  }

  @Nested
  @DisplayName("Independence from referrerUrl")
  class IndependenceFromReferrer {

    @Test
    @DisplayName("referrerUrl does not affect eventSourceUrl")
    void testReferrerDoesNotAffectEventSourceUrl() {
      builder.processRequestFromContext(
          pdo("shop.example.com", "https://facebook.com/ad", "https", "/products"));
      assertThat(builder.getEventSourceUrl())
          .isEqualTo("https://shop.example.com/products" + NET_NEW_SUFFIX);
      assertThat(builder.getReferrerUrl()).isEqualTo("https://facebook.com/ad" + NO_CHANGE_SUFFIX);
    }

    @Test
    @DisplayName("eventSourceUrl null does not affect referrerUrl")
    void testEventSourceUrlNullDoesNotAffectReferrer() {
      builder.processRequestFromContext(pdo(null, "https://facebook.com/ad", null, null));
      assertThat(builder.getEventSourceUrl()).isNull();
      assertThat(builder.getReferrerUrl()).isEqualTo("https://facebook.com/ad" + NO_CHANGE_SUFFIX);
    }

    @Test
    @DisplayName("processRequest sets referrerUrl but not eventSourceUrl")
    void testProcessRequestSetsReferrerNotEventSourceUrl() {
      builder.processRequest(
          "example.com", new HashMap<String, String[]>(), null, "https://referrer.com/page");
      assertThat(builder.getReferrerUrl())
          .isEqualTo("https://referrer.com/page" + NO_CHANGE_SUFFIX);
      assertThat(builder.getEventSourceUrl()).isNull();
    }
  }
}
