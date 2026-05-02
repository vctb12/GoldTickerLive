#!/usr/bin/env python3
"""Gold provider bakeoff & X duplicate-guard — readiness gate.

Reports, in one place, whether the repo is ready to:
  * open the PR as Draft (gates: infra files exist, tests pass conceptually,
    workflows safe, no accidental production wiring)
  * mark the PR Ready for Review / merge (additional gates: real bakeoff
    samples exist, scorecard is non-trivial, operator checklist filled,
    winner & backup chosen)

Exit codes
----------
  0  Safe for Draft PR AND merge gates pass.
  1  Not safe even for Draft PR (something fundamentally wrong).
  2  Draft PR safe, but merge is blocked by owner actions.

With ``--draft-ok-exit-zero`` the script returns 0 instead of 2 when the
only blockers are owner-side merge gates (so PR checks can pass while the
report still clearly says "not merge ready").

The script never prints secret values. It only checks that secret-shaped
strings are *referenced* by workflow files, never that they are set.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass
class Gate:
    name: str
    status: str           # "pass" | "warn" | "fail"
    blocking_merge: bool
    blocking_draft: bool = False
    owner_action: str = ""
    detail: str = ""


@dataclass
class Report:
    gates: List[Gate] = field(default_factory=list)

    def add(self, gate: Gate) -> None:
        self.gates.append(gate)

    def has_draft_blocker(self) -> bool:
        return any(g.blocking_draft and g.status == "fail" for g in self.gates)

    def has_merge_blocker(self) -> bool:
        return any(g.blocking_merge and g.status != "pass" for g in self.gates)


# ---------------------------------------------------------------------------
# Required infrastructure files

REQUIRED_FILES: List[str] = [
    "scripts/python/gold_providers/__init__.py",
    "scripts/python/gold_providers/base.py",
    "scripts/python/gold_providers/normalize.py",
    "scripts/python/gold_providers/http_client.py",
    "scripts/python/gold_providers/registry.py",
    "scripts/python/gold_providers/metal_sentinel.py",
    "scripts/python/gold_providers/finnhub.py",
    "scripts/python/gold_providers/fmp.py",
    "scripts/python/gold_providers/goldapi_io.py",
    "scripts/python/gold_providers/twelvedata.py",
    "scripts/python/gold_providers/goldpricez.py",
    "scripts/python/gold_providers/gold_api_com.py",
    "scripts/python/provider_bakeoff.py",
    "scripts/python/provider_scorecard.py",
    "scripts/python/fetch_gold_price.py",
    "scripts/python/post_gold_price.py",
    "scripts/python/tweet_guard.py",
    "data/gold_price.json",
    "data/last_gold_price.json",
    "data/last_tweet_state.json",
    "data/provider_state.json",
    ".github/workflows/test-gold-providers.yml",
    ".github/workflows/gold-provider-bakeoff.yml",
    ".github/workflows/pr-provider-smoke.yml",
    "docs/operator-inputs-gold-provider-bakeoff.md",
    "docs/gold-price-provider-bakeoff.md",
    "docs/gold-price-provider-migration.md",
    "docs/x-automation-duplicate-policy.md",
    "docs/data-source-methodology.md",
    "docs/AUTOMATIONS.md",
    ".env.example",
]

# Curated state files that must NOT be silenced by .gitignore.
PROTECTED_DATA_FILES: List[str] = [
    "data/gold_price.json",
    "data/last_gold_price.json",
    "data/provider_state.json",
    "data/last_tweet_state.json",
]

GENERATED_BAKEOFF_PATTERNS: List[str] = [
    "data/provider_bakeoff_log.jsonl",
    "data/provider_scorecard.json",
]


# ---------------------------------------------------------------------------
# Checks


def check_required_files(root: Path, report: Report) -> None:
    missing = [p for p in REQUIRED_FILES if not (root / p).is_file()]
    if missing:
        report.add(Gate(
            name="Required infrastructure files",
            status="fail",
            blocking_merge=True,
            blocking_draft=True,
            owner_action=f"Restore missing files: {', '.join(missing)}",
        ))
    else:
        report.add(Gate(
            name="Required infrastructure files",
            status="pass",
            blocking_merge=False,
            detail=f"{len(REQUIRED_FILES)} files present",
        ))


def check_gitignore_bakeoff(root: Path, report: Report) -> None:
    gi = root / ".gitignore"
    if not gi.is_file():
        report.add(Gate(
            name=".gitignore exists",
            status="fail", blocking_merge=True, blocking_draft=True,
            owner_action="Add a .gitignore at repo root.",
        ))
        return
    text = gi.read_text(encoding="utf-8")
    missing_ignores = [p for p in GENERATED_BAKEOFF_PATTERNS if p not in text]
    leaked_protected = [p for p in PROTECTED_DATA_FILES if re.search(rf"^{re.escape(p)}\s*$", text, re.M)]
    if missing_ignores:
        report.add(Gate(
            name=".gitignore covers generated bakeoff artifacts",
            status="warn", blocking_merge=False,
            owner_action=("Add these patterns to .gitignore: " + ", ".join(missing_ignores)),
        ))
    elif leaked_protected:
        report.add(Gate(
            name=".gitignore covers generated bakeoff artifacts",
            status="fail", blocking_merge=True,
            owner_action=("Remove these protected files from .gitignore: " + ", ".join(leaked_protected)),
        ))
    else:
        report.add(Gate(
            name=".gitignore covers generated bakeoff artifacts",
            status="pass", blocking_merge=False,
            detail="generated logs ignored; curated state files preserved",
        ))


def _read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8")
    except OSError:
        return ""


def check_operator_doc(root: Path, report: Report) -> None:
    p = root / "docs" / "operator-inputs-gold-provider-bakeoff.md"
    text = _read(p)
    if not text:
        report.add(Gate(
            name="Operator checklist filled",
            status="fail", blocking_merge=True,
            owner_action="docs/operator-inputs-gold-provider-bakeoff.md is empty/missing.",
        ))
        return

    blanks = len(re.findall(r"_____", text))
    # Pattern matches either "Winning provider: _____" or filled "Winning provider: foo".
    winner_blank = bool(re.search(r"Winning provider:\s*_+", text))
    backup_blank = bool(re.search(r"Backup provider:\s*_+", text))
    cron_blank = bool(re.search(r"Production cron:\s*_+", text))
    activation_unchecked = bool(re.search(
        r"## 6\. Production activation checklist[\s\S]*?- \[ \]", text))

    bullets: List[str] = []
    if winner_blank:
        bullets.append("Winning provider not selected (§5)")
    if backup_blank:
        bullets.append("Backup provider not selected (§5)")
    if cron_blank:
        bullets.append("Production cron not chosen (§8)")
    if activation_unchecked:
        bullets.append("Production activation checklist has unchecked items (§6)")

    if bullets:
        report.add(Gate(
            name="Operator checklist filled",
            status="fail", blocking_merge=True,
            owner_action="; ".join(bullets),
            detail=f"{blanks} `_____` placeholders remaining",
        ))
    else:
        report.add(Gate(
            name="Operator checklist filled",
            status="pass", blocking_merge=False,
            detail=f"{blanks} `_____` placeholders remaining (informational)",
        ))


def _has_real_sample(scorecard: Dict[str, Any]) -> bool:
    providers = scorecard.get("providers") or []
    if not isinstance(providers, list):
        return False
    for p in providers:
        if not isinstance(p, dict):
            continue
        ok = p.get("ok_count") or p.get("success_count") or 0
        score = p.get("score") or 0
        if (isinstance(ok, (int, float)) and ok >= 1) and (isinstance(score, (int, float)) and score > 0):
            return True
    return False


def check_bakeoff_samples(root: Path, report: Report) -> None:
    log_p = root / "data" / "provider_bakeoff_log.jsonl"
    sc_p = root / "data" / "provider_scorecard.json"
    log_lines = 0
    if log_p.is_file():
        try:
            log_lines = sum(1 for _ in log_p.open("r", encoding="utf-8") if _.strip())
        except OSError:
            log_lines = 0

    scorecard: Dict[str, Any] = {}
    if sc_p.is_file():
        try:
            scorecard = json.loads(sc_p.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            scorecard = {}

    real = _has_real_sample(scorecard)
    if real:
        report.add(Gate(
            name="Real bakeoff samples present",
            status="pass", blocking_merge=False,
            detail=f"scorecard has ≥1 successful provider (log lines={log_lines})",
        ))
    else:
        report.add(Gate(
            name="Real bakeoff samples present",
            status="fail", blocking_merge=True,
            owner_action=("Run gold-provider-bakeoff.yml for ≥24h with at least one provider key, "
                          "then download the artifact and review data/provider_scorecard.json."),
            detail=f"log lines={log_lines}; scorecard has_real={real}",
        ))


def check_winner_backup_in_doc(root: Path, report: Report) -> None:
    """Already covered by check_operator_doc; this is a focused mirror.

    Marked merge-blocking but not draft-blocking.
    """
    # Intentionally a no-op: the operator-doc check already reports these.


def _yaml_default_for(body: str, input_name: str) -> Optional[str]:
    """Best-effort grep for `input_name:` followed by `default: "..."`.

    Avoids a YAML dependency; returns the default value as a stripped
    string (lower-cased) or None if not found.
    """
    m = re.search(
        rf"^\s*{re.escape(input_name)}:\s*\n(?:\s+[^\n]*\n)*?\s+default:\s*\"?([^\"\n]+)\"?",
        body,
        re.M,
    )
    return m.group(1).strip().lower() if m else None


def check_workflow_safety(root: Path, report: Report) -> None:
    test_yml = _read(root / ".github" / "workflows" / "test-gold-providers.yml")
    bakeoff_yml = _read(root / ".github" / "workflows" / "gold-provider-bakeoff.yml")
    smoke_yml = _read(root / ".github" / "workflows" / "pr-provider-smoke.yml")
    issues: List[str] = []

    twitter_tokens = ("CONSUMER_KEY", "CONSUMER_SECRET", "ACCESS_TOKEN",
                      "ACCESS_TOKEN_SECRET", "TWITTER_API_KEY")
    # The PR smoke workflow is allowed to run on `pull_request` (that is its
    # whole point — be visible as a PR check) but is NOT allowed to run on
    # raw `push`. Bakeoff/test workflows must not run on either trigger.
    for name, body, allow_push in (
        ("test-gold-providers.yml", test_yml, False),
        ("gold-provider-bakeoff.yml", bakeoff_yml, False),
        ("pr-provider-smoke.yml", smoke_yml, False),
    ):
        if not body:
            continue
        for tok in twitter_tokens:
            if tok in body:
                issues.append(f"{name} references X/Twitter secret `{tok}`")
        if "post_gold_price.py" in body:
            issues.append(f"{name} runs the X poster directly")
        # Heavy auto-trigger: bakeoff/test workflows must NOT fire on every
        # push, otherwise every commit hammers provider quotas.
        if not allow_push and re.search(r"^on:\s*\n(?:[\s\S]*?\n)?\s*push:\s*\n", body, re.M):
            issues.append(f"{name} runs on `push` (would hammer providers on every commit)")

    # Bakeoff commit must be gated behind explicit input.
    if bakeoff_yml:
        if "commit_results" not in bakeoff_yml:
            issues.append("bakeoff workflow missing `commit_results` input gate")
        elif "github.event.inputs.commit_results == 'true'" not in bakeoff_yml \
                and "inputs.commit_results == 'true'" not in bakeoff_yml:
            issues.append("bakeoff workflow commits without gating on commit_results=='true'")
        # Defaults must be safe.
        commit_default = _yaml_default_for(bakeoff_yml, "commit_results")
        if commit_default not in (None, "false"):
            issues.append(f"bakeoff `commit_results` default is `{commit_default}` (must be `false`)")
    if test_yml:
        log_raw_default = _yaml_default_for(test_yml, "log_raw")
        if log_raw_default not in (None, "false"):
            issues.append(f"test-gold-providers `log_raw` default is `{log_raw_default}` (must be `false`)")

    if issues:
        report.add(Gate(
            name="Test/bakeoff workflows safe (no X post, no auto-commit)",
            status="fail", blocking_merge=True, blocking_draft=True,
            owner_action="; ".join(issues),
        ))
    else:
        report.add(Gate(
            name="Test/bakeoff workflows safe (no X post, no auto-commit)",
            status="pass", blocking_merge=False,
            detail="no Twitter secrets referenced; commit step gated",
        ))


def check_production_unchanged(root: Path, report: Report) -> None:
    """Confirm new orchestrator is not yet scheduled in production.

    This is intentionally inverted: we WANT the new orchestrator to NOT be
    scheduled until the operator approves cutover.
    """
    workflows_dir = root / ".github" / "workflows"
    if not workflows_dir.is_dir():
        report.add(Gate(
            name="Production not silently switched",
            status="fail", blocking_merge=True, blocking_draft=True,
            owner_action="Workflow directory missing.",
        ))
        return

    bad_callers: List[str] = []
    for wf in workflows_dir.glob("*.yml"):
        if wf.name in {"gold-provider-bakeoff.yml", "test-gold-providers.yml",
                       "gold-bakeoff-readiness.yml", "pr-provider-smoke.yml"}:
            continue
        text = _read(wf)
        # The new orchestrator is `scripts/python/fetch_gold_price.py`.
        # The legacy script is `scripts/fetch_gold_price.py` (no `python/`).
        if re.search(r"scripts/python/fetch_gold_price\.py", text) and "schedule:" in text:
            bad_callers.append(wf.name)

    if bad_callers:
        report.add(Gate(
            name="Production not silently switched",
            status="fail", blocking_merge=True, blocking_draft=True,
            owner_action=("New orchestrator is scheduled in: " + ", ".join(bad_callers) +
                          ". Production cutover must be a separate, owner-approved PR."),
        ))
    else:
        report.add(Gate(
            name="Production not silently switched",
            status="pass", blocking_merge=False,
            detail="new orchestrator is dormant; legacy path still in use",
        ))


def check_env_example(root: Path, report: Report) -> None:
    p = root / ".env.example"
    text = _read(p)
    if not text:
        report.add(Gate(
            name=".env.example present",
            status="fail", blocking_merge=True, blocking_draft=True,
            owner_action="Create .env.example with provider/X env variables.",
        ))
        return
    expected = (
        "GOLDPRICEZ_API_KEY", "ALLOW_STALE_TWEET", "SKIP_DUPLICATE_TWEETS",
        "MIN_TWEET_MOVE_USD", "MIN_TWEET_MOVE_PCT", "FORCE_SUMMARY_AFTER_MINUTES",
        "GOLDAPI_IO_ENABLED", "GOLDPRICEZ_ENABLED", "GOLD_API_COM_ENABLED",
    )
    missing = [k for k in expected if k not in text]
    if missing:
        report.add(Gate(
            name=".env.example present",
            status="warn", blocking_merge=False,
            owner_action="Add missing keys to .env.example: " + ", ".join(missing),
        ))
    else:
        report.add(Gate(
            name=".env.example present",
            status="pass", blocking_merge=False,
            detail="all expected provider/guard keys documented",
        ))


# ---------------------------------------------------------------------------
# Output


def render_text(report: Report) -> str:
    rows = []
    rows.append(f"{'Gate':<55} {'Status':<6} {'Blocks merge':<14} Owner action")
    rows.append("-" * 110)
    icons = {"pass": "PASS", "warn": "WARN", "fail": "FAIL"}
    for g in report.gates:
        rows.append(
            f"{g.name[:55]:<55} {icons[g.status]:<6} "
            f"{('yes' if g.blocking_merge and g.status != 'pass' else 'no'):<14} "
            f"{g.owner_action[:120]}"
        )
        if g.detail:
            rows.append(f"    └─ {g.detail}")
    return "\n".join(rows)


def render_json(report: Report) -> str:
    return json.dumps([{
        "name": g.name,
        "status": g.status,
        "blocking_merge": g.blocking_merge and g.status != "pass",
        "blocking_draft": g.blocking_draft and g.status == "fail",
        "owner_action": g.owner_action,
        "detail": g.detail,
    } for g in report.gates], indent=2)


# ---------------------------------------------------------------------------
# Main


def run(root: Path) -> Report:
    report = Report()
    check_required_files(root, report)
    check_gitignore_bakeoff(root, report)
    check_env_example(root, report)
    check_workflow_safety(root, report)
    check_production_unchanged(root, report)
    check_operator_doc(root, report)
    check_bakeoff_samples(root, report)
    return report


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Gold provider bakeoff readiness gate.")
    parser.add_argument("--repo-root", type=Path, default=None,
                        help="Path to repository root (default: auto-detected).")
    parser.add_argument("--strict", action="store_true",
                        help="Treat warnings as failures.")
    parser.add_argument("--json", action="store_true",
                        help="Emit JSON instead of a text table.")
    parser.add_argument("--draft-ok-exit-zero", action="store_true",
                        help=("If the only blockers are owner-side merge gates "
                              "(Draft PR is safe), exit 0 instead of 2."))
    args = parser.parse_args(argv)

    root = args.repo_root or Path(__file__).resolve().parent.parent.parent
    report = run(root)

    if args.json:
        print(render_json(report))
    else:
        print(render_text(report))
        # Summary footer
        draft_blocked = report.has_draft_blocker()
        merge_blocked = report.has_merge_blocker()
        if args.strict:
            # Promote any warn to merge-blocker
            for g in report.gates:
                if g.status == "warn":
                    merge_blocked = True
        print()
        if draft_blocked:
            print("RESULT: Not safe to open Draft PR — fix the FAIL gates above.")
        elif merge_blocked:
            print("RESULT: Safe to open Draft PR. Not safe to merge yet.")
        else:
            print("RESULT: Safe to merge.")

    if report.has_draft_blocker():
        return 1
    if args.strict and any(g.status == "warn" for g in report.gates):
        return 0 if args.draft_ok_exit_zero else 2
    if report.has_merge_blocker():
        return 0 if args.draft_ok_exit_zero else 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
