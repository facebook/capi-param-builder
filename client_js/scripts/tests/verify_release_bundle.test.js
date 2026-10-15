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
const os = require('os');
const path = require('path');

const { verifyReleaseBundle } = require('../verify_release_bundle.js');

const VERSION = '1.3.3';
const BUILD_DATE = '2026-09-25T00:11:23.000Z';
const AMD_DEFINE =
  'root.clientParamBuilder=factory();define("clientParamBuilder",[],function(){return root.clientParamBuilder;});';
const BUNDLE = `(function(root,factory){if(typeof define==="function"&&define.amd){${AMD_DEFINE}}else{root.clientParamBuilder=factory();}})(self,function(){return {version:"${VERSION}",buildDate:"${BUILD_DATE}",processAndCollectAllParams:function(){}};});`;

function writeFixture(overrides = {}) {
  const fixtureRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'param-builder-release-')
  );
  const bundlePath = path.join(fixtureRoot, 'bundle.js');
  const metadataPath = path.join(fixtureRoot, 'release-metadata.json');
  const packagePath = path.join(fixtureRoot, 'package.json');
  const bundle = overrides.bundle ?? BUNDLE;
  const bundleBuffer = Buffer.from(bundle);
  const metadata = {
    version: VERSION,
    buildDate: BUILD_DATE,
    bundleSha256: crypto
      .createHash('sha256')
      .update(bundleBuffer)
      .digest('hex'),
    bundleByteLength: bundleBuffer.length,
    ...overrides.metadata,
  };

  fs.writeFileSync(bundlePath, bundleBuffer);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata));
  fs.writeFileSync(
    packagePath,
    JSON.stringify({ version: overrides.packageVersion ?? VERSION })
  );

  return { bundlePath, fixtureRoot, metadataPath, packagePath };
}

describe('verifyReleaseBundle', () => {
  const fixtureRoots = [];

  afterEach(() => {
    for (const fixtureRoot of fixtureRoots.splice(0)) {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  function fixture(overrides) {
    const paths = writeFixture(overrides);
    fixtureRoots.push(paths.fixtureRoot);
    return paths;
  }

  test('accepts a bundle matching the pinned release contract', () => {
    expect(verifyReleaseBundle(fixture())).toEqual({
      byteLength: Buffer.byteLength(BUNDLE),
      sha256: crypto.createHash('sha256').update(BUNDLE).digest('hex'),
    });
  });

  test('rejects a package version mismatch', () => {
    expect(() =>
      verifyReleaseBundle(fixture({ packageVersion: '1.3.4' }))
    ).toThrow('does not match package version');
  });

  test('rejects a build timestamp mismatch', () => {
    expect(() =>
      verifyReleaseBundle(
        fixture({
          metadata: { buildDate: '2026-09-25T00:11:24.000Z' },
        })
      )
    ).toThrow('bundle does not contain build date');
  });

  test('rejects a digest mismatch', () => {
    expect(() =>
      verifyReleaseBundle(
        fixture({ metadata: { bundleSha256: '0'.repeat(64) } })
      )
    ).toThrow('does not match release metadata');
  });

  test('rejects a missing named AMD definition', () => {
    expect(() =>
      verifyReleaseBundle(
        fixture({
          bundle: BUNDLE.replace('define("clientParamBuilder"', 'define('),
        })
      )
    ).toThrow('missing the named clientParamBuilder AMD definition');
  });

  test('rejects a malformed AMD registration', () => {
    expect(() =>
      verifyReleaseBundle(
        fixture({
          bundle: BUNDLE.replace(
            'define("clientParamBuilder",[],',
            'define("clientParamBuilder",["unexpected"],'
          ),
        })
      )
    ).toThrow('does not register an empty AMD dependency list');
  });

  test('rejects a bundle that leaves the browser global unset under AMD', () => {
    expect(() =>
      verifyReleaseBundle(
        fixture({
          bundle: BUNDLE.replace(
            AMD_DEFINE,
            'define("clientParamBuilder",[],factory);'
          ),
        })
      )
    ).toThrow('does not expose the clientParamBuilder object');
  });

  test('rejects separate AMD and browser global instances', () => {
    expect(() =>
      verifyReleaseBundle(
        fixture({
          bundle: BUNDLE.replace(
            'function(){return root.clientParamBuilder;}',
            'factory'
          ),
        })
      )
    ).toThrow('is not the same instance as the browser global');
  });

  test('rejects a missing browser API', () => {
    expect(() =>
      verifyReleaseBundle(
        fixture({
          bundle: BUNDLE.replace(
            'processAndCollectAllParams:function(){}',
            'otherFunction:function(){}'
          ),
        })
      )
    ).toThrow('browser global does not expose processAndCollectAllParams');
  });
});
