# Tracker EN/AR i18n Parity Dataset (workflow-generated, reference)

> 183 strings across: live-toolbar, chart-panel, alerts-overlay, planner-overlay, archive-mode,
> exports-mode, method-mode, wire-kbd-misc. NOTE: the synthesis below may be truncated in storage;
> treat it as a reference and verify each wiring snippet against the live markup. Integrate
> section-by-section, gating each batch green.

All counts confirmed (183 total). Now I'll produce the final markdown document with all corrections
applied.

# EN/AR i18n Parity Consolidation — Gold Ticker Live Tracker

## 0. Collision & glossary verification (what I checked and changed)

- **Key collisions vs `src/config/translations.js`:** I imported `TRANSLATIONS` (915 EN keys / 915
  AR keys) and tested all 183 proposed keys. **Zero collisions** in either `en` or `ar`. The
  existing non-`tracker.`-prefixed keys (`archive.rangeAll`, `chart.title`, `alerts.targetLabel`, …)
  live in a different namespace, and the four existing `tracker.archive.*` keys (`sourceNote`,
  `sourceNoteLink`, `noDataDetailed`, `partialDataWarning`) do not overlap the proposed archive
  keys. **No renames required.**
- **Two keys are _referenced by wiring_ but missing from the 183 entries — I added them** (without
  them the wiring fails):
  - `tracker.wire.resume` (`Resume` / `استئناف`) — required by the `wire.pause` toggle wiring in
    `events.js`.
  - `tracker.method.spotBodyBefore` / `…spotBodyMid` / `…spotBodyAfter` — the `method.spotBody`
    `<code>`-split wiring concatenates these three fragments; the single `method.spotBody` string
    cannot be used with that `replaceChildren` wiring. I kept `method.spotBody` as a full-string
    fallback and added the three fragments.
- **Glossary fixes (making charges):** Sitewide the established term is **`المصنعية` /
  `رسوم المصنعية`** (24+ existing AR strings, incl. `tracker.planner.makingCharge` =
  `رسوم المصنعية`, `learn.card.makingTitle` = `رسوم المصنعية`). Five proposed AR strings used the
  off-glossary **`أجور الصياغة`**; I corrected all five to **`المصنعية`** (`planner.feesNote`,
  `planner.jewelryIntro`, `planner.jewelryMakingLabel`, `method.retailBody`, `exports.disclaimer`).
- **Karat term:** Standalone "Karat" labels follow existing convention `العيار` (65 existing uses)
  vs `قيراط` only when paired with a number (`{karat} قيراط`). I normalized the standalone label
  `planner.jewelryKaratLabel` and `karat.jewelryKaratLabel`-style headers to `العيار` for
  consistency with `tracker.controls.karat` = `العيار` and `karat.colKarat` = `العيار`.
  (`keyboard.rowCycleKarat` "Cycle karat" → `تبديل العيار`.)
- **Claim-strength:** Every AR string is reference/estimate-framed and matches EN hedging (`تقديرات`
  = "estimates", `قد تختلف` = "may differ", `مرجعية` = "reference"). No AR string asserts more than
  its EN source. The `⚠` prefix on `planner.feesNote` and emoji-free MSA elsewhere are preserved.
- **`setNodeText` convention note (non-blocking):** `setNodeText(id, text)` takes an **id string**
  and calls `getElementById` itself. A few provided wiring snippets pass a _node_ into
  `setNodeText(...)` (e.g. `archive.rangeLabel`, `archive.thDate`). Those are reproduced verbatim
  below as the dataset specifies, but flagged in §4 with the id-based correction so they don't
  silently no-op.

---

## 1. Summary table

| Section                | Count                                                    |
| ---------------------- | -------------------------------------------------------- |
| live-toolbar           | 10                                                       |
| chart-panel            | 26                                                       |
| alerts-overlay         | 31                                                       |
| planner-overlay        | 25                                                       |
| archive-mode           | 21                                                       |
| exports-mode           | 19                                                       |
| method-mode            | 26 (+3 derived `spotBody*` fragments)                    |
| wire-kbd-misc          | 25 (+1 derived `wire.resume`)                            |
| **Total extracted**    | **183**                                                  |
| **Derived keys added** | **4** (`wire.resume`, `method.spotBodyBefore/Mid/After`) |
| **Grand total to add** | **187**                                                  |

---

## 2. `translations.js` additions

Deduped, ordered by section. Paste the EN block into `TRANSLATIONS.en` and the AR block into
`TRANSLATIONS.ar`. Corrected AR (`المصنعية` glossary, `العيار` standalone karat) is applied. Derived
keys (`wire.resume`, `method.spotBody*`) included.

### EN key:value lines

```js
    /* ── Tracker · live-toolbar ── */
    'tracker.liveToolbar.compareMarketLabel': 'Compare market',
    'tracker.liveToolbar.range3y': '3Y',
    'tracker.liveToolbar.range5y': '5Y',
    'tracker.liveToolbar.rangeAll': 'All',
    'tracker.liveToolbar.autoRefreshOn': 'Auto refresh: on',
    'tracker.liveToolbar.chipSelected': 'Selected view',
    'tracker.liveToolbar.chipSpotOnly': 'Spot only',
    'tracker.liveToolbar.chipCompare': 'Compare market',
    'tracker.liveToolbar.chipWire': 'Wire headlines',
    'tracker.liveToolbar.chipFavorites': 'Favorites only',

    /* ── Tracker · chart-panel ── */
    'tracker.karat.introCopy':
      'Scan 24K/22K/21K/18K reference levels first, then compare with your selected market context and freshness labels.',
    'tracker.karat.ladderAriaLabel': 'Karat ladder',
    'tracker.karat.tableCaption':
      'Karat ladder — spot-linked reference price per selected unit for the selected market',
    'tracker.karat.colKarat': 'Karat',
    'tracker.karat.colPurity': 'Purity',
    'tracker.karat.colSelectedPrice': 'Selected price',
    'tracker.karat.colVs24k': 'vs 24K',
    'tracker.chart.heading': 'Chart and trend context',
    'tracker.chart.headingCopy':
      'Blended spot-linked history: recent ranges use live and cached snapshots; longer ranges use monthly baseline anchored to XAU/USD.',
    'tracker.chart.exportCsv': 'Export visible chart CSV',
    'tracker.chart.downloadJson': 'Download snapshot JSON',
    'tracker.chart.legendMain': 'Selected series',
    'tracker.chart.chartAriaLabel': 'Gold price chart',
    'tracker.chart.emptyTitle':
      'Waiting for price data — select a time range above or refresh to load history.',
    'tracker.chart.emptyNote':
      'Short ranges use live and cached snapshots. Longer ranges use the monthly baseline anchored to XAU/USD.',
    'tracker.chart.statSelectedRange': 'Selected range',
    'tracker.chart.statSelectedRangeNote': 'Waiting for history',
    'tracker.chart.statRangeStart': 'Range start',
    'tracker.chart.statRangeStartNote': 'Reference point',
    'tracker.chart.statRangeMovement': 'Range movement',
    'tracker.chart.statRangeMovementNote': 'Absolute and percentage change',
    'tracker.chart.statDataResolution': 'Data resolution',
    'tracker.chart.statDataResolutionNote': 'Live, daily, or monthly reference history',
    'tracker.chart.rangePlaybackTitle': 'Range playback',
    'tracker.chart.playHistory': 'Play history',
    'tracker.chart.visibleRangeNotesTitle': 'Visible range notes',

    /* ── Tracker · alerts-overlay ── */
    'tracker.alerts.overlayTitle': 'Alerts + presets',
    'tracker.alerts.closeLabel': 'Close alerts panel',
    'tracker.alerts.overlayIntro':
      'Browser-based price alerts — stored locally in your browser only. Alerts fire only while this tab is open. No SMS, email, or server-side notifications.',
    'tracker.alerts.createTitle': 'Create alert',
    'tracker.alerts.scopeLabel': 'Watch price',
    'tracker.alerts.scopeSelected': 'Selected view (current karat + currency)',
    'tracker.alerts.scopeSpot': 'Spot XAU/USD per ounce',
    'tracker.alerts.scopeUae24': 'UAE 24K per gram (AED)',
    'tracker.alerts.directionLabel': 'Trigger when price is',
    'tracker.alerts.directionAbove': 'Above target',
    'tracker.alerts.directionBelow': 'Below target',
    'tracker.alerts.targetLabel': 'Target price',
    'tracker.alerts.targetPlaceholder': 'Enter target price',
    'tracker.alerts.targetHint':
      'Use spot-linked reference prices as a guide. Retail prices may differ.',
    'tracker.alerts.saveAlert': 'Save alert',
    'tracker.alerts.enableNotifications': 'Enable notifications',
    'tracker.alerts.savedTitle': 'Saved alerts',
    'tracker.alerts.browserOnlyNote':
      'Local alerts: Browser alerts fire only while this tab is open. Server email alerts (if available) require verification and run from backend checks. They may be unavailable when backend services are unreachable.',
    'tracker.alerts.savePresetTitle': 'Save preset',
    'tracker.alerts.presetNameLabel': 'Preset name',
    'tracker.alerts.presetNamePlaceholder': 'Example: UAE 24K per gram',
    'tracker.alerts.saveCurrentSetup': 'Save current setup',
    'tracker.alerts.copyShareableUrl': 'Copy shareable URL',
    'tracker.alerts.savedPresetsTitle': 'Saved presets',
    'tracker.alerts.notifyUnsupported': 'Browser notifications not supported.',
    'tracker.alerts.notifyGranted': 'Notifications enabled.',
    'tracker.alerts.notifyBlocked': 'Notifications blocked.',
    'tracker.alerts.notifyRequestFailed': 'Could not request notification permission.',
    'tracker.alerts.notifyTitle': 'Gold Price Alert',
    'tracker.alerts.notifyBody': 'XAU/USD {direction} {target}: now ${spot}',
    'tracker.alerts.liveRegionTriggered':
      'Alert triggered: {alerts} — current price ${spot}',

    /* ── Tracker · planner-overlay ── */
    'tracker.planner.overlayTitle': 'Planners + estimators',
    'tracker.planner.closeLabel': 'Close planner panel',
    'tracker.planner.intro':
      'Turn reference prices into decisions. All calculations use spot-linked estimates — not retail or jewelry quotes.',
    'tracker.planner.feesNote':
      '⚠ Actual purchase prices include making charges, dealer premiums, and applicable taxes. Add these in the fields below or use the full calculator for a more detailed estimate.',
    'tracker.planner.feesNoteLink': 'Methodology →',
    'tracker.planner.budgetTitle': 'Budget planner',
    'tracker.planner.budgetIntro': 'How many grams can I buy with my budget?',
    'tracker.planner.budgetAmountLabel': 'Budget amount (in selected currency)',
    'tracker.planner.budgetFeeLabel': 'Extra fee / premium %',
    'tracker.planner.positionTitle': 'Position tracker',
    'tracker.planner.positionIntro':
      'What is my unrealised gain or loss at the current reference price?',
    'tracker.planner.positionEntryLabel': 'Entry price (per gram, selected currency)',
    'tracker.planner.positionQtyLabel': 'Quantity (grams)',
    'tracker.planner.jewelryTitle': 'Jewelry ticket estimate',
    'tracker.planner.jewelryIntro':
      'Estimate the reference value of a jewelry piece — add making charges, premiums, and VAT to get closer to a retail estimate.',
    'tracker.planner.jewelryWeightLabel': 'Weight (grams)',
    'tracker.planner.jewelryKaratLabel': 'Karat',
    'tracker.planner.jewelryMakingLabel': 'Making charge per gram',
    'tracker.planner.jewelryPremiumLabel': 'Dealer premium %',
    'tracker.planner.jewelryVatLabel': 'Include 5% UAE VAT',
    'tracker.planner.accumTitle': 'Accumulation planner',
    'tracker.planner.accumIntro':
      'How long will it take to reach my target weight at the current reference price?',
    'tracker.planner.accumMonthlyLabel': 'Monthly contribution (selected currency)',
    'tracker.planner.accumTargetLabel': 'Target quantity (grams)',
    'tracker.planner.openFullCalculator': 'Open full calculator for more options →',

    /* ── Tracker · archive-mode ── */
    'tracker.archive.title': 'Archive + lookup',
    'tracker.archive.intro':
      'Browse unified history (baseline + cache), export slices, and jump to the nearest archived point for any date.',
    'tracker.archive.rangeLabel': 'Archive range',
    'tracker.archive.rangeAll': 'All',
    'tracker.archive.searchLabel': 'Search archive',
    'tracker.archive.searchPlaceholder': 'Search month, year, source',
    'tracker.archive.browserHeading': 'Archive browser',
    'tracker.archive.exportVisible': 'Download visible archive CSV',
    'tracker.archive.exportHistory': 'Download full history CSV',
    'tracker.archive.tableCaption':
      'Gold price archive — historical XAU/USD spot and selected market reference prices with data source labels',
    'tracker.archive.thDate': 'Date',
    'tracker.archive.thSpot': 'Spot USD/oz',
    'tracker.archive.thSelected': 'Selected view',
    'tracker.archive.thUae24': 'UAE 24K/g',
    'tracker.archive.thSource': 'Source',
    'tracker.archive.lookupHeading': 'Date lookup',
    'tracker.archive.lookupIntro':
      'Find the closest data point for any date in the archive. Searches baseline + session data.',
    'tracker.archive.lookupDateLabel': 'Lookup date',
    'tracker.archive.runLookup': 'Look up closest point',
    'tracker.archive.seasonalHeading': 'Seasonal patterns',
    'tracker.archive.emptyState':
      'No archive data available for the selected range. Try expanding the range or refreshing.',

    /* ── Tracker · exports-mode ── */
    'tracker.exports.title': 'Exports',
    'tracker.exports.intro':
      'Trustworthy CSV and JSON exports with clear source and timestamp metadata for the current workspace.',
    'tracker.exports.chartTitle': 'Visible chart CSV',
    'tracker.exports.chartBody':
      'Exports the visible historical range with start/end dates, source labels, and data-resolution notes. Includes a freshness header row so recipients know whether points are live, cached, or baseline-derived.',
    'tracker.exports.chartButton': 'Export visible chart CSV',
    'tracker.exports.compareTitle': 'Comparison CSV',
    'tracker.exports.compareBody':
      'Downloads the current country + karat comparison cards in the same order shown in the Compare workspace. Includes currency, karat, unit, and reference-price columns. All values are spot-linked estimates — not retail quotes.',
    'tracker.exports.archiveTitle': 'Archive CSVs',
    'tracker.exports.archiveBody':
      'Download the cached daily archive (visible range) or the full baseline + cache history for longer-term reference. Archive data may include estimated or baseline points — the Source column identifies each.',
    'tracker.exports.archiveButton': 'Visible archive CSV',
    'tracker.exports.historyButton': 'Full history CSV',
    'tracker.exports.snapshotTitle': 'Snapshot JSON',
    'tracker.exports.snapshotBody':
      'Structured JSON with the live snapshot, freshness label, FX rate, selected karat, comparison setup, and export timestamp. Suitable for integrating into scripts or spreadsheets.',
    'tracker.exports.snapshotButton': 'Download snapshot JSON',
    'tracker.exports.briefTitle': 'Market brief text',
    'tracker.exports.briefBody':
      'Plain-text summary of current gold conditions for the selected view — suitable for email or note-taking. Includes freshness label and reference-price disclaimer.',
    'tracker.exports.briefButton': 'Download brief',
    'tracker.exports.disclaimer':
      'All exports contain reference prices only — spot-linked estimates before making charges, premiums, and tax. The Source column in every file identifies whether each data point is live, cached, or baseline-derived.',
    'tracker.exports.disclaimerLink': 'Methodology →',

    /* ── Tracker · method-mode ── */
    'tracker.method.panelTitle': 'Methodology + sources',
    'tracker.method.panelCopy':
      'This workspace is explicit about what is live, what is cached, what is estimated, and what is synthetic baseline.',
    'tracker.method.spotHeading': 'Live spot layer',
    'tracker.method.spotBody':
      'Live spot is pulled in XAU/USD hourly during market hours by .github/workflows/gold-price-fetch.yml and committed to the repository as data/gold_price.json, with retries and fallbacks from cache when networks fail.',
    'tracker.method.spotBodyBefore': 'Live spot is pulled in XAU/USD hourly during market hours by ',
    'tracker.method.spotBodyMid': ' and committed to the repository as ',
    'tracker.method.spotBodyAfter':
      ', with retries and fallbacks from cache when networks fail.',
    'tracker.method.spotLink': 'Site methodology →',
    'tracker.method.fxHeading': 'FX conversion layer',
    'tracker.method.fxBody':
      "FX conversion comes from ExchangeRate-API's USD base feed. AED uses the fixed central-bank peg (3.6725) stored in the site constants — not the API feed — so AED prices are always exact.",
    'tracker.method.fxDocsLink': 'ExchangeRate-API docs',
    'tracker.method.fxSiteLink': 'Site methodology →',
    'tracker.method.karatHeading': 'Karat purity',
    'tracker.method.karatBody':
      'Prices are scaled by karat purity: 24K = 1.0, 22K = 22/24 ≈ 0.9167, 21K = 21/24 ≈ 0.875, 18K = 0.75, 14K = 14/24 ≈ 0.5833. All values are derived mathematically from the spot price — no separate quote per karat.',
    'tracker.method.karatLink': 'Karat math explained →',
    'tracker.method.historyHeading': 'Historical layer',
    'tracker.method.historyBody':
      'Short ranges draw on recent live snapshots cached in your browser. Longer ranges use a monthly baseline merged with those snapshots to avoid gaps and keep exports stable.',
    'tracker.method.historyDataLink': 'DataHub gold dataset',
    'tracker.method.historySiteLink': 'Site methodology →',
    'tracker.method.retailHeading': 'Retail vs bullion',
    'tracker.method.retailBody':
      'All prices are bullion-equivalent estimates based on spot. Actual jewelry and retail prices can differ due to making charges, premiums, and taxes.',
    'tracker.method.retailNotLink': 'What our prices are not →',
    'tracker.method.retailDisclaimerLink': 'Disclaimer →',
    'tracker.method.newsHeading': 'News wire',
    'tracker.method.newsBody':
      'The market wire uses the GDELT DOC API in article-list mode, suitable for static sites. When it fails, the workspace falls back to cached headlines or a static explainer strip.',
    'tracker.method.newsDocLink': 'GDELT DOC API',
    'tracker.method.footerFullLink': 'Read full methodology →',
    'tracker.method.footerFreshnessLink': 'Freshness labels explained',
    'tracker.method.footerLimitationsLink': 'Known limitations',

    /* ── Tracker · wire / keyboard / misc ── */
    'tracker.wire.ariaLabel': 'Market wire',
    'tracker.wire.label': 'Market wire',
    'tracker.wire.metaPrefix': 'Live headlines ·',
    'tracker.wire.metaWaiting': 'waiting…',
    'tracker.wire.loadingItem': 'Loading live market headlines…',
    'tracker.wire.refresh': 'Refresh wire',
    'tracker.wire.pause': 'Pause',
    'tracker.wire.resume': 'Resume',
    'tracker.skipLink.label': 'Skip to main content',
    'tracker.heroStats.ariaLabel': 'Key live metrics',
    'tracker.xauusdBadge.ariaLabel': 'XAU/USD spot price',
    'tracker.keyboard.dialogAriaLabel': 'Keyboard shortcuts',
    'tracker.keyboard.closeAriaLabel': 'Close keyboard shortcuts',
    'tracker.keyboard.title': 'Keyboard shortcuts',
    'tracker.keyboard.colKey': 'Key',
    'tracker.keyboard.colAction': 'Action',
    'tracker.keyboard.rowRefresh': 'Refresh prices',
    'tracker.keyboard.rowCycleKarat': 'Cycle karat',
    'tracker.keyboard.rowCycleUnit': 'Cycle unit (g / oz / tola / kg)',
    'tracker.keyboard.rowCopy': 'Copy spot + selected price',
    'tracker.keyboard.rowLive': 'Switch to Live mode',
    'tracker.keyboard.rowCompare': 'Switch to Compare mode',
    'tracker.keyboard.rowAlerts': 'Open Alerts panel',
    'tracker.keyboard.rowPlanner': 'Open Planner panel',
    'tracker.keyboard.rowClose': 'Close open panel',
    'tracker.keyboard.rowHelp': 'Show this help',
```

### AR key:value lines

```js
    /* ── Tracker · live-toolbar ── */
    'tracker.liveToolbar.compareMarketLabel': 'قارن السوق',
    'tracker.liveToolbar.range3y': '3 سنوات',
    'tracker.liveToolbar.range5y': '5 سنوات',
    'tracker.liveToolbar.rangeAll': 'الكل',
    'tracker.liveToolbar.autoRefreshOn': 'تحديث تلقائي: تشغيل',
    'tracker.liveToolbar.chipSelected': 'العرض المحدد',
    'tracker.liveToolbar.chipSpotOnly': 'السعر الفوري فقط',
    'tracker.liveToolbar.chipCompare': 'قارن السوق',
    'tracker.liveToolbar.chipWire': 'عناوين الأخبار',
    'tracker.liveToolbar.chipFavorites': 'المفضلة فقط',

    /* ── Tracker · chart-panel ── */
    'tracker.karat.introCopy':
      'راجع المستويات المرجعية للعيارات 24 و22 و21 و18 أولاً، ثم قارنها مع سياق السوق المحدد وملصقات الحداثة.',
    'tracker.karat.ladderAriaLabel': 'سلم العيارات',
    'tracker.karat.tableCaption':
      'سلم العيارات — السعر المرجعي المرتبط بالسعر الفوري لكل وحدة محددة للسوق المختار',
    'tracker.karat.colKarat': 'العيار',
    'tracker.karat.colPurity': 'النقاء',
    'tracker.karat.colSelectedPrice': 'السعر المختار',
    'tracker.karat.colVs24k': 'مقارنة بعيار 24',
    'tracker.chart.heading': 'الرسم البياني وسياق الاتجاه',
    'tracker.chart.headingCopy':
      'سجل مدمج مرتبط بالسعر الفوري: النطاقات الحديثة تستخدم لقطات مباشرة ومخزنة، والنطاقات الأطول تستخدم خط أساس شهري مرتبط بـ XAU/USD.',
    'tracker.chart.exportCsv': 'تصدير الرسم البياني المرئي بصيغة CSV',
    'tracker.chart.downloadJson': 'تنزيل اللقطة بصيغة JSON',
    'tracker.chart.legendMain': 'السلسلة المختارة',
    'tracker.chart.chartAriaLabel': 'الرسم البياني لسعر الذهب',
    'tracker.chart.emptyTitle':
      'في انتظار بيانات السعر — اختر نطاقاً زمنياً أعلاه أو حدّث الصفحة لتحميل السجل.',
    'tracker.chart.emptyNote':
      'النطاقات القصيرة تستخدم لقطات مباشرة ومخزنة. النطاقات الأطول تستخدم خط الأساس الشهري المرتبط بـ XAU/USD.',
    'tracker.chart.statSelectedRange': 'النطاق المختار',
    'tracker.chart.statSelectedRangeNote': 'في انتظار السجل',
    'tracker.chart.statRangeStart': 'بداية النطاق',
    'tracker.chart.statRangeStartNote': 'النقطة المرجعية',
    'tracker.chart.statRangeMovement': 'حركة النطاق',
    'tracker.chart.statRangeMovementNote': 'التغير المطلق والنسبة المئوية',
    'tracker.chart.statDataResolution': 'دقة البيانات',
    'tracker.chart.statDataResolutionNote': 'سجل مرجعي مباشر أو يومي أو شهري',
    'tracker.chart.rangePlaybackTitle': 'تشغيل النطاق',
    'tracker.chart.playHistory': 'تشغيل السجل',
    'tracker.chart.visibleRangeNotesTitle': 'ملاحظات النطاق المرئي',

    /* ── Tracker · alerts-overlay ── */
    'tracker.alerts.overlayTitle': 'التنبيهات + الإعدادات الجاهزة',
    'tracker.alerts.closeLabel': 'إغلاق لوحة التنبيهات',
    'tracker.alerts.overlayIntro':
      'تنبيهات أسعار قائمة على المتصفح — تُخزَّن محلياً في متصفحك فقط. تُطلَق التنبيهات أثناء فتح هذه العلامة فقط. لا توجد رسائل SMS أو بريد إلكتروني أو إشعارات من جهة الخادم.',
    'tracker.alerts.createTitle': 'إنشاء تنبيه',
    'tracker.alerts.scopeLabel': 'مراقبة السعر',
    'tracker.alerts.scopeSelected': 'العرض المحدد (العيار والعملة الحاليان)',
    'tracker.alerts.scopeSpot': 'السعر الفوري XAU/USD لكل أوقية',
    'tracker.alerts.scopeUae24': 'الإمارات عيار 24 لكل غرام (درهم)',
    'tracker.alerts.directionLabel': 'أطلِق التنبيه عندما يكون السعر',
    'tracker.alerts.directionAbove': 'أعلى من الهدف',
    'tracker.alerts.directionBelow': 'أدنى من الهدف',
    'tracker.alerts.targetLabel': 'السعر المستهدف',
    'tracker.alerts.targetPlaceholder': 'أدخل السعر المستهدف',
    'tracker.alerts.targetHint':
      'استخدم الأسعار المرجعية المرتبطة بالسعر الفوري كدليل. قد تختلف أسعار التجزئة.',
    'tracker.alerts.saveAlert': 'حفظ التنبيه',
    'tracker.alerts.enableNotifications': 'تفعيل الإشعارات',
    'tracker.alerts.savedTitle': 'التنبيهات المحفوظة',
    'tracker.alerts.browserOnlyNote':
      'التنبيهات المحلية: تُطلَق تنبيهات المتصفح أثناء فتح هذه العلامة فقط. تتطلب تنبيهات البريد الإلكتروني عبر الخادم (إن وُجدت) التحقق وتعمل عبر فحوصات الواجهة الخلفية. وقد تكون غير متاحة عند تعذّر الوصول إلى خدمات الواجهة الخلفية.',
    'tracker.alerts.savePresetTitle': 'حفظ الإعداد الجاهز',
    'tracker.alerts.presetNameLabel': 'اسم الإعداد الجاهز',
    'tracker.alerts.presetNamePlaceholder': 'مثال: الإمارات عيار 24 لكل غرام',
    'tracker.alerts.saveCurrentSetup': 'حفظ الإعداد الحالي',
    'tracker.alerts.copyShareableUrl': 'نسخ رابط قابل للمشاركة',
    'tracker.alerts.savedPresetsTitle': 'الإعدادات الجاهزة المحفوظة',
    'tracker.alerts.notifyUnsupported': 'إشعارات المتصفح غير مدعومة.',
    'tracker.alerts.notifyGranted': 'تم تفعيل الإشعارات.',
    'tracker.alerts.notifyBlocked': 'تم حظر الإشعارات.',
    'tracker.alerts.notifyRequestFailed': 'تعذّر طلب إذن الإشعارات.',
    'tracker.alerts.notifyTitle': 'تنبيه سعر الذهب',
    'tracker.alerts.notifyBody': 'XAU/USD {direction} {target}: الآن ${spot}',
    'tracker.alerts.liveRegionTriggered':
      'تم إطلاق تنبيه: {alerts} — السعر الحالي ${spot}',

    /* ── Tracker · planner-overlay ── */
    'tracker.planner.overlayTitle': 'أدوات التخطيط والتقدير',
    'tracker.planner.closeLabel': 'إغلاق لوحة أدوات التخطيط',
    'tracker.planner.intro':
      'حوّل الأسعار المرجعية إلى قرارات. تستند جميع الحسابات إلى تقديرات مرتبطة بالسعر الفوري — وليست أسعار التجزئة أو عروض المجوهرات.',
    'tracker.planner.feesNote':
      '⚠ تشمل أسعار الشراء الفعلية المصنعية وعلاوات التاجر والضرائب المطبّقة. أضِفها في الحقول أدناه أو استخدم الحاسبة الكاملة للحصول على تقدير أكثر تفصيلاً.',
    'tracker.planner.feesNoteLink': 'المنهجية ←',
    'tracker.planner.budgetTitle': 'مخطط الميزانية',
    'tracker.planner.budgetIntro': 'كم غراماً يمكنني شراؤه بميزانيتي؟',
    'tracker.planner.budgetAmountLabel': 'مبلغ الميزانية (بالعملة المختارة)',
    'tracker.planner.budgetFeeLabel': 'رسوم / علاوة إضافية %',
    'tracker.planner.positionTitle': 'متتبّع المركز',
    'tracker.planner.positionIntro':
      'ما هو ربحي أو خسارتي غير المحققة بالسعر المرجعي الحالي؟',
    'tracker.planner.positionEntryLabel': 'سعر الدخول (لكل غرام، بالعملة المختارة)',
    'tracker.planner.positionQtyLabel': 'الكمية (غرامات)',
    'tracker.planner.jewelryTitle': 'تقدير سعر المجوهرات',
    'tracker.planner.jewelryIntro':
      'قدّر القيمة المرجعية لقطعة مجوهرات — أضِف المصنعية والعلاوات وضريبة القيمة المضافة للاقتراب من تقدير سعر التجزئة.',
    'tracker.planner.jewelryWeightLabel': 'الوزن (غرامات)',
    'tracker.planner.jewelryKaratLabel': 'العيار',
    'tracker.planner.jewelryMakingLabel': 'المصنعية لكل غرام',
    'tracker.planner.jewelryPremiumLabel': 'علاوة التاجر %',
    'tracker.planner.jewelryVatLabel': 'تضمين ضريبة القيمة المضافة الإماراتية 5%',
    'tracker.planner.accumTitle': 'مخطط التراكم',
    'tracker.planner.accumIntro':
      'كم من الوقت سيستغرق الوصول إلى وزني المستهدف بالسعر المرجعي الحالي؟',
    'tracker.planner.accumMonthlyLabel': 'المساهمة الشهرية (بالعملة المختارة)',
    'tracker.planner.accumTargetLabel': 'الكمية المستهدفة (غرامات)',
    'tracker.planner.openFullCalculator': 'افتح الحاسبة الكاملة لمزيد من الخيارات ←',

    /* ── Tracker · archive-mode ── */
    'tracker.archive.title': 'الأرشيف والبحث',
    'tracker.archive.intro':
      'تصفّح السجل الموحّد (خط الأساس + الذاكرة المؤقتة)، وصدّر شرائح منه، وانتقل إلى أقرب نقطة مؤرشفة لأي تاريخ.',
    'tracker.archive.rangeLabel': 'نطاق الأرشيف',
    'tracker.archive.rangeAll': 'الكل',
    'tracker.archive.searchLabel': 'البحث في الأرشيف',
    'tracker.archive.searchPlaceholder': 'ابحث بالشهر أو السنة أو المصدر',
    'tracker.archive.browserHeading': 'متصفّح الأرشيف',
    'tracker.archive.exportVisible': 'تنزيل ملف CSV للأرشيف الظاهر',
    'tracker.archive.exportHistory': 'تنزيل ملف CSV للسجل الكامل',
    'tracker.archive.tableCaption':
      'أرشيف أسعار الذهب — السعر الفوري التاريخي لـ XAU/USD والأسعار المرجعية للسوق المختارة مع تسميات مصدر البيانات',
    'tracker.archive.thDate': 'التاريخ',
    'tracker.archive.thSpot': 'السعر الفوري بالدولار/أونصة',
    'tracker.archive.thSelected': 'العرض المختار',
    'tracker.archive.thUae24': 'الإمارات عيار 24 / غرام',
    'tracker.archive.thSource': 'المصدر',
    'tracker.archive.lookupHeading': 'البحث بالتاريخ',
    'tracker.archive.lookupIntro':
      'ابحث عن أقرب نقطة بيانات لأي تاريخ في الأرشيف. يشمل البحث خط الأساس وبيانات الجلسة.',
    'tracker.archive.lookupDateLabel': 'تاريخ البحث',
    'tracker.archive.runLookup': 'ابحث عن أقرب نقطة',
    'tracker.archive.seasonalHeading': 'الأنماط الموسمية',
    'tracker.archive.emptyState':
      'لا تتوفّر بيانات أرشيف للنطاق المختار. جرّب توسيع النطاق أو تحديث البيانات.',

    /* ── Tracker · exports-mode ── */
    'tracker.exports.title': 'التصدير',
    'tracker.exports.intro':
      'تصدير CSV وJSON موثوق مع بيانات وصفية واضحة للمصدر والطابع الزمني لمساحة العمل الحالية.',
    'tracker.exports.chartTitle': 'ملف CSV للمخطط المرئي',
    'tracker.exports.chartBody':
      'يصدّر النطاق التاريخي المرئي مع تواريخ البداية/النهاية ووسوم المصدر وملاحظات دقة البيانات. يتضمن صف ترويسة للحداثة ليعرف المستلمون ما إذا كانت النقاط مباشرة أو مخزّنة مؤقتاً أو مشتقّة من خط الأساس.',
    'tracker.exports.chartButton': 'تصدير ملف CSV للمخطط المرئي',
    'tracker.exports.compareTitle': 'ملف CSV للمقارنة',
    'tracker.exports.compareBody':
      'يُنزّل بطاقات مقارنة الدولة والعيار الحالية بالترتيب نفسه المعروض في مساحة عمل المقارنة. يتضمن أعمدة العملة والعيار والوحدة والسعر المرجعي. جميع القيم تقديرات مرتبطة بالسعر الفوري — وليست عروض أسعار تجزئة.',
    'tracker.exports.archiveTitle': 'ملفات CSV للأرشيف',
    'tracker.exports.archiveBody':
      'نزّل الأرشيف اليومي المخزّن مؤقتاً (النطاق المرئي) أو سجل خط الأساس والتخزين المؤقت الكامل للرجوع إليه على المدى الأطول. قد يتضمن الأرشيف نقاطاً تقديرية أو من خط الأساس — يحدّد عمود المصدر كلاً منها.',
    'tracker.exports.archiveButton': 'ملف CSV للأرشيف المرئي',
    'tracker.exports.historyButton': 'ملف CSV للسجل الكامل',
    'tracker.exports.snapshotTitle': 'لقطة JSON',
    'tracker.exports.snapshotBody':
      'ملف JSON منظّم يتضمن اللقطة المباشرة ووسم الحداثة وسعر الصرف والعيار المحدّد وإعداد المقارنة والطابع الزمني للتصدير. مناسب للدمج في البرامج النصية أو جداول البيانات.',
    'tracker.exports.snapshotButton': 'تنزيل لقطة JSON',
    'tracker.exports.briefTitle': 'نص الموجز السوقي',
    'tracker.exports.briefBody':
      'ملخص نصي بسيط لظروف الذهب الحالية للعرض المحدّد — مناسب للبريد الإلكتروني أو تدوين الملاحظات. يتضمن وسم الحداثة وإخلاء مسؤولية السعر المرجعي.',
    'tracker.exports.briefButton': 'تنزيل الموجز',
    'tracker.exports.disclaimer':
      'تحتوي جميع الملفات المصدّرة على الأسعار المرجعية فقط — تقديرات مرتبطة بالسعر الفوري قبل المصنعية والعلاوات والضريبة. يحدّد عمود المصدر في كل ملف ما إذا كانت كل نقطة بيانات مباشرة أو مخزّنة مؤقتاً أو مشتقّة من خط الأساس.',
    'tracker.exports.disclaimerLink': 'المنهجية ←',

    /* ── Tracker · method-mode ── */
    'tracker.method.panelTitle': 'المنهجية والمصادر',
    'tracker.method.panelCopy':
      'تُوضّح مساحة العمل هذه صراحةً ما هو مباشر، وما هو مخزَّن مؤقتًا، وما هو تقديري، وما هو خط أساس اصطناعي.',
    'tracker.method.spotHeading': 'طبقة السعر الفوري المباشر',
    'tracker.method.spotBody':
      'يُسحب السعر الفوري المباشر بزوج XAU/USD كل ساعة خلال ساعات السوق عبر .github/workflows/gold-price-fetch.yml ويُحفظ في المستودع كملف data/gold_price.json، مع إعادة المحاولات والرجوع إلى الذاكرة المؤقتة عند تعذّر الاتصال بالشبكة.',
    'tracker.method.spotBodyBefore':
      'يُسحب السعر الفوري المباشر بزوج XAU/USD كل ساعة خلال ساعات السوق عبر ',
    'tracker.method.spotBodyMid': ' ويُحفظ في المستودع كملف ',
    'tracker.method.spotBodyAfter':
      '، مع إعادة المحاولات والرجوع إلى الذاكرة المؤقتة عند تعذّر الاتصال بالشبكة.',
    'tracker.method.spotLink': 'منهجية الموقع ←',
    'tracker.method.fxHeading': 'طبقة تحويل العملات',
    'tracker.method.fxBody':
      'يأتي تحويل العملات من تغذية الدولار الأمريكي الأساسية في ExchangeRate-API. ويستخدم الدرهم الإماراتي ربط البنك المركزي الثابت (3.6725) المخزَّن في ثوابت الموقع — وليس من تغذية الواجهة البرمجية — لذا تكون أسعار الدرهم دقيقة دائمًا.',
    'tracker.method.fxDocsLink': 'وثائق ExchangeRate-API',
    'tracker.method.fxSiteLink': 'منهجية الموقع ←',
    'tracker.method.karatHeading': 'نقاء العيار',
    'tracker.method.karatBody':
      'تُحسب الأسعار وفق نقاء العيار: عيار 24 = 1.0، وعيار 22 = 22/24 ≈ 0.9167، وعيار 21 = 21/24 ≈ 0.875، وعيار 18 = 0.75، وعيار 14 = 14/24 ≈ 0.5833. وتُشتق جميع القيم رياضيًا من السعر الفوري — دون عرض سعر منفصل لكل عيار.',
    'tracker.method.karatLink': 'شرح حساب العيار ←',
    'tracker.method.historyHeading': 'الطبقة التاريخية',
    'tracker.method.historyBody':
      'تعتمد النطاقات القصيرة على لقطات مباشرة حديثة مخزَّنة مؤقتًا في متصفحك. أما النطاقات الأطول فتستخدم خط أساس شهريًا مدمجًا مع تلك اللقطات لتجنّب الفجوات والحفاظ على ثبات عمليات التصدير.',
    'tracker.method.historyDataLink': 'مجموعة بيانات الذهب من DataHub',
    'tracker.method.historySiteLink': 'منهجية الموقع ←',
    'tracker.method.retailHeading': 'التجزئة مقابل السبائك',
    'tracker.method.retailBody':
      'جميع الأسعار تقديرات مكافئة للسبائك مبنية على السعر الفوري. وقد تختلف أسعار المجوهرات والتجزئة الفعلية بسبب المصنعية والعلاوات والضرائب.',
    'tracker.method.retailNotLink': 'ما لا تمثّله أسعارنا ←',
    'tracker.method.retailDisclaimerLink': 'إخلاء المسؤولية ←',
    'tracker.method.newsHeading': 'شريط الأخبار',
    'tracker.method.newsBody':
      'يستخدم شريط السوق واجهة GDELT DOC البرمجية في وضع قائمة المقالات، وهو مناسب للمواقع الثابتة. وعند تعذّره، ترجع مساحة العمل إلى العناوين المخزَّنة مؤقتًا أو إلى شريط توضيحي ثابت.',
    'tracker.method.newsDocLink': 'واجهة GDELT DOC البرمجية',
    'tracker.method.footerFullLink': 'اقرأ المنهجية الكاملة ←',
    'tracker.method.footerFreshnessLink': 'شرح بطاقات الحداثة',
    'tracker.method.footerLimitationsLink': 'القيود المعروفة',

    /* ── Tracker · wire / keyboard / misc ── */
    'tracker.wire.ariaLabel': 'شريط أخبار السوق',
    'tracker.wire.label': 'شريط أخبار السوق',
    'tracker.wire.metaPrefix': 'عناوين مباشرة ·',
    'tracker.wire.metaWaiting': 'بانتظار…',
    'tracker.wire.loadingItem': 'جارٍ تحميل عناوين السوق المباشرة…',
    'tracker.wire.refresh': 'تحديث الشريط',
    'tracker.wire.pause': 'إيقاف مؤقت',
    'tracker.wire.resume': 'استئناف',
    'tracker.skipLink.label': 'تخطٍّ إلى المحتوى الرئيسي',
    'tracker.heroStats.ariaLabel': 'أهم المؤشرات المباشرة',
    'tracker.xauusdBadge.ariaLabel': 'السعر الفوري XAU/USD',
    'tracker.keyboard.dialogAriaLabel': 'اختصارات لوحة المفاتيح',
    'tracker.keyboard.closeAriaLabel': 'إغلاق اختصارات لوحة المفاتيح',
    'tracker.keyboard.title': 'اختصارات لوحة المفاتيح',
    'tracker.keyboard.colKey': 'المفتاح',
    'tracker.keyboard.colAction': 'الإجراء',
    'tracker.keyboard.rowRefresh': 'تحديث الأسعار',
    'tracker.keyboard.rowCycleKarat': 'تبديل العيار',
    'tracker.keyboard.rowCycleUnit': 'تبديل الوحدة (غرام / أونصة / تولة / كغ)',
    'tracker.keyboard.rowCopy': 'نسخ السعر الفوري والسعر المحدد',
    'tracker.keyboard.rowLive': 'التبديل إلى الوضع المباشر',
    'tracker.keyboard.rowCompare': 'التبديل إلى وضع المقارنة',
    'tracker.keyboard.rowAlerts': 'فتح لوحة التنبيهات',
    'tracker.keyboard.rowPlanner': 'فتح لوحة المخطِّط',
    'tracker.keyboard.rowClose': 'إغلاق اللوحة المفتوحة',
    'tracker.keyboard.rowHelp': 'عرض هذه المساعدة',
```

> **AR edits applied vs. the raw dataset:** `أجور الصياغة` → `المصنعية` in `planner.feesNote`,
> `planner.jewelryIntro`, `planner.jewelryMakingLabel`, `method.retailBody`, `exports.disclaimer`.
> Standalone karat label normalized to `العيار` in `planner.jewelryKaratLabel` (was `القيراط`),
> `keyboard.rowCycleKarat` (was `القيراط`),
> `method.karatHeading`/`method.karatLink`/`method.karatBody` (`القيراط`→`العيار`/`عيار`),
> `alerts.scopeSelected` (`القيراط`→`العيار`), `alerts.scopeUae24` / `alerts.presetNamePlaceholder`
> / `archive.thUae24` / `exports.compareBody` / `exports.snapshotBody` (`قيراط`→`عيار 24` / `العيار`
> for consistency). All other AR strings reproduced as supplied (verified natural MSA, no
> over-claim).

---

## 3. `tracker.html` id additions (selector → suggested id)

Only entries with `needsId: true`. Add the suggested `id` to the matched element. (Entries with
`needsId: false` already resolve via existing id/attribute selectors or are JS-string replacements —
no HTML change.)

**chart-panel**

- `#section-chart .tracker-command-desk .tracker-panel-head p` → `tp-karat-intro-copy`
- `#section-chart .tracker-ladder-table-wrap` → `tp-karat-ladder-wrap`
- `#section-chart .tracker-karat-table caption.sr-only` → `tp-karat-table-caption`
- `#section-chart .tracker-karat-table thead th:nth-child(1)` → `tp-karat-col-karat`
- `#section-chart .tracker-karat-table thead th:nth-child(2)` → `tp-karat-col-purity`
- `#section-chart .tracker-karat-table thead th:nth-child(3)` → `tp-karat-col-price`
- `#section-chart .tracker-karat-table thead th:nth-child(4)` → `tp-karat-col-vs24k`
- `#tp-chart-heading + p` → `tp-chart-heading-copy`
- `#section-chart .tracker-chart-wrap` → `tp-chart-wrap`
- `#tp-chart-empty p:nth-of-type(1)` → `tp-chart-empty-title`
- `#tp-chart-empty p.source-note` → `tp-chart-empty-note`
- `#tp-chart-stats .tracker-stat-card:nth-child(1) .tracker-stat-k` → `tp-stat-selected-range-k`
- `#tp-chart-stats .tracker-stat-card:nth-child(1) .tracker-stat-s` → `tp-stat-selected-range-s`
- `#tp-chart-stats .tracker-stat-card:nth-child(2) .tracker-stat-k` → `tp-stat-range-start-k`
- `#tp-chart-stats .tracker-stat-card:nth-child(2) .tracker-stat-s` → `tp-stat-range-start-s`
- `#tp-chart-stats .tracker-stat-card:nth-child(3) .tracker-stat-k` → `tp-stat-range-movement-k`
- `#tp-chart-stats .tracker-stat-card:nth-child(3) .tracker-stat-s` → `tp-stat-range-movement-s`
- `#tp-chart-stats .tracker-stat-card:nth-child(4) .tracker-stat-k` → `tp-stat-data-resolution-k`
- `#tp-chart-stats .tracker-stat-card:nth-child(4) .tracker-stat-s` → `tp-stat-data-resolution-s`
- `#section-chart .tracker-two-up .tracker-subpanel:nth-child(1) .tracker-subpanel-head h3` →
  `tp-range-playback-title`
- `#section-chart .tracker-two-up .tracker-subpanel:nth-child(2) .tracker-subpanel-head h3` →
  `tp-visible-range-notes-title`

**alerts-overlay**

- `#tp-overlay-alerts .tp-overlay-intro` → `tp-alerts-overlay-intro`
- `#tp-overlay-alerts article:nth-of-type(1) .tracker-subpanel-head h3` → `tp-alert-create-title`
- `#tp-overlay-alerts article:nth-of-type(2) .tracker-subpanel-head h3` → `tp-alert-saved-title`
- `#tp-overlay-alerts article:nth-of-type(3) .tracker-subpanel-head h3` → `tp-save-preset-title`
- `#tp-overlay-alerts article:nth-of-type(4) .tracker-subpanel-head h3` → `tp-saved-presets-title`
- `label:has(#tp-preset-name) > span` → `tp-preset-name-label`

**planner-overlay**

- `#tp-overlay-planner .tp-overlay-intro` → `tp-planner-intro`
- `#tp-overlay-planner .tracker-help-text` → `tp-planner-fees-note`
- `#tp-overlay-planner article.tracker-subpanel:nth-of-type(1) .tracker-subpanel-head h3` →
  `tp-budget-title`
- `#tp-overlay-planner article.tracker-subpanel:nth-of-type(1) .tracker-subpanel-intro` →
  `tp-budget-intro`
- `#tp-overlay-planner article.tracker-subpanel:nth-of-type(2) .tracker-subpanel-head h3` →
  `tp-position-title`
- `#tp-overlay-planner article.tracker-subpanel:nth-of-type(2) .tracker-subpanel-intro` →
  `tp-position-intro`
- `#tp-overlay-planner article.tracker-subpanel:nth-of-type(3) .tracker-subpanel-head h3` →
  `tp-jewelry-title`
- `#tp-overlay-planner article.tracker-subpanel:nth-of-type(3) .tracker-subpanel-intro` →
  `tp-jewelry-intro`
- `#tp-jewelry-vat + span` → `tp-jewelry-vat-label`
- `#tp-overlay-planner article.tracker-subpanel:nth-of-type(4) .tracker-subpanel-head h3` →
  `tp-accum-title`
- `#tp-overlay-planner article.tracker-subpanel:nth-of-type(4) .tracker-subpanel-intro` →
  `tp-accum-intro`
- `#tp-overlay-planner .tracker-panel-footer-link a.tracker-link` → `tp-planner-full-calc-link`

**archive-mode**

- `#mode-archive .tracker-panel-head h2` → `tp-archive-title`
- `#mode-archive .tracker-panel-head > div > p` → `tp-archive-intro`
- `#mode-archive .tracker-two-up article:first-child .tracker-subpanel-head h3` →
  `tp-archive-browser-heading`
- `#mode-archive .tracker-table caption.sr-only` → `tp-archive-table-caption`
- `#mode-archive .tracker-two-up article:nth-child(2) .tracker-subpanel-head:first-of-type h3` →
  `tp-lookup-heading`
- `#mode-archive .tracker-subpanel-intro` → `tp-lookup-intro`
- `#mode-archive .tracker-two-up article:nth-child(2) .tracker-subpanel-head:last-of-type h3` →
  `tp-seasonal-heading`

**exports-mode**

- `#mode-exports .tracker-panel-head h2` → `tp-exports-title`
- `#mode-exports .tracker-panel-head p` → `tp-exports-intro`
- `#mode-exports .tracker-export-card:nth-of-type(1) .tracker-subpanel-head h3` →
  `tp-exports-chart-title`
- `#mode-exports .tracker-export-card:nth-of-type(1) > p` → `tp-exports-chart-body`
- `#mode-exports .tracker-export-card:nth-of-type(2) .tracker-subpanel-head h3` →
  `tp-exports-compare-title`
- `#mode-exports .tracker-export-card:nth-of-type(2) > p` → `tp-exports-compare-body`
- `#mode-exports .tracker-export-card:nth-of-type(3) .tracker-subpanel-head h3` →
  `tp-exports-archive-title`
- `#mode-exports .tracker-export-card:nth-of-type(3) > p` → `tp-exports-archive-body`
- `#mode-exports .tracker-export-card:nth-of-type(4) .tracker-subpanel-head h3` →
  `tp-exports-snapshot-title`
- `#mode-exports .tracker-export-card:nth-of-type(4) > p` → `tp-exports-snapshot-body`
- `#mode-exports .tracker-export-card:nth-of-type(5) .tracker-subpanel-head h3` →
  `tp-exports-brief-title`
- `#mode-exports .tracker-export-card:nth-of-type(5) > p` → `tp-exports-brief-body`
- `#mode-exports .tracker-export-disclaimer` → `tp-exports-disclaimer`

**method-mode**

- `#mode-method .tracker-panel-head h2` → `tp-method-panel-title`
- `#mode-method .tracker-panel-head p` → `tp-method-panel-copy`
- `#mode-method .tracker-method-card:nth-of-type(1) h3` → `tp-method-spot-heading`
- `#mode-method .tracker-method-card:nth-of-type(1) p` → `tp-method-spot-body`
- `#mode-method .tracker-method-card:nth-of-type(1) a.tracker-inline-link` → `tp-method-spot-link`
- `#mode-method .tracker-method-card:nth-of-type(2) h3` → `tp-method-fx-heading`
- `#mode-method .tracker-method-card:nth-of-type(2) p` → `tp-method-fx-body`
- `#mode-method .tracker-method-card:nth-of-type(2) a[href*='exchangerate-api.com']` →
  `tp-method-fx-docs-link`
- `#mode-method .tracker-method-card:nth-of-type(2) a.tracker-inline-link` →
  `tp-method-fx-site-link`
- `#mode-method .tracker-method-card:nth-of-type(3) h3` → `tp-method-karat-heading`
- `#mode-method .tracker-method-card:nth-of-type(3) p` → `tp-method-karat-body`
- `#mode-method .tracker-method-card:nth-of-type(3) a.tracker-inline-link` → `tp-method-karat-link`
- `#mode-method .tracker-method-card:nth-of-type(4) h3` → `tp-method-history-heading`
- `#mode-method .tracker-method-card:nth-of-type(4) p` → `tp-method-history-body`
- `#mode-method .tracker-method-card:nth-of-type(4) a[href*='datahub.io']` →
  `tp-method-history-data-link`
- `#mode-method .tracker-method-card:nth-of-type(4) a.tracker-inline-link` →
  `tp-method-history-site-link`
- `#mode-method .tracker-method-card:nth-of-type(5) h3` → `tp-method-retail-heading`
- `#mode-method .tracker-method-card:nth-of-type(5) p` → `tp-method-retail-body`
- `#mode-method .tracker-method-card:nth-of-type(5) a[href='methodology.html#not-included']` →
  `tp-method-retail-not-link`
- `#mode-method .tracker-method-card:nth-of-type(5) a[href='methodology.html#disclaimer']` →
  `tp-method-retail-disclaimer-link`
- `#mode-method .tracker-method-card:nth-of-type(6) h3` → `tp-method-news-heading`
- `#mode-method .tracker-method-card:nth-of-type(6) p` → `tp-method-news-body`
- `#mode-method .tracker-method-card:nth-of-type(6) a[href*='gdeltproject.org']` →
  `tp-method-news-doc-link`
- `#mode-method .tracker-method-footer a.btn.btn-outline.btn-sm` → `tp-method-footer-full-link`
- `#mode-method .tracker-method-footer a[href='methodology.html#gold-data']` →
  `tp-method-footer-freshness-link`
- `#mode-method .tracker-method-footer a[href='methodology.html#disclaimer']` →
  `tp-method-footer-limitations-link`

**wire-kbd-misc**

- `.tracker-wire-shell[aria-label="Market wire"]` → `tp-wire-shell`
- `.tracker-wire-label` → `tp-wire-label`
- `.skip-link[href="#tracker-app"]` → `tp-skip-link`
- `#tp-keyboard-help .tp-keyboard-help-panel > h2` → `tp-keyboard-help-title`

> **Note on `tp-method-retail-disclaimer-link` vs `tp-method-footer-limitations-link`:** both target
> `a[href='methodology.html#disclaimer']` but in different containers
> (`.tracker-method-card:nth-of-type(5)` vs `.tracker-method-footer`). Add the id directly in markup
> to each element to avoid ambiguous selectors at runtime.

---

## 4. `localizeStaticTrackerCopy` wiring

Append these statements inside `localizeStaticTrackerCopy()` in `src/pages/tracker-pro.js` (after
the existing `setNodeText(...)` block, before the closing brace). `trackerTx(key)` auto-prefixes
`tracker.`, and `setNodeText(id, text)` takes an **id string**. Some dataset snippets passed a
_node_ into `setNodeText` — those are corrected below to id-based form (otherwise they no-op). The
three JS-string-replacement entries (alerts `notify*` / `notifyTitle` / `notifyBody` /
`liveRegionTriggered`, and the `wire.pause/resume` toggle) are **not** part of
`localizeStaticTrackerCopy` — see §4b.

```js
/* ── live-toolbar ── */
const compareFieldLabel = document.querySelector(
  'label.tracker-field:has(#tp-compare-country) > span'
);
if (compareFieldLabel) compareFieldLabel.textContent = trackerTx('liveToolbar.compareMarketLabel');
const range3yPill = document.querySelector('#tp-range-pills .tracker-pill[data-range="3Y"]');
if (range3yPill) range3yPill.textContent = trackerTx('liveToolbar.range3y');
const range5yPill = document.querySelector('#tp-range-pills .tracker-pill[data-range="5Y"]');
if (range5yPill) range5yPill.textContent = trackerTx('liveToolbar.range5y');
const rangeAllPill = document.querySelector('#tp-range-pills .tracker-pill[data-range="ALL"]');
if (rangeAllPill) rangeAllPill.textContent = trackerTx('liveToolbar.rangeAll');
setNodeText('tp-auto-refresh', trackerTx('liveToolbar.autoRefreshOn'));
const chipSelected = document.querySelector(
  '.tracker-chip-row .tracker-chip[data-metric="selected"]'
);
if (chipSelected) chipSelected.textContent = trackerTx('liveToolbar.chipSelected');
const chipSpot = document.querySelector('.tracker-chip-row .tracker-chip[data-metric="spot"]');
if (chipSpot) chipSpot.textContent = trackerTx('liveToolbar.chipSpotOnly');
const chipCompare = document.querySelector(
  '.tracker-chip-row .tracker-chip[data-metric="compare"]'
);
if (chipCompare) chipCompare.textContent = trackerTx('liveToolbar.chipCompare');
const chipWire = document.querySelector('.tracker-chip-row .tracker-chip[data-toggle="wire"]');
if (chipWire) chipWire.textContent = trackerTx('liveToolbar.chipWire');
const chipFavorites = document.querySelector(
  '.tracker-chip-row .tracker-chip[data-toggle="favorites"]'
);
if (chipFavorites) chipFavorites.textContent = trackerTx('liveToolbar.chipFavorites');

/* ── chart-panel ── */
setNodeText('tp-karat-intro-copy', trackerTx('karat.introCopy'));
document
  .getElementById('tp-karat-ladder-wrap')
  ?.setAttribute('aria-label', trackerTx('karat.ladderAriaLabel'));
setNodeText('tp-karat-table-caption', trackerTx('karat.tableCaption'));
setNodeText('tp-karat-col-karat', trackerTx('karat.colKarat'));
setNodeText('tp-karat-col-purity', trackerTx('karat.colPurity'));
setNodeText('tp-karat-col-price', trackerTx('karat.colSelectedPrice'));
setNodeText('tp-karat-col-vs24k', trackerTx('karat.colVs24k'));
setNodeText('tp-chart-heading', trackerTx('chart.heading'));
setNodeText('tp-chart-heading-copy', trackerTx('chart.headingCopy'));
setButtonCopy(document.getElementById('tp-export-chart'), trackerTx('chart.exportCsv'));
setButtonCopy(document.getElementById('tp-download-json'), trackerTx('chart.downloadJson'));
setNodeText('tp-legend-main', trackerTx('chart.legendMain'));
document
  .getElementById('tp-chart-wrap')
  ?.setAttribute('aria-label', trackerTx('chart.chartAriaLabel'));
setNodeText('tp-chart-empty-title', trackerTx('chart.emptyTitle'));
setNodeText('tp-chart-empty-note', trackerTx('chart.emptyNote'));
setNodeText('tp-stat-selected-range-k', trackerTx('chart.statSelectedRange'));
setNodeText('tp-stat-selected-range-s', trackerTx('chart.statSelectedRangeNote'));
setNodeText('tp-stat-range-start-k', trackerTx('chart.statRangeStart'));
setNodeText('tp-stat-range-start-s', trackerTx('chart.statRangeStartNote'));
setNodeText('tp-stat-range-movement-k', trackerTx('chart.statRangeMovement'));
setNodeText('tp-stat-range-movement-s', trackerTx('chart.statRangeMovementNote'));
setNodeText('tp-stat-data-resolution-k', trackerTx('chart.statDataResolution'));
setNodeText('tp-stat-data-resolution-s', trackerTx('chart.statDataResolutionNote'));
setNodeText('tp-range-playback-title', trackerTx('chart.rangePlaybackTitle'));
setButtonCopy(document.getElementById('tp-playback-btn'), trackerTx('chart.playHistory'));
setNodeText('tp-visible-range-notes-title', trackerTx('chart.visibleRangeNotesTitle'));

/* ── alerts-overlay (static copy only) ── */
setNodeText('tp-overlay-alerts-title', trackerTx('alerts.overlayTitle'));
document
  .querySelector('#tp-overlay-alerts [data-close-overlay="alerts"]')
  ?.setAttribute('aria-label', trackerTx('alerts.closeLabel'));
setNodeText('tp-alerts-overlay-intro', trackerTx('alerts.overlayIntro'));
setNodeText('tp-alert-create-title', trackerTx('alerts.createTitle'));
setNodeText('tp-alert-scope-label', trackerTx('alerts.scopeLabel'));
if (el.alertScope?.options?.[0])
  el.alertScope.options[0].textContent = trackerTx('alerts.scopeSelected');
if (el.alertScope?.options?.[1])
  el.alertScope.options[1].textContent = trackerTx('alerts.scopeSpot');
if (el.alertScope?.options?.[2])
  el.alertScope.options[2].textContent = trackerTx('alerts.scopeUae24');
setNodeText('tp-alert-direction-label', trackerTx('alerts.directionLabel'));
if (el.alertDirection?.options?.[0])
  el.alertDirection.options[0].textContent = trackerTx('alerts.directionAbove');
if (el.alertDirection?.options?.[1])
  el.alertDirection.options[1].textContent = trackerTx('alerts.directionBelow');
setNodeText('tp-alert-target-label', trackerTx('alerts.targetLabel'));
if (el.alertTarget) el.alertTarget.placeholder = trackerTx('alerts.targetPlaceholder');
setNodeText('tp-alert-target-hint', trackerTx('alerts.targetHint'));
setButtonCopy(document.getElementById('tp-save-alert'), trackerTx('alerts.saveAlert'));
setButtonCopy(
  document.getElementById('tp-enable-notifications'),
  trackerTx('alerts.enableNotifications')
);
setNodeText('tp-alert-saved-title', trackerTx('alerts.savedTitle'));
setNodeText('tp-alert-browser-note', trackerTx('alerts.browserOnlyNote'));
setNodeText('tp-save-preset-title', trackerTx('alerts.savePresetTitle'));
setNodeText('tp-preset-name-label', trackerTx('alerts.presetNameLabel'));
if (el.presetName) el.presetName.placeholder = trackerTx('alerts.presetNamePlaceholder');
setButtonCopy(document.getElementById('tp-save-preset'), trackerTx('alerts.saveCurrentSetup'));
setButtonCopy(document.getElementById('tp-copy-url'), trackerTx('alerts.copyShareableUrl'));
setNodeText('tp-saved-presets-title', trackerTx('alerts.savedPresetsTitle'));

/* ── planner-overlay ── */
setNodeText('tp-overlay-planner-title', trackerTx('planner.overlayTitle'));
const plannerClose = document.querySelector('#tp-overlay-planner [data-close-overlay="planner"]');
if (plannerClose) plannerClose.setAttribute('aria-label', trackerTx('planner.closeLabel'));
setNodeText('tp-planner-intro', trackerTx('planner.intro'));
setInlineLinkText(
  document.getElementById('tp-planner-fees-note'),
  trackerTx('planner.feesNote'),
  'methodology.html',
  trackerTx('planner.feesNoteLink')
);
setNodeText('tp-budget-title', trackerTx('planner.budgetTitle'));
setNodeText('tp-budget-intro', trackerTx('planner.budgetIntro'));
setNodeText('tp-budget-amount-label', trackerTx('planner.budgetAmountLabel'));
setNodeText('tp-budget-fee-label', trackerTx('planner.budgetFeeLabel'));
setNodeText('tp-position-title', trackerTx('planner.positionTitle'));
setNodeText('tp-position-intro', trackerTx('planner.positionIntro'));
setNodeText('tp-position-entry-label', trackerTx('planner.positionEntryLabel'));
setNodeText('tp-position-qty-label', trackerTx('planner.positionQtyLabel'));
setNodeText('tp-jewelry-title', trackerTx('planner.jewelryTitle'));
setNodeText('tp-jewelry-intro', trackerTx('planner.jewelryIntro'));
setNodeText('tp-jewelry-weight-label', trackerTx('planner.jewelryWeightLabel'));
setNodeText('tp-jewelry-karat-label', trackerTx('planner.jewelryKaratLabel'));
setNodeText('tp-jewelry-making-label', trackerTx('planner.jewelryMakingLabel'));
setNodeText('tp-jewelry-premium-label', trackerTx('planner.jewelryPremiumLabel'));
setNodeText('tp-jewelry-vat-label', trackerTx('planner.jewelryVatLabel'));
setNodeText('tp-accum-title', trackerTx('planner.accumTitle'));
setNodeText('tp-accum-intro', trackerTx('planner.accumIntro'));
setNodeText('tp-accum-monthly-label', trackerTx('planner.accumMonthlyLabel'));
setNodeText('tp-accum-target-label', trackerTx('planner.accumTargetLabel'));
setNodeText('tp-planner-full-calc-link', trackerTx('planner.openFullCalculator'));

/* ── archive-mode ── */
setNodeText('tp-archive-title', trackerTx('archive.title'));
setNodeText('tp-archive-intro', trackerTx('archive.intro'));
{
  const n = document.querySelector('#tp-archive-range')?.closest('label')?.querySelector('span');
  if (n) n.textContent = trackerTx('archive.rangeLabel');
}
{
  const n = document.querySelector('#tp-archive-range option[value="ALL"]');
  if (n) n.textContent = trackerTx('archive.rangeAll');
}
{
  const n = document
    .querySelector('#tp-archive-search')
    ?.closest('label')
    ?.querySelector('span.sr-only');
  if (n) n.textContent = trackerTx('archive.searchLabel');
}
{
  const archiveSearch = document.getElementById('tp-archive-search');
  if (archiveSearch) archiveSearch.placeholder = trackerTx('archive.searchPlaceholder');
}
setNodeText('tp-archive-browser-heading', trackerTx('archive.browserHeading'));
setButtonCopy(document.getElementById('tp-export-archive'), trackerTx('archive.exportVisible'));
setButtonCopy(document.getElementById('tp-export-history'), trackerTx('archive.exportHistory'));
setNodeText('tp-archive-table-caption', trackerTx('archive.tableCaption'));
{
  const n = document.querySelector('#mode-archive .tracker-table thead th:nth-child(1)');
  if (n) n.textContent = trackerTx('archive.thDate');
}
{
  const n = document.querySelector('#mode-archive .tracker-table thead th:nth-child(2)');
  if (n) n.textContent = trackerTx('archive.thSpot');
}
{
  const n = document.querySelector('#mode-archive .tracker-table thead th:nth-child(3)');
  if (n) n.textContent = trackerTx('archive.thSelected');
}
{
  const n = document.querySelector('#mode-archive .tracker-table thead th:nth-child(4)');
  if (n) n.textContent = trackerTx('archive.thUae24');
}
{
  const n = document.querySelector('#mode-archive .tracker-table thead th:nth-child(5)');
  if (n) n.textContent = trackerTx('archive.thSource');
}
setNodeText('tp-lookup-heading', trackerTx('archive.lookupHeading'));
setNodeText('tp-lookup-intro', trackerTx('archive.lookupIntro'));
{
  const n = document.querySelector('#tp-lookup-date')?.closest('label')?.querySelector('span');
  if (n) n.textContent = trackerTx('archive.lookupDateLabel');
}
setButtonCopy(document.getElementById('tp-run-lookup'), trackerTx('archive.runLookup'));
setNodeText('tp-seasonal-heading', trackerTx('archive.seasonalHeading'));
setNodeText('tp-archive-empty', trackerTx('archive.emptyState'));

/* ── exports-mode ── */
setNodeText('tp-exports-title', trackerTx('exports.title'));
setNodeText('tp-exports-intro', trackerTx('exports.intro'));
setNodeText('tp-exports-chart-title', trackerTx('exports.chartTitle'));
setNodeText('tp-exports-chart-body', trackerTx('exports.chartBody'));
setButtonCopy(document.getElementById('tp-export-chart-2'), trackerTx('exports.chartButton'));
setNodeText('tp-exports-compare-title', trackerTx('exports.compareTitle'));
setNodeText('tp-exports-compare-body', trackerTx('exports.compareBody'));
setNodeText('tp-exports-archive-title', trackerTx('exports.archiveTitle'));
setNodeText('tp-exports-archive-body', trackerTx('exports.archiveBody'));
setButtonCopy(document.getElementById('tp-export-archive-2'), trackerTx('exports.archiveButton'));
setButtonCopy(document.getElementById('tp-export-history-2'), trackerTx('exports.historyButton'));
setNodeText('tp-exports-snapshot-title', trackerTx('exports.snapshotTitle'));
setNodeText('tp-exports-snapshot-body', trackerTx('exports.snapshotBody'));
setButtonCopy(document.getElementById('tp-download-json-2'), trackerTx('exports.snapshotButton'));
setNodeText('tp-exports-brief-title', trackerTx('exports.briefTitle'));
setNodeText('tp-exports-brief-body', trackerTx('exports.briefBody'));
setButtonCopy(document.getElementById('tp-download-brief'), trackerTx('exports.briefButton'));
setInlineLinkText(
  document.getElementById('tp-exports-disclaimer'),
  trackerTx('exports.disclaimer'),
  'methodology.html',
  trackerTx('exports.disclaimerLink')
);

/* ── method-mode ── */
setNodeText('tp-method-panel-title', trackerTx('method.panelTitle'));
setNodeText('tp-method-panel-copy', trackerTx('method.panelCopy'));
setNodeText('tp-method-spot-heading', trackerTx('method.spotHeading'));
{
  const node = document.getElementById('tp-method-spot-body');
  if (node) {
    const codeWorkflow = document.createElement('code');
    codeWorkflow.textContent = '.github/workflows/gold-price-fetch.yml';
    const codeData = document.createElement('code');
    codeData.textContent = 'data/gold_price.json';
    node.replaceChildren(
      trackerTx('method.spotBodyBefore'),
      codeWorkflow,
      trackerTx('method.spotBodyMid'),
      codeData,
      trackerTx('method.spotBodyAfter')
    );
  }
}
setNodeText('tp-method-spot-link', trackerTx('method.spotLink'));
setNodeText('tp-method-fx-heading', trackerTx('method.fxHeading'));
setNodeText('tp-method-fx-body', trackerTx('method.fxBody'));
setNodeText('tp-method-fx-docs-link', trackerTx('method.fxDocsLink'));
setNodeText('tp-method-fx-site-link', trackerTx('method.fxSiteLink'));
setNodeText('tp-method-karat-heading', trackerTx('method.karatHeading'));
setNodeText('tp-method-karat-body', trackerTx('method.karatBody'));
setNodeText('tp-method-karat-link', trackerTx('method.karatLink'));
setNodeText('tp-method-history-heading', trackerTx('method.historyHeading'));
setNodeText('tp-method-history-body', trackerTx('method.historyBody'));
setNodeText('tp-method-history-data-link', trackerTx('method.historyDataLink'));
setNodeText('tp-method-history-site-link', trackerTx('method.historySiteLink'));
setNodeText('tp-method-retail-heading', trackerTx('method.retailHeading'));
setNodeText('tp-method-retail-body', trackerTx('method.retailBody'));
setNodeText('tp-method-retail-not-link', trackerTx('method.retailNotLink'));
setNodeText('tp-method-retail-disclaimer-link', trackerTx('method.retailDisclaimerLink'));
setNodeText('tp-method-news-heading', trackerTx('method.newsHeading'));
setNodeText('tp-method-news-body', trackerTx('method.newsBody'));
setNodeText('tp-method-news-doc-link', trackerTx('method.newsDocLink'));
setNodeText('tp-method-footer-full-link', trackerTx('method.footerFullLink'));
setNodeText('tp-method-footer-freshness-link', trackerTx('method.footerFreshnessLink'));
setNodeText('tp-method-footer-limitations-link', trackerTx('method.footerLimitationsLink'));

/* ── wire / keyboard / misc ── */
document.getElementById('tp-wire-shell')?.setAttribute('aria-label', trackerTx('wire.ariaLabel'));
setNodeText('tp-wire-label', trackerTx('wire.label'));
(() => {
  const m = document.getElementById('tp-wire-meta');
  const u = document.getElementById('tp-wire-updated');
  if (m && u) m.replaceChildren(`${trackerTx('wire.metaPrefix')} `, u);
})();
setNodeText('tp-wire-updated', trackerTx('wire.metaWaiting'));
(() => {
  const item = document.querySelector('#tp-wire-track .tracker-wire-item');
  if (item) item.textContent = trackerTx('wire.loadingItem');
})();
setNodeText('tp-wire-refresh', trackerTx('wire.refresh'));
// wire.pause/resume reflects paused STATE — localize via the toggle in events.js (§4b), not a static set.
setNodeText('tp-skip-link', trackerTx('skipLink.label'));
document
  .getElementById('tp-hero-stats')
  ?.setAttribute('aria-label', trackerTx('heroStats.ariaLabel'));
document
  .getElementById('tp-xauusd-badge')
  ?.setAttribute('aria-label', trackerTx('xauusdBadge.ariaLabel'));
document
  .getElementById('tp-keyboard-help')
  ?.setAttribute('aria-label', trackerTx('keyboard.dialogAriaLabel'));
document
  .getElementById('tp-keyboard-help-close')
  ?.setAttribute('aria-label', trackerTx('keyboard.closeAriaLabel'));
setNodeText('tp-keyboard-help-title', trackerTx('keyboard.title'));
(() => {
  const th = document.querySelector('.tp-keyboard-table thead th:nth-child(1)');
  if (th) th.textContent = trackerTx('keyboard.colKey');
})();
(() => {
  const th = document.querySelector('.tp-keyboard-table thead th:nth-child(2)');
  if (th) th.textContent = trackerTx('keyboard.colAction');
})();
(() => {
  const rows = [
    'keyboard.rowRefresh',
    'keyboard.rowCycleKarat',
    'keyboard.rowCycleUnit',
    'keyboard.rowCopy',
    'keyboard.rowLive',
    'keyboard.rowCompare',
    'keyboard.rowAlerts',
    'keyboard.rowPlanner',
    'keyboard.rowClose',
    'keyboard.rowHelp',
  ];
  document.querySelectorAll('.tp-keyboard-table tbody tr td:nth-child(2)').forEach((td, i) => {
    if (rows[i]) td.textContent = trackerTx(rows[i]);
  });
})();
```

### 4b. Out-of-band JS-string replacements (NOT in `localizeStaticTrackerCopy`)

These are dynamic strings created at runtime; replace the hardcoded literals in place:

- **`src/tracker/events.js` ~line 173** (wire toggle):
  `_el.wireToggle.textContent = paused ? _cb.tx('wire.resume') : _cb.tx('wire.pause');` (or
  `trackerTx(...)` per that module's binding). Sets `Pause`/`Resume` based on state — requires the
  new `tracker.wire.resume` key.
- **`src/tracker/events.js:323`** → replace `'Browser notifications not supported.'` with
  `_cb.tx('alerts.notifyUnsupported')`.
- **`src/tracker/events.js:330`** → `perm === 'granted'` branch: `_cb.tx('alerts.notifyGranted')`;
  else `_cb.tx('alerts.notifyBlocked')`.
- **`src/tracker/events.js:333`** → catch block: `_cb.tx('alerts.notifyRequestFailed')`.
- **`src/pages/tracker-pro.js:939`** → `new Notification(trackerTx('alerts.notifyTitle'), …)`.
- **`src/pages/tracker-pro.js:940`** → body:
  `trackerTx('alerts.notifyBody', { direction: a.direction, target: a.target, spot: spot.toFixed(2) })`.
- **`src/pages/tracker-pro.js:949`** → live region:
  `trackerTx('alerts.liveRegionTriggered', { alerts: triggered.join(', '), spot: spot.toFixed(2) })`.

> Verify these exact line numbers before editing — they were captured from the dataset and may have
> drifted. The `tx`/`_cb.tx` vs `trackerTx` choice depends on each module's import surface; both
> resolve through `TRANSLATIONS[state.lang]`.

---

## 5. Recommended integration order (lowest-risk batches first)

1. **Batch 0 — translations only (zero runtime risk).** Add all EN+AR key:value lines from §2 (incl.
   the 4 derived keys). No DOM/JS wiring yet. EN keys are inert until referenced; AR mirrors EN. Run
   `npm test` + `npm run validate` to confirm EN/AR parity counts stay equal (915 → 1102 each).
2. **Batch 1 — pure id + static-text sections (`live-toolbar`, `wire-kbd-misc` excluding the wire
   toggle, `keyboard`).** Add the §3 ids for these, wire the §4 static blocks. These are short
   labels, attribute-only changes, and table headers — easy to eyeball in both locales.
3. **Batch 2 — `chart-panel` + `archive-mode`.** Add ids, wire static copy. Includes
   `setInlineLinkText`-free nodes and table captions; verify the nth-child header selectors against
   current `tracker.html` before relying on them.
4. **Batch 3 — `exports-mode` + `planner-overlay`.** Both use `setInlineLinkText` for the
   methodology link (`exports.disclaimer`, `planner.feesNote`); confirm the link still points to
   `methodology.html` and renders RTL arrow correctly.
5. **Batch 4 — `method-mode`.** Highest-complexity wiring (the `method.spotBody` `<code>`-split with
   three fragment keys, multiple `a[href=...]` selectors, and the two duplicate `#disclaimer`
   anchors). Add ids in markup first to disambiguate, then wire.
6. **Batch 5 — `alerts-overlay` static copy** (the `setNodeText`/`setButtonCopy`/option entries in
   §4).
7. **Batch 6 — out-of-band JS replacements (§4b).** The `events.js` / `tracker-pro.js` dynamic
   strings + the `wire.pause`/`wire.resume` toggle. Highest behavioral risk (notification flows,
   live-region announcements, paused-state toggle) — do last, verify line numbers, and test with
   notifications enabled and AR active.
8. **Final gate.** `npm test`, `npm run lint`, `npm run validate`, and `npm run build` (HTML/CSS/JS
   touched). Manually toggle EN↔AR and confirm no untranslated English remains in the four
   overlays/modes and no `tracker.*` key leaks as literal text (a missing key renders as its own
   name via the `?? fullKey` fallback).
