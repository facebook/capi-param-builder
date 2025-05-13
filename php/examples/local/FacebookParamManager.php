<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
require 'ETLDPlus1resolverForTest.php';

final class FacebookParamManager {
    private static $instance = null;

    private $paramBuilder;

    private function __construct() {
        // There're 3 options to get the builder
        // Option 1[Recommended]:
        // Provide a list of etld+1, we'll resolve by matching your input host.
        $this->paramBuilder = new FacebookAds\ParamBuilder(
            array('localhost','example.com', 'test.com'));
        // Option 2: we'll resolve the etld+1 based on your input host.
        // $this->paramBuilder = new FacebookAds\ParamBuilder();
        // Option 3:
        // Provide your customized etld+1 by implement ETLDPlus1Resolver
        // Check ETLDPlus1ResolverForTest.php for example.
        // $this->paramBuilder
        //    = new FacebookAds\ParamBuilder(new ETLDPlus1ResolverForTest());
    }
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new FacebookParamManager();
        }
        return self::$instance;
    }

    public function processThisRequest() {
        $this->paramBuilder->processRequest(
            $_SERVER['HTTP_HOST'],
            $_GET,
            $_COOKIE,
            $_SERVER['HTTP_REFERER'] ?? null
        );
        // Optional:
        // $this->paramBuilder->processRequest(
        //     $_SERVER['HTTP_HOST'],
        //     $_GET,
        //     $_COOKIE,
        // );

        // check cookies consent and write to cookie
        if ($this->hasCookiesConsent()) {
            foreach ($this->paramBuilder->getCookiesToSet() as $cookie) {
                setcookie(
                    $cookie->name,
                    $cookie->value,
                    time() + $cookie->max_age,
                    '/',
                    $cookie->domain
                );
                // Note: it should never be HttpOnly
            }
        }
        echo 'ParamBuilder output: <br/>'
            . 'getFbc: ' . $this->paramBuilder->getFbc() . '<br/>'
            . 'getFbp: ' . $this->paramBuilder->getFbp() . '<br/>';
    }

    public function getParamBuilder() {
        return $this->paramBuilder;
    }

    private function hasCookiesConsent() {
        return isset($_COOKIE['cookiesAccepted'])
            && $_COOKIE['cookiesAccepted'] === 'true';
    }
}

?>
