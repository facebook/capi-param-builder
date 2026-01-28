/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
const { getAppendixInfo } = require('../src/utils/AppendixProvider');
const {
  APPENDIX_GENERAL_NEW,
  APPENDIX_NET_NEW,
  APPENDIX_MODIFIED_NEW,
  APPENDIX_NO_CHANGE,
} = require('../src/model/Constants');

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
    expect(getAppendixInfo(APPENDIX_GENERAL_NEW)).toBe('AQQBAQAB');
    expect(getAppendixInfo(APPENDIX_NET_NEW)).toBe('AQQCAQAB');
    expect(getAppendixInfo(APPENDIX_MODIFIED_NEW)).toBe('AQQDAQAB');
    expect(getAppendixInfo(APPENDIX_NO_CHANGE)).toBe('AQQAAQAB');
    // Invalid appendix type
    expect(getAppendixInfo(0x99)).toBe('AQQAAQAB');
  });

  test('test cases on invalid input', () => {
    const resultNoChange = getAppendixInfo(APPENDIX_NO_CHANGE);
    expect(getAppendixInfo('true')).toBe(resultNoChange);
    expect(getAppendixInfo({})).toBe(resultNoChange);
    expect(getAppendixInfo([])).toBe(resultNoChange);
    expect(getAppendixInfo('')).toBe(resultNoChange);
    expect(getAppendixInfo(null)).toBe(resultNoChange);
    expect(getAppendixInfo(undefined)).toBe(resultNoChange);
  });

  test('should handle version 1.15.24', () => {
    jest.doMock('../package.json', () => ({version: '1.15.24'}));
    const { getAppendixInfo } = require('../src/utils/AppendixProvider');
    expect(getAppendixInfo(APPENDIX_GENERAL_NEW)).toBe('AQQBAQ8Y');
    expect(getAppendixInfo(APPENDIX_NET_NEW)).toBe('AQQCAQ8Y');
    expect(getAppendixInfo(APPENDIX_MODIFIED_NEW)).toBe('AQQDAQ8Y');
    expect(getAppendixInfo(APPENDIX_NO_CHANGE)).toBe('AQQAAQ8Y');
  });

  test('should return LANGUAGE_TOKEN when version is invalid format', () => {
    mockPackageVersion('invalid-version');
    const { getAppendixInfo } = require('../src/utils/AppendixProvider');
    const result = getAppendixInfo(APPENDIX_GENERAL_NEW);
    expect(result).toBe('BA');
  });

  test('should return LANGUAGE_TOKEN when version is missing', () => {
    mockPackageVersion({});
    const { getAppendixInfo } = require('../src/utils/AppendixProvider');
    const result = getAppendixInfo(APPENDIX_GENERAL_NEW);
    expect(result).toBe('BA');
  });

  test('should return LANGUAGE_TOKEN when version has only 2 parts', () => {
    mockPackageVersion('1.0');
    const { getAppendixInfo } = require('../src/utils/AppendixProvider');
    const result = getAppendixInfo(APPENDIX_GENERAL_NEW);
    expect(result).toBe('BA');
  });

  test('should return LANGUAGE_TOKEN when version has too many parts', () => {
    mockPackageVersion('1.0.0.1');
    const { getAppendixInfo } = require('../src/utils/AppendixProvider');
    const result = getAppendixInfo(APPENDIX_GENERAL_NEW);
    expect(result).toBe('BA');
  });

  test('should return LANGUAGE_TOKEN when version contains non-numeric values', () => {
    mockPackageVersion('a.b.c');
    const { getAppendixInfo } = require('../src/utils/AppendixProvider');
    const result = getAppendixInfo(APPENDIX_GENERAL_NEW);
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
