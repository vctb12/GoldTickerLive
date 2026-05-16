# Canonical Checklist

```md
- [ ] Every indexable page has `<link rel="canonical" href="https://goldtickerlive.com/<path>">`
- [ ] `<meta property="og:url">` matches canonical exactly
- [ ] No `vctb12.github.io` in any canonical, og:url, or twitter:url
- [ ] Hreflang pairs present for any page with an EN/AR equivalent
- [ ] Hreflang includes `x-default`
- [ ] No two pages claim the same canonical (would split signals)
- [ ] Pagination uses `rel="next"` / `rel="prev"` (or canonical to page 1) — consistent across the site
- [ ] Tracking parameters stripped from canonical (`?utm_*`, `?ref=`, etc.)
```
