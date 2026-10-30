/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
const { ParamBuilder, PII_DATA_TYPE } = require('../index');
const { getNormalizedDOB } = require('../src/piiUtil/dobUtil');

// Pin only version metadata; normalization, hashing and appendix code are real.
jest.mock('../package.json', () => ({
  ...jest.requireActual('../package.json'),
  version: '1.3.2',
}));

// Independent UTF-8 digest fixtures, not values returned by the SDK.
const DOB_SHA =
  'e34847671d257b92802553ecff8091c5e218044431fd84ce1ce573e530710c83';
const DOB_MD5 = '54a75da2097567ece0f82dc850ec2da6';
// Version 1.3.2: [format=1, Node=4, change=2/0, major=1, minor=3, patch=2].
const NET_NEW = 'AQQCAQMC';
const NO_CHANGE = 'AQQAAQMC';

function normalize(input, dataType = PII_DATA_TYPE.DATE_OF_BIRTH) {
  return new ParamBuilder().getNormalizedAndHashedPII(input, dataType);
}

describe('Public Node Param Builder DOB contracts', () => {
  test('hashes the normalized date with the exact version appendix', () => {
    expect(normalize('  12-31-1990  ')).toBe(DOB_SHA + '.' + NET_NEW);
  });

  test.each([null, undefined, '', ' \t\n', 19901231, true, [], {}, 'invalid-date'])(
    'rejects empty, invalid or non-string input %p',
    (input) => {
      expect(normalize(input)).toBeNull();
    }
  );

  test.each(['DATE_OF_BIRTH', ' date_ of_ birth '])(
    'canonicalizes the supported data type %p',
    (dataType) => {
      expect(normalize('12-31-1990', dataType)).toBe(DOB_SHA + '.' + NET_NEW);
    }
  );

  test.each(['dob', 'date-of-birth', null, 123])(
    'rejects unsupported data type %p for a raw date',
    (dataType) => {
      expect(normalize('12-31-1990', dataType)).toBeNull();
    }
  );

  test('forwards missing data types through the real public API', () => {
    const builder = new ParamBuilder();
    expect(builder.getNormalizedAndHashedPII('12-31-1990')).toBeNull();
    expect(builder.getNormalizedAndHashedPII('12-31-1990', undefined)).toBeNull();
    expect(builder.getNormalizedAndHashedPII(DOB_SHA, undefined)).toBe(
      DOB_SHA + '.' + NO_CHANGE
    );
    expect(builder.getNormalizedAndHashedPII(DOB_MD5)).toBe(
      DOB_MD5 + '.' + NO_CHANGE
    );
  });

  test.each([DOB_SHA, DOB_MD5])(
    'trims and lowercases prehash %p without rehashing',
    (hash) => {
      expect(normalize(' ' + hash.toUpperCase() + ' ')).toBe(
        hash + '.' + NO_CHANGE
      );
    }
  );

  test('keeps MD5 support at the hashing boundary, not the direct helper', () => {
    expect(getNormalizedDOB(DOB_MD5)).toBeNull();
    expect(normalize(DOB_MD5)).toBe(DOB_MD5 + '.' + NO_CHANGE);
    expect(normalize(DOB_SHA, null)).toBe(DOB_SHA + '.' + NO_CHANGE);
  });

  test.each([DOB_SHA + '.AQ', DOB_SHA.toUpperCase() + '.ZZZZZZZZ', DOB_MD5 + '.' + NET_NEW])(
    'preserves the accepted suffixed prehash %p',
    (input) => {
      expect(normalize(' ' + input + ' ')).toBe(input);
    }
  );

  test.each([DOB_SHA + '.XX', DOB_SHA + '.1234567', DOB_SHA.slice(1) + '.' + NET_NEW])(
    'rejects the malformed suffixed prehash %p',
    (input) => {
      expect(normalize(input)).toBeNull();
    }
  );

  test('preserves one appendix when its exact output is fed back', () => {
    const expected = DOB_SHA + '.' + NET_NEW;
    const first = normalize('12-31-1990');
    expect(first).toBe(expected);
    expect(normalize(first)).toBe(expected);
  });

  test('distinguishes the eight-digit bypass from invalid grouped components', () => {
    expect(normalize('00000000')).toBe(
      '7e071fd9b023ed8f18458a73613a0834f6220bd5cc50357ba3493c6040a9ea8c.' + NET_NEW
    );
    expect(normalize('00-00-0000')).toBeNull();
  });

  test('characterizes day-range leniency without requiring a calendar date', () => {
    expect(normalize('02-31-1999')).toBe(
      'e373690e6985ab2e5d54ce90069d27753a98bcad09cbb18f3aca32c48107a1a2.' + NET_NEW
    );
  });

  test('returns null silently for guarded non-string and empty inputs', () => {
    const errorSpy = jest.spyOn(console, 'error');
    try {
      expect(normalize({})).toBeNull();
      expect(normalize('')).toBeNull();
      expect(normalize(' \t\n')).toBeNull();
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
