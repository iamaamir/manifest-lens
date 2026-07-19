# Task Brief — Phase 5 UI Reset Slice 2: Source Code Treatment

Date: 2026-07-19
Branch: `ai-team-workflow-experiment`

## Role

Internal Frontend Engineer implementation specialist.

Work from the Product Designer, Manifest UX/domain, and E2E/UX QA review findings recorded in `docs/journey/memory.md`. This slice should make the left pane feel like a precise manifest/code map without breaking source preservation or existing interactions.

## Context to Read First

1. `docs/journey/memory.md`
2. `AGENTS.md`
3. `design.md`
4. `docs/reviews/phase5-ui-reset-plan.md`
5. `docs/PRD.md`
6. `docs/journey/phase5.md`
7. `docs/architecture/coding-style.md`
8. Current files in write scope

## Goal

Make the preserved source pane look and behave like code:

- line-number gutter;
- syntax coloring for common JSON token categories;
- quieter structural punctuation;
- field/row-level hover/focus/pin treatment where feasible;
- non-color pinned/focused cue;
- no noisy boxes around punctuation/whitespace;
- source text remains exactly `snapshot.document.text`.

This slice should materially improve the “manifest map” feel, but it should not implement full collapsible tree/folding.

## Write Scope

You may edit only:

- `packages/ui-components/src/index.ts`
- `packages/ui-components/src/index.test.ts`
- `packages/application/src/index.ts` only if a DOM-free helper is needed
- `packages/application/src/index.test.ts` only if adding such a helper

Do not edit `apps/web`, `host-web`, parser/domain/knowledge/core, package metadata, or docs unless a blocker is impossible to solve otherwise.

## In Scope

### Line numbers

- Render a line-number gutter aligned with preserved source lines.
- Line numbers are decorative and `aria-hidden="true"` or otherwise not required for screen-reader understanding.
- Gutter should use `--color-text-tertiary` and not carry required meaning alone.

### Syntax color

Add lightweight syntax classes for source segments where feasible:

- keys: `--color-json-key`;
- strings: `--color-json-string`;
- numbers: `--color-json-number`;
- booleans: `--color-json-boolean`;
- null: `--color-json-null`;
- brackets/punctuation: `--color-json-bracket`.

Constraints:

- Do not reserialize JSON.
- Do not build UI from `JSON.parse` pretty output.
- Do not inject source via `innerHTML`.
- If full token classification is too risky, implement the safest useful subset and explain what remains.

### Field states

- Preserve existing semantic node segmentation and representative-ID behavior.
- Keep non-representative structural fragments inert.
- Avoid fragment-level “confetti” highlighting.
- Prefer active/focused/pinned styling that reads as a line/field state, not a dotted box around punctuation.
- Add a non-color cue for pinned/focused state if feasible, such as a gutter dot or outline marker. It must not rely on color alone.

### Accessibility

- Preserve keyboard navigation and `aria-activedescendant` validity.
- No positive `tabindex`.
- Line numbers should not add hundreds of tab stops.
- Respect reduced motion.
- Do not re-add `aria-live` to hover-driven explanation panel.

## Out of Scope

Do not add:

- collapsible tree/folding;
- depth-based collapse;
- large-array truncation;
- row virtualization;
- inline mobile explanation cards;
- related-field scroll/pin links;
- diagnostics/fixes/health/scores/reports/audits/security warnings/AI/remote behavior;
- new dependencies;
- external docs fetching or runtime network calls.

## Known Traps

- Existing source segmentation can split one semantic node across multiple DOM spans. Do not regress unique IDs or representative IDs.
- Punctuation/whitespace boxes were a visible bug before. Do not make structural fragments look independently interactive.
- Line number rendering must not alter `pre.source-pre.textContent` if tests assert exact preserved source text. If you wrap source in a new layout, update tests to assert exact preserved source through a source-only element.
- Do not use raw `innerHTML`, `outerHTML`, or `insertAdjacentHTML` for manifest source.
- Do not make `apps/web` responsible for rendering source.

## Acceptance Criteria

- Source pane visually reads as a dark code pane, not generic decorated text.
- Line numbers are visible and aligned enough for normal manifest sizes.
- Syntax color improves scanability without compromising exact source preservation.
- Hover/pin/focus remain calm and do not highlight whitespace/punctuation as separate controls.
- Keyboard, hover, click/tap pinning, pin-hover-restore, unknown fallback, invalid-after-valid, and privacy tests still pass.
- No out-of-scope product language or behavior is introduced.

## Validation Required

Run:

```sh
npm run typecheck
npm run test
npm run build
npm run build --workspace=@mvviewer/web
git diff --check
```

Static checks:

```sh
grep -R "innerHTML\|outerHTML\|insertAdjacentHTML" packages/ui-components/src packages/application/src || true
grep -R "diagnostic\|fix\|health\|score\|report\|audit\|AI-generated\|remote" packages/ui-components/src packages/application/src || true
```

## Required Report

Return:

1. Summary of source-pane improvements.
2. Files changed.
3. How exact source preservation was maintained.
4. How line numbers/syntax classes are generated.
5. Validation commands and exact results.
6. Risks/follow-ups.
7. Proposed `docs/journey/memory.md` update, if any.
