/**
 * Learn hub guide cards — categories, read time, difficulty.
 * User-visible titles/descriptions use translation keys where noted.
 */

// The standalone guide pages under content/ were retired. Each surviving card
// now deep-links into the matching learn.html hub section (in-page anchor).
// Cards whose topic had no learn.html section were dropped.
export const LEARN_GUIDE_CATEGORIES = Object.freeze([
  {
    id: 'start',
    titleKey: 'learn.cat.start',
    descKey: 'learn.cat.startDesc',
    guides: [
      {
        href: '/learn.html#karats',
        titleKey: 'learn.card.karatTitle',
        descKey: 'learn.card.karatDesc',
        readMin: 8,
        level: 'beginner',
      },
      {
        href: '/learn.html#pricing',
        titleKey: 'learn.card.spotRetailTitle',
        descKey: 'learn.card.spotRetailDesc',
        readMin: 6,
        level: 'beginner',
      },
    ],
  },
  {
    id: 'buying',
    titleKey: 'learn.cat.buying',
    descKey: 'learn.cat.buyingDesc',
    guides: [
      {
        href: '/learn.html#pricing',
        titleKey: 'learn.card.makingTitle',
        descKey: 'learn.card.makingDesc',
        readMin: 6,
        level: 'intermediate',
      },
      {
        href: '/learn.html#hallmark',
        titleKey: 'learn.card.hallmarksTitle',
        descKey: 'learn.card.hallmarksDesc',
        readMin: 6,
        level: 'beginner',
      },
    ],
  },
  {
    id: 'invest',
    titleKey: 'learn.cat.invest',
    descKey: 'learn.cat.investDesc',
    guides: [
      {
        href: '/learn.html#invest',
        titleKey: 'learn.card.investTitle',
        descKey: 'learn.card.investDesc',
        readMin: 10,
        level: 'beginner',
      },
      {
        href: '/learn.html#planner',
        titleKey: 'learn.card.savingsTitle',
        descKey: 'learn.card.savingsDesc',
        readMin: 9,
        level: 'intermediate',
      },
    ],
  },
  {
    id: 'gcc',
    titleKey: 'learn.cat.gcc',
    descKey: 'learn.cat.gccDesc',
    guides: [
      {
        href: '/learn.html#compare',
        titleKey: 'learn.card.gccCompareTitle',
        descKey: 'learn.card.gccCompareDesc',
        readMin: 7,
        level: 'intermediate',
      },
      {
        href: '/learn.html#aed-peg',
        titleKey: 'learn.card.pegTitle',
        descKey: 'learn.card.pegDesc',
        readMin: 5,
        level: 'beginner',
      },
      {
        href: '/learn.html#markets',
        titleKey: 'learn.card.hoursTitle',
        descKey: 'learn.card.hoursDesc',
        readMin: 5,
        level: 'beginner',
      },
    ],
  },
]);

export const LEARN_PROGRESS_KEY = 'gtl_learn_guides_read';

export function getLearnProgress() {
  try {
    const raw = localStorage.getItem(LEARN_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markGuideRead(href) {
  const list = getLearnProgress();
  if (!list.includes(href)) {
    list.push(href);
    try {
      localStorage.setItem(LEARN_PROGRESS_KEY, JSON.stringify(list.slice(-50)));
    } catch {
      // ignore quota/access errors — progress tracking is best-effort
    }
  }
}

export function countTotalGuides() {
  return LEARN_GUIDE_CATEGORIES.reduce((n, c) => n + c.guides.length, 0);
}

/**
 * How many featured guide CARDS count as read, given the stored progress list.
 *
 * Counts cards (not unique hrefs) so the tally can reach the copy's "of 9" total
 * and stays consistent with the per-card read styling: two cards that deep-link to
 * the same anchor (e.g. both `#pricing` cards) both flip to read when that anchor
 * is visited. Naturally deduped (Set) and capped at the total (iterates the fixed
 * catalog), so re-visits never double-count and the value can never exceed 9 of 9.
 * Unknown/stale stored ids are ignored.
 */
export function countReadGuides(readList) {
  const read = new Set(Array.isArray(readList) ? readList : []);
  return LEARN_GUIDE_CATEGORIES.reduce(
    (n, cat) => n + cat.guides.filter((g) => read.has(g.href)).length,
    0
  );
}

/**
 * Resolve an in-page hash (e.g. `#karats`) to the canonical guide href
 * (`/learn.html#karats`) when it matches a featured guide, else null. Lets the hub
 * mark a guide read from a deep link or back/forward navigation, where the guide
 * cards are same-document anchors rather than standalone pages.
 */
export function guideHrefForHash(hash) {
  if (!hash || hash.length < 2) return null;
  const href = `/learn.html${hash}`;
  const known = LEARN_GUIDE_CATEGORIES.some((c) => c.guides.some((g) => g.href === href));
  return known ? href : null;
}
