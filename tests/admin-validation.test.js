'use strict';

/**
 * Regression coverage for server/lib/admin/validation.js.
 *
 * These helpers sanitize admin shop/user writes and pagination query params.
 * Drift here can accept oversized strings, invalid roles/passwords, or
 * clamp pagination incorrectly — high blast radius for admin permissions
 * and shop data integrity.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  sanitizeString,
  parseIntParam,
  validateShopInput,
  validateUserInput,
} = require('../server/lib/admin/validation');

describe('sanitizeString', () => {
  test('trims, collapses whitespace, and enforces max length', () => {
    assert.equal(sanitizeString('  hello   world  '), 'hello world');
    assert.equal(sanitizeString('abcdefghij', 5), 'abcde');
  });

  test('returns undefined for non-strings, null, empty, and whitespace-only', () => {
    assert.equal(sanitizeString(undefined), undefined);
    assert.equal(sanitizeString(null), undefined);
    assert.equal(sanitizeString(42), undefined);
    assert.equal(sanitizeString('   '), undefined);
    assert.equal(sanitizeString(''), undefined);
  });
});

describe('parseIntParam', () => {
  test('returns default for missing, NaN, or below-min values', () => {
    assert.equal(parseIntParam(undefined, 20), 20);
    assert.equal(parseIntParam(null, 20), 20);
    assert.equal(parseIntParam('abc', 20), 20);
    assert.equal(parseIntParam('0', 20, 1, 100), 20);
  });

  test('parses and clamps to max', () => {
    assert.equal(parseIntParam('50', 20, 1, 100), 50);
    assert.equal(parseIntParam('9999', 20, 1, 200), 200);
  });
});

describe('validateShopInput', () => {
  test('keeps only known string/boolean/number fields and sanitises them', () => {
    const cleaned = validateShopInput({
      name: '  Dubai   Gold  ',
      city: 'Dubai',
      verified: 'true',
      featured: false,
      latitude: '25.2',
      longitude: 55.3,
      unknown: 'drop-me',
      phone: 971501234567, // non-string → dropped
    });
    assert.deepEqual(cleaned, {
      name: 'Dubai Gold',
      city: 'Dubai',
      verified: true,
      featured: false,
      latitude: 25.2,
      longitude: 55.3,
    });
  });

  test('ignores invalid boolean and non-finite number values', () => {
    const cleaned = validateShopInput({
      verified: 'yes',
      featured: 1,
      latitude: 'NaN',
      longitude: Infinity,
    });
    assert.deepEqual(cleaned, {});
  });
});

describe('validateUserInput', () => {
  test('accepts allowed roles and sanitises email/name', () => {
    const cleaned = validateUserInput({
      email: '  admin@example.com  ',
      name: '  Ops   Admin ',
      role: 'editor',
      password: 'securepass',
    });
    assert.equal(cleaned.email, 'admin@example.com');
    assert.equal(cleaned.name, 'Ops Admin');
    assert.equal(cleaned.role, 'editor');
    assert.equal(cleaned.password, 'securepass');
  });

  test('rejects disallowed roles', () => {
    assert.throws(
      () => validateUserInput({ role: 'superadmin' }),
      /Role must be one of: viewer, editor, admin/
    );
  });

  test('rejects short passwords', () => {
    assert.throws(() => validateUserInput({ password: 'short' }), /Password must be at least 8/);
  });
});
