/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { updateClientIpAddress } from '../utils/ipUtil.js';

jest.mock('../version.js', () => ({
  getVersionInfo: () => ({
    version: '1.0.0',
    buildDate: '2025-01-01T00:00:00.000Z',
  }),
}));

describe('ipUtil test', () => {
  let originalCookie;

  beforeAll(() => {
    originalCookie = document.cookie;
  });
  afterAll(() => {
    Object.defineProperty(document, 'cookie', {
      value: originalCookie,
      writable: true,
    });
  });
  beforeEach(() => {
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
      configurable: true,
    });
    delete window.location;
    window.location = { href: 'http://test.com/', hostname: 'test.com' };
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    console.error.mockRestore();
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('updateClientIpAddress with valid IPv4', () => {
    test('writes cookie with valid IPv4 address', async () => {
      const getIpFn = jest.fn().mockResolvedValue('192.168.1.1');
      const result = await updateClientIpAddress(getIpFn);
      expect(getIpFn).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(document.cookie).toEqual(expect.stringContaining('_fbi='));
      expect(document.cookie).toEqual(expect.stringContaining('192.168.1.1'));
    });

    test('handles boundary IPv4 values', async () => {
      const getIpFn = jest.fn().mockResolvedValue('0.0.0.0');
      const result = await updateClientIpAddress(getIpFn);
      expect(result).toBe(true);
      expect(document.cookie).toEqual(expect.stringContaining('0.0.0.0'));
    });

    test('handles max IPv4 values', async () => {
      const getIpFn = jest.fn().mockResolvedValue('255.255.255.255');
      const result = await updateClientIpAddress(getIpFn);
      expect(result).toBe(true);
      expect(document.cookie).toEqual(
        expect.stringContaining('255.255.255.255')
      );
    });
  });

  describe('updateClientIpAddress with valid IPv6', () => {
    test('writes cookie with full IPv6 address', async () => {
      const getIpFn = jest
        .fn()
        .mockResolvedValue('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
      const result = await updateClientIpAddress(getIpFn);
      expect(result).toBe(true);
      expect(document.cookie).toEqual(expect.stringContaining('_fbi='));
    });

    test('writes cookie with compressed IPv6 address', async () => {
      const getIpFn = jest
        .fn()
        .mockResolvedValue('2001:db8:85a3::8a2e:370:7334');
      const result = await updateClientIpAddress(getIpFn);
      expect(result).toBe(true);
    });

    test('handles loopback IPv6 address', async () => {
      const getIpFn = jest.fn().mockResolvedValue('::1');
      const result = await updateClientIpAddress(getIpFn);
      expect(result).toBe(true);
    });

    test('handles all-zeros IPv6 address', async () => {
      const getIpFn = jest.fn().mockResolvedValue('::');
      const result = await updateClientIpAddress(getIpFn);
      expect(result).toBe(true);
    });
  });

  describe('updateClientIpAddress with invalid IP', () => {
    test('logs error and returns false for invalid IPv4', async () => {
      const getIpFn = jest.fn().mockResolvedValue('999.999.999.999');
      const result = await updateClientIpAddress(getIpFn);
      expect(console.error).toHaveBeenCalledWith(
        'Invalid IP address: ',
        expect.any(String)
      );
      expect(result).toBe(false);
    });

    test('logs error and returns false for non-IP string', async () => {
      const getIpFn = jest.fn().mockResolvedValue('not-an-ip');
      const result = await updateClientIpAddress(getIpFn);
      expect(console.error).toHaveBeenCalledWith(
        'Invalid IP address: ',
        expect.any(String)
      );
      expect(result).toBe(false);
    });

    test('logs error and returns false for partial IPv4', async () => {
      const getIpFn = jest.fn().mockResolvedValue('192.168.1');
      const result = await updateClientIpAddress(getIpFn);
      expect(console.error).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    test('logs error for IPv4 with out-of-range octets', async () => {
      const getIpFn = jest.fn().mockResolvedValue('256.1.1.1');
      const result = await updateClientIpAddress(getIpFn);
      expect(console.error).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('updateClientIpAddress with empty/null getIpFn', () => {
    test('returns false when getIpFn is null', async () => {
      const result = await updateClientIpAddress(null);
      expect(result).toBe(false);
    });

    test('returns false when getIpFn is undefined', async () => {
      const result = await updateClientIpAddress(undefined);
      expect(result).toBe(false);
    });

    test('returns false when getIpFn is not a function', async () => {
      const result = await updateClientIpAddress('not-a-function');
      expect(result).toBe(false);
    });

    test('returns false when getIpFn returns empty string', async () => {
      const getIpFn = jest.fn().mockResolvedValue('');
      const result = await updateClientIpAddress(getIpFn);
      expect(result).toBe(false);
    });

    test('returns false when getIpFn returns null', async () => {
      const getIpFn = jest.fn().mockResolvedValue(null);
      const result = await updateClientIpAddress(getIpFn);
      expect(result).toBe(false);
    });
  });

  describe('updateClientIpAddress error handling', () => {
    test('logs error and returns false when getIpFn throws', async () => {
      const getIpFn = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));
      const result = await updateClientIpAddress(getIpFn);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to get IP address: ',
        expect.any(Error)
      );
      expect(result).toBe(false);
    });
  });
});
