/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk;

// This is for localhost demo
public class TestETLDPlusOneResolver implements ETLDPlusOneResolver {
  @Override
  public String resolve(String domain) {
    return domain;
  }
}
