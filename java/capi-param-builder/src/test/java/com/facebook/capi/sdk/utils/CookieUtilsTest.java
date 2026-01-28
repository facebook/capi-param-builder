/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk.utils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.facebook.capi.sdk.model.Constants;
import com.facebook.capi.sdk.model.CookieSetting;
import com.facebook.capi.sdk.model.FbcParamConfig;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

public class CookieUtilsTest {
  int SAMPLE_SUBDOMAIN_INDEX = 1;
  String SAMPLE_ETLD_PLUS_ONE = "test.com";
  String SDK_VERSION = "1.0.1";
  CookieUtils cookieUtils =
      new CookieUtils(
          new ArrayList<FbcParamConfig>(
              Arrays.asList(
                  new FbcParamConfig(Constants.FBCLID_STRING, "", Constants.CLICK_ID_STRING))),
          SDK_VERSION);

  Map<String, CookieSetting> updatedCookiesMap = new HashMap<>();
  Map<String, String> cookies = new HashMap<>();
  Map<String, String[]> queryMap = new HashMap<>();

  String APPENDIX_NET_NEW = "AQMCAQAB";
  String APPENDIX_MODIFIED_NEW = "AQMDAQAB";
  String APPENDIX_NO_CHANGE = "AQMAAQAB";

  @BeforeEach
  void setup() {
    cookies.put(Constants.FBC_COOKIE_NAME, "fb.1.1234.fbcTest");
    cookies.put(Constants.FBP_COOKIE_NAME, "fb.2.3456.fbpTest");
  }

  @Test
  @DisplayName("Testing preprocessCookies for validation check")
  void testPreprocessCookies() {
    cookies.put("too_long_cookie_name", "123.234.345.678.902.balabala");
    cookies.put("too_short_cookie_name", "123.234.345.");
    cookies.put("invalid_language_token", "123.234.345.678.abc");
    cookies.put("valid_language_token_not_java", "123.234.345.678.Bg");
    cookies.put("valid_language_token_java", "123.234.345.678.Aw");
    cookies.put("valid_cookie_no_language_token", "123.234.345.678");
    // Basic validation check
    assertThat(cookieUtils.preprocessCookies(null, "cookie_name", updatedCookiesMap)).isNull();
    assertThat(cookieUtils.preprocessCookies(new HashMap<>(), "cookie_name", updatedCookiesMap))
        .isNull();
    assertThat(cookieUtils.preprocessCookies(cookies, "not_exist", updatedCookiesMap)).isNull();
    assertThat(cookieUtils.preprocessCookies(cookies, "too_long_cookie_name", updatedCookiesMap))
        .isNull();
    assertThat(cookieUtils.preprocessCookies(cookies, "too_short_cookie_name", updatedCookiesMap))
        .isNull();
    assertThat(cookieUtils.preprocessCookies(cookies, "invalid_language_token", updatedCookiesMap))
        .isNull();
    // Valid existing cookie, no update
    assertThat(
            cookieUtils.preprocessCookies(
                cookies, "valid_language_token_not_java", updatedCookiesMap))
        .isEqualTo("123.234.345.678.Bg");
    assertThat(
            cookieUtils.preprocessCookies(cookies, "valid_language_token_java", updatedCookiesMap))
        .isEqualTo("123.234.345.678.Aw");
    assertThat(updatedCookiesMap.size()).isEqualTo(0);
    // Valid existing cookie w/o language token, add language token and update the cookie
    assertThat(cookieUtils.preprocessCookies(cookies, Constants.FBC_COOKIE_NAME, updatedCookiesMap))
        .isEqualTo("fb.1.1234.fbcTest." + APPENDIX_NO_CHANGE);
    assertThat(updatedCookiesMap.get(Constants.FBC_COOKIE_NAME).getValue())
        .isEqualTo("fb.1.1234.fbcTest." + APPENDIX_NO_CHANGE);
    assertThat(updatedCookiesMap.size()).isEqualTo(1);
  }

  @Test
  @DisplayName("Testing getNewFbcPayloadFromQuery")
  void testGetNewFbcPayloadFromQuery() {
    assertThat(cookieUtils.getNewFbcPayloadFromQuery(null, null)).isNull();
    assertThat(cookieUtils.getNewFbcPayloadFromQuery(new HashMap<>(), null)).isNull();
    // Not needed query
    queryMap.put("whatevertest", new String[] {"test123"});
    assertThat(cookieUtils.getNewFbcPayloadFromQuery(queryMap, null)).isNull();
    // fbclid query
    queryMap.put("fbclid", new String[] {"test123"});
    assertThat(cookieUtils.getNewFbcPayloadFromQuery(queryMap, null)).isEqualTo("test123");
    // referer query
    assertThat(cookieUtils.getNewFbcPayloadFromQuery(null, "")).isNull();
    assertThat(cookieUtils.getNewFbcPayloadFromQuery(null, "test.com?foo=bar")).isNull();
    assertThat(cookieUtils.getNewFbcPayloadFromQuery(null, "test.com?fbclid=bar")).isEqualTo("bar");
    // Query and referer exist at the same time, prioritize query
    assertThat(cookieUtils.getNewFbcPayloadFromQuery(queryMap, "test.com?fbclid=bar"))
        .isEqualTo("test123");
  }

  @Test
  @DisplayName("Testing getUpdatedFbcCookie")
  void testGetUpdatedFbcCookie() {
    CookieSetting result = cookieUtils.getUpdatedFbcCookie(null, null, updatedCookiesMap);
    assertThat(result).isNull();
  }

  @Test
  @DisplayName("Testing getUpdatedFbcCookie with link deco input")
  void testGetUpdatedFbcCookieUpdated() {
    cookieUtils.setEtldPlusOneAndSubDomainIndex("test.com", 1);
    CookieSetting result =
        cookieUtils.getUpdatedFbcCookie("fb.1.123456.test123", "test456", updatedCookiesMap);
    assertThat(result).isNotNull();
    String cookieValue = result.getValue();
    assertTrue(
        cookieValue.matches(String.format("^fb.1.[0-9]+.test456.%s$", APPENDIX_MODIFIED_NEW)));
    assertThat(result.getDomain()).isEqualTo("test.com");
  }

  @Test
  @DisplayName("Testing getUpdatedFbcCookie no change for fbc payload")
  void testGetUpdatedFbcCookieSameFbcPayload() {
    CookieSetting result =
        cookieUtils.getUpdatedFbcCookie("fb.1.123456.test123", "test123", updatedCookiesMap);
    assertThat(result).isNull(); // No change
  }

  @Test
  @DisplayName("Testing getUpdatedFbcCookie with corrupt existing fbc")
  void testGetUpdatedFbcCookieCorrupt() {
    cookieUtils.setEtldPlusOneAndSubDomainIndex("test.bar.com", 2);
    CookieSetting result =
        cookieUtils.getUpdatedFbcCookie("fb1123456test123", "test456", updatedCookiesMap);
    assertThat(result).isNotNull();
    assertThat(result.getDomain()).isEqualTo("test.bar.com");
    String cookieValue = result.getValue();
    assertTrue(cookieValue.matches(String.format("^fb.2.[0-9]+.test456.%s$", APPENDIX_NET_NEW)));
  }

  @Test
  @DisplayName("Testing getUpdatedFbpCookie updated")
  void testGetUpdatedFbpCookieUpdate() {
    cookieUtils.setEtldPlusOneAndSubDomainIndex("bar.com", 1);
    Map<String, String[]> queries = new HashMap<String, String[]>();
    CookieSetting result = cookieUtils.getUpdatedFbpCookie(null, updatedCookiesMap);
    assertThat(result).isNotNull();
    assertThat(result.getName()).isEqualTo(Constants.FBP_COOKIE_NAME);
    assertThat(result.getDomain()).isEqualTo("bar.com");
    String cookieValue = result.getValue();
    assertTrue(
        cookieValue.matches(String.format("^fb\\.1\\.[0-9]+\\.[0-9]+\\.%s$", APPENDIX_NET_NEW)));
  }

  @Test
  @DisplayName("Testing getUpdatedFbpCookie exist - no new update")
  void testGetUpdatedFbpCookieKeepTheSame() {
    Map<String, String[]> queries = new HashMap<String, String[]>();
    CookieSetting result = cookieUtils.getUpdatedFbpCookie("fbp_test", updatedCookiesMap);
    assertThat(result).isNull();
  }

  @Test
  @DisplayName("Testing getNewFbcPayloadFromQuery with customized params config")
  void testGetNewFbcPayloadWithCustomizedParamsConfig() {
    CookieUtils cookieUtilsWithParamsConfig =
        new CookieUtils(
            new ArrayList<FbcParamConfig>(
                Arrays.asList(
                    new FbcParamConfig(Constants.FBCLID_STRING, "", Constants.CLICK_ID_STRING),
                    new FbcParamConfig("example", "test", "placeholder"))),
            SDK_VERSION);
    // Not needed query
    queryMap.put("whatevertest", new String[] {"test123"});
    assertThat(cookieUtilsWithParamsConfig.getNewFbcPayloadFromQuery(queryMap, null)).isNull();
    // Matched the customized params config
    queryMap.put("example", new String[] {"test123"});
    assertThat(cookieUtilsWithParamsConfig.getNewFbcPayloadFromQuery(queryMap, null))
        .isEqualTo("test_test123");
    // with fbclid
    assertThat(
            cookieUtilsWithParamsConfig.getNewFbcPayloadFromQuery(queryMap, "test.com?fbclid=bar"))
        .isEqualTo("bar_test_test123");
    queryMap.put(Constants.FBCLID_STRING, new String[] {"test456"});
    assertThat(
            cookieUtilsWithParamsConfig.getNewFbcPayloadFromQuery(queryMap, "test.com?fbclid=bar"))
        .isEqualTo("test456_test_test123");
    // duplication name
    queryMap.put(Constants.FBCLID_STRING, new String[] {"test456_test_abc"});
    assertThat(
            cookieUtilsWithParamsConfig.getNewFbcPayloadFromQuery(queryMap, "test.com?fbclid=bar"))
        .isEqualTo("test456_test_abc");
  }

  @Test
  @DisplayName("Testing different version number with different appendix")
  void testAppendixVersionNumber() {
    String V1_15_24_NET_NEW = "AQMCAQ8Y";
    CookieUtils cookieUtilsWithParamsConfig =
        new CookieUtils(
            new ArrayList<FbcParamConfig>(
                Arrays.asList(
                    new FbcParamConfig(Constants.FBCLID_STRING, "", Constants.CLICK_ID_STRING))),
            "1.15.24");
    // Same fbc value, no update
    CookieSetting fbcResult =
        cookieUtilsWithParamsConfig.getUpdatedFbcCookie(
            "fb.1.1234.sameFbcValue", "sameFbcValue", updatedCookiesMap);
    assertThat(fbcResult).isNull();

    CookieSetting fbpResult =
        cookieUtilsWithParamsConfig.getUpdatedFbpCookie(null, updatedCookiesMap);
    assertThat(fbpResult).isNotNull();
    String fbpValue = fbpResult.getValue();
    assertTrue(fbpValue.matches(String.format("^fb.0.[0-9]+.[0-9]+.%s$", V1_15_24_NET_NEW)));
  }
}
