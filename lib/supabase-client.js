/**
 * Supabase Client
 *
 * Provides a lazy-initialised Supabase client for server-side use.
 * Requires the `@supabase/supabase-js` package and the following env vars:
 *   SUPABASE_URL              – your project URL
 *   SUPABASE_ANON_KEY         – public anon key (browser-safe reads)
 *   SUPABASE_SERVICE_ROLE_KEY – service-role key (bypasses RLS; server only)
 *
 * If the env vars are absent the factory returns null rather than throwing,
 * so callers can fall back to file-based storage gracefully.
 *
 * Usage (server-side):
 *   const { getSupabaseClient } = require('./supabase-client');
 *   const supabase = getSupabaseClient(true); // useServiceRole = true → bypasses RLS
 *
 * The @supabase/supabase-js package is not listed as a hard dependency so the
 * rest of the app continues to work without it.  To enable Supabase storage:
 *   npm install @supabase/supabase-js
 */

'use strict';

let _anonClient = null;
let _serviceClient = null;

/**
 * Returns a Supabase client, or null if the env vars / package are missing.
 * @param {boolean} [useServiceRole=false]  Use the service-role key (server only).
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
function getSupabaseClient(useServiceRole = false) {
    // Pick the cached instance
    const cached = useServiceRole ? _serviceClient : _anonClient;
    if (cached) return cached;

    const url = process.env.SUPABASE_URL;
    const key = useServiceRole
        ? process.env.SUPABASE_SERVICE_ROLE_KEY
        : process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
        // Not configured – caller should fall back to file storage
        return null;
    }

    let createClient;
    try {
        ({ createClient } = require('@supabase/supabase-js'));
    } catch {
        console.warn(
            '[supabase-client] @supabase/supabase-js is not installed. ' +
            'Run `npm install @supabase/supabase-js` to enable Supabase storage.'
        );
        return null;
    }

    const client = createClient(url, key, {
        auth: {
            // Server-side: disable automatic session persistence
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    if (useServiceRole) {
        _serviceClient = client;
    } else {
        _anonClient = client;
    }

    return client;
}

/**
 * Returns true only if both SUPABASE_URL and SUPABASE_ANON_KEY are set and
 * @supabase/supabase-js is installed.
 */
function isSupabaseConfigured() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return false;
    try {
        require('@supabase/supabase-js');
        return true;
    } catch {
        return false;
    }
}

/** Reset cached clients (useful in tests). */
function _resetClients() {
    _anonClient = null;
    _serviceClient = null;
}

module.exports = { getSupabaseClient, isSupabaseConfigured, _resetClients };
