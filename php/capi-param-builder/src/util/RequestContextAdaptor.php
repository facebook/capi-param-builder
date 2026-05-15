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

class RequestContextAdaptor
{

    /**
     * Extracts request data from global server variables or overrides.
     * * @param array|null $server_overrides
     * @return PlainDataObject
     */
    public static function extract($server_overrides = null): PlainDataObject
    {
        // 1. Initialize Defaults (matching PlainDataObject types)
        $host = "";
        $query_params = [];
        $cookies = [];
        $referer = null;          // Defaults to null for ?string
        $x_forwarded_for = null;    // Defaults to null for ?string
        $remote_address = null;    // Defaults to null for ?string
        $scheme = null;           // Defaults to null for ?string
        $request_uri = null;      // Defaults to null for ?string

        try {
            // MERGE LOGIC:
            // 1. Start with the global $_SERVER data (fallback).
            // 2. Overwrite with provided overrides (priority).
            // array_merge ensures that keys in the second array overwrite the first,
            // but keys missing from the second are kept from the first.
            $global_server = $_SERVER ?? [];
            $overrides = (is_array($server_overrides) && !empty($server_overrides))
                ? $server_overrides
                : [];

            $server = array_merge($global_server, $overrides);

            if ($server) {
                // Extract Headers. Coalesce empty strings to null for the
                // optional fields so behavior matches JS / Python / Ruby.
                $host = $server['HTTP_HOST'] ?? '';
                $referer = !empty($server['HTTP_REFERER'])
                    ? $server['HTTP_REFERER'] : null;
                $x_forwarded_for = !empty($server['HTTP_X_FORWARDED_FOR'])
                    ? $server['HTTP_X_FORWARDED_FOR'] : null;
                $remote_address = !empty($server['REMOTE_ADDR'])
                    ? $server['REMOTE_ADDR'] : null;

                // Extract scheme
                if (!empty($server['REQUEST_SCHEME'])) {
                    $scheme = strtolower($server['REQUEST_SCHEME']);
                } else {
                    $https_value = $server['HTTPS'] ?? '';
                    $scheme = (!empty($https_value) && strtolower($https_value) !== 'off')
                        ? 'https'
                        : 'http';
                }

                // Extract Request URI
                $request_uri = $server['REQUEST_URI'] ?? null;

                // Extract Query Params.
                // Priority: merged $server (which respects overrides) ->
                // $_GET as a last-resort fallback. This honors the documented
                // "overrides take priority" contract.
                if (!empty($server['QUERY_STRING'])) {
                    parse_str($server['QUERY_STRING'], $query_params);
                } elseif (!empty($_GET)) {
                    $query_params = $_GET;
                }

                // Extract Cookies.
                // Always prefer manual parsing of HTTP_COOKIE because PHP
                // populates $_COOKIE by urldecoding (which converts `+` to
                // space). For base64 / JWT-style values this corrupts the
                // payload, so we only fall back to $_COOKIE when no raw
                // cookie header is available.
                if (!empty($server['HTTP_COOKIE'])) {
                    $pairs = explode(';', $server['HTTP_COOKIE']);
                    foreach ($pairs as $pair) {
                        $parts = explode('=', $pair, 2);
                        if (count($parts) !== 2) {
                            continue;
                        }
                        $key = trim($parts[0]);
                        if ($key === '') {
                            continue;
                        }
                        // rawurldecode preserves literal `+`; urldecode does not.
                        $cookies[$key] = rawurldecode(trim($parts[1]));
                    }
                } elseif (!empty($_COOKIE)) {
                    // NOTE: PHP has already urldecoded $_COOKIE at request
                    // population time, so any literal `+` in cookie values
                    // has already become a space. Documented limitation.
                    $cookies = $_COOKIE;
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
            $remote_address,
            $scheme,
            $request_uri
        );
    }
}
