/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.example.springboot.controller;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DemoFilterController {
  @GetMapping("/filter/demo")
  public String filterDemo(HttpServletRequest request, HttpServletResponse response, Model model) {
    // Config in Application to have ParamBuilderFilter applies in /filter/* URL.
    // Check Application.java for the config, check ParamBuilderFilter.java for the filter
    System.out.println("Demo Filter Controller");
    model.addAttribute("fbc", request.getAttribute("fbc"));
    model.addAttribute("fbp", request.getAttribute("fbp"));
    model.addAttribute("controller", request.getAttribute("controller"));
    return "demo";
  }
}
