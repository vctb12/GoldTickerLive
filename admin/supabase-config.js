/**
 * admin/supabase-config.js
 *
 * ⚠️  Update these values with your Supabase project credentials.
 *     Find them in: Supabase Dashboard → Settings → API
 *
 *     SUPABASE_URL      – https://nebdpxjazlnsrfmlpgeq.supabase.co
 *     SUPABASE_ANON_KEY – (see Supabase Dashboard → Settings → API → "anon public" key)
 *     ALLOWED_EMAIL     – (set to the GitHub email authorised to access the admin panel)
 *
 *     The anon key is designed to be used in client-side code (gated by RLS).
 *     ALLOWED_EMAIL controls which GitHub OAuth user can access the admin panel.
 *
 *     SECURITY NOTE: ALLOWED_EMAIL is a client-side hint only. Actual authorization
 *     must be enforced server-side via Supabase RLS policies. Do not rely solely
 *     on this value for access control — a malicious client can bypass it.
 */

export const SUPABASE_URL = 'https://nebdpxjazlnsrfmlpgeq.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lYmRweGphemxuc3JmbWxwZ2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODcxOTAsImV4cCI6MjA5MTQ2MzE5MH0.HjvExHRdsBqbWXyxw3V62w86Lnegi3synHR0IjbDnNA';
export const ALLOWED_EMAIL = 'vctb12@gmail.com';
