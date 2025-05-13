# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

require_relative 'model/fbc_param_configs'
require_relative 'model/cookie_settings'
require_relative 'model/etld_plus_one_resolver'
require 'set'
require 'uri'
require 'cgi'

class ParamBuilder
  FBC_NAME = "_fbc"
  FBP_NAME = "_fbp"
  DEFAULT_1PC_AGE = 90 * 24 * 3600
  LANGUAGE_TOKEN = "BQ"
  SUPPORTED_LANGUAGE_TOKENS = ["AQ", "Ag", "Aw", "BA", "BQ", "Bg"]
  MIN_PAYLOAD_SPLIT_LENGTH = 4
  MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_LENGTH = 5
  IPV4_REGEX = /\A(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\z/
  IPV6_REGEX = /\A(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\z|\A(?:[0-9a-fA-F]{1,4}:){1,7}:\z|\A(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}\z|\A(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}\z|\A(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}\z|\A(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}\z|\A(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}\z|\A[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}\z|\A:(?::[0-9a-fA-F]{1,4}){1,7}\z|\A::\z|\A(?:[0-9a-fA-F]{1,4}:){6}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\z/

  def initialize(input = nil)
    @fbc_params_configs = [FbcParamConfigs.new("fbclid", "", "clickID")]

    if input.nil?
      return
    end

    if input.is_a?(Array)
      @domain_list = []
      input.each do |domain_item|
        @domain_list.push(extract_host_from_http_host(domain_item.downcase))
      end
    elsif input.is_a?(EtldPlusOneResolver)
      @etld_plus_one_resolver = input
    end
  end

  private def pre_process_cookies(cookies, cookie_name)
    # Sanity check
    if cookies.nil? || cookies[cookie_name].nil?
      return nil
    end
    cookie_value = cookies[cookie_name]
    parts = cookie_value.split(/\./)
    if parts.size < MIN_PAYLOAD_SPLIT_LENGTH || \
      parts.size > MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_LENGTH
      return nil
    end
    if parts.size == MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_LENGTH && \
      !SUPPORTED_LANGUAGE_TOKENS.include?(parts[MAX_PAYLOAD_WITH_LANGUAGE_TOKEN_LENGTH - 1])
      return nil
    end
    # Append language token if not present
    if parts.size == MIN_PAYLOAD_SPLIT_LENGTH
      updated_cookie_value = cookie_value + "." + LANGUAGE_TOKEN
      @cookie_to_set_dict[cookie_name] = CookieSettings.new(
        cookie_name, updated_cookie_value, @etld_plus_one, DEFAULT_1PC_AGE)
      return updated_cookie_value
    end
    # No change
    return cookie_value
  end

  private def build_param_configs(
      existing_payload, current_query, prefix, value)
    is_click_id = current_query == "fbclid"
    existing_payload ||= ""
    existing_payload += \
      [is_click_id ? "" : "_", prefix, is_click_id ? "" : "_", value].join
    return existing_payload
  end

  private def get_new_fbc_payload_from_url(queries, referer=nil)
    # Get query params from referer
    if !referer.nil?
      referer_uri = URI.parse(referer)
      if !referer_uri.query.nil?
        referer_query_params = CGI.parse(referer_uri.query)
      end
    end
    # Get the new fbc payload
    new_fbc_payload = nil
    @fbc_params_configs.each do |config|
      if !queries.nil? && queries.has_key?(config.query)
        query_value = queries[config.query]
        if query_value.is_a?(Array)
          query_value = queries[config.query][0]
        end
        new_fbc_payload = build_param_configs(
          new_fbc_payload, config.query, config.prefix, query_value)
      elsif !referer_query_params.nil? && \
        referer_query_params.has_key?(config.query)
          query_value = referer_query_params[config.query]
          if query_value.is_a?(Array)
            query_value = referer_query_params[config.query][0]
          end
          new_fbc_payload = build_param_configs(
            new_fbc_payload, config.query, config.prefix, query_value)
      end
    end
    return new_fbc_payload
  end

  def process_request(host, queries, cookies, referer=nil)
    compute_etld_plus_one_for_host(host)
    @cookie_to_set_dict = {}
    @cookie_to_set = Set.new()
    @fbc = pre_process_cookies(cookies, FBC_NAME)
    @fbp = pre_process_cookies(cookies, FBP_NAME)

    # Get new fbc payload
    new_fbc_payload = get_new_fbc_payload_from_url(queries, referer)

    # fbc update
    updated_fbc_cookie = get_updated_fbc_cookie(@fbc, new_fbc_payload)
    if !updated_fbc_cookie.nil?
      @cookie_to_set_dict[FBC_NAME] = updated_fbc_cookie
      @fbc = updated_fbc_cookie.value
    end
    # fbp update
    updated_fbp_cookie = get_updated_fbp_cookie(@fbp)
    if !updated_fbp_cookie.nil?
      @cookie_to_set_dict[FBP_NAME] = updated_fbp_cookie
      @fbp = updated_fbp_cookie.value
    end
    @cookie_to_set = Set.new(@cookie_to_set_dict.values)
    return @cookie_to_set
  end

  def get_cookies_to_set()
    return @cookie_to_set
  end

  def get_fbc()
    return @fbc
  end

  def get_fbp()
    return @fbp
  end

  private def compute_etld_plus_one_for_host(host)
    if @etld_plus_one.nil? || @host.nil?
      @host = host
      host_name = extract_host_from_http_host(host)
      if is_ip_address(host_name)
        @etld_plus_one = maybe_bracket_ipv6(host_name)
        @sub_domain_index = 0
      else
        @etld_plus_one = get_etld_plus_one(host_name)
        @sub_domain_index = @etld_plus_one.split(".").size - 1
      end
    end
  end

  private def extract_host_from_http_host(host)
    if !host.rindex("://").nil?
      host = host.split("://", 2)[1]
    end
    pos_colon = host.rindex(":")
    pos_bracket = host.rindex("]")

    if pos_colon.nil?
      return host
    end
    # if there's no right bracket (not IPv6 host), or colon is after
    # right bracket it's a port separator
    # examples:
    #  [::1]:8080 => trim
    #  google.com:8080 => trim
    if pos_bracket.nil? || pos_colon > pos_bracket
      host = host[0...pos_colon]
    end
    # for IPv6, remove the brackets
    length = host.length
    if length >= 2 && host[0] == "[" && host[length - 1] == "]"
        return host[1 ... length - 1]
    end
    return host
  end

  private def is_ip_address(hostname)
    is_ipv4 = IPV4_REGEX.match(hostname)
    if !is_ipv4.nil?
      return true
    end
    is_ipv6 = IPV6_REGEX.match(hostname)
    return !is_ipv6.nil?
  end

  private def maybe_bracket_ipv6(host)
    if host.rindex(":") != nil
      return "[" + host + "]"
    end
    return host
  end

  private def get_etld_plus_one(host_name)
    if !@etld_plus_one_resolver.nil?
      return @etld_plus_one_resolver.resolve(host_name)
    elsif !@domain_list.nil?
        @domain_list.each do |domain|
          normalized_host_name = host_name.downcase
          if normalized_host_name == domain ||
            normalized_host_name.end_with?(".#{domain}")
            return domain
          end
        end
    end
    if host_name.count(".") > 2
      return host_name.split(".", 2)[1]
    end
    return host_name
  end

  private def get_updated_fbc_cookie(existing_fbc = nil, new_fbc_payload)
    if @fbc_params_configs.nil?
      return nil
    end

    if new_fbc_payload.nil?
      return nil
    end

    if existing_fbc.nil?
      cookie_update = true
    else
      parts = existing_fbc.split(/\./)
      cookie_update = new_fbc_payload != parts[3]
    end
    if cookie_update == false
      return nil
    end

    current_ms = (Time.now.to_f * 1000).to_i.to_s
    new_fbc = "fb." +
      @sub_domain_index.to_s +
      "." +
      current_ms +
      "." +
      new_fbc_payload +
      "." +
      LANGUAGE_TOKEN
    updated_cookie_setting = CookieSettings.new(
      FBC_NAME, new_fbc, @etld_plus_one, DEFAULT_1PC_AGE)
    return updated_cookie_setting
  end

  private def get_updated_fbp_cookie(existing_fbp = nil)
    if existing_fbp != nil
      return nil
    end
    new_fbp_payload = rand(0..2147483647).to_s
    current_ms = (Time.now.to_f * 1000).to_i.to_s
    new_fbp = "fb." +
      @sub_domain_index.to_s +
      "."  +
      current_ms +
      "." +
      new_fbp_payload +
      "." +
      LANGUAGE_TOKEN
    updated_cookie_setting = CookieSettings.new(
      FBP_NAME, new_fbp, @etld_plus_one, DEFAULT_1PC_AGE)
    return updated_cookie_setting
  end
end
