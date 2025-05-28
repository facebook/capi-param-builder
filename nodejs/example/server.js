/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
const { createServer } = require('node:http');
const {ParamBuilder} = require('capi-param-builder-nodejs');
const url = require('url');

const hostname = 'localhost';//'127.0.0.1';
const port = 3000;

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');

  // Get query params
  const myURL = new URL(req.url, `http://${req.headers.host}`);
  const params = Array.from(myURL.searchParams.entries()).reduce((total, [key, value]) => {
    total[key] = value;
    return total;
  }, {});

  // Get ETLD+1 as cookie's domain, there're 3 options:
  // 1. (Recommended)Provide a list of etld+1, we'll match your current host with the domain.
  //    const builder = new ParamBuilder(["example.com", "localhost"]);
  // 2. Resolve customized etld+1.
  //    Check example DefaultETLDPlus1Resolver.js under util folder.
  //    const etldPlus1Resolver = new DefaultETLDPlus1Resolver();
  //    const builder = new ParamBuilder(etldPlus1Resolver);
  // 3. Not recommended. Empty input.
  //    We'll provide a guess on your domain by one level down your input host.
  //    const builder = new ParamBuilder();
  const builder = new ParamBuilder(["example.com", "localhost"]);
  // Get cookies from request
  const requestCookies = parseCookie(req.headers.cookie);
  builder.processRequest(
    req.headers.host, // host
    params, // query params
    requestCookies, // current cookie
    req.headers.referer // optional, help enhance the accurancy
  );

  // Save cookies to response
  const responseCookies = [];
  for (const cookie of builder.getCookiesToSet()) {
    responseCookies.push(cookie.name + '=' + cookie.value + '; Max-Age=' + cookie.maxAge + '; Domain=' + cookie.domain + '; Path=/');
  }
  res.setHeader('Set-Cookie', responseCookies);
  // Get fbc
  const fbc = builder.getFbc();
  // Get fbp
  const fbp = builder.getFbp();

  // Bypass fbc and fbp to CAPI event APIs.

  // End demo

  res.end("getFbc: " + fbc + "\ngetFbp: " + fbp + "\n");
});

function parseCookie(cookieString) {
  if (!cookieString) {
    return null;
  }
  const cookies = {};
  const items = cookieString.split('; ');
  for (const item of items) {
      const [name, value] = item.split('=');
      cookies[name] = value;
  }
  return cookies;
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
