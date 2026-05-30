/**
 * components/alert-manager.js — Slide-in drawer for managing price alerts.
 *
 * Features:
 *   - Slide-in from right (desktop) / bottom (mobile)
 *   - Lists active + fired alerts with delete/reactivate actions
 *   - Add alert form with validation
 *   - Sound toggle (Web Audio API)
 *   - Import/export as JSON
 *   - WhatsApp share link
 *   - Alert count badge
 *   - Keyboard navigable, focus-trapped, closes on Escape
 *   - RTL support via CSS logical properties
 *   - prefers-reduced-motion respected
 *
 * API:
 *   renderAlertManager(container, engine, lang)
 *   openAlertManager()
 *   closeAlertManager()
 *   updateAlertManagerLang(lang)
 */

import { el, clear, setText } from '../lib/safe-dom.js';

let _drawer = null;
let _engine = null;
let _lang = 'en';
let _isOpen = false;
let _previousFocus = null;
let _triggerDialog = null;

// ─── i18n ───────────────────────────────────────────────────────────────────

const LABELS = {
  en: {
    title: 'Price Alerts',
    subtitle: 'Get notified when gold reaches your target price.',
    addBtn: '+ Add Alert',
    scopeLabel: 'Watch price',
    scopeSpot: 'XAU/USD per ounce',
    scopeUae24: 'UAE 24K per gram (AED)',
    scopeSelected: 'Selected karat',
    directionLabel: 'Alert when price',
    above: 'goes above',
    below: 'drops below',
    targetLabel: 'Target price',
    karatLabel: 'Karat',
    save: 'Save Alert',
    cancel: 'Cancel',
    activeTitle: 'Active Alerts',
    firedTitle: 'Recently Triggered',
    empty: 'No alerts set. Add one to get notified when gold hits your target.',
    firedEmpty: 'No triggered alerts yet.',
    delete: 'Delete',
    reactivate: 'Set new target',
    share: 'Share via WhatsApp',
    soundLabel: '🔔 Sound',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    exportBtn: 'Export alerts',
    importBtn: 'Import alerts',
    clearFired: 'Clear all triggered',
    close: 'Close alerts panel',
    limitWarning: 'You have {count}/{max} alerts. Maximum is {max}.',
    limitReached: 'Maximum alerts reached ({max}). Delete an existing alert to add a new one.',
    duplicate: 'This alert already exists.',
    invalidTarget: 'Enter a valid target price greater than 0.',
    importSuccess: 'Imported {count} alert(s) successfully.',
    importFail: 'Could not import alerts. Check the file format.',
    triggered: '🎯 Alert triggered!',
    triggeredMsg: '{scope} reached {price} (your target: {target})',
    dismiss: 'Dismiss',
    setNew: 'Set new alert',
    browserOnly: 'Alerts fire only while this tab is open.',
    countBadge: '{count}',
  },
  ar: {
    title: 'تنبيهات الأسعار',
    subtitle: 'احصل على إشعار عندما يصل الذهب إلى السعر المستهدف.',
    addBtn: '+ إضافة تنبيه',
    scopeLabel: 'مراقبة السعر',
    scopeSpot: 'XAU/USD للأونصة',
    scopeUae24: 'الإمارات 24K للغرام (درهم)',
    scopeSelected: 'العيار المحدد',
    directionLabel: 'تنبيه عندما السعر',
    above: 'يرتفع فوق',
    below: 'ينخفض تحت',
    targetLabel: 'السعر المستهدف',
    karatLabel: 'العيار',
    save: 'حفظ التنبيه',
    cancel: 'إلغاء',
    activeTitle: 'التنبيهات النشطة',
    firedTitle: 'تنبيهات تم تفعيلها',
    empty: 'لا توجد تنبيهات. أضف تنبيهاً ليتم إعلامك عند وصول الذهب لسعرك المستهدف.',
    firedEmpty: 'لا توجد تنبيهات مُفعّلة بعد.',
    delete: 'حذف',
    reactivate: 'تعيين هدف جديد',
    share: 'مشاركة عبر واتساب',
    soundLabel: '🔔 الصوت',
    soundOn: 'الصوت مفعّل',
    soundOff: 'الصوت مُعطّل',
    exportBtn: 'تصدير التنبيهات',
    importBtn: 'استيراد تنبيهات',
    clearFired: 'مسح جميع المُفعّلة',
    close: 'إغلاق لوحة التنبيهات',
    limitWarning: 'لديك {count}/{max} تنبيهات. الحد الأقصى {max}.',
    limitReached: 'تم الوصول للحد الأقصى ({max}). احذف تنبيهاً لإضافة جديد.',
    duplicate: 'هذا التنبيه موجود بالفعل.',
    invalidTarget: 'أدخل سعراً مستهدفاً صحيحاً أكبر من 0.',
    importSuccess: 'تم استيراد {count} تنبيه(ات) بنجاح.',
    importFail: 'تعذر استيراد التنبيهات. تحقق من صيغة الملف.',
    triggered: '🎯 تم تفعيل التنبيه!',
    triggeredMsg: '{scope} وصل {price} (هدفك: {target})',
    dismiss: 'إغلاق',
    setNew: 'تعيين تنبيه جديد',
    browserOnly: 'تعمل التنبيهات فقط أثناء فتح هذه النافذة.',
    countBadge: '{count}',
  },
};

function t(key, replacements = {}) {
  const labels = LABELS[_lang] || LABELS.en;
  let str = labels[key] || LABELS.en[key] || key;
  for (const [k, v] of Object.entries(replacements)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return str;
}

// ─── Focus trap ─────────────────────────────────────────────────────────────

function trapFocus(container) {
  const focusable = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

// ─── Drawer construction ────────────────────────────────────────────────────

function buildDrawer() {
  const drawer = el('div', {
    class: 'alert-manager-drawer',
    id: 'alert-manager-drawer',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'alert-mgr-title',
    'aria-hidden': 'true',
  });
  drawer.hidden = true;

  // Backdrop
  const backdrop = el('div', { class: 'alert-mgr-backdrop', 'aria-hidden': 'true' });
  backdrop.addEventListener('click', () => closeAlertManager());

  // Panel
  const panel = el('div', { class: 'alert-mgr-panel' });

  // Header
  const header = el('div', { class: 'alert-mgr-header' });
  const titleWrap = el('div', { class: 'alert-mgr-title-wrap' });
  const title = el('h2', { id: 'alert-mgr-title', class: 'alert-mgr-title' });
  setText(title, t('title'));
  const subtitle = el('p', { class: 'alert-mgr-subtitle' });
  setText(subtitle, t('subtitle'));
  titleWrap.append(title, subtitle);

  const closeBtn = el('button', {
    class: 'alert-mgr-close',
    type: 'button',
    'aria-label': t('close'),
  });
  setText(closeBtn, '✕');
  closeBtn.addEventListener('click', () => closeAlertManager());

  header.append(titleWrap, closeBtn);

  // Body
  const body = el('div', { class: 'alert-mgr-body' });

  // Sound toggle + tools row
  const toolsRow = el('div', { class: 'alert-mgr-tools' });
  const soundToggle = buildSoundToggle();
  const exportBtn = el('button', { class: 'alert-mgr-tool-btn', type: 'button' });
  setText(exportBtn, t('exportBtn'));
  exportBtn.addEventListener('click', handleExport);

  const importBtn = el('button', { class: 'alert-mgr-tool-btn', type: 'button' });
  setText(importBtn, t('importBtn'));
  importBtn.addEventListener('click', handleImport);

  toolsRow.append(soundToggle, exportBtn, importBtn);

  // Browser-only note
  const browserNote = el('p', { class: 'alert-mgr-note' });
  setText(browserNote, t('browserOnly'));

  // Add alert form
  const form = buildAddForm();

  // Alert lists
  const activeSection = el('div', { class: 'alert-mgr-section', id: 'alert-mgr-active' });
  const firedSection = el('div', { class: 'alert-mgr-section', id: 'alert-mgr-fired' });

  // Status/feedback region
  const statusRegion = el('div', {
    class: 'alert-mgr-status',
    id: 'alert-mgr-status',
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  });

  body.append(toolsRow, browserNote, statusRegion, form, activeSection, firedSection);
  panel.append(header, body);
  drawer.append(backdrop, panel);

  return drawer;
}

function buildSoundToggle() {
  const wrap = el('label', { class: 'alert-mgr-sound-toggle' });
  const checkbox = el('input', {
    type: 'checkbox',
    id: 'alert-mgr-sound-check',
    'aria-label': t('soundLabel'),
  });
  checkbox.checked = _engine ? _engine.isSoundEnabled() : false;
  checkbox.addEventListener('change', () => {
    if (_engine) _engine.toggleSound(checkbox.checked);
  });
  const label = el('span', { class: 'alert-mgr-sound-label' });
  setText(label, t('soundLabel'));
  wrap.append(checkbox, label);
  return wrap;
}

function buildAddForm() {
  const form = el('div', { class: 'alert-mgr-form', id: 'alert-mgr-form' });

  // Scope
  const scopeWrap = el('div', { class: 'alert-mgr-field' });
  const scopeLabel = el('label', { for: 'alert-mgr-scope', class: 'alert-mgr-field-label' });
  setText(scopeLabel, t('scopeLabel'));
  const scopeSelect = el('select', { id: 'alert-mgr-scope', class: 'alert-mgr-input' });
  const scopeOpts = [
    { value: 'spot', text: t('scopeSpot') },
    { value: 'uae24', text: t('scopeUae24') },
    { value: 'selected', text: t('scopeSelected') },
  ];
  for (const opt of scopeOpts) {
    const option = el('option', { value: opt.value });
    setText(option, opt.text);
    scopeSelect.append(option);
  }
  scopeWrap.append(scopeLabel, scopeSelect);

  // Direction
  const dirWrap = el('div', { class: 'alert-mgr-field' });
  const dirLabel = el('label', { for: 'alert-mgr-direction', class: 'alert-mgr-field-label' });
  setText(dirLabel, t('directionLabel'));
  const dirSelect = el('select', { id: 'alert-mgr-direction', class: 'alert-mgr-input' });
  const dirOpts = [
    { value: 'above', text: t('above') },
    { value: 'below', text: t('below') },
  ];
  for (const opt of dirOpts) {
    const option = el('option', { value: opt.value });
    setText(option, opt.text);
    dirSelect.append(option);
  }
  dirWrap.append(dirLabel, dirSelect);

  // Karat
  const karatWrap = el('div', { class: 'alert-mgr-field' });
  const karatLabel = el('label', { for: 'alert-mgr-karat', class: 'alert-mgr-field-label' });
  setText(karatLabel, t('karatLabel'));
  const karatSelect = el('select', { id: 'alert-mgr-karat', class: 'alert-mgr-input' });
  for (const k of ['24', '22', '21', '18', '14']) {
    const option = el('option', { value: k });
    setText(option, `${k}K`);
    karatSelect.append(option);
  }
  karatWrap.append(karatLabel, karatSelect);

  // Target
  const targetWrap = el('div', { class: 'alert-mgr-field' });
  const targetLabel = el('label', { for: 'alert-mgr-target', class: 'alert-mgr-field-label' });
  setText(targetLabel, t('targetLabel'));
  const targetInput = el('input', {
    type: 'number',
    id: 'alert-mgr-target',
    class: 'alert-mgr-input',
    min: '0',
    step: '0.01',
    placeholder: '0.00',
    inputmode: 'decimal',
    autocomplete: 'off',
  });
  targetWrap.append(targetLabel, targetInput);

  // Actions
  const actions = el('div', { class: 'alert-mgr-form-actions' });
  const saveBtn = el('button', {
    class: 'alert-mgr-btn alert-mgr-btn--primary',
    type: 'button',
    id: 'alert-mgr-save',
  });
  setText(saveBtn, t('save'));
  saveBtn.addEventListener('click', handleSaveAlert);

  actions.append(saveBtn);
  form.append(scopeWrap, dirWrap, karatWrap, targetWrap, actions);

  return form;
}

// ─── Render alert lists ─────────────────────────────────────────────────────

function renderAlertLists() {
  if (!_engine || !_drawer) return;

  const activeSection = _drawer.querySelector('#alert-mgr-active');
  const firedSection = _drawer.querySelector('#alert-mgr-fired');
  if (!activeSection || !firedSection) return;

  const active = _engine.getActiveAlerts();
  const fired = _engine.getTriggeredAlerts();

  // Active alerts
  clear(activeSection);
  const activeTitle = el('h3', { class: 'alert-mgr-section-title' });
  setText(activeTitle, t('activeTitle'));
  activeSection.append(activeTitle);

  if (!active.length) {
    const emptyMsg = el('p', { class: 'alert-mgr-empty' });
    setText(emptyMsg, t('empty'));
    activeSection.append(emptyMsg);
  } else {
    for (const alert of active) {
      activeSection.append(buildAlertCard(alert, 'active'));
    }
  }

  // Fired alerts
  clear(firedSection);
  if (fired.length) {
    const firedTitle = el('h3', { class: 'alert-mgr-section-title' });
    setText(firedTitle, t('firedTitle'));
    const clearBtn = el('button', {
      class: 'alert-mgr-tool-btn alert-mgr-tool-btn--small',
      type: 'button',
    });
    setText(clearBtn, t('clearFired'));
    clearBtn.addEventListener('click', () => {
      _engine.clearFired();
      renderAlertLists();
    });
    const titleRow = el('div', { class: 'alert-mgr-section-title-row' });
    titleRow.append(firedTitle, clearBtn);
    firedSection.append(titleRow);

    for (const alert of fired) {
      firedSection.append(buildAlertCard(alert, 'fired'));
    }
  }
}

function buildAlertCard(alert, type) {
  const card = el('div', { class: `alert-mgr-card alert-mgr-card--${type}` });

  const scopeLabels = {
    spot: 'XAU/USD',
    uae24: 'UAE 24K AED/g',
    selected: `${alert.karat}K`,
  };
  const scopeText = scopeLabels[alert.scope] || alert.scope;
  const dirText = alert.direction === 'above' ? '▲' : '▼';
  const targetText = alert.target.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Main info
  const info = el('div', { class: 'alert-mgr-card-info' });
  const headline = el('span', { class: 'alert-mgr-card-headline' });
  setText(headline, `${scopeText} ${dirText} ${targetText}`);
  info.append(headline);

  if (type === 'fired' && alert.firedAt) {
    const firedInfo = el('span', { class: 'alert-mgr-card-fired' });
    setText(firedInfo, `Triggered at ${alert.firedPrice?.toFixed(2) || '—'}`);
    info.append(firedInfo);
  }

  // Actions
  const actions = el('div', { class: 'alert-mgr-card-actions' });

  if (type === 'active') {
    // WhatsApp share
    const waBtn = el('a', {
      class: 'alert-mgr-card-btn alert-mgr-card-btn--wa',
      href: _engine.getWhatsAppLink(alert),
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': t('share'),
      title: t('share'),
    });
    setText(waBtn, '💬');

    // Delete
    const delBtn = el('button', {
      class: 'alert-mgr-card-btn alert-mgr-card-btn--delete',
      type: 'button',
      'aria-label': t('delete'),
      title: t('delete'),
    });
    setText(delBtn, '×');
    delBtn.addEventListener('click', () => {
      _engine.removeAlert(alert.id);
      renderAlertLists();
    });

    actions.append(waBtn, delBtn);
  } else {
    // Reactivate
    const reactBtn = el('button', {
      class: 'alert-mgr-card-btn alert-mgr-card-btn--reactivate',
      type: 'button',
      'aria-label': t('reactivate'),
    });
    setText(reactBtn, '↻');
    reactBtn.addEventListener('click', () => {
      _engine.reactivateAlert(alert.id);
      renderAlertLists();
    });

    // Delete
    const delBtn = el('button', {
      class: 'alert-mgr-card-btn alert-mgr-card-btn--delete',
      type: 'button',
      'aria-label': t('delete'),
    });
    setText(delBtn, '×');
    delBtn.addEventListener('click', () => {
      _engine.removeAlert(alert.id);
      renderAlertLists();
    });

    actions.append(reactBtn, delBtn);
  }

  card.append(info, actions);
  return card;
}

// ─── Handlers ───────────────────────────────────────────────────────────────

function handleSaveAlert() {
  if (!_engine) return;
  const scope = _drawer.querySelector('#alert-mgr-scope')?.value || 'spot';
  const direction = _drawer.querySelector('#alert-mgr-direction')?.value || 'above';
  const karat = _drawer.querySelector('#alert-mgr-karat')?.value || '24';
  const target = _drawer.querySelector('#alert-mgr-target')?.value;

  const result = _engine.addAlert({ scope, direction, target, karat });
  const statusEl = _drawer.querySelector('#alert-mgr-status');

  if (result.success) {
    // Clear input
    const targetInput = _drawer.querySelector('#alert-mgr-target');
    if (targetInput) targetInput.value = '';
    if (statusEl) setText(statusEl, '');
    renderAlertLists();
  } else {
    if (statusEl) {
      const msgs = {
        max_reached: t('limitReached', { max: _engine.getMaxAlerts() }),
        duplicate: t('duplicate'),
        invalid_target: t('invalidTarget'),
      };
      setText(statusEl, msgs[result.error] || result.error);
    }
  }
}

function handleExport() {
  if (!_engine) return;
  const json = _engine.exportAlerts();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gold-alerts-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = _engine.importAlerts(reader.result);
      const statusEl = _drawer?.querySelector('#alert-mgr-status');
      if (result.success) {
        if (statusEl) setText(statusEl, t('importSuccess', { count: result.imported }));
        renderAlertLists();
      } else {
        if (statusEl) setText(statusEl, t('importFail'));
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

// ─── Trigger dialog ─────────────────────────────────────────────────────────

function buildTriggerDialog() {
  const dialog = document.createElement('dialog');
  dialog.className = 'alert-mgr-trigger-dialog';
  dialog.id = 'alert-mgr-trigger-dialog';
  dialog.setAttribute('aria-labelledby', 'alert-trigger-title');

  const content = el('div', { class: 'alert-mgr-trigger-content' });
  const titleEl = el('h2', { id: 'alert-trigger-title', class: 'alert-mgr-trigger-title' });
  const msgEl = el('p', { id: 'alert-trigger-msg', class: 'alert-mgr-trigger-msg' });
  const actionsEl = el('div', { class: 'alert-mgr-trigger-actions' });

  const dismissBtn = el('button', {
    class: 'alert-mgr-btn alert-mgr-btn--outline',
    type: 'button',
    id: 'alert-trigger-dismiss',
  });
  setText(dismissBtn, t('dismiss'));
  dismissBtn.addEventListener('click', () => dialog.close());

  const newAlertBtn = el('button', {
    class: 'alert-mgr-btn alert-mgr-btn--primary',
    type: 'button',
    id: 'alert-trigger-new',
  });
  setText(newAlertBtn, t('setNew'));
  newAlertBtn.addEventListener('click', () => {
    dialog.close();
    openAlertManager();
  });

  actionsEl.append(dismissBtn, newAlertBtn);
  content.append(titleEl, msgEl, actionsEl);
  dialog.append(content);

  // Close on Escape (native dialog handles this, but ensure focus returns)
  dialog.addEventListener('close', () => {
    if (_previousFocus && document.contains(_previousFocus)) {
      _previousFocus.focus();
    }
  });

  return dialog;
}

export function showTriggerDialog(alert, currentPrice) {
  if (!_triggerDialog) {
    _triggerDialog = buildTriggerDialog();
    document.body.appendChild(_triggerDialog);
  }

  const scopeLabels = {
    spot: 'XAU/USD spot',
    uae24: 'UAE 24K AED/g',
    selected: `${alert.karat}K gold`,
  };
  const scopeLabel = scopeLabels[alert.scope] || alert.scope;
  const priceStr = currentPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const targetStr = alert.target.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const titleEl = _triggerDialog.querySelector('#alert-trigger-title');
  const msgEl = _triggerDialog.querySelector('#alert-trigger-msg');
  if (titleEl) setText(titleEl, t('triggered'));
  if (msgEl) {
    setText(msgEl, t('triggeredMsg', { scope: scopeLabel, price: priceStr, target: targetStr }));
  }

  _previousFocus = document.activeElement;
  _triggerDialog.showModal();
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Render the alert manager into a container and wire it to an engine.
 */
export function renderAlertManager(container, engine, lang = 'en') {
  _engine = engine;
  _lang = lang;

  if (_drawer && document.body.contains(_drawer)) {
    // Already mounted — just refresh
    renderAlertLists();
    return;
  }

  _drawer = buildDrawer();
  trapFocus(_drawer.querySelector('.alert-mgr-panel'));
  document.body.appendChild(_drawer);

  // Escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _isOpen) {
      closeAlertManager();
    }
  });

  renderAlertLists();
}

/**
 * Open the alert manager drawer.
 */
export function openAlertManager() {
  if (!_drawer) return;
  _previousFocus = document.activeElement;
  _drawer.hidden = false;
  _drawer.setAttribute('aria-hidden', 'false');
  _isOpen = true;
  // Focus the close button
  requestAnimationFrame(() => {
    const closeBtn = _drawer.querySelector('.alert-mgr-close');
    if (closeBtn) closeBtn.focus();
  });
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
  renderAlertLists();
}

/**
 * Close the alert manager drawer.
 */
export function closeAlertManager() {
  if (!_drawer) return;
  _drawer.hidden = true;
  _drawer.setAttribute('aria-hidden', 'true');
  _isOpen = false;
  document.body.style.overflow = '';
  // Return focus
  if (_previousFocus && document.contains(_previousFocus)) {
    _previousFocus.focus();
  }
}

/**
 * Update language for the alert manager.
 */
export function updateAlertManagerLang(lang) {
  _lang = lang;
  // Rebuild would be needed for full lang switch — for now just refresh lists
  renderAlertLists();
}

/**
 * Refresh the alert list (call after external engine changes).
 */
export function refreshAlertManager() {
  renderAlertLists();
}
