# Phase 5 Structural Observatory Reset — Accepted Review

Date: 2026-07-19  
Role: Product Designer  
Scope: Screenshot-backed review of corrected structural reset implementation

## Verdict

Accepted structurally for this iteration.

This is not full `design.md` completion. It accepts the structural reset slice: the app now reads as a viewport-bound Observatory instrument rather than a document-height form page.

## Artifacts Reviewed

Promoted screenshots in:

```text
docs/reviews/ui-screenshots/latest/
```

Artifacts:

- `desktop-empty-viewport.png` at `1280x800`
- `desktop-loaded-top-viewport.png` at `1280x800`
- `desktop-deep-source-scroll-viewport.png` at `1280x800`
- `desktop-active-field-hierarchy.png` at `1280x800`
- `desktop-upload-state-no-native-input.png` at `1280x800`
- `mobile-empty-viewport-390x844.png` at `390x844`
- `mobile-loaded-selected-inline-card-390x844.png` at `390x844`

## Accepted Improvements

1. The visible paste/analyze form dock is gone.
   - No visible `PASTE MANIFEST JSON`.
   - No visible textarea.
   - No visible `Analyze locally`.

2. The app is viewport-bound.
   - Desktop screenshots are `1280x800`, not 10,000px document captures.
   - Source is contained inside the instrument pane.
   - Explanation panel remains visible during deep source scroll.

3. Desktop split-pane structure matches the Observatory direction.
   - Compact header.
   - Distinct source and explanation panes.
   - Stable right-side interpretive surface.

4. Header chrome is calmer.
   - Left: cyan dot + `Manifest Inspector`.
   - Right: `Upload`, with `Clear` only in loaded states.
   - No center marketing copy.

5. Empty state is singular.
   - Empty guidance lives inside source pane.
   - Right pane keeps quiet placeholder on desktop.
   - Mobile empty state avoids a second side panel.

6. Explanation hierarchy is stronger.
   - Eyebrow → field chip → definition/prose → related/docs.
   - The panel reads as prose rather than code/status metadata.

7. Native upload input artifact is resolved.
   - Styled `Upload` is the visible affordance.
   - Native file input chrome is not visible.

8. Mobile inline explanation is now present.
   - `mobile-loaded-selected-inline-card-390x844.png` shows a single inline explanation card in the source flow.
   - No side-by-side panel appears at mobile width.

## Remaining Non-Blocking Design Work

These are next craft priorities, not blockers for the accepted structural reset.

1. The source still behaves closer to decorated preserved text than a true JSON tree.
   - Needs guide lines, row-level rhythm, disclosure controls, and collapse behavior.

2. Default collapse behavior is not visibly implemented.
   - `design.md` asks for depth-2 default expansion and deeper collapse.
   - Large arrays should use `+N more`.

3. Tree guide structure is weak.
   - Add subtle 1px nested guide-line rhythm.

4. Active/focus/pin treatment still needs refinement.
   - Strong gutter indicators should not compete across many rows.

5. Mobile inline behavior should remain under E2E watch.
   - Ensure only one inline card is open at a time and selecting another field replaces the previous one.

## Recommended Next Slice

```text
Phase 5 Observatory Tree Craft Slice
```

Goal: move source pane from contained syntax-highlighted source toward the `design.md` JSON tree model without changing product scope.

### Instructions

- Add visible tree structure and subtle vertical guide lines.
- Add object/array disclosure controls where feasible.
- Implement default containment for large/deep manifests:
  - expanded up to depth 2;
  - deeper objects/arrays collapsed;
  - large arrays bounded with `+N more`.
- Refine active/focus/pin treatment so only the active/pinned row gets strong indicator treatment.
- Preserve the accepted structural shell.
- Preserve upload/paste/drop/clear and local-only behavior.
- Do not add diagnostics, validation scores, fixes, reports, AI, backend, or new hosts.

## E2E Requirements for Next Loop

Preserve existing structural regression checks:

- no visible form dock;
- body/document is not the manifest scroll container;
- source pane scrolls internally;
- explanation remains visible while source scrolls;
- mobile uses inline explanation card;
- upload/paste/drop remain local-only.

Add tree-specific checks:

- object/array rows expose disclosure controls;
- disclosure controls are keyboard-operable;
- collapsing an object/array changes visible content count;
- default load does not render deep nested structures fully expanded;
- large arrays show a bounded initial set plus `+N more`;
- only one pinned/active field exists at a time;
- tapping another mobile field replaces the previous inline card.

## Memory Update Candidate

Product Designer accepted the corrected structural reset iteration: visible paste/analyze form dock is gone, desktop and mobile screenshots are viewport-bound, source/explanation surfaces stay contained, header is simplified, explanation hierarchy is materially improved, native file input chrome is not visible, and mobile now shows a single inline explanation card rather than a side panel. Remaining work is non-blocking design parity: JSON tree craft with guide lines, disclosure controls, default depth collapse, large-array truncation, and quieter active/focus/pin treatment.
