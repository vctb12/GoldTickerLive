# Freshness Contract

## Canonical states

- `live`
- `cached`
- `delayed`
- `estimated`
- `fallback`
- `closed`

The user-visible label layer (`getLiveFreshness` / `getFXFreshness` in `src/lib/live-status.js`)
additionally emits two age/availability states that carry the cautionary (`fallback`-tone) styling:

- `stale` — data older than the stale threshold (gold: 75 min; FX: 26 h).
- `unavailable` — timestamp missing or unparseable.

## Mandatory UI disclosure

Every freshness-capable block must show:

1. State label
2. Source label
3. UTC timestamp

## Trust invariants

- Reference estimates are never shown as retail shop quotes.
- If market is closed, state must be `closed` even with recent data.
- Cached/fallback states must remain visible and never be restyled as live.
- AED conversion default remains `1 USD = 3.6725 AED`.

## Surfaces covered

- Homepage hero trust addons
- Tracker hero trust addons + education panels
- Calculator trust addons
