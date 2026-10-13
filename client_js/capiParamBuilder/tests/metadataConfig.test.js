/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  createMetadataConfigLoader,
  MIN_FETCH_INTERVAL_MS,
} from '../src/metadata/metadataConfig.js';

const ORIGIN = 'https://shop.example';
const RULES = [
  {
    rule_id: '1',
    rule_type: 'css_rule',
    attribute: 'value',
    rule_expression: '.price',
  },
];

function makeLoader(responses) {
  let clock = 1000000;
  const fetchConfig = jest.fn(async () => {
    const next = responses.shift();
    if (next instanceof Error) {
      throw next;
    }
    return next;
  });
  const loader = createMetadataConfigLoader({
    fetchConfig,
    storage: localStorage,
    now: () => clock,
  });
  return { loader, fetchConfig, advance: (ms) => (clock += ms) };
}

describe('metadataConfig', () => {
  beforeEach(() => localStorage.clear());

  test('caches until ttl expires', async () => {
    const config = {
      enabled: true,
      rules: RULES,
      ttl_seconds: 600,
      config_version: 'v1',
    };
    const { loader, fetchConfig, advance } = makeLoader([
      config,
      { ...config, config_version: 'v2' },
    ]);
    expect((await loader.getConfig(ORIGIN)).config_version).toBe('v1');
    advance(599 * 1000);
    expect((await loader.getConfig(ORIGIN)).config_version).toBe('v1');
    expect(fetchConfig).toHaveBeenCalledTimes(1);
    advance(2000);
    expect((await loader.getConfig(ORIGIN)).config_version).toBe('v2');
    expect(fetchConfig).toHaveBeenLastCalledWith(ORIGIN, 'v1');
  });

  test('kill switch clears the cache', async () => {
    const { loader, advance } = makeLoader([
      { enabled: true, rules: RULES, ttl_seconds: 60 },
      { enabled: false, rules: RULES },
    ]);
    expect(await loader.getConfig(ORIGIN)).not.toBeNull();
    advance(MIN_FETCH_INTERVAL_MS + 1);
    expect(await loader.getConfig(ORIGIN)).toBeNull();
    expect(localStorage.getItem('_fbmeta_cfg:' + ORIGIN)).toBeNull();
  });

  test('not_modified keeps the cached rules for another ttl', async () => {
    const config = {
      enabled: true,
      rules: RULES,
      ttl_seconds: 60,
      config_version: 'v1',
    };
    const { loader, fetchConfig, advance } = makeLoader([
      config,
      {
        enabled: true,
        not_modified: true,
        config_version: 'v1',
        ttl_seconds: 60,
      },
      { enabled: true, rules: [], ttl_seconds: 60 },
    ]);
    await loader.getConfig(ORIGIN);
    advance(61 * 1000);
    expect((await loader.getConfig(ORIGIN)).rules).toEqual(RULES);
    expect(fetchConfig).toHaveBeenLastCalledWith(ORIGIN, 'v1');
    advance(59 * 1000);
    expect((await loader.getConfig(ORIGIN)).rules).toEqual(RULES);
    expect(fetchConfig).toHaveBeenCalledTimes(2);
  });

  test('not_modified without a cached copy fails closed', async () => {
    const { loader } = makeLoader([
      { enabled: true, not_modified: true, config_version: 'v1' },
    ]);
    expect(await loader.getConfig(ORIGIN)).toBeNull();
  });

  test('missing enabled flag fails closed', async () => {
    const { loader } = makeLoader([{ rules: RULES }]);
    expect(await loader.getConfig(ORIGIN)).toBeNull();
  });

  test('fetch failure serves last good config until it expires', async () => {
    const config = { enabled: true, rules: RULES, ttl_seconds: 120 };
    const { loader, advance } = makeLoader([
      config,
      new Error('network'),
      new Error('network'),
    ]);
    await loader.getConfig(ORIGIN);
    advance(121 * 1000);
    expect(await loader.getConfig(ORIGIN)).toBeNull();
  });

  test('rate limits refetches of an empty config', async () => {
    const { loader, fetchConfig, advance } = makeLoader([null, null]);
    await loader.getConfig(ORIGIN);
    advance(1000);
    await loader.getConfig(ORIGIN);
    expect(fetchConfig).toHaveBeenCalledTimes(1);
  });

  test('concurrent calls share one fetch', async () => {
    const { loader, fetchConfig } = makeLoader([
      { enabled: true, rules: RULES },
    ]);
    await Promise.all([loader.getConfig(ORIGIN), loader.getConfig(ORIGIN)]);
    expect(fetchConfig).toHaveBeenCalledTimes(1);
  });

  test('reuses config persisted by an earlier page load', async () => {
    const first = makeLoader([
      { enabled: true, rules: RULES, config_version: 'v1' },
    ]);
    await first.loader.getConfig(ORIGIN);
    const second = createMetadataConfigLoader({
      fetchConfig: jest.fn(),
      storage: localStorage,
      now: () => 1000000,
    });
    expect((await second.getConfig(ORIGIN)).config_version).toBe('v1');
  });
});
