/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { getNormalizedPhone } = require('../src/piiUtil/phoneUtil');

describe('getNormalizedPhone', () => {
    describe('Input validation', () => {
        test('should return null for null input', () => {
            expect(getNormalizedPhone(null)).toBeNull();
        });

        test('should return null for undefined input', () => {
            expect(getNormalizedPhone(undefined)).toBeNull();
        });

        test('should handle non-string input by converting to string', () => {
            const nonStringValues = [123, {}, [], true, false];

            nonStringValues.forEach((value) => {
                // The function calls String(value) so it should convert non-strings
                const result = getNormalizedPhone(value);
                expect(typeof result).toBe('string');
            });
        });

        test('should return empty string for empty string input', () => {
            expect(getNormalizedPhone('')).toEqual('');
        });

        test('should return empty string for whitespace-only input', () => {
            expect(getNormalizedPhone('   ')).toEqual('');
            expect(getNormalizedPhone('\t\n\r')).toEqual('');
            expect(getNormalizedPhone('  \t  \n  \r  ')).toEqual('');
        });
    });

    describe('Phone normalization', () => {

        test('should normalize example data', () => {
            const testCases = [
                {
                    input:
                        '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d',
                    expected:
                        '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d',
                },
                {
                    input: '+1 (616) 954-78 88',
                    expected: '16169547888',
                },
                {
                    input: '1(650)123-4567',
                    expected: '16501234567',
                },
                {
                    input: '+001 (616) 954-78 88',
                    expected: '16169547888',
                },
                {
                    input: '01(650)123-4567',
                    expected: '16501234567',
                },
                {
                    input: '4792813113',
                    expected: '4792813113',
                },
                {
                    input: '3227352263',
                    expected: '3227352263',
                },
                {
                    input:
                        "alreadyHasPhoneCode: false; countryCode: 'US'; phoneCode: '1'; phoneNumber: '(650)123-4567'",
                    expected: '16501234567',
                },
                {
                    input:
                        "alreadyHasPhoneCode: false; phoneCode: '+86'; phoneNumber: '12345678'",
                    expected: '8612345678',
                },
                {
                    input: "alreadyHasPhoneCode: true; phoneNumber: '322-735-2263'",
                    expected: '3227352263',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedPhone(input)).toEqual(expected);
            });
        });

        test('should normalize basic US phone numbers', () => {
            const testCases = [
                {
                    input: '1234567890',
                    expected: '1234567890',
                },
                {
                    input: '+1-555-123-4567',
                    expected: '15551234567',
                },
                {
                    input: '(555) 123-4567',
                    expected: '5551234567',
                },
                {
                    input: '555.123.4567',
                    expected: '5551234567',
                },
                {
                    input: '555 123 4567',
                    expected: '5551234567',
                },
                {
                    input: '+1 (555) 123-4567',
                    expected: '15551234567',
                },
                {
                    input: '1-555-123-4567',
                    expected: '15551234567',
                },
                {
                    input: '+1 (616) 954-78 88',
                    expected: '16169547888',
                },
                {
                    input: '1(650)123-4567',
                    expected: '16501234567',
                },
                {
                    input: '+001 (616) 954-78 88',
                    expected: '16169547888',
                },
                {
                    input: '01(650)123-4567',
                    expected: '16501234567',
                },
                {
                    input: '4792813113',
                    expected: '4792813113',
                },
                {
                    input: '3227352263',
                    expected: '3227352263',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedPhone(input)).toEqual(expected);
            });
        });

        test('should normalize international phone numbers', () => {
            const testCases = [
                {
                    input: '+44 20 7946 0958',
                    expected: '442079460958',
                },
                {
                    input: '+33 1 42 86 83 26',
                    expected: '33142868326',
                },
                {
                    input: '+81-3-5843-2301',
                    expected: '81358432301',
                },
                {
                    input: '+61 2 9374 4000',
                    expected: '61293744000',
                },
                {
                    input: '+49 30 12345678',
                    expected: '493012345678',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedPhone(input)).toEqual(expected);
            });
        });

        test('should remove leading zeros', () => {
            const testCases = [
                {
                    input: '01234567890',
                    expected: '1234567890',
                },
                {
                    input: '0012345678',
                    expected: '12345678',
                },
                {
                    input: '000555123456',
                    expected: '555123456',
                },
                {
                    input: '0000',
                    expected: '',
                },
                {
                    input: '00001',
                    expected: '1',
                },
                {
                    input: '0',
                    expected: '',
                },
                {
                    input: '00',
                    expected: '',
                },
                {
                    input: '000',
                    expected: '',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedPhone(input)).toEqual(expected);
            });
        });

        test('should handle phone numbers with various separators', () => {
            const testCases = [
                {
                    input: '555-123-4567',
                    expected: '5551234567',
                },
                {
                    input: '555.123.4567',
                    expected: '5551234567',
                },
                {
                    input: '555 123 4567',
                    expected: '5551234567',
                },
                {
                    input: '555/123/4567',
                    expected: '5551234567',
                },
                {
                    input: '555_123_4567',
                    expected: '5551234567',
                },
                {
                    input: '555|123|4567',
                    expected: '5551234567',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedPhone(input)).toEqual(expected);
            });
        });

        test('should handle phone numbers with parentheses and brackets', () => {
            const testCases = [
                {
                    input: '(555) 123-4567',
                    expected: '5551234567',
                },
                {
                    input: '(555)123-4567',
                    expected: '5551234567',
                },
                {
                    input: '[555] 123-4567',
                    expected: '5551234567',
                },
                {
                    input: '{555} 123-4567',
                    expected: '5551234567',
                },
                {
                    input: '+1 (555) 123-4567',
                    expected: '15551234567',
                },
                {
                    input: '1-(555)-123-4567',
                    expected: '15551234567',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedPhone(input)).toEqual(expected);
            });
        });

        test('should handle phone numbers with special characters', () => {
            const testCases = [
                {
                    input: '+1-555-123-4567 ext. 123',
                    expected: '15551234567123',
                },
                {
                    input: '555-123-4567#123',
                    expected: '5551234567123',
                },
                {
                    input: '555*123*4567',
                    expected: '5551234567',
                },
                {
                    input: '555@123@4567',
                    expected: '5551234567',
                },
                {
                    input: '555$123$4567',
                    expected: '5551234567',
                },
                {
                    input: '555%123%4567',
                    expected: '5551234567',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedPhone(input)).toEqual(expected);
            });
        });

        test('should handle phone numbers with letters (removing non-digits)', () => {
            const testCases = [
                {
                    input: '1-800-FLOWERS',
                    expected: '1800',
                },
                {
                    input: '1-800-GO-FEDEX',
                    expected: '1800',
                },
                {
                    input: 'CALL-NOW-555',
                    expected: '555',
                },
                {
                    input: '555-HELP-NOW',
                    expected: '555',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedPhone(input)).toEqual(expected);
            });
        });

        test('should handle very long phone numbers', () => {
            const longPhone = '+1-555-123-4567-890-123-456-789';
            const result = getNormalizedPhone(longPhone);
            expect(result).toEqual('15551234567890123456789');
        });

        test('should handle short phone numbers', () => {
            const testCases = [
                {
                    input: '911',
                    expected: '911',
                },
                {
                    input: '411',
                    expected: '411',
                },
                {
                    input: '123',
                    expected: '123',
                },
                {
                    input: '1',
                    expected: '1',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedPhone(input)).toEqual(expected);
            });
        });

        test('should return empty string for all non-numeric characters', () => {
            const testCases = [
                'abc',
                'HELP',
                '---',
                '...',
                '+++',
                '()',
                '[]',
                '{}',
                'call-me',
                'phone',
            ];

            testCases.forEach((input) => {
                expect(getNormalizedPhone(input)).toEqual('');
            });
        });

        test('should handle mixed numeric and non-numeric strings', () => {
            const testCases = [
                {
                    input: 'Phone: 555-123-4567',
                    expected: '5551234567',
                },
                {
                    input: 'Call me at +1 (555) 123-4567 today!',
                    expected: '15551234567',
                },
                {
                    input: 'My number is 555.123.4567.',
                    expected: '5551234567',
                },
                {
                    input: 'Tel: 555 123 4567',
                    expected: '5551234567',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedPhone(input)).toEqual(expected);
            });
        });
    });

    describe('Hashed phone handling', () => {
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
                const result = getNormalizedPhone(hash);
                expect(result).toEqual(hash);
            });
        });

        test('should process invalid hash-like strings as regular phone numbers', () => {
            const invalidHashes = [
                {
                    input: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
                    expected: '6654592042294174867480413107998867727',
                },
                {
                    input: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars
                    expected: '665459204229417486748041310799886772733',
                },
                {
                    input: 'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'g'
                    expected: '66545920422941748674804131079988677273',
                },
                {
                    input: 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE!', // invalid char '!'
                    expected: '6654592042294174867480413107998867727',
                },
                {
                    input: '123', // too short
                    expected: '123',
                },
                {
                    input: '', // empty string
                    expected: '',
                },
                {
                    input: 'z665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'z'
                    expected: '66545920422941748674804131079988677273',
                },
                {
                    input: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27a 3', // space in middle
                    expected: '66545920422941748674804131079988677273',
                },
            ];

            invalidHashes.forEach(({ input, expected }) => {
                const result = getNormalizedPhone(input);
                expect(result).toEqual(expected);
            });
        });

        test('should handle mixed case hashed phone numbers', () => {
            const mixedCaseHash =
                'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
            const result = getNormalizedPhone(mixedCaseHash);
            expect(result).toEqual(mixedCaseHash);
        });

        test('should handle lowercase hashed phone numbers', () => {
            const lowercaseHash =
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
            const result = getNormalizedPhone(lowercaseHash);
            expect(result).toEqual(lowercaseHash);
        });
    });

    describe('Edge cases with phone normalization', () => {
        test('should handle only leading zeros', () => {
            const testCases = [
                {
                    input: '0',
                    expected: '',
                },
                {
                    input: '00',
                    expected: '',
                },
                {
                    input: '000',
                    expected: '',
                },
                {
                    input: '0000',
                    expected: '',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedPhone(input);
                expect(result).toEqual(expected);
            });
        });

        test('should handle numbers with leading zeros followed by valid digits', () => {
            const testCases = [
                {
                    input: '01',
                    expected: '1',
                },
                {
                    input: '001',
                    expected: '1',
                },
                {
                    input: '0001',
                    expected: '1',
                },
                {
                    input: '00555123456',
                    expected: '555123456',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedPhone(input);
                expect(result).toEqual(expected);
            });
        });

        test('should handle extreme cases', () => {
            const testCases = [
                {
                    input: String(123456789),
                    expected: '123456789',
                },
                {
                    input: String(0),
                    expected: '',
                },
                {
                    input: '0'.repeat(100) + '123',
                    expected: '123',
                },
                {
                    input: '1'.repeat(100),
                    expected: '1'.repeat(100),
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedPhone(input);
                expect(result).toEqual(expected);
            });
        });

        test('should handle complex phone number formats from real world', () => {
            const testCases = [
                {
                    input: "alreadyHasPhoneCode: false; countryCode: 'US'; phoneCode: '1'; phoneNumber: '(650)123-4567'",
                    expected: '16501234567',
                },
                {
                    input: "alreadyHasPhoneCode: false; phoneCode: '+86'; phoneNumber: '12345678'",
                    expected: '8612345678',
                },
                {
                    input: "alreadyHasPhoneCode: true; phoneNumber: '322-735-2263'",
                    expected: '3227352263',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedPhone(input);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('Non-string input handling', () => {
        test('should handle numeric inputs by converting to string', () => {
            const testCases = [
                {
                    input: 1234567890,
                    expected: '1234567890',
                },
                {
                    input: 0,
                    expected: '',
                },
                {
                    input: 123,
                    expected: '123',
                },
                {
                    input: 5551234567,
                    expected: '5551234567',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedPhone(input);
                expect(result).toEqual(expected);
            });
        });

        test('should handle boolean inputs by converting to string', () => {
            const testCases = [
                {
                    input: true,
                    expected: '', // String(true) = "true", only digits extracted = ""
                },
                {
                    input: false,
                    expected: '', // String(false) = "false", only digits extracted = ""
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedPhone(input);
                expect(result).toEqual(expected);
            });
        });

        test('should handle object inputs by converting to string', () => {
            const testCases = [
                {
                    input: {},
                    expected: '', // String({}) = "[object Object]", only digits extracted = ""
                },
                {
                    input: [],
                    expected: '', // String([]) = "", only digits extracted = ""
                },
                {
                    input: [1, 2, 3],
                    expected: '123', // String([1,2,3]) = "1,2,3", only digits extracted = "123"
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedPhone(input);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('Performance and edge input handling', () => {
        test('should handle very long invalid inputs gracefully', () => {
            const veryLongInvalid = 'a'.repeat(1000); // No digits
            const result = getNormalizedPhone(veryLongInvalid);
            expect(result).toEqual('');
        });

        test('should handle strings with only special characters', () => {
            const specialOnlyInputs = [
                '!@#$%^&*()',
                '@@@@@@@@',
                '........',
                '________',
                '--------',
                '++++++++',
                '()[]{}',
                '<>',
            ];

            specialOnlyInputs.forEach((input) => {
                const result = getNormalizedPhone(input);
                expect(result).toEqual('');
            });
        });

        test('should handle mixed special characters and digits', () => {
            const testCases = [
                {
                    input: '!1@2#3$4%5^6&7*8(9)0',
                    expected: '1234567890',
                },
                {
                    input: 'Phone: 555, please call',
                    expected: '555',
                },
                {
                    input: '***555***123***4567***',
                    expected: '5551234567',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedPhone(input);
                expect(result).toEqual(expected);
            });
        });
    });
});
