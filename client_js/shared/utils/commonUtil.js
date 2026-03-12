/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  CLICKTHROUGH_COOKIE_NAME,
  DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME,
  IP_COOKIE_NAME,
} from '../model/constants.js';
import { readCookieRaw } from './cookieUtil.js';

function getFbc() {
  const fbc = readCookieRaw(CLICKTHROUGH_COOKIE_NAME);
  return fbc;
}

function getFbp() {
  const fbp = readCookieRaw(DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME);
  return fbp;
}

function getClientIpAddress() {
  const fbi = readCookieRaw(IP_COOKIE_NAME);
  return fbi;
}

export { getFbc, getFbp, getClientIpAddress };
