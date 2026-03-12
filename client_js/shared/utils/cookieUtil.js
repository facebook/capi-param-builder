/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  cookiePack,
  cookieUnpack,
  maybeUpdatePayload,
} from '../model/cookies.js';
import {
  MAX_INT_9_DECIMAL_DIGITS,
  NINETY_DAYS_IN_MS,
  CLICK_ID_PARAMETER,
  CLICKTHROUGH_COOKIE_NAME,
  DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME,
  DEFAULT_FBC_PARAMS,
  APPENDIX_NET_NEW,
  APPENDIX_NO_CHANGE,
} from '../model/constants.js';
import { getURLParametersFromUrlList } from '../utils/urlUtil.js';
import { getAppendix } from '../utils/appendixUtil.js';

function readCookieRaw(name) {
  const result = [];
  try {
    const cookie = document.cookie.split(';');
    const regexString = `^\\s*${name}=\\s*(.*?)\\s*$`;
    const regexName = new RegExp(regexString);
    for (let ii = 0; ii < cookie.length; ii++) {
      const match = cookie[ii].match(regexName);
      match && result.push(match[1]);
    }
    return result && result.hasOwnProperty(0) && typeof result[0] === 'string'
      ? result[0]
      : '';
  } catch (e) {
    throw new Error('Fail to read from cookie: ' + e.message);
  }
}

function getSubdomainAtIndex(domain, subdomainIndex) {
  return domain.slice(domain.length - 1 - subdomainIndex).join('.');
}

function getCookieTTL(duration) {
  return new Date(Date.now() + Math.round(duration)).toUTCString();
}

function getIsChrome() {
  const isChromium = window.chrome;
  const winNav = window.navigator;
  const vendorName = winNav.vendor;
  const isOpera = window.opr !== undefined;
  const isIEedge = winNav.userAgent.indexOf('Edg') > -1;
  const isIOSChrome = winNav.userAgent.match('CriOS');
  return (
    !isIOSChrome &&
    isChromium !== null &&
    isChromium !== undefined &&
    vendorName === 'Google Inc.' &&
    isOpera === false &&
    isIEedge === false
  );
}

function writeCookieRaw(name, value, domain, ttlInMs) {
  const expires = getCookieTTL(ttlInMs);
  if (
    typeof name !== 'string' ||
    typeof value !== 'string' ||
    typeof domain !== 'string'
  ) {
    return;
  }

  try {
    const cookieValue = encodeURIComponent(value); // to prevent malicious manual setting e.g adding ';' after the url param
    document.cookie =
      `${name}=${cookieValue};` +
      `expires=${expires};` +
      `domain=.${domain};` + // '.' prefix says "subdomains are ok"
      `${getIsChrome() ? `SameSite=Lax;` : ''}` +
      `path=/`; // This is only accessible from the same domain
  } catch (e) {
    throw new Error('Fail to write cookie: ' + e.message);
  }
}

function readPackedCookie(name) {
  const rawCookie = readCookieRaw(name);

  if (typeof rawCookie !== 'string' || rawCookie === '') {
    return null;
  }
  return cookieUnpack(rawCookie);
}

function writeNewCookie(name, payload) {
  const fullHostname = window.location.hostname;
  const domainParts = fullHostname.split('.');

  // Attempt to write to the highest level domain we can
  for (
    let subdomainIndex = 0;
    subdomainIndex < domainParts.length;
    subdomainIndex++
  ) {
    const domain = getSubdomainAtIndex(domainParts, subdomainIndex);
    // Sites seem to be incorrectly polyfilling Date.now, so we have to check
    // if it's a number and fall back to the getTime otherwise.
    const now = Date.now();
    const newCookie = cookiePack(
      subdomainIndex,
      typeof now === 'number' ? now : new Date().getTime(),
      payload,
      getAppendix(APPENDIX_NET_NEW)
    );
    writeCookieRaw(name, newCookie, domain, NINETY_DAYS_IN_MS);
    if (readCookieRaw(name) !== '') {
      return newCookie;
    }
  }
  return null;
}

function writeExistingCookie(name, existingCookie) {
  const fullHostname = window.location.hostname;
  const domainParts = fullHostname.split('.');

  if (
    existingCookie['subdomainIndex'] == null ||
    existingCookie['creationTime'] == null ||
    existingCookie['payload'] == null
  ) {
    throw new Error(name + ` only partially set on cookie.`);
  }
  const domain = getSubdomainAtIndex(
    domainParts,
    existingCookie['subdomainIndex']
  );

  const appendix = existingCookie['appendix']
    ? existingCookie['appendix']
    : getAppendix(APPENDIX_NO_CHANGE);
  const updatedExistingCookie = cookiePack(
    existingCookie['subdomainIndex'],
    existingCookie['creationTime'],
    existingCookie['payload'],
    appendix
  );

  writeCookieRaw(name, updatedExistingCookie, domain, NINETY_DAYS_IN_MS);

  return updatedExistingCookie;
}

function mintDomainScopedBrowserIDCookieValue() {
  const left = Math.floor(Math.random() * MAX_INT_9_DECIMAL_DIGITS);
  const right = Math.floor(Math.random() * MAX_INT_9_DECIMAL_DIGITS);
  return left.toString() + right.toString();
}

function updateClickIdCookieIfNecessary(url) {
  const newClickID = getFbcFromQuery(url);

  if (newClickID != null && newClickID.length > 500) {
    return null;
  }

  const existingCookie = readPackedCookie(CLICKTHROUGH_COOKIE_NAME);

  if (newClickID != null) {
    if (existingCookie == null) {
      return writeNewCookie(CLICKTHROUGH_COOKIE_NAME, newClickID);
    }
    let newCookie = maybeUpdatePayload(existingCookie, newClickID);
    newCookie = writeExistingCookie(CLICKTHROUGH_COOKIE_NAME, newCookie);
    return newCookie;
  } else if (existingCookie != null) {
    const updatedExistingCookie = writeExistingCookie(
      CLICKTHROUGH_COOKIE_NAME,
      existingCookie
    );
    return updatedExistingCookie;
  }

  return existingCookie;
}

function getFbcFromQuery(url) {
  let newParamValue = null;
  DEFAULT_FBC_PARAMS.forEach((param) => {
    const value = getURLParametersFromUrlList(
      [url, window.location.href, document.referrer],
      param['query']
    );
    if (value) {
      newParamValue = buildParamConfigs(newParamValue, value, param);
    }
  });
  return newParamValue;
}

function buildParamConfigs(existingParamValue, newValue, paramConfig) {
  const isClickID = paramConfig['query'] === CLICK_ID_PARAMETER;
  const separator = isClickID ? '' : '_';

  // Prevent duplication
  if (
    existingParamValue &&
    existingParamValue.includes(separator + paramConfig['prefix'] + separator)
  ) {
    return existingParamValue;
  }

  const newSegment = paramConfig['prefix'] + separator + newValue;
  if (existingParamValue == null) {
    return newSegment;
  }

  return existingParamValue + separator + newSegment;
}

function updateDomainScopedBrowserIdCookieIfNecessary() {
  const existingCookie = readPackedCookie(DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME);

  if (existingCookie != null) {
    const updatedExistingCookie = writeExistingCookie(
      DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME,
      existingCookie
    );
    return updatedExistingCookie;
  }
  const browserID = mintDomainScopedBrowserIDCookieValue();
  const newFbpCookie = writeNewCookie(
    DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME,
    browserID
  );
  return newFbpCookie;
}

function writeCookieWithToken(name, value, needEncoding, ttlInMs, appendix) {
  if (!value) return false;

  const fullHostname = window.location.hostname;
  const domainParts = fullHostname.split('.');

  // Attempt to write to the highest level domain we can
  for (
    let subdomainIndex = 0;
    subdomainIndex < domainParts.length;
    subdomainIndex++
  ) {
    const domain = getSubdomainAtIndex(domainParts, subdomainIndex);
    value = [value, appendix].join('.');

    if (needEncoding) {
      writeCookieRaw(name, value, domain, ttlInMs);
    } else {
      writeCookieRawWithoutEncoding(name, value, domain, ttlInMs);
    }

    if (readCookieRaw(name) === value) {
      return true;
    }
  }
  return false;
}

// This function is used to write a cookie without encoding the value.
// Need to make sure there is no cookie breaking characters in the value.
function writeCookieRawWithoutEncoding(name, value, domain, ttlInMs) {
  const expires = getCookieTTL(ttlInMs);
  if (
    typeof name !== 'string' ||
    typeof value !== 'string' ||
    typeof domain !== 'string'
  ) {
    return;
  }

  try {
    document.cookie =
      `${name}=${value};` +
      `expires=${expires};` +
      `domain=.${domain};` + // '.' prefix says "subdomains are ok"
      `${getIsChrome() ? `SameSite=Lax;` : ''}` +
      `path=/`; // This is only accessible from the same domain
  } catch (e) {
    throw new Error('Fail to write cookie: ' + e.message);
  }
}

export {
  readPackedCookie,
  writeNewCookie,
  writeExistingCookie,
  readCookieRaw,
  mintDomainScopedBrowserIDCookieValue,
  updateClickIdCookieIfNecessary,
  updateDomainScopedBrowserIdCookieIfNecessary,
  writeCookieWithToken,
};
