/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { getNormalizedZipCode } = require('../src/piiUtil/zipCodeUtil');

describe('getNormalizedZipCode', () => {
    describe('Input validation', () => {
        test('should return null for null input', () => {
            expect(getNormalizedZipCode(null)).toBeNull();
        });

        test('should return null for undefined input', () => {
            expect(getNormalizedZipCode(undefined)).toBeNull();
        });

        test('should return null for non-string input', () => {
            const nonStringValues = [123, {}, [], true, false, 0, -1, 3.14, NaN, Infinity];

            nonStringValues.forEach((value) => {
                expect(getNormalizedZipCode(value)).toBeNull();
            });
        });

        test('should return null for empty string input', () => {
            expect(getNormalizedZipCode('')).toBeNull();
        });

        test('should return null for whitespace-only input', () => {
            expect(getNormalizedZipCode('   ')).toBeNull();
            expect(getNormalizedZipCode('\t\n\r')).toBeNull();
            expect(getNormalizedZipCode('  \t  \n  \r  ')).toBeNull();
        });

        test('should return null for single character input', () => {
            expect(getNormalizedZipCode('1')).toBeNull();
            expect(getNormalizedZipCode('a')).toBeNull();
            expect(getNormalizedZipCode(' 1 ')).toBeNull();
        });
    });

    describe('Basic zip code normalization', () => {

        test('should normalize example data', () => {
            const testCases = [
                {
                    input: '    37221',
                    expected: '37221',
                },
                {
                    input: '37221-3312',
                    expected: '37221',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should normalize basic US zip codes', () => {
            const testCases = [
                {
                    input: '12345',
                    expected: '12345',
                },
                {
                    input: '90210',
                    expected: '90210',
                },
                {
                    input: '10001',
                    expected: '10001',
                },
                {
                    input: '77001',
                    expected: '77001',
                },
                {
                    input: '60601',
                    expected: '60601',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle zip codes with leading/trailing whitespace', () => {
            const testCases = [
                {
                    input: '  12345  ',
                    expected: '12345',
                },
                {
                    input: '\t90210\n',
                    expected: '90210',
                },
                {
                    input: ' 10001 ',
                    expected: '10001',
                },
                {
                    input: '\r77001\r',
                    expected: '77001',
                },
                {
                    input: '  \t60601\n  ',
                    expected: '60601',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should convert uppercase to lowercase', () => {
            const testCases = [
                {
                    input: 'K1A0A6', // Canadian postal code
                    expected: 'k1a0a6',
                },
                {
                    input: 'M5V3A8',
                    expected: 'm5v3a8',
                },
                {
                    input: 'SW1A1AA', // UK postal code
                    expected: 'sw1a1aa',
                },
                {
                    input: 'EC1A1BB',
                    expected: 'ec1a1bb',
                },
                {
                    input: 'AB123CD',
                    expected: 'ab123cd',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle mixed case input', () => {
            const testCases = [
                {
                    input: 'K1a0A6',
                    expected: 'k1a0a6',
                },
                {
                    input: 'M5v3A8',
                    expected: 'm5v3a8',
                },
                {
                    input: 'Sw1A1aA',
                    expected: 'sw1a1aa',
                },
                {
                    input: 'eC1a1Bb',
                    expected: 'ec1a1bb',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });
    });

    describe('Extended zip code handling (ZIP+4)', () => {
        test('should extract base zip code from ZIP+4 format', () => {
            const testCases = [
                {
                    input: '12345-6789',
                    expected: '12345', // Only the first part before the dash
                },
                {
                    input: '90210-1234',
                    expected: '90210',
                },
                {
                    input: '10001-0001',
                    expected: '10001',
                },
                {
                    input: '77001-2345',
                    expected: '77001',
                },
                {
                    input: '60601-9999',
                    expected: '60601',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle ZIP+4 with whitespace', () => {
            const testCases = [
                {
                    input: '  12345-6789  ',
                    expected: '12345',
                },
                {
                    input: '\t90210-1234\n',
                    expected: '90210',
                },
                {
                    input: ' 10001-0001 ',
                    expected: '10001',
                },
                {
                    input: '77001-2345 ',
                    expected: '77001',
                },
                {
                    input: ' 60601-9999',
                    expected: '60601',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle multiple dashes (only split on first)', () => {
            const testCases = [
                {
                    input: '12345-6789-extra',
                    expected: '12345', // Split on first dash only
                },
                {
                    input: '90210-1234-more-data',
                    expected: '90210',
                },
                {
                    input: 'abc-def-ghi',
                    expected: 'abc',
                },
                {
                    input: '123-456-789-000',
                    expected: '123',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle dash at the end', () => {
            const testCases = [
                {
                    input: '12345-',
                    expected: '12345',
                },
                {
                    input: '90210-',
                    expected: '90210',
                },
                {
                    input: 'abc123-',
                    expected: 'abc123',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle dash at the beginning', () => {
            const testCases = [
                {
                    input: '-12345',
                    expected: '', // Empty string after split, should return null
                },
                {
                    input: '-90210',
                    expected: '', // Empty string after split, should return null
                },
            ];

            testCases.forEach(({ input, expected }) => {
                // These should return null because the first part is empty
                expect(getNormalizedZipCode(input)).toBeNull();
            });
        });
    });

    describe('International postal codes', () => {
        test('should handle Canadian postal codes', () => {
            const testCases = [
                {
                    input: 'K1A0A6',
                    expected: 'k1a0a6',
                },
                {
                    input: 'M5V3A8',
                    expected: 'm5v3a8',
                },
                {
                    input: 'H2X1Y4',
                    expected: 'h2x1y4',
                },
                {
                    input: 'V6B1A1',
                    expected: 'v6b1a1',
                },
                {
                    input: 'T2P2M5',
                    expected: 't2p2m5',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle UK postal codes', () => {
            const testCases = [
                {
                    input: 'SW1A1AA',
                    expected: 'sw1a1aa',
                },
                {
                    input: 'EC1A1BB',
                    expected: 'ec1a1bb',
                },
                {
                    input: 'W1T4JE',
                    expected: 'w1t4je',
                },
                {
                    input: 'M11AA',
                    expected: 'm11aa',
                },
                {
                    input: 'B338TH',
                    expected: 'b338th',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle other international formats', () => {
            const testCases = [
                {
                    input: '75001', // France
                    expected: '75001',
                },
                {
                    input: '10115', // Germany
                    expected: '10115',
                },
                {
                    input: '1010', // Austria
                    expected: '1010',
                },
                {
                    input: '00118', // Italy
                    expected: '00118',
                },
                {
                    input: '28001', // Spain
                    expected: '28001',
                },
                {
                    input: '1000', // Belgium
                    expected: '1000',
                },
                {
                    input: '1012', // Netherlands
                    expected: '1012',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });
    });

    describe('Hashed zip code handling', () => {
        test('should return SHA-256 hash as-is when it looks like a hash', () => {
            const validHashes = [
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 'hello' hashed
                'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty string hashed
                '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29', // different hash
                'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890', // uppercase hash
                '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // mixed case hash
                '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d',
                '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // all valid hex chars
                'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210', // reverse order
            ];

            validHashes.forEach((hash) => {
                const result = getNormalizedZipCode(hash);
                expect(result).toEqual(hash);
            });
        });

        test('should process invalid hash-like strings normally', () => {
            const testCases = [
                {
                    input: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
                    expected: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // Processed normally
                },
                {
                    input: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars
                    expected: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // Processed normally
                },
                {
                    input: 'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid hex char 'g'
                    expected: 'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // Processed normally
                },
                {
                    input: '123', // too short
                    expected: '123', // Processed normally
                },
                {
                    input: 'z665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid hex char 'z'
                    expected: 'z665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // Processed normally
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedZipCode(input);
                expect(result).toEqual(expected);
            });
        });

        test('should handle hashes with whitespace', () => {
            const testCases = [
                {
                    input: '  a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3  ',
                    expected: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // Hash detected, returned as-is
                },
                {
                    input: '\te3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n',
                    expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // Hash detected, returned as-is
                },
                {
                    input: '2CF24DBA4F21D4288094E8452703C0F0142FA00B2EEB1F2C9B4E70F39E8A4C29',
                    expected: '2CF24DBA4F21D4288094E8452703C0F0142FA00B2EEB1F2C9B4E70F39E8A4C29', // Hash detected, returned as-is
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedZipCode(input);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('Edge cases and invalid formats', () => {
        test('should return null for too short zip codes after processing', () => {
            const testCases = [
                {
                    input: 'a', // Single character
                    expected: null,
                },
                {
                    input: '1', // Single digit
                    expected: null,
                },
                {
                    input: ' a ', // Single character with whitespace
                    expected: null,
                },
                {
                    input: ' 1 ', // Single digit with whitespace
                    expected: null,
                },
                {
                    input: '-a', // Dash followed by single char (results in empty string)
                    expected: null,
                },
                {
                    input: '-1', // Dash followed by single digit (results in empty string)
                    expected: null,
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle minimum valid length (2 characters)', () => {
            const testCases = [
                {
                    input: '12',
                    expected: '12',
                },
                {
                    input: 'ab',
                    expected: 'ab',
                },
                {
                    input: 'A1',
                    expected: 'a1',
                },
                {
                    input: '1A',
                    expected: '1a',
                },
                {
                    input: '  12  ',
                    expected: '12',
                },
                {
                    input: '  AB  ',
                    expected: 'ab',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle special characters in zip codes', () => {
            const testCases = [
                {
                    input: '123!@',
                    expected: '123!@',
                },
                {
                    input: 'AB#$%',
                    expected: 'ab#$%',
                },
                {
                    input: '12.34',
                    expected: '12.34',
                },
                {
                    input: 'A1 B2',
                    expected: 'a1 b2',
                },
                {
                    input: '123*456',
                    expected: '123*456',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle very long zip codes', () => {
            const testCases = [
                {
                    input: '1234567890123456789',
                    expected: '1234567890123456789',
                },
                {
                    input: 'ABCDEFGHIJKLMNOPQRST',
                    expected: 'abcdefghijklmnopqrst',
                },
                {
                    input: 'A'.repeat(100),
                    expected: 'a'.repeat(100),
                },
                {
                    input: '1'.repeat(50),
                    expected: '1'.repeat(50),
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });
    });

    describe('Real-world zip code scenarios', () => {
        test('should handle common US zip code formats', () => {
            const testCases = [
                {
                    input: '90210', // Beverly Hills
                    expected: '90210',
                },
                {
                    input: '10001', // New York
                    expected: '10001',
                },
                {
                    input: '60601', // Chicago
                    expected: '60601',
                },
                {
                    input: '77001', // Houston
                    expected: '77001',
                },
                {
                    input: '94102', // San Francisco
                    expected: '94102',
                },
                {
                    input: '33101', // Miami
                    expected: '33101',
                },
                {
                    input: '02101', // Boston
                    expected: '02101',
                },
                {
                    input: '98101', // Seattle
                    expected: '98101',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle US ZIP+4 codes', () => {
            const testCases = [
                {
                    input: '90210-1234',
                    expected: '90210',
                },
                {
                    input: '10001-0001',
                    expected: '10001',
                },
                {
                    input: '60601-9999',
                    expected: '60601',
                },
                {
                    input: '77001-2345',
                    expected: '77001',
                },
                {
                    input: '94102-5678',
                    expected: '94102',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle Canadian postal codes', () => {
            const testCases = [
                {
                    input: 'K1A0A6', // Ottawa
                    expected: 'k1a0a6',
                },
                {
                    input: 'M5V3A8', // Toronto
                    expected: 'm5v3a8',
                },
                {
                    input: 'H2X1Y4', // Montreal
                    expected: 'h2x1y4',
                },
                {
                    input: 'V6B1A1', // Vancouver
                    expected: 'v6b1a1',
                },
                {
                    input: 'T2P2M5', // Calgary
                    expected: 't2p2m5',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle UK postal codes', () => {
            const testCases = [
                {
                    input: 'SW1A1AA', // London
                    expected: 'sw1a1aa',
                },
                {
                    input: 'EC1A1BB', // London
                    expected: 'ec1a1bb',
                },
                {
                    input: 'W1T4JE', // London
                    expected: 'w1t4je',
                },
                {
                    input: 'M11AA', // Manchester
                    expected: 'm11aa',
                },
                {
                    input: 'B338TH', // Birmingham
                    expected: 'b338th',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle European postal codes', () => {
            const testCases = [
                {
                    input: '75001', // Paris, France
                    expected: '75001',
                },
                {
                    input: '10115', // Berlin, Germany
                    expected: '10115',
                },
                {
                    input: '1010', // Vienna, Austria
                    expected: '1010',
                },
                {
                    input: '00118', // Rome, Italy
                    expected: '00118',
                },
                {
                    input: '28001', // Madrid, Spain
                    expected: '28001',
                },
                {
                    input: '1000', // Brussels, Belgium
                    expected: '1000',
                },
                {
                    input: '1012', // Amsterdam, Netherlands
                    expected: '1012',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });
    });

    describe('Performance and boundary conditions', () => {
        test('should handle very long strings gracefully', () => {
            const veryLongZip = '1'.repeat(10000);
            const result = getNormalizedZipCode(veryLongZip);

            expect(result).toEqual(veryLongZip); // Should handle long strings
            expect(result.length).toEqual(10000);
        });

        test('should handle strings with lots of dashes', () => {
            const testCases = [
                {
                    input: '12345-6789-0123-4567-8901',
                    expected: '12345', // Only split on first dash
                },
                {
                    input: 'abc-def-ghi-jkl-mno',
                    expected: 'abc',
                },
                {
                    input: '---12345',
                    expected: '', // First part is empty, should return null
                },
                {
                    input: '12345---',
                    expected: '12345',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                if (expected === '') {
                    expect(getNormalizedZipCode(input)).toBeNull();
                } else {
                    expect(getNormalizedZipCode(input)).toEqual(expected);
                }
            });
        });

        test('should handle Unicode characters', () => {
            const testCases = [
                {
                    input: '123🚀',
                    expected: '123🚀', // Emoji preserved
                },
                {
                    input: 'ZIP_中文',
                    expected: 'zip_中文', // Chinese characters preserved, case lowered
                },
                {
                    input: 'CODE_عربي',
                    expected: 'code_عربي', // Arabic characters preserved
                },
                {
                    input: 'ПОС123',
                    expected: 'пос123', // Cyrillic characters preserved
                },
                {
                    input: 'código123',
                    expected: 'código123', // Accented characters preserved
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle special Unicode whitespace', () => {
            const testCases = [
                {
                    input: '\u00A012345\u00A0', // Non-breaking spaces
                    expected: '12345',
                },
                {
                    input: '\u200812345\u2008', // Punctuation space
                    expected: '12345',
                },
                {
                    input: '\u200912345\u2009', // Thin space
                    expected: '12345',
                },
                {
                    input: '\u3000ZIP123\u3000', // Ideographic space
                    expected: 'zip123',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });

        test('should handle control characters', () => {
            const testCases = [
                {
                    input: 'ZIP\x00123', // Null byte
                    expected: 'zip\x00123', // Preserved
                },
                {
                    input: 'ZIP\x01123', // Start of heading
                    expected: 'zip\x01123', // Preserved
                },
                {
                    input: '\x1FZIP123', // Unit separator
                    expected: '\x1fzip123', // Preserved, lowercased
                },
                {
                    input: 'ZIP123\x7F', // Delete character
                    expected: 'zip123\x7f', // Preserved, lowercased
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedZipCode(input)).toEqual(expected);
            });
        });
    });
});
