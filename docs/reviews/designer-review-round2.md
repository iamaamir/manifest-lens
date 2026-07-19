# Product Designer Review — Round 2

**Date:** 2026-07-19
**Role:** Product Designer
**Scope:** Verify fixes 1–7 against `design.md`. Compare pixel-level rendering where code permits.

## Previous Finding Status

| # | Finding | Verdict |
|---|---|---|
| F1 (P0) | Draggable pane divider | **Resolved** — `gap: 1px` with `--color-border-hairline` background replaces the divider; no drag listeners, fixed ratio `1.5fr / 1fr` |
| F2 (P0) | Status message bar | **Resolved** — no status bar element |
| F3 (P0) | Header button styling | **Resolved** — transparent "Load sample" with hover underline, 32×32px "?" with hover elevated bg, 8px brand mark with no glow, 16px action gap |
| F4 (P1) | Mobile inline card positioning | **Resolved** — card is a normal-flow sibling after active row, `display: none/block`, no absolute positioning, `scrollIntoView` after insert |
| F5 (P1) | Sub-pane visual headers | **Resolved** — `aria-label` only on source/explanation panes, no visible heading text |
| F6 (P1) | Local processing trust signal | **Resolved** — "Processing stays local to this browser." present in empty state |
| F7 (previous P0) | Visible form-dock dominance | **Resolved** — no textarea, no analyze button in shell. First surface under header is the inspector. Paste/upload/drop preserved |
| F8 (previous P1) | Explanation hierarchy | **Partially resolved** — order is now eyebrow → title → summary → details → example → related → docs, matching `design.md` §4.3.1–7 mostly. Version note (§4.3.6) is absent |
| F9 (previous P2) | Pane header chrome | **Resolved** |
| F10 (previous P3) | Bordered/card-like empty glyph | **Not resolved** — still has `border: 1px solid var(--color-border-hairline)` and `border-radius: var(--mi-radius-lg)`, making it a card, not the "simple line-drawn bracket glyph" per `design.md` §5.1 |
| F11 (previous P4) | Token-level vs field-level interaction | **Resolved** — tree rows are per-field interactive; tree-craft implementation (guides, disclosure, depth collapse, truncation) is present |

## Remaining Spec Violations

### R1 (P0) — Breakpoint mismatch, grid collapses at 820px not 768px

`apps/web/index.html` CSS collapses `.inspector` to single column at `820px`. `design.md` §3.1 defines `--bp-tablet` as 768–1199px (split pane, 36% panel width) and `--bp-mobile` as 0–767px.

**Impact:** On 768–819px viewports the layout becomes single-column instead of retaining the split-pane tablet structure. The single-column display at these widths also places the explanation pane below the source pane rather than hiding it — creating an awkward intermediate state that matches neither mobile (inline card) nor tablet (side panel).

**Fix:** Match `design.md` breakpoints exactly: `768px` for tablet→mobile transition, verify `36%` panel at tablet range.

### R2 (P1) — "Try a sample manifest" link missing from empty state

`design.md` §5.1 specifies: a secondary text link `--text-sm`, underlined, `--color-accent-primary`: "Try a sample manifest instead." This is absent from the empty state rendering in `packages/ui-components/src/index.ts`. The `load-sample-button` exists in the header but the empty-state inline link per spec is not there.

### R3 (P1) — Error state not rendered in tree pane

When invalid JSON is pasted/dropped, `packages/host-web/src/index.ts` calls `host.clear()` and returns a status string that is not rendered in the UI. The component shows the empty state. `design.md` §5.3 specifies an error card inside the tree pane with coral left border, alert glyph, headline "This isn't valid JSON", parser feedback in plain language, and a "Try again" button. None of this is implemented.

**Impact:** Invalid JSON silently reverts to empty state — the user gets no feedback about what went wrong.

### R4 (P2) — Version note absent from explanation content

`design.md` §4.3(6) specifies a badge row showing "Manifest V2" / "Manifest V3" / "Both" with a coral badge for version-specific or deprecated fields. Not implemented in `buildExplanationContent()`.

### R5 (P2) — Pane padding uses 24px instead of 32px

`packages/ui-components/src/index.ts` lines 363, 368: `.source-pane` and `.explanation-pane` both use `padding: 24px`. `design.md` §3.2 specifies `--space-6` (32px) for both panes.

### R6 (P3) — "+N more" uses italic

`.tree-row-more` CSS at `packages/ui-components/src/index.ts` line 560 sets `font-style: italic`. `design.md` §6 explicitly bans italics: "no italics anywhere in this UI — use color/weight for emphasis, not style."

### R7 (P3) — Help button radius mismatch

`#help-button` in `apps/web/index.html` uses `border-radius: 6px`. `design.md` §4.1 specifies `--radius-sm: 4px` for the "?" icon button.

### R8 (P4) — `prefers-reduced-motion` coverage incomplete

`packages/ui-components/src/index.ts` CSS targets only `.tree-row` transitions in the reduced-motion query. `design.md` §7 requires that cross-fades and slide transitions collapse to instant (0ms). Explanation panel content transitions and mobile inline card animations are not covered.

### R9 (P4) — Example block not syntax-highlighted

`design.md` §4.3(5) specifies "a small syntax-highlighted code sample." The implementation renders example code in a `<pre>` with plain `textContent` — no syntax coloring on the example content.

## Summary

| Severity | Count | Details |
|---|---|---|
| P0 | 1 | Breakpoint mismatch |
| P1 | 2 | Missing "Try a sample" link, missing error state |
| P2 | 3 | Version note, pane padding, example highlighting |
| P3 | 2 | "+N more" italic, help button radius |
| P4 | 1 | `prefers-reduced-motion` coverage |
