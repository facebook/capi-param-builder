/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { looksLikeHashed, trim } = require('./commonUtil');

// good approximation of RFC 2822
const EMAIL_RE =
    /^[\w!#\$%&'\*\+\/\=\?\^`\{\|\}~\-]+(:?\.[\w!#\$%&'\*\+\/\=\?\^`\{\|\}~\-]+)*@(?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?$/i;

function isEmail(email) {
    return EMAIL_RE.test(email);
}

function getNormalizedEmail(email) {
    if (looksLikeHashed(email)) {
        return email;
    }
    const normalizedEmail = trim(email.toLowerCase());
    return isEmail(normalizedEmail) ? normalizedEmail : null;
}

module.exports = { getNormalizedEmail };
