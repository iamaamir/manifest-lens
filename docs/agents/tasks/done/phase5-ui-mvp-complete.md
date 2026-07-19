# Task Brief — Phase 5 UI MVP Completion

## Context

Project: `mvviewer`, a local-first Web Extension Manifest Explainer.

North star:

> Hover your manifest. Understand every field.

Phase 5 Slice 1 is complete: package wiring and a static `<manifest-inspector>` shell exist.

This task completes the remaining Phase 5 MVP. Do not broaden beyond the explainer UI MVP.

External agents must read first:

1. `docs/agents/external-quickstart.md`
2. `docs/journey/memory.md`
3. `AGENTS.md`
4. `docs/architecture/coding-style.md`
5. `docs/journey/phase5.md`
6. this task brief

Before returning, complete `docs/agents/templates/external-self-review.md` in your report only. Do not edit the template file.

## Assigned Role

External implementation agent, preferably OpenCode if the user asks for agent-led implementation.

Coordinator must not directly implement product code/tests.

## Goal

Make Phase 5 a first usable web UI MVP:

```text
paste/drop manifest
→ direct local analysis
→ preserved source split/stacked view
→ explanation panel
→ hover/click/tap/keyboard interaction
```

## Product Done Definition

By the end, a user can:

1. paste a manifest;
2. drag/drop a `manifest.json` file;
3. optionally use a file picker if low-cost;
4. see original source text and formatting preserved;
5. see an explanation panel for the active/root item;
6. hover a meaningful source region to preview explanation;
7. click/tap a region to pin explanation;
8. hover another region temporarily and restore pinned explanation on hover leave;
9. use keyboard navigation to move/select explainable nodes;
10. select unknown/custom fields and see fallback explanation;
11. see a calm inline message for invalid/partial input without crash;
12. use the MVP without manifest content being sent to a backend.

## In Scope

### `packages/ui-components`

- Extend `<manifest-inspector>` from static shell to snapshot-driven UI.
- Add minimal public API, e.g. `snapshot` property and/or `loadSnapshot(snapshot)` plus `clear()`.
- Render preserved `snapshot.document.text` safely.
- Render explanation panel for active node.
- Use `@mvviewer/application` reducer/selectors for interaction state.
- Map source interaction to semantic nodes.
- Implement hover preview, click/tap pin, hover leave restore.
- Implement keyboard navigation: next/previous, Enter/Space select, Escape clear if simple.
- Add accessible labels/instructions and visible focus styles.
- Add responsive split/stacked layout.
- Add behavior-focused DOM tests.

### `packages/host-web`

- Own browser-specific input adapters.
- Create `SourceDocument` from pasted/file text.
- Call direct `@mvviewer/core/analyzeManifest` locally.
- Mount app controls and inspector into the container.
- Support paste/analyze flow.
- Support drag/drop `manifest.json` flow.
- Optional file picker if low-cost.
- Show calm inline error/status for parse failures or unexpected exceptions.
- Add tests for host flow and privacy/no-network behavior where feasible.

### `apps/web`

- Remain thin composition root.
- Keep semantic page structure.
- No parser/domain/knowledge/state/rendering logic in app shell.

### `packages/application`

Only add DOM-free selectors/helpers if clearly needed to avoid duplicating interaction/range logic in UI components.

Acceptable examples:

- `getActiveExplanation(state)`
- `findSmallestExplainableNodeAtOffset(snapshot, offset)`
- `getSemanticNodeById(snapshot, nodeId)`

Keep helpers pure, tested, and package-boundary safe.

## Out of Scope

Do not implement:

- diagnostics list UI;
- severity diagnostics;
- fixes or quick fixes;
- health scores;
- security audit;
- permission risk scoring;
- compatibility matrix;
- exportable reports;
- remote upload/analysis;
- telemetry/analytics involving manifest contents;
- AI-generated explanations;
- worker execution;
- browser extension, VS Code extension, CLI, desktop hosts;
- full code editor features: folding, editing, command palette, persisted pane resizing, virtualization unless measured necessary.

## Source Rendering Strategy

Preserve original source. Never reserialize with `JSON.stringify` for display.

Security rules:

- Never inject manifest source via raw `innerHTML`.
- Use DOM nodes and `textContent`.
- If creating source segments, text must come from `snapshot.document.text` only.

Complexity note:

Semantic ranges overlap and nest. Avoid naïvely wrapping all ranges. Prefer deterministic non-overlapping segments representing the smallest explainable node for each source span or offset.

Simple acceptable MVP strategy:

1. derive explainable semantic nodes from `snapshot.semantic.nodes` that have entries in `snapshot.explanationsByNodeId`;
2. sort by source range start, then prefer smaller/narrower ranges for overlapping starts;
3. create non-overlapping text segments from the preserved source;
4. attach `data-node-id` only to explainable spans;
5. use event delegation for hover/click/focus;
6. update active CSS classes from application state.

If exact segmentation gets risky, keep the implementation simple and tested for representative fixtures. Do not add advanced DSA unless required.

## Accessibility Requirements

- Use real `<textarea>` for paste input.
- Use real `<button type="button">` for analyze/file actions.
- Use `<input type="file" accept="application/json,.json">` if file picker is implemented.
- Every control needs visible label or accessible name.
- No positive `tabindex`.
- Source interaction must not be hover-only.
- Use roving focus or container-level keyboard handling to avoid hundreds of tab stops.
- Visible `:focus-visible` styles for controls and source focus.
- Touch/tap selects.
- Color must not be the only active/focused indication.
- Explanation changes should be perceivable after keyboard selection.

## Tests Required

Add or update behavior-focused tests covering as much as feasible:

- valid paste loads preserved source and explanation panel;
- drag/drop or file import loads manifest locally;
- original formatting is preserved;
- hover previews explanation;
- click pins explanation;
- hover leave restores pinned explanation;
- tap/click selects without hover;
- keyboard navigation moves through explainable nodes;
- Enter/Space selects focused node;
- Escape clears selection if implemented;
- unknown/custom field fallback appears;
- partial invalid fixture does not crash UI;
- source highlight and explanation panel stay synchronized;
- controls have accessible labels/names;
- no positive `tabindex`;
- no manifest content is sent via `fetch`, `XMLHttpRequest`, `sendBeacon`, or `WebSocket` during paste/import/drop.

Use `happy-dom` already accepted for Phase 5 DOM tests.

## Files / Write Scope

Allowed write scope:

- `packages/ui-components/package.json`
- `packages/ui-components/tsconfig.json`
- `packages/ui-components/src/**`
- `packages/host-web/package.json`
- `packages/host-web/tsconfig.json`
- `packages/host-web/src/**`
- `packages/application/package.json` only if application imports change
- `packages/application/tsconfig.json` only if references change
- `packages/application/src/**` only for pure selector/helper additions
- `apps/web/package.json` only if dependencies/scripts change
- `apps/web/tsconfig.json`
- `apps/web/index.html`
- `apps/web/src/**`
- `package-lock.json` if package metadata changes
- package-local tests for changed packages

Do not edit:

- `docs/journey/memory.md`
- `docs/agents/templates/external-self-review.md`
- `packages/contracts` unless absolutely necessary and clearly justified
- `packages/parser-json`
- `packages/manifest-domain`
- `packages/knowledge`
- `packages/core` unless absolutely necessary and clearly justified

## Package Boundary Rules

Expected direction:

```text
ui-components -> contracts, application
host-web      -> contracts, core, application?, ui-components
apps/web      -> host-web
```

Rules:

- `ui-components` must not import `@mvviewer/core`, parser, domain, or knowledge.
- `host-web` may import `@mvviewer/core` for direct local analysis.
- `apps/web` remains thin and imports only `@mvviewer/host-web` unless justified.
- Update `package.json` dependencies and `tsconfig.json` references for every workspace import.

## Acceptance Criteria

- [ ] Paste valid manifest renders preserved source and explanation panel.
- [ ] Drag/drop `manifest.json` works locally.
- [ ] Optional file picker works if implemented.
- [ ] Hover previews field/permission/section explanation.
- [ ] Click/tap pins explanation.
- [ ] Hover leave restores pinned explanation.
- [ ] Keyboard can move through explainable nodes and select one.
- [ ] Unknown/custom field fallback appears.
- [ ] Invalid/partial input does not crash; inline message is calm and not diagnostic/report/fix language.
- [ ] Source highlight and explanation panel stay synchronized.
- [ ] No raw manifest `innerHTML` or unsafe source injection.
- [ ] No network behavior introduced for manifest contents.
- [ ] No diagnostics/fixes/health/report/audit/security/compatibility/AI/remote scope creep.
- [ ] Package dependencies/references match imports.
- [ ] Tests cover core behavior.
- [ ] Validation passes.

## Validation

Run:

```sh
npm run typecheck
npm run test
npm run build
npm run build --workspace=@mvviewer/web
```

Also run static checks:

```sh
grep -R "as never\|as any" packages apps/web/src || true
grep -R "innerHTML\|outerHTML\|insertAdjacentHTML" packages/ui-components packages/host-web apps/web/src apps/web/index.html || true
grep -R "diagnostic\|fix\|health\|score\|report\|audit\|AI-generated\|remote" packages/ui-components/src packages/host-web/src apps/web/src apps/web/index.html || true
```

## Reporting Requirements

Return:

```md
# Agent Report — Phase 5 UI MVP Completion

## Summary

## Files Changed

## Validation

## Self-Review

## Risks / Follow-ups

## Proposed Memory Update
```
