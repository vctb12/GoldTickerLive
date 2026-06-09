# Agent output format (copy into audit/review prompts)

Every finding must include all fields below. Prioritize by `AGENTS.md` review priorities.

```markdown
## Findings

### [block|high|medium|low] — <short title>
- **File/page:** `path/to/file` or URL
- **Issue:** what is wrong
- **Impact:** trust / pricing / SEO / bilingual / UX
- **Exact fix:** implementation-ready change
- **Repeat pattern:** yes/no — <memory note if known>
```

For PR reviews, also include verdict, merge recommendation, and verification recommended.
