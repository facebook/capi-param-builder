/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk;

import com.google.common.net.InternetDomainName;

// This is an example to implement your own ETLDPlusOneResolver
public class DefaultETLDPlusOneResolver implements ETLDPlusOneResolver {
  @Override
  public String resolve(String domain) {
    // ETLD+1
    // https://guava.dev/releases/snapshot-jre/api/docs/com/google/common/net/InternetDomainName.html#topPrivateDomain()
    InternetDomainName etldPlusOne = InternetDomainName.from(domain).topPrivateDomain();
    return etldPlusOne.toString() == null ? domain : etldPlusOne.toString();
  }
}
