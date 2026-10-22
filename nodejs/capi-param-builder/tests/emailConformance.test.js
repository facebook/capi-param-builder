/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Digest fixtures use independent Node crypto goldens; appendix versions remain runtime-derived.
const { getNormalizedEmail } = require('../src/piiUtil/emailUtil');
const {
    getNormalizedAndHashedPII,
    getNormalizedPII,
} = require('../src/piiUtil/PIIUtil');
const { getAppendixInfo } = require('../src/utils/AppendixProvider');
const Constants = require('../src/model/Constants');
const { ParamBuilder: PublicParamBuilder, PII_DATA_TYPE: PUBLIC_PII } = require('../index');
const { version: PACKAGE_VERSION } = require('../package.json');

// Opaque 64-hex fixture for prehash pass-through.
const SHA_LOWER = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
const SHA_UPPER = SHA_LOWER.toUpperCase();
// MD5('hello') via Node crypto.
const MD5_LOWER = '5d41402abc4b2a76b9719d911017c592';
// SHA-256('dispatch.check@example.com') via Node crypto.
const DISPATCH_SHA = '9b5fc386e5e74ad97c218ad356486dd076b6f87095377893351658805a6d5958';
// SHA-256('conformance.check@example.com') via Node crypto.
const CONFORMANCE_SHA = 'd30fed39ef68cfd7eb03de9ee80ab785b50b807facb0b6bb4b29fac1407e43d8';

function encodeAppendixSuffixIndependent(appendixType) {
    const [major, minor, patch] = PACKAGE_VERSION.split('.').map(Number);
    const isNewByte = appendixType === 0x02 ? 0x02 : 0x00;
    return Buffer.from([
        0x01,
        0x04,
        isNewByte,
        major,
        minor,
        patch,
    ])
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

describe('Email conformance (unmocked)', () => {
    describe('version appendix oracle', () => {
        test('appendix suffix decodes to runtime package version bytes', () => {
            const netNew = getAppendixInfo(Constants.APPENDIX_NET_NEW);
            const decoded = Buffer.from(
                netNew.replace(/-/g, '+').replace(/_/g, '/'),
                'base64',
            );
            const [major, minor, patch] = PACKAGE_VERSION.split('.').map(Number);
            expect(Array.from(decoded)).toEqual([
                0x01,
                0x04,
                0x02,
                major,
                minor,
                patch,
            ]);
        });
    });

    describe('direct normalizer versus dispatcher prehash handling', () => {
        test('direct normalizer rejects MD5 while dispatcher accepts it as prehashed', () => {
            expect(getNormalizedEmail(MD5_LOWER)).toBeNull();
            const noChangeSuffix = encodeAppendixSuffixIndependent(Constants.APPENDIX_NO_CHANGE);
            expect(getNormalizedAndHashedPII(MD5_LOWER, Constants.PII_DATA_TYPE.EMAIL)).toBe(
                MD5_LOWER + '.' + noChangeSuffix,
            );
            expect(getNormalizedAndHashedPII(MD5_LOWER.toUpperCase(), Constants.PII_DATA_TYPE.EMAIL)).toBe(
                MD5_LOWER + '.' + noChangeSuffix,
            );
        });

        test('direct normalizer preserves raw SHA-256 case and rejects padding while dispatcher trims and lowercases', () => {
            expect(getNormalizedEmail(SHA_LOWER)).toEqual(SHA_LOWER);
            expect(getNormalizedEmail(SHA_UPPER)).toEqual(SHA_UPPER);
            expect(getNormalizedEmail('  ' + SHA_LOWER + '  ')).toBeNull();
            expect(getNormalizedEmail(SHA_UPPER + '  ')).toBeNull();
            const noChangeSuffix = encodeAppendixSuffixIndependent(Constants.APPENDIX_NO_CHANGE);
            expect(getNormalizedAndHashedPII('  ' + SHA_UPPER + '  ', Constants.PII_DATA_TYPE.EMAIL)).toBe(
                SHA_LOWER + '.' + noChangeSuffix,
            );
        });
    });

    describe('guarded dispatcher validation', () => {
        test('dispatcher and normalized APIs return null for nullish and non-string input', () => {
            const nonStringValues = [null, undefined, 0, 123, true, false, [], {}, ''];
            nonStringValues.forEach((value) => {
                expect(getNormalizedAndHashedPII(value, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
            });
            expect(getNormalizedPII(null, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
            expect(getNormalizedPII(['dispatch.check@example.com'], Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
            expect(getNormalizedPII(true, Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
        });

        test('normalized API delegates to the real email normalizer', () => {
            expect(
                getNormalizedPII('Dispatch.Check@Example.Com', Constants.PII_DATA_TYPE.EMAIL),
            ).toBe('dispatch.check@example.com');
        });
    });

    describe('unmocked email hashing oracle', () => {
        test('dispatcher hashes normalized email to hardcoded SHA-256 digest with independently encoded suffix', () => {
            const netNewSuffix = encodeAppendixSuffixIndependent(Constants.APPENDIX_NET_NEW);
            expect(
                getNormalizedAndHashedPII('conformance.check@example.com', Constants.PII_DATA_TYPE.EMAIL),
            ).toBe(CONFORMANCE_SHA + '.' + netNewSuffix);
        });

        test('dispatcher output fed back through is idempotent', () => {
            const netNewSuffix = encodeAppendixSuffixIndependent(Constants.APPENDIX_NET_NEW);
            const once = getNormalizedAndHashedPII('dispatch.check@example.com', Constants.PII_DATA_TYPE.EMAIL);
            expect(once).toBe(DISPATCH_SHA + '.' + netNewSuffix);
            const twice = getNormalizedAndHashedPII(once, Constants.PII_DATA_TYPE.EMAIL);
            expect(twice).toBe(once);
            expect(twice.split(netNewSuffix).length - 1).toBe(1);
        });
    });

    describe('prehashed suffix boundaries', () => {
        test('legacy two-char and V2 eight-char suffixes pass through unchanged', () => {
            // Eight-character suffixes are accepted without decoding their contents.
            expect(getNormalizedAndHashedPII(SHA_LOWER + '.BA', Constants.PII_DATA_TYPE.EMAIL)).toBe(
                SHA_LOWER + '.BA',
            );
            expect(getNormalizedAndHashedPII(SHA_LOWER + '.ZZZZZZZZ', Constants.PII_DATA_TYPE.EMAIL)).toBe(
                SHA_LOWER + '.ZZZZZZZZ',
            );
        });

        test('unknown suffix lengths and invalid prefixes are rejected', () => {
            expect(getNormalizedAndHashedPII(SHA_LOWER + '.XX', Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
            expect(getNormalizedAndHashedPII(SHA_LOWER + '.ABC', Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
            expect(getNormalizedAndHashedPII('unhashed-prefix.BA', Constants.PII_DATA_TYPE.EMAIL)).toBeNull();
        });
    });

    describe('public ParamBuilder email API', () => {
        test('public builder hashes valid email to exact digest oracle', () => {
            const builder = new PublicParamBuilder();
            const netNewSuffix = encodeAppendixSuffixIndependent(Constants.APPENDIX_NET_NEW);
            expect(builder.getNormalizedAndHashedPII('dispatch.check@example.com', PUBLIC_PII.EMAIL)).toBe(
                DISPATCH_SHA + '.' + netNewSuffix,
            );
        });

        test('public builder returns null for rejected email', () => {
            const builder = new PublicParamBuilder();
            expect(builder.getNormalizedAndHashedPII('dispatch.check@@example..org', PUBLIC_PII.EMAIL)).toBeNull();
        });

        test('public builder passes prehashed email through with exact suffix oracle', () => {
            const builder = new PublicParamBuilder();
            const noChangeSuffix = encodeAppendixSuffixIndependent(Constants.APPENDIX_NO_CHANGE);
            expect(builder.getNormalizedAndHashedPII(SHA_LOWER, PUBLIC_PII.EMAIL)).toBe(
                SHA_LOWER + '.' + noChangeSuffix,
            );
        });
    });
});
