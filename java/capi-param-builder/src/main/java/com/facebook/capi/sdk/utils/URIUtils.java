/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk.utils;

import com.facebook.capi.sdk.ETLDPlusOneResolver;
import com.facebook.capi.sdk.model.Constants;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/** URI Utils to help resolve ETLD+1 from input full URL */
public class URIUtils {
  private String host;
  private ETLDPlusOneResolver etldPlus1Resolver;
  private List<String> domainList;
  private String etldPlusOne;
  private int subDomainIndex = 0;

  /** Constructor */
  public URIUtils() {}

  /**
   * Constructor with customized ETLDPlusOneResolver
   *
   * @param etldPlus1Resolver customized ETLDPlusOneResolver. Implement the ETLDPlusOneResolver
   *     interface.
   */
  public URIUtils(ETLDPlusOneResolver etldPlus1Resolver) {
    this.etldPlus1Resolver = etldPlus1Resolver;
  }

  /**
   * Constructor with list of ETLD+1
   *
   * @param domainList List of ETLD+1 domains may associated with current input
   */
  public URIUtils(List<String> domainList) {
    if (domainList != null && domainList.size() > 0) {
      this.domainList = new ArrayList<String>();

      for (String domain : domainList) {
        String newDomain = extractHostFromHttpHost(domain);
        if (newDomain != null) {
          this.domainList.add(newDomain);
        }
      }
    }
  }

  /** Reset the ETLD+1 value */
  public void resetEtldPlusOne() {
    this.etldPlusOne = null;
  }

  /**
   * Comput the ETLD+1 value from input url domain
   *
   * @param host current URL domain. Eg. http://mytest.test.example.com
   * @return Resolved ETLD+1 value from current domain.eg. example.com
   */
  public String computeETLDPlusOneForHost(String host) {
    if (this.etldPlusOne == null || this.host != host) {
      this.host = host;
      String hostName = extractHostFromHttpHost(host);
      if (hostName != null && isIPAddress(hostName)) {
        this.etldPlusOne = hostName;
        this.subDomainIndex = 0;
      } else {
        this.etldPlusOne = resolveEtldPlusOne(hostName);
        // https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc/
        this.subDomainIndex =
            this.etldPlusOne != null ? this.etldPlusOne.split("\\.").length - 1 : 0;
      }
    }
    return this.etldPlusOne;
  }

  private String resolveEtldPlusOne(String host) {
    if (host == null) {
      return null;
    }

    if (this.etldPlus1Resolver != null) {
      return this.etldPlus1Resolver.resolve(host);
    } else if (this.domainList != null) {
      for (String domain : this.domainList) {
        if (host.equals(domain) || host.endsWith('.' + domain)) {
          return domain;
        }
      }
    }
    if (host.split("\\.").length > 2) {
      return host.substring(host.indexOf('.') + 1);
    }
    return host;
  }

  /**
   * Normalize input host. Remove protocol if needed
   *
   * @param host full url
   * @return normalized URL
   */
  protected String extractHostFromHttpHost(String host) {
    if (host != null && host.indexOf("://") == -1) {
      // add schema if not present
      host = "http://" + host;
    }
    try {
      URI uri = new URI(host);
      return uri.toURL().getHost();
    } catch (MalformedURLException | URISyntaxException e) {
      System.err.println("Exception when extract host from input:" + e.getMessage());
      return null;
    }
  }

  /**
   * Check if current host is an IP address
   *
   * @param host host name
   * @return true if input host name is an IP address. False otherwise.
   */
  protected boolean isIPAddress(String host) {
    Pattern ipv4Pattern = Pattern.compile(Constants.IPV4_REGEX);
    boolean isIpv4 = ipv4Pattern.matcher(host).matches();
    if (isIpv4) {
      return true;
    }
    if (host.charAt(0) == '[' && host.charAt(host.length() - 1) == ']') {
      host = host.substring(1, host.length() - 1);
    }
    Pattern ipv6Pattern = Pattern.compile(Constants.IPV6_SEG_REGEX);
    boolean isIpv6 = ipv6Pattern.matcher(host).find();
    return isIpv6;
  }

  /**
   * Get sub domain index
   *
   * @return subDomainIndex
   */
  public int getSubDomainIndex() {
    return this.subDomainIndex;
  }

  /**
   * Get ETLD+1 value
   *
   * @return etld+1
   */
  public String getEtldPlusOne() {
    return this.etldPlusOne;
  }

  /**
   * For unit test
   *
   * @return host
   */
  protected String getHost() {
    return this.host;
  }
}
