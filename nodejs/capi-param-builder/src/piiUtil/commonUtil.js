/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const TRIM_REGEX = /^\s+|\s+$/g;
const SHA_256_REGEX = /^[a-f0-9]{64}$/i;
const STRIP_WHITESPACE_REGEX = /\s+/g;
// Punctuation characters: !"#$%&'()*+,-./:;<=>?@ [\]^_`{|}~
const STRIP_WHITESPACE_AND_PUNCTUATION_REGEX =
    /[!"#\$%&'\(\)\*\+,\-\.\/:;<=>\?@ \[\\\]\^_`\{\|\}~\s]+/g;
const STRIP_NON_LATIN_ALPHA_NUMERIC_REGEX = /[^a-zA-Z0-9]+/g;

/**
 * Type-tolerating trimmer. Also, removes not just space-whitespace.
 */
function trim(obj) {
    return typeof obj === 'string' ? obj.replace(TRIM_REGEX, '') : '';
}

function looksLikeHashed(input) {
    return typeof input === 'string' && SHA_256_REGEX.test(input);
}

function strip(obj, mode = 'whitespace_only') {
    let result = '';
    if (typeof obj === 'string') {
        switch (mode) {
            case 'whitespace_only':
                result = obj.replace(STRIP_WHITESPACE_REGEX, '');
                break;
            case 'whitespace_and_punctuation':
                result = obj.replace(STRIP_WHITESPACE_AND_PUNCTUATION_REGEX, '');
                break;
            case 'all_non_latin_alpha_numeric':
                result = obj.replace(STRIP_NON_LATIN_ALPHA_NUMERIC_REGEX, '');
                break;
        }
    }
    return result;
}

module.exports = {
    trim,
    looksLikeHashed,
    strip,
};
