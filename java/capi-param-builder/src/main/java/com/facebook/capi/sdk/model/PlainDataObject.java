/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Plain data object representing the request inputs needed by the param builder (host, query
 * params, cookies, and optional headers).
 *
 * <p>Mirrors the equivalent classes in the JS / PHP / Python / Ruby SDKs so that a single shape is
 * shared across languages.
 *
 * <p>The map / list inputs are defensively copied at construction time so that later mutations on
 * the original collections do not affect this instance, and vice versa.
 */
public class PlainDataObject {
  /**
   * Host header value (e.g. "www.example.com" or "example.com:8080"). Never null; empty string when
   * absent.
   */
  public String host;

  /**
   * Parsed query parameters. Repeated keys are preserved as multi-element lists, matching the
   * Python / Ruby SDKs (e.g. {@code ?tag=a&amp;tag=b} -&gt; {@code {"tag": ["a", "b"]}}). Never
   * null; empty map when absent.
   */
  public Map<String, List<String>> queryParams;

  /**
   * Parsed cookies. Cookie names are unique per RFC 6265, so a flat map is used. Never null; empty
   * map when absent.
   */
  public Map<String, String> cookies;

  /** Referer header value, or null if absent. */
  public String referer;

  /** X-Forwarded-For header value, or null if absent. */
  public String xForwardedFor;

  /** Remote address (peer IP), or null if unavailable. */
  public String remoteAddress;

  /** URL scheme (e.g. "http" or "https"), or null if unavailable. */
  public String scheme;

  /** Request URI (path + query string, e.g. "/foo?bar=1"), or null if unavailable. */
  public String requestUri;

  /**
   * @param host Host header value; null is coerced to empty string
   * @param queryParams Parsed query parameters; null is coerced to empty map. Defensively
   *     deep-copied.
   * @param cookies Parsed cookies; null is coerced to empty map. Defensively shallow-copied.
   * @param referer Referer header (nullable)
   * @param xForwardedFor X-Forwarded-For header (nullable)
   * @param remoteAddress Remote peer address (nullable)
   */
  public PlainDataObject(
      String host,
      Map<String, List<String>> queryParams,
      Map<String, String> cookies,
      String referer,
      String xForwardedFor,
      String remoteAddress) {
    this(host, queryParams, cookies, referer, xForwardedFor, remoteAddress, null, null);
  }

  /**
   * @param host Host header value; null is coerced to empty string
   * @param queryParams Parsed query parameters; null is coerced to empty map. Defensively
   *     deep-copied.
   * @param cookies Parsed cookies; null is coerced to empty map. Defensively shallow-copied.
   * @param referer Referer header (nullable)
   * @param xForwardedFor X-Forwarded-For header (nullable)
   * @param remoteAddress Remote peer address (nullable)
   * @param scheme URL scheme (nullable)
   * @param requestUri Request URI — path + query string (nullable)
   */
  public PlainDataObject(
      String host,
      Map<String, List<String>> queryParams,
      Map<String, String> cookies,
      String referer,
      String xForwardedFor,
      String remoteAddress,
      String scheme,
      String requestUri) {
    this.host = host == null ? "" : host;
    this.queryParams = copyQueryParams(queryParams);
    this.cookies = cookies == null ? new HashMap<>() : new HashMap<>(cookies);
    this.referer = referer;
    this.xForwardedFor = xForwardedFor;
    this.remoteAddress = remoteAddress;
    this.scheme = scheme;
    this.requestUri = requestUri;
  }

  private static Map<String, List<String>> copyQueryParams(Map<String, List<String>> source) {
    if (source == null) {
      return new HashMap<>();
    }
    Map<String, List<String>> copy = new HashMap<>(source.size());
    for (Map.Entry<String, List<String>> e : source.entrySet()) {
      List<String> values = e.getValue();
      copy.put(e.getKey(), values == null ? null : new ArrayList<>(values));
    }
    return copy;
  }

  public String getHost() {
    return host;
  }

  public Map<String, List<String>> getQueryParams() {
    return queryParams;
  }

  public Map<String, String> getCookies() {
    return cookies;
  }

  public String getReferer() {
    return referer;
  }

  public String getXForwardedFor() {
    return xForwardedFor;
  }

  public String getRemoteAddress() {
    return remoteAddress;
  }

  public String getScheme() {
    return scheme;
  }

  public String getRequestUri() {
    return requestUri;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof PlainDataObject)) {
      return false;
    }
    PlainDataObject other = (PlainDataObject) o;
    return Objects.equals(host, other.host)
        && Objects.equals(queryParams, other.queryParams)
        && Objects.equals(cookies, other.cookies)
        && Objects.equals(referer, other.referer)
        && Objects.equals(xForwardedFor, other.xForwardedFor)
        && Objects.equals(remoteAddress, other.remoteAddress)
        && Objects.equals(scheme, other.scheme)
        && Objects.equals(requestUri, other.requestUri);
  }

  @Override
  public int hashCode() {
    return Objects.hash(
        host, queryParams, cookies, referer, xForwardedFor, remoteAddress, scheme, requestUri);
  }

  @Override
  public String toString() {
    return "PlainDataObject{host="
        + host
        + ", queryParams="
        + queryParams
        + ", cookies="
        + cookies
        + ", referer="
        + referer
        + ", xForwardedFor="
        + xForwardedFor
        + ", remoteAddress="
        + remoteAddress
        + ", scheme="
        + scheme
        + ", requestUri="
        + requestUri
        + '}';
  }
}
