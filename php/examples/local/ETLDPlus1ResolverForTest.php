<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Example for etld+1 resolver.
// Provide etld+1 that best optimize your cookie setting.
// Ideally how it works,
// Eg. input:www.example.com. output: example.com
// Eg. Input: www.this.is.an.example.co.uk. Output: example.co.uk.
class ETLDPlus1ResolverForTest implements FacebookAds\ETLDPlus1Resolver {

    public function resolveETLDPlus1($domain) {
        // Your implementation
        return $domain;
    }
}

?>
