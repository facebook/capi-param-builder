/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  writeNewCookie,
  mintDomainScopedBrowserIDCookieValue,
} from '../utils/cookieUtil.js';
import {
  CLICK_ID_PARAMETER,
  CLICKTHROUGH_COOKIE_NAME,
  DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME,
  DEFAULT_FBC_PARAMS,
} from '../model/constants.js';
import { getFbc, getFbp } from '../utils/commonUtil.js';

function buildParamConfigs(results) {
  let paramsValue = null;
  DEFAULT_FBC_PARAMS.forEach((param) => {
    // results contains query's value
    const newValue = results[param['query']];
    if (newValue) {
      const isClickID = param['query'] === CLICK_ID_PARAMETER;
      const separator = isClickID ? '' : '_';

      const newSegment = param['prefix'] + separator + newValue;
      if (!paramsValue) {
        paramsValue = newSegment;
      } else if (
        !paramsValue.includes(separator + param['prefix'] + separator)
      ) {
        paramsValue = paramsValue + separator + newSegment;
      }
    }
  });
  return paramsValue;
}

async function collectParams() {
  // Check iOS in-app browser (Extended Browser Properties)
  const isSupportedInIOS = containsIOSBrowserProperties();
  let newParamValue = null;
  if (isSupportedInIOS === true) {
    const results = await processIOSBrowserProperties();
    if (Object.keys(results).length > 0) {
      newParamValue = buildParamConfigs(results);
    }
    return newParamValue;
  }

  // Check Android in-app browser (min FB version 397, min Instagram version 264)
  const isSupportedAndroid =
    isAndroidIAWSupported(397, 264) &&
    typeof window.XMLHttpRequest !== 'undefined';
  if (isSupportedAndroid === true) {
    const results = await processAndroidBrowserProperties();
    if (Object.keys(results).length > 0) {
      newParamValue = buildParamConfigs(results);
    }
    return newParamValue;
  }
}

async function decorateUrl(existingURL) {
  const url = new URL(existingURL);
  if (url.searchParams.has(CLICK_ID_PARAMETER)) {
    return existingURL.toString();
  }
  const params = await collectParams();
  if (params != null) {
    url.searchParams.append(CLICK_ID_PARAMETER, params);
  }
  return url.toString();
}

async function collectAndSetParams(cookieConsent) {
  // Check user consent
  if (cookieConsent !== true) {
    return false;
  }
  // Check existing cookies
  let updateFbc = false;
  let updateFbp = false;
  const existingFbc = getFbc();
  const existingFbp = getFbp();
  if (!existingFbc || existingFbc === '') {
    const params = await collectParams();
    if (params) {
      writeNewCookie(CLICKTHROUGH_COOKIE_NAME, params);
      updateFbc = true;
    }
  }

  if (!existingFbp || existingFbp === '') {
    writeNewCookie(
      DOMAIN_SCOPED_BROWSER_ID_COOKIE_NAME,
      mintDomainScopedBrowserIDCookieValue()
    );
    updateFbp = true;
  }

  return updateFbc || updateFbp;
}

function containsIOSBrowserProperties() {
  const isSupported =
    window.webkit != null &&
    window.webkit.messageHandlers != null &&
    window.webkit.messageHandlers.browserProperties != null;
  return isSupported;
}

async function processIOSBrowserProperties() {
  const promises = [];
  const results = {};

  DEFAULT_FBC_PARAMS.forEach((param) => {
    const path = param['ebp_path'];
    if (!path) {
      return;
    }
    const promise =
      window.webkit.messageHandlers.browserProperties.postMessage(path);
    promise.then((result) => {
      results[param['query']] = result;
      return result;
    });
    promises.push(promise);
  });
  await Promise.allSettled(promises);
  return results;
}

function isAndroidIAWSupported(fbVersionReq, instagramVersionReq) {
  const winNav = window.navigator;
  const userAgent = winNav.userAgent;
  const isAndroid = userAgent.indexOf('Android') >= 0;
  const isFB = userAgent.indexOf('FB_IAB') >= 0;
  const isInstagram = userAgent.indexOf('Instagram') >= 0;
  const currentVersion = getCurrentVersion(userAgent);

  const res = isAndroid && (isFB || isInstagram);
  if (!res) {
    return false;
  }
  if (isFB && fbVersionReq != null) {
    return fbVersionReq <= currentVersion;
  }
  if (isInstagram && instagramVersionReq != null) {
    return instagramVersionReq <= currentVersion;
  }
  return res;
}

async function processAndroidBrowserProperties() {
  const promises = [];
  const results = {};

  DEFAULT_FBC_PARAMS.forEach((param) => {
    const path = param['ebp_path'];
    if (!path) {
      return;
    }
    const promise = new Promise((resolve, reject) => {
      const xhr = new window.XMLHttpRequest();
      const fullPath = 'properties://browser/' + path;
      xhr.open('GET', fullPath);
      xhr.onload = function () {
        if (
          xhr.readyState === xhr.DONE &&
          xhr.status >= 200 &&
          xhr.status < 300
        ) {
          if (xhr.responseText) {
            resolve(xhr.responseText);
          }
        }
      };
      xhr.onerror = function () {
        reject(new Error('warning: ebp got overrides.'));
      };
      xhr.send();
    });
    promise.then((result) => {
      results[param['query']] = result;
      return result;
    });
    promises.push(promise);
  });
  await Promise.allSettled(promises);
  return results;
}

function getCurrentVersion(userAgent) {
  let version = 0;
  const appMatches = userAgent.match(/(FBAV|Instagram)[/\s](\d+)/);
  if (appMatches != null) {
    const numbers = appMatches[0].match(/(\d+)/);
    if (numbers != null) {
      version = parseInt(numbers[0], 10);
    }
  }
  return version;
}

export { collectParams, decorateUrl, collectAndSetParams };
