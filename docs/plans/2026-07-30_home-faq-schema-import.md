# Home FAQ schema import repair

## Verified current behavior

- `src/pages/home.js` calls `injectFaqSchema(document, buildMethodologyFaqSchema(lang))` when the
  user switches language.
- Both helpers are exported by `src/seo/faq-schema.js`, but neither is imported by `home.js`.
- `npm run lint` fails with two `no-undef` errors at `src/pages/home.js:1918`.

## Problem and user impact

The homepage entry module has a broken lint gate and the language-switch path can fail at runtime
when it tries to refresh the FAQ JSON-LD. This can leave the active-language structured data stale
or prevent the switch handler from completing.

## Scope

- Import the existing FAQ schema helpers from `src/seo/faq-schema.js`.
- Add a handoff and tracker maintenance note.

## Non-goals

- No FAQ copy, schema shape, pricing, freshness, provider, workflow, dependency, or page-template
  changes.
- No change to the existing English/Arabic schema content.

## Risk classification

Low. One existing module import line is corrected; the runtime behavior already intended by the call
site is preserved.

## Test plan

- `npm run lint`
- `node --test --test-concurrency=1 tests/seo-runtime-helpers.test.js`
- `npm run validate`
- `npm run build`
- `npm test` for regression comparison, recording unrelated baseline failures separately.

## EN/AR, RTL, accessibility, pricing, and SEO implications

- EN/AR: no copy changes; the existing language-specific FAQ schema builder remains in use.
- RTL/accessibility: no visual or interaction markup changes.
- Pricing/trust: none.
- SEO: restores the existing intended active-language FAQ schema refresh; no schema content or
  canonical policy changes.

## Rollback plan

Revert the focused import and documentation commit. No generated data or production configuration is
affected.
