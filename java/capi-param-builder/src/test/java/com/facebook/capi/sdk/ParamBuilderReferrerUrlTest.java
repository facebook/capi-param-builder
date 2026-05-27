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
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link ParamBuilder#getReferrerUrl()} covering storage, retrieval via both
 * processRequest and processRequestFromContext, reset between calls, and null/empty semantics.
 */
public class ParamBuilderReferrerUrlTest {

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

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private static PlainDataObject pdo(
      String host,
      Map<String, List<String>> queryParams,
      Map<String, String> cookies,
      String referer) {
    return new PlainDataObject(host, queryParams, cookies, referer, null, null);
  }

  private static Map<String, List<String>> singleQuery(String key, String value) {
    return Collections.singletonMap(key, Collections.singletonList(value));
  }

  /**
   * Minimal Servlet-like stand-in so the reflection-based adaptor detects the Servlet shape without
   * any real Servlet jar on the classpath.
   */
  public static class FakeServletRequest {
    private final Map<String, String> headers;
    private final String queryString;

    FakeServletRequest(Map<String, String> headers, String queryString) {
      this.headers = headers == null ? Collections.<String, String>emptyMap() : headers;
      this.queryString = queryString;
    }

    public String getHeader(String name) {
      for (Map.Entry<String, String> e : headers.entrySet()) {
        if (e.getKey().equalsIgnoreCase(name)) {
          return e.getValue();
        }
      }
      return null;
    }

    public String getQueryString() {
      return queryString;
    }
  }

  // ---------------------------------------------------------------------------
  // Referrer stored before fbclid extraction
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("Referrer URL is stored verbatim before fbclid is extracted from it")
  void testReferrerStoredBeforeFbclidExtraction() {
    String referrer = "https://facebook.com/ad?fbclid=IwAR_abc123&utm_source=fb";
    Map<String, String[]> queries = new HashMap<String, String[]>();
    builder.processRequest("example.com", queries, null, referrer);
    assertThat(builder.getReferrerUrl()).isEqualTo(referrer + NO_CHANGE_SUFFIX);
    assertThat(builder.getFbc()).endsWith(".IwAR_abc123." + "AQMCAQAB");
  }

  @Test
  @DisplayName(
      "Referrer URL preserved even when query also has fbclid (query takes precedence for fbc)")
  void testReferrerPreservedWhenQueryAlsoHasFbclid() {
    String referrer = "https://facebook.com/ad?fbclid=fromReferer";
    Map<String, String[]> queries = new HashMap<String, String[]>();
    queries.put(Constants.FBCLID_STRING, new String[] {"fromQuery"});
    builder.processRequest("example.com", queries, null, referrer);
    assertThat(builder.getReferrerUrl()).isEqualTo(referrer + NO_CHANGE_SUFFIX);
    assertThat(builder.getFbc()).endsWith(".fromQuery." + "AQMCAQAB");
  }

  // ---------------------------------------------------------------------------
  // getReferrerUrl() returns null when no referrer
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("getReferrerUrl() returns null when processRequest called without referrer")
  void testGetReferrerUrlReturnsNullWhenNoReferrer() {
    Map<String, String[]> queries = new HashMap<String, String[]>();
    builder.processRequest("example.com", queries, null);
    assertThat(builder.getReferrerUrl()).isNull();
  }

  @Test
  @DisplayName("getReferrerUrl() returns null before any processRequest call")
  void testGetReferrerUrlReturnsNullBeforeProcessing() {
    assertThat(builder.getReferrerUrl()).isNull();
  }

  @Test
  @DisplayName("getReferrerUrl() returns null when 4-arg processRequest passes null referrer")
  void testGetReferrerUrlExplicitNull() {
    Map<String, String[]> queries = new HashMap<String, String[]>();
    builder.processRequest("example.com", queries, null, null);
    assertThat(builder.getReferrerUrl()).isNull();
  }

  // ---------------------------------------------------------------------------
  // getReferrerUrl() via processRequest() with all params
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("getReferrerUrl() returns full referrer via processRequest with all params")
  void testGetReferrerUrlViaProcessRequestWithAllParams() {
    String referrer = "https://landing.example.com/page?utm_source=google&fbclid=IwAR_test";
    Map<String, String[]> queries = new HashMap<String, String[]>();
    queries.put(Constants.FBCLID_STRING, new String[] {"queryFbclid"});
    Map<String, String> cookies = new HashMap<String, String>();
    cookies.put(Constants.FBC_COOKIE_NAME, "fb.1.1234.existingFbc");
    cookies.put(Constants.FBP_COOKIE_NAME, "fb.1.5678.existingFbp");
    builder.processRequest("shop.example.com", queries, cookies, referrer);
    assertThat(builder.getReferrerUrl()).isEqualTo(referrer + NO_CHANGE_SUFFIX);
  }

  @Test
  @DisplayName("getReferrerUrl() returns referrer without fbclid")
  void testGetReferrerUrlWithoutFbclid() {
    String referrer = "https://google.com/search?q=shoes";
    Map<String, String[]> queries = new HashMap<String, String[]>();
    builder.processRequest("shop.example.com", queries, null, referrer);
    assertThat(builder.getReferrerUrl()).isEqualTo(referrer + NO_CHANGE_SUFFIX);
    assertThat(builder.getFbc()).isNull();
  }

  // ---------------------------------------------------------------------------
  // getReferrerUrl() via processRequestFromContext — PlainDataObject
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("getReferrerUrl() works via processRequestFromContext with PlainDataObject")
  void testGetReferrerUrlViaPlainDataObject() {
    String referer = "https://facebook.com/ad?fbclid=pdoTest";
    PlainDataObject data =
        pdo(
            "example.com",
            new HashMap<String, List<String>>(),
            new HashMap<String, String>(),
            referer);
    builder.processRequestFromContext(data);
    assertThat(builder.getReferrerUrl()).isEqualTo(referer + NO_CHANGE_SUFFIX);
  }

  @Test
  @DisplayName("getReferrerUrl() is null via PlainDataObject with null referer")
  void testGetReferrerUrlNullViaPlainDataObject() {
    PlainDataObject data =
        pdo(
            "example.com",
            new HashMap<String, List<String>>(),
            new HashMap<String, String>(),
            null);
    builder.processRequestFromContext(data);
    assertThat(builder.getReferrerUrl()).isNull();
  }

  // ---------------------------------------------------------------------------
  // getReferrerUrl() via processRequestFromContext — Servlet mock
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("getReferrerUrl() works via processRequestFromContext with Servlet-like request")
  void testGetReferrerUrlViaServletMock() {
    Map<String, String> headers = new HashMap<String, String>();
    headers.put("Host", "shop.example.com");
    headers.put("Referer", "https://facebook.com/ad?fbclid=servletTest");
    FakeServletRequest req = new FakeServletRequest(headers, null);
    builder.processRequestFromContext(req);
    assertThat(builder.getReferrerUrl())
        .isEqualTo("https://facebook.com/ad?fbclid=servletTest" + NO_CHANGE_SUFFIX);
  }

  @Test
  @DisplayName("getReferrerUrl() is null via Servlet-like request without Referer header")
  void testGetReferrerUrlNullViaServletMock() {
    Map<String, String> headers = new HashMap<String, String>();
    headers.put("Host", "shop.example.com");
    FakeServletRequest req = new FakeServletRequest(headers, "fbclid=test123");
    builder.processRequestFromContext(req);
    assertThat(builder.getReferrerUrl()).isNull();
  }

  // ---------------------------------------------------------------------------
  // getReferrerUrl() via processRequestFromContext — Map (environ)
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("getReferrerUrl() works via processRequestFromContext with Map environ")
  void testGetReferrerUrlViaMapEnviron() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_HOST", "api.example.com");
    env.put("HTTP_REFERER", "https://facebook.com/ad?fbclid=mapTest");
    builder.processRequestFromContext(env);
    assertThat(builder.getReferrerUrl())
        .isEqualTo("https://facebook.com/ad?fbclid=mapTest" + NO_CHANGE_SUFFIX);
  }

  @Test
  @DisplayName("getReferrerUrl() is null via Map environ without HTTP_REFERER")
  void testGetReferrerUrlNullViaMapEnviron() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_HOST", "api.example.com");
    env.put("QUERY_STRING", "fbclid=noReferer");
    builder.processRequestFromContext(env);
    assertThat(builder.getReferrerUrl()).isNull();
  }

  // ---------------------------------------------------------------------------
  // Reset between consecutive calls
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("getReferrerUrl() resets between consecutive processRequest calls")
  void testResetBetweenConsecutiveCalls() {
    String referrer1 = "https://facebook.com/ad1?fbclid=first";
    builder.processRequest("example.com", new HashMap<String, String[]>(), null, referrer1);
    assertThat(builder.getReferrerUrl()).isEqualTo(referrer1 + NO_CHANGE_SUFFIX);

    String referrer2 = "https://google.com/search?q=second";
    builder.processRequest("example.com", new HashMap<String, String[]>(), null, referrer2);
    assertThat(builder.getReferrerUrl()).isEqualTo(referrer2 + NO_CHANGE_SUFFIX);
  }

  @Test
  @DisplayName("getReferrerUrl() resets to null when second call has no referrer")
  void testResetToNullOnSecondCall() {
    builder.processRequest(
        "example.com", new HashMap<String, String[]>(), null, "https://first.com");
    assertThat(builder.getReferrerUrl()).isEqualTo("https://first.com" + NO_CHANGE_SUFFIX);

    builder.processRequest("example.com", new HashMap<String, String[]>(), null);
    assertThat(builder.getReferrerUrl()).isNull();
  }

  @Test
  @DisplayName("getReferrerUrl() resets between processRequestFromContext calls")
  void testResetBetweenContextCalls() {
    PlainDataObject data1 =
        pdo(
            "example.com",
            new HashMap<String, List<String>>(),
            new HashMap<String, String>(),
            "https://first.com/ref");
    builder.processRequestFromContext(data1);
    assertThat(builder.getReferrerUrl()).isEqualTo("https://first.com/ref" + NO_CHANGE_SUFFIX);

    PlainDataObject data2 =
        pdo(
            "example.com",
            new HashMap<String, List<String>>(),
            new HashMap<String, String>(),
            null);
    builder.processRequestFromContext(data2);
    assertThat(builder.getReferrerUrl()).isNull();
  }

  // ---------------------------------------------------------------------------
  // null vs empty string
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("getReferrerUrl() distinguishes null from empty string")
  void testNullVsEmptyString() {
    builder.processRequest("example.com", new HashMap<String, String[]>(), null, null);
    assertThat(builder.getReferrerUrl()).isNull();

    builder.processRequest("example.com", new HashMap<String, String[]>(), null, "");
    assertThat(builder.getReferrerUrl()).isEmpty();
  }

  @Test
  @DisplayName("Empty string referrer does not produce fbc (treated as no fbclid)")
  void testEmptyStringReferrerNoFbc() {
    builder.processRequest("example.com", new HashMap<String, String[]>(), null, "");
    assertThat(builder.getReferrerUrl()).isEmpty();
    assertThat(builder.getFbc()).isNull();
  }

  @Test
  @DisplayName("Whitespace-only referrer stored as-is and does not produce fbc")
  void testWhitespaceReferrerStoredAsIs() {
    builder.processRequest("example.com", new HashMap<String, String[]>(), null, "   ");
    // Whitespace-only string is non-empty, so the appendix is still appended.
    assertThat(builder.getReferrerUrl()).isEqualTo("   " + NO_CHANGE_SUFFIX);
    assertThat(builder.getFbc()).isNull();
  }
}
