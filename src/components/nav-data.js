// components/nav-data.js — single source of truth for public navigation IA.
// The shared nav, mobile drawer, footer sitemap, active states, and page shell
// accents all derive from this file.
//
// 2026-07-04 owner-ordered IA reset: the site consolidated from ~360 HTML
// pages to 9 meaningful surfaces (docs/plans/2026-07-04_radical-page-reduction.md).
// The nav is now a flat bar of primary links + the Live Tracker CTA; the single
// `explore` group below is marked `footerOnly` — it feeds the footer sitemap
// columns and the mobile drawer, but is NOT rendered as a desktop dropdown.

function flattenGroups(locale) {
  // Keep authored groups section-based for footer/drawer rendering while
  // preserving the flat `items` array consumed by active-state logic and tests.
  return {
    ...locale,
    groups: locale.groups.map((group) => ({
      ...group,
      items: group.sections.flatMap((section) => section.items),
    })),
  };
}

const RAW_NAV_DATA = {
  en: {
    home: {
      href: '/index.html',
      label: 'Home',
      description: 'Platform overview and price snapshot',
    },
    shops: {
      href: '/shops.html',
      label: 'Shops',
      description: 'Find gold shops and market areas',
      primary: true,
    },
    primaryLinks: [
      {
        key: 'calculator',
        href: '/calculator.html',
        label: 'Calculator',
        description: 'Calculate value by weight and karat',
        primary: true,
      },
      {
        key: 'compare',
        href: '/compare.html',
        label: 'Compare',
        description: 'Cross-country reference comparison',
        primary: true,
      },
      {
        key: 'heatmap',
        href: '/heatmap.html',
        label: 'World Map',
        description: 'Retail-estimate heatmap by country',
      },
      {
        key: 'portfolio',
        href: '/portfolio.html',
        label: 'Portfolio',
        description: 'Private holdings valuation',
      },
      {
        key: 'shops',
        href: '/shops.html',
        label: 'Shops',
        description: 'Find gold shops and market areas',
      },
      {
        key: 'learn',
        href: '/learn.html',
        label: 'Learn',
        description: 'Guides, karats and market basics',
      },
    ],
    canonicalSurfaces: [
      '/index.html',
      '/tracker.html',
      '/calculator.html',
      '/compare.html',
      '/heatmap.html',
      '/portfolio.html',
      '/shops.html',
      '/learn.html',
      '/methodology.html',
    ],
    groups: [
      {
        key: 'explore',
        label: 'Explore',
        eyebrow: 'All surfaces',
        description: 'Every tool and reference surface on the site.',
        layout: 'one-col',
        footerOnly: true,
        sections: [
          {
            key: 'tools',
            label: 'Price tools',
            description: 'Live reference prices and calculators.',
            items: [
              {
                href: '/tracker.html',
                label: 'Live tracker',
                description: 'Main price workspace',
                icon: 'LIVE',
                primary: true,
              },
              {
                href: '/calculator.html',
                label: 'Gold calculator',
                description: 'Weight, karat, AED and USD',
                icon: 'CALC',
              },
              {
                href: '/portfolio.html',
                label: 'Portfolio tracker',
                description: 'Private holdings valuation',
                icon: 'PORT',
              },
            ],
          },
          {
            key: 'markets',
            label: 'Markets',
            description: 'Compare reference prices across countries.',
            items: [
              {
                href: '/compare.html',
                label: 'Compare countries',
                description: 'Sortable cross-country price tool',
                icon: 'CMP',
                primary: true,
              },
              {
                href: '/heatmap.html',
                label: 'World map',
                description: 'Retail-estimate heatmap by country',
                icon: 'MAP',
              },
              {
                href: '/shops.html',
                label: 'Shops directory',
                description: 'Find gold shops and market areas',
                icon: 'GLB',
              },
            ],
          },
          {
            key: 'trust',
            label: 'Learn & trust',
            description: 'How prices work and what karats mean.',
            items: [
              {
                href: '/learn.html',
                label: 'Learn hub',
                description: 'Guides, insights and investing basics',
                icon: '24K',
                primary: true,
              },
              {
                href: '/learn.html#karats',
                label: 'Karat guide',
                description: 'Purity, pricing, and usage',
                icon: '22K',
              },
              {
                href: '/glossary.html',
                label: 'Gold glossary',
                description: 'Key terms explained',
                icon: 'ABC',
              },
              {
                href: '/methodology.html',
                label: 'Methodology',
                description: 'Sources, formulas and limits',
                icon: 'MTH',
              },
            ],
          },
        ],
      },
    ],
    langToggle: 'العربية',
    langToggleLabel: 'Switch to Arabic',
    searchLabel: 'Search',
    searchPlaceholder: 'Search countries, karats, tools…',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    mainNav: 'Main navigation',
    skipLink: 'Skip to main content',
    brandLabel: 'Gold Ticker Live Home',
    brandSub: 'Reference Prices · GCC',
    recentSearches: 'Recent searches',
    ctaLabel: 'Live Tracker',
    drawerCtaLabel: 'Live Tracker →',
    drawerSearchPlaceholder: 'Search countries, prices…',
    themeLabels: {
      auto: 'Theme: auto (click to switch to light)',
      light: 'Theme: light (click to switch to dark)',
      dark: 'Theme: dark (click to switch to auto)',
    },
  },

  ar: {
    home: { href: '/index.html', label: 'الرئيسية', description: 'نظرة عامة على المنصة والأسعار' },
    shops: {
      href: '/shops.html',
      label: 'المحلات',
      description: 'ابحث عن محلات ومناطق أسواق الذهب',
      primary: true,
    },
    primaryLinks: [
      {
        key: 'calculator',
        href: '/calculator.html',
        label: 'الحاسبة',
        description: 'احسب القيمة حسب الوزن والعيار',
        primary: true,
      },
      {
        key: 'compare',
        href: '/compare.html',
        label: 'قارن',
        description: 'مقارنة مرجعية بين الدول',
        primary: true,
      },
      {
        key: 'heatmap',
        href: '/heatmap.html',
        label: 'خريطة العالم',
        description: 'خريطة حرارية لتقديرات التجزئة حسب الدولة',
      },
      {
        key: 'portfolio',
        href: '/portfolio.html',
        label: 'المحفظة',
        description: 'تقييم خاص لمقتنياتك من الذهب',
      },
      {
        key: 'shops',
        href: '/shops.html',
        label: 'المحلات',
        description: 'ابحث عن محلات ومناطق أسواق الذهب',
      },
      {
        key: 'learn',
        href: '/learn.html',
        label: 'تعلّم',
        description: 'أدلة وعيارات وأساسيات السوق',
      },
    ],
    canonicalSurfaces: [
      '/index.html',
      '/tracker.html',
      '/calculator.html',
      '/compare.html',
      '/heatmap.html',
      '/portfolio.html',
      '/shops.html',
      '/learn.html',
      '/methodology.html',
    ],
    groups: [
      {
        key: 'explore',
        label: 'استكشف',
        eyebrow: 'كل الصفحات',
        description: 'كل أداة وصفحة مرجعية في الموقع.',
        layout: 'one-col',
        footerOnly: true,
        sections: [
          {
            key: 'tools',
            label: 'أدوات الأسعار',
            description: 'أسعار مرجعية حية وحاسبات.',
            items: [
              {
                href: '/tracker.html',
                label: 'المتتبع المباشر',
                description: 'مساحة الأسعار الرئيسية',
                icon: 'LIVE',
                primary: true,
              },
              {
                href: '/calculator.html',
                label: 'حاسبة الذهب',
                description: 'الوزن والعيار والدرهم والدولار',
                icon: 'CALC',
              },
              {
                href: '/portfolio.html',
                label: 'متتبع المحفظة',
                description: 'تقييم خاص لمقتنياتك من الذهب',
                icon: 'PORT',
              },
            ],
          },
          {
            key: 'markets',
            label: 'الأسواق',
            description: 'قارن الأسعار المرجعية بين الدول.',
            items: [
              {
                href: '/compare.html',
                label: 'قارن الدول',
                description: 'أداة مقارنة الأسعار بين الدول',
                icon: 'CMP',
                primary: true,
              },
              {
                href: '/heatmap.html',
                label: 'خريطة العالم',
                description: 'خريطة حرارية لتقديرات التجزئة حسب الدولة',
                icon: 'MAP',
              },
              {
                href: '/shops.html',
                label: 'دليل المحلات',
                description: 'ابحث عن محلات ومناطق أسواق الذهب',
                icon: 'GLB',
              },
            ],
          },
          {
            key: 'trust',
            label: 'التعلم والثقة',
            description: 'كيف تعمل الأسعار وماذا تعني العيارات.',
            items: [
              {
                href: '/learn.html',
                label: 'مركز التعلم',
                description: 'أدلة ورؤى وأساسيات الاستثمار',
                icon: '24K',
                primary: true,
              },
              {
                href: '/learn.html#karats',
                label: 'دليل العيارات',
                description: 'النقاء والتسعير والاستخدامات',
                icon: '22K',
              },
              {
                href: '/glossary.html',
                label: 'مسرد المصطلحات',
                description: 'شرح المصطلحات الرئيسية',
                icon: 'ABC',
              },
              {
                href: '/methodology.html',
                label: 'المنهجية',
                description: 'المصادر والمعادلات والحدود',
                icon: 'MTH',
              },
            ],
          },
        ],
      },
    ],
    langToggle: 'English',
    langToggleLabel: 'التبديل إلى الإنجليزية',
    searchLabel: 'بحث',
    searchPlaceholder: 'ابحث عن دول وعيارات وأدوات…',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    mainNav: 'التنقل الرئيسي',
    skipLink: 'تخطّ إلى المحتوى الرئيسي',
    brandLabel: 'Gold Ticker Live الرئيسية',
    brandSub: 'أسعار مرجعية · الخليج',
    recentSearches: 'عمليات البحث الأخيرة',
    ctaLabel: 'التتبع المباشر',
    drawerCtaLabel: '← التتبع المباشر',
    drawerSearchPlaceholder: 'ابحث عن دول وأسعار…',
    themeLabels: {
      auto: 'المظهر: تلقائي (اضغط للتبديل إلى الفاتح)',
      light: 'المظهر: فاتح (اضغط للتبديل إلى الداكن)',
      dark: 'المظهر: داكن (اضغط للتبديل إلى التلقائي)',
    },
  },
};

export const NAV_DATA = {
  en: flattenGroups(RAW_NAV_DATA.en),
  ar: flattenGroups(RAW_NAV_DATA.ar),
};

export const PAGE_SHELLS = [
  {
    page: 'home',
    section: 'home',
    shell: 'landing',
    accent: 'gold',
    patterns: ['/', '/index.html'],
  },
  {
    page: 'tracker',
    section: 'prices',
    shell: 'workspace',
    accent: 'live',
    patterns: ['/tracker.html'],
  },
  {
    page: 'calculator',
    section: 'tools',
    shell: 'tool',
    accent: 'calculator',
    patterns: ['/calculator.html'],
  },
  {
    page: 'compare',
    section: 'prices',
    shell: 'tool',
    accent: 'market',
    patterns: ['/compare.html'],
  },
  {
    page: 'heatmap',
    section: 'prices',
    shell: 'tool',
    accent: 'market',
    patterns: ['/heatmap.html'],
  },
  {
    page: 'portfolio',
    section: 'tools',
    shell: 'tool',
    accent: 'calculator',
    patterns: ['/portfolio.html'],
  },
  {
    page: 'shops',
    section: 'discover',
    shell: 'directory',
    accent: 'market',
    patterns: ['/shops.html'],
  },
  {
    page: 'learn',
    section: 'tools',
    shell: 'editorial',
    accent: 'guide',
    patterns: ['/learn.html', '/methodology.html'],
  },
  // Fallback shell — getPageShell() in nav.js resolves unmatched paths
  // (legal pages, 404, offline) to the entry with page === 'content'.
  {
    page: 'content',
    section: 'tools',
    shell: 'editorial',
    accent: 'guide',
    patterns: [],
  },
  { page: 'admin', section: 'admin', shell: 'dashboard', accent: 'ops', patterns: ['/admin/'] },
];
