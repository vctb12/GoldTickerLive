import { buildCanonicalUrl, normalizePathname } from './canonical.js';

export function buildHreflangAlternates(pathname = '/') {
  const normalized = normalizePathname(pathname);
  const canonical = buildCanonicalUrl(normalized);
  return [
    { hreflang: 'x-default', href: canonical },
    { hreflang: 'en', href: canonical },
    { hreflang: 'ar', href: `${canonical}?lang=ar` },
  ];
}

export function enforceHreflangAlternates(doc = document, pathname = window.location.pathname) {
  const alternates = buildHreflangAlternates(pathname);
  doc.querySelectorAll('link[rel="alternate"][hreflang]').forEach((node) => node.remove());
  alternates.forEach((item) => {
    const link = doc.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', item.hreflang);
    link.setAttribute('href', item.href);
    doc.head.appendChild(link);
  });
  return alternates;
}
