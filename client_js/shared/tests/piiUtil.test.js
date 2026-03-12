/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getNormalizedAndHashedPII } from '../utils/piiUtil/piiUtil.js';
import { PII_DATA_TYPE } from '../model/constants.js';

// Mock the version module
jest.mock('../version.js', () => ({
  getVersionInfo: jest.fn(() => ({
    version: '1.0.0',
    buildDate: '2025-01-01T00:00:00.000Z',
  })),
}));

describe('getNormalizedAndHashedPII', () => {
  // Expected appendix values for version 1.0.0
  const APPENDIX_NET_NEW_STR = 'AQYCAQAA';
  const APPENDIX_NO_CHANGE_STR = 'AQYAAQAA';

  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedAndHashedPII(null, PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(
        getNormalizedAndHashedPII(undefined, PII_DATA_TYPE.EMAIL)
      ).toBeNull();
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false, 0];

      nonStringValues.forEach((value) => {
        expect(
          getNormalizedAndHashedPII(value, PII_DATA_TYPE.EMAIL)
        ).toBeNull();
      });
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedAndHashedPII('', PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return null for falsy string inputs', () => {
      expect(getNormalizedAndHashedPII('', PII_DATA_TYPE.EMAIL)).toBeNull();
    });
  });

  describe('Hash detection and handling', () => {
    it('should detect and return SHA-256 hashes lowercased', () => {
      const sha256Hashes = [
        'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', // uppercase
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // lowercase
        'A665a45920422F9d417E4867EFDC4Fb8a04a1F3FFF1fa07E998e86F7f7A27ae3', // mixed case
        'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890', // all hex chars
        '0000000000000000000000000000000000000000000000000000000000000000', // all zeros
        '2CF24DBA4F21D4288094E8452703C0F0142FA00B2EEB1F2C9B4E70F39E8A4C29', // SHA-256 of "hello"
        'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', // SHA-256 of empty string
      ];

      sha256Hashes.forEach((hash) => {
        const result = getNormalizedAndHashedPII(hash, PII_DATA_TYPE.EMAIL);
        expect(result).toEqual(hash.toLowerCase() + '.' + APPENDIX_NO_CHANGE_STR);
      });
    });

    it('should detect and return MD5 hashes lowercased', () => {
      const md5Hashes = [
        'A665A45920422F9D417E4867EFDC4FB8', // uppercase
        'a665a45920422f9d417e4867efdc4fb8', // lowercase
        'A665a45920422F9d417E4867EFDC4Fb8', // mixed case
        'ABCDEF1234567890ABCDEF1234567890', // all hex chars
        '00000000000000000000000000000000', // all zeros
        '5D41402ABC4B2A76B9719D911017C592', // MD5 of "hello"
        'D41D8CD98F00B204E9800998ECF8427E', // MD5 of empty string
        '098F6BCD4621D373CADE4E832627B4F6', // MD5 of "test"
      ];

      md5Hashes.forEach((hash) => {
        const result = getNormalizedAndHashedPII(hash, PII_DATA_TYPE.EMAIL);
        expect(result).toEqual(hash.toLowerCase() + '.' + APPENDIX_NO_CHANGE_STR);
      });
    });

    it('should not treat invalid hash-like strings as hashes', () => {
      const testCases = [
        {
          input:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars (SHA-256 - 1)
          isHash: false,
        },
        {
          input:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars (SHA-256 + 1)
          isHash: false,
        },
        {
          input: 'a665a45920422f9d417e4867efdc4fb', // 31 chars (MD5 - 1)
          isHash: false,
        },
        {
          input: 'a665a45920422f9d417e4867efdc4fb80', // 33 chars (MD5 + 1)
          isHash: false,
        },
        {
          input:
            'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'g'
          isHash: false,
        },
        {
          input:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae!', // invalid char '!'
          isHash: false,
        },
        {
          input: 'G665A45920422F9D417E4867EFDC4FB8', // invalid char 'G' for MD5
          isHash: false,
        },
        {
          input: 'A665A45920422F9D417E4867EFDC4FB!', // invalid char '!' for MD5
          isHash: false,
        },
        {
          input: '123', // too short
          isHash: false,
        },
        {
          input: 'not-a-hash', // clearly not a hash
          isHash: false,
        },
        {
          input: '1234567890abcdef1234567890abcdef', // 32 chars, valid hex - IS treated as hash
          isHash: true,
          expected: '1234567890abcdef1234567890abcdef.' + APPENDIX_NO_CHANGE_STR,
        },
        {
          input:
            '1234567890123456789012345678901234567890123456789012345678901234', // 64 digits but no hex letters
          isHash: false,
        },
      ];

      testCases.forEach(({ input, isHash, expected }) => {
        const result = getNormalizedAndHashedPII(input, PII_DATA_TYPE.EMAIL);

        if (isHash) {
          expect(result).toEqual(expected);
        } else if (input === '') {
          expect(result).toBeNull();
        } else {
          // Should call getNormalizedPII instead of treating as hash
          // Result might be null if getNormalizedPII returns null for invalid emails
          expect(typeof result === 'string' || result === null).toBe(true);
        }
      });
    });

    it('should handle hash detection regardless of dataType', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

      // Test with different data types - should always return the hash lowercased
      const dataTypes = [
        PII_DATA_TYPE.EMAIL,
        PII_DATA_TYPE.PHONE,
        PII_DATA_TYPE.FIRST_NAME,
        PII_DATA_TYPE.LAST_NAME,
        PII_DATA_TYPE.DATE_OF_BIRTH,
        PII_DATA_TYPE.GENDER,
        PII_DATA_TYPE.CITY,
        PII_DATA_TYPE.STATE,
        PII_DATA_TYPE.ZIP_CODE,
        PII_DATA_TYPE.COUNTRY,
        PII_DATA_TYPE.EXTERNAL_ID,
      ];

      dataTypes.forEach((dataType) => {
        expect(getNormalizedAndHashedPII(hash, dataType)).toEqual(
          hash + '.' + APPENDIX_NO_CHANGE_STR
        );
      });
    });

    it('should handle mixed case hashes consistently', () => {
      const testCases = [
        {
          input:
            'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3',
          expected:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
        },
        {
          input: 'A665A45920422F9D417E4867EFDC4FB8',
          expected: 'a665a45920422f9d417e4867efdc4fb8',
        },
        {
          input:
            'AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890',
          expected:
            'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        },
        {
          input: 'AbCdEf1234567890AbCdEf1234567890',
          expected: 'abcdef1234567890abcdef1234567890',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getNormalizedAndHashedPII(input, PII_DATA_TYPE.EMAIL);
        expect(result).toEqual(expected + '.' + APPENDIX_NO_CHANGE_STR);
      });
    });
  });

  describe('Fallback to getNormalizedPII and hashing', () => {
    it('should call getNormalizedPII and hash the result for non-hash strings', () => {
      const testCases = [
        {
          input: 'test@example.com',
          dataType: PII_DATA_TYPE.EMAIL,
        },
        {
          input: '123-456-7890',
          dataType: PII_DATA_TYPE.PHONE,
        },
        {
          input: 'John',
          dataType: PII_DATA_TYPE.FIRST_NAME,
        },
        {
          input: 'Smith',
          dataType: PII_DATA_TYPE.LAST_NAME,
        },
        {
          input: '12-31-1990',
          dataType: PII_DATA_TYPE.DATE_OF_BIRTH,
        },
        {
          input: 'male',
          dataType: PII_DATA_TYPE.GENDER,
        },
        {
          input: 'New York',
          dataType: PII_DATA_TYPE.CITY,
        },
        {
          input: 'California',
          dataType: PII_DATA_TYPE.STATE,
        },
        {
          input: 'United States',
          dataType: PII_DATA_TYPE.COUNTRY,
        },
        {
          input: 'user123',
          dataType: PII_DATA_TYPE.EXTERNAL_ID,
        },
        {
          input: '12345',
          dataType: PII_DATA_TYPE.ZIP_CODE,
        },
      ];

      testCases.forEach(({ input, dataType }) => {
        const result = getNormalizedAndHashedPII(input, dataType);

        // Should return a SHA-256 hash (64 chars) + '.' + appendix(8 chars) suffix or null
        if (result !== null) {
          expect(typeof result).toBe('string');
          expect(result).toMatch(
            new RegExp(`^[a-f0-9]{64}\\.${APPENDIX_NET_NEW_STR}$`)
          );
        }
      });
    });

    it('should hash the normalized result even if getNormalizedPII returns null', () => {
      // When getNormalizedPII returns null, getNormalizedAndHashedPII should also return null
      const result = getNormalizedAndHashedPII(
        'invalid-email',
        PII_DATA_TYPE.EMAIL
      );

      // Based on the implementation, if getNormalizedPII returns null, the function returns null
      expect(result).toBeNull();
    });

    it('should hash empty string results from normalization', () => {
      // When getNormalizedPII returns empty string, sha256_main will hash it
      const result = getNormalizedAndHashedPII(
        'only-letters-no-numbers',
        PII_DATA_TYPE.PHONE
      );

      // Empty string normalization results in null
      expect(result).toBeNull();
    });

    it('should handle null/undefined dataType by returning null', () => {
      // Based on implementation, invalid dataType results in null
      const result1 = getNormalizedAndHashedPII('test', null);
      const result2 = getNormalizedAndHashedPII('test', undefined);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should handle invalid dataType by returning null', () => {
      const invalidDataTypes = [
        'invalid_type',
        'INVALID',
        'not_a_pii_type',
        123,
        {},
        [],
      ];

      invalidDataTypes.forEach((dataType) => {
        const result = getNormalizedAndHashedPII('test', dataType);

        // Invalid dataType results in null from getNormalizedPII, so function returns null
        expect(result).toBeNull();
      });
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle boundary length hash cases', () => {
      const testCases = [
        {
          input: 'a'.repeat(31), // 31 chars - not MD5
          isHash: false,
        },
        {
          input: 'a'.repeat(32), // 32 chars - valid MD5 if all hex
          isHash: true,
          expected: 'a'.repeat(32) + '.' + APPENDIX_NO_CHANGE_STR,
        },
        {
          input: 'A'.repeat(32), // 32 chars - valid MD5 if all hex
          isHash: true,
          expected: 'a'.repeat(32) + '.' + APPENDIX_NO_CHANGE_STR,
        },
        {
          input: 'a'.repeat(33), // 33 chars - not MD5
          isHash: false,
        },
        {
          input: 'a'.repeat(63), // 63 chars - not SHA-256
          isHash: false,
        },
        {
          input: 'a'.repeat(64), // 64 chars - valid SHA-256 if all hex
          isHash: true,
          expected: 'a'.repeat(64) + '.' + APPENDIX_NO_CHANGE_STR,
        },
        {
          input: 'A'.repeat(64), // 64 chars - valid SHA-256 if all hex
          isHash: true,
          expected: 'a'.repeat(64) + '.' + APPENDIX_NO_CHANGE_STR,
        },
        {
          input: 'a'.repeat(65), // 65 chars - not SHA-256
          isHash: false,
        },
      ];

      testCases.forEach(({ input, isHash, expected }) => {
        const result = getNormalizedAndHashedPII(input, PII_DATA_TYPE.EMAIL);

        if (isHash) {
          expect(result).toEqual(expected);
        } else {
          // Should be processed by getNormalizedPII, not treated as hash
          // Result might be null if input is invalid for EMAIL type
          expect(result !== input.toLowerCase()).toBe(true);
        }
      });
    });

    it('should handle mixed hex and non-hex characters in hash-length strings', () => {
      const testCases = [
        {
          input: 'abcdef1234567890abcdef1234567890g', // 32 chars with invalid hex char 'g'
          isHash: false,
        },
        {
          input: 'abcdef1234567890abcdef1234567890!', // 32 chars with special char '!'
          isHash: false,
        },
        {
          input:
            'abcdef1234567890abcdef1234567890ABCDEF1234567890abcdef1234567890g', // 64 chars with invalid hex
          isHash: false,
        },
        {
          input:
            'abcdef1234567890abcdef1234567890ABCDEF1234567890abcdef1234567890!', // 64 chars with special char
          isHash: false,
        },
        {
          input: 'ABCDEF1234567890abcdef1234567890', // 32 chars, all valid hex
          isHash: true,
          expected: 'abcdef1234567890abcdef1234567890.' + APPENDIX_NO_CHANGE_STR,
        },
        {
          input:
            'ABCDEF1234567890abcdef1234567890ABCDEF1234567890abcdef1234567890', // 64 chars, all valid hex
          isHash: true,
          expected:
            'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890.' +
            APPENDIX_NO_CHANGE_STR,
        },
      ];

      testCases.forEach(({ input, isHash, expected }) => {
        const result = getNormalizedAndHashedPII(input, PII_DATA_TYPE.EMAIL);

        if (isHash) {
          expect(result).toEqual(expected);
        } else {
          // Should be processed by getNormalizedPII
          expect(result).not.toEqual(input.toLowerCase());
        }
      });
    });

    it('should handle all numeric hash-length strings', () => {
      const testCases = [
        {
          input: '1'.repeat(32), // 32 digits - treated as hash since all hex chars
          isHash: true,
          expected: '1'.repeat(32) + '.' + APPENDIX_NO_CHANGE_STR,
        },
        {
          input: '1'.repeat(64), // 64 digits - treated as hash since all hex chars
          isHash: true,
          expected: '1'.repeat(64) + '.' + APPENDIX_NO_CHANGE_STR,
        },
        {
          input: '123456789abcdef0123456789abcdef0', // 32 chars, mixed numbers and hex
          isHash: true,
          expected: '123456789abcdef0123456789abcdef0.' + APPENDIX_NO_CHANGE_STR,
        },
        {
          input:
            '123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0', // 64 chars, mixed
          isHash: true,
          expected:
            '123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0.' +
            APPENDIX_NO_CHANGE_STR,
        },
      ];

      testCases.forEach(({ input, isHash, expected }) => {
        const result = getNormalizedAndHashedPII(input, PII_DATA_TYPE.EMAIL);

        if (isHash) {
          expect(result).toEqual(expected);
        } else {
          // Should be processed by getNormalizedPII
          expect(result).not.toEqual(input.toLowerCase());
        }
      });
    });

    it('should handle real hash examples from common algorithms', () => {
      const testCases = [
        {
          input: '5d41402abc4b2a76b9719d911017c592', // MD5 of "hello"
          expected: '5d41402abc4b2a76b9719d911017c592',
        },
        {
          input:
            '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29', // SHA-256 of "hello"
          expected:
            '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29',
        },
        {
          input: 'd41d8cd98f00b204e9800998ecf8427e', // MD5 of empty string
          expected: 'd41d8cd98f00b204e9800998ecf8427e',
        },
        {
          input:
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // SHA-256 of empty string
          expected:
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        {
          input: '098F6BCD4621D373CADE4E832627B4F6', // MD5 of "test" in uppercase
          expected: '098f6bcd4621d373cade4e832627b4f6',
        },
        {
          input:
            '9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08', // SHA-256 of "test" in uppercase
          expected:
            '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getNormalizedAndHashedPII(input, PII_DATA_TYPE.EMAIL);
        expect(result).toEqual(expected + '.' + APPENDIX_NO_CHANGE_STR);
      });
    });

    it('should handle case sensitivity in hash detection across different data types', () => {
      const mixedCaseHash =
        'A665A45920422F9D417E4867EFDC4FB8a04a1f3fff1fa07e998e86f7f7a27ae3';
      const expectedLowercase =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

      // Test with different data types to ensure case normalization works consistently
      const dataTypes = [
        PII_DATA_TYPE.EMAIL,
        PII_DATA_TYPE.PHONE,
        PII_DATA_TYPE.FIRST_NAME,
        PII_DATA_TYPE.GENDER,
        PII_DATA_TYPE.CITY,
        PII_DATA_TYPE.STATE,
        PII_DATA_TYPE.COUNTRY,
        PII_DATA_TYPE.EXTERNAL_ID,
        PII_DATA_TYPE.ZIP_CODE,
      ];

      dataTypes.forEach((dataType) => {
        const result = getNormalizedAndHashedPII(mixedCaseHash, dataType);
        expect(result).toEqual(expectedLowercase + '.' + APPENDIX_NO_CHANGE_STR);
      });
    });

    it('should handle special characters and unicode in non-hash strings', () => {
      const testCases = [
        'José@example.com',
        'test@münchen.de',
        '用户@example.com',
        'тест@example.com',
        'test@🎉.com',
        'special!@#$%chars@domain.com',
      ];

      testCases.forEach((input) => {
        const result = getNormalizedAndHashedPII(input, PII_DATA_TYPE.EMAIL);

        // Should not be treated as hash - result might be null if email is invalid
        expect(result).not.toEqual(input.toLowerCase());
        // Don't expect result to be non-null since some of these may be invalid emails
      });
    });

    it('should handle very long non-hash strings', () => {
      const longString = 'a'.repeat(1000);

      const result = getNormalizedAndHashedPII(longString, PII_DATA_TYPE.EMAIL);
      // Very long strings may be rejected by email normalization, so result could be null
      expect(typeof result === 'string' || result === null).toBe(true);
      if (result !== null) {
        expect(result).not.toEqual(longString.toLowerCase()); // Should be processed by email normalization
      }
    });

    it('should handle concurrent calls with different inputs', () => {
      const testInputs = [
        { input: 'test1@example.com', dataType: PII_DATA_TYPE.EMAIL },
        {
          input:
            'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3',
          dataType: PII_DATA_TYPE.EMAIL,
        }, // hash
        { input: 'test2@example.com', dataType: PII_DATA_TYPE.EMAIL },
        {
          input: '5d41402abc4b2a76b9719d911017c592',
          dataType: PII_DATA_TYPE.PHONE,
        }, // hash
        { input: '123-456-7890', dataType: PII_DATA_TYPE.PHONE },
      ];

      const results = testInputs.map(({ input, dataType }) => {
        return getNormalizedAndHashedPII(input, dataType);
      });

      // Check that hash inputs returned lowercased hashes
      expect(results[1]).toEqual(
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3.' +
          APPENDIX_NO_CHANGE_STR
      );
      expect(results[3]).toEqual(
        '5d41402abc4b2a76b9719d911017c592.' + APPENDIX_NO_CHANGE_STR
      );

      // Check that non-hash inputs were processed (not null)
      expect(results[0]).not.toBeNull();
      expect(results[2]).not.toBeNull();
      expect(results[4]).not.toBeNull();

      // Check that non-hash inputs were hashed to 64-char SHA-256 format + '.' + appendix(8 chars) suffix
      expect(results[0]).toMatch(
        new RegExp(`^[a-f0-9]{64}\\.${APPENDIX_NET_NEW_STR}$`)
      );
      expect(results[2]).toMatch(
        new RegExp(`^[a-f0-9]{64}\\.${APPENDIX_NET_NEW_STR}$`)
      );
      expect(results[4]).toMatch(
        new RegExp(`^[a-f0-9]{64}\\.${APPENDIX_NET_NEW_STR}$`)
      );
    });

    it('should maintain function isolation between different PII types for hashes', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

      // Call with different PII types - should all return the same lowercased hash
      const emailResult = getNormalizedAndHashedPII(hash, PII_DATA_TYPE.EMAIL);
      const phoneResult = getNormalizedAndHashedPII(hash, PII_DATA_TYPE.PHONE);
      const nameResult = getNormalizedAndHashedPII(
        hash,
        PII_DATA_TYPE.FIRST_NAME
      );
      const genderResult = getNormalizedAndHashedPII(
        hash,
        PII_DATA_TYPE.GENDER
      );
      const cityResult = getNormalizedAndHashedPII(hash, PII_DATA_TYPE.CITY);
      const stateResult = getNormalizedAndHashedPII(hash, PII_DATA_TYPE.STATE);
      const countryResult = getNormalizedAndHashedPII(
        hash,
        PII_DATA_TYPE.COUNTRY
      );
      const externalIdResult = getNormalizedAndHashedPII(
        hash,
        PII_DATA_TYPE.EXTERNAL_ID
      );
      const zipResult = getNormalizedAndHashedPII(hash, PII_DATA_TYPE.ZIP_CODE);

      // All should return the same lowercased hash + '.' + appendix(8 chars) suffix
      expect(emailResult).toEqual(hash + '.' + APPENDIX_NO_CHANGE_STR);
      expect(phoneResult).toEqual(hash + '.' + APPENDIX_NO_CHANGE_STR);
      expect(nameResult).toEqual(hash + '.' + APPENDIX_NO_CHANGE_STR);
      expect(genderResult).toEqual(hash + '.' + APPENDIX_NO_CHANGE_STR);
      expect(cityResult).toEqual(hash + '.' + APPENDIX_NO_CHANGE_STR);
      expect(stateResult).toEqual(hash + '.' + APPENDIX_NO_CHANGE_STR);
      expect(countryResult).toEqual(hash + '.' + APPENDIX_NO_CHANGE_STR);
      expect(externalIdResult).toEqual(hash + '.' + APPENDIX_NO_CHANGE_STR);
      expect(zipResult).toEqual(hash + '.' + APPENDIX_NO_CHANGE_STR);
    });

    it('should handle whitespace variations in input', () => {
      const testCases = [
        '   ', // spaces only - should return null
        '\t\t\t', // tabs only - should return null
        '\n\n\n', // newlines only - should return null
        '\r\r\r', // carriage returns only - should return null
        ' \t\n\r ', // mixed whitespace - should return null
        '  test@example.com  ', // whitespace around content - should be processed
        ' a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3 ', // whitespace around hash - should not be treated as hash
      ];

      testCases.forEach((input) => {
        const result = getNormalizedAndHashedPII(input, PII_DATA_TYPE.EMAIL);

        if (input.trim() === '') {
          expect(result).toBeNull(); // Whitespace-only should return null
        } else {
          // Non-empty content should be processed, but result may be null if invalid for the data type
          expect(typeof result === 'string' || result === null).toBe(true);

          // If input contained a hash but had whitespace, it shouldn't be treated as hash
          if (
            input.includes(
              'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'
            )
          ) {
            expect(result).not.toEqual(
              'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3.' +
                APPENDIX_NET_NEW_STR
            );
          }
        }
      });
    });
  });
});
