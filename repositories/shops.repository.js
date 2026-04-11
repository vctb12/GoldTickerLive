/**
 * Shops Repository
 *
 * Storage-agnostic CRUD interface for shops.
 *
 * Backend selection (set STORAGE_BACKEND env var, default: 'file'):
 *   file     – JSON file at data/shops-data.json  (default, zero config)
 *   supabase – Supabase public.shops table
 *              Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY and
 *              `npm install @supabase/supabase-js`.
 *
 * All methods are async so callers are forward-compatible with the Supabase
 * backend even when file storage is active.
 *
 * Migration path:
 *   1. Set STORAGE_BACKEND=supabase and the Supabase env vars.
 *   2. Run the one-off migration (see docs/SUPABASE_SETUP.md §6).
 *   3. lib/admin/shop-manager.js can be updated to delegate here.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { getSupabaseClient } = require('../lib/supabase-client');

const SHOPS_FILE  = path.join(__dirname, '../data/shops-data.json');
const getBackend  = () => process.env.STORAGE_BACKEND || 'file';

// ---------------------------------------------------------------------------
// File-store helpers
// ---------------------------------------------------------------------------

function _ensureFile() {
    const dir = path.dirname(SHOPS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(SHOPS_FILE)) fs.writeFileSync(SHOPS_FILE, '[]');
}

function _readFile() {
    _ensureFile();
    try {
        return JSON.parse(fs.readFileSync(SHOPS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function _writeFile(shops) {
    _ensureFile();
    fs.writeFileSync(SHOPS_FILE, JSON.stringify(shops, null, 2));
}

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

async function _supabaseGetAll() {
    const sb = getSupabaseClient(true);
    if (!sb) throw new Error('Supabase is not configured (missing env vars or package).');
    const { data, error } = await sb.from('shops').select('*');
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return data || [];
}

async function _supabaseGetById(id) {
    const sb = getSupabaseClient(true);
    if (!sb) throw new Error('Supabase is not configured.');
    const { data, error } = await sb.from('shops').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return data;
}

async function _supabaseInsert(shop) {
    const sb = getSupabaseClient(true);
    if (!sb) throw new Error('Supabase is not configured.');
    const { data, error } = await sb.from('shops').insert([shop]).select().single();
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return data;
}

async function _supabaseUpdate(id, updates) {
    const sb = getSupabaseClient(true);
    if (!sb) throw new Error('Supabase is not configured.');
    const { data, error } = await sb.from('shops').update(updates).eq('id', id).select().single();
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return data;
}

async function _supabaseDelete(id) {
    const sb = getSupabaseClient(true);
    if (!sb) throw new Error('Supabase is not configured.');
    const { data, error } = await sb.from('shops').delete().eq('id', id).select('id');
    if (error) throw new Error(`Supabase error: ${error.message}`);
    // Return whether a row was actually deleted
    return Array.isArray(data) && data.length > 0;
}

async function _supabaseInsertMany(shops) {
    const sb = getSupabaseClient(true);
    if (!sb) throw new Error('Supabase is not configured.');
    const { data, error } = await sb.from('shops').insert(shops).select();
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return data || [];
}

// ---------------------------------------------------------------------------
// Public repository API
// ---------------------------------------------------------------------------

/**
 * Return all shops.
 * @returns {Promise<object[]>}
 */
async function getAll() {
    if (getBackend() === 'supabase') return _supabaseGetAll();
    return _readFile();
}

/**
 * Find a single shop by its ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function getById(id) {
    if (getBackend() === 'supabase') return _supabaseGetById(id);
    const shops = _readFile();
    return shops.find(s => s.id === id) || null;
}

/**
 * Persist a new shop object (must already have an `id` field).
 * @param {object} shop
 * @returns {Promise<object>}  the saved shop
 */
async function insert(shop) {
    if (getBackend() === 'supabase') return _supabaseInsert(shop);
    const shops = _readFile();
    shops.push(shop);
    _writeFile(shops);
    return shop;
}

/**
 * Apply partial updates to an existing shop.
 * @param {string}  id
 * @param {object}  updates  – fields to merge
 * @returns {Promise<object|null>}  the updated shop, or null if not found
 */
async function update(id, updates) {
    if (getBackend() === 'supabase') return _supabaseUpdate(id, updates);
    const shops = _readFile();
    const idx = shops.findIndex(s => s.id === id);
    if (idx === -1) return null;
    shops[idx] = { ...shops[idx], ...updates };
    _writeFile(shops);
    return shops[idx];
}

/**
 * Delete a shop by ID.
 * @param {string} id
 * @returns {Promise<boolean>}  true if deleted, false if not found
 */
async function remove(id) {
    if (getBackend() === 'supabase') {
        return _supabaseDelete(id); // returns true/false based on affected rows
    }
    const shops = _readFile();
    const idx = shops.findIndex(s => s.id === id);
    if (idx === -1) return false;
    shops.splice(idx, 1);
    _writeFile(shops);
    return true;
}

/**
 * Insert multiple shops at once.
 * @param {object[]} shops  – each must have an `id` field
 * @returns {Promise<object[]>}  the saved shops
 */
async function insertMany(shops) {
    if (getBackend() === 'supabase') return _supabaseInsertMany(shops);
    const existing = _readFile();
    existing.push(...shops);
    _writeFile(existing);
    return shops;
}

/**
 * Replace the entire shop list (file backend only, used by shop-manager).
 * Not exposed in the Supabase backend — use individual insert/update/remove calls.
 * @param {object[]} shops
 */
async function replaceAll(shops) {
    if (getBackend() === 'supabase') {
        throw new Error('replaceAll is not supported with the Supabase backend. Use insert/update/remove.');
    }
    _writeFile(shops);
}

/**
 * Return aggregate stats useful for the admin dashboard.
 * @returns {Promise<{total: number, verified: number, byCountry: object}>}
 */
async function getStats() {
    const shops = await getAll();
    const byCountry = {};
    for (const s of shops) {
        const key = s.country || s.countryCode || 'Unknown';
        byCountry[key] = (byCountry[key] || 0) + 1;
    }
    return {
        total:    shops.length,
        verified: shops.filter(s => s.verified).length,
        featured: shops.filter(s => s.featured).length,
        byCountry,
    };
}

module.exports = { getAll, getById, insert, update, remove, insertMany, replaceAll, getStats };
