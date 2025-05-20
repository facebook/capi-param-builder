# Conversions API parameter builder for Java

[![Maven Central](https://img.shields.io/maven-central/v/com.facebook.capi.sdk/capi-param-builder)](https://mvnrepository.com/artifact/com.facebook.capi.sdk/capi-param-builder)
[![License](https://img.shields.io/badge/license-Facebook%20Platform-blue.svg?style=flat-square)](https://github.com/facebook/capi-param-builder/blob/main/java/LICENSE)

## Introduction

Conversions API parameter builder SDK is a lightweight tool for improving
Conversions API parameter retrieval and quality.

[Server-Side Parameter Builder Onboarding Guide](https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder-feature-library/server-side-onboarding)

## Quick Start

This is the quick start guide to help you integrate parameter builder in Java.
You can also find a demo in the next section.

### Setup

1. Check the latest version from CHANGELOG. Modify below {current_version} into
   actual version number.

2. Update in your dependency with Conversion API parameter builder
   `com.facebook.capi.sdk:capi-param-builder:{current_version}`

**Gradle example**

Update dependencies in your build.gradle. Please use the latest version.

```
dependencies {
    implementation 'com.facebook.capi.sdk:capi-param-builder:{current_version}'
}
```

**Maven example**

Update your .xml file within the <dependencies>

```
<dependencies>
    <!-- Add your dependencies here -->
    <dependency>
        <groupId>com.facebook.capi.sdk</groupId>
        <artifactId>capi-param-builder</artifactId>
        <version>{current_version}</version>
    </dependency>
</dependencies>
```

### Demo

1. Check out the demo application under ./example

2. Build the application

```
./gradlew build
```

3. Run the demo application and check for errors.

```
./gradlew bootRun
```

4. Visit `localhost:8080/demo` for a simple spring mvc controller demo. You will
   see the "Hello world" content with fbc and fbp printed.

Here are some further validations that may help with your integration:

4.1 Change url into `localhost:8080/demo?fbclid=myTest`. You should see `_fbc`
in the cookie value that contains `myTest`. You will also see `_fbp` in the
cookie with non-empty values. The printed value on the main page should be the
same as your cookies.

4.2 Change url back to `localhost:8080`. You should see `_fbc` and `_fbp` stay
the same value as 4.1 above.

4.3 `localhost:8080/filter/demo` for simple spring mvc filter, you should see
the "Hello world" content with both fbc and fbp printed. This is similar to 4.1
and 4.2.

**Demo dependencies**

We add 2 dependencies inside the demo application. These are optional for your
application.

- jakarta.servlet is to get HttpServletRequest info and set cookies for
  HttpServletResponse for demo purposes.
- Guava is used in DefaultETLDPlusOneResolver to resolve host's ETLD+1. This is
  one approach to get your website's ETLD+1. Feel free to check other approaches
  in #API Usage section. Feel free to implement your own ETLDPlusOneResolver to
  best match your needs. The DefaultETLDPlusOneResolver and
  TestETLDPlusOneresolver are only examples.

## API usage

This section explains how to use parameter builder SDK and provides suggestions
on the API usage.

1. Install the library as mentioned in # Quick Start section.
2. Import the class in your application.

```
import com.facebook.capi.sdk.ParamBuilder;
```

3. Construct the class using one of the 3 options. ETLD+1 is recommended to save
   your cookie.

```
// Option 1 - Recommended: input list of etld+1 domains
ParamBuilder paramBuilder = new ParamBuilder(Arrays.asList('example.com', 'yourDomain.com'));

// Option 2: get your own etld+1 resolver to analysis and return your ETLD+1.
// ParamBuilder paramBuilder = new ParamBuilder(new YourETLDPlusOneResolver());

// Option 3: not recommended. We'll return the cookie domain same as your current url(one level down). This may not accurate for your case.
// ParamBuilder paramBuilder = new ParamBuilder();
```

4. Call `processRequest` to process the fbc, fbp

```
// Option 1: recommended - with referer url
List<CookieSetting> updatedCookieList =
        paramBuilder.processRequest(
            request.getHeader("host"),
            request.getParameterMap(),
            cookieMap,
            request.getHeader("referer"));

// Option 2: without referer url
List<CookieSetting> updatedCookieList =
        paramBuilder.processRequest(
            request.getHeader("host"),
            request.getParameterMap(),
            cookieMap);
```

5. [Recommended] Save `updatedCookieList` as first-party cookies. help keep fbc
   and fbp consistent among all events. Based on your webserver framework, the
   save cookie API may vary. Feel free to choose the best fit for your use case.
   Below uses the example from the demo application.

Option 1: Get the updatedCookieList list from `processRequest` in step 4 above.

```
// Call the processRequest as show in step 4 above.
List<CookieSetting> updatedCookieList =
        paramBuilder.processRequest(..);

// Save cookies for the list of updated cookie list
for (CookieSetting updatedCookie : updatedCookieList) {
      Cookie cookie = new Cookie(updatedCookie.getName(), updatedCookie.getValue());
      cookie.setMaxAge(updatedCookie.getMaxAge());
      cookie.setDomain(updatedCookie.getDomain());
      response.addCookie(cookie);
    }
```

Option 2: use `getCookiesToSet` API.

```
// Still need process the request.
paramBuilder.processRequest(..);

// Save cookies for the list of updated cookie list
for (CookieSetting updatedCookie : paramBuilder.getCookiesToSet()) {
      Cookie cookie = new Cookie(updatedCookie.getName(), updatedCookie.getValue());
      cookie.setMaxAge(updatedCookie.getMaxAge());
      cookie.setDomain(updatedCookie.getDomain());
      response.addCookie(cookie);
    }
```

6. Get fbc and fbp

```
String fbc = paramBuilder.getFbc();
```

```
String fbp = paramBuilder.getFbp();
```

7. Send fbc and fbp back to the Conversions API.

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

Conversions API parameter builder for Java is licensed under the LICENSE file in
the root directory of this source tree.
