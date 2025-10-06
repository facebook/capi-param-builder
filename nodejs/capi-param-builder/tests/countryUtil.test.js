/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { getNormalizedCountry } = require('../src/piiUtil/stringUtil');

describe('getNormalizedCountry', () => {
    describe('Input validation', () => {
        test('should return null for null input', () => {
            expect(getNormalizedCountry(null)).toBeNull();
        });

        test('should return null for undefined input', () => {
            expect(getNormalizedCountry(undefined)).toBeNull();
        });

        test('should handle non-string input by converting to string', () => {
            const testCases = [
                {
                    input: 123,
                    expected: null, // '123' -> empty after stripping numbers, fails regex test
                },
                {
                    input: true,
                    expected: 'tr', // String(true) = 'true' -> 'tr' (truncated)
                },
                {
                    input: false,
                    expected: 'fa', // String(false) = 'false' -> 'fa' (truncated)
                },
                {
                    input: {},
                    expected: 'ob', // '[object Object]' -> 'objectobject' -> 'ob' (truncated)
                },
                {
                    input: [],
                    expected: null, // String([]) = '', empty string fails regex test
                },
                {
                    input: [1, 2, 3],
                    expected: null, // String([1,2,3]) = '1,2,3' -> empty after stripping, fails regex
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should return null for empty string input', () => {
            expect(getNormalizedCountry('')).toBeNull();
        });

        test('should return null for whitespace-only input', () => {
            expect(getNormalizedCountry('   ')).toBeNull();
            expect(getNormalizedCountry('\t\n\r')).toBeNull();
            expect(getNormalizedCountry('  \t  \n  \r  ')).toBeNull();
        });
    });

    describe('Major Countries mapping', () => {

        it('should normalize example data', () => {
            const testCases = [
                {
                    input: '       United States       ',
                    expected: 'us',
                },
                {
                    input: '       US       ',
                    expected: 'us',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should normalize major country full names to ISO codes', () => {
            const testCases = [
                {
                    input: 'United States',
                    expected: 'us',
                },
                {
                    input: 'Canada',
                    expected: 'ca',
                },
                {
                    input: 'United Kingdom',
                    expected: 'gb',
                },
                {
                    input: 'Germany',
                    expected: 'de',
                },
                {
                    input: 'France',
                    expected: 'fr',
                },
                {
                    input: 'Japan',
                    expected: 'jp',
                },
                {
                    input: 'China',
                    expected: 'cn',
                },
                {
                    input: 'India',
                    expected: 'in',
                },
                {
                    input: 'Brazil',
                    expected: 'br',
                },
                {
                    input: 'Australia',
                    expected: 'au',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle mixed case country names', () => {
            const testCases = [
                {
                    input: 'UNITED STATES',
                    expected: 'us',
                },
                {
                    input: 'united states',
                    expected: 'us',
                },
                {
                    input: 'UnItEd StAtEs',
                    expected: 'us',
                },
                {
                    input: 'CANADA',
                    expected: 'ca',
                },
                {
                    input: 'canada',
                    expected: 'ca',
                },
                {
                    input: 'CaNaDa',
                    expected: 'ca',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle countries with spaces and punctuation', () => {
            const testCases = [
                {
                    input: '  United States  ',
                    expected: 'us',
                },
                {
                    input: 'United-States',
                    expected: 'us',
                },
                {
                    input: 'United.States',
                    expected: 'us',
                },
                {
                    input: 'United   Kingdom',
                    expected: 'gb',
                },
                {
                    input: 'South-Korea',
                    expected: 'kr',
                },
                {
                    input: 'New Zealand',
                    expected: 'nz',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });
    });

    describe('Alternative country names', () => {
        test('should handle common alternative country names', () => {
            const testCases = [
                {
                    input: 'USA',
                    expected: 'us',
                },
                {
                    input: 'United States of America',
                    expected: 'us',
                },
                {
                    input: 'Russia',
                    expected: 'ru',
                },
                {
                    input: 'Russian Federation',
                    expected: 'ru',
                },
                {
                    input: 'South Korea',
                    expected: 'kr',
                },
                {
                    input: 'Korea Republic of',
                    expected: 'kr',
                },
                {
                    input: 'North Korea',
                    expected: 'kp',
                },
                {
                    input: 'Korea Democratic Peoples Republic of',
                    expected: 'kp',
                },
                {
                    input: 'Iran',
                    expected: 'ir',
                },
                {
                    input: 'Iran Islamic Republic of',
                    expected: 'ir',
                },
                {
                    input: 'Syria',
                    expected: 'sy',
                },
                {
                    input: 'Syrian Arab Republic',
                    expected: 'sy',
                },
                {
                    input: 'Venezuela',
                    expected: 've',
                },
                {
                    input: 'Venezuela Bolivarian Republic of',
                    expected: 've',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle geographic region aliases', () => {
            const testCases = [
                {
                    input: 'Vatican',
                    expected: 'va',
                },
                {
                    input: 'Holy See Vatican City State',
                    expected: 'va',
                },
                {
                    input: 'Taiwan',
                    expected: 'tw',
                },
                {
                    input: 'Taiwan Province of China',
                    expected: 'tw',
                },
                {
                    input: 'Palestine',
                    expected: 'ps',
                },
                {
                    input: 'Palestine State of',
                    expected: 'ps',
                },
                {
                    input: 'Laos',
                    expected: 'la',
                },
                {
                    input: 'Lao Peoples Democratic Republic',
                    expected: 'la',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });
    });

    describe('Already abbreviated countries (ISO codes)', () => {
        test('should return major country ISO codes as-is', () => {
            const majorCountryCodes = [
                'us', 'ca', 'gb', 'de', 'fr', 'jp', 'cn', 'in', 'br', 'au',
                'mx', 'it', 'es', 'ru', 'kr', 'za', 'ng', 'eg', 'tr', 'ar'
            ];

            majorCountryCodes.forEach((code) => {
                expect(getNormalizedCountry(code)).toEqual(code);
                expect(getNormalizedCountry(code.toUpperCase())).toEqual(code);
            });
        });

        test('should handle abbreviated countries with spaces and punctuation', () => {
            const testCases = [
                {
                    input: '  US  ',
                    expected: 'us',
                },
                {
                    input: 'U.S.',
                    expected: 'us',
                },
                {
                    input: 'C-A',
                    expected: 'ca',
                },
                {
                    input: 'G@B',
                    expected: 'gb',
                },
                {
                    input: 'J!P',
                    expected: 'jp',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });
    });

    describe('Partial and contains matching', () => {
        test('should match countries contained in longer strings', () => {
            const testCases = [
                {
                    input: 'UnitedStatesAmerica',
                    expected: 'us', // Contains 'unitedstates'
                },
                {
                    input: 'CanadaCountry',
                    expected: 'ca', // Contains 'canada'
                },
                {
                    input: 'GermanyEurope',
                    expected: 'de', // Contains 'germany'
                },
                {
                    input: 'JapanAsia',
                    expected: 'jp', // Contains 'japan'
                },
                {
                    input: 'BrazilSouthAmerica',
                    expected: 'br', // Contains 'brazil'
                },
                {
                    input: 'AustraliaOceania',
                    expected: 'au', // Contains 'australia'
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle ambiguous matching based on order', () => {
            const testCases = [
                {
                    input: 'India',
                    expected: 'in', // Should match 'india', not 'indiana' if it were in the mapping
                },
                {
                    input: 'Georgia',
                    expected: 'ge', // Should match country 'georgia'
                },
                {
                    input: 'Guinea',
                    expected: 'gn', // Should match 'guinea'
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });
    });

    describe('Hashed country handling', () => {
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
                const result = getNormalizedCountry(hash);
                expect(result).toEqual(hash);
            });
        });

        test('should process invalid hash-like strings normally', () => {
            const testCases = [
                {
                    input: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
                    expected: 'aa', // First 2 chars after removing non-alpha
                },
                {
                    input: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars
                    expected: 'aa', // First 2 chars after removing non-alpha
                },
                {
                    input: 'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'g'
                    expected: 'ga', // First 2 chars after removing non-alpha
                },
                {
                    input: '123', // too short, starts with number
                    expected: null, // Fails regex test ^[a-z]+
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedCountry(input);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('Truncation behavior', () => {
        test('should truncate long inputs to 2 characters', () => {
            const testCases = [
                {
                    input: 'unknown',
                    expected: 'un', // No mapping found, truncated to 2 chars
                },
                {
                    input: 'randomcountry',
                    expected: 'ra', // No mapping found, truncated to 2 chars
                },
                {
                    input: 'xyz',
                    expected: 'xy', // No mapping found, truncated to 2 chars
                },
                {
                    input: 'abcdefghijk',
                    expected: 'ab', // No mapping found, truncated to 2 chars
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should return single character inputs as-is', () => {
            const testCases = [
                {
                    input: 'a',
                    expected: 'a',
                },
                {
                    input: 'z',
                    expected: 'z',
                },
                {
                    input: 'X',
                    expected: 'x', // Lowercased
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle exactly 2 character inputs', () => {
            const testCases = [
                {
                    input: 'ab',
                    expected: 'ab',
                },
                {
                    input: 'XY',
                    expected: 'xy', // Lowercased
                },
                {
                    input: 'zz',
                    expected: 'zz',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });
    });

    describe('Character stripping and normalization', () => {
        test('should remove all non-alphabetic characters before mapping', () => {
            const testCases = [
                {
                    input: 'U@n!t3d St@t3s',
                    expected: 'un', // 'U@n!t3d St@t3s' -> 'untdstts' -> 'un' (truncated, no exact match)
                },
                {
                    input: 'C4n4d4',
                    expected: 'cn', // 'C4n4d4' -> 'cnd' -> 'cn' (truncated, doesn't exactly match 'canada')
                },
                {
                    input: 'G3rm4ny',
                    expected: 'gr', // 'G3rm4ny' -> 'grmny' -> 'gr' (truncated, doesn't exactly match 'germany')
                },
                {
                    input: 'Fr4nc3',
                    expected: 'fr', // 'Fr4nc3' -> 'frnc' -> contains 'france' -> 'fr'
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle inputs with only special characters and numbers', () => {
            const testCases = [
                {
                    input: '123!!!',
                    expected: null, // No alphabetic characters, results in empty string
                },
                {
                    input: '!@#$%',
                    expected: null, // No alphabetic characters, results in empty string
                },
                {
                    input: '...',
                    expected: null, // No alphabetic characters, results in empty string
                },
                {
                    input: '555',
                    expected: null, // No alphabetic characters, results in empty string
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });
    });

    describe('Regex validation', () => {
        test('should return null for results that do not start with a letter', () => {
            const testCases = [
                {
                    input: '123',
                    expected: null, // '123' -> empty after removing non-alpha, fails regex
                },
                {
                    input: '12',
                    expected: null, // '12' -> empty after removing non-alpha, fails regex
                },
                {
                    input: '999',
                    expected: null, // '999' -> empty after removing non-alpha, fails regex
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle mixed alphanumeric inputs where letters come after numbers', () => {
            const testCases = [
                {
                    input: '123us',
                    expected: 'us', // '123us' -> 'us' after removing numbers, valid country code
                },
                {
                    input: '1ca',
                    expected: 'ca', // '1ca' -> 'ca' after removing numbers, valid country code
                },
                {
                    input: '9gb',
                    expected: 'gb', // '9gb' -> 'gb' after removing numbers, valid country code
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should return result for strings that start with a letter after processing', () => {
            const testCases = [
                {
                    input: 'us123',
                    expected: 'us', // 'us123' -> 'us' starts with letter, valid country code
                },
                {
                    input: 'ca1',
                    expected: 'ca', // 'ca1' -> 'ca' valid country code
                },
                {
                    input: 'gb9',
                    expected: 'gb', // 'gb9' -> 'gb' valid country code
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });
    });

    describe('Error handling', () => {
        test('should handle errors in normalizeTwoLetterAbbreviations gracefully', () => {
            // The error handling is already built into the function with try-catch
            // Testing some edge cases that might cause issues
            const testCases = [
                {
                    input: '\u0000\u0001\u0002', // Control characters
                    expected: null, // Should be stripped and result in empty string
                },
                {
                    input: String.fromCharCode(0), // Null character
                    expected: null, // Should be stripped and result in empty string
                },
            ];

            testCases.forEach(({ input, expected }) => {
                // Should not throw error, should handle gracefully
                expect(() => getNormalizedCountry(input)).not.toThrow();
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });
    });

    describe('Real-world country scenarios', () => {
        test('should handle common country input variations', () => {
            const testCases = [
                {
                    input: 'U.S.A.',
                    expected: 'us', // 'U.S.A.' -> 'usa' -> 'us'
                },
                {
                    input: 'U.K.',
                    expected: 'uk', // 'U.K.' -> 'uk' -> 'uk' (truncated, no exact match)
                },
                {
                    input: 'U.S.',
                    expected: 'us', // 'U.S.' -> 'us'
                },
                {
                    input: 'Can.',
                    expected: 'ca', // 'Can.' -> 'can' -> contains 'canada' -> 'ca'
                },
                {
                    input: 'Ger.',
                    expected: 'ge', // 'Ger.' -> 'ger' -> 'ge' (truncated)
                },
                {
                    input: 'Fr.',
                    expected: 'fr', // 'Fr.' -> 'fr'
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle countries in addresses and contexts', () => {
            const testCases = [
                {
                    input: 'UnitedStatesAmerica',
                    expected: 'us', // Contains 'unitedstates'
                },
                {
                    input: 'CanadaNorthAmerica',
                    expected: 'ca', // Contains 'canada'
                },
                {
                    input: 'GermanyEurope',
                    expected: 'de', // Contains 'germany'
                },
                {
                    input: 'Japan2024',
                    expected: 'jp', // Contains 'japan'
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle countries with various separators', () => {
            const testCases = [
                {
                    input: 'United_States',
                    expected: 'us',
                },
                {
                    input: 'United-States',
                    expected: 'us',
                },
                {
                    input: 'United.States',
                    expected: 'us',
                },
                {
                    input: 'United/States',
                    expected: 'us',
                },
                {
                    input: 'United|States',
                    expected: 'us',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });
    });

    describe('Type conversion handling', () => {
        test('should handle numeric inputs', () => {
            const testCases = [
                {
                    input: 12,
                    expected: null, // '12' -> empty after removing numbers, fails regex
                },
                {
                    input: 0,
                    expected: null, // '0' -> empty after removing numbers, fails regex
                },
                {
                    input: -45,
                    expected: null, // '-45' -> empty after removing numbers, fails regex
                },
                {
                    input: 3.14,
                    expected: null, // '3.14' -> empty after removing numbers, fails regex
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle boolean inputs', () => {
            const testCases = [
                {
                    input: true,
                    expected: 'tr', // 'true' -> 'true' -> 'tr' (truncated)
                },
                {
                    input: false,
                    expected: 'fa', // 'false' -> 'false' -> 'fa' (truncated)
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle object inputs', () => {
            const testCases = [
                {
                    input: {},
                    expected: 'ob', // '[object Object]' -> 'objectobject' -> 'ob' (truncated)
                },
                {
                    input: [],
                    expected: null, // Empty array stringifies to empty string
                },
                {
                    input: [1, 2, 3],
                    expected: null, // '1,2,3' -> empty after removing numbers, fails regex
                },
                {
                    input: { country: 'US' },
                    expected: 'ob', // '[object Object]' -> 'objectobject' -> 'ob' (truncated)
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });
    });

    describe('Performance and boundary conditions', () => {
        test('should handle very long inputs gracefully', () => {
            const veryLongCountry = 'UnitedStates' + 'x'.repeat(1000);
            const result = getNormalizedCountry(veryLongCountry);
            expect(result).toEqual('us'); // Should still find 'unitedstates' match

            const veryLongNonCountry = 'x'.repeat(1000);
            const resultNonCountry = getNormalizedCountry(veryLongNonCountry);
            expect(resultNonCountry).toEqual('xx'); // Truncated to 2 chars
        });

        test('should handle special Unicode characters', () => {
            const testCases = [
                {
                    input: 'Germánia', // With accent
                    expected: 'ge', // 'Germánia' -> 'germnia' -> 'ge' (truncated, doesn't exactly match 'germany')
                },
                {
                    input: 'Frânce', // With accent
                    expected: 'fr', // 'Frânce' -> 'france' -> 'fr'
                },
                {
                    input: 'Japão', // With accent (Portuguese for Japan)
                    expected: 'ja', // 'Japão' -> 'japo' -> 'ja' (truncated, doesn't exactly match 'japan')
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle edge cases with single and empty results', () => {
            const testCases = [
                {
                    input: 'a',
                    expected: 'a', // Single character, valid
                },
                {
                    input: '1',
                    expected: null, // Single number, stripped to empty
                },
                {
                    input: '@',
                    expected: null, // Single punctuation, stripped to empty
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });
    });

    describe('Comprehensive country coverage', () => {
        test('should handle various continent countries', () => {
            const testCases = [
                // Europe
                {
                    input: 'Switzerland',
                    expected: 'ch',
                },
                {
                    input: 'Netherlands',
                    expected: 'nl',
                },
                {
                    input: 'Sweden',
                    expected: 'se',
                },
                {
                    input: 'Norway',
                    expected: 'no',
                },
                // Asia
                {
                    input: 'Thailand',
                    expected: 'th',
                },
                {
                    input: 'Singapore',
                    expected: 'sg',
                },
                {
                    input: 'Malaysia',
                    expected: 'my',
                },
                {
                    input: 'Indonesia',
                    expected: 'id',
                },
                // Africa
                {
                    input: 'South Africa',
                    expected: 'za',
                },
                {
                    input: 'Nigeria',
                    expected: 'ng',
                },
                {
                    input: 'Egypt',
                    expected: 'eg',
                },
                {
                    input: 'Morocco',
                    expected: 'ma',
                },
                // Americas
                {
                    input: 'Mexico',
                    expected: 'mx',
                },
                {
                    input: 'Argentina',
                    expected: 'ar',
                },
                {
                    input: 'Chile',
                    expected: 'cl',
                },
                {
                    input: 'Colombia',
                    expected: 'co',
                },
                // Oceania
                {
                    input: 'New Zealand',
                    expected: 'nz',
                },
                {
                    input: 'Fiji',
                    expected: 'fj',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle special cases and territories', () => {
            const testCases = [
                {
                    input: 'Puerto Rico',
                    expected: 'pr',
                },
                {
                    input: 'Hong Kong',
                    expected: 'hk',
                },
                {
                    input: 'Macao',
                    expected: 'mo',
                },
                {
                    input: 'Guam',
                    expected: 'gu',
                },
                {
                    input: 'Virgin Islands US',
                    expected: 'vi',
                },
                {
                    input: 'Virgin Islands British',
                    expected: 'vg',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });

        test('should handle countries with complex official names', () => {
            const testCases = [
                {
                    input: 'Bolivia Plurinational State of',
                    expected: 'bo',
                },
                {
                    input: 'Bolivia',
                    expected: 'bo',
                },
                {
                    input: 'Congo the Democratic Republic of the',
                    expected: 'cd',
                },
                {
                    input: 'Democratic Republic of the Congo',
                    expected: 'cd',
                },
                {
                    input: 'Macedonia the former Yugoslav Republic of',
                    expected: 'mk',
                },
                {
                    input: 'Macedonia',
                    expected: 'mk',
                },
                {
                    input: 'Micronesia Federated States of',
                    expected: 'fm',
                },
                {
                    input: 'Micronesia',
                    expected: 'fm',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCountry(input)).toEqual(expected);
            });
        });
    });
});
