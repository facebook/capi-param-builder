/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Bundle AMD / Global Compatibility Tests', () => {
  const bundlePath = path.resolve(
    __dirname,
    '../../dist/clientParamBuilder.bundle.js'
  );
  let bundleContent;

  beforeAll(() => {
    bundleContent = fs.readFileSync(bundlePath, 'utf8');
  });

  test('Bundle exposes clientParamBuilder on global window when define.amd is present', () => {
    let amdRegisteredName = null;
    let amdRegisteredFactory = null;

    const defineMock = (name, deps, factory) => {
      amdRegisteredName = name;
      amdRegisteredFactory = factory;
    };
    defineMock.amd = { jQuery: true };

    const sandbox = {
      define: defineMock,
      location: {
        href: 'https://example.com/',
        hostname: 'example.com',
        protocol: 'https:',
      },
      document: {
        cookie: 'test=1',
        createElement: () => ({
          getAttribute: () => null,
          setAttribute: () => {},
        }),
        getElementsByTagName: () => [],
      },
      navigator: { userAgent: 'test-agent', platform: 'MacIntel' },
      setTimeout,
      clearTimeout,
      console,
    };
    sandbox.window = sandbox;
    sandbox.self = sandbox;
    sandbox.global = sandbox;

    const context = vm.createContext(sandbox);
    vm.runInContext(bundleContent, context);

    // 1. Verify AMD registration
    expect(amdRegisteredName).toBe('clientParamBuilder');
    expect(typeof amdRegisteredFactory).toBe('function');

    // 2. Verify global window assignment occurred despite AMD presence
    expect(context.clientParamBuilder).toBeDefined();
    expect(typeof context.clientParamBuilder.processAndCollectAllParams).toBe(
      'function'
    );
    expect(typeof context.clientParamBuilder.getFbc).toBe('function');
    expect(typeof context.clientParamBuilder.getFbp).toBe('function');

    // 3. AMD consumers get the same instance as window.clientParamBuilder
    expect(amdRegisteredFactory()).toBe(context.clientParamBuilder);
  });

  test('Bundle exposes clientParamBuilder on global window in non-AMD browser environment', () => {
    const sandbox = {
      location: {
        href: 'https://example.com/',
        hostname: 'example.com',
        protocol: 'https:',
      },
      document: {
        cookie: 'test=1',
        createElement: () => ({
          getAttribute: () => null,
          setAttribute: () => {},
        }),
        getElementsByTagName: () => [],
      },
      navigator: { userAgent: 'test-agent', platform: 'MacIntel' },
      setTimeout,
      clearTimeout,
      console,
    };
    sandbox.window = sandbox;
    sandbox.self = sandbox;
    sandbox.global = sandbox;

    const context = vm.createContext(sandbox);
    vm.runInContext(bundleContent, context);

    expect(context.clientParamBuilder).toBeDefined();
    expect(typeof context.clientParamBuilder.processAndCollectAllParams).toBe(
      'function'
    );
  });
});
