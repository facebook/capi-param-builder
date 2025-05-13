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
import com.facebook.capi.sdk.utils.CookieUtils;
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
  URIUtils uriUtils;
  CookieUtils cookieUtils = new CookieUtils(fbcParamConfigs);
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

  /** Constructor for ParamBuilder. Prefered domainList or ETLD+1 option for more accurate result */
  public ParamBuilder() {
    uriUtils = new URIUtils();
  }

  /**
   * For unit test only
   *
   * @param fbcParamConfigs configs
   */
  protected void setCookieUtils(List<FbcParamConfig> fbcParamConfigs) {
    this.cookieUtils = new CookieUtils(fbcParamConfigs);
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
}
