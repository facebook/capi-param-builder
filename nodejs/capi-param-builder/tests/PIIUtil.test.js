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
    getNormalizedExternalID: jest.fn((value) => value),
}));

jest.mock('../src/piiUtil/zipCodeUtil', () => ({
    getNormalizedZipCode: jest.fn(),
}));

jest.mock('../src/piiUtil/sha256_with_dependencies_new', () => ({
    sha256_main: jest.fn(),
}));

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
const { sha256_main } = require('../src/piiUtil/sha256_with_dependencies_new');

describe('PIIUtil', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getNormalizedExternalID.mockImplementation((value) => value);
    });

    describe('getNormalizedPII', () => {
        describe('validation', () => {
            it('should return null for falsy piiValue', () => {
                expect(getNormalizedPII(null, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
                expect(getNormalizedPII(undefined, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
                expect(getNormalizedPII('', Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
            });

            it('should return null for non-string piiValue', () => {
                expect(getNormalizedPII(123, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
                expect(getNormalizedPII({}, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
            });

            it('should return null for falsy or non-string dataType', () => {
                expect(getNormalizedPII('test@example.com', null)).toBeNull();
                expect(getNormalizedPII('test@example.com', '')).toBeNull();
                expect(getNormalizedPII('test@example.com', 123)).toBeNull();
            });

            it('should return null for invalid dataType', () => {
                expect(getNormalizedPII('test@example.com', 'invalid_type')).toBeNull();
            });
        });

        describe('EMAIL', () => {
            it('should normalize email', () => {
                getNormalizedEmail.mockReturnValue('test@example.com');
                expect(getNormalizedPII('Test@Example.com', Constants.PII_DATA_TYPE.EMAIL)).toBe('test@example.com');
                expect(getNormalizedEmail).toHaveBeenCalledWith('Test@Example.com');
            });

            it('should return null if getNormalizedEmail returns null', () => {
                getNormalizedEmail.mockReturnValue(null);
                expect(getNormalizedPII('invalid', Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
            });
        });

        describe('PHONE', () => {
            it('should normalize phone', () => {
                getNormalizedPhone.mockReturnValue('+11234567890');
                expect(getNormalizedPII('1234567890', Constants.PII_DATA_TYPE.PHONE)).toBe('+11234567890');
            });
        });

        describe('DATE_OF_BIRTH', () => {
            it('should normalize DOB', () => {
                getNormalizedDOB.mockReturnValue('19900101');
                expect(getNormalizedPII('1990-01-01', Constants.PII_DATA_TYPE.DATE_OF_BIRTH)).toBe('19900101');
            });
        });

        describe('GENDER', () => {
            it('should normalize gender', () => {
                getNormalizedGender.mockReturnValue('m');
                expect(getNormalizedPII('male', Constants.PII_DATA_TYPE.GENDER)).toBe('m');
            });
        });

        describe('NAME', () => {
            it('should normalize first name', () => {
                getNormalizedName.mockReturnValue('john');
                expect(getNormalizedPII('John', Constants.PII_DATA_TYPE.FIRST_NAME)).toBe('john');
            });

            it('should normalize last name', () => {
                getNormalizedName.mockReturnValue('doe');
                expect(getNormalizedPII('Doe', Constants.PII_DATA_TYPE.LAST_NAME)).toBe('doe');
            });
        });

        describe('CITY', () => {
            it('should normalize city', () => {
                getNormalizedCity.mockReturnValue('newyork');
                expect(getNormalizedPII('New York', Constants.PII_DATA_TYPE.CITY)).toBe('newyork');
            });
        });

        describe('STATE', () => {
            it('should normalize state', () => {
                getNormalizedState.mockReturnValue('ca');
                expect(getNormalizedPII('California', Constants.PII_DATA_TYPE.STATE)).toBe('ca');
            });
        });

        describe('COUNTRY', () => {
            it('should normalize country', () => {
                getNormalizedCountry.mockReturnValue('us');
                expect(getNormalizedPII('United States', Constants.PII_DATA_TYPE.COUNTRY)).toBe('us');
            });
        });

        describe('EXTERNAL_ID', () => {
            it('should normalize external ID', () => {
                getNormalizedExternalID.mockImplementation((value) => {
                    if (value === Constants.PII_DATA_TYPE.EXTERNAL_ID) {
                        return Constants.PII_DATA_TYPE.EXTERNAL_ID;
                    }
                    return 'user_123';
                });
                expect(getNormalizedPII('USER_123', Constants.PII_DATA_TYPE.EXTERNAL_ID)).toBe('user_123');
            });
        });

        describe('ZIP_CODE', () => {
            it('should normalize zip code', () => {
                getNormalizedZipCode.mockReturnValue('12345');
                expect(getNormalizedPII('12345-6789', Constants.PII_DATA_TYPE.ZIP_CODE)).toBe('12345');
            });
        });
    });

    describe('getNormalizedAndHashedPII', () => {
        describe('validation', () => {
            it('should return null for falsy piiValue', () => {
                expect(getNormalizedAndHashedPII(null, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
                expect(getNormalizedAndHashedPII('', Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
                expect(getNormalizedAndHashedPII(0, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
            });

            it('should return null for non-string piiValue', () => {
                expect(getNormalizedAndHashedPII(123, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
                expect(getNormalizedAndHashedPII({}, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
            });
        });

        describe('hash detection - SHA-256', () => {
            it('should return lowercase for uppercase SHA-256', () => {
                const hash = 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
                const result = getNormalizedAndHashedPII(hash, Constants.PII_DATA_TYPE.EMAIL);
                expect(result).toBe(hash.toLowerCase());
                expect(sha256_main).not.toHaveBeenCalled();
            });

            it('should return as-is for lowercase SHA-256', () => {
                const hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
                expect(getNormalizedAndHashedPII(hash, Constants.PII_DATA_TYPE.EMAIL)).toBe(hash);
            });

            it('should handle mixed case SHA-256', () => {
                const hash = 'A665a45920422F9D417e4867efDC4fb8a04a1f3FFF1fa07E998e86F7f7A27AE3';
                expect(getNormalizedAndHashedPII(hash, Constants.PII_DATA_TYPE.EMAIL)).toBe(hash.toLowerCase());
            });
        });

        describe('hash detection - MD5', () => {
            it('should return lowercase for uppercase MD5', () => {
                const hash = '5D41402ABC4B2A76B9719D911017C592';
                expect(getNormalizedAndHashedPII(hash, Constants.PII_DATA_TYPE.EMAIL)).toBe(hash.toLowerCase());
            });

            it('should return as-is for lowercase MD5', () => {
                const hash = '5d41402abc4b2a76b9719d911017c592';
                expect(getNormalizedAndHashedPII(hash, Constants.PII_DATA_TYPE.EMAIL)).toBe(hash);
            });
        });

        describe('invalid hash detection', () => {
            it('should not treat 63 char hex as hash', () => {
                const notHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae';
                getNormalizedEmail.mockReturnValue('normalized');
                sha256_main.mockReturnValue('hashed');

                expect(getNormalizedAndHashedPII(notHash, Constants.PII_DATA_TYPE.EMAIL)).toBe('hashed');
                expect(sha256_main).toHaveBeenCalled();
            });

            it('should not treat 65 char hex as hash', () => {
                const notHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae33';
                getNormalizedEmail.mockReturnValue('normalized');
                sha256_main.mockReturnValue('hashed');

                expect(getNormalizedAndHashedPII(notHash, Constants.PII_DATA_TYPE.EMAIL)).toBe('hashed');
            });

            it('should not treat string with invalid hex chars as hash', () => {
                const notHash = 'g665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
                getNormalizedEmail.mockReturnValue('normalized');
                sha256_main.mockReturnValue('hashed');

                expect(getNormalizedAndHashedPII(notHash, Constants.PII_DATA_TYPE.EMAIL)).toBe('hashed');
            });
        });

        describe('non-hash processing', () => {
            it('should normalize and hash email', () => {
                getNormalizedEmail.mockReturnValue('test@example.com');
                sha256_main.mockReturnValue('hashed_email');

                const result = getNormalizedAndHashedPII('Test@Example.com', Constants.PII_DATA_TYPE.EMAIL);

                expect(getNormalizedEmail).toHaveBeenCalledWith('Test@Example.com');
                expect(sha256_main).toHaveBeenCalledWith('test@example.com');
                expect(result).toBe('hashed_email');
            });

            it('should normalize and hash phone', () => {
                getNormalizedPhone.mockReturnValue('+11234567890');
                sha256_main.mockReturnValue('hashed_phone');

                const result = getNormalizedAndHashedPII('1234567890', Constants.PII_DATA_TYPE.PHONE);

                expect(result).toBe('hashed_phone');
            });

            it('should return null when normalization returns null', () => {
                getNormalizedEmail.mockReturnValue(null);

                const result = getNormalizedAndHashedPII('invalid', Constants.PII_DATA_TYPE.EMAIL);

                expect(sha256_main).not.toHaveBeenCalled();
                expect(result).toBeNull();
            });
        });

        describe('all data types', () => {
            it('should work with all valid PII data types', () => {
                const testCases = [
                    { type: Constants.PII_DATA_TYPE.EMAIL, mockFn: getNormalizedEmail },
                    { type: Constants.PII_DATA_TYPE.PHONE, mockFn: getNormalizedPhone },
                    { type: Constants.PII_DATA_TYPE.DATE_OF_BIRTH, mockFn: getNormalizedDOB },
                    { type: Constants.PII_DATA_TYPE.GENDER, mockFn: getNormalizedGender },
                    { type: Constants.PII_DATA_TYPE.FIRST_NAME, mockFn: getNormalizedName },
                    { type: Constants.PII_DATA_TYPE.CITY, mockFn: getNormalizedCity },
                    { type: Constants.PII_DATA_TYPE.STATE, mockFn: getNormalizedState },
                    { type: Constants.PII_DATA_TYPE.COUNTRY, mockFn: getNormalizedCountry },
                    { type: Constants.PII_DATA_TYPE.ZIP_CODE, mockFn: getNormalizedZipCode },
                ];

                testCases.forEach(({ type, mockFn }) => {
                    jest.clearAllMocks();
                    mockFn.mockReturnValue('normalized');
                    sha256_main.mockReturnValue('hashed');

                    const result = getNormalizedAndHashedPII('test', type);
                    expect(result).toBe('hashed');
                });
            });
        });
    });
});
