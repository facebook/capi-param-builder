<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;

class PlainDataObject
{
    public string $host;
    public array $query_params; // Forces this to be an array (Map)
    public array $cookies;      // Forces this to be an array (Map)
    public ?string $referer;
    public ?string $x_forwarded_for;
    public ?string $remote_address;

    public function __construct(
        string $host,
        array $query_params,
        array $cookies,
        ?string $referer,
        ?string $x_forwarded_for,
        ?string $remote_address
    ) {
        $this->host = $host;
        $this->query_params = $query_params;
        $this->cookies = $cookies;
        $this->referer = $referer;
        $this->x_forwarded_for = $x_forwarded_for;
        $this->remote_address = $remote_address;
    }
}
