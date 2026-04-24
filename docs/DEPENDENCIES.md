# Dependency Management Policy

## Overview

This document outlines the dependency management policy for the Gold-Prices platform, including
upgrade strategies, security practices, and maintenance procedures.

## Current Dependency Status

### Production Dependencies

- **bcryptjs** `^3.0.3` - ✅ Up to date - Password hashing
- **cors** `^2.8.6` - ✅ Up to date - CORS middleware
- **express** `^5.2.1` - ✅ Up to date - Web framework
- **express-rate-limit** `^8.3.2` - ✅ Up to date - Rate limiting
- **helmet** `^8.1.0` - ✅ Up to date - Security headers
- **jsonwebtoken** `^9.0.3` - ✅ Up to date - JWT authentication
- **morgan** `^1.10.1` - ✅ Up to date - HTTP request logger
- **uuid** `^13.0.0` - ✅ Up to date - UUID generation

> `lowdb` was removed in the 2026-04-24 dependency audit (PR C-1). It was not
> imported anywhere in `server/` — persistence is via plain `fs.readFileSync`
> / `fs.writeFileSync` in `server/lib/auth.js` and the per-repository helpers
> under `server/repositories/`. If the project ever needs structured file-
> based persistence, re-add `lowdb` intentionally with a migration note.

### Development Dependencies

- **terser** `^5.46.1` - ✅ Up to date - JavaScript minifier
- **vite** `^8.0.8` - ✅ Up to date - Build tool

## Upgrade Strategy

### Phase 1: Security Patches — ✅ Completed — Vite upgraded to 8.0.8

```bash
npm install vite@^8.0.8 --save-dev
npm audit fix
npm test
```

### Phase 2: Minor Updates — ✅ Completed — express-rate-limit upgraded to 8.3.2

```bash
npm install express-rate-limit@^8.3.2
npm test
```

### Phase 3: Major Updates (Next Sprint)

**Priority:** MEDIUM - Breaking changes, requires testing

```bash
# All production majors are on latest; no pending major upgrades.
# Re-run `npm outdated` to refresh.
```

## Upgrade Policy

### Automated Updates

- **Patch versions** (x.x.**X**): Auto-update via Dependabot
- **Minor versions** (x.**X**.x): Review and approve within 1 week
- **Major versions** (**X**.x.x): Review, test, and approve within 1 month

### Security Updates

- **Critical vulnerabilities**: Patch within 24 hours
- **High vulnerabilities**: Patch within 1 week
- **Moderate vulnerabilities**: Patch within 2 weeks
- **Low vulnerabilities**: Patch within 1 month

### Testing Requirements

Before merging any dependency update:

1. ✅ All 205+ tests must pass
2. ✅ `npm run validate` must pass
3. ✅ `npm run build` must succeed
4. ✅ Manual smoke testing of critical paths
5. ✅ No new console errors or warnings

### Breaking Change Procedure

For major version upgrades with breaking changes:

1. Create feature branch
2. Read CHANGELOG and migration guide
3. Update code to new API
4. Add/update tests for new behavior
5. Update documentation
6. Create PR with detailed migration notes
7. Get approval from 2+ reviewers
8. Merge only after full QA pass

## Tools & Automation

### npm audit

Run weekly and before every release:

```bash
npm audit
npm audit fix  # For automatic fixes
npm audit fix --force  # Only with approval for breaking changes
```

### Outdated Check

Run monthly:

```bash
npm outdated
```

### Dependabot Configuration

`.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    open-pull-requests-limit: 5
    labels:
      - 'dependencies'
      - 'automated'
```

### CI/CD Integration

- All PRs run `npm audit`
- Block merges with critical/high vulnerabilities
- Weekly automated security scan reports

## Pinning Strategy

### Production Dependencies

- Use caret ranges (`^x.y.z`) for flexibility
- Pin exact versions for security-critical packages
- Document reason for any exact pins

### Development Dependencies

- Use caret ranges for most tools
- Pin Vite version during active development
- Update regularly during maintenance windows

## Monitoring

### Weekly Reviews

- Check GitHub Security Advisories
- Review Dependabot PRs
- Monitor npm audit output

### Monthly Reviews

- Full dependency audit
- Check for outdated packages
- Plan major upgrades

### Quarterly Reviews

- Major version upgrade planning
- Evaluate new tools/alternatives
- Clean up unused dependencies

## Rollback Procedure

If an upgrade causes issues:

1. **Immediate:** Revert to previous version via git
2. **Document:** Create issue with error details
3. **Investigate:** Research root cause
4. **Fix:** Apply patch or wait for upstream fix
5. **Retry:** Attempt upgrade again after fix

## Contact & Resources

- **Security Issues:** Report via GitHub Security Advisories
- **Upgrade Questions:** Team discussion in #engineering-platform
- **npm audit docs:** https://docs.npmjs.com/cli/v10/commands/npm-audit
- **Snyk advisor:** https://snyk.io/advisor/

## Last Updated

- **Date:** 2026-04-14
- **Updated By:** Phase 1.1 Implementation
- **Next Review:** 2026-05-14
