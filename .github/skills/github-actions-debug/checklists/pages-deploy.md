# Pages Deploy Checklist

```md
- [ ] `deploy.yml` ran on the latest `main` commit
- [ ] Build step produced `dist/` with expected files (`index.html`, `sitemap.xml`, hashed assets)
- [ ] Sitemap regenerated (not the prior commit's)
- [ ] Service worker version bumped if cache strategy / assets changed
- [ ] `CNAME` file present in `dist/` (otherwise custom domain breaks)
- [ ] `404.html` present and styled
- [ ] No `localhost:3000` URLs in shipped HTML/JS
- [ ] Browser test: `https://goldtickerlive.com/` loads, freshness label visible
- [ ] Browser test: legacy `https://vctb12.github.io/Gold-Prices/` either redirects or shows
      canonical pointer
- [ ] Service worker installed and activated (DevTools → Application)
- [ ] No console errors on Homepage / Tracker / Calculator
```
