#!/usr/bin/env node
'use strict';

/**
 * One-shot / maintenance: update legacy AGENTS.md §6.x references in docs/plans and reports.
 * Run: node scripts/node/migrate-agents-charter-refs.js [--check]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const TARGET_DIRS = [path.join(ROOT, 'docs/plans'), path.join(ROOT, 'reports')];
const TARGET_FILES = [
  path.join(ROOT, 'docs/REPO_AUDIT.md'),
  path.join(ROOT, 'docs/realtime-architecture.md'),
  path.join(ROOT, 'docs/CURSOR_HANDOVER.md'),
];
const EXT = new Set(['.md', '.json']);

/** Longest-first so §6.10 replaces before §6.1 */
const REPLACEMENTS = [
  ['../AGENTS.md#6-product-trust-guardrails', '../AGENTS.md#non-negotiable-rules'],
  ['../../AGENTS.md#6-product-trust-guardrails', '../../AGENTS.md#non-negotiable-rules'],
  ['AGENTS.md#6-product-trust-guardrails', 'AGENTS.md#non-negotiable-rules'],
  [
    '([`AGENTS.md` §6.11](../AGENTS.md#6-product-trust-guardrails)',
    '([`AGENTS.md` output expectations](../AGENTS.md#output-expectations-for-agents)',
  ],
  [
    '([`AGENTS.md` §6.4](../AGENTS.md#6-product-trust-guardrails)',
    '([`AGENTS.md` technical SEO policy](../AGENTS.md#technical-seo-policy)',
  ],
  [
    '[`AGENTS.md` §6.4](../../AGENTS.md#6-product-trust-guardrails)',
    '[`AGENTS.md` technical SEO policy](../../AGENTS.md#technical-seo-policy)',
  ],
  [
    '[`AGENTS.md §6`](../../AGENTS.md#6-product-trust-guardrails)',
    '[`AGENTS.md` non-negotiable rules](../../AGENTS.md#non-negotiable-rules)',
  ],
  ['[`AGENTS.md` §4.3](../../AGENTS.md)', '[`AGENTS.md` workflow](../../AGENTS.md#workflow)'],
  ['AGENTS.md` §4.3](../../AGENTS.md)', 'AGENTS.md` workflow](../../AGENTS.md#workflow)'],
  [
    '[`AGENTS.md` §6.4](../../AGENTS.md#6-product-trust-guardrails)',
    '[`AGENTS.md` technical SEO policy](../../AGENTS.md#technical-seo-policy)',
  ],
  ['AGENTS.md` §6.11', 'AGENTS.md` output expectations'],
  ['AGENTS.md` §6.10', 'AGENTS.md` operational guardrails (`post_gold.yml`)'],
  ['AGENTS.md` §6.9', 'AGENTS.md` operational guardrails (PR-only)'],
  ['AGENTS.md` §6.8', 'AGENTS.md` operational guardrails (secrets)'],
  ['AGENTS.md` §6.7', 'AGENTS.md` operational guardrails (DOM safety)'],
  ['AGENTS.md` §6.6', 'AGENTS.md` non-negotiable rule 3 (EN/AR)'],
  ['AGENTS.md` §6.5', 'AGENTS.md` operational guardrails (static MPA)'],
  ['AGENTS.md` §6.4', 'AGENTS.md` technical SEO policy'],
  ['AGENTS.md` §6.2', 'AGENTS.md` non-negotiable rule 2 (freshness)'],
  ['AGENTS.md` §6.1', 'AGENTS.md` non-negotiable rule 1 (reference vs retail)'],
  ['AGENTS.md` §2', 'AGENTS.md` core commands'],
  ['AGENTS.md` §4:', 'AGENTS.md` Autonomy Contract (`docs/AGENTS_REFERENCE.md`):'],
  ['AGENTS.md §6.4 and §6.11', 'AGENTS.md technical SEO policy and output expectations'],
  ['AGENTS.md §6.4 / §6.5', 'AGENTS.md technical SEO policy and operational guardrails'],
  ['AGENTS.md §6.6', 'AGENTS.md non-negotiable rule 3 (EN/AR)'],
  ['AGENTS.md §6.7', 'AGENTS.md operational guardrails (DOM safety)'],
  ['Non-negotiables (AGENTS.md §6):', 'Non-negotiables (`AGENTS.md`):'],
  ['**Non-negotiables (AGENTS.md §6):**', '**Non-negotiables (`AGENTS.md`):**'],
  ['`AGENTS.md` §6 (product-trust guardrails)', '`AGENTS.md` non-negotiable rules'],
  ['`AGENTS.md` §6 product-trust guardrails', '`AGENTS.md` non-negotiable rules'],
  ['(AGENTS.md §6)', '(`AGENTS.md` non-negotiable rules)'],
  ['§6 product-trust guardrails', 'non-negotiable rules'],
  ['§6 product-trust', 'non-negotiable rules'],
  ['§6.x guardrails', 'non-negotiable and operational guardrails'],
  ['§6.1–§6.3', 'non-negotiable rules 1–2'],
  ['§6.1 / §6.7 / §6.8', 'non-negotiable rule 1 and operational guardrails'],
  ['§6.4-analogous', 'technical-SEO-analogous'],
  ['§6.11', 'output expectations'],
  ['§6.10', 'operational guardrails (`post_gold.yml`)'],
  ['§6.9', 'operational guardrails (PR-only)'],
  ['§6.8', 'operational guardrails (secrets)'],
  ['§6.7', 'operational guardrails (DOM safety)'],
  ['§6.6', 'non-negotiable rule 3 (EN/AR)'],
  ['§6.5', 'operational guardrails (static MPA)'],
  ['§6.4', 'technical SEO policy'],
  ['§6.3', 'non-negotiable rule 2 (freshness visibility)'],
  ['§6.2', 'non-negotiable rule 2 (freshness)'],
  ['§6.1', 'non-negotiable rule 1 (reference vs retail)'],
  ['Charter §6.2', 'Charter non-negotiable rule 2'],
  ['per §6.', 'per `AGENTS.md` guardrails §'],
  ['per §6', 'per `AGENTS.md` non-negotiable rules'],
  ['All §6', 'All `AGENTS.md` non-negotiable rules'],
  ['violates AGENTS.md §6.2', 'violates AGENTS.md non-negotiable rule 2'],
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (EXT.has(path.extname(ent.name))) files.push(full);
  }
  return files;
}

function migrateText(text) {
  let out = text;
  for (const [from, to] of REPLACEMENTS) {
    out = out.split(from).join(to);
  }
  return out;
}

const checkOnly = process.argv.includes('--check');
let changed = 0;
let legacyHits = 0;

const allFiles = [...TARGET_FILES.filter((f) => fs.existsSync(f))];
for (const dir of TARGET_DIRS) allFiles.push(...walk(dir));

for (const file of allFiles) {
  const rel = path.relative(ROOT, file);
  const original = fs.readFileSync(file, 'utf8');
  const next = migrateText(original);
  if (/§6\.|#6-product-trust/.test(next)) legacyHits += 1;
  if (next !== original) {
    changed += 1;
    if (!checkOnly) fs.writeFileSync(file, next, 'utf8');
    console.log(checkOnly ? `would update: ${rel}` : `updated: ${rel}`);
  }
}

if (legacyHits > 0) {
  console.error(
    `\n⚠️  ${legacyHits} file(s) still contain legacy §6 / #6-product-trust patterns after migration.`
  );
  if (checkOnly) process.exit(1);
}

console.log(
  `\n${checkOnly ? 'Check' : 'Migration'} complete: ${changed} file(s) ${checkOnly ? 'need' : ''} update.`
);
process.exit(checkOnly && changed > 0 ? 1 : 0);
