import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';
import { BASE_PATH } from '../config/index.js';

function getShellDepth() {
  const basePath = String(BASE_PATH || '/').replace(/\/+$/, '');
  let pathname = window.location.pathname || '/';
  if (basePath && pathname.startsWith(`${basePath}/`)) {
    pathname = pathname.slice(basePath.length);
  }
  const normalized = pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
  return normalized.split('/').filter(Boolean).length;
}

function init() {
  const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  mountSharedShell({ lang, depth: getShellDepth(), withSpotBar: true });
  injectBreadcrumbs('methodology');
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init, { once: true });
}
