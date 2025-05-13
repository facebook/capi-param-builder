/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.example.springboot;

import com.example.springboot.filter.ParamBuilderFilter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class Application {

  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }

  @Bean
  public FilterRegistrationBean demoFilter() {
    // Demo config ParamBuilderFilter to be binded in /filter/*
    FilterRegistrationBean registration = new FilterRegistrationBean();
    registration.setFilter(new ParamBuilderFilter());

    // In case you want the filter to apply to specific URL patterns only
    registration.addUrlPatterns("/filter/*");
    return registration;
  }
}
