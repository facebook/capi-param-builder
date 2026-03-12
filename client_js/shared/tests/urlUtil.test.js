/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  getURLParameter,
  getURLParametersFromUrlList,
} from '../utils/urlUtil.js';

describe('getURLParameter', () => {
  it('Return as expected, valid use case', () => {
    const param = getURLParameter(
      'http://warbyparker.com/?fbclid=12345&test=abcd',
      'fbclid'
    );
    expect(param).toEqual('12345');
  });

  it('should return empty string when fbclid is empty', () => {
    [
      'http://warbyparker.com/?fbclid=',
      'http://warbyparker.com/?fbclid=&foo=bar',
      'http://warbyparker.com/?foo=bar&fbclid=',
    ].forEach((url) => {
      expect(getURLParameter(url, 'fbclid')).toEqual('');
    });
  });

  it('should return null when fbclid is not present', () => {
    [
      'http://warbyparker.com/',
      'http://warbyparker.com/?foo=bar',
      'http://warbyparker.com/?hello=world&foo=bar',
      'http://warbyparker.com/fbclid=12345/?hello=world&foo=bar',
    ].forEach((url) => {
      expect(getURLParameter(url, 'fbclid')).toEqual(null);
    });
  });
});

describe('getURLParametersFromUrlList', () => {
  it('Input one single url with expected params', () => {
    const param = getURLParametersFromUrlList(
      ['http://warbyparker.com/?fbclid=12345&test=abcd'],
      'fbclid'
    );
    expect(param).toEqual('12345');
  });

  it('input multiple urls not contains expected params, empty param', () => {
    const param = getURLParametersFromUrlList(
      [
        'http://warbyparker.com/?fbclid=',
        'http://warbyparker.com/?fbclid=&foo=bar',
        'http://warbyparker.com/?foo=bar&fbclid=',
      ],
      'fbclid'
    );
    expect(param).toEqual(null);
  });

  it('input multiple urls not contains expected params, param not exist', () => {
    const param = getURLParametersFromUrlList(
      [
        'http://warbyparker.com/?fbclid1=',
        'http://warbyparker.com/?fbclid1=&foo=bar',
        'http://warbyparker.com/?foo=bar&fbclid2=',
      ],
      'fbclid'
    );
    expect(param).toEqual(null);
  });

  it('multiple urls with expected params, pick first one', () => {
    const param = getURLParametersFromUrlList(
      [
        'http://warbyparker.com/',
        'http://warbyparker.com/?foo=bar',
        'http://warbyparker.com/?hello=world&foo=bar',
        'http://warbyparker.com/fbclid=12345/?hello=world&foo=bar',
        'http://warbyparker.com/?fbclid=test1&hello=world&foo=bar',
        'http://warbyparker.com/?hello=world&foo=bar&fbclid=test2',
      ],
      'fbclid'
    );
    expect(param).toEqual('test1');
  });
});
