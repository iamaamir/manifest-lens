# Task Brief — Phase 5 Structural Observatory Reset

## Completion

Completed by external OpenCode Frontend Engineer and accepted structurally by Product Designer on 2026-07-19.

Delivered:

- Removed visible paste/analyze form dock.
- Rebuilt shell as viewport-bound Observatory surface.
- Kept source/explanation contained in independently visible panes.
- Simplified header chrome and hid `Clear` until content exists.
- Preserved upload, page-level paste, drag/drop, clear, invalid-after-valid, hover/pin/keyboard, and local-only privacy behavior.
- Improved explanation hierarchy to eyebrow → field chip → definition/prose → secondary context.
- Hid native file input chrome.
- Added mobile single-column inline explanation card.
- Updated E2E coverage and promoted viewport screenshots to `docs/reviews/ui-screenshots/latest/`.

Coordinator validation passed:

```sh
npm run typecheck
npm run test                    # 8 files, 151 tests
npm run build
npm run build --workspace=@mvviewer/web
npm run e2e                     # 26 passed
git diff --check
```

Accepted review:

```text
docs/reviews/phase5-structural-reset-accepted-review.md
```

Remaining follow-up: `Phase 5 Observatory Tree Craft Slice` for guide lines, disclosure controls, default depth collapse, large-array truncation, and quieter active/focus/pin treatment.

## Context

The user still dislikes the current UI structure. The latest screenshot-backed Product Designer review is:

```text
docs/reviews/phase5-screenshot-structure-review.md
```

Design source of truth:

```text
design.md
```

Design loop:

```text
docs/agents/ui-design-loop.md
```

The current UI fails structurally because it behaves like a dark form page and long source document, not a viewport-bound inspection instrument.

External agents must read `docs/agents/external-quickstart.md` before this brief.

## Assigned Role

External OpenCode agent acting as Frontend Engineer.

Load and follow:

```text
docs/agents/roles/frontend-engineer.md
```

## Goal

Implement the next design-loop slice:

```text
Phase 5 Structural Observatory Reset
```

Make the UI a viewport-bound Observatory instrument:

- no visible paste/analyze form dock;
- sticky compact header;
- source and explanation panes scroll independently;
- comprehensive manifest no longer makes the page 10,000px tall;
- explanation panel hierarchy follows `design.md`;
- existing local input/interaction/privacy behavior remains intact;
- Playwright screenshots become viewport-sized review artifacts.

## In Scope

### Product/UI

1. Remove the visible paste/analyze dock from the normal surface.
   - No visible `PASTE MANIFEST JSON` label.
   - No visible default textarea in empty or loaded UI.
   - No visible `Analyze locally` button.
   - No input instruction strip above the inspector.

2. Preserve instrument-native input behavior.
   - Page-level paste loads a manifest.
   - Upload button loads a manifest.
   - Drag/drop text/file path remains functional where currently supported.
   - Clear returns to empty state.
   - Invalid-after-valid still clears stale source/explanation/pin.

3. Rebuild shell as viewport-bound layout.
   - App/root uses `100dvh` or equivalent viewport-bound sizing.
   - Header is 56px desktop/tablet, 48px mobile.
   - Main/workspace fills remaining height with `min-height: 0`.
   - Desktop/tablet uses split pane.
   - Source pane has internal scroll.
   - Explanation pane has internal scroll.
   - Body/page is not the primary manifest scroll container.

4. Match `design.md` desktop/tablet split.
   - Desktop: source 60%, explanation 40%.
   - Tablet: source 64%, explanation 36%.
   - Hairline divider.
   - No draggable resize.

5. Make empty state singular.
   - Empty guidance lives inside source pane.
   - Right pane has quiet placeholder.
   - No duplicate top input instructions.

6. Simplify header.
   - Left: cyan dot + `Manifest Inspector`.
   - Right: `Upload`; `Clear` only when content exists if preserved.
   - No center marketing copy.
   - Do not add `Load sample` or `?` unless already trivial and no behavior expansion is needed. Prefer omission.

7. Strengthen explanation hierarchy.
   - Render active explanation in order:
     1. semantic eyebrow;
     2. exact field chip;
     3. one-line definition;
     4. prose details;
     5. secondary docs/examples/version/related context where currently available.
   - Details should read as prose, not primary bullet-card metadata.

8. Hide native file input artifacts.
   - Native file input must not be visible, focus-visible as stray chrome, or layout-affecting.
   - Styled `Upload` button is the visible affordance.

9. Preserve accessibility.
   - Keyboard navigation.
   - Visible focus.
   - Enter/Space selection.
   - Escape unpin/clear where currently supported.
   - Hover preview/click pin semantics.
   - Non-color pin/focus cues.
   - No positive `tabindex`.

### Tests/E2E

Update Playwright and unit/component tests to match the new structure.

Add/update E2E assertions for:

- no visible form dock, textarea, or Analyze button;
- viewport-bound desktop shell at `1280x800`;
- document/body not becoming 10,000px tall after comprehensive fixture load;
- source pane internal scroll;
- explanation panel remains visible while source pane scrolls;
- header wordmark and upload visible;
- center marketing copy absent;
- empty state guidance inside source pane;
- loaded active field panel follows eyebrow → field chip → definition → prose order;
- upload/paste/drop/privacy still pass;
- mobile at `390x844` has no visible form dock and no side-by-side desktop panel.

Update screenshot capture to use viewport screenshots for primary design review:

```text
desktop-empty-viewport.png
desktop-loaded-top-viewport.png
desktop-deep-source-scroll-viewport.png
desktop-active-field-hierarchy.png
desktop-upload-state-no-native-input.png
mobile-empty-viewport-390x844.png
mobile-loaded-selected-viewport-390x844.png
```

Keep old screenshot names only if useful for compatibility, but the new viewport screenshots are required.

## Out of Scope

Do not implement:

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
- broad parser/core/domain/knowledge rewrites;
- full schema validation;
- permission risk scoring.

Do not spend the slice on small color tweaks while layout remains document-height driven.

Full collapsible tree/depth collapse/large-array truncation/mobile inline cards are desirable but not required for this slice unless they can be done cleanly without risking existing behavior. If mobile inline cards are not implemented, do not claim mobile fully matches `design.md`; just ensure no form dock and no side-by-side desktop panel.

## Files / Write Scope

Primary write scope:

```text
apps/web/index.html
apps/web/src/main.ts
packages/host-web/src/index.ts
packages/host-web/src/index.test.ts
packages/ui-components/src/index.ts
packages/ui-components/src/index.test.ts
tests/e2e/**
```

Conditional write scope only if absolutely required:

```text
package.json
package-lock.json
playwright.config.ts
vitest.config.ts
```

Do not edit:

```text
docs/journey/memory.md
docs/reviews/**
docs/agents/**
packages/core/**
packages/parser-json/**
packages/manifest-domain/**
packages/knowledge/**
packages/contracts/**
```

The coordinator will update docs/memory/reviews after implementation.

## Acceptance Criteria

- [ ] No visible form dock, textarea, `PASTE MANIFEST JSON`, or `Analyze locally` in empty or loaded default UI.
- [ ] Upload/paste/drop/clear/invalid-after-valid behavior still works.
- [ ] Desktop loaded comprehensive fixture does not make the document/body the primary 10,000px scroll container.
- [ ] Source pane scrolls internally and explanation pane remains visible while source scrolls.
- [ ] Header is compact, sticky, and has no center marketing copy.
- [ ] Empty source pane contains the singular input guidance.
- [ ] Explanation panel hierarchy follows `design.md` order.
- [ ] Native file input is not visible or layout-affecting.
- [ ] Existing unit tests pass.
- [ ] Playwright E2E passes and produces new viewport screenshots.
- [ ] No product scope creep.

## Known Traps / Common Failure Modes

- Do not merely `display: none` the textarea while breaking paste/upload/drop paths.
- Do not replace visible textarea with another visible form-shaped input strip.
- Do not make the whole page scroll after loading the comprehensive fixture.
- Do not weaken E2E assertions to pass.
- Do not use full-page screenshots as primary structure evidence.
- Do not add `data-testid` everywhere. Prefer user-meaningful selectors/roles/text.
- Do not reserialize manifest JSON for display.
- Do not use raw `innerHTML` for manifest source.
- Do not add positive `tabindex`.
- Do not add diagnostics/fix/report language.
- Do not introduce a framework dependency.

## Validation

Run and report exact results:

```sh
npm run typecheck
npm run test
npm run build
npm run build --workspace=@mvviewer/web
npm run e2e
git diff --check
```

If any validation fails, fix only failures caused by your changes and rerun the relevant command.

## Reporting Requirements

Return:

- summary;
- files changed;
- behavior preserved;
- structural changes made;
- E2E scenarios/screenshots added or changed;
- validation results;
- self-review checklist result from `docs/agents/templates/external-self-review.md`;
- risks/follow-ups;
- proposed memory update.
