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
  constructor(input_params: ParamBuilderInput);

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
    referer?: string | null
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
   * Extract hostname from HTTP host header value
   * @param value The host header value
   * @returns The extracted hostname or null if invalid
   */
  static extractHostFromHttpHost(value: string): string | null;

  /**
   * Check if a value is an IP address (IPv4 or IPv6)
   * @param value The value to check
   * @returns True if the value is an IP address
   */
  static isIPAddress(value: string): boolean;

  /**
   * Add brackets to IPv6 addresses if needed
   * @param value The IP address value
   * @returns The bracketed IPv6 address or original value for IPv4
   */
  static maybeBracketIPv6(value: string): string;

  /**
   * Check if a value is a valid IPv6 address
   * @param value The value to check
   * @returns True if the value is a valid IPv6 address
   */
  static isIPv6Address(value: string): boolean;
}
