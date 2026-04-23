# Tracker URL-hash contract (`tracker.html`)

> **Status:** Frozen under §22b Phase 7 (2026-04-23). Changes to this schema require a
> `REVAMP_PLAN.md` §22b entry and round-trip tests in
> [`tests/tracker-hash.test.js`](../tests/tracker-hash.test.js).

The Tracker Pro workspace state is serialized into `location.hash` as an
application/x-www-form-urlencoded parameter string (the hash string passed to `parseHash` is stored
without the leading `#` character; the browser URL bar still displays it). This lets any tracker
state be deep-linked, bookmarked, and shared. The contract is implemented in
[`src/tracker/state.js`](../src/tracker/state.js).

## Canonical form

```
tracker.html#mode=<mode>&cur=<CUR>&k=<K>&u=<unit>&r=<range>&cmp=<CUR>&lang=<en|ar>[&panel=<panel>]
```

Example:

```
tracker.html#mode=live&cur=AED&k=24&u=gram&r=30D&cmp=USD&lang=en
tracker.html#mode=live&panel=alerts&cur=AED&k=24&u=gram&r=30D&cmp=USD&lang=en
```

## Parameter schema

| Key     | Required | Values                                                | Source of truth                                                                       |
| ------- | -------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `mode`  | yes      | `live` · `compare` · `archive` · `exports` · `method` | [`VALID_MODES`](../src/tracker/state.js) (`Set`)                                      |
| `cur`   | yes      | 3-letter currency (e.g. `AED`, `USD`, `SAR`)          | [`src/config/countries.js`](../src/config/countries.js) `currency` values             |
| `k`     | yes      | `24` · `22` · `21` · `20` · `18` · `16` · `14`        | [`src/config/karats.js`](../src/config/karats.js)                                     |
| `u`     | yes      | `gram` · `oz` · `tola`                                | Tracker unit selector (`#tp-unit`)                                                    |
| `r`     | yes      | `7D` · `30D` · `90D` · `1Y` · `5Y`                    | Range selector in `src/tracker/ui-shell.js`                                           |
| `cmp`   | yes      | 3-letter currency (independent of `cur`)              | Compare-mode secondary currency                                                       |
| `lang`  | yes      | `en` · `ar`                                           | Mirrors the sitewide language toggle                                                  |
| `panel` | no       | `alerts` · `planner`                                  | [`VALID_PANELS`](../src/tracker/state.js) (`Set`); surfaces a modal panel on any mode |

## Legacy one-token hashes

For backward compatibility with links shared before §22b Phase 7, these shortcuts are accepted and
**canonicalized** back into the full form by [`parseHash`](../src/tracker/state.js):

| Legacy hash                     | Canonicalises to             |
| ------------------------------- | ---------------------------- |
| `#alerts`                       | `#mode=live&panel=alerts&…`  |
| `#section-alerts`               | `#mode=live&panel=alerts&…`  |
| `#mode=alerts`                  | `#mode=live&panel=alerts&…`  |
| `#mode=<unknown>`               | `#mode=live&…`               |
| `#panel=<unknown>`              | dropped; `mode` is preserved |
| `#panel=<valid>` without `mode` | `#mode=live&panel=<valid>&…` |

When `shouldCanonicalize` is `true`, `syncUrlFromState` is invoked on the next state write to
replace the URL in history without a navigation.

## Round-trip invariants

These invariants are enforced by [`tests/tracker-hash.test.js`](../tests/tracker-hash.test.js) and
must hold for every supported hash form:

1. **Empty hash** returns `{ hasHash: false }`, no mode / panel / canonicalization.
2. **Valid full hash** decodes every `mode`, `panel`, `cur`, `k`, `u`, `r`, `cmp`, `lang` param
   without dropping any.
3. **Unknown mode** maps to `mode=live` and sets `shouldCanonicalize: true`.
4. **Unknown panel** is dropped, `shouldCanonicalize: true`, `mode` is preserved.
5. **Panel without mode** resolves to `mode=live`, `shouldCanonicalize: true`.
6. **Legacy single-token alerts shortcuts** all resolve to `mode=live` + `panel=alerts`.
7. **Known mode + known panel** parses cleanly with `shouldCanonicalize: false`.

## Persistence vs URL

The URL hash is the **shareable** form. Per-user persistence lives in `localStorage` under keys in
[`STORAGE_KEYS`](../src/tracker/state.js):

| localStorage key           | Role                                           |
| -------------------------- | ---------------------------------------------- |
| `tracker_pro_state_v5`     | Core workspace prefs (mirrors the hash schema) |
| `tracker_pro_presets_v5`   | User-saved compare/archive presets             |
| `tracker_pro_wire_v5`      | Live-wire items                                |
| `tracker_pro_favorites_v5` | Watchlist currencies                           |
| `gold_price_alerts`        | Local-only alerts (Phase 12 scope)             |

On load, `createInitialState()` merges: built-in defaults → shared site cache → `localStorage` → URL
hash. The URL wins if it is present, which is the contract that makes deep links deterministic.

## Change procedure

1. Add or change a schema row in the table above **before** the code change.
2. Extend [`tests/tracker-hash.test.js`](../tests/tracker-hash.test.js) with the new round-trip
   case.
3. Implement the change in [`src/tracker/state.js`](../src/tracker/state.js).
4. Update §22b Phase 7 log in [`REVAMP_PLAN.md`](./REVAMP_PLAN.md) in the same commit.
