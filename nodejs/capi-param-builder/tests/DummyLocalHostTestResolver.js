/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
class DummyLocalHostTestResolver {
    constructor(hostname = null) {
        this.hostname = hostname;
    }

    resolveETLDPlus1(hostname) {
        if (this.hostname) {
            return this.hostname;
        }
        return hostname;
    }
}

module.exports = {
    DummyLocalHostTestResolver
}
