/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

public class PlainDataObjectTest {

  private static Map<String, List<String>> singleQueryParam(String key, String value) {
    Map<String, List<String>> params = new HashMap<>();
    params.put(key, Collections.singletonList(value));
    return params;
  }

  private static Map<String, String> singleCookie(String key, String value) {
    Map<String, String> cookies = new HashMap<>();
    cookies.put(key, value);
    return cookies;
  }

  @Nested
  @DisplayName("Backward compatibility — 6-param constructor")
  class SixParamConstructor {

    @Test
    @DisplayName("sets all original fields correctly")
    void setsAllOriginalFields() {
      Map<String, List<String>> queryParams = singleQueryParam("key", "value");
      Map<String, String> cookies = singleCookie("session", "abc123");

      PlainDataObject obj =
          new PlainDataObject(
              "example.com",
              queryParams,
              cookies,
              "https://referrer.com",
              "203.0.113.50",
              "10.0.0.1");

      assertThat(obj.getHost()).isEqualTo("example.com");
      assertThat(obj.getQueryParams()).isEqualTo(singleQueryParam("key", "value"));
      assertThat(obj.getCookies()).isEqualTo(singleCookie("session", "abc123"));
      assertThat(obj.getReferer()).isEqualTo("https://referrer.com");
      assertThat(obj.getXForwardedFor()).isEqualTo("203.0.113.50");
      assertThat(obj.getRemoteAddress()).isEqualTo("10.0.0.1");
    }

    @Test
    @DisplayName("defaults scheme to null")
    void defaultsSchemeToNull() {
      PlainDataObject obj = new PlainDataObject("example.com", null, null, null, null, null);

      assertThat(obj.getScheme()).isNull();
    }

    @Test
    @DisplayName("defaults requestUri to null")
    void defaultsRequestUriToNull() {
      PlainDataObject obj = new PlainDataObject("example.com", null, null, null, null, null);

      assertThat(obj.getRequestUri()).isNull();
    }

    @Test
    @DisplayName("new fields are null while original fields are fully populated")
    void newFieldsNullWithPopulatedOriginalFields() {
      Map<String, List<String>> queryParams = new HashMap<>();
      queryParams.put("fbclid", Collections.singletonList("abc"));
      queryParams.put("utm_source", Collections.singletonList("fb"));

      PlainDataObject obj =
          new PlainDataObject(
              "shop.example.com",
              queryParams,
              singleCookie("_fbp", "fb.1.123.456"),
              "https://facebook.com/ad",
              "2001:db8::1",
              "192.168.1.100");

      assertThat(obj.getScheme()).isNull();
      assertThat(obj.getRequestUri()).isNull();
      assertThat(obj.getHost()).isEqualTo("shop.example.com");
      assertThat(obj.getReferer()).isEqualTo("https://facebook.com/ad");
      assertThat(obj.getXForwardedFor()).isEqualTo("2001:db8::1");
      assertThat(obj.getRemoteAddress()).isEqualTo("192.168.1.100");
    }
  }

  @Nested
  @DisplayName("scheme — string behavior")
  class SchemeStringBehavior {

    @Test
    @DisplayName("scheme 'https' is stored as-is")
    void schemeHttps() {
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, "https", null);

      assertThat(obj.getScheme()).isEqualTo("https");
      assertThat(obj.getScheme()).isNotNull();
    }

    @Test
    @DisplayName("scheme 'http' is stored as-is")
    void schemeHttp() {
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, "http", null);

      assertThat(obj.getScheme()).isEqualTo("http");
      assertThat(obj.getScheme()).isNotNull();
    }

    @Test
    @DisplayName("scheme null remains null")
    void schemeNull() {
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, null, null);

      assertThat(obj.getScheme()).isNull();
    }
  }

  @Nested
  @DisplayName("requestUri — edge cases")
  class RequestUriEdgeCases {

    @Test
    @DisplayName("path with query string")
    void pathWithQueryString() {
      PlainDataObject obj =
          new PlainDataObject(
              "example.com", null, null, null, null, null, null, "/products?page=2&sort=price");

      assertThat(obj.getRequestUri()).isEqualTo("/products?page=2&sort=price");
    }

    @Test
    @DisplayName("special characters in query string (percent-encoded)")
    void specialCharacters() {
      String uri = "/path/to/page?key=val%20ue&foo=bar%26baz";
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, null, uri);

      assertThat(obj.getRequestUri()).isEqualTo(uri);
    }

    @Test
    @DisplayName("unicode path")
    void unicodePath() {
      String uri = "/produkte/schuhe/größe-42";
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, null, uri);

      assertThat(obj.getRequestUri()).isEqualTo(uri);
    }

    @Test
    @DisplayName("encoded unicode in query string")
    void encodedUnicode() {
      String uri = "/search?q=%E4%B8%AD%E6%96%87";
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, null, uri);

      assertThat(obj.getRequestUri()).isEqualTo(uri);
    }

    @Test
    @DisplayName("empty string is not null")
    void emptyStringIsNotNull() {
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, null, "");

      assertThat(obj.getRequestUri()).isNotNull();
      assertThat(obj.getRequestUri()).isEqualTo("");
    }

    @Test
    @DisplayName("null is not empty string")
    void nullIsNotEmptyString() {
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, null, null);

      assertThat(obj.getRequestUri()).isNull();
    }

    @Test
    @DisplayName("fragment and query string")
    void fragmentAndQueryString() {
      String uri = "/checkout?step=3&coupon=SAVE10#summary";
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, null, uri);

      assertThat(obj.getRequestUri()).isEqualTo(uri);
    }

    @Test
    @DisplayName("multiple slashes")
    void multipleSlashes() {
      String uri = "//admin///dashboard//";
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, null, uri);

      assertThat(obj.getRequestUri()).isEqualTo(uri);
    }

    @Test
    @DisplayName("dot segments preserved as-is")
    void dotSegments() {
      String uri = "/a/b/../c/./d";
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, null, uri);

      assertThat(obj.getRequestUri()).isEqualTo(uri);
    }

    @Test
    @DisplayName("very long URI preserved")
    void veryLongUri() {
      StringBuilder sb = new StringBuilder("/");
      for (int i = 0; i < 8000; i++) {
        sb.append('a');
      }
      sb.append("?param=");
      for (int i = 0; i < 2000; i++) {
        sb.append('b');
      }
      String uri = sb.toString();

      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, null, uri);

      assertThat(obj.getRequestUri()).isEqualTo(uri);
      assertThat(obj.getRequestUri().length()).isGreaterThan(10000);
    }
  }

  @Nested
  @DisplayName("Original fields unaffected by new fields")
  class OriginalFieldsUnaffected {

    @Test
    @DisplayName("8-param constructor preserves all original fields")
    void eightParamConstructorPreservesOriginalFields() {
      Map<String, List<String>> queryParams = new HashMap<>();
      queryParams.put("q", Collections.singletonList("shoes"));
      Map<String, String> cookies = singleCookie("cart", "xyz");

      PlainDataObject obj =
          new PlainDataObject(
              "store.example.com",
              queryParams,
              cookies,
              "https://google.com",
              "198.51.100.1",
              "172.16.0.1",
              "https",
              "/products/shoes?color=red");

      assertThat(obj.getHost()).isEqualTo("store.example.com");
      assertThat(obj.getQueryParams()).isEqualTo(singleQueryParam("q", "shoes"));
      assertThat(obj.getCookies()).isEqualTo(singleCookie("cart", "xyz"));
      assertThat(obj.getReferer()).isEqualTo("https://google.com");
      assertThat(obj.getXForwardedFor()).isEqualTo("198.51.100.1");
      assertThat(obj.getRemoteAddress()).isEqualTo("172.16.0.1");
    }
  }

  @Nested
  @DisplayName("Full 8-param construction")
  class EightParamConstructor {

    @Test
    @DisplayName("sets all 8 fields correctly")
    void setsAllFields() {
      Map<String, List<String>> queryParams = new HashMap<>();
      queryParams.put("fbclid", Collections.singletonList("click123"));
      queryParams.put("source", Collections.singletonList("ig"));
      Map<String, String> cookies = new HashMap<>();
      cookies.put("_fbp", "fb.1.111.222");
      cookies.put("consent", "yes");

      PlainDataObject obj =
          new PlainDataObject(
              "www.shop.example.com",
              queryParams,
              cookies,
              "https://instagram.com/p/abc",
              "203.0.113.50, 198.51.100.1",
              "10.0.0.50",
              "https",
              "/cart/checkout?step=payment");

      assertThat(obj.getHost()).isEqualTo("www.shop.example.com");
      assertThat(obj.getQueryParams().get("fbclid"))
          .isEqualTo(Collections.singletonList("click123"));
      assertThat(obj.getQueryParams().get("source")).isEqualTo(Collections.singletonList("ig"));
      assertThat(obj.getCookies().get("_fbp")).isEqualTo("fb.1.111.222");
      assertThat(obj.getCookies().get("consent")).isEqualTo("yes");
      assertThat(obj.getReferer()).isEqualTo("https://instagram.com/p/abc");
      assertThat(obj.getXForwardedFor()).isEqualTo("203.0.113.50, 198.51.100.1");
      assertThat(obj.getRemoteAddress()).isEqualTo("10.0.0.50");
      assertThat(obj.getScheme()).isEqualTo("https");
      assertThat(obj.getRequestUri()).isEqualTo("/cart/checkout?step=payment");
    }
  }

  @Nested
  @DisplayName("equals / hashCode / toString include new fields")
  class EqualsHashCodeToString {

    @Test
    @DisplayName("objects with same scheme and requestUri are equal")
    void equalObjects() {
      PlainDataObject a =
          new PlainDataObject("example.com", null, null, null, null, null, "https", "/path");
      PlainDataObject b =
          new PlainDataObject("example.com", null, null, null, null, null, "https", "/path");

      assertThat(a).isEqualTo(b);
      assertThat(a.hashCode()).isEqualTo(b.hashCode());
    }

    @Test
    @DisplayName("different scheme makes objects unequal")
    void differentScheme() {
      PlainDataObject a =
          new PlainDataObject("example.com", null, null, null, null, null, "https", "/path");
      PlainDataObject b =
          new PlainDataObject("example.com", null, null, null, null, null, "http", "/path");

      assertThat(a).isNotEqualTo(b);
    }

    @Test
    @DisplayName("different requestUri makes objects unequal")
    void differentRequestUri() {
      PlainDataObject a =
          new PlainDataObject("example.com", null, null, null, null, null, "https", "/path1");
      PlainDataObject b =
          new PlainDataObject("example.com", null, null, null, null, null, "https", "/path2");

      assertThat(a).isNotEqualTo(b);
    }

    @Test
    @DisplayName("null vs non-null scheme makes objects unequal")
    void nullVsNonNullScheme() {
      PlainDataObject a =
          new PlainDataObject("example.com", null, null, null, null, null, null, "/path");
      PlainDataObject b =
          new PlainDataObject("example.com", null, null, null, null, null, "https", "/path");

      assertThat(a).isNotEqualTo(b);
    }

    @Test
    @DisplayName("null vs non-null requestUri makes objects unequal")
    void nullVsNonNullRequestUri() {
      PlainDataObject a =
          new PlainDataObject("example.com", null, null, null, null, null, "https", null);
      PlainDataObject b =
          new PlainDataObject("example.com", null, null, null, null, null, "https", "/path");

      assertThat(a).isNotEqualTo(b);
    }

    @Test
    @DisplayName("toString includes scheme")
    void toStringIncludesScheme() {
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, "https", null);

      assertThat(obj.toString()).contains("scheme=https");
    }

    @Test
    @DisplayName("toString includes requestUri")
    void toStringIncludesRequestUri() {
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, null, "/foo?bar=1");

      assertThat(obj.toString()).contains("requestUri=/foo?bar=1");
    }

    @Test
    @DisplayName("toString includes null scheme")
    void toStringIncludesNullScheme() {
      PlainDataObject obj =
          new PlainDataObject("example.com", null, null, null, null, null, null, null);

      assertThat(obj.toString()).contains("scheme=null");
    }

    @Test
    @DisplayName("6-param objects with same fields are equal (both scheme/requestUri null)")
    void sixParamObjectsEqual() {
      PlainDataObject a = new PlainDataObject("example.com", null, null, null, null, null);
      PlainDataObject b = new PlainDataObject("example.com", null, null, null, null, null);

      assertThat(a).isEqualTo(b);
      assertThat(a.hashCode()).isEqualTo(b.hashCode());
    }
  }
}
