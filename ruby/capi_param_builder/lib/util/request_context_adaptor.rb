# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

require 'cgi'
require_relative '../model/plain_data_object'

# Universal Request Context Adaptor for Ruby.
#
# Extracts request data (host, query params, cookies, referer,
# x-forwarded-for, remote address) from a Rack-style environ hash or any
# framework request object that exposes #env (Rack, Rails, Sinatra). Falls
# back to empty defaults for nil or unrecognized inputs.
class RequestContextAdaptor
  HTTP_DEFAULT_PORT = 80
  HTTPS_DEFAULT_PORT = 443

  def self.extract(request_obj = nil)
    host = ''
    query_params = {}
    cookies = {}
    referer = nil
    x_forwarded_for = nil
    remote_address = nil

    if request_obj.nil?
      return PlainDataObject.new(
        host, query_params, cookies, referer, x_forwarded_for, remote_address
      )
    end

    begin
      env = resolve_env(request_obj)
      if env.is_a?(Hash) && !env.empty?
        host = wsgi_host(env)
        referer = nilify(env['HTTP_REFERER'])
        x_forwarded_for = nilify(env['HTTP_X_FORWARDED_FOR'])
        remote_address = nilify(env['REMOTE_ADDR'])

        query_params = parse_query_string(env['QUERY_STRING'])
        cookies = parse_cookie_header(env['HTTP_COOKIE'])
      end
    rescue StandardError
      # Silently swallow exceptions and return the object with default values.
    end

    PlainDataObject.new(
      host, query_params, cookies, referer, x_forwarded_for, remote_address
    )
  end

  def self.resolve_env(request_obj)
    if request_obj.respond_to?(:env) && request_obj.env.is_a?(Hash)
      return request_obj.env
    end
    return request_obj if request_obj.is_a?(Hash)
    nil
  end
  private_class_method :resolve_env

  def self.parse_query_string(query_string)
    return {} if query_string.nil? || query_string.to_s.empty?
    CGI.parse(query_string.to_s)
  end
  private_class_method :parse_query_string

  def self.parse_cookie_header(raw_cookie)
    return {} if raw_cookie.nil? || raw_cookie.to_s.empty?
    raw_cookie.to_s.split(';').each_with_object({}) do |pair, hash|
      parts = pair.split('=', 2)
      next unless parts.size == 2
      key = parts[0].strip
      next if key.empty?
      hash[key] = percent_decode(parts[1].strip)
    end
  end
  private_class_method :parse_cookie_header

  # Percent-decode a cookie value WITHOUT converting `+` to space. CGI.unescape
  # applies form decoding (`+` -> ` `), which would corrupt base64 / JWT-like
  # cookie values that legitimately contain `+`.
  def self.percent_decode(value)
    value.gsub(/%([0-9a-fA-F]{2})/) { [Regexp.last_match(1)].pack('H2') }
         .force_encoding(Encoding::UTF_8)
  end
  private_class_method :percent_decode

  def self.wsgi_host(env)
    host = env['HTTP_HOST']
    return host if host && !host.empty?
    server_name = env['SERVER_NAME']
    return '' if server_name.nil? || server_name.empty?
    server_port = env['SERVER_PORT']
    scheme = env['rack.url_scheme'] || 'http'
    format_host_port(server_name, server_port, scheme)
  end
  private_class_method :wsgi_host

  # Build a host[:port] authority, bracketing bare IPv6 literals. We always
  # bracket bare IPv6 — even when the port is omitted — so that downstream
  # `extract_host_from_http_host` (which treats the last `:` as a port
  # separator when no `]` is present) does not truncate the address.
  def self.format_host_port(host, port, scheme)
    bracketed = host.include?(':') && !host.start_with?('[') ? "[#{host}]" : host
    default_port =
      scheme == 'https' || scheme == 'wss' ? HTTPS_DEFAULT_PORT : HTTP_DEFAULT_PORT
    if port.nil? || port.to_s.empty? || port.to_s == default_port.to_s
      return bracketed
    end
    "#{bracketed}:#{port}"
  end
  private_class_method :format_host_port

  def self.nilify(value)
    return nil if value.nil?
    return nil if value.respond_to?(:empty?) && value.empty?
    value
  end
  private_class_method :nilify
end
