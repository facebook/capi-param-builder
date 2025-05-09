# Conversions API parameter builder ClientJS SDK

This is a quick start guide for client side JS.
Check the latest update in CHANGELOG: https://capi-automation.s3.us-east-2.amazonaws.com/public/client_js/CHANGELOG

# Run the demo

Download demo file from https://capi-automation.s3.us-east-2.amazonaws.com/public/client_js/example/example.zip
Unzip the demo, the demo uses npm nodeJS to construct a node server.
The example/public/index.html is the demo on how to use the library.

Run `node server.js` in your local, then visit http://localhost:3000. Check console log or cookies to see ```_fbp``` first.
Manual type the url into http://localhost:3000/?fbclid=test123 or similar, you'll see fbc returned in console log, and the ```_fbc``` cookie is stored

# Integration

We support 2 client side JS libraries, **clientParamBuilder** and **clientParamsHelper**.
If you are new, suggest to use clientParamBuilder to start with. Other usage please checkthe onboarding doc for more details.
clientParamsHelper is an add-on expansion.
If you need both libraries, you could integrate with clientParamBuilder only by calling clientParamBuilder.processAndCollectAllParams. It contains one API which covers core feature from clientParamsHelper.

## Add dependency

1. In your webpage, add following sentence to your page for clientParamBuilder:

```
<script src="https://capi-automation.s3.us-east-2.amazonaws.com/public/client_js/capiParamBuilder/clientParamBuilder.bundle.js"></script>
```

clientParamsHelper

```
<script
        src="https://capi-automation.s3.us-east-2.amazonaws.com/public/client_js/clientParamsHelper/clientParamsHelper.bundle.js"></script>
```

2. Call the function: clientParamBuilder

```
clientParamBuilder.processAndCollectParams(url)
```

url is optional. Will start processing the params and save into cookies.

```
clientParamBuilder.processAndCollectAllParams(url)
```

URL is optional. Will start processing the params and save into cookies. This is a newly added async API. It will cover the similar feature from clientParamsHelper that retrieves backup clickID from in-app-browser if feasible. This is the super set of above processAndCollectParams feature.

```
clientParamBuilder.getFbc()
```

API to get fbc value from cookie. You need to run processAndCollectParams before getFbc().

```
clientParamBuilder.getFbp()
```

API is to get fbc value from cookie. You need run processAndCollectParams before getFbp().


(Optional) clientParamsHelper: add-on expansion. Please check the onboarding guide before using this library. This is a more complex advance library to coordinate.

```
collectParams
```

Only works on fb or ig in-app-browser. Retrieve clickID.

```
decorateUrl
```

Append above retrieved clickID to input url.

```
collectAndSetParams
```

Save above retrieved clickID and fbp to cookie.

```
getFbc, getFbp
```

Retrieve fbc and fbp from cookie.

## License

Conversions API Param Builder for Java is licensed under the LICENSE file in the root directory of this source tree.
