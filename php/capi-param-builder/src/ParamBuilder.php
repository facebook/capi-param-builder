<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
namespace FacebookAds;
require 'model/Constants.php';
require 'model/FbcParamConfig.php';
require 'model/CookieSettings.php';

final class ParamBuilder {
    private $fbc_param_configs;
    private $etld_plus1_resolver;
    private $domain_list;

    // captured values
    private $fbc = null;
    private $fbp = null;

    // perf optimization - save etld+1
    private $host = null;
    private $etld_plus_1 = null;
    private $sub_domain_index = 0;

    // output cookies, a map of <cookieName, CookieSettings>
    private $cookies_to_set = [];
    private $cookies_to_set_array = [];

    public function __construct(
            $params = null) {
        $this->fbc_param_configs = array(
            new FbcParamConfig(FBCLID, '', CLICK_ID_STRING)
        );

        if ($params instanceof ETLDPlus1Resolver) {
            $this->etld_plus1_resolver = $params;
        } else if (is_array($params) && count($params) > 0) {
            $this->domain_list = [];
            foreach ($params as $domain) {
                array_push(
                    $this->domain_list,
                    ParamBuilder::extractHostFromHttpHost($domain));
            }
        }
    }

    // pre-process cookie if it exists
    private function preProcess($cookie, $cookie_name, $host) {
        if (empty($cookie[$cookie_name])) {
            return null;
        }
        $cookie_value = $cookie[$cookie_name];
        $slices = explode(".", $cookie_value);
        $slice_length = count($slices);
        $updated_cookie = null;

        // Invalid length
        if ($slice_length > PAYLOAD_SPLIT_LENGTH_WITH_LANGUAGE_TOKEN
            || $slice_length < MIN_PAYLOAD_SPLIT_LENGTH) {
            return null;
        }

        // Cookie exist, but not contains language token
        if ($slice_length == MIN_PAYLOAD_SPLIT_LENGTH) {
            $contains_extra_dot = empty($slices[MIN_PAYLOAD_SPLIT_LENGTH - 1]);
            $updated_cookie = $cookie_value
                .($contains_extra_dot?'':'.')
                .LANGUAGE_TOKEN;
        }

        // Cookie exist, contains language token. Validate it
        if ($slice_length == PAYLOAD_SPLIT_LENGTH_WITH_LANGUAGE_TOKEN &&
            !in_array(
                    $slices[PAYLOAD_SPLIT_LENGTH_WITH_LANGUAGE_TOKEN - 1],
                    SUPPORTED_LANGUAGES_TOKEN)) {
            return null;
        }
        // Update cookie
        if (!empty($updated_cookie)) {
            $this->computeETLDPlus1ForHost($host);
            $this->cookies_to_set[$cookie_name] = new CookieSettings(
                    $cookie_name,
                    $updated_cookie,
                    DEFAULT_1PC_AGE,
                    $this->etld_plus_1);
            return $updated_cookie;
        }

        return $cookie_value;
    }

    private function buildParamConfigs(
        $existing_payload,
        $query,
        $prefix,
        $value) {

        $isClickID = $query == FBCLID;
        return
            $existing_payload.($isClickID ? "" : "_")
                .$prefix.($isClickID ? "" : "_").$value;
    }

    private function getNewFbcPayloadFromQuery($queries, $referer = null) {
        $param_value = '';
        // Get referer queries
        $referer_queries = '';
        
        $referer_component = null;
        if (!empty($referer)) {
            $parsed_url = parse_url($referer);

            if (!empty($parsed_url['query'])) {
                $referer_component = $parsed_url['query'];
            }
        }
        
        if (!empty($referer_component)) {
            parse_str($referer_component, $referer_queries);
        }

        foreach ($this->fbc_param_configs as $param_config) {
            if(!empty($queries[$param_config->query])) {
                $param_value = ParamBuilder::buildParamConfigs(
                    $param_value,
                    $param_config->query,
                    $param_config->prefix,
                    $queries[$param_config->query]);
            } else if (!empty($referer_queries[$param_config->query])) {
                $param_value = ParamBuilder::buildParamConfigs(
                    $param_value,
                    $param_config->query,
                    $param_config->prefix,
                    $referer_queries[$param_config->query]);
            }
        }
        if (!empty($param_value)) {
            return $param_value;
        }
        return null;
    }

    private function shouldUpdateFbc($new_fbc_payload) {
        if (empty($new_fbc_payload)) {
            return false;
        }
        if (empty($this->fbc)) {
            return true;
        }
        // Compare payload
        $slices = explode(".", $this->fbc);
        $slices_length = count($slices);
        // Length validation
        if ($slices_length >= MIN_PAYLOAD_SPLIT_LENGTH
            && $slices_length <= PAYLOAD_SPLIT_LENGTH_WITH_LANGUAGE_TOKEN) {
            return $new_fbc_payload != $slices[MIN_PAYLOAD_SPLIT_LENGTH - 1];
        }
        // Invalid length
        return false;
    }

    // process request and return a list of cookies
    public function processRequest($host, $queries, $cookies, $referer = null) {
        // Reset the default values
        $this->cookies_to_set = [];
        $this->etld_plus_1 = null;
        $this->sub_domain_index = 0;

        // Pre-process if cookie already exists
        $this->fbc = ParamBuilder::preProcess($cookies, FBC_NAME, $host);
        $this->fbp = ParamBuilder::preProcess($cookies, FBP_NAME, $host);

        $new_fbc_payload = ParamBuilder::getNewFbcPayloadFromQuery(
            $queries, $referer);

        // Set payload if it's not empty
        if (ParamBuilder::shouldUpdateFbc($new_fbc_payload)) {
            $this->computeETLDPlus1ForHost($host);
            $drop_ts = round(microtime(true) * 1000);
            $this->fbc = FB_PREFIX .
                '.' . $this->sub_domain_index .
                '.' . $drop_ts .
                '.' . $new_fbc_payload .
                '.' . LANGUAGE_TOKEN;
            $this->cookies_to_set[FBC_NAME] = new CookieSettings(
                    FBC_NAME,
                    $this->fbc,
                    DEFAULT_1PC_AGE,
                    $this->etld_plus_1);
        }

        // set fbp if none exists
        if (empty($this->fbp)) {
            $this->computeETLDPlus1ForHost($host);
            $new_fbp_payload = (string) mt_rand(0, 2147483647);
            $drop_ts = round(microtime(true) * 1000);
            $this->fbp = FB_PREFIX .
                '.' . $this->sub_domain_index .
                '.' . $drop_ts .
                '.' . $new_fbp_payload .
                '.'.LANGUAGE_TOKEN;
            $this->cookies_to_set[FBP_NAME] = new CookieSettings(
                    FBP_NAME,
                    $this->fbp,
                    DEFAULT_1PC_AGE,
                    $this->etld_plus_1);
        }

        $this->cookies_to_set_array = array_values($this->cookies_to_set);
        return $this->cookies_to_set_array;
    }

    public function getCookiesToSet() {
        return $this->cookies_to_set_array;
    }

    public function getFbc() {
        return $this->fbc;
    }

    public function getFbp() {
        return $this->fbp;
    }

    // TODO: this needs optimizatino, maybe use a DAFSA format,
    // or some type of x-request cache
    private function computeETLDPlus1ForHost($host) {
        if ($this->etld_plus_1 === null || $this->host !== $host) {
            // in case a new host is passed in for the same request
            $this->host = $host;
            $host = ParamBuilder::extractHostFromHttpHost($host);

            if (ParamBuilder::isIPAddress($host)
                || strpos($host, '.') === false) {
                $this->etld_plus_1 = ParamBuilder::maybeBracketIPv6($host);
                $this->sub_domain_index = 0;
            } else {
                $this->etld_plus_1 = $this->getEtldPlusOne($host);
                // // https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc/
                $this->sub_domain_index = substr_count($this->etld_plus_1, '.');
            }
        }
    }

    private function getEtldPlusOne($host) {
        if ($this->etld_plus1_resolver !== null) {
            return $this->etld_plus1_resolver->resolveETLDPlus1($host);
        } else if ($this->domain_list !== null) {
            foreach ($this->domain_list as $domain_candidate) {
                $lastOccurrence = strpos($host, $domain_candidate);
                if ($lastOccurrence !== false
                    && $lastOccurrence ===
                        strlen($host) - strlen($domain_candidate)) {
                    if ($host[$lastOccurrence - 1] === '.') {
                        return $domain_candidate;
                    }
                }
            }
        }

        // Backup plan, return host itself if nothing input.
        $slice = explode(".", $host);
        if (count($slice) > 2) {
            return substr($host, strpos($host, '.') + 1);
        }
        return $host;
    }

    // extract real host from HTTP 'Host' header, it may contain :port section
    private static function extractHostFromHttpHost($value) {
        // check and strip protocol
        if (strpos($value, '://') !== false) {
            $value = substr($value, strpos($value, '://') + 3);
        }
        $pos_colon = strrpos($value, ':');
        $pos_bracket = strrpos($value, ']');

        if ($pos_colon === false) {
            return $value;
        }

        // if there's no right bracket (not IPv6 host), or colon is after
        // right bracket it's a port separator
        // examples
        //  [::1]:8080 => trim
        //  google.com:8080 => trim
        if ($pos_bracket === false || $pos_colon > $pos_bracket) {
            $value = substr($value, 0, $pos_colon);
        }

        // for IPv6, remove the brackets
        $length = strlen($value);
        if ($length >= 2 && $value[0] === '[' && $value[$length - 1] === ']') {
            $value = substr($value, 1, $length - 2);
        }

        return $value;
    }

    private static function maybeBracketIPv6($value) {
        if (strpos($value, ':') !== false) {
            return '[' . $value . ']';
        } else {
            return $value;
        }
    }

    private static function isIPAddress($value) {
        return filter_var($value, FILTER_VALIDATE_IP,
            FILTER_FLAG_IPV6 | FILTER_FLAG_IPV4) !== false;
    }
}



?>
