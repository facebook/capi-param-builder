# Change log

All notable changes to this project will be documented in this file.

## Unreleased

## Version v1.1.1
Bug fix for returned object from clientParamBuilder.processAndCollectParams and processAndCollectAllParams. Add underscore to align the naming convention with server side. After the fix, the key should contains underscore as ```_fbc``` and ```_fbp```.

## Version v1.1.0
Improve metrics by adding more details to existing params, including sdk version, is_new flag and language index. This helps analysis the keys handled by param builder.

## Updated

On Sep 3rd 2025, fix IAB IG version check bug.
