/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  updateClickIdCookieIfNecessary,
  updateDomainScopedBrowserIdCookieIfNecessary,
} from '@shared/utils/cookieUtil.js';
import {
  CLICKTHROUGH_COOKIE_NAME,
  DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME,
  IP_COOKIE_NAME
} from '@shared/model/constants.js';
import { collectAndSetParams } from '@shared/ext/ebpExtension.js';
import {
  getFbc,
  getFbp,
  getClientIpAddress,
} from '@shared/utils/commonUtil.js';
import { updateClientIpAddress } from '@shared/utils/ipUtil.js';
import { getNormalizedAndHashedPII } from '@shared/utils/piiUtil/piiUtil.js';

function processAndCollectParams(url) {
  const params = {};
  const fbc = updateClickIdCookieIfNecessary(url);
  const fbp = updateDomainScopedBrowserIdCookieIfNecessary();

  if (fbc != null) {
    params[CLICKTHROUGH_COOKIE_NAME] = fbc;
  }
  if (fbp != null) {
    params[DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME] = fbp;
  }

  return params;
}

async function processAndCollectAllParams(url, getIpFn) {
  const params = {};
  updateClickIdCookieIfNecessary(url);
  updateDomainScopedBrowserIdCookieIfNecessary();
  // Collect backup click ID from in-app browsers (Extended Browser Properties)
  await collectAndSetParams(true);

  // Set ip
  await updateClientIpAddress(getIpFn);

  params[IP_COOKIE_NAME] = getClientIpAddress();
  params[CLICKTHROUGH_COOKIE_NAME] = getFbc();
  params[DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME] = getFbp();

  return params;
}

export {
  processAndCollectParams,
  processAndCollectAllParams,
  getFbc,
  getFbp,
  getClientIpAddress,
  getNormalizedAndHashedPII,
};
