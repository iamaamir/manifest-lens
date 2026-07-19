# Agent Report — PM Review Round 2

## Role

Product Manager

## Scope

Review Fixes 1–7 against `design.md`, `docs/PRD.md`, and the active codebase. Each fix was read in source (`apps/web/index.html`, `apps/web/src/main.ts`, `packages/ui-components/src/index.ts`, `packages/host-web/src/index.ts`). Screenshots were examined (model could not render them — review is source-grounded).

## Findings

### Fix 1 (P0 — Draggable pane divider)

**Resolved.**

`.inspector` grid uses `grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr)` with `gap: 1px` and `background: var(--color-border-hairline)`. No `.pane-divider` element, no drag listeners, no `cursor: col-resize`. Matches `design.md` §3.2 ("not draggable in v1") and §8.4.

### Fix 2 (P0 — Status message bar)

**Resolved with a new concern.**

`#status-message` element is gone. `HostStatusKind`, `statusKindFor`, `onStatus` are removed from `host-web`. App shell no longer wires status.

**New concern**: removing the status bar eliminated the only error-feedback path. `wireManifestInputFlows` calls `analyzeText`, which on invalid JSON calls `host.clear()` then returns `{ kind: "invalid" }`, but the caller ignores the return value — the user sees the empty state again with no explanation. The design spec §5.3 requires a visible error card ("This isn't valid JSON" with line info). Currently, an invalid paste silently resets to empty state. This is a regression in UX: the app no longer communicates *why* input was rejected.

### Fix 6 (P1 — Processing stays local note)

**Resolved.**

Empty state renders: "Drop a manifest.json" → "Or paste it anywhere on this page, or click Upload above." → "Processing stays local to this browser." at 12px in `--color-text-tertiary`. Satisfies PRD User Story 28 and `design.md` §4.5 client-side constraint.

### Fix 7 (P2 — Keyboard Enter/Space pins)

**Resolved.**

`handleSourceKeydown` dispatches `node/select` for the focused node on Enter/Space (lines 1798–1806). Disclosure toggling remains clickable only via `.tree-disclosure` triangle (lines 1590–1602). Matches `design.md` §7 ("pinning/unpinning and expand/collapse are all operable via Enter/Space when focused").

### Missing: Fixes 3–5

User summary lists Fixes 1, 2, 6, 7 — no notes for 3, 4, 5. If those were in the previous review, they are not addressed here. No action unless they were implicitly included.

## New Concerns

### C1 — No error feedback after status bar removal

Described under Fix 2 above. The app now silently discards invalid pastes. Needs either:
- inline error card inside the tree pane (per `design.md` §5.3), or
- the component host to return error state and the shell to surface it.

Either approach should appear on the tree pane surface, not as a floating bar. Recommend filing this as a follow-up before next release.

### C2 — "Try a sample manifest" link not in empty state

`design.md` §5.1 specifies a secondary text link inside the empty state: "Try a sample manifest instead" (underlined, `--text-sm`, `--color-accent-primary`). Current implementation puts a "Load sample" button in the header instead. Functionally equivalent but visually deviates from the spec — the design treats this as a quiet inline prompt, not a header button. Recommend aligning with spec in a future polish pass.

### C3 — Explanation panel order still diverges from design spec

Not in scope for Fixes 1–7 but noted from review. Current order: Eyebrow → Title → Summary → Details → Examples → Related Fields → Documentation links. Design spec §4.3 requires: Eyebrow → Field chip → One-line definition → Prose details → Example block → Version note → Related fields. Version note is missing. This was flagged as P1 in the previous designer review and remains outstanding.

### C4 — Deprecated-field dashed underline and mixed-version warning not implemented

`design.md` §4.2 (deprecated dashed underline) and §5.6 (mixed V2/V3 warning banner) are not present. These are deferred but should remain on the backlog.

## Scope Assessment

Fixes 1, 2, 6, 7 are within MVP scope and correctly implemented (with the C1 caveat for Fix 2). No scope creep detected — no diagnostics, fixes, health scores, AI, remote analysis, CLI, or browser extension packaging.

## Validation

npm run typecheck, npm run test, npm run build — run by the coordinator before delivery.

## Self-Review

Self-review checklist not applicable; read-only review.

## Proposed `docs/journey/memory.md` Update

```md
- PM Round 2 review accepted Fixes 1, 6, 7 as resolved; Fix 2 (status bar removal) resolved but introduced a regression: invalid paste no longer shows error feedback. Filed as follow-up (C1). Additional non-blocking design alignments noted: inline sample link (C2), explanation panel order (C3), deprecated/mixed-version state (C4).
```
