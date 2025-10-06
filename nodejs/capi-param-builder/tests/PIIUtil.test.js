/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {
    getNormalizedAndHashedPII,
    getNormalizedPII
} = require('../src/piiUtil/PIIUtil');
const Constants = require('../src/model/Constants');
const { sha256_main } = require('../src/piiUtil/sha256_with_dependencies_new');

// Define the regex locally for testing since it's not exported
const SHA_256_OR_MD5_REGEX = /^[A-Fa-f0-9]{64}$|^[A-Fa-f0-9]{32}$/;

// Mock all the normalization functions
jest.mock('../src/piiUtil/emailUtil', () => ({
    getNormalizedEmail: jest.fn(),
}));

jest.mock('../src/piiUtil/phoneUtil', () => ({
    getNormalizedPhone: jest.fn(),
}));

jest.mock('../src/piiUtil/dobUtil', () => ({
    getNormalizedDOB: jest.fn(),
}));

jest.mock('../src/piiUtil/genderUtil', () => ({
    getNormalizedGender: jest.fn(),
}));

jest.mock('../src/piiUtil/stringUtil', () => ({
    getNormalizedName: jest.fn(),
    getNormalizedCity: jest.fn(),
    getNormalizedState: jest.fn(),
    getNormalizedCountry: jest.fn(),
    getNormalizedExternalID: jest.fn(),
}));

jest.mock('../src/piiUtil/zipCodeUtil', () => ({
    getNormalizedZipCode: jest.fn(),
}));

jest.mock('../src/piiUtil/sha256_with_dependencies_new', () => ({
    sha256_main: jest.fn(),
}));

// Import the mocked functions
const { getNormalizedEmail } = require('../src/piiUtil/emailUtil');
const { getNormalizedPhone } = require('../src/piiUtil/phoneUtil');
const { getNormalizedDOB } = require('../src/piiUtil/dobUtil');
const { getNormalizedGender } = require('../src/piiUtil/genderUtil');
const {
    getNormalizedName,
    getNormalizedCity,
    getNormalizedState,
    getNormalizedCountry,
    getNormalizedExternalID
} = require('../src/piiUtil/stringUtil');
const { getNormalizedZipCode } = require('../src/piiUtil/zipCodeUtil');

describe('PIIUtil', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('SHA_256_OR_MD5_REGEX', () => {
        test('should match valid SHA-256 hashes (64 hex chars)', () => {
            const validSHA256Hashes = [
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
                'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                '2cf24dba4f21d4288094e8452703c0f0142fa00b2eeb1f2c9b4e70f39e8a4c29',
                'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
                '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
            ];

            validSHA256Hashes.forEach((hash) => {
                expect(SHA_256_OR_MD5_REGEX.test(hash)).toBe(true);
            });
        });

        test('should match valid MD5 hashes (32 hex chars)', () => {
            const validMD5Hashes = [
                '5d41402abc4b2a76b9719d911017c592',
                '098f6bcd4621d373cade4e832627b4f6',
                '25d55ad283aa400af464c76d713c07ad',
                'ABCDEF1234567890ABCDEF1234567890',
                '1234567890abcdef1234567890abcdef',
                '0123456789abcdef0123456789abcdef',
                'fedcba9876543210fedcba9876543210',
            ];

            validMD5Hashes.forEach((hash) => {
                expect(SHA_256_OR_MD5_REGEX.test(hash)).toBe(true);
            });
        });

        test('should not match invalid hash lengths', () => {
            const invalidHashes = [
                '5d41402abc4b2a76b9719d911017c59', // 31 chars
                '5d41402abc4b2a76b9719d911017c5921', // 33 chars
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
                'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33', // 65 chars
                '123', // Too short
                '', // Empty string
                'abc123', // 6 chars
                '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1', // 65 chars
            ];

            invalidHashes.forEach((hash) => {
                expect(SHA_256_OR_MD5_REGEX.test(hash)).toBe(false);
            });
        });

        test('should not match strings with invalid hex characters', () => {
            const invalidHexHashes = [
                'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // Contains 'g'
                'z665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // Contains 'z'
                '5d41402abc4b2a76b9719d911017c59g', // Contains 'g' (MD5 length)
                '5d41402abc4b2a76b9719d911017c59!', // Contains '!'
                'hello_world_hash_123456789012345', // Contains underscores
                'hash-with-dashes-1234567890abcdef', // Contains dashes
            ];

            invalidHexHashes.forEach((hash) => {
                expect(SHA_256_OR_MD5_REGEX.test(hash)).toBe(false);
            });
        });
    });

    describe('getNormalizedAndHashedPII', () => {
        describe('Input validation', () => {
            test('should return null for falsy piiValue', () => {
                const falsyValues = [null, undefined, '', 0, false, NaN];

                falsyValues.forEach((value) => {
                    expect(getNormalizedAndHashedPII(value, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
                });
            });

            test('should return null for non-string piiValue', () => {
                const nonStringValues = [123, {}, [], true, 3.14, Symbol('test')];

                nonStringValues.forEach((value) => {
                    expect(getNormalizedAndHashedPII(value, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
                });
            });
        });

        describe('Hash detection and processing', () => {
            test('should return lowercase hash for valid SHA-256 hashes', () => {
                const testCases = [
                    {
                        input: 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3',
                        expected: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
                    },
                    {
                        input: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
                        expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                    },
                    {
                        input: '1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF',
                        expected: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                    },
                ];

                testCases.forEach(({ input, expected }) => {
                    const result = getNormalizedAndHashedPII(input, Constants.PII_DATA_TYPE.EMAIL);
                    expect(result).toEqual(expected);
                });
            });

            test('should return lowercase hash for valid MD5 hashes', () => {
                const testCases = [
                    {
                        input: '5D41402ABC4B2A76B9719D911017C592',
                        expected: '5d41402abc4b2a76b9719d911017c592',
                    },
                    {
                        input: '098F6BCD4621D373CADE4E832627B4F6',
                        expected: '098f6bcd4621d373cade4e832627b4f6',
                    },
                    {
                        input: '1234567890ABCDEF1234567890ABCDEF',
                        expected: '1234567890abcdef1234567890abcdef',
                    },
                ];

                testCases.forEach(({ input, expected }) => {
                    const result = getNormalizedAndHashedPII(input, Constants.PII_DATA_TYPE.EMAIL);
                    expect(result).toEqual(expected);
                });
            });

            test('should return already lowercase hashes as-is', () => {
                const lowercaseHashes = [
                    'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
                    '5d41402abc4b2a76b9719d911017c592',
                    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                ];

                lowercaseHashes.forEach((hash) => {
                    const result = getNormalizedAndHashedPII(hash, Constants.PII_DATA_TYPE.EMAIL);
                    expect(result).toEqual(hash);
                });
            });
        });

        describe('Non-hash string processing', () => {
            test('should hash non-hash strings using getNormalizedPII', () => {
                const testInput = 'test@example.com';
                const normalizedValue = 'test@example.com';
                const hashedValue = 'hashed_email_value';

                // Mock the specific normalization function instead of getNormalizedPII
                getNormalizedEmail.mockReturnValue(normalizedValue);
                sha256_main.mockReturnValue(hashedValue);

                const result = getNormalizedAndHashedPII(testInput, Constants.PII_DATA_TYPE.EMAIL);

                expect(result).toEqual(hashedValue);
                expect(sha256_main).toHaveBeenCalledWith(normalizedValue);
            });

            test('should hash null value if getNormalizedPII returns null', () => {
                const testInput = 'invalid_email';
                const hashedNullValue = 'hashed_null_value';

                // Mock the specific normalization function to return null
                getNormalizedEmail.mockReturnValue(null);
                sha256_main.mockReturnValue(hashedNullValue);

                const result = getNormalizedAndHashedPII(testInput, Constants.PII_DATA_TYPE.EMAIL);

                expect(result).toEqual(hashedNullValue);
                expect(sha256_main).toHaveBeenCalledWith(null);
            });

            test('should work with different data types', () => {
                const testCases = [
                    {
                        dataType: Constants.PII_DATA_TYPE.PHONE,
                        input: '1234567890',
                        normalizedValue: '+11234567890',
                        hashedValue: 'hashed_phone_value',
                        mockFunction: getNormalizedPhone,
                    },
                    {
                        dataType: Constants.PII_DATA_TYPE.FIRST_NAME,
                        input: 'John',
                        normalizedValue: 'john',
                        hashedValue: 'hashed_name_value',
                        mockFunction: getNormalizedName,
                    },
                    {
                        dataType: Constants.PII_DATA_TYPE.CITY,
                        input: 'New York',
                        normalizedValue: 'newyork',
                        hashedValue: 'hashed_city_value',
                        mockFunction: getNormalizedCity,
                    },
                ];

                testCases.forEach(({ dataType, input, normalizedValue, hashedValue, mockFunction }) => {
                    jest.clearAllMocks();

                    // Mock the specific normalization function
                    mockFunction.mockReturnValue(normalizedValue);
                    sha256_main.mockReturnValue(hashedValue);

                    const result = getNormalizedAndHashedPII(input, dataType);

                    expect(result).toEqual(hashedValue);
                    expect(sha256_main).toHaveBeenCalledWith(normalizedValue);
                });
            });
        });

        describe('Edge cases', () => {
            test('should handle strings that look like hashes but are not valid', () => {
                const invalidHashes = [
                    'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // Invalid hex char
                    'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae', // 63 chars
                    '5d41402abc4b2a76b9719d911017c59g', // Invalid hex char in MD5
                ];

                invalidHashes.forEach((hash) => {
                    const normalizedValue = 'normalized_value';
                    const hashedValue = 'hashed_value';

                    jest.clearAllMocks();
                    getNormalizedEmail.mockReturnValue(normalizedValue);
                    sha256_main.mockReturnValue(hashedValue);

                    const result = getNormalizedAndHashedPII(hash, Constants.PII_DATA_TYPE.EMAIL);

                    expect(result).toEqual(hashedValue);
                    expect(sha256_main).toHaveBeenCalledWith(normalizedValue);
                });
            });

            test('should handle empty string (falsy value)', () => {
                const result = getNormalizedAndHashedPII('', Constants.PII_DATA_TYPE.EMAIL);
                expect(result).toBeNull();
            });

            test('should handle whitespace-only strings', () => {
                const whitespaceStrings = ['   ', '\t\n\r', ' \t '];

                whitespaceStrings.forEach((str) => {
                    jest.clearAllMocks();

                    // These are truthy strings, so they will be processed
                    const normalizedValue = null; // Assuming normalization returns null for whitespace
                    const hashedValue = 'hashed_value';

                    getNormalizedEmail.mockReturnValue(normalizedValue);
                    sha256_main.mockReturnValue(hashedValue);

                    const result = getNormalizedAndHashedPII(str, Constants.PII_DATA_TYPE.EMAIL);

                    expect(result).toEqual(hashedValue);
                    expect(sha256_main).toHaveBeenCalledWith(normalizedValue);
                });
            });

            test('should handle case where getNormalizedPII returns null', () => {
                const testInput = 'invalid_data';
                const hashedNullValue = 'hashed_null_value';

                jest.clearAllMocks();
                getNormalizedEmail.mockReturnValue(null);
                sha256_main.mockReturnValue(hashedNullValue);

                const result = getNormalizedAndHashedPII(testInput, Constants.PII_DATA_TYPE.EMAIL);

                // The function still calls sha256_main even with null input
                expect(result).toEqual(hashedNullValue);
                expect(sha256_main).toHaveBeenCalledWith(null);
            });
        });
    });

    describe('getNormalizedPII', () => {
        describe('Input validation', () => {
            test('should return null for falsy piiValue', () => {
                const falsyValues = [null, undefined, '', 0, false, NaN];

                falsyValues.forEach((value) => {
                    expect(getNormalizedPII(value, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
                });
            });

            test('should return null for falsy dataType', () => {
                const falsyValues = [null, undefined, '', 0, false];

                falsyValues.forEach((dataType) => {
                    expect(getNormalizedPII('test@example.com', dataType)).toBeNull();
                });
            });

            test('should return null for non-string piiValue', () => {
                const nonStringValues = [123, {}, [], true, 3.14, Symbol('test')];

                nonStringValues.forEach((value) => {
                    expect(getNormalizedPII(value, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
                });
            });

            test('should return null for invalid dataType', () => {
                const invalidDataTypes = [
                    'invalid_type',
                    'not_a_pii_type',
                    'random_string',
                    123,
                    {},
                    [],
                ];

                invalidDataTypes.forEach((dataType) => {
                    expect(getNormalizedPII('test@example.com', dataType)).toBeNull();
                });
            });
        });

        describe('EMAIL data type', () => {
            test('should call getNormalizedEmail for email data type', () => {
                const testEmail = 'test@example.com';
                const normalizedEmail = 'test@example.com';

                getNormalizedEmail.mockReturnValue(normalizedEmail);

                const result = getNormalizedPII(testEmail, Constants.PII_DATA_TYPE.EMAIL);

                expect(getNormalizedEmail).toHaveBeenCalledWith(testEmail);
                expect(result).toEqual(normalizedEmail);
            });

            test('should return null if getNormalizedEmail returns null', () => {
                const testEmail = 'invalid_email';

                getNormalizedEmail.mockReturnValue(null);

                const result = getNormalizedPII(testEmail, Constants.PII_DATA_TYPE.EMAIL);

                expect(getNormalizedEmail).toHaveBeenCalledWith(testEmail);
                expect(result).toBeNull();
            });
        });

        describe('PHONE data type', () => {
            test('should call getNormalizedPhone for phone data type', () => {
                const testPhone = '1234567890';
                const normalizedPhone = '+11234567890';

                getNormalizedPhone.mockReturnValue(normalizedPhone);

                const result = getNormalizedPII(testPhone, Constants.PII_DATA_TYPE.PHONE);

                expect(getNormalizedPhone).toHaveBeenCalledWith(testPhone);
                expect(result).toEqual(normalizedPhone);
            });

            test('should return null if getNormalizedPhone returns null', () => {
                const testPhone = 'invalid_phone';

                getNormalizedPhone.mockReturnValue(null);

                const result = getNormalizedPII(testPhone, Constants.PII_DATA_TYPE.PHONE);

                expect(getNormalizedPhone).toHaveBeenCalledWith(testPhone);
                expect(result).toBeNull();
            });
        });

        describe('DATE_OF_BIRTH data type', () => {
            test('should call getNormalizedDOB for date_of_birth data type', () => {
                const testDOB = '1990-01-01';
                const normalizedDOB = '19900101';

                getNormalizedDOB.mockReturnValue(normalizedDOB);

                const result = getNormalizedPII(testDOB, Constants.PII_DATA_TYPE.DATE_OF_BIRTH);

                expect(getNormalizedDOB).toHaveBeenCalledWith(testDOB);
                expect(result).toEqual(normalizedDOB);
            });

            test('should return null if getNormalizedDOB returns null', () => {
                const testDOB = 'invalid_date';

                getNormalizedDOB.mockReturnValue(null);

                const result = getNormalizedPII(testDOB, Constants.PII_DATA_TYPE.DATE_OF_BIRTH);

                expect(getNormalizedDOB).toHaveBeenCalledWith(testDOB);
                expect(result).toBeNull();
            });
        });

        describe('GENDER data type', () => {
            test('should call getNormalizedGender for gender data type', () => {
                const testGender = 'male';
                const normalizedGender = 'm';

                getNormalizedGender.mockReturnValue(normalizedGender);

                const result = getNormalizedPII(testGender, Constants.PII_DATA_TYPE.GENDER);

                expect(getNormalizedGender).toHaveBeenCalledWith(testGender);
                expect(result).toEqual(normalizedGender);
            });

            test('should return null if getNormalizedGender returns null', () => {
                const testGender = 'invalid_gender';

                getNormalizedGender.mockReturnValue(null);

                const result = getNormalizedPII(testGender, Constants.PII_DATA_TYPE.GENDER);

                expect(getNormalizedGender).toHaveBeenCalledWith(testGender);
                expect(result).toBeNull();
            });
        });

        describe('NAME data types (FIRST_NAME and LAST_NAME)', () => {
            test('should call getNormalizedName for first_name data type', () => {
                const testName = 'John';
                const normalizedName = 'john';

                getNormalizedName.mockReturnValue(normalizedName);

                const result = getNormalizedPII(testName, Constants.PII_DATA_TYPE.FIRST_NAME);

                expect(getNormalizedName).toHaveBeenCalledWith(testName);
                expect(result).toEqual(normalizedName);
            });

            test('should call getNormalizedName for last_name data type', () => {
                const testName = 'Doe';
                const normalizedName = 'doe';

                getNormalizedName.mockReturnValue(normalizedName);

                const result = getNormalizedPII(testName, Constants.PII_DATA_TYPE.LAST_NAME);

                expect(getNormalizedName).toHaveBeenCalledWith(testName);
                expect(result).toEqual(normalizedName);
            });

            test('should return null if getNormalizedName returns null', () => {
                const testName = 'invalid_name';

                getNormalizedName.mockReturnValue(null);

                const result = getNormalizedPII(testName, Constants.PII_DATA_TYPE.FIRST_NAME);

                expect(getNormalizedName).toHaveBeenCalledWith(testName);
                expect(result).toBeNull();
            });
        });

        describe('CITY data type', () => {
            test('should call getNormalizedCity for city data type', () => {
                const testCity = 'New York';
                const normalizedCity = 'newyork';

                getNormalizedCity.mockReturnValue(normalizedCity);

                const result = getNormalizedPII(testCity, Constants.PII_DATA_TYPE.CITY);

                expect(getNormalizedCity).toHaveBeenCalledWith(testCity);
                expect(result).toEqual(normalizedCity);
            });

            test('should return null if getNormalizedCity returns null', () => {
                const testCity = 'invalid_city';

                getNormalizedCity.mockReturnValue(null);

                const result = getNormalizedPII(testCity, Constants.PII_DATA_TYPE.CITY);

                expect(getNormalizedCity).toHaveBeenCalledWith(testCity);
                expect(result).toBeNull();
            });
        });

        describe('STATE data type', () => {
            test('should call getNormalizedState for state data type', () => {
                const testState = 'California';
                const normalizedState = 'ca';

                getNormalizedState.mockReturnValue(normalizedState);

                const result = getNormalizedPII(testState, Constants.PII_DATA_TYPE.STATE);

                expect(getNormalizedState).toHaveBeenCalledWith(testState);
                expect(result).toEqual(normalizedState);
            });

            test('should return null if getNormalizedState returns null', () => {
                const testState = 'invalid_state';

                getNormalizedState.mockReturnValue(null);

                const result = getNormalizedPII(testState, Constants.PII_DATA_TYPE.STATE);

                expect(getNormalizedState).toHaveBeenCalledWith(testState);
                expect(result).toBeNull();
            });
        });

        describe('COUNTRY data type', () => {
            test('should call getNormalizedCountry for country data type', () => {
                const testCountry = 'United States';
                const normalizedCountry = 'us';

                getNormalizedCountry.mockReturnValue(normalizedCountry);

                const result = getNormalizedPII(testCountry, Constants.PII_DATA_TYPE.COUNTRY);

                expect(getNormalizedCountry).toHaveBeenCalledWith(testCountry);
                expect(result).toEqual(normalizedCountry);
            });

            test('should return null if getNormalizedCountry returns null', () => {
                const testCountry = 'invalid_country';

                getNormalizedCountry.mockReturnValue(null);

                const result = getNormalizedPII(testCountry, Constants.PII_DATA_TYPE.COUNTRY);

                expect(getNormalizedCountry).toHaveBeenCalledWith(testCountry);
                expect(result).toBeNull();
            });
        });

        describe('EXTERNAL_ID data type', () => {
            test('should call getNormalizedExternalID for external_id data type', () => {
                const testExternalId = 'USER_123';
                const normalizedExternalId = 'user_123';

                getNormalizedExternalID.mockReturnValue(normalizedExternalId);

                const result = getNormalizedPII(testExternalId, Constants.PII_DATA_TYPE.EXTERNAL_ID);

                expect(getNormalizedExternalID).toHaveBeenCalledWith(testExternalId);
                expect(result).toEqual(normalizedExternalId);
            });

            test('should return null if getNormalizedExternalID returns null', () => {
                const testExternalId = 'invalid_external_id';

                getNormalizedExternalID.mockReturnValue(null);

                const result = getNormalizedPII(testExternalId, Constants.PII_DATA_TYPE.EXTERNAL_ID);

                expect(getNormalizedExternalID).toHaveBeenCalledWith(testExternalId);
                expect(result).toBeNull();
            });
        });

        describe('ZIP_CODE data type', () => {
            test('should call getNormalizedZipCode for zip_code data type', () => {
                const testZipCode = '12345-6789';
                const normalizedZipCode = '12345';

                getNormalizedZipCode.mockReturnValue(normalizedZipCode);

                const result = getNormalizedPII(testZipCode, Constants.PII_DATA_TYPE.ZIP_CODE);

                expect(getNormalizedZipCode).toHaveBeenCalledWith(testZipCode);
                expect(result).toEqual(normalizedZipCode);
            });

            test('should return null if getNormalizedZipCode returns null', () => {
                const testZipCode = 'invalid_zip';

                getNormalizedZipCode.mockReturnValue(null);

                const result = getNormalizedPII(testZipCode, Constants.PII_DATA_TYPE.ZIP_CODE);

                expect(getNormalizedZipCode).toHaveBeenCalledWith(testZipCode);
                expect(result).toBeNull();
            });
        });

        describe('Integration tests with actual data', () => {
            test('should handle multiple data types correctly', () => {
                const testCases = [
                    {
                        piiValue: 'test@example.com',
                        dataType: Constants.PII_DATA_TYPE.EMAIL,
                        mockFunction: getNormalizedEmail,
                        expected: 'test@example.com',
                    },
                    {
                        piiValue: '1234567890',
                        dataType: Constants.PII_DATA_TYPE.PHONE,
                        mockFunction: getNormalizedPhone,
                        expected: '+11234567890',
                    },
                    {
                        piiValue: '1990-01-01',
                        dataType: Constants.PII_DATA_TYPE.DATE_OF_BIRTH,
                        mockFunction: getNormalizedDOB,
                        expected: '19900101',
                    },
                    {
                        piiValue: 'male',
                        dataType: Constants.PII_DATA_TYPE.GENDER,
                        mockFunction: getNormalizedGender,
                        expected: 'm',
                    },
                    {
                        piiValue: 'John',
                        dataType: Constants.PII_DATA_TYPE.FIRST_NAME,
                        mockFunction: getNormalizedName,
                        expected: 'john',
                    },
                    {
                        piiValue: 'New York',
                        dataType: Constants.PII_DATA_TYPE.CITY,
                        mockFunction: getNormalizedCity,
                        expected: 'newyork',
                    },
                    {
                        piiValue: 'California',
                        dataType: Constants.PII_DATA_TYPE.STATE,
                        mockFunction: getNormalizedState,
                        expected: 'ca',
                    },
                    {
                        piiValue: 'United States',
                        dataType: Constants.PII_DATA_TYPE.COUNTRY,
                        mockFunction: getNormalizedCountry,
                        expected: 'us',
                    },
                    {
                        piiValue: 'USER_123',
                        dataType: Constants.PII_DATA_TYPE.EXTERNAL_ID,
                        mockFunction: getNormalizedExternalID,
                        expected: 'user_123',
                    },
                    {
                        piiValue: '12345-6789',
                        dataType: Constants.PII_DATA_TYPE.ZIP_CODE,
                        mockFunction: getNormalizedZipCode,
                        expected: '12345',
                    },
                ];

                testCases.forEach(({ piiValue, dataType, mockFunction, expected }) => {
                    jest.clearAllMocks();
                    mockFunction.mockReturnValue(expected);

                    const result = getNormalizedPII(piiValue, dataType);

                    expect(mockFunction).toHaveBeenCalledWith(piiValue);
                    expect(result).toEqual(expected);
                });
            });

            test('should handle cases where normalization functions return null', () => {
                const testCases = [
                    {
                        piiValue: 'invalid_email',
                        dataType: Constants.PII_DATA_TYPE.EMAIL,
                        mockFunction: getNormalizedEmail,
                    },
                    {
                        piiValue: 'invalid_phone',
                        dataType: Constants.PII_DATA_TYPE.PHONE,
                        mockFunction: getNormalizedPhone,
                    },
                    {
                        piiValue: 'invalid_date',
                        dataType: Constants.PII_DATA_TYPE.DATE_OF_BIRTH,
                        mockFunction: getNormalizedDOB,
                    },
                    {
                        piiValue: 'invalid_gender',
                        dataType: Constants.PII_DATA_TYPE.GENDER,
                        mockFunction: getNormalizedGender,
                    },
                    {
                        piiValue: 'invalid_name',
                        dataType: Constants.PII_DATA_TYPE.FIRST_NAME,
                        mockFunction: getNormalizedName,
                    },
                    {
                        piiValue: 'invalid_city',
                        dataType: Constants.PII_DATA_TYPE.CITY,
                        mockFunction: getNormalizedCity,
                    },
                    {
                        piiValue: 'invalid_state',
                        dataType: Constants.PII_DATA_TYPE.STATE,
                        mockFunction: getNormalizedState,
                    },
                    {
                        piiValue: 'invalid_country',
                        dataType: Constants.PII_DATA_TYPE.COUNTRY,
                        mockFunction: getNormalizedCountry,
                    },
                    {
                        piiValue: 'invalid_external_id',
                        dataType: Constants.PII_DATA_TYPE.EXTERNAL_ID,
                        mockFunction: getNormalizedExternalID,
                    },
                    {
                        piiValue: 'invalid_zip',
                        dataType: Constants.PII_DATA_TYPE.ZIP_CODE,
                        mockFunction: getNormalizedZipCode,
                    },
                ];

                testCases.forEach(({ piiValue, dataType, mockFunction }) => {
                    jest.clearAllMocks();
                    mockFunction.mockReturnValue(null);

                    const result = getNormalizedPII(piiValue, dataType);

                    expect(mockFunction).toHaveBeenCalledWith(piiValue);
                    expect(result).toBeNull();
                });
            });

            test('should return null for empty string inputs (handled at function level)', () => {
                // Empty strings are handled at the function level, not by individual normalization functions
                const testCases = [
                    { dataType: Constants.PII_DATA_TYPE.EMAIL },
                    { dataType: Constants.PII_DATA_TYPE.PHONE },
                    { dataType: Constants.PII_DATA_TYPE.DATE_OF_BIRTH },
                    { dataType: Constants.PII_DATA_TYPE.GENDER },
                    { dataType: Constants.PII_DATA_TYPE.FIRST_NAME },
                    { dataType: Constants.PII_DATA_TYPE.CITY },
                    { dataType: Constants.PII_DATA_TYPE.STATE },
                    { dataType: Constants.PII_DATA_TYPE.COUNTRY },
                    { dataType: Constants.PII_DATA_TYPE.EXTERNAL_ID },
                    { dataType: Constants.PII_DATA_TYPE.ZIP_CODE },
                ];

                testCases.forEach(({ dataType }) => {
                    jest.clearAllMocks();

                    const result = getNormalizedPII('', dataType);

                    expect(result).toBeNull();
                    // No normalization functions should be called for empty strings
                    expect(getNormalizedEmail).not.toHaveBeenCalled();
                    expect(getNormalizedPhone).not.toHaveBeenCalled();
                    expect(getNormalizedDOB).not.toHaveBeenCalled();
                    expect(getNormalizedGender).not.toHaveBeenCalled();
                    expect(getNormalizedName).not.toHaveBeenCalled();
                    expect(getNormalizedCity).not.toHaveBeenCalled();
                    expect(getNormalizedState).not.toHaveBeenCalled();
                    expect(getNormalizedCountry).not.toHaveBeenCalled();
                    expect(getNormalizedExternalID).not.toHaveBeenCalled();
                    expect(getNormalizedZipCode).not.toHaveBeenCalled();
                });
            });
        });

        describe('Edge cases and error handling', () => {
            test('should handle very long strings', () => {
                const veryLongString = 'a'.repeat(10000);

                getNormalizedEmail.mockReturnValue('normalized_very_long_email');

                const result = getNormalizedPII(veryLongString, Constants.PII_DATA_TYPE.EMAIL);

                expect(getNormalizedEmail).toHaveBeenCalledWith(veryLongString);
                expect(result).toEqual('normalized_very_long_email');
            });

            test('should handle Unicode characters', () => {
                const unicodeString = 'test@例え.com';

                getNormalizedEmail.mockReturnValue('test@例え.com');

                const result = getNormalizedPII(unicodeString, Constants.PII_DATA_TYPE.EMAIL);

                expect(getNormalizedEmail).toHaveBeenCalledWith(unicodeString);
                expect(result).toEqual('test@例え.com');
            });

            test('should handle special characters', () => {
                const specialString = 'test@domain!#$.com';

                getNormalizedEmail.mockReturnValue('test@domain.com');

                const result = getNormalizedPII(specialString, Constants.PII_DATA_TYPE.EMAIL);

                expect(getNormalizedEmail).toHaveBeenCalledWith(specialString);
                expect(result).toEqual('test@domain.com');
            });
        });

        describe('Performance considerations', () => {
            test('should not call normalization function for invalid data types', () => {
                const result = getNormalizedPII('test@example.com', 'invalid_type');

                expect(result).toBeNull();
                expect(getNormalizedEmail).not.toHaveBeenCalled();
                expect(getNormalizedPhone).not.toHaveBeenCalled();
                expect(getNormalizedDOB).not.toHaveBeenCalled();
                expect(getNormalizedGender).not.toHaveBeenCalled();
                expect(getNormalizedName).not.toHaveBeenCalled();
                expect(getNormalizedCity).not.toHaveBeenCalled();
                expect(getNormalizedState).not.toHaveBeenCalled();
                expect(getNormalizedCountry).not.toHaveBeenCalled();
                expect(getNormalizedExternalID).not.toHaveBeenCalled();
                expect(getNormalizedZipCode).not.toHaveBeenCalled();
            });

            test('should not call normalization function for invalid piiValue', () => {
                const result = getNormalizedPII(null, Constants.PII_DATA_TYPE.EMAIL);

                expect(result).toBeNull();
                expect(getNormalizedEmail).not.toHaveBeenCalled();
            });
        });
    });

    describe('Error handling and boundary conditions', () => {
        test('should handle undefined Constants', () => {
            // Test that we handle missing constants gracefully
            const result = getNormalizedPII('test@example.com', undefined);
            expect(result).toBeNull();
        });

        test('should handle null Constants', () => {
            const result = getNormalizedPII('test@example.com', null);
            expect(result).toBeNull();
        });

        test('should handle empty string dataType', () => {
            const result = getNormalizedPII('test@example.com', '');
            expect(result).toBeNull();
        });

        test('should handle numeric dataType', () => {
            const result = getNormalizedPII('test@example.com', 123);
            expect(result).toBeNull();
        });

        test('should handle object dataType', () => {
            const result = getNormalizedPII('test@example.com', {});
            expect(result).toBeNull();
        });

        test('should handle array dataType', () => {
            const result = getNormalizedPII('test@example.com', []);
            expect(result).toBeNull();
        });
    });

    describe('Comprehensive integration scenarios', () => {
        test('should handle mixed case data types (if supported)', () => {
            // Test case sensitivity of data types
            const result = getNormalizedPII('test@example.com', 'EMAIL'); // Uppercase
            expect(result).toBeNull(); // Should be null because constant should be exact match
        });

        test('should work with all valid PII data types', () => {
            const validDataTypes = [
                Constants.PII_DATA_TYPE.EMAIL,
                Constants.PII_DATA_TYPE.PHONE,
                Constants.PII_DATA_TYPE.DATE_OF_BIRTH,
                Constants.PII_DATA_TYPE.GENDER,
                Constants.PII_DATA_TYPE.FIRST_NAME,
                Constants.PII_DATA_TYPE.LAST_NAME,
                Constants.PII_DATA_TYPE.CITY,
                Constants.PII_DATA_TYPE.STATE,
                Constants.PII_DATA_TYPE.COUNTRY,
                Constants.PII_DATA_TYPE.EXTERNAL_ID,
                Constants.PII_DATA_TYPE.ZIP_CODE,
            ];

            validDataTypes.forEach((dataType) => {
                jest.clearAllMocks();

                // Mock all functions to return a test value
                getNormalizedEmail.mockReturnValue('email');
                getNormalizedPhone.mockReturnValue('phone');
                getNormalizedDOB.mockReturnValue('dob');
                getNormalizedGender.mockReturnValue('gender');
                getNormalizedName.mockReturnValue('name');
                getNormalizedCity.mockReturnValue('city');
                getNormalizedState.mockReturnValue('state');
                getNormalizedCountry.mockReturnValue('country');
                getNormalizedExternalID.mockReturnValue('external_id');
                getNormalizedZipCode.mockReturnValue('zipcode');

                const result = getNormalizedPII('test_value', dataType);

                expect(result).not.toBeNull();
                expect(typeof result).toBe('string');
            });
        });
    });
});
