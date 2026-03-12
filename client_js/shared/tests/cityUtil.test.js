/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getNormalizedPII } from '../utils/piiUtil/piiUtil.js';
import { getNormalizedCity } from '../utils/piiUtil/stringUtil.js';
import { PII_DATA_TYPE } from '../model/constants.js';

describe('getNormalizedCity', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedCity(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedCity(undefined)).toBeNull();
    });

    it('should convert non-string inputs to strings and normalize', () => {
      const testCases = [
        {
          input: 123,
          expected: null, // Starts with number, fails regex test '^[a-z]+'
        },
        {
          input: true,
          expected: 'true', // 'true' starts with 't', passes regex test
        },
        {
          input: false,
          expected: 'false', // 'false' starts with 'f', passes regex test
        },
        {
          input: {},
          expected: 'objectobject', // '[object Object]' becomes 'objectobject', starts with 'o', passes regex test
        },
        {
          input: [],
          expected: null, // Empty array toString is empty string, fails regex test
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
      });
    });

    it('should handle empty string input', () => {
      expect(getNormalizedCity('')).toBeNull(); // Empty string fails regex test '^[a-z]+'
    });

    it('should handle whitespace-only input', () => {
      expect(getNormalizedCity('   ')).toBeNull(); // Whitespace stripped to empty, fails regex test
      expect(getNormalizedCity('\t\n\r')).toBeNull(); // Whitespace stripped to empty, fails regex test
    });
  });

  describe('City normalization', () => {
    it('should normalize example data', () => {
      const testCases = [
        {
          input: 'London',
          expected: 'london',
        },
        {
          input: 'Menlo Park',
          expected: 'menlopark',
        },
        {
          input: '    Menlo-Park  ',
          expected: 'menlopark',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
      });
    });

    it('should normalize basic city names', () => {
      const testCases = [
        {
          input: 'London',
          expected: 'london',
        },
        {
          input: 'NEW YORK',
          expected: 'newyork',
        },
        {
          input: 'san francisco',
          expected: 'sanfrancisco',
        },
        {
          input: 'Los Angeles',
          expected: 'losangeles',
        },
        {
          input: 'Chicago',
          expected: 'chicago',
        },
        {
          input: 'Boston',
          expected: 'boston',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
      });
    });

    it('should handle cities with punctuation and special characters', () => {
      const testCases = [
        {
          input: 'St. Louis',
          expected: 'stlouis', // Period and space stripped
        },
        {
          input: 'St-Petersburg',
          expected: 'stpetersburg', // Hyphen stripped
        },
        {
          input: "O'Fallon",
          expected: 'ofallon', // Apostrophe stripped
        },
        {
          input: 'Washington, D.C.',
          expected: 'washingtondc', // Punctuation stripped
        },
        {
          input: 'Miami-Dade',
          expected: 'miamidade', // Hyphen stripped
        },
        {
          input: 'Fort Worth',
          expected: 'fortworth', // Space stripped
        },
        {
          input: 'Las Vegas',
          expected: 'lasvegas', // Space stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
      });
    });

    it('should handle cities with leading/trailing whitespace', () => {
      const testCases = [
        {
          input: '  London  ',
          expected: 'london', // Whitespace stripped
        },
        {
          input: '\tParis\n',
          expected: 'paris', // Whitespace stripped
        },
        {
          input: ' New York ',
          expected: 'newyork', // Whitespace and space stripped
        },
        {
          input: '\r\nChicago\t',
          expected: 'chicago', // All whitespace stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
      });
    });

    it('should handle cities with mixed case', () => {
      const testCases = [
        {
          input: 'NeW yOrK',
          expected: 'newyork',
        },
        {
          input: 'LOS aNGeLes',
          expected: 'losangeles',
        },
        {
          input: 'ChIcAgO',
          expected: 'chicago',
        },
        {
          input: 'sAn FrAnCiScO',
          expected: 'sanfrancisco',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
      });
    });

    it('should handle cities with numbers and alphanumeric characters', () => {
      const testCases = [
        {
          input: 'District9',
          expected: 'district9', // Numbers preserved, starts with letter
        },
        {
          input: 'Area51City',
          expected: 'area51city', // Numbers preserved, starts with letter
        },
        {
          input: 'Zone2B',
          expected: 'zone2b', // Numbers and letters preserved
        },
        {
          input: 'Sector7G',
          expected: 'sector7g', // Numbers and letters preserved
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
      });
    });

    it('should return null for cities starting with numbers', () => {
      const testCases = [
        '1stCity', // Starts with number, fails regex test
        '2ndDistrict', // Starts with number, fails regex test
        '3rdWard', // Starts with number, fails regex test
        '42ndStreet', // Starts with number, fails regex test
        '99thPrecinct', // Starts with number, fails regex test
      ];

      testCases.forEach((input) => {
        expect(getNormalizedCity(input)).toBeNull();
      });
    });

    it('should handle cities with various separators', () => {
      const testCases = [
        {
          input: 'San-Francisco',
          expected: 'sanfrancisco', // Hyphen stripped
        },
        {
          input: 'New_York',
          expected: 'newyork', // Underscore stripped (non-Latin alpha-numeric)
        },
        {
          input: 'Los/Angeles',
          expected: 'losangeles', // Slash stripped
        },
        {
          input: 'Fort|Worth',
          expected: 'fortworth', // Pipe stripped
        },
        {
          input: 'Miami@Beach',
          expected: 'miamibeach', // @ symbol stripped
        },
        {
          input: 'Salt#Lake#City',
          expected: 'saltlakecity', // # symbols stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
      });
    });

    it('should handle international city names with Latin characters', () => {
      const testCases = [
        {
          input: 'São Paulo',
          expected: 'sopaulo', // Diacritics stripped but Latin characters preserved
        },
        {
          input: 'México City',
          expected: 'mxicocity', // é character completely stripped
        },
        {
          input: 'Zürich',
          expected: 'zrich', // Diacritics stripped but Latin characters preserved
        },
        {
          input: 'Montréal',
          expected: 'montral', // Diacritics stripped but Latin characters preserved
        },
        {
          input: 'København',
          expected: 'kbenhavn', // Diacritics stripped but Latin characters preserved
        },
        {
          input: 'München',
          expected: 'mnchen', // Diacritics stripped but Latin characters preserved
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
      });
    });

    it('should handle cities with only Latin alphabet characters', () => {
      const testCases = [
        {
          input: 'London',
          expected: 'london',
        },
        {
          input: 'Paris',
          expected: 'paris',
        },
        {
          input: 'Berlin',
          expected: 'berlin',
        },
        {
          input: 'Madrid',
          expected: 'madrid',
        },
        {
          input: 'Rome',
          expected: 'rome',
        },
        {
          input: 'Amsterdam',
          expected: 'amsterdam',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
      });
    });

    it('should return null for cities with only non-Latin characters', () => {
      const testCases = [
        '北京', // Chinese characters
        '東京', // Japanese characters
        'Москва', // Russian characters
        'Αθήνα', // Greek characters
        'القاهرة', // Arabic characters
        'मुंबई', // Hindi characters
      ];

      testCases.forEach((input) => {
        expect(getNormalizedCity(input)).toBeNull();
      });
    });

    it('should handle very long city names', () => {
      const longCity = 'A'.repeat(100) + 'B'.repeat(50);
      const result = getNormalizedCity(longCity);
      expect(result).toEqual('a'.repeat(100) + 'b'.repeat(50)); // Lowercased
    });

    it('should return null for cities with only punctuation', () => {
      const testCases = [
        '...', // All punctuation stripped to empty
        '!!!', // All punctuation stripped to empty
        '---', // All punctuation stripped to empty
        '(),[]{}', // All punctuation stripped to empty
        '@#$%^&*()', // All punctuation stripped to empty
      ];

      testCases.forEach((input) => {
        expect(getNormalizedCity(input)).toBeNull();
      });
    });

    it('should handle mixed Latin and non-Latin characters', () => {
      const testCases = [
        {
          input: 'New York 北京',
          expected: 'newyork', // Non-Latin characters stripped, only Latin remains
        },
        {
          input: 'San Francisco サンフランシスコ',
          expected: 'sanfrancisco', // Non-Latin characters stripped
        },
        {
          input: 'London Londres',
          expected: 'londonlondres', // All Latin characters preserved
        },
        {
          input: 'Berlin Берлин',
          expected: 'berlin', // Non-Latin characters stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
      });
    });
  });

  describe('Hashed city handling', () => {
    it('should return SHA-256 hash as-is when it looks like a hash', () => {
      const validHashes = [
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 'hello' hashed
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty string hashed
        '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29', // 'hello' in different case
        'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890', // uppercase hash
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // mixed case hash
      ];

      validHashes.forEach((hash) => {
        const result = getNormalizedCity(hash);
        expect(result).toEqual(hash);
      });
    });

    it('should process invalid hash-like strings as regular city names', () => {
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
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // ! stripped
        },
        {
          input: '123', // too short for hash, starts with number
          expected: null, // Fails regex test '^[a-z]+'
        },
      ];

      invalidHashes.forEach(({ input, expected }) => {
        const result = getNormalizedCity(input);
        expect(result).toEqual(expected);
      });
    });

    it('should handle mixed case hashed cities', () => {
      const mixedCaseHash =
        'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
      const result = getNormalizedCity(mixedCaseHash);
      expect(result).toEqual(mixedCaseHash);
    });

    it('should handle lowercase hashed cities', () => {
      const lowercaseHash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      const result = getNormalizedCity(lowercaseHash);
      expect(result).toEqual(lowercaseHash);
    });
  });

  describe('Edge cases', () => {
    it('should handle numeric strings starting with numbers', () => {
      const testCases = [
        '123', // Starts with number, fails regex test
        '0', // Starts with number, fails regex test
        '456City', // Starts with number, fails regex test
        '789Town', // Starts with number, fails regex test
      ];

      testCases.forEach((input) => {
        expect(getNormalizedCity(input)).toBeNull();
      });
    });

    it('should handle strings that become empty after stripping', () => {
      const testCases = [
        '中文', // Non-Latin characters stripped to empty
        'русский', // Non-Latin characters stripped to empty
        'العربية', // Non-Latin characters stripped to empty
        '한국어', // Non-Latin characters stripped to empty
        '日本語', // Non-Latin characters stripped to empty
      ];

      testCases.forEach((input) => {
        expect(getNormalizedCity(input)).toBeNull();
      });
    });

    it('should handle extreme cases', () => {
      const testCases = [
        {
          input: String(Number.MAX_SAFE_INTEGER),
          expected: null, // Starts with number, fails regex test
        },
        {
          input: 'A'.repeat(1000), // Very long string
          expected: 'a'.repeat(1000),
        },
        {
          input: '!@#$%^&*()_+-=[]{}|;:,.<>?',
          expected: null, // All punctuation stripped to empty, fails regex test
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
      });
    });

    it('should handle Unicode and emoji', () => {
      const testCases = [
        {
          input: 'London 😀',
          expected: 'london', // Emoji stripped (non-Latin alpha-numeric)
        },
        {
          input: 'Paris ❤️',
          expected: 'paris', // Emoji stripped
        },
        {
          input: '🎉 Party City',
          expected: 'partycity', // Emoji and space stripped, starts with 'p'
        },
        {
          input: '😀City',
          expected: 'city', // Emoji stripped, starts with 'c'
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
      });
    });
  });
});

describe('getNormalizedPII with CITY', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedPII(null, PII_DATA_TYPE.CITY)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedPII(undefined, PII_DATA_TYPE.CITY)).toBeNull();
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false];

      nonStringValues.forEach((value) => {
        expect(getNormalizedPII(value, PII_DATA_TYPE.CITY)).toBeNull();
      });
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedPII('', PII_DATA_TYPE.CITY)).toBeNull();
    });

    it('should return null for whitespace-only input', () => {
      expect(getNormalizedPII('   ', PII_DATA_TYPE.CITY)).toBeNull();
      expect(getNormalizedPII('\t\n\r', PII_DATA_TYPE.CITY)).toBeNull();
    });

    it('should return null for null data type', () => {
      expect(getNormalizedPII('London', null)).toBeNull();
    });

    it('should return null for undefined data type', () => {
      expect(getNormalizedPII('London', undefined)).toBeNull();
    });

    it('should return null for invalid data type', () => {
      expect(getNormalizedPII('London', 'invalid_type')).toBeNull();
    });
  });

  describe('City normalization', () => {
    it('should normalize city names using getNormalizedCity', () => {
      const testCases = [
        {
          input: 'London',
          expected: 'london',
        },
        {
          input: 'NEW YORK',
          expected: 'newyork',
        },
        {
          input: '  San Francisco  ',
          expected: 'sanfrancisco',
        },
        {
          input: 'St. Louis',
          expected: 'stlouis',
        },
        {
          input: 'Las Vegas',
          expected: 'lasvegas',
        },
        {
          input: 'Miami-Dade',
          expected: 'miamidade',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.CITY)).toEqual(expected);
      });
    });

    it('should return null for cities starting with numbers', () => {
      const testCases = ['1stCity', '2ndDistrict', '42ndStreet'];

      testCases.forEach((input) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.CITY)).toBeNull();
      });
    });

    it('should handle cities with diacritics and non-Latin characters', () => {
      const testCases = [
        {
          input: '北京',
          expected: null, // Pure Chinese, no Latin characters
        },
        {
          input: 'Москва',
          expected: null, // Pure Russian, no Latin characters
        },
        {
          input: 'São Paulo',
          expected: 'sopaulo', // Diacritics stripped, Latin characters preserved
        },
        {
          input: 'México',
          expected: 'mxico', // é character completely stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.CITY)).toEqual(expected);
      });
    });

    it('should handle hashed city names', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      expect(getNormalizedPII(hash, PII_DATA_TYPE.CITY)).toEqual(hash);
    });
  });

  describe('Other PII data types', () => {
    it('should return null for invalid email when using EMAIL data type', () => {
      expect(getNormalizedPII('London', PII_DATA_TYPE.EMAIL)).toBeNull();
      expect(getNormalizedPII('New York', PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return normalized phone for city when using PHONE data type', () => {
      expect(getNormalizedPII('London', PII_DATA_TYPE.PHONE)).toEqual('');
      expect(getNormalizedPII('City123', PII_DATA_TYPE.PHONE)).toEqual('123');
      expect(getNormalizedPII('123-456-7890', PII_DATA_TYPE.PHONE)).toEqual(
        '1234567890'
      );
    });

    it('should return normalized DOB for city when using DATE_OF_BIRTH data type', () => {
      expect(
        getNormalizedPII('London', PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toBeNull(); // Invalid date
      expect(
        getNormalizedPII('New York', PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toBeNull(); // Invalid date
      expect(
        getNormalizedPII('12-31-1990', PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toEqual('19901231');
    });

    it('should return normalized gender for city when using GENDER data type', () => {
      expect(getNormalizedPII('male', PII_DATA_TYPE.GENDER)).toEqual('m');
      expect(getNormalizedPII('female', PII_DATA_TYPE.GENDER)).toEqual('f');
      expect(getNormalizedPII('London', PII_DATA_TYPE.GENDER)).toBeNull(); // Invalid gender term
    });

    it('should return normalized name for city when using NAME data types', () => {
      expect(getNormalizedPII('London', PII_DATA_TYPE.FIRST_NAME)).toEqual(
        'london'
      );
      expect(getNormalizedPII('New York', PII_DATA_TYPE.LAST_NAME)).toEqual(
        'newyork'
      );
      expect(getNormalizedPII("St. John's", PII_DATA_TYPE.FIRST_NAME)).toEqual(
        'stjohns'
      );
    });

    it('should return null for truly unsupported data types', () => {
      const unsupportedTypes = ['invalid_type', 'unknown', 'fake_type'];

      unsupportedTypes.forEach((type) => {
        expect(getNormalizedPII('London', type)).toBeNull();
      });
    });
  });

  describe('Comparison with direct getNormalizedCity', () => {
    it('should show both functions behave the same way for valid cities', () => {
      const testCases = [
        {
          input: 'London',
          expected: 'london',
        },
        {
          input: '  New York  ',
          expected: 'newyork',
        },
        {
          input: 'St. Louis',
          expected: 'stlouis',
        },
        {
          input: 'Las Vegas',
          expected: 'lasvegas',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
        expect(getNormalizedPII(input, PII_DATA_TYPE.CITY)).toEqual(expected);
      });
    });

    it('should show both handle invalid cities the same way', () => {
      const testCases = [
        {
          input: '1stCity',
          expected: null, // Starts with number, fails regex test
        },
        {
          input: '北京',
          expected: null, // Non-Latin characters stripped to empty
        },
        {
          input: '...',
          expected: null, // All punctuation stripped to empty
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedCity(input)).toEqual(expected);
        expect(getNormalizedPII(input, PII_DATA_TYPE.CITY)).toEqual(expected);
      });
    });

    it('should show both handle hashes the same way', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

      expect(getNormalizedCity(hash)).toEqual(hash);
      expect(getNormalizedPII(hash, PII_DATA_TYPE.CITY)).toEqual(hash);
    });

    it('should show different handling for null/invalid inputs due to PII interface validation', () => {
      const invalidInputs = [null, undefined];

      invalidInputs.forEach((input) => {
        // Direct function returns null for null/undefined
        expect(getNormalizedCity(input)).toBeNull();

        // PII interface also returns null for invalid inputs (validates input first)
        expect(getNormalizedPII(input, PII_DATA_TYPE.CITY)).toBeNull();
      });
    });

    it('should show different handling for non-string inputs', () => {
      const nonStringInputs = [123, {}, [], true, false];

      nonStringInputs.forEach((input) => {
        // Direct function converts non-strings to strings and processes them
        const directResult = getNormalizedCity(input);
        expect(
          [null, 'string'].includes(typeof directResult) ||
            directResult === null
        ).toBe(true);

        // PII interface returns null for non-string inputs (validates input first)
        expect(getNormalizedPII(input, PII_DATA_TYPE.CITY)).toBeNull();
      });
    });

    it('should show different handling for whitespace-only strings', () => {
      const whitespaceInputs = ['   ', '\t\n\r'];

      whitespaceInputs.forEach((input) => {
        // Direct function processes whitespace (strips it to empty, then fails regex test)
        const directResult = getNormalizedCity(input);
        expect(directResult).toBeNull();

        // PII interface also returns null (validates input first, but gets same result)
        expect(getNormalizedPII(input, PII_DATA_TYPE.CITY)).toBeNull();
      });

      // Handle empty string separately since PII interface validates it differently
      expect(getNormalizedCity('')).toBeNull();
      expect(getNormalizedPII('', PII_DATA_TYPE.CITY)).toBeNull();
    });
  });
});
