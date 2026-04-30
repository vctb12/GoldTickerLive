/**
 * Pending Shops Repository
 *
 * Stores public shop submissions that need editorial review before they can
 * be published to the main shop directory.  All entries start with
 * `status: 'pending'` and are moved to approved/rejected by an admin via
 * the admin queue API.
 *
 * Persistence: `data/pending_shops.json` via atomicWriteJSON() (W-4).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { atomicWriteJSON } = require('../lib/fs-atomic.js');

const PENDING_FILE = path.join(__dirname, '../../data/pending_shops.json');

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

function _ensureFile() {
  const dir = path.dirname(PENDING_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(PENDING_FILE)) fs.writeFileSync(PENDING_FILE, JSON.stringify([], null, 2));
}

function _readFile() {
  _ensureFile();
  try {
    return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function _writeFile(submissions) {
  _ensureFile();
  try {
    atomicWriteJSON(PENDING_FILE, submissions);
  } catch (err) {
    console.error('[pending-shops.repository] Failed to write file:', err.message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return all submissions (all statuses).
 * @returns {object[]}
 */
function getAll() {
  return _readFile();
}

/**
 * Return only submissions with status === 'pending'.
 * @returns {object[]}
 */
function getPending() {
  return _readFile().filter((s) => s.status === 'pending');
}

/**
 * Find a submission by its ID.
 * @param {string} id
 * @returns {object|null}
 */
function getById(id) {
  return _readFile().find((s) => s.id === id) || null;
}

/**
 * Insert a new submission.  The caller must supply a unique `id` field.
 * @param {object} submission
 * @returns {object} the saved submission
 */
function insert(submission) {
  const subs = _readFile();
  subs.push(submission);
  _writeFile(subs);
  return submission;
}

/**
 * Apply partial updates to a submission.
 * @param {string} id
 * @param {object} updates
 * @returns {object|null} the updated submission, or null if not found
 */
function update(id, updates) {
  const subs = _readFile();
  const idx = subs.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  subs[idx] = { ...subs[idx], ...updates };
  _writeFile(subs);
  return subs[idx];
}

/**
 * Permanently delete a submission.
 * @param {string} id
 * @returns {boolean} true if deleted, false if not found
 */
function remove(id) {
  const subs = _readFile();
  const idx = subs.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  subs.splice(idx, 1);
  _writeFile(subs);
  return true;
}

/**
 * Count submissions grouped by status.
 * @returns {{ pending: number, approved: number, rejected: number, total: number }}
 */
function getCounts() {
  const subs = _readFile();
  return {
    pending: subs.filter((s) => s.status === 'pending').length,
    approved: subs.filter((s) => s.status === 'approved').length,
    rejected: subs.filter((s) => s.status === 'rejected').length,
    total: subs.length,
  };
}

module.exports = { getAll, getPending, getById, insert, update, remove, getCounts };
