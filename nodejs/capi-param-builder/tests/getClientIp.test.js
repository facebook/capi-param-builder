/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { ParamBuilder } = require('../src/ParamBuilder');
const Constants = require('../src/model/Constants');

// Mock the version for consistent appendix values
jest.mock('../package.json', () => ({ version: '1.0.0' }));

describe('ParamBuilder _getClientIp', () => {
    let paramBuilder;

    // Test constants
    const DUMMY_APPENDIX_NO_CHANGE = 'AQQAAQAA';
    const DUMMY_APPENDIX_NET_NEW = 'AQQCAQAA';
    const DUMMY_APPENDIX_MODIFIED_NEW = 'AQQDAQAA';

    // Sample IP addresses
    const IPV4_PUBLIC = '8.8.8.8';
    const IPV4_PRIVATE = '192.168.1.1';
    const IPV6_PUBLIC = '2001:4860:4860::8888';
    const IPV6_PRIVATE = 'fe80::1';
    const INVALID_IP = 'not.an.ip';

    beforeEach(() => {
        paramBuilder = new ParamBuilder(['example.com']);
        // Mock the appendix values to match expected test values
        paramBuilder.appendix_no_change = DUMMY_APPENDIX_NO_CHANGE;
        paramBuilder.appendix_net_new = DUMMY_APPENDIX_NET_NEW;
        paramBuilder.appendix_modified_new = DUMMY_APPENDIX_MODIFIED_NEW;
    });

    describe('Basic functionality', () => {
        test('should return null when no valid IPs are provided', () => {
            const result = paramBuilder._getClientIp({}, null, null);
            expect(result).toBeNull();
        });

        test('should return null when all IPs are invalid', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: INVALID_IP };
            const result = paramBuilder._getClientIp(cookies, INVALID_IP, INVALID_IP);
            expect(result).toBeNull();
        });

        test('should return null when all IPs are private', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PRIVATE };
            const result = paramBuilder._getClientIp(cookies, IPV4_PRIVATE, IPV4_PRIVATE);
            expect(result).toBeNull();
        });

        test('should handle null cookies parameter', () => {
            const result = paramBuilder._getClientIp(null, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should handle undefined cookies parameter', () => {
            const result = paramBuilder._getClientIp(undefined, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });
    });

    describe('IPv6 public IP prioritization', () => {
        test('should prefer IPv6 public IP from cookie over IPv4 public IP from request', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV6_PUBLIC };
            const result = paramBuilder._getClientIp(cookies, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV6_PUBLIC}.${DUMMY_APPENDIX_MODIFIED_NEW}`);
        });

        test('should prefer IPv6 public IP from request over IPv4 public IP from cookie', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PUBLIC };
            const result = paramBuilder._getClientIp(cookies, IPV6_PUBLIC, null);
            expect(result).toBe(`${IPV6_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should use IPv6 public IP from cookie with existing language token', () => {
            const langToken = Constants.SUPPORTED_PARAM_BUILDER_LANGUAGES_TOKEN[0];
            const cookies = { [Constants.FBI_NAME_STRING]: `${IPV6_PUBLIC}.${langToken}` };
            const result = paramBuilder._getClientIp(cookies, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV6_PUBLIC}.${langToken}`);
        });

        test('should prefer IPv6 public from cookie over IPv6 public from request', () => {
            const anotherIPv6Public = '2001:db8::1';
            const cookies = { [Constants.FBI_NAME_STRING]: IPV6_PUBLIC };
            const result = paramBuilder._getClientIp(cookies, anotherIPv6Public, null);
            expect(result).toBe(`${IPV6_PUBLIC}.${DUMMY_APPENDIX_MODIFIED_NEW}`);
        });
    });

    describe('IPv4 public IP handling', () => {
        test('should prefer IPv4 public IP from cookie over IPv4 public IP from request', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PUBLIC };
            const anotherPublicIPv4 = '1.1.1.1';
            const result = paramBuilder._getClientIp(cookies, anotherPublicIPv4, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_MODIFIED_NEW}`);
        });

        test('should use IPv4 public IP from request when no cookie IP available', () => {
            const result = paramBuilder._getClientIp({}, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should use IPv4 public IP from remote address when no other sources', () => {
            const result = paramBuilder._getClientIp({}, null, IPV4_PUBLIC);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should use IPv4 public IP from cookie with existing language token', () => {
            const langToken = Constants.SUPPORTED_PARAM_BUILDER_LANGUAGES_TOKEN[0];
            const cookies = { [Constants.FBI_NAME_STRING]: `${IPV4_PUBLIC}.${langToken}` };
            const result = paramBuilder._getClientIp(cookies, IPV4_PRIVATE, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${langToken}`);
        });
    });

    describe('Public IP prioritization over private', () => {
        test('should prefer public IPv4 from request over private IPv6 from cookie', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV6_PRIVATE };
            const result = paramBuilder._getClientIp(cookies, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should prefer public IPv4 from request over private IPv4 from cookie', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PRIVATE };
            const result = paramBuilder._getClientIp(cookies, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should return null when only private IPs are available', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PRIVATE };
            const result = paramBuilder._getClientIp(cookies, IPV6_PRIVATE, IPV4_PRIVATE);
            expect(result).toBeNull();
        });

        test('should prefer public IPv6 from request over private IPv4 from cookie', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PRIVATE };
            const result = paramBuilder._getClientIp(cookies, IPV6_PUBLIC, null);
            expect(result).toBe(`${IPV6_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });
    });

    describe('Language token handling', () => {
        test('should preserve existing language token from cookie', () => {
            const langToken = Constants.SUPPORTED_PARAM_BUILDER_LANGUAGES_TOKEN[0];
            const cookies = { [Constants.FBI_NAME_STRING]: `${IPV4_PUBLIC}.${langToken}` };
            const result = paramBuilder._getClientIp(cookies, null, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${langToken}`);
        });

        test('should use new appendix when no language token in cookie', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PUBLIC };
            const result = paramBuilder._getClientIp(cookies, null, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NET_NEW}`);
        });

        test('should use normal appendix for request-sourced IPs', () => {
            const result = paramBuilder._getClientIp({}, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should handle V2 format language token (8 characters)', () => {
            const v2Token = 'ABCDEFGH';
            const cookies = { [Constants.FBI_NAME_STRING]: `${IPV4_PUBLIC}.${v2Token}` };
            const result = paramBuilder._getClientIp(cookies, null, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${v2Token}`);
        });

        test('should handle multiple language tokens in supported list', () => {
            // Test with different supported language tokens
            Constants.SUPPORTED_PARAM_BUILDER_LANGUAGES_TOKEN.slice(0, 3).forEach(token => {
                const cookies = { [Constants.FBI_NAME_STRING]: `${IPV4_PUBLIC}.${token}` };
                const result = paramBuilder._getClientIp(cookies, null, null);
                expect(result).toBe(`${IPV4_PUBLIC}.${token}`);
            });
        });
    });

    describe('Edge cases and error handling', () => {
        test('should handle empty cookies object', () => {
            const result = paramBuilder._getClientIp({}, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should handle empty FBI cookie value', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: '' };
            const result = paramBuilder._getClientIp(cookies, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should handle null and undefined IP parameters', () => {
            const result = paramBuilder._getClientIp({}, null, undefined);
            expect(result).toBeNull();
        });

        test('should handle whitespace in IP values', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: '   ' };
            const result = paramBuilder._getClientIp(cookies, '  ', '\t');
            expect(result).toBeNull();
        });

        test('should handle malformed cookie values', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: 'malformed.ip.value' };
            const result = paramBuilder._getClientIp(cookies, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });
    });

    describe('Complex prioritization scenarios', () => {
        test('should handle IPv6 public from cookie vs IPv6 private from request', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV6_PUBLIC };
            const result = paramBuilder._getClientIp(cookies, IPV6_PRIVATE, null);
            expect(result).toBe(`${IPV6_PUBLIC}.${DUMMY_APPENDIX_NET_NEW}`);
        });

        test('should handle IPv4 private from cookie vs IPv6 public from request', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PRIVATE };
            const result = paramBuilder._getClientIp(cookies, IPV6_PUBLIC, null);
            expect(result).toBe(`${IPV6_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should handle mixed valid and invalid IPs', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: INVALID_IP };
            const result = paramBuilder._getClientIp(cookies, IPV4_PUBLIC, INVALID_IP);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should handle single public IP from request', () => {
            const result = paramBuilder._getClientIp({}, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });
    });

    describe('Real-world scenarios', () => {
        test('should handle typical web server setup', () => {
            const langToken = Constants.SUPPORTED_PARAM_BUILDER_LANGUAGES_TOKEN[0];
            const cookies = { [Constants.FBI_NAME_STRING]: `${IPV4_PRIVATE}.${langToken}` };
            const xForwardedFor = IPV4_PUBLIC;
            const remoteAddress = IPV4_PRIVATE;

            const result = paramBuilder._getClientIp(cookies, xForwardedFor, remoteAddress);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should handle load balancer scenario with IPv6', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PRIVATE };
            const xForwardedFor = IPV6_PUBLIC;
            const remoteAddress = IPV4_PRIVATE;

            const result = paramBuilder._getClientIp(cookies, xForwardedFor, remoteAddress);
            expect(result).toBe(`${IPV6_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should handle scenario with only cookie IP available', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV6_PUBLIC };
            const result = paramBuilder._getClientIp(cookies, null, null);
            expect(result).toBe(`${IPV6_PUBLIC}.${DUMMY_APPENDIX_NET_NEW}`);
        });

        test('should handle proxy chain scenario', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV6_PRIVATE };
            const xForwardedFor = IPV6_PUBLIC;
            const remoteAddress = IPV4_PRIVATE;

            const result = paramBuilder._getClientIp(cookies, xForwardedFor, remoteAddress);
            expect(result).toBe(`${IPV6_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });
    });

    describe('Integration with helper methods', () => {
        test('should correctly call _getClientIpFromCookie', () => {
            const spy = jest.spyOn(paramBuilder, '_getClientIpFromCookie');
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PUBLIC };

            paramBuilder._getClientIp(cookies, null, null);

            expect(spy).toHaveBeenCalledWith(cookies);
            spy.mockRestore();
        });

        test('should correctly call _getClientIpLanguageTokenFromCookie', () => {
            const spy = jest.spyOn(paramBuilder, '_getClientIpLanguageTokenFromCookie');
            const langToken = Constants.SUPPORTED_PARAM_BUILDER_LANGUAGES_TOKEN[0];
            const cookies = { [Constants.FBI_NAME_STRING]: `${IPV4_PUBLIC}.${langToken}` };

            paramBuilder._getClientIp(cookies, null, null);

            expect(spy).toHaveBeenCalledWith(cookies);
            spy.mockRestore();
        });

        test('should correctly call _getClientIpFromRequest', () => {
            const spy = jest.spyOn(paramBuilder, '_getClientIpFromRequest');
            const xForwardedFor = IPV4_PUBLIC;
            const remoteAddress = IPV4_PRIVATE;

            paramBuilder._getClientIp({}, xForwardedFor, remoteAddress);

            expect(spy).toHaveBeenCalledWith(xForwardedFor, remoteAddress);
            spy.mockRestore();
        });

        test('should correctly call _isPublicIp for both sources', () => {
            const spy = jest.spyOn(paramBuilder, '_isPublicIp');
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PUBLIC };

            paramBuilder._getClientIp(cookies, IPV4_PRIVATE, null);

            expect(spy).toHaveBeenCalledWith(IPV4_PUBLIC);
            expect(spy).toHaveBeenCalledWith(IPV4_PRIVATE);
            spy.mockRestore();
        });
    });

    describe('Boundary conditions', () => {
        test('should handle very long IP strings', () => {
            const longInvalidIP = 'a'.repeat(1000);
            const cookies = { [Constants.FBI_NAME_STRING]: longInvalidIP };
            const result = paramBuilder._getClientIp(cookies, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should handle special IPv4 addresses correctly', () => {
            const specialIPs = [
                '127.0.0.1',       // Loopback - should be private
                '169.254.1.1',     // Link-local - should be private
                '10.0.0.1',        // Private range - should be private
                '172.16.0.1',      // Private range - should be private
            ];

            specialIPs.forEach(ip => {
                const result = paramBuilder._getClientIp({}, ip, null);
                // These should all be considered private/special, so result should be null
                expect(result).toBeNull();
            });
        });

        test('should handle special IPv6 addresses correctly', () => {
            const specialIPs = [
                '::1',           // Loopback - should be private
                'fe80::1',       // Link-local - should be private
                'fc00::1',       // Unique local - should be private
                'fd00::1',       // Unique local - should be private
            ];

            specialIPs.forEach(ip => {
                const result = paramBuilder._getClientIp({}, ip, null);
                // These should all be considered private/special, so result should be null
                expect(result).toBeNull();
            });
        });

        test('should handle edge case with empty string IP', () => {
            const result = paramBuilder._getClientIp({}, '', null);
            expect(result).toBeNull();
        });
    });

    describe('Performance considerations', () => {
        test('should handle rapid successive calls', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PUBLIC };

            for (let i = 0; i < 100; i++) {
                const result = paramBuilder._getClientIp(cookies, null, null);
                expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NET_NEW}`);
            }
        });

        test('should not modify input parameters', () => {
            const originalCookies = { [Constants.FBI_NAME_STRING]: IPV4_PUBLIC };
            const originalXForwardedFor = IPV4_PRIVATE;
            const originalRemoteAddress = IPV6_PRIVATE;

            const cookiesCopy = { ...originalCookies };
            const xForwardedForCopy = originalXForwardedFor;
            const remoteAddressCopy = originalRemoteAddress;

            paramBuilder._getClientIp(cookiesCopy, xForwardedForCopy, remoteAddressCopy);

            expect(cookiesCopy).toEqual(originalCookies);
            expect(xForwardedForCopy).toBe(originalXForwardedFor);
            expect(remoteAddressCopy).toBe(originalRemoteAddress);
        });
    });

    describe('Comprehensive priority testing', () => {
        test('should prioritize IPv6 public cookie over IPv4 public request', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV6_PUBLIC };
            const result = paramBuilder._getClientIp(cookies, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV6_PUBLIC}.${DUMMY_APPENDIX_MODIFIED_NEW}`);
        });

        test('should prioritize IPv6 public request over IPv4 public cookie', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PUBLIC };
            const result = paramBuilder._getClientIp(cookies, IPV6_PUBLIC, null);
            expect(result).toBe(`${IPV6_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });

        test('should prioritize IPv4 public cookie over IPv4 private request', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PUBLIC };
            const result = paramBuilder._getClientIp(cookies, IPV4_PRIVATE, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NET_NEW}`);
        });

        test('should prioritize IPv4 public request over IPv4 private cookie', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PRIVATE };
            const result = paramBuilder._getClientIp(cookies, IPV4_PUBLIC, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NO_CHANGE}`);
        });
    });

    describe('Language token edge cases', () => {
        test('should handle invalid language token', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: `${IPV4_PUBLIC}.XX` }; // Invalid token
            const result = paramBuilder._getClientIp(cookies, null, null);
            // The extracted IP will be "8.8.8.8.XX" which is not a valid IP, so returns null
            expect(result).toBeNull();
        });

        test('should handle multiple dots in cookie value', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: `${IPV4_PUBLIC}.extra.data` };
            const result = paramBuilder._getClientIp(cookies, null, null);
            // The extracted IP will be "8.8.8.8.extra.data" which is not a valid IP, so returns null
            expect(result).toBeNull();
        });

        test('should handle cookie value without any dots', () => {
            const cookies = { [Constants.FBI_NAME_STRING]: IPV4_PUBLIC };
            const result = paramBuilder._getClientIp(cookies, null, null);
            expect(result).toBe(`${IPV4_PUBLIC}.${DUMMY_APPENDIX_NET_NEW}`);
        });
    });
});
