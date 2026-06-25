-- supabase/migrations/003_public_insert_hardening.sql
-- ============================================================================
-- Phase 7 (RED ZONE — STAGED, NOT APPLIED): harden public (anon) insert paths
-- ============================================================================
-- Public-insert RLS policies let the browser write directly with the anon key,
-- bypassing the Express rate limiters. These tables accept anon INSERTs:
--   shop_claims  (with check status='pending')
--   shop_leads   (with check status='new')
--   shop_click_events (with check true)   <- unconstrained
--   lead_submissions  (with check true)   <- unconstrained (extend below)
--   newsletter_subscribers (with check ...) (extend below)
--
-- This migration adds additive column-length CHECK constraints (anti-abuse) and
-- tightens the unconstrained shop_click_events insert policy to validate shape.
-- Limits are generous; applying validates existing rows (these tables are
-- low-volume). Review column lists for lead_submissions / newsletter_subscribers
-- and extend the same pattern before applying those (left as TODO to avoid
-- guessing columns not yet read).
--
-- ⚠️  DO NOT auto-apply. Review, then run manually (see OWNER_REVIEW.md):
--       psql "$SUPABASE_DB_URL" -f supabase/migrations/003_public_insert_hardening.sql
-- ============================================================================

begin;

-- shop_claims: anon submits a claim with contact details
alter table public.shop_claims
  add constraint shop_claims_name_len  check (char_length(claimant_name)  <= 120),
  add constraint shop_claims_email_len check (char_length(claimant_email) <= 200),
  add constraint shop_claims_phone_len check (claimant_phone is null or char_length(claimant_phone) <= 40),
  add constraint shop_claims_note_len  check (claim_note is null or char_length(claim_note) <= 2000);

-- shop_leads: anon submits a lead / inquiry
alter table public.shop_leads
  add constraint shop_leads_name_len    check (name is null or char_length(name) <= 120),
  add constraint shop_leads_email_len   check (email is null or char_length(email) <= 200),
  add constraint shop_leads_phone_len   check (phone is null or char_length(phone) <= 40),
  add constraint shop_leads_message_len check (message is null or char_length(message) <= 2000),
  add constraint shop_leads_source_len  check (source_path is null or char_length(source_path) <= 512);

-- shop_click_events: anon analytics beacon — was `with check (true)`
alter table public.shop_click_events
  add constraint shop_click_source_len check (source_path is null or char_length(source_path) <= 512),
  add constraint shop_click_ua_len     check (user_agent  is null or char_length(user_agent)  <= 512),
  add constraint shop_click_iphash_len check (ip_hash     is null or char_length(ip_hash)     <= 128);

drop policy if exists "Public insert shop click events" on public.shop_click_events;
create policy "Public insert shop click events"
  on public.shop_click_events for insert
  to anon, authenticated
  with check (
    char_length(coalesce(source_path, '')) <= 512
    and char_length(coalesce(user_agent, '')) <= 512
  );

commit;

-- TODO (owner): after reviewing columns, extend the same length-CHECK pattern to
--   public.lead_submissions and public.newsletter_subscribers, and consider
--   routing all public writes through a rate-limited server/Edge Function.
--
-- ROLLBACK:
--   alter table public.shop_claims  drop constraint if exists shop_claims_name_len, ...;
--   (drop each added constraint; restore the original "Public insert shop click
--    events" policy from supabase/schema.sql).
