<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;
require_once __DIR__ . '/../model/PlainDataObject.php';

use Throwable;
use FacebookAds\PlainDataObject;

class RequestAdaptor {

    /**
     * Extracts request data from global server variables or overrides.
     * * @param array|null $server_overrides
     * @return PlainDataObject
     */
    public static function extract($server_overrides = null): PlainDataObject {
        // 1. Initialize Defaults (matching PlainDataObject types)
        $host = "";
        $query_params = [];
        $cookies = [];
        $referer = null;          // Defaults to null for ?string
        $x_forwarded_for = null;    // Defaults to null for ?string
        $remote_address = null;    // Defaults to null for ?string

        try {
            // Use global server or override
            $server = $server_overrides ?? $_SERVER;

            if ($server) {
                // Extract Headers
                $host = $server['HTTP_HOST'] ?? '';
                $referer = $server['HTTP_REFERER'] ?? null;
                $x_forwarded_for = $server['HTTP_X_FORWARDED_FOR'] ?? null;
                $remote_address = $server['REMOTE_ADDR'] ?? null;

                // Extract Query Params
                // Priority: $_GET -> Parse QUERY_STRING
                if (!empty($_GET)) {
                    $query_params = $_GET;
                } elseif (!empty($server['QUERY_STRING'])) {
                    parse_str($server['QUERY_STRING'], $parsed);
                    if (is_array($parsed)) {
                        $query_params = $parsed;
                    }
                }

                // Extract Cookies
                // Priority: $_COOKIE -> Parse HTTP_COOKIE
                if (!empty($_COOKIE)) {
                    $cookies = $_COOKIE;
                } elseif (!empty($server['HTTP_COOKIE'])) {
                    $pairs = explode(';', $server['HTTP_COOKIE']);
                    foreach ($pairs as $pair) {
                        $parts = explode('=', trim($pair), 2);
                        if (count($parts) === 2) {
                            $cookies[$parts[0]] = urldecode($parts[1]);
                        }
                    }
                }
            }
        } catch (Throwable $t) {
            // Silently ignore exceptions and return the object with default values
        }

        // 2. Return the Data Object
        return new PlainDataObject(
            $host,
            $query_params,
            $cookies,
            $referer,
            $x_forwarded_for,
            $remote_address
        );
    }
}
