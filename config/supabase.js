/**
 * config/supabase.js
 *
 * Shared Supabase configuration for public-facing pages.
 * The anon key is designed to be safe in client-side code — Row Level Security
 * (RLS) on the Supabase side controls what anonymous users can read/write.
 *
 * Admin pages use admin/supabase-config.js which also exports ALLOWED_EMAIL.
 */

export const SUPABASE_URL      = 'https://nebdpxjazlnsrfmlpgeq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lYmRweGphemxuc3JmbWxwZ2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODcxOTAsImV4cCI6MjA5MTQ2MzE5MH0.HjvExHRdsBqbWXyxw3V62w86Lnegi3synHR0IjbDnNA';
