/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { IP_COOKIE_NAME, ONE_DAY_IN_MS, APPENDIX_NET_NEW } from '../model/constants.js';

import { writeCookieWithToken } from './cookieUtil.js';
import { getAppendix } from './appendixUtil.js';
import { getNormalizedExternalID } from './piiUtil/stringUtil.js';

function isIPv4(ip) {
  return /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/.test(
    ip
  );
}

function isIPv6(ip) {
  return /^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:)|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}(:[0-9a-fA-F]{1,4}|:){1,2}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}|:){1,3}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}|:){1,4}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}|:){1,5}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}|:){1,6}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,7}|:)|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/.test(
    ip
  );
}

function isValidIP(ip) {
  return isIPv4(ip) || isIPv6(ip);
}

async function updateClientIpAddress(getIpFn) {
  // Get IP address, IPv6 is preferred in getIpFn
  let ip = '';
  if (getIpFn && typeof getIpFn === 'function') {
    try {
      ip = await getIpFn();
    } catch (error) {
      console.error('Failed to get IP address: ', error);
    }
    // Normalize IP address to lowercase and remove white spaces
    ip = getNormalizedExternalID(ip);

    if (!isValidIP(ip)) {
      console.error('Invalid IP address: ', ip);
      ip = '';
    }
  }

  return writeCookieWithToken(
    IP_COOKIE_NAME,
    ip,
    false,
    ONE_DAY_IN_MS,
    getAppendix(APPENDIX_NET_NEW)
  );
}

export { updateClientIpAddress };
