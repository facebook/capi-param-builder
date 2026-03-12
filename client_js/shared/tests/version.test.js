/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { VERSION, BUILD_DATE, getVersionInfo } from '../version.js';

describe('version module', () => {
  test('VERSION should be a string', () => {
    expect(typeof VERSION).toBe('string');
    expect(VERSION.length).toBeGreaterThan(0);
  });

  test('VERSION should match semver-like format', () => {
    // Version should be something like '1.0.0' or at least contain digits
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$|^\d+/);
  });

  test('BUILD_DATE should be a string', () => {
    expect(typeof BUILD_DATE).toBe('string');
    expect(BUILD_DATE.length).toBeGreaterThan(0);
  });

  test('BUILD_DATE should be a valid ISO date string', () => {
    // BUILD_DATE should be parseable as a date
    const date = new Date(BUILD_DATE);
    expect(date.toString()).not.toBe('Invalid Date');
  });

  test('getVersionInfo returns object with version and buildDate', () => {
    const info = getVersionInfo();
    expect(info).toHaveProperty('version');
    expect(info).toHaveProperty('buildDate');
  });

  test('getVersionInfo returns correct version', () => {
    const info = getVersionInfo();
    expect(info.version).toBe(VERSION);
  });

  test('getVersionInfo returns correct buildDate', () => {
    const info = getVersionInfo();
    expect(info.buildDate).toBe(BUILD_DATE);
  });
});
