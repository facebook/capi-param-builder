/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.example.springboot.filter;

import com.facebook.capi.sdk.ParamBuilder;
import com.facebook.capi.sdk.model.CookieSetting;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

// @Component
public class ParamBuilderFilter implements Filter {

  @Override
  public void doFilter(
      ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
      throws IOException, ServletException {

    if (servletRequest instanceof HttpServletRequest
        && servletResponse instanceof HttpServletResponse) {
      // Recommended to use a list of ETLD+1 to resolve the domain
      ParamBuilder paramBuilder = new ParamBuilder(Arrays.asList("example.com", "localhost"));
      // ParamBuilder paramBuilder = new ParamBuilder(new DefaultETLDPlusOneResolver());

      // Note: cast to HttpServletRequest to access request.getCookies() for web service.
      // If your service is not garenteed web container, please choose another option.
      HttpServletRequest request = (HttpServletRequest) servletRequest;
      HttpServletResponse response = (HttpServletResponse) servletResponse;
      Map<String, String> cookieMap = getCookiesToMap(request.getCookies());
      List<CookieSetting> updatedCookieList =
          paramBuilder.processRequest(
              request.getHeader("host"),
              request.getParameterMap(),
              cookieMap,
              request.getHeader("referer"));
      for (CookieSetting updatedCookie : updatedCookieList) {
        Cookie cookie = new Cookie(updatedCookie.getName(), updatedCookie.getValue());
        cookie.setMaxAge(updatedCookie.getMaxAge());
        cookie.setDomain(updatedCookie.getDomain());
        cookie.setPath("/");
        response.addCookie(cookie);
      }
      // Following just to print the value in the main page
      request.setAttribute("fbc", paramBuilder.getFbc());
      request.setAttribute("fbp", paramBuilder.getFbp());
      request.setAttribute("controller", "Filter controller");
      filterChain.doFilter(request, response);
    } else {
      filterChain.doFilter(servletRequest, servletResponse);
    }
  }

  private Map<String, String> getCookiesToMap(Cookie[] cookie) {
    Map<String, String> cookieMap = new HashMap<>();
    if (cookie != null) {
      for (Cookie c : cookie) {
        cookieMap.put(c.getName(), c.getValue());
      }
    }
    return cookieMap;
  }
}
