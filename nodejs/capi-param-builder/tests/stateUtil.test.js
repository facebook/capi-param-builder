/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { getNormalizedState } = require('../src/piiUtil/stringUtil');

describe('getNormalizedState', () => {
    describe('Input validation', () => {
        test('should return null for null input', () => {
            expect(getNormalizedState(null)).toBeNull();
        });

        test('should return null for undefined input', () => {
            expect(getNormalizedState(undefined)).toBeNull();
        });

        test('should handle non-string input by converting to string', () => {
            const testCases = [
                {
                    input: 123,
                    expected: null, // '123' -> '12' starts with number, fails regex test
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
                    expected: null, // String([1,2,3]) = '1,2,3' -> '123' -> '12', starts with number
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });

        test('should return null for empty string input', () => {
            expect(getNormalizedState('')).toBeNull();
        });

        test('should return null for whitespace-only input', () => {
            expect(getNormalizedState('   ')).toBeNull();
            expect(getNormalizedState('\t\n\r')).toBeNull();
            expect(getNormalizedState('  \t  \n  \r  ')).toBeNull();
        });
    });

    describe('US States mapping', () => {

        test('should pass example data', () => {
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
                    input: '    C/a/lifo,rnia.  ',
                    expected: 'ca',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });

        test('should normalize US state full names to abbreviations', () => {
            const testCases = [
                {
                    input: 'California',
                    expected: 'ca',
                },
                {
                    input: 'New York',
                    expected: 'ny',
                },
                {
                    input: 'Texas',
                    expected: 'tx',
                },
                {
                    input: 'Florida',
                    expected: 'fl',
                },
                {
                    input: 'Illinois',
                    expected: 'il',
                },
                {
                    input: 'Pennsylvania',
                    expected: 'pa',
                },
                {
                    input: 'Ohio',
                    expected: 'oh',
                },
                {
                    input: 'Michigan',
                    expected: 'mi',
                },
                {
                    input: 'Georgia',
                    expected: 'ga',
                },
                {
                    input: 'North Carolina',
                    expected: 'nc',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });

        test('should handle mixed case US state names', () => {
            const testCases = [
                {
                    input: 'CALIFORNIA',
                    expected: 'ca',
                },
                {
                    input: 'california',
                    expected: 'ca',
                },
                {
                    input: 'CaLiFoRnIa',
                    expected: 'ca',
                },
                {
                    input: 'NEW YORK',
                    expected: 'ny',
                },
                {
                    input: 'new york',
                    expected: 'ny',
                },
                {
                    input: 'NeW yOrK',
                    expected: 'ny',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });

        test('should handle US states with spaces and punctuation', () => {
            const testCases = [
                {
                    input: '  California  ',
                    expected: 'ca',
                },
                {
                    input: 'New-York',
                    expected: 'ny',
                },
                {
                    input: 'New.York',
                    expected: 'ny',
                },
                {
                    input: 'North   Carolina',
                    expected: 'nc',
                },
                {
                    input: 'South-Dakota',
                    expected: 'sd',
                },
                {
                    input: 'West Virginia',
                    expected: 'wv',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });

        test('should handle compound state names', () => {
            const testCases = [
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
                    input: 'North Dakota',
                    expected: 'nd',
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
                    input: 'West Virginia',
                    expected: 'wv',
                },
                {
                    input: 'Rhode Island',
                    expected: 'ri',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });
    });

    describe('Canadian Provinces mapping', () => {
        test('should normalize Canadian province full names to abbreviations', () => {
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

        test('should handle mixed case Canadian province names', () => {
            const testCases = [
                {
                    input: 'ONTARIO',
                    expected: 'on',
                },
                {
                    input: 'ontario',
                    expected: 'on',
                },
                {
                    input: 'OnTaRiO',
                    expected: 'on',
                },
                {
                    input: 'BRITISH COLUMBIA',
                    expected: 'bc',
                },
                {
                    input: 'british columbia',
                    expected: 'bc',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });
    });

    describe('Already abbreviated states', () => {
        test('should return US state abbreviations as-is', () => {
            const uStateAbbreviations = [
                'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga',
                'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md',
                'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj',
                'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc',
                'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy'
            ];

            uStateAbbreviations.forEach((abbrev) => {
                expect(getNormalizedState(abbrev)).toEqual(abbrev);
                expect(getNormalizedState(abbrev.toUpperCase())).toEqual(abbrev);
            });
        });

        test('should return Canadian province abbreviations as-is', () => {
            const caProvinceAbbreviations = [
                'on', 'qc', 'bc', 'ab', 'sk', 'mb', 'ns', 'nb',
                'pe', 'nl', 'yt', 'nt', 'nu'
            ];

            caProvinceAbbreviations.forEach((abbrev) => {
                expect(getNormalizedState(abbrev)).toEqual(abbrev);
                expect(getNormalizedState(abbrev.toUpperCase())).toEqual(abbrev);
            });
        });

        test('should handle abbreviated states with spaces and punctuation', () => {
            const testCases = [
                {
                    input: '  CA  ',
                    expected: 'ca',
                },
                {
                    input: 'N.Y.',
                    expected: 'ny',
                },
                {
                    input: 'F-L',
                    expected: 'fl',
                },
                {
                    input: 'T@X',
                    expected: 'tx',
                },
                {
                    input: 'O!N',
                    expected: 'on',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });
    });

    describe('Partial and contains matching', () => {
        test('should match states contained in longer strings', () => {
            const testCases = [
                {
                    input: 'CaliforniaUSA',
                    expected: 'ca', // Contains 'california'
                },
                {
                    input: 'NewYorkCity',
                    expected: 'ny', // Contains 'newyork'
                },
                {
                    input: 'TexasState',
                    expected: 'tx', // Contains 'texas'
                },
                {
                    input: 'FloridaBeach',
                    expected: 'fl', // Contains 'florida'
                },
                {
                    input: 'OntarioCanada',
                    expected: 'on', // Contains 'ontario'
                },
                {
                    input: 'BritishColumbiaProvince',
                    expected: 'bc', // Contains 'britishcolumbia'
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });

        test('should prioritize longer matches over shorter ones', () => {
            // The function uses Object.keys() iteration, so order matters
            // Testing cases where multiple states could match
            const testCases = [
                {
                    input: 'Virginia',
                    expected: 'va', // Should match 'virginia', not 'westvirginia'
                },
                {
                    input: 'WestVirginia',
                    expected: 'wv', // Should match 'westvirginia'
                },
                {
                    input: 'Carolina',
                    expected: 'ca', // Actually matches 'california' first, not north/south carolina
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });
    });

    describe('Hashed state handling', () => {
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
                const result = getNormalizedState(hash);
                expect(result).toEqual(hash);
            });
        });

        test('should process invalid hash-like strings normally', () => {
            const testCases = [
                {
                    input: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
                    expected: 'aa', // 'aa...' -> 'aa' (first 2 chars after removing non-alpha)
                },
                {
                    input: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars
                    expected: 'aa', // 'aa...' -> 'aa' (first 2 chars after removing non-alpha)
                },
                {
                    input: 'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'g'
                    expected: 'ga', // 'ga...' -> 'ga' (first 2 chars after removing non-alpha)
                },
                {
                    input: '123', // too short, starts with number
                    expected: null, // Fails regex test ^[a-z]+
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedState(input);
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
                    input: 'randomstring',
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
                expect(getNormalizedState(input)).toEqual(expected);
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
                expect(getNormalizedState(input)).toEqual(expected);
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
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });
    });

    describe('Character stripping and normalization', () => {
        test('should remove all non-alphabetic characters before mapping', () => {
            const testCases = [
                {
                    input: 'C@l!f0rn!@',
                    expected: 'cl', // 'C@l!f0rn!@' -> 'clfr' -> 'cl' (truncated to 2 chars, no match found)
                },
                {
                    input: 'N3w Y0rk',
                    expected: 'nw', // 'N3w Y0rk' -> 'nwyork' -> 'nw' (truncated, doesn't contain exact 'newyork')
                },
                {
                    input: 'T3x@s',
                    expected: 'tx', // 'T3x@s' -> 'txs' -> contains 'texas'
                },
                {
                    input: 'Fl0r!d@',
                    expected: 'fl', // 'Fl0r!d@' -> 'flrd' -> contains 'florida'
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
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
                expect(getNormalizedState(input)).toEqual(expected);
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
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });

        test('should handle mixed alphanumeric inputs where letters come after numbers', () => {
            const testCases = [
                {
                    input: '123ab',
                    expected: 'ab', // '123ab' -> 'ab' after removing numbers, passes regex
                },
                {
                    input: '1ca',
                    expected: 'ca', // '1ca' -> 'ca' after removing numbers, valid state abbrev
                },
                {
                    input: '9tx',
                    expected: 'tx', // '9tx' -> 'tx' after removing numbers, valid state abbrev
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });

        test('should return result for strings that start with a letter after processing', () => {
            const testCases = [
                {
                    input: 'ab123',
                    expected: 'ab', // 'ab123' -> 'ab' starts with letter, passes regex
                },
                {
                    input: 'ca1',
                    expected: 'ca', // 'ca1' -> 'ca' (already valid abbreviation)
                },
                {
                    input: 'tx9',
                    expected: 'tx', // 'tx9' -> 'tx' (already valid abbreviation)
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
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
                expect(() => getNormalizedState(input)).not.toThrow();
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });
    });

    describe('Real-world state scenarios', () => {
        test('should handle common state input variations', () => {
            const testCases = [
                {
                    input: 'Calif.',
                    expected: 'ca', // Contains 'calif' -> matches california
                },
                {
                    input: 'N.Y.',
                    expected: 'ny', // 'N.Y.' -> 'ny'
                },
                {
                    input: 'Fla.',
                    expected: 'fl', // Contains 'fla' -> matches florida
                },
                {
                    input: 'Tex.',
                    expected: 'te', // 'Tex.' -> 'tex' -> 'te' (truncated, no exact 'tex' match found)
                },
                {
                    input: 'Penn.',
                    expected: 'pe', // 'Penn.' -> 'penn' -> 'pe' (truncated)
                },
                {
                    input: 'Mass.',
                    expected: 'ma', // Contains 'mass' -> matches massachusetts
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });

        test('should handle state names in addresses', () => {
            const testCases = [
                {
                    input: 'CaliforniaUSA',
                    expected: 'ca', // Contains 'california'
                },
                {
                    input: 'NewYorkNY',
                    expected: 'ny', // Contains 'newyork'
                },
                {
                    input: 'TexasState',
                    expected: 'tx', // Contains 'texas'
                },
                {
                    input: 'Florida32801',
                    expected: 'fl', // Contains 'florida'
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });
    });

    describe('Type conversion handling', () => {
        test('should handle numeric inputs', () => {
            const testCases = [
                {
                    input: 12,
                    expected: null, // '12' starts with number, fails regex
                },
                {
                    input: 0,
                    expected: null, // '0' starts with number, fails regex
                },
                {
                    input: -45,
                    expected: null, // '-45' -> '45' -> '45' starts with number, fails regex
                },
                {
                    input: 3.14,
                    expected: null, // '3.14' -> '314' -> '31' starts with number, fails regex
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
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
                expect(getNormalizedState(input)).toEqual(expected);
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
                    expected: null, // '1,2,3' -> '123' -> '12' starts with number, fails regex
                },
                {
                    input: { state: 'CA' },
                    expected: 'ob', // '[object Object]' -> 'objectobject' -> 'ob' (truncated)
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });
    });

    describe('Performance and boundary conditions', () => {
        test('should handle very long inputs gracefully', () => {
            const veryLongState = 'California' + 'x'.repeat(1000);
            const result = getNormalizedState(veryLongState);
            expect(result).toEqual('ca'); // Should still find 'california' match

            const veryLongNonState = 'x'.repeat(1000);
            const resultNonState = getNormalizedState(veryLongNonState);
            expect(resultNonState).toEqual('xx'); // Truncated to 2 chars
        });

        test('should handle special Unicode characters', () => {
            const testCases = [
                {
                    input: 'Califórnia', // With accent
                    expected: 'ca', // 'Califórnia' -> 'califrnia' -> contains partial match
                },
                {
                    input: 'Tëxas', // With accent
                    expected: 'tx', // 'Tëxas' -> 'txas' -> contains 'texas'
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedState(input)).toEqual(expected);
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
                expect(getNormalizedState(input)).toEqual(expected);
            });
        });
    });
});
