# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

import http.server
import socketserver
from http.cookies import SimpleCookie
from urllib.parse import parse_qs, urlparse

from capi_param_builder import ParamBuilder

# from resolver.default_etld_plus_one_resolver import DefaultEtldPlusOneResolver

PORT = 8000


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # demo start
        # Get domain host
        host = self.headers["Host"]

        parsed_path = urlparse(self.path)
        query_params = parse_qs(parsed_path.query)

        if "Cookie" in self.headers:
            cookie = SimpleCookie(self.headers["Cookie"])
            cookie_dict = self.cookie_to_dict(cookie)
        else:
            cookie_dict = {}

        # There're 3 options for constructor
        # Option 1: recommended. Pass list of string as etld_plus_one. We'll match your etld_plus_one with the host name
        paramBuilder = ParamBuilder(["localhost", "example.com"])
        # Option 2: pass a resolver. The resolver will be used to get etld+1 for the host
        # Feel free to integrate your own EtldPlusOneResolver. The default one is using tldextract lib to get etld+1, if
        # no matching, just return original host name
        # paramBuilder = ParamBuilder(DefaultEtldPlusOneResolver())
        # Option 3: leave input params empty. We'll return domain as one level down from your input host. Not recommended. This may miss some accuracy.
        # paramBuilder = ParamBuilder()

        # host: str, queries: dict[str, List[str]], cookies: dict[str, str], referer: Optional[str] = None is optional.
        updated_cookies = paramBuilder.process_request(
            host, query_params, cookie_dict, self.headers["Referer"]
        )
        # after process_request got called, you could call get_fbc() and get_fbp() to get the actual value for fbc and fbp
        fbc = paramBuilder.get_fbc()
        print(f"this is fbc: {fbc}")

        fbp = paramBuilder.get_fbp()
        print(f"this is fbp: {fbp}")

        # This method handles the HTTP GET requests.
        self.send_response(200)
        self.send_header("Content-type", "text/html")

        # Update cookies
        for cookie in updated_cookies:
            self.send_header(
                "Set-Cookie",
                f"{cookie.name}={cookie.value};Max-Age={cookie.max_age};path=/;domain={cookie.domain}",
            )
        # demo end
        self.end_headers()
        response_message = f"Hello, welcome to the local server! \n You requested: {host}.\n FBC: {fbc}.\n FBP: {fbp} \n"
        self.wfile.write(response_message.encode())

    def cookie_to_dict(self, cookie):
        """Convert a SimpleCookie object to a dictionary."""
        cookie_dict = {}
        for key, morsel in cookie.items():
            cookie_dict[key] = morsel.value
        return cookie_dict


# Set up the HTTP server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
