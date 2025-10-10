/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk.utils;

import com.facebook.capi.sdk.model.Constants;
import com.facebook.capi.sdk.model.CookieSetting;
import com.facebook.capi.sdk.model.FbcParamConfig;
import java.net.URI;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;

/** Util functions to help process and provide suggestions on the cookies */
public class CookieUtils {

  private List<FbcParamConfig> fbcParamConfigs;
  private String etldPlusOne;
  private int subDomainIndex = 0;
  // Appendix format constants
  private static final int DEFAULT_FORMAT = 0x01;
  private static final int LANGUAGE_TOKEN_INDEX = 0x03; // Java
  private static final int APPENDIX_LENGTH_V1 = 2;
  private static final int APPENDIX_LENGTH_V2 = 8;

  private final String APPENDIX_NEW;
  private final String APPENDIX_NORMAL;
  private final String VERSION;

  /**
   * Default settings for param configs
   *
   * @param fbcParamConfigs default setting configs
   * @param sdkVersion version of the sdk
   */
  public CookieUtils(List<FbcParamConfig> fbcParamConfigs, String sdkVersion) {
    this.fbcParamConfigs = fbcParamConfigs;
    this.VERSION = sdkVersion;
    this.APPENDIX_NEW = getAppendix(true);
    this.APPENDIX_NORMAL = getAppendix(false);
  }

  private String getAppendix(boolean isNew) {
    try {
      // Get version and split into major, minor, patch
      String[] versionParts = this.VERSION.split("\\.");
      int major = Integer.parseInt(versionParts[0]);
      int minor = Integer.parseInt(versionParts[1]);
      int patch = Integer.parseInt(versionParts[2]);

      // Create byte indicating if it's new (0x01) or not (0x00)
      int isNewByte = isNew ? 0x01 : 0x00;

      // Create byte array: [DEFAULT_FORMAT, LANGUAGE_TOKEN_INDEX, is_new_byte, major, minor, patch]
      byte[] bytes = {
        (byte) DEFAULT_FORMAT,
        (byte) LANGUAGE_TOKEN_INDEX,
        (byte) isNewByte,
        (byte) major,
        (byte) minor,
        (byte) patch
      };

      // Convert to base64 and make it URL-safe
      String base64 = Base64.getEncoder().encodeToString(bytes);
      String base64urlSafe = base64.replace("+", "-").replace("/", "_").replaceAll("=+$", "");

      return base64urlSafe;
    } catch (Exception e) {
      // Fallback to legacy language token if version parsing fails
      System.err.println("Warning: Failed to generate appendix, using fallback: " + e.getMessage());
      return Constants.LANGUAGE_TOKEN;
    }
  }

  /**
   * Set the default value for etldPlusOne and subdoainIndex
   *
   * @param etldPlusOne reset etld+1
   * @param subdoainIndex reset subdomain index
   */
  public void setEtldPlusOneAndSubDomainIndex(String etldPlusOne, int subdoainIndex) {
    this.etldPlusOne = etldPlusOne;
    this.subDomainIndex = subdoainIndex;
  }

  private void buildParamConfigs(StringBuilder builder, String query, String prefix, String value) {
    boolean isClickID = Constants.FBCLID_STRING.equals(query);
    String separator = isClickID ? "" : "_";

    // Prevent duplication
    if (!isClickID && builder.indexOf(separator + prefix + separator) != -1) {
      return;
    }
    if (builder.length() != 0) {
      builder.append(separator);
    }
    builder.append(prefix).append(separator).append(value);
  }

  /**
   * Preprocess cookies to make sure we have the correct language token. If not, update the cookie
   *
   * @param cookies Map of cookies. Key is cookie name, value is cookie value
   * @param cookieName Cookie name to be processed
   * @param updatedCookieMap A map to store updated cookies. key is the cookie name, value is
   *     CookieSettings. If cookie already exist and no need update, return null.
   * @return updated cookie value. Return null if current cookie value is empty or invalid.
   */
  public String preprocessCookies(
      Map<String, String> cookies, String cookieName, Map<String, CookieSetting> updatedCookieMap) {
    if (cookies == null || cookies.isEmpty()) {
      return null;
    }
    String cookieValue = cookies.get(cookieName);
    if (cookieValue == null) {
      return null;
    }
    // Validation check
    String[] split = cookieValue.split("\\.");
    int splitLength = split.length;
    if (splitLength < Constants.MIN_PAYLOAD_SPLIT_LENGTH
        || splitLength > Constants.MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_LENGTH) {
      return null;
    }

    // Invalid language token
    if (splitLength == Constants.MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_LENGTH) {
      String appendixValue = split[Constants.MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_LENGTH - 1];
      if (appendixValue.length() == APPENDIX_LENGTH_V1) {
        if (!Arrays.asList(Constants.SUPPORTED_LANGUAGES_TOKEN).contains(appendixValue)) {
          return null;
        }
      } else if (appendixValue.length() != APPENDIX_LENGTH_V2) {
        return null;
      }
    }

    if (splitLength == Constants.MIN_PAYLOAD_SPLIT_LENGTH) {
      // In Java, trailing delimiters will be ignored.
      // In case we have unexpected trailing extra dot.
      boolean containExtralDot = cookieValue.endsWith(".");
      String updatedCookie = cookieValue + (containExtralDot ? "" : ".") + this.APPENDIX_NORMAL;
      updatedCookieMap.put(
          cookieName,
          new CookieSetting(
              cookieName, updatedCookie, this.etldPlusOne, Constants.DEFAULT_1PC_AGE));
      return updatedCookie;
    }
    return cookieValue;
  }

  /**
   * Get the new fbc payload from query string and referrer.
   *
   * @param queries Map of query string
   * @param referrer full referrer url
   * @return new updated fbc payload
   */
  public String getNewFbcPayloadFromQuery(Map<String, String[]> queries, String referrer) {
    if (queries == null && referrer == null) {
      return null;
    }

    StringBuilder newFbcPayload = new StringBuilder();
    try {
      for (FbcParamConfig config : this.fbcParamConfigs) {
        if (queries != null && queries.containsKey(config.query)) {
          buildParamConfigs(
              newFbcPayload, config.query, config.prefix, queries.get(config.query)[0]);
        } else if (referrer != null && !referrer.trim().isEmpty()) {
          if (referrer.indexOf("://") == -1) {
            referrer = "http://" + referrer;
          }
          URI referralUrl = new URI(referrer);
          String queryString = referralUrl.getQuery();
          if (queryString != null && !queryString.trim().isEmpty()) {
            String[] queryPairs = queryString.split("&");
            for (String queryPair : queryPairs) {
              // 0 is key, 1 is value
              String[] keyValue = queryPair.split("=");
              if (config.query.equals(keyValue[0])) {
                buildParamConfigs(newFbcPayload, config.query, config.prefix, keyValue[1]);
              }
            }
          }
        }
      }
    } catch (Exception e) {
      System.err.println("Exception when handling referrer:" + e.getMessage());
    }

    if (newFbcPayload.length() != 0) {
      return newFbcPayload.toString();
    }
    return null;
  }

  /**
   * Check if we need update fbp cookie. If yes, update it and return the new fbp cookie.
   *
   * @param existingFbp existing fbp cookie value
   * @param updatedCookieMap A map to store updated cookies. key is the cookie name, value is
   *     CookieSettings. If cookie already exist and no need update, return null.
   * @return CookieSettings that should be updated. If cookie already exist and no need update
   *     return null.
   */
  public CookieSetting getUpdatedFbpCookie(
      String existingFbp, Map<String, CookieSetting> updatedCookieMap) {
    if (existingFbp == null || existingFbp.isEmpty() || existingFbp.trim().isEmpty()) {
      // Magic number is < Long. MAX_VALUE
      long newFbpPayload = Double.valueOf(Math.random() * 2147483647).longValue();
      long dropTs = new Date().getTime();
      String newFbp =
          new StringBuilder()
              .append("fb.")
              .append(this.subDomainIndex)
              .append(".")
              .append(dropTs)
              .append(".")
              .append(newFbpPayload)
              .append(".")
              .append(this.APPENDIX_NEW)
              .toString();
      CookieSetting fbpCookie =
          new CookieSetting(
              Constants.FBP_COOKIE_NAME, newFbp, this.etldPlusOne, Constants.DEFAULT_1PC_AGE);
      updatedCookieMap.put(Constants.FBP_COOKIE_NAME, fbpCookie);
      return fbpCookie;
    }
    return null;
  }

  /**
   * Check if we need update fbc cookie. If yes, update it and return the new fbc cookie.
   *
   * @param existingFbc existing fbc payload
   * @param newFbcPayload new fbc payload
   * @param updatedCookiesMap A map to store updated cookies. key is the cookie name, value is
   *     CookieSettings
   * @return CookieSettings that should be updated. If cookie already exist and no need update
   *     return null.
   */
  public CookieSetting getUpdatedFbcCookie(
      String existingFbc, String newFbcPayload, Map<String, CookieSetting> updatedCookiesMap) {
    // No update for current fbc cookie settings, stay the same.
    if (newFbcPayload == null || newFbcPayload.isEmpty()) {
      return null;
    }
    boolean updateCookie = false;
    // Check new cookie update
    if (existingFbc == null || existingFbc.isEmpty()) {
      updateCookie = true;
    } else {
      // extract payload
      String[] split = existingFbc.split("\\.");
      if (split.length < Constants.MIN_PAYLOAD_SPLIT_LENGTH) {
        updateCookie = true; // corrupt fbc, overwrite
      } else {
        updateCookie = !newFbcPayload.equals(split[3]);
      }
    }

    if (!updateCookie) { // No cookie update
      return null;
    }

    long dropTs = new Date().getTime();
    String fbc =
        new StringBuilder()
            .append("fb.")
            .append(this.subDomainIndex)
            .append(".")
            .append(dropTs)
            .append(".")
            .append(newFbcPayload)
            .append(".")
            .append(this.APPENDIX_NEW)
            .toString();

    CookieSetting fbcCookie =
        new CookieSetting(
            Constants.FBC_COOKIE_NAME, fbc, this.etldPlusOne, Constants.DEFAULT_1PC_AGE);
    updatedCookiesMap.put(Constants.FBC_COOKIE_NAME, fbcCookie);
    return fbcCookie;
  }
}
