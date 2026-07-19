# Task Brief — Phase 4 Application State and Interaction Model

## Context

Project: `mvviewer`, a local-first Web Extension Manifest Explainer.

North star:

> Hover your manifest. Understand every field.

Active phase: Phase 4 — Application State and Interaction Model.

External agents should read `docs/agents/external-quickstart.md` before this brief.

Read before acting:

1. `docs/agents/external-quickstart.md`
2. `docs/journey/memory.md`
3. `AGENTS.md`
4. `docs/architecture/coding-style.md`
5. `docs/journey/phase4.md`
6. this task brief

This brief is self-contained enough for either the user or an external implementation agent to complete without relying on chat history.

## Assigned Role

External implementation agent, preferably OpenCode via:

```sh
opencode run --pure "Read docs/agents/external-quickstart.md, then follow docs/agents/tasks/active/phase4-application-state.md. Complete docs/agents/templates/external-self-review.md before returning."
```

The coordinator must not directly implement this task.

## Goal

Implement Phase 4: headless application state and interaction model.

Given an `AnalysisSnapshot`, `packages/application` should expose pure state/reducer/selectors that model hover preview, click/tap pinning, clear selection, and deterministic keyboard navigation over explainable semantic nodes.

## In Scope

- Implement `packages/application` public API for:
  - `InspectorState`
  - `InspectorStatus`
  - `SelectionState`
  - `InspectorAction`
  - initial/create state helper
  - reducer/state transition function
  - active-node selector
  - navigable-node selector/order helper
  - next/previous keyboard navigation
- Add application tests for interaction behavior.
- Update `packages/application/package.json` and `packages/application/tsconfig.json` for dependencies/references.
- Add contracts to `packages/contracts/src/index.ts` only if they need to cross package boundaries. Prefer local `packages/application` exports if enough.
- Update `package-lock.json` if package metadata changes.

## Out of Scope

Do not implement:

- Web Components
- DOM event handling
- source rendering
- explanation panel rendering
- file input / drag-and-drop
- storage persistence
- workers or async analysis orchestration
- host-web integration
- browser extension / VS Code extension
- diagnostics or selected diagnostics
- severity levels
- fixes or quick fixes
- health scores
- analytics/telemetry
- remote requests
- AI-generated explanations

## Files / Write Scope

Allowed write scope:

- `packages/application/package.json`
- `packages/application/tsconfig.json`
- `packages/application/src/**`
- `packages/contracts/src/index.ts` only if public cross-package state/action types are needed
- `package-lock.json` if package metadata changes

Do not edit:

- parser/domain/knowledge/core implementation files
- UI packages
- host packages
- app packages
- roadmap docs
- memory docs directly unless explicitly assigned by coordinator

The coordinator must not edit implementation/test files directly; assigned implementation agent owns this write scope.

## Package Boundary Rules

Expected dependency direction:

```text
application -> contracts, core
```

Prefer:

```text
application -> contracts
```

if all needed types are available from contracts.

Rules:

- `packages/application` must not import UI, host, app, parser-json, manifest-domain, or knowledge packages.
- `packages/application` must not import DOM/browser/Node APIs.
- If `packages/application` imports another workspace package, add matching package dependency and TypeScript project reference.
- Public state and actions must remain serializable plain data.

## Acceptance Criteria

### State model

- [ ] `InspectorState` models snapshot/status, selection, and keyboard focus without DOM coupling.
- [ ] Selection state is ADT/discriminated-union shaped, not boolean/optional-field soup.
- [ ] State is readonly/plain/serializable.
- [ ] Initial empty state is available and serializable.
- [ ] Setting a snapshot makes state ready and preserves/sets sensible focus behavior.

### Reducer/actions

- [ ] Pure reducer or equivalent transition function exists.
- [ ] Hover action previews a node.
- [ ] Hover end restores pinned selection or default/root behavior.
- [ ] Select/click action pins a node.
- [ ] Touch/tap can reuse the same select action as click.
- [ ] Clear selection removes hover/pinned state.
- [ ] Focus actions support keyboard behavior.
- [ ] Unknown/non-navigable node IDs are ignored or handled predictably.

### Selectors/navigation

- [ ] `getActiveNodeId(state)` implements hover-over-pinned behavior.
- [ ] `getNavigableNodeIds(snapshot)` returns explainable semantic node IDs in semantic node order.
- [ ] Keyboard next/previous moves through navigable nodes deterministically.
- [ ] Keyboard next/previous wraps at boundaries.
- [ ] No active-node duplication is stored when it can be computed by selector.

### Tests

- [ ] Hover previews explanation.
- [ ] Click pins explanation.
- [ ] Hovering another node temporarily previews it.
- [ ] Hover leave restores pinned explanation.
- [ ] Clearing selection resets hover/pin state.
- [ ] Touch/tap uses same select path as click.
- [ ] Keyboard next/previous moves through semantic nodes in order.
- [ ] Keyboard navigation wraps.
- [ ] State/actions round-trip via `JSON.stringify`/`JSON.parse`.
- [ ] Public state has no diagnostics/fixes/health-score concepts.

## Known Traps / Common Failure Modes

- Do not use `as never` to force type compatibility.
- Do not modify files outside the write scope.
- Do not add out-of-scope product concepts from future phases.
- Do not add DOM types, Web Components, source rendering, or host-web glue.
- Do not import UI/host/app/parser-json/manifest-domain/knowledge from `packages/application`.
- Do not make navigation order depend on object key order from `explanationsByNodeId`; use `snapshot.semantic.nodes` order.
- Do not store derived `activeNodeId`; compute it with a selector.
- Do not mutate existing state objects or arrays in place.
- Do not add diagnostics, fixes, health scores, selected diagnostic state, severity, or validation concepts.
- Do not create service classes, singletons, or event buses.

## Validation

Run:

```sh
npm run typecheck
npm run test
npm run build
```

Recommended focused loop:

```sh
npm run test -- packages/application/src/index.test.ts
```

## Quality Gate

The coordinator will synthesize this work and send it through review/QA before commit. Passing local validation does not by itself mean the task is accepted.

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
# Agent Report — Phase 4 Application State and Interaction Model

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
