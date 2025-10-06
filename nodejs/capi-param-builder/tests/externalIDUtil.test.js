/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { getNormalizedExternalID } = require('../src/piiUtil/stringUtil');

describe('getNormalizedExternalID', () => {
    describe('Input validation', () => {
        test('should return null for null input', () => {
            expect(getNormalizedExternalID(null)).toBeNull();
        });

        test('should return null for undefined input', () => {
            expect(getNormalizedExternalID(undefined)).toBeNull();
        });

        test('should handle non-string input by converting to string', () => {
            const testCases = [
                {
                    input: 123,
                    expected: '123', // String(123) = '123'
                },
                {
                    input: 456.789,
                    expected: '456.789', // String(456.789) = '456.789'
                },
                {
                    input: 0,
                    expected: '0', // String(0) = '0'
                },
                {
                    input: -42,
                    expected: '-42', // String(-42) = '-42'
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
                    expected: '[objectobject]', // String({}) = '[object Object]' -> lowercase and whitespace stripped
                },
                {
                    input: [],
                    expected: '', // String([]) = ''
                },
                {
                    input: [1, 2, 3],
                    expected: '1,2,3', // String([1,2,3]) = '1,2,3'
                },
                {
                    input: { id: 'test' },
                    expected: '[objectobject]', // String({id: 'test'}) = '[object Object]' -> lowercase and whitespace stripped
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should handle empty string input', () => {
            expect(getNormalizedExternalID('')).toEqual('');
        });

        test('should handle whitespace-only input', () => {
            const testCases = [
                {
                    input: '   ',
                    expected: '', // Whitespace stripped
                },
                {
                    input: ' \t\n\r ',
                    expected: '', // All whitespace types stripped
                },
                {
                    input: '\t',
                    expected: '', // Tab stripped
                },
                {
                    input: '\n',
                    expected: '', // Newline stripped
                },
                {
                    input: '\r',
                    expected: '', // Carriage return stripped
                },
                {
                    input: '  \t  \n  \r  ',
                    expected: '', // Mixed whitespace stripped
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });
    });

    describe('Case normalization', () => {

        test('should convert uppercase to lowercase', () => {
            const testCases = [
                {
                    input: 'EXTERNAL123',
                    expected: 'external123',
                },
                {
                    input: 'USER-ID-456',
                    expected: 'user-id-456',
                },
                {
                    input: 'CUSTOMER_789',
                    expected: 'customer_789',
                },
                {
                    input: 'ABC123XYZ',
                    expected: 'abc123xyz',
                },
                {
                    input: 'SIMPLE',
                    expected: 'simple',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should handle mixed case input', () => {
            const testCases = [
                {
                    input: 'ExTeRnAl123',
                    expected: 'external123',
                },
                {
                    input: 'UsEr-Id-456',
                    expected: 'user-id-456',
                },
                {
                    input: 'CuStOmEr_789',
                    expected: 'customer_789',
                },
                {
                    input: 'MiXeD_CaSe_ID',
                    expected: 'mixed_case_id',
                },
                {
                    input: 'aBc123XyZ',
                    expected: 'abc123xyz',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should leave lowercase input unchanged', () => {
            const testCases = [
                {
                    input: 'external123',
                    expected: 'external123',
                },
                {
                    input: 'user-id-456',
                    expected: 'user-id-456',
                },
                {
                    input: 'customer_789',
                    expected: 'customer_789',
                },
                {
                    input: 'simple',
                    expected: 'simple',
                },
                {
                    input: 'abc123xyz',
                    expected: 'abc123xyz',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });
    });

    describe('Whitespace handling', () => {

        test('should convert example data', () => {
            const testCases = [
                {
                    input: '    12345',
                    expected: '12345',
                },
                {
                    input: 'abc-12345',
                    expected: 'abc-12345',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should strip leading and trailing spaces', () => {
            const testCases = [
                {
                    input: '  external123  ',
                    expected: 'external123',
                },
                {
                    input: ' user-id-456 ',
                    expected: 'user-id-456',
                },
                {
                    input: '   customer_789   ',
                    expected: 'customer_789',
                },
                {
                    input: 'simple',
                    expected: 'simple', // No change needed
                },
                {
                    input: '  abc123xyz',
                    expected: 'abc123xyz', // Only leading spaces
                },
                {
                    input: 'abc123xyz  ',
                    expected: 'abc123xyz', // Only trailing spaces
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should strip various types of whitespace', () => {
            const testCases = [
                {
                    input: '\texternal123\t',
                    expected: 'external123', // Tabs
                },
                {
                    input: '\nuser-id-456\n',
                    expected: 'user-id-456', // Newlines
                },
                {
                    input: '\rcustomer_789\r',
                    expected: 'customer_789', // Carriage returns
                },
                {
                    input: ' \t\n\rsimple\r\n\t ',
                    expected: 'simple', // Mixed whitespace
                },
                {
                    input: '\u00A0external123\u00A0',
                    expected: 'external123', // Non-breaking spaces
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should strip ALL whitespace (not preserve internal whitespace)', () => {
            const testCases = [
                {
                    input: 'external 123',
                    expected: 'external123', // All spaces stripped
                },
                {
                    input: 'user id 456',
                    expected: 'userid456', // All spaces stripped
                },
                {
                    input: 'customer\t789',
                    expected: 'customer789', // Tab stripped
                },
                {
                    input: 'simple\nid',
                    expected: 'simpleid', // Newline stripped
                },
                {
                    input: 'mixed\r\nline\rid',
                    expected: 'mixedlineid', // All line endings stripped
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });
    });

    describe('Punctuation and special characters', () => {
        test('should preserve punctuation and special characters', () => {
            const testCases = [
                {
                    input: 'external-123',
                    expected: 'external-123', // Hyphen preserved
                },
                {
                    input: 'user_id_456',
                    expected: 'user_id_456', // Underscores preserved
                },
                {
                    input: 'customer.789',
                    expected: 'customer.789', // Period preserved
                },
                {
                    input: 'simple@domain.com',
                    expected: 'simple@domain.com', // Email-like format preserved
                },
                {
                    input: 'id#123$special',
                    expected: 'id#123$special', // Hash and dollar signs preserved
                },
                {
                    input: 'user(456)test',
                    expected: 'user(456)test', // Parentheses preserved
                },
                {
                    input: 'id[789]brackets',
                    expected: 'id[789]brackets', // Brackets preserved
                },
                {
                    input: 'test{id}braces',
                    expected: 'test{id}braces', // Braces preserved
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should handle complex punctuation combinations', () => {
            const testCases = [
                {
                    input: 'user@domain.com_123',
                    expected: 'user@domain.com_123',
                },
                {
                    input: 'external-id.456$test',
                    expected: 'external-id.456$test',
                },
                {
                    input: 'complex!@#$%^&*()id',
                    expected: 'complex!@#$%^&*()id',
                },
                {
                    input: 'id_with-many.special@chars',
                    expected: 'id_with-many.special@chars',
                },
                {
                    input: 'test[123]{456}(789)',
                    expected: 'test[123]{456}(789)',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });
    });

    describe('Hashed external ID handling', () => {
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
                const result = getNormalizedExternalID(hash);
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
                const result = getNormalizedExternalID(input);
                expect(result).toEqual(expected);
            });
        });

        test('should handle hashes with whitespace', () => {
            const testCases = [
                {
                    input: '  a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3  ',
                    expected: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // Hash with whitespace stripped
                },
                {
                    input: '\te3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n',
                    expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // Hash with tabs/newlines stripped
                },
                {
                    input: '2CF24DBA4F21D4288094E8452703C0F0142FA00B2EEB1F2C9B4E70F39E8A4C29',
                    expected: '2CF24DBA4F21D4288094E8452703C0F0142FA00B2EEB1F2C9B4E70F39E8A4C29', // Valid hash returned as-is (not lowercased because it's detected as hash)
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedExternalID(input);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('Real-world external ID scenarios', () => {
        test('should handle common external ID formats', () => {
            const testCases = [
                {
                    input: 'user_12345',
                    expected: 'user_12345',
                },
                {
                    input: 'CUSTOMER-67890',
                    expected: 'customer-67890',
                },
                {
                    input: 'external.id.123',
                    expected: 'external.id.123',
                },
                {
                    input: 'ID@DOMAIN.COM',
                    expected: 'id@domain.com',
                },
                {
                    input: 'session_token_456789',
                    expected: 'session_token_456789',
                },
                {
                    input: 'API_KEY_ABC123XYZ',
                    expected: 'api_key_abc123xyz',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should handle UUID-like formats', () => {
            const testCases = [
                {
                    input: '550e8400-e29b-41d4-a716-446655440000',
                    expected: '550e8400-e29b-41d4-a716-446655440000',
                },
                {
                    input: '6BA7B810-9DAD-11D1-80B4-00C04FD430C8',
                    expected: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                },
                {
                    input: '  f47ac10b-58cc-4372-a567-0e02b2c3d479  ',
                    expected: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should handle database-style IDs', () => {
            const testCases = [
                {
                    input: 'usr_1a2b3c4d5e',
                    expected: 'usr_1a2b3c4d5e',
                },
                {
                    input: 'ORD_2023_001234',
                    expected: 'ord_2023_001234',
                },
                {
                    input: 'PROD#456789',
                    expected: 'prod#456789',
                },
                {
                    input: 'TXN_ID_789012345',
                    expected: 'txn_id_789012345',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should handle social media and platform IDs', () => {
            const testCases = [
                {
                    input: '@username123',
                    expected: '@username123',
                },
                {
                    input: 'FB_USER_456789',
                    expected: 'fb_user_456789',
                },
                {
                    input: 'INSTAGRAM_ID_789012',
                    expected: 'instagram_id_789012',
                },
                {
                    input: 'twitter:@handle',
                    expected: 'twitter:@handle',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should handle encoded and special format IDs', () => {
            const testCases = [
                {
                    input: 'base64_encoded_id_ABC123==',
                    expected: 'base64_encoded_id_abc123==',
                },
                {
                    input: 'URL-ENCODED%20ID%20456',
                    expected: 'url-encoded%20id%20456',
                },
                {
                    input: 'JSON:{"id": 789}',
                    expected: 'json:{"id":789}', // Spaces within strings are stripped
                },
                {
                    input: 'XML:<id>012</id>',
                    expected: 'xml:<id>012</id>',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });
    });

    describe('Type conversion edge cases', () => {
        test('should handle numeric edge cases', () => {
            const testCases = [
                {
                    input: 0,
                    expected: '0',
                },
                {
                    input: -0,
                    expected: '0', // -0 becomes '0'
                },
                {
                    input: Infinity,
                    expected: 'infinity', // String(Infinity) = 'Infinity' -> lowercase
                },
                {
                    input: -Infinity,
                    expected: '-infinity', // String(-Infinity) = '-Infinity' -> lowercase
                },
                {
                    input: NaN,
                    expected: 'nan', // String(NaN) = 'NaN' -> lowercase
                },
                {
                    input: 1e10,
                    expected: '10000000000', // Scientific notation converted
                },
                {
                    input: 0.000001,
                    expected: '0.000001', // Small decimal preserved
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should handle complex object types', () => {
            const testCases = [
                {
                    input: new Date('2023-01-01'),
                    expected: new Date('2023-01-01').toString().toLowerCase().replace(/\s+/g, ''), // Date toString, lowercase, all whitespace removed
                },
                {
                    input: /regex/gi,
                    expected: '/regex/gi', // RegExp toString (no spaces to strip)
                },
                {
                    input: function test() { return 'hello'; },
                    expected: function test() { return 'hello'; }.toString().toLowerCase().replace(/\s+/g, ''), // Function toString, lowercase, all whitespace removed
                },
                {
                    input: Symbol('test'),
                    expected: 'symbol(test)', // Symbol toString, lowercase (no spaces to strip)
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should handle arrays with various content', () => {
            const testCases = [
                {
                    input: [],
                    expected: '', // Empty array
                },
                {
                    input: [1],
                    expected: '1', // Single element
                },
                {
                    input: [1, 2, 3],
                    expected: '1,2,3', // Multiple numbers
                },
                {
                    input: ['a', 'b', 'c'],
                    expected: 'a,b,c', // Multiple strings
                },
                {
                    input: [true, false, null, undefined],
                    expected: 'true,false,,', // Mixed types with null/undefined
                },
                {
                    input: [{ id: 1 }, { id: 2 }],
                    expected: '[objectobject],[objectobject]', // Objects in array, spaces stripped
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });
    });

    describe('Performance and boundary conditions', () => {
        test('should handle very long strings gracefully', () => {
            const veryLongString = 'A'.repeat(10000);
            const result = getNormalizedExternalID(veryLongString);

            expect(result).toEqual('a'.repeat(10000)); // All uppercase A's become lowercase
            expect(result.length).toEqual(10000);
        });

        test('should handle strings with lots of whitespace', () => {
            const stringWithWhitespace = '  ' + ' '.repeat(1000) + 'external' + ' '.repeat(1000) + '  ';
            const result = getNormalizedExternalID(stringWithWhitespace);

            expect(result).toEqual('external'); // Only leading/trailing whitespace stripped
        });

        test('should handle Unicode characters', () => {
            const testCases = [
                {
                    input: 'External_ID_🚀',
                    expected: 'external_id_🚀', // Emoji preserved, case lowered
                },
                {
                    input: 'ID_WITH_ACCÉNTS',
                    expected: 'id_with_accénts', // Accented characters preserved, case lowered
                },
                {
                    input: 'Chinese_中文_ID',
                    expected: 'chinese_中文_id', // Chinese characters preserved
                },
                {
                    input: 'Arabic_عربي_ID',
                    expected: 'arabic_عربي_id', // Arabic characters preserved
                },
                {
                    input: 'Russian_русский_ID',
                    expected: 'russian_русский_id', // Cyrillic characters preserved
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should handle edge cases with special Unicode whitespace', () => {
            const testCases = [
                {
                    input: '\u00A0external\u00A0', // Non-breaking spaces
                    expected: 'external',
                },
                {
                    input: '\u2028external\u2028', // Line separator
                    expected: 'external',
                },
                {
                    input: '\u2029external\u2029', // Paragraph separator
                    expected: 'external',
                },
                {
                    input: '\u3000external\u3000', // Ideographic space
                    expected: 'external',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });

        test('should handle control characters and null bytes', () => {
            const testCases = [
                {
                    input: 'external\x00id', // Null byte
                    expected: 'external\x00id', // Preserved (only whitespace stripped)
                },
                {
                    input: 'external\x01id', // Start of heading
                    expected: 'external\x01id', // Preserved
                },
                {
                    input: 'external\x1Fid', // Unit separator
                    expected: 'external\x1fid', // Preserved, lowercased
                },
                {
                    input: '\x7Fexternal', // Delete character
                    expected: '\x7fexternal', // Preserved, lowercased
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedExternalID(input)).toEqual(expected);
            });
        });
    });
});
