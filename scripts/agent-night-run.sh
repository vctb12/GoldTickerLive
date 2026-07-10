#!/usr/bin/env bash
# =============================================================================
# agent-night-run.sh — SAFE overnight autonomous-agent runner for Gold Ticker Live
# -----------------------------------------------------------------------------
# WHAT THIS DOES
#   Runs an AI coding agent (Claude Code by default) unattended overnight in a
#   *safe* configuration: never on `main`, never with permission-bypass, always
#   logged. It is a thin, auditable wrapper. It does NOT merge, deploy, push to
#   `main`, force-push, or touch secrets / owner-gated workflows.
#
# WHAT THIS DELIBERATELY DOES **NOT** DO
#   - No `--dangerously-skip-permissions` / no bypass mode. The agent still asks
#     for (or is denied) risky actions via .claude/settings.json.
#   - No push to `main`, no force-push, no merge, no deploy.
#   - No edits to .env / secrets / gold-price-fetch.yml / post_gold.yml / sw.js
#     / the AED peg constant. Those are denied in .claude/settings.json.
#   Treat the settings.json deny rules and the guards in this script as two
#   independent required layers — do not remove either.
#
# USAGE
#   scripts/agent-night-run.sh ["free-text task / prompt for the agent"]
#
#   Environment overrides (all optional):
#     AGENT_CMD       Launcher command (default: "claude").
#     AGENT_BRANCH    Working branch (default: cowork/agent-night-<date>).
#                     Must never be "main"; the script refuses if it is.
#     AGENT_PROMPT    Prompt text (falls back to $1, then a safe default).
#     AGENT_WORKTREE  Set to 1 to run inside an isolated `git worktree` under
#                     .worktrees/<branch> instead of switching the current tree.
#     NO_CAFFEINATE   Set to 1 to skip the macOS keep-awake wrapper.
#
# EXIT CODES
#   0   success
#   1   refused — an unsafe precondition was detected (e.g. target is main)
#   *   otherwise, the agent's own exit code is propagated
# =============================================================================
set -euo pipefail

# --- Resolve repo root so the script works from any CWD -----------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

# --- Configuration (env-overridable) -----------------------------------------
AGENT_CMD="${AGENT_CMD:-claude}"
DATE_TAG="$(date +%Y%m%d)"
TS="$(date +%Y%m%d-%H%M%S)"
AGENT_BRANCH="${AGENT_BRANCH:-cowork/agent-night-${DATE_TAG}}"
DEFAULT_PROMPT="Read AGENTS.md, CLAUDE.md and docs/AGENT_MASTER_TRACKER.md. Pick the next \
not-started, non-owner-gated phase. Make the smallest correct change on this branch, run \
lint/build/tests, update the tracker, and STOP after one phase. Do NOT merge, deploy, push to \
main, force-push, edit secrets/.env, edit gold-price-fetch.yml/post_gold.yml/sw.js, or change the \
AED 3.6725 peg or pricing formulas."
AGENT_PROMPT="${AGENT_PROMPT:-${1:-$DEFAULT_PROMPT}}"

LOG_DIR="$ROOT/logs/agent-night"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/${TS}.log"

log() { printf '%s %s\n' "[$(date +%H:%M:%S)]" "$*" | tee -a "$LOG"; }
refuse() { log "REFUSED: $*"; exit 1; }

# --- Hard guard: never operate on main ---------------------------------------
if [ "$AGENT_BRANCH" = "main" ] || [ "$AGENT_BRANCH" = "master" ]; then
  refuse "AGENT_BRANCH must not be a protected branch ('$AGENT_BRANCH')."
fi

log "Gold Ticker Live — safe overnight agent run"
log "Repo:    $ROOT"
log "Branch:  $AGENT_BRANCH"
log "Command: $AGENT_CMD (SAFE mode — no permission bypass)"
log "Log:     $LOG"

# --- Prepare an isolated, non-main working area -------------------------------
git fetch origin --quiet || log "WARN: git fetch failed (offline?) — continuing with local refs."

if [ "${AGENT_WORKTREE:-0}" = "1" ]; then
  # Isolated worktree keeps the main checkout untouched while the agent works.
  WT_DIR="$ROOT/.worktrees/${AGENT_BRANCH//\//_}"
  if [ ! -d "$WT_DIR" ]; then
    log "Creating worktree at $WT_DIR"
    git worktree add -B "$AGENT_BRANCH" "$WT_DIR" >/dev/null 2>&1 \
      || refuse "could not create worktree for $AGENT_BRANCH"
  fi
  cd "$WT_DIR"
else
  # Switch the current tree to the safe branch (create if needed).
  CURRENT="$(git rev-parse --abbrev-ref HEAD)"
  log "Current branch: $CURRENT"
  if [ "$CURRENT" != "$AGENT_BRANCH" ]; then
    git switch -c "$AGENT_BRANCH" 2>/dev/null || git switch "$AGENT_BRANCH" \
      || refuse "could not switch to $AGENT_BRANCH"
  fi
fi

NOW_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ "$NOW_BRANCH" != "main" ] && [ "$NOW_BRANCH" != "master" ] \
  || refuse "ended up on protected branch '$NOW_BRANCH' — aborting."
log "Working on branch: $NOW_BRANCH"

if [ -n "$(git status --porcelain)" ]; then
  log "NOTE: working tree has uncommitted changes; the agent will build on top of them."
fi

# --- Keep the machine awake (macOS only; harmless no-op elsewhere) ------------
CAFFEINATE=()
if command -v caffeinate >/dev/null 2>&1 && [ "${NO_CAFFEINATE:-0}" != "1" ]; then
  # -dimsu: prevent display/idle/system sleep for the duration of the child.
  CAFFEINATE=(caffeinate -dimsu)
  log "caffeinate found — machine will stay awake for the run."
else
  log "caffeinate not used (not macOS, unavailable, or NO_CAFFEINATE=1)."
fi

# --- Launch the agent in SAFE mode -------------------------------------------
# IMPORTANT: no bypass flag is passed. The agent runs under normal permission
# prompts / the deny rules in .claude/settings.json. Do not add a bypass flag.
if ! command -v "$AGENT_CMD" >/dev/null 2>&1; then
  refuse "agent command '$AGENT_CMD' not found on PATH. Set AGENT_CMD to your CLI."
fi

log "Starting agent — output tees to the log above. Ctrl-C to stop."
log "---------------------------------------------------------------"
set +e
"${CAFFEINATE[@]}" "$AGENT_CMD" "$AGENT_PROMPT" 2>&1 | tee -a "$LOG"
STATUS="${PIPESTATUS[0]}"
set -e

log "---------------------------------------------------------------"
log "Agent exited with status $STATUS."
log "Review the diff before any push. This runner never pushes to main, never"
log "merges, and never deploys. Human review is required before shipping."
exit "$STATUS"
