/**
 * lib/supabase-data.js
 *
 * Fetches live shop directory data from Supabase for the public shops page.
 * Uses the Supabase REST API directly (PostgREST) — no SDK required in the
 * browser bundle.
 *
 * RLS policy on the shops table restricts anonymous reads to verified=true rows.
 *
 * Returns an array shaped like data/shops.js entries so scripts/pages/shops.js
 * can swap it in without changing rendering logic.  Returns null on any error
 * so the caller falls back to the hardcoded dataset.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase.js';

/**
 * Map a Supabase row (snake_case) to the client-side shop object (camelCase)
 * expected by the shops page renderer.
 */
function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    countryCode: row.country_code || '',
    city: row.city || '',
    market: row.market || '',
    category: row.category || '',
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    phone: row.phone || '',
    website: row.website || '',
    detailsAvailability: row.details_availability || 'limited',
    featured: Boolean(row.featured),
    verified: Boolean(row.verified),
    notes: row.notes || '',
  };
}

/**
 * Fetch verified shops from Supabase.
 *
 * @returns {Promise<Array|null>}  Array of shop objects, or null on failure.
 */
export async function fetchShops() {
  try {
    const url = `${SUPABASE_URL}/rest/v1/shops?verified=eq.true&select=*&order=featured.desc,name.asc`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('[supabase-data] Fetch failed:', res.status, res.statusText);
      return null;
    }

    const rows = await res.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    return rows.map(mapRow);
  } catch (err) {
    console.warn('[supabase-data] Network error:', err.message);
    return null;
  }
}
