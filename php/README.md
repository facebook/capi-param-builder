# Conversions API parameter builder feature for PHP

[![Packagist](https://img.shields.io/packagist/v/facebook/capi-param-builder-php)](https://packagist.org/packages/facebook/capi-param-builder-php)
[![License](https://img.shields.io/badge/license-Facebook%20Platform-blue.svg?style=flat-square)](https://github.com/facebook/capi-param-builder/blob/main/php/LICENSE)

## Introduction

The Conversions API parameter builder SDK is a lightweight tool for improving
Conversions API parameter retrieval and quality.

[Server-Side Parameter Builder Onboarding Guide](https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder-feature-library/server-side-onboarding)

## Quick start

Here is a quick-start guide for integrating the parameter builder feature into
your code. You can find a demo in the next section.

### Setup

1. Check the latest version in CHANGELOG. Modify below {current_version} into
   latest version number.

2. Update in your composer.json with the latest version.

```
"require": {
       "php": ">=7.4",
       "facebook/capi-param-builder-php": "{current_version}"
   },
```

3. Install the dependency. If you don't have an application, check #demo section
   for a demo application.

```
composer install
```

or update if you need to update the version.

```
composer update
```

Once you finish these steps, the setup step of your parameter builder
integration is complete. You can see a demo in the following section.

### Demo

Here is a demo application on your localhost. If you've already familiar with
the library, feel free to skip this section.

1. Checkout the examples for localhost demo and Drupal demo under ./examples

2. Take localhost as an example, go to ./examples/local. Install or update the
   dependency by running

```
 composer install
 or
 composer update
```

3. Start the server

```
php -S localhost:8000
```

4. Visit http://localhost:8000/demo.php for the localhost demo webpage. Accept
   the cookie consent at the bottom of the page to continue. You'll see the main
   page with `fbc` and `fbp` value printed.

Following are some further validations:

4.1 Go to http://localhost:8000/demo.php?fbclid=thisIsATest123. The printed
`fbc` and `fbp` should be present and not null. The printed `fbc` should have a
portion containing `thisIsATest123`. Please also validate that the corresponding
respective cookie values, ‘\_fbc’ and ‘\_fbp’, are the same as printed `fbc` and
`fbp`.

4.2 Go to http://localhost:8000/demo.php. Please validate that printed `fbc` and
`fbp`and corresponding cookie values, ‘\_fbc’ and ‘\_fbp’ are the same as those
in step 4.1.

## API usage

This section explains how to use the APIs provided in the SDK.

1. Integrate the library as #Quick start section mentioned above.
2. Import the parameter builder and build the constructor. The ETLD+1 can help
   you get the recommended domain to save cookies.

Option 1 (recommended): input ELTD+1 domain list. We'll compare your current
host name and provide the domain we recommended to save your cookie.

```
 $param_builder = new FacebookAds\ParamBuilder(array('example.com', 'test.com'));
```

Option 2: Customized ETLD+1 resolver. Create a file implementing
ETLDPlus1Resolver. Example: ETLDPlus1ResolverForTest.php under ./examples/local.

```
 $param_builder = new FacebookAds\ParamBuilder(new ETLDPlus1ResolverForTest());
```

Option 3: Not recommended. We'll do a simple check to return one level down
subdomain. Eg. your input is test.example.demo.com, we'll return
example.demo.com. This option may be less accurate.

```
 $param_builder = new FacebookAds\ParamBuilder();
```

3. Call `processRequest` to process fbc, fbp and fbi(client_ip_address).

```
$param_builder->processRequest(
   $host_name, // string for full url
   $url_query_params, // map for query params
   $cookie, // map for cookies
   $referral_link, // (optional, nullable)string, full referral link to help improve potential event quality.
   $x_forwarded_for, // (optional, nullable)string, the http x_forwarded_for request header.
   $remote_address // (optional, nullable)string, the remote_address variable in http request.
);
```

4. [Recommended] Save the `$cookie_to_set` as first-party cookies to keep fbc
   and fbp consistent across all events. Based on your webserver framework, the
   save cookie API may vary. Feel free to choose the best fit for your use case.
   Below is one example excerpted from the demo application.

Recommended: get `$cookie_to_set` from API call in step 3.

```
$cookie_to_set = $param_builder->processRequest(...)
```

Optional: getCookiesToSet API

```
$cookie_to_set = $param_builder->getCookiesToSet()
```

Call setcookie from the server side to have the cookies saved.

```
foreach ($cookie_to_set as $cookie) {
 setcookie(
   $cookie->name,
   $cookie->value,
   time() + $cookie->max_age,
   '/',
   $cookie->domain);
}
```

If there is no change to your current cookies, the returned list will be empty.

5. Get fbc/fbp, client_ip_address, normalized and hashed PII values

```


$fbc = $param_builder->getFbc();


```

$fbp = $param_builder->getFbp();

```


$client_ip_address = $param_builder->getClientIpAddress();


```

$email = $param_builder->getNormalizedAndHashedPII('
John_Smith@gmail.com','email');

```


$phone = $param_builder->getNormalizedAndHashedPII('+1 (616) 954-78 88','phone');


```

getNormalizedAndHashedPII(piiValue, dataType)

```
API is to get normalized and hashed (sha256) PII from input piiValue, supported dataType include 'phone', 'email', 'first_name', 'last_name', 'date_of_birth', 'gender', 'city', 'state', 'zip_code', 'country' and 'external_id'.


```

6. Send fbc, fbp, client_ip_address, email and phone back through Conversions
   API.

```
data=[
 'event_name: '...',
 'event_time': <your_time>,
 'user_data': {
   'fbc': $fbc, // The value provided in step 5
   'fbp': $fbp, // The value provided in step 5
   'client_ip_address': $client_ip_address // The value provided in step 5
   'em': $email // The value provided in step 5
   'ph': $phone // The value provided in step 5
     ...
 }
 ...
]
```

## License

The Conversions API parameter builder feature for PHP is licensed under the
LICENSE file in the root directory of this source tree.
