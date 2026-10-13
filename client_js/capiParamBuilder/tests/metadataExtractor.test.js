/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { extractMetadata } from '../src/metadata/metadataExtractor.js';

function rule(attribute, rule_expression, extra = {}) {
  return {
    rule_id: attribute + rule_expression,
    rule_type: 'css_rule',
    attribute,
    rule_expression,
    ...extra,
  };
}

function config(rules, extra = {}) {
  return { enabled: true, config_version: 'v1', rules, ...extra };
}

describe('metadataExtractor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/');
  });

  test('extracts approved fields and normalizes them', () => {
    document.body.innerHTML =
      '<h1 class="title"> Red  Shoe </h1><span class="price">€1.234,50</span>' +
      '<meta class="cur" content="eur"><span class="sku">SKU-1</span>';
    const { fields, config_version } = extractMetadata(
      config([
        rule('content_name', '.title'),
        rule('value', '.price'),
        rule('currency', '.cur'),
        rule('content_ids', '.sku'),
      ]),
      'ViewContent'
    );
    expect(fields).toEqual({
      content_name: 'Red Shoe',
      value: '1234.5',
      currency: 'EUR',
      content_ids: 'SKU-1',
    });
    expect(config_version).toBe('v1');
  });

  test('first valid rule per field wins in priority order', () => {
    document.body.innerHTML =
      '<span class="a">no price</span><span class="b">$19.99</span>';
    const { fields } = extractMetadata(
      config([
        rule('value', '.missing'),
        rule('value', '.a'),
        rule('value', '.b'),
      ]),
      'ViewContent'
    );
    expect(fields.value).toBe('19.99');
  });

  test('drops unapproved and opted-out fields', () => {
    document.body.innerHTML =
      '<span class="x">secret</span><span class="t">Title</span>';
    const { fields } = extractMetadata(
      config([rule('page_description', '.x'), rule('content_name', '.t')], {
        opted_out_fields: ['content_name'],
      }),
      'ViewContent'
    );
    expect(fields).toEqual({});
  });

  test('drops values that look like PII', () => {
    document.body.innerHTML =
      '<span class="t">contact jane@example.com</span><span class="p">+1 (650) 555-0100</span>';
    const { fields } = extractMetadata(
      config([rule('content_name', '.t'), rule('content_ids', '.p')]),
      'ViewContent'
    );
    expect(fields).toEqual({});
  });

  test('caps value length', () => {
    document.body.innerHTML = `<span class="t">${'a'.repeat(900)}</span>`;
    const { fields } = extractMetadata(
      config([rule('content_name', '.t')]),
      'ViewContent'
    );
    expect(fields.content_name).toHaveLength(500);
  });

  test('search_string only from a search input on Search events', () => {
    document.body.innerHTML =
      '<input class="q" value="running shoes"><span class="s">running shoes</span>';
    const rules = [rule('search_string', '.s'), rule('search_string', '.q')];
    expect(extractMetadata(config(rules), 'ViewContent').fields).toEqual({});
    expect(extractMetadata(config(rules), 'Search').fields).toEqual({
      search_string: 'running shoes',
    });
  });

  test('skips structured_signal rules and malformed selectors', () => {
    document.body.innerHTML = '<span class="t">Title</span>';
    const { fields } = extractMetadata(
      config([
        {
          rule_id: 's',
          rule_type: 'structured_signal',
          attribute: 'content_name',
          rule_expression: '{}',
        },
        rule('content_name', '[[bad'),
        rule('content_name', '.t'),
      ]),
      'ViewContent'
    );
    expect(fields).toEqual({ content_name: 'Title' });
  });

  test('disabled or missing config extracts nothing', () => {
    document.body.innerHTML = '<span class="t">Title</span>';
    expect(
      extractMetadata(
        config([rule('content_name', '.t')], { enabled: false }),
        'ViewContent'
      ).fields
    ).toEqual({});
    expect(extractMetadata(null, 'ViewContent').fields).toEqual({});
  });

  test('reads the current page after single-page-app navigation', () => {
    const rules = [rule('content_name', '.t', { url_pattern: '/product/' })];
    window.history.pushState({}, '', '/product/1');
    document.body.innerHTML = '<span class="t">First</span>';
    expect(
      extractMetadata(config(rules), 'ViewContent').fields.content_name
    ).toBe('First');
    window.history.pushState({}, '', '/product/2');
    document.body.innerHTML = '<span class="t">Second</span>';
    expect(
      extractMetadata(config(rules), 'ViewContent').fields.content_name
    ).toBe('Second');
    window.history.pushState({}, '', '/cart');
    expect(extractMetadata(config(rules), 'ViewContent').fields).toEqual({});
  });
});
