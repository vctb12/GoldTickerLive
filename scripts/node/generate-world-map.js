#!/usr/bin/env node
/**
 * generate-world-map.js — one-time generator for the heatmap page's inline-SVG
 * world map (`src/pages/heatmap/world-map-data.js`).
 *
 * Input: the TopoJSON world atlas at 1:110m scale —
 *   https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json
 * (Natural Earth data, public domain; the world-atlas packaging is ISC.)
 * Download the file locally and pass its path:
 *
 *   node scripts/node/generate-world-map.js /path/to/countries-110m.json
 *
 * The script is NOT part of the build or CI — the generated module is
 * committed. It exists so the map can be regenerated (new tracked country,
 * different simplification) without hand-editing path data.
 *
 * What it does:
 *   1. Decodes the TopoJSON arcs (delta-encoded, quantized).
 *   2. Projects every ring with the Natural Earth projection polynomial
 *      (Šavrič et al. 2011 — same coefficients d3-geo uses).
 *   3. Scales to a 1000-wide SVG viewBox and lightly simplifies rings
 *      (Visvalingam effective-area) so the committed module stays small.
 *   4. Splits geometries into three layers:
 *      - tracked countries (ISO2 codes from `src/config/countries.js`),
 *        Eurozone members merged into one 'EU' shape to match the site's
 *        'EU' pseudo-country;
 *      - a single merged background path for everything else;
 *      - circle markers for tracked countries with no 110m polygon
 *        (Bahrain, Comoros) plus centroids for tiny tracked countries so
 *        the page can draw touch-friendly hit targets.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_FILE = path.join(ROOT, 'src', 'pages', 'heatmap', 'world-map-data.js');

const MAP_WIDTH = 1000;

// ISO 3166-1 numeric → alpha-2 for every tracked country (src/config/countries.js).
const TRACKED_NUMERIC = {
  784: 'AE',
  682: 'SA',
  414: 'KW',
  634: 'QA',
  48: 'BH',
  512: 'OM',
  400: 'JO',
  422: 'LB',
  368: 'IQ',
  760: 'SY',
  275: 'PS',
  887: 'YE',
  818: 'EG',
  434: 'LY',
  788: 'TN',
  12: 'DZ',
  504: 'MA',
  729: 'SD',
  706: 'SO',
  478: 'MR',
  262: 'DJ',
  174: 'KM',
  792: 'TR',
  586: 'PK',
  840: 'US',
  826: 'GB',
  356: 'IN',
};

// Eurozone member states (ISO numeric) — merged into the site's 'EU'
// pseudo-country so hovering any member highlights the whole currency area.
const EUROZONE_NUMERIC = new Set([
  40, 56, 191, 196, 233, 246, 250, 276, 300, 372, 380, 428, 440, 442, 470, 528, 620, 703, 705, 724,
]);

const ANTARCTICA = 10;

// Tracked countries with no polygon at 1:110m → rendered as circle markers.
const MARKER_FALLBACK = {
  BH: { lon: 50.55, lat: 26.05 },
  KM: { lon: 43.87, lat: -11.88 },
};

// Tracked countries whose polygon is too small to hover/tap reliably get an
// enlarged invisible hit circle at this centroid (computed below when the
// projected bounding-box diagonal is under SMALL_DIAG_PX).
const SMALL_DIAG_PX = 16;

const SIMPLIFY_AREA_PX2 = 0.35; // Visvalingam effective-area threshold
const MIN_RING_AREA_PX2 = { tracked: 0.8, background: 3 };

function decodeArcs(topology) {
  const { scale, translate } = topology.transform;
  return topology.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
  });
}

/** Natural Earth projection (Šavrič et al. 2011 polynomial approximation). */
function projectNaturalEarth(lonDeg, latDeg) {
  const l = (lonDeg * Math.PI) / 180;
  const phi = (latDeg * Math.PI) / 180;
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  const x =
    l *
    (0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4)));
  const y =
    phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4)));
  return [x, y];
}

function ringFromArcs(arcIndexes, arcs) {
  const pts = [];
  for (const idx of arcIndexes) {
    const arc = idx >= 0 ? arcs[idx] : arcs[~idx].slice().reverse();
    for (const pt of arc) {
      const last = pts[pts.length - 1];
      if (!last || last[0] !== pt[0] || last[1] !== pt[1]) pts.push(pt);
    }
  }
  return pts;
}

/**
 * Split a lon/lat ring wherever it jumps across the antimeridian (|Δlon| >
 * 180°) — e.g. Russia and Fiji at 1:110m. Each segment is closed on its own,
 * which draws a straight edge along ±180° instead of a streak across the map.
 */
function splitAntimeridian(ring) {
  const segments = [];
  let current = [];
  for (const pt of ring) {
    const prev = current[current.length - 1];
    if (prev && Math.abs(pt[0] - prev[0]) > 180) {
      segments.push(current);
      current = [];
    }
    current.push(pt);
  }
  if (current.length) segments.push(current);
  if (segments.length > 1 && Math.abs(segments[0][0][0] - ring[ring.length - 1][0]) <= 180) {
    // Ring closure wraps normally — first and last segments are one piece.
    segments[segments.length - 1].push(...segments.shift());
  }
  return segments.filter((s) => s.length >= 4);
}

function polygonsOf(geometry, arcs) {
  if (!geometry) return [];
  const splitRings = (r) => splitAntimeridian(ringFromArcs(r, arcs));
  if (geometry.type === 'Polygon') return [geometry.arcs.flatMap(splitRings)];
  if (geometry.type === 'MultiPolygon') {
    return geometry.arcs.map((poly) => poly.flatMap(splitRings));
  }
  return [];
}

function ringAreaPx2(ring) {
  let area = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

/** Visvalingam–Whyatt simplification by effective triangle area. */
function simplifyRing(ring, minAreaPx2) {
  const pts = ring.slice();
  let changed = true;
  while (changed && pts.length > 4) {
    changed = false;
    let minArea = Infinity;
    let minIdx = -1;
    for (let i = 1; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const [cx, cy] = pts[i + 1];
      const area = Math.abs((bx - ax) * (cy - ay) - (cx - ax) * (by - ay)) / 2;
      if (area < minArea) {
        minArea = area;
        minIdx = i;
      }
    }
    if (minIdx > 0 && minArea < minAreaPx2) {
      pts.splice(minIdx, 1);
      changed = true;
    }
  }
  return pts;
}

function fmt(n) {
  return String(Math.round(n * 10) / 10)
    .replace(/^0\./, '.')
    .replace(/^-0\./, '-.');
}

function ringToPath(ring) {
  let d = '';
  let prev = null;
  for (const [x, y] of ring) {
    const key = `${fmt(x)},${fmt(y)}`;
    if (key === prev) continue;
    d += (d === '' ? 'M' : 'L') + key;
    prev = key;
  }
  return d ? `${d}Z` : '';
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath || !fs.existsSync(inputPath)) {
    console.error('Usage: node scripts/node/generate-world-map.js <countries-110m.json>');
    process.exit(1);
  }
  const topology = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const arcs = decodeArcs(topology);
  const geometries = topology.objects.countries.geometries;

  // Project everything once to find global bounds (Antarctica excluded).
  const projected = [];
  for (const geom of geometries) {
    const numericId = Number(geom.id);
    if (numericId === ANTARCTICA) continue;
    const polys = polygonsOf(geom, arcs).map((rings) =>
      rings.map((ring) => ring.map(([lon, lat]) => projectNaturalEarth(lon, lat)))
    );
    projected.push({ numericId, name: geom.properties && geom.properties.name, polys });
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const { polys } of projected) {
    for (const rings of polys) {
      for (const ring of rings) {
        for (const [x, y] of ring) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }
  const scale = MAP_WIDTH / (maxX - minX);
  const height = Math.ceil((maxY - minY) * scale);
  const toPx = ([x, y]) => [(x - minX) * scale, (maxY - y) * scale];

  const tracked = new Map(); // alpha2 → { paths: [], bbox }
  let backgroundPath = '';

  for (const { numericId, polys } of projected) {
    const alpha2 = EUROZONE_NUMERIC.has(numericId) ? 'EU' : TRACKED_NUMERIC[numericId];
    const layer = alpha2 ? 'tracked' : 'background';
    for (const rings of polys) {
      for (const [i, ring] of rings.entries()) {
        const px = ring.map(toPx);
        const area = ringAreaPx2(px);
        // Outer ring (i === 0) kept above the layer floor; holes only when big.
        if (area < (i === 0 ? MIN_RING_AREA_PX2[layer] : 3)) continue;
        const simplified = simplifyRing(px, SIMPLIFY_AREA_PX2);
        if (simplified.length < 4) continue;
        const d = ringToPath(simplified);
        if (!d) continue;
        if (alpha2) {
          if (!tracked.has(alpha2)) {
            tracked.set(alpha2, {
              d: '',
              minX: Infinity,
              maxX: -Infinity,
              minY: Infinity,
              maxY: -Infinity,
            });
          }
          const entry = tracked.get(alpha2);
          entry.d += d;
          for (const [x, y] of simplified) {
            if (x < entry.minX) entry.minX = x;
            if (x > entry.maxX) entry.maxX = x;
            if (y < entry.minY) entry.minY = y;
            if (y > entry.maxY) entry.maxY = y;
          }
        } else {
          backgroundPath += d;
        }
      }
    }
  }

  const countries = [];
  const smallTargets = {};
  for (const [code, entry] of [...tracked.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    countries.push({ code, d: entry.d });
    const diag = Math.hypot(entry.maxX - entry.minX, entry.maxY - entry.minY);
    if (code !== 'EU' && diag < SMALL_DIAG_PX) {
      smallTargets[code] = {
        x: Math.round(((entry.minX + entry.maxX) / 2) * 10) / 10,
        y: Math.round(((entry.minY + entry.maxY) / 2) * 10) / 10,
      };
    }
  }

  const markers = Object.entries(MARKER_FALLBACK).map(([code, { lon, lat }]) => {
    const [x, y] = toPx(projectNaturalEarth(lon, lat));
    return { code, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });

  // ── Graticule + map frame ──────────────────────────────────────────────────
  // The visible latitude band (Antarctica is excluded, so the map runs roughly
  // from the southern tip of South America to northern Greenland). Sampling
  // finely keeps the Natural Earth curves smooth.
  const LAT_MIN = -56;
  const LAT_MAX = 84;
  const LON_MIN = -180;
  const LON_MAX = 180;
  const STEP = 2; // degrees per sampled point

  const projectLine = (points) => {
    let d = '';
    for (const [lon, lat] of points) {
      const [x, y] = toPx(projectNaturalEarth(lon, lat));
      d += (d === '' ? 'M' : 'L') + fmt(x) + ',' + fmt(y);
    }
    return d;
  };

  // Graticule: meridians every 30° longitude, parallels every 30° latitude.
  let graticule = '';
  for (let lon = LON_MIN; lon <= LON_MAX; lon += 30) {
    const pts = [];
    for (let lat = LAT_MIN; lat <= LAT_MAX; lat += STEP) pts.push([lon, lat]);
    graticule += projectLine(pts);
  }
  for (let lat = -30; lat <= 60; lat += 30) {
    const pts = [];
    for (let lon = LON_MIN; lon <= LON_MAX; lon += STEP) pts.push([lon, lat]);
    graticule += projectLine(pts);
  }

  // Map frame ("sphere"): the curved outline of the visible projection, used to
  // fill the ocean and draw a crisp edge. Traced clockwise: top, right, bottom,
  // left, then closed.
  const frame = [];
  for (let lon = LON_MIN; lon <= LON_MAX; lon += STEP) frame.push([lon, LAT_MAX]);
  for (let lat = LAT_MAX; lat >= LAT_MIN; lat -= STEP) frame.push([LON_MAX, lat]);
  for (let lon = LON_MAX; lon >= LON_MIN; lon -= STEP) frame.push([lon, LAT_MIN]);
  for (let lat = LAT_MIN; lat <= LAT_MAX; lat += STEP) frame.push([LON_MIN, lat]);
  const framePath = projectLine(frame) + 'Z';

  const banner = [
    '// GENERATED FILE — do not edit by hand.',
    '// Produced by scripts/node/generate-world-map.js from world-atlas@2.0.2',
    '// countries-110m.json (Natural Earth 1:110m, public domain). Regenerate with:',
    '//   node scripts/node/generate-world-map.js <countries-110m.json>',
    '// Projection: Natural Earth. Eurozone members are merged into one EU shape.',
    '',
  ].join('\n');

  // Emit lint-clean ES module source (single quotes, unquoted keys). Path
  // data never contains quote characters, so plain wrapping is safe.
  const countriesSrc = countries.map((c) => `  { code: '${c.code}', d: '${c.d}' },`).join('\n');
  const markersSrc = markers
    .map((m) => `  { code: '${m.code}', x: ${m.x}, y: ${m.y} },`)
    .join('\n');
  const smallSrc = Object.entries(smallTargets)
    .map(([code, pt]) => `  ${code}: { x: ${pt.x}, y: ${pt.y} },`)
    .join('\n');

  const body = [
    `export const WORLD_VIEWBOX = '0 0 ${MAP_WIDTH} ${height}';`,
    '',
    '// Curved outline of the visible Natural Earth projection — fills the ocean',
    '// and draws the map edge.',
    `export const WORLD_SPHERE = '${framePath}';`,
    '',
    '// Graticule: 30° meridians + parallels, for a subtle lat/long grid.',
    `export const WORLD_GRATICULE = '${graticule}';`,
    '',
    '// Merged landmass for countries the site does not track (non-interactive backdrop).',
    `export const WORLD_BACKGROUND = '${backgroundPath}';`,
    '',
    '// Tracked countries (site ISO2 codes; EU = merged Eurozone members).',
    'export const WORLD_COUNTRIES = [',
    countriesSrc,
    '];',
    '',
    '// Tracked countries with no 1:110m polygon — drawn as circle markers.',
    'export const WORLD_MARKERS = [',
    markersSrc,
    '];',
    '',
    '// Centroids of tracked countries too small to hover/tap — the page draws',
    '// an enlarged invisible hit circle at these coordinates.',
    'export const WORLD_SMALL_TARGETS = {',
    smallSrc,
    '};',
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, `${banner}${body}`, 'utf8');
  const kb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log(
    `world-map-data.js written (${kb} KB): ${countries.length} tracked shapes, ` +
      `${markers.length} markers, ${Object.keys(smallTargets).length} small targets.`
  );
}

main();
