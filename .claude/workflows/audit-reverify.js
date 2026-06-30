export const meta = {
  name: 'audit-reverify',
  description:
    'Re-verify a list of audit/review findings against the CURRENT GoldTickerLive code. Returns OPEN / PARTIAL / FIXED / NOT_A_BUG per item with file evidence and a minimal safe fix — so you never ship a no-op PR for an already-fixed item.',
  whenToUse:
    'Before executing a batch of fixes from an older audit/plan. Pass args as a JSON array of items: [{ "key": "...", "title": "...", "focus": "what to check + where to look" }]. With no args it re-checks the docs/revamp audit items.',
  phases: [{ title: 'Reverify', detail: 'one agent per item, code-level verdict' }],
};

const DEFAULT_ITEMS = [
  {
    key: 'ar-indexable',
    title: 'Arabic /ar/ indexability',
    focus:
      'Is the /ar/ homepage a real indexable page (no noindex, self-canonical /ar/, hreflang ar→/ar/), or a noindex stub redirecting to ?lang=ar? Check ar/index.html, index.html hreflang, src/seo/hreflang.js, build/generatePages.js.',
  },
  {
    key: 'freshness',
    title: 'Freshness labelling integrity',
    focus:
      'Does any component show "Live" on stale data, or a badge/ticker disagree on state for the same data? Check src/lib/formatter.js, src/lib/freshness.js, src/lib/realtime-pricing-engine.js, the ticker components.',
  },
  {
    key: 'trust-retail',
    title: 'Spot vs retail separation',
    focus:
      'Is any reference/spot price presented without making clear it is not a retail/jewelry quote? Check homepage, calculator, country pages, methodology.',
  },
];

const items = Array.isArray(args) && args.length ? args : DEFAULT_ITEMS;

const CTX = `Repo: GoldTickerLive (run from the repo root; if cwd is not the repo, \`cd ~/GoldTickerLive\`). Bilingual EN/AR static gold-price site (vanilla ES6 + Vite, Express, Supabase). The item below was flagged earlier, but the repo is actively worked on, so it may ALREADY be fixed. Open the CURRENT files and determine the true status. Read-only — do not modify. Cite exact \`file:line\` evidence. If OPEN/PARTIAL, give the smallest safe fix that won't trip the repo's checks (check-seo-meta, seo-governance, check-shell-guard, check-freshness-metadata, lint, vite build). Use docs/REPO-MAP.md to navigate fast.`;

phase('Reverify');
const results = await parallel(
  items.map(
    (it) => () =>
      agent(`${CTX}\n\nITEM: ${it.title || it.key}\nFocus: ${it.focus || ''}`, {
        label: `reverify:${it.key || (it.title || 'item').slice(0, 20)}`,
        phase: 'Reverify',
        agentType: 'Explore',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['item', 'status', 'confidence', 'evidence', 'minimalFix', 'risk'],
          properties: {
            item: { type: 'string' },
            status: { type: 'string', enum: ['OPEN', 'PARTIAL', 'FIXED', 'NOT_A_BUG'] },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            evidence: { type: 'array', items: { type: 'string' } },
            minimalFix: { type: 'string' },
            risk: { type: 'string', enum: ['low', 'med', 'high'] },
          },
        },
      }).then((r) => ({ key: it.key, ...r }))
  )
);

const ok = results.filter(Boolean);
const open = ok.filter((r) => r.status === 'OPEN' || r.status === 'PARTIAL');
log(
  `audit-reverify: ${ok.length} checked · ${open.length} genuinely open (${open.map((o) => o.key).join(', ') || 'none'}) · ${ok.length - open.length} already fixed / not-a-bug`
);

return { results: ok, open };
