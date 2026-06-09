---
mode: agent
description: T0.3 — Document secret scanning + push protection; owner enables in GitHub Settings.
related_instructions:
  - AGENTS.md
  - docs/environment-variables.md
  - docs/plans/2026-06-09_platform-upgrade-program.md
---

# T0.3 — Secret scanning + push protection

## Goal

Document how to enable GitHub **secret scanning** and **push protection** for this repo. Owner enables in Settings; you write the runbook.

## Deliverables

1. **`docs/SECURITY.md`** (new) or extend `docs/environment-variables.md` with:
   - Enable steps (Settings → Code security)
   - Secret **names** only (never values): `GOLD_API_COM_KEY`, `GOLDPRICEZ_API_KEY`, `TWELVEDATA_*`, `FMP_*`, `CONSUMER_KEY`, `CONSUMER_SECRET`, `ACCESS_TOKEN`, `ACCESS_TOKEN_SECRET`, `SUPABASE_*`, `TELEGRAM_*`, `DISCORD_WEBHOOK_URL`, etc.
   - What to do when push protection blocks a commit
   - Link: https://docs.github.com/en/code-security/secret-scanning

2. Short update to `docs/CURSOR_HANDOVER.md` §2 pointing to the doc.

## Out of scope

- Echoing secret values
- Changing workflow secrets
- Adding secrets to any file in git

## Verify

Markdown links valid; `npm run lint` if you touch JS. Mark T0.3 ✅ in upgrade program + `PLAN.md`.
