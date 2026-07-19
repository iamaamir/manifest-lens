# Product Designer Sign-Off — Round 3

**Date:** 2026-07-19
**Role:** Product Designer
**Scope:** Verify R3 fixes (1–6) against `design.md`. Pixel-level validation of all Round 2 findings.

## Round 2 Finding Status

| # | Severity | Finding | Verdict |
|---|---|---|---|
| R1 | P0 | Breakpoint mismatch, grid collapses at 820px not 768px | **Resolved with 1px error** — app shell now uses `767px` mobile / `1199px` tablet upper bound, matching spec. Component CSS in `packages/ui-components/src/index.ts:333` uses `max-width: 768px` (should be `767px`). A 768px-wide viewport incorrectly shows single-column layout instead of split-pane tablet. Impacts only exactly 768px. Recommend correcting to `767px`. |
| R2 | P1 | "Try a sample manifest" link missing | **Resolved** — `.sample-link` present in empty state (`packages/ui-components/src/index.ts:778`). Styled correctly: 13px (`--text-sm`), `--color-accent-primary`, underlined, `margin-top: 16px`. Dispatches `load-sample` event on click. Matches `design.md` §5.1. |
| R3 | P1 | Error state not rendered in tree pane | **Presence resolved, styling deviates from spec** — `showError()` exists at `packages/ui-components/src/index.ts:1049` and wired at `apps/web/src/main.ts:47`. However, the implemented error card has multiple spec violations vs `design.md` §5.3 (see table below). |
| R4 | P2 | Version note absent from explanation | **Deferred** (acknowledged in R3 scope). |
| R5 | P2 | Pane padding uses 24px instead of 32px | **Resolved** — `.source-pane` uses `padding: 32px` (line 363), `.explanation-pane` uses `padding: 32px` (line 368). Matches `--space-6` per `design.md` §3.2. |
| R6 | P3 | "+N more" uses italic | **Resolved** — no `font-style: italic` found in any CSS/source file. Tree row styling at `packages/ui-components/src/index.ts:557` is plain. Matches `design.md` §6. |
| R7 | P3 | Help button radius 6px not 4px | **Resolved** — `#help-button` at `apps/web/index.html:142` uses `border-radius: 4px`, matching `--radius-sm` per `design.md` §4.1. |
| R8 | P4 | `prefers-reduced-motion` coverage incomplete | **Partially resolved** — `apps/web/index.html:228` has a global `*` rule covering all elements outside shadow DOM. Inside shadow DOM, `packages/ui-components/src/index.ts:977` only targets `.tree-row`, not explanation panel content transitions or mobile inline card animations. Shadow DOM gap persists. |
| R9 | P4 | Example block not syntax-highlighted | **Deferred** (acknowledged in R3 scope). |
| F10 | P3 | Empty state glyph has border/card styling | **Acknowledged, not resolved** — `.empty-glyph` still has `border: 1px solid var(--color-border-hairline)` and `border-radius: var(--mi-radius-lg)`. Spec calls for "simple line-drawn bracket glyph" not a card (`design.md` §5.1). |

### Error Card Spec Deviations (R3)

The error card at `packages/ui-components/src/index.ts:803` was added but differs from `design.md` §5.3 in several dimensions:

| Property | Spec (§5.3) | Implemented | Match |
|---|---|---|---|
| Left border width | 4px | 3px | ✗ |
| Border radius | `--radius-lg` (10px) | 6px (`--radius-md`) | ✗ |
| Padding | `--space-6` (32px) | 24px | ✗ |
| Headline color | `--color-text-primary` (`#EDEDEF`) | `--color-accent-error` (`#F87171`) | ✗ |
| Headline size | `--text-lg` (20px) | 16px (`--text-md`) | ✗ |
| Headline weight | `--weight-semibold` (600) | 600 | ✓ |
| Headline text | "This isn't valid JSON" | "This isn't valid JSON" | ✓ |
| Body color | `--color-text-secondary` | `--color-text-secondary` | ✓ |
| Body size | `--text-base` (14px) | 13px (`--text-sm`) | ✗ |
| "Try again" action | Text button, returns to empty state | Present, dispatches custom event | ✓ (behavior not verified end-to-end) |

**Note:** The headline color change to `--color-accent-error` is arguably defensible (error state should signal urgency) but deviates from the written spec. The other sizing/padding values are unambiguous spec violations.

## Remaining Spec Violations (Blocking)

- **Error card styling (P1)**: 7 spec deviations in the new error card (table above). Headline color, headline size, border width, border radius, padding, and body font size all differ from `design.md` §5.3. Recommend bringing error card into spec alignment before release.

## Remaining Spec Violations (Non-Blocking / Polish)

- **Component breakpoint off by 1px (P3)**: `max-width: 768px` should be `max-width: 767px`. Affects only viewports exactly 768px wide.
- **`prefers-reduced-motion` shadow DOM gap (P4)**: Shadow DOM transitions (explanation panel cross-fade, slide, mobile card) not covered by shadow-scoped reduced-motion rule.
- **Empty state glyph card styling (P3)**: F10 acknowledged, not blocking.
- **Version note badge (P2)**: Deferred.
- **Example syntax highlighting (P4)**: Deferred.

## Final Sign-Off

**Conditionally approved** — all Round 2 P0/P1 issues are substantively addressed. The error card (P1) has accumulated multiple styling deviations during implementation and should be corrected before release. The 1px breakpoint error (P3) and reduced-motion shadow DOM gap (P4) are acceptable for a v1 release.

Round 2 summary (for comparison):

| Severity | R2 Count | R3 Status |
|---|---|---|
| P0 | 1 | Resolved (1px margin) |
| P1 | 2 | 1 resolved, 1 present but needs styling correction |
| P2 | 3 | 1 resolved, 2 deferred |
| P3 | 2 | Both resolved |
| P4 | 1 | Partially resolved with gap |
