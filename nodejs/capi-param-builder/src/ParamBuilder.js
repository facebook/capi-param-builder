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
const net = require('net');
const { version } = require('../package.json');

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
    this.fbi = null;

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

  processRequest(host, queries, cookies, referer = null, xForwardedFor = null, remoteAddress = null) {
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

    this.fbi = this._getClientIp(
      cookies, xForwardedFor, remoteAddress
    );


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
  getFbi() {
    return this.fbi;
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

  /**
   * Checks if an IPv4 address is in a private, reserved, or loopback range.
   * @param {string} ip - The IPv4 address to check.
   * @returns {boolean} - True if private, reserved, or loopback, otherwise false.
   */
  _isPrivateIPv4(ip) {
    const parts = ip.split('.').map(Number);
    // Check for invalid IP format
    if (parts.length !== 4) return false;

    // 10.0.0.0/8
    if (parts[0] === 10) {
      return true;
    }
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
      return true;
    }
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) {
      return true;
    }
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) {
      return true;
    }
    // 169.254.0.0/16 (Link-local)
    if (parts[0] === 169 && parts[1] === 254) {
      return true;
    }

    return false;
  }

  /**
   * Checks if an IPv6 address is in a private, reserved, or loopback range.
   * This is a simplified check for common private/special ranges.
   * For a fully comprehensive check, you would need to implement more complex parsing.
   * @param {string} ip - The IPv6 address to check.
   * @returns {boolean} - True if private, reserved, or loopback, otherwise false.
   */
  _isPrivateIPv6(ip) {
    const normalizedIp = ip.toLowerCase();

    // ::1/128 (Loopback)
    if (normalizedIp === '::1') {
      return true;
    }
    // fe80::/10 (Link-local unicast)
    if (normalizedIp.startsWith('fe80:')) {
      return true;
    }
    // fc00::/7 (Unique local addresses)
    if (normalizedIp.startsWith('fc') || normalizedIp.startsWith('fd')) {
      return true;
    }

    return false;
  }

  /**
   * Checks if an IP is a public IP address (neither private nor loopback).
   * @param {string} ip - The IP address string to check.
   * @returns {boolean} - True if the IP is a valid public IP, false otherwise.
   */
  _isPublicIp(ip) {
    if (net.isIPv4(ip)) {
      return !this._isPrivateIPv4(ip);
    }
    if (net.isIPv6(ip)) {
      return !this._isPrivateIPv6(ip);
    }
    // Not a valid IP, so not public
    return false;
  }

  _getClientIpFromRequest(xForwardedFor, remoteAddress) {
    if (xForwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      const ips = xForwardedFor.split(',');
      const ip = ips[0].trim();
      if (this._isPublicIp(ip)) {
        return ip;
      }
    }
    return remoteAddress || null;
  }

  _removeLanguageToken(input) {
    // Find the position of the last dot
    const lastDot = input.lastIndexOf('.');
    if (lastDot !== -1) {
      const suffix = input.substring(lastDot + 1);
      if (Constants.SUPPORTED_PARAM_BUILDER_LANGUAGES_TOKEN.includes(suffix) || suffix.length === Constants.APPENDIX_LENGTH_V2) {
        return input.substring(0, lastDot);
      }
    }
    return input;
  }

  _getClientIpFromCookie(cookies) {
    let clientIpFromCookie = null;
    if (cookies[Constants.FBI_NAME_STRING]) {
      const cookieValue = cookies[Constants.FBI_NAME_STRING];
      clientIpFromCookie = this._removeLanguageToken(cookieValue);
    }
    return clientIpFromCookie;
  }

  _getLanguageToken(input) {
    // Find the position of the last dot
    const lastDot = input.lastIndexOf('.');
    if (lastDot !== -1) {
      const suffix = input.substring(lastDot + 1);
      if (Constants.SUPPORTED_PARAM_BUILDER_LANGUAGES_TOKEN.includes(suffix) || suffix.length === Constants.APPENDIX_LENGTH_V2) {
        return suffix;
      }
    }
    return null;
  }

  _getClientIpLanguageTokenFromCookie(cookies) {
    let clientIpLanguageTokenFromCookie = null;
    if (cookies[Constants.FBI_NAME_STRING]) {
      const cookieValue = cookies[Constants.FBI_NAME_STRING];
      clientIpLanguageTokenFromCookie = this._getLanguageToken(cookieValue);
    }
    return clientIpLanguageTokenFromCookie;
  }

  _getClientIp(cookies, xForwardedFor, remoteAddress) {
    let bestClientIp = null;

    const clientIpFromCookie = this._getClientIpFromCookie(cookies);
    const clientIpLanguageTokenFromCookie = this._getClientIpLanguageTokenFromCookie(cookies);
    const clientIpFromRequest = this._getClientIpFromRequest(xForwardedFor, remoteAddress);

    const clientIpFromCookieIsIPv6 = net.isIPv6(clientIpFromCookie);
    const clientIpFromCookieIsIPv4 = net.isIPv4(clientIpFromCookie);
    const clientIpFromRequestIsIPv6 = net.isIPv6(clientIpFromRequest);
    const clientIpFromRequestIsIPv4 = net.isIPv4(clientIpFromRequest);

    const clientIpFromCookieIsPublicIp = this._isPublicIp(clientIpFromCookie);
    const clientIpFromRequestIsPublicIp = this._isPublicIp(clientIpFromRequest);

    // Prioritize: IPv6 over IPv4, public over private, cookie-sourced IPs over request-sourced IPs.
    if (clientIpFromCookieIsIPv6 && clientIpFromCookieIsPublicIp) {
      bestClientIp = clientIpFromCookie + '.' + (clientIpLanguageTokenFromCookie || this.appendix_new);
    } else if (clientIpFromRequestIsIPv6 && clientIpFromRequestIsPublicIp) {
      bestClientIp = clientIpFromRequest + '.' + this.appendix_normal;
    } else if (clientIpFromCookieIsIPv4 && clientIpFromCookieIsPublicIp) {
      bestClientIp = clientIpFromCookie + '.' + (clientIpLanguageTokenFromCookie || this.appendix_new);
    } else if (clientIpFromRequestIsIPv4 && clientIpFromRequestIsPublicIp) {
      bestClientIp = clientIpFromRequest + '.' + this.appendix_normal;
    }

    return bestClientIp;
  }

}

module.exports = {
  ParamBuilder,
  CookieSettings
}
