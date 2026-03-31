// tracker/ui-shell.js
import { injectNav, updateNavLang } from '../components/nav.js';
import { injectFooter } from '../components/footer.js';
import { injectTicker, updateTicker, updateTickerLang } from '../components/ticker.js';
import { syncUrlFromState, persistState } from './state.js';

export function mountShell(state, els, onModeChange, onLangChange) {
  // Mount shared shell
  const navCtrl = injectNav(state.lang, 0);
  navCtrl.getLangToggleButtons().forEach(btn => {
    btn.addEventListener('click', () => {
      state.lang = state.lang === 'en' ? 'ar' : 'en';
      persistState(state);
      document.documentElement.lang = state.lang;
      document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
      updateNavLang(state.lang);
      updateTickerLang(state.lang);
      if (els.language) els.language.value = state.lang;
      onLangChange();
    });
  });

  injectFooter(state.lang, 0);
  injectTicker(state.lang, 0);

  // Wire mode tabs
  const tabs = Array.from(document.querySelectorAll('.tracker-mode-tab'));
  const panels = Array.from(document.querySelectorAll('.tracker-mode-panel'));

  function setMode(mode) {
    state.mode = mode;
    tabs.forEach(tab => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach(panel => {
      const active = panel.dataset.modePanel === mode;
      panel.hidden = !active;
    });
    persistState(state);
    syncUrlFromState(state);
    if (typeof onModeChange === 'function') onModeChange(mode);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
  });

  // Initial mode selection
  setMode(state.mode || 'live');

  // Keyboard shortcuts
  window.addEventListener('keydown', evt => {
    if (evt.altKey || evt.metaKey || evt.ctrlKey) return;
    const key = evt.key.toLowerCase();
    if (key === 'r') {
      els.refreshBtn?.click();
    } else if (key === 'h') {
      setMode('live');
    } else if (key === 'c') {
      setMode('compare');
    } else if (key === 'a') {
      setMode('alerts');
    } else if (key === 'p') {
      setMode('planner');
    } else if (key === 'x') {
      setMode('exports');
    } else if (key === 'm') {
      setMode('method');
    }
  });

  return { setMode };
}

export function updateShellTickerFromState(state, spot, priceFor) {
  if (!spot) return;
  updateTicker({
    xauUsd: spot,
    uae24k: priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot }),
    uae22k: priceFor({ currency: 'AED', karat: '22', unit: 'gram', spot }),
    uae21k: priceFor({ currency: 'AED', karat: '21', unit: 'gram', spot }),
    uae18k: priceFor({ currency: 'AED', karat: '18', unit: 'gram', spot }),
  });
}
