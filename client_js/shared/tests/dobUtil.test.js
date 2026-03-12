/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getNormalizedPII } from '../utils/piiUtil/piiUtil.js';
import { getNormalizedDOB } from '../utils/piiUtil/dobUtil.js';
import { PII_DATA_TYPE } from '../model/constants.js';

describe('getNormalizedDOB', () => {
  describe('Input validation', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should return null for null input', () => {
      expect(getNormalizedDOB(null)).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to normalize dob: ',
        expect.any(TypeError)
      );
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedDOB(undefined)).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to normalize dob: ',
        expect.any(TypeError)
      );
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false];

      nonStringValues.forEach((value) => {
        expect(getNormalizedDOB(value)).toBeNull();
      });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(nonStringValues.length);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to normalize dob: ',
        expect.any(TypeError)
      );
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedDOB('')).toBeNull();
    });

    it('should return null for whitespace-only input', () => {
      expect(getNormalizedDOB('   ')).toBeNull();
      expect(getNormalizedDOB('\t\n\r')).toBeNull();
    });
  });

  describe('Date parsing from different formats', () => {
    it('should parse MM-DD-YYYY format', () => {
      const testCases = [
        {
          input: '12-31-1990',
          expected: '19901231',
        },
        {
          input: '01-15-2000',
          expected: '20000115',
        },
        {
          input: '06-30-1985',
          expected: '19850630',
        },
        {
          input: '03-05-1995',
          expected: '19950305',
        },
        {
          input: '02/16/1997 (mm/dd/yyyy)',
          expected: '19970216',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });

    it('should parse DD-MM-YYYY format', () => {
      const testCases = [
        {
          input: '31-12-1990',
          expected: '19901231',
        },
        {
          input: '15-01-2000',
          expected: '20000115',
        },
        {
          input: '30-06-1985',
          expected: '19850630',
        },
        {
          input: '05-03-1995',
          expected: '19950503', // Logic treats 05 as month, 03 as day when no number > 31
        },
        {
          input: '16-2-1997 (dd-mm-yyyy)',
          expected: '19970216',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });

    it('should parse YYYY-MM-DD format', () => {
      const testCases = [
        {
          input: '1990-12-31',
          expected: '19901231',
        },
        {
          input: '2000-01-15',
          expected: '20000115',
        },
        {
          input: '1985-06-30',
          expected: '19850630',
        },
        {
          input: '1995-03-05',
          expected: '19950305',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });

    it('should parse dates with various separators', () => {
      const testCases = [
        {
          input: '12/31/1990',
          expected: '19901231',
        },
        {
          input: '1990.12.31',
          expected: '19901231',
        },
        {
          input: '12 31 1990',
          expected: '19901231',
        },
        {
          input: '1990_12_31',
          expected: '19901231',
        },
        {
          input: '12:31:1990',
          expected: '19901231',
        },
        {
          input: '1990|12|31',
          expected: '19901231',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });

    it('should handle dates with mixed separators', () => {
      const testCases = [
        {
          input: '12-31/1990',
          expected: '19901231',
        },
        {
          input: '1990.12-31',
          expected: '19901231',
        },
        {
          input: '12 31/1990',
          expected: '19901231',
        },
        {
          input: '1990_12.31',
          expected: '19901231',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });

    it('should handle dates with leading/trailing whitespace', () => {
      const testCases = [
        {
          input: '  12-31-1990  ',
          expected: '19901231',
        },
        {
          input: '\t1990-12-31\n',
          expected: '19901231',
        },
        {
          input: ' 31/12/1990 ',
          expected: '19901231',
        },
        {
          input: '\r\n1990.12.31\t',
          expected: '19901231',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });

    it('should handle 8-digit date strings', () => {
      const testCases = [
        {
          input: '19901231',
          expected: '19901231',
        },
        {
          input: '20000115',
          expected: '20000115',
        },
        {
          input: '19850630',
          expected: '19850630',
        },
        {
          input: '19950305',
          expected: '19950305',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });

    it('should handle dates with leading zeros', () => {
      const testCases = [
        {
          input: '01-02-1990',
          expected: '19900102',
        },
        {
          input: '1990-01-02',
          expected: '19900102',
        },
        {
          input: '02-01-1990',
          expected: '19900201',
        },
        {
          input: '05-09-2000',
          expected: '20000509',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });

    it('should handle ambiguous dates consistently', () => {
      // For ambiguous dates, the logic determines format based on which number > 31 and > 12
      const testCases = [
        {
          input: '01-02-1990', // Month-Day-Year (since 1990 > 31, so 1990 is year, 01 is month, 02 is day)
          expected: '19900102',
        },
        {
          input: '13-02-1990', // Day-Month-Year (since 13 > 12, treat 13 as day, 02 as month, 1990 as year)
          expected: '19900213',
        },
        {
          input: '02-13-1990', // Month-Day-Year (since 13 > 12, treat 02 as month, 13 as day, 1990 as year)
          expected: '19900213',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });
  });

  describe('Date validation', () => {
    it('should handle valid dates within acceptable year range', () => {
      const currentYear = new Date().getFullYear();
      const testCases = [
        {
          input: '01-01-1800',
          expected: '18000101',
        },
        {
          input: `01-01-${currentYear}`,
          expected: `${currentYear}0101`,
        },
        {
          input: `01-01-${currentYear + 1}`,
          expected: `${currentYear + 1}0101`,
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });

    it('should return null for invalid years', () => {
      const currentYear = new Date().getFullYear();
      const testCases = [
        '01-01-1799', // Year too early
        `01-01-${currentYear + 2}`, // Year too far in future
        '01-01-0100', // Year too early
      ];

      testCases.forEach((input) => {
        expect(getNormalizedDOB(input)).toBeNull();
      });
    });

    it('should return null for invalid months', () => {
      const testCases = [
        '00-15-1990', // Month 0
        '13-15-1990', // Month 13 (both 13 and 15 > 12, invalid)
        '15-13-1990', // Month 15 (both 15 and 13 > 12, invalid)
      ];

      testCases.forEach((input) => {
        expect(getNormalizedDOB(input)).toBeNull();
      });
    });

    it('should return null for invalid days', () => {
      const testCases = [
        '01-00-1990', // Day 0
        '01-32-1990', // Day 32
        '32-01-1990', // Day 32 (invalid)
      ];

      testCases.forEach((input) => {
        expect(getNormalizedDOB(input)).toBeNull();
      });
    });

    it('should handle leap year dates', () => {
      const testCases = [
        {
          input: '02-29-2000', // Valid leap year
          expected: '20000229',
        },
        {
          input: '29-02-2000', // Valid leap year (DD-MM-YYYY)
          expected: '20000229',
        },
        {
          input: '2000-02-29', // Valid leap year (YYYY-MM-DD)
          expected: '20000229',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });
  });

  describe('Hashed DOB handling', () => {
    it('should return SHA-256 hash as-is when it looks like a hash', () => {
      const validHashes = [
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 'hello' hashed
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty string hashed
        '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29', // 'hello' in different case
        'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890', // uppercase hash
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // mixed case hash
      ];

      validHashes.forEach((hash) => {
        const result = getNormalizedDOB(hash);
        expect(result).toEqual(hash);
      });
    });

    it('should return null for invalid hash-like strings that cannot be parsed as dates', () => {
      const invalidHashes = [
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars - no valid digits for parsing
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars - no valid digits for parsing
        'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'g' - no valid digits for parsing
        'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE!', // invalid char '!' - no valid digits for parsing
        '123', // too short for hash and insufficient digits for date parsing
      ];

      invalidHashes.forEach((input) => {
        const result = getNormalizedDOB(input);
        expect(result).toBeNull();
      });
    });

    it('should handle mixed case hashed DOB', () => {
      const mixedCaseHash =
        'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
      const result = getNormalizedDOB(mixedCaseHash);
      expect(result).toEqual(mixedCaseHash);
    });

    it('should handle lowercase hashed DOB', () => {
      const lowercaseHash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      const result = getNormalizedDOB(lowercaseHash);
      expect(result).toEqual(lowercaseHash);
    });
  });

  describe('Edge cases', () => {
    it('should return null for insufficient digit groups', () => {
      const testCases = [
        '12-31', // Only 2 groups, insufficient for date parsing
        '1990', // Only 1 group, but not 8 digits
        '12', // Only 1 group, too short
      ];

      testCases.forEach((input) => {
        expect(getNormalizedDOB(input)).toBeNull();
      });
    });

    it('should handle dates with extra digit groups', () => {
      const testCases = [
        {
          input: '12-31-1990-15-30', // 5 groups, should use first 3
          expected: '19901231',
        },
        {
          input: '1990-12-31-00-00-00', // 6 groups, should use first 3
          expected: '19901231',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });

    it('should handle non-digit characters mixed with dates', () => {
      const testCases = [
        {
          input: 'Born: 12-31-1990',
          expected: '19901231',
        },
        {
          input: 'DOB is 1990/12/31 (verified)',
          expected: '19901231',
        },
        {
          input: 'Date: 31.12.1990 Age: 30',
          expected: '19901231',
        },
        {
          input: '12-31-1990 (mm-dd-yyyy)',
          expected: '19901231',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });

    it('should return null for dates with invalid years (too low)', () => {
      const testCases = [
        '01-01-01', // Year 1 is too low (< 1800)
        '12-12-12', // Year 12 is too low (< 1800)
      ];

      testCases.forEach((input) => {
        expect(getNormalizedDOB(input)).toBeNull();
      });
    });

    it('should handle Unicode and international characters', () => {
      const testCases = [
        {
          input: '１２－３１－１９９０', // Full-width characters - no ASCII digits found
          expected: null, // Returns null when no valid ASCII digits are found
        },
        {
          input: '12月31日1990年', // Japanese date format - has ASCII digits
          expected: '19901231', // Extract digits: 12, 31, 1990
        },
        {
          input: '31/12/1990 (DD/MM/YYYY)',
          expected: '19901231',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });

    it('should return null for invalid date strings that cannot be parsed', () => {
      // Test cases that cannot be parsed as dates - new implementation returns null
      const testCases = [
        'invalid date string', // No valid digit sequences for parsing
        '---',
        '...',
        'abc-def-ghi',
      ];

      testCases.forEach((input) => {
        expect(getNormalizedDOB(input)).toBeNull();
      });
    });

    it('should return null for very long digit sequences that are not exactly 8 digits', () => {
      const testCases = [
        '199012311999', // 12 digits, not exactly 8 - cannot be parsed as valid date
        '1990123', // 7 digits, not exactly 8 - cannot be parsed as valid date
        '123456789', // 9 digits, not exactly 8 - cannot be parsed as valid date
      ];

      testCases.forEach((input) => {
        expect(getNormalizedDOB(input)).toBeNull();
      });
    });
  });

  describe('Real-world date formats', () => {
    it('should handle common US date formats', () => {
      const testCases = [
        {
          input: 'December 31, 1990',
          expected: null, // Only 2 digit groups: [31, 1990], insufficient for date parsing
        },
        {
          input: 'Dec 31, 1990',
          expected: null, // Only 2 digit groups: [31, 1990], insufficient for date parsing
        },
        {
          input: '12/31/90', // 3 digit groups: [12, 31, 90] - year 90 is too low (< 1800)
          expected: null, // Year validation fails
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getNormalizedDOB(input);
        expect(result).toEqual(expected);
      });
    });

    it('should handle European date formats', () => {
      const testCases = [
        {
          input: '31.12.1990',
          expected: '19901231',
        },
        {
          input: '31/12/1990',
          expected: '19901231',
        },
        {
          input: '31-12-1990',
          expected: '19901231',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });

    it('should handle ISO date formats', () => {
      const testCases = [
        {
          input: '1990-12-31',
          expected: '19901231',
        },
        {
          input: '1990/12/31',
          expected: '19901231',
        },
        {
          input: '19901231', // Already in YYYYMMDD format
          expected: '19901231',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
      });
    });
  });
});

describe('getNormalizedPII with DATE_OF_BIRTH', () => {
  describe('Input validation', () => {
    it('should return null for null input', () => {
      expect(getNormalizedPII(null, PII_DATA_TYPE.DATE_OF_BIRTH)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(
        getNormalizedPII(undefined, PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toBeNull();
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false];

      nonStringValues.forEach((value) => {
        expect(getNormalizedPII(value, PII_DATA_TYPE.DATE_OF_BIRTH)).toBeNull();
      });
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedPII('', PII_DATA_TYPE.DATE_OF_BIRTH)).toBeNull();
    });

    it('should return null for null data type', () => {
      expect(getNormalizedPII('12-31-1990', null)).toBeNull();
    });

    it('should return null for undefined data type', () => {
      expect(getNormalizedPII('12-31-1990', undefined)).toBeNull();
    });

    it('should return null for invalid data type', () => {
      expect(getNormalizedPII('12-31-1990', 'invalid_type')).toBeNull();
    });
  });

  describe('DATE_OF_BIRTH data type handling', () => {
    it('should return normalized value for DATE_OF_BIRTH data type', () => {
      const testCases = [
        {
          input: '12-31-1990',
          expected: '19901231',
        },
        {
          input: '1990-12-31',
          expected: '19901231',
        },
        {
          input: '31/12/1990',
          expected: '19901231',
        },
        {
          input: '  12-31-1990  ',
          expected: '19901231',
        },
        {
          input: '19901231',
          expected: '19901231',
        },
        {
          input: 'MIXED-case-date',
          expected: null, // Invalid date string - no valid digits for parsing
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.DATE_OF_BIRTH)).toEqual(
          expected
        );
      });
    });

    it('should handle whitespace-only DOB', () => {
      // The new getNormalizedDOB returns null for whitespace-only strings
      // PII interface passes through this null result
      expect(getNormalizedPII('   ', PII_DATA_TYPE.DATE_OF_BIRTH)).toBeNull();
      expect(
        getNormalizedPII('\t\n\r', PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toBeNull();
    });
  });

  describe('Other PII data types', () => {
    it('should return normalized gender for DOB when using GENDER data type', () => {
      expect(getNormalizedPII('male', PII_DATA_TYPE.GENDER)).toEqual('m');
      expect(getNormalizedPII('female', PII_DATA_TYPE.GENDER)).toEqual('f');
      expect(getNormalizedPII('12-31-1990', PII_DATA_TYPE.GENDER)).toBeNull(); // Invalid gender term
    });

    it('should return null for invalid email when using EMAIL data type', () => {
      expect(getNormalizedPII('12-31-1990', PII_DATA_TYPE.EMAIL)).toBeNull();
      expect(getNormalizedPII('1990-12-31', PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return normalized phone for DOB when using PHONE data type', () => {
      expect(getNormalizedPII('12-31-1990', PII_DATA_TYPE.PHONE)).toEqual(
        '12311990'
      );
      expect(getNormalizedPII('1990-12-31', PII_DATA_TYPE.PHONE)).toEqual(
        '19901231'
      );
    });

    it('should return null for truly unsupported data types', () => {
      const unsupportedTypes = ['invalid_type', 'unknown', 'fake_type'];

      unsupportedTypes.forEach((type) => {
        expect(getNormalizedPII('12-31-1990', type)).toBeNull();
      });
    });
  });

  describe('Comparison with direct getNormalizedDOB', () => {
    it('should show both functions behave the same way for valid dates', () => {
      const testCases = [
        {
          input: '12-31-1990',
          expected: '19901231', // Both functions normalize
        },
        {
          input: '  1990/12/31  ',
          expected: '19901231', // Both functions normalize
        },
        {
          input: 'Born: 31.12.1990',
          expected: '19901231', // Both functions extract and normalize
        },
        {
          input: '19901231',
          expected: '19901231', // Both functions keep 8-digit format
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
        expect(getNormalizedPII(input, PII_DATA_TYPE.DATE_OF_BIRTH)).toEqual(
          expected
        );
      });
    });

    it('should show both handle invalid dates the same way', () => {
      const testCases = [
        {
          input: 'invalid-date-string',
          expected: null, // Both functions return null on parse failure in new implementation
        },
        {
          input: '32-13-1990', // Invalid date
          expected: null, // Both functions return null for invalid dates in new implementation
        },
        {
          input: '12-31', // Insufficient groups
          expected: null, // Both functions return null for insufficient digit groups in new implementation
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedDOB(input)).toEqual(expected);
        expect(getNormalizedPII(input, PII_DATA_TYPE.DATE_OF_BIRTH)).toEqual(
          expected
        );
      });
    });

    it('should show both handle hashes the same way', () => {
      const hash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

      expect(getNormalizedDOB(hash)).toEqual(hash);
      expect(getNormalizedPII(hash, PII_DATA_TYPE.DATE_OF_BIRTH)).toEqual(hash);
    });

    it('should show different handling for null/invalid inputs due to PII interface validation', () => {
      const invalidInputs = [null, undefined, 123, {}, []];

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      invalidInputs.forEach((input) => {
        // Direct function now returns null for all non-string inputs due to try-catch error handling
        const directResult = getNormalizedDOB(input);
        expect(directResult).toBeNull();

        // PII interface also returns null for invalid inputs (validates input first)
        expect(getNormalizedPII(input, PII_DATA_TYPE.DATE_OF_BIRTH)).toBeNull();
      });

      // Verify that console.error was called for the direct getNormalizedDOB calls
      expect(consoleErrorSpy).toHaveBeenCalledTimes(invalidInputs.length);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to normalize dob: ',
        expect.any(TypeError)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should show both handle whitespace and edge cases the same way', () => {
      const testCases = [
        {
          input: '   ',
          expected: null, // Both return null for whitespace-only in new implementation
        },
        {
          input: '\t\n\r',
          expected: null, // Both return null for whitespace-only in new implementation
        },
        {
          input: '',
          expected: null, // Both return null for empty string in new implementation
        },
      ];

      testCases.forEach(({ input, expected }) => {
        if (input === '') {
          // Empty string case: both functions return null in new implementation
          expect(getNormalizedDOB(input)).toBeNull();
          expect(
            getNormalizedPII(input, PII_DATA_TYPE.DATE_OF_BIRTH)
          ).toBeNull();
        } else {
          expect(getNormalizedDOB(input)).toEqual(expected);
          expect(getNormalizedPII(input, PII_DATA_TYPE.DATE_OF_BIRTH)).toEqual(
            expected
          );
        }
      });
    });
  });
});
