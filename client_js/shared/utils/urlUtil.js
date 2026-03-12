/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
function getURLParameter(url, parameter) {
  const regex = new RegExp(
    '[?#&]' + parameter.replace(/[\[\]]/g, '\\$&') + '(=([^&#]*)|&|#|$)'
  );
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function getURLParametersFromUrlList(urlList, parameter) {
  for (const url of urlList) {
    const urlParameter = getURLParameter(url, parameter);
    if (urlParameter) {
      return urlParameter;
    }
  }
  return null;
}

export { getURLParameter, getURLParametersFromUrlList };
