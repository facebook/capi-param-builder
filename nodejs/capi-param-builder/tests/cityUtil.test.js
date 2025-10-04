/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { getNormalizedCity } = require('../src/piiUtil/stringUtil');

describe('getNormalizedCity', () => {
    describe('Input validation', () => {
        test('should return null for null input', () => {
            expect(getNormalizedCity(null)).toBeNull();
        });

        test('should return null for undefined input', () => {
            expect(getNormalizedCity(undefined)).toBeNull();
        });

        test('should handle non-string input by converting to string', () => {
            const testCases = [
                {
                    input: 123,
                    expected: null, // '123' starts with a number, fails regex test
                },
                {
                    input: true,
                    expected: 'true', // String(true) = 'true'
                },
                {
                    input: false,
                    expected: 'false', // String(false) = 'false'
                },
                {
                    input: {},
                    expected: 'objectobject', // '[object Object]' -> 'objectObject' -> 'objectobject'
                },
                {
                    input: [],
                    expected: null, // String([]) = '', fails regex test
                },
                {
                    input: [1, 2, 3],
                    expected: null, // String([1,2,3]) = '1,2,3' -> '123', starts with number
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should return null for empty string input', () => {
            expect(getNormalizedCity('')).toBeNull();
        });

        test('should return null for whitespace-only input', () => {
            expect(getNormalizedCity('   ')).toBeNull();
            expect(getNormalizedCity('\t\n\r')).toBeNull();
            expect(getNormalizedCity('  \t  \n  \r  ')).toBeNull();
        });
    });

    describe('City normalization', () => {

        test('should normalize example data', () => {
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

        test('should normalize basic city names', () => {
            const testCases = [
                {
                    input: 'NewYork',
                    expected: 'newyork',
                },
                {
                    input: 'LONDON',
                    expected: 'london',
                },
                {
                    input: 'paris',
                    expected: 'paris',
                },
                {
                    input: 'Tokyo',
                    expected: 'tokyo',
                },
                {
                    input: 'Sydney',
                    expected: 'sydney',
                },
                {
                    input: 'Mumbai',
                    expected: 'mumbai',
                },
                {
                    input: 'Berlin',
                    expected: 'berlin',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should handle mixed case city names', () => {
            const testCases = [
                {
                    input: 'NeW yOrK',
                    expected: 'newyork',
                },
                {
                    input: 'sAn FrAnCiScO',
                    expected: 'sanfrancisco',
                },
                {
                    input: 'lOs AnGeLes',
                    expected: 'losangeles',
                },
                {
                    input: 'ChIcAgO',
                    expected: 'chicago',
                },
                {
                    input: 'PHILADELPHIA',
                    expected: 'philadelphia',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should remove all non-Latin alphanumeric characters', () => {
            const testCases = [
                {
                    input: 'New York',
                    expected: 'newyork', // Space removed
                },
                {
                    input: 'San Francisco',
                    expected: 'sanfrancisco', // Space removed
                },
                {
                    input: 'St. Louis',
                    expected: 'stlouis', // Period and space removed
                },
                {
                    input: 'Miami-Dade',
                    expected: 'miamidade', // Hyphen removed
                },
                {
                    input: "O'Fallon",
                    expected: 'ofallon', // Apostrophe removed
                },
                {
                    input: 'Winston-Salem',
                    expected: 'winstonsalem', // Hyphen removed
                },
                {
                    input: 'Wilkes-Barre',
                    expected: 'wilkesbarre', // Hyphen removed
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should handle cities with various punctuation', () => {
            const testCases = [
                {
                    input: 'St. Paul',
                    expected: 'stpaul',
                },
                {
                    input: 'Coeur d\'Alene',
                    expected: 'coeurdalene',
                },
                {
                    input: 'Santa Fe, NM',
                    expected: 'santafenm',
                },
                {
                    input: 'Miami (Beach)',
                    expected: 'miamibeach',
                },
                {
                    input: 'New York, NY',
                    expected: 'newyorkny',
                },
                {
                    input: 'San José',
                    expected: 'sanjos', // Accent removed by all_non_latin_alpha_numeric
                },
                {
                    input: 'Montréal',
                    expected: 'montral', // Accent removed by all_non_latin_alpha_numeric
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should handle cities with numbers', () => {
            const testCases = [
                {
                    input: 'Los Angeles 90210',
                    expected: 'losangeles90210',
                },
                {
                    input: 'Dallas75201',
                    expected: 'dallas75201',
                },
                {
                    input: 'Houston 77001',
                    expected: 'houston77001',
                },
                {
                    input: 'Chicago60601',
                    expected: 'chicago60601',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should strip international characters (all_non_latin_alpha_numeric behavior)', () => {
            const testCases = [
                {
                    input: 'São Paulo',
                    expected: 'sopaulo', // Accented characters removed
                },
                {
                    input: 'México City',
                    expected: 'mxicocity', // Accented characters removed
                },
                {
                    input: 'Zürich',
                    expected: 'zrich', // Umlaut removed
                },
                {
                    input: 'København',
                    expected: 'kbenhavn', // Special characters removed
                },
                {
                    input: 'Москва',
                    expected: null, // All Cyrillic characters removed, empty string fails regex
                },
                {
                    input: '北京',
                    expected: null, // All Chinese characters removed, empty string fails regex
                },
                {
                    input: 'القاهرة',
                    expected: null, // All Arabic characters removed, empty string fails regex
                },
                {
                    input: 'Αθήνα',
                    expected: null, // All Greek characters removed, empty string fails regex
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });
    });

    describe('Hashed city handling', () => {
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
                const result = getNormalizedCity(hash);
                expect(result).toEqual(hash);
            });
        });

        test('should process invalid hash-like strings based on regex test', () => {
            const testCases = [
                {
                    input: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
                    expected: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae',
                },
                {
                    input: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars
                    expected: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33',
                },
                {
                    input: 'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'g'
                    expected: 'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
                },
                {
                    input: '123', // too short, starts with number
                    expected: null, // Fails regex test ^[a-z]+
                },
                {
                    input: 'z665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'z'
                    expected: 'z665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedCity(input);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('Regex test validation', () => {
        test('should return null for strings that do not start with a letter', () => {
            const testCases = [
                {
                    input: '123Angeles',
                    expected: null, // Starts with number
                },
                {
                    input: '1NewYork',
                    expected: null, // Starts with number
                },
                {
                    input: '9London',
                    expected: null, // Starts with number
                },
                {
                    input: '0Tokyo',
                    expected: null, // Starts with number
                },
                {
                    input: '555',
                    expected: null, // All numbers
                },
                {
                    input: '007',
                    expected: null, // Starts with number
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should return city name for strings that start with a letter', () => {
            const testCases = [
                {
                    input: 'angeles123',
                    expected: 'angeles123',
                },
                {
                    input: 'newyork1',
                    expected: 'newyork1',
                },
                {
                    input: 'london999',
                    expected: 'london999',
                },
                {
                    input: 'tokyo0',
                    expected: 'tokyo0',
                },
                {
                    input: 'a1b2c3',
                    expected: 'a1b2c3',
                },
                {
                    input: 'city007',
                    expected: 'city007',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should handle edge cases with the regex test', () => {
            const testCases = [
                {
                    input: 'a',
                    expected: 'a', // Single letter
                },
                {
                    input: 'z',
                    expected: 'z', // Single letter
                },
                {
                    input: 'A',
                    expected: 'a', // Single uppercase letter
                },
                {
                    input: 'Z',
                    expected: 'z', // Single uppercase letter
                },
                {
                    input: 'ab',
                    expected: 'ab', // Two letters
                },
                {
                    input: 'a1',
                    expected: 'a1', // Letter followed by number
                },
                {
                    input: '1a',
                    expected: null, // Number followed by letter (fails regex)
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });
    });

    describe('Complex city names and edge cases', () => {
        test('should handle cities with special characters and punctuation', () => {
            const testCases = [
                {
                    input: '!@#$%^&*()NewYork',
                    expected: 'newyork',
                },
                {
                    input: 'Los-Angeles!!!',
                    expected: 'losangeles',
                },
                {
                    input: 'San Francisco???',
                    expected: 'sanfrancisco',
                },
                {
                    input: 'Miami...Beach',
                    expected: 'miamibeach',
                },
                {
                    input: 'Seattle@Washington',
                    expected: 'seattlewashington',
                },
                {
                    input: 'Boston#MA',
                    expected: 'bostonma',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should handle cities with only special characters and numbers', () => {
            const testCases = [
                {
                    input: '123!!!',
                    expected: null, // Starts with number
                },
                {
                    input: '!@#$%',
                    expected: null, // No alphanumeric characters
                },
                {
                    input: '...',
                    expected: null, // Only punctuation
                },
                {
                    input: '---',
                    expected: null, // Only punctuation
                },
                {
                    input: '   ',
                    expected: null, // Only whitespace
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should handle very long city names', () => {
            const longCityName = 'A'.repeat(100);
            const result = getNormalizedCity(longCityName);
            expect(result).toEqual('a'.repeat(100));

            const longCityWithPunctuation = 'A-'.repeat(50);
            const resultWithPunctuation = getNormalizedCity(longCityWithPunctuation);
            expect(resultWithPunctuation).toEqual('a'.repeat(50)); // Hyphens removed
        });

        test('should handle cities with Unicode whitespace and special characters', () => {
            const testCases = [
                {
                    input: 'New\u00A0York', // Non-breaking space
                    expected: 'newyork', // Non-breaking space should be removed
                },
                {
                    input: 'San\u2013Francisco', // En dash (U+2013)
                    expected: 'sanfrancisco', // En dash removed by all_non_latin_alpha_numeric
                },
                {
                    input: 'Los\u2014Angeles', // Em dash (U+2014)
                    expected: 'losangeles', // Em dash removed by all_non_latin_alpha_numeric
                },
                {
                    input: 'México\u00A0City', // Non-breaking space with accented chars
                    expected: 'mxicocity', // Non-breaking space and accents removed
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should handle cities with emojis and special Unicode characters', () => {
            const testCases = [
                {
                    input: 'New😀York',
                    expected: 'newyork', // Emoji removed by all_non_latin_alpha_numeric
                },
                {
                    input: 'San👋Francisco',
                    expected: 'sanfrancisco', // Emoji removed by all_non_latin_alpha_numeric
                },
                {
                    input: 'Los🎉Angeles',
                    expected: 'losangeles', // Emoji removed by all_non_latin_alpha_numeric
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });
    });

    describe('Real-world city scenarios', () => {
        test('should handle common US cities', () => {
            const usCities = [
                'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
                'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'
            ];

            usCities.forEach((city) => {
                const normalized = city.toLowerCase().replace(/\s+/g, '');
                expect(getNormalizedCity(city)).toEqual(normalized);
                expect(getNormalizedCity(city.toUpperCase())).toEqual(normalized);
                expect(getNormalizedCity(`  ${city}  `)).toEqual(normalized);
            });
        });

        test('should handle common international cities', () => {
            const internationalCities = [
                'London', 'Paris', 'Tokyo', 'Sydney', 'Mumbai',
                'Berlin', 'Madrid', 'Rome', 'Amsterdam', 'Vienna'
            ];

            internationalCities.forEach((city) => {
                const normalized = city.toLowerCase();
                expect(getNormalizedCity(city)).toEqual(normalized);
                expect(getNormalizedCity(city.toUpperCase())).toEqual(normalized);
                expect(getNormalizedCity(`  ${city}  `)).toEqual(normalized);
            });
        });

        test('should handle hyphenated city names', () => {
            const hyphenatedCities = [
                'Winston-Salem', 'Wilkes-Barre', 'Scranton-Wilkes-Barre',
                'Miami-Dade', 'Anne-Arundel', 'Saint-Denis'
            ];

            hyphenatedCities.forEach((city) => {
                const expected = city.toLowerCase().replace(/-/g, '');
                expect(getNormalizedCity(city)).toEqual(expected);
            });
        });

        test('should handle cities with apostrophes', () => {
            const testCases = [
                {
                    input: "O'Fallon",
                    expected: 'ofallon', // Apostrophe removed
                },
                {
                    input: "Coeur d'Alene",
                    expected: 'coeurdalene', // Apostrophe and space removed
                },
                {
                    input: "L'Anse",
                    expected: 'lanse', // Apostrophe removed
                },
                {
                    input: "D'Iberville",
                    expected: 'diberville', // Apostrophe removed
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should handle cities with periods and abbreviations', () => {
            const testCases = [
                {
                    input: 'St. Louis',
                    expected: 'stlouis',
                },
                {
                    input: 'St. Paul',
                    expected: 'stpaul',
                },
                {
                    input: 'Mt. Vernon',
                    expected: 'mtvernon',
                },
                {
                    input: 'Ft. Lauderdale',
                    expected: 'ftlauderdale',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });
    });

    describe('Type conversion handling', () => {
        test('should handle numeric inputs that fail regex test', () => {
            const testCases = [
                {
                    input: 123,
                    expected: null, // '123' starts with number, fails regex
                },
                {
                    input: 0,
                    expected: null, // '0' starts with number, fails regex
                },
                {
                    input: -456,
                    expected: null, // '-456' -> '456' starts with number, fails regex
                },
                {
                    input: 12.34,
                    expected: null, // '12.34' -> '1234' starts with number, fails regex
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should handle boolean inputs', () => {
            const testCases = [
                {
                    input: true,
                    expected: 'true', // Starts with 't', passes regex
                },
                {
                    input: false,
                    expected: 'false', // Starts with 'f', passes regex
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should handle object inputs', () => {
            const testCases = [
                {
                    input: {},
                    expected: 'objectobject', // '[object Object]' -> 'objectobject' starts with 'o'
                },
                {
                    input: [],
                    expected: null, // Empty array stringifies to empty string, fails regex
                },
                {
                    input: [1, 2, 3],
                    expected: null, // '1,2,3' -> '123' starts with number, fails regex
                },
                {
                    input: { name: 'City' },
                    expected: 'objectobject', // '[object Object]' -> 'objectobject' starts with 'o'
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });
    });

    describe('Performance and boundary conditions', () => {
        test('should handle very long invalid inputs gracefully', () => {
            const veryLongPunctuation = '!'.repeat(1000);
            const result = getNormalizedCity(veryLongPunctuation);
            expect(result).toBeNull();

            const veryLongValidStartingWithLetter = 'a' + '!'.repeat(999);
            const resultValid = getNormalizedCity(veryLongValidStartingWithLetter);
            expect(resultValid).toEqual('a');
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
                '::::::::',
                ';;;;;;;;',
                '<<<<<<<<',
                '>>>>>>>>',
                '~~~~~~~~',
            ];

            specialOnlyInputs.forEach((input) => {
                const result = getNormalizedCity(input);
                expect(result).toBeNull();
            });
        });

        test('should handle mixed special characters and valid characters', () => {
            const testCases = [
                {
                    input: '!N@e#w$Y%o^r&k*',
                    expected: 'newyork',
                },
                {
                    input: '***L***o***s***A***n***g***e***l***e***s***',
                    expected: 'losangeles',
                },
                {
                    input: '...C.h.i.c.a.g.o...',
                    expected: 'chicago',
                },
                {
                    input: '---H-o-u-s-t-o-n---',
                    expected: 'houston',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });

        test('should handle single and two character inputs', () => {
            const testCases = [
                {
                    input: 'A',
                    expected: 'a',
                },
                {
                    input: 'Z',
                    expected: 'z',
                },
                {
                    input: '1',
                    expected: null, // Starts with number
                },
                {
                    input: '@',
                    expected: null, // No alphanumeric characters left
                },
                {
                    input: ' ',
                    expected: null, // Whitespace only
                },
                {
                    input: 'AB',
                    expected: 'ab',
                },
                {
                    input: 'A-',
                    expected: 'a',
                },
                {
                    input: '-A',
                    expected: 'a',
                },
                {
                    input: '12',
                    expected: null, // Starts with number
                },
                {
                    input: 'A1',
                    expected: 'a1',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedCity(input)).toEqual(expected);
            });
        });
    });
});
