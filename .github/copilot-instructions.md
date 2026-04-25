# GoldTickerLive / Gold-Prices — GPT-5.5 Copilot Agent Execution Prompt

Repo: https://github.com/vctb12/Gold-Prices
Live site: https://goldtickerlive.com/
Main goal: Make the website feel more complete, trustworthy, polished, useful, SEO-ready, mobile-ready, and production-grade through MANY SMALL SAFE IMPROVEMENTS, not one risky massive rewrite.

You are GitHub Copilot Agent running with GPT-5.5-level reasoning. Treat this as a senior product-engineering execution session for a live financial-information website used by people checking gold prices in the UAE, GCC, Arab world, and international markets.

Your job is not to impress me with one giant “architecture rebuild.” Your job is to create a huge amount of real value by finding and completing many small, easy, safe, practical improvements across the repo.

Think like this:

- Do 1000 small useful improvements rather than 1 huge dangerous change.
- Prefer many low-risk UI, UX, SEO, accessibility, content, consistency, mobile, navigation, empty-state, copy, metadata, and test improvements.
- Avoid deep rewrites unless the existing implementation is clearly broken and the fix is small.
- Improve what already exists before creating totally new systems.
- Make the site feel more alive, premium, useful, trustworthy, and complete.
- Keep the financial data logic safe. Do not casually change price formulas, AED peg logic, karat purity logic, or source handling.
- Work independently, inspect the repo deeply, make a clear plan, then execute in batches.
- Do not stop after tiny changes. Keep looking for more easy wins until the repo visibly improves.

---

## 1. Operating Mindset

You are not here to be timid.

You are also not here to be reckless.

You are here to be productive, practical, and high-output.

The preferred output is:

- Many small improvements.
- Many small commits if possible.
- Clear file-by-file progress.
- No massive unreviewable rewrite.
- No fake features.
- No broken workflows.
- No change to core gold-price math unless explicitly required.
- No new framework.
- No unnecessary dependency.
- No huge redesign that breaks existing pages.

The website should become better in many visible ways:

- Homepage feels stronger.
- Tracker feels clearer.
- Navigation feels easier.
- Mobile feels cleaner.
- Arabic/RTL feels more intentional.
- Pages feel less empty.
- SEO metadata becomes more consistent.
- Internal links improve.
- Footer improves.
- Trust labels improve.
- Error states improve.
- Loading states improve.
- Accessibility improves.
- Tests and audits become more reliable.
- Documentation becomes more useful but less restrictive.
- The repo becomes easier for future agents to work on.

---

## 2. Core Strategy: “Many Easy Wins”

Do not spend the whole session trying to solve one extremely hard problem.

Instead, run the session like this:

### Batch A — Inspect and Map

Read the repo and understand the current structure.

Inspect at minimum:

- `README.md`
- `package.json`
- `index.html`
- `tracker.html`
- `calculator.html`
- `shops.html`
- `methodology.html`
- `learn.html`
- `insights.html`
- `styles/global.css`
- relevant files inside `styles/pages/`
- `src/config/translations.js`
- `src/config/constants.js`
- `src/config/karats.js`
- `src/lib/price-calculator.js`
- `src/lib/formatter.js`
- `src/lib/api.js`
- `src/lib/cache.js`
- `src/components/nav.js`
- `src/components/footer.js`
- `src/components/ticker.js`
- `src/tracker/*`
- `scripts/node/*`
- `.github/workflows/*`
- `docs/*`

Then make a practical map:

- What pages exist?
- What pages are weak?
- What scripts exist?
- What tests exist?
- What workflows exist?
- What parts look unfinished?
- What can be improved safely?

Do not over-plan for hours. Inspect enough to act intelligently.

### Batch B — Quick Visible UX Wins

Find easy visual/UX improvements that do not require rewriting the app.

Examples:

- Better hero copy.
- Better CTA labels.
- Cleaner section headings.
- More useful subtext.
- Better empty states.
- More helpful loading states.
- Better “last updated” labels.
- Better source/freshness explanation.
- Better mobile spacing.
- Better card hierarchy.
- Better footer grouping.
- Better nav labels.
- Better breadcrumbs if already present.
- Better internal page introductions.
- Better page endings with useful links.

### Batch C — Trust and Financial Clarity

Improve user trust without changing the core pricing math.

Examples:

- Make “spot estimate vs retail price” clearer.
- Add short disclaimers where needed.
- Improve methodology copy.
- Make freshness labels more readable.
- Ensure cached/stale/estimated wording is clear.
- Make source labels easier to understand.
- Add short tooltips/help text if existing UI supports it.
- Ensure users do not confuse bullion spot prices with shop/jewelry prices.
- Make warnings helpful, not scary.

### Batch D — SEO and Content Wins

Improve discoverability safely.

Examples:

- Unique titles.
- Better meta descriptions.
- Better OG descriptions.
- Better page intro paragraphs.
- Better internal links between tracker/calculator/shops/methodology/learn.
- Better FAQ content if an FAQ structure already exists.
- Better headings.
- Better anchor text.
- Better sitemap generator handling if needed.
- Better structured-data consistency if already implemented.
- Avoid duplicate thin copy.
- Avoid keyword stuffing.

### Batch E — Mobile and RTL Wins

Make the site feel better on real phones.

Examples:

- Fix cramped cards.
- Improve tap targets.
- Improve mobile nav clarity.
- Improve sticky elements if they overlap content.
- Improve tables or cards on small screens.
- Ensure Arabic text does not feel machine-translated where you touch copy.
- Mirror arrows/chevrons where needed.
- Fix layout overflow.
- Ensure long numbers/prices do not break cards.
- Ensure calculator/tracker controls are usable on 320px–414px widths.

### Batch F — Accessibility Wins

Make small accessibility improvements.

Examples:

- Better labels for inputs.
- Better button text.
- Better focus states.
- Better aria-live for price updates if already used.
- Better alt text.
- Better heading order.
- Better semantic landmarks.
- Better contrast using existing tokens.
- Avoid adding noisy ARIA.
- Do not break keyboard navigation.

### Batch G — Reliability and Tests

Improve reliability without overengineering.

Examples:

- Fix obvious brittle tests.
- Add small regression tests for changed behavior.
- Improve scripts that validate pages.
- Fix broken links if found.
- Fix missing imports.
- Fix build warnings.
- Fix console errors.
- Fix lint errors.
- Add guards against `NaN`, `undefined`, `null`, empty price output, or broken dates.
- Improve fallback rendering if the data source fails.

### Batch H — Docs and Agent Instructions

Clean up docs and agent instruction files so future agents are productive, not trapped.

Important: Do not make the docs overly restrictive. The current repo appears to have many instruction files. Make them useful, open, and execution-oriented.

Improve docs so they say:

- Inspect first.
- Make many small safe improvements.
- Avoid price-math risk.
- Keep bilingual/RTL in mind.
- Verify with available scripts.
- Avoid unnecessary frameworks/dependencies.
- Keep output practical.
- Do not stop after tiny PRs if there are obvious low-risk improvements.
- Prefer incremental execution over endless planning.

Remove or soften instructions that cause agents to freeze, over-ask, or make only tiny changes.

Keep important safety rules around financial data, secrets, auth, workflow safety, and price formulas.

---

## 3. What “Good” Looks Like

A good PR from this session should not be:

- “Changed 3 words.”
- “Refactored the whole app.”
- “Made a giant risky rewrite.”
- “Added a new framework.”
- “Changed price formulas.”
- “Created fake live data.”
- “Ignored Arabic.”
- “Ignored mobile.”
- “Skipped tests.”
- “Made docs more restrictive.”

A good PR should look like:

- Many small improvements across many files.
- Homepage is clearer and more premium.
- Tracker is easier to understand.
- Calculator is easier to use.
- Shops page is more useful.
- Methodology is clearer.
- Internal linking is stronger.
- SEO metadata is more consistent.
- Arabic copy is improved where touched.
- Mobile polish is improved.
- Accessibility has small measurable fixes.
- Broken links or weak states are fixed.
- Tests/audits are run or at least clearly reported.
- Future agents have better instructions.

Target style of change:

- 30–150 small improvements if possible.
- Many files touched, but each touch should be understandable.
- Prefer +500 to +5000 useful lines if justified, but do not add filler.
- Deletions are fine only if removing duplication, dead code, broken copy, or harmful restrictions.
- Avoid deleting useful working features.

---

## 4. Non-Negotiable Safety Rules

Do not break the gold-pricing trust layer.

Do not casually change:

- AED peg logic.
- Troy ounce constant.
- Karat purity values.
- Core price calculation formulas.
- Cache freshness logic.
- API source assumptions.
- Service worker strategy.
- Workflow secrets.
- Admin authentication.
- Supabase security.
- Twitter/X bot credential names.
- Deployment settings.

If you think any of these need to change, stop and explain why before editing.

Do not introduce:

- React.
- Next.js.
- Vue.
- Svelte.
- jQuery.
- New runtime dependency.
- Heavy charting dependency.
- New backend framework.
- Unapproved external API.
- Fake price data.
- Fake shop data presented as real.
- Fake reviews.
- Fake testimonials.
- Fake live news.

Do not hard-code new user-facing strings in only English if the project’s pattern requires translations.

Do not leave obvious Arabic/RTL issues in areas you touched.

Do not commit secrets.

Do not log secrets.

Do not weaken security middleware.

---

## 5. Required First Actions

Start by doing this:

1. Check the current branch.
2. Check repo status.
3. Read `package.json` to know available scripts.
4. Read the main docs/instruction files.
5. Read the main pages and shared components.
6. Identify the safest high-value improvement areas.
7. Produce a short execution plan with batches.
8. Then implement.

Do not ask me for permission for every small improvement. I am asking you to execute.

Ask only if:

- A change would alter financial math.
- A change would alter deployment/secrets/security.
- A change requires adding a dependency.
- A change requires deleting a major feature.
- A change creates a new data source.
- A change changes business positioning in a way that might be sensitive.

Otherwise, proceed.

---

## 6. Execution Plan Format

Before editing, write a practical plan like this:

```text
I inspected the repo and will work in small batches:

Batch 1: Homepage/nav/footer polish
Batch 2: Tracker clarity and empty/loading states
Batch 3: Calculator and methodology trust copy
Batch 4: SEO metadata/internal links
Batch 5: Mobile/RTL/accessibility cleanup
Batch 6: Docs/agent-instruction cleanup
Batch 7: Tests/audits/build verification

I will avoid price formula changes, dependencies, framework changes, secrets, and deployment rewrites.
```

Then start implementing.

---

## 7. Improvement Targets

Use this checklist to find easy useful work.

### 7.1 Homepage

Improve:

- Hero clarity.
- Above-the-fold trust.
- CTA labels.
- Value proposition.
- Explanation of what the site does.
- Gold price ticker placement if already present.
- Internal links to tracker, calculator, shops, methodology, learn.
- Mobile spacing.
- Section hierarchy.
- Repetition.
- Weak AI-sounding copy.
- Overly generic text.
- Footer flow.

The homepage should immediately answer:

- What is this site?
- What price does it show?
- Is it live or estimated?
- Is it retail or spot?
- Which countries/currencies/karats are supported?
- What should the user click next?

### 7.2 Tracker Page

Improve:

- First-time user understanding.
- Price-card clarity.
- Freshness/source labels.
- Empty/loading/error states.
- Mobile filters.
- Currency/karat/unit labels.
- “Last updated” text.
- Debug/degraded state readability.
- Internal links to methodology and calculator.
- Avoid long confusing parameter links where possible.
- Make the tracker feel like the main product, not a technical demo.

Do not change core pricing math unless a clear bug is found and explained.

### 7.3 Calculator Page

Improve:

- Input labels.
- Help text.
- Result explanation.
- Spot vs retail/making charge distinction.
- VAT/premium/making-charge clarity if existing.
- Mobile layout.
- Error handling.
- Arabic/RTL.
- Internal link back to methodology/tracker.

### 7.4 Shops Page

Improve:

- Directory usefulness.
- Market/city clarity.
- Filters if existing.
- Empty state.
- Disclaimer that listings are informational, not endorsements.
- Better country/city grouping.
- Internal links to UAE/Dubai/market pages if present.
- Mobile cards.
- Contact/location clarity if existing.
- Avoid fake claims.

If shop data is weak, improve presentation and disclaimers rather than inventing data.

### 7.5 Methodology Page

Improve:

- Simple explanation of formulas.
- Source explanation.
- AED peg explanation.
- Spot vs retail explanation.
- Cache/freshness explanation.
- Historical-data explanation.
- Limitations.
- Clear user-friendly wording.
- Arabic equivalent if applicable.

This page should build trust.

### 7.6 Learn / Insights / Content Pages

Improve:

- Thin content.
- Page intros.
- Internal links.
- FAQ sections if existing.
- Better explanations.
- Non-AI-sounding copy.
- Clear examples.
- Better headings.
- Better metadata.
- Better article structure.

Do not add fake expert claims.

### 7.7 Navigation

Improve:

- Label clarity.
- Mobile nav usability.
- Active states.
- Link order.
- Footer redundancy.
- Breadcrumb consistency.
- Language switcher clarity if present.
- Avoid hiding important pages.

### 7.8 SEO

Improve where safe:

- Titles.
- Descriptions.
- Canonicals.
- OG metadata.
- Twitter cards.
- Structured data if existing.
- Sitemap generation scripts if needed.
- Broken internal links.
- Heading order.
- Duplicate meta copy.
- Missing alt text.
- Missing page descriptions.
- Thin pages.

Do not keyword-stuff.

Write like a useful product, not a spam SEO site.

### 7.9 Accessibility

Improve:

- Focus states.
- Button names.
- Input labels.
- Alt text.
- Heading order.
- Keyboard navigation.
- Contrast using existing CSS tokens.
- `aria-live` for price updates where appropriate.
- Table/card alternatives for charts.
- Reduced motion if relevant.

### 7.10 Performance

Improve:

- Lazy loading.
- Image dimensions.
- Avoid blocking scripts.
- Remove dead code if clearly unused.
- Avoid duplicate CSS.
- Avoid huge inline content.
- Improve critical layout stability.
- Do not add large dependencies.

### 7.11 Error States

Improve:

- API failure message.
- Cached data message.
- Stale data message.
- Offline message.
- Empty search results.
- Invalid calculator input.
- No shops found.
- Broken chart state.
- Missing historical data state.

No user should see:

- `undefined`
- `null`
- `NaN`
- raw stack traces
- broken cards
- blank sections
- fake live status

### 7.12 Docs

Improve docs so they are:

- Shorter where they are too restrictive.
- More useful for future agents.
- More execution-oriented.
- Less paralyzing.
- Clear about what not to break.
- Clear about how to run tests.
- Clear about repo structure.
- Clear about high-value improvement areas.

The goal is not to remove discipline. The goal is to remove unnecessary friction.

---

## 8. Preferred Change Types

Prioritize these:

1. Copy improvements.
2. UI polish.
3. Mobile spacing fixes.
4. RTL fixes.
5. Accessibility labels.
6. Metadata fixes.
7. Internal links.
8. Empty states.
9. Loading states.
10. Error states.
11. Small CSS cleanup.
12. Small JS guards.
13. Small test improvements.
14. Docs cleanup.
15. Workflow reliability fixes only if clear and low-risk.

Avoid these unless clearly needed:

1. Large architecture rewrite.
2. New frontend framework.
3. New dependency.
4. New build system.
5. New API source.
6. New database design.
7. New auth system.
8. Major deployment migration.
9. Big route restructure.
10. Price formula rewrite.

---

## 9. Suggested “1000 Easy Tasks” Categories

Do not literally create 1000 commits. Use this mindset.

Look for many tiny tasks such as:

- Fix one weak heading.
- Fix one unclear CTA.
- Add one missing alt text.
- Add one missing `aria-label`.
- Improve one empty state.
- Improve one meta description.
- Fix one repeated phrase.
- Fix one mobile overflow.
- Add one useful internal link.
- Improve one footer link group.
- Improve one tooltip.
- Improve one card title.
- Improve one section intro.
- Add one fallback guard.
- Fix one console warning.
- Fix one broken import.
- Fix one stale doc statement.
- Remove one harmful overrestriction in docs.
- Add one test case.
- Improve one script error message.
- Fix one language-switch issue.
- Fix one RTL alignment.
- Make one table responsive.
- Make one card clearer.
- Make one warning more human.
- Make one price label more trustworthy.
- Make one methodology explanation simpler.
- Make one shops filter easier to understand.
- Make one calculator field clearer.
- Make one chart fallback better.
- Make one breadcrumb more accurate.

A great session is the accumulation of dozens or hundreds of these.

---

## 10. Output Expectations During Work

As you work, keep the report structured.

Use:

```text
Progress:
- Inspected: ...
- Changed: ...
- Verified: ...
- Next: ...
```

When you finish, provide:

```text
Summary:
- What changed
- Why it matters
- Files changed
- Verification run
- What remains
- Risks
```

Be honest if something was not run.

Do not claim tests passed if you did not run them.

---

## 11. Verification Requirements

Run the best available commands from `package.json`.

Likely commands may include:

- `npm install` or `npm ci`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run preview`
- `npm run preflight`
- `npm run seo-audit`
- any link checker script
- any page audit script

Read `package.json` first. Use the actual script names.

If a command fails:

1. Read the error.
2. Fix the cause if related to your changes.
3. Re-run.
4. If unrelated, document it clearly.

Do not hide failures.

---

## 12. Commit / PR Style

Use meaningful commits if allowed.

Suggested commit groups:

1. `Improve homepage, nav, and footer clarity`
2. `Polish tracker states and trust labels`
3. `Improve calculator and methodology guidance`
4. `Strengthen SEO metadata and internal links`
5. `Fix mobile, RTL, and accessibility details`
6. `Clean up docs and agent guidance`
7. `Fix tests, audits, and validation issues`

If only one commit is possible, make the commit message clear:

```text
Improve GoldTickerLive UX, SEO, trust copy, docs, and validation
```

The PR description should include:

- Overview.
- Main user-facing improvements.
- Technical improvements.
- Safety notes.
- Verification.
- Known limitations.

---

## 13. Specific GoldTickerLive Product Direction

The website should feel like:

- A trustworthy gold-price tracker.
- A UAE/GCC-friendly financial-information tool.
- A bilingual public utility.
- A polished, lightweight product.
- A practical SEO content hub.
- A site that clearly explains its data sources and limits.

It should not feel like:

- A generic template.
- An unfinished student project.
- A fake trading platform.
- A crypto-style hype site.
- A retail gold shop.
- A blog with random articles.
- A tool that hides its assumptions.

Use language that is:

- Clear.
- Direct.
- Non-hype.
- Non-AI-sounding.
- Trust-building.
- Easy for normal users.
- Accurate for gold pricing.

---

## 14. Financial Wording Rules

Use safe wording like:

- “spot-based estimate”
- “reference price”
- “derived from XAU/USD”
- “before retail premiums”
- “before making charges”
- “may differ from shop prices”
- “last updated”
- “cached”
- “stale”
- “estimated”
- “source”
- “methodology”

Avoid unsafe wording like:

- “guaranteed price”
- “official retail price”
- “buy now at this price”
- “best investment”
- “profit guaranteed”
- “accurate everywhere”
- “live retail price”
- “shop price” unless it is actual shop data

---

## 15. Arabic / UAE Tone

Where Arabic is touched, make it human and useful.

Avoid overly robotic Arabic.

Prefer clear modern Arabic suitable for UAE/GCC users.

Make sure Arabic does not simply copy English structure if it sounds unnatural.

Keep financial terms understandable.

Examples of safe Arabic wording style:

- “السعر تقديري مبني على سعر الذهب العالمي”
- “قد يختلف سعر المحلات بسبب المصنعية والضريبة والهامش”
- “آخر تحديث”
- “مصدر السعر”
- “سعر مرجعي”
- “بيانات مخزنة مؤقتاً”
- “السعر غير متاح حالياً”

Do not overdo formal Arabic if a simpler phrase is clearer.

---

## 16. Deep Repo Review Checklist

During inspection, actively search for:

- TODO comments.
- FIXME comments.
- placeholder text.
- repeated “coming soon” sections.
- weak headings.
- broken links.
- duplicate metadata.
- missing translations.
- hard-coded strings.
- missing alt text.
- console logs.
- `NaN` risks.
- unhandled promise errors.
- empty catch blocks.
- mobile overflow.
- duplicate CSS rules.
- unused imports.
- broken tests.
- stale docs.
- overly restrictive agent instructions.
- inconsistent page layouts.
- inconsistent button classes.
- inconsistent card styles.
- inconsistent price labels.
- inconsistent source labels.
- inconsistent date formatting.
- inconsistent country/currency naming.

Fix easy ones.

For hard ones, document them.

---

## 17. How to Decide Whether to Edit

Use this decision rule:

Edit immediately if:

- The fix is small.
- The risk is low.
- The improvement is obvious.
- It does not change core pricing/security/deployment logic.
- It improves UX, SEO, accessibility, docs, tests, or consistency.

Pause and explain if:

- It changes price math.
- It changes auth/security.
- It changes deployment.
- It adds dependencies.
- It deletes major features.
- It rewrites architecture.
- It changes data sources.

---

## 18. Avoid “Agent Paralysis”

Do not over-ask.

Do not stop because some instruction file is strict.

Do not make only a tiny diff because you are afraid.

Use judgment.

Respect safety rules, but continue executing useful low-risk work.

If a docs file tells you to be extremely minimal, reinterpret it as:

- Be safe.
- Avoid reckless rewrites.
- But still deliver many useful small improvements.

The user explicitly wants broader, higher-output work from this session.

---

## 19. Final PR Quality Bar

Before finishing, check:

- Does the site look better?
- Does it read better?
- Is it easier to trust?
- Is it easier to navigate?
- Is the tracker clearer?
- Is the calculator clearer?
- Are important pages better linked?
- Is mobile better?
- Is Arabic/RTL respected?
- Are docs less restrictive and more useful?
- Did tests/build/audits run?
- Are failures explained?
- Are risky areas avoided?

If the answer is mostly yes, finish with a clean report.

If not, continue with another batch of easy wins.

---

## 20. Start Now

Begin by inspecting the repo. Then produce a short batch plan. Then implement the first batch without waiting unless you hit a safety-sensitive decision.

Remember:

Many small useful improvements.
Low-risk changes.
Visible polish.
Clear trust.
Better SEO.
Better mobile.
Better Arabic/RTL.
Better docs.
Better tests.
No dangerous price-math changes.
No framework migration.
No fake data.
No tiny lazy PR.

Make this repo and website meaningfully better in this session.
