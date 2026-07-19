# Task Brief — Phase 5 Fix Semantic Tree Gutter Alignment

Date: 2026-07-19
Branch: `ai-team-workflow-experiment`

## Role

Frontend Engineer implementation specialist.

## User-Reported Issue

User provided a screenshot showing the source-backed semantic tree with cyan gutter dots floating on empty/raw-source line numbers below the selected row. The selected semantic row is visually around row 45, but the gutter marks raw source lines around 50–52, so the active/pinned markers are detached from the visible row.

The screenshot also suggests expanded container rows may show inline child content and then render child rows again, creating duplicated-looking content.

## Goal

Diagnose the root cause and fix the UI so the source-backed semantic tree looks coherent and professional.

Do not assume the coordinator’s hypothesis is complete. Reproduce/inspect the actual DOM/CSS behavior, identify the real cause, then fix it with regression coverage.

## Required Context

Read first:

1. `docs/journey/memory.md`
2. `AGENTS.md`
3. `docs/agents/external-quickstart.md`
4. `docs/agents/templates/external-self-review.md`
5. `docs/journey/phase5.md`
6. `docs/PRD.md`
7. `design.md`
8. `docs/architecture/coding-style.md`
9. Current files in write scope

## Product Context

The left pane is now a **source-backed semantic tree**, not an exact raw-source rendering.

Preserve these decisions:

- source text remains preserved in snapshots;
- visible UI may group/collapse/truncate semantic rows for comprehension;
- displayed values must be backed by original source ranges;
- do not reserialize manifest values with `JSON.stringify` for display;
- do not reintroduce a raw-source wall as the main UI.

## Write Scope

Preferred write scope:

- `packages/ui-components/src/index.ts`
- `packages/ui-components/src/index.test.ts`
- `tests/e2e/tree-craft.test.ts`
- `tests/e2e/helpers.ts` only if needed for assertions
- this task brief for implementation report

Conditional write scope only if a DOM-free helper is clearly needed:

- `packages/application/src/index.ts`
- `packages/application/src/index.test.ts`

Do not edit contracts/parser/domain/knowledge/core/host-web/apps unless a blocker is impossible inside the UI scope.

## Required Diagnosis

Before fixing, determine and report the real root cause.

Likely areas to inspect:

- `source-gutter` generation from `sourceLineCount(snapshot.document.text)`;
- `updateSourceGutter()` and `lineSetForNodeId()` using raw source ranges;
- semantic tree rows from `buildFlatTree(snapshot)`;
- active/focused/pinned row classes;
- visual row height, scroll, and gutter alignment;
- container value preview rendering for expanded rows.

## In Scope

- Make active/focused/pinned gutter indicators align with the visible semantic row, or remove/replace the raw-source-line indicator if it cannot align with the source-backed tree model.
- Ensure the gutter/markers no longer create floating dots on empty rows.
- Keep line/row metadata visually coherent with tree rows.
- Fix expanded container preview duplication if confirmed as part of the same visual defect.
- Preserve existing tree craft behavior: guide lines, disclosure controls, depth collapse, large-array truncation, drag feedback, hover/click/tap/pin/keyboard, source/explanation sync, mobile inline card.
- Add regression tests that would fail on the screenshot issue.

## Out of Scope

- Raw-source mode/toggle.
- Full editor behavior.
- Partial-invalid recovery.
- Keyboard-accessible disclosure task, unless a tiny adjustment is unavoidable for this fix.
- Diagnostics/fixes/health scores/reports/security audit/compatibility/AI/remote behavior.
- Broad visual redesign.

## Acceptance Criteria

- Active/pinned/focused indicators appear beside the visible semantic row, not on detached raw-source lines.
- No floating cyan dots appear on empty gutter lines when a visible row is selected.
- The source-backed semantic tree remains readable and aligned while scrolled deep into the manifest.
- Expanded container rows do not duplicate child content in a confusing way, if diagnosis confirms this issue.
- Existing E2E tests pass.
- New/updated tests cover the gutter/row alignment regression.
- No source text is injected with raw `innerHTML`, `outerHTML`, or `insertAdjacentHTML`.
- No product scope creep.

## Suggested Test Ideas

Component/unit:

- after selecting a deep node, only the corresponding visible tree row has active/pinned marker state;
- gutter marker count/positions match visible row model, not raw source line ranges;
- selecting `declarative_net_request` does not mark unrelated empty/raw lines;
- expanded container preview does not duplicate full child rendering if fixed.

E2E:

- load comprehensive fixture;
- scroll to `declarative_net_request` or a deep field;
- click it;
- assert no active/pinned gutter markers exist below the visible tree rows or on empty rows;
- capture/update a screenshot if useful.

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

Static checks:

```sh
grep -R "innerHTML\|outerHTML\|insertAdjacentHTML" packages/ui-components/src apps/web/src apps/web/index.html || true
grep -R "diagnostic\|fix\|health\|score\|report\|audit\|AI-generated\|remote" packages/ui-components/src apps/web/src apps/web/index.html || true
```

## Required Report

Return or append:

1. Root cause.
2. Summary of fix.
3. Files changed.
4. Regression tests added/updated.
5. Validation results.
6. Risks/follow-ups.
7. Proposed `docs/journey/memory.md` update.
