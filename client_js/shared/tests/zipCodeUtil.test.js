/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getNormalizedPII } from '../utils/piiUtil/piiUtil.js';
import { getNormalizedZipCode } from '../utils/piiUtil/zipCodeUtil.js';
import { PII_DATA_TYPE } from '../model/constants.js';

describe('getNormalizedZipCode', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedZipCode(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedZipCode(undefined)).toBeNull();
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false];

      nonStringValues.forEach((value) => {
        expect(getNormalizedZipCode(value)).toBeNull();
      });
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedZipCode('')).toBeNull();
    });

    it('should return null for whitespace-only input', () => {
      expect(getNormalizedZipCode('   ')).toBeNull();
      expect(getNormalizedZipCode('\t\n\r')).toBeNull();
    });

    it('should return null for single character input', () => {
      expect(getNormalizedZipCode('1')).toBeNull();
      expect(getNormalizedZipCode('a')).toBeNull();
    });
  });

  describe('ZIP code normalization', () => {
    it('should normalize basic US ZIP codes', () => {
      const testCases = [
        {
          input: '12345',
          expected: '12345',
        },
        {
          input: '90210',
          expected: '90210',
        },
        {
          input: '10001',
          expected: '10001',
        },
        {
          input: '94102',
          expected: '94102',
        },
        {
          input: '  37221',
          expected: '37221',
        },
        {
          input: '37221-3312',
          expected: '37221',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedZipCode(input)).toEqual(expected);
      });
    });

    it('should normalize ZIP+4 codes by taking only the first part', () => {
      const testCases = [
        {
          input: '12345-6789',
          expected: '12345',
        },
        {
          input: '90210-1234',
          expected: '90210',
        },
        {
          input: '10001-0001',
          expected: '10001',
        },
        {
          input: '94102-4567',
          expected: '94102',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedZipCode(input)).toEqual(expected);
      });
    });

    it('should normalize international postal codes', () => {
      const testCases = [
        {
          input: 'K1A 0A6', // Canadian postal code
          expected: 'k1a 0a6',
        },
        {
          input: 'SW1A 1AA', // UK postal code
          expected: 'sw1a 1aa',
        },
        {
          input: '75001', // French postal code
          expected: '75001',
        },
        {
          input: '10115', // German postal code
          expected: '10115',
        },
        {
          input: '100-0001', // Japanese postal code
          expected: '100',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedZipCode(input)).toEqual(expected);
      });
    });

    it('should handle ZIP codes with leading/trailing whitespace', () => {
      const testCases = [
        {
          input: '  12345  ',
          expected: '12345',
        },
        {
          input: '\t90210\n',
          expected: '90210',
        },
        {
          input: ' 12345-6789 ',
          expected: '12345',
        },
        {
          input: '\r\n94102-4567\t',
          expected: '94102',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedZipCode(input)).toEqual(expected);
      });
    });

    it('should convert to lowercase', () => {
      const testCases = [
        {
          input: 'K1A 0A6',
          expected: 'k1a 0a6',
        },
        {
          input: 'SW1A 1AA',
          expected: 'sw1a 1aa',
        },
        {
          input: 'M5V 3A8',
          expected: 'm5v 3a8',
        },
        {
          input: 'H0H 0H0',
          expected: 'h0h 0h0',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedZipCode(input)).toEqual(expected);
      });
    });

    it('should handle mixed alphanumeric postal codes', () => {
      const testCases = [
        {
          input: 'A1B 2C3', // Canadian format
          expected: 'a1b 2c3',
        },
        {
          input: 'EC1A 1BB', // UK format
          expected: 'ec1a 1bb',
        },
        {
          input: 'M1M 1M1',
          expected: 'm1m 1m1',
        },
        {
          input: 'V6B 1A1',
          expected: 'v6b 1a1',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedZipCode(input)).toEqual(expected);
      });
    });

    it('should handle very short valid ZIP codes', () => {
      const testCases = [
        {
          input: '01', // Minimum 2 characters
          expected: '01',
        },
        {
          input: '12',
          expected: '12',
        },
        {
          input: 'AB',
          expected: 'ab',
        },
        {
          input: 'A1',
          expected: 'a1',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedZipCode(input)).toEqual(expected);
      });
    });

    it('should handle ZIP codes with multiple hyphens', () => {
      const testCases = [
        {
          input: '12345-6789-0123',
          expected: '12345', // Takes only first part before first hyphen
        },
        {
          input: '90210-1234-5678',
          expected: '90210',
        },
        {
          input: 'SW1A-1AA-XXX',
          expected: 'sw1a',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedZipCode(input)).toEqual(expected);
      });
    });

    it('should handle ZIP codes with special characters', () => {
      const testCases = [
        {
          input: '12345#6789',
          expected: '12345#6789', // No hyphen, so entire string is used
        },
        {
          input: '90210_1234',
          expected: '90210_1234',
        },
        {
          input: '10001 0001',
          expected: '10001 0001',
        },
        {
          input: '94102.4567',
          expected: '94102.4567',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedZipCode(input)).toEqual(expected);
      });
    });
  });

  describe('Hashed ZIP code handling', () => {
    it('should return SHA-256 hash as-is when it looks like a hash', () => {
      const validHashes = [
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 'hello' hashed
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty string hashed
        '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29', // 'hello' in different case
        'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890', // uppercase hash
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // mixed case hash
      ];

      validHashes.forEach((hash) => {
        const result = getNormalizedZipCode(hash);
        expect(result).toEqual(hash);
      });
    });

    it('should process invalid hash-like strings as regular ZIP codes', () => {
      const invalidHashes = [
        {
          input:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
          expected:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae',
        },
        {
          input:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars
          expected:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33',
        },
        {
          input:
            'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'g'
          expected:
            'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
        },
        {
          input:
            'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE!', // invalid char '!'
          expected:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae!',
        },
        {
          input: '123', // too short for hash
          expected: '123',
        },
      ];

      invalidHashes.forEach(({ input, expected }) => {
        const result = getNormalizedZipCode(input);
        expect(result).toEqual(expected);
      });
    });

    it('should handle mixed case hashed ZIP codes', () => {
      const mixedCaseHash =
        'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
      const result = getNormalizedZipCode(mixedCaseHash);
      expect(result).toEqual(mixedCaseHash);
    });

    it('should handle lowercase hashed ZIP codes', () => {
      const lowercaseHash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      const result = getNormalizedZipCode(lowercaseHash);
      expect(result).toEqual(lowercaseHash);
    });
  });

  describe('Edge cases', () => {
    it('should handle numeric input correctly', () => {
      // Function expects string input, so numeric inputs should return null
      expect(getNormalizedZipCode(12345)).toBeNull();
      expect(getNormalizedZipCode(90210)).toBeNull();
      expect(getNormalizedZipCode(0)).toBeNull();
    });

    it('should handle empty ZIP codes after hyphen split', () => {
      const testCases = [
        {
          input: '-', // Just hyphen
          expected: null, // Empty string after split should be null (length < 2)
        },
        {
          input: '--', // Multiple hyphens
          expected: null,
        },
        {
          input: 'A-', // Single character before hyphen
          expected: null,
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedZipCode(input)).toEqual(expected);
      });
    });

    it('should handle extreme cases', () => {
      const testCases = [
        {
          input: 'A'.repeat(100), // Very long string
          expected: 'a'.repeat(100),
        },
        {
          input: '1'.repeat(100) + '-' + '2'.repeat(100), // Very long with hyphen
          expected: '1'.repeat(100),
        },
        {
          input: 'MiXeD-CaSe-123',
          expected: 'mixed',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedZipCode(input)).toEqual(expected);
      });
    });

    it('should handle Unicode and international characters', () => {
      const testCases = [
        {
          input: '１２３４５', // Full-width numbers
          expected: '１２３４５',
        },
        {
          input: 'Üß123', // German characters
          expected: 'üß123',
        },
        {
          input: '東京123', // Japanese characters
          expected: '東京123',
        },
        {
          input: 'Москва-123', // Cyrillic characters
          expected: 'москва',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedZipCode(input)).toEqual(expected);
      });
    });
  });
});

describe('getNormalizedPII with ZIP_CODE', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedPII(null, PII_DATA_TYPE.ZIP_CODE)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedPII(undefined, PII_DATA_TYPE.ZIP_CODE)).toBeNull();
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false];

      nonStringValues.forEach((value) => {
        expect(getNormalizedPII(value, PII_DATA_TYPE.ZIP_CODE)).toBeNull();
      });
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedPII('', PII_DATA_TYPE.ZIP_CODE)).toBeNull();
    });

    it('should return null for null data type', () => {
      expect(getNormalizedPII('12345', null)).toBeNull();
    });

    it('should return null for undefined data type', () => {
      expect(getNormalizedPII('12345', undefined)).toBeNull();
    });

    it('should return null for invalid data type', () => {
      expect(getNormalizedPII('12345', 'invalid_type')).toBeNull();
    });
  });

  describe('ZIP_CODE data type handling', () => {
    it('should return original value for ZIP_CODE data type (not specifically normalized)', () => {
      const testCases = [
        { input: '12345', piiResult: '12345' },
        { input: '90210-1234', piiResult: '90210' },
        { input: 'K1A 0A6', piiResult: 'k1a 0a6' },
        { input: 'SW1A 1AA', piiResult: 'sw1a 1aa' },
        { input: '  12345  ', piiResult: '12345' },
        { input: 'MIXED-case-123', piiResult: 'mixed' },
      ];

      testCases.forEach(({ input, piiResult }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.ZIP_CODE)).toEqual(
          piiResult
        );
      });
    });

    it('should handle whitespace-only ZIP codes', () => {
      // getNormalizedPII calls getNormalizedZipCode which returns null for whitespace-only strings
      expect(getNormalizedPII('   ', PII_DATA_TYPE.ZIP_CODE)).toBeNull();
      expect(getNormalizedPII('\t\n\r', PII_DATA_TYPE.ZIP_CODE)).toBeNull();
    });
  });

  describe('Other PII data types', () => {
    it('should return null for invalid email when using EMAIL data type', () => {
      expect(getNormalizedPII('12345', PII_DATA_TYPE.EMAIL)).toBeNull();
      expect(getNormalizedPII('90210-1234', PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return normalized phone for ZIP codes when using PHONE data type', () => {
      expect(getNormalizedPII('12345', PII_DATA_TYPE.PHONE)).toEqual('12345');
      expect(getNormalizedPII('90210-1234', PII_DATA_TYPE.PHONE)).toEqual(
        '902101234'
      );
    });

    it('should return null for truly unsupported data types', () => {
      const unsupportedTypes = ['invalid_type', 'unknown', 'fake_type'];

      unsupportedTypes.forEach((type) => {
        expect(getNormalizedPII('12345', type)).toBeNull();
      });
    });
  });

  describe('Comparison with direct getNormalizedZipCode', () => {
    it('should show difference between direct function and PII interface', () => {
      const testCases = [
        { input: '12345-6789', piiResult: '12345', directResult: '12345' },
        { input: 'SW1A 1AA', piiResult: 'sw1a 1aa', directResult: 'sw1a 1aa' },
        { input: '  K1A-0A6  ', piiResult: 'k1a', directResult: 'k1a' },
      ];

      testCases.forEach(({ input, piiResult, directResult }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.ZIP_CODE)).toEqual(
          piiResult
        );
        expect(getNormalizedZipCode(input)).toEqual(directResult);
      });
    });

    it('should show both handle hashes the same way', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

      expect(getNormalizedZipCode(hash)).toEqual(hash);
      expect(getNormalizedPII(hash, PII_DATA_TYPE.ZIP_CODE)).toEqual(hash);
    });

    it('should show both handle null/invalid inputs similarly', () => {
      const invalidInputs = [null, undefined, 123, {}, []];

      invalidInputs.forEach((input) => {
        expect(getNormalizedZipCode(input)).toBeNull();
        expect(getNormalizedPII(input, PII_DATA_TYPE.ZIP_CODE)).toBeNull();
      });
    });
  });
});
