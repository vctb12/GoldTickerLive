/**
 * Audit Repository
 *
 * Storage-agnostic interface for audit log entries.
 *
 * Backend selection (STORAGE_BACKEND env var, default: 'file'):
 *   file     – JSON file at data/audit-logs.json  (default)
 *   supabase – Supabase public.audit_logs table
 *              Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY and
 *              `npm install @supabase/supabase-js`.
 *
 * All methods are async.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { getSupabaseClient } = require('../lib/supabase-client');

const AUDIT_FILE = path.join(__dirname, '../data/audit-logs.json');
const getBackend = () => process.env.STORAGE_BACKEND || 'file';

// ---------------------------------------------------------------------------
// File-store helpers
// ---------------------------------------------------------------------------

function _ensureFile() {
    const dir = path.dirname(AUDIT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(AUDIT_FILE)) fs.writeFileSync(AUDIT_FILE, '[]');
}

function _readFile() {
    _ensureFile();
    try {
        return JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function _writeFile(logs) {
    _ensureFile();
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2));
}

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

async function _supabaseInsert(entry) {
    const sb = getSupabaseClient(true);
    if (!sb) throw new Error('Supabase is not configured.');
    // Map camelCase → snake_case for the Supabase schema
    const row = {
        actor:       entry.actor,
        action:      entry.action,
        entity_type: entry.entityType,
        entity_id:   entry.entityId || null,
        changes:     entry.changes  || null,
        ip_address:  entry.ipAddress || null,
        user_agent:  entry.userAgent || null,
    };
    const { data, error } = await sb.from('audit_logs').insert([row]).select().single();
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return _mapFromSupabase(data);
}

async function _supabaseQuery(options = {}) {
    const sb = getSupabaseClient(true);
    if (!sb) throw new Error('Supabase is not configured.');
    let query = sb.from('audit_logs').select('*', { count: 'exact' });

    if (options.action)     query = query.eq('action', options.action);
    if (options.entityType) query = query.eq('entity_type', options.entityType);
    if (options.actor)      query = query.eq('actor', options.actor);
    if (options.startDate)  query = query.gte('timestamp', options.startDate);
    if (options.endDate)    query = query.lte('timestamp', options.endDate);

    const page  = options.page  || 1;
    const limit = options.limit || 50;
    const from  = (page - 1) * limit;
    const to    = from + limit - 1;

    query = query.order('timestamp', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(`Supabase error: ${error.message}`);

    return {
        logs:       (data || []).map(_mapFromSupabase),
        total:      count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
    };
}

function _mapFromSupabase(row) {
    return {
        id:         row.id,
        timestamp:  row.timestamp,
        actor:      row.actor,
        action:     row.action,
        entityType: row.entity_type,
        entityId:   row.entity_id,
        changes:    row.changes,
        ipAddress:  row.ip_address,
        userAgent:  row.user_agent,
    };
}

// ---------------------------------------------------------------------------
// Public repository API
// ---------------------------------------------------------------------------

/**
 * Append a new audit log entry.
 * @param {object} entry  – { actor, action, entityType, entityId, changes, ipAddress, userAgent }
 * @returns {Promise<object>}  the saved entry (including generated id and timestamp)
 */
async function append(entry) {
    if (getBackend() === 'supabase') return _supabaseInsert(entry);

    const logs = _readFile();
    const saved = {
        id:        'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
        timestamp: new Date().toISOString(),
        ...entry,
    };
    logs.push(saved);
    _writeFile(logs);
    return saved;
}

/**
 * Return all log entries (unfiltered).
 * @returns {Promise<object[]>}
 */
async function getAll() {
    if (getBackend() === 'supabase') {
        const result = await _supabaseQuery({ limit: 10000 });
        return result.logs;
    }
    return _readFile();
}

/**
 * Return a paginated, filtered slice of the audit log.
 * @param {object} options – { action, entityType, actor, startDate, endDate, page, limit }
 * @returns {Promise<{ logs: object[], total: number, page: number, limit: number, totalPages: number }>}
 */
async function query(options = {}) {
    if (getBackend() === 'supabase') return _supabaseQuery(options);

    let logs = _readFile();

    if (options.action)     logs = logs.filter(l => l.action === options.action);
    if (options.entityType) logs = logs.filter(l => l.entityType === options.entityType);
    if (options.actor)      logs = logs.filter(l => l.actor === options.actor);
    if (options.startDate)  logs = logs.filter(l => new Date(l.timestamp) >= new Date(options.startDate));
    if (options.endDate)    logs = logs.filter(l => new Date(l.timestamp) <= new Date(options.endDate));

    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const page  = options.page  || 1;
    const limit = options.limit || 50;
    const start = (page - 1) * limit;

    return {
        logs:       logs.slice(start, start + limit),
        total:      logs.length,
        page,
        limit,
        totalPages: Math.ceil(logs.length / limit),
    };
}

/**
 * Delete entries older than `daysToKeep`.
 * Only supported for the file backend (Supabase can use scheduled jobs).
 * @param {number} [daysToKeep=90]
 * @returns {Promise<number>}  count of deleted entries
 */
async function pruneOldEntries(daysToKeep = 90) {
    if (getBackend() === 'supabase') {
        console.warn('[audit.repository] pruneOldEntries is a no-op for the Supabase backend.');
        return 0;
    }
    const logs   = _readFile();
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const kept   = logs.filter(l => new Date(l.timestamp) >= cutoff);
    if (kept.length === logs.length) return 0;
    _writeFile(kept);
    return logs.length - kept.length;
}

module.exports = { append, getAll, query, pruneOldEntries };
