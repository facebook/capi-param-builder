<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;
require_once __DIR__ . '/VersionProvider.php';
require_once __DIR__ . '/../model/Constants.php';

class AppendixProvider {
    public static function getAppendix($appendix_type) {
        try {
            $sdk_version = VersionProvider::getVersion();

            // Invalid version format
            if (!preg_match('/^\d+(\.\d+){2}$/', $sdk_version)) {
                return LANGUAGE_TOKEN;
            }

            $version_parts = explode('.', $sdk_version);
            $major = intval($version_parts[0]);
            $minor = intval($version_parts[1]);
            $patch = intval($version_parts[2]);

            // Create byte indicating if it's new (0x01) or not (0x00)
            $is_new_byte = in_array(
                $appendix_type,
                [APPENDIX_NET_NEW, APPENDIX_GENERAL_NEW, APPENDIX_MODIFIED_NEW]
            ) ? $appendix_type : 0x00;

            // Create byte array:
            // [DEFAULT_FORMAT, LANGUAGE_TOKEN_INDEX, is_new_byte, major, minor,
            // patch]
            $bytes = pack('C*',
                DEFAULT_FORMAT,
                LANGUAGE_TOKEN_INDEX,
                $is_new_byte,
                $major,
                $minor,
                $patch
            );
            // Convert to base64 and make it URL-safe
            $base64 = base64_encode($bytes);
            $base64url_safe = str_replace(
                ['+', '/', '='],
                ['-', '_', ''],
                $base64
            );

            return $base64url_safe;
        } catch (Exception $e) {
            // Fallback to legacy language token if version parsing fails
            ini_set('log_errors', 1);
            error_log(
                "Warning: Failed to generate appendix, using fallback: ".
                $e->getMessage()
            );
            return LANGUAGE_TOKEN;
        }
    }
}
