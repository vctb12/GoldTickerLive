import { injectNav, updateNavLang } from '../components/nav.js';
import { injectFooter } from '../components/footer.js';
import { injectTicker, updateTickerLang } from '../components/ticker.js';
import { injectSpotBar, updateSpotBarLang } from '../components/spotBar.js';
import {
  buildSupabaseBrowserClient,
  deleteSavedCalculation,
  deleteSavedShop,
  deleteWatchlistItem,
  getMe,
  importLocalStorageData,
  listSavedCalculations,
  listSavedShops,
  listWatchlist,
} from '../lib/public-account-client.js';
import { cacheKeyUserPrefs } from './dashboard.shared.js';

const params = new URLSearchParams(window.location.search);
let lang = params.get('lang') === 'ar' ? 'ar' : 'en';

const T = {
  en: {
    authRequired: 'Please sign in first.',
    loaded: 'Dashboard refreshed.',
    importing: 'Importing local browser data…',
    delete: 'Delete',
    empty: 'No saved items yet.',
    refreshFailed: 'Could not refresh dashboard right now.',
    importFailed: 'Import failed. Please try again.',
    signOutFailed: 'Could not sign out right now.',
    loadFailed: 'Could not load dashboard right now.',
    importDone: (r) =>
      `Import complete. Preferences: ${r.preferences ? 'yes' : 'no'}, watchlist: ${r.watchlist}, alerts: ${r.alerts}, shops: ${r.savedShops}, calculations: ${r.savedCalculations}, failed: ${r.failed || 0}.`,
  },
  ar: {
    authRequired: 'يرجى تسجيل الدخول أولاً.',
    loaded: 'تم تحديث لوحة التحكم.',
    importing: 'جارٍ استيراد بيانات المتصفح المحلية…',
    delete: 'حذف',
    empty: 'لا توجد عناصر محفوظة بعد.',
    refreshFailed: 'تعذر تحديث لوحة التحكم حالياً.',
    importFailed: 'فشل الاستيراد. يرجى المحاولة مرة أخرى.',
    signOutFailed: 'تعذر تسجيل الخروج حالياً.',
    loadFailed: 'تعذر تحميل لوحة التحكم حالياً.',
    importDone: (r) =>
      `اكتمل الاستيراد. التفضيلات: ${r.preferences ? 'نعم' : 'لا'}، المراقبة: ${r.watchlist}، التنبيهات: ${r.alerts}، المحلات: ${r.savedShops}، الحاسبات: ${r.savedCalculations}، الفاشلة: ${r.failed || 0}.`,
  },
};

function tx(key, arg) {
  const value = T[lang]?.[key] || T.en[key] || key;
  return typeof value === 'function' ? value(arg) : value;
}

function setStatus(message) {
  const node = document.getElementById('dashboard-status');
  if (node) node.textContent = message;
}

function setLang(nextLang) {
  lang = nextLang === 'ar' ? 'ar' : 'en';
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  try {
    const prefs = JSON.parse(localStorage.getItem(cacheKeyUserPrefs()) || '{}');
    prefs.lang = lang;
    localStorage.setItem(cacheKeyUserPrefs(), JSON.stringify(prefs));
  } catch {
    // no-op
  }
}

function renderList(containerId, items, onDelete) {
  const list = document.getElementById(containerId);
  if (!list) return;
  list.replaceChildren();
  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = tx('empty');
    list.append(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');
    const copy = document.createElement('span');
    copy.textContent =
      item.label || item.item_label || item.shop_name || item.tool || item.item_key;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-ghost btn-sm';
    btn.textContent = tx('delete');
    btn.addEventListener('click', () => {
      Promise.resolve(onDelete(item.id)).catch(() => {
        setStatus(tx('refreshFailed'));
      });
    });
    li.append(copy, btn);
    list.append(li);
  });
}

async function refreshDashboard() {
  const me = await getMe();
  const [calculations, watchlist, shops] = await Promise.all([
    listSavedCalculations(),
    listWatchlist(),
    listSavedShops(),
  ]);

  const preferences = document.getElementById('dashboard-preferences');
  if (preferences) {
    preferences.textContent = JSON.stringify(me.preferences || {}, null, 2);
  }

  renderList('dashboard-calculations', calculations.items || [], async (id) => {
    await deleteSavedCalculation(id);
    await refreshDashboard();
  });
  renderList('dashboard-watchlist', watchlist.items || [], async (id) => {
    await deleteWatchlistItem(id);
    await refreshDashboard();
  });
  renderList('dashboard-shops', shops.items || [], async (id) => {
    await deleteSavedShop(id);
    await refreshDashboard();
  });
  setStatus(tx('loaded'));
}

async function init() {
  setLang(lang);
  injectSpotBar(lang, 0);
  const nav = injectNav(lang, 0);
  injectFooter(lang, 0);
  injectTicker(lang, 0);

  nav.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      setLang(lang === 'en' ? 'ar' : 'en');
      updateNavLang(lang);
      updateTickerLang(lang);
      updateSpotBarLang(lang);
    });
  });

  const sb = buildSupabaseBrowserClient();
  if (!sb) {
    setStatus('Supabase client unavailable. Check configuration.');
    return;
  }

  const session = await sb.auth.getSession().catch(() => null);
  if (!session?.data?.session?.access_token) {
    setStatus(tx('authRequired'));
    window.location.href = '/account.html';
    return;
  }

  document.getElementById('dashboard-refresh-btn')?.addEventListener('click', async () => {
    try {
      await refreshDashboard();
    } catch {
      setStatus(tx('refreshFailed'));
    }
  });
  document.getElementById('dashboard-signout-btn')?.addEventListener('click', async () => {
    try {
      await sb.auth.signOut();
      window.location.href = '/account.html';
    } catch {
      setStatus(tx('signOutFailed'));
    }
  });
  document.getElementById('dashboard-import-btn')?.addEventListener('click', async () => {
    try {
      setStatus(tx('importing'));
      const result = await importLocalStorageData();
      setStatus(tx('importDone', result));
      await refreshDashboard();
    } catch {
      setStatus(tx('importFailed'));
    }
  });

  try {
    await refreshDashboard();
  } catch {
    setStatus(tx('loadFailed'));
  }
}

init();
