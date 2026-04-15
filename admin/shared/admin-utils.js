/**
 * admin/shared/admin-utils.js
 * Shared utilities for all admin panel pages.
 */

// ── DOM helpers ──────────────────────────────────────────────────────────────

export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

// ── Toast notifications ──────────────────────────────────────────────────────

const TOAST_ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
const TOAST_TYPES = { success: 'toast--success', error: 'toast--danger', warning: 'toast--warning', info: 'toast--info' };

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${TOAST_TYPES[type] || TOAST_TYPES.info}`;
  toast.setAttribute('role', 'alert');
  const iconSpan = document.createElement('span');
  iconSpan.className = 'toast-icon';
  iconSpan.setAttribute('aria-hidden', 'true');
  iconSpan.innerHTML = TOAST_ICONS[type] || TOAST_ICONS.info; // icons are trusted constants
  const msgSpan = document.createElement('span');
  msgSpan.textContent = message; // sanitize message via textContent
  toast.appendChild(iconSpan);
  toast.appendChild(msgSpan);
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-hide');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 4000);
}

// ── Relative time ─────────────────────────────────────────────────────────────

export function relativeTime(isoString) {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hr / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// ── localStorage helpers ──────────────────────────────────────────────────────

export function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function storageSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

export function storageRemove(...keys) {
  keys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
}

// ── Number formatting ─────────────────────────────────────────────────────────

export function formatNumber(n, opts = {}) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', opts).format(n);
}

export function formatCurrency(n, currency = 'USD') {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
}

// ── Debounce ──────────────────────────────────────────────────────────────────

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ── Custom confirm dialog ─────────────────────────────────────────────────────

let _confirmEl = null;

function _ensureConfirmDialog() {
  if (_confirmEl) return;
  _confirmEl = document.createElement('div');
  _confirmEl.className = 'confirm-dialog-overlay hidden';
  _confirmEl.id = 'confirm-dialog-overlay';
  _confirmEl.innerHTML = `
    <div class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg">
      <div class="confirm-dialog-title" id="confirm-title"></div>
      <div class="confirm-dialog-message" id="confirm-msg"></div>
      <div class="confirm-dialog-actions">
        <button class="btn btn-ghost btn-sm" id="confirm-cancel">Cancel</button>
        <button class="btn btn-danger btn-sm" id="confirm-ok">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(_confirmEl);
}

export function confirmDialog(message, { title = 'Are you sure?', confirmLabel = 'Confirm', confirmClass = 'btn-danger' } = {}) {
  _ensureConfirmDialog();
  return new Promise(resolve => {
    const overlay = document.getElementById('confirm-dialog-overlay');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-msg');
    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');

    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = confirmLabel;
    okBtn.className = `btn btn-sm ${confirmClass}`;

    overlay.classList.remove('hidden');
    okBtn.focus();

    function close(result) {
      overlay.classList.add('hidden');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      document.removeEventListener('keydown', onKey);
      resolve(result);
    }
    const onOk = () => close(true);
    const onCancel = () => close(false);
    const onKey = e => { if (e.key === 'Escape') close(false); };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    document.addEventListener('keydown', onKey);
  });
}

// ── Focus trap for modals ─────────────────────────────────────────────────────

export function trapFocus(el) {
  const focusable = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
  function handler(e) {
    if (e.key !== 'Tab') return;
    const els = Array.from(el.querySelectorAll(focusable)).filter(n => n.offsetParent !== null);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  el.addEventListener('keydown', handler);
  return () => el.removeEventListener('keydown', handler);
}

// ── Pagination renderer ───────────────────────────────────────────────────────

/**
 * Render pagination controls into a container element.
 * @param {HTMLElement} container
 * @param {{ total: number, page: number, perPage: number, onChange: (page: number) => void }} opts
 */
export function renderPagination(container, { total, page, perPage, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  container.innerHTML = `
    <div class="pagination">
      <button class="pagination-btn" id="pg-prev" ${page <= 1 ? 'disabled' : ''}>← Prev</button>
      <span class="pagination-info">Page ${page} of ${totalPages} (${start}–${end} of ${total})</span>
      <button class="pagination-btn" id="pg-next" ${page >= totalPages ? 'disabled' : ''}>Next →</button>
    </div>`;

  container.querySelector('#pg-prev')?.addEventListener('click', () => onChange(page - 1));
  container.querySelector('#pg-next')?.addEventListener('click', () => onChange(page + 1));
}

// ── Skeleton loader helpers ───────────────────────────────────────────────────

export function skeletonRows(count = 5, cols = 4) {
  return Array.from({ length: count }, () =>
    `<tr>${Array.from({ length: cols }, () =>
      `<td><span class="skeleton" style="height:14px;display:block;width:${60 + Math.random() * 30}%"></span></td>`
    ).join('')}</tr>`
  ).join('');
}

export function skeletonStatCard() {
  return `
    <span class="skeleton" style="height:24px;display:block;width:60%;margin-bottom:8px"></span>
    <span class="skeleton" style="height:14px;display:block;width:80%"></span>`;
}

// ── CSV export helper ─────────────────────────────────────────────────────────

export function downloadCSV(filename, rows, headers) {
  const escape = v => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(',')];
  rows.forEach(row => lines.push(headers.map(h => escape(row[h])).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Sparkline canvas ──────────────────────────────────────────────────────────

/**
 * Draw a mini sparkline on a canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {number[]} data
 * @param {{ color?: string, fill?: boolean }} opts
 */
export function drawSparkline(canvas, data, { color = '#3b82f6', fill = true } = {}) {
  if (!canvas || !data?.length) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  ctx.clearRect(0, 0, w, h);
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2
  }));
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();
  if (fill) {
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, h);
    ctx.lineTo(pts[0].x, h);
    ctx.closePath();
    ctx.fillStyle = color + '26'; // hex alpha 0x26 = 38/255 ≈ 15% opacity
    ctx.fill();
  }
}

// ── Donut chart ───────────────────────────────────────────────────────────────

/**
 * Draw a donut chart on a canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {{ label: string, value: number, color: string }[]} segments
 */
export function drawDonut(canvas, segments) {
  if (!canvas || !segments?.length) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) / 2 - 4;
  const ir = r * 0.55;
  const total = segments.reduce((s, g) => s + g.value, 0);
  if (!total) return;
  ctx.clearRect(0, 0, w, h);
  let startAngle = -Math.PI / 2;
  segments.forEach((seg) => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx + ir * Math.cos(startAngle), cy + ir * Math.sin(startAngle));
    ctx.arc(cx, cy, r, startAngle, startAngle + sweep);
    ctx.arc(cx, cy, ir, startAngle + sweep, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    startAngle += sweep;
  });
}

// ── Command palette ───────────────────────────────────────────────────────────

let _cmdPaletteEl = null;
let _cmdPaletteItems = [];

export function initCommandPalette(items) {
  _cmdPaletteItems = items;

  if (!document.getElementById('cmd-palette-overlay')) {
    const el = document.createElement('div');
    el.id = 'cmd-palette-overlay';
    el.className = 'cmd-palette-overlay hidden';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Command palette');
    el.innerHTML = `
      <div class="cmd-palette" id="cmd-palette">
        <input class="cmd-palette-input" id="cmd-palette-input" type="text" placeholder="Search pages and actions…" autocomplete="off" aria-label="Search commands" />
        <div class="cmd-palette-results" id="cmd-palette-results" role="listbox"></div>
        <div class="cmd-palette-hint"><span>↑↓ navigate</span><span>↵ select</span><span>esc close</span></div>
      </div>`;
    document.body.appendChild(el);
    _cmdPaletteEl = el;

    const input = document.getElementById('cmd-palette-input');
    input.addEventListener('input', _renderCmdResults);
    input.addEventListener('keydown', _cmdKeyHandler);
    el.addEventListener('click', e => { if (e.target === el) closeCmdPalette(); });
  }

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openCmdPalette();
    }
  });
}

function _renderCmdResults() {
  const q = (document.getElementById('cmd-palette-input')?.value || '').toLowerCase();
  const filtered = q ? _cmdPaletteItems.filter(i => i.label.toLowerCase().includes(q)) : _cmdPaletteItems;
  const container = document.getElementById('cmd-palette-results');
  if (!container) return;
  if (!filtered.length) {
    container.innerHTML = `<div class="cmd-palette-empty">No results</div>`;
    return;
  }
  container.innerHTML = filtered.map((item, i) =>
    `<div class="cmd-result${i === 0 ? ' active' : ''}" data-href="${item.href || ''}" role="option" tabindex="-1">
      <span class="cmd-result-icon" aria-hidden="true">${item.icon || ''}</span>
      <span>${item.label}</span>
    </div>`
  ).join('');
  container.querySelectorAll('.cmd-result').forEach(el => {
    el.addEventListener('click', () => { window.location.href = el.dataset.href; });
  });
}

function _cmdKeyHandler(e) {
  const results = document.getElementById('cmd-palette-results');
  if (!results) return;
  const items = Array.from(results.querySelectorAll('.cmd-result'));
  const activeIdx = items.findIndex(i => i.classList.contains('active'));
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = (activeIdx + 1) % items.length;
    items[activeIdx]?.classList.remove('active');
    items[next]?.classList.add('active');
    items[next]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = (activeIdx - 1 + items.length) % items.length;
    items[activeIdx]?.classList.remove('active');
    items[prev]?.classList.add('active');
    items[prev]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const active = items[activeIdx] || items[0];
    if (active?.dataset.href) window.location.href = active.dataset.href;
  } else if (e.key === 'Escape') {
    closeCmdPalette();
  }
}

export function openCmdPalette() {
  const overlay = document.getElementById('cmd-palette-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  const input = document.getElementById('cmd-palette-input');
  if (input) { input.value = ''; input.focus(); }
  _renderCmdResults();
}

export function closeCmdPalette() {
  document.getElementById('cmd-palette-overlay')?.classList.add('hidden');
}
