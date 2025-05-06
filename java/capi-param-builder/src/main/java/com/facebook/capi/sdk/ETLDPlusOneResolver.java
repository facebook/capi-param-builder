/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk;

/*
 * Interface for customized ETLDPlusOneResolver
 * This is optional config.
 * User could config their own logic to resolve the ETLD+1.
 */
public interface ETLDPlusOneResolver {
  /**
   * Resolve ETLD+1 This resolved ETLD+1 will be used to provide domain value from CookieSettings
   *
   * @param domain input URL. Example: www.test.this.is.example.com
   * @return Resolved etld+1. The resolved ETLD+1 should be example.com
   */
  public String resolve(String domain);
}
