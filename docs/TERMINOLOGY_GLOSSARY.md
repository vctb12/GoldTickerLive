# Terminology glossary

Canonical definitions for agents, copywriters, and automations. **Source of truth:**
[`AGENTS.md` terminology policy](../AGENTS.md#terminology-policy) and
`.cursor/rules/non-negotiable-rules.mdc`.

| Term            | Definition                                      | Must not                                    |
| --------------- | ----------------------------------------------- | ------------------------------------------- |
| Reference price | Spot-linked informational estimate              | Imply guaranteed in-store purchase price    |
| Retail quote    | Store/seller price incl. charges, tax, premiums | Present spot-derived estimate as shop price |
| Live            | Real-time or near-real-time from active source  | Use for cached, hourly, or stale data       |
| Updated         | Refreshed periodically, not continuously        | Use when data is actually live-streamed     |
| Cached          | Stored data from a prior fetch                  | Hide cache state from the user              |
| Delayed         | Intentionally lags source by known interval     | Label as live                               |

**Review order when terms conflict:** price math → freshness wording → EN/AR → SEO → linking.
