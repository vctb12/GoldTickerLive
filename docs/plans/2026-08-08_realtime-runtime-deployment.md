# Realtime price runtime deployment

## Objective

Keep GitHub Pages as the static frontend, and run the existing Express pricing service as a
long-lived public runtime. The browser uses the runtime when `VITE_API_BASE_URL` is configured and
falls back to the committed JSON/cache path when it is unavailable.

## Runtime contract

- Public origin: `https://api.goldtickerlive.com` after the owner completes the external setup.
- REST probe: `GET /api/v1/prices/live`.
- Streaming path: `GET /api/v1/prices/stream` using named SSE `price` events.
- GitHub Pages build variable: repository variable `VITE_API_BASE_URL`.
- Runtime fallback order: SSE -> runtime REST/provider poll -> last verified runtime snapshot ->
  static `/data/gold_price.json` -> local cache.
- Provider order remains the existing server chain: gold-api.com, GoldAPI.io, Twelve Data, FMP, then
  Minted Metal. This change does not add ten new providers or expose provider credentials.

## Safety invariants

- Provider keys remain server-side environment variables; only the public API origin is embedded in
  the Vite bundle.
- The existing AED peg, troy-ounce constant, karat factors, and reference-price disclaimer remain
  unchanged.
- Static snapshots are re-evaluated against their current age at runtime; a stale file cannot keep
  an `isFresh: true` label merely because it was fresh when fetched.
- REST and SSE responses expose source, timestamp, and freshness state.
- GitHub Pages remains usable if the runtime is down.

## External setup required after this PR

1. In Render, create a Web Service from `vctb12/GoldTickerLive`, branch `main`, using the committed
   `render.yaml`. Choose a non-sleeping plan for production SSE; the manifest intentionally leaves
   plan selection and domain attachment to the owner.
2. Add these Render environment variables without committing values: `JWT_SECRET`, `ADMIN_PASSWORD`,
   `ADMIN_ACCESS_PIN`, and `API_KEY_HASH_SALT`. Use a unique random value for each secret. Add
   `GOLDAPI_IO_KEY`, `TWELVEDATA_API_KEY`, and `FMP_API_KEY` only when those optional providers are
   enabled.
3. Add the custom domain `api.goldtickerlive.com` in Render, then create the DNS record Render
   provides. Keep `CORS_ORIGINS` exactly limited to the production site origins in `render.yaml`.
4. Wait for the health check to pass at `/api/v1/health`.
5. Add the GitHub repository variable `VITE_API_BASE_URL` with value
   `https://api.goldtickerlive.com`. Optionally set `VITE_API_BACKEND_ENABLED=true`; the base URL
   itself enables the runtime path.
6. Run the Pages workflow once after adding the repository variable. This embeds the public runtime
   origin in the frontend; later price changes do not require a Pages deploy.

## Acceptance checks

- `GET https://api.goldtickerlive.com/api/v1/health` returns 200.
- `GET https://api.goldtickerlive.com/api/v1/prices/live` returns 200 with `ok: true`, a numeric
  `data.xauUsdPerOz`, source, timestamp, and `meta.freshness`.
- An EventSource connection to `/api/v1/prices/stream` receives `event: price` and two successive
  timestamped events without a page refresh.
- The Pages browser receives the runtime quote, updates the homepage and tracker surfaces, and
  continues to show an honest fallback label if the runtime is stopped.
