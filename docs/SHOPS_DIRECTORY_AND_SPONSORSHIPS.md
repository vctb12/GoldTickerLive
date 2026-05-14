# Shops Directory, Sponsored Listings, and Leads (Phase 7 Foundation)

This document describes the Phase 7 foundation added to make the shops directory commercially useful
while preserving trust.

## What changed

- Added a Phase 7 shops business API under `/api/v1`:
  - `GET /api/v1/shops`
  - `GET /api/v1/shops/:slug`
  - `POST /api/v1/shops/:id/lead`
  - `POST /api/v1/shops/:id/claim`
  - `POST /api/v1/shops/:id/click`
- Added admin-protected shops business endpoints under `/api/v1/admin/shops` for:
  - moderation queue
  - leads inbox
  - claims inbox
  - click-events inbox
  - sponsored placement CRUD
  - listing verify/reject actions
- Added Supabase schema tables for Phase 7 business model:
  - `market_clusters`
  - `shop_listings`
  - `shop_claims`
  - `shop_leads`
  - `sponsored_placements`
  - `shop_verification_logs`
  - `shop_click_events`

## Data model intent

- `market_clusters` stores area-level market entities (souks / districts).
- `shop_listings` stores direct listings and references, with explicit `listing_type`:
  - `verified_shop`
  - `market_cluster`
  - `sponsor`
  - `pending_unverified`
- Verification metadata now includes:
  - `verified_at`
  - `verification_method`
  - `source`
  - `confidence`
  - `contact_completeness_score`

## Frontend changes

- Shops page now exposes tabs for:
  - Verified Shops
  - Gold Markets
  - Sponsored
- Trust/status badges now support:
  - Verified
  - Market Area
  - Contact Limited
  - Sponsored
- Sponsored disclosure is explicit and visible when the Sponsored tab is active.
- Added click and conversion tracking hooks for:
  - call
  - WhatsApp
  - website
  - directions
  - share
  - save
- Added claim-listing action flow from shop cards/modal.
- Added loading and fallback-error states for live directory upgrade.

## Submit-shop flow

- Submit-shop now reinforces moderation status after successful submission.
- Success state explicitly communicates `pending review` before publication.

## Safety and trust constraints

- No fake verification is implied.
- Market clusters remain distinct from direct shop profiles.
- Sponsored listings are labeled and disclosed.
- Static fallback remains intact when live data is unavailable.
