# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

class PlainDataObject
    attr_accessor :host, :query_params, :cookies, :referer,
                  :x_forwarded_for, :remote_address, :scheme,
                  :request_uri

    def initialize(host, query_params, cookies, referer = nil,
                   x_forwarded_for = nil, remote_address = nil,
                   scheme = nil, request_uri = nil)
      @host = host
      @query_params = query_params
      @cookies = cookies
      @referer = referer
      @x_forwarded_for = x_forwarded_for
      @remote_address = remote_address
      @scheme = scheme
      @request_uri = request_uri
    end
end
