/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getNormalizedPII } from '../utils/piiUtil/piiUtil.js';
import { PII_DATA_TYPE } from '../model/constants.js';

describe('getNormalizedPII', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedPII(null, PII_DATA_TYPE.PHONE)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedPII(undefined, PII_DATA_TYPE.PHONE)).toBeNull();
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false];

      nonStringValues.forEach((value) => {
        expect(getNormalizedPII(value, PII_DATA_TYPE.PHONE)).toBeNull();
      });
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedPII('', PII_DATA_TYPE.PHONE)).toBeNull();
    });

    it('should return empty string for whitespace-only input', () => {
      expect(getNormalizedPII('   ', PII_DATA_TYPE.PHONE)).toEqual('');
      expect(getNormalizedPII('\t\n\r', PII_DATA_TYPE.PHONE)).toEqual('');
    });

    it('should return null for null data type', () => {
      expect(getNormalizedPII('+1-555-123-4567', null)).toBeNull();
    });

    it('should return null for undefined data type', () => {
      expect(getNormalizedPII('+1-555-123-4567', undefined)).toBeNull();
    });

    it('should return null for invalid data type', () => {
      expect(getNormalizedPII('+1-555-123-4567', 'invalid_type')).toBeNull();
    });
  });

  describe('Phone normalization', () => {
    it('should normalize basic US phone numbers', () => {
      const testCases = [
        {
          input: '1234567890',
          expected: '1234567890',
        },
        {
          input: '+1-555-123-4567',
          expected: '15551234567',
        },
        {
          input: '(555) 123-4567',
          expected: '5551234567',
        },
        {
          input: '555.123.4567',
          expected: '5551234567',
        },
        {
          input: '555 123 4567',
          expected: '5551234567',
        },
        {
          input: '+1 (555) 123-4567',
          expected: '15551234567',
        },
        {
          input: '1-555-123-4567',
          expected: '15551234567',
        },
        {
          input:
            '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d',
          expected:
            '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d',
        },
        {
          input: '+1 (616) 954-78 88',
          expected: '16169547888',
        },
        {
          input: '1(650)123-4567',
          expected: '16501234567',
        },
        {
          input: '+001 (616) 954-78 88',
          expected: '16169547888',
        },
        {
          input: '01(650)123-4567',
          expected: '16501234567',
        },
        {
          input: '4792813113',
          expected: '4792813113',
        },
        {
          input: '3227352263',
          expected: '3227352263',
        },
        {
          input:
            "alreadyHasPhoneCode: false; countryCode: 'US'; phoneCode: '1'; phoneNumber: '(650)123-4567'",
          expected: '16501234567',
        },
        {
          input:
            "alreadyHasPhoneCode: false; phoneCode: '+86'; phoneNumber: '12345678'",
          expected: '8612345678',
        },
        {
          input: "alreadyHasPhoneCode: true; phoneNumber: '322-735-2263'",
          expected: '3227352263',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.PHONE)).toEqual(expected);
      });
    });

    it('should normalize international phone numbers', () => {
      const testCases = [
        {
          input: '+44 20 7946 0958',
          expected: '442079460958',
        },
        {
          input: '+33 1 42 86 83 26',
          expected: '33142868326',
        },
        {
          input: '+81-3-5843-2301',
          expected: '81358432301',
        },
        {
          input: '+61 2 9374 4000',
          expected: '61293744000',
        },
        {
          input: '+49 30 12345678',
          expected: '493012345678',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.PHONE)).toEqual(expected);
      });
    });

    it('should remove leading zeros', () => {
      const testCases = [
        {
          input: '01234567890',
          expected: '1234567890',
        },
        {
          input: '0012345678',
          expected: '12345678',
        },
        {
          input: '000555123456',
          expected: '555123456',
        },
        {
          input: '0000',
          expected: '',
        },
        {
          input: '00001',
          expected: '1',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.PHONE)).toEqual(expected);
      });
    });

    it('should handle phone numbers with various separators', () => {
      const testCases = [
        {
          input: '555-123-4567',
          expected: '5551234567',
        },
        {
          input: '555.123.4567',
          expected: '5551234567',
        },
        {
          input: '555 123 4567',
          expected: '5551234567',
        },
        {
          input: '555/123/4567',
          expected: '5551234567',
        },
        {
          input: '555_123_4567',
          expected: '5551234567',
        },
        {
          input: '555|123|4567',
          expected: '5551234567',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.PHONE)).toEqual(expected);
      });
    });

    it('should handle phone numbers with parentheses and brackets', () => {
      const testCases = [
        {
          input: '(555) 123-4567',
          expected: '5551234567',
        },
        {
          input: '(555)123-4567',
          expected: '5551234567',
        },
        {
          input: '[555] 123-4567',
          expected: '5551234567',
        },
        {
          input: '{555} 123-4567',
          expected: '5551234567',
        },
        {
          input: '+1 (555) 123-4567',
          expected: '15551234567',
        },
        {
          input: '1-(555)-123-4567',
          expected: '15551234567',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.PHONE)).toEqual(expected);
      });
    });

    it('should handle phone numbers with special characters', () => {
      const testCases = [
        {
          input: '+1-555-123-4567 ext. 123',
          expected: '15551234567123',
        },
        {
          input: '555-123-4567#123',
          expected: '5551234567123',
        },
        {
          input: '555*123*4567',
          expected: '5551234567',
        },
        {
          input: '555@123@4567',
          expected: '5551234567',
        },
        {
          input: '555$123$4567',
          expected: '5551234567',
        },
        {
          input: '555%123%4567',
          expected: '5551234567',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.PHONE)).toEqual(expected);
      });
    });

    it('should handle phone numbers with letters (T9 format)', () => {
      const testCases = [
        {
          input: '1-800-FLOWERS',
          expected: '1800',
        },
        {
          input: '1-800-GO-FEDEX',
          expected: '1800',
        },
        {
          input: 'CALL-NOW-555',
          expected: '555',
        },
        {
          input: '555-HELP-NOW',
          expected: '555',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.PHONE)).toEqual(expected);
      });
    });

    it('should handle very long phone numbers', () => {
      const longPhone = '+1-555-123-4567-890-123-456-789';
      const result = getNormalizedPII(longPhone, PII_DATA_TYPE.PHONE);
      expect(result).toEqual('15551234567890123456789');
    });

    it('should handle short phone numbers', () => {
      const testCases = [
        {
          input: '911',
          expected: '911',
        },
        {
          input: '411',
          expected: '411',
        },
        {
          input: '123',
          expected: '123',
        },
        {
          input: '1',
          expected: '1',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.PHONE)).toEqual(expected);
      });
    });

    it('should return empty string for all non-numeric characters', () => {
      const testCases = [
        'abc',
        'HELP',
        '---',
        '...',
        '+++',
        '()',
        '[]',
        '{}',
        'call-me',
        'phone',
      ];

      testCases.forEach((input) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.PHONE)).toEqual('');
      });
    });

    it('should handle mixed numeric and non-numeric strings', () => {
      const testCases = [
        {
          input: 'Phone: 555-123-4567',
          expected: '5551234567',
        },
        {
          input: 'Call me at +1 (555) 123-4567 today!',
          expected: '15551234567',
        },
        {
          input: 'My number is 555.123.4567.',
          expected: '5551234567',
        },
        {
          input: 'Tel: 555 123 4567',
          expected: '5551234567',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.PHONE)).toEqual(expected);
      });
    });
  });

  describe('Hashed phone handling', () => {
    it('should return SHA-256 hash as-is when it looks like a hash', () => {
      const validHashes = [
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 'hello' hashed
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty string hashed
        '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29', // 'hello' in different case
        'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890', // uppercase hash
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // mixed case hash
      ];

      validHashes.forEach((hash) => {
        const result = getNormalizedPII(hash, PII_DATA_TYPE.PHONE);
        expect(result).toEqual(hash);
      });
    });

    it('should process invalid hash-like strings as regular phone numbers', () => {
      const invalidHashes = [
        {
          input:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
          expected: '6654592042294174867480413107998867727',
        },
        {
          input:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars
          expected: '665459204229417486748041310799886772733',
        },
        {
          input:
            'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'g'
          expected: '66545920422941748674804131079988677273',
        },
        {
          input:
            'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE!', // invalid char '!'
          expected: '6654592042294174867480413107998867727',
        },
        {
          input: '123', // too short
          expected: '123',
        },
      ];

      invalidHashes.forEach(({ input, expected }) => {
        const result = getNormalizedPII(input, PII_DATA_TYPE.PHONE);
        expect(result).toEqual(expected);
      });
    });

    it('should handle mixed case hashed phone numbers', () => {
      const mixedCaseHash =
        'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
      const result = getNormalizedPII(mixedCaseHash, PII_DATA_TYPE.PHONE);
      expect(result).toEqual(mixedCaseHash);
    });

    it('should handle lowercase hashed phone numbers', () => {
      const lowercaseHash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      const result = getNormalizedPII(lowercaseHash, PII_DATA_TYPE.PHONE);
      expect(result).toEqual(lowercaseHash);
    });
  });

  describe('Other PII data types', () => {
    it('should return null for invalid email when using EMAIL data type', () => {
      expect(
        getNormalizedPII('+1-555-123-4567', PII_DATA_TYPE.EMAIL)
      ).toBeNull();
      expect(
        getNormalizedPII('some random text', PII_DATA_TYPE.EMAIL)
      ).toBeNull();
    });

    it('should return normalized email for valid email when using EMAIL data type', () => {
      expect(getNormalizedPII('test@example.com', PII_DATA_TYPE.EMAIL)).toEqual(
        'test@example.com'
      );
      expect(getNormalizedPII('TEST@EXAMPLE.COM', PII_DATA_TYPE.EMAIL)).toEqual(
        'test@example.com'
      );
    });

    it('should return null for truly unsupported data types', () => {
      const unsupportedTypes = ['invalid_type', 'unknown', 'fake_type'];

      unsupportedTypes.forEach((type) => {
        expect(getNormalizedPII('+1-555-123-4567', type)).toBeNull();
      });
    });
  });

  describe('Edge cases with phone normalization', () => {
    it('should handle only leading zeros', () => {
      const testCases = [
        {
          input: '0',
          expected: '',
        },
        {
          input: '00',
          expected: '',
        },
        {
          input: '000',
          expected: '',
        },
        {
          input: '0000',
          expected: '',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getNormalizedPII(input, PII_DATA_TYPE.PHONE);
        expect(result).toEqual(expected);
      });
    });

    it('should handle numbers with leading zeros followed by valid digits', () => {
      const testCases = [
        {
          input: '01',
          expected: '1',
        },
        {
          input: '001',
          expected: '1',
        },
        {
          input: '0001',
          expected: '1',
        },
        {
          input: '00555123456',
          expected: '555123456',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getNormalizedPII(input, PII_DATA_TYPE.PHONE);
        expect(result).toEqual(expected);
      });
    });

    it('should handle extreme cases', () => {
      const testCases = [
        {
          input: String(123456789),
          expected: '123456789',
        },
        {
          input: String(0),
          expected: '',
        },
        {
          input: '0'.repeat(100) + '123',
          expected: '123',
        },
        {
          input: '1'.repeat(100),
          expected: '1'.repeat(100),
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getNormalizedPII(input, PII_DATA_TYPE.PHONE);
        expect(result).toEqual(expected);
      });
    });

    it('should handle Unicode and international characters', () => {
      const testCases = [
        {
          input: '５５５１２３４５６７', // Full-width numbers
          expected: '',
        },
        {
          input: '555①②③④⑤⑥⑦',
          expected: '555',
        },
        {
          input: '555-123-4567（内線123）',
          expected: '5551234567123',
        },
        {
          input: '555＋123＋4567',
          expected: '5551234567',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getNormalizedPII(input, PII_DATA_TYPE.PHONE);
        expect(result).toEqual(expected);
      });
    });
  });
});
