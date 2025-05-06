/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk.model;

/** Constants for the CAPI Param Builder SDK */
public class Constants {
  // Configs
  /** Default cookie exists TTL: 90 days */
  public static final int DEFAULT_1PC_AGE = 90 * 24 * 3600;

  /** Param builder library language token of Java */
  public static final String LANGUAGE_TOKEN = "Aw";

  /** Validation check on the minimal payload split lenth */
  public static final int MIN_PAYLOAD_SPLIT_LENGTH = 4;

  /** Validation check on the max payload split lenth */
  public static final int MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_LENGTH = 5;

  /** Supported language token for capi param builder SDK */
  public static final String[] SUPPORTED_LANGUAGES_TOKEN = {"AQ", "Ag", "Aw", "BA", "BQ", "Bg"};

  // regex
  /** Regular expression on ipv4 */
  public static final String IPV4_REGEX = "^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}$";

  /** Regular expression on ipv6 */
  public static final String IPV6_SEG_REGEX = "^([0-9a-fA-F]{0,4}:)+";

  // String names
  /** Cookie name `_fbc` */
  public static final String FBC_COOKIE_NAME = "_fbc";

  /** Cookie name `_fbp` */
  public static final String FBP_COOKIE_NAME = "_fbp";

  /** Query params name representing clickID */
  public static final String FBCLID_STRING = "fbclid";

  /** ClickID string */
  public static final String CLICK_ID_STRING = "clickID";
}
