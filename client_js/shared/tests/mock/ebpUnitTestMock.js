/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
export function setup_ios(resolvedClickID = null, resolvedSample = null) {
  const testUserAgent =
    'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
  Object.defineProperty(window.navigator, 'userAgent', {
    value: testUserAgent,
    writable: true,
  });
  window.webkit = {
    messageHandlers: {
      browserProperties: {
        postMessage(browserProperty) {
          return new Promise(async (resolve, reject) => {
            await new Promise((resolve2) => setTimeout(resolve2, 3000));
            if (browserProperty === 'clickID') {
              resolvedClickID
                ? resolve(resolvedClickID)
                : resolve('iosClickID');
            } else if (browserProperty === 'sampleTest') {
              resolvedSample
                ? resolve(resolvedSample)
                : resolve('iosSampleTest');
            }
          });
        },
      },
    },
  };
}

export function setup_android(
  user_agent = null,
  clickid_text = null,
  sample_test = null
) {
  window.webkit = null;
  const testUserAgent =
    'Mozilla/5.0 (Linux; Android 10; SM-G960U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.153 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/397.0.0.0.145;]';
  Object.defineProperty(window.navigator, 'userAgent', {
    value: user_agent ?? testUserAgent,
    writable: true,
  });

  jest.spyOn(window, 'XMLHttpRequest').mockImplementation(function () {
    this.open = function (method, url) {
      this.requestUrl = url;
    };
    // Mock the response msg based on saved request url
    this.send = function () {
      this.timeout = 3000;
      setTimeout(() => {
        if (this.requestUrl === 'properties://browser/clickID') {
          clickid_text
            ? (this.responseText = clickid_text)
            : (this.responseText = 'androidClickID');
        } else if (this.requestUrl === 'properties://browser/sampleTest') {
          sample_test
            ? (this.responseText = sample_test)
            : (this.responseText = 'androidSampleTest');
        }
        this.readyState = this.DONE;
        this.onload();
      }, this.timeout);
    };
    this.readyState = 4;
    this.status = 200;
    this.withCredentials = true;

    return this;
  });
}
