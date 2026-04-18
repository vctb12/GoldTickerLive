## Summary

Describe the purpose of this PR and the high-level changes.

## Implementation notes

- Phase commits are grouped and labeled `phx/NN:` where `NN` is the phase number.
- Include link-check, smoke tests, and server fallback changes.

## Checklist
- [ ] Run `npm ci` and `npm run quality`
- [ ] Run `npm run build` and `node scripts/node/check-links.js --dir dist`
- [ ] Playwright smoke tests: `npm run test:playwright`
