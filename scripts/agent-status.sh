#!/usr/bin/env bash
# =============================================================================
# agent-status.sh — quick, read-only situational report for agent sessions
# -----------------------------------------------------------------------------
# WHAT THIS DOES
#   Prints a compact snapshot an agent (or owner) can read at the start of a
#   session to orient itself:
#     - current branch + short git status
#     - recent commits
#     - files changed vs the base branch (default: origin/main)
#     - open-PR hints (only if the `gh` CLI is installed and authenticated)
#     - a tracker status summary from docs/AGENT_MASTER_TRACKER.md
#
#   It is strictly READ-ONLY: it never commits, pushes, switches branches, or
#   mutates anything. Safe to run at any time.
#
# USAGE
#   scripts/agent-status.sh [base-ref]
#     base-ref   Branch/ref to diff against (default: origin/main, then main).
# =============================================================================
set -uo pipefail   # intentionally NOT -e: a failing report line must not abort.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

TRACKER="docs/AGENT_MASTER_TRACKER.md"

# Pick a base ref that actually exists.
BASE="${1:-}"
if [ -z "$BASE" ]; then
  if git rev-parse --verify --quiet origin/main >/dev/null; then
    BASE="origin/main"
  else
    BASE="main"
  fi
fi

hr() { printf '%s\n' "----------------------------------------------------------------"; }
section() { printf '\n== %s ==\n' "$1"; }

section "Branch"
printf 'current: %s\n' "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
printf 'base:    %s\n' "$BASE"

section "Git status (short)"
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  git status --short
else
  echo "(clean working tree)"
fi

section "Recent commits"
git log --oneline --decorate -10 2>/dev/null || echo "(no commits)"

section "Files changed vs $BASE"
if git rev-parse --verify --quiet "$BASE" >/dev/null; then
  CHANGED="$(git diff --name-only "$BASE"...HEAD 2>/dev/null)"
  if [ -n "$CHANGED" ]; then
    printf '%s\n' "$CHANGED"
    printf '(%s file(s) changed)\n' "$(printf '%s\n' "$CHANGED" | grep -c .)"
  else
    echo "(no differences)"
  fi
else
  echo "(base ref '$BASE' not found — skipping diff)"
fi

section "Open PR hints"
if command -v gh >/dev/null 2>&1; then
  # `gh` may be unauthenticated; degrade gracefully.
  gh pr status 2>/dev/null || echo "(gh installed but 'gh pr status' failed — auth?)"
else
  echo "(gh CLI not installed — use the GitHub MCP tools / web UI to inspect PRs)"
fi

section "Tracker summary ($TRACKER)"
if [ -f "$TRACKER" ]; then
  # Count status keywords used by the tracker's Status Legend.
  for status in in-progress not-started gated-pending-owner-decision skipped done; do
    count="$(grep -c -- "\`$status\`" "$TRACKER" 2>/dev/null || echo 0)"
    printf '  %-32s %s\n' "$status" "$count"
  done
  echo
  echo "Current Active Phase (from tracker):"
  # Print rows of the 'Current Active Phase' table (between its heading and the next '---').
  awk '/^## Current Active Phase/{f=1} f&&/^---/{exit} f&&/^\| /{print "  " $0}' "$TRACKER" \
    | grep -v -- '---' || echo "  (none found)"
else
  echo "(tracker file not found)"
fi

hr
echo "Read-only snapshot complete. Nothing was modified."
