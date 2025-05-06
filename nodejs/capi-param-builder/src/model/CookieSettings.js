/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
class CookieSettings {
    constructor(name, value, maxAge, domain) {
      this.name = name;
      this.value = value;
      this.maxAge = maxAge;
      this.domain = domain;
    }
  }
module.exports = CookieSettings;
