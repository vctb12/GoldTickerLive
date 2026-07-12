# UX Copy Deck — freshness, empty, error, loading, stale, offline (EN + AR)

**Phase:** P14 of the design overhaul (L10 lane) · **Status:** deck for other lanes to consume.
**This file changes no runtime strings.** When a lane (L5 freshness unification, L11 styleguide,
tool empty-states) needs one of these strings, it adds the key to `src/config/translations.js` in
its own PR and cites this deck. Do not invent parallel wordings — if a needed string is missing
here, extend this deck first.

## Voice rules (binding for both languages)

1. **Plain verbs, sentence case, active voice.** No filler, no marketing tone on a data surface.
2. **Errors say what happened and what to do next.** They never apologize and are never vague.
3. **Freshness copy is precise and honest** — name the state, the time, and the consequence. Never
   present a cached/stale number as live.
4. **The action keeps its name through the flow** ("Convert" → "Converted", "Refresh" →
   "Refreshed").
5. **Numerals stay Western Arabic (Latin) digits in both languages** (existing sitewide
   `formatPrice()` convention), bidi-isolated in AR.
6. **Arabic is written, not machine-translated** — Modern Standard Arabic, register of a Gulf
   finance audience, matching the vocabulary already shipped in `translations.js`: «قديم» = stale ·
   «مخزّنة/المخزن» = cached · «تعذّر» = couldn't · «الأسعار الحية» = live prices. Never track-out
   (letter-space) Arabic. No case transforms (Arabic has no case).

## 1 · Freshness states (the 6-state model — one renderer, L5)

The state machine: `live → cached → delayed → stale → unavailable`, plus `offline` (device-side).
Motion contract: **only `live` pulses. Everything else is static.** Absence of motion is the signal.

| State           | EN label    | EN detail (where space allows)                                     | AR label | AR detail                                                          |
| --------------- | ----------- | ------------------------------------------------------------------ | -------- | ------------------------------------------------------------------ |
| **live**        | Live        | `Live — updated {n}s ago`                                          | مباشر    | «مباشر — تم التحديث قبل {n} ث»                                     |
| **cached**      | Cached      | `Cached — last updated {time}`                                     | مخزّن    | «مخزّن — آخر تحديث {time}»                                         |
| **delayed**     | Delayed     | `Delayed ~{n} min`                                                 | مؤجَّل   | «مؤجَّل نحو {n} دقيقة»                                             |
| **stale**       | Stale       | `Last updated {date}, {time} GST — may not reflect current market` | قديم     | «آخر تحديث {date}، {time} بتوقيت الخليج — قد لا يعكس السوق الحالي» |
| **unavailable** | Unavailable | `Couldn't refresh. Showing the last cached value when available.`  | غير متاح | «تعذّر التحديث. سيتم عرض آخر قيمة مخزنة إن وُجدت.»                 |
| **offline**     | Offline     | `You are offline. Showing cached data.`                            | غير متصل | «أنت غير متصل. يتم عرض البيانات المخزنة.»                          |

Notes: `unavailable` detail intentionally reuses the shipped `status.goldError` wording; `offline`
reuses `status.offline` verbatim — both are already user-tested vocabulary. `{time}` uses the page's
existing locale formatter; GST wording only on surfaces that already declare the timezone.

## 2 · Derived / estimated values (visible labels, never tooltip-only)

| Context                              | EN                                                     | AR                                          |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------- |
| Estimated from USD spot              | `Estimated from USD spot`                              | «تقديري استنادًا إلى السعر الفوري بالدولار» |
| Reference (spot-linked), not a quote | `Reference price — before making charges and premiums` | «سعر مرجعي — قبل أجور الصياغة والعلاوات»    |
| Retail estimate suffix (existing)    | `· Retail est.`                                        | «· تقدير تجزئة»                             |
| Baseline-derived history point       | `Baseline-derived`                                     | «مشتق من خط الأساس»                         |

## 3 · Loading states

| Context                                                      | EN                                                                           | AR                                                                  |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| First price load                                             | `Loading live price…`                                                        | «جارٍ تحميل السعر المباشر…»                                         |
| Waiting on live price for a derived figure (shipped in #677) | `Waiting for live prices — this appears once today's reference price loads.` | «بانتظار الأسعار الحية — يظهر هذا بمجرد تحميل السعر المرجعي لليوم.» |
| Chart loading                                                | `Loading chart data…`                                                        | «جارٍ تحميل بيانات الرسم البياني…»                                  |

Skeletons carry no text; these strings are for regions where a text state is already rendered.

## 4 · Empty states (state what's missing + the one next action)

| Context                   | EN                                                                | AR                                                             |
| ------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| Compare, nothing selected | `No markets selected. Choose up to 4 to compare.`                 | «لم يتم اختيار أي سوق. اختر حتى 4 أسواق للمقارنة.»             |
| Portfolio, no holdings    | `No holdings yet. Add your first item to see its live value.`     | «لا توجد مقتنيات بعد. أضف أول عنصر لعرض قيمته المباشرة.»       |
| Alerts, none set          | `No alerts set. Create one to get notified at your target price.` | «لا توجد تنبيهات. أنشئ تنبيهًا ليصلك إشعار عند سعرك المستهدف.» |
| Search/filter, no results | `No results for "{q}". Try a different market or unit.`           | «لا نتائج لـ "{q}". جرّب سوقًا أو وحدة أخرى.»                  |

## 5 · Error states (what happened → what to do; no apology, no blame)

| Context                         | EN                                                                               | AR                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Price fetch failed (shipped)    | `Couldn't refresh the gold price. Showing the last cached value when available.` | «تعذّر تحديث سعر الذهب. سيتم عرض آخر قيمة مخزنة إن وُجدت.»                 |
| FX fetch failed (shipped)       | `Couldn't refresh exchange rates. Showing the last cached rates when available.` | «تعذّر تحديث أسعار الصرف. سيتم عرض آخر أسعار مخزنة إن وُجدت.»              |
| Chart failed                    | `Couldn't load the chart. The price data above is unaffected. Retry`             | «تعذّر تحميل الرسم البياني. بيانات السعر أعلاه غير متأثرة. إعادة المحاولة» |
| Form input invalid (calculator) | `Enter a weight greater than 0.`                                                 | «أدخل وزنًا أكبر من 0.»                                                    |
| Export failed                   | `Couldn't generate the file. Retry`                                              | «تعذّر إنشاء الملف. إعادة المحاولة»                                        |

## 6 · Screen-reader announcements (aria-live, polite, throttled — P13)

| Event                                     | EN                                                  | AR                                                  |
| ----------------------------------------- | --------------------------------------------------- | --------------------------------------------------- |
| Price updated (throttled, not every tick) | `Gold price updated: {price} {currency} per {unit}` | «تم تحديث سعر الذهب: {price} {currency} لكل {unit}» |
| State worsened (live→stale etc.)          | `Price data is now {state}.`                        | «بيانات السعر الآن {state}.»                        |

## Anti-patterns (rejected wordings — do not ship)

- "Oops!", "Something went wrong", "We're sorry" — vague and/or apologetic.
- "Real-time" anywhere the pipeline is hourly — the X-banner review already settled this ("Live"
  only where the freshness object genuinely says live).
- Emoji in trust/freshness copy (the city-page audit flagged 📖 headings as informal).
- Any wording that shows a stale number without its state label adjacent.
