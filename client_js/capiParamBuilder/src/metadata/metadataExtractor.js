/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Applies per-domain extraction rules to the current page. Reads the live
// document and location on every call, so single-page-app navigations are
// picked up without any cached page state.

const MAX_VALUE_LENGTH = 500;

// custom_data fields this SDK may fill. Anything else a rule names is ignored.
const APPROVED_FIELDS = new Set([
  'value',
  'currency',
  'content_ids',
  'content_type',
  'content_name',
  'contents',
  'search_string',
]);

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_PATTERN = /\+?\d[\d\s().-]{8,}\d/;

function looksLikePII(text) {
  return EMAIL_PATTERN.test(text) || PHONE_PATTERN.test(text);
}

function querySelectorLenient(doc, selector) {
  // Crawled selectors may use Tailwind's `.!class`; browsers need it escaped.
  return doc.querySelector(selector.replace(/\.!/g, '.\\!'));
}

function elementText(element) {
  if (
    element.tagName === 'INPUT' ||
    element.tagName === 'SELECT' ||
    element.tagName === 'TEXTAREA'
  ) {
    return element.value ?? '';
  }
  const text = (element.innerText || element.textContent || '').trim();
  if (text !== '') {
    return text;
  }
  for (const attr of ['content', 'value', 'alt']) {
    const value = element.getAttribute(attr);
    if (value != null && value.trim() !== '') {
      return value;
    }
  }
  return '';
}

function parsePrice(text) {
  const match = text.replace(/\s/g, '').match(/\d[\d.,]*/);
  if (match == null) {
    return null;
  }
  let number = match[0];
  const lastDot = number.lastIndexOf('.');
  const lastComma = number.lastIndexOf(',');
  if (lastComma > lastDot && number.length - lastComma <= 3) {
    // 1.234,56 -> 1234.56
    number = number.replace(/\./g, '').replace(',', '.');
  } else {
    number = number.replace(/,/g, '');
  }
  const value = Number.parseFloat(number);
  return Number.isFinite(value) ? String(value) : null;
}

function normalize(field, raw) {
  const text = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_VALUE_LENGTH);
  if (text === '' || looksLikePII(text)) {
    return null;
  }
  if (field === 'value') {
    return parsePrice(text);
  }
  if (field === 'currency') {
    const code = text.toUpperCase();
    return /^[A-Z]{3}$/.test(code) ? code : null;
  }
  return text;
}

function ruleApplies(rule, eventName, pathname, optedOut) {
  const field = rule?.attribute;
  if (!APPROVED_FIELDS.has(field) || optedOut.has(field)) {
    return false;
  }
  if (
    rule.rule_type !== 'css_rule' ||
    typeof rule.rule_expression !== 'string'
  ) {
    // structured_signal rules are not evaluated by this SDK yet.
    return false;
  }
  if (rule.url_pattern && !pathname.includes(rule.url_pattern)) {
    return false;
  }
  // search_string only comes from a search input, and only on Search events.
  return field !== 'search_string' || eventName === 'Search';
}

function extractMetadata(
  config,
  eventName,
  doc = typeof document !== 'undefined' ? document : null,
  loc = typeof location !== 'undefined' ? location : null
) {
  const fields = {};
  if (config?.enabled !== true || !Array.isArray(config.rules) || doc == null) {
    return { fields, config_version: config?.config_version ?? null };
  }
  const optedOut = new Set(config.opted_out_fields ?? []);
  const pathname = loc?.pathname ?? '';

  // Rules arrive ordered by source priority: the first valid hit per field wins.
  for (const rule of config.rules) {
    if (fields[rule?.attribute] != null) {
      continue;
    }
    if (!ruleApplies(rule, eventName, pathname, optedOut)) {
      continue;
    }
    try {
      const element = querySelectorLenient(doc, rule.rule_expression);
      if (element == null) {
        continue;
      }
      if (rule.attribute === 'search_string' && element.tagName !== 'INPUT') {
        continue;
      }
      const value = normalize(rule.attribute, elementText(element));
      if (value != null) {
        fields[rule.attribute] = value;
      }
    } catch (e) {
      // A malformed selector must not break extraction of other fields.
    }
  }
  return { fields, config_version: config.config_version ?? null };
}

export { extractMetadata, APPROVED_FIELDS, MAX_VALUE_LENGTH };
