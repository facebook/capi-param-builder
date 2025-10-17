/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
const { getAppendixInfo } = require('../src/utils/AppendixProvider');

jest.mock('../package.json', () => ({version: '1.0.1'}));

describe('AppendixProvider - getAppendixInfo', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    jest.resetModules();
    jest.resetAllMocks();
  });

  test('test cases on valid input', () => {
    expect(getAppendixInfo(true)).toBe('AQQBAQAB'); // 1.0.1
    expect(getAppendixInfo(false)).toBe('AQQAAQAB'); // 1.0.1
  });

  test('test cases on invalid input', () => {
    const resultFalse = getAppendixInfo(false);
    expect(getAppendixInfo(1)).toBe(resultFalse);
    expect(getAppendixInfo('true')).toBe(resultFalse);
    expect(getAppendixInfo({})).toBe(resultFalse);
    expect(getAppendixInfo([])).toBe(resultFalse);
    expect(getAppendixInfo(0)).toBe(resultFalse);
    expect(getAppendixInfo('')).toBe(resultFalse);
    expect(getAppendixInfo(null)).toBe(resultFalse);
    expect(getAppendixInfo(undefined)).toBe(resultFalse);
  });

  test('should handle version 1.15.24', () => {
    jest.doMock('../package.json', () => ({version: '1.15.24'}));
    const { getAppendixInfo } = require('../src/utils/AppendixProvider');
    expect(getAppendixInfo(true)).toBe('AQQBAQ8Y');
    expect(getAppendixInfo(false)).toBe('AQQAAQ8Y');
  });

  test('should return LANGUAGE_TOKEN when version is invalid format', () => {
    mockPackageVersion('invalid-version');
    const { getAppendixInfo } = require('../src/utils/AppendixProvider');
    const result = getAppendixInfo(true);
    expect(result).toBe('BA');
  });

  test('should return LANGUAGE_TOKEN when version is missing', () => {
    mockPackageVersion({});
    const { getAppendixInfo } = require('../src/utils/AppendixProvider');
    const result = getAppendixInfo(true);
    expect(result).toBe('BA');
  });

  test('should return LANGUAGE_TOKEN when version has only 2 parts', () => {
    mockPackageVersion('1.0');
    const { getAppendixInfo } = require('../src/utils/AppendixProvider');
    const result = getAppendixInfo(true);
    expect(result).toBe('BA');
  });

  test('should return LANGUAGE_TOKEN when version has too many parts', () => {
    mockPackageVersion('1.0.0.1');
    const { getAppendixInfo } = require('../src/utils/AppendixProvider');
    const result = getAppendixInfo(true);
    expect(result).toBe('BA');
  });

  test('should return LANGUAGE_TOKEN when version contains non-numeric values', () => {
    mockPackageVersion('a.b.c');
    const { getAppendixInfo } = require('../src/utils/AppendixProvider');
    const result = getAppendixInfo(true);
    expect(result).toBe('BA');
  });

  function mockPackageVersion(version) {
    jest.resetModules();
    jest.doMock('../package.json', () => ({version: version}));
    jest.doMock('../src/model/Constants', () => ({
      LANGUAGE_TOKEN: 'BA',
      LANGUAGE_TOKEN_INDEX: 0x04,
      DEFAULT_FORMAT: 0x01,
    }));
  }
});
