/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk.model;

/** Default config query params */
public class FbcParamConfig {
  /** URL query name */
  public String query;

  /** Query's prefix */
  public String prefix;

  /** EBP path */
  public String ebpPath;

  /**
   * Set default configs
   *
   * @param query query param's name
   * @param prefix query's prefix
   * @param ebpPath ebp path
   */
  public FbcParamConfig(String query, String prefix, String ebpPath) {
    this.query = query;
    this.prefix = prefix;
    this.ebpPath = ebpPath;
  }
}
