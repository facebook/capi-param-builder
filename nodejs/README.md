# Conversions API parameter builder for NodeJS

[![npm](https://img.shields.io/npm/v/capi-param-builder-nodejs)](https://www.npmjs.com/package/capi-param-builder-nodejs)
[![License](https://img.shields.io/badge/license-Facebook%20Platform-blue.svg?style=flat-square)](https://github.com/facebook/capi-param-builder/blob/main/nodejs/LICENSE)

## Introduction

Conversions API parameter builder SDK is a lightweight tool for improving
Conversions API parameter retrieval and quality.

[Server-Side Parameter Builder Onboarding Guide](https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder-feature-library/server-side-onboarding)

## Quick Start

This is a quick start guide for integrating parameter builder with NodeJS. You
can also find a demo in the next section.

### Setup

1. Check the latest version from CHANGELOG. Update {version} in below examples.

2. Update in your package.json with the latest version.

```
  "dependencies": {
      "capi-param-builder-nodejs": {version}
    }
```

3. Run `npm install` in your application(if you don't have an application, check
   #demo section for a demo application). You should see the capi-param-builder
   installed under your nodejs folder.

Please check the next section for a local demo.

### Demo

Here is a demo application on your localhost. If you've already familiar with
the library, feel free to skip this section.

1. Checkout the demo application from ./example

2. Go to the ./example/server.js, run

```
node server.js
```

3. Check the terminal, your demo application should be up and running!

4. Visit http://localhost:3000/ for your demo webpage. You will see getFbc and
   getFbp value printed on the home page.

Following are some further validation:

4.1 Change the URL to http://localhost:3000/fbclid=test.

- The printed getFbc value will change to a string containing the `test`.
- Verify the browser's cookie section. You should see `_fbc` and `_fbp` exist.
  And the `_fbc` value contains `test` string.

  4.2 Then change the URL back to http://localhost:3000 in the same browser.

- The `_fbc` and `_fbp` from cookie and printed in webpage should stay the same
  as 4.1

## API usage

This section covers how to use the SDK and provide suggestions on the API usage.

1. Install the library as mentioned #Quick Start
2. Import the class in your file. And construct the ParamBuilder class.

```
const {ParamBuilder} = require('capi-param-builder');

// [Recommended] Option 1: List of ETLD+1 for your website domains.
// This helps provide suggestions for your cookie saving domain.
const builder = new ParamBuilder(["example.com", "localhost"]);
```

Optional constructors:

```
// Option 2: Resolve customized etld+1 via customized logic
// Check example DefaultETLDPlus1Resolver.js under example/util folder for demo.
const etldPlus1Resolver = new DefaultETLDPlus1Resolver();
const builder = new ParamBuilder(etldPlus1Resolver);

// Option 3: Not recommended. Empty input.
// Not recommended. We will return a best guess on your domain by one level down your input host.
const builder = new ParamBuilder();
```

3. Call `processRequest` to process the fbc, fbp.

```
builder.processRequest(
    req.headers.host, // host full URL.
    params, // query params
    requestCookies, // current cookie
    req.headers.referer // optional, help enhance the accurancy
  );

or

const cookiesToSet = builder.processRequest(
    req.headers.host, // host
    params, // query params
    requestCookies, // current cookie
    req.headers.referer // optional, help enhance the accurancy
  );
```

4.  [Recommended] Save the `cookiesToSet` as first-party cookies. This helps
    keep consistent fbc and fbp for your event. Based on your webserver
    framework, the save cookie API may vary. Feel free to choose the best fit
    for your use case.

    Below uses the example from the demo application.

    Recommended: get the list of `cookiesToSet` from API call in step 3.

    ```
    // Call processRequest in above step 3.
    // The returned cookiesToSet is the recommended list of cookies to be saved.
    const cookiesToSet = builder.processRequest(...);
    for (const cookie of cookiesToSet) {
     responseCookies.push(cookie.name + '=' + cookie.value + '; Max-Age=' + cookie.maxAge + '; Domain=' + cookie.domain + '; Path=/');
    }
    res.setHeader('Set-Cookie', responseCookies);
    ```

    Optional: call `builder.getCookiesToSet()` to get the list of cookies to be
    saved.

    ```
    for (const cookie of builder.getCookiesToSet()) {
      responseCookies.push(cookie.name + '=' + cookie.value + '; Max-Age=' +
      cookie.maxAge + '; Domain=' + cookie.domain + '; Path=/');
    }
    res.setHeader('Set-Cookie', responseCookies);
    ```

5.  Get fbc and fbp value

```
const fbc = builder.getFbc();

```

```
const fbp = builder.getFbp();
```

6. Send fbc and fbp back with Conversions API under UserData section:

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

Conversions API parameter builder for NodeJS is licensed under the LICENSE file
in the root directory of this source tree.
