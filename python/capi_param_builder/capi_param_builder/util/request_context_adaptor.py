# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

import urllib.parse
from typing import Any, Dict, List, Optional

from ..model.plain_data_object import PlainDataObject

_ASGI_HTTP_TYPES = ("http", "websocket")


def _parse_query_string(query_string: str) -> Dict[str, List[str]]:
    if not query_string:
        return {}
    return urllib.parse.parse_qs(query_string, keep_blank_values=True)


def _parse_cookie_header(raw_cookie: str) -> Dict[str, str]:
    """
    Manual cookie parse with per-pair isolation.

    We avoid `http.cookies.SimpleCookie` because it silently drops the
    entire batch when one cookie has a name its internal regex rejects
    (e.g. spaces or brackets, which can appear in third-party / CDN
    cookies sharing the same Cookie header). It also strips RFC-2109
    quoted-value quotes, which diverges from the JS / PHP / Ruby
    adaptors. Splitting on the first `=` per pair preserves base64
    padding and any literal `=`/`+` in the value.
    """
    if not raw_cookie:
        return {}
    cookies: Dict[str, str] = {}
    for pair in raw_cookie.split(";"):
        eq = pair.find("=")
        if eq <= 0:
            # Skip malformed pairs (no `=`) and pairs with an empty key.
            continue
        key = pair[:eq].strip()
        if not key:
            continue
        cookies[key] = pair[eq + 1 :].strip()
    return cookies


def _resolve_asgi_scope(request_obj: Any) -> Optional[Dict[str, Any]]:
    scope = getattr(request_obj, "scope", None)
    if isinstance(scope, dict) and scope.get("type") in _ASGI_HTTP_TYPES:
        return scope
    if isinstance(request_obj, dict) and request_obj.get("type") in _ASGI_HTTP_TYPES:
        return request_obj
    return None


def _get_asgi_headers(raw_headers: List, name: str, separator: str = ", ") -> str:
    target = name.lower().encode("latin-1")
    matches = []
    for k, v in raw_headers:
        # ASGI spec requires lowercase header names, but raw test scopes
        # sometimes carry mixed-case keys; lowercasing defensively avoids
        # silently dropping them. latin-1 decode of arbitrary bytes
        # cannot fail, so no error handler is needed.
        key = k.lower() if isinstance(k, (bytes, bytearray)) else b""
        if key == target:
            matches.append(v.decode("latin-1"))
    return separator.join(matches)


def _get_wsgi_environ(request_obj: Any) -> Dict[str, Any]:
    if hasattr(request_obj, "environ") and isinstance(request_obj.environ, dict):
        return request_obj.environ
    if hasattr(request_obj, "META") and isinstance(request_obj.META, dict):
        return request_obj.META
    if isinstance(request_obj, dict):
        return request_obj
    return {}


def _format_host_port(host: str, port: Any, scheme: str) -> str:
    """Build a host[:port] authority, bracketing bare IPv6 literals."""
    default_port = 443 if scheme in ("https", "wss") else 80
    if port is None or str(port) == str(default_port):
        return host
    # Bracket bare IPv6 literals so `[::1]:8080` is unambiguous.
    if ":" in host and not host.startswith("["):
        host = f"[{host}]"
    return f"{host}:{port}"


def _wsgi_host(environ: Dict[str, Any]) -> str:
    host = environ.get("HTTP_HOST")
    if host:
        return host
    server_name = environ.get("SERVER_NAME")
    if not server_name:
        return ""
    server_port = environ.get("SERVER_PORT")
    scheme = environ.get("wsgi.url_scheme", "http")
    return _format_host_port(server_name, server_port, scheme)


class RequestContextAdaptor:
    """
    Universal Request Context Adaptor for Python.
    Extracts request data from ASGI scopes (FastAPI, Starlette) and
    WSGI environ-style requests (Django, Flask, raw WSGI dicts).
    """

    @staticmethod
    def extract(request_obj: Any = None) -> PlainDataObject:
        # 1. Initialize Defaults (matching PlainDataObject types)
        host: str = ""
        query_params: Dict[str, List[str]] = {}
        cookies: Dict[str, str] = {}
        referer = None
        x_forwarded_for = None
        remote_address = None
        scheme = None
        request_uri = None

        if request_obj is None:
            return PlainDataObject(
                host,
                query_params,
                cookies,
                referer,
                x_forwarded_for,
                remote_address,
                scheme,
                request_uri,
            )

        try:
            # --- STRATEGY A: ASGI (FastAPI, Starlette, raw scope dict) ---
            scope = _resolve_asgi_scope(request_obj)
            if scope is not None:
                raw_headers = scope.get("headers", []) or []

                # HTTP/2 requests may only carry `:authority` (Hypercorn
                # and some proxy setups don't synthesize a `host` header);
                # fall back to it before reaching for `scope["server"]`,
                # which is the local bind address rather than the request
                # authority.
                host = _get_asgi_headers(raw_headers, "host") or _get_asgi_headers(
                    raw_headers, ":authority"
                )
                referer = _get_asgi_headers(raw_headers, "referer") or None
                x_forwarded_for = (
                    _get_asgi_headers(raw_headers, "x-forwarded-for") or None
                )

                if not host:
                    server = scope.get("server")
                    if server and len(server) > 0 and server[0]:
                        port = server[1] if len(server) > 1 else None
                        host = _format_host_port(
                            server[0], port, scope.get("scheme", "http")
                        )

                client = scope.get("client")
                if client and len(client) > 0:
                    remote_address = client[0]

                qs = scope.get("query_string", b"") or b""
                if isinstance(qs, (bytes, bytearray)):
                    qs = qs.decode("utf-8", errors="ignore")
                query_params = _parse_query_string(qs)

                # Per RFC 7540, HTTP/2 may split Cookie into multiple headers.
                cookies = _parse_cookie_header(
                    _get_asgi_headers(raw_headers, "cookie", separator="; ")
                )

                raw_scheme = scope.get("scheme")
                if isinstance(raw_scheme, str) and raw_scheme:
                    # RFC 3986 §3.1: scheme is case-insensitive; normalize like PHP strtolower().
                    scheme = raw_scheme.lower()

                # Prefer raw_path (percent-encoded original) over path (decoded by ASGI server).
                raw_path_bytes = scope.get("raw_path")
                if raw_path_bytes and isinstance(raw_path_bytes, (bytes, bytearray)):
                    path = raw_path_bytes.decode("latin-1")
                else:
                    path = scope.get("path", "")
                # ASGI spec requires path to start with "/"; defensive fallback for non-conformant servers.
                if not path and qs:
                    path = "/"
                if qs:
                    request_uri = f"{path}?{qs}"
                else:
                    request_uri = path or None

                return PlainDataObject(
                    host,
                    query_params,
                    cookies,
                    referer,
                    x_forwarded_for,
                    remote_address,
                    scheme,
                    request_uri,
                )

            # --- STRATEGY B: WSGI (Django, Flask, raw WSGI dict) ---
            environ = _get_wsgi_environ(request_obj)
            if environ:
                host = _wsgi_host(environ)
                referer = environ.get("HTTP_REFERER") or None
                x_forwarded_for = environ.get("HTTP_X_FORWARDED_FOR") or None
                remote_address = environ.get("REMOTE_ADDR") or None

                query_params = _parse_query_string(
                    environ.get("QUERY_STRING", "") or ""
                )
                cookies = _parse_cookie_header(environ.get("HTTP_COOKIE", "") or "")

                scheme_val = environ.get("REQUEST_SCHEME") or environ.get(
                    "wsgi.url_scheme"
                )
                if scheme_val:
                    # RFC 3986 §3.1: scheme is case-insensitive; normalize like PHP strtolower().
                    scheme = scheme_val.lower()
                else:
                    https_val = environ.get("HTTPS", "")
                    if https_val and str(https_val).lower() != "off":
                        scheme = "https"
                    else:
                        scheme = "http"

                request_uri_val = environ.get("REQUEST_URI")
                if request_uri_val:
                    request_uri = request_uri_val
                else:
                    # Full external path = SCRIPT_NAME (mount prefix) + PATH_INFO.
                    script_name = environ.get("SCRIPT_NAME", "")
                    path_info = environ.get("PATH_INFO", "")
                    full_path = script_name + path_info
                    qs_val = environ.get("QUERY_STRING", "") or ""
                    if not full_path and qs_val:
                        full_path = "/"
                    if full_path:
                        request_uri = f"{full_path}?{qs_val}" if qs_val else full_path

        except Exception:
            # Silently ignore exceptions and return the object with default values
            pass

        return PlainDataObject(
            host,
            query_params,
            cookies,
            referer,
            x_forwarded_for,
            remote_address,
            scheme,
            request_uri,
        )
