# GitHub-native realtime pricing correction

## Incident and #729 audit

PR #729 was already merged at the base of this corrective branch. Its changes fall into four groups:

| Classification   | #729 material                                                                                                        | Decision                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Keep             | timestamp-age recomputation, normalized quote fields, timeout utilities, Express route/service tests                 | Keep as generic or optional tooling.                                                                                            |
| Adapt            | frontend provider chain, canonical snapshot application, freshness metadata                                          | Move production ownership into `live-price-manager.js`; every accepted browser quote now feeds the canonical homepage snapshot. |
| Development only | `server.js`, REST/SSE route, runtime price service, backend adapter                                                  | Retain for localhost/self-hosted testing; Pages never probes or requires them.                                                  |
| Remove           | `render.yaml`, Render deployment plan, public `VITE_API_BASE_URL`, `VITE_API_BACKEND_ENABLED`, Pages SSE expectation | Removed from production configuration and deployment workflow.                                                                  |

## Production architecture

GitHub Pages serves the static application. `src/lib/live-price-manager.js` owns one shared browser
poller, provider validation, freshness, failover, circuit breakers, outlier checks, LKG persistence,
visibility, online/offline recovery, and BroadcastChannel leadership. Homepage and Tracker subscribe
to that manager rather than creating independent polling loops.

The browser-live tier intentionally integrates only the documented no-secret `gold-api.com`
endpoint. The committed JSON and last-gold-price file are recovery paths, never browser-live paths.
A second browser provider was not invented just to satisfy a provider count: a provider is eligible
for this tier only when its official documentation confirms HTTPS, CORS, gold/XAU data, direct-site
usage, and no exposed credential.

The Actions tier fetches all configured server-side providers, records sanitized diagnostics,
rejects invalid/stale/outlier values, selects a median/MAD consensus when at least two inliers
agree, and records `single_provider` explicitly when only one fresh source is available. Three
consecutive failures open a provider circuit for 30 minutes; a later request probes it for automatic
failback.

## Official provider research

| Provider                                                                         |                     XAU | Browser CORS                   | Auth             | Browser decision                                      | Actions decision         |
| -------------------------------------------------------------------------------- | ----------------------: | ------------------------------ | ---------------- | ----------------------------------------------------- | ------------------------ |
| [Gold API](https://gold-api.com/docs)                                            |                     Yes | Documented enabled             | None             | Primary browser-live; 5-second responsible poll       | Optional corroboration   |
| [GoldAPI.io](https://www.goldapi.io/)                                            |                     Yes | Not used for client            | `x-access-token` | Reject: secret required                               | Integrated adapter       |
| [Metals-API](https://www.metals-api.com/documentation)                           |                     Yes | Supports CORS but key required | `access_key`     | Reject: secret required and plan freshness varies     | Integrated adapter       |
| [Metals.Dev](https://metals.dev/docs)                                            |                     Yes | Documented enabled             | API key          | Reject: secret required                               | Integrated adapter       |
| [MetalpriceAPI](https://metalpriceapi.com/documentation)                         |                     Yes | Key required                   | API key          | Reject: secret required                               | Integrated adapter       |
| [Twelve Data](https://twelvedata.com/docs/introduction/quickstart)               |                 XAU/USD | Key required                   | API key          | Reject: secret required                               | Existing adapter         |
| [Financial Modeling Prep](https://site.financialmodelingprep.com/developer/docs) | GCUSD/futures reference | Key required                   | API key          | Reject: secret required and futures are not spot      | Existing adapter         |
| [Alpha Vantage](https://www.alphavantage.co/documentation/)                      |      Gold spot function | Key required                   | API key          | Reject: secret required                               | Integrated adapter       |
| [GoldPriceZ](https://goldpricez.com/about/api)                                   |                     Yes | Key required                   | `X-API-KEY`      | Reject: official docs advise server-side key handling | Existing adapter         |
| [goldprice.dev](https://goldprice.dev/docs/quickstart)                           |                 XAU/USD | Bearer key                     | API key          | Reject: secret required                               | Research only            |
| [FreeGoldAPI](https://freegoldapi.com/)                                          |         Historical gold | CORS/keyless                   | None             | Reject as live: documented daily update               | QA/shadow reference only |
| [FreeGoldPrice](https://freegoldprice.org/documentations)                        |                     Yes | API key required               | API key          | Reject: secret required                               | Research only            |

The Actions workflow therefore has more than ten named independent paths in its provider registry,
but only configured providers can produce a valid quote. Missing credentials are reported as a
sanitized `missing_api_key` diagnostic rather than being logged or treated as a success.

## Freshness contract

Provider market timestamp and browser retrieval time are kept separately. The browser recalculates
age from the provider timestamp on every restore, broadcast, and render. Persisted `isFresh: true`
is not trusted. The UI remains conservative: browser-live is eligible only within the live policy;
static, cached, fallback, delayed, and stale values retain their existing explicit labels.

## Service-worker and deployment independence

External live provider requests bypass the service worker. Static price files use network-first with
offline cache fallback. A newer network response replaces the cache; if the cache is returned
offline, the live manager recomputes its age and labels it as fallback. The static Playwright test
blocks service workers and proves the built Pages application changes its displayed price from two
direct browser responses without a new deployment.

## Verification targets

- `npm run lint`, `npm test`, `npm run validate`, and `npm run build`.
- Production artifact secret scan after build.
- Python consensus/outlier unit tests and provider registry import tests.
- Static Playwright test with the browser-live endpoint routed to controlled responses.
- Production health workflow every five minutes with a single deduplicated P0 issue and sanitized
  artifact report.

## Known limitations

GitHub Pages and scheduled Actions cannot provide a second-level server push channel. Browser-live
updates depend on the provider's current availability, CORS behavior, and documented terms. When it
fails, the site stays useful with explicit fallback states; Actions provides the stronger static
recovery snapshot on its five-minute schedule, not a fake seconds-level server transport.
