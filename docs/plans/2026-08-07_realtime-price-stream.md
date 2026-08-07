# Real-time price stream

## What this delivers

Move the live quote path off the static GitHub Pages snapshot. A server-side worker keeps provider
credentials private, tries the configured provider chain, and publishes the latest validated quote
over Server-Sent Events (SSE). Browsers reconnect automatically and retain the existing
snapshot/polling fallback.

## Guardrails

- A provider quote must include a valid provider timestamp and pass the existing sanity range.
- Stale or fallback quotes remain labelled honestly; they never become `live` by transport alone.
- Existing AED peg, karat factors, and price formulas are unchanged.
- No new npm dependency is required; Node 24 provides `fetch` and `AbortController`.
- Providers are configured through server environment variables. No API key ships to browser code.

## Rollout

1. Add the server-side quote worker and `/api/v1/prices/stream` SSE route.
2. Add the client EventSource subscriber with REST/provider polling fallback.
3. Deploy the Express service with the live-provider secrets and set the frontend backend flag.
4. Verify source timestamps, provider failover, reconnect behavior, and stale labelling before
   enabling the live stream for production traffic.

## Provider policy

The first implementation uses adapters already present and documented in this repository:
`gold_api_com`, `goldapi_io`, `twelvedata_xauusd`, `fmp_gcusd`, and `minted_metal`. Additional
providers require a separate smoke test, quota review, and source-licensing review; adding ten
unverified endpoints would make the price chain less trustworthy rather than more reliable.
