# Realtime Architecture (GitHub-native production design)

> Purpose: describe the **target** realtime architecture, the **path** from today's hourly-cron
> pipeline to it, and — crucially — the reasons each piece is staged carefully on a
> public-production site rather than landed in one giant PR. This document is normative for future
> PRs.

Status: **implemented** in the GitHub-native realtime correction. GitHub Pages is static; the
browser live manager supplies near-realtime updates and GitHub Actions supplies validated recovery
snapshots and diagnostics.

---

## 1. Production path

The current production flow is: GitHub Pages serves static assets; the shared browser manager
fetches the documented no-secret Gold API directly every five seconds in a visible leader tab;
BroadcastChannel shares accepted quotes with sibling tabs; and GitHub Actions fetches the
secret-backed provider pool every five minutes to validate and commit the emergency snapshot. The
diagram below is retained as historical lineage from the pre-correction static path; its Express
node is optional local/self-hosted tooling, not a Pages dependency.

```
┌────────────────────────┐
│ gold-api.com           │  hourly call via GitHub Actions cron
└──────────┬─────────────┘
           ▼
┌────────────────────────┐
│ data/gold_price.json   │  static JSON committed to main with rich
│  + is_fresh            │  truth metadata
│  + is_fallback         │
└──────────┬─────────────┘
           ▼
┌────────────────────────┐
│ /api/v1/prices/latest  │  Express, reads Supabase → file fallback
└──────────┬─────────────┘
           ▼
┌────────────────────────┐
│ src/lib/api.js         │  fetchGold() — now pipes isFresh, isFallback,
│ normalizeGoldResponse  │  freshnessSeconds, sourceTimestamp through
└──────────┬─────────────┘
           ▼
┌────────────────────────┐
│ src/lib/live-status.js │  getLiveFreshness() — single source of
│                        │  truth; six explicit buckets with anti-
│                        │  mislabel guards (live | delayed | cached |
│                        │  stale | fallback | unavailable)
└────────────────────────┘
           │
           ▼  (90 s poll)
   Client UI surfaces
   (hero, tracker, ticker, country, footer)
```

**Truth invariant** (enforced in tests):

> `getLiveFreshness()` returns `'live'` **iff** `updatedAt` is present **and**
> `ageMs ≤ DELAYED_AFTER_MS` **and** `hasLiveFailure === false` **and** `isFallback !== true`
> **and** `isFresh !== false`. Any single violation degrades the bucket. There is no other path to
> "Live" anywhere in the UI.

## 2. Historical hosted-SSE proposal (not production)

The remainder of this section is retained as historical design context only. It is not a production
dependency, is not deployed by GitHub Pages, and must not be revived as an assumption in frontend
code. GitHub Actions schedules are not a second-level push transport; Express/SSE is optional
local/self-hosted tooling only.

```
┌────────────────────────┐
│ gold-api.com  (paid)   │  or alternate provider with higher cadence
└──────────┬─────────────┘
           │  polled by a long-lived server worker (1–5 s)
           ▼
┌────────────────────────┐
│ Backend ingest worker  │  Node persistent process; normalizes events,
│  - sequenceId++        │  attaches sourceTimestamp + ingestTimestamp +
│  - server timestamp    │  publishTimestamp + monotonic sequenceId
│  - source timestamp    │
│  - is_fallback flag    │
└──────────┬─────────────┘
           ▼
┌────────────────────────┐
│ /api/v1/prices/stream  │  Server-Sent Events (text/event-stream).
│   event: price         │  Heartbeat every 15 s. JSON payload mirrors
│   data: { … }          │  the REST /prices/latest envelope so the
│                        │  freshness engine input shape is unchanged.
└──────────┬─────────────┘
           ▼  (push)
┌────────────────────────┐
│ Client EventSource     │  with reconnect (exp backoff + jitter),
│  subscriber            │  liveness watchdog, and short-poll fallback
│                        │  to /prices/latest when EventSource fails.
└──────────┬─────────────┘
           ▼
   getLiveFreshness()        — unchanged, no anti-mislabel rules relaxed
           │
           ▼
   Client UI surfaces        — copy switches from
                              "Updated 2 min ago" → "Streaming live"
```

## 3. Historical transport comparison (not a production decision)

For one-way price push, SSE is materially simpler and equally fast:

- **One-way** is sufficient — clients do not send price events.
- **HTTP/1.1 keep-alive** works through every existing proxy / CDN edge.
- **Native browser reconnect** with `Last-Event-Id` semantics.
- **No new dependency**; Express + `res.write()` is sufficient.
- **Falls back trivially** to short polling on the same `/prices/latest` REST route already in
  production.

WebSocket only wins for bidirectional channels (admin commands, chat, collaborative cursors), none
of which apply here.

## 4. Why the historical transport was not enabled

Three reasons aligned with `AGENTS.md` non-negotiable rules:

1. **Production safety.** `server.js` ships with bcrypt + Helmet + rate limiting. Adding a
   long-lived SSE endpoint requires reviewing helmet's `crossOriginEmbedderPolicy`, rate-limiter
   exclusions for streaming connections, and connection-cap exhaustion. None of that is a small
   diff.
2. **No regression of the truth contract.** The freshness engine in this PR is the contract every UI
   surface depends on. Landing it standalone means SSE can be added later without risk of the truth
   engine being shaped around transport convenience.
3. **Provider cost / approval.** A 1–5 s upstream poll requires a paid tier (or a different
   provider). That is a business decision that belongs in a separate proposal in `docs/plans/`.

The freshness engine in this PR is **forward-compatible** with the SSE upgrade: the client function
signature stays the same; events from SSE land in `state.live` exactly the way today's polled
responses do.

## 5. Historical event schema (reference only)

Each SSE event MUST carry:

| Field                 | Type     | Purpose                                                                              |
| --------------------- | -------- | ------------------------------------------------------------------------------------ |
| `sequenceId`          | integer  | Monotonic per-stream. Clients drop out-of-order / duplicate events.                  |
| `serverTimestamp`     | ISO-8601 | When the server published the event.                                                 |
| `sourceTimestamp`     | ISO-8601 | Provider's own timestamp for the price.                                              |
| `ingestTimestamp`     | ISO-8601 | When the backend received it from the provider.                                      |
| `xauUsdPerOz`         | number   | Spot price.                                                                          |
| `isFresh`             | boolean  | Upstream `is_fresh` flag.                                                            |
| `isFallback`          | boolean  | Upstream `is_fallback` flag. **Honored by `getLiveFreshness()` as a hard override.** |
| `freshnessSeconds`    | integer  | Age at ingest from provider's own clock.                                             |
| `maxFreshnessSeconds` | integer  | Provider's freshness budget.                                                         |
| `provider`            | string   | Source identifier for logs / observability.                                          |

Heartbeats are SSE comment lines (`: heartbeat\n\n`) every 15 s; they do not appear as events but
reset the client's liveness watchdog.

## 6. Historical failure modes & fallbacks (reference only)

| Failure                         | Detection                          | Client behavior                                                                                                      |
| ------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Transient network loss          | `EventSource.onerror`              | Exponential backoff reconnect (1 s, 2 s, 4 s, 8 s, max 30 s) with jitter ±25%; switch to short polling at 5 retries. |
| Provider returns fallback       | `isFallback: true` in event        | `getLiveFreshness()` returns `'fallback'`; UI shows "Fallback · last update Xm ago".                                 |
| Server crash / restart          | Missed heartbeats × 3              | Reconnect; on resume, REST `/prices/latest` to bridge any gap.                                                       |
| Out-of-order or duplicate event | `sequenceId` ≤ last seen           | Drop event; keep current state.                                                                                      |
| Clock skew                      | `serverTimestamp` vs. `Date.now()` | Use server timestamp for age; never blend with `Date.now()` arithmetic on the wire.                                  |
| Memory leak in subscription     | Page unload / `pagehide` event     | `eventSource.close()`; clear backoff timer; remove all listeners.                                                    |

## 7. Superseded rollout plan

| Phase                 | Deliverable                                                                | Status     |
| --------------------- | -------------------------------------------------------------------------- | ---------- |
| Phase 0               | `docs/realtime-baseline-audit.md`                                          | ✅ this PR |
| Phase 2 (freshness)   | Truth engine, anti-mislabel guards, EN/AR parity, tests                    | ✅ this PR |
| Phase 1.a (transport) | Backend ingest worker behind feature flag `REALTIME_INGEST_WORKER_ENABLED` | future PR  |
| Phase 1.b (SSE)       | `/api/v1/prices/stream` endpoint; helmet review; rate-limit exemption      | future PR  |
| Phase 1.c (client)    | `EventSource` subscriber with short-poll fallback                          | future PR  |
| Phase 3               | Adaptive polling, circuit breaker, time-drift guard                        | future PR  |
| Phase 6               | Metrics endpoint, structured logs, alerts (see ops runbook)                | future PR  |

Each future PR follows `AGENTS.md` non-negotiable rules: freshness labels stay truthful, AED peg
stays at 3.6725, EN/AR parity is preserved, no "Live" without all preconditions met.

## 8. Hard production boundaries

- **No SPA migration.** This stays a static multi-page site.
- **No paid hosting or paid provider is required for production.** Provider credentials stay in
  Actions secrets; no key is exposed to Pages.
- **No Pages SSE assumption.** The browser uses direct no-secret provider polling plus static
  fallback; `/api/v1/prices/stream` is not a Pages endpoint.
- **No removal of the polling fallback.** The static snapshot and local cache remain safety nets.
- **No "Live" pill without truth preconditions.** Ever.
