// tracker/wire.js
import { clear, el, escape, safeHref } from '../lib/safe-dom.js';

const WIRE_CONFIG = {
  query: '(gold OR bullion OR "gold price" OR "gold prices" OR XAU OR "precious metals")',
  timespan: '24h',
  maxrecords: 18,
  timeoutMs: 12000,
};

function safeParseWirePayload(payload) {
  const articles = Array.isArray(payload?.articles) ? payload.articles : [];
  return articles
    .map((item) => ({
      title: item.title || item.seendate || 'Gold headline',
      url: item.url || item.url_mobile || '',
      domain: item.domain || item.sourcecountry || '',
      seenDate: item.seendate || item.date || '',
    }))
    .filter((it) => it.title)
    .slice(0, WIRE_CONFIG.maxrecords);
}

export async function fetchWire(existingItems = []) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WIRE_CONFIG.timeoutMs);

  const query = encodeURIComponent(WIRE_CONFIG.query);
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=${WIRE_CONFIG.maxrecords}&timespan=${WIRE_CONFIG.timespan}&format=json`;

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const items = safeParseWirePayload(payload);
    return { items, fromCache: false };
  } catch {
    clearTimeout(timeoutId);
    // Fallback to previous items or static explainer
    if (existingItems.length) {
      return { items: existingItems, fromCache: true };
    }
    return {
      items: [
        {
          title: 'Wire unavailable — using local prices and history only',
          url: '',
          domain: 'local',
          seenDate: new Date().toISOString(),
        },
      ],
      fromCache: false,
    };
  }
}

export function renderWire(els, state) {
  const track = els.wireTrack;
  const meta = document.getElementById('tp-wire-meta');
  if (!track) return;

  if (!state.wireItems.length) {
    clear(track);
    track.append(el('span', { class: 'tracker-wire-item' }, 'No recent wire headlines available.'));
    if (meta) meta.textContent = 'Wire unavailable';
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of state.wireItems) {
    const domainEl = item.domain
      ? el('span', { class: 'tracker-wire-domain' }, item.domain)
      : null;
    const children = [item.title, ...(domainEl ? [' · ', domainEl] : [])];
    if (item.url) {
      fragment.append(
        el('a', {
          href: safeHref(item.url),
          class: 'tracker-wire-item',
          target: '_blank',
          rel: 'noopener noreferrer',
        }, children)
      );
    } else {
      fragment.append(el('span', { class: 'tracker-wire-item' }, children));
    }
  }
  clear(track);
  track.append(fragment);

  if (meta) {
    const last = state.wireItems[0]?.seenDate || new Date().toISOString();
    const timeEl = el('time', null, new Date(last).toLocaleString());
    clear(meta);
    meta.append('Headlines · updated ', timeEl);
  }
}
