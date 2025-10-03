/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { looksLikeHashed, trim } = require('./commonUtil');

const MALE_SET = new Set([
    'man',
    'male',
    'boy',
    'gentleman',
    'guy',
    'sir',
    'mister',
    'mr',
    'son',
    'father',
    'dad',
    'daddy',
    'papa',
    'uncle',
    'nephew',
    'brother',
    'husband',
    'boyfriend',
    'groom',
    'widower',
    'king',
    'prince',
    'duke',
    'count',
    'emperor',
    'god',
    'lord',
    'lad',
    'fellow',
    'chap',
    'bloke',
    'dude',
    'he',
    'him',
    'his',
    'himself',
    'm',
]);

const FEMALE_SET = new Set([
    'woman',
    'female',
    'girl',
    'lady',
    'miss',
    'ms',
    'mrs',
    'madam',
    "ma'am",
    'daughter',
    'mother',
    'mom',
    'mama',
    'mommy',
    'aunt',
    'niece',
    'sister',
    'wife',
    'girlfriend',
    'bride',
    'widow',
    'queen',
    'princess',
    'duchess',
    'countess',
    'empress',
    'goddess',
    'maiden',
    'lass',
    'gal',
    'chick',
    'dame',
    'belle',
    'she',
    'her',
    'hers',
    'herself',
    'f',
]);

const MALE = 'm';
const FEMALE = 'f';

function getNormalizedGender(gender) {
    if (gender == null || gender === undefined) {
        return null;
    }
    if (typeof gender !== 'string') {
        throw new TypeError('Gender must be a string');
    }
    if (looksLikeHashed(gender)) {
        return gender;
    }
    const normalizedGender = trim(gender.toLowerCase());
    if (MALE_SET.has(normalizedGender)) {
        return MALE;
    } else if (FEMALE_SET.has(normalizedGender)) {
        return FEMALE;
    } else {
        return null;
    }
}

module.exports = { getNormalizedGender };
