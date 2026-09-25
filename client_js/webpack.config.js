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

/**
 * Webpack plugin to ensure that when the bundle is loaded in an AMD environment
 * (such as Magento 2 with RequireJS), the module is registered as an AMD module
 * AND simultaneously exposed on the global scope (window/self).
 *
 * This prevents TypeError exceptions when clientParamBuilder methods are called
 * globally on pages where an AMD loader is present.
 */
class DualUmdGlobalPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('DualUmdGlobalPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'DualUmdGlobalPlugin',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_DEV_TOOLING,
        },
        (assets) => {
          for (const assetName of Object.keys(assets)) {
            if (assetName.endsWith('.bundle.js')) {
              const originalSource = assets[assetName].source().toString();
              const oldAmd =
                '"function"==typeof define&&define.amd?define("clientParamBuilder",[],t)';
              const newAmd =
                '"function"==typeof define&&define.amd?(define("clientParamBuilder",[],t),r.clientParamBuilder=t())';

              if (originalSource.includes(oldAmd)) {
                const newSource = originalSource.replace(oldAmd, newAmd);
                const { RawSource } =
                  webpack.sources || require('webpack-sources');
                assets[assetName] = new RawSource(newSource);
              }
            }
          }
        }
      );
    });
  }
}

module.exports = {
  entry: {
    clientParamBuilder: `./capiParamBuilder/src/clientParamBuilder.js`,
  },
  output: {
    path: path.resolve(__dirname, `dist`),
    filename: `[name].bundle.js`,
    library: `[name]`,
    libraryTarget: `umd`,
    umdNamedDefine: true,
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
    new DualUmdGlobalPlugin(),
  ],
};
