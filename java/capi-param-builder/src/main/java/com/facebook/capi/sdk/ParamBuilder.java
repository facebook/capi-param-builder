/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk;

import com.facebook.capi.sdk.model.Constants;
import com.facebook.capi.sdk.model.CookieSetting;
import com.facebook.capi.sdk.model.FbcParamConfig;
import com.facebook.capi.sdk.model.PlainDataObject;
import com.facebook.capi.sdk.model.Version;
import com.facebook.capi.sdk.utils.CookieUtils;
import com.facebook.capi.sdk.utils.RequestContextAdaptor;
import com.facebook.capi.sdk.utils.URIUtils;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Core function to help process Conversions API params */
public class ParamBuilder {
  private List<FbcParamConfig> fbcParamConfigs =
      new ArrayList<FbcParamConfig>(
          Arrays.asList(
              new FbcParamConfig(Constants.FBCLID_STRING, "", Constants.CLICK_ID_STRING)));

  private String fbc;
  private String fbp;
  private String referrerUrl;
  private String eventSourceUrl;
  URIUtils uriUtils;
  CookieUtils cookieUtils = new CookieUtils(fbcParamConfigs, Version.VERSION);
  List<CookieSetting> cookiesToSet;

  /**
   * Constructor for ParamBuilder. The domainlist helps provide more accurate results for
   * CookieSetting's domain value
   *
   * @param domainList list of ETLD+1 associated with website URLs
   */
  public ParamBuilder(List<String> domainList) {
    uriUtils = new URIUtils(domainList);
  }

  /**
   * Constructor for ParamBuilder. The customized ETLD+1 resolver helps provide more accurate
   * results for CookieSetting's domain value
   *
   * @param etldPlus1Resolver customized etldPlus1Resolver which implement the interface of
   *     ETLDPlusOneResolver
   */
  public ParamBuilder(ETLDPlusOneResolver etldPlus1Resolver) {
    uriUtils = new URIUtils(etldPlus1Resolver);
  }

  /**
   * Constructor for ParamBuilder. Preferred domainList or ETLD+1 option for more accurate result
   */
  public ParamBuilder() {
    uriUtils = new URIUtils();
  }

  /**
   * For unit test only
   *
   * @param fbcParamConfigs configs
   * @param sdkVersion current SDK version
   */
  protected void setCookieUtils(List<FbcParamConfig> fbcParamConfigs, String sdkVersion) {
    this.cookieUtils = new CookieUtils(fbcParamConfigs, sdkVersion);
  }

  /**
   * Process and provide recommended cookies to save.
   *
   * @param host Current full url. eg. test.example.com
   * @param queries Current query params in map format
   * @param cookies Current cookies in map format
   * @return A list of CookieSettings recommended to save
   */
  public List<CookieSetting> processRequest(
      String host, Map<String, String[]> queries, Map<String, String> cookies) {
    return processRequest(host, queries, cookies, null);
  }

  /**
   * Process and provide recommended cookies to save.
   *
   * @param host Current full url. eg. test.example.com
   * @param queries Current query params in map format
   * @param cookies Current cookies in map format
   * @param referrer Full url with query params from referrer.
   * @return A list of CookieSettings recommended to save
   */
  public List<CookieSetting> processRequest(
      String host, Map<String, String[]> queries, Map<String, String> cookies, String referrer) {
    this.referrerUrl = referrer;
    if (this.referrerUrl != null && !this.referrerUrl.isEmpty()) {
      this.referrerUrl = this.referrerUrl + "." + this.cookieUtils.getAppendixNoChange();
    }
    this.eventSourceUrl = null;
    Map<String, CookieSetting> updatedCookiesMap = new HashMap<>();
    cookiesToSet = null; // reset cookiesToSet
    // Get etld+1 and subdomain index
    this.uriUtils.resetEtldPlusOne();
    String etldPlusOne = this.uriUtils.computeETLDPlusOneForHost(host);
    int subDomainIndex = this.uriUtils.getSubDomainIndex();
    cookieUtils.setEtldPlusOneAndSubDomainIndex(etldPlusOne, subDomainIndex);

    // capture existing cookies
    this.fbc =
        this.cookieUtils.preprocessCookies(cookies, Constants.FBC_COOKIE_NAME, updatedCookiesMap);
    this.fbp =
        this.cookieUtils.preprocessCookies(cookies, Constants.FBP_COOKIE_NAME, updatedCookiesMap);

    // Get new payload from query
    String newFbcPayload = this.cookieUtils.getNewFbcPayloadFromQuery(queries, referrer);

    // fbc
    CookieSetting updatedFbcCookie =
        this.cookieUtils.getUpdatedFbcCookie(this.fbc, newFbcPayload, updatedCookiesMap);
    if (updatedFbcCookie != null) {
      this.fbc = updatedFbcCookie.getValue();
    }
    // Set fbp if not exists
    CookieSetting updatedFbpCookie =
        this.cookieUtils.getUpdatedFbpCookie(this.fbp, updatedCookiesMap);
    if (updatedFbpCookie != null) {
      this.fbp = updatedFbpCookie.getValue();
    }
    cookiesToSet = new ArrayList<CookieSetting>(updatedCookiesMap.values());
    return cookiesToSet;
  }

  /**
   * Process and provide recommended cookies from a request-like context object.
   *
   * <p>Accepts either a {@link PlainDataObject} (used directly) or any framework request / Map that
   * {@link RequestContextAdaptor} knows how to extract from (Servlet HttpServletRequest, Spring
   * WebFlux ServerHttpRequest, raw environ-style Map, or null). Mirrors the {@code
   * processRequestFromContext} method in the JS / PHP / Python / Ruby SDKs.
   *
   * <p>Note: {@link PlainDataObject} carries {@code xForwardedFor} and {@code remoteAddress} for
   * cross-language parity, but the Java {@code ParamBuilder} does not yet implement client-IP
   * attribution; those fields are extracted by the adapter but ignored here.
   *
   * @param context the request object (Servlet / WebFlux / Map / PlainDataObject) or {@code null}
   * @return A list of CookieSettings recommended to save
   */
  public List<CookieSetting> processRequestFromContext(Object context) {
    PlainDataObject data =
        context instanceof PlainDataObject
            ? (PlainDataObject) context
            : RequestContextAdaptor.extract(context);
    List<CookieSetting> result =
        processRequest(data.host, toStringArrayMap(data.queryParams), data.cookies, data.referer);
    this.eventSourceUrl = constructEventSourceUrl(data);
    return result;
  }

  /**
   * Convert {@code Map<String, List<String>>} (PlainDataObject's cross-language query shape) into
   * the {@code Map<String, String[]>} shape that {@link #processRequest} expects.
   */
  private static Map<String, String[]> toStringArrayMap(Map<String, List<String>> queryParams) {
    if (queryParams == null || queryParams.isEmpty()) {
      return new HashMap<String, String[]>();
    }
    Map<String, String[]> result = new HashMap<String, String[]>(queryParams.size());
    for (Map.Entry<String, List<String>> e : queryParams.entrySet()) {
      List<String> values = e.getValue();
      // Skip keys with no values; downstream CookieUtils indexes [0] without a
      // length guard, so an empty array would suppress the referer fallback.
      if (values == null || values.isEmpty()) {
        continue;
      }
      result.put(e.getKey(), values.toArray(new String[0]));
    }
    return result;
  }

  /**
   * Return a list of CookieSttings Only return the cookies we recommended to update. If you already
   * have the cookie properly set, no need to update. It won't get returned here.
   *
   * @return list of CookieSetting
   */
  public List<CookieSetting> getCookiesToSet() {
    if (this.cookiesToSet == null) {
      return new ArrayList<CookieSetting>();
    }
    return this.cookiesToSet;
  }

  /**
   * Return fbc value
   *
   * @return fbc
   */
  public String getFbc() {
    return this.fbc;
  }

  /**
   * Return fbp value
   *
   * @return fbp
   */
  public String getFbp() {
    return this.fbp;
  }

  /**
   * Return referrerUrl value
   *
   * @return referrerUrl
   */
  public String getReferrerUrl() {
    return this.referrerUrl;
  }

  /**
   * Return eventSourceUrl value
   *
   * @return eventSourceUrl
   */
  public String getEventSourceUrl() {
    return this.eventSourceUrl;
  }

  private String constructEventSourceUrl(PlainDataObject data) {
    if (data == null
        || data.host == null
        || data.host.isEmpty()
        || data.scheme == null
        || data.scheme.isEmpty()) {
      return null;
    }
    String url = data.scheme + "://" + data.host;
    if (data.requestUri != null && !data.requestUri.isEmpty()) {
      url += data.requestUri;
    }
    if (url != null && !url.isEmpty()) {
      url = url + "." + this.cookieUtils.getAppendixNetNew();
    }
    return url;
  }
}
