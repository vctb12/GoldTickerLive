/**
* Learn hub guide cards — categories, read time, difficulty.
* User-visible titles/descriptions use translation keys where noted.
*/

// The standalone guide pages under content/ were retired. Each surviving card
// now deep-links into the matching learn.html hub section (in-page anchor).
// Cards whose topic had no learn.html section were dropped.
//
// `id` is the read-progress tracking key (stable per card, unique across the
// catalog). It is intentionally separate from `href`: two cards can point to
// the same learn.html anchor (e.g. "Spot vs retail" and "Making charges" both
// live under #pricing) without colliding in the reader's progress count.
export const LEARN_GUIDE_CATEGORIES = Object.freeze([
  {
    id: 'start',
    titleKey: 'learn.cat.start',
    descKey: 'learn.cat.startDesc',
    guides: [
      {
        id: 'karats',
        href: '/learn.html#karats',
        titleKey: 'learn.card.karatTitle',
        descKey: 'learn.card.karatDesc',
        readMin: 8,
        level: 'beginner',
      },
      {
        id: 'spot-retail',
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
        id: 'making-charges',
        href: '/learn.html#pricing',
        titleKey: 'learn.card.makingTitle',
        descKey: 'learn.card.makingDesc',
        readMin: 6,
        level: 'intermediate',
      },
      {
        id: 'hallmarks',
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
        id: 'invest-basics',
        href: '/learn.html#invest',
        titleKey: 'learn.card.investTitle',
        descKey: 'learn.card.investDesc',
        readMin: 10,
        level: 'beginner',
      },
      {
        id: 'savings-planner',
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
        id: 'gcc-compare',
        href: '/learn.html#compare',
        titleKey: 'learn.card.gccCompareTitle',
        descKey: 'learn.card.gccCompareDesc',
        readMin: 7,
        level: 'intermediate',
      },
      {
        id: 'aed-peg',
        href: '/learn.html#aed-peg',
        titleKey: 'learn.card.pegTitle',
        descKey: 'learn.card.pegDesc',
        readMin: 5,
        level: 'beginner',
      },
      {
        id: 'market-hours',
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

/**
* Read the set of guide ids the reader has already visited. Best-effort:
* returns [] (never throws) when localStorage is unavailable (private
* browsing, storage disabled, quota errors, etc.) so the hub always renders.
*/
export function getLearnProgress() {
  try {
    const raw = localStorage.getItem(LEARN_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
* Mark a guide as read by its catalog `id` (NOT its `href` — hrefs are
* shared between some cards, ids are unique per card). No-ops if the id is
* already recorded, and best-effort no-throw when storage is unavailable.
*/
export function markGuideRead(id) {
  if (!id) return;
  const list = getLearnProgress();
  if (!list.includes(id)) {
    list.push(id);
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

/** Every guide across every category, flattened, for lookups by id/href. */
export function getAllGuides() {
  return LEARN_GUIDE_CATEGORIES.flatMap((c) => c.guides);
}

/**
* Count how many of the catalog's guides (by unique id) are marked read.
* Filters out any stale/unknown ids so old localStorage entries (or a
* retired guide) can never inflate the count past the current catalog size.
*/
export function countReadGuides() {
  const ids = new Set(getAllGuides().map((g) => g.id));
  return getLearnProgress().filter((id) => ids.has(id)).length;
}
