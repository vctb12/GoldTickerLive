# Project Memory

- Users care a lot about trust wording.
- Avoid generic “AI-looking” page layouts.
- Do not overbuild. Small reliable improvements beat broad rewrites.
- Tracker and shops pages are high priority.
- Country/city pages need strong SEO and internal linking.
- Any fallback/estimated data must be clearly labeled.
- When reviewing code, inspect relevant files before proposing architecture changes.
- Always separate review, plan, debug, and build modes.
- `buildFilters()` on the shops page already validates each dropdown value and resets invalid ones
  to `'all'` — lean on that safety net rather than duplicating validation upstream.
