/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getNormalizedAndHashedPII } from '../src/clientParamBuilder.js';
import { PII_DATA_TYPE } from '../../shared/model/constants.js';
import { getVersionInfo } from '../../shared/version.js';

const PHONE_SHA =
  'd6736136ea896c1bfdc553e0e86e702c70d060d805696ca3e4e9e0961353860a';
const MD5 = '5d41402abc4b2a76b9719d911017c592';
const VERSION_BYTES = getVersionInfo().version.split('.').map(Number);
const NET_NEW = Buffer.from([0x01, 0x06, 0x02, ...VERSION_BYTES]).toString(
  'base64url'
);
const NO_CHANGE = Buffer.from([0x01, 0x06, 0x00, ...VERSION_BYTES]).toString(
  'base64url'
);

describe('Public client Param Builder phone API', () => {
  test('returns the exact normalized digest and version appendix', () => {
    expect(
      getNormalizedAndHashedPII('  001 (555) 123-4567  ', PII_DATA_TYPE.PHONE)
    ).toBe(PHONE_SHA + '.' + NET_NEW);
  });

  test.each(['not-a-number', '0000', 123, null])(
    'rejects input %p without phone digits or string type',
    (input) => {
      expect(getNormalizedAndHashedPII(input, PII_DATA_TYPE.PHONE)).toBeNull();
    }
  );

  test('trims and lowercases a prehash without rehashing', () => {
    expect(
      getNormalizedAndHashedPII(
        ' ' + MD5.toUpperCase() + ' ',
        PII_DATA_TYPE.PHONE
      )
    ).toBe(MD5 + '.' + NO_CHANGE);
  });

  test('preserves the exact output on feedback through the public API', () => {
    const expected = PHONE_SHA + '.' + NET_NEW;
    const first = getNormalizedAndHashedPII(
      '+1 (555) 123-4567',
      PII_DATA_TYPE.PHONE
    );
    expect(first).toBe(expected);
    expect(getNormalizedAndHashedPII(first, PII_DATA_TYPE.PHONE)).toBe(
      expected
    );
  });
});
