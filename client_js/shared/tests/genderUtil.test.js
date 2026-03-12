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
      expect(getNormalizedPII(null, PII_DATA_TYPE.GENDER)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getNormalizedPII(undefined, PII_DATA_TYPE.GENDER)).toBeNull();
    });

    it('should return null for non-string input', () => {
      const nonStringValues = [123, {}, [], true, false];

      nonStringValues.forEach((value) => {
        expect(getNormalizedPII(value, PII_DATA_TYPE.GENDER)).toBeNull();
      });
    });

    it('should return null for empty string input', () => {
      expect(getNormalizedPII('', PII_DATA_TYPE.GENDER)).toBeNull();
    });

    it('should return null for whitespace-only input', () => {
      expect(getNormalizedPII('   ', PII_DATA_TYPE.GENDER)).toBeNull();
      expect(getNormalizedPII('\t\n\r', PII_DATA_TYPE.GENDER)).toBeNull();
    });

    it('should return null for null data type', () => {
      expect(getNormalizedPII('male', null)).toBeNull();
    });

    it('should return null for undefined data type', () => {
      expect(getNormalizedPII('male', undefined)).toBeNull();
    });

    it('should return null for invalid data type', () => {
      expect(getNormalizedPII('male', 'invalid_type')).toBeNull();
    });
  });

  describe('Gender normalization', () => {
    it('should normalize male gender terms to "m"', () => {
      const maleTerms = [
        'man',
        'male',
        'boy',
        'gentleman',
        'guy',
        'sir',
        'mister',
        'mr',
        'son',
        'father',
        'dad',
        'daddy',
        'papa',
        'uncle',
        'nephew',
        'brother',
        'husband',
        'boyfriend',
        'groom',
        'widower',
        'king',
        'prince',
        'duke',
        'count',
        'emperor',
        'god',
        'lord',
        'lad',
        'fellow',
        'chap',
        'bloke',
        'dude',
        'he',
        'him',
        'his',
        'himself',
        'm',
      ];

      maleTerms.forEach((term) => {
        expect(getNormalizedPII(term, PII_DATA_TYPE.GENDER)).toEqual('m');
      });
    });

    it('should normalize female gender terms to "f"', () => {
      const femaleTerms = [
        'woman',
        'female',
        'girl',
        'lady',
        'miss',
        'ms',
        'mrs',
        'madam',
        "ma'am",
        'daughter',
        'mother',
        'mom',
        'mama',
        'mommy',
        'aunt',
        'niece',
        'sister',
        'wife',
        'girlfriend',
        'bride',
        'widow',
        'queen',
        'princess',
        'duchess',
        'countess',
        'empress',
        'goddess',
        'maiden',
        'lass',
        'gal',
        'chick',
        'dame',
        'belle',
        'she',
        'her',
        'hers',
        'herself',
        'f',
      ];

      femaleTerms.forEach((term) => {
        expect(getNormalizedPII(term, PII_DATA_TYPE.GENDER)).toEqual('f');
      });
    });

    it('should handle mixed case gender terms', () => {
      const testCases = [
        {
          input: 'MALE',
          expected: 'm',
        },
        {
          input: 'Female',
          expected: 'f',
        },
        {
          input: 'MaN',
          expected: 'm',
        },
        {
          input: 'WoMaN',
          expected: 'f',
        },
        {
          input: 'BOY',
          expected: 'm',
        },
        {
          input: 'GIRL',
          expected: 'f',
        },
        {
          input: 'HE',
          expected: 'm',
        },
        {
          input: 'SHE',
          expected: 'f',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.GENDER)).toEqual(expected);
      });
    });

    it('should handle dev doc CSV examples', () => {
      const testCases = [
        {
          input: 'male',
          expected: 'm',
        },
        {
          input: 'Male',
          expected: 'm',
        },
        {
          input: 'Boy',
          expected: 'm',
        },
        {
          input: 'M',
          expected: 'm',
        },
        {
          input: 'm',
          expected: 'm',
        },
        {
          input: 'Girl',
          expected: 'f',
        },
        {
          input: '        Woman         ',
          expected: 'f',
        },
        {
          input: 'Female',
          expected: 'f',
        },
        {
          input: 'female',
          expected: 'f',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.GENDER)).toEqual(expected);
      });
    });

    it('should handle gender terms with leading/trailing whitespace', () => {
      const testCases = [
        {
          input: '  male  ',
          expected: 'm',
        },
        {
          input: '\tfemale\n',
          expected: 'f',
        },
        {
          input: ' man ',
          expected: 'm',
        },
        {
          input: '\r\nwoman\t',
          expected: 'f',
        },
        {
          input: '   boy   ',
          expected: 'm',
        },
        {
          input: '\t\tgirl\n\n',
          expected: 'f',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.GENDER)).toEqual(expected);
      });
    });

    it('should return null for unrecognized gender terms', () => {
      const unrecognizedTerms = [
        'unknown',
        'other',
        'non-binary',
        'genderfluid',
        'transgender',
        'agender',
        'bigender',
        'demigender',
        'pangender',
        'genderqueer',
        'two-spirit',
        'third gender',
        'neutral',
        'x',
        'nb',
        'enby',
        'prefer not to say',
        'attack helicopter',
        'random text',
        'not applicable',
        'n/a',
        '123',
        'invalid',
        'test',
        'abc',
        'xyz',
      ];

      unrecognizedTerms.forEach((term) => {
        expect(getNormalizedPII(term, PII_DATA_TYPE.GENDER)).toBeNull();
      });
    });

    it('should handle edge case gender variations', () => {
      const testCases = [
        {
          input: 'gentlemen', // Note: only 'gentleman' is in the set
          expected: null,
        },
        {
          input: 'men', // Note: only 'man' is in the set
          expected: null,
        },
        {
          input: 'women', // Note: only 'woman' is in the set
          expected: null,
        },
        {
          input: 'ladies', // Note: only 'lady' is in the set
          expected: null,
        },
        {
          input: 'boys',
          expected: null,
        },
        {
          input: 'girls',
          expected: null,
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.GENDER)).toEqual(expected);
      });
    });

    it('should handle pronouns correctly', () => {
      const testCases = [
        {
          input: 'he',
          expected: 'm',
        },
        {
          input: 'him',
          expected: 'm',
        },
        {
          input: 'his',
          expected: 'm',
        },
        {
          input: 'himself',
          expected: 'm',
        },
        {
          input: 'she',
          expected: 'f',
        },
        {
          input: 'her',
          expected: 'f',
        },
        {
          input: 'hers',
          expected: 'f',
        },
        {
          input: 'herself',
          expected: 'f',
        },
        {
          input: 'they', // Not in either set
          expected: null,
        },
        {
          input: 'them', // Not in either set
          expected: null,
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.GENDER)).toEqual(expected);
      });
    });

    it('should handle family relationship terms', () => {
      const testCases = [
        // Male family terms
        {
          input: 'father',
          expected: 'm',
        },
        {
          input: 'dad',
          expected: 'm',
        },
        {
          input: 'papa',
          expected: 'm',
        },
        {
          input: 'uncle',
          expected: 'm',
        },
        {
          input: 'nephew',
          expected: 'm',
        },
        {
          input: 'brother',
          expected: 'm',
        },
        {
          input: 'son',
          expected: 'm',
        },
        // Female family terms
        {
          input: 'mother',
          expected: 'f',
        },
        {
          input: 'mom',
          expected: 'f',
        },
        {
          input: 'mama',
          expected: 'f',
        },
        {
          input: 'aunt',
          expected: 'f',
        },
        {
          input: 'niece',
          expected: 'f',
        },
        {
          input: 'sister',
          expected: 'f',
        },
        {
          input: 'daughter',
          expected: 'f',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.GENDER)).toEqual(expected);
      });
    });

    it('should handle titles and honorifics', () => {
      const testCases = [
        // Male titles
        {
          input: 'sir',
          expected: 'm',
        },
        {
          input: 'mister',
          expected: 'm',
        },
        {
          input: 'mr',
          expected: 'm',
        },
        {
          input: 'king',
          expected: 'm',
        },
        {
          input: 'prince',
          expected: 'm',
        },
        {
          input: 'duke',
          expected: 'm',
        },
        {
          input: 'lord',
          expected: 'm',
        },
        // Female titles
        {
          input: 'miss',
          expected: 'f',
        },
        {
          input: 'ms',
          expected: 'f',
        },
        {
          input: 'mrs',
          expected: 'f',
        },
        {
          input: 'madam',
          expected: 'f',
        },
        {
          input: "ma'am",
          expected: 'f',
        },
        {
          input: 'queen',
          expected: 'f',
        },
        {
          input: 'princess',
          expected: 'f',
        },
        {
          input: 'duchess',
          expected: 'f',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.GENDER)).toEqual(expected);
      });
    });

    it('should handle relationship status terms', () => {
      const testCases = [
        // Male relationship terms
        {
          input: 'husband',
          expected: 'm',
        },
        {
          input: 'boyfriend',
          expected: 'm',
        },
        {
          input: 'groom',
          expected: 'm',
        },
        {
          input: 'widower',
          expected: 'm',
        },
        // Female relationship terms
        {
          input: 'wife',
          expected: 'f',
        },
        {
          input: 'girlfriend',
          expected: 'f',
        },
        {
          input: 'bride',
          expected: 'f',
        },
        {
          input: 'widow',
          expected: 'f',
        },
        {
          input: 'maiden',
          expected: 'f',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getNormalizedPII(input, PII_DATA_TYPE.GENDER)).toEqual(expected);
      });
    });
  });

  describe('Hashed gender handling', () => {
    it('should return SHA-256 hash as-is when it looks like a hash', () => {
      const validHashes = [
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 'hello' hashed
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty string hashed
        '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29', // 'hello' in different case
        'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890', // uppercase hash
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // mixed case hash
      ];

      validHashes.forEach((hash) => {
        const result = getNormalizedPII(hash, PII_DATA_TYPE.GENDER);
        expect(result).toEqual(hash);
      });
    });

    it('should process invalid hash-like strings as regular gender terms', () => {
      const invalidHashes = [
        {
          input:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
          expected: null, // Not a valid gender term
        },
        {
          input:
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars
          expected: null, // Not a valid gender term
        },
        {
          input:
            'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'g'
          expected: null, // Not a valid gender term
        },
        {
          input:
            'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE!', // invalid char '!'
          expected: null, // Not a valid gender term
        },
        {
          input: '123', // too short for hash
          expected: null, // Not a valid gender term
        },
      ];

      invalidHashes.forEach(({ input, expected }) => {
        const result = getNormalizedPII(input, PII_DATA_TYPE.GENDER);
        expect(result).toEqual(expected);
      });
    });

    it('should handle mixed case hashed genders', () => {
      const mixedCaseHash =
        'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
      const result = getNormalizedPII(mixedCaseHash, PII_DATA_TYPE.GENDER);
      expect(result).toEqual(mixedCaseHash);
    });

    it('should handle lowercase hashed genders', () => {
      const lowercaseHash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      const result = getNormalizedPII(lowercaseHash, PII_DATA_TYPE.GENDER);
      expect(result).toEqual(lowercaseHash);
    });
  });

  describe('Other PII data types', () => {
    it('should return null for invalid email when using EMAIL data type', () => {
      expect(getNormalizedPII('male', PII_DATA_TYPE.EMAIL)).toBeNull();
      expect(getNormalizedPII('female', PII_DATA_TYPE.EMAIL)).toBeNull();
    });

    it('should return normalized phone for gender when using PHONE data type', () => {
      expect(getNormalizedPII('male', PII_DATA_TYPE.PHONE)).toEqual('');
      expect(getNormalizedPII('female', PII_DATA_TYPE.PHONE)).toEqual('');
      expect(getNormalizedPII('123-456-7890', PII_DATA_TYPE.PHONE)).toEqual(
        '1234567890'
      );
    });

    it('should return normalized DOB for gender when using DATE_OF_BIRTH data type', () => {
      expect(getNormalizedPII('male', PII_DATA_TYPE.DATE_OF_BIRTH)).toBeNull();
      expect(
        getNormalizedPII('female', PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toBeNull();
      expect(
        getNormalizedPII('12-31-1990', PII_DATA_TYPE.DATE_OF_BIRTH)
      ).toEqual('19901231');
    });

    it('should return null for truly unsupported data types', () => {
      const unsupportedTypes = ['invalid_type', 'unknown', 'fake_type'];

      unsupportedTypes.forEach((type) => {
        expect(getNormalizedPII('male', type)).toBeNull();
      });
    });
  });

  describe('Edge cases with gender validation', () => {
    it('should handle empty strings after trimming', () => {
      const emptyAfterTrim = [
        '   ', // only spaces
        '\t\t', // only tabs
        '\n\n', // only newlines
        '\r\r', // only carriage returns
        '\t\n\r ', // mixed whitespace
      ];

      emptyAfterTrim.forEach((input) => {
        const result = getNormalizedPII(input, PII_DATA_TYPE.GENDER);
        expect(result).toBeNull();
      });
    });

    it('should handle gender terms with extra spaces', () => {
      const testCases = [
        {
          input: 'male female', // Multiple terms
          expected: null, // Not in either set
        },
        {
          input: 'ma le', // Spaces within term
          expected: null, // Not in either set
        },
        {
          input: 'fe male', // Spaces within term
          expected: null, // Not in either set
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getNormalizedPII(input, PII_DATA_TYPE.GENDER);
        expect(result).toEqual(expected);
      });
    });

    it('should handle numeric gender representations', () => {
      const numericGenders = [
        '0', // Sometimes used for female
        '1', // Sometimes used for male
        '2', // Sometimes used for other
        '9', // Sometimes used for unknown
      ];

      numericGenders.forEach((input) => {
        const result = getNormalizedPII(input, PII_DATA_TYPE.GENDER);
        expect(result).toBeNull(); // These are not in the predefined sets
      });
    });

    it('should handle unicode and special characters', () => {
      const unicodeTerms = [
        'mâle', // French with accent
        'féminin', // French feminine
        'männlich', // German masculine
        'weiblich', // German feminine
        'мужской', // Russian masculine
        'женский', // Russian feminine
        '男性', // Chinese masculine
        '女性', // Chinese feminine
      ];

      unicodeTerms.forEach((input) => {
        const result = getNormalizedPII(input, PII_DATA_TYPE.GENDER);
        expect(result).toBeNull(); // These are not in the English predefined sets
      });
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      const result = getNormalizedPII(longString, PII_DATA_TYPE.GENDER);
      expect(result).toBeNull();
    });

    it('should handle strings with special characters', () => {
      const specialChars = [
        'male!',
        'female@',
        'man#',
        'woman$',
        'boy%',
        'girl^',
        'he&',
        'she*',
      ];

      specialChars.forEach((input) => {
        const result = getNormalizedPII(input, PII_DATA_TYPE.GENDER);
        expect(result).toBeNull(); // These modified terms are not in the sets
      });
    });

    it('should handle abbreviations and common variations', () => {
      const testCases = [
        {
          input: 'M', // Capital M - gets lowercased to 'm' and matches
          expected: 'm',
        },
        {
          input: 'F', // Capital F - gets lowercased to 'f' and matches
          expected: 'f',
        },
        {
          input: 'm',
          expected: 'm',
        },
        {
          input: 'f',
          expected: 'f',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getNormalizedPII(input, PII_DATA_TYPE.GENDER);
        expect(result).toEqual(expected);
      });
    });
  });
});
