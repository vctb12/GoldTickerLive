// components/nav-data.js — bilingual nav menu content data
// Edit this file to add/remove nav items, dropdowns, and labels.

export const NAV_DATA = {
  en: {
    home:  { href: '../index.html',  label: 'Home'  },
    shops: { href: '../shops.html',  label: 'Shops' },
    invest: { href: '../invest.html', label: 'Invest' },
    groups: [
      {
        key: 'markets',
        label: 'Markets',
        items: [
          { href: '../tracker.html',                   label: 'Live Tracker'   },
          { href: '../countries/uae.html',             label: 'UAE Gold Today' },
          { href: '../tracker.html#mode=compare',        label: 'GCC Compare'    },
          { href: '../tracker.html#mode=compare',        label: 'Country Pages'  },
          { href: '../tracker.html#mode=archive',        label: 'History & Data' },
        ],
      },
      {
        key: 'tools',
        label: 'Tools',
        items: [
          { href: '../calculator.html',                label: 'Calculator'   },
          { href: '../tracker.html#mode=live&panel=alerts',         label: 'Alerts'       },
          { href: '../tracker.html#mode=exports',        label: 'Downloads'    },
          { href: '../tracker.html#mode=archive',        label: 'Date Lookup'  },
          { href: '../tracker.html#mode=archive',        label: 'Archive'      },
        ],
      },
      {
        key: 'cities',
        label: 'Cities',
        items: [
          { href: '../countries/uae/cities/dubai.html',           label: 'Dubai, UAE'           },
          { href: '../countries/uae/cities/abu-dhabi.html',       label: 'Abu Dhabi, UAE'       },
          { href: '../countries/saudi-arabia/cities/riyadh.html', label: 'Riyadh, Saudi Arabia' },
          { href: '../countries/egypt/cities/cairo.html',         label: 'Cairo, Egypt'         },
          { href: '../countries/qatar/cities/doha.html',          label: 'Doha, Qatar'          },
        ],
      },
      {
        key: 'goldmarkets',
        label: 'Famous Markets',
        items: [
          { href: '../countries/uae/markets/dubai-gold-souk.html',         label: 'Dubai Gold Souk'         },
          { href: '../countries/egypt/markets/khan-el-khalili-cairo.html', label: 'Khan el-Khalili, Cairo' },
        ],
      },
      {
        key: 'learn',
        label: 'Learn',
        items: [
          { href: '../guides/buying-guide.html', label: 'How to Buy Gold' },
          { href: '../learn.html',               label: 'Gold Guide'      },
          { href: '../methodology.html',         label: 'Methodology'     },
          { href: '../learn.html#faq',           label: 'FAQ'             },
        ],
      },
      {
        key: 'insights',
        label: 'Insights',
        items: [
          { href: '../insights.html',                label: 'Gold Insights'        },
          { href: '../insights.html#why-gold-moved', label: 'Why Gold Moved Today' },
          { href: '../insights.html#weekly-brief',   label: 'Weekly Brief'         },
        ],
      },
    ],
    langToggle: 'العربية',
    openMenu:   'Open menu',
    closeMenu:  'Close menu',
    mainNav:    'Main navigation',
  },

  ar: {
    home:  { href: '../index.html',  label: 'الرئيسية'    },
    shops: { href: '../shops.html',  label: 'المحلات'     },
    invest: { href: '../invest.html', label: 'الاستثمار' },

    groups: [
      {
        key: 'markets',
        label: 'الأسواق',
        items: [
          { href: '../tracker.html',                   label: 'تتبع مباشر'          },
          { href: '../countries/uae.html',             label: 'ذهب الإمارات'        },
          { href: '../tracker.html#mode=compare',        label: 'مقارنة دول الخليج'   },
          { href: '../tracker.html#mode=compare',        label: 'صفحات الدول'         },
          { href: '../tracker.html#mode=archive',        label: 'البيانات التاريخية'   },
        ],
      },
      {
        key: 'tools',
        label: 'أدوات',
        items: [
          { href: '../calculator.html',                label: 'حاسبة'             },
          { href: '../tracker.html#mode=live&panel=alerts',         label: 'تنبيهات'           },
          { href: '../tracker.html#mode=exports',        label: 'تنزيلات'           },
          { href: '../tracker.html#mode=archive',        label: 'البحث بالتاريخ'    },
          { href: '../tracker.html#mode=archive',        label: 'الأرشيف'           },
        ],
      },
      {
        key: 'cities',
        label: 'المدن',
        items: [
          { href: '../countries/uae/cities/dubai.html',           label: 'دبي، الإمارات'           },
          { href: '../countries/uae/cities/abu-dhabi.html',       label: 'أبوظبي، الإمارات'        },
          { href: '../countries/saudi-arabia/cities/riyadh.html', label: 'الرياض، السعودية'        },
          { href: '../countries/egypt/cities/cairo.html',         label: 'القاهرة، مصر'            },
          { href: '../countries/qatar/cities/doha.html',          label: 'الدوحة، قطر'             },
        ],
      },
      {
        key: 'goldmarkets',
        label: 'أسواق الذهب الشهيرة',
        items: [
          { href: '../countries/uae/markets/dubai-gold-souk.html',         label: 'سوق الذهب بدبي'        },
          { href: '../countries/egypt/markets/khan-el-khalili-cairo.html', label: 'خان الخليلي، القاهرة' },
        ],
      },
      {
        key: 'learn',
        label: 'تعلّم',
        items: [
          { href: '../guides/buying-guide.html', label: 'كيفية شراء الذهب' },
          { href: '../learn.html',               label: 'دليل الذهب'      },
          { href: '../methodology.html',         label: 'المنهجية'        },
          { href: '../learn.html#faq',           label: 'الأسئلة الشائعة'  },
        ],
      },
      {
        key: 'insights',
        label: 'تحليلات',
        items: [
          { href: '../insights.html',                label: 'تحليلات الذهب'          },
          { href: '../insights.html#why-gold-moved', label: 'لماذا تحرك الذهب اليوم' },
          { href: '../insights.html#weekly-brief',   label: 'النشرة الأسبوعية'       },
        ],
      },
    ],
    langToggle: 'English',
    openMenu:   'فتح القائمة',
    closeMenu:  'إغلاق القائمة',
    mainNav:    'التنقل الرئيسي',
  },
};
