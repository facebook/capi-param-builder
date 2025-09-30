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
const {version} = require('../package.json');

class ParamBuilder {
    constructor(input_params) {
        this.fbc_param_configs = [
          new FbcParamConfig(Constants.FBCLID_STRING, '', Constants.CLICK_ID_STRING)
        ];

        if (Array.isArray(input_params)) {
          this.domain_list = [];
          for (const domain of input_params) {
            this.domain_list.push(this._extractHostFromHttpHost(domain));
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
        // language token
        this.appendix_new = this._getAppendixInfo(true);
        this.appendix_normal = this._getAppendixInfo(false);
      }

      _getAppendixInfo(is_new) {
        const [major, minor, patch] = version.split('.').map(Number);
        const is_new_byte = is_new === true ? 0x01 : 0x00;
        const bytes = [Constants.DEFAULT_FORMAT, Constants.LANGUAGE_TOKEN_INDEX, is_new_byte, major.toString(16), minor.toString(16), patch.toString(16)];
        const buf = Buffer.from(bytes);
        const base64urlSafe = buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return base64urlSafe;
      }

      _preprocessCookie(cookies, cookie_name) {
        if (!cookies || !cookies.hasOwnProperty(cookie_name) || !cookies[cookie_name]) {
          return null;
        }

        const cookie_value = cookies[cookie_name];
        const segments = cookie_value.split('.');
        if (!this._isValidSegmentCount(segments.length)) {
          return null;
        }
        if (segments.length === Constants.MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_SPLIT_LENGTH) {
          if (!this._validateAppendix(segments[segments.length - 1])) {
            return null;
          }
        }
        if (!this._validateCoreStructure(segments)) {
          return null;
        }
        if (segments.length === Constants.MIN_PAYLOAD_SPLIT_LENGTH) {
          return this._updateCookieWithLanguageToken(cookie_value, cookie_name);
        }
        return cookie_value;
      }

      _isValidSegmentCount(length) {
        return length >= Constants.MIN_PAYLOAD_SPLIT_LENGTH &&
               length <= Constants.MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_SPLIT_LENGTH;
      }

      _validateAppendix(appendix_value) {
        const appendix_length = appendix_value.length;

        // Backward compatible V1 format: 2-character language token
        if (appendix_length === Constants.APPENDIX_LENGTH_V1) {
          return Constants.SUPPORTED_PARAM_BUILDER_LANGUAGES_TOKEN.includes(appendix_value);
        }

        // V2 format: 8-character appendix
        if (appendix_length === Constants.APPENDIX_LENGTH_V2) {
          return true;
        }
        return false;
      }

      _validateCoreStructure(segments) {
        return segments[0] === 'fb' &&
               this._isDigit(segments[1]) && // sub_domain_index
               this._isDigit(segments[2]) && // timestamp
               segments[3] && segments[3].length > 0; // payload
      }

      _updateCookieWithLanguageToken(cookie_value, cookie_name) {
        const updated_cookie_value = `${cookie_value}.${this.appendix_normal}`;

        this.cookies_to_set_dict[cookie_name] = new CookieSettings(
          cookie_name,
          updated_cookie_value,
          Constants.DEFAULT_1PC_AGE,
          this.etld_plus_1
        );

        return updated_cookie_value;
      }

      _isDigit(str) {
        return /^\d+$/.test(str);
      }

      _buildParamConfigs(existing_payload, query, prefix, value) {
        const isClickID = query === Constants.FBCLID_STRING;
        const separator = isClickID ? '' : '_';

        // Prevent duplication
        if (!isClickID && existing_payload.includes(`${separator}${prefix}${separator}`)) {
          return existing_payload;
        }

        const newSegment = `${prefix}${separator}${value}`;
        return existing_payload !== '' ? `${existing_payload}${separator}${newSegment}` : newSegment;
      }

      processRequest(host, queries, cookies, referer = null) {
        this.cookies_to_set = [];
        this.cookies_to_set_dict = {};
        this.etld_plus_1 = null;
        this.sub_domain_index = 0;
        this._computeETLDPlus1ForHost(host);

        // capture existing cookies
        this.fbc = this._preprocessCookie(cookies, Constants.FBC_NAME_STRING);
        this.fbp = this._preprocessCookie(cookies, Constants.FBP_NAME_STRING);

        const referer_query = this._getRefererQuery(referer);
        const new_fbc_payload = this.fbc_param_configs.reduce((acc, param_config) => {
          if (!acc) {
            acc = '';
          }
          if (queries && queries[param_config.query]) {
            acc = this._buildParamConfigs(acc, param_config.query, param_config.prefix, queries[param_config.query]);
          } else if (referer_query && referer_query.get(param_config.query)) {
            acc = this._buildParamConfigs(acc, param_config.query, param_config.prefix, referer_query.get(param_config.query));
          }
          return acc;
        }, '');

        // set fbp if none exists
        if (!this.fbp) {
          const new_fbp_payload = Math.floor(Math.random() * 2147483647);
          const drop_ts = Date.now();
          this.fbp = `fb.${this.sub_domain_index}.${drop_ts}.${new_fbp_payload}.${this.appendix_new}`;
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
          this.fbc = `fb.${this.sub_domain_index}.${drop_ts}.${new_fbc_payload}.${this.appendix_new}`;
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
            this.fbc = `fb.${this.sub_domain_index}.${drop_ts}.${new_fbc_payload}.${this.appendix_new}`;
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
      _getRefererQuery(referer_url) {
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
      _computeETLDPlus1ForHost(host) {
        if (this.etld_plus_1 === null || this.host !== host) {
          // in case a new host is passed in for the same request
          this.host = host;
          const hostname = this._extractHostFromHttpHost(host);
          if (this._isIPAddress(hostname)) {
            this.etld_plus_1 = this._maybeBracketIPv6(hostname);
            this.sub_domain_index = 0;
          } else {
            this.etld_plus_1 = this._getEtldPlus1(hostname);
            // https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc/
            this.sub_domain_index = this.etld_plus_1?.split('.').length - 1 ?? 0;
          }
        }
      }

      _getEtldPlus1(hostname) {
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

      _extractHostFromHttpHost(value) {
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

      _maybeBracketIPv6(value) {
        if (value.includes(':')) {
          return '[' + value + ']';
        } else {
          return value;
        }
      }
      _isIPAddress(value) {
        return Constants.IPV4_REGEX.test(value) || this._isIPv6Address(value);
      }

      // https://en.wikipedia.org/wiki/IPv6#Address_representation
      _isIPv6Address(value) {
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
