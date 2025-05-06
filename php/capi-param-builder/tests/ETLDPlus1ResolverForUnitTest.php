<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
use FacebookAds\ETLDPlus1Resolver;

class ETLDPlus1ResolverForUnitTest implements ETLDPlus1Resolver {
    public function resolveETLDPlus1($domain) {
       return $domain;
    }
}

?>
