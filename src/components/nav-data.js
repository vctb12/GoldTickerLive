// components/nav-data.js — bilingual nav menu content data
// Edit this file to update public information architecture labels and dropdown contents.
//
// Phase 1 IA contract:
//   - The header follows the main user journey: check prices, understand price,
//     calculate value, compare countries, find shops, set alerts, learn/invest.
//   - Direct desktop links stay short and intent-led.
//   - Dropdowns are reserved for useful grouped discovery: Countries, Tools, Learn.
//   - Descriptions are intentionally short so dropdown rows stay scannable.

/**
 * @typedef {Object} NavItem
 * @property {string} href
 * @property {string} label
 * @property {string} description
 * @property {string} [key]
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
    invest: {
      href: '/invest.html',
      label: 'Invest',
      description: 'Gold investing guide',
    },
    primaryLinks: [
      {
        key: 'live-prices',
        href: '/tracker.html',
        label: 'Live Prices',
        description: 'Open the live price workspace',
        icon: '📈',
        primary: true,
      },
      {
        key: 'uae-prices',
        href: '/countries/uae/',
        label: 'UAE Prices',
        description: 'AED prices and Dubai context',
        icon: '🇦🇪',
        primary: true,
      },
      {
        key: 'calculator',
        href: '/calculator.html',
        label: 'Calculator',
        description: 'Calculate value by weight and karat',
        icon: '🧮',
        primary: true,
      },
      {
        key: 'shops',
        href: '/shops.html',
        label: 'Shops',
        description: 'Browse shops and gold markets',
        icon: '🏪',
      },
      {
        key: 'methodology',
        href: '/methodology.html',
        label: 'Methodology',
        description: 'Understand sources and formulas',
        icon: '🧭',
      },
    ],
    groups: [
      {
        key: 'prices',
        label: 'Countries',
        description: 'Compare country, city, and market price pages',
        layout: 'two-col',
        items: [
          {
            href: '/countries/index.html',
            label: 'All Countries',
            description: 'Every market we track',
            icon: '🗺️',
            primary: true,
          },
          {
            href: '/countries/uae/',
            label: 'UAE Gold Today',
            description: 'AED prices and peg context',
            icon: '🇦🇪',
            primary: true,
          },
          {
            href: '/countries/uae/cities/dubai.html',
            label: 'Dubai',
            description: 'Dubai rates and souks',
            icon: '🏙️',
          },
          {
            href: '/countries/uae/cities/abu-dhabi.html',
            label: 'Abu Dhabi',
            description: 'Abu Dhabi gold rates',
            icon: '🏙️',
          },
          {
            href: '/countries/saudi-arabia/',
            label: 'Saudi Arabia',
            description: 'SAR gold references',
            icon: '🇸🇦',
          },
          {
            href: '/countries/kuwait/',
            label: 'Kuwait',
            description: 'KWD gold references',
            icon: '🇰🇼',
          },
          {
            href: '/countries/qatar/',
            label: 'Qatar',
            description: 'QAR gold references',
            icon: '🇶🇦',
          },
          {
            href: '/countries/bahrain/',
            label: 'Bahrain',
            description: 'BHD gold references',
            icon: '🇧🇭',
          },
          {
            href: '/countries/oman/',
            label: 'Oman',
            description: 'OMR gold references',
            icon: '🇴🇲',
          },
          {
            href: '/countries/egypt/',
            label: 'Egypt',
            description: 'EGP gold references',
            icon: '🇪🇬',
          },
          {
            href: '/content/compare-countries/',
            label: 'Compare Countries',
            description: 'Country comparison guide',
            icon: '📊',
          },
          {
            href: '/content/gcc-gold-price-comparison/',
            label: 'GCC Comparison',
            description: 'Compare Gulf markets',
            icon: '🌍',
          },
          {
            href: '/countries/uae/markets/dubai-gold-souk.html',
            label: 'Dubai Gold Souk',
            description: 'Deira market guide',
            icon: '🛒',
          },
          {
            href: '/countries/egypt/markets/khan-el-khalili-cairo.html',
            label: 'Khan el-Khalili',
            description: 'Cairo market guide',
            icon: '🛒',
          },
        ],
      },
      {
        key: 'tools',
        label: 'Tools',
        description: 'Calculate, set alerts, export, and search',
        layout: 'two-col',
        items: [
          {
            href: '/calculator.html',
            label: 'Gold Calculator',
            description: 'Value by weight and karat',
            icon: '🧮',
            primary: true,
          },
          {
            href: '/tracker.html#mode=live&panel=alerts',
            label: 'Set Alert',
            description: 'Local price alerts',
            icon: '🔔',
            primary: true,
          },
          {
            href: '/content/tools/weight-converter.html',
            label: 'Weight Converter',
            description: 'Grams, tola, ounces',
            icon: '⚖️',
          },
          {
            href: '/content/tools/zakat-calculator.html',
            label: 'Zakat Calculator',
            description: 'Estimate Zakat on gold',
            icon: '🕌',
          },
          {
            href: '/content/tools/investment-return.html',
            label: 'Investment Return',
            description: 'Model gold performance',
            icon: '📈',
          },
          {
            href: '/tracker.html#mode=exports',
            label: 'Exports',
            description: 'CSV and JSON downloads',
            icon: '⬇️',
          },
          {
            href: '/content/todays-best-rates/',
            label: "Today's Best Rates",
            description: 'Use comparisons safely',
            icon: '⭐',
          },
          {
            href: '/content/premium-watch/',
            label: 'Premium Watch',
            description: 'Retail premiums over spot',
            icon: '👁️',
          },
          {
            href: '/content/search/',
            label: 'Search',
            description: 'Find countries and guides',
            icon: '🔍',
          },
          {
            href: '/content/embed/gold-ticker.html',
            label: 'Embed Widgets',
            description: 'Ticker for your site',
            icon: '🧩',
          },
        ],
      },
      {
        key: 'learn',
        label: 'Learn',
        description: 'Understand spot, retail, karats, AED, and investing',
        layout: 'two-col',
        items: [
          {
            href: '/learn.html',
            label: 'Gold Guide',
            description: 'Core gold knowledge',
            icon: '📖',
            primary: true,
          },
          {
            href: '/methodology.html',
            label: 'Methodology',
            description: 'Sources and formulas',
            icon: '🧭',
            primary: true,
          },
          {
            href: '/insights.html',
            label: 'Insights',
            description: 'Market analysis and context',
            icon: '💡',
          },
          {
            href: '/invest.html',
            label: 'Invest',
            description: 'Gold investing guide',
            icon: '💼',
          },
          {
            href: '/content/spot-vs-retail-gold-price/',
            label: 'Spot vs Retail',
            description: 'Why shop quotes differ',
            icon: '🧾',
          },
          {
            href: '/content/gold-making-charges-guide/',
            label: 'Making Charges',
            description: 'Jewellery fees explained',
            icon: '🔨',
          },
          {
            href: '/content/24k-gold-price-guide/',
            label: '24K Guide',
            description: 'Pure gold and bullion',
            icon: '🏅',
          },
          {
            href: '/content/22k-gold-price-guide/',
            label: '22K Guide',
            description: 'GCC jewellery baseline',
            icon: '💍',
          },
          {
            href: '/content/guides/buying-guide.html',
            label: 'Buying Guide',
            description: 'How to buy safely',
            icon: '🛒',
          },
          {
            href: '/content/guides/zakat-gold-guide.html',
            label: 'Zakat on Gold',
            description: 'Rules and examples',
            icon: '🕌',
          },
          {
            href: '/content/faq/',
            label: 'FAQ',
            description: 'Common questions',
            icon: '❓',
          },
          {
            href: '/content/news/',
            label: 'News',
            description: 'Curated gold updates',
            icon: '📰',
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
    home: { href: '/index.html', label: 'الرئيسية', description: 'نظرة عامة على المنصة والأسعار' },
    shops: {
      href: '/shops.html',
      label: 'المحلات',
      description: 'ابحث عن محلات ومناطق أسواق الذهب',
      primary: true,
    },
    invest: {
      href: '/invest.html',
      label: 'الاستثمار',
      description: 'دليل الاستثمار في الذهب',
    },
    primaryLinks: [
      {
        key: 'live-prices',
        href: '/tracker.html',
        label: 'الأسعار المباشرة',
        description: 'افتح مساحة الأسعار المباشرة',
        icon: '📈',
        primary: true,
      },
      {
        key: 'uae-prices',
        href: '/countries/uae/',
        label: 'أسعار الإمارات',
        description: 'أسعار الدرهم وسياق دبي',
        icon: '🇦🇪',
        primary: true,
      },
      {
        key: 'calculator',
        href: '/calculator.html',
        label: 'الحاسبة',
        description: 'احسب القيمة حسب الوزن والعيار',
        icon: '🧮',
        primary: true,
      },
      {
        key: 'shops',
        href: '/shops.html',
        label: 'المحلات',
        description: 'تصفح المحلات وأسواق الذهب',
        icon: '🏪',
      },
      {
        key: 'methodology',
        href: '/methodology.html',
        label: 'المنهجية',
        description: 'افهم المصادر والمعادلات',
        icon: '🧭',
      },
    ],
    groups: [
      {
        key: 'prices',
        label: 'الدول',
        description: 'قارن صفحات الدول والمدن والأسواق',
        layout: 'two-col',
        items: [
          {
            href: '/countries/index.html',
            label: 'كل الدول',
            description: 'كل الأسواق التي نغطيها',
            icon: '🗺️',
            primary: true,
          },
          {
            href: '/countries/uae/',
            label: 'ذهب الإمارات اليوم',
            description: 'أسعار الدرهم وسياق الربط',
            icon: '🇦🇪',
            primary: true,
          },
          {
            href: '/countries/uae/cities/dubai.html',
            label: 'دبي',
            description: 'أسعار دبي والأسواق',
            icon: '🏙️',
          },
          {
            href: '/countries/uae/cities/abu-dhabi.html',
            label: 'أبوظبي',
            description: 'أسعار ذهب أبوظبي',
            icon: '🏙️',
          },
          {
            href: '/countries/saudi-arabia/',
            label: 'السعودية',
            description: 'مراجع الذهب بالريال',
            icon: '🇸🇦',
          },
          {
            href: '/countries/kuwait/',
            label: 'الكويت',
            description: 'مراجع الذهب بالدينار',
            icon: '🇰🇼',
          },
          {
            href: '/countries/qatar/',
            label: 'قطر',
            description: 'مراجع الذهب بالريال',
            icon: '🇶🇦',
          },
          {
            href: '/countries/bahrain/',
            label: 'البحرين',
            description: 'مراجع الذهب بالدينار',
            icon: '🇧🇭',
          },
          {
            href: '/countries/oman/',
            label: 'عُمان',
            description: 'مراجع الذهب بالريال',
            icon: '🇴🇲',
          },
          {
            href: '/countries/egypt/',
            label: 'مصر',
            description: 'مراجع الذهب بالجنيه',
            icon: '🇪🇬',
          },
          {
            href: '/content/compare-countries/',
            label: 'مقارنة الدول',
            description: 'دليل مقارنة الدول',
            icon: '📊',
          },
          {
            href: '/content/gcc-gold-price-comparison/',
            label: 'مقارنة الخليج',
            description: 'قارن أسواق الخليج',
            icon: '🌍',
          },
          {
            href: '/countries/uae/markets/dubai-gold-souk.html',
            label: 'سوق الذهب بدبي',
            description: 'دليل سوق ديرة',
            icon: '🛒',
          },
          {
            href: '/countries/egypt/markets/khan-el-khalili-cairo.html',
            label: 'خان الخليلي',
            description: 'دليل سوق القاهرة',
            icon: '🛒',
          },
        ],
      },
      {
        key: 'tools',
        label: 'الأدوات',
        description: 'احسب واضبط التنبيهات وصدّر وابحث',
        layout: 'two-col',
        items: [
          {
            href: '/calculator.html',
            label: 'حاسبة الذهب',
            description: 'القيمة حسب الوزن والعيار',
            icon: '🧮',
            primary: true,
          },
          {
            href: '/tracker.html#mode=live&panel=alerts',
            label: 'اضبط تنبيهاً',
            description: 'تنبيهات أسعار محلية',
            icon: '🔔',
            primary: true,
          },
          {
            href: '/content/tools/weight-converter.html',
            label: 'محول الأوزان',
            description: 'جرام وتولة وأونصة',
            icon: '⚖️',
          },
          {
            href: '/content/tools/zakat-calculator.html',
            label: 'حاسبة الزكاة',
            description: 'تقدير زكاة الذهب',
            icon: '🕌',
          },
          {
            href: '/content/tools/investment-return.html',
            label: 'عائد الاستثمار',
            description: 'نمذجة أداء الذهب',
            icon: '📈',
          },
          {
            href: '/tracker.html#mode=exports',
            label: 'التصدير',
            description: 'تنزيل CSV وJSON',
            icon: '⬇️',
          },
          {
            href: '/content/todays-best-rates/',
            label: 'أفضل الأسعار اليوم',
            description: 'استخدم المقارنات بأمان',
            icon: '⭐',
          },
          {
            href: '/content/premium-watch/',
            label: 'مراقبة العلاوة',
            description: 'علاوات التجزئة فوق الفوري',
            icon: '👁️',
          },
          {
            href: '/content/search/',
            label: 'بحث',
            description: 'ابحث عن الدول والأدلة',
            icon: '🔍',
          },
          {
            href: '/content/embed/gold-ticker.html',
            label: 'أدوات التضمين',
            description: 'شريط أسعار لموقعك',
            icon: '🧩',
          },
        ],
      },
      {
        key: 'learn',
        label: 'تعلّم',
        description: 'افهم السعر الفوري والتجزئة والعيارات والدرهم والاستثمار',
        layout: 'two-col',
        items: [
          {
            href: '/learn.html',
            label: 'دليل الذهب',
            description: 'أساسيات معرفة الذهب',
            icon: '📖',
            primary: true,
          },
          {
            href: '/methodology.html',
            label: 'المنهجية',
            description: 'المصادر والمعادلات',
            icon: '🧭',
            primary: true,
          },
          {
            href: '/insights.html',
            label: 'التحليلات',
            description: 'تحليل وسياق السوق',
            icon: '💡',
          },
          {
            href: '/invest.html',
            label: 'الاستثمار',
            description: 'دليل الاستثمار في الذهب',
            icon: '💼',
          },
          {
            href: '/content/spot-vs-retail-gold-price/',
            label: 'الفوري مقابل التجزئة',
            description: 'لماذا تختلف أسعار المحلات',
            icon: '🧾',
          },
          {
            href: '/content/gold-making-charges-guide/',
            label: 'المصنعية',
            description: 'شرح رسوم المجوهرات',
            icon: '🔨',
          },
          {
            href: '/content/24k-gold-price-guide/',
            label: 'دليل 24 قيراط',
            description: 'ذهب نقي وسبائك',
            icon: '🏅',
          },
          {
            href: '/content/22k-gold-price-guide/',
            label: 'دليل 22 قيراط',
            description: 'مرجع مجوهرات الخليج',
            icon: '💍',
          },
          {
            href: '/content/guides/buying-guide.html',
            label: 'دليل الشراء',
            description: 'كيف تشتري بأمان',
            icon: '🛒',
          },
          {
            href: '/content/guides/zakat-gold-guide.html',
            label: 'زكاة الذهب',
            description: 'الأحكام والأمثلة',
            icon: '🕌',
          },
          {
            href: '/content/faq/',
            label: 'الأسئلة الشائعة',
            description: 'إجابات الأسئلة المتكررة',
            icon: '❓',
          },
          {
            href: '/content/news/',
            label: 'الأخبار',
            description: 'تحديثات ذهب منتقاة',
            icon: '📰',
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
