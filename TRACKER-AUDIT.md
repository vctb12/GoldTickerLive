# Tracker State Audit (WORKSTREAM 3A)

## Current State System Analysis

### State Shape
```javascript
{
  // MIXED SEMANTICS
  mode: 'live' | 'archive' | 'compare' | 'alerts' | 'planner',
  
  // VIEW SETTINGS
  selectedCurrency: 'AED' | 'USD' | ...,
  selectedKarat: '24' | '22' | '21' | '18',
  selectedUnit: 'gram' | 'oz',
  compareCurrency: 'USD',
  
  // RANGE SETTING
  range: '30D' | '1Y' | '5Y' | 'all',
  
  // LANGUAGE
  lang: 'en' | 'ar',
  
  // CACHED LIVE DATA
  live: { price: number, updatedAt: timestamp, raw: {} },
  rates: { AED: number, ... },
  fxMeta: { lastUpdateUtc: timestamp, nextUpdateUtc: timestamp },
  
  // HISTORY DATA
  history: [ { date: Date, spot: number, source: string } ],
  snapshots: [],
  
  // USER ARTIFACTS
  alerts: [ ... ],
  presets: [ ... ],
  favorites: [ ... ],
  wireItems: [ ... ],
  
  // EPHEMERAL UI STATE
  timers: { live: null, wire: null, playback: null },
  lastRangeRows: [],
  lastArchiveRows: [],
  playbackIndex: null,
  hasLiveFailure: false,
  // ... 40+ fields total
}
```

### URL Hash Encoding
**Current (tracker/state.js:140)**:
```
#mode=live&cur=AED&k=24&u=gram&r=30D&cmp=USD
```

**Encodes**:
- mode (mandatory)
- selectedCurrency
- selectedKarat
- selectedUnit
- range
- compareCurrency

**Missing from URL**:
- lang (should be optional, defaults to 'en')
- Any tool-specific parameters (alerts scope, target, etc.)
- playbackIndex or other ephemeral state

### Initialization Flow
**tracker-pro.js:17**:
```javascript
const state = createInitialState();
```

**tracker/state.js:44-120** (`createInitialState()`):
1. Creates base state from `DEFAULT_STATE` constants
2. Loads shared cache via `cache.loadState(stub)` (line 70)
3. Seeds tracker state from cache (`base.live`, `base.rates`, `base.history`)
4. Reads tracker-specific saved state from localStorage (line 91)
5. Applies URL hash parameters (line 111: `applyUrlState(base)`)
6. Returns fully initialized state

**applyUrlState(state) - tracker/state.js:144-154**:
- Reads hash parameters from `window.location.hash`
- Uses URLSearchParams to parse
- Falls back to existing state values if hash param missing
- Called ONCE during initialization

### Mode System Issues

#### 1. Conflation of Concerns
**Lines conflating view + tool**:
- `state.mode = 'live'` → content view (current prices)
- `state.mode = 'archive'` → content view (historical)
- `state.mode = 'compare'` → content view (multi-country)
- `state.mode = 'alerts'` → tool (supplementary)
- `state.mode = 'planner'` → tool (supplementary)

**renderAll() - tracker-pro.js:1056-1072**:
```javascript
if (state.mode === 'live') {
  renderMiniStrip(); renderChart(); renderKaratTable(); renderMarkets(); ...
} else if (state.mode === 'compare') {
  renderMarkets();
} else if (state.mode === 'archive') {
  renderArchive();
} else if (state.mode === 'alerts') {
  renderAlerts(); renderPresets();
} else if (state.mode === 'planner') {
  renderPlanners();
}
```

**Problems**:
- Can't be in "live" view WITH alerts open
- Can't be in "archive" view WITH planner visible
- UI tabs suggest these should be orthogonal (view tabs + tool tabs)

#### 2. No Hash Change Listener
**Defect**: No `hashchange` event listener found in codebase

**Current behavior**:
1. User navigates to tracker page with hash → `applyUrlState()` reads hash once
2. User clicks mode tab → `setMode()` → `syncUrlFromState()` updates hash
3. User presses browser back/forward → hash changes BUT app doesn't respond

**Impact**: Back/forward button doesn't work reliably

#### 3. Mode Switching Implementation
**tracker/ui-shell.js:30-44** (`setMode()` function):
```javascript
function setMode(mode) {
  state.mode = mode;  // Direct assignment
  // Update tab/panel visibility
  // ...
  persistState(state);
  syncUrlFromState(state);
  if (typeof onModeChange === 'function') onModeChange(mode);
}
```

**Keyboard shortcuts (lines 54-71)**:
- 'h' → setMode('live')
- 'c' → setMode('compare')
- 'a' → setMode('alerts')
- 'p' → setMode('planner')
- 'x' → setMode('exports')  // but mode 'exports' doesn't exist in renderAll()
- 'm' → setMode('method')   // but mode 'method' doesn't exist in renderAll()

**Bug**: Shortcuts try to set modes that don't exist in renderAll()

### Persistence Mechanism

**persistState() - tracker/state.js:125-135**:
```javascript
export function persistState(state) {
  writeLocal(STORAGE_KEYS.core, {
    lang: state.lang,
    mode: state.mode,
    selectedCurrency: state.selectedCurrency,
    selectedKarat: state.selectedKarat,
    selectedUnit: state.selectedUnit,
    compareCurrency: state.compareCurrency,
    range: state.range,
    metric: state.metric,
    autoRefresh: state.autoRefresh,
    favoritesOnly: state.favoritesOnly,
  });
  // ... also persists alerts, presets, watchlist to separate keys
}
```

**writeLocal()**:
- Saves to localStorage with try-catch
- Silent failure on quota errors

### Identified Defects (WORKSTREAM 3 Scope)

| Defect | Severity | Root Cause | Impact |
|--------|----------|-----------|--------|
| **Mode conflates view + tool** | P0 | Architecture design | Can't combine views with tools (alerts+live not possible) |
| **No hashchange listener** | P0 | Incomplete implementation | Back/forward button breaks state sync |
| **Keyboard shortcuts broken** | P1 | Bad mode names in shortcuts | Shortcuts 'x' and 'm' cause renderAll() to do nothing |
| **URL encoding incomplete** | P1 | Simplistic hash scheme | lang not encoded; tool state not shareable |
| **Complex initialization** | P1 | Multiple fallback paths | Hard to reason about state at startup |
| **Mode field in hash** | P1 | View+tool conflation | Hash less meaningful (what does mode=alerts mean?) |
| **Ephemeral state in URL** | P2 | Unclear semantics | URL mixes permanent settings with transient UI state |

### Proposed Refactoring

**NEW STATE SHAPE**:
```javascript
{
  // VIEW: what content is displayed
  view: 'live' | 'archive' | 'compare',
  
  // ACTIVE TOOL: which supplementary panel is open
  activeTool: null | 'alerts' | 'planner' | 'wire' | 'insights',
  
  // PERSISTENT SETTINGS (worth URL encoding)
  selectedCurrency: 'AED',
  selectedKarat: '24',
  selectedUnit: 'gram',
  range: '30D',
  
  // EPHEMERAL UI STATE (NOT in URL)
  filteredCountries: [],
  sortOrder: 'price-high',
  filterText: '',
  
  // ... rest remains same
}
```

**NEW URL HASH**:
```
#view=live&cur=AED&k=24&u=gram&range=30D
```

**BENEFITS**:
- Clearer semantics: view is orthogonal to tool
- Simpler hash encoding
- Supports combining view + tool (e.g., live view + alerts tool open)
- Easier to add tool-specific parameters later

### Refactoring Phases (3B-3D)

**Phase 3B**: Separate view axis from tool axis
- Rename `state.mode` → `state.view` + `state.activeTool`
- Update renderAll() to separate view + tool rendering
- Update UI tabs/panels to show both

**Phase 3C**: Stabilize URL encoding
- Update `syncUrlFromState()` for new format
- Add `hashchange` event listener
- Test roundtripping (state → hash → state)

**Phase 3D**: Verify all tracker modes work
- Test all views (live, archive, compare)
- Test all tools (alerts, planner, wire, insights)
- Test back/forward navigation
- Test keyboard shortcuts

---

**Audit completed**: 2026-04-03
**Files audited**:
- tracker-pro.js (main entry + render logic)
- tracker/state.js (state initialization + persistence + URL encoding)
- tracker/ui-shell.js (UI mounting + mode switching)

