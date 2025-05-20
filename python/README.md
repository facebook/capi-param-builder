# Conversions API parameter builder for Python

[![PyPI](https://img.shields.io/pypi/v/capi-param-builder-python)](https://pypi.org/project/capi-param-builder-python/)
[![License](https://img.shields.io/badge/license-Facebook%20Platform-blue.svg?style=flat-square)](https://github.com/facebook/capi-param-builder/blob/main/python/LICENSE)

## Introduction

Conversions API parameter builder SDK is a lightweight tool for improving
Conversions API parameter retrieval and quality.

[Server-Side Parameter Builder Onboarding Guide](https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder-feature-library/server-side-onboarding)

## Quick Start

This is the quick start guide to help you integrate with the param builder with
a demo example.

### Setup

1. Check the latest version in CHANGELOG.

2. Install the library via pip CLI:

```
pip install capi_param_builder_python
```

Verify if the library install successfully by run

```
pip list
```

Verify the library name and version.

### Demo

1. Checkout the demo application under ./example

2. Go to ./example. Run `python server.py` to get the localhost demo started.

3. Visit `http://localhost:8000/` to view your local demo page. You should see
   `fbc` and `fbp` value printed on the home page. Open your browser's dev tool
   to check the cookies. You should see `fbc` and `fbp` cookies are the same
   value as printed.
4. [Optional] You could visit a website like:
   `http://localhost:8000/?fbclid=test` to further verify your cookie settings.
   You'll see the `fbc` cookie value contains `test`.
5. [Optional] Visit the `http://localhost:8000/` again. The `fbc` and `fbp`
   value should be the same as step 4.

## API usage

This section explains how to use the SDK. And provide suggestions on the API
usage.

1. Install the library dependency, from above #Quick Start
2. Import the class as `from capi_param_builder import ParamBuilder`
3. Construct your ParamBuilder. We provide 3 options to resolve your etld+1. The
   reason we need etld+1 is to help get the best domain to have the cookie saved
   to.

[Recommended] Option 1: Provide a list of etld+1 to the ParamBuilder.

```
paramBuilder = ParamBuilder(["example.com"])
```

Option 2: Provide a customized ETLD+1 resolver.

```
/**
In the demo, if you'd like to try DefaultEtldPlusOneResolver
option(check API usage below). Under ./resolver/default_etld_plus_one_resolver.py is an example
of the implementation.
**/
paramBuilder = ParamBuilder(DefaultEtldPlusOneResolver())
```

[Not recommended] Option 3: no input for constructor. We'll return one level
down from your input URL. This may miss some accuracy.

```
paramBuilder = ParamBuilder() # Not recommended.
```

4. Call `process_request` function to process fbc and fbp

```
updated_cookies = paramBuilder.process_request(
    domain, # str: current full domain url
    query_params, #dict[str, List[str]]: query params
    cookie_dict, # dict[str, str]: cookies dict
    referral_link, #Optional[str]: optional string for full url with query params )
```

5. [Recommended] Save `updated_cookies` as first-party cookies. This helps keep
   consistent fbc and fbp among your events. Based on your webserver framework,
   the save cookie API may vary. Feel free to choose the best fit for your use
   case. Below uses the example from demo application.

Option 1: Get the recommended saved cookie from step 4 `process_request` above.

```
// Get the recommended saved cookie from step 4 API
updated_cookies = paramBuilder.process_request(...)

for cookie in updated_cookies:
  self.send_header( "Set-Cookie",
      f"{cookie.name}={cookie.value};Max-Age={cookie.max_age};path=/;domain={cookie.domain}",)
```

Option 2: Get the recommended saved cookie from
`paramBuilder.get_cookies_to_set()`

```
# process_request should be always called
paramBuilder.process_request(...)

for cookie in paramBuilder.get_cookies_to_set():
  self.send_header( "Set-Cookie",
      f"{cookie.name}={cookie.value};Max-Age={cookie.max_age};path=/;domain={cookie.domain}",)
```

6. Get fbc and fbp

```
fbc = paramBuilder.get_fbc()
```

```
fbp = paramBuilder.get_fbp()
```

7. Send fbc and fbp back with Conversion API.

```
data=[
  'event_name: '...',
  'event_tme': <your_time>,
  'user_data': {
    'fbc': fbc, // The value provided in step 5
    'fbp': fbp, // The value provided in step 5
    ...
  }
  ...
]
```

## License

Conversions API parameter builder for Python is licensed under the LICENSE file
in the root directory of this source tree.
