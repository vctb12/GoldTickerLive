export const meta = {
  name: 'pre-pr-review',
  description:
    'Pre-PR gate for GoldTickerLive: run the repo verification suite, then adversarially review the branch diff across correctness / trust / SEO / i18n-RTL / a11y, and return a go/no-go.',
  whenToUse:
    'Before opening any PR. Run from the repo root on your feature branch. Pass the base branch as args (default "origin/main").',
  phases: [
    { title: 'Verify', detail: 'npm run validate + npm test + npm run lint' },
    { title: 'Review', detail: 'parallel reviewers, one per dimension, over the diff' },
    { title: 'Confirm', detail: 'adversarially verify each finding before reporting' },
  ],
};

const BASE = typeof args === 'string' && args.trim() ? args.trim() : 'origin/main';

const CTX = `You are reviewing a change on the GoldTickerLive repo (run from the repo root; if your cwd is not the repo, cd to it first — try \`cd ~/GoldTickerLive\`). It is a bilingual EN/AR static gold-price site (vanilla ES6 + Vite, Express, Supabase, ~390 pages). NON-NEGOTIABLES: spot/reference price must never read as retail; AED/USD peg is 3.6725; non-live values must stay labelled (live/delayed/cached/stale/fallback/unavailable); RTL + hreflang + canonical + JSON-LD are first-class. The branch diff under review is \`git diff ${BASE}...HEAD\` (also useful: \`git diff ${BASE}...HEAD --stat\`).`;

phase('Verify');
const verify = await agent(
  `${CTX}\n\nRun the repo's own verification suite and report results precisely. Run, in order, capturing the REAL exit code of each (do not pipe through tail/head — that masks exit codes):\n- \`npm run validate\`  (read-only governance: SEO/schema/shell-guard/a11y/unsafe-dom)\n- \`npm test\`  (node --test)\n- \`npm run lint\`  (eslint)\nFor npm test, list any failing test names and whether they also fail on ${BASE} (check out ${BASE} in a scratch worktree or compare known-red tests — a pre-existing red main is not this branch's fault). Report which suites passed, which failed, and the failing test names with a one-line cause each.`,
  {
    label: 'verify:suite',
    phase: 'Verify',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['validate', 'test', 'lint', 'newFailuresFromThisBranch', 'notes'],
      properties: {
        validate: { type: 'string', enum: ['pass', 'fail', 'skipped'] },
        test: { type: 'string', enum: ['pass', 'fail', 'skipped'] },
        lint: { type: 'string', enum: ['pass', 'fail', 'skipped'] },
        newFailuresFromThisBranch: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' },
      },
    },
  }
);

const DIMENSIONS = [
  {
    key: 'correctness',
    focus:
      'Logic bugs, regressions, broken imports/exports, null/undefined hazards, event-listener or state-capture mistakes (e.g. a value captured once in a closure that should be read live). Does the change do what its message claims without breaking adjacent behaviour?',
  },
  {
    key: 'trust-integrity',
    focus:
      'Price/trust integrity: spot vs retail separation; AED peg 3.6725 untouched; freshness labelling (live/delayed/cached/stale/fallback/unavailable) preserved; no unlabelled stale/estimated value presented as live; karat math (XAU/USD ÷ 31.1035 × karat/24 × FX) intact.',
  },
  {
    key: 'seo',
    focus:
      'SEO: canonical (one per page, production host), hreflang EN/AR pairing and /ar/ vs ?lang=ar consistency, JSON-LD validity, sitemap/noindex governance. Will this change get flagged by check-seo-meta / seo-governance / inject-schema --check?',
  },
  {
    key: 'i18n-rtl-a11y',
    focus:
      'Bilingual EN/AR + RTL + accessibility: hard-coded user-facing strings that should come from translations/NAV_DATA; numerals/bidi; dir=rtl correctness; landmark/heading/contrast/focus regressions; safe-dom usage (el()/no raw innerHTML).',
  },
];

phase('Review');
const reviewed = await pipeline(
  DIMENSIONS,
  (d) =>
    agent(
      `${CTX}\n\nReview the diff ONLY through the ${d.key} lens.\nFocus: ${d.focus}\nReport concrete findings tied to \`file:line\` in the diff. Prefer few high-confidence findings over many speculative ones. If clean, return an empty findings array.`,
      {
        label: `review:${d.key}`,
        phase: 'Review',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['dimension', 'findings'],
          properties: {
            dimension: { type: 'string' },
            findings: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['title', 'file', 'severity', 'detail'],
                properties: {
                  title: { type: 'string' },
                  file: { type: 'string' },
                  severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'nit'] },
                  detail: { type: 'string' },
                },
              },
            },
          },
        },
      }
    ),
  // Verify each finding adversarially as soon as its dimension is reviewed.
  (review) =>
    parallel(
      (review.findings || []).map(
        (f) => () =>
          agent(
            `${CTX}\n\nAdversarially VERIFY this review finding against the actual diff + surrounding code. Try to REFUTE it. Default to refuted=true if you cannot clearly confirm it is real and caused by this change.\nFinding: [${f.severity}] ${f.title} (${f.file})\n${f.detail}`,
            {
              label: `confirm:${f.file}`,
              phase: 'Confirm',
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['real', 'reason'],
                properties: { real: { type: 'boolean' }, reason: { type: 'string' } },
              },
            }
          ).then((v) => ({ ...f, confirmed: !!(v && v.real), why: v ? v.reason : 'verifier died' }))
      )
    )
);

const confirmed = reviewed
  .flat()
  .filter(Boolean)
  .filter((f) => f.confirmed);

const blockers = confirmed.filter((f) => f.severity === 'blocker' || f.severity === 'major');
const suiteGreen =
  verify && verify.validate !== 'fail' && verify.test !== 'fail' && verify.lint !== 'fail';
const noNewFailures = !verify || (verify.newFailuresFromThisBranch || []).length === 0;
const go = suiteGreen && noNewFailures && blockers.length === 0;

log(
  `pre-pr-review: ${go ? 'GO ✅' : 'NO-GO ⛔'} — suite ${suiteGreen ? 'green' : 'RED'}, ${blockers.length} blocker/major, ${confirmed.length} confirmed findings`
);

return { go, verify, confirmedFindings: confirmed, blockers };
