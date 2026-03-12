/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
const path = require('path');
const webpack = require('webpack');
const packageJson = require('./package.json');

module.exports = {
  entry: {
    clientParamBuilder: `./capiParamBuilder/src/clientParamBuilder.js`,
  },
  output: {
    path: path.resolve(__dirname, `dist`),
    filename: `[name].bundle.js`,
    library: `[name]`,
    libraryTarget: `umd`,
  },
  resolve: {
    extensions: [`.js`],
    alias: {
      '@shared': path.resolve(__dirname, `./shared`),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: `babel-loader`,
          options: {
            presets: [`@babel/preset-env`],
          },
        },
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new (require('terser-webpack-plugin'))({
        terserOptions: {
          format: {
            comments: /^\**!|@preserve|@license|@cc_on/i,
          },
        },
        extractComments: false,
      }),
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(packageJson.version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    }),
    new webpack.BannerPlugin({
      banner: `Copyright (c) Meta Platforms, Inc. and affiliates.
All rights reserved.

This source code is licensed under the license found in the LICENSE file
in the root directory of this source tree:
https://github.com/facebook/capi-param-builder/blob/main/LICENSE`,
      raw: false,
      entryOnly: true,
    }),
  ],
};
