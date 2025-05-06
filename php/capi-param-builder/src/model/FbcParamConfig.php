<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
namespace FacebookAds;

class FbcParamConfig {
    public $query;
    public $prefix;
    public $ebp_path;

    public function __construct($query, $prefix, $ebp_path) {
        $this->query = $query;
        $this->prefix = $prefix;
        $this->ebp_path = $ebp_path;
    }
}
?>
