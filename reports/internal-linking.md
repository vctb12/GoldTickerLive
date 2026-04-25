# Internal linking audit — 2026-04-25

## Scope

- Static HTML pages in the repository, excluding generated `dist/`, dependencies, and admin
  internals.
- Internal `<a href>` links only; external, mail, phone, and fragment-only links are ignored.

## Current findings

- Core hub pages already receive strong global navigation coverage: home, tracker, calculator,
  shops, countries, tools, learn, and methodology.
- The lowest-inbound public editorial/transactional page observed in this pass is
  `content/submit-shop/index.html`, which is reachable from the More navigation group but has
  limited contextual in-page links.
- System placeholder indexes under `src/`, `server/`, `docs/`, `scripts/`, `config/`, `styles/`,
  `supabase/`, and `data/` appear as zero-inbound pages in a raw crawl but are not public SEO
  targets.

## Recommended fix slices

1. Add contextual links to `content/submit-shop/` from shops-directory empty states and shop trust
   copy.
2. Add country → city and city → market contextual links in generated country templates.
3. Add tracker → calculator → methodology links around reference-price explanations.
4. Keep these editorial links in page content; do not create a footer link farm.

## Guardrails

- Do not change canonical URL structure.
- Do not add duplicate navigation-only links solely to inflate crawl depth.
- Keep spot/reference vs. retail labels visible near any price-related links.
