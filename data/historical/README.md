# Historical daily XAU/USD data

`xau-usd-daily.json` in this directory is **generated** — do not hand-edit.

| Field | Value |
| --- | --- |
| Provider | [gold-api.com](https://gold-api.com/) history endpoint |
| Refresh | `.github/workflows/historical-gold-refresh.yml` (daily ~02:45 UTC) |
| Secret | `GOLD_API_KEY` (fallback: `GOLD_API_COM_KEY`) |
| Consumer | Homepage UAE historical karat chart (`src/lib/uae-historical-source.js`) |

Regenerate locally (requires API key in env, never commit the key):

```bash
export GOLD_API_KEY=...   # or GOLD_API_COM_KEY
node scripts/node/fetch-gold-api-history.mjs
node scripts/node/fetch-gold-api-history.mjs --check
```

Validation thresholds live in `src/lib/gold-api-daily-history-contract.js`.
