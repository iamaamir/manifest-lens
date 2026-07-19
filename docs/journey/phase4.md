# Phase 4 Guide — Application State and Interaction Model

Phase 4 makes the explainer interaction model testable before UI work begins.

The goal is a headless application-state layer:

```text
AnalysisSnapshot
→ InspectorState
→ InspectorAction
→ pure reducer/state transitions
→ effective active node
→ keyboard navigation order
```

Phase 4 is still **not UI work**. It should not render Web Components, attach DOM listeners, handle files, or style anything. It creates the state machine that future UI components can call.

## Coordinator Note

The coordinator must not directly implement this phase.

Implementation and test-writing should be done by:

- the user, or
- an external implementation agent such as OpenCode using `opencode run --pure`, following `docs/agents/external-agents.md`.

Use the task brief:

```text
docs/agents/tasks/active/phase4-application-state.md
```

External agents should read:

```text
docs/agents/external-quickstart.md
docs/agents/templates/external-self-review.md
```

## Phase 4 Outcome

Given an `AnalysisSnapshot`, the application package should be able to:

- initialize an inspector state,
- track hover preview and pinned selection,
- compute the effective active node,
- navigate between explainable semantic nodes deterministically,
- express touch tap as selection without requiring hover,
- remain serializable, immutable, and UI-independent.

By the end of Phase 4:

- application-state contracts exist, either in `packages/contracts` if they are cross-boundary public contracts or locally in `packages/application` if they are package API only;
- `packages/application` exposes a small pure state facade;
- reducer/state transition functions are tested;
- keyboard navigation order over semantic nodes is deterministic;
- no DOM/UI, host integration, workers, storage, diagnostics, fixes, health scores, or remote behavior are added.

## Primary Packages

Expected write scope:

- `packages/application/package.json`
- `packages/application/tsconfig.json`
- `packages/application/src/**`
- `packages/contracts/src/index.ts` only if public cross-package state/action types are needed
- `package-lock.json` if package dependencies change

Expected package dependency direction:

```text
application -> contracts, core
```

For Phase 4, prefer `application -> contracts` only if possible. Add `core` only if implementation genuinely needs core types/helpers beyond `AnalysisSnapshot` from contracts.

Do not introduce reverse dependencies.

## In Scope

### Inspector state

Model state needed by the future UI shell, such as:

- current `AnalysisSnapshot | null`,
- status/loading/error state if useful,
- hovered semantic node ID,
- pinned/selected semantic node ID,
- focused semantic node ID for keyboard navigation,
- deterministic navigation order.

Keep the model explainer-first. Diagnostics and selected diagnostic state are out of Phase 4.

### Selection model

Use an ADT/discriminated-union style for meaningful variants.

Recommended shape:

```ts
export type SelectionState =
  | { readonly kind: "none" }
  | { readonly kind: "hovered"; readonly nodeId: SemanticNodeId }
  | { readonly kind: "pinned"; readonly nodeId: SemanticNodeId }
  | {
      readonly kind: "hoverPreview";
      readonly hoveredNodeId: SemanticNodeId;
      readonly pinnedNodeId: SemanticNodeId;
    };
```

Equivalent names are fine if the behavior remains clear.

### Effective active node

Implement a pure selector such as:

```ts
getActiveNodeId(state)
```

Expected rule:

```text
hovered/hoverPreview node wins
else pinned node
else focused node if that is the chosen keyboard model
else default/root semantic node
else null
```

For the PRD/HLD interaction promise, the key behavior is:

```text
hover previews temporarily; leaving hover restores pinned selection
```

### Actions and reducer

Use explicit actions and a pure reducer, for example:

- initialize/set snapshot,
- hover node,
- leave hover,
- pin/select node,
- clear selection,
- focus node,
- move focus next/previous,
- touch/tap node using the same persistent selection path as click.

Names may vary, but actions must remain serializable plain data.

### Keyboard navigation

Expose deterministic navigation helpers, such as:

- `getNavigableNodeIds(snapshot)`
- `moveFocus(state, "next" | "previous")`

Navigation order should follow `snapshot.semantic.nodes` order and include explainable semantic nodes. Avoid expensive/clever DSA; a filtered array is enough.

A node is navigable if it has an explanation entry in `snapshot.explanationsByNodeId` and belongs to `snapshot.semantic.nodes`.

### Errors/status

If status is modeled, keep it simple and serializable, for example:

```ts
export type InspectorStatus =
  | { readonly kind: "empty" }
  | { readonly kind: "ready" }
  | { readonly kind: "error"; readonly message: string };
```

Do not add async execution, stale request handling, workers, or host adapters in Phase 4.

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

## Required Behavior

### Hover and pin

- Starting from no selection, hovering a node makes it active.
- Leaving hover returns to no active node except for the default/root fallback.
- Clicking/selecting a node pins it.
- Hovering a different node previews it while pinned selection remains remembered.
- Leaving hover restores the pinned node.
- Clicking/selecting while hover-previewing updates the pinned node.
- Clearing selection removes pinned and hovered state.

### Keyboard

- Keyboard next/previous moves through navigable semantic nodes in deterministic order.
- Navigation wraps around at the ends unless implementation explicitly documents non-wrapping behavior. Prefer wrapping for UI friendliness.
- Keyboard-selected/focused node can be pinned/selected.
- Keyboard behavior must be testable without DOM events.

### Touch

- Touch/tap uses the same persistent selection action as click.
- No hover is required for touch behavior.

## Known Traps / Common Failure Modes

- Do not use `as never` to force type compatibility.
- Do not add DOM types or Web Components in Phase 4.
- Do not couple `packages/application` to UI packages or host packages.
- Do not add diagnostics/fixes/health-score concepts from the HLD future layers.
- Do not store derived active-node state if it can be computed from state; prefer selectors.
- Do not mutate state in place.
- Do not use `Map`/`Set` in public state snapshots.
- Do not create service classes or event buses.
- Do not make keyboard navigation depend on object key order from `explanationsByNodeId`; prefer semantic node order.

## Suggested Contract/API Shape

Implementation agents may adjust names if behavior remains stable.

```ts
export type InspectorStatus =
  | { readonly kind: "empty" }
  | { readonly kind: "ready" }
  | { readonly kind: "error"; readonly message: string };

export type SelectionState =
  | { readonly kind: "none" }
  | { readonly kind: "hovered"; readonly nodeId: SemanticNodeId }
  | { readonly kind: "pinned"; readonly nodeId: SemanticNodeId }
  | {
      readonly kind: "hoverPreview";
      readonly hoveredNodeId: SemanticNodeId;
      readonly pinnedNodeId: SemanticNodeId;
    };

export interface InspectorState {
  readonly status: InspectorStatus;
  readonly snapshot: AnalysisSnapshot | null;
  readonly selection: SelectionState;
  readonly focusedNodeId: SemanticNodeId | null;
}

export type InspectorAction =
  | { readonly type: "snapshot/set"; readonly snapshot: AnalysisSnapshot }
  | { readonly type: "snapshot/clear" }
  | { readonly type: "node/hover"; readonly nodeId: SemanticNodeId }
  | { readonly type: "node/hoverEnd" }
  | { readonly type: "node/select"; readonly nodeId: SemanticNodeId }
  | { readonly type: "node/clearSelection" }
  | { readonly type: "node/focus"; readonly nodeId: SemanticNodeId | null }
  | { readonly type: "node/focusNext" }
  | { readonly type: "node/focusPrevious" };
```

## Required Tests

Suggested location:

```text
packages/application/src/index.test.ts
```

Required coverage:

- initial empty state is serializable;
- setting a snapshot makes state ready and sets a sensible default/focus;
- hover previews an explanation from no selection;
- hover end restores no/pinned active node correctly;
- click/select pins an explanation;
- hover over another node temporarily previews without losing pinned node;
- selecting while hover-previewing updates the pinned node;
- clear selection resets hover/pin state;
- touch/tap can use the same select action as click;
- keyboard next/previous moves through navigable nodes in semantic order;
- keyboard navigation wraps around;
- non-navigable or unknown node IDs are ignored or handled predictably;
- state and actions are serializable;
- no diagnostics/fixes/health-score concepts appear in public state.

## Validation

Implementation agent must run:

```sh
npm run typecheck
npm run test
npm run build
```

Recommended focused loop during implementation:

```sh
npm run test -- packages/application/src/index.test.ts
```

## Architecture Review Checklist

Before accepting Phase 4:

- [ ] `application` imports only allowed packages.
- [ ] `application` has matching `package.json` dependencies and `tsconfig.json` references.
- [ ] State/actions are serializable plain data.
- [ ] Selection is ADT-shaped, not optional-field/boolean soup.
- [ ] Reducer is pure and does not mutate input state.
- [ ] Selectors compute derived state rather than storing duplicate active-node state.
- [ ] Keyboard navigation follows semantic node order.
- [ ] No DOM/UI/host types are introduced.
- [ ] No diagnostics/fixes/health-score scope creep.

## Product Review Checklist

- [ ] Hover preview behavior matches PRD/HLD.
- [ ] Click pin behavior matches PRD/HLD.
- [ ] Hover leave restores pinned selection.
- [ ] Keyboard interaction is possible without mouse.
- [ ] Touch can select without hover.
- [ ] The state model supports future source/explanation synchronization without dictating rendering.

## External Agent Instructions

For OpenCode or another external implementation agent:

```text
You are an external implementation agent for mvviewer Phase 4.
Read docs/agents/external-quickstart.md first, then docs/journey/phase4.md and docs/agents/tasks/active/phase4-application-state.md.
Implement only Phase 4: Application State and Interaction Model.
Do not implement UI, DOM event handling, storage, workers, host integration, validation diagnostics, fixes, health scores, remote analysis, or AI-generated behavior.
Stay inside the task brief write scope.
Complete docs/agents/templates/external-self-review.md before returning.
Run npm run typecheck, npm run test, and npm run build.
Return a structured report with files changed, validation results, self-review result, risks/follow-ups, and proposed memory update.
```

## Completion Criteria

Phase 4 is complete when:

- implementation report exists from user or external implementation agent;
- code review passes;
- QA review passes;
- validation passes;
- `docs/journey/memory.md` records completion and validation;
- changes are committed on the active branch.
