# Task Brief — Phase 5 Keyboard-Accessible Semantic Tree Controls

Date: 2026-07-19
Branch: `ai-team-workflow-experiment`

## Role

Frontend Engineer implementation agent, coordinated by Staff Engineer.

## Goal

Make source-backed semantic tree disclosure controls and `+N more` truncation controls keyboard-accessible, screen-reader-understandable, and regression-tested while preserving the existing explainer behavior.

This is the next recommended slice from Staff Engineer after PM full-app review. It resolves the concrete P1 professional/enterprise-grade accessibility gap without expanding product scope.

## Context to Read First

1. `docs/journey/memory.md`
2. `AGENTS.md`
3. `docs/agents/external-quickstart.md`
4. `docs/agents/templates/external-self-review.md`
5. `docs/journey/phase5.md`
6. `docs/architecture/coding-style.md`
7. `docs/PRD.md`
8. `design.md`
9. Current files in write scope

## Product Language

The left pane is a **source-backed semantic tree**:

- source text is preserved in snapshots;
- visible UI may group, collapse, and truncate semantic rows;
- displayed values must remain backed by original source ranges;
- do not reserialize manifest values with `JSON.stringify` for display.

## In Scope

- Make tree disclosure/expand-collapse affordances keyboard-operable.
- Make `+N more` truncation controls keyboard-operable.
- Provide accessible names for disclosure/truncation controls.
- Expose expanded/collapsed state via `aria-expanded` or a coherent equivalent pattern.
- Add visible `:focus-visible` treatment for controls.
- Ensure disclosure control activation does not pin/select the semantic node.
- Ensure `+N more` activation expands hidden children and does not pin/select a semantic node.
- Ensure keyboard semantic-node navigation skips hidden collapsed/truncated rows.
- Ensure newly revealed children can be reached by keyboard after expansion.
- Preserve hover preview, click/tap pinning, Enter/Space pinning, Escape clear, source/explanation sync, and mobile inline explanation behavior.
- Preserve safe text-node rendering; do not inject manifest source via raw HTML.

## Out of Scope

- Partial-invalid/recoverable-source behavior.
- PRD/HLD/product copy edits beyond this task report.
- Local-only trust copy changes.
- Diagnostics, fixes, health scores, compatibility, report export, AI explanations, remote analysis.
- Full code-editor behavior, virtualization, persisted tree state, search/filter, command palette.
- Broad visual redesign.

## Files / Write Scope

Preferred write scope:

- `packages/ui-components/src/index.ts`
- `packages/ui-components/src/index.test.ts`
- `tests/e2e/tree-craft.test.ts`

Conditional write scope if visible keyboard order cannot be handled cleanly in `ui-components`:

- `packages/application/src/index.ts`
- `packages/application/src/index.test.ts`

Do not edit unrelated packages.

## Staff Engineer Boundary Guidance

- Tree expansion/truncation state is presentation state and should generally stay in `ui-components`.
- Semantic selection/pin/focus state belongs to `application`.
- If visible keyboard order differs from snapshot semantic order, add a small DOM-free helper or route navigation through a visible ID list; do not let hidden rows become the active descendant.
- Do not move DOM or Web Component types into `application`.
- Do not introduce fake ARIA. Either use native buttons cleanly, or implement a coherent tree/listbox pattern with matching keyboard behavior.

## Acceptance Criteria

- Tree disclosure affordances are keyboard-operable.
- `+N more` controls are keyboard-operable.
- Each disclosure control has an accessible name such as `Expand permissions` / `Collapse permissions`.
- Each disclosure control exposes current expanded/collapsed state.
- `+N more` has an accessible name that includes hidden count and target group.
- Visible focus is present for disclosure and `+N more` controls.
- Activating disclosure with pointer, Enter, or Space toggles expansion but does not pin/select the row.
- Activating `+N more` with pointer, Enter, or Space reveals truncated children but does not pin/select a row.
- Existing semantic-node keyboard navigation continues to work.
- After a node is collapsed, keyboard navigation does not move focus to hidden descendants.
- Before `+N more` is expanded, keyboard navigation does not move focus to hidden truncated children.
- After `+N more` expands a group, newly visible children can be reached by keyboard navigation.
- Existing source/explanation synchronization remains intact.
- Existing E2E tests continue passing.
- No out-of-scope product language or behavior is introduced.

## Known Traps

- Avoid nested interactive controls inside `role="option"` / `role="listbox"` unless the role model is deliberately corrected.
- Do not add positive `tabindex`.
- Do not make every semantic row a separate tab stop unless deliberately replacing the current model with a correct tree pattern.
- Do not duplicate application reducer semantics in ad-hoc UI state if a small DOM-free helper is cleaner.
- Do not let disclosure clicks bubble into row selection.
- Do not remove existing pointer/touch behavior while fixing keyboard behavior.
- Do not broaden this into partial-invalid recovery or source-preservation copy changes.

## Tests Required

Component/unit tests should cover:

- disclosure controls render as keyboard-accessible controls or equivalent correct tree items;
- controls have accessible names;
- expanded/collapsed state updates;
- Enter/Space toggles disclosure;
- disclosure activation does not pin/select;
- `+N more` is keyboard-accessible and expands hidden rows;
- `+N more` activation does not pin/select;
- collapsed descendants are not keyboard-focused;
- truncated descendants are not keyboard-focused until expanded;
- no positive `tabindex`;
- source text still uses safe text-node rendering.

E2E tests should cover:

- keyboard can expand/collapse a nested source-backed semantic tree section;
- keyboard can activate `+N more`;
- after expansion, a newly revealed item can be selected and its explanation appears.

## Validation Required

Run:

```sh
npm run typecheck
npm run test
npm run build
npm run build --workspace=@manifest-lens/web
npm run e2e
git diff --check
```

## Review Gates

Before acceptance, coordinator should run:

- Staff Engineer review: package boundary and ARIA/state architecture.
- Frontend Expert review: accessibility and interaction semantics.
- E2E/UX QA review: keyboard/browser behavior.
- Code Reviewer: maintainability and regression risk.

## Report Required

Return:

1. Summary.
2. Files changed.
3. Accessibility behavior implemented.
4. Validation results.
5. Self-review checklist result.
6. Risks/follow-ups.
7. Proposed `docs/journey/memory.md` update.
