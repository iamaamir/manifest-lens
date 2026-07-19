# Task Brief — Phase 5 UI MVP Slice 1: Package Wiring and Static Inspector Shell

## Context

Project: `manifest-lens`, a local-first Web Extension Manifest Explainer.

North star:

> Hover your manifest. Understand every field.

Active phase: Phase 5 — Web Components UI MVP.

This is **Slice 1 only**. Do not build the whole UI MVP in one pass.

External agents should read `docs/agents/external-quickstart.md` before this brief.

Read before acting:

1. `docs/agents/external-quickstart.md`
2. `docs/journey/memory.md`
3. `AGENTS.md`
4. `docs/architecture/coding-style.md`
5. `docs/journey/phase5.md`
6. this task brief

This brief is self-contained enough for either the user or an external implementation agent to complete without relying on chat history.

## Assigned Role

External implementation agent, preferably OpenCode if the user asks for agent-led implementation:

```sh
opencode run --pure "Read docs/agents/external-quickstart.md, then follow docs/agents/tasks/active/phase5-ui-mvp-slice1.md. Complete docs/agents/templates/external-self-review.md before returning."
```

Do not hardcode an OpenCode model. Use local OpenCode default unless the user selected a model/capacity.

The coordinator must not directly implement this task.

## Goal

Create the first Phase 5 UI foundation:

- package dependencies/references/libs for `ui-components`, `host-web`, and `apps/web` as needed;
- register a real `<manifest-inspector>` Web Component;
- provide a `host-web` mount helper;
- make `apps/web` mount the component instead of static text;
- show a semantic, accessible, local-first empty state.

This slice proves package wiring and Web Component registration without analysis/source rendering yet.

## In Scope

### `packages/ui-components`

- Add DOM-capable TypeScript config if needed.
- Add dependencies/references to `@manifest-lens/contracts` and/or `@manifest-lens/application` only if actually imported.
- Implement/register initial custom elements, likely:
  - `<manifest-inspector>`
  - optionally internal placeholder elements for source/panel/split view if simple.
- Empty state copy:
  - “Paste or drop a `manifest.json` to understand what each field does.”
  - “Your manifest is processed locally in this browser.”
- Use Shadow DOM if consistent with HLD styling contract.
- Expose minimal styling parts/properties only if needed for Slice 1.

### `packages/host-web`

- Add DOM-capable TypeScript config if needed.
- Add dependencies/references to `@manifest-lens/ui-components` and `@manifest-lens/contracts` only if actually imported.
- Implement `mountWebManifestInspector(container: HTMLElement): void` or equivalent.
- Ensure custom elements are registered before mount.
- No analysis/input/file logic yet unless absolutely required for mounting.

### `apps/web`

- Replace placeholder static text with host-web mount call.
- Ensure `index.html` has basic semantic page structure with `<main>` and appropriate title/heading placement.
- Add TypeScript references matching imports if needed.

## Out of Scope

Do not implement yet:

- paste analysis flow;
- drag/drop/file reading;
- direct `analyzeManifest` integration;
- source rendering;
- explanation panel data rendering;
- hover/click/tap/keyboard source interaction;
- diagnostics/fixes/health scores/reports;
- worker execution;
- remote requests;
- AI-generated explanations;
- browser extension/VS Code/CLI hosts;
- complex theming or design polish.

## Files / Write Scope

Allowed write scope:

- `packages/ui-components/package.json`
- `packages/ui-components/tsconfig.json`
- `packages/ui-components/src/**`
- `packages/host-web/package.json`
- `packages/host-web/tsconfig.json`
- `packages/host-web/src/**`
- `apps/web/package.json` only if dependencies/scripts change
- `apps/web/tsconfig.json`
- `apps/web/index.html`
- `apps/web/src/**`
- `package-lock.json` if package metadata changes
- package-local tests for these packages if added in this slice

Do not edit:

- `packages/contracts` unless explicitly justified and accepted by coordinator;
- `packages/parser-json`;
- `packages/manifest-domain`;
- `packages/knowledge`;
- `packages/core`;
- `packages/application`;
- memory docs directly unless explicitly assigned by coordinator.

## Package Boundary Rules

Expected direction:

```text
ui-components -> contracts, application
host-web      -> contracts, core, application, ui-components
apps/web      -> host-web, ui-components
```

For Slice 1, likely minimal:

```text
ui-components -> no workspace deps or contracts/application only if imported
host-web      -> ui-components
apps/web      -> host-web
```

Rules:

- `ui-components` must not import `@manifest-lens/core`, parser, domain, or knowledge packages.
- `host-web` may import `@manifest-lens/core` later, but Slice 1 should avoid analysis unless needed.
- `apps/web` should remain a thin composition root.
- Update `package.json` dependencies and `tsconfig.json` references for every workspace import.

## Acceptance Criteria

- [ ] `apps/web` mounts a real Web Component through `host-web`.
- [ ] `<manifest-inspector>` renders an accessible empty/local-first state.
- [ ] Page/app structure has semantic landmarks/headings.
- [ ] No diagnostics/fixes/health/report/security-audit UI appears.
- [ ] No manifest analysis is required for this slice.
- [ ] No network behavior is introduced.
- [ ] Custom element registration is idempotent or safe across repeated imports/tests.
- [ ] Package dependencies and TypeScript references match imports.
- [ ] `ui-components` and `host-web` have DOM libs if they use DOM/Custom Elements types.
- [ ] Styling is minimal but includes visible focus defaults if any focusable controls exist.
- [ ] No raw manifest/source `innerHTML` concerns are introduced.

## Known Traps / Common Failure Modes

- Do not implement the whole Phase 5 UI in Slice 1.
- Do not add parser/core analysis flow yet unless coordinator expands scope.
- Do not import `@manifest-lens/core` into `ui-components`.
- Do not add diagnostic/report/fix/health-score UI from HLD future examples.
- Do not use positive `tabindex`.
- Do not use fake interactive divs where native controls would work.
- Do not hardcode OpenCode model flags.
- Do not use `as never` to force type compatibility.
- Do not put browser file APIs in shared core packages.

## Tests

Add tests only if the current test setup supports DOM safely. If a DOM test dependency is needed, propose it in the report instead of adding a broad dependency without justification.

Useful Slice 1 tests if feasible:

- custom element renders empty state;
- `mountWebManifestInspector` appends/registers `<manifest-inspector>`;
- repeated registration/mount does not throw;
- no diagnostic/fix/report text appears in empty state.

Do not overfit internal Shadow DOM implementation details.

## Validation

Run:

```sh
npm run typecheck
npm run test
npm run build
```

Focused loop if tests are added:

```sh
npm run test -- packages/ui-components packages/host-web apps/web
```

## Quality Gate

The coordinator will synthesize this work and send it through Product Manager, Frontend Expert, Staff Engineer, QA Engineer, and Code Reviewer as appropriate before acceptance.

Passing local validation does not by itself mean the task is accepted.

Before returning, external agents must complete `docs/agents/templates/external-self-review.md`.

## Reporting Requirements

Return:

- summary
- files changed
- validation results
- self-review checklist result
- risks/follow-ups
- proposed `docs/journey/memory.md` update

Use this report shape:

```md
# Agent Report — Phase 5 UI MVP Slice 1

## Summary

...

## Files Changed

...

## Validation

...

## Self-Review

...

## Risks / Follow-ups

...

## Proposed Memory Update

...
```
