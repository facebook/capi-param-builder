<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
namespace FacebookAds;

class CookieSettings {
    public $name;
    public $value;
    public $max_age;
    public $domain;

    public function __construct($name, $value, $max_age, $domain) {
        $this->name = $name;
        $this->value = $value;
        $this->max_age = $max_age;
        $this->domain = $domain;
    }
}

?>
