#!/usr/bin/env node
/** Fail if a built client artifact contains recognizable private credentials. */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(process.argv[2] || 'dist');
const SECRET_PATTERNS = [
  /(?:sk_live|sk_test)_[A-Za-z0-9]{16,}/g,
  /whsec_[A-Za-z0-9]{16,}/g,
  /(?:ghp|github_pat)_[A-Za-z0-9_]{20,}/g,
  /AIzaSy[A-Za-z0-9_-]{20,}/g,
  /x-access-token["'=:,\s]+[A-Za-z0-9_-]{16,}/gi,
  /(?:api[_-]?key|access[_-]?token)["'=:]+[A-Za-z0-9_-]{20,}/gi,
];

function filesUnder(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(absolute) : [absolute];
  });
}

function scan(directory = ROOT) {
  const findings = [];
  for (const file of filesUnder(directory)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const pattern of SECRET_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) findings.push(path.relative(directory, file));
    }
  }
  return [...new Set(findings)];
}

const findings = scan();
if (findings.length) {
  console.error(`Production secret scan failed in: ${findings.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Production secret scan passed (${filesUnder(ROOT).length} files checked).`);
}

module.exports = { scan };
