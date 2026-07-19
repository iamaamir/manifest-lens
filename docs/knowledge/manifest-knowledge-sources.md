# Manifest Knowledge Sources

Last reviewed: 2026-07-19

This document records the official and durable sources used to keep Manifest Lens explanation knowledge current.

Manifest Lens is an explainer-first product. These sources are used to explain manifest concepts, not to produce diagnostics, publishing-readiness scores, or automatic fixes.

## Source policy

Prefer sources in this order:

1. Official browser documentation for the manifest key or permission.
2. Official browser schema/reference pages when documentation is incomplete.
3. Cross-browser documentation such as MDN for WebExtensions concepts.
4. Realistic repository fixtures only as examples of what users paste, not as authority for standards.

Every knowledge entry should ideally include at least one official documentation link. Entries can have both Chrome and MDN links when behavior is cross-browser or terminology differs.

## Primary sources

| Source | URL | Scope | Last reviewed | Notes |
| --- | --- | --- | --- | --- |
| Chrome Extensions — Manifest file format | https://developer.chrome.com/docs/extensions/reference/manifest | Chrome MV3 manifest keys and Chrome-specific keys | 2026-07-19 | Canonical source for Chrome-supported top-level manifest keys. Page lists required platform keys, Chrome Web Store required keys, optional keys, and ChromeOS keys. |
| Chrome Extensions — Declare permissions | https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions | Permission fields, host permissions, optional permissions, permission warning model | 2026-07-19 | Use for explaining how `permissions`, `optional_permissions`, `host_permissions`, `optional_host_permissions`, and content-script match permissions relate. |
| Chrome Extensions — Permissions reference | https://developer.chrome.com/docs/extensions/reference/permissions-list | Chrome permission strings and warnings | 2026-07-19 | Use for permission-specific explanations. Warnings can be mentioned factually, but do not turn them into health scores or security verdicts. |
| Chrome Extensions — Match patterns | https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns | Chrome match-pattern grammar and examples | 2026-07-19 | Use for `host_permissions`, `optional_host_permissions`, `content_scripts[].matches`, `web_accessible_resources[].matches`, and `externally_connectable.matches`. |
| MDN WebExtensions — manifest.json | https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json | Cross-browser WebExtensions manifest keys | 2026-07-19 | Canonical MDN source for cross-browser/MV2/MV3 and browser-specific key differences. Page was last modified 2026-05-06 by MDN contributors at review time. |
| MDN WebExtensions — permissions | https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions | WebExtensions permission strings and permission concepts | 2026-07-19 | Use for Firefox/WebExtensions permission names not present in Chrome or with browser-specific behavior. Page was last modified 2026-06-11 by MDN contributors at review time. |
| MDN WebExtensions — Match patterns | https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns | Cross-browser match-pattern grammar and examples | 2026-07-19 | Use to explain differences such as supported schemes and Firefox port-number caveats. Page was last modified 2025-12-10 by MDN contributors at review time. |

## Secondary project sources

| Source | Path | Scope | Notes |
| --- | --- | --- | --- |
| PRD | `docs/PRD.md` | Product behavior and non-goals | Keeps knowledge work explainer-first. |
| HLD | `web-extension-manifest-inspector-hld.md` | Architecture and portability | Preserve headless core, serializable snapshots, knowledge separate from rendering. |
| Current knowledge registry | `packages/knowledge/src/index.ts` | Existing implementation | Use for current coverage extraction, not as an authority for completeness. |
| Knowledge tests | `packages/knowledge/src/index.test.ts` | Existing expectations | Current tests cover only MVP-required paths and four permissions. Expand after the coverage catalog is accepted. |
| Fixtures | `fixtures/manifests/` | Representative examples | Use to test source-backed explanation behavior. Fixtures are not standards sources. |

## Update checklist

When refreshing knowledge coverage:

1. Re-open the primary sources above and record the review date.
2. Compare documented keys and permissions against `docs/knowledge/manifest-coverage.md`.
3. Add or update entries in the coverage matrix before changing `packages/knowledge`.
4. Mark browser-specific, MV2-only, MV3-only, deprecated, experimental, and unsupported distinctions in notes.
5. Keep explanations descriptive and educational.
6. Do not introduce diagnostics, fixes, health scores, security ratings, or publishing-readiness verdicts.
7. Add or update coverage tests from a checked-in catalog; do not make CI depend on live documentation pages.

## Explanation wording rules

Use wording like:

- “This field controls…”
- “Browsers use this value to…”
- “In Chrome…” / “In Firefox…” when behavior differs.
- “This is MV2-only” or “This is MV3 and above” as factual context.
- “This permission grants access to…”

Avoid wording like:

- “This manifest is invalid.”
- “You should fix this.”
- “This extension is unsafe.”
- “This permission is bad.”
- “Publishing will fail.”

Those may become future diagnostic layers, but they are not knowledge-entry responsibilities for the explainer MVP.
