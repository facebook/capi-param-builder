/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.example.springboot;

import com.facebook.capi.sdk.ParamBuilder;
import com.facebook.capi.sdk.model.CookieSetting;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DemoController {

  @GetMapping("/demo")
  public String demo(HttpServletRequest request, HttpServletResponse response, Model model) {
    // Start demo, initialize ParamBuilder to have correct cookie set
    // Recommended to use list of ETLD+1 to resolve domain
    ParamBuilder paramBuilder = new ParamBuilder(Arrays.asList("localhost", "example.com"));
    // ParamBuilder paramBuilder = new ParamBuilder(new DefaultETLDPlusOneResolver());

    Map<String, String> cookieMap = getCookiesToMap(request.getCookies());
    List<CookieSetting> updatedCookieList =
        paramBuilder.processRequest(
            request.getHeader("host"),
            request.getParameterMap(),
            cookieMap,
            request.getHeader("referer")); // Referer is optional
    for (CookieSetting updatedCookie : updatedCookieList) {
      Cookie cookie = new Cookie(updatedCookie.getName(), updatedCookie.getValue());
      cookie.setMaxAge(updatedCookie.getMaxAge());
      cookie.setDomain(updatedCookie.getDomain());
      cookie.setPath("/");
      response.addCookie(cookie);
    }

    // Get Fbc
    String fbc = paramBuilder.getFbc();
    // Get fbp
    String fbp = paramBuilder.getFbp();
    // Bypass fbc and fbp into CAPI events

    // End demo
    model.addAttribute("fbc", fbc);
    model.addAttribute("fbp", fbp);
    model.addAttribute("controller", "Normal controller");
    return "demo";
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
