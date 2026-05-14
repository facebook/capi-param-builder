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
import com.facebook.capi.sdk.model.CookieSetting;
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
 * Unit tests for {@link ParamBuilder#processRequestFromContext(Object)}, mirroring the JS / PHP /
 * Python / Ruby test suites.
 */
public class ParamBuilderProcessRequestFromContextTest {

  // SDK_VERSION 1.0.1 + Java LANGUAGE_TOKEN_INDEX 0x03 -> these specific appendix bytes.
  private static final String SDK_VERSION = "1.0.1";
  private static final String APPENDIX_NET_NEW = "AQMCAQAB";
  private static final String APPENDIX_MODIFIED_NEW = "AQMDAQAB";
  private static final String APPENDIX_NO_CHANGE = "AQMAAQAB";

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

  private static CookieSetting findCookie(List<CookieSetting> cookies, String name) {
    for (CookieSetting c : cookies) {
      if (name.equals(c.getName())) {
        return c;
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // PlainDataObject input
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("PlainDataObject with fbclid produces fbc + fbp")
  void testPlainDataObjectWithFbclid() {
    PlainDataObject data =
        pdo("example.com", singleQuery("fbclid", "test123"), new HashMap<String, String>(), null);
    List<CookieSetting> result = builder.processRequestFromContext(data);
    assertThat(result).hasSize(2);
    CookieSetting fbc = findCookie(result, Constants.FBC_COOKIE_NAME);
    assertThat(fbc).isNotNull();
    assertThat(fbc.getValue()).endsWith(".test123." + APPENDIX_NET_NEW);
    assertThat(builder.getFbp()).isNotNull();
  }

  @Test
  @DisplayName("PlainDataObject with existing valid cookies appends no-change appendix")
  void testPlainDataObjectExistingCookies() {
    Map<String, String> cookies = new HashMap<String, String>();
    cookies.put(Constants.FBC_COOKIE_NAME, "fb.1.123456.abc");
    cookies.put(Constants.FBP_COOKIE_NAME, "fb.1.123456.7890");
    PlainDataObject data = pdo("example.com", new HashMap<String, List<String>>(), cookies, null);
    builder.processRequestFromContext(data);
    assertThat(builder.getFbc()).isEqualTo("fb.1.123456.abc." + APPENDIX_NO_CHANGE);
    assertThat(builder.getFbp()).isEqualTo("fb.1.123456.7890." + APPENDIX_NO_CHANGE);
  }

  @Test
  @DisplayName("PlainDataObject with no fbclid still generates fbp")
  void testPlainDataObjectNoFbclidStillGeneratesFbp() {
    PlainDataObject data =
        pdo(
            "example.com",
            new HashMap<String, List<String>>(),
            new HashMap<String, String>(),
            null);
    List<CookieSetting> result = builder.processRequestFromContext(data);
    assertThat(result).hasSize(1);
    CookieSetting fbp = findCookie(result, Constants.FBP_COOKIE_NAME);
    assertThat(fbp).isNotNull();
    assertThat(fbp.getValue()).endsWith("." + APPENDIX_NET_NEW);
    assertThat(builder.getFbc()).isNull();
  }

  @Test
  @DisplayName("PlainDataObject referer fallback when query has no fbclid")
  void testPlainDataObjectRefererFallback() {
    PlainDataObject data =
        pdo(
            "landing.example.com",
            new HashMap<String, List<String>>(),
            new HashMap<String, String>(),
            "https://facebook.com/ad?fbclid=IwAR_fromReferer");
    builder.processRequestFromContext(data);
    assertThat(builder.getFbc()).endsWith(".IwAR_fromReferer." + APPENDIX_NET_NEW);
  }

  @Test
  @DisplayName("PlainDataObject query fbclid takes precedence over referer fbclid")
  void testPlainDataObjectQueryTakesPrecedenceOverReferer() {
    PlainDataObject data =
        pdo(
            "example.com",
            singleQuery("fbclid", "fromQuery"),
            new HashMap<String, String>(),
            "https://facebook.com/ad?fbclid=fromReferer");
    builder.processRequestFromContext(data);
    assertThat(builder.getFbc()).endsWith(".fromQuery." + APPENDIX_NET_NEW);
  }

  @Test
  @DisplayName("PlainDataObject ignores xForwardedFor / remoteAddress (not yet consumed)")
  void testPlainDataObjectIgnoresUnusedIpFields() {
    // x_forwarded_for and remote_address are extracted by the adapter but
    // the current Java ParamBuilder doesn't yet consume them; this test
    // just confirms passing them does not break processing.
    PlainDataObject data =
        new PlainDataObject(
            "example.com",
            singleQuery("fbclid", "ipTest"),
            new HashMap<String, String>(),
            null,
            "203.0.113.50, 10.0.0.1",
            "10.0.0.1");
    List<CookieSetting> result = builder.processRequestFromContext(data);
    assertThat(result).hasSize(2);
    assertThat(builder.getFbc()).endsWith(".ipTest." + APPENDIX_NET_NEW);
  }

  // ---------------------------------------------------------------------------
  // Map / environ input
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("Map: raw environ Hash with QUERY_STRING produces fbc")
  void testRawEnvironMap() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_HOST", "api.example.com");
    env.put("REMOTE_ADDR", "192.168.1.100");
    env.put("QUERY_STRING", "fbclid=fromQS");
    List<CookieSetting> result = builder.processRequestFromContext(env);
    assertThat(result).hasSize(2);
    assertThat(builder.getFbc()).endsWith(".fromQS." + APPENDIX_NET_NEW);
  }

  @Test
  @DisplayName("Map: HTTP_COOKIE header parsed and existing cookies preserved")
  void testRawEnvironCookieHeader() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_HOST", "example.com");
    env.put("HTTP_COOKIE", "_fbc=fb.1.123.abc; _fbp=fb.1.456.7890");
    builder.processRequestFromContext(env);
    assertThat(builder.getFbc()).isEqualTo("fb.1.123.abc." + APPENDIX_NO_CHANGE);
    assertThat(builder.getFbp()).isEqualTo("fb.1.456.7890." + APPENDIX_NO_CHANGE);
  }

  @Test
  @DisplayName("Map: HTTP_REFERER falls through when QUERY_STRING is empty")
  void testRawEnvironRefererFallback() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_HOST", "landing.example.com");
    env.put("HTTP_REFERER", "https://facebook.com/ad?fbclid=IwAR_referer");
    builder.processRequestFromContext(env);
    assertThat(builder.getFbc()).endsWith(".IwAR_referer." + APPENDIX_NET_NEW);
  }

  // ---------------------------------------------------------------------------
  // Empty / null input
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("null context produces only fbp (host coerces to empty)")
  void testNullContextProducesOnlyFbp() {
    List<CookieSetting> result = builder.processRequestFromContext(null);
    assertThat(builder.getFbc()).isNull();
    assertThat(result).hasSize(1);
    CookieSetting fbp = findCookie(result, Constants.FBP_COOKIE_NAME);
    assertThat(fbp).isNotNull();
    assertThat(fbp.getValue()).endsWith("." + APPENDIX_NET_NEW);
  }

  @Test
  @DisplayName("empty Map context produces only fbp")
  void testEmptyMapContextProducesOnlyFbp() {
    List<CookieSetting> result = builder.processRequestFromContext(new HashMap<String, String>());
    assertThat(builder.getFbc()).isNull();
    assertThat(result).hasSize(1);
  }

  // ---------------------------------------------------------------------------
  // Equivalence with processRequest
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("processRequestFromContext output matches direct processRequest (modulo timestamp)")
  void testEquivalenceWithProcessRequest() {
    String host = "shop.example.com";
    String[] fbclidArr = new String[] {"equivalenceTest"};
    Map<String, String[]> queries = new HashMap<String, String[]>();
    queries.put(Constants.FBCLID_STRING, fbclidArr);
    Map<String, String> cookies = new HashMap<String, String>();
    String referer = "https://facebook.com/ad";

    ParamBuilder b1 = new ParamBuilder(new TestETLDPlusOneResolver());
    b1.setCookieUtils(
        new ArrayList<FbcParamConfig>(
            Arrays.asList(
                new FbcParamConfig(Constants.FBCLID_STRING, "", Constants.CLICK_ID_STRING))),
        SDK_VERSION);
    List<CookieSetting> r1 = b1.processRequest(host, queries, cookies, referer);

    ParamBuilder b2 = new ParamBuilder(new TestETLDPlusOneResolver());
    b2.setCookieUtils(
        new ArrayList<FbcParamConfig>(
            Arrays.asList(
                new FbcParamConfig(Constants.FBCLID_STRING, "", Constants.CLICK_ID_STRING))),
        SDK_VERSION);
    PlainDataObject data =
        pdo(host, singleQuery(Constants.FBCLID_STRING, "equivalenceTest"), cookies, referer);
    List<CookieSetting> r2 = b2.processRequestFromContext(data);

    assertThat(r1).hasSameSizeAs(r2);
    // fbc payload is deterministic from fbclid; timestamp at index 2 differs
    String[] f1 = b1.getFbc().split("\\.");
    String[] f2 = b2.getFbc().split("\\.");
    assertThat(f1[0]).isEqualTo(f2[0]); // prefix
    assertThat(f1[1]).isEqualTo(f2[1]); // subdomain index
    assertThat(f1[3]).isEqualTo(f2[3]); // payload
    assertThat(f1[f1.length - 1]).isEqualTo(f2[f2.length - 1]); // appendix
  }

  // ---------------------------------------------------------------------------
  // Cookie update behavior
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("New fbclid + existing fbc with different payload -> MODIFIED_NEW appendix")
  void testUpdatesFbcWhenPayloadChanges() {
    Map<String, String> cookies = new HashMap<String, String>();
    cookies.put(Constants.FBC_COOKIE_NAME, "fb.1.123.oldPayload");
    PlainDataObject data = pdo("example.com", singleQuery("fbclid", "newPayload"), cookies, null);
    builder.processRequestFromContext(data);
    assertThat(builder.getFbc()).endsWith(".newPayload." + APPENDIX_MODIFIED_NEW);
  }

  @Test
  @DisplayName("New fbclid identical to existing payload -> NO_CHANGE appendix appended")
  void testPreservesFbcWhenPayloadSame() {
    Map<String, String> cookies = new HashMap<String, String>();
    cookies.put(Constants.FBC_COOKIE_NAME, "fb.1.123.samePayload");
    PlainDataObject data = pdo("example.com", singleQuery("fbclid", "samePayload"), cookies, null);
    builder.processRequestFromContext(data);
    assertThat(builder.getFbc()).isEqualTo("fb.1.123.samePayload." + APPENDIX_NO_CHANGE);
  }

  @Test
  @DisplayName("Existing fbp preserved when new request has no fbclid")
  void testPreservesExistingFbp() {
    Map<String, String> cookies = new HashMap<String, String>();
    cookies.put(Constants.FBP_COOKIE_NAME, "fb.1.999.existingFbp");
    PlainDataObject data = pdo("example.com", new HashMap<String, List<String>>(), cookies, null);
    builder.processRequestFromContext(data);
    assertThat(builder.getFbp()).isEqualTo("fb.1.999.existingFbp." + APPENDIX_NO_CHANGE);
  }

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("Invalid cookie format (too many parts) is rejected, fresh fbp generated")
  void testInvalidCookieFormatRejected() {
    Map<String, String> cookies = new HashMap<String, String>();
    cookies.put(Constants.FBC_COOKIE_NAME, "invalid.format.with.too.many.parts.here");
    cookies.put(Constants.FBP_COOKIE_NAME, "also.invalid.format.too.many");
    PlainDataObject data = pdo("example.com", new HashMap<String, List<String>>(), cookies, null);
    builder.processRequestFromContext(data);
    assertThat(builder.getFbc()).isNull();
    assertThat(builder.getFbp()).isNotNull();
    assertThat(builder.getFbp()).endsWith("." + APPENDIX_NET_NEW);
  }

  @Test
  @DisplayName("Cookie with valid Java language token (Aw) preserved as-is")
  void testCookieWithValidLanguageTokenPreserved() {
    // "Aw" is the Java language token in SUPPORTED_LANGUAGE_TOKENS.
    Map<String, String> cookies = new HashMap<String, String>();
    cookies.put(Constants.FBC_COOKIE_NAME, "fb.1.123.abc.Aw");
    cookies.put(Constants.FBP_COOKIE_NAME, "fb.1.456.7890.Aw");
    PlainDataObject data = pdo("example.com", new HashMap<String, List<String>>(), cookies, null);
    builder.processRequestFromContext(data);
    assertThat(builder.getFbc()).isEqualTo("fb.1.123.abc.Aw");
    assertThat(builder.getFbp()).isEqualTo("fb.1.456.7890.Aw");
  }

  @Test
  @DisplayName("Empty/null list value for fbclid does not suppress referer fallback")
  void testEmptyQueryListValueFallsThroughToReferer() {
    // PlainDataObject built manually could have an empty/null List for a key.
    // toStringArrayMap must drop those keys so processRequest's referer fallback runs.
    Map<String, List<String>> queries = new HashMap<String, List<String>>();
    queries.put("fbclid", new ArrayList<String>());
    queries.put("other", null);
    PlainDataObject data =
        pdo(
            "example.com",
            queries,
            new HashMap<String, String>(),
            "https://facebook.com/ad?fbclid=fromReferer");
    builder.processRequestFromContext(data);
    assertThat(builder.getFbc()).endsWith(".fromReferer." + APPENDIX_NET_NEW);
  }

  @Test
  @DisplayName("getCookiesToSet() returns same list as processRequestFromContext()")
  void testGetCookiesToSetMatchesReturn() {
    PlainDataObject data =
        pdo(
            "example.com",
            singleQuery("fbclid", "getCookiesTest"),
            new HashMap<String, String>(),
            null);
    List<CookieSetting> result = builder.processRequestFromContext(data);
    List<CookieSetting> stored = builder.getCookiesToSet();
    assertThat(result).hasSize(2);
    assertThat(stored).containsExactlyElementsOf(result);
  }
}
