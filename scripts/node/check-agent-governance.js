#!/usr/bin/env node
'use strict';

/**
 * CI gate: agent governance files stay complete and wired.
 * - Required .cursor/rules/*.mdc exist with alwaysApply: true
 * - AGENTS.md contains required policy sections (compact charter)
 * - Automation prompts include the rules preamble
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

const REQUIRED_RULE_FILES = [
  'non-negotiable-rules.mdc',
  'pricing-trust.mdc',
  'bilingual-content.mdc',
  'seo-structure.mdc',
];

const REQUIRED_AGENTS_SECTIONS = [
  '## Project overview',
  '## Product promise',
  '## Non-negotiable rules',
  '## Terminology policy',
  '## Review priorities',
  '## Action rules',
  '## Content standards',
  '## Local page policy',
  '## Bilingual policy',
  '## Technical SEO policy',
  '## Output expectations for agents',
  '## Core commands',
  '## Operational guardrails',
];

const EXPECTED_NON_NEGOTIABLE_COUNT = 6;

/** Keyword checks per rule index for AGENTS.md vs non-negotiable-rules.mdc headings */
const RULE_TITLE_PAIRS = [
  { agents: ['reference', 'retail'], mdc: ['reference', 'retail'] },
  { agents: ['freshness'], mdc: ['freshness'] },
  { agents: ['semantic'], mdc: ['arabic'] },
  { agents: ['linking'], mdc: ['linking'] },
  { agents: ['metadata', 'seo'], mdc: ['metadata', 'seo'] },
  { agents: ['trust-first'], mdc: ['trust-first'] },
];

const LEGACY_CHARTER_PATTERN = /§6\.|#6-product-trust-guardrails/;
const LEGACY_SCAN_FILES = ['docs/REPO_AUDIT.md', 'docs/realtime-architecture.md'];
const LEGACY_ALLOWLIST = new Set(['docs/AGENTS_REFERENCE.md']);

const PREAMBLE_MARKERS = [
  'Before reviewing or editing anything, read and follow:',
  'AGENTS.md',
  'non-negotiable-rules.mdc',
  'pricing-trust.mdc',
  'bilingual-content.mdc',
  'seo-structure.mdc',
];

let errors = 0;

function sliceBetween(text, startHeading, endHeading) {
  const start = text.indexOf(startHeading);
  const end = text.indexOf(endHeading, start + 1);
  if (start === -1 || end === -1) return '';
  return text.slice(start, end);
}

function countBoldListRules(text, startHeading, endHeading) {
  const slice = sliceBetween(text, startHeading, endHeading);
  return (slice.match(/^\d+\. \*\*/gm) || []).length;
}

function countMdcSectionRules(text, startHeading, endHeading) {
  const slice = sliceBetween(text, startHeading, endHeading);
  return (slice.match(/^## \d+\./gm) || []).length;
}

function extractAgentsRuleTitles(text) {
  const slice = sliceBetween(text, '## Non-negotiable rules', '## Terminology policy');
  const titles = [];
  const re = /^\d+\. \*\*([^*]+)\*\*/gm;
  let m;
  while ((m = re.exec(slice)) !== null) titles.push(m[1].trim().toLowerCase());
  return titles;
}

function extractMdcRuleTitles(text) {
  const slice = sliceBetween(text, '# Non-negotiable rules', '## Terminology policy');
  const titles = [];
  const re = /^## \d+\. (.+)$/gm;
  let m;
  while ((m = re.exec(slice)) !== null) titles.push(m[1].trim().toLowerCase());
  return titles;
}

function titleMatchesKeywords(title, keywords) {
  return keywords.every((kw) => title.includes(kw));
}

function walkFiles(dir, ext, files = []) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return files;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const full = path.join(abs, ent.name);
    if (ent.isDirectory()) walkFiles(path.join(dir, ent.name), ext, files);
    else if (full.endsWith(ext)) files.push(path.relative(ROOT, full));
  }
  return files;
}

function fail(msg) {
  errors += 1;
  console.error(`❌ ${msg}`);
}

function pass(msg) {
  console.log(`✅ ${msg}`);
}

function read(filePath) {
  return fs.readFileSync(path.join(ROOT, filePath), 'utf8');
}

function exists(filePath) {
  return fs.existsSync(path.join(ROOT, filePath));
}

// --- Rule files ---
for (const name of REQUIRED_RULE_FILES) {
  const rel = `.cursor/rules/${name}`;
  if (!exists(rel)) {
    fail(`Missing required rule file: ${rel}`);
    continue;
  }
  const content = read(rel);
  if (!/^---\s*\nalwaysApply:\s*true\s*\n---/m.test(content)) {
    fail(`${rel} must have frontmatter alwaysApply: true`);
  }
}
if (errors === 0) {
  pass(`All ${REQUIRED_RULE_FILES.length} topic rule files present with alwaysApply: true.`);
}

// --- AGENTS.md structure ---
const agentsPath = 'AGENTS.md';
if (!exists(agentsPath)) {
  fail('AGENTS.md is missing.');
} else {
  const agents = read(agentsPath);
  const lineCount = agents.split('\n').length;
  if (lineCount > 280) {
    fail(
      `AGENTS.md is ${lineCount} lines — keep compact (target ≤250) or move detail to docs/AGENTS_REFERENCE.md`
    );
  }
  for (const heading of REQUIRED_AGENTS_SECTIONS) {
    if (!agents.includes(heading)) {
      fail(`AGENTS.md missing section: ${heading}`);
    }
  }
  if (!exists('docs/AGENTS_REFERENCE.md')) {
    fail('docs/AGENTS_REFERENCE.md missing — extended reference for AGENTS.md');
  }
  const agentsRules = countBoldListRules(
    agents,
    '## Non-negotiable rules',
    '## Terminology policy'
  );
  if (agentsRules !== EXPECTED_NON_NEGOTIABLE_COUNT) {
    fail(
      `AGENTS.md has ${agentsRules} non-negotiable rules; expected ${EXPECTED_NON_NEGOTIABLE_COUNT}`
    );
  }
  if (errors === 0 || lineCount <= 280) {
    pass(
      `AGENTS.md structure check passed (${lineCount} lines, ${agentsRules} non-negotiable rules).`
    );
  }
}

// --- Rule count parity (AGENTS.md ↔ non-negotiable-rules.mdc ↔ master-rerun) ---
const mdcRules = countMdcSectionRules(
  read('.cursor/rules/non-negotiable-rules.mdc'),
  '# Non-negotiable rules',
  '## Terminology policy'
);
if (mdcRules !== EXPECTED_NON_NEGOTIABLE_COUNT) {
  fail(`non-negotiable-rules.mdc has ${mdcRules} rules; expected ${EXPECTED_NON_NEGOTIABLE_COUNT}`);
} else {
  pass(`non-negotiable-rules.mdc has ${EXPECTED_NON_NEGOTIABLE_COUNT} rules.`);
}

const masterRerunText = read('prompts/master-rerun.md');
const productTrustBlock = masterRerunText.match(
  /## Non-negotiables \(read before coding\)[\s\S]*?Operational:/
);
if (!productTrustBlock) {
  fail('prompts/master-rerun.md missing product-trust non-negotiables block.');
} else {
  const masterRules = (productTrustBlock[0].match(/^\d+\. \*\*/gm) || []).length;
  if (masterRules !== EXPECTED_NON_NEGOTIABLE_COUNT) {
    fail(
      `prompts/master-rerun.md lists ${masterRules} product-trust rules; expected ${EXPECTED_NON_NEGOTIABLE_COUNT}`
    );
  } else {
    pass(`prompts/master-rerun.md lists ${EXPECTED_NON_NEGOTIABLE_COUNT} product-trust rules.`);
  }
}

if (exists(agentsPath) && mdcRules === EXPECTED_NON_NEGOTIABLE_COUNT) {
  const agentsRules = countBoldListRules(
    read(agentsPath),
    '## Non-negotiable rules',
    '## Terminology policy'
  );
  if (agentsRules === mdcRules) {
    pass('AGENTS.md and non-negotiable-rules.mdc rule counts match.');
  }

  const agentsTitles = extractAgentsRuleTitles(read(agentsPath));
  const mdcTitles = extractMdcRuleTitles(read('.cursor/rules/non-negotiable-rules.mdc'));
  if (agentsTitles.length !== RULE_TITLE_PAIRS.length) {
    fail(
      `AGENTS.md rule title extract count ${agentsTitles.length} !== ${RULE_TITLE_PAIRS.length}`
    );
  } else if (mdcTitles.length !== RULE_TITLE_PAIRS.length) {
    fail(
      `non-negotiable-rules.mdc title extract count ${mdcTitles.length} !== ${RULE_TITLE_PAIRS.length}`
    );
  } else {
    let titlesOk = true;
    for (let i = 0; i < RULE_TITLE_PAIRS.length; i += 1) {
      const pair = RULE_TITLE_PAIRS[i];
      if (
        !titleMatchesKeywords(agentsTitles[i], pair.agents) ||
        !titleMatchesKeywords(mdcTitles[i], pair.mdc)
      ) {
        fail(
          `Rule ${i + 1} title mismatch — AGENTS: "${agentsTitles[i]}" | mdc: "${mdcTitles[i]}"`
        );
        titlesOk = false;
      }
    }
    if (titlesOk) pass('AGENTS.md and non-negotiable-rules.mdc rule titles align.');
  }
}

// --- Legacy §6 references in active docs ---
for (const rel of [
  ...LEGACY_SCAN_FILES,
  ...walkFiles('docs/plans', '.md'),
  ...walkFiles('reports', '.md'),
  ...walkFiles('reports', '.json'),
]) {
  if (LEGACY_ALLOWLIST.has(rel)) continue;
  const content = read(rel);
  if (LEGACY_CHARTER_PATTERN.test(content)) {
    fail(
      `Legacy AGENTS.md §6 reference in ${rel} — run node scripts/node/migrate-agents-charter-refs.js`
    );
  }
}
if (errors === 0) {
  pass('No legacy §6 / #6-product-trust-guardrails refs in plans/reports/active docs.');
}

// --- Prompt preambles ---
const promptsDir = path.join(ROOT, '.github/prompts');
const promptFiles = fs
  .readdirSync(promptsDir)
  .filter((name) => name.endsWith('.prompt.md') && !name.startsWith('_'));

for (const name of promptFiles) {
  const rel = `.github/prompts/${name}`;
  const content = read(rel);
  for (const marker of PREAMBLE_MARKERS) {
    if (!content.includes(marker)) {
      fail(`${rel} missing rules preamble marker: ${marker}`);
    }
  }
}
if (errors === 0) {
  pass(`All ${promptFiles.length} automation prompts include the rules preamble.`);
}

const masterRerun = 'prompts/master-rerun.md';
if (!exists(masterRerun)) {
  fail(`${masterRerun} missing.`);
} else {
  const content = read(masterRerun);
  if (!content.includes('Before reviewing or editing anything, read and follow:')) {
    fail(`${masterRerun} missing rules preamble.`);
  } else {
    pass(`${masterRerun} includes rules preamble.`);
  }
}

// --- Preamble snippet for new prompts ---
for (const snippet of ['.github/prompts/_rules-preamble.md', '.github/prompts/_output-format.md']) {
  if (!exists(snippet)) {
    fail(`${snippet} missing.`);
  } else {
    pass(`${snippet} present.`);
  }
}

if (errors > 0) {
  console.error(`\nAgent governance check failed with ${errors} error(s).`);
  process.exit(1);
}

console.log('\nAgent governance check passed.');
process.exit(0);
