# Release Readiness Checklist

Use before merging any non-trivial PR. The full playbook is
[`docs/AI_RELEASE_READINESS_PLAYBOOK.md`](../../../../docs/AI_RELEASE_READINESS_PLAYBOOK.md).

```md
## Pre-merge gate
- [ ] `rm -rf playwright-report test-results`
- [ ] `npm install` clean
- [ ] `npm run lint` PASS
- [ ] `npm test` PASS (note: N tests)
- [ ] `npm run validate` PASS
- [ ] `npm run build` PASS
- [ ] `npm run quality` PASS (or justified)

## Manual smoke
- [ ] Homepage, Tracker, Calculator, Shops, Methodology load on mobile (360px)
- [ ] Same set at `dir="rtl"` (Arabic)
- [ ] Freshness label visible on every priced surface
- [ ] No console errors on any of the above

## Pricing / data
- [ ] AED peg = 3.6725 (unchanged)
- [ ] Karat factors unchanged (sourced from config)
- [ ] No reference price labelled as "shop rate"

## SEO
- [ ] `npm run seo:governance:check` PASS
- [ ] Canonical URLs use `goldtickerlive.com`
- [ ] Sitemap regenerated (build step ran)

## Security
- [ ] No secrets in diff
- [ ] No service-role key in browser bundle (`grep -r SUPABASE_SERVICE_ROLE_KEY dist/` empty)
- [ ] `npm audit` reviewed (HIGH/CRITICAL justified)

## Automation
- [ ] If workflow changed: dry-run dispatched and reviewed
- [ ] No breakage in `post_gold.yml` schedule

## PR body
- [ ] What / Why / How / Proof / Risks present
- [ ] Verification commands listed honestly (ran vs. assumed)
- [ ] Screenshots for visual changes (desktop + 360px, EN + AR where applicable)
```
