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

  function setView(view) {
    state.view = view;
    // When switching views, close any open tool
    state.activeTool = null;
    updateTabsAndPanels();
    persistState(state);
    syncUrlFromState(state);
    if (typeof onModeChange === 'function') onModeChange(`view:${view}`);
  }

  function setActiveTool(tool) {
    // Toggle tool: clicking active tool closes it, clicking different tool switches to that tool
    state.activeTool = state.activeTool === tool ? null : tool;
    updateTabsAndPanels();
    persistState(state);
    syncUrlFromState(state);
    if (typeof onModeChange === 'function') onModeChange(`tool:${state.activeTool}`);
  }

  function updateTabsAndPanels() {
    tabs.forEach(tab => {
      const modeValue = tab.dataset.mode;
      const isViewTab = ['live', 'archive', 'compare'].includes(modeValue);
      const isToolTab = ['alerts', 'planner'].includes(modeValue);

      let isActive = false;
      if (isViewTab && modeValue === state.view && !state.activeTool) {
        isActive = true;
      } else if (isToolTab && modeValue === state.activeTool) {
        isActive = true;
      }

      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach(panel => {
      const modeValue = panel.dataset.modePanel;
      const isViewPanel = ['live', 'archive', 'compare'].includes(modeValue);
      const isToolPanel = ['alerts', 'planner'].includes(modeValue);

      let isActive = false;
      if (isViewPanel && modeValue === state.view) {
        isActive = true;
      } else if (isToolPanel && modeValue === state.activeTool) {
        isActive = true;
      }

      panel.hidden = !isActive;
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      if (['live', 'archive', 'compare'].includes(mode)) {
        setView(mode);
      } else if (['alerts', 'planner'].includes(mode)) {
        setActiveTool(mode);
      }
    });
  });

  // Initial mode selection
  updateTabsAndPanels();

  // Keyboard shortcuts
  window.addEventListener('keydown', evt => {
    if (evt.altKey || evt.metaKey || evt.ctrlKey) return;
    const key = evt.key.toLowerCase();
    if (key === 'r') {
      els.refreshBtn?.click();
    } else if (key === 'h') {
      setView('live');
    } else if (key === 'c') {
      setView('compare');
    } else if (key === 'a') {
      setActiveTool('alerts');
    } else if (key === 'p') {
      setActiveTool('planner');
    }
  });

  return { setView, setActiveTool, updateTabsAndPanels };
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
