/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Loads the per-domain extraction rule config and caches it. The fetch
// function is injected so the caller decides the endpoint (Meta-hosted or a
// first-party proxy). Fails closed: a disabled, missing or unreadable config
// yields null, and callers extract nothing.

const STORAGE_KEY_PREFIX = '_fbmeta_cfg:';
const DEFAULT_TTL_SECONDS = 3600;
const MIN_FETCH_INTERVAL_MS = 60 * 1000;

function readStorage(storage, key) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeStorage(storage, key, value) {
  try {
    if (value == null) {
      storage?.removeItem(key);
    } else {
      storage?.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    // Storage full or blocked: the in-memory cache still works.
  }
}

function isUsable(config) {
  return (
    config != null &&
    config.enabled === true &&
    Array.isArray(config.rules) &&
    config.rules.length > 0
  );
}

function ttlMs(config) {
  const ttl = Number(config?.ttl_seconds);
  return (ttl > 0 ? ttl : DEFAULT_TTL_SECONDS) * 1000;
}

function createMetadataConfigLoader({
  fetchConfig,
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
  now = () => Date.now(),
}) {
  const memory = {};
  const inFlight = {};

  async function refresh(origin, cached) {
    const key = STORAGE_KEY_PREFIX + origin;
    let config;
    try {
      config = await fetchConfig(origin, cached?.config?.config_version);
    } catch (e) {
      // Keep serving the last good config until it expires.
      return cached;
    }
    // Not modified: the cached rules are still current, so keep them for
    // another TTL. Without a cached copy there is nothing to keep.
    if (config?.not_modified === true && config.enabled === true) {
      config = cached?.config
        ? { ...cached.config, ttl_seconds: config.ttl_seconds }
        : null;
    }
    // Kill switch: anything but an enabled, non-empty config clears the cache.
    const entry = {
      config: isUsable(config) ? config : null,
      fetchedAt: now(),
    };
    memory[origin] = entry;
    writeStorage(storage, key, entry.config ? entry : null);
    return entry;
  }

  async function getConfig(origin) {
    const key = STORAGE_KEY_PREFIX + origin;
    const cached = memory[origin] ?? readStorage(storage, key);
    const age = cached ? now() - cached.fetchedAt : Infinity;

    if (cached && age < ttlMs(cached.config)) {
      return cached.config;
    }
    if (cached && age < MIN_FETCH_INTERVAL_MS) {
      return cached.config;
    }
    if (!inFlight[origin]) {
      inFlight[origin] = refresh(origin, cached).finally(() => {
        delete inFlight[origin];
      });
    }
    const entry = await inFlight[origin];
    if (entry && now() - entry.fetchedAt >= ttlMs(entry.config)) {
      // A stale entry only survives a failed fetch; stop using it once expired.
      return null;
    }
    return entry?.config ?? null;
  }

  return { getConfig };
}

export {
  createMetadataConfigLoader,
  DEFAULT_TTL_SECONDS,
  MIN_FETCH_INTERVAL_MS,
};
