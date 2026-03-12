/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getNormalizedPII } from '../utils/piiUtil/piiUtil.js';
import { getNormalizedExternalID } from '../utils/piiUtil/stringUtil.js';
import { PII_DATA_TYPE } from '../model/constants.js';

describe('getNormalizedExternalID', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedExternalID(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedExternalID(undefined)).toBeNull();
    });

    it('should convert non-string inputs to strings and normalize', () => {
      const testCases = [
        {
          input: 123,
          expected: '123',
        },
        {
          input: true,
          expected: 'true',
        },
        {
          input: false,
          expected: 'false',
        },
        {
          input: {},
          expected: '[objectobject]', // Object toString becomes '[object Object]', spaces stripped, lowercased, brackets preserved
        },
        {
          input: [],
          expected: '', // Empty array toString is empty string
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });

    it('should handle empty string input', () => {
      expect(getNormalizedExternalID('')).toEqual('');
    });

    it('should handle whitespace-only input', () => {
      expect(getNormalizedExternalID('   ')).toEqual(''); // Whitespace stripped
      expect(getNormalizedExternalID('\t\n\r')).toEqual(''); // Whitespace stripped
    });
  });

  describe('External ID normalization', () => {
    it('should normalize example data', () => {
      const testCases = [
        {
          input: '  12345',
          expected: '12345',
        },
        {
          input: 'abc-12345 ',
          expected: 'abc-12345', // Lowercased
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });
    it('should normalize basic external IDs', () => {
      const testCases = [
        {
          input: 'user123',
          expected: 'user123',
        },
        {
          input: 'USER456',
          expected: 'user456', // Lowercased
        },
        {
          input: 'Customer_789',
          expected: 'customer_789', // Lowercased, underscore preserved
        },
        {
          input: 'ext-id-001',
          expected: 'ext-id-001', // Lowercased, hyphens preserved
        },
        {
          input: 'ID.2023.ABC',
          expected: 'id.2023.abc', // Lowercased, dots preserved
        },
        {
          input: 'ref#12345',
          expected: 'ref#12345', // Lowercased, special chars preserved
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });

    it('should strip whitespace but preserve other characters', () => {
      const testCases = [
        {
          input: '  user123  ',
          expected: 'user123', // Leading/trailing whitespace stripped
        },
        {
          input: '\tUSER456\n',
          expected: 'user456', // Tab/newline whitespace stripped, lowercased
        },
        {
          input: ' Customer_789 ',
          expected: 'customer_789', // Whitespace stripped, underscore preserved
        },
        {
          input: '\r\next-id-001\t',
          expected: 'ext-id-001', // All whitespace stripped
        },
        {
          input: 'user 123 id',
          expected: 'user123id', // Internal spaces stripped
        },
        {
          input: 'ID\t2023\nABC',
          expected: 'id2023abc', // Internal whitespace stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });

    it('should handle mixed case external IDs', () => {
      const testCases = [
        {
          input: 'UsEr123',
          expected: 'user123',
        },
        {
          input: 'CuStOmEr_456',
          expected: 'customer_456',
        },
        {
          input: 'EXT-ID-001',
          expected: 'ext-id-001',
        },
        {
          input: 'ID.MiXeD.CaSe',
          expected: 'id.mixed.case',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });

    it('should preserve special characters and punctuation', () => {
      const testCases = [
        {
          input: 'user@domain.com',
          expected: 'user@domain.com',
        },
        {
          input: 'ID#123-ABC',
          expected: 'id#123-abc',
        },
        {
          input: 'ext_id_2023',
          expected: 'ext_id_2023',
        },
        {
          input: 'customer.ref.001',
          expected: 'customer.ref.001',
        },
        {
          input: 'user|123|test',
          expected: 'user|123|test',
        },
        {
          input: 'id[456]',
          expected: 'id[456]',
        },
        {
          input: 'ref{789}',
          expected: 'ref{789}',
        },
        {
          input: 'user+premium',
          expected: 'user+premium',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });

    it('should handle numeric external IDs', () => {
      const testCases = [
        {
          input: '12345',
          expected: '12345',
        },
        {
          input: '0001',
          expected: '0001',
        },
        {
          input: '999999999',
          expected: '999999999',
        },
        {
          input: '0',
          expected: '0',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });

    it('should handle alphanumeric external IDs', () => {
      const testCases = [
        {
          input: 'user123abc',
          expected: 'user123abc',
        },
        {
          input: 'ABC123DEF',
          expected: 'abc123def',
        },
        {
          input: '123abc456def',
          expected: '123abc456def',
        },
        {
          input: 'a1b2c3d4',
          expected: 'a1b2c3d4',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });

    it('should handle UUIDs and GUID-like formats', () => {
      const testCases = [
        {
          input: '550e8400-e29b-41d4-a716-446655440000',
          expected: '550e8400-e29b-41d4-a716-446655440000',
        },
        {
          input: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          expected: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        },
        {
          input: 'F47AC10B-58CC-4372-A567-0E02B2C3D479',
          expected: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Lowercased
        },
        {
          input: '{6ba7b814-9dad-11d1-80b4-00c04fd430c8}',
          expected: '{6ba7b814-9dad-11d1-80b4-00c04fd430c8}',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });

    it('should handle very long external IDs', () => {
      const longId = 'A'.repeat(100) + 'B'.repeat(50);
      const result = getNormalizedExternalID(longId);
      expect(result).toEqual('a'.repeat(100) + 'b'.repeat(50)); // Lowercased
    });

    it('should handle external IDs with only special characters', () => {
      const testCases = [
        {
          input: '!@#$%^&*()',
          expected: '!@#$%^&*()',
        },
        {
          input: '[]{}|;:,.<>?',
          expected: '[]{}|;:,.<>?',
        },
        {
          input: '---',
          expected: '---',
        },
        {
          input: '...',
          expected: '...',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });

    it('should handle international and Unicode characters', () => {
      const testCases = [
        {
          input: 'José123',
          expected: 'josé123',
        },
        {
          input: 'François456',
          expected: 'françois456',
        },
        {
          input: 'Müller789',
          expected: 'müller789',
        },
        {
          input: 'Søren001',
          expected: 'søren001',
        },
        {
          input: 'Αθήνα123', // Greek
          expected: 'αθήνα123',
        },
        {
          input: 'Москва456', // Russian
          expected: 'москва456',
        },
        {
          input: '北京789', // Chinese
          expected: '北京789',
        },
        {
          input: '東京001', // Japanese
          expected: '東京001',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });

    it('should handle external IDs with emoji', () => {
      const testCases = [
        {
          input: 'user123😀',
          expected: 'user123😀',
        },
        {
          input: 'ID❤️456',
          expected: 'id❤️456',
        },
        {
          input: '🎉party789',
          expected: '🎉party789',
        },
        {
          input: '😀ID001',
          expected: '😀id001',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });
  });

  describe('Hashed external ID handling', () => {
    it('should return SHA-256 hash as-is when it looks like a hash', () => {
      const validHashes = [
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 'hello' hashed
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty string hashed
        '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29', // 'hello' in different case
        'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890', // uppercase hash
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // mixed case hash
      ];

      validHashes.forEach((hash) => {
        const result = getNormalizedExternalID(hash);
        expect(result).toEqual(hash);
      });
    });

    it('should process invalid hash-like strings as regular external IDs', () => {
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
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae!', // ! preserved, lowercased
        },
        {
          input: '123', // too short for hash
          expected: '123',
        },
      ];

      invalidHashes.forEach(({ input, expected }) => {
        const result = getNormalizedExternalID(input);
        expect(result).toEqual(expected);
      });
    });

    it('should handle mixed case hashed external IDs', () => {
      const mixedCaseHash =
        'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
      const result = getNormalizedExternalID(mixedCaseHash);
      expect(result).toEqual(mixedCaseHash);
    });

    it('should handle lowercase hashed external IDs', () => {
      const lowercaseHash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      const result = getNormalizedExternalID(lowercaseHash);
      expect(result).toEqual(lowercaseHash);
    });
  });

  describe('Edge cases', () => {
    it('should handle numeric strings', () => {
      const testCases = [
        {
          input: '123',
          expected: '123',
        },
        {
          input: '0',
          expected: '0',
        },
        {
          input: '456.789',
          expected: '456.789', // Decimal point preserved
        },
        {
          input: '-123',
          expected: '-123', // Minus sign preserved
        },
        {
          input: '+456',
          expected: '+456', // Plus sign preserved
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });

    it('should handle extreme cases', () => {
      const testCases = [
        {
          input: String(Number.MAX_SAFE_INTEGER),
          expected: String(Number.MAX_SAFE_INTEGER).toLowerCase(),
        },
        {
          input: 'A'.repeat(1000), // Very long string
          expected: 'a'.repeat(1000),
        },
        {
          input: '!@#$%^&*()_+-=[]{}|;:,.<>?',
          expected: '!@#$%^&*()_+-=[]{}|;:,.<>?', // All special chars preserved
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });

    it('should handle common external ID formats', () => {
      const testCases = [
        {
          input: 'cust_1234567890',
          expected: 'cust_1234567890', // Stripe-style customer ID
        },
        {
          input: 'acct_0123456789',
          expected: 'acct_0123456789', // Stripe-style account ID
        },
        {
          input: 'usr-ABC123DEF456',
          expected: 'usr-abc123def456', // Custom format with hyphens
        },
        {
          input: 'REF.2023.001.ABC',
          expected: 'ref.2023.001.abc', // Reference number format
        },
        {
          input: 'ID:12345:ABC:789',
          expected: 'id:12345:abc:789', // Colon-separated format
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
      });
    });
  });
});

describe('getNormalizedPII with EXTERNAL_ID', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedPII(null, PII_DATA_TYPE.EXTERNAL_ID)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedPII(undefined, PII_DATA_TYPE.EXTERNAL_ID)).toBeNull();
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false];

      nonStringValues.forEach((value) => {
        expect(getNormalizedPII(value, PII_DATA_TYPE.EXTERNAL_ID)).toBeNull();
      });
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedPII('', PII_DATA_TYPE.EXTERNAL_ID)).toBeNull();
    });

    it('should return empty string for whitespace-only input', () => {
      expect(getNormalizedPII('   ', PII_DATA_TYPE.EXTERNAL_ID)).toEqual('');
      expect(getNormalizedPII('\t\n\r', PII_DATA_TYPE.EXTERNAL_ID)).toEqual('');
    });

    it('should return null for null data type', () => {
      expect(getNormalizedPII('user123', null)).toBeNull();
    });

    it('should return null for undefined data type', () => {
      expect(getNormalizedPII('user123', undefined)).toBeNull();
    });

    it('should return null for invalid data type', () => {
      expect(getNormalizedPII('user123', 'invalid_type')).toBeNull();
    });
  });

  describe('External ID normalization', () => {
    it('should normalize external IDs using getNormalizedExternalID', () => {
      const testCases = [
        {
          input: 'USER123',
          expected: 'user123',
        },
        {
          input: 'Customer_456',
          expected: 'customer_456',
        },
        {
          input: '  ext-id-001  ',
          expected: 'ext-id-001',
        },
        {
          input: 'ID.2023.ABC',
          expected: 'id.2023.abc',
        },
        {
          input: 'ref#12345',
          expected: 'ref#12345',
        },
        {
          input: '550e8400-e29b-41d4-a716-446655440000',
          expected: '550e8400-e29b-41d4-a716-446655440000',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.EXTERNAL_ID)).toEqual(
          expected
        );
      });
    });

    it('should handle hashed external IDs', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      expect(getNormalizedPII(hash, PII_DATA_TYPE.EXTERNAL_ID)).toEqual(hash);
    });

    it('should return empty string for whitespace-only input after PII validation', () => {
      // PII interface passes through to getNormalizedExternalID for EXTERNAL_ID type
      expect(getNormalizedPII('   ', PII_DATA_TYPE.EXTERNAL_ID)).toEqual('');
      expect(getNormalizedPII('\t\n\r', PII_DATA_TYPE.EXTERNAL_ID)).toEqual('');
    });
  });

  describe('Other PII data types', () => {
    it('should return null for invalid email when using EMAIL data type', () => {
      expect(getNormalizedPII('user123', PII_DATA_TYPE.EMAIL)).toBeNull();
      expect(getNormalizedPII('ext-id-001', PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return normalized phone for external ID when using PHONE data type', () => {
      expect(getNormalizedPII('user123', PII_DATA_TYPE.PHONE)).toEqual('123');
      expect(getNormalizedPII('ext-id-001', PII_DATA_TYPE.PHONE)).toEqual(
        '1' // Leading zeros stripped
      );
      expect(getNormalizedPII('123-456-7890', PII_DATA_TYPE.PHONE)).toEqual(
        '1234567890'
      );
    });

    it('should return normalized DOB for external ID when using DATE_OF_BIRTH data type', () => {
      expect(
        getNormalizedPII('user123', PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toBeNull(); // Invalid date
      expect(
        getNormalizedPII('ext-id-001', PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toBeNull(); // Invalid date
      expect(
        getNormalizedPII('12-31-1990', PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toEqual('19901231');
    });

    it('should return normalized gender for external ID when using GENDER data type', () => {
      expect(getNormalizedPII('male', PII_DATA_TYPE.GENDER)).toEqual('m');
      expect(getNormalizedPII('female', PII_DATA_TYPE.GENDER)).toEqual('f');
      expect(getNormalizedPII('user123', PII_DATA_TYPE.GENDER)).toBeNull(); // Invalid gender term
    });

    it('should return normalized name for external ID when using NAME data types', () => {
      expect(getNormalizedPII('user123', PII_DATA_TYPE.FIRST_NAME)).toEqual(
        'user123'
      );
      expect(getNormalizedPII('ext-id-001', PII_DATA_TYPE.LAST_NAME)).toEqual(
        'extid001'
      );
      expect(
        getNormalizedPII('Customer_456', PII_DATA_TYPE.FIRST_NAME)
      ).toEqual('customer456');
    });

    it('should return normalized city for external ID when using CITY data type', () => {
      expect(getNormalizedPII('user123', PII_DATA_TYPE.CITY)).toEqual(
        'user123'
      );
      expect(getNormalizedPII('ext-id-001', PII_DATA_TYPE.CITY)).toEqual(
        'extid001'
      );
      expect(getNormalizedPII('123user', PII_DATA_TYPE.CITY)).toBeNull(); // Starts with number
    });

    it('should return normalized state for external ID when using STATE data type', () => {
      expect(getNormalizedPII('user123', PII_DATA_TYPE.STATE)).toEqual('us'); // Truncated to 2 chars
      expect(getNormalizedPII('ext-id-001', PII_DATA_TYPE.STATE)).toEqual('ex'); // Truncated to 2 chars
      expect(getNormalizedPII('California', PII_DATA_TYPE.STATE)).toEqual('ca'); // State match
    });

    it('should return normalized country for external ID when using COUNTRY data type', () => {
      expect(getNormalizedPII('user123', PII_DATA_TYPE.COUNTRY)).toEqual('us'); // Truncated to 2 chars
      expect(getNormalizedPII('ext-id-001', PII_DATA_TYPE.COUNTRY)).toEqual(
        'ex'
      ); // Truncated to 2 chars
      expect(getNormalizedPII('Germany', PII_DATA_TYPE.COUNTRY)).toEqual('de'); // Country match
    });

    it('should return null for truly unsupported data types', () => {
      const unsupportedTypes = ['invalid_type', 'unknown', 'fake_type'];

      unsupportedTypes.forEach((type) => {
        expect(getNormalizedPII('user123', type)).toBeNull();
      });
    });
  });

  describe('Comparison with direct getNormalizedExternalID', () => {
    it('should show both functions behave the same way for valid external IDs', () => {
      const testCases = [
        {
          input: 'USER123',
          expected: 'user123',
        },
        {
          input: '  Customer_456  ',
          expected: 'customer_456',
        },
        {
          input: 'ext-id-001',
          expected: 'ext-id-001',
        },
        {
          input: 'ID.2023.ABC',
          expected: 'id.2023.abc',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedExternalID(input)).toEqual(expected);
        expect(getNormalizedPII(input, PII_DATA_TYPE.EXTERNAL_ID)).toEqual(
          expected
        );
      });
    });

    it('should show both handle hashes the same way', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

      expect(getNormalizedExternalID(hash)).toEqual(hash);
      expect(getNormalizedPII(hash, PII_DATA_TYPE.EXTERNAL_ID)).toEqual(hash);
    });

    it('should show different handling for null/invalid inputs due to PII interface validation', () => {
      const invalidInputs = [null, undefined];

      invalidInputs.forEach((input) => {
        // Direct function returns null for null/undefined
        expect(getNormalizedExternalID(input)).toBeNull();

        // PII interface also returns null for invalid inputs (validates input first)
        expect(getNormalizedPII(input, PII_DATA_TYPE.EXTERNAL_ID)).toBeNull();
      });
    });

    it('should show different handling for non-string inputs', () => {
      const nonStringInputs = [123, {}, [], true, false];

      nonStringInputs.forEach((input) => {
        // Direct function converts non-strings to strings and processes them
        const directResult = getNormalizedExternalID(input);
        expect(typeof directResult).toBe('string');

        // PII interface returns null for non-string inputs (validates input first)
        expect(getNormalizedPII(input, PII_DATA_TYPE.EXTERNAL_ID)).toBeNull();
      });
    });

    it('should show different handling for whitespace-only strings', () => {
      const whitespaceInputs = ['   ', '\t\n\r'];

      whitespaceInputs.forEach((input) => {
        // Direct function processes whitespace (strips it to empty string)
        const directResult = getNormalizedExternalID(input);
        expect(directResult).toEqual('');

        // PII interface returns empty string for whitespace-only strings for EXTERNAL_ID type
        expect(getNormalizedPII(input, PII_DATA_TYPE.EXTERNAL_ID)).toEqual('');
      });

      // Handle empty string separately since PII interface validates it differently
      expect(getNormalizedExternalID('')).toEqual('');
      expect(getNormalizedPII('', PII_DATA_TYPE.EXTERNAL_ID)).toBeNull();
    });
  });
});
