# Site-wide (non-tracker) i18n Parity Dataset — 95 strings

> Pages: home, calculator, shops, methodology, country-template (countries/country-page.js +
> countries/uae/index.html + countries/uae/gold-price/index.html). Integrate per page, verify
> hydration, gate each.

I have everything confirmed. Now I'll produce the consolidated markdown document.

One correction noted from verification: the calculator `scrap_label_dealer` AR value in the file is
`'مبلغ التاجر'` (without `(90%)`) — the percentage is appended dynamically by the wiring. I'll
document the existing AR value as-is rather than the input's "مبلغ التاجر (90%)". The key already
exists, so no addition needed — only wiring.

Now producing the final markdown:

# Gold Ticker Live — Site-Wide i18n Parity Consolidation

Verified against `src/config/translations.js` (2,530 lines), `src/pages/calculator.js`,
`src/pages/shops.js`, `src/pages/methodology.js`, `countries/country-page.js`, and
`src/lib/page-hydrator.js`. **No proposed key collides with an existing one.** Keys flagged in the
source data as "already exist" (`home.gccTab*Aria`, calc `val_weight`, calc `scrap_label_dealer`,
shops `quickActionsCalc/Rates/UAE`, shops `mapHint`) were re-confirmed and are handled as
wiring-only fixes, not additions.

---

## 1. Home (`src/pages/home.js` + `index.html`)

### (a) i18n mechanism & failure mode

- Two local helpers: `tx(key)` prefixes `home.`
  (`TRANSLATIONS[lang]['home.'+key] ?? TRANSLATIONS.en['home.'+key] ?? key`, `home.js:141`) and
  `txGlobal(key)` reads top-level namespaces (`home.js:146`). Source map is
  `src/config/translations.js` (`TRANSLATIONS`, flat dotted keys, `en`/`ar`).
- `setTextById(id, text)` (`home.js:188`) is the setter. Central localize routine
  `applyLangToPage()` runs on `init()` and on every lang-toggle click; a few sections self-localize
  in `initHomeChart()` / `renderPriceTrend()` / karat strip.
- **Fails OPEN**: a missing `home.*` key falls back to `TRANSLATIONS.en`, then to the bare `key`
  argument string (note: `tx` returns `key`, not `fullKey`). An element with **no**
  `setTextById`/`setAttribute` entry is never touched at all → it renders its hardcoded English even
  in AR, silently. The entire static FAQ accordion and the listed labels/links are in this
  never-touched category.

### (b) `translations.js` additions (paste into the `home.*` region — EN near line 919, AR near line 2181)

**EN block:**

```js
    'home.skipLink': 'Skip to main content',
    'home.gccTabGccLabel': 'GCC (6)',
    'home.gccTabMenaLabel': 'MENA (8+)',
    'home.gccTabGlobalLabel': 'Global (24+)',
    'home.statOpenLabel': 'Open',
    'home.statHighLabel': 'High',
    'home.statLowLabel': 'Low',
    'home.exportCsvAria': 'Export session price history as CSV',
    'home.explainerMethodologyLink': 'Full price methodology & data sources →',
    'home.explainerSvrLink': 'Spot vs retail price difference explained →',
    'home.faqQ1': 'What is the gold price per gram in UAE today?',
    'home.faqA1': 'The live gold price per gram in UAE (AED) is shown on the <a href="tracker.html">Live Tracker</a> and the <a href="countries/uae/">UAE page</a>. Spot source updates hourly during market hours; pages re-poll about every 90 seconds while open. Prices use the official AED peg of 3.6725.',
    'home.faqQ2': 'What is the difference between 24K, 22K and 21K gold?',
    'home.faqA2': '24K is 100% pure gold. 22K is 91.7% gold (common for Gulf jewelry). 21K is 87.5% gold (popular in Egypt and Levant). 18K is 75% gold (common for fine jewelry worldwide). The price scales with purity — see our <a href="learn.html">Learn page</a> for the full breakdown.',
    'home.faqQ3': 'Why is the AED price different from a live API conversion?',
    'home.faqA3': 'The UAE Dirham is officially pegged to the US Dollar at 3.6725 by the UAE Central Bank. This rate never changes. Most FX APIs show a slightly different rate due to bid/ask spreads. We hardcode the official peg to give you accurate AED gold prices.',
    'home.faqQ4': 'Is this the actual jewelry or retail gold price?',
    'home.faqA4': 'No — these are spot-linked bullion estimates. Actual jewellery prices at retail stores are higher due to making charges, shop premiums, taxes, and markups. The Dubai Gold & Jewellery Group publishes a daily retail rate. Our tracker gives you the international spot baseline.',
    'home.faqQ5': 'How often do prices update?',
    'home.faqA5': "The gold spot price auto-refreshes while you have the page open; the underlying source data updates hourly during market hours. FX rates update once per day (via open.er-api.com). A countdown timer on the tracker shows you exactly when the next refresh is due. Data is cached locally so the last known price shows even when you're offline, with a visible cached / fallback label so you can tell the difference.",
    'home.faqQ6': 'Does the price include making charges or VAT?',
    'home.faqA6': 'No. The prices on Gold Ticker Live are spot-linked reference estimates for the gold content only. When you buy jewellery in a shop, the final price is higher because it adds making charges (fabrication fees, typically 5–25%), dealer margin, and in some countries VAT (e.g. 5% in the UAE). The tracker gives you the bullion baseline so you can understand how much of the quoted price is gold and how much is markup. See <a href="content/spot-vs-retail-gold-price/">Spot vs retail price</a> for a detailed breakdown.',
    'home.faqQ7': 'Can I use these prices when selling gold?',
    'home.faqA7': "The displayed price is a useful starting point. When selling gold, dealers typically offer below the spot price — often 1–5% less — to cover their spread and processing costs. The amount you receive depends on the karat of the piece, the buyer's buy-back rate, and any applicable fees. Use our <a href=\"calculator.html\">Gold Calculator</a> to estimate the melt value of your piece, then compare offers from multiple dealers.",
```

**AR block:**

```js
    'home.skipLink': 'تخطّ إلى المحتوى الرئيسي',
    'home.gccTabGccLabel': 'دول الخليج (6)',
    'home.gccTabMenaLabel': 'الشرق الأوسط وشمال أفريقيا (8+)',
    'home.gccTabGlobalLabel': 'عالمي (24+)',
    'home.statOpenLabel': 'الافتتاح',
    'home.statHighLabel': 'الأعلى',
    'home.statLowLabel': 'الأدنى',
    'home.exportCsvAria': 'تصدير سجل أسعار الجلسة بصيغة CSV',
    'home.explainerMethodologyLink': 'منهجية الأسعار الكاملة ومصادر البيانات ←',
    'home.explainerSvrLink': 'شرح الفرق بين السعر الفوري وسعر التجزئة ←',
    'home.faqQ1': 'كم سعر غرام الذهب في الإمارات اليوم؟',
    'home.faqA1': 'يظهر سعر غرام الذهب المباشر في الإمارات (بالدرهم) في <a href="tracker.html">المتتبع المباشر</a> وفي <a href="countries/uae/">صفحة الإمارات</a>. يُحدَّث مصدر السعر الفوري كل ساعة خلال ساعات السوق؛ وتعيد الصفحات الاستعلام كل 90 ثانية تقريبًا أثناء فتحها. تعتمد الأسعار على الربط الرسمي للدرهم عند 3.6725.',
    'home.faqQ2': 'ما الفرق بين الذهب عيار 24 و22 و21؟',
    'home.faqA2': 'عيار 24 ذهب نقي 100%. وعيار 22 يحتوي 91.7% ذهبًا (شائع في مجوهرات الخليج). وعيار 21 يحتوي 87.5% (منتشر في مصر وبلاد الشام). وعيار 18 يحتوي 75% (شائع للمجوهرات الراقية عالميًا). يتناسب السعر مع النقاء — راجع <a href="learn.html">صفحة التعلّم</a> للتفاصيل الكاملة.',
    'home.faqQ3': 'لماذا يختلف سعر الدرهم عن التحويل المباشر عبر واجهة برمجية؟',
    'home.faqA3': 'الدرهم الإماراتي مرتبط رسميًا بالدولار الأمريكي عند 3.6725 من قِبل مصرف الإمارات المركزي، وهذا السعر لا يتغير. وتُظهر معظم واجهات أسعار الصرف سعرًا مختلفًا قليلًا بسبب فروق العرض والطلب. نحن نعتمد الربط الرسمي الثابت لنمنحك أسعار ذهب دقيقة بالدرهم.',
    'home.faqQ4': 'هل هذا هو سعر الذهب الفعلي للمجوهرات أو التجزئة؟',
    'home.faqA4': 'لا — هذه تقديرات للسبائك مرتبطة بالسعر الفوري. أما أسعار المجوهرات الفعلية في متاجر التجزئة فأعلى بسبب رسوم المصنعية وهوامش المتجر والضرائب والزيادات. وتنشر مجموعة دبي للذهب والمجوهرات سعر تجزئة يوميًا. أما المتتبع لدينا فيمنحك خط الأساس الفوري العالمي.',
    'home.faqQ5': 'كم مرة تُحدَّث الأسعار؟',
    'home.faqA5': 'يُحدَّث السعر الفوري للذهب تلقائيًا أثناء فتح الصفحة؛ بينما تُحدَّث بيانات المصدر الأساسية كل ساعة خلال ساعات السوق. وتُحدَّث أسعار الصرف مرة واحدة يوميًا (عبر open.er-api.com). ويعرض مؤقت تنازلي في المتتبع موعد التحديث التالي بدقة. وتُخزَّن البيانات محليًا فيظهر آخر سعر معروف حتى دون اتصال بالإنترنت، مع تسمية واضحة للبيانات المخزنة/الاحتياطية لتمييزها.',
    'home.faqQ6': 'هل يشمل السعر رسوم المصنعية أو ضريبة القيمة المضافة؟',
    'home.faqA6': 'لا. الأسعار على Gold Ticker Live تقديرات مرجعية مرتبطة بالسعر الفوري لمحتوى الذهب فقط. وعند شراء المجوهرات من متجر يكون السعر النهائي أعلى لأنه يضيف رسوم المصنعية (رسوم التصنيع، عادةً 5–25%) وهامش التاجر، وفي بعض الدول ضريبة القيمة المضافة (مثل 5% في الإمارات). يمنحك المتتبع خط أساس السبائك لتفهم كم من السعر المعروض ذهب وكم منه زيادة. راجع <a href="content/spot-vs-retail-gold-price/">السعر الفوري مقابل التجزئة</a> لتفصيل كامل.',
    'home.faqQ7': 'هل يمكنني استخدام هذه الأسعار عند بيع الذهب؟',
    'home.faqA7': 'السعر المعروض نقطة انطلاق مفيدة. وعند بيع الذهب يعرض التجار عادةً أقل من السعر الفوري — غالبًا بنسبة 1–5% أقل — لتغطية فرق السعر وتكاليف المعالجة. ويعتمد المبلغ الذي تحصل عليه على عيار القطعة وسعر إعادة الشراء لدى المشتري وأي رسوم سارية. استخدم <a href="calculator.html">حاسبة الذهب</a> لتقدير قيمة صهر قطعتك، ثم قارن العروض من عدة تجار.',
```

> Note: FAQ answer EN/AR strings now embed the inline anchors so `innerHTML` assignment preserves
> the links. The source data's plain-text variants would have dropped the `<a>` tags.

### (c) id additions (`index.html`)

| Selector                                                 | Add id                |
| -------------------------------------------------------- | --------------------- |
| `body.home-page > a.skip-link[href='#main-content']`     | `home-skip-link`      |
| `.hlc-stat:nth-child(1) .hlc-stat-label` (Open)          | `hlc-stat-open-label` |
| `.hlc-stat:nth-child(2) .hlc-stat-label` (High)          | `hlc-stat-high-label` |
| `.hlc-stat:nth-child(3) .hlc-stat-label` (Low)           | `hlc-stat-low-label`  |
| `#faq .faq-item:nth-of-type(1) > summary.faq-q`          | `faq-q1`              |
| `#faq .faq-item:nth-of-type(1) .faq-a [itemprop='text']` | `faq-a1`              |
| `…:nth-of-type(2) summary.faq-q` / answer                | `faq-q2` / `faq-a2`   |
| `…:nth-of-type(3) summary.faq-q` / answer                | `faq-q3` / `faq-a3`   |
| `…:nth-of-type(4) summary.faq-q` / answer                | `faq-q4` / `faq-a4`   |
| `…:nth-of-type(5) summary.faq-q` / answer                | `faq-q5` / `faq-a5`   |
| `…:nth-of-type(6) summary.faq-q` / answer                | `faq-q6` / `faq-a6`   |
| `…:nth-of-type(7) summary.faq-q` / answer                | `faq-q7` / `faq-a7`   |

No id needed (already have one): `#gcc-tab-gcc`, `#gcc-tab-mena`, `#gcc-tab-global`,
`#hlc-export-btn`, `#explainer-methodology-link`, `#explainer-svr-link`.

### (d) wiring (add inside `applyLangToPage()`)

```js
setTextById('home-skip-link', tx('skipLink'));
setTextById('gcc-tab-gcc', tx('gccTabGccLabel'));
setTextById('gcc-tab-mena', tx('gccTabMenaLabel'));
setTextById('gcc-tab-global', tx('gccTabGlobalLabel'));
setTextById('hlc-stat-open-label', tx('statOpenLabel'));
setTextById('hlc-stat-high-label', tx('statHighLabel'));
setTextById('hlc-stat-low-label', tx('statLowLabel'));
document.getElementById('hlc-export-btn')?.setAttribute('aria-label', tx('exportCsvAria'));
setTextById('explainer-methodology-link', tx('explainerMethodologyLink'));
setTextById('explainer-svr-link', tx('explainerSvrLink'));
// FAQ — questions are plain text; answers carry inline anchors → innerHTML
setTextById('faq-q1', tx('faqQ1'));
setTextById('faq-q2', tx('faqQ2'));
setTextById('faq-q3', tx('faqQ3'));
setTextById('faq-q4', tx('faqQ4'));
setTextById('faq-q5', tx('faqQ5'));
setTextById('faq-q6', tx('faqQ6'));
setTextById('faq-q7', tx('faqQ7'));
for (const n of [1, 2, 3, 4, 5, 6, 7]) {
  const a = document.getElementById('faq-a' + n);
  if (a) a.innerHTML = tx('faqA' + n); // EN/AR values include the original inline <a> tags
}
```

> The GCC region-tab **values** (`#gcc-tab-gcc` text) must be set in `applyLangToPage()`, but verify
> they are not also clobbered by `renderGCCGrid()`/tab-render; if a render fn rewrites tab labels,
> move the three `setTextById('gcc-tab-*Label')` calls there instead (or have the render fn read
> `tx('gccTab*Label')`).

### (e) dead fallbacks

None to remove on home — all gaps are missing wiring, not stale `|| 'literal'` fallbacks. (The
`?? key` tail in `tx`/`txGlobal` is the intended fail-open and must stay.)

---

## 2. Calculator (`src/pages/calculator.js` + `calculator.html`)

### (a) i18n mechanism & failure mode

- Page-local dictionary `T = { en, ar }` (`calculator.js:89-298`). Helper `t(key, params={})`
  (`:300`) = `T[STATE.lang][key] ?? T.en[key] ?? key`, then `{token}` substitution. `tGlobal(key)`
  (`:308`) reads global `TRANSLATIONS` (only for shop-handoff links + Freshness/MarketStatus
  panels).
- Single localize path `applyLang()` (`:927-1063`) with local setter `set(id, text)` (`:928`).
  `STATE.lang` defaults `en`, overridden by `?lang=ar`.
- **Failure mode**: static HTML with no `set()` call keeps original English; `t('unknownKey')`
  returns the raw key string. Critically, result-breakdown rows are re-rendered each calc by
  `calcValue/Scrap/Zakat/Buying/Convert` via `renderBreakdownRows()`/`el()` with **hardcoded English
  label literals** (`'Weight'`, `'USD equivalent'`, `'24K equivalent'`, `UNIT_LABELS`) → English in
  AR. `scrap_label_dealer` exists in `T` (with AR `'مبلغ التاجر'`) but `applyLang` never wires
  `#scrap-label-dealer`.

### (b) `translations.js` additions

**N/A — calculator does NOT use `translations.js`.** Add these to the page-local `T` object (EN
block ~`:89-160`, AR block ~`:165-298`). `val_weight` and `scrap_label_dealer` **already exist** —
no addition, wiring only.

**EN (`T.en`):**

```js
    aed_label: '24K AED/g:',
    presets_label: 'Quick:',
    hero_bd_reference: 'Spot-linked reference value',
    hero_bd_karats: '24K through 9K',
    hero_bd_peg: 'AED peg 3.6725',
    hero_bd_excludes: 'Excludes making charges & VAT',
    bd_purity: 'Purity ({karat}K)',
    bd_spot_per_gram: 'Spot price per gram ({currency})',
    bd_usd_equivalent: 'USD equivalent',
    bd_refinery_deduction: 'Refinery deduction',
    bd_24k_equivalent: '24K equivalent',
    bd_nisab: 'Nisab',
    bd_total_gold_value: 'Total gold value',
    bd_nisab_threshold: 'Nisab threshold',
    bd_in_troy_ounces: 'In troy ounces',
    bd_in_tolas: 'In tolas',
    bd_price_per_gram: 'Price per gram ({karat}K)',
    rel_tracker_title: 'Live Tracker',
    rel_tracker_desc: '24+ countries, seven karats (14K–24K), alerts & history',
    rel_shops_title: 'Find a Shop',
    rel_shops_desc: 'Browse gold shops by region, country & city',
    rel_learn_title: 'Karat Guide',
    rel_learn_desc: 'Learn about karats, purity, and gold standards',
    rel_22k_title: '22K Gold Guide',
    rel_22k_desc: '22K purity, AED prices, and what to expect at UAE jewellers',
    rel_24k_title: '24K Gold Guide',
    rel_24k_desc: 'Pure gold prices, bars vs coins, and investment context',
    rel_spot_retail_title: 'Spot vs Retail',
    rel_spot_retail_desc: 'Why calculator outputs differ from jewellery shop prices',
    skip_to_main: 'Skip to main content',
```

**AR (`T.ar`):**

```js
    aed_label: 'عيار 24 درهم/غرام:',
    presets_label: 'سريع:',
    hero_bd_reference: 'قيمة مرجعية مرتبطة بالسعر الفوري',
    hero_bd_karats: 'من عيار 24 إلى عيار 9',
    hero_bd_peg: 'ربط الدرهم 3.6725',
    hero_bd_excludes: 'لا يشمل المصنعية وضريبة القيمة المضافة',
    bd_purity: 'النقاء (عيار {karat})',
    bd_spot_per_gram: 'السعر الفوري لكل غرام ({currency})',
    bd_usd_equivalent: 'المعادل بالدولار الأمريكي',
    bd_refinery_deduction: 'خصم رسوم التكرير',
    bd_24k_equivalent: 'المعادل بعيار 24',
    bd_nisab: 'النصاب',
    bd_total_gold_value: 'إجمالي قيمة الذهب',
    bd_nisab_threshold: 'حد النصاب',
    bd_in_troy_ounces: 'بالأوقية التروي',
    bd_in_tolas: 'بالتولة',
    bd_price_per_gram: 'السعر لكل غرام (عيار {karat})',
    rel_tracker_title: 'المتتبع المباشر',
    rel_tracker_desc: 'أكثر من 24 دولة، سبعة عيارات (عيار 14–24)، تنبيهات وسجلّ تاريخي',
    rel_shops_title: 'ابحث عن محل',
    rel_shops_desc: 'تصفّح محلات الذهب حسب المنطقة والدولة والمدينة',
    rel_learn_title: 'دليل العيارات',
    rel_learn_desc: 'تعرّف على العيارات والنقاء ومعايير الذهب',
    rel_22k_title: 'دليل الذهب عيار 22',
    rel_22k_desc: 'نقاء عيار 22 وأسعار الدرهم وما تتوقعه عند جواهرجي الإمارات',
    rel_24k_title: 'دليل الذهب عيار 24',
    rel_24k_desc: 'أسعار الذهب الخالص والسبائك مقابل العملات وسياق الاستثمار',
    rel_spot_retail_title: 'السعر الفوري مقابل التجزئة',
    rel_spot_retail_desc: 'لماذا تختلف نتائج الحاسبة عن أسعار محلات المجوهرات',
    skip_to_main: 'تخطَّ إلى المحتوى الرئيسي',
```

> Corrected AR typo from source data: `rel_spot_retail_desc` was `…أسعar…` (mixed Latin) → fixed to
> `…أسعار…`.

### (c) id additions (`calculator.html`)

| Selector                                                     | Add id                                                     |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| `.calc-hero-breakdown-item:nth-of-type(1)`                   | `calc-hero-bd-1`                                           |
| `…:nth-of-type(2)`                                           | `calc-hero-bd-2`                                           |
| `…:nth-of-type(3)`                                           | `calc-hero-bd-3`                                           |
| `…:nth-of-type(4)`                                           | `calc-hero-bd-4`                                           |
| `.calc-related-card:nth-of-type(4) .calc-related-title/desc` | `calc-rel-22k-title` / `calc-rel-22k-desc`                 |
| `.calc-related-card:nth-of-type(5) .calc-related-title/desc` | `calc-rel-24k-title` / `calc-rel-24k-desc`                 |
| `.calc-related-card:nth-of-type(6) .calc-related-title/desc` | `calc-rel-spot-retail-title` / `calc-rel-spot-retail-desc` |
| `a.skip-link` (`calculator.html:123`)                        | `calc-skip-link`                                           |

Already have ids: `#calc-aed-label`, `#calc-presets-label`, `#scrap-label-dealer`,
`#calc-rel-tracker-title/-desc`, `#calc-rel-shops-title/-desc`, `#calc-rel-learn-title/-desc`.

### (d) wiring

**Inside `applyLang()`** (static elements):

```js
set('calc-skip-link', t('skip_to_main'));
set('calc-aed-label', t('aed_label'));
set('calc-presets-label', t('presets_label'));
// hero breakdown — markup prepends ✓ / ✗ markers; keep marker, set trailing text
set('calc-hero-bd-1', '✓ ' + t('hero_bd_reference'));
set('calc-hero-bd-2', '✓ ' + t('hero_bd_karats'));
set('calc-hero-bd-3', '✓ ' + t('hero_bd_peg'));
set('calc-hero-bd-4', '✗ ' + t('hero_bd_excludes'));
// related cards
set('calc-rel-tracker-title', t('rel_tracker_title'));
set('calc-rel-tracker-desc', t('rel_tracker_desc'));
set('calc-rel-shops-title', t('rel_shops_title'));
set('calc-rel-shops-desc', t('rel_shops_desc'));
set('calc-rel-learn-title', t('rel_learn_title'));
set('calc-rel-learn-desc', t('rel_learn_desc'));
set('calc-rel-22k-title', t('rel_22k_title'));
set('calc-rel-22k-desc', t('rel_22k_desc'));
set('calc-rel-24k-title', t('rel_24k_title'));
set('calc-rel-24k-desc', t('rel_24k_desc'));
set('calc-rel-spot-retail-title', t('rel_spot_retail_title'));
set('calc-rel-spot-retail-desc', t('rel_spot_retail_desc'));
// dealer payout label (key already in T, never wired)
{
  const d = document.getElementById('scrap-label-dealer');
  if (d) {
    const pct = document.getElementById('scrap-pct-display');
    d.replaceChildren(`${t('scrap_label_dealer')} (`, pct || document.createTextNode('90'), '%)');
  }
}
```

> Verify the exact ✓/✗ marker markup in `calculator.html` for the four `.calc-hero-breakdown-item`s;
> if the marker is a separate `<span aria-hidden>` child rather than a leading glyph, set only the
> text node instead of prepending the glyph to a flat string.

**In the calc functions** (replace hardcoded English literals in the `rows[]` / `el()` builders —
these run on every calc, not via `applyLang`):

```js
// calcValue():
[t('val_weight'), …]                                   // was 'Weight'
[t('bd_purity', { karat }), `${(purity*100).toFixed(1)}%`]
[t('bd_spot_per_gram', { currency }), formatPrice(gramPriceUsd*rate, currency, decimals)]
[t('bd_usd_equivalent'), formatPrice(totalUsd, 'USD', 2)]
rows.push([t('bd_refinery_deduction'), '5%']);          // scrap branch
// calcZakat():
[t('bd_24k_equivalent'), `${grams24kEquiv.toFixed(2)} g`]   // both branches
[t('bd_nisab'), `${NISAB_GRAMS_24K} g`]                     // below-nisab branch
[t('bd_total_gold_value'), formatPrice(totalLocal, currency, decimals)]
[t('bd_nisab_threshold'), `${NISAB_GRAMS_24K} g (${formatPrice(nisabLocal, currency, decimals)})`]
// calcBuying():
[t('bd_in_troy_ounces'), `${ozYouGet.toFixed(4)} ozt`]
[t('bd_in_tolas'), `${tolaYouGet.toFixed(3)} tola`]
[t('bd_price_per_gram', { karat }), formatPrice(gramPriceLocal, currency, …)]
```

> Because these rows re-render on each calculation, they need no `applyLang` re-trigger — but ensure
> a results panel that is already on-screen at language-toggle time is re-rendered (re-run the last
> calc) so visible breakdowns flip to AR immediately; otherwise they only flip on the next calculate
> click.

### (e) dead fallbacks

None to delete. The `'Weight'`/`'USD equivalent'`/`UNIT_LABELS` English literals being replaced are
not `|| fallback` expressions — they are the only source today. After wiring, `UNIT_LABELS` should
be sourced through `t()` or duplicated per-lang if still referenced.

---

## 3. Shops (`src/pages/shops.js` + `shops.html`)

### (a) i18n mechanism & failure mode

- Self-contained: own dict `TXT = { en, ar }` (`shops.js:94-401`) — does **not** use
  `translations.js`. Helper `t(key)` (`:403`) = `TXT[STATE.lang]?.[key] ?? TXT.en[key] ?? key`. Some
  keys are functions (`count: (n)=>…`, called `t('count')(n)`).
- `applyStaticText()` (`:979-1110`) called from `updateLanguage()` (`:2151-2163`), which also
  re-runs filter/header/chip builders and manually sets view-toggle labels.
- **Failure mode**: unhydrated element shows EN in AR (fail-soft to EN value, then raw key). Three
  buckets of gaps: (a) elements with no hydration call (skip-link, quick-action labels [keys
  `quickActionsCalc/Rates/UAE` exist], market-guide chips, filter-toggle label, featured title, nine
  resource chips, empty-state submit); (b) `#shops-map-hint` whose `mapHint` key **exists** but is
  only toggled `hidden` (`:1995-1997`), never `textContent`-set; (c) the entire `initNearMe` IIFE
  (`:2439-2667`) — every status/error/fallback/distance/map-button string is a hardcoded English
  literal.

### (b) `translations.js` additions

**N/A — shops does NOT use `translations.js`.** Add to page-local `TXT`.
`quickActionsCalc/Rates/UAE` and `mapHint` **already exist** — wiring only. Add the rest to `TXT.en`
and `TXT.ar`:

**EN (`TXT.en`):**

```js
    skipToContent: 'Skip to main content',
    guideDubaiSouk: 'Dubai Gold Souk Guide',
    guideKhanKhalili: 'Khan el-Khalili Guide',
    filterAndSort: 'Filter & Sort',
    featuredTitle: 'Featured Markets',
    emptySubmitPrompt: 'Know a gold shop or market that should be listed?',
    emptySubmitLink: 'Submit a shop →',
    resourceBuyingGuide: '📖 How to Buy Gold',
    resource24v22: '⚖️ 24K vs 22K Guide',
    resourceKaratCompare: '💎 Karat Comparison',
    resourceLiveTracker: '📈 Live Price Tracker',
    resourceCalculator: '🧮 Gold Calculator',
    resourceHowPrices: '🔬 How Prices Work',
    resourceDubaiSouk: '🏛 Dubai Gold Souk',
    resourceKhanKhalili: '🏛 Khan El-Khalili',
    resourceListShop: '➕ List a Shop',
    nearmeGettingLocation: 'Getting your location…',
    nearmeLocationFound: 'Location found ({lat}, {lng}). Finding nearby markets…',
    nearmeNoGeolocation: 'Your browser does not support Geolocation. Try a modern browser.',
    nearmeLoadError: 'Could not load nearby markets. Please try again.',
    nearmeErrorDenied: 'Location access was denied. Please allow location in your browser settings.',
    nearmeErrorPosition: 'Could not determine your position. Check your device GPS or network.',
    nearmeErrorTimeout: 'Location request timed out. Please try again.',
    nearmeErrorGeneric: 'Location error. Please try again.',
    nearmeClosestIntro: 'Closest gold markets in our directory:',
    nearmeAway: 'away',
    nearmeUnderOneKm: '<1 km',
    nearmeKm: 'km',
    nearmeOpenOnMap: '🗺️ Open my location on map',
    nearmeFallbackText: "We couldn't identify a specific market in our directory for your location, but you can search for nearby gold shops on the map.",
    nearmeViewOsm: '🗺️ View on OpenStreetMap',
    nearmeSearchGoogle: '📍 Search on Google Maps',
```

**AR (`TXT.ar`):**

```js
    skipToContent: 'تخطَّ إلى المحتوى الرئيسي',
    guideDubaiSouk: 'دليل سوق الذهب بدبي',
    guideKhanKhalili: 'دليل خان الخليلي',
    filterAndSort: 'تصفية وترتيب',
    featuredTitle: 'أسواق مميزة',
    emptySubmitPrompt: 'هل تعرف محل أو سوق ذهب يستحق الإدراج؟',
    emptySubmitLink: 'اقترح محلاً ←',
    resourceBuyingGuide: '📖 كيفية شراء الذهب',
    resource24v22: '⚖️ دليل عيار 24 مقابل عيار 22',
    resourceKaratCompare: '💎 مقارنة العيارات',
    resourceLiveTracker: '📈 متتبع الأسعار المباشر',
    resourceCalculator: '🧮 حاسبة الذهب',
    resourceHowPrices: '🔬 كيف تُحتسب الأسعار',
    resourceDubaiSouk: '🏛 سوق الذهب بدبي',
    resourceKhanKhalili: '🏛 خان الخليلي',
    resourceListShop: '➕ أضف محلاً',
    nearmeGettingLocation: 'جارٍ تحديد موقعك…',
    nearmeLocationFound: 'تم تحديد الموقع ({lat}، {lng}). جارٍ البحث عن الأسواق القريبة…',
    nearmeNoGeolocation: 'متصفحك لا يدعم تحديد الموقع الجغرافي. جرّب متصفحاً حديثاً.',
    nearmeLoadError: 'تعذّر تحميل الأسواق القريبة. يرجى المحاولة مرة أخرى.',
    nearmeErrorDenied: 'تم رفض الوصول إلى الموقع. يرجى السماح بالوصول إلى الموقع في إعدادات متصفحك.',
    nearmeErrorPosition: 'تعذّر تحديد موقعك. تحقق من نظام تحديد المواقع GPS أو الشبكة في جهازك.',
    nearmeErrorTimeout: 'انتهت مهلة طلب تحديد الموقع. يرجى المحاولة مرة أخرى.',
    nearmeErrorGeneric: 'خطأ في تحديد الموقع. يرجى المحاولة مرة أخرى.',
    nearmeClosestIntro: 'أقرب أسواق الذهب في دليلنا:',
    nearmeAway: 'على بُعد',
    nearmeUnderOneKm: 'أقل من كم',
    nearmeKm: 'كم',
    nearmeOpenOnMap: '🗺️ افتح موقعي على الخريطة',
    nearmeFallbackText: 'لم نتمكن من تحديد سوق معين في دليلنا لموقعك، لكن يمكنك البحث عن محلات الذهب القريبة على الخريطة.',
    nearmeViewOsm: '🗺️ عرض على OpenStreetMap',
    nearmeSearchGoogle: '📍 البحث على خرائط Google',
```

### (c) id additions (`shops.html`)

| Selector                                             | Add id                                                                                                               |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `a.skip-link[href="#main-content"]`                  | `shops-skip-link` (or use `document.querySelector('.skip-link')`)                                                    |
| `.shops-market-guides a[href*="dubai-gold-souk"]`    | `shops-guide-dubai`                                                                                                  |
| `.shops-market-guides a[href*="khan-el-khalili"]`    | `shops-guide-khan`                                                                                                   |
| `.shops-empty-submit`                                | `shops-empty-submit`                                                                                                 |
| `.shops-empty-submit a.shops-empty-submit-link`      | `shops-empty-submit-link`                                                                                            |
| resource chips (9) `.shops-resource-links a[href=…]` | `shops-resource-buying`, `-24v22`, `-karat`, `-tracker`, `-calculator`, `-methodology`, `-dubai`, `-khan`, `-submit` |

Already have ids: `#shops-qa-calc`, `#shops-qa-rates`, `#shops-qa-uae`,
`#shops-filter-toggle-label`, `#shops-featured-title`, `#shops-map-hint`. The `#shops-nearme-status`
/ `#shops-nearme-results` mounts already exist (used by `initNearMe`).

### (d) wiring

**In `applyStaticText()`** (or `updateLanguage()` for the toggle-pattern items):

```js
const skipLink = document.querySelector('.skip-link');
if (skipLink) skipLink.textContent = t('skipToContent');
const qaCalc = document.getElementById('shops-qa-calc');
if (qaCalc) qaCalc.textContent = t('quickActionsCalc');
const qaRates = document.getElementById('shops-qa-rates');
if (qaRates) qaRates.textContent = t('quickActionsRates');
const qaUae = document.getElementById('shops-qa-uae');
if (qaUae) qaUae.textContent = t('quickActionsUAE');
const guideDubai = document.getElementById('shops-guide-dubai');
if (guideDubai) guideDubai.lastChild.textContent = ' ' + t('guideDubaiSouk');
const guideKhan = document.getElementById('shops-guide-khan');
if (guideKhan) guideKhan.lastChild.textContent = ' ' + t('guideKhanKhalili');
const filterToggleLabel = document.getElementById('shops-filter-toggle-label');
if (filterToggleLabel) filterToggleLabel.textContent = t('filterAndSort');
const featuredTitleEl = document.getElementById('shops-featured-title');
if (featuredTitleEl) featuredTitleEl.textContent = t('featuredTitle');
const mapHintEl = document.getElementById('shops-map-hint');
if (mapHintEl) mapHintEl.textContent = t('mapHint'); // key exists; was only toggled hidden
const emptySubmitEl = document.getElementById('shops-empty-submit');
if (emptySubmitEl) emptySubmitEl.firstChild.textContent = t('emptySubmitPrompt') + ' ';
const emptySubmitLink = document.getElementById('shops-empty-submit-link');
if (emptySubmitLink) emptySubmitLink.textContent = t('emptySubmitLink');
const resBuying = document.getElementById('shops-resource-buying');
if (resBuying) resBuying.textContent = t('resourceBuyingGuide');
const res24v22 = document.getElementById('shops-resource-24v22');
if (res24v22) res24v22.textContent = t('resource24v22');
const resKarat = document.getElementById('shops-resource-karat');
if (resKarat) resKarat.textContent = t('resourceKaratCompare');
const resTracker = document.getElementById('shops-resource-tracker');
if (resTracker) resTracker.textContent = t('resourceLiveTracker');
const resCalc = document.getElementById('shops-resource-calculator');
if (resCalc) resCalc.textContent = t('resourceCalculator');
const resMethod = document.getElementById('shops-resource-methodology');
if (resMethod) resMethod.textContent = t('resourceHowPrices');
const resDubai = document.getElementById('shops-resource-dubai');
if (resDubai) resDubai.textContent = t('resourceDubaiSouk');
const resKhan = document.getElementById('shops-resource-khan');
if (resKhan) resKhan.textContent = t('resourceKhanKhalili');
const resSubmit = document.getElementById('shops-resource-submit');
if (resSubmit) resSubmit.textContent = t('resourceListShop');
```

> For `mapHint`: keep the existing `hidden` toggle at `:1995-1997` and ADD the `textContent` set
> above. The map-guide chips' `.lastChild.textContent` pattern assumes an icon node precedes the
> label text node — verify the chip markup; if the label is the only child, set `.textContent`
> directly.

**Inside the `initNearMe` IIFE (`:2439-2667`)** — `t` and `STATE` are module-scoped and reachable in
the closure:

```js
setStatus(t('nearmeGettingLocation'), 'info');
setStatus(
  t('nearmeLocationFound').replace('{lat}', lat.toFixed(4)).replace('{lng}', lng.toFixed(4)),
  'info'
);
setStatus(t('nearmeNoGeolocation'), 'error');
setStatus(t('nearmeLoadError'), 'error');
// geolocation error handler:
const msgs = { 1: t('nearmeErrorDenied'), 2: t('nearmeErrorPosition'), 3: t('nearmeErrorTimeout') };
setStatus(msgs[err.code] || t('nearmeErrorGeneric'), 'error');
// findNearestMarkets results template:
`<p class="nearme-intro">${t('nearmeClosestIntro')}</p>``<span class="nearme-dist">${m.distKm < 1 ? t('nearmeUnderOneKm') : Math.round(m.distKm).toLocaleString(STATE.lang) + ' ' + t('nearmeKm')} ${t('nearmeAway')}</span>``<a href="…" target="_blank" rel="noopener noreferrer" class="nearme-map-btn">${t('nearmeOpenOnMap')}</a>`
// showFallback template:
`<p>${t('nearmeFallbackText')}</p>``<a href="${osmUrl}" target="_blank" rel="noopener noreferrer" class="nearme-map-btn">${t('nearmeViewOsm')}</a>``<a href="${googleUrl}" target="_blank" rel="noopener noreferrer" class="nearme-map-btn">${t('nearmeSearchGoogle')}</a>`;
```

Replace the literals at `:2549` (`setStatus`), `:2558-2566` (fallback), `:2607` (`nearme-intro`),
`:2615` (`<1 km`/`km`/`away`), `:2622-2623` (map links).

### (e) dead fallbacks

- The hardcoded English literals in `initNearMe` and the static chips are the live source today (not
  `|| fallback` expressions), so there's nothing to delete — just replace them with `t()` calls.
- `mapHint` key already in `TXT` was effectively dead (declared, never read). After wiring it
  becomes live; no removal needed.

---

## 4. Methodology (`src/pages/methodology.js` + `methodology.html`)

### (a) i18n mechanism & failure mode

- Page-local `T = { en, ar }` (`methodology.js:14-56`), helper `t(key)` (`:58`) =
  `T[STATE.lang]?.[key] ?? T.en[key] ?? key`.
- **Key insight — the translation key IS the element id.** `applyLanguage()` (`:62-69`) iterates
  `Object.keys(T.en)` and does `document.getElementById(key).textContent = t(key)`. So adding a key
  whose name matches an existing element id auto-wires it — **no explicit wiring line is required**.
- **Failure mode**: a section heading/paragraph that has no matching key in `T.en` is never iterated
  → stays English in AR. `#overview-h2` exists in HTML (`methodology.html:127`) but has no
  `overview-h2` key in `T`, so it never flips.

### (b) `translations.js` additions

**N/A.** Add to the page-local `T`:

**EN (`T.en`):**

```js
    'overview-h2': 'Overview',
```

**AR (`T.ar`):**

```js
    'overview-h2': 'نظرة عامة',
```

### (c) id additions

None — `<h2 id="overview-h2">Overview</h2>` already exists at `methodology.html:127`.

### (d) wiring

None — `applyLanguage()`'s `Object.keys(T.en)` loop auto-hydrates any element whose id equals a `T`
key. Adding the `overview-h2` key is sufficient.

> When auditing the rest of the page, any other `<h2>/<p>` with a stable id but no `T` key is a
> latent gap fixable the same way (add the key only).

### (e) dead fallbacks

None.

---

## 5. Country template — two variants

### Variant A — `countries/{slug}/index.html` (driven by `countries/country-page.js`)

**(a) mechanism:** local `T = { en, ar }` (`country-page.js:57-150`), `t(key)` (`:152`) =
`T[STATE.lang]?.[key] ?? T.en[key] ?? key`. Does **not** read `translations.js`. Sections re-render
wholesale via `innerHTML` in `renderAll(cfg)` (`:622`), which re-runs on every lang toggle. **Fails
open** to `T.en` then raw key. The body `<a class="skip-link">` is never selected by this controller
→ stays English.

### Variant B — `countries/{slug}/gold-price/index.html` (driven by `src/lib/page-hydrator.js`)

**(a) mechanism:** GLOBAL `translations.js` via `tx(lang, key, params)` (`page-hydrator.js:93`)
which prefixes `country.`. Most ids are overwritten by `setText(...tx(lang,'…'))`. **Fails open** to
`TRANSLATIONS.en['country.'+key]` then raw `country.{key}`. Two strings are never touched: the body
`.skip-link` and the static inline `Methodology →` link in the cards-section head
(`countries/uae/gold-price/index.html:164`).

### (b) `translations.js` additions

These go in the GLOBAL `translations.js` under the `country.*` namespace (EN region ~`:1019-1081`,
AR region ~`:2280-2341`) — used by Variant B's `tx`:

**EN:**

```js
    'country.inlineMethodology': 'Methodology',
    'country.skipLink': 'Skip to main content',
```

**AR:**

```js
    'country.inlineMethodology': 'المنهجية',
    'country.skipLink': 'تخطّ إلى المحتوى الرئيسي',
```

> `inlineMethodology` value is stored **without** the trailing `→`/`←` arrow; the wiring appends a
> direction-correct arrow (see (d)). Storing the bare label keeps the arrow logic in one place and
> avoids a wrong-direction glyph in RTL.

**For Variant A** (`country-page.js` local `T`) the skip-link needs a key in the page-private dict
too (it cannot read `translations.js`):

```js
// T.en
    skipLink: 'Skip to main content',
// T.ar
    skipLink: 'تخطّ إلى المحتوى الرئيسي',
```

### (c) id additions

| Variant | Selector                                                                                                                     | Add id                                                    |
| ------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| B       | `.country-section-head .country-inline-link[href$="methodology.html#country-reference-pages"]` (`gold-price/index.html:164`) | `country-cards-methodology-link`                          |
| A & B   | `body > a.skip-link[href="#main-content"]`                                                                                   | none — select via `document.querySelector('a.skip-link')` |

### (d) wiring

**Variant B — inside `renderCountryKaratCards` (or wherever the cards-section head renders) in
`page-hydrator.js`:**

```js
setText(
  document.getElementById('country-cards-methodology-link'),
  `${tx(lang, 'inlineMethodology')} ${lang === 'ar' ? '←' : '→'}`
);
setText(document.querySelector('a.skip-link'), tx(lang, 'skipLink'));
```

**Variant A — inside `renderAll(cfg)` in `country-page.js`** (runs on every toggle; already sets
`dir`/`lang` at `:629-630`):

```js
const skip = document.querySelector('a.skip-link');
if (skip) skip.textContent = t('skipLink');
```

### (e) dead fallbacks

None. The static `Methodology →` literal and the `.skip-link` text are the only source today;
replace via wiring. Keep the `?? key` fail-open tails in both `tx`/`t`.

---

## 6. Consolidated leaked-key guard — every translation-lookup helper & call pattern in `src/`

A static guard should flag any call to these helpers whose resolved value equals the **raw key
string** (i.e., the fail-open `?? key` / `?? fullKey` tail fired). Definitions confirmed by scanning
`src/` + `countries/`:

| Helper / pattern                                           | File(s)                                                                                | Signature                                     | Fail-open tail to detect     |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------- |
| `tx(key)` (home)                                           | `src/pages/home.js:141`                                                                | prefixes `home.`                              | returns `key`                |
| `txGlobal(key)` (home)                                     | `src/pages/home.js:146`                                                                | global `TRANSLATIONS`                         | returns `key`                |
| `setTextById(id, text)`                                    | `src/pages/home.js:188`                                                                | setter (sink)                                 | n/a (sink)                   |
| `t(key, params)` (calc)                                    | `src/pages/calculator.js:300`                                                          | local `T` + `{token}`                         | returns `key`                |
| `tGlobal(key)` (calc)                                      | `src/pages/calculator.js:308`                                                          | global `TRANSLATIONS`                         | returns `key`                |
| `t(key)` (shops)                                           | `src/pages/shops.js:403`                                                               | local `TXT`; some values are fns              | returns `key`                |
| `t(key)` (methodology)                                     | `src/pages/methodology.js:58`                                                          | local `T`; **key == element id**              | returns `key`                |
| `t(key)` (country-page A)                                  | `countries/country-page.js:152`                                                        | local `T`                                     | returns `key`                |
| `tx(lang, key, params)` (country B + shared hydrator)      | `src/lib/page-hydrator.js:93`                                                          | prefixes `country.`                           | returns `country.{key}`      |
| `tx(key)` (markets)                                        | `src/pages/markets.js:16`                                                              | —                                             | returns key                  |
| `applyLang()` (markets)                                    | `src/pages/markets.js:92`                                                              | localize path                                 | —                            |
| `t(key)` (terms)                                           | `src/pages/terms.js:50`; `applyLanguage` `:54`                                         | local dict                                    | returns key                  |
| `t(key)` (privacy)                                         | `src/pages/privacy.js:52`; `applyLanguage` `:56`                                       | local dict                                    | returns key                  |
| `t(key)` (submit-shop)                                     | `src/pages/submit-shop.js:72`                                                          | local dict                                    | returns key                  |
| `t()` / `applyLang()` (compare)                            | `src/pages/compare.js:156`, `:716`                                                     | local                                         | returns key                  |
| `tx(key)` / `applyLang()` (invest)                         | `src/pages/invest.js:645`, `:1104`                                                     | —                                             | returns key                  |
| `tx(key, arg)` (dashboard)                                 | `src/pages/dashboard.js:88`                                                            | —                                             | returns key                  |
| `tx(key)` (account)                                        | `src/pages/account.js:32`                                                              | —                                             | returns key                  |
| `txGlobal(key)` (tracker-pro)                              | `src/pages/tracker-pro.js:87`                                                          | global `TRANSLATIONS`                         | returns key                  |
| `tx(key, params=)` (tracker ctx)                           | `src/tracker/_ctx.js:18` (exported)                                                    | shared tracker                                | returns key                  |
| `applyLang(renderer)` (learn)                              | `src/pages/learn.js:44`                                                                | —                                             | —                            |
| `t(lang, key, vars)` (learn-hub-ui)                        | `src/pages/learn-hub-ui.js:13`                                                         | —                                             | returns key                  |
| `t(key, replacements)` (article/toc renderers)             | `src/learn-hub/article-renderer.js:246`, `src/learn-hub/toc-renderer.js:43`            | —                                             | returns key                  |
| `tx(key, fallback)` (breadcrumbs)                          | `src/components/breadcrumbs.js:19`                                                     | explicit `fallback` arg                       | returns `fallback`           |
| `t(lang, key, params)` (FreshnessStrip)                    | `src/components/FreshnessStrip.js:14`                                                  | —                                             | returns key                  |
| `tx(lang, key)` (price-fetch-error)                        | `src/components/price-fetch-error.js:8`                                                | reads `status.*`                              | returns key                  |
| `t(key, replacements)` (alert-manager)                     | `src/components/alert-manager.js:121`                                                  | —                                             | returns key                  |
| `t(key)` (shops-compare)                                   | `src/components/shops-compare.js:65`                                                   | —                                             | returns key                  |
| `tx(lang, key)` / `applyLang(lang)` (not-found)            | `src/pages/not-found.js:29`, `:35`                                                     | —                                             | returns key                  |
| `applyLang(lang)` (insights)                               | `src/pages/insights.js:114`                                                            | —                                             | —                            |
| `t = LABELS[lang]` (MarketSummaryTicker, methodology-live) | `src/components/MarketSummaryTicker.js:76/127/204`, `src/pages/methodology-live.js:34` | object indexed by lang, accessed `t.someProp` | property-access, not key-arg |

**Guard regex seed (helper-call sites):**
`\b(tx|txGlobal|tGlobal|t)\s*\(\s*['"\`]`and the setter`setTextById\(`. **Leaked-key signature at runtime:** the helper's return `===`the literal it was called with (or, for the`country.`hydrator, a value matching`/^country\./`). A unit/lint check can iterate each page's `T`/`TXT`/`TRANSLATIONS`and assert every key referenced in`applyLang`/`applyStaticText`/`renderAll`exists in **both**`en`and`ar`.

> Two structural classes the guard must NOT false-positive on: (1) the **methodology** pattern where
> `key === elementId` (the loop is `Object.keys(T.en)`), and (2) the `LABELS[lang]` object-property
> accessors (MarketSummaryTicker, methodology-live, FreshnessStrip-style) which never produce a
> bare-key leak.

---

## 7. Recommended page-by-page integration order

1. **Methodology** — lowest risk: one key, zero wiring (key == id auto-loop), zero HTML id edits.
   Validates the workflow and the leaked-key guard on a trivial surface.
2. **Home** — highest user-facing value (FAQ + skip-link + GCC tabs). All edits land in one
   `applyLangToPage()` + `translations.js` `home.*` + `index.html` ids. Watch the FAQ `innerHTML`
   (anchors) and the GCC-tab-vs-render ordering caveat.
3. **Calculator** — two-part change (static `applyLang` + per-calc `rows[]` literals). Do
   `applyLang` static items first (low risk), then the breakdown-row `t()` swaps, re-rendering the
   open results panel on toggle. Largest count (32).
4. **Country template** — touches two controllers + the GLOBAL `translations.js` (`country.*`) plus
   the page-private `country-page.js` `T`. Sequence: add global
   `country.inlineMethodology`/`country.skipLink` and Variant-B wiring first, then Variant-A
   `skipLink` in `renderAll`. Regenerate/spot-check both `countries/uae/index.html` and
   `countries/uae/gold-price/index.html`.
5. **Shops** — largest and riskiest (36): static chips + the `initNearMe` IIFE with
   templated/interpolated strings and a geolocation error map. Do static `applyStaticText` items
   first, then the closure literals last (they need live geolocation to exercise). Re-run the
   leaked-key guard after, since shops is fully self-contained.

After each page: `npm test && npm run lint && npm run validate`, and `npm run build` for any page
touching HTML/CSS/JS (per `AGENTS.md` core commands).
