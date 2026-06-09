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

const PREAMBLE_MARKERS = [
  'Before reviewing or editing anything, read and follow:',
  'AGENTS.md',
  'non-negotiable-rules.mdc',
  'pricing-trust.mdc',
  'bilingual-content.mdc',
  'seo-structure.mdc',
];

let errors = 0;

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
  if (errors === 0 || lineCount <= 280) {
    pass(
      `AGENTS.md structure check passed (${lineCount} lines, ${REQUIRED_AGENTS_SECTIONS.length} sections).`
    );
  }
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
