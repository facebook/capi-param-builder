/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Cookie settings for setting browser cookies
 */
export declare class CookieSettings {
  name: string;
  value: string;
  maxAge: number;
  domain: string;

  constructor(name: string, value: string, maxAge: number, domain: string);
}

/**
 * Interface for ETLD+1 resolver object
 */
export interface ETLD1Resolver {
  resolveETLDPlus1(hostname: string): string;
}

/**
 * Type for ParamBuilder constructor input - either array of domains or ETLD+1 resolver
 */
export type ParamBuilderInput = string[] | ETLD1Resolver;

/**
 * Interface for query parameters object
 */
export interface QueryParams {
  [key: string]: string;
}

/**
 * Interface for cookies object
 */
export interface Cookies {
  [key: string]: string;
}

/**
 * Main ParamBuilder class for building Conversions API parameters
 */
export declare class ParamBuilder {
  /**
   * Create a new ParamBuilder instance
   * @param input_params Either an array of domain strings or an ETLD+1 resolver object
   */
  constructor(input_params?: ParamBuilderInput);

  /**
   * Process an incoming request to extract and build Facebook parameters
   * @param host The host from the request
   * @param queries Query parameters from the request
   * @param cookies Cookies from the request
   * @param referer Optional referer URL
   * @returns Array of CookieSettings to be set
   */
  processRequest(
    host: string,
    queries: QueryParams | null,
    cookies: Cookies | null,
    referer?: string | null,
    xForwardedFor?: string | null,
    remoteAddress?: string | null
  ): CookieSettings[];

  /**
   * Get the cookies that should be set after processing a request
   * @returns Array of CookieSettings
   */
  getCookiesToSet(): CookieSettings[];

  /**
   * Get the Facebook Click ID (fbc) parameter value
   * @returns The fbc value or null if not available
   */
  getFbc(): string | null;

  /**
   * Get the Facebook Browser ID (fbp) parameter value
   * @returns The fbp value or null if not available
   */
  getFbp(): string | null;

  /**
   * Get the Client IP Address (client_ip_address) parameter value
   * @returns The client_ip_address value or null if not available
   */
  getClientIpAddress(): string | null;

  /**
   * Normalize and hash PII data
   * @param piiValue The PII value to normalize and hash
   * @param dataType The type of PII data (e.g., 'email', 'phone', 'first_name')
   * @returns The normalized and hashed PII value, or null if invalid
   */
  getNormalizedAndHashedPII(piiValue: string, dataType: string): string | null;

  // Internal used privat methods
  private _buildParamConfigs(existing_payload: string, query: string, prefix: string, value: string): string;
  private _getAppendixInfo(is_new: boolean): string;
  private _preprocessCookie(cookies: Cookies | null, cookie_name: string): string | null;
  private _isValidSegmentCount(length: number): boolean;
  private _validateAppendix(appendix_value: string): boolean;
  private _validateCoreStructure(segments: string[]): boolean;
  private _updateCookieWithLanguageToken(cookie_value: string, cookie_name: string): string;
  private _isDigit(str: string): boolean;
  private _getRefererQuery(referer_url: string | null): URLSearchParams | null;
  private _computeETLDPlus1ForHost(host: string): void;
  private _getEtldPlus1(hostname: string): string;
  private _extractHostFromHttpHost(value: string): string | null;
  private _isIPAddress(value: string): boolean;
  private _maybeBracketIPv6(value: string): string;
  private _isIPv6Address(value: string): boolean;
  private _isPrivateIPv4(value: string): boolean;
  private _isPrivateIPv6(value: string): boolean;
  private _isPublicIp(value: string): boolean;
  private _getClientIpFromRequest(xForwardedFor?: string | null, remoteAddress?: string | null): string | null;
  private _removeLanguageToken(value):string;
  private _getClientIpFromCookies(cookies: Cookies | null): string | null;
  private _getLanguageToken(value: string): string | null;
  private _getClientIpLanguageTokenFromCookie(cookies: Cookies | null): string | null;
  private _getClientIp(cookies: Cookies | null, xForwardedFor?: string | null, remoteAddress?: string | null): string | null;
}
