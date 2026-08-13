#!/usr/bin/env node
/** Deduplicated P0 issue sync for the GitHub-only pricing plane. */
'use strict';

const fs = require('node:fs/promises');

const ISSUE_TITLE = '[P0] Production gold price health degraded';
const API_ROOT = 'https://api.github.com';

function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required');
  return fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

async function readReport() {
  const path = process.env.HEALTH_REPORT;
  if (!path) throw new Error('HEALTH_REPORT is required');
  return JSON.parse(await fs.readFile(path, 'utf8'));
}

async function listOpenIssues(repository) {
  const response = await githubRequest(`/repos/${repository}/issues?state=open&per_page=100`);
  if (!response.ok) throw new Error(`GitHub issue list failed: HTTP ${response.status}`);
  return response.json();
}

function fingerprint(report) {
  return JSON.stringify({
    status: report.status,
    critical: report.critical,
    checks: report.checks,
  });
}

async function main() {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) throw new Error('GITHUB_REPOSITORY is required');
  const report = await readReport();
  const issues = await listOpenIssues(repository);
  const current = issues.find((issue) => issue.title === ISSUE_TITLE && !issue.pull_request);
  const body = `## Production pricing health\n\n- Status: **${report.status}**\n- Checked: ${report.checkedAtUtc}\n- Critical signals: ${report.critical.join(', ') || 'none'}\n\nThe browser-live provider, static Actions snapshot, and Pages shell are checked independently. The attached report contains sanitized status, latency, and age values only.\n\nFingerprint: ${fingerprint(report)}`;

  if (report.status === 'degraded') {
    if (current) {
      const comments = await githubRequest(
        `/repos/${repository}/issues/${current.number}/comments?per_page=100`
      );
      const existing = comments.ok ? await comments.json() : [];
      const alreadyReported = existing.some((comment) =>
        comment.body?.includes(`Fingerprint: ${fingerprint(report)}`)
      );
      if (!alreadyReported) {
        await githubRequest(`/repos/${repository}/issues/${current.number}/comments`, {
          method: 'POST',
          body: JSON.stringify({ body }),
        });
      }
      console.log(`updated existing P0 issue #${current.number}`);
    } else {
      const created = await githubRequest(`/repos/${repository}/issues`, {
        method: 'POST',
        body: JSON.stringify({ title: ISSUE_TITLE, body }),
      });
      if (!created.ok) throw new Error(`GitHub issue create failed: HTTP ${created.status}`);
      const issue = await created.json();
      console.log(`created P0 issue #${issue.number}`);
    }
    process.exitCode = 1;
    return;
  }

  if (current) {
    const warningSummary = report.warnings?.length
      ? ` Non-P0 warnings remain: ${report.warnings.join(', ')}.`
      : '';
    await githubRequest(`/repos/${repository}/issues/${current.number}`, {
      method: 'PATCH',
      body: JSON.stringify({ state: 'closed' }),
    });
    await githubRequest(`/repos/${repository}/issues/${current.number}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        body: `P0 recovery verified at ${report.checkedAtUtc}. The P0 pricing health issue is closed.${warningSummary}`,
      }),
    });
    console.log(`closed recovered P0 issue #${current.number}`);
  } else {
    console.log('production pricing healthy; no open P0 issue');
  }
}

if (require.main === module)
  main().catch((error) => {
    console.error(`production health issue sync failed: ${error.message}`);
    process.exitCode = 1;
  });

module.exports = { ISSUE_TITLE, fingerprint };
