/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getNormalizedPII } from '../utils/piiUtil/piiUtil.js';
import { getNormalizedCountry } from '../utils/piiUtil/stringUtil.js';
import { PII_DATA_TYPE } from '../model/constants.js';

describe('getNormalizedCountry', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedCountry(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedCountry(undefined)).toBeNull();
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedCountry('')).toBeNull();
    });

    it('should return null for whitespace-only input', () => {
      expect(getNormalizedCountry('   ')).toBeNull();
      expect(getNormalizedCountry('\t\n\r')).toBeNull();
    });
  });

  describe('Country normalization', () => {
    it('should normalize example data', () => {
      const testCases = [
        {
          input: '       United States       ',
          expected: 'us',
        },
        {
          input: '       US       ',
          expected: 'us',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCountry(input)).toEqual(expected);
      });
    });

    it('should normalize major countries to ISO codes', () => {
      const testCases = [
        {
          input: 'United States',
          expected: 'us',
        },
        {
          input: 'Canada',
          expected: 'ca',
        },
        {
          input: 'Germany',
          expected: 'de',
        },
        {
          input: 'France',
          expected: 'fr',
        },
        {
          input: 'Japan',
          expected: 'jp',
        },
        {
          input: 'Australia',
          expected: 'au',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCountry(input)).toEqual(expected);
      });
    });

    it('should handle mixed case country names', () => {
      const testCases = [
        {
          input: 'uNiTeD sTaTeS',
          expected: 'us',
        },
        {
          input: 'cAnAdA',
          expected: 'ca',
        },
        {
          input: 'gErMaNy',
          expected: 'de',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCountry(input)).toEqual(expected);
      });
    });

    it('should truncate to 2 characters for non-mapped countries', () => {
      const testCases = [
        {
          input: 'Unknown',
          expected: 'un',
        },
        {
          input: 'TestCountry',
          expected: 'te',
        },
        {
          input: 'AB',
          expected: 'ab',
        },
        {
          input: 'X',
          expected: 'x',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCountry(input)).toEqual(expected);
      });
    });
  });

  describe('Hashed country handling', () => {
    it('should return SHA-256 hash as-is when it looks like a hash', () => {
      const validHashes = [
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
        'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
      ];

      validHashes.forEach((hash) => {
        expect(getNormalizedCountry(hash)).toEqual(hash);
      });
    });
  });
});

describe('getNormalizedPII with COUNTRY', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedPII(null, PII_DATA_TYPE.COUNTRY)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedPII(undefined, PII_DATA_TYPE.COUNTRY)).toBeNull();
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false];

      nonStringValues.forEach((value) => {
        expect(getNormalizedPII(value, PII_DATA_TYPE.COUNTRY)).toBeNull();
      });
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedPII('', PII_DATA_TYPE.COUNTRY)).toBeNull();
    });

    it('should return null for whitespace-only input', () => {
      expect(getNormalizedPII('   ', PII_DATA_TYPE.COUNTRY)).toBeNull();
      expect(getNormalizedPII('\t\n\r', PII_DATA_TYPE.COUNTRY)).toBeNull();
    });
  });

  describe('Country normalization', () => {
    it('should normalize country names using getNormalizedCountry', () => {
      const testCases = [
        {
          input: 'United States',
          expected: 'us',
        },
        {
          input: 'CANADA',
          expected: 'ca',
        },
        {
          input: '  Germany  ',
          expected: 'de',
        },
        {
          input: 'France',
          expected: 'fr',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.COUNTRY)).toEqual(
          expected
        );
      });
    });

    it('should handle hashed country names', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      expect(getNormalizedPII(hash, PII_DATA_TYPE.COUNTRY)).toEqual(hash);
    });
  });

  describe('Other PII data types', () => {
    it('should return null for invalid email when using EMAIL data type', () => {
      expect(getNormalizedPII('United States', PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return normalized phone for country when using PHONE data type', () => {
      expect(getNormalizedPII('United States', PII_DATA_TYPE.PHONE)).toEqual(
        ''
      );
      expect(getNormalizedPII('Country123', PII_DATA_TYPE.PHONE)).toEqual(
        '123'
      );
    });

    it('should return null for truly unsupported data types', () => {
      const unsupportedTypes = ['invalid_type', 'unknown', 'fake_type'];

      unsupportedTypes.forEach((type) => {
        expect(getNormalizedPII('United States', type)).toBeNull();
      });
    });
  });

  describe('Comparison with direct getNormalizedCountry', () => {
    it('should show both functions behave the same way for valid countries', () => {
      const testCases = [
        {
          input: 'United States',
          expected: 'us',
        },
        {
          input: '  Germany  ',
          expected: 'de',
        },
        {
          input: 'France',
          expected: 'fr',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCountry(input)).toEqual(expected);
        expect(getNormalizedPII(input, PII_DATA_TYPE.COUNTRY)).toEqual(
          expected
        );
      });
    });

    it('should show both handle hashes the same way', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

      expect(getNormalizedCountry(hash)).toEqual(hash);
      expect(getNormalizedPII(hash, PII_DATA_TYPE.COUNTRY)).toEqual(hash);
    });

    it('should show different handling for null/invalid inputs due to PII interface validation', () => {
      const invalidInputs = [null, undefined];

      invalidInputs.forEach((input) => {
        expect(getNormalizedCountry(input)).toBeNull();
        expect(getNormalizedPII(input, PII_DATA_TYPE.COUNTRY)).toBeNull();
      });
    });

    it('should show different handling for non-string inputs', () => {
      const nonStringInputs = [123, {}, [], true, false];

      nonStringInputs.forEach((input) => {
        // Direct function converts non-strings to strings and processes them
        const directResult = getNormalizedCountry(input);
        expect(
          [null, 'string'].includes(typeof directResult) ||
            directResult === null
        ).toBe(true);

        // PII interface returns null for non-string inputs (validates input first)
        expect(getNormalizedPII(input, PII_DATA_TYPE.COUNTRY)).toBeNull();
      });
    });
  });
});
