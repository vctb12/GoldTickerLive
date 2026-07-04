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
