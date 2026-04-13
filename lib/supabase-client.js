/**
 * lib/supabase-client.js
 *
 * Lazy-initializing Supabase client for **server-side** (Node.js) use.
 * Used by the repository layer (repositories/shops.repository.js,
 * repositories/audit.repository.js) when STORAGE_BACKEND=supabase.
 *
 * Environment variables:
 *   SUPABASE_URL              — Project URL (https://<ref>.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY — Service-role key (NOT the anon key)
 *
 * If either env var is missing the factory returns null so that callers can
 * fall back to file-based storage gracefully.
 *
 * IMPORTANT: This module must NOT be deleted — it is actively required by
 * repositories/shops.repository.js and repositories/audit.repository.js.
 */

'use strict';

let _client = null;
let _initAttempted = false;

/**
 * Return the shared Supabase client, or null if env vars are missing
 * or @supabase/supabase-js is not installed.
 *
 * @param {boolean} [throwOnMissing=false]  If true, throw instead of returning null
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
function getSupabaseClient(throwOnMissing = false) {
    if (_client) return _client;
    if (_initAttempted) return null; // already tried & failed

    _initAttempted = true;

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        if (throwOnMissing) {
            throw new Error(
                '[supabase-client] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set ' +
                'when STORAGE_BACKEND=supabase.'
            );
        }
        return null;
    }

    try {
        // Dynamic require so the module stays optional — the project does not
        // always have @supabase/supabase-js installed (e.g. CI with file backend).
        const { createClient } = require('@supabase/supabase-js');
        _client = createClient(url, key, {
            auth: { persistSession: false },
        });
        return _client;
    } catch (err) {
        console.warn(
            '[supabase-client] Could not initialize Supabase client:',
            err.message
        );
        return null;
    }
}

module.exports = { getSupabaseClient };
