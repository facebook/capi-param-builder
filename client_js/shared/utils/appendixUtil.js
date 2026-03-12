/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getVersionInfo } from '../version.js';
import {
  LANGUAGE_TOKEN,
  DEFAULT_FORMAT,
  LANGUAGE_TOKEN_INDEX,
  APPENDIX_NET_NEW,
  APPENDIX_GENERAL_NEW,
  APPENDIX_MODIFIED_NEW,
  APPENDIX_NO_CHANGE,
} from '../model/constants.js';

/**
 * Generate appendix based on SDK version and appendix type
 * @param {number} appendixType - The type of appendix (APPENDIX_NET_NEW, APPENDIX_MODIFIED_NEW, APPENDIX_GENERAL_NEW, or APPENDIX_NO_CHANGE)
 * @returns {string} Base64url-safe encoded appendix or fallback language token
 */
function getAppendix(appendixType = APPENDIX_NO_CHANGE) {
  try {
    const sdkVersion = getVersionInfo().version;

    // Validate version format (semantic versioning: major.minor.patch)
    const versionRegex = /^\d+(\.\d+){2}$/;
    if (!versionRegex.test(sdkVersion)) {
      return LANGUAGE_TOKEN;
    }

    // Parse version components
    const versionParts = sdkVersion.split('.');
    const major = parseInt(versionParts[0], 10);
    const minor = parseInt(versionParts[1], 10);
    const patch = parseInt(versionParts[2], 10);

    // Validate version numbers are within byte range (0-255)
    if (major > 255 || minor > 255 || patch > 255) {
      return LANGUAGE_TOKEN;
    }

    // Create byte indicating the appendix type
    const appendixTypeByte = [
      APPENDIX_NET_NEW,
      APPENDIX_GENERAL_NEW,
      APPENDIX_MODIFIED_NEW,
    ].includes(appendixType)
      ? appendixType
      : APPENDIX_NO_CHANGE;

    // Create byte array: [DEFAULT_FORMAT, LANGUAGE_TOKEN_INDEX, appendix_type_byte, major, minor, patch]
    const bytes = new Uint8Array([
      DEFAULT_FORMAT,
      LANGUAGE_TOKEN_INDEX,
      appendixTypeByte,
      major,
      minor,
      patch,
    ]);

    // Convert to base64
    let base64 = '';
    if (typeof btoa !== 'undefined') {
      // Browser environment
      base64 = btoa(String.fromCharCode(...bytes));
    } else {
      // Node.js environment
      base64 = Buffer.from(bytes).toString('base64');
    }

    // Make it URL-safe by replacing +, /, and = characters
    const base64UrlSafe = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return base64UrlSafe;
  } catch (error) {
    // Fallback to legacy language token if version parsing fails
    console.warn(
      'Warning: Failed to generate appendix, using fallback:',
      error.message
    );
    return LANGUAGE_TOKEN;
  }
}

export { getAppendix };
