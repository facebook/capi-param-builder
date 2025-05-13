/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk.model;

/** Cookie setting class to contains all cookie related information */
public class CookieSetting {
  /** Cookie's name */
  public String name;

  /** Cookie's value */
  public String value;

  /** Cookie's domain */
  public String domain;

  /** Cookie's TTL */
  public int maxAge;

  /**
   * CookieSettings
   *
   * @param name name of the cookie
   * @param value value of the cookie
   * @param domain domain of the cookie
   * @param maxAge TTL of the coookie
   */
  public CookieSetting(String name, String value, String domain, int maxAge) {
    this.name = name;
    this.value = value;
    this.domain = domain;
    this.maxAge = maxAge;
  }

  /**
   * Name of current cookie
   *
   * @return cookie's name
   */
  public String getName() {
    return name;
  }

  /**
   * Value of current cookie
   *
   * @return cookie's value
   */
  public String getValue() {
    return value;
  }

  /**
   * Domain that cookie best fit in. The ETLD+1 for current input URL.
   *
   * @return ETLD+1 domain for the url
   */
  public String getDomain() {
    return domain;
  }

  /**
   * Max age for the cookie
   *
   * @return The TTL for the cookie
   */
  public int getMaxAge() {
    return maxAge;
  }
}
