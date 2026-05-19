# Legacy `/Gold-Prices/` Compatibility

## Compatibility goal

Keep legacy `/Gold-Prices/*` request paths compatible while canonical URLs remain on
`https://goldtickerlive.com/`.

## Current handling

- Canonical utility normalizes legacy `/Gold-Prices/*` paths to canonical host-path format.
- Hreflang alternates are generated from canonical normalized paths.
- Runtime canonical enforcement does not remove legacy compatibility routes.

## QA checks

- [ ] Canonical URL always points to `https://goldtickerlive.com/...`.
- [ ] Legacy `/Gold-Prices/...` input path resolves to matching canonical path.
- [ ] `en`, `ar`, and `x-default` alternates are emitted for eligible pages.
