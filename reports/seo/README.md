# `reports/seo/`

Generated SEO-surface inventory artefacts. **Read-only / descriptive.** Not a gate.

## What's in here

- **`inventory.json`** — one record per public HTML file capturing canonical, og:\*, twitter:\*,
  hreflang, JSON-LD `@type`, and robots meta. Produced by
  [`scripts/node/inventory-seo.js`](../../scripts/node/inventory-seo.js).

## How to regenerate

```bash
node scripts/node/inventory-seo.js            # rewrite inventory.json
node scripts/node/inventory-seo.js --check    # exit 1 if committed file is stale
node scripts/node/inventory-seo.js --stdout   # print JSON without writing
```

`--check` ignores the `generatedAtDate` field so re-running on a different day does not fail the
gate — only value drift does.

## Why it's committed

Every future SEO-affecting PR carries a visible diff of what changed across the entire site. This
closes the "silent canonical change" risk called out in [`AGENTS.md` §6.4](../../AGENTS.md) by
making the state machine-readable.

## What this file is **not**

- It's not a lint rule. Gate logic lives in
  [`scripts/node/check-seo-meta.js`](../../scripts/node/check-seo-meta.js).
- It's not a judgement of whether values are "good." It records them as-is.
- It's not authoritative for what canonicals _should_ be. The sitewide test in
  [`tests/seo-sitewide.test.js`](../../tests/seo-sitewide.test.js) owns that.

## Plan reference

[`docs/plans/2026-04-23_seo-surface-inventory.md`](../../docs/plans/2026-04-23_seo-surface-inventory.md)
