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
      expect(getNormalizedPII(null, PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedPII(undefined, PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false];

      nonStringValues.forEach((value) => {
        expect(getNormalizedPII(value, PII_DATA_TYPE.EMAIL)).toBeNull();
      });
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedPII('', PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return null for whitespace-only input', () => {
      expect(getNormalizedPII('   ', PII_DATA_TYPE.EMAIL)).toBeNull();
      expect(getNormalizedPII('\t\n\r', PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return null for null data type', () => {
      expect(getNormalizedPII('test@example.com', null)).toBeNull();
    });

    it('should return null for undefined data type', () => {
      expect(getNormalizedPII('test@example.com', undefined)).toBeNull();
    });

    it('should return null for invalid data type', () => {
      expect(getNormalizedPII('test@example.com', 'invalid_type')).toBeNull();
    });
  });

  describe('Email normalization', () => {
    it('should normalize valid email addresses', () => {
      const testCases = [
        {
          input: 'test@example.com',
          expected: 'test@example.com',
        },
        {
          input: 'TEST@EXAMPLE.COM',
          expected: 'test@example.com',
        },
        {
          input: '  test@example.com  ',
          expected: 'test@example.com',
        },
        {
          input: '\tTEST@EXAMPLE.COM\n',
          expected: 'test@example.com',
        },
        {
          input: 'user.name+tag@domain.co.uk',
          expected: 'user.name+tag@domain.co.uk',
        },
        {
          input: 'user123@subdomain.example.org',
          expected: 'user123@subdomain.example.org',
        },
        {
          input: 'user_name@example.com',
          expected: 'user_name@example.com',
        },
        {
          input: 'user-name@example.com',
          expected: 'user-name@example.com',
        },
        {
          input: "test'name@example.com",
          expected: "test'name@example.com",
        },
        {
          input: '     John_Smith@gmail.com    ',
          expected: 'john_smith@gmail.com',
        },
        {
          input:
            '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d',
          expected:
            '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d',
        },
        {
          input: 'someone@domain.com',
          expected: 'someone@domain.com',
        },
        {
          input: '    SomeOne@domain.com  ',
          expected: 'someone@domain.com',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.EMAIL)).toEqual(expected);
      });
    });

    it('should return null for invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        'test@example.',
        'test @example.com',
        'test@exam ple.com',
        'plaintext',
        'test@@example.com',
        'test@.example.com',
        'test@example..com',
        '.test@example.com',
        'test.@example.com',
        'test@example.com.',
      ];

      invalidEmails.forEach((email) => {
        const result = getNormalizedPII(email, PII_DATA_TYPE.EMAIL);
        expect(result).toBeNull();
      });
    });

    it('should handle special characters in valid email addresses', () => {
      const specialCharEmails = [
        'test+tag@example.com',
        'user.name@example.com',
        'user_name@example.com',
        'user-name@example.com',
        "test'name@example.com",
        'test#name@example.com',
        'test$name@example.com',
        'test%name@example.com',
        'test&name@example.com',
        'test*name@example.com',
        'test=name@example.com',
        'test?name@example.com',
        'test^name@example.com',
        'test`name@example.com',
        'test{name@example.com',
        'test|name@example.com',
        'test}name@example.com',
        'test~name@example.com',
      ];

      specialCharEmails.forEach((email) => {
        const result = getNormalizedPII(email, PII_DATA_TYPE.EMAIL);
        expect(result).toEqual(email.toLowerCase());
      });
    });

    it('should handle international domain names', () => {
      const internationalEmails = [
        'test@example.co.uk',
        'test@example.org.au',
        'test@subdomain.example.museum',
        'test@example.travel',
      ];

      internationalEmails.forEach((email) => {
        const result = getNormalizedPII(email, PII_DATA_TYPE.EMAIL);
        expect(result).toEqual(email.toLowerCase());
      });
    });

    it('should handle very long valid email addresses', () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      const result = getNormalizedPII(longEmail, PII_DATA_TYPE.EMAIL);
      expect(result).toEqual(longEmail.toLowerCase());
    });

    it('should handle emails with leading/trailing spaces correctly', () => {
      const testCases = [
        {
          input: ' test@example.com',
          expected: 'test@example.com', // Trimmed and normalized since valid after trim
        },
        {
          input: 'test@example.com ',
          expected: 'test@example.com', // Trimmed and normalized since valid after trim
        },
        {
          input: ' test@example.com ',
          expected: 'test@example.com', // Trimmed and normalized since valid after trim
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getNormalizedPII(input, PII_DATA_TYPE.EMAIL);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('Hashed email handling', () => {
    it('should return SHA-256 hash as-is when it looks like a hash', () => {
      const validHashes = [
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 'hello' hashed
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty string hashed
        '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29', // 'hello' in different case
        'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890', // uppercase hash
      ];

      validHashes.forEach((hash) => {
        const result = getNormalizedPII(hash, PII_DATA_TYPE.EMAIL);
        expect(result).toEqual(hash);
      });
    });

    it('should process invalid hash-like strings as regular emails', () => {
      const invalidHashes = [
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars
        'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'g'
        'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE!', // invalid char '!'
        '', // empty string
        '123', // too short
      ];

      invalidHashes.forEach((hash) => {
        const result = getNormalizedPII(hash, PII_DATA_TYPE.EMAIL);
        // These will be processed as regular emails and likely return null since they're invalid
        expect(result).toBeNull();
      });
    });
  });

  describe('Other PII data types', () => {
    it('should return null for truly unsupported data types', () => {
      const unsupportedTypes = ['invalid_type', 'unknown', 'fake_type'];

      unsupportedTypes.forEach((type) => {
        expect(getNormalizedPII('test@example.com', type)).toBeNull();
      });
    });
  });

  describe('Edge cases with email validation', () => {
    it('should handle emails with consecutive dots', () => {
      const consecutiveDotEmails = [
        'test..name@example.com',
        'test@example..com',
        'test@exam..ple.com',
      ];

      consecutiveDotEmails.forEach((email) => {
        const result = getNormalizedPII(email, PII_DATA_TYPE.EMAIL);
        // These should return null since they don't match the regex
        expect(result).toBeNull();
      });
    });

    it('should handle emails with spaces in the middle', () => {
      const spacedEmails = [
        'test @example.com',
        'test@ example.com',
        'test@exam ple.com',
      ];

      spacedEmails.forEach((email) => {
        const result = getNormalizedPII(email, PII_DATA_TYPE.EMAIL);
        // These should return null since they don't match the regex after trimming
        expect(result).toBeNull();
      });
    });

    it('should handle mixed case hashed emails', () => {
      const mixedCaseHash =
        'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
      const result = getNormalizedPII(mixedCaseHash, PII_DATA_TYPE.EMAIL);
      expect(result).toEqual(mixedCaseHash);
    });

    it('should handle lowercase hashed emails', () => {
      const lowercaseHash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      const result = getNormalizedPII(lowercaseHash, PII_DATA_TYPE.EMAIL);
      expect(result).toEqual(lowercaseHash);
    });
  });
});
