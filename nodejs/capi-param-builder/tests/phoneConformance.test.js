/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
const { getNormalizedPhone } = require('../src/piiUtil/phoneUtil');
const { getNormalizedAndHashedPII, getNormalizedPII } = require('../src/piiUtil/PIIUtil');
const Constants = require('../src/model/Constants');
const { ParamBuilder, PII_DATA_TYPE } = require('../index');
const { version: PACKAGE_VERSION } = require('../package.json');

// SHA-256 fixtures computed independently from the normalized digit strings.
const PHONE_SHA = 'd6736136ea896c1bfdc553e0e86e702c70d060d805696ca3e4e9e0961353860a';
const NATIONAL_PHONE_SHA = '3c95277da5fd0da6a1a44ee3fdf56d20af6c6d242695a40e18e6e90dc3c5872c';
const SHA = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
const SHA_DIGITS = '66545920422941748674804131079988677273';
const SHA_DIGITS_HASH = '5b5cd26286f3ed59a0368dfccebade2abb0bf040c75a81eb99e5b6b033e05393';
const MD5 = '5d41402abc4b2a76b9719d911017c592';

function appendixSuffix(type) {
    const version = PACKAGE_VERSION.split('.').map(Number);
    return Buffer.from([0x01, 0x04, type, ...version])
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

const NET_NEW = appendixSuffix(0x02);
const NO_CHANGE = appendixSuffix(0x00);

function normalizeAndHash(input) {
    return getNormalizedAndHashedPII(input, Constants.PII_DATA_TYPE.PHONE);
}

describe('Phone normalization and hashing contracts', () => {
    test('hashes formatted phone digits to an exact digest and version appendix', () => {
        expect(getNormalizedPII('  001 (555) 123-4567  ', Constants.PII_DATA_TYPE.PHONE)).toBe('15551234567');
        const actual = normalizeAndHash('  001 (555) 123-4567  ');
        expect(actual).toBe(PHONE_SHA + '.' + NET_NEW);
        expect([...Buffer.from(actual.split('.')[1], 'base64')]).toEqual([
            0x01, 0x04, 0x02, ...PACKAGE_VERSION.split('.').map(Number),
        ]);
    });

    test('hashes a national number without adding a country code', () => {
        expect(normalizeAndHash('555-123-4567')).toBe(NATIONAL_PHONE_SHA + '.' + NET_NEW);
    });

    test.each([
        ['', null],
        ['not-a-number', ''],
        ['0000', ''],
        [' \t\r\n ', ''],
    ])('does not hash empty normalized input %p', (input, normalized) => {
        expect(getNormalizedPII(input, Constants.PII_DATA_TYPE.PHONE)).toBe(normalized);
        expect(normalizeAndHash(input)).toBeNull();
    });

    test.each([null, undefined, true, false, {}, [], ['15551234567']])(
        'rejects non-string phone input %p at the dispatcher',
        (input) => {
            expect(getNormalizedPII(input, Constants.PII_DATA_TYPE.PHONE)).toBeNull();
            expect(normalizeAndHash(input)).toBeNull();
        },
    );

    test('keeps direct numeric coercion separate from dispatcher validation', () => {
        expect(getNormalizedPhone(123)).toBe('123');
        expect(getNormalizedPII(123, Constants.PII_DATA_TYPE.PHONE)).toBeNull();
        expect(normalizeAndHash(123)).toBeNull();
    });

    test('normalizes bare MD5 as phone digits only at the raw boundary', () => {
        expect(getNormalizedPhone(MD5)).toBe('54140242769719911017592');
        expect(getNormalizedPII(MD5, Constants.PII_DATA_TYPE.PHONE)).toBe('54140242769719911017592');
        expect(normalizeAndHash(MD5)).toBe(MD5 + '.' + NO_CHANGE);
    });

    test('preserves raw SHA case but strips letters from padded SHA', () => {
        expect(getNormalizedPhone(SHA.toUpperCase())).toBe(SHA.toUpperCase());
        expect(getNormalizedPhone(' ' + SHA.toUpperCase() + ' ')).toBe(SHA_DIGITS);
        expect(getNormalizedPII(' ' + SHA.toUpperCase() + ' ', Constants.PII_DATA_TYPE.PHONE)).toBe(SHA_DIGITS);
    });

    test.each([SHA, MD5])('trims and lowercases padded prehash %s before normalization', (input) => {
        expect(normalizeAndHash(' ' + input.toUpperCase() + ' ')).toBe(input + '.' + NO_CHANGE);
    });

    test.each([SHA + '.BA', SHA.toUpperCase() + '.ZZZZZZZZ', MD5 + '.AQYCAQAA'])(
        'preserves an existing accepted appendix in %s',
        (input) => {
            expect(normalizeAndHash(' ' + input + ' ')).toBe(input);
        },
    );

    test.each([
        ['.XX', SHA_DIGITS, SHA_DIGITS_HASH],
        ['.1234567', SHA_DIGITS + '1234567', 'e01845a1f2b09082036ee26c4feefd627d2b3eb0d71c6ff65809c7dd398655dd'],
        ['.123456789', SHA_DIGITS + '123456789', '692f31c4cf9c7c6991028a6bbb426a4c3c54c867f6208384b8fb5dbf07437ceb'],
    ])('normalizes and hashes digits when appendix %s is not accepted', (suffix, digits, digest) => {
        expect(getNormalizedPII(SHA + suffix, Constants.PII_DATA_TYPE.PHONE)).toBe(digits);
        expect(normalizeAndHash(SHA + suffix)).toBe(digest + '.' + NET_NEW);
    });

    test('does not pass through an invalid hash prefix with an eight-character appendix', () => {
        const input = 'g' + SHA.slice(1) + '.AQYCAQAA';
        expect(normalizeAndHash(input)).toBe(SHA_DIGITS_HASH + '.' + NET_NEW);
    });

    test('keeps the exact hashed output unchanged on feedback', () => {
        const expected = PHONE_SHA + '.' + NET_NEW;
        const first = normalizeAndHash('+1 (555) 123-4567');
        expect(first).toBe(expected);
        expect(normalizeAndHash(first)).toBe(expected);
    });

    describe('public ParamBuilder phone API', () => {
        test('returns the exact normalized phone digest', () => {
            const builder = new ParamBuilder();
            expect(builder.getNormalizedAndHashedPII('+1 (555) 123-4567', PII_DATA_TYPE.PHONE)).toBe(
                PHONE_SHA + '.' + NET_NEW,
            );
        });

        test.each(['not-a-number', '0000', 123, null])('rejects input %p without phone digits or string type', (input) => {
            const builder = new ParamBuilder();
            expect(builder.getNormalizedAndHashedPII(input, PII_DATA_TYPE.PHONE)).toBeNull();
        });

        test('returns a trimmed lowercased prehash with the no-change appendix', () => {
            const builder = new ParamBuilder();
            expect(builder.getNormalizedAndHashedPII(' ' + SHA.toUpperCase() + ' ', PII_DATA_TYPE.PHONE)).toBe(
                SHA + '.' + NO_CHANGE,
            );
        });
    });
});
