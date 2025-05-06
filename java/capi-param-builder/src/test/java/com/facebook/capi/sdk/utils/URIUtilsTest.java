/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk.utils;

import static org.assertj.core.api.Assertions.assertThat;

import com.facebook.capi.sdk.TestETLDPlusOneResolver;
import java.util.Arrays;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

public class URIUtilsTest {
  URIUtils defaultUriUtils = new URIUtils();

  @Test
  @DisplayName("Testing computeETLDPlusOneForHost with valid resolver")
  void testComputeETLDPlusOneForHostValidResolver() {
    URIUtils uriUtils = new URIUtils(new TestETLDPlusOneResolver());
    uriUtils.computeETLDPlusOneForHost("www.test.example.com");
    assertThat(uriUtils.getHost()).isEqualTo("www.test.example.com");
    assertThat(uriUtils.getEtldPlusOne()).isEqualTo("www.test.example.com");
    assertThat(uriUtils.getSubDomainIndex()).isEqualTo(3);
  }

  @Test
  @DisplayName("Testing computeETLDPlusOneForHost with domain list")
  void testComputeETLDPlusOneForHostDomainList() {
    URIUtils uriUtils = new URIUtils(Arrays.asList("example.com", "test.com"));
    uriUtils.computeETLDPlusOneForHost("https://www.test.example.com");
    assertThat(uriUtils.getHost()).isEqualTo("https://www.test.example.com");
    assertThat(uriUtils.getEtldPlusOne()).isEqualTo("example.com");
    assertThat(uriUtils.getSubDomainIndex()).isEqualTo(1);

    // Invalid match
    uriUtils.computeETLDPlusOneForHost("example.test.balabala.com");
    assertThat(uriUtils.getEtldPlusOne()).isEqualTo("test.balabala.com");
    assertThat(uriUtils.getSubDomainIndex()).isEqualTo(2);

    // Partial match
    uriUtils.computeETLDPlusOneForHost("example.123test.com");
    assertThat(uriUtils.getEtldPlusOne()).isEqualTo("123test.com");
    assertThat(uriUtils.getSubDomainIndex()).isEqualTo(1);
  }

  @Test
  @DisplayName("Testing computeETLDPlusOneForHost with invalid domain list")
  void testComputeETLDPlusOneForInvalidHostDomainList() {
    URIUtils uriUtils =
        new URIUtils(Arrays.asList("example.com", "test.com", "whatever://invalid.com#segments?"));
    // no matched, fall into default
    uriUtils.computeETLDPlusOneForHost("www.test.invalid.com");
    assertThat(uriUtils.getHost()).isEqualTo("www.test.invalid.com");
    assertThat(uriUtils.getEtldPlusOne()).isEqualTo("test.invalid.com");
    assertThat(uriUtils.getSubDomainIndex()).isEqualTo(2);

    // Matched with valid domainlist
    uriUtils.computeETLDPlusOneForHost("example.test.com");
    assertThat(uriUtils.getEtldPlusOne()).isEqualTo("test.com");
    assertThat(uriUtils.getHost()).isEqualTo("example.test.com");
    assertThat(uriUtils.getSubDomainIndex()).isEqualTo(1);

    // Invalid input
    uriUtils.computeETLDPlusOneForHost("invalid://example.test.balabala.com");
    assertThat(uriUtils.getEtldPlusOne()).isEqualTo(null);
    assertThat(uriUtils.getHost()).isEqualTo("invalid://example.test.balabala.com");
    assertThat(uriUtils.getSubDomainIndex()).isEqualTo(0);
  }

  @Test
  @DisplayName(
      "Testing computeETLDPlusOneForHost with special type and" + " TestETLDPlusOneResolver")
  void testComputeETLDPlusOneForHostValidDomainWithPortNumber() {
    // If use DefaultETLDPlusOneResolver for this case, will through exception since ::1 is not a
    // valid domain
    defaultUriUtils.computeETLDPlusOneForHost("[::1]:8080");
    assertThat(defaultUriUtils.getHost()).isEqualTo("[::1]:8080");
    assertThat(defaultUriUtils.getEtldPlusOne()).isEqualTo("[::1]");
    assertThat(defaultUriUtils.getSubDomainIndex()).isEqualTo(0);
  }

  @Test
  @DisplayName("Testing computeETLDPlusOneForHost with valid ipv4 address")
  void testComputeETLDPlusOneForHostValidIpv4Address() {
    defaultUriUtils.computeETLDPlusOneForHost("192.168.0.1");
    assertThat(defaultUriUtils.getHost()).isEqualTo("192.168.0.1");
    assertThat(defaultUriUtils.getEtldPlusOne()).isEqualTo("192.168.0.1");
    assertThat(defaultUriUtils.getSubDomainIndex()).isEqualTo(0);
  }

  @Test
  @DisplayName("Testing computeETLDPlusOneForHost with valid ipv6 address")
  void testComputeETLDPlusOneForHostValidIpv6Address() {
    defaultUriUtils.computeETLDPlusOneForHost("[2001:db8:4006:812::200e]");
    assertThat(defaultUriUtils.getHost()).isEqualTo("[2001:db8:4006:812::200e]");
    assertThat(defaultUriUtils.getEtldPlusOne()).isEqualTo("[2001:db8:4006:812::200e]");
    assertThat(defaultUriUtils.getSubDomainIndex()).isEqualTo(0);
  }

  @Test
  @DisplayName("Testing extractHostFromHttpHost")
  void testExtractHostFromHttpHost() {
    assertThat(
            defaultUriUtils.extractHostFromHttpHost(
                "https://www.test.example.com#balabala?test=123&test2=456"))
        .isEqualTo("www.test.example.com");
    assertThat(defaultUriUtils.extractHostFromHttpHost("192.168.1.1#segments?test=123"))
        .isEqualTo("192.168.1.1");
    assertThat(
            defaultUriUtils.extractHostFromHttpHost(
                "[2001:0db8:85a3:0000:0000:8a2e:0370:7334]#segments?test=123"))
        .isEqualTo("[2001:0db8:85a3:0000:0000:8a2e:0370:7334]");
    assertThat(
            defaultUriUtils.extractHostFromHttpHost(
                "http://example.com:8080/docs/resource.html?name=value#section"))
        .isEqualTo("example.com");
    assertThat(
            defaultUriUtils.extractHostFromHttpHost(
                "ftp://example.com:8080/docs/resource.html?name=value#section"))
        .isEqualTo("example.com");
    assertThat(
            defaultUriUtils.extractHostFromHttpHost(
                "badProtocol://example.com:8080/docs/resource.html?name=value#section"))
        .isEqualTo(null);
  }

  @Test
  @DisplayName("Testing isIPAddress")
  void testIsIPAddress() {
    assertThat(defaultUriUtils.isIPAddress("192.168.1.1")).isTrue();
    assertThat(defaultUriUtils.isIPAddress("[2001:0db8:85a3:0000:0000:8a2e:0370:7334]")).isTrue();
    assertThat(defaultUriUtils.isIPAddress("[::1]")).isTrue();
    assertThat(defaultUriUtils.isIPAddress("123.test.456")).isFalse();
    assertThat(defaultUriUtils.isIPAddress("123.234.456")).isFalse();
  }
}
