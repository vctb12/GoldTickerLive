/**
 * Learn hub category grid, filter, and read progress (localStorage).
 *
 * Reliability contract: the guide cards are authored as a static, always-visible
 * fallback in learn.html (see scripts/node/render-learn-static-fallback.mjs). This
 * module re-renders them for interactivity and language, but must NEVER leave the
 * hub blank. Cards use the sitewide `[data-reveal]` fade-in (opacity:0 until
 * `.is-in-view`); after every render we (a) explicitly observe the new nodes and
 * (b) run an in-viewport safety net that force-reveals anything still hidden, so a
 * stale/slow chunk that breaks the global reveal boot can no longer produce the
 * "Read 0 of N featured guides" empty state.
 */

import { TRANSLATIONS } from '../config/translations.js';
import {
  LEARN_GUIDE_CATEGORIES,
  countTotalGuides,
  countReadGuides,
  guideHrefForHash,
  getLearnProgress,
  markGuideRead,
} from '../config/learn-hub-catalog.js';
import { el } from '../lib/safe-dom.js';
import { observeReveal } from '../lib/reveal.js';

// One live `hashchange` listener at a time — remounts (language toggle) replace it
// rather than stacking duplicates.
let activeHashHandler = null;

function t(lang, key, vars = {}) {
  let s = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  Object.entries(vars).forEach(([k, v]) => {
    s = s.replace(`{${k}}`, String(v));
  });
  return s;
}

function renderGuideCard(guide, lang) {
  const href = guide.href.startsWith('/') ? guide.href : `/${guide.href}`;
  const read = getLearnProgress().includes(guide.href);
  return el(
    'a',
    {
      href,
      // Canonical identity for read-tracking. Stored/compared verbatim so the
      // counter round-trips across reloads (an earlier slash-stripped id never
      // matched the catalog and left "Read 0 of 9" stuck at zero).
      'data-guide-href': guide.href,
      class: `card card--bordered learn-guide-card card-interactive${read ? ' learn-guide-card--read' : ''}`,
    },
    [
      el('div', { class: 'learn-guide-card__meta' }, [
        el(
          'span',
          { class: `badge badge--${guide.level === 'beginner' ? 'info' : 'neutral'}` },
          t(lang, `learn.level.${guide.level}`)
        ),
        el(
          'span',
          { class: 'learn-guide-card__time' },
          t(lang, 'learn.readMin', { n: guide.readMin })
        ),
      ]),
      el('h3', { class: 'learn-guide-card__title' }, t(lang, guide.titleKey)),
      el('p', { class: 'learn-guide-card__desc' }, t(lang, guide.descKey)),
      el(
        'span',
        { class: 'learn-guide-card__cta', 'aria-hidden': 'true' },
        t(lang, 'learn.card.cta')
      ),
    ]
  );
}

/**
 * Guarantee the hub is never blank: observe the freshly-rendered `[data-reveal]`
 * nodes, then force-reveal any that are already in the viewport but still hidden
 * (the failure signature of a broken reveal boot). Below-fold cards keep their
 * scroll-reveal animation.
 */
function ensureRevealed(root) {
  try {
    observeReveal(root);
  } catch {
    /* reveal is a progressive enhancement — never block the hub */
  }
  const forceInViewport = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    root.querySelectorAll('[data-reveal]:not(.is-in-view)').forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.top < vh && rect.bottom > 0) node.classList.add('is-in-view');
    });
  };
  // Run shortly after paint, and again as a hard fallback, in case the shared
  // IntersectionObserver never initialised (e.g. a stale hashed chunk on deploy).
  requestAnimationFrame(forceInViewport);
  setTimeout(forceInViewport, 600);
}

/**
 * @param {{ lang: 'en'|'ar', container: string|HTMLElement }} options
 */
export function mountLearnHubCatalog(options) {
  const lang = options.lang === 'ar' ? 'ar' : 'en';
  const root =
    typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;
  if (!root) return;

  const total = countTotalGuides();
  const readCount = countReadGuides(getLearnProgress());

  const eyebrow = el('p', { class: 'learn-hub-eyebrow' }, t(lang, 'learn.hubEyebrow'));
  const intro = el('p', { class: 'learn-hub-intro' }, t(lang, 'learn.hubIntro'));
  const progress = el(
    'p',
    { class: 'learn-hub-progress', 'aria-live': 'polite' },
    t(lang, 'learn.progress', { read: readCount, total })
  );

  const filter = el('input', {
    type: 'search',
    class: 'learn-hub-filter',
    placeholder: t(lang, 'learn.filterPlaceholder'),
    'aria-label': t(lang, 'learn.filterPlaceholder'),
  });

  const sectionsHost = el('div', { class: 'learn-hub-sections' });
  const emptyState = el(
    'p',
    { class: 'learn-hub-empty', hidden: 'until-found' },
    t(lang, 'learn.filterEmpty')
  );
  emptyState.hidden = true;

  function renderSections(query = '') {
    const q = query.trim().toLowerCase();
    const sections = LEARN_GUIDE_CATEGORIES.map((cat) => {
      const guides = cat.guides.filter((g) => {
        if (!q) return true;
        const title = t(lang, g.titleKey).toLowerCase();
        const desc = t(lang, g.descKey).toLowerCase();
        return title.includes(q) || desc.includes(q);
      });
      if (!guides.length) return null;
      return el('section', { class: 'learn-hub-category', 'data-reveal': '' }, [
        el('h2', { class: 'learn-hub-category__title' }, t(lang, cat.titleKey)),
        el('p', { class: 'learn-hub-category__desc' }, t(lang, cat.descKey)),
        el(
          'div',
          { class: 'learn-hub-grid' },
          guides.map((g, index) => {
            const card = renderGuideCard(g, lang);
            card.setAttribute('data-reveal', '');
            card.setAttribute('data-reveal-delay', String(Math.min(index + 1, 6)));
            return card;
          })
        ),
      ]);
    }).filter(Boolean);

    sectionsHost.replaceChildren(...sections);
    emptyState.hidden = sections.length > 0;
    ensureRevealed(root);
  }

  filter.addEventListener('input', () => renderSections(filter.value));

  // Defensive (shell-reliability #496): never replace the server-rendered static
  // fallback with an empty guide list. If the catalog data resolves to zero
  // guides (e.g. a partial deploy with a stale chunk), keep the static cards
  // already in `root` rather than blanking the featured-guides area.
  if (!total) return;

  root.replaceChildren(
    el('section', { class: 'learn-hub-catalog card card--bordered' }, [
      eyebrow,
      intro,
      progress,
      filter,
      sectionsHost,
      emptyState,
      el('div', { class: 'learn-hub-related-row' }, [
        el('span', { class: 'learn-hub-related-label' }, t(lang, 'learn.relatedLabel')),
        // Root-relative hrefs: safe-dom's safeHref() drops bare-relative URLs
        // ("calculator.html"), which would silently render these as dead
        // (href-less) links after hydration. Leading "/" keeps them clickable.
        el(
          'a',
          { href: '/calculator.html', class: 'related-tool-link' },
          t(lang, 'learn.relatedCalc')
        ),
        el(
          'a',
          { href: '/glossary.html', class: 'related-tool-link' },
          t(lang, 'learn.relatedGlossary')
        ),
        el(
          'a',
          { href: '/market.html', class: 'related-tool-link' },
          t(lang, 'learn.relatedMarket')
        ),
        el(
          'a',
          { href: '/methodology.html', class: 'related-tool-link' },
          t(lang, 'learn.relatedMethod')
        ),
      ]),
    ])
  );

  renderSections();

  // Read-progress tracking. The guide cards deep-link to in-page anchors
  // (e.g. /learn.html#karats), so a click is a same-document hash navigation that
  // does NOT reload the page — the counter must update live here, and also
  // recompute from storage on the next full load. Stored ids are the canonical
  // `guide.href` so they match the catalog on read-back.
  function refreshReadState() {
    const read = new Set(getLearnProgress());
    root.querySelectorAll('.learn-guide-card').forEach((card) => {
      const cardHref = card.getAttribute('data-guide-href');
      card.classList.toggle('learn-guide-card--read', Boolean(cardHref) && read.has(cardHref));
    });
    progress.textContent = t(lang, 'learn.progress', {
      read: countReadGuides([...read]),
      total,
    });
  }

  // Delegated click handler on the per-render sections host: survives filter
  // re-renders and language remounts without stranding or leaking listeners.
  sectionsHost.addEventListener('click', (event) => {
    const card = event.target?.closest?.('.learn-guide-card');
    if (!card || !sectionsHost.contains(card)) return;
    const cardHref = card.getAttribute('data-guide-href');
    if (!cardHref) return;
    markGuideRead(cardHref);
    refreshReadState();
  });

  // Also mark a guide read when its anchor becomes the active hash — covers deep
  // links (/learn.html#karats opened directly) and browser back/forward, where no
  // card click fires. Idempotent (markGuideRead dedupes); one listener at a time.
  if (activeHashHandler) window.removeEventListener('hashchange', activeHashHandler);
  activeHashHandler = () => {
    const href = guideHrefForHash(location.hash);
    if (!href) return;
    markGuideRead(href);
    refreshReadState();
  };
  window.addEventListener('hashchange', activeHashHandler);
  activeHashHandler();

  // Belt-and-suspenders: guarantee the whole hub is visible after mount.
  ensureRevealed(root);
}
