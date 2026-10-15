/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function verifyReleaseBundle({ bundlePath, metadataPath, packagePath }) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const bundle = fs.readFileSync(bundlePath);
  const bundleText = bundle.toString('utf8');

  if (metadata.version !== packageJson.version) {
    throw new Error(
      `release metadata version ${metadata.version} does not match package version ${packageJson.version}`
    );
  }
  if (
    typeof metadata.buildDate !== 'string' ||
    new Date(metadata.buildDate).toISOString() !== metadata.buildDate
  ) {
    throw new Error('release metadata buildDate must be an ISO timestamp');
  }
  if (!bundleText.includes(JSON.stringify(metadata.version))) {
    throw new Error(`bundle does not contain version ${metadata.version}`);
  }
  if (!bundleText.includes(JSON.stringify(metadata.buildDate))) {
    throw new Error(`bundle does not contain build date ${metadata.buildDate}`);
  }
  if (!bundleText.includes('define("clientParamBuilder"')) {
    throw new Error(
      'bundle is missing the named clientParamBuilder AMD definition'
    );
  }

  const sha256 = crypto.createHash('sha256').update(bundle).digest('hex');
  if (sha256 !== metadata.bundleSha256) {
    throw new Error(
      `bundle SHA-256 ${sha256} does not match release metadata ${metadata.bundleSha256}`
    );
  }
  if (bundle.length !== metadata.bundleByteLength) {
    throw new Error(
      `bundle byte length ${bundle.length} does not match release metadata ${metadata.bundleByteLength}`
    );
  }

  const browserGlobal = {};
  browserGlobal.self = browserGlobal;
  browserGlobal.window = browserGlobal;
  vm.runInNewContext(bundleText, browserGlobal);
  verifyPublicAPI(browserGlobal.clientParamBuilder, 'browser global');

  let amdRegistration;
  const define = (name, dependencies, factory) => {
    amdRegistration = { dependencies, factory, name };
  };
  define.amd = {};
  const amdGlobal = { define };
  amdGlobal.self = amdGlobal;
  amdGlobal.window = amdGlobal;
  vm.runInNewContext(bundleText, amdGlobal);
  if (amdRegistration?.name !== 'clientParamBuilder') {
    throw new Error('bundle does not register the clientParamBuilder AMD name');
  }
  if (
    !Array.isArray(amdRegistration.dependencies) ||
    amdRegistration.dependencies.length !== 0
  ) {
    throw new Error('bundle does not register an empty AMD dependency list');
  }
  if (typeof amdRegistration.factory !== 'function') {
    throw new Error('bundle does not register an AMD factory');
  }
  verifyPublicAPI(amdGlobal.clientParamBuilder, 'browser global under AMD');
  if (amdRegistration.factory() !== amdGlobal.clientParamBuilder) {
    throw new Error(
      'bundle AMD module is not the same instance as the browser global'
    );
  }

  return { byteLength: bundle.length, sha256 };
}

function verifyPublicAPI(api, source) {
  if (api == null || typeof api !== 'object') {
    throw new Error('bundle does not expose the clientParamBuilder object');
  }
  if (typeof api.processAndCollectAllParams !== 'function') {
    throw new Error(
      `bundle ${source} does not expose processAndCollectAllParams`
    );
  }
}

if (require.main === module) {
  const projectRoot = path.resolve(__dirname, '..');
  const result = verifyReleaseBundle({
    bundlePath: path.join(projectRoot, 'dist', 'clientParamBuilder.bundle.js'),
    metadataPath: path.join(projectRoot, 'release-metadata.json'),
    packagePath: path.join(projectRoot, 'package.json'),
  });
  process.stdout.write(
    `Verified release bundle (${result.byteLength} bytes, ${result.sha256})\n`
  );
}

module.exports = { verifyReleaseBundle };
