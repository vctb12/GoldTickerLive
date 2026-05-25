import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';

function init() {
  const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  mountSharedShell({ lang, depth: 0, withSpotBar: true });
  injectBreadcrumbs('methodology');
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init, { once: true });
}
