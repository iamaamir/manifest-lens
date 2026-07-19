# Phase 5 Screenshot Structure Review

Date: 2026-07-19  
Trigger: user said the current UI structure still feels bad and asked E2E to provide screenshots for Product Designer review.

## E2E Screenshot Inventory

E2E was rerun with:

```sh
npm run e2e
```

Result:

```text
20 passed
```

Screenshots were promoted from ignored `test-results/screenshots/` into:

```text
docs/reviews/ui-screenshots/latest/
```

Promoted artifacts:

| Artifact | Scenario |
|---|---|
| `docs/reviews/ui-screenshots/latest/empty-observatory.png` | Empty Observatory shell |
| `docs/reviews/ui-screenshots/latest/comprehensive-loaded-top.png` | Comprehensive fixture loaded near top |
| `docs/reviews/ui-screenshots/latest/deep-field-scrolled.png` | Deep/custom field selected after source scroll |
| `docs/reviews/ui-screenshots/latest/mobile-viewport-390x844.png` | Mobile/narrow loaded viewport |
| `docs/reviews/ui-screenshots/latest/upload-file-input.png` | Upload path loaded state |
| `docs/reviews/ui-screenshots/latest/dragdrop-text.png` | Drag/drop text path loaded state |

E2E/UX QA inventory finding: the screenshot set is useful but still incomplete for structure review because several loaded screenshots are full-page captures over 10,000px tall. That itself exposes the core layout failure: the app behaves like a document-height page, not a viewport-bound inspection instrument.

## Product Designer Verdict

Fail against `design.md`.

The UI has adopted some Observatory surface tokens, but the structure is still wrong. It reads as a dark-themed form page wrapped around a giant pretty-printed JSON dump, not as a viewport-bound precision inspection instrument.

The primary failure is information architecture, not color polish.

## Visible Structural Failures

### 1. The form dock still dominates

Visible in the empty and loaded screenshots:

- `PASTE MANIFEST JSON`
- visible textarea
- `Analyze locally`
- instructional copy beside controls

This keeps the product in a form workflow:

```text
paste into form → run analysis → read output
```

The desired workflow is:

```text
load/drop/paste manifest → inspect source field → explanation appears
```

### 2. The app is not viewport-bound

Loaded screenshots are around `1280x10934`, and the mobile screenshot is around `390x11418`.

This violates `design.md` desktop/tablet structure:

- sticky compact header;
- split pane below header;
- source pane and explanation panel scroll independently;
- body/page is not the main scroll container for the manifest.

The Observatory must behave like an instrument panel, not a long document.

### 3. The source pane is still a source wall

Line numbers and syntax color help, but the comprehensive fixture renders as a continuous vertical wall. It lacks enough structural rhythm, viewport containment, and tree-like inspection behavior.

Minimum next-step requirement: source pane must scroll internally while explanation remains visible.

Full collapsible tree/depth collapse/large-array truncation remain larger follow-ups unless explicitly pulled into the slice.

### 4. The explanation panel is too weak

The explanation panel does not command the right side as the interpretive surface. It appears secondary to the source mass.

Next slice must implement `design.md` order:

1. semantic eyebrow;
2. exact field chip;
3. one-line definition;
4. prose details;
5. secondary docs/examples/version/related context where available.

### 5. Mobile structure is wrong

The mobile screenshot is also a long document capture. `design.md` requires mobile to be single-column with one inline explanation card beneath the selected/tapped key. If mobile inline cards are too large for the next slice, do not claim mobile compliance yet.

### 6. Empty state has two competing onboarding systems

The empty source pane says `Drop a manifest.json`, but the form dock above it also teaches paste/analyze. The empty state should be singular and inside the source pane.

### 7. Header has extra messaging

The center copy `Local-first manifest explanations` adds marketing/documentation noise. The header should be compact instrument chrome: brand left, controls right.

### 8. Native file input artifact risk

The upload screenshot suggests native file input chrome may be visible or layout-affecting. The visible affordance must be the styled `Upload` button only.

## Exact Next Frontend Engineer Instructions

Recommended next slice:

```text
Phase 5 Structural Observatory Reset
```

### Write scope

Likely:

```text
apps/web/index.html
apps/web/src/main.ts
packages/host-web/src/index.ts
packages/ui-components/src/index.ts
tests/e2e/**
```

Do not touch parser/core/domain/knowledge unless a compile error forces a narrow fix.

### Required work

1. Remove the visible paste/analyze dock from the normal surface.
   - No visible default textarea.
   - No `PASTE MANIFEST JSON` label.
   - No `Analyze locally` button.
   - No input instruction strip above the inspector.

2. Preserve input behavior through instrument-native paths.
   - Page-level paste while empty.
   - Drag/drop while empty.
   - Upload button.
   - Clear after load if currently available.

3. Rebuild shell as viewport-bound grid.
   - Root/app: `height: 100dvh`, `overflow: hidden`.
   - Header: 56px desktop/tablet, 48px mobile.
   - Main: remaining height, `min-height: 0`.
   - Desktop/tablet: two columns.
   - Source pane: internal `overflow: auto`, `min-height: 0`.
   - Explanation pane: internal `overflow: auto`, `min-height: 0`.
   - Body/page must not become 10,000px tall after loading the comprehensive fixture.

4. Match desktop/tablet split from `design.md`.
   - Desktop: source 60%, explanation 40%.
   - Tablet: source 64%, explanation 36%.
   - Hairline divider.
   - No draggable resize.

5. Make empty state singular.
   - Empty guidance lives inside source pane.
   - Right pane keeps quiet placeholder.
   - Remove duplicate local/privacy messaging from the top form area.

6. Simplify header.
   - Left: cyan dot + `Manifest Lens`.
   - Right: `Upload`, plus `Clear` only when content exists if implemented.
   - No center marketing copy.
   - Do not add `Load sample` or `?` unless explicitly scoped.

7. Strengthen explanation hierarchy.
   - Eyebrow → exact field chip → definition → prose → secondary docs.
   - Panel must feel like the authoritative reading surface.

8. Hide native file input artifacts.
   - Native input must not be visible, focus-visible as stray chrome, or layout-affecting.

9. Accessibility must not regress.
   - Keyboard navigation.
   - Visible focus.
   - Enter/Space selection.
   - Escape unpin/clear.
   - Hover preview/click pin.
   - Non-color pin/focus cue.
   - Local-only privacy.

## Explicit Non-Goals

Do not implement in this structural slice:

- diagnostics;
- fixes;
- health score;
- security audit;
- compatibility matrix;
- reports/export;
- AI-generated explanations;
- remote analysis/backend;
- browser extension packaging;
- VS Code extension;
- CLI;
- draggable pane resize;
- decorative gradients/badges/glass;
- broad parser/core/domain/knowledge rewrites.

Also do not spend the next slice on tiny color tweaks while the layout remains document-height driven.

## E2E Requirements After Implementation

Add/update Playwright checks for:

1. No visible form dock:
   - no visible `PASTE MANIFEST JSON`;
   - no visible `textarea#manifest-input`;
   - no visible `Analyze locally` button.

2. Viewport-bound desktop shell:
   - at `1280x800`, app/root height is viewport-bound;
   - document/body is not the primary huge scroll container after loading the comprehensive fixture;
   - source pane has internal scroll;
   - explanation panel remains visible while source pane scrolls.

3. Header structure:
   - wordmark visible;
   - upload visible;
   - center marketing copy absent;
   - clear appears only when content exists, if preserved.

4. Empty state:
   - left pane centered empty stack;
   - right pane quiet placeholder;
   - no duplicate input instruction area outside panes.

5. Loaded state:
   - comprehensive fixture loads;
   - source appears in left pane;
   - explanation appears in right pane;
   - active field panel follows eyebrow → field chip → definition → prose order.

6. Deep source scroll:
   - scroll only source pane to deep field;
   - explanation stays visible;
   - selecting deep field does not jump the page.

7. Upload/paste/drop and privacy still pass.

8. Mobile:
   - no visible form dock;
   - no side-by-side panel at `390x844`;
   - if mobile inline cards are implemented, tap field opens exactly one inline explanation below field.

## Required Screenshot Set After Fix

Use viewport screenshots, not primary full-page screenshots:

- `desktop-empty-viewport.png` at `1280x800`;
- `desktop-loaded-top-viewport.png` at `1280x800`;
- `desktop-deep-source-scroll-viewport.png` at `1280x800`;
- `desktop-active-field-hierarchy.png` at `1280x800`;
- `desktop-upload-state-no-native-input.png` at `1280x800`;
- `mobile-empty-viewport-390x844.png`;
- `mobile-loaded-selected-viewport-390x844.png`.

## Memory Update Candidate

Product Designer screenshot review found the current Phase 5 UI still fails `design.md` structurally: visible paste/analyze form dock remains, loaded source expands the page into a huge source wall instead of a viewport-bound independently scrolling tree pane, explanation panel is too weak relative to source mass, and mobile does not match the required single-column inline explanation model. Next Frontend Engineer slice should prioritize structural reset over color polish: remove the form dock, make the shell `100dvh` with sticky header and independently scrolling source/explanation panes, simplify header chrome, preserve upload/paste/drop/clear behavior, strengthen explanation hierarchy, hide native file input artifacts, and add E2E viewport assertions/screenshots proving the app is no longer document-height driven.
