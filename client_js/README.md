# Conversions API parameter builder feature for Client-side JavaScript

[![License](https://img.shields.io/badge/license-Facebook%20Platform-blue.svg?style=flat-square)](https://github.com/facebook/capi-param-builder/blob/main/client_js/LICENSE)

## Introduction

The Conversions API parameter builder SDK is a lightweight tool for improving
Conversions API parameter retrieval and quality.

[Client-Side Parameter Builder Onboarding Guide](https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder-feature-library/client-side-onboarding).

## Quick Start

This is the quick start guide to help you integrate the parameter builder feature in Client-side JavaScript.
You can also find a demo in the next section.

Check the latest update from CHANGELOG.

# Run the demo

1. Check the updated version from CHANGELOG.
2. Checkout the demo example from ./example. The example/public/index.html is the demo on how to use the library.

Run `node server.js` in your local, then visit http://localhost:3000. Check console log or cookies to see `_fbp` first.
Manual type the url into http://localhost:3000/?fbclid=test123 or similar, you'll see fbc returned in console log, and the `_fbc` cookie is stored

# Integration

Integration of **clientParamBuilder** as below.

- if you uses **clientParamsHelper** please refer to #Appendix section

## Add dependency

1. In your webpage, add the following snippet to your page for clientParamBuilder:

To use clientParamBuilder,please add the following

```
<script src="https://capi-automation.s3.us-east-2.amazonaws.com/public/client_js/capiParamBuilder/clientParamBuilder.bundle.js"></script>
```

## How to use API

2. Call the function: clientParamBuilder

```
clientParamBuilder.processAndCollectParams(url)
```

url is optional. Calling the function triggers processing the params and saving into cookies.

```
clientParamBuilder.processAndCollectAllParams(url,getIpFn)
```

URL is optional. getIpFn is optional, which specifies a user provided function to retrieve client IP addresses. Calling the function triggers processing the params and saving into cookies. processAndCollectAllParams is an updated API version. Besides the added support for retrieving client IP addresses, it includes functionality of previous version of retrieving backup clickID from in-app-browser when feasible.

```
clientParamBuilder.getFbc()
```

API to get fbc value from cookie. You need to run processAndCollectParams before getFbc().

```
clientParamBuilder.getFbp()
```

API is to get fbp value from cookie. You need to run processAndCollectParams before getFbp().

```
clientParamBuilder.getClientIpAddress()
```

API is to get fbi(client_ip_address) value from cookie. You need to run processAndCollectAllParams and pass in a valid getIpFn before calling getClientIpAddress() otherwise you will get an empty string.

```
clientParamBuilder.getNormalizedAndHashedPII(piiValue, dataType)
```

API is to get normalized and hashed (sha256) PII from input piiValue, supported dataType include 'phone', 'email', 'first_name', 'last_name', 'date_of_birth', 'gender', 'city', 'state', 'zip_code', 'country' and 'external_id'.

# Appendix

**clientParamsHelper** is under deprecation. If you use it, suggest to move to **clientParamBuilder**. **clientParamBuilder** should cover all API needed. Check the above API for suggestions.

## License

The Conversions API parameter builder feature for JS is licensed under the LICENSE file in the root directory of this source tree.
