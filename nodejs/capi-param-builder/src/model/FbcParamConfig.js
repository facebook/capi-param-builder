/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
class FbcParamConfig {
    constructor(query, prefix, ebpPath) {
      this.query = query;
      this.prefix = prefix;
      this.ebpPath = ebpPath;
    }
  }
module.exports = FbcParamConfig;
