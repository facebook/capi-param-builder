/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
const FbcParamConfig = require('./model/FbcParamConfig');
const CookieSettings = require('./model/CookieSettings');
const Constants = require('./model/Constants');

class ParamBuilder {
    constructor(input_params) {
        this.fbc_param_configs = [
          new FbcParamConfig(Constants.FBCLID_STRING, '', Constants.CLICK_ID_STRING)
        ];

        if (Array.isArray(input_params)) {
          this.domain_list = [];
          for (const domain of input_params) {
            this.domain_list.push(ParamBuilder.extractHostFromHttpHost(domain));
          }
        } else if (typeof input_params === 'object') {
          this.etld_plus1_resolver = input_params;
        }

        // captured values
        this.fbc = null;
        this.fbp = null;

        // perf optimization - save etld+1
        this.host = null;
        this.etld_plus_1 = null;
        this.sub_domain_index = 0;
        // output cookies, an array of CookieSettings
        this.cookies_to_set = [];
        this.cookies_to_set_dict = {};
      }

      preprocessCookie(cookies, cookie_name) {
        // cookie_name not exist in cookies
        if (!cookies || !cookies.hasOwnProperty(cookie_name) || !cookies[cookie_name]) {
          return null;
        }

        // Check paramBuilder language token
        const cookie_value = cookies[cookie_name];
        const split = cookie_value.split('.');
        if (split.length < Constants.MIN_PAYLOAD_SPLIT_LENGTH
          || split.length > Constants.MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_SPLIT_LENGTH) {
          return null;
        }
        // If length is MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_SPLIT_LENGTH w/o language token, invalid.
        if (split.length == Constants.MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_SPLIT_LENGTH
          && !Constants.SUPPORTED_PARAM_BUILDER_LANGUAGES_TOKEN.includes(
            split[Constants.MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_SPLIT_LENGTH - 1])) {
          return null;
        }

        // Validation check
        if (split[0] !== 'fb'
          || !this.isDigit(split[1]) // sub_domain_index
          || !this.isDigit(split[2]) // timestamp
          || !split[3] // payload
           ) {
            return null;
        }

        if (split.length == Constants.MIN_PAYLOAD_SPLIT_LENGTH) {
          // Update cookie
          const updated_cookie_value = `${cookie_value}.${Constants.LANGUAGE_TOKEN}`;
          this.cookies_to_set_dict[cookie_name] = new CookieSettings(
            cookie_name,
            updated_cookie_value,
            Constants.DEFAULT_1PC_AGE,
            this.etld_plus_1);
          return updated_cookie_value;
        }
        // no change
        return cookie_value;
      }

      isDigit(str) {
        return /^\d+$/.test(str);
      }

      buildParamConfigs(existing_payload, query, prefix, value) {
        const isClickID = query === Constants.FBCLID_STRING;
        existing_payload += (isClickID?'':'_') + prefix + (isClickID?'':'_') + value;
        return existing_payload;
      }

      processRequest(host, queries, cookies, referer = null) {
        this.cookies_to_set = [];
        this.cookies_to_set_dict = {};
        this.etld_plus_1 = null;
        this.sub_domain_index = 0;
        this.computeETLDPlus1ForHost(host);

        // capture existing cookies
        this.fbc = this.preprocessCookie(cookies, Constants.FBC_NAME_STRING);
        this.fbp = this.preprocessCookie(cookies, Constants.FBP_NAME_STRING);

        const referer_query = this.getRefererQuery(referer);
        const new_fbc_payload = this.fbc_param_configs.reduce((acc, param_config) => {
          if (!acc) {
            acc = '';
          }
          if (queries && queries[param_config.query]) {
            acc = this.buildParamConfigs(acc, param_config.query, param_config.prefix, queries[param_config.query]);
          } else if (referer_query && referer_query.get(param_config.query)) {
            acc = this.buildParamConfigs(acc, param_config.query, param_config.prefix, referer_query.get(param_config.query));
          }
          return acc;
        }, '');

        // set fbp if none exists
        if (!this.fbp) {
          const new_fbp_payload = Math.floor(Math.random() * 2147483647);
          const drop_ts = Date.now();
          this.fbp = `fb.${this.sub_domain_index}.${drop_ts}.${new_fbp_payload}.${Constants.LANGUAGE_TOKEN}`;
          this.cookies_to_set_dict[Constants.FBP_NAME_STRING] = new CookieSettings(
            Constants.FBP_NAME_STRING,
            this.fbp,
            Constants.DEFAULT_1PC_AGE,
            this.etld_plus_1);
        }
        if (!new_fbc_payload) {
          this.cookies_to_set = Object.values(this.cookies_to_set_dict);
          return this.cookies_to_set;
        }
        // check if we should overwrite the fbc
        if (!this.fbc) {
          const drop_ts = Date.now();
          this.fbc = `fb.${this.sub_domain_index}.${drop_ts}.${new_fbc_payload}.${Constants.LANGUAGE_TOKEN}`;
          this.cookies_to_set_dict[Constants.FBC_NAME_STRING] = new CookieSettings(
            Constants.FBC_NAME_STRING,
            this.fbc,
            Constants.DEFAULT_1PC_AGE,
            this.etld_plus_1);
        } else {
          // extract payload
          const split = this.fbc.split('.');
          const old_fbc_payload = split[3];
          if (new_fbc_payload !== old_fbc_payload) {
            const drop_ts = Date.now();
            this.fbc = `fb.${this.sub_domain_index}.${drop_ts}.${new_fbc_payload}.${Constants.LANGUAGE_TOKEN}`;
            this.cookies_to_set_dict[Constants.FBC_NAME_STRING] = new CookieSettings(
              Constants.FBC_NAME_STRING,
              this.fbc,
              Constants.DEFAULT_1PC_AGE,
              this.etld_plus_1);
          }
        }
        this.cookies_to_set = Object.values(this.cookies_to_set_dict);
        return this.cookies_to_set;
      }
      getCookiesToSet() {
        return this.cookies_to_set;
      }
      getFbc() {
        return this.fbc;
      }
      getFbp() {
        return this.fbp;
      }
      getRefererQuery(referer_url) {
        if (!referer_url) {
          return null;
        }
        if (!referer_url.includes('://')) {
          referer_url = 'http://' + referer_url;
        }
        const referer = new URL(referer_url);
        const query = new URLSearchParams(referer.search);
        return query;
      }
      computeETLDPlus1ForHost(host) {
        if (this.etld_plus_1 === null || this.host !== host) {
          // in case a new host is passed in for the same request
          this.host = host;
          const hostname = ParamBuilder.extractHostFromHttpHost(host);
          if (ParamBuilder.isIPAddress(hostname)) {
            this.etld_plus_1 = ParamBuilder.maybeBracketIPv6(hostname);
            this.sub_domain_index = 0;
          } else {
            this.etld_plus_1 = this.getEtldPlus1(hostname);
            // https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc/
            this.sub_domain_index = this.etld_plus_1?.split('.').length - 1 ?? 0;
          }
        }
      }

      getEtldPlus1(hostname) {
        try {
          if (this.etld_plus1_resolver) {
            return this.etld_plus1_resolver.resolveETLDPlus1(hostname);
          } else if (this.domain_list) {
            for (let domain of this.domain_list) {
              if (hostname === domain || hostname.endsWith("." + domain)) {
                return domain;
              }
            }
          }
        } catch (error) {
          console.error("Error - resolve etld+1 from paramBuilder." + error);
        }
        const test = hostname.split(".");
        if (hostname && hostname.split(".").length > 2) {
          return hostname.substring(hostname.indexOf(".") + 1);
        }
        return hostname;
      }

      static extractHostFromHttpHost(value) {
        if (!value) {
          return null;
        }
        if (value.includes('://')) {
          value = value.split('://')[1];
        }
        const posColon = value.lastIndexOf(':');
        const posBracket = value.lastIndexOf(']');
        if (posColon === -1) {
          return value;
        }
        // if there's no right bracket (not IPv6 host), or colon is after
        // right bracket it's a port separator
        // examples
        //  [::1]:8080 => trim
        //  google.com:8080 => trim
        if (posBracket === -1 || posColon > posBracket) {
          value = value.substring(0, posColon);
        }

        // for IPv6, remove the brackets
        const length = value.length;
        if (length >= 2 && value[0] === '[' && value[length - 1] === ']') {
          return value.substring(1, length - 1);
        }
        return value;
      }

      static maybeBracketIPv6(value) {
        if (value.includes(':')) {
          return '[' + value + ']';
        } else {
          return value;
        }
      }
      static isIPAddress(value) {
        return Constants.IPV4_REGEX.test(value) || ParamBuilder.isIPv6Address(value);
      }

      // https://en.wikipedia.org/wiki/IPv6#Address_representation
      static isIPv6Address(value) {
        const parts = value.split(':');
        if (parts.length > 8) {
          return false;
        }

        // check for empty parts
        var empty_parts = 0;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part.length === 0) {
                if (i > 0) {
                    empty_parts++;
                    if (empty_parts > 1) {
                        return false;
                    }
                }
            } else if (!Constants.IPV6_SEG_REGEX.test(part)) {
                return false;
            }
        }
        return true;
    }
}

module.exports = {
    ParamBuilder,
    CookieSettings
}
