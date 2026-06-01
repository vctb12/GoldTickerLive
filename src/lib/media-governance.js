/**
 * Applies lazy-loading defaults to images and iframes injected after first paint.
 */

export function ensureLazyMedia(root = document) {
  root.querySelectorAll('img:not([loading])').forEach((img) => {
    if (img.getAttribute('fetchpriority') === 'high') return;
    img.loading = 'lazy';
  });

  root.querySelectorAll('iframe:not([loading])').forEach((iframe) => {
    iframe.loading = 'lazy';
    if (!iframe.getAttribute('title') && !iframe.getAttribute('aria-label')) {
      iframe.setAttribute('title', 'Embedded content');
    }
  });
}
