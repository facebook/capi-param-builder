/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const webpack = require('webpack');
const config = require('./webpack.config.js');
const packageJson = require('./package.json');
const releaseMetadata = require('./release-metadata.json');

if (releaseMetadata.version !== packageJson.version) {
  throw new Error(
    `release-metadata.json version ${releaseMetadata.version} does not match package.json version ${packageJson.version}`
  );
}

if (
  typeof releaseMetadata.buildDate !== 'string' ||
  new Date(releaseMetadata.buildDate).toISOString() !==
    releaseMetadata.buildDate
) {
  throw new Error('release-metadata.json buildDate must be an ISO timestamp');
}

let replacedBuildDate = false;
config.plugins = config.plugins.map((plugin) => {
  if (!(plugin instanceof webpack.DefinePlugin)) {
    return plugin;
  }
  replacedBuildDate = true;
  return new webpack.DefinePlugin({
    ...plugin.definitions,
    __BUILD_DATE__: JSON.stringify(releaseMetadata.buildDate),
  });
});
if (!replacedBuildDate) {
  throw new Error('webpack config is missing its DefinePlugin');
}

module.exports = config;
