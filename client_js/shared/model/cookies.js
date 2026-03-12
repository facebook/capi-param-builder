/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  ONLY_VALID_VERSION_SO_FAR,
  NUM_OF_EXPECTED_COOKIE_COMPONENTS,
  NUM_OF_EXPECTED_COOKIE_COMPONENTS_WITH_LANGUAGE_TOKEN,
  VALID_PARAM_BUILDER_TOKENS,
  APPENDIX_LENGTH_V2,
  APPENDIX_NET_NEW,
  APPENDIX_MODIFIED_NEW,
} from './constants.js';
import { getAppendix } from '../utils/appendixUtil.js';

function cookiePack(subdomainIndex, creationTime, payload, appendix = null) {
  return [
    ONLY_VALID_VERSION_SO_FAR,
    subdomainIndex,
    creationTime,
    payload,
    appendix,
  ]
    .filter((part) => part != null)
    .join('.');
}

function cookieUnpack(cookieString) {
  const split = cookieString.split('.');

  if (
    split.length !== NUM_OF_EXPECTED_COOKIE_COMPONENTS &&
    split.length !== NUM_OF_EXPECTED_COOKIE_COMPONENTS_WITH_LANGUAGE_TOKEN
  ) {
    return null;
  }

  const [version, subdomainIndexStr, creationTimeStr, payload, appendix] =
    split;

  // This is the implicit version number for the cookie
  if (appendix != null) {
    if (
      !(
        VALID_PARAM_BUILDER_TOKENS.includes(appendix) ||
        appendix.length === APPENDIX_LENGTH_V2
      )
    ) {
      return null;
    }
  }

  if (version !== ONLY_VALID_VERSION_SO_FAR) {
    return null;
  }

  const subdomainIndex = parseInt(subdomainIndexStr, 10);
  if (isNaN(subdomainIndex)) {
    return null;
  }

  const creationTime = parseInt(creationTimeStr, 10);
  if (isNaN(creationTime)) {
    return null;
  }

  if (payload == null || payload === '') {
    return null;
  }

  let unpackedCookie = {};
  unpackedCookie['creationTime'] = creationTime;
  unpackedCookie['payload'] = payload;
  unpackedCookie['subdomainIndex'] = subdomainIndex;
  unpackedCookie['appendix'] = appendix;

  return unpackedCookie;
}

function maybeUpdatePayload(existingCookie, newPayload) {
  if (existingCookie === null || existingCookie['payload'] !== newPayload) {
    // Reset timestamp with new payload
    let unpackedCookie = {};
    unpackedCookie['payload'] = newPayload;

    // Sites seem to be incorrectly polyfilling Date.now, so we have to check
    // if it's a number and fall back to the getTime otherwise.
    const now = Date.now();
    unpackedCookie['creationTime'] =
      typeof now === 'number' ? now : new Date().getTime();
    unpackedCookie['subdomainIndex'] = existingCookie
      ? existingCookie['subdomainIndex']
      : null;
    // Use NET_NEW if no existing cookie, MODIFIED_NEW if updating existing
    unpackedCookie['appendix'] = existingCookie
      ? getAppendix(APPENDIX_MODIFIED_NEW)
      : getAppendix(APPENDIX_NET_NEW);
    return unpackedCookie;
  }
  return existingCookie;
}

export { cookiePack, cookieUnpack, maybeUpdatePayload };
