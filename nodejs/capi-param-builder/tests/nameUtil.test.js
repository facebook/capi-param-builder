/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { getNormalizedName } = require('../src/piiUtil/stringUtil');

describe('getNormalizedName', () => {
    describe('Input validation', () => {
        test('should return null for null input', () => {
            expect(getNormalizedName(null)).toBeNull();
        });

        test('should return null for undefined input', () => {
            expect(getNormalizedName(undefined)).toBeNull();
        });

        test('should handle non-string input by converting to string', () => {
            const testCases = [
                {
                    input: 123,
                    expected: '123', // String(123) = '123'
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
                    expected: 'objectobject', // String({}) = '[object Object]', stripped = 'objectobject'
                },
                {
                    input: [],
                    expected: '', // String([]) = '', stripped = ''
                },
                {
                    input: [1, 2, 3],
                    expected: '123', // String([1,2,3]) = '1,2,3', stripped = '123'
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should return empty string for empty string input', () => {
            expect(getNormalizedName('')).toEqual('');
        });

        test('should return empty string for whitespace-only input', () => {
            expect(getNormalizedName('   ')).toEqual('');
            expect(getNormalizedName('\t\n\r')).toEqual('');
            expect(getNormalizedName('  \t  \n  \r  ')).toEqual('');
        });
    });

    describe('Name normalization', () => {
        test('should normalize basic names', () => {
            const testCases = [
                {
                    input: 'John',
                    expected: 'john',
                },
                {
                    input: 'JANE',
                    expected: 'jane',
                },
                {
                    input: 'Smith',
                    expected: 'smith',
                },
                {
                    input: 'Maria',
                    expected: 'maria',
                },
                {
                    input: 'Jose',
                    expected: 'jose',
                },
                {
                    input: 'Michael',
                    expected: 'michael',
                },
                {
                    input: 'Sarah',
                    expected: 'sarah',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should handle mixed case names', () => {
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
                    input: 'DaViD',
                    expected: 'david',
                },
                {
                    input: 'ELIZABETH',
                    expected: 'elizabeth',
                },
                {
                    input: 'christopher',
                    expected: 'christopher',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should remove whitespace from names', () => {
            const testCases = [
                {
                    input: '  John  ',
                    expected: 'john',
                },
                {
                    input: '\tMary\n',
                    expected: 'mary',
                },
                {
                    input: ' David ',
                    expected: 'david',
                },
                {
                    input: '\r\nSarah\t',
                    expected: 'sarah',
                },
                {
                    input: 'John Smith',
                    expected: 'johnsmith', // Space is removed
                },
                {
                    input: 'Mary Jane',
                    expected: 'maryjane', // Space is removed
                },
                {
                    input: '  John   Smith  ',
                    expected: 'johnsmith', // Multiple spaces and leading/trailing removed
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should remove punctuation from names', () => {
            const testCases = [
                {
                    input: "O'Connor",
                    expected: 'oconnor', // Apostrophe removed
                },
                {
                    input: 'Smith-Jones',
                    expected: 'smithjones', // Hyphen removed
                },
                {
                    input: 'Mary-Jane',
                    expected: 'maryjane', // Hyphen removed
                },
                {
                    input: 'Jean-Luc',
                    expected: 'jeanluc', // Hyphen removed
                },
                {
                    input: "D'Angelo",
                    expected: 'dangelo', // Apostrophe removed
                },
                {
                    input: 'O\'Brien',
                    expected: 'obrien', // Apostrophe removed
                },
                {
                    input: 'Van Der Berg',
                    expected: 'vanderberg', // Spaces removed
                },
                {
                    input: 'St. John',
                    expected: 'stjohn', // Period and space removed
                },
                {
                    input: 'Mary, Jane',
                    expected: 'maryjane', // Comma and space removed
                },
                {
                    input: 'John (Johnny)',
                    expected: 'johnjohnny', // Parentheses and space removed
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should handle names with various punctuation and special characters', () => {
            const testCases = [
                {
                    input: 'John!',
                    expected: 'john',
                },
                {
                    input: 'Mary@gmail',
                    expected: 'marygmail',
                },
                {
                    input: 'David#123',
                    expected: 'david123',
                },
                {
                    input: 'Sarah$',
                    expected: 'sarah',
                },
                {
                    input: 'John%',
                    expected: 'john',
                },
                {
                    input: 'Mary^',
                    expected: 'mary',
                },
                {
                    input: 'David&Co',
                    expected: 'davidco',
                },
                {
                    input: 'Sarah*',
                    expected: 'sarah',
                },
                {
                    input: 'John+',
                    expected: 'john',
                },
                {
                    input: 'Mary=',
                    expected: 'mary',
                },
                {
                    input: 'David?',
                    expected: 'david',
                },
                {
                    input: 'Sarah|',
                    expected: 'sarah',
                },
                {
                    input: 'John\\',
                    expected: 'john',
                },
                {
                    input: 'Mary/',
                    expected: 'mary',
                },
                {
                    input: 'David:',
                    expected: 'david',
                },
                {
                    input: 'Sarah;',
                    expected: 'sarah',
                },
                {
                    input: 'John<',
                    expected: 'john',
                },
                {
                    input: 'Mary>',
                    expected: 'mary',
                },
                {
                    input: 'David[',
                    expected: 'david',
                },
                {
                    input: 'Sarah]',
                    expected: 'sarah',
                },
                {
                    input: 'John{',
                    expected: 'john',
                },
                {
                    input: 'Mary}',
                    expected: 'mary',
                },
                {
                    input: 'David`',
                    expected: 'david',
                },
                {
                    input: 'Sarah~',
                    expected: 'sarah',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should handle names with numbers', () => {
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
                    input: '123David',
                    expected: '123david',
                },
                {
                    input: 'Sarah456Smith',
                    expected: 'sarah456smith',
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

        test('should handle complex names with multiple punctuation and whitespace', () => {
            const testCases = [
                {
                    input: "  Mary-Jane  O'Connor  ",
                    expected: 'maryjaneoconnor', // Apostrophe is removed by punctuation stripping
                },
                {
                    input: '\tJohn   Smith-Jones\n',
                    expected: 'johnsmithjones',
                },
                {
                    input: "Jean-Luc  D'Angelo",
                    expected: 'jeanlucdangelo',
                },
                {
                    input: 'St. Mary, Jr.',
                    expected: 'stmaryjr',
                },
                {
                    input: 'Van Der Berg, III',
                    expected: 'vanderbergiii',
                },
                {
                    input: 'José María González',
                    expected: 'josémaríagonzález', // Non-ASCII characters preserved
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should preserve non-Latin characters', () => {
            const testCases = [
                {
                    input: 'José',
                    expected: 'josé',
                },
                {
                    input: 'María',
                    expected: 'maría',
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
                    input: 'Øystein',
                    expected: 'øystein',
                },
                {
                    input: 'Αντωνίου',
                    expected: 'αντωνίου',
                },
                {
                    input: '李明',
                    expected: '李明',
                },
                {
                    input: 'محمد',
                    expected: 'محمد',
                },
                {
                    input: 'Владимир',
                    expected: 'владимир',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should handle very long names', () => {
            const longName = 'A'.repeat(100);
            const result = getNormalizedName(longName);
            expect(result).toEqual('a'.repeat(100));

            const longNameWithPunctuation = 'A-'.repeat(50);
            const resultWithPunctuation = getNormalizedName(longNameWithPunctuation);
            expect(resultWithPunctuation).toEqual('a'.repeat(50)); // Hyphens removed
        });
    });

    describe('Hashed name handling', () => {
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
                const result = getNormalizedName(hash);
                expect(result).toEqual(hash);
            });
        });

        test('should process invalid hash-like strings as regular names', () => {
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
                    input: 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE!', // invalid char '!'
                    expected: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // ! is punctuation, removed
                },
                {
                    input: '123', // too short
                    expected: '123',
                },
                {
                    input: 'z665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'z'
                    expected: 'z665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
                },
                {
                    input: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27a 3', // space in middle
                    expected: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27a3', // space removed
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedName(input);
                expect(result).toEqual(expected);
            });
        });

        test('should handle mixed case hashed names', () => {
            const mixedCaseHash =
                'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
            const result = getNormalizedName(mixedCaseHash);
            expect(result).toEqual(mixedCaseHash);
        });

        test('should handle lowercase hashed names', () => {
            const lowercaseHash =
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
            const result = getNormalizedName(lowercaseHash);
            expect(result).toEqual(lowercaseHash);
        });
    });

    describe('Edge cases', () => {
        test('should handle names with only punctuation', () => {
            const testCases = [
                {
                    input: '!!!',
                    expected: '',
                },
                {
                    input: '---',
                    expected: '',
                },
                {
                    input: '...',
                    expected: '',
                },
                {
                    input: '@@@',
                    expected: '',
                },
                {
                    input: '###',
                    expected: '',
                },
                {
                    input: '***',
                    expected: '',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should handle names with mixed punctuation and valid characters', () => {
            const testCases = [
                {
                    input: '!@#John$%^',
                    expected: 'john',
                },
                {
                    input: '***Mary***',
                    expected: 'mary',
                },
                {
                    input: '...David...',
                    expected: 'david',
                },
                {
                    input: '---Sarah---',
                    expected: 'sarah',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should handle names that are only numbers', () => {
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
                    input: '999',
                    expected: '999',
                },
                {
                    input: '123456789',
                    expected: '123456789',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should handle Unicode whitespace and punctuation', () => {
            const testCases = [
                {
                    input: 'John\u00A0Smith', // Non-breaking space
                    expected: 'johnsmith', // Non-breaking space should be removed
                },
                {
                    input: 'Mary\u2013Jane', // En dash (U+2013)
                    expected: 'mary–jane', // En dash is not in the punctuation regex, so it's preserved
                },
                {
                    input: 'David\u2014Sarah', // Em dash (U+2014)
                    expected: 'david—sarah', // Em dash is not in the punctuation regex, so it's preserved
                },
                {
                    input: 'José\u00A0María', // Non-breaking space with accented chars
                    expected: 'josémaría', // Non-breaking space should be removed
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should handle names with emoji and special Unicode characters', () => {
            const testCases = [
                {
                    input: 'John😀',
                    expected: 'john😀', // Emoji preserved (not in punctuation regex)
                },
                {
                    input: 'Mary👋Smith',
                    expected: 'mary👋smith', // Emoji preserved
                },
                {
                    input: 'David🎉',
                    expected: 'david🎉', // Emoji preserved
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });
    });

    describe('Boundary conditions', () => {
        test('should handle single character names', () => {
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
                    expected: '1',
                },
                {
                    input: '@',
                    expected: '',
                },
                {
                    input: ' ',
                    expected: '',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should handle two character names', () => {
            const testCases = [
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
                    expected: '12',
                },
                {
                    input: 'A1',
                    expected: 'a1',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should handle names with leading/trailing punctuation', () => {
            const testCases = [
                {
                    input: '.John',
                    expected: 'john',
                },
                {
                    input: 'Mary.',
                    expected: 'mary',
                },
                {
                    input: '-David-',
                    expected: 'david',
                },
                {
                    input: '(Sarah)',
                    expected: 'sarah',
                },
                {
                    input: '"Jennifer"',
                    expected: 'jennifer',
                },
                {
                    input: "'Michael'",
                    expected: 'michael',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });
    });

    describe('Performance and edge input handling', () => {
        test('should handle very long invalid inputs gracefully', () => {
            const veryLongPunctuation = '!'.repeat(1000);
            const result = getNormalizedName(veryLongPunctuation);
            expect(result).toEqual('');

            const veryLongValid = 'a'.repeat(1000);
            const resultValid = getNormalizedName(veryLongValid);
            expect(resultValid).toEqual('a'.repeat(1000));
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
                const result = getNormalizedName(input);
                expect(result).toEqual('');
            });
        });

        test('should handle mixed special characters and valid characters', () => {
            const testCases = [
                {
                    input: '!J@o#h$n%',
                    expected: 'john',
                },
                {
                    input: '***M***a***r***y***',
                    expected: 'mary',
                },
                {
                    input: '...D.a.v.i.d...',
                    expected: 'david',
                },
                {
                    input: '---S-a-r-a-h---',
                    expected: 'sarah',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
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
                '!!!',
                '...',
                '---',
                '___',
                '+++',
                '===',
            ];

            emptyLikeInputs.forEach((input) => {
                expect(getNormalizedName(input)).toEqual('');
            });
        });
    });

    describe('Real-world name scenarios', () => {
        test('should handle common first names', () => {
            const firstNames = [
                'John', 'Jane', 'Michael', 'Sarah', 'David', 'Mary',
                'Christopher', 'Jennifer', 'Matthew', 'Lisa', 'James',
                'Karen', 'Robert', 'Nancy', 'William', 'Betty'
            ];

            firstNames.forEach((name) => {
                expect(getNormalizedName(name)).toEqual(name.toLowerCase());
                expect(getNormalizedName(name.toUpperCase())).toEqual(name.toLowerCase());
                expect(getNormalizedName(`  ${name}  `)).toEqual(name.toLowerCase());
            });
        });

        test('should handle common last names', () => {
            const lastNames = [
                'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
                'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'
            ];

            lastNames.forEach((name) => {
                expect(getNormalizedName(name)).toEqual(name.toLowerCase());
                expect(getNormalizedName(name.toUpperCase())).toEqual(name.toLowerCase());
                expect(getNormalizedName(`  ${name}  `)).toEqual(name.toLowerCase());
            });
        });

        test('should handle hyphenated names', () => {
            const hyphenatedNames = [
                'Smith-Jones', 'Mary-Jane', 'Jean-Luc', 'Anne-Marie',
                'Van-Der-Berg', 'De-La-Cruz'
            ];

            hyphenatedNames.forEach((name) => {
                const expected = name.toLowerCase().replace(/-/g, '');
                expect(getNormalizedName(name)).toEqual(expected);
            });
        });

        test('should handle names with apostrophes', () => {
            const apostropheNames = [
                "O'Connor", "D'Angelo", "O'Brien", "McDonald's",
                "D'Artagnan", "O'Malley"
            ];

            apostropheNames.forEach((name) => {
                const expected = name.toLowerCase().replace(/'/g, '');
                expect(getNormalizedName(name)).toEqual(expected);
            });
        });

        test('should handle prefix and suffix names', () => {
            const testCases = [
                {
                    input: 'Dr. John Smith',
                    expected: 'drjohnsmith',
                },
                {
                    input: 'Mary Johnson Jr.',
                    expected: 'maryjohnsonjr',
                },
                {
                    input: 'Prof. David Wilson III',
                    expected: 'profdavidwilsoniii',
                },
                {
                    input: 'Ms. Sarah Brown Sr.',
                    expected: 'mssarahbrownsr',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should handle international names', () => {
            const testCases = [
                {
                    input: 'José María',
                    expected: 'josémaría',
                },
                {
                    input: 'François Müller',
                    expected: 'françoismüller',
                },
                {
                    input: 'Владимир Петров',
                    expected: 'владимирпетров',
                },
                {
                    input: 'محمد أحمد',
                    expected: 'محمدأحمد',
                },
                {
                    input: '李明华',
                    expected: '李明华',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });
    });

    describe('Type conversion handling', () => {
        test('should handle numeric inputs', () => {
            const testCases = [
                {
                    input: 123,
                    expected: '123',
                },
                {
                    input: 0,
                    expected: '0',
                },
                {
                    input: -456,
                    expected: '456', // Hyphen is removed as punctuation
                },
                {
                    input: 12.34,
                    expected: '1234', // Decimal point is removed as punctuation
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should handle boolean inputs', () => {
            const testCases = [
                {
                    input: true,
                    expected: 'true',
                },
                {
                    input: false,
                    expected: 'false',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });

        test('should handle object inputs', () => {
            const testCases = [
                {
                    input: {},
                    expected: 'objectobject', // '[object Object]' with punctuation removed
                },
                {
                    input: [],
                    expected: '', // Empty array stringifies to empty string
                },
                {
                    input: [1, 2, 3],
                    expected: '123', // '1,2,3' with commas removed
                },
                {
                    input: { name: 'John' },
                    expected: 'objectobject', // '[object Object]' with punctuation removed
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedName(input)).toEqual(expected);
            });
        });
    });
});
