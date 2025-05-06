# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

require 'sinatra'
# require_relative 'resolver/default_etld_plus_one_resolver' #optional
require 'capi_param_builder'

get '/' do
    puts "print test started"
    puts "print full url: #{request.url}"
    puts "print all the cookies: #{request.cookies}"
    puts "print referer: #{request.referer || 'unknown'}"
    puts "print params: #{params}"
    # Constructor has 3 options:
    # Option 1: recommended.
    # Pass list of string as etld_plus_one. We'll match your etld_plus_one with the host name
    builder = ParamBuilder.new(["localhost", "example.com"])
    # Option 2: pass a resolver. The resolver will be used to get etld+1 for the host
    # Feel free to integrate your own EtldPlusOneResolver. The default one is using gem public_suffix lib to get etld+1
    # if no matching, just return original host name
    # The default example is located in ./example/resolver/default_etld_plus_one_resolver.rb
    # builder = ParamBuilder.new(DefaultEtldPlusOneResolver.new())
    # Option 3: leave input params empty. We'll return domain as one level down from your input host.
    # Not recommended. This may miss some accuracy.
    # builder = ParamBuilder.new()
    # get list of cookies to be saved
    cookies_to_be_updated = builder.process_request(
        request.host, # current host name
        params, # query params as hash type
        request.cookies, # current cookies as hash type
        request.referer) # optional current referer
    # Save cookies
    for cookie in cookies_to_be_updated do
        response.set_cookie(
            cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: "/",
            # for sinatra the expires is an absolute ts
            # Check your web framework to have the correct expires.
            expires: Time.now + cookie.max_age)
    end

    # Get fbc and fbp
    fbc = builder.get_fbc()
    puts "fbc is #{fbc}"
    fbp = builder.get_fbp()
    puts "fbp is #{fbp}"
    "hello world. The fbc is #{fbc.nil?? 'none' : fbc} and fbp is #{fbp}"

    # Set fbc and fbp to your CAPI events
end
