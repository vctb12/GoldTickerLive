# Tokens Checklist

```md
- [ ] No new hex / rgb / hsl literal in changed CSS — use `--color-*` / `--surface-*`
- [ ] No raw rem / px for spacing — use `--space-*`
- [ ] No off-token border radius — use `--radius-*`
- [ ] No off-token shadow — use `--shadow-*`
- [ ] No magic easing — use `--ease-*`
- [ ] No magic duration — use `--duration-*`
- [ ] Any genuinely new token added to `styles/global.css` with a comment + entry in `docs/DESIGN_TOKENS.md`
- [ ] Tokens used by name, not by value (find/replace safe)
- [ ] Light/dark theme parity if a new color token added
```
