/**
 * lib/supabase-data.js
 *
 * Fetches live shop directory data from Supabase for the public shops page.
 * Uses the Supabase REST API directly (PostgREST) — no SDK required in the
 * browser bundle.
 *
 * Queries only the canonical `shop_listings` table (status=eq.active), whose RLS
 * policy restricts anonymous reads to active listings (see supabase/schema.sql).
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
  const listingType =
    row.listing_type || (row.sponsored ? 'sponsor' : row.verified ? 'verified_shop' : null);
  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    countryCode: row.country_code || '',
    city: row.city || '',
    market: row.market || '',
    category: row.category || '',
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    phone: row.phone || '',
    email: row.email || '',
    website: row.website || '',
    detailsAvailability: row.details_availability || 'limited',
    featured: Boolean(row.featured),
    verified: Boolean(row.verified),
    sponsored: Boolean(row.sponsored),
    listingType,
    listing_type: listingType,
    confidence: Number.isFinite(Number(row.confidence)) ? Number(row.confidence) : undefined,
    verified_at: row.verified_at || null,
    verification_method: row.verification_method || null,
    source: row.source || 'supabase',
    contact_completeness_score: Number.isFinite(Number(row.contact_completeness_score))
      ? Number(row.contact_completeness_score)
      : undefined,
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
    // Query ONLY the canonical `shop_listings` table (supabase/schema.sql). The
    // legacy `shops` table was removed as a fallback candidate on purpose: its
    // columns (country, is_verified, confidence_score) do not match mapRow's
    // expectations (country_code, verified, confidence), so mapping its rows
    // silently downgraded the curated data/shops.js directory to sparse,
    // mis-grouped cards (empty countryCode → wrong country grouping).
    //
    // `shop_listings` is currently not deployed (REST returns 404 PGRST205
    // "Could not find the table 'public.shop_listings'"). On any non-ok / empty
    // response fetchShops returns null and the caller keeps the curated local
    // directory — never a blank page. When the table is deployed with the
    // canonical schema, the live upgrade resumes automatically. Only the public
    // anon key is used (RLS-protected); no service-role key in browser code.
    const url = `${SUPABASE_URL}/rest/v1/shop_listings?status=eq.active&select=*&order=sponsored.desc,featured.desc,name.asc`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(
        `[supabase-data] shop_listings fetch failed (HTTP ${res.status}); keeping local directory`
      );
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
