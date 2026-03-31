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
    .map(item => ({
      title: item.title || item.seendate || 'Gold headline',
      url: item.url || item.url_mobile || '',
      domain: item.domain || item.sourcecountry || '',
      seenDate: item.seendate || item.date || '',
    }))
    .filter(it => it.title)
    .slice(0, WIRE_CONFIG.maxrecords);
}

export async function fetchWire(existingItems = []) {
  return new Promise(resolve => {
    const callbackName = `__wire_${Date.now().toString(36)}`;
    const script = document.createElement('script');
    let settled = false;

    function cleanup() {
      if (settled) return;
      settled = true;
      delete window[callbackName];
      script.remove();
    }

    const timeoutId = setTimeout(() => {
      cleanup();
      // Fallback to previous items or static explainer
      if (existingItems.length) {
        resolve({ items: existingItems, fromCache: true });
      } else {
        resolve({
          items: [
            {
              title: 'Wire unavailable — using local prices and history only',
              url: '',
              domain: 'local',
              seenDate: new Date().toISOString(),
            },
          ],
          fromCache: false,
        });
      }
    }, WIRE_CONFIG.timeoutMs);

    window[callbackName] = payload => {
      clearTimeout(timeoutId);
      const items = safeParseWirePayload(payload);
      cleanup();
      resolve({ items, fromCache: false });
    };

    const query = encodeURIComponent(WIRE_CONFIG.query);
    script.src = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=${WIRE_CONFIG.maxrecords}&timespan=${WIRE_CONFIG.timespan}&format=jsonp&callback=${callbackName}`;
    script.async = true;
    document.body.appendChild(script);
  });
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
    .map(item => {
      const domain = item.domain ? `<span class="tracker-wire-domain">${escapeHtml(item.domain)}</span>` : '';
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
