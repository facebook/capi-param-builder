# Conversions API parameter builder feature for Client-side JavaScript

[![npm](https://img.shields.io/npm/v/meta-capi-param-builder-clientjs)](https://www.npmjs.com/package/meta-capi-param-builder-clientjs)
[![License](https://img.shields.io/badge/license-Facebook%20Platform-blue.svg?style=flat-square)](https://github.com/facebook/capi-param-builder/blob/main/client_js/LICENSE)

## Introduction

The Conversions API parameter builder SDK is a lightweight client-side JavaScript tool for improving Conversions API parameter retrieval and quality. It helps advertisers and partners improve match key quality and coverage (especially `fbc` and `fbp`) in CAPI events.

[Client-Side Parameter Builder Onboarding Guide](https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder-feature-library/client-side-onboarding).

## Quick Start

### Installation

Install the package via yarn:

```bash
yarn add meta-capi-param-builder-clientjs
```

Alternatively, include the bundle directly via a script tag:

```html
<script src="https://unpkg.com/meta-capi-param-builder-clientjs@1.3.1/dist/clientParamBuilder.bundle.js"></script>
```

Check the latest update from [CHANGELOG](./CHANGELOG.md).

### Demo

1. Check the updated version from CHANGELOG.
2. Checkout the demo example from `./example`. The `example/public/index.html` is the demo on how to use the library.

Run `node server.js` in the example directory, then visit http://localhost:3000. Check console log or cookies to see `_fbp` first.

Type the URL http://localhost:3000/?fbclid=test123 — you'll see `fbc` returned in the console log, and the `_fbc` cookie is stored.

## API Usage

### processAndCollectAllParams(url, getIpFn)

Processes and collects `fbc` and `fbp` parameters (saving them into cookies), and also retrieves client IP addresses. If no `fbc` cookie exists after checking the supplied URL, `window.location.href`, and `document.referrer`, it attempts to retrieve a backup click ID through Extended Browser Properties in supported Facebook and Instagram in-app browsers.

```javascript
const params = await clientParamBuilder.processAndCollectAllParams(url, getIpFn);
const fbc = params['_fbc'];
const fbp = params['_fbp'];
const clientIpAddress = params['_fbi'];
```

> **Important:** Call and await `processAndCollectAllParams()` once per collection flow, then use its returned object for immediate access to the collected values. Do not call it repeatedly just to retrieve individual values because each call reruns collection and invokes `getIpFn` when provided. While the call is still running, `getFbc()` and `getClientIpAddress()` can return an empty or stale cookie value instead of throwing. `getFbp()` is available immediately because the `_fbp` cookie is written before the first asynchronous operation.

- `url` is optional.
- `getIpFn` is optional — a user-provided function to retrieve client IP addresses. Prefer IPv6 (more precise than IPv4); fall back to IPv4 if IPv6 is not available.
- Returns an object with `_fbc`, `_fbp`, and `_fbi`.

#### `getIpFn`

- **Input:** none.
- **Output:** `string | Promise<string>` — the client's **IPv6 address**, with a fallback to **IPv4** if IPv6 is unavailable.

```javascript
const getIpFn = async () =>
  (await fetch('https://api64.ipify.org')).text();

const params = await clientParamBuilder.processAndCollectAllParams(null, getIpFn);
const clientIpAddress = params['_fbi'];
```

> **Note:** The implementation above is for **demo purposes only**. You should implement your own logic to collect client IPv6 addresses.

The getters below synchronously read the current cookie values. Use them for later reads when the object returned by `processAndCollectAllParams()` is no longer available.

### getFbc()

Returns the `fbc` value from cookie.

```javascript
const fbc = clientParamBuilder.getFbc();
```

### getFbp()

Returns the `fbp` value from cookie.

```javascript
const fbp = clientParamBuilder.getFbp();
```

### getClientIpAddress()

Returns the `client_ip_address` value from cookie. If an earlier call to `processAndCollectAllParams()` did not use a valid `getIpFn`, this getter returns an empty string.

```javascript
const ip = clientParamBuilder.getClientIpAddress();
```

### getNormalizedAndHashedPII(piiValue, dataType)

Returns normalized and hashed (SHA-256) PII from the input value.

```javascript
const hashedEmail = clientParamBuilder.getNormalizedAndHashedPII('user@example.com', 'email');
const hashedPhone = clientParamBuilder.getNormalizedAndHashedPII('+1 (616) 954-7888', 'phone');
```

Supported `dataType` values: `phone`, `email`, `first_name`, `last_name`, `date_of_birth`, `gender`, `city`, `state`, `zip_code`, `country`, `external_id`.

### processAndCollectParams(url) *(Deprecated)*

> **Deprecated:** Use `processAndCollectAllParams` instead. This method is kept for backward compatibility only.

## Development

### Prerequisites

- Node.js >= 20
- yarn (install via `corepack enable` or see [yarnpkg.com](https://yarnpkg.com/getting-started/install))

### Setup

```bash
cd client_js
yarn install
```

### Build

```bash
yarn build          # production build
yarn build:dev      # development build
```

### Test

```bash
yarn test                                          # run all tests
yarn test -- --testPathPattern cookieUtil.test.js   # run specific test file
```

### Lint and Format

```bash
yarn lint
yarn format
```

## License

The Conversions API parameter builder feature for Client-side JavaScript is licensed under the [LICENSE](./LICENSE) file in the root directory of this source tree.
