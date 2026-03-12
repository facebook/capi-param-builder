/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getNormalizedPII } from '../utils/piiUtil/piiUtil.js';
import { getNormalizedState } from '../utils/piiUtil/stringUtil.js';
import { PII_DATA_TYPE } from '../model/constants.js';

describe('getNormalizedState', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedState(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedState(undefined)).toBeNull();
    });

    it('should convert non-string inputs to strings and normalize', () => {
      const testCases = [
        {
          input: 123,
          expected: null, // Starts with number, fails regex test '^[a-z]+'
        },
        {
          input: true,
          expected: 'tr', // 'true' becomes 'tr' after truncate, passes regex test
        },
        {
          input: false,
          expected: 'fa', // 'false' becomes 'fa' after truncate, passes regex test
        },
        {
          input: {},
          expected: 'ob', // '[object Object]' becomes 'objectobject', truncated to 'ob'
        },
        {
          input: [],
          expected: null, // Empty array toString is empty string, fails regex test
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should handle empty string input', () => {
      expect(getNormalizedState('')).toBeNull(); // Empty string fails regex test '^[a-z]+'
    });

    it('should handle whitespace-only input', () => {
      expect(getNormalizedState('   ')).toBeNull(); // Whitespace stripped to empty, fails regex test
      expect(getNormalizedState('\t\n\r')).toBeNull(); // Whitespace stripped to empty, fails regex test
    });
  });

  describe('State normalization', () => {
    it('should normalize example data', () => {
      const testCases = [
        {
          input: '    California.   ',
          expected: 'ca',
        },
        {
          input: 'CA',
          expected: 'ca',
        },
        {
          input: '  TE',
          expected: 'te',
        },
        {
          input: '      C/a/lifo,rnia.  ',
          expected: 'ca',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should normalize US state names to abbreviations', () => {
      const testCases = [
        {
          input: 'Alabama',
          expected: 'al',
        },
        {
          input: 'Alaska',
          expected: 'ak',
        },
        {
          input: 'Arizona',
          expected: 'az',
        },
        {
          input: 'Arkansas',
          expected: 'ar',
        },
        {
          input: 'California',
          expected: 'ca',
        },
        {
          input: 'Colorado',
          expected: 'co',
        },
        {
          input: 'Connecticut',
          expected: 'ct',
        },
        {
          input: 'Delaware',
          expected: 'de',
        },
        {
          input: 'Florida',
          expected: 'fl',
        },
        {
          input: 'Georgia',
          expected: 'ga',
        },
        {
          input: 'Hawaii',
          expected: 'hi',
        },
        {
          input: 'Idaho',
          expected: 'id',
        },
        {
          input: 'Illinois',
          expected: 'il',
        },
        {
          input: 'Indiana',
          expected: 'in',
        },
        {
          input: 'Iowa',
          expected: 'ia',
        },
        {
          input: 'Kansas',
          expected: 'ks',
        },
        {
          input: 'Kentucky',
          expected: 'ky',
        },
        {
          input: 'Louisiana',
          expected: 'la',
        },
        {
          input: 'Maine',
          expected: 'me',
        },
        {
          input: 'Maryland',
          expected: 'md',
        },
        {
          input: 'Massachusetts',
          expected: 'ma',
        },
        {
          input: 'Michigan',
          expected: 'mi',
        },
        {
          input: 'Minnesota',
          expected: 'mn',
        },
        {
          input: 'Mississippi',
          expected: 'ms',
        },
        {
          input: 'Missouri',
          expected: 'mo',
        },
        {
          input: 'Montana',
          expected: 'mt',
        },
        {
          input: 'Nebraska',
          expected: 'ne',
        },
        {
          input: 'Nevada',
          expected: 'nv',
        },
        {
          input: 'New Hampshire',
          expected: 'nh',
        },
        {
          input: 'New Jersey',
          expected: 'nj',
        },
        {
          input: 'New Mexico',
          expected: 'nm',
        },
        {
          input: 'New York',
          expected: 'ny',
        },
        {
          input: 'North Carolina',
          expected: 'nc',
        },
        {
          input: 'North Dakota',
          expected: 'nd',
        },
        {
          input: 'Ohio',
          expected: 'oh',
        },
        {
          input: 'Oklahoma',
          expected: 'ok',
        },
        {
          input: 'Oregon',
          expected: 'or',
        },
        {
          input: 'Pennsylvania',
          expected: 'pa',
        },
        {
          input: 'Rhode Island',
          expected: 'ri',
        },
        {
          input: 'South Carolina',
          expected: 'sc',
        },
        {
          input: 'South Dakota',
          expected: 'sd',
        },
        {
          input: 'Tennessee',
          expected: 'tn',
        },
        {
          input: 'Texas',
          expected: 'tx',
        },
        {
          input: 'Utah',
          expected: 'ut',
        },
        {
          input: 'Vermont',
          expected: 'vt',
        },
        {
          input: 'Virginia',
          expected: 'va',
        },
        {
          input: 'Washington',
          expected: 'wa',
        },
        {
          input: 'West Virginia',
          expected: 'wv',
        },
        {
          input: 'Wisconsin',
          expected: 'wi',
        },
        {
          input: 'Wyoming',
          expected: 'wy',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should normalize Canadian province names to abbreviations', () => {
      const testCases = [
        {
          input: 'Ontario',
          expected: 'on',
        },
        {
          input: 'Quebec',
          expected: 'qc',
        },
        {
          input: 'British Columbia',
          expected: 'bc',
        },
        {
          input: 'Alberta',
          expected: 'ab',
        },
        {
          input: 'Saskatchewan',
          expected: 'sk',
        },
        {
          input: 'Manitoba',
          expected: 'mb',
        },
        {
          input: 'Nova Scotia',
          expected: 'ns',
        },
        {
          input: 'New Brunswick',
          expected: 'nb',
        },
        {
          input: 'Prince Edward Island',
          expected: 'pe',
        },
        {
          input: 'Newfoundland and Labrador',
          expected: 'nl',
        },
        {
          input: 'Yukon',
          expected: 'yt',
        },
        {
          input: 'Northwest Territories',
          expected: 'nt',
        },
        {
          input: 'Nunavut',
          expected: 'nu',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should handle existing abbreviations', () => {
      const testCases = [
        {
          input: 'CA',
          expected: 'ca',
        },
        {
          input: 'NY',
          expected: 'ny',
        },
        {
          input: 'TX',
          expected: 'tx',
        },
        {
          input: 'FL',
          expected: 'fl',
        },
        {
          input: 'ON',
          expected: 'on',
        },
        {
          input: 'BC',
          expected: 'bc',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should handle mixed case state names', () => {
      const testCases = [
        {
          input: 'CaLiFoRnIa',
          expected: 'ca',
        },
        {
          input: 'nEw YoRk',
          expected: 'ny',
        },
        {
          input: 'tExAs',
          expected: 'tx',
        },
        {
          input: 'ca',
          expected: 'ca',
        },
        {
          input: 'CA',
          expected: 'ca',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should handle states with leading/trailing whitespace', () => {
      const testCases = [
        {
          input: '  California  ',
          expected: 'ca',
        },
        {
          input: '\tNew York\n',
          expected: 'ny',
        },
        {
          input: ' Texas ',
          expected: 'tx',
        },
        {
          input: '\r\nFlorida\t',
          expected: 'fl',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should handle states with punctuation and special characters', () => {
      const testCases = [
        {
          input: 'California!',
          expected: 'ca',
        },
        {
          input: 'New-York',
          expected: 'ny',
        },
        {
          input: 'Texas.',
          expected: 'tx',
        },
        {
          input: 'Florida@#$',
          expected: 'fl',
        },
        {
          input: 'CA-1',
          expected: 'ca',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should handle partial matches within longer strings', () => {
      const testCases = [
        {
          input: 'CaliforniaState',
          expected: 'ca',
        },
        {
          input: 'NewYorkCity',
          expected: 'ny',
        },
        {
          input: 'TexasCounty',
          expected: 'tx',
        },
        {
          input: 'FloridaKeys',
          expected: 'fl',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should truncate to 2 characters for non-mapped states', () => {
      const testCases = [
        {
          input: 'Unknown',
          expected: 'un',
        },
        {
          input: 'InvalidState',
          expected: 'in',
        },
        {
          input: 'TestState',
          expected: 'te',
        },
        {
          input: 'AB',
          expected: 'ab', // Already 2 chars
        },
        {
          input: 'X',
          expected: 'x', // Single char returned as-is
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should handle states that contain known state names even with numbers', () => {
      const testCases = [
        {
          input: '1California',
          expected: 'ca', // Finds "california" within the string
        },
        {
          input: '2ndState',
          expected: 'nd', // Finds "nd" (North Dakota abbreviation) within the string
        },
        {
          input: '3rdPlace',
          expected: 'rd', // Finds "rd" (abbreviation pattern)
        },
        {
          input: '99Problems',
          expected: 'pr', // No state match, truncates to first 2 characters after processing
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should handle single character inputs', () => {
      const testCases = [
        {
          input: 'A',
          expected: 'a',
        },
        {
          input: 'B',
          expected: 'b',
        },
        {
          input: 'C',
          expected: 'c',
        },
        {
          input: '1',
          expected: null, // Starts with number, fails regex test
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should return null for empty input after stripping', () => {
      const testCases = [
        '123', // All numbers, stripped to empty
        '!@#$%', // All punctuation, stripped to empty
        '   ', // All whitespace, stripped to empty
        '', // Already empty
      ];

      testCases.forEach((input) => {
        expect(getNormalizedState(input)).toBeNull();
      });
    });
  });

  describe('Hashed state handling', () => {
    it('should return SHA-256 hash as-is when it looks like a hash', () => {
      const validHashes = [
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 'hello' hashed
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty string hashed
        '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29', // 'hello' in different case
        'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890', // uppercase hash
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // mixed case hash
      ];

      validHashes.forEach((hash) => {
        const result = getNormalizedState(hash);
        expect(result).toEqual(hash);
      });
    });

    it('should process invalid hash-like strings as regular state names', () => {
      const invalidHashes = [
        {
          input:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
          expected: 'aa', // Numbers stripped, truncated to first 2 alphabetic chars
        },
        {
          input:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars
          expected: 'aa', // Numbers stripped, truncated to first 2 alphabetic chars
        },
        {
          input:
            'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'g'
          expected: 'ga', // Finds "georgia" substring and returns abbreviation
        },
        {
          input:
            'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE!', // invalid char '!'
          expected: 'aa', // ! stripped, numbers stripped, lowercased and truncated to first 2 alphabetic chars
        },
        {
          input: '123', // too short for hash, starts with number
          expected: null, // Fails regex test '^[a-z]+'
        },
      ];

      invalidHashes.forEach(({ input, expected }) => {
        const result = getNormalizedState(input);
        expect(result).toEqual(expected);
      });
    });

    it('should handle mixed case hashed states', () => {
      const mixedCaseHash =
        'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
      const result = getNormalizedState(mixedCaseHash);
      expect(result).toEqual(mixedCaseHash);
    });

    it('should handle lowercase hashed states', () => {
      const lowercaseHash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      const result = getNormalizedState(lowercaseHash);
      expect(result).toEqual(lowercaseHash);
    });
  });

  describe('Edge cases', () => {
    it('should handle numeric strings starting with numbers', () => {
      const testCases = [
        {
          input: '123',
          expected: null, // All numbers, fails regex test
        },
        {
          input: '0',
          expected: null, // Single number, fails regex test
        },
        {
          input: '456State',
          expected: 'st', // Finds 'st' after processing numbers
        },
        {
          input: '789Province',
          expected: 'pr', // Finds 'pr' after processing numbers
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should handle extreme cases', () => {
      const testCases = [
        {
          input: String(Number.MAX_SAFE_INTEGER),
          expected: null, // Starts with number, fails regex test
        },
        {
          input: 'California'.repeat(100), // Very long string
          expected: 'ca', // Should still find California mapping
        },
        {
          input: 'A'.repeat(1000), // Very long string
          expected: 'aa', // Truncated to 2 characters
        },
        {
          input: '!@#$%^&*()_+-=[]{}|;:,.<>?',
          expected: null, // All punctuation stripped to empty, fails regex test
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });

    it('should handle Unicode and international characters', () => {
      const testCases = [
        {
          input: 'Califórnia', // With accent
          expected: 'ca', // Accent stripped, still matches California
        },
        {
          input: 'Québec', // French province with accent
          expected: 'qu', // Accent stripped, becomes 'Qubec', truncated to 'qu'
        },
        {
          input: 'Москва', // Russian characters
          expected: null, // Non-Latin characters stripped to empty
        },
        {
          input: '北京', // Chinese characters
          expected: null, // Non-Latin characters stripped to empty
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
      });
    });
  });
});

describe('getNormalizedPII with STATE', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedPII(null, PII_DATA_TYPE.STATE)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedPII(undefined, PII_DATA_TYPE.STATE)).toBeNull();
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false];

      nonStringValues.forEach((value) => {
        expect(getNormalizedPII(value, PII_DATA_TYPE.STATE)).toBeNull();
      });
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedPII('', PII_DATA_TYPE.STATE)).toBeNull();
    });

    it('should return null for whitespace-only input', () => {
      expect(getNormalizedPII('   ', PII_DATA_TYPE.STATE)).toBeNull();
      expect(getNormalizedPII('\t\n\r', PII_DATA_TYPE.STATE)).toBeNull();
    });

    it('should return null for null data type', () => {
      expect(getNormalizedPII('California', null)).toBeNull();
    });

    it('should return null for undefined data type', () => {
      expect(getNormalizedPII('California', undefined)).toBeNull();
    });

    it('should return null for invalid data type', () => {
      expect(getNormalizedPII('California', 'invalid_type')).toBeNull();
    });
  });

  describe('State normalization', () => {
    it('should normalize state names using getNormalizedState', () => {
      const testCases = [
        {
          input: 'California',
          expected: 'ca',
        },
        {
          input: 'NEW YORK',
          expected: 'ny',
        },
        {
          input: '  Texas  ',
          expected: 'tx',
        },
        {
          input: 'Florida',
          expected: 'fl',
        },
        {
          input: 'Ontario',
          expected: 'on',
        },
        {
          input: 'British Columbia',
          expected: 'bc',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.STATE)).toEqual(expected);
      });
    });

    it('should handle states containing numbers differently than pure number starts', () => {
      const testCases = [
        {
          input: '1stState',
          expected: 'st', // After processing, truncates to 'st'
        },
        {
          input: '2ndProvince',
          expected: 'nd', // Finds 'nd' (North Dakota abbreviation) within the string
        },
        {
          input: '42ndState',
          expected: 'nd', // Finds 'nd' (North Dakota abbreviation) within the string
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.STATE)).toEqual(expected);
      });
    });

    it('should handle existing abbreviations', () => {
      const testCases = [
        {
          input: 'CA',
          expected: 'ca',
        },
        {
          input: 'NY',
          expected: 'ny',
        },
        {
          input: 'TX',
          expected: 'tx',
        },
        {
          input: 'ON',
          expected: 'on',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.STATE)).toEqual(expected);
      });
    });

    it('should handle hashed state names', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      expect(getNormalizedPII(hash, PII_DATA_TYPE.STATE)).toEqual(hash);
    });
  });

  describe('Other PII data types', () => {
    it('should return null for invalid email when using EMAIL data type', () => {
      expect(getNormalizedPII('California', PII_DATA_TYPE.EMAIL)).toBeNull();
      expect(getNormalizedPII('New York', PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return normalized phone for state when using PHONE data type', () => {
      expect(getNormalizedPII('California', PII_DATA_TYPE.PHONE)).toEqual('');
      expect(getNormalizedPII('State123', PII_DATA_TYPE.PHONE)).toEqual('123');
      expect(getNormalizedPII('123-456-7890', PII_DATA_TYPE.PHONE)).toEqual(
        '1234567890'
      );
    });

    it('should return normalized DOB for state when using DATE_OF_BIRTH data type', () => {
      expect(
        getNormalizedPII('California', PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toBeNull(); // Invalid date
      expect(
        getNormalizedPII('New York', PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toBeNull(); // Invalid date
      expect(
        getNormalizedPII('12-31-1990', PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toEqual('19901231');
    });

    it('should return normalized gender for state when using GENDER data type', () => {
      expect(getNormalizedPII('male', PII_DATA_TYPE.GENDER)).toEqual('m');
      expect(getNormalizedPII('female', PII_DATA_TYPE.GENDER)).toEqual('f');
      expect(getNormalizedPII('California', PII_DATA_TYPE.GENDER)).toBeNull(); // Invalid gender term
    });

    it('should return normalized name for state when using NAME data types', () => {
      expect(getNormalizedPII('California', PII_DATA_TYPE.FIRST_NAME)).toEqual(
        'california'
      );
      expect(getNormalizedPII('New York', PII_DATA_TYPE.LAST_NAME)).toEqual(
        'newyork'
      );
      expect(getNormalizedPII('Texas', PII_DATA_TYPE.FIRST_NAME)).toEqual(
        'texas'
      );
    });

    it('should return normalized city for state when using CITY data type', () => {
      expect(getNormalizedPII('California', PII_DATA_TYPE.CITY)).toEqual(
        'california'
      );
      expect(getNormalizedPII('New York', PII_DATA_TYPE.CITY)).toEqual(
        'newyork'
      );
      expect(getNormalizedPII('123California', PII_DATA_TYPE.CITY)).toBeNull(); // Starts with number
    });

    it('should return null for truly unsupported data types', () => {
      const unsupportedTypes = ['invalid_type', 'unknown', 'fake_type'];

      unsupportedTypes.forEach((type) => {
        expect(getNormalizedPII('California', type)).toBeNull();
      });
    });
  });

  describe('Comparison with direct getNormalizedState', () => {
    it('should show both functions behave the same way for valid states', () => {
      const testCases = [
        {
          input: 'California',
          expected: 'ca',
        },
        {
          input: '  New York  ',
          expected: 'ny',
        },
        {
          input: 'Texas',
          expected: 'tx',
        },
        {
          input: 'Ontario',
          expected: 'on',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedState(input)).toEqual(expected);
        expect(getNormalizedPII(input, PII_DATA_TYPE.STATE)).toEqual(expected);
      });
    });

    it('should show both handle invalid states the same way', () => {
      const testCases = [
        {
          input: '1stState',
          expected: 'st', // Finds 'st' after processing
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
        expect(getNormalizedState(input)).toEqual(expected);
        expect(getNormalizedPII(input, PII_DATA_TYPE.STATE)).toEqual(expected);
      });
    });

    it('should show both handle hashes the same way', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

      expect(getNormalizedState(hash)).toEqual(hash);
      expect(getNormalizedPII(hash, PII_DATA_TYPE.STATE)).toEqual(hash);
    });

    it('should show different handling for null/invalid inputs due to PII interface validation', () => {
      const invalidInputs = [null, undefined];

      invalidInputs.forEach((input) => {
        // Direct function returns null for null/undefined
        expect(getNormalizedState(input)).toBeNull();

        // PII interface also returns null for invalid inputs (validates input first)
        expect(getNormalizedPII(input, PII_DATA_TYPE.STATE)).toBeNull();
      });
    });

    it('should show different handling for non-string inputs', () => {
      const nonStringInputs = [123, {}, [], true, false];

      nonStringInputs.forEach((input) => {
        // Direct function converts non-strings to strings and processes them
        const directResult = getNormalizedState(input);
        expect(
          [null, 'string'].includes(typeof directResult) ||
            directResult === null
        ).toBe(true);

        // PII interface returns null for non-string inputs (validates input first)
        expect(getNormalizedPII(input, PII_DATA_TYPE.STATE)).toBeNull();
      });
    });

    it('should show different handling for whitespace-only strings', () => {
      const whitespaceInputs = ['   ', '\t\n\r'];

      whitespaceInputs.forEach((input) => {
        // Direct function processes whitespace (strips it to empty, then fails regex test)
        const directResult = getNormalizedState(input);
        expect(directResult).toBeNull();

        // PII interface also returns null (validates input first, but gets same result)
        expect(getNormalizedPII(input, PII_DATA_TYPE.STATE)).toBeNull();
      });

      // Handle empty string separately since PII interface validates it differently
      expect(getNormalizedState('')).toBeNull();
      expect(getNormalizedPII('', PII_DATA_TYPE.STATE)).toBeNull();
    });
  });
});
