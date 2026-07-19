# Phase 5 UI Reset Plan — Design-Led Observatory

Date: 2026-07-19
Branch: `ai-team-workflow-experiment`

## Verdict

The current Phase 5 UI behavior is useful, but the visual/UX direction is rejected and should not be polished further in its current form.

`design.md` is now the UI design source of truth.

Target concept:

> The Observatory: a near-black precision instrument for inspecting a manifest.

The next frontend work should be design-led by internal specialists, not delegated to external low-effort implementation agents.

## Why the Current UI Fails

1. **Wrong product register**
   - The current UI reads as a generic light SaaS form/card page.
   - The product should feel like a precision inspection instrument.

2. **The form dominates the product**
   - The current first interaction is a large textarea/input panel above the inspector.
   - `design.md` wants input/drop/upload to live naturally inside the inspector experience.

3. **The source view does not yet feel like a manifest map**
   - Current source rendering preserves text, but still behaves visually like decorated raw text.
   - It lacks the code-pane craft requested in `design.md`: near-black pane, line numbers, syntax coloring, precise row/field states.

4. **Explanation panel hierarchy is not yet designed enough**
   - Current panel shows explanation content, but not in the `design.md` hierarchy:
     - semantic eyebrow;
     - field-name chip;
     - one-line definition;
     - concise details;
     - docs/related context as secondary.

5. **Highlighting remains structurally fragile**
   - Current source segmentation is behaviorally tested, but visual highlighting can still feel like fragmented text interaction rather than row/field interaction.
   - Punctuation/whitespace must never appear as scattered boxes.

## Target Experience

A developer opens a dark, calm instrument next to their editor.

1. A compact sticky header says `Manifest Inspector` and exposes upload/sample/help controls where in scope.
2. The main surface is a two-pane inspector:
   - left: source/tree pane;
   - right: explanation pane.
3. Empty state appears inside the source pane:
   - bracket glyph;
   - `Drop a manifest.json`;
   - paste/upload instructions;
   - quiet local processing note.
4. On load, the preserved manifest source appears with code-like treatment:
   - monospace;
   - line numbers;
   - syntax color;
   - indentation clarity;
   - quiet field hover/focus/pin states.
5. Hovering or focusing a meaningful field/value updates the explanation panel.
6. Clicking/tapping pins an explanation.
7. Hovering elsewhere previews temporarily, then restores the pinned explanation on leave.
8. Keyboard users can reach the source region, move through explainable nodes, pin, and clear.

## MVP-Critical Design Decisions from `design.md`

Implement these in the immediate reset:

- Near-black Observatory theme.
- Sticky compact header, not a large hero.
- Source/explanation panes are the primary product surface.
- Input/drop/upload integrated into the inspector experience.
- Source pane must look like code:
  - monospace;
  - line numbers;
  - syntax color;
  - quiet row/field states.
- Explanation pane must look like prose:
  - sans typography;
  - semantic eyebrow/path;
  - field-name code chip;
  - one-line definition first;
  - short details below;
  - docs links secondary.
- Keep current Phase 5 behavior:
  - local analysis;
  - preserved source;
  - hover preview;
  - click/tap pin;
  - keyboard navigation;
  - unknown fallback;
  - partial-invalid graceful state;
  - no-network privacy behavior.
- Keep explainer-first scope. Do not add diagnostics, fixes, scores, reports, audits, compatibility matrices, AI, workers, or non-web hosts.

## Deferred from Immediate Reset

Do not implement in the first reset unless explicitly approved:

- Full collapsible JSON tree.
- Depth-based default collapse.
- Large-array `+N more` rows.
- Mobile inline explanation cards.
- Load sample, unless trivial and separately accepted.
- Help/about popover.
- Mixed MV2/MV3 warning banners.
- Deprecated-field warning treatment.
- Related-field scroll/pin links.
- Large-file spinner.
- Playwright/browser E2E tooling, until design target stabilizes.

## Proposed Implementation Slices

### Slice 1 — App Shell Reset

Goal: remove the generic light hero/form-first layout.

Write scope:

- `apps/web/index.html`
- `apps/web/src/main.ts` only if wiring changes
- `packages/host-web/src/index.ts` only if controls move

Deliverables:

- `color-scheme: dark`.
- Near-black app canvas.
- Sticky compact header.
- Inspector is the first-class surface.
- Existing behavior still loads and clears manifests.

Acceptance:

- UI no longer reads as a light SaaS form page.
- Source/explanation workspace dominates the screen.
- Existing tests pass.

### Slice 2 — Observatory Component Skin

Goal: apply `design.md` tokens and pane structure to `<manifest-inspector>`.

Write scope:

- `packages/ui-components/src/index.ts`

Deliverables:

- `design.md` color tokens in component scope.
- Source pane uses `--color-bg-tree-pane`.
- Explanation pane uses `--color-bg-panel`.
- Header/pane separators match spec.
- Empty state lives inside source pane.
- Explanation placeholder lives inside panel.

Acceptance:

- Near-black precision instrument feel.
- No hero/card sprawl.
- No scope creep.

### Slice 3 — Source Code Treatment

Goal: make preserved source feel like a manifest/code map.

Write scope:

- `packages/ui-components/src/index.ts`
- optional `packages/application/src/**` only for DOM-free source display helpers
- tests

Deliverables:

- Line-number gutter.
- Syntax color for keys, strings, numbers, booleans, null, brackets/punctuation.
- Muted structural punctuation.
- Field-level hover/focus/pin treatments.
- Pinned indicator in gutter or equivalent non-color cue.

Acceptance:

- Original source text remains preserved.
- No raw source `innerHTML`.
- Punctuation/whitespace do not look like independent controls.
- Hover/pin/keyboard tests still pass.

### Slice 4 — Explanation Panel Hierarchy

Goal: make the panel the product, not a generic details card.

Write scope:

- `packages/ui-components/src/index.ts`
- possibly tests

Deliverables:

- Eyebrow/semantic kind.
- Field-name code chip.
- Summary as one-line definition.
- Details as concise prose.
- Breadcrumb/path visible but quiet.
- Docs links secondary.
- Unknown fallback state explicit and neutral.

Acceptance:

- A developer understands the active field in under two seconds.
- Panel typography clearly separates code register and prose register.

### Slice 5 — Integrated Input and State UX

Goal: make paste/upload/drop/invalid states part of the instrument.

Write scope:

- `packages/ui-components/src/index.ts`
- `packages/host-web/src/index.ts`
- `apps/web/index.html` if controls remain outside the component
- tests

Deliverables:

- Empty source-pane drop state.
- Upload control integrated with header or inspector shell.
- Paste anywhere when empty, if feasible.
- Invalid JSON clears stale content and shows calm inline state.
- Status language adjusted away from diagnostic tone.

Acceptance:

- Input UX does not feel like a separate form.
- Invalid input does not show stale explanation.
- No diagnostics/fix/report language.

### Slice 6 — Responsive and Accessibility Hardening

Goal: make the design usable across desktop/tablet/mobile.

Write scope:

- `packages/ui-components/src/index.ts`
- app shell as needed
- tests

Deliverables:

- Desktop/tablet split view.
- Mobile single-column stack for MVP.
- Reduced-motion support.
- Keyboard-only path preserved.
- Focus and active states distinct.

Acceptance:

- No horizontal overflow at 320px.
- Source and explanation remain reachable.
- No positive `tabindex`.
- `aria-activedescendant`, if used, references existing IDs.

## E2E / UX Acceptance Criteria

Use these fixtures for manual and eventual browser E2E testing:

- `fixtures/manifests/minimal-mv3.json`
- `fixtures/manifests/permissions.json`
- `fixtures/manifests/host-permissions.json`
- `fixtures/manifests/unknown-custom-fields.json`
- `fixtures/manifests/partial-invalid.json`
- `fixtures/manifests/full-common-mv3.json`
- `fixtures/manifests/nested-content-scripts.json`

Acceptance journeys:

1. Empty Observatory first load.
2. Paste valid minimal MV3 manifest.
3. Pin A, hover B, leave, restore A.
4. Keyboard-only field navigation and pinning.
5. File upload local privacy.
6. Drag/drop local privacy.
7. Unknown/custom fallback.
8. Partial-invalid does not show stale explanation.
9. Mobile/touch selection.
10. Permissions and host permissions explain capability/scope without risk scoring.

## Risks to Control

- Do not reserialize JSON for display.
- Do not use raw source `innerHTML`.
- Do not reintroduce noisy punctuation/whitespace highlight boxes.
- Do not add diagnostics/security/scoring behavior under the guise of better UX.
- Do not let `apps/web` grow domain or rendering logic.
- Do not add Playwright or screenshot infrastructure until the visual target stabilizes and user approves.
- Be careful with ARIA: current segmented source can create multiple fragments for one semantic node.
- Ensure dark theme contrast and focus are genuinely readable.

## Validation Required After Each Implementation Slice

Run at minimum:

```sh
npm run typecheck
npm run test
npm run build
npm run build --workspace=@mvviewer/web
git diff --check
```

Static checks:

```sh
grep -R "innerHTML\|outerHTML\|insertAdjacentHTML" packages/ui-components apps/web packages/host-web || true
grep -R "fetch\|XMLHttpRequest\|sendBeacon\|WebSocket" packages/ui-components apps/web packages/host-web || true
grep -R "diagnostic\|fix\|health\|score\|report\|audit\|AI-generated\|remote" packages/ui-components/src packages/host-web/src apps/web/src apps/web/index.html || true
```

## Team Workflow Decision

For this UI reset:

- Product Designer drives target.
- Manifest UX/domain specialist protects manifest reading workflows.
- E2E/UX QA defines acceptance and regression checks.
- Frontend Engineer implements slices.
- Coordinator synthesizes, validates, and updates memory.
- External agents are not used for frontend/UI implementation unless the user explicitly re-allows them.
