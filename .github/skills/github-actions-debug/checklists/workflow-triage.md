# Workflow Triage Checklist

```md
- [ ] Identified the failing workflow file
- [ ] Got failed run ID via `list_workflow_runs`
- [ ] Pulled logs via `get_job_logs` (failed_only)
- [ ] Identified the specific step that failed
- [ ] Compared to last successful run (same workflow)
- [ ] Determined: cancellation / timeout / real failure / external outage
- [ ] Checked recent diffs to the workflow YAML
- [ ] Checked recent diffs to scripts the workflow invokes
- [ ] Confirmed `permissions:` block is sufficient
- [ ] Confirmed required secrets are present (presence-only check)
- [ ] Confirmed runner image + Node/Python versions are stable
- [ ] If applicable: re-ran with `workflow_dispatch` + `dry_run: true`
- [ ] Fixed root cause (not just symptom)
- [ ] If state files involved: confirmed they were not committed with secrets
- [ ] If the workflow posts publicly: confirmed no spurious post during debug
```
