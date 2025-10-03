/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { getNormalizedGender } = require('../src/piiUtil/genderUtil');

describe('getNormalizedGender', () => {
    describe('Input validation', () => {
        test('should return null for null input', () => {
            expect(getNormalizedGender(null)).toBeNull();
        });

        test('should return null for undefined input', () => {
            expect(getNormalizedGender(undefined)).toBeNull();
        });

        test('should throw error for non-string input', () => {
            const nonStringValues = [123, {}, [], true, false];

            nonStringValues.forEach((value) => {
                // The function expects a string and will call .toLowerCase() on it
                // Non-string values should cause an error
                expect(() => getNormalizedGender(value)).toThrow();
            });
        });

        test('should return null for empty string input', () => {
            expect(getNormalizedGender('')).toBeNull();
        });

        test('should return null for whitespace-only input', () => {
            expect(getNormalizedGender('   ')).toBeNull();
            expect(getNormalizedGender('\t\n\r')).toBeNull();
            expect(getNormalizedGender('  \t  \n  \r  ')).toBeNull();
        });
    });

    test('should pass example data', () => {
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
            expect(getNormalizedGender(input)).toEqual(expected);
        });
    });

    describe('Male gender normalization', () => {
        test('should normalize common male terms', () => {
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
                expect(getNormalizedGender(term)).toEqual('m');
            });
        });

        test('should normalize male terms with different cases', () => {
            const testCases = [
                {
                    input: 'MALE',
                    expected: 'm',
                },
                {
                    input: 'Male',
                    expected: 'm',
                },
                {
                    input: 'MaLe',
                    expected: 'm',
                },
                {
                    input: 'MAN',
                    expected: 'm',
                },
                {
                    input: 'Man',
                    expected: 'm',
                },
                {
                    input: 'BOY',
                    expected: 'm',
                },
                {
                    input: 'Boy',
                    expected: 'm',
                },
                {
                    input: 'GENTLEMAN',
                    expected: 'm',
                },
                {
                    input: 'Gentleman',
                    expected: 'm',
                },
                {
                    input: 'HE',
                    expected: 'm',
                },
                {
                    input: 'He',
                    expected: 'm',
                },
                {
                    input: 'M',
                    expected: 'm',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedGender(input)).toEqual(expected);
            });
        });

        test('should normalize male terms with leading/trailing whitespace', () => {
            const testCases = [
                {
                    input: '  male  ',
                    expected: 'm',
                },
                {
                    input: '\tman\n',
                    expected: 'm',
                },
                {
                    input: '  MALE  ',
                    expected: 'm',
                },
                {
                    input: '\r\nboy\t',
                    expected: 'm',
                },
                {
                    input: '     m    ',
                    expected: 'm',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedGender(input)).toEqual(expected);
            });
        });
    });

    describe('Female gender normalization', () => {
        test('should normalize common female terms', () => {
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
                expect(getNormalizedGender(term)).toEqual('f');
            });
        });

        test('should normalize female terms with different cases', () => {
            const testCases = [
                {
                    input: 'FEMALE',
                    expected: 'f',
                },
                {
                    input: 'Female',
                    expected: 'f',
                },
                {
                    input: 'FeMaLe',
                    expected: 'f',
                },
                {
                    input: 'WOMAN',
                    expected: 'f',
                },
                {
                    input: 'Woman',
                    expected: 'f',
                },
                {
                    input: 'GIRL',
                    expected: 'f',
                },
                {
                    input: 'Girl',
                    expected: 'f',
                },
                {
                    input: 'LADY',
                    expected: 'f',
                },
                {
                    input: 'Lady',
                    expected: 'f',
                },
                {
                    input: 'SHE',
                    expected: 'f',
                },
                {
                    input: 'She',
                    expected: 'f',
                },
                {
                    input: 'F',
                    expected: 'f',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedGender(input)).toEqual(expected);
            });
        });

        test('should normalize female terms with leading/trailing whitespace', () => {
            const testCases = [
                {
                    input: '  female  ',
                    expected: 'f',
                },
                {
                    input: '\twoman\n',
                    expected: 'f',
                },
                {
                    input: '  FEMALE  ',
                    expected: 'f',
                },
                {
                    input: '\r\ngirl\t',
                    expected: 'f',
                },
                {
                    input: '     f    ',
                    expected: 'f',
                },
                {
                    input: "  ma'am  ",
                    expected: 'f',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedGender(input)).toEqual(expected);
            });
        });
    });

    describe('Invalid gender values', () => {
        test('should return null for unrecognized gender terms', () => {
            const invalidGenders = [
                'unknown',
                'other',
                'non-binary',
                'transgender',
                'genderfluid',
                'agender',
                'bigender',
                'pangender',
                'genderqueer',
                'two-spirit',
                'third gender',
                'neutral',
                'neither',
                'both',
                'prefer not to say',
                'not specified',
                'n/a',
                'na',
                'x',
                'u',
                'o',
                'random text',
                'invalid',
                'test',
                'abc',
                '123',
                'gender',
                'sex',
            ];

            invalidGenders.forEach((gender) => {
                expect(getNormalizedGender(gender)).toBeNull();
            });
        });

        test('should return null for numbers and special characters', () => {
            const invalidInputs = [
                '0',
                '1',
                '2',
                '123',
                '!@#$%^&*()',
                '...',
                '---',
                '___',
                '+++',
                '===',
                '???',
                '***',
                '###',
                '&&&',
            ];

            invalidInputs.forEach((input) => {
                expect(getNormalizedGender(input)).toBeNull();
            });
        });

        test('should return null for mixed invalid terms', () => {
            const mixedInvalidInputs = [
                'male female', // contains space
                'm/f',
                'male or female',
                'man woman',
                'boy girl',
                'he she',
                'his hers',
                'male123',
                'female456',
                'man!',
                'woman?',
                'male.',
                'female,',
            ];

            mixedInvalidInputs.forEach((input) => {
                expect(getNormalizedGender(input)).toBeNull();
            });
        });
    });

    describe('Hashed gender handling', () => {
        test('should return SHA-256 hash as-is when it looks like a hash', () => {
            const validHashes = [
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 'hello' hashed
                'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty string hashed
                '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29', // 'hello' in different case
                'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890', // uppercase hash
                '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // mixed case hash
                '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d',
                '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // all valid hex chars
                'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210', // reverse order
            ];

            validHashes.forEach((hash) => {
                const result = getNormalizedGender(hash);
                expect(result).toEqual(hash);
            });
        });

        test('should process invalid hash-like strings as regular gender terms', () => {
            const invalidHashes = [
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars
                'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'g'
                'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE!', // invalid char '!'
                '123', // too short
                'z665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'z'
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27a 3', // space in middle
            ];

            invalidHashes.forEach((input) => {
                const result = getNormalizedGender(input);
                // These will be processed as regular gender terms and return null since they're not recognized
                expect(result).toBeNull();
            });
        });

        test('should handle mixed case hashed genders', () => {
            const mixedCaseHash =
                'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
            const result = getNormalizedGender(mixedCaseHash);
            expect(result).toEqual(mixedCaseHash);
        });

        test('should handle lowercase hashed genders', () => {
            const lowercaseHash =
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
            const result = getNormalizedGender(lowercaseHash);
            expect(result).toEqual(lowercaseHash);
        });
    });

    describe('Edge cases with gender validation', () => {
        test('should handle terms with special characters that are not in the sets', () => {
            const specialCharInputs = [
                'male!',
                'female@',
                'man#',
                'woman$',
                'boy%',
                'girl^',
                'he&',
                'she*',
                'm(',
                'f)',
                'male-female',
                'man/woman',
                'he+she',
                'male=female',
            ];

            specialCharInputs.forEach((input) => {
                const result = getNormalizedGender(input);
                expect(result).toBeNull();
            });
        });

        test('should handle terms with numbers mixed in', () => {
            const numberedInputs = [
                'male1',
                'female2',
                'man3',
                'woman4',
                'boy5',
                'girl6',
                'he7',
                'she8',
                'm9',
                'f0',
                '1male',
                '2female',
                'mal3e',
                'fem4ale',
            ];

            numberedInputs.forEach((input) => {
                const result = getNormalizedGender(input);
                expect(result).toBeNull();
            });
        });

        test('should handle very long inputs containing valid gender terms', () => {
            const longInputs = [
                'this is a very long string that contains the word male somewhere',
                'another long string with female in the middle of it',
                'male' + 'x'.repeat(1000),
                'female' + 'y'.repeat(1000),
                'prefix_male_suffix',
                'start_female_end',
            ];

            longInputs.forEach((input) => {
                const result = getNormalizedGender(input);
                // These should return null since the exact term doesn't match after trimming
                expect(result).toBeNull();
            });
        });
    });

    describe('Boundary conditions', () => {
        test('should handle single character valid genders', () => {
            const singleCharGenders = [
                {
                    input: 'm',
                    expected: 'm',
                },
                {
                    input: 'M',
                    expected: 'm',
                },
                {
                    input: 'f',
                    expected: 'f',
                },
                {
                    input: 'F',
                    expected: 'f',
                },
            ];

            singleCharGenders.forEach(({ input, expected }) => {
                expect(getNormalizedGender(input)).toEqual(expected);
            });
        });

        test('should handle single character invalid genders', () => {
            const invalidSingleChars = [
                'a', 'b', 'c', 'd', 'e', 'g', 'h', 'i', 'j', 'k', 'l', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                'A', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'J', 'K', 'L', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '[', ']', '{', '}', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '?', '/',
            ];

            invalidSingleChars.forEach((char) => {
                expect(getNormalizedGender(char)).toBeNull();
            });
        });

        test('should handle terms that are substrings of valid terms', () => {
            const substringInputs = [
                'mal', // substring of 'male'
                'femal', // substring of 'female'
                'ma', // substring of 'man'
                'woma', // substring of 'woman'
                'bo', // substring of 'boy'
                'gir', // substring of 'girl'
                'h', // substring of 'he'
                's', // substring of 'she'
            ];

            substringInputs.forEach((input) => {
                expect(getNormalizedGender(input)).toBeNull();
            });
        });

        test('should handle terms that contain valid terms as substrings', () => {
            const containingInputs = [
                'males', // contains 'male'
                'females', // contains 'female'
                'woman1', // contains 'woman'
                'manly', // contains 'man'
                'boyish', // contains 'boy'
                'girly', // contains 'girl'
                'hero', // contains 'he'  (but not as exact match)
                'shell', // contains 'she' (but not as exact match)
            ];

            containingInputs.forEach((input) => {
                expect(getNormalizedGender(input)).toBeNull();
            });
        });
    });

    describe('Case sensitivity and whitespace handling', () => {
        test('should handle mixed case inputs correctly', () => {
            const mixedCaseInputs = [
                {
                    input: 'MaLe',
                    expected: 'm',
                },
                {
                    input: 'FeMALe',
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
                    input: 'BoY',
                    expected: 'm',
                },
                {
                    input: 'GiRl',
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

            mixedCaseInputs.forEach(({ input, expected }) => {
                expect(getNormalizedGender(input)).toEqual(expected);
            });
        });

        test('should handle various whitespace characters', () => {
            const whitespaceInputs = [
                {
                    input: '\tmale\t',
                    expected: 'm',
                },
                {
                    input: '\nfemale\n',
                    expected: 'f',
                },
                {
                    input: '\rmale\r',
                    expected: 'm',
                },
                {
                    input: '\ffemale\f',
                    expected: 'f',
                },
                {
                    input: '\vmale\v',
                    expected: 'm',
                },
                {
                    input: ' \t\n\r\f\vmale \t\n\r\f\v',
                    expected: 'm',
                },
                {
                    input: ' \t\n\r\f\vfemale \t\n\r\f\v',
                    expected: 'f',
                },
            ];

            whitespaceInputs.forEach(({ input, expected }) => {
                expect(getNormalizedGender(input)).toEqual(expected);
            });
        });
    });

    describe('Performance and edge input handling', () => {
        test('should handle very long invalid inputs gracefully', () => {
            const veryLongInvalid = 'x'.repeat(1000); // No valid gender terms
            const result = getNormalizedGender(veryLongInvalid);
            expect(result).toBeNull();
        });

        test('should handle strings with only special characters', () => {
            const specialOnlyInputs = [
                '!@#$%^&*()',
                '@@@@@@@@',
                '........',
                '________',
                '--------',
                '++++++++',
                '========',
                '????????',
                '||||||||',
                '////////',
                '\\\\\\\\\\\\\\\\',
            ];

            specialOnlyInputs.forEach((input) => {
                const result = getNormalizedGender(input);
                expect(result).toBeNull();
            });
        });

        test('should handle Unicode and international characters', () => {
            const unicodeInputs = [
                'мужчина', // Russian for 'man'
                '女性', // Chinese for 'female'
                'homme', // French for 'man'
                'femme', // French for 'woman'
                'hombre', // Spanish for 'man'
                'mujer', // Spanish for 'woman'
                'Mann', // German for 'man'
                'Frau', // German for 'woman'
                'uomo', // Italian for 'man'
                'donna', // Italian for 'woman'
                'αντρας', // Greek for 'man'
                'γυναικα', // Greek for 'woman'
            ];

            unicodeInputs.forEach((input) => {
                const result = getNormalizedGender(input);
                // These should return null since they're not in the English term sets
                expect(result).toBeNull();
            });
        });

        test('should handle empty-like inputs', () => {
            const emptyLikeInputs = [
                '',
                ' ',
                '  ',
                '   ',
                '\t',
                '\n',
                '\r',
                '\t\n\r',
                '    \t\n\r    ',
            ];

            emptyLikeInputs.forEach((input) => {
                expect(getNormalizedGender(input)).toBeNull();
            });
        });
    });

    describe('Comprehensive term coverage', () => {
        test('should handle all formal male titles and terms', () => {
            const formalMaleTerms = [
                'sir',
                'mister',
                'mr',
                'gentleman',
                'lord',
                'king',
                'prince',
                'duke',
                'count',
                'emperor',
                'god',
            ];

            formalMaleTerms.forEach((term) => {
                expect(getNormalizedGender(term)).toEqual('m');
                expect(getNormalizedGender(term.toUpperCase())).toEqual('m');
            });
        });

        test('should handle all formal female titles and terms', () => {
            const formalFemaleTerms = [
                'miss',
                'ms',
                'mrs',
                'madam',
                "ma'am",
                'lady',
                'queen',
                'princess',
                'duchess',
                'countess',
                'empress',
                'goddess',
            ];

            formalFemaleTerms.forEach((term) => {
                expect(getNormalizedGender(term)).toEqual('f');
                expect(getNormalizedGender(term.toUpperCase())).toEqual('f');
            });
        });

        test('should handle all family relation male terms', () => {
            const familyMaleTerms = [
                'father',
                'dad',
                'daddy',
                'papa',
                'son',
                'uncle',
                'nephew',
                'brother',
                'husband',
                'boyfriend',
                'groom',
                'widower',
            ];

            familyMaleTerms.forEach((term) => {
                expect(getNormalizedGender(term)).toEqual('m');
                expect(getNormalizedGender(term.toUpperCase())).toEqual('m');
            });
        });

        test('should handle all family relation female terms', () => {
            const familyFemaleTerms = [
                'mother',
                'mom',
                'mama',
                'mommy',
                'daughter',
                'aunt',
                'niece',
                'sister',
                'wife',
                'girlfriend',
                'bride',
                'widow',
            ];

            familyFemaleTerms.forEach((term) => {
                expect(getNormalizedGender(term)).toEqual('f');
                expect(getNormalizedGender(term.toUpperCase())).toEqual('f');
            });
        });

        test('should handle all informal male terms', () => {
            const informalMaleTerms = [
                'guy',
                'lad',
                'fellow',
                'chap',
                'bloke',
                'dude',
            ];

            informalMaleTerms.forEach((term) => {
                expect(getNormalizedGender(term)).toEqual('m');
                expect(getNormalizedGender(term.toUpperCase())).toEqual('m');
            });
        });

        test('should handle all informal female terms', () => {
            const informalFemaleTerms = [
                'maiden',
                'lass',
                'gal',
                'chick',
                'dame',
                'belle',
            ];

            informalFemaleTerms.forEach((term) => {
                expect(getNormalizedGender(term)).toEqual('f');
                expect(getNormalizedGender(term.toUpperCase())).toEqual('f');
            });
        });

        test('should handle all pronoun terms', () => {
            const malePronouns = ['he', 'him', 'his', 'himself'];
            const femalePronouns = ['she', 'her', 'hers', 'herself'];

            malePronouns.forEach((pronoun) => {
                expect(getNormalizedGender(pronoun)).toEqual('m');
                expect(getNormalizedGender(pronoun.toUpperCase())).toEqual('m');
            });

            femalePronouns.forEach((pronoun) => {
                expect(getNormalizedGender(pronoun)).toEqual('f');
                expect(getNormalizedGender(pronoun.toUpperCase())).toEqual('f');
            });
        });
    });

    describe('Real-world usage scenarios', () => {
        test('should handle form input scenarios', () => {
            const formInputs = [
                { input: 'M', expected: 'm' },
                { input: 'F', expected: 'f' },
                { input: 'Male', expected: 'm' },
                { input: 'Female', expected: 'f' },
                { input: 'MAN', expected: 'm' },
                { input: 'WOMAN', expected: 'f' },
                { input: '  Male  ', expected: 'm' },
                { input: '  Female  ', expected: 'f' },
            ];

            formInputs.forEach(({ input, expected }) => {
                expect(getNormalizedGender(input)).toEqual(expected);
            });
        });

        test('should handle database value scenarios', () => {
            const dbValues = [
                { input: 'm', expected: 'm' },
                { input: 'f', expected: 'f' },
                { input: 'male', expected: 'm' },
                { input: 'female', expected: 'f' },
                { input: 'man', expected: 'm' },
                { input: 'woman', expected: 'f' },
            ];

            dbValues.forEach(({ input, expected }) => {
                expect(getNormalizedGender(input)).toEqual(expected);
            });
        });

        test('should handle API response scenarios', () => {
            const apiValues = [
                { input: 'MALE', expected: 'm' },
                { input: 'FEMALE', expected: 'f' },
                { input: 'male', expected: 'm' },
                { input: 'female', expected: 'f' },
                { input: 'M', expected: 'm' },
                { input: 'F', expected: 'f' },
            ];

            apiValues.forEach(({ input, expected }) => {
                expect(getNormalizedGender(input)).toEqual(expected);
            });
        });
    });
});
