/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { looksLikeHashed, trim } = require('./commonUtil');

// Function to check if a date is valid
function isValidDate(year, month, day) {
    // Check if year is between 1800 and current year + 1
    const currentYear = new Date().getFullYear();
    if (year < 1800 || year > currentYear + 1) {
        return false;
    }

    // Check if month is between 1 and 12
    if (month < 1 || month > 12) {
        return false;
    }

    // Check if day is valid for the given month and year
    if (day < 1 || day > 31) {
        return false;
    }

    return true;
}

// Function to replace all non-digit characters with spaces
function replaceNonDigitsWithSpaces(input) {
    if (typeof input === 'string') {
        return input.replace(/\D/g, ' ');
    }
}

function getYearMonthDayFromNumbers(n1, n2, n3) {
    let year = 0;
    let month = 0;
    let day = 0;

    // n1 is year
    if (n1 > 31) {
        year = n1;
        month = n2 > 12 ? n3 : n2;
        day = n2 > 12 ? n2 : n3;
    } else if (n2 > 31) {
        year = n2;
        month = n3 > 12 ? n1 : n3;
        day = n3 > 12 ? n3 : n1;
    } else {
        year = n3;
        month = n1 > 12 ? n2 : n1;
        day = n1 > 12 ? n1 : n2;
    }

    if (isValidDate(year, month, day)) {
        return (
            String(year).padStart(4, '0') +
            String(month).padStart(2, '0') +
            String(day).padStart(2, '0')
        );
    }
    return null;
}

// Function to parse date from various formats
function parseDateOfBirth(input) {
    // Replace non-digit characters with spaces and trim
    const cleanedInput = trim(replaceNonDigitsWithSpaces(input));

    // Extract all digit sequences from the input
    const digitGroups = cleanedInput
        .split(' ')
        .filter((group) => group.length > 0);

    if (digitGroups.length >= 3) {
        const n1 = parseInt(digitGroups[0]);
        const n2 = parseInt(digitGroups[1]);
        const n3 = parseInt(digitGroups[2]);
        const maybeResult = getYearMonthDayFromNumbers(n1, n2, n3);
        if (maybeResult != null) {
            return maybeResult;
        }
    }

    if (digitGroups.length === 1 && digitGroups[0].length === 8) {
        return digitGroups[0];
    }

    return null;
}

function getNormalizedDOB(dob) {
    try {
        if (dob == null || dob === undefined) {
            return null;
        }
        if (looksLikeHashed(dob)) {
            return dob;
        }
        return parseDateOfBirth(dob);
    } catch (error) {
        console.error('Failed to normalize dob: ', error);
    }

    return null;
}

module.exports = { getNormalizedDOB };
