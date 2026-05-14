/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk.utils;

import static org.assertj.core.api.Assertions.assertThat;

import com.facebook.capi.sdk.model.PlainDataObject;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

public class RequestContextAdaptorTest {

  // ---------------------------------------------------------------------------
  // Test fixtures: minimal stand-ins so the reflection-based adaptor can
  // detect the shape (Servlet / WebFlux) without any real Servlet / Spring jar
  // on the classpath.
  // ---------------------------------------------------------------------------

  /** Stand-in for HttpServletRequest. Only declares the methods the adaptor reflects on. */
  static class FakeServletRequest {
    private final Map<String, String> headers;
    private final String queryString;
    private final String remoteAddr;
    private final FakeCookie[] cookies;

    FakeServletRequest(
        Map<String, String> headers, String queryString, String remoteAddr, FakeCookie[] cookies) {
      this.headers = headers == null ? Collections.<String, String>emptyMap() : headers;
      this.queryString = queryString;
      this.remoteAddr = remoteAddr;
      this.cookies = cookies;
    }

    public String getHeader(String name) {
      // Servlet headers are case-insensitive; mirror that.
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

    public String getRemoteAddr() {
      return remoteAddr;
    }

    public FakeCookie[] getCookies() {
      return cookies;
    }
  }

  static class FakeCookie {
    private final String name;
    private final String value;

    FakeCookie(String name, String value) {
      this.name = name;
      this.value = value;
    }

    public String getName() {
      return name;
    }

    public String getValue() {
      return value;
    }
  }

  /** Stand-in for org.springframework.http.HttpHeaders.getFirst(String). */
  static class FakeHttpHeaders {
    private final Map<String, String> first;

    FakeHttpHeaders(Map<String, String> first) {
      this.first = first;
    }

    public String getFirst(String name) {
      for (Map.Entry<String, String> e : first.entrySet()) {
        if (e.getKey().equalsIgnoreCase(name)) {
          return e.getValue();
        }
      }
      return null;
    }
  }

  /** Stand-in for java.net.URI exposing only getRawQuery(). */
  static class FakeUri {
    private final String rawQuery;

    FakeUri(String rawQuery) {
      this.rawQuery = rawQuery;
    }

    public String getRawQuery() {
      return rawQuery;
    }
  }

  static class FakeWebFluxCookie {
    private final String name;
    private final String value;

    FakeWebFluxCookie(String name, String value) {
      this.name = name;
      this.value = value;
    }

    public String getName() {
      return name;
    }

    public String getValue() {
      return value;
    }
  }

  /** Stand-in for ServerHttpRequest. */
  static class FakeWebFluxRequest {
    private final FakeHttpHeaders headers;
    private final FakeUri uri;
    private final String remoteAddress;
    private final Map<String, List<FakeWebFluxCookie>> cookies;

    FakeWebFluxRequest(
        FakeHttpHeaders headers,
        FakeUri uri,
        String remoteAddress,
        Map<String, List<FakeWebFluxCookie>> cookies) {
      this.headers = headers;
      this.uri = uri;
      this.remoteAddress = remoteAddress;
      this.cookies = cookies;
    }

    public FakeHttpHeaders getHeaders() {
      return headers;
    }

    public FakeUri getURI() {
      return uri;
    }

    public String getRemoteAddress() {
      return remoteAddress;
    }

    public Map<String, List<FakeWebFluxCookie>> getCookies() {
      return cookies;
    }
  }

  // ---------------------------------------------------------------------------
  // Basics
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("extract(null) returns empty defaults")
  void testExtractNull() {
    PlainDataObject result = RequestContextAdaptor.extract(null);
    assertThat(result).isNotNull();
    assertThat(result.host).isEqualTo("");
    assertThat(result.queryParams).isEmpty();
    assertThat(result.cookies).isEmpty();
    assertThat(result.referer).isNull();
    assertThat(result.xForwardedFor).isNull();
    assertThat(result.remoteAddress).isNull();
  }

  @Test
  @DisplayName("extract(PlainDataObject) returns the same instance")
  void testExtractPlainDataObjectPassthrough() {
    PlainDataObject input =
        new PlainDataObject(
            "example.com",
            Collections.singletonMap("k", Collections.singletonList("v")),
            Collections.singletonMap("c", "v"),
            "https://r.com",
            "1.2.3.4",
            "5.6.7.8");
    PlainDataObject result = RequestContextAdaptor.extract(input);
    assertThat(result).isSameAs(input);
  }

  @Test
  @DisplayName("extract(unsupported type) returns empty defaults")
  void testExtractUnsupportedType() {
    for (Object bad : new Object[] {"a string", Integer.valueOf(42), new Object()}) {
      PlainDataObject result = RequestContextAdaptor.extract(bad);
      assertThat(result.host).isEqualTo("");
      assertThat(result.referer).isNull();
    }
  }

  // ---------------------------------------------------------------------------
  // Map / environ strategy
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("Map: extract host, referer, xff, remote_address from environ keys")
  void testMapAllHeaders() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_HOST", "api.example.com");
    env.put("HTTP_REFERER", "https://referrer.com");
    env.put("HTTP_X_FORWARDED_FOR", "8.8.8.8");
    env.put("REMOTE_ADDR", "10.0.0.1");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.host).isEqualTo("api.example.com");
    assertThat(result.referer).isEqualTo("https://referrer.com");
    assertThat(result.xForwardedFor).isEqualTo("8.8.8.8");
    assertThat(result.remoteAddress).isEqualTo("10.0.0.1");
  }

  @Test
  @DisplayName("Map: empty optional headers coalesce to null")
  void testMapEmptyOptionalHeadersAreNull() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_HOST", "");
    env.put("HTTP_REFERER", "");
    env.put("HTTP_X_FORWARDED_FOR", "");
    env.put("REMOTE_ADDR", "");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.host).isEqualTo("");
    assertThat(result.referer).isNull();
    assertThat(result.xForwardedFor).isNull();
    assertThat(result.remoteAddress).isNull();
  }

  @Test
  @DisplayName("Map: empty hash returns empty defaults")
  void testMapEmpty() {
    PlainDataObject result = RequestContextAdaptor.extract(new HashMap<String, String>());
    assertThat(result.host).isEqualTo("");
    assertThat(result.queryParams).isEmpty();
    assertThat(result.cookies).isEmpty();
  }

  // ---------------------------------------------------------------------------
  // Query string parsing
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("Query: repeated keys preserved as List (matches Python parse_qs / Ruby CGI.parse)")
  void testQueryRepeatedKeysPreserved() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("QUERY_STRING", "tag=a&tag=b&tag=c");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.queryParams.get("tag")).containsExactly("a", "b", "c");
  }

  @Test
  @DisplayName("Query: percent escapes are URL-decoded")
  void testQueryUrlDecodes() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("QUERY_STRING", "name=John%20Doe&email=test%40example.com");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.queryParams.get("name")).containsExactly("John Doe");
    assertThat(result.queryParams.get("email")).containsExactly("test@example.com");
  }

  @Test
  @DisplayName("Query: empty value preserved (?empty=&normal=value)")
  void testQueryEmptyValuePreserved() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("QUERY_STRING", "empty=&normal=value");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.queryParams.get("empty")).containsExactly("");
    assertThat(result.queryParams.get("normal")).containsExactly("value");
  }

  @Test
  @DisplayName("Query: empty string returns empty map")
  void testQueryEmptyString() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("QUERY_STRING", "");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.queryParams).isEmpty();
  }

  // ---------------------------------------------------------------------------
  // Cookie parsing (manual: split on first =, preserve +, per-pair isolation)
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("Cookie: literal `+` is preserved (not converted to space)")
  void testCookiePreservesLiteralPlus() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_COOKIE", "token=abc+def==; jwt=eyJ+payload");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.cookies.get("token")).isEqualTo("abc+def==");
    assertThat(result.cookies.get("jwt")).isEqualTo("eyJ+payload");
  }

  @Test
  @DisplayName("Cookie: base64 padding preserved by split-on-first-=")
  void testCookieBase64Padding() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_COOKIE", "_fbc=fb.1.123.YWJjZA==; _fbp=fb.1.456.7890");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.cookies.get("_fbc")).isEqualTo("fb.1.123.YWJjZA==");
    assertThat(result.cookies.get("_fbp")).isEqualTo("fb.1.456.7890");
  }

  @Test
  @DisplayName("Cookie: key trimmed independently of value (`name = value`)")
  void testCookieKeyTrimmedIndependently() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_COOKIE", "name = value ; other  =  thing");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.cookies.get("name")).isEqualTo("value");
    assertThat(result.cookies.get("other")).isEqualTo("thing");
  }

  @Test
  @DisplayName("Cookie: pair without `=` is skipped")
  void testCookieNoEqualsSkipped() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_COOKIE", "valid=value; invalid_no_equals; another=test");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.cookies.get("valid")).isEqualTo("value");
    assertThat(result.cookies.get("another")).isEqualTo("test");
    assertThat(result.cookies).doesNotContainKey("invalid_no_equals");
  }

  @Test
  @DisplayName("Cookie: empty key (orphan `=value`) is skipped")
  void testCookieEmptyKeySkipped() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_COOKIE", "=orphan_value; valid=value");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.cookies.get("valid")).isEqualTo("value");
    assertThat(result.cookies).doesNotContainKey("");
  }

  @Test
  @DisplayName("Cookie: per-pair isolation keeps _fbc/_fbp when neighbor decode throws (%ZZ)")
  void testCookiePerPairIsolation() {
    // %ZZ is invalid hex — URLDecoder throws IllegalArgumentException.
    // Per-pair try/catch must keep the valid cookies.
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_COOKIE", "_fbp=fb.1.111.222; corrupt=%ZZ; _fbc=fb.1.333.abc");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.cookies.get("_fbp")).isEqualTo("fb.1.111.222");
    assertThat(result.cookies.get("_fbc")).isEqualTo("fb.1.333.abc");
  }

  @Test
  @DisplayName("Cookie: URL-encoded values are decoded (and `+` still preserved)")
  void testCookieUrlDecodesValuesPreservingPlus() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_COOKIE", "encoded=hello%20world; special=a%3Db%26c%3Dd");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.cookies.get("encoded")).isEqualTo("hello world");
    assertThat(result.cookies.get("special")).isEqualTo("a=b&c=d");
  }

  @Test
  @DisplayName("Cookie: empty header returns empty map")
  void testCookieEmptyHeader() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_COOKIE", "");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.cookies).isEmpty();
  }

  // ---------------------------------------------------------------------------
  // Servlet strategy (via reflection on FakeServletRequest)
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("Servlet: full extraction via reflection (headers / query / cookies)")
  void testServletStrategyFullExtraction() {
    Map<String, String> headers = new HashMap<String, String>();
    headers.put("Host", "api.example.com");
    headers.put("Referer", "https://r.com");
    headers.put("X-Forwarded-For", "8.8.8.8");
    FakeCookie[] cookies =
        new FakeCookie[] {
          new FakeCookie("_fbp", "fb.1.111.222"), new FakeCookie("_fbc", "fb.1.333.abc"),
        };
    FakeServletRequest req =
        new FakeServletRequest(headers, "fbclid=test123&utm=facebook", "10.0.0.1", cookies);
    PlainDataObject result = RequestContextAdaptor.extract(req);
    assertThat(result.host).isEqualTo("api.example.com");
    assertThat(result.referer).isEqualTo("https://r.com");
    assertThat(result.xForwardedFor).isEqualTo("8.8.8.8");
    assertThat(result.remoteAddress).isEqualTo("10.0.0.1");
    assertThat(result.queryParams.get("fbclid")).containsExactly("test123");
    assertThat(result.queryParams.get("utm")).containsExactly("facebook");
    assertThat(result.cookies.get("_fbp")).isEqualTo("fb.1.111.222");
    assertThat(result.cookies.get("_fbc")).isEqualTo("fb.1.333.abc");
  }

  @Test
  @DisplayName("Servlet: empty optional headers coalesce to null")
  void testServletEmptyHeadersAreNull() {
    Map<String, String> headers = new HashMap<String, String>();
    headers.put("Referer", "");
    headers.put("X-Forwarded-For", "");
    FakeServletRequest req = new FakeServletRequest(headers, null, "", null);
    PlainDataObject result = RequestContextAdaptor.extract(req);
    assertThat(result.referer).isNull();
    assertThat(result.xForwardedFor).isNull();
    assertThat(result.remoteAddress).isNull();
  }

  @Test
  @DisplayName("Servlet: getCookies()=null falls back to manual Cookie-header parse")
  void testServletNullCookiesFallsBackToHeaderParse() {
    Map<String, String> headers = new HashMap<String, String>();
    // Manual fallback runs only when getCookies() returns null.
    headers.put("Cookie", "_fbp=fb.1.111.222; token=abc+def==");
    FakeServletRequest req = new FakeServletRequest(headers, null, null, null);
    PlainDataObject result = RequestContextAdaptor.extract(req);
    assertThat(result.cookies.get("_fbp")).isEqualTo("fb.1.111.222");
    // Manual parser preserves literal `+`.
    assertThat(result.cookies.get("token")).isEqualTo("abc+def==");
  }

  // ---------------------------------------------------------------------------
  // WebFlux strategy (via reflection on FakeWebFluxRequest)
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("WebFlux: full extraction via reflection (HttpHeaders.getFirst + URI + cookies)")
  void testWebFluxStrategyFullExtraction() {
    Map<String, String> first = new HashMap<String, String>();
    first.put("Host", "webflux.example.com");
    first.put("Referer", "https://r.com");
    first.put("X-Forwarded-For", "8.8.8.8");
    Map<String, List<FakeWebFluxCookie>> cookies = new HashMap<String, List<FakeWebFluxCookie>>();
    cookies.put("_fbp", Arrays.asList(new FakeWebFluxCookie("_fbp", "fb.1.111.222")));
    cookies.put("_fbc", Arrays.asList(new FakeWebFluxCookie("_fbc", "fb.1.333.abc")));
    FakeWebFluxRequest req =
        new FakeWebFluxRequest(
            new FakeHttpHeaders(first), new FakeUri("fbclid=webfluxTest"), "10.0.0.1", cookies);
    PlainDataObject result = RequestContextAdaptor.extract(req);
    assertThat(result.host).isEqualTo("webflux.example.com");
    assertThat(result.referer).isEqualTo("https://r.com");
    assertThat(result.xForwardedFor).isEqualTo("8.8.8.8");
    assertThat(result.remoteAddress).isEqualTo("10.0.0.1");
    assertThat(result.queryParams.get("fbclid")).containsExactly("webfluxTest");
    assertThat(result.cookies.get("_fbp")).isEqualTo("fb.1.111.222");
    assertThat(result.cookies.get("_fbc")).isEqualTo("fb.1.333.abc");
  }

  // ---------------------------------------------------------------------------
  // Robustness / Meta-cookie smoke tests
  // ---------------------------------------------------------------------------

  @Test
  @DisplayName("Repeated extract calls produce consistent results")
  void testConsistentRepeatedCalls() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_HOST", "consistent.example.com");
    env.put("REMOTE_ADDR", "8.8.8.8");
    PlainDataObject r1 = RequestContextAdaptor.extract(env);
    PlainDataObject r2 = RequestContextAdaptor.extract(env);
    assertThat(r1.host).isEqualTo(r2.host);
    assertThat(r1.remoteAddress).isEqualTo(r2.remoteAddress);
  }

  @Test
  @DisplayName("Meta cookies _fbp / _fbc / fbclid extracted correctly together")
  void testMetaCookiesAndFbclid() {
    Map<String, String> env = new HashMap<String, String>();
    env.put("HTTP_COOKIE", "_fbp=fb.1.123.456; _fbc=fb.1.789.abc");
    env.put("QUERY_STRING", "fbclid=IwAR3xYz_test_fbclid_value");
    PlainDataObject result = RequestContextAdaptor.extract(env);
    assertThat(result.cookies.get("_fbp")).isEqualTo("fb.1.123.456");
    assertThat(result.cookies.get("_fbc")).isEqualTo("fb.1.789.abc");
    assertThat(result.queryParams.get("fbclid")).containsExactly("IwAR3xYz_test_fbclid_value");
  }
}
