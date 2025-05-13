/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
const psl = require('psl');

// Example for resolve etldPlus1 by depending on a 3rd party lib psl.
// This is just an example how to build your customized etldPlus1 resolver.
class DefaultETLDPlus1Resolver {
    constructor(hostname = null) {
        this.public_suffixes = null;
        this.hostname = hostname;
    }

    resolveETLDPlus1(hostname) {
        // resolve to eTLD+1
        if (this.public_suffixes === null) {
            if (this.hostname === null) {
                this.public_suffixes = this.parseHostName(hostname);
            } else {
                this.public_suffixes = this.parseHostName(this.hostname);
            }
        }
        return this.public_suffixes;
    }

    parseHostName(hostname) {
        const parse = psl.parse(hostname);
        return parse.domain;
    }
}

module.exports = {
    DefaultETLDPlus1Resolver
}
