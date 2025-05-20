# Conversions API parameter builder for Ruby

[![RubyGem](https://img.shields.io/gem/v/capi_param_builder_ruby)](https://rubygems.org/gems/capi_param_builder_ruby)
[![License](https://img.shields.io/badge/license-Facebook%20Platform-blue.svg?style=flat-square)](https://github.com/facebook/capi-param-builder/blob/main/ruby/LICENSE)

## Introduction

The Conversions API param builder is a light weighted SDK to help improve the
Conversions API params' retrieval and quality.

[Server-Side Parameter Builder Onboarding Guide](https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder-feature-library/server-side-onboarding)

## Quick Start

1. Check the latest version in CHANGELOG.

2. Install the library.

```
gem install capi_param_builder_ruby

```

3. Verify by run

```
gem list | grep capi_param_builder_ruby

```

Verify the SDK name and version.

### Demo

1. Checkout demo application ./example

2. Install the capi_param_builder library, from above #Quick Start. Also install
   optional 3rd party library(sinatra, public_suffix) to run the demo.

2.1 sinatra. Install by running `gem install sinatra`. An easy web framwork.

2.2 (optional) public_suffix. Install by running `gem install public_suffix`. It
will help resolve etld+1, if you'd prefer to use this option to get your etld+1
domain. It's used under./resolver/default_etld_plus_one_resolver.rb as one
example to use etld+1 resolver. For usage, please check in #Usage section below.

3. Run local demo server. Once you have capi_param_builder, sinatra library
   installed. Run the demo application.

```

cd ./example
ruby app.rb

```

4. Verification.

   4.1 Visit `http://localhost:4567/`. You'll see the demo page with `fbc` and
   `fbp` value printed on main page. Open dev inspector to check the cookies,
   same value should be in `_fbc` and `_fbp`. `fbc` might be null if this is
   your first time visiting.

   4.2 Visit `http://localhost:4567/?fbclid=this_is_my_test`. You'll see the
   `_fbc` and `fbc` value changed. The new value should contain the string
   `this_is_my_test`. The `_fbp` value should be the same as 4.1.

   4.3 Visit `http://localhost:4567` again. You'll see the `_fbc` and `_fbp`
   stays the same as 4.1 and 4.2.

## API usage

This section explains how to use the SDK. And provide suggestions on the API
usage.

1. Install the capi_param_builder library, from above #Quick Start.
2. Import the class as `require 'capi_param_builder'`
3. Construct your ParamBuilder. We provide 3 options.

[Recommended] Option 1: Provide a list of etld+1. We'll use the etld+1 to match
your current hostname, then provide recommended update cookies' domain.

```

builder = ParamBuilder.new(["localhost", "example.com"])

```

Option 2: Provide an ETLD+1 resolver. Implement a customized ETLD+1 resolver to
provide the preferred etld+1 to save the cookies to.

```

# example implementation DefaultEtldPlusOneResolver from example/resolver. Feel free to provide your owne resolver.

builder = ParamBuilder.new(DefaultEtldPlusOneResolver.new())

```

Option 3: [Not recommended] empty input. We'll return one level down from your
input host. May miss some accuracy.

```

builder = ParamBuilder.new()

```

4. Call `process_request` function to process fbc and fbp

```

cookies_to_be_updated = builder.process_request(
   domain, # str: current host
   name query_params, #dict[str, List[str]]: query params as hash type
   cookie_dict,#dict[str, str]: current cookies as hash type
   referral_link) #Optional[str]: optional current referer

```

5. [Recommended] Save `cookies_to_be_updated` as first-party cookies. This helps
   keep consistent fbc and fbp among your events. Based on your webserver
   framework, the save cookie API may vary. Feel free to choose the best fit for
   your use case. Below uses the example from demo application.

Option 1: Save the `cookies_to_be_updated` cookies from `process_request` to
your response.

```

# Get the recoomended saved cookie from step 4 above

cookies_to_be_updated = builder.process_request(...)

for cookie in cookies_to_be_updated do response.set_cookie(
    cookie.name,
    value: cookie.value,
    domain: cookie.domain, path: "/",
    # for sinatra the expires is an absolute ts
    # Check your web framework to have the correct expires.
    expires: Time.now + cookie.max_age)
end

```

Option 2: Save the recommended cookies from `get_cookies_to_set` to your
response.

```

# Get the recoomended saved cookie from step 4 above

builder.process_request(...)

# `cookies_to_be_updated` from get_cookies_to_set()

for cookie in builder.get_cookies_to_set() do
   response.set_cookie(
      cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: "/",
      # for sinatra the expire time, is an absolute ts
      # Check your web framework to have the correct expires.
      expires: Time.now + cookie.max_age)
end

```

6. get correct fbc and fbp.

```

fbc = builder.get_fbc()

```

```

fbp = builder.get_fbp()

```

7. Send fbc and fbp back with the Conversions API.

```

data=[
   'event_name: '...',
   'event_tme': <your_time>,
   'user_data': {
      'fbc': fbc, // The value provided in step 5
      'fbp': fbp, // The value provided in step 5 ...
   }
...
]

```

## License

Conversions API parameter builder for Ruby is licensed under the LICENSE file in
the root directory of this source tree.
