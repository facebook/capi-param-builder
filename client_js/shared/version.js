/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// These constants are injected by webpack from package.json
export const VERSION =
  typeof __VERSION__ !== 'undefined' ? __VERSION__ : '1.0.0';
export const BUILD_DATE =
  typeof __BUILD_DATE__ !== 'undefined'
    ? __BUILD_DATE__
    : new Date().toISOString();

/**
 * Get version and build information
 * @returns {Object} Version and build metadata
 */
export function getVersionInfo() {
  return {
    version: VERSION,
    buildDate: BUILD_DATE,
  };
}
