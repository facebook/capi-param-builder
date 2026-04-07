# Change log

All notable changes to this project will be documented in this file.

## Unreleased

## Version v1.3.0
- Standardized on yarn as the sole package manager — removed all npm references
- Switched CI workflow from npm to yarn (`yarn install --frozen-lockfile`, `yarn test`, `yarn build`)
- Updated CD workflow title and debug logging for yarn
- Removed `package-lock.json` (redundant with `yarn.lock`)
- Updated README: removed npm install option, kept only `yarn add`
- Updated yarn prerequisite to recommend `corepack enable`

## Version v1.2.2
- Open sourced the SDK and published to yarn registry as `meta-capi-param-builder-clientjs`
- Added CI/CD GitHub Actions workflows for automated testing and publishing
- Added unit tests for `ipUtil` and `getClientIpAddress` (506 tests passing)
- Rewrote README with yarn install instructions and structured API docs
- Removed deprecated `clientParamsHelper` module
- Fixed `==` to `===` for strict equality
- Fixed prototype pollution vulnerability in `flatted` (CWE-1321)
- Resolved dependency vulnerabilities in `serialize-javascript` and `@tootallnate/once`

## Version v1.2.1
- Improve the is_new flag with more breakdown on net new and modified new option.

## Version v1.2.0
Added support for client IPv6 address retrival and customer information parameters normalization and hashing.

## Version v1.1.1
Bug fix for returned object from clientParamBuilder.processAndCollectParams and processAndCollectAllParams. Add underscore to align the naming convention with server side. After the fix, the key should contains underscore as ```_fbc``` and ```_fbp```.

## Version v1.1.0
Improve metrics by adding more details to existing params, including sdk version, is_new flag and language index. This helps analysis the keys handled by param builder.

## Updated

On Sep 3rd 2025, fix IAB IG version check bug.
