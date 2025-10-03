/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { getNormalizedEmail } = require('../src/piiUtil/emailUtil');

describe('getNormalizedEmail', () => {
    describe('Input validation', () => {

        test('should throw error for non-string input', () => {
            const nonStringValues = [123, {}, [], true, false, null, undefined];

            nonStringValues.forEach((value) => {
                // The function expects a string and will call .toLowerCase() on it
                // Non-string values should cause an error
                expect(() => getNormalizedEmail(value)).toThrow();
            });
        });

        test('should return null for empty string input', () => {
            expect(getNormalizedEmail('')).toBeNull();
        });

        test('should return null for whitespace-only input', () => {
            expect(getNormalizedEmail('   ')).toBeNull();
            expect(getNormalizedEmail('\t\n\r')).toBeNull();
            expect(getNormalizedEmail('  \t  \n  \r  ')).toBeNull();
        });
    });

    describe('Email normalization', () => {
        test('should normalize valid email addresses', () => {
            const testCases = [
                {
                    input: '     John_Smith@gmail.com    ',
                    expected: 'john_smith@gmail.com',
                },
                {
                    input: '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d',
                    expected: '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d',
                },
                {
                    input: 'someone@domain.com',
                    expected: 'someone@domain.com',
                },
                {
                    input: '    SomeOne@domain.com  ',
                    expected: 'someone@domain.com',
                },
                {
                    input: 'test@example.com',
                    expected: 'test@example.com',
                },
                {
                    input: 'TEST@EXAMPLE.COM',
                    expected: 'test@example.com',
                },
                {
                    input: '  test@example.com  ',
                    expected: 'test@example.com',
                },
                {
                    input: '\tTEST@EXAMPLE.COM\n',
                    expected: 'test@example.com',
                },
                {
                    input: 'user.name+tag@domain.co.uk',
                    expected: 'user.name+tag@domain.co.uk',
                },
                {
                    input: 'user123@subdomain.example.org',
                    expected: 'user123@subdomain.example.org',
                },
                {
                    input: 'user_name@example.com',
                    expected: 'user_name@example.com',
                },
                {
                    input: 'user-name@example.com',
                    expected: 'user-name@example.com',
                },
                {
                    input: "test'name@example.com",
                    expected: "test'name@example.com",
                },
                {
                    input: '     John_Smith@gmail.com    ',
                    expected: 'john_smith@gmail.com',
                },
                {
                    input: 'someone@domain.com',
                    expected: 'someone@domain.com',
                },
                {
                    input: '    SomeOne@domain.com  ',
                    expected: 'someone@domain.com',
                },
                {
                    input: 'MixedCase@DOMAIN.COM',
                    expected: 'mixedcase@domain.com',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(getNormalizedEmail(input)).toEqual(expected);
            });
        });

        test('should return null for invalid email addresses', () => {
            const invalidEmails = [
                'invalid-email',
                '@example.com',
                'test@',
                'test..test@example.com',
                'test@example',
                'test@example.',
                'test @example.com',
                'test@exam ple.com',
                'plaintext',
                'test@@example.com',
                'test@.example.com',
                'test@example..com',
                '.test@example.com',
                'test.@example.com',
                'test@example.com.',
                'test@',
                '@test.com',
                'test@com',
                'test space@example.com',
                'test@example .com',
            ];

            invalidEmails.forEach((email) => {
                const result = getNormalizedEmail(email);
                expect(result).toBeNull();
            });
        });

        test('should handle special characters in valid email addresses', () => {
            const specialCharEmails = [
                'test+tag@example.com',
                'user.name@example.com',
                'user_name@example.com',
                'user-name@example.com',
                "test'name@example.com",
                'test#name@example.com',
                'test$name@example.com',
                'test%name@example.com',
                'test&name@example.com',
                'test*name@example.com',
                'test=name@example.com',
                'test?name@example.com',
                'test^name@example.com',
                'test`name@example.com',
                'test{name@example.com',
                'test|name@example.com',
                'test}name@example.com',
                'test~name@example.com',
            ];

            specialCharEmails.forEach((email) => {
                const result = getNormalizedEmail(email);
                expect(result).toEqual(email.toLowerCase());
            });
        });

        test('should handle international domain names', () => {
            const internationalEmails = [
                'test@example.co.uk',
                'test@example.org.au',
                'test@subdomain.example.museum',
                'test@example.travel',
                'user@domain.info',
                'test@example.name',
                'email@sub.domain.example.com',
            ];

            internationalEmails.forEach((email) => {
                const result = getNormalizedEmail(email);
                expect(result).toEqual(email.toLowerCase());
            });
        });

        test('should handle very long valid email addresses', () => {
            const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
            const result = getNormalizedEmail(longEmail);
            expect(result).toEqual(longEmail.toLowerCase());
        });

        test('should handle emails with leading/trailing spaces correctly', () => {
            const testCases = [
                {
                    input: ' test@example.com',
                    expected: 'test@example.com',
                },
                {
                    input: 'test@example.com ',
                    expected: 'test@example.com',
                },
                {
                    input: ' test@example.com ',
                    expected: 'test@example.com',
                },
                {
                    input: '\t\ntest@example.com\r\n',
                    expected: 'test@example.com',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = getNormalizedEmail(input);
                expect(result).toEqual(expected);
            });
        });
    });

    describe('Hashed email handling', () => {
        test('should return SHA-256 hash as-is when it looks like a hash', () => {
            const validHashes = [
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 'hello' hashed
                'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty string hashed
                '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29', // 'hello' in different case
                'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890', // uppercase hash
                '8df99a46f811595e1a1de5016e2445bc202f72b946482032a75aec528a0a350d',
                '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // all valid hex chars
                'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210', // reverse order
            ];

            validHashes.forEach((hash) => {
                const result = getNormalizedEmail(hash);
                expect(result).toEqual(hash);
            });
        });

        test('should process invalid hash-like strings as regular emails', () => {
            const invalidHashes = [
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars
                'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'g'
                'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE!', // invalid char '!'
                '', // empty string
                '123', // too short
                'z665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // invalid char 'z'
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27a 3', // space in middle
            ];

            invalidHashes.forEach((hash) => {
                const result = getNormalizedEmail(hash);
                // These will be processed as regular emails and likely return null since they're invalid
                expect(result).toBeNull();
            });
        });

        test('should handle mixed case hashed emails', () => {
            const mixedCaseHash =
                'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
            const result = getNormalizedEmail(mixedCaseHash);
            expect(result).toEqual(mixedCaseHash);
        });

        test('should handle lowercase hashed emails', () => {
            const lowercaseHash =
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
            const result = getNormalizedEmail(lowercaseHash);
            expect(result).toEqual(lowercaseHash);
        });
    });

    describe('Edge cases with email validation', () => {
        test('should handle emails with consecutive dots', () => {
            const consecutiveDotEmails = [
                'test..name@example.com',
                'test@example..com',
                'test@exam..ple.com',
                'test.....name@example.com',
                'test@example.....com',
            ];

            consecutiveDotEmails.forEach((email) => {
                const result = getNormalizedEmail(email);
                // These should return null since they don't match the regex
                expect(result).toBeNull();
            });
        });

        test('should handle emails with spaces in the middle', () => {
            const spacedEmails = [
                'test @example.com',
                'test@ example.com',
                'test@exam ple.com',
                'test name@example.com',
                'test@example .com',
            ];

            spacedEmails.forEach((email) => {
                const result = getNormalizedEmail(email);
                // These should return null since they don't match the regex after trimming
                expect(result).toBeNull();
            });
        });

        test('should handle emails starting or ending with dots', () => {
            const dotEmails = [
                '.test@example.com',
                'test.@example.com',
                'test@.example.com',
                'test@example.com.',
            ];

            dotEmails.forEach((email) => {
                const result = getNormalizedEmail(email);
                expect(result).toBeNull();
            });
        });
    });

    describe('Email regex edge cases', () => {
        test('should handle valid complex email formats', () => {
            const complexEmails = [
                'test.email.with+symbol@example.com',
                'test_email_with_underscores@sub.domain.example.com',
                'test-email-with-dashes@example-domain.com',
                'email123@123domain.com',
                'x@y.co', // minimal valid email
                'a@b.io',
                'user+filter@domain.org',
                'test123_456@sub-domain.example-site.com',
            ];

            complexEmails.forEach((email) => {
                const result = getNormalizedEmail(email);
                expect(result).toEqual(email.toLowerCase());
            });
        });

        test('should reject emails with invalid characters', () => {
            const invalidCharEmails = [
                'test email@example.com', // space in local part
                'test@example .com', // space in domain
                'test@example[.com', // bracket in domain
                'test@example].com', // bracket in domain
                'test@example(.com', // parenthesis in domain
                'test@example).com', // parenthesis in domain
                'test<@example.com', // angle bracket
                'test>@example.com', // angle bracket
                'test,@example.com', // comma
                'test;@example.com', // semicolon
                'test:@example.com', // colon (not in domain)
                'test"@example.com', // quote
                'test\\@example.com', // backslash
            ];

            invalidCharEmails.forEach((email) => {
                const result = getNormalizedEmail(email);
                expect(result).toBeNull();
            });
        });
    });

    describe('Boundary conditions', () => {
        test('should handle extremely short valid emails', () => {
            const shortEmails = [
                'a@b.co',
                'x@y.org',
                '1@2.io',
            ];

            shortEmails.forEach((email) => {
                const result = getNormalizedEmail(email);
                expect(result).toEqual(email.toLowerCase());
            });
        });

        test('should handle emails with maximum valid special characters', () => {
            const maxSpecialEmail = "test!#$%&'*+/=?^`{|}~-@example.com";
            const result = getNormalizedEmail(maxSpecialEmail);
            expect(result).toEqual(maxSpecialEmail.toLowerCase());
        });

        test('should handle domains with numbers', () => {
            const numericDomainEmails = [
                'test@123.com',
                'user@domain123.org',
                'email@sub123.domain456.com',
                'test@1a2b3c.net',
            ];

            numericDomainEmails.forEach((email) => {
                const result = getNormalizedEmail(email);
                expect(result).toEqual(email.toLowerCase());
            });
        });

        test('should handle local parts with numbers', () => {
            const numericLocalEmails = [
                '123@example.com',
                'user123@domain.org',
                '1a2b3c@example.net',
                'test456user@domain.com',
            ];

            numericLocalEmails.forEach((email) => {
                const result = getNormalizedEmail(email);
                expect(result).toEqual(email.toLowerCase());
            });
        });
    });

    describe('Performance and edge input handling', () => {
        test('should handle very long invalid inputs gracefully', () => {
            const veryLongInvalid = 'a'.repeat(1000); // No @ symbol
            const result = getNormalizedEmail(veryLongInvalid);
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
            ];

            specialOnlyInputs.forEach((input) => {
                const result = getNormalizedEmail(input);
                expect(result).toBeNull();
            });
        });
    });
});
