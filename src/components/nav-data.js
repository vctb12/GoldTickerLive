// components/nav-data.js — bilingual nav menu content data
// Edit this file to add/remove nav items, dropdowns, and labels.
//
// Phase 1 structure: Home · Prices · Tools · Shops · Learn · More (+ right actions).
// Shops stays a solo link for styling parity; Invest moves under "More".
//
// Track B (REVAMP_PLAN §5.B.1) metadata contract:
//   - Every item has { href, label, description, icon?, primary? }.
//   - Every group has { key, label, description, layout, items[] }.
//   - `primary: true` marks promoted destinations (Tracker, Calculator, Shops, Countries, …).
//   - `icon` is a short glyph rendered `aria-hidden="true"` next to the label.
//   - `layout: 'two-col' | 'one-col'` hints at dropdown panel layout for desktop.
//
// Descriptions are intentionally short (≤ 48 chars each) so dropdown rows stay scannable.

/**
 * @typedef {Object} NavItem
 * @property {string} href
 * @property {string} label
 * @property {string} description
 * @property {string} [icon]
 * @property {boolean} [primary]
 */

/**
 * @typedef {Object} NavGroup
 * @property {string} key
 * @property {string} label
 * @property {string} description
 * @property {'two-col'|'one-col'} layout
 * @property {NavItem[]} items
 */

export const NAV_DATA = {
  en: {
    home: { href: '/index.html', label: 'Home', description: 'Live gold overview & country picks' },
    shops: {
      href: '/shops.html',
      label: 'Shops',
      description: 'Find verified gold shops & souks',
      primary: true,
    },
    // Kept for backward compatibility with injectNav/drawer templates that reference `invest`.
    // The real Invest entry now lives inside the "More" group.
    invest: {
      href: '/invest.html',
      label: 'Invest',
      description: 'Invest in gold safely',
    },
    groups: [
      {
        key: 'prices',
        label: 'Prices',
        description: 'Live tracker, country pages, cities, markets & history',
        layout: 'two-col',
        items: [
          {
            href: '/tracker.html',
            label: 'Live Tracker',
            description: 'Real-time spot, karats & charts',
            icon: '📈',
            primary: true,
          },
          {
            href: '/countries/uae/',
            label: 'UAE Gold Today',
            description: "Today's AED prices, by karat",
            icon: '🇦🇪',
            primary: true,
          },
          {
            href: '/tracker.html#mode=compare',
            label: 'GCC Compare',
            description: 'Side-by-side GCC prices',
            icon: '🌍',
          },
          {
            href: '/content/compare-countries/',
            label: 'Compare Countries',
            description: 'Price gaps across countries',
            icon: '📊',
          },
          {
            href: '/content/todays-best-rates/',
            label: "Today's Best Rates",
            description: 'Cheapest markets right now',
            icon: '⭐',
          },
          {
            href: '/content/premium-watch/',
            label: 'Premium Watch',
            description: 'Retail premiums over spot',
            icon: '👁️',
          },
          {
            href: '/countries/index.html',
            label: 'All Countries',
            description: 'Every country we track',
            icon: '🗺️',
            primary: true,
          },
          {
            href: '/countries/uae/cities/dubai.html',
            label: 'Dubai, UAE',
            description: 'Dubai gold rates & souks',
            icon: '🏙️',
          },
          {
            href: '/countries/uae/cities/abu-dhabi.html',
            label: 'Abu Dhabi, UAE',
            description: 'Abu Dhabi gold rates',
            icon: '🏙️',
          },
          {
            href: '/countries/saudi-arabia/cities/riyadh.html',
            label: 'Riyadh, Saudi Arabia',
            description: 'Riyadh gold rates',
            icon: '🏙️',
          },
          {
            href: '/countries/egypt/cities/cairo.html',
            label: 'Cairo, Egypt',
            description: 'Cairo gold rates & souks',
            icon: '🏙️',
          },
          {
            href: '/countries/qatar/cities/doha.html',
            label: 'Doha, Qatar',
            description: 'Doha gold rates',
            icon: '🏙️',
          },
          {
            href: '/countries/uae/markets/dubai-gold-souk.html',
            label: 'Dubai Gold Souk',
            description: 'Classic Deira gold souk',
            icon: '🛒',
          },
          {
            href: '/countries/egypt/markets/khan-el-khalili-cairo.html',
            label: 'Khan el-Khalili, Cairo',
            description: 'Cairo heritage bazaar',
            icon: '🛒',
          },
          {
            href: '/tracker.html#mode=archive',
            label: 'Price History',
            description: 'Browse historical prices',
            icon: '🕰️',
          },
          {
            href: '/content/gold-price-history/',
            label: 'Historical Data',
            description: 'Long-range datasets',
            icon: '📚',
          },
        ],
      },
      {
        key: 'tools',
        label: 'Tools',
        description: 'Calculator, alerts, exports, order & search',
        layout: 'two-col',
        items: [
          {
            href: '/calculator.html',
            label: 'Calculator',
            description: 'Price a piece by weight & karat',
            icon: '🧮',
            primary: true,
          },
          {
            href: '/content/tools/weight-converter.html',
            label: 'Weight Converter',
            description: 'Grams ↔ tola ↔ ounce',
            icon: '⚖️',
          },
          {
            href: '/content/tools/zakat-calculator.html',
            label: 'Zakat Calculator',
            description: 'Zakat due on gold holdings',
            icon: '🕌',
          },
          {
            href: '/content/tools/investment-return.html',
            label: 'Investment Return',
            description: 'Project gold returns',
            icon: '📈',
          },
          {
            href: '/tracker.html#mode=live&panel=alerts',
            label: 'Alerts',
            description: 'Price-move notifications',
            icon: '🔔',
          },
          {
            href: '/tracker.html#mode=exports',
            label: 'Downloads',
            description: 'CSV / JSON exports',
            icon: '⬇️',
          },
          {
            href: '/content/order-gold/',
            label: 'Order Gold',
            description: 'Reserve with trusted shops',
            icon: '🛍️',
          },
          {
            href: '/content/search/',
            label: 'Search',
            description: 'Search the full site',
            icon: '🔍',
          },
          {
            href: '/content/embed/gold-ticker.html',
            label: 'Embed Widgets',
            description: 'Ticker & widgets for your site',
            icon: '🧩',
          },
          {
            href: '/content/social/x-post-generator.html',
            label: 'X Post Generator',
            description: 'Share price cards on X',
            icon: '✨',
          },
        ],
      },
      {
        key: 'learn',
        label: 'Learn',
        description: 'Guides, methodology, glossary & FAQ',
        layout: 'one-col',
        items: [
          {
            href: '/content/guides/buying-guide.html',
            label: 'How to Buy Gold',
            description: 'Beginner buying guide',
            icon: '🛒',
          },
          {
            href: '/content/guides/24k-vs-22k.html',
            label: '24K vs 22K Gold',
            description: 'Purity vs durability',
            icon: '💎',
          },
          {
            href: '/content/guides/gold-karat-comparison.html',
            label: 'Karat Comparison',
            description: 'All karats side-by-side',
            icon: '📏',
          },
          {
            href: '/content/guides/aed-peg-explained.html',
            label: 'AED Peg Explained',
            description: 'Why AED tracks USD',
            icon: '💱',
          },
          {
            href: '/content/guides/gcc-market-hours.html',
            label: 'GCC Market Hours',
            description: 'When markets open & close',
            icon: '🕒',
          },
          {
            href: '/content/guides/invest-in-gold-gcc.html',
            label: 'Invest in Gold (GCC)',
            description: 'Regional investing tips',
            icon: '💼',
          },
          {
            href: '/content/guides/zakat-gold-guide.html',
            label: 'Zakat on Gold',
            description: 'Zakat rules explained',
            icon: '🕌',
          },
          {
            href: '/content/guides/',
            label: 'All Guides',
            description: 'Full guide library',
            icon: '📚',
          },
          {
            href: '/learn.html',
            label: 'Gold Guide',
            description: 'Core gold knowledge',
            icon: '📖',
          },
          {
            href: '/methodology.html',
            label: 'Methodology',
            description: 'How we source prices',
            icon: '🧭',
          },
          {
            href: '/content/faq/',
            label: 'FAQ',
            description: 'Answers to common questions',
            icon: '❓',
          },
        ],
      },
      {
        key: 'more',
        label: 'More',
        description: 'Insights, news, invest & site info',
        layout: 'one-col',
        items: [
          {
            href: '/insights.html',
            label: 'Gold Insights',
            description: 'Market analysis & briefs',
            icon: '💡',
          },
          {
            href: '/insights.html#why-gold-moved',
            label: 'Why Gold Moved Today',
            description: "Today's movers, explained",
            icon: '📰',
          },
          {
            href: '/insights.html#weekly-brief',
            label: 'Weekly Brief',
            description: 'Weekly gold recap',
            icon: '🗞️',
          },
          {
            href: '/content/news/',
            label: 'Gold News',
            description: 'Latest gold headlines',
            icon: '📰',
          },
          {
            href: '/invest.html',
            label: 'Invest',
            description: 'Invest in gold safely',
            icon: '💼',
          },
          {
            href: '/content/submit-shop/',
            label: 'Submit a Shop',
            description: 'List your gold shop',
            icon: '🏪',
          },
          {
            href: '/content/changelog/',
            label: 'Changelog',
            description: 'Recent site updates',
            icon: '🧾',
          },
          {
            href: '/privacy.html',
            label: 'Privacy',
            description: 'Privacy policy',
            icon: '🔒',
          },
          {
            href: '/terms.html',
            label: 'Terms',
            description: 'Terms of use',
            icon: '📜',
          },
        ],
      },
    ],
    langToggle: 'العربية',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    mainNav: 'Main navigation',
  },

  ar: {
    home: { href: '/index.html', label: 'الرئيسية', description: 'نظرة حية على الذهب وأهم الدول' },
    shops: {
      href: '/shops.html',
      label: 'المحلات',
      description: 'ابحث عن محلات ذهب موثوقة',
      primary: true,
    },
    invest: {
      href: '/invest.html',
      label: 'الاستثمار',
      description: 'استثمر في الذهب بأمان',
    },

    groups: [
      {
        key: 'prices',
        label: 'الأسعار',
        description: 'تتبع مباشر، صفحات الدول، المدن، الأسواق والتاريخ',
        layout: 'two-col',
        items: [
          {
            href: '/tracker.html',
            label: 'تتبع مباشر',
            description: 'السعر الفوري والعيارات والرسوم',
            icon: '📈',
            primary: true,
          },
          {
            href: '/countries/uae/',
            label: 'ذهب الإمارات',
            description: 'أسعار اليوم بالدرهم',
            icon: '🇦🇪',
            primary: true,
          },
          {
            href: '/tracker.html#mode=compare',
            label: 'مقارنة دول الخليج',
            description: 'مقارنة أسعار دول الخليج',
            icon: '🌍',
          },
          {
            href: '/content/compare-countries/',
            label: 'مقارنة الدول',
            description: 'فروق الأسعار بين الدول',
            icon: '📊',
          },
          {
            href: '/content/todays-best-rates/',
            label: 'أفضل الأسعار اليوم',
            description: 'أرخص الأسواق الآن',
            icon: '⭐',
          },
          {
            href: '/content/premium-watch/',
            label: 'مراقبة العلاوة',
            description: 'العلاوة على السعر الفوري',
            icon: '👁️',
          },
          {
            href: '/countries/index.html',
            label: 'كل الدول',
            description: 'كل الدول التي نغطيها',
            icon: '🗺️',
            primary: true,
          },
          {
            href: '/countries/uae/cities/dubai.html',
            label: 'دبي، الإمارات',
            description: 'أسعار ذهب دبي والأسواق',
            icon: '🏙️',
          },
          {
            href: '/countries/uae/cities/abu-dhabi.html',
            label: 'أبوظبي، الإمارات',
            description: 'أسعار ذهب أبوظبي',
            icon: '🏙️',
          },
          {
            href: '/countries/saudi-arabia/cities/riyadh.html',
            label: 'الرياض، السعودية',
            description: 'أسعار ذهب الرياض',
            icon: '🏙️',
          },
          {
            href: '/countries/egypt/cities/cairo.html',
            label: 'القاهرة، مصر',
            description: 'أسعار ذهب القاهرة',
            icon: '🏙️',
          },
          {
            href: '/countries/qatar/cities/doha.html',
            label: 'الدوحة، قطر',
            description: 'أسعار ذهب الدوحة',
            icon: '🏙️',
          },
          {
            href: '/countries/uae/markets/dubai-gold-souk.html',
            label: 'سوق الذهب بدبي',
            description: 'سوق ديرة للذهب',
            icon: '🛒',
          },
          {
            href: '/countries/egypt/markets/khan-el-khalili-cairo.html',
            label: 'خان الخليلي، القاهرة',
            description: 'بازار القاهرة التاريخي',
            icon: '🛒',
          },
          {
            href: '/tracker.html#mode=archive',
            label: 'سجل الأسعار',
            description: 'تصفح الأسعار التاريخية',
            icon: '🕰️',
          },
          {
            href: '/content/gold-price-history/',
            label: 'البيانات التاريخية',
            description: 'مجموعات بيانات طويلة المدى',
            icon: '📚',
          },
        ],
      },
      {
        key: 'tools',
        label: 'أدوات',
        description: 'حاسبة، تنبيهات، تصدير، طلب وبحث',
        layout: 'two-col',
        items: [
          {
            href: '/calculator.html',
            label: 'حاسبة',
            description: 'احسب قيمة قطعة بالوزن والعيار',
            icon: '🧮',
            primary: true,
          },
          {
            href: '/content/tools/weight-converter.html',
            label: 'محول الأوزان',
            description: 'جرام ↔ تولة ↔ أونصة',
            icon: '⚖️',
          },
          {
            href: '/content/tools/zakat-calculator.html',
            label: 'حاسبة الزكاة',
            description: 'زكاة الذهب المستحقة',
            icon: '🕌',
          },
          {
            href: '/content/tools/investment-return.html',
            label: 'عائد الاستثمار',
            description: 'توقع عوائد الذهب',
            icon: '📈',
          },
          {
            href: '/tracker.html#mode=live&panel=alerts',
            label: 'تنبيهات',
            description: 'إشعارات تحرك الأسعار',
            icon: '🔔',
          },
          {
            href: '/tracker.html#mode=exports',
            label: 'تنزيلات',
            description: 'تصدير CSV / JSON',
            icon: '⬇️',
          },
          {
            href: '/content/order-gold/',
            label: 'اطلب الذهب',
            description: 'احجز من محلات موثوقة',
            icon: '🛍️',
          },
          {
            href: '/content/search/',
            label: 'بحث',
            description: 'ابحث في الموقع',
            icon: '🔍',
          },
          {
            href: '/content/embed/gold-ticker.html',
            label: 'أدوات التضمين',
            description: 'شريط وأدوات للموقع الخاص',
            icon: '🧩',
          },
          {
            href: '/content/social/x-post-generator.html',
            label: 'منشئ منشورات X',
            description: 'شارك بطاقات الأسعار على X',
            icon: '✨',
          },
        ],
      },
      {
        key: 'learn',
        label: 'تعلّم',
        description: 'أدلة، منهجية، مصطلحات وأسئلة شائعة',
        layout: 'one-col',
        items: [
          {
            href: '/content/guides/buying-guide.html',
            label: 'كيفية شراء الذهب',
            description: 'دليل الشراء للمبتدئين',
            icon: '🛒',
          },
          {
            href: '/content/guides/24k-vs-22k.html',
            label: '24 قيراط مقابل 22',
            description: 'النقاء مقابل المتانة',
            icon: '💎',
          },
          {
            href: '/content/guides/gold-karat-comparison.html',
            label: 'مقارنة العيارات',
            description: 'كل العيارات جنبًا إلى جنب',
            icon: '📏',
          },
          {
            href: '/content/guides/aed-peg-explained.html',
            label: 'ربط الدرهم',
            description: 'لماذا يتبع الدرهم الدولار',
            icon: '💱',
          },
          {
            href: '/content/guides/gcc-market-hours.html',
            label: 'ساعات أسواق الخليج',
            description: 'مواعيد فتح وإغلاق الأسواق',
            icon: '🕒',
          },
          {
            href: '/content/guides/invest-in-gold-gcc.html',
            label: 'الاستثمار في الذهب',
            description: 'نصائح استثمار خليجية',
            icon: '💼',
          },
          {
            href: '/content/guides/zakat-gold-guide.html',
            label: 'زكاة الذهب',
            description: 'أحكام زكاة الذهب',
            icon: '🕌',
          },
          {
            href: '/content/guides/',
            label: 'كل الأدلة',
            description: 'مكتبة الأدلة الكاملة',
            icon: '📚',
          },
          {
            href: '/learn.html',
            label: 'دليل الذهب',
            description: 'أساسيات معرفة الذهب',
            icon: '📖',
          },
          {
            href: '/methodology.html',
            label: 'المنهجية',
            description: 'كيف نجمع الأسعار',
            icon: '🧭',
          },
          {
            href: '/content/faq/',
            label: 'الأسئلة الشائعة',
            description: 'إجابات للأسئلة المتكررة',
            icon: '❓',
          },
        ],
      },
      {
        key: 'more',
        label: 'المزيد',
        description: 'تحليلات، أخبار، استثمار ومعلومات الموقع',
        layout: 'one-col',
        items: [
          {
            href: '/insights.html',
            label: 'تحليلات الذهب',
            description: 'تحليلات ونشرات السوق',
            icon: '💡',
          },
          {
            href: '/insights.html#why-gold-moved',
            label: 'لماذا تحرك الذهب اليوم',
            description: 'أسباب تحركات اليوم',
            icon: '📰',
          },
          {
            href: '/insights.html#weekly-brief',
            label: 'النشرة الأسبوعية',
            description: 'ملخص الذهب الأسبوعي',
            icon: '🗞️',
          },
          {
            href: '/content/news/',
            label: 'أخبار الذهب',
            description: 'أحدث عناوين الذهب',
            icon: '📰',
          },
          {
            href: '/invest.html',
            label: 'الاستثمار',
            description: 'استثمر في الذهب بأمان',
            icon: '💼',
          },
          {
            href: '/content/submit-shop/',
            label: 'أضف محلاً',
            description: 'أضف محل ذهبك',
            icon: '🏪',
          },
          {
            href: '/content/changelog/',
            label: 'سجل التغييرات',
            description: 'آخر تحديثات الموقع',
            icon: '🧾',
          },
          {
            href: '/privacy.html',
            label: 'الخصوصية',
            description: 'سياسة الخصوصية',
            icon: '��',
          },
          {
            href: '/terms.html',
            label: 'الشروط',
            description: 'شروط الاستخدام',
            icon: '📜',
          },
        ],
      },
    ],
    langToggle: 'English',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    mainNav: 'التنقل الرئيسي',
  },
};
