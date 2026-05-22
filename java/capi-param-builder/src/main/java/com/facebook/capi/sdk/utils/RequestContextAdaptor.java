/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.capi.sdk.utils;

import com.facebook.capi.sdk.model.PlainDataObject;
import java.io.UnsupportedEncodingException;
import java.lang.reflect.Array;
import java.lang.reflect.Method;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Universal Request Context Adaptor for Java.
 *
 * <p>Extracts request data into a {@link PlainDataObject}. Supports multiple input shapes via
 * reflection so this class has no compile-time dependency on Servlet API or Spring WebFlux:
 *
 * <ul>
 *   <li>{@code null} or unknown type &rarr; empty defaults
 *   <li>{@link PlainDataObject} &rarr; returned as-is
 *   <li>{@link Map} (environ-style: HTTP_HOST / HTTP_REFERER / ...) &rarr; direct extraction
 *   <li>Servlet-like (any object exposing {@code getHeader(String)} and {@code getQueryString()})
 *       &rarr; works with both javax.servlet and jakarta.servlet HttpServletRequest
 *   <li>Spring WebFlux-like (any object exposing {@code getURI()} and {@code getHeaders()}) &rarr;
 *       works with org.springframework.http.server.reactive.ServerHttpRequest
 * </ul>
 *
 * <p>Mirrors the JS / PHP / Python / Ruby adaptors. Cookie values are percent-decoded with literal
 * {@code +} preserved (JWT / base64 friendly). Cookie pair parsing is per-pair isolated so one bad
 * neighbor never wipes out {@code _fbc} / {@code _fbp}.
 */
public final class RequestContextAdaptor {

  private RequestContextAdaptor() {}

  /**
   * Extract a {@link PlainDataObject} from a request-like input.
   *
   * @param request the request object (Servlet / WebFlux / Map / PlainDataObject) or {@code null}
   * @return a populated PlainDataObject, never {@code null}
   */
  public static PlainDataObject extract(Object request) {
    Holder h = new Holder();
    if (request == null) {
      return h.build();
    }
    if (request instanceof PlainDataObject) {
      return (PlainDataObject) request;
    }
    try {
      if (request instanceof Map) {
        extractFromMap((Map<?, ?>) request, h);
      } else {
        Class<?> clazz = request.getClass();
        if (hasMethod(clazz, "getHeader", String.class) && hasMethod(clazz, "getQueryString")) {
          extractServlet(request, h);
        } else if (hasMethod(clazz, "getURI") && hasMethod(clazz, "getHeaders")) {
          extractWebFlux(request, h);
        }
      }
    } catch (Exception e) {
      // Silently swallow exceptions and return defaults; callers should not
      // be punished for an unrecognized request shape. Note: VirtualMachineError,
      // ThreadDeath, LinkageError, and other Errors propagate intentionally —
      // those indicate broken process state and should not be hidden.
    }
    return h.build();
  }

  // ---------------------------------------------------------------------------
  // Strategy: raw Map / environ
  // ---------------------------------------------------------------------------

  private static void extractFromMap(Map<?, ?> env, Holder h) {
    String host = stringValue(env.get("HTTP_HOST"));
    if (host != null && !host.isEmpty()) {
      h.host = host;
    }
    h.referer = nilify(stringValue(env.get("HTTP_REFERER")));
    h.xForwardedFor = nilify(stringValue(env.get("HTTP_X_FORWARDED_FOR")));
    h.remoteAddress = nilify(stringValue(env.get("REMOTE_ADDR")));

    String qs = stringValue(env.get("QUERY_STRING"));
    if (qs != null && !qs.isEmpty()) {
      h.queryParams = parseQueryString(qs);
    }
    String cookieHeader = stringValue(env.get("HTTP_COOKIE"));
    if (cookieHeader != null && !cookieHeader.isEmpty()) {
      h.cookies = parseCookieHeader(cookieHeader);
    }

    String requestScheme = stringValue(env.get("REQUEST_SCHEME"));
    if (requestScheme != null && !requestScheme.isEmpty()) {
      h.scheme = requestScheme.toLowerCase(java.util.Locale.ROOT);
    } else {
      String https = stringValue(env.get("HTTPS"));
      if (https != null && !https.isEmpty() && !"off".equalsIgnoreCase(https)) {
        h.scheme = "https";
      }
    }

    h.requestUri = nilify(stringValue(env.get("REQUEST_URI")));
  }

  // ---------------------------------------------------------------------------
  // Strategy: Servlet (javax.servlet or jakarta.servlet via reflection)
  // ---------------------------------------------------------------------------

  private static void extractServlet(Object req, Holder h) {
    String host = invokeStringHeader(req, "Host");
    if (host != null && !host.isEmpty()) {
      h.host = host;
    }
    h.referer = nilify(invokeStringHeader(req, "Referer"));
    h.xForwardedFor = nilify(invokeStringHeader(req, "X-Forwarded-For"));

    Object remote = invokeNoArg(req, "getRemoteAddr");
    if (remote != null) {
      h.remoteAddress = nilify(remote.toString());
    }

    Object qs = invokeNoArg(req, "getQueryString");
    if (qs instanceof String) {
      h.queryParams = parseQueryString((String) qs);
    }

    // Cookies: prefer the container-parsed Cookie[] (already split into name/value).
    Object cookies = invokeNoArg(req, "getCookies");
    if (cookies != null && cookies.getClass().isArray()) {
      Map<String, String> cookieMap = new HashMap<String, String>();
      int len = Array.getLength(cookies);
      for (int i = 0; i < len; i++) {
        try {
          Object cookie = Array.get(cookies, i);
          Object name = invokeNoArg(cookie, "getName");
          if (name instanceof String) {
            // Servlet `Cookie.getValue()` may return null per spec; coerce
            // to empty string so the cookie is preserved (matches PHP /
            // Python / Ruby which keep `name=` as `""`).
            Object value = invokeNoArg(cookie, "getValue");
            cookieMap.put((String) name, value instanceof String ? (String) value : "");
          }
        } catch (Exception e) {
          // Per-cookie isolation: skip only the bad entry.
        }
      }
      h.cookies = cookieMap;
    } else {
      // Fallback: parse the raw `Cookie` header ourselves so we apply the
      // same robust per-pair / `+` preserving logic as the other languages.
      String raw = invokeStringHeader(req, "Cookie");
      if (raw != null && !raw.isEmpty()) {
        h.cookies = parseCookieHeader(raw);
      }
    }

    Object schemeObj = invokeNoArg(req, "getScheme");
    if (schemeObj instanceof String) {
      String raw = nilify((String) schemeObj);
      h.scheme = raw != null ? raw.toLowerCase(java.util.Locale.ROOT) : null;
    }

    Object requestUriObj = invokeNoArg(req, "getRequestURI");
    if (requestUriObj instanceof String) {
      String uri = (String) requestUriObj;
      if (qs instanceof String) {
        uri = uri + "?" + (String) qs;
      }
      h.requestUri = nilify(uri);
    }
  }

  // ---------------------------------------------------------------------------
  // Strategy: Spring WebFlux ServerHttpRequest via reflection
  // ---------------------------------------------------------------------------

  private static void extractWebFlux(Object req, Holder h) {
    Object headers = invokeNoArg(req, "getHeaders");
    if (headers != null) {
      String host = invokeStringFirst(headers, "Host");
      if (host != null && !host.isEmpty()) {
        h.host = host;
      }
      h.referer = nilify(invokeStringFirst(headers, "Referer"));
      h.xForwardedFor = nilify(invokeStringFirst(headers, "X-Forwarded-For"));
    }

    Object uri = invokeNoArg(req, "getURI");
    if (uri != null) {
      Object rawQuery = invokeNoArg(uri, "getRawQuery");
      if (rawQuery instanceof String) {
        h.queryParams = parseQueryString((String) rawQuery);
      }

      Object schemeObj = invokeNoArg(uri, "getScheme");
      if (schemeObj instanceof String) {
        String raw = nilify((String) schemeObj);
        h.scheme = raw != null ? raw.toLowerCase(java.util.Locale.ROOT) : null;
      }

      Object rawPath = invokeNoArg(uri, "getRawPath");
      if (rawPath instanceof String) {
        String requestUri = (String) rawPath;
        if (rawQuery instanceof String) {
          requestUri = requestUri + "?" + (String) rawQuery;
        }
        h.requestUri = nilify(requestUri);
      }
    }

    Object remote = invokeNoArg(req, "getRemoteAddress");
    if (remote != null) {
      h.remoteAddress = nilify(formatInetSocketAddress(remote));
    }

    // WebFlux exposes cookies as MultiValueMap<String, HttpCookie>.
    Object cookieMap = invokeNoArg(req, "getCookies");
    if (cookieMap instanceof Map) {
      Map<String, String> result = new HashMap<String, String>();
      for (Map.Entry<?, ?> entry : ((Map<?, ?>) cookieMap).entrySet()) {
        try {
          Object k = entry.getKey();
          Object v = entry.getValue();
          if (!(k instanceof String) || !(v instanceof List)) {
            continue;
          }
          List<?> list = (List<?>) v;
          if (list.isEmpty()) {
            continue;
          }
          Object cookie = list.get(0);
          if (cookie == null) {
            continue;
          }
          Object value = invokeNoArg(cookie, "getValue");
          // Preserve empty string when the cookie value is null, matching
          // the manual cookie parser and other-language behavior.
          result.put((String) k, value instanceof String ? (String) value : "");
        } catch (Exception e) {
          // Per-cookie isolation
        }
      }
      h.cookies = result;
    }
  }

  // ---------------------------------------------------------------------------
  // Cookie / query parsing helpers
  // ---------------------------------------------------------------------------

  /**
   * Manual cookie parse with per-pair isolation. Splits each pair on the first {@code =} only, so
   * values containing literal {@code =} (e.g. base64 padding {@code _fbc=fb.1.123.YWJjZA==}) are
   * preserved intact. Decode failures are isolated per pair so one malformed {@code %XX} does not
   * drop every cookie.
   */
  static Map<String, String> parseCookieHeader(String raw) {
    Map<String, String> result = new HashMap<String, String>();
    if (raw == null || raw.isEmpty()) {
      return result;
    }
    for (String pair : raw.split(";")) {
      int eq = pair.indexOf('=');
      if (eq <= 0) {
        // Skip malformed pairs (no `=`) and pairs with empty key.
        continue;
      }
      String key = pair.substring(0, eq).trim();
      if (key.isEmpty()) {
        continue;
      }
      String value = pair.substring(eq + 1).trim();
      try {
        result.put(key, percentDecode(value));
      } catch (Exception e) {
        // Per-pair isolation: skip only this malformed pair, keep the rest.
      }
    }
    return result;
  }

  /**
   * Parse a query string into {@code Map<String, List<String>>}, preserving repeated keys (matches
   * Python {@code parse_qs} and Ruby {@code CGI.parse}). Standard form-encoding semantics are
   * applied, so {@code +} in query strings is treated as a space (per HTML form spec).
   */
  static Map<String, List<String>> parseQueryString(String qs) {
    Map<String, List<String>> result = new HashMap<String, List<String>>();
    if (qs == null || qs.isEmpty()) {
      return result;
    }
    for (String pair : qs.split("&")) {
      int eq = pair.indexOf('=');
      String rawKey;
      String rawValue;
      if (eq < 0) {
        rawKey = pair;
        rawValue = "";
      } else {
        rawKey = pair.substring(0, eq);
        rawValue = pair.substring(eq + 1);
      }
      try {
        String key = URLDecoder.decode(rawKey, "UTF-8");
        if (key.isEmpty()) {
          continue;
        }
        String value = URLDecoder.decode(rawValue, "UTF-8");
        List<String> bucket = result.get(key);
        if (bucket == null) {
          bucket = new ArrayList<String>();
          result.put(key, bucket);
        }
        bucket.add(value);
      } catch (Exception e) {
        // Per-pair isolation
      }
    }
    return result;
  }

  /**
   * Percent-decode a cookie value WITHOUT converting {@code +} to space. {@link URLDecoder} applies
   * form decoding ({@code +} -&gt; {@code ' '}), which would corrupt base64 / JWT-like cookie
   * values. Pre-escaping {@code +} to {@code %2B} causes URLDecoder to restore them as literal
   * {@code +}.
   */
  static String percentDecode(String value) {
    if (value == null || value.isEmpty()) {
      return value;
    }
    String escaped = value.replace("+", "%2B");
    try {
      return URLDecoder.decode(escaped, "UTF-8");
    } catch (UnsupportedEncodingException e) {
      // UTF-8 is always supported on JDK 1.5+; defensive fallback.
      return value;
    }
  }

  // ---------------------------------------------------------------------------
  // Reflection helpers
  // ---------------------------------------------------------------------------

  private static boolean hasMethod(Class<?> clazz, String name, Class<?>... params) {
    try {
      clazz.getMethod(name, params);
      return true;
    } catch (NoSuchMethodException e) {
      return false;
    }
  }

  private static Object invokeNoArg(Object obj, String name) {
    if (obj == null) {
      return null;
    }
    try {
      Method m = obj.getClass().getMethod(name);
      return m.invoke(obj);
    } catch (Exception e) {
      return null;
    }
  }

  private static String invokeStringHeader(Object req, String headerName) {
    if (req == null) {
      return null;
    }
    try {
      Method m = req.getClass().getMethod("getHeader", String.class);
      Object v = m.invoke(req, headerName);
      return v instanceof String ? (String) v : null;
    } catch (Exception e) {
      return null;
    }
  }

  private static String invokeStringFirst(Object headers, String headerName) {
    if (headers == null) {
      return null;
    }
    try {
      Method m = headers.getClass().getMethod("getFirst", String.class);
      Object v = m.invoke(headers, headerName);
      return v instanceof String ? (String) v : null;
    } catch (Exception e) {
      return null;
    }
  }

  /**
   * Format a Spring WebFlux {@code getRemoteAddress()} return value (typically a {@link
   * java.net.InetSocketAddress}) as a bare IP string. Plain {@code toString()} on InetSocketAddress
   * yields {@code "/127.0.0.1:8080"} (with the leading slash and port), which diverges from the
   * IP-only format produced by the JS / PHP / Python / Ruby SDKs.
   *
   * <p>Reflection avoids any compile-time dependency on {@code java.net.InetSocketAddress}.
   */
  private static String formatInetSocketAddress(Object addr) {
    Object inet = invokeNoArg(addr, "getAddress"); // InetSocketAddress -> InetAddress (or null)
    if (inet != null) {
      Object hostAddr = invokeNoArg(inet, "getHostAddress");
      if (hostAddr instanceof String) {
        return (String) hostAddr;
      }
    }
    // Fallback for unresolved addresses or other shapes: getHostString() returns
    // the literal hostname/IP string without the leading slash.
    Object hostString = invokeNoArg(addr, "getHostString");
    if (hostString instanceof String) {
      return (String) hostString;
    }
    return addr.toString();
  }

  private static String stringValue(Object o) {
    return o == null ? null : o.toString();
  }

  private static String nilify(String s) {
    return (s == null || s.isEmpty()) ? null : s;
  }

  // ---------------------------------------------------------------------------
  // Internal mutable holder so strategies can fill fields in place.
  // ---------------------------------------------------------------------------

  private static final class Holder {
    String host = "";
    Map<String, List<String>> queryParams = new HashMap<String, List<String>>();
    Map<String, String> cookies = new HashMap<String, String>();
    String referer = null;
    String xForwardedFor = null;
    String remoteAddress = null;
    String scheme = null;
    String requestUri = null;

    PlainDataObject build() {
      return new PlainDataObject(
          host, queryParams, cookies, referer, xForwardedFor, remoteAddress, scheme, requestUri);
    }
  }
}
