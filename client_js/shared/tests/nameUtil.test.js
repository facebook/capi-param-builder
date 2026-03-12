/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getNormalizedPII } from '../utils/piiUtil/piiUtil.js';
import { getNormalizedName } from '../utils/piiUtil/stringUtil.js';
import { PII_DATA_TYPE } from '../model/constants.js';

describe('getNormalizedName', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedName(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedName(undefined)).toBeNull();
    });

    it('should convert non-string inputs to strings and normalize', () => {
      const testCases = [
        {
          input: 123,
          expected: '123', // Number converted to string, no punctuation to strip
        },
        {
          input: true,
          expected: 'true', // Boolean converted to string
        },
        {
          input: false,
          expected: 'false', // Boolean converted to string
        },
        {
          input: {},
          expected: 'objectobject', // Object toString becomes '[object Object]', brackets and spaces stripped
        },
        {
          input: [],
          expected: '', // Empty array toString is empty string
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });

    it('should handle empty string input', () => {
      expect(getNormalizedName('')).toEqual(''); // Empty string after normalization
    });

    it('should handle whitespace-only input', () => {
      expect(getNormalizedName('   ')).toEqual(''); // Whitespace stripped
      expect(getNormalizedName('\t\n\r')).toEqual(''); // Whitespace stripped
    });
  });

  describe('Name normalization', () => {
    it('should handle example data', () => {
      const testCases = [
        {
          input: 'John',
          expected: 'john',
        },
        {
          input: "    Na'than-Boile    ",
          expected: 'nathanboile',
        },
        {
          input: '정',
          expected: '정',
        },
        {
          input: 'Valéry',
          expected: 'valéry',
        },
        {
          input: 'Doe',
          expected: 'doe', // Apostrophe stripped
        },
        {
          input: '    Doe-Doe    ',
          expected: 'doedoe', // Spaces stripped
        },
        {
          input: 'Jean-Pierre',
          expected: 'jeanpierre', // Hyphen stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });

    it('should normalize basic names', () => {
      const testCases = [
        {
          input: 'John',
          expected: 'john',
        },
        {
          input: 'MARY',
          expected: 'mary',
        },
        {
          input: 'smith',
          expected: 'smith',
        },
        {
          input: 'McDonald',
          expected: 'mcdonald',
        },
        {
          input: "O'Connor",
          expected: 'oconnor', // Apostrophe stripped
        },
        {
          input: 'Van Der Berg',
          expected: 'vanderberg', // Spaces stripped
        },
        {
          input: 'Jean-Pierre',
          expected: 'jeanpierre', // Hyphen stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });

    it('should handle names with various punctuation', () => {
      const testCases = [
        {
          input: 'John.',
          expected: 'john', // Period stripped
        },
        {
          input: 'Mary,',
          expected: 'mary', // Comma stripped
        },
        {
          input: 'Dr. Smith',
          expected: 'drsmith', // Period and space stripped
        },
        {
          input: 'John Jr.',
          expected: 'johnjr', // Period and space stripped
        },
        {
          input: 'Mary-Jane',
          expected: 'maryjane', // Hyphen stripped
        },
        {
          input: "O'Reilly",
          expected: 'oreilly', // Apostrophe stripped
        },
        {
          input: 'João',
          expected: 'joão', // Accented characters preserved, lowercased
        },
        {
          input: 'José',
          expected: 'josé', // Accented characters preserved, lowercased
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });

    it('should handle names with leading/trailing whitespace', () => {
      const testCases = [
        {
          input: '  John  ',
          expected: 'john', // Whitespace stripped
        },
        {
          input: '\tMary\n',
          expected: 'mary', // Whitespace stripped
        },
        {
          input: ' Dr. Smith ',
          expected: 'drsmith', // All whitespace and punctuation stripped
        },
        {
          input: '\r\nJohn Jr.\t',
          expected: 'johnjr', // All whitespace and punctuation stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });

    it('should handle names with mixed case', () => {
      const testCases = [
        {
          input: 'JoHn',
          expected: 'john',
        },
        {
          input: 'mArY',
          expected: 'mary',
        },
        {
          input: 'SmItH',
          expected: 'smith',
        },
        {
          input: 'McDONALD',
          expected: 'mcdonald',
        },
        {
          input: 'VAN DER BERG',
          expected: 'vanderberg',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });

    it('should handle names with numbers', () => {
      const testCases = [
        {
          input: 'John2',
          expected: 'john2',
        },
        {
          input: 'Mary123',
          expected: 'mary123',
        },
        {
          input: '3rd John',
          expected: '3rdjohn', // Space stripped
        },
        {
          input: 'Agent007',
          expected: 'agent007',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });

    it('should handle names with special characters and symbols', () => {
      const testCases = [
        {
          input: 'John!',
          expected: 'john', // Exclamation mark stripped
        },
        {
          input: 'Mary@Domain',
          expected: 'marydomain', // @ symbol stripped
        },
        {
          input: 'Smith#123',
          expected: 'smith123', // # symbol stripped
        },
        {
          input: 'John$Dollar',
          expected: 'johndollar', // $ symbol stripped
        },
        {
          input: 'Mary%Percent',
          expected: 'marypercent', // % symbol stripped
        },
        {
          input: 'John&Mary',
          expected: 'johnmary', // & symbol stripped
        },
        {
          input: 'Smith*Star',
          expected: 'smithstar', // * symbol stripped
        },
        {
          input: 'John+Plus',
          expected: 'johnplus', // + symbol stripped
        },
        {
          input: 'Mary=Equal',
          expected: 'maryequal', // = symbol stripped
        },
        {
          input: 'John?Question',
          expected: 'johnquestion', // ? symbol stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });

    it('should handle names with brackets and braces', () => {
      const testCases = [
        {
          input: 'John(Junior)',
          expected: 'johnjunior', // Parentheses stripped
        },
        {
          input: 'Mary[Smith]',
          expected: 'marysmith', // Square brackets stripped
        },
        {
          input: 'John{Test}',
          expected: 'johntest', // Curly braces stripped
        },
        {
          input: '[Dr.] Smith',
          expected: 'drsmith', // Brackets and punctuation stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });

    it('should handle names with colons, semicolons, and pipes', () => {
      const testCases = [
        {
          input: 'John:Smith',
          expected: 'johnsmith', // Colon stripped
        },
        {
          input: 'Mary;Jane',
          expected: 'maryjane', // Semicolon stripped
        },
        {
          input: 'John|Smith',
          expected: 'johnsmith', // Pipe stripped
        },
        {
          input: 'Title: John Smith',
          expected: 'titlejohnsmith', // Colon and space stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(100) + ' B'.repeat(50);
      const result = getNormalizedName(longName);
      expect(result).toEqual('a'.repeat(100) + 'b'.repeat(50)); // Spaces stripped, lowercased
    });

    it('should handle names with only punctuation', () => {
      const testCases = [
        {
          input: '...',
          expected: '', // All punctuation stripped
        },
        {
          input: '!!!',
          expected: '', // All punctuation stripped
        },
        {
          input: '---',
          expected: '', // All punctuation stripped
        },
        {
          input: '(),[]{}',
          expected: '', // All punctuation stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });

    it('should handle international names', () => {
      const testCases = [
        {
          input: 'José',
          expected: 'josé',
        },
        {
          input: 'François',
          expected: 'françois',
        },
        {
          input: 'Müller',
          expected: 'müller',
        },
        {
          input: 'Søren',
          expected: 'søren',
        },
        {
          input: 'Αθήνα', // Greek
          expected: 'αθήνα',
        },
        {
          input: 'Москва', // Russian
          expected: 'москва',
        },
        {
          input: '北京', // Chinese
          expected: '北京',
        },
        {
          input: '東京', // Japanese
          expected: '東京',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });
  });

  describe('Hashed name handling', () => {
    it('should return SHA-256 hash as-is when it looks like a hash', () => {
      const validHashes = [
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 'hello' hashed
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty string hashed
        '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29', // 'hello' in different case
        'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890', // uppercase hash
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // mixed case hash
      ];

      validHashes.forEach((hash) => {
        const result = getNormalizedName(hash);
        expect(result).toEqual(hash);
      });
    });

    it('should process invalid hash-like strings as regular names', () => {
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
          input: '123', // too short for hash
          expected: '123',
        },
      ];

      invalidHashes.forEach(({ input, expected }) => {
        const result = getNormalizedName(input);
        expect(result).toEqual(expected);
      });
    });

    it('should handle mixed case hashed names', () => {
      const mixedCaseHash =
        'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
      const result = getNormalizedName(mixedCaseHash);
      expect(result).toEqual(mixedCaseHash);
    });

    it('should handle lowercase hashed names', () => {
      const lowercaseHash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      const result = getNormalizedName(lowercaseHash);
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
          expected: '456789', // Decimal point stripped
        },
        {
          input: '-123',
          expected: '123', // Minus sign stripped
        },
        {
          input: '+456',
          expected: '456', // Plus sign stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
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
          expected: '', // All punctuation stripped
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });

    it('should handle Unicode and emoji', () => {
      const testCases = [
        {
          input: 'John 😀',
          expected: 'john😀', // Space stripped, emoji preserved
        },
        {
          input: 'Mary ❤️',
          expected: 'mary❤️', // Space stripped, emoji preserved
        },
        {
          input: '🎉 Party',
          expected: '🎉party', // Space stripped, emoji preserved
        },
        {
          input: '名前', // Japanese characters
          expected: '名前',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
      });
    });
  });
});

describe('getNormalizedPII with FIRST_NAME', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedPII(null, PII_DATA_TYPE.FIRST_NAME)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedPII(undefined, PII_DATA_TYPE.FIRST_NAME)).toBeNull();
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false];

      nonStringValues.forEach((value) => {
        expect(getNormalizedPII(value, PII_DATA_TYPE.FIRST_NAME)).toBeNull();
      });
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedPII('', PII_DATA_TYPE.FIRST_NAME)).toBeNull();
    });

    it('should return empty string for whitespace-only input', () => {
      expect(getNormalizedPII('   ', PII_DATA_TYPE.FIRST_NAME)).toEqual('');
      expect(getNormalizedPII('\t\n\r', PII_DATA_TYPE.FIRST_NAME)).toEqual('');
    });

    it('should return null for null data type', () => {
      expect(getNormalizedPII('John', null)).toBeNull();
    });

    it('should return null for undefined data type', () => {
      expect(getNormalizedPII('John', undefined)).toBeNull();
    });

    it('should return null for invalid data type', () => {
      expect(getNormalizedPII('John', 'invalid_type')).toBeNull();
    });
  });

  describe('First name normalization', () => {
    it('should normalize first names using getNormalizedName', () => {
      const testCases = [
        {
          input: 'John',
          expected: 'john',
        },
        {
          input: 'MARY',
          expected: 'mary',
        },
        {
          input: '  Dr. Smith  ',
          expected: 'drsmith',
        },
        {
          input: "O'Connor",
          expected: 'oconnor',
        },
        {
          input: 'Jean-Pierre',
          expected: 'jeanpierre',
        },
        {
          input: 'José',
          expected: 'josé',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.FIRST_NAME)).toEqual(
          expected
        );
      });
    });

    it('should handle hashed first names', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      expect(getNormalizedPII(hash, PII_DATA_TYPE.FIRST_NAME)).toEqual(hash);
    });

    it('should handle whitespace-only first names', () => {
      // PII interface passes whitespace through to getNormalizedName which strips it to empty string
      expect(getNormalizedPII('   ', PII_DATA_TYPE.FIRST_NAME)).toEqual('');
      expect(getNormalizedPII('\t\n\r', PII_DATA_TYPE.FIRST_NAME)).toEqual('');
    });
  });

  describe('Other PII data types', () => {
    it('should return null for invalid email when using EMAIL data type', () => {
      expect(getNormalizedPII('John', PII_DATA_TYPE.EMAIL)).toBeNull();
      expect(getNormalizedPII('Mary', PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return normalized phone for name when using PHONE data type', () => {
      expect(getNormalizedPII('John', PII_DATA_TYPE.PHONE)).toEqual('');
      expect(getNormalizedPII('Mary123', PII_DATA_TYPE.PHONE)).toEqual('123');
      expect(getNormalizedPII('123-456-7890', PII_DATA_TYPE.PHONE)).toEqual(
        '1234567890'
      );
    });

    it('should return normalized DOB for name when using DATE_OF_BIRTH data type', () => {
      expect(getNormalizedPII('John', PII_DATA_TYPE.DATE_OF_BIRTH)).toBeNull(); // Invalid date
      expect(getNormalizedPII('Mary', PII_DATA_TYPE.DATE_OF_BIRTH)).toBeNull(); // Invalid date
      expect(
        getNormalizedPII('12-31-1990', PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toEqual('19901231');
    });

    it('should return normalized gender for name when using GENDER data type', () => {
      expect(getNormalizedPII('male', PII_DATA_TYPE.GENDER)).toEqual('m');
      expect(getNormalizedPII('female', PII_DATA_TYPE.GENDER)).toEqual('f');
      expect(getNormalizedPII('John', PII_DATA_TYPE.GENDER)).toBeNull(); // Invalid gender term
    });

    it('should return null for truly unsupported data types', () => {
      const unsupportedTypes = ['invalid_type', 'unknown', 'fake_type'];

      unsupportedTypes.forEach((type) => {
        expect(getNormalizedPII('John', type)).toBeNull();
      });
    });
  });
});

describe('getNormalizedPII with LAST_NAME', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedPII(null, PII_DATA_TYPE.LAST_NAME)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedPII(undefined, PII_DATA_TYPE.LAST_NAME)).toBeNull();
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false];

      nonStringValues.forEach((value) => {
        expect(getNormalizedPII(value, PII_DATA_TYPE.LAST_NAME)).toBeNull();
      });
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedPII('', PII_DATA_TYPE.LAST_NAME)).toBeNull();
    });

    it('should return empty string for whitespace-only input', () => {
      expect(getNormalizedPII('   ', PII_DATA_TYPE.LAST_NAME)).toEqual('');
      expect(getNormalizedPII('\t\n\r', PII_DATA_TYPE.LAST_NAME)).toEqual('');
    });

    it('should return null for null data type', () => {
      expect(getNormalizedPII('Smith', null)).toBeNull();
    });

    it('should return null for undefined data type', () => {
      expect(getNormalizedPII('Smith', undefined)).toBeNull();
    });

    it('should return null for invalid data type', () => {
      expect(getNormalizedPII('Smith', 'invalid_type')).toBeNull();
    });
  });

  describe('Last name normalization', () => {
    it('should normalize last names using getNormalizedName', () => {
      const testCases = [
        {
          input: 'Smith',
          expected: 'smith',
        },
        {
          input: 'JOHNSON',
          expected: 'johnson',
        },
        {
          input: '  McDonald  ',
          expected: 'mcdonald',
        },
        {
          input: "O'Reilly",
          expected: 'oreilly',
        },
        {
          input: 'Van Der Berg',
          expected: 'vanderberg',
        },
        {
          input: 'Müller',
          expected: 'müller',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.LAST_NAME)).toEqual(
          expected
        );
      });
    });

    it('should handle hashed last names', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      expect(getNormalizedPII(hash, PII_DATA_TYPE.LAST_NAME)).toEqual(hash);
    });

    it('should handle whitespace-only last names', () => {
      // PII interface passes whitespace through to getNormalizedName which strips it to empty string
      expect(getNormalizedPII('   ', PII_DATA_TYPE.LAST_NAME)).toEqual('');
      expect(getNormalizedPII('\t\n\r', PII_DATA_TYPE.LAST_NAME)).toEqual('');
    });
  });

  describe('Comparison with direct getNormalizedName', () => {
    it('should show both functions behave the same way for valid names', () => {
      const testCases = [
        {
          input: 'Smith',
          expected: 'smith',
        },
        {
          input: '  Dr. Johnson  ',
          expected: 'drjohnson',
        },
        {
          input: "O'Connor",
          expected: 'oconnor',
        },
        {
          input: 'Van Der Berg',
          expected: 'vanderberg',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedName(input)).toEqual(expected);
        expect(getNormalizedPII(input, PII_DATA_TYPE.LAST_NAME)).toEqual(
          expected
        );
        expect(getNormalizedPII(input, PII_DATA_TYPE.FIRST_NAME)).toEqual(
          expected
        );
      });
    });

    it('should show both handle hashes the same way', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

      expect(getNormalizedName(hash)).toEqual(hash);
      expect(getNormalizedPII(hash, PII_DATA_TYPE.LAST_NAME)).toEqual(hash);
      expect(getNormalizedPII(hash, PII_DATA_TYPE.FIRST_NAME)).toEqual(hash);
    });

    it('should show different handling for null/invalid inputs due to PII interface validation', () => {
      const invalidInputs = [null, undefined];

      invalidInputs.forEach((input) => {
        // Direct function returns null for null/undefined
        expect(getNormalizedName(input)).toBeNull();

        // PII interface also returns null for invalid inputs (validates input first)
        expect(getNormalizedPII(input, PII_DATA_TYPE.LAST_NAME)).toBeNull();
        expect(getNormalizedPII(input, PII_DATA_TYPE.FIRST_NAME)).toBeNull();
      });
    });

    it('should show different handling for non-string inputs', () => {
      const nonStringInputs = [123, {}, [], true, false];

      nonStringInputs.forEach((input) => {
        // Direct function converts non-strings to strings and processes them
        const directResult = getNormalizedName(input);
        expect(typeof directResult).toBe('string');

        // PII interface returns null for non-string inputs (validates input first)
        expect(getNormalizedPII(input, PII_DATA_TYPE.LAST_NAME)).toBeNull();
        expect(getNormalizedPII(input, PII_DATA_TYPE.FIRST_NAME)).toBeNull();
      });
    });

    it('should show different handling for whitespace-only strings', () => {
      const whitespaceInputs = ['   ', '\t\n\r'];

      whitespaceInputs.forEach((input) => {
        // Direct function processes whitespace (strips it, resulting in empty string)
        const directResult = getNormalizedName(input);
        expect(directResult).toEqual('');

        // PII interface passes through to getNormalizedName (which strips to empty string)
        expect(getNormalizedPII(input, PII_DATA_TYPE.LAST_NAME)).toEqual('');
        expect(getNormalizedPII(input, PII_DATA_TYPE.FIRST_NAME)).toEqual('');
      });

      // Handle empty string separately since PII interface validates it differently
      expect(getNormalizedName('')).toEqual('');
      expect(getNormalizedPII('', PII_DATA_TYPE.LAST_NAME)).toBeNull();
      expect(getNormalizedPII('', PII_DATA_TYPE.FIRST_NAME)).toBeNull();
    });
  });
});
