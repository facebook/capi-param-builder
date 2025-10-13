<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;

class VersionProvider {
  public static function getVersion() {
    $composer_json_path = __DIR__ . '/../../composer.json';
    if (file_exists($composer_json_path)) {
      $composer_content = file_get_contents($composer_json_path);
      $composer_data = json_decode($composer_content, true);
      if (isset($composer_data['version'])) {
        $version = $composer_data['version'];
        return $version;
      }
    }
    return "";
  }
}
