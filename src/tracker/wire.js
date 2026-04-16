// tracker/wire.js
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
    track.innerHTML = '<span class="tracker-wire-item">No recent wire headlines available.</span>';
    if (meta) meta.textContent = 'Wire unavailable';
    return;
  }

  const html = state.wireItems
    .map((item) => {
      const domain = item.domain
        ? `<span class="tracker-wire-domain">${escapeHtml(item.domain)}</span>`
        : '';
      const content = `${escapeHtml(item.title)}${domain ? ' · ' + domain : ''}`;
      return item.url
        ? `<a href="${escapeHtml(item.url)}" class="tracker-wire-item" target="_blank" rel="noopener noreferrer">${content}</a>`
        : `<span class="tracker-wire-item">${content}</span>`;
    })
    .join('');

  track.innerHTML = html;

  if (meta) {
    const last = state.wireItems[0]?.seenDate || new Date().toISOString();
    meta.innerHTML = `Headlines · updated <time>${escapeHtml(new Date(last).toLocaleString())}</time>`;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
