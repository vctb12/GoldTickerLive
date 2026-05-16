# Noindex Checklist

```md
- [ ] Identify whether the page should be indexed (real local content) or noindexed (thin / derivative)
- [ ] Per-karat city pages: noindex by default (governance enforces)
- [ ] Investment-return, invest-in-gold-gcc, content/social: noindex
- [ ] Adding a noindex page: add it to the allowlist in `scripts/node/seo-governance.js`
- [ ] `<meta name="robots" content="noindex,follow">` present on noindexed pages
- [ ] Noindexed page excluded from sitemap (generator handles this; verify)
- [ ] Noindexed page does NOT have `<link rel=canonical>` pointing to itself in a way that confuses Google
- [ ] `npm run seo:governance:check` PASS
- [ ] If un-noindexing a page: confirm it has real content + sitemap entry + internal links
```
