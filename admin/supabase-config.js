/**
 * admin/supabase-config.js
 *
 * ⚠️  Update these values with your Supabase project credentials.
 *     Find them in: Supabase Dashboard → Settings → API
 *
 *     SUPABASE_URL      – https://nebdpxjazlnsrfmlpgeq.supabase.co
 *     SUPABASE_ANON_KEY – eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lYmRweGphemxuc3JmbWxwZ2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODcxOTAsImV4cCI6MjA5MTQ2MzE5MH0.HjvExHRdsBqbWXyxw3V62w86Lnegi3synHR0IjbDnNA
 *     ALLOWED_EMAIL     – vctb12@gmail.com
 *
 *     You already have SUPABASE_URL as a GitHub secret.
 *     The anon key is in: Supabase Dashboard → Settings → API → "anon public" key.
 */

export const SUPABASE_URL = 'https://nebdpxjazlnsrfmlpgeq.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lYmRweGphemxuc3JmbWxwZ2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODcxOTAsImV4cCI6MjA5MTQ2MzE5MH0.HjvExHRdsBqbWXyxw3V62w86Lnegi3synHR0IjbDnNA';
export const ALLOWED_EMAIL = 'vctb12@gmail.com';

/**
 * ADMIN_ACCESS_PIN — 6-digit PIN for the /admin/access/ quick-access page.
 * Set to null or '' to disable PIN access and redirect straight to GitHub OAuth.
 * Change this to any 6-digit string you prefer.
 */
export const ADMIN_ACCESS_PIN = '240600';
