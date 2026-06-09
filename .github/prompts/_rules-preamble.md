# Rules preamble (copy into every automation prompt)

Paste immediately after the `# Prompt:` title in every `.github/prompts/*.prompt.md` file.
Paths assume the prompt lives in `.github/prompts/` — adjust `../../` if the file lives elsewhere.

```markdown
Before reviewing or editing anything, read and follow:

- [`AGENTS.md`](../../AGENTS.md)
- [`.cursor/rules/non-negotiable-rules.mdc`](../../.cursor/rules/non-negotiable-rules.mdc)
- [`.cursor/rules/pricing-trust.mdc`](../../.cursor/rules/pricing-trust.mdc)
- [`.cursor/rules/bilingual-content.mdc`](../../.cursor/rules/bilingual-content.mdc)
- [`.cursor/rules/seo-structure.mdc`](../../.cursor/rules/seo-structure.mdc)
```

For `prompts/master-rerun.md`, use `../` instead of `../../`.
