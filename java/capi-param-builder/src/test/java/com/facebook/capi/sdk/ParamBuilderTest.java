/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.facebook.capi.sdk.model.Constants;
import com.facebook.capi.sdk.model.CookieSetting;
import com.facebook.capi.sdk.model.FbcParamConfig;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

public class ParamBuilderTest {
  ParamBuilder builder;

  Map<String, String> requestCookieMap = new HashMap<String, String>();

  @BeforeEach
  void setup() {
    builder = new ParamBuilder(new TestETLDPlusOneResolver());
    requestCookieMap.put(Constants.FBC_COOKIE_NAME, "fb.1.1234.fbcTest");
    requestCookieMap.put(Constants.FBP_COOKIE_NAME, "fb.2.3456.fbpTest");
  }

  @Test
  @DisplayName("Testing ParamBuilder.processRequest null input. fbp updated")
  void testProcessRequestNullInput() {
    Map<String, String[]> queries = new HashMap<String, String[]>();
    List<CookieSetting> result = builder.processRequest("localhost", queries, null);
    assertThat(result).isNotNull();
    assertThat(result.size()).isEqualTo(1);
    assertThat(result.get(0).getName()).isEqualTo(Constants.FBP_COOKIE_NAME);
    ParamBuilderTest.assertCookieSettingList(result, builder.getCookiesToSet());
  }

  @Test
  @DisplayName(
      "Testing ParamBuilder.processRequest when cookie contains fbp and fbc, but no update from"
          + " query param, should keep the same - no update")
  void testProcessRequestFbpExistWithLanguageTokenUpdate() {
    Map<String, String[]> queries = new HashMap<String, String[]>();
    Map<String, String> requestCookieMap = new HashMap<String, String>();
    requestCookieMap.put(Constants.FBC_COOKIE_NAME, "fb.1.1234.fbcTest.Aw");
    requestCookieMap.put(Constants.FBP_COOKIE_NAME, "fb.2.3456.fbpTest.Aw");
    List<CookieSetting> result = builder.processRequest("localhost", queries, requestCookieMap);
    assertThat(result).isNotNull();
    assertThat(result.size()).isEqualTo(0);
    assertThat(builder.getFbc()).isEqualTo("fb.1.1234.fbcTest.Aw");
    assertThat(builder.getFbp()).isEqualTo("fb.2.3456.fbpTest.Aw");
    ParamBuilderTest.assertCookieSettingList(result, builder.getCookiesToSet());
  }

  @Test
  @DisplayName(
      "Testing ParamBuilder.processRequest when cookie contains fbp and fbc w/o language token,"
          + " append language token")
  void testProcessRequestFbpExist() {
    Map<String, String[]> queries = new HashMap<String, String[]>();
    List<CookieSetting> result = builder.processRequest("localhost", queries, requestCookieMap);
    assertThat(result).isNotNull();
    assertThat(result.size()).isEqualTo(2);
    assertThat(builder.getFbc()).isEqualTo("fb.1.1234.fbcTest.Aw");
    assertThat(builder.getFbp()).isEqualTo("fb.2.3456.fbpTest.Aw");
    ParamBuilderTest.assertCookieSettingList(result, builder.getCookiesToSet());
  }

  @Test
  @DisplayName("Testing ParamBuilder.processRequest both cookies update")
  void testProcessRequestCookieUpdate() {
    Map<String, String[]> queries = new HashMap<String, String[]>();
    queries.put("fbclid", new String[] {"test456"});
    List<CookieSetting> result = builder.processRequest("localhost", queries, null);
    assertThat(result.size()).isEqualTo(2);
    for (CookieSetting cookie : result) {
      if (cookie.getName().equals(Constants.FBC_COOKIE_NAME)) {
        assertThat(cookie.getValue()).contains(".test456");
        assertThat(cookie.getDomain()).isEqualTo("localhost");
      } else if (cookie.getName().equals(Constants.FBP_COOKIE_NAME)) {
        assertThat(cookie.getValue()).contains("fb.");
      }
    }
    ParamBuilderTest.assertCookieSettingList(result, builder.getCookiesToSet());
  }

  @Test
  @DisplayName("Testing ParamBuilder.processRequest when config fbcParamConfigs changes")
  void testProcessRequestFbcParamConfigChanges() {
    List<FbcParamConfig> fbcParamConfigs =
        new ArrayList<FbcParamConfig>(
            Arrays.asList(
                new FbcParamConfig("fbclid", "", "clickID"),
                new FbcParamConfig("query", "test", "whatevertest")));
    builder.setCookieUtils(fbcParamConfigs);
    Map<String, String[]> queries = new HashMap<String, String[]>();
    queries.put("fbclid", new String[] {"test456"});
    queries.put("query", new String[] {"test123"});
    List<CookieSetting> result = builder.processRequest("localhost", queries, null);
    assertThat(result.size()).isEqualTo(2);
    for (CookieSetting cookie : result) {
      if (cookie.getName().equals(Constants.FBC_COOKIE_NAME)) {
        assertThat(cookie.getValue()).contains(".test456_test_test123.Aw");
        assertThat(cookie.getDomain()).isEqualTo("localhost");
      } else if (cookie.getName().equals(Constants.FBP_COOKIE_NAME)) {
        assertThat(cookie.getValue()).contains("fb.");
        assertThat(cookie.getValue()).contains(".Aw");
      }
    }
    ParamBuilderTest.assertCookieSettingList(result, builder.getCookiesToSet());
  }

  @Test
  @DisplayName("Get getFbc, getFbp as expected from cookie")
  void testGetFbcGetFbp() {
    Map<String, String[]> queries = new HashMap<String, String[]>();
    builder.processRequest("localhost", queries, this.requestCookieMap);
    String fbc = builder.getFbc();
    String fbp = builder.getFbp();
    // With language token
    assertThat(fbc).isEqualTo(requestCookieMap.get(Constants.FBC_COOKIE_NAME) + ".Aw");
    assertThat(fbp).isEqualTo(requestCookieMap.get(Constants.FBP_COOKIE_NAME) + ".Aw");
  }

  @Test
  @DisplayName("Invalid cookie, update fbc and fbp")
  void testGetFbcGetFbpWhenCookieInvalid() {
    Map<String, String[]> queries = new HashMap<String, String[]>();
    queries.put(Constants.FBCLID_STRING, new String[] {"test456"});
    Map<String, String> requestCookieMapDemo = new HashMap<String, String>();
    requestCookieMapDemo.put(Constants.FBC_COOKIE_NAME, "fb.1.1234.");
    builder.processRequest("localhost", queries, requestCookieMapDemo);
    String fbc = builder.getFbc();
    String fbp = builder.getFbp();
    assertThat(fbc).contains(".test456.Aw");
    assertThat(fbp).contains(".Aw");
  }

  @Test
  @DisplayName("Get getFbc from query param, while cookie is null")
  void testGetFbcGetFbpFromQueries() {
    Map<String, String[]> queries = new HashMap<String, String[]>();
    queries.put(Constants.FBCLID_STRING, new String[] {"test456"});
    builder.processRequest("localhost", queries, null);
    String fbc = builder.getFbc();
    String fbp = builder.getFbp();
    assertThat(fbc).contains("test456");
    assertThat(fbp).isNotNull();
  }

  @Test
  @DisplayName("Test getFbc, getFbp when queries and cookies are nonnull. Update fbc, keep fbp")
  void testGetFbcGetFbpFromQueriesAndCookie() {
    Map<String, String[]> queries = new HashMap<String, String[]>();
    queries.put(Constants.FBCLID_STRING, new String[] {"test456"});
    builder.processRequest("localhost", queries, this.requestCookieMap);
    String fbc = builder.getFbc();
    String fbp = builder.getFbp();
    assertThat(fbc).contains(".test456.Aw");
    assertThat(fbp).isEqualTo(requestCookieMap.get(Constants.FBP_COOKIE_NAME) + ".Aw");
  }

  @Test
  @DisplayName("Contains existing cookies. GetFbc is valid, but getFbp is invalid")
  void testGetFbcGetFbpWithInvalidCookie() {
    Map<String, String> existingCookie = new HashMap<String, String>();
    requestCookieMap.put(Constants.FBC_COOKIE_NAME, "fb.1.1234.fbcTest.");
    requestCookieMap.put(Constants.FBP_COOKIE_NAME, "fb.2.3456.fbpTest.balabala");
    builder.processRequest("localhost", null, this.requestCookieMap);
    String fbc = builder.getFbc();
    String fbp = builder.getFbp();
    assertThat(fbc).isEqualTo("fb.1.1234.fbcTest.Aw");
    assertTrue(fbp.matches("^fb.0.[0-9]+.[0-9]+.Aw$"));
  }

  @Test
  @DisplayName("processRequest test with protocol in domain list")
  void testProcessRequestWithDomainList() {
    ParamBuilder defaultBuilder = new ParamBuilder(Arrays.asList("https://example.com:8080"));
    List<CookieSetting> result =
        defaultBuilder.processRequest("beta.example.com", null, null, "test.com?fbclid=test123");
    assertThat(result.size()).isEqualTo(2);
    for (CookieSetting cookie : result) {
      if (cookie.getName().equals("_fbc")) {
        assertThat(cookie.getValue()).contains(".test123");
        assertThat(cookie.getDomain()).isEqualTo("example.com");
      } else if (cookie.getName().equals("_fbp")) {
        assertThat(cookie.getValue()).contains("fb.");
      }
    }
    ParamBuilderTest.assertCookieSettingList(result, defaultBuilder.getCookiesToSet());
  }

  @Test
  @DisplayName("processRequest test with empty constructor, and http referer")
  void testProcessRequestWithEmptyConstructor() {
    ParamBuilder defaultBuilder = new ParamBuilder();
    Map<String, String[]> queries = new HashMap<String, String[]>();
    queries.put(Constants.FBCLID_STRING, new String[] {"test456"});
    List<CookieSetting> result =
        defaultBuilder.processRequest(
            "https://test.beta.example.com", queries, null, "test.com?fbclid=test123");
    assertThat(result.size()).isEqualTo(2);
    for (CookieSetting cookie : result) {
      if (cookie.getName().equals(Constants.FBC_COOKIE_NAME)) {
        assertThat(cookie.getValue()).contains(".test456");
        assertThat(cookie.getDomain()).isEqualTo("beta.example.com");
      } else if (cookie.getName().equals(Constants.FBP_COOKIE_NAME)) {
        assertThat(cookie.getValue()).contains("fb.");
      }
    }
    ParamBuilderTest.assertCookieSettingList(result, defaultBuilder.getCookiesToSet());
  }

  @Test
  @DisplayName("Testing processRequest with both query params and http referer")
  void testProcessRequestWithQueryParamsAndReferer() {
    Map<String, String[]> queries = new HashMap<String, String[]>();
    queries.put(Constants.FBCLID_STRING, new String[] {"test456"});
    ParamBuilder testBuilder = new ParamBuilder(Arrays.asList("example.com", "test.com"));
    List<CookieSetting> result =
        testBuilder.processRequest(
            "https://test.demo.example.com", queries, null, "test.com?fbclid=test123");
    assertThat(result.size()).isEqualTo(2);
    for (CookieSetting cookie : result) {
      if (cookie.getName().equals(Constants.FBC_COOKIE_NAME)) {
        assertThat(cookie.getValue()).contains(".test456");
        assertThat(cookie.getDomain()).isEqualTo("example.com");
      } else if (cookie.getName().equals(Constants.FBP_COOKIE_NAME)) {
        assertThat(cookie.getValue()).contains("fb.");
      }
    }
    ParamBuilderTest.assertCookieSettingList(result, testBuilder.getCookiesToSet());
  }

  static void assertCookieSettingList(
      List<CookieSetting> comparedList, List<CookieSetting> expectedList) {
    assertThat(comparedList.size()).isEqualTo(expectedList.size());
    for (int i = 0; i < comparedList.size(); i++) {
      CookieSetting compared = comparedList.get(i);
      CookieSetting expected = expectedList.get(i);
      assertThat(compared.getName()).isEqualTo(expected.getName());
      assertThat(compared.getValue()).isEqualTo(expected.getValue());
      assertThat(compared.getDomain()).isEqualTo(expected.getDomain());
      assertThat(compared.getMaxAge()).isEqualTo(expected.getMaxAge());
    }
  }
}
