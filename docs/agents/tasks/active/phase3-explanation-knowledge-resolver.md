# Task Brief — Phase 3 Explanation Knowledge and Resolver

## Context

Project: `mvviewer`, a local-first Web Extension Manifest Explainer.

North star:

> Hover your manifest. Understand every field.

Active phase: Phase 3 — Explanation Knowledge and Resolver.

Read before acting:

1. `docs/journey/memory.md`
2. `AGENTS.md`
3. `docs/architecture/coding-style.md`
4. `docs/agents/external-agents.md`
5. `docs/journey/phase3.md`
6. `docs/PRD.md`
7. `docs/roadmap-v1.md`

This brief is self-contained enough for either the user or an external implementation agent to complete without relying on chat history.

## Assigned Role

External implementation agent, preferably OpenCode via:

```sh
opencode run --pure "<prompt using this task brief>"
```

The coordinator must not directly implement this task.

## Goal

Implement Phase 3: local, headless explanation knowledge and resolver.

Given a manifest source document, the headless core should produce a serializable explanation-aware snapshot that links Phase 2 semantic nodes to explanation content.

## In Scope

- Add explanation contracts to `packages/contracts`.
- Implement `packages/knowledge` static knowledge registry.
- Implement resolver strategy and fallback explanations.
- Implement `packages/core` pipeline composition:
  - source document
  - parse snapshot
  - semantic snapshot
  - explanations by semantic node ID
- Add behavior-focused tests for knowledge resolver and core integration.
- Update package dependencies and TypeScript project references.
- Use existing fixtures where possible.
- Add narrowly targeted fixture changes only if required.

## Out of Scope

Do not implement:

- UI components
- explanation panel rendering
- hover/click/pin behavior
- keyboard/touch interaction
- validation diagnostics
- severity levels
- fixes
- health scores
- compatibility matrix
- worker execution
- host integration
- browser extension / VS Code extension
- remote docs fetching
- AI-generated explanations
- generated schema pipeline

## Files / Write Scope

Allowed write scope:

- `packages/contracts/src/index.ts`
- `packages/knowledge/package.json`
- `packages/knowledge/tsconfig.json`
- `packages/knowledge/src/**`
- `packages/core/package.json`
- `packages/core/tsconfig.json`
- `packages/core/src/**`
- `fixtures/manifests/**` only if a fixture gap is found
- `tests/**` only for cross-package integration tests if needed
- `package-lock.json` after dependency changes

Do not edit:

- UI packages
- host packages
- app packages
- roadmap docs unless explicitly requested
- memory docs directly unless explicitly assigned by coordinator

The coordinator must not edit these implementation/test files directly; assigned implementation agent owns this write scope.

## Package Boundary Rules

Expected dependency direction:

```text
knowledge -> contracts, manifest-domain
core      -> contracts, parser-json, manifest-domain, knowledge
```

Rules:

- `packages/contracts` imports no internal package.
- `packages/knowledge` must not import `core`, `application`, UI, host, or app packages.
- `packages/core` must not import UI, host, or app packages.
- External parser-library types must not leak into contracts or knowledge.
- Add `tsconfig.json` references matching workspace imports.

## Acceptance Criteria

### Contracts

- [ ] Explanation content contracts exist and are serializable.
- [ ] Explanation source/fallback status is represented without diagnostics concepts.
- [ ] Snapshot shape links explanations to semantic node IDs.
- [ ] No DOM/external library types in contracts.

### Knowledge registry/resolver

- [ ] Known top-level fields resolve to explanation metadata.
- [ ] Required permission values resolve to specific explanations:
  - `tabs`
  - `activeTab`
  - `storage`
  - `scripting`
- [ ] Host permission items resolve to host-permission explanation.
- [ ] Content script nodes resolve:
  - `content_scripts`
  - `content_scripts[].matches`
  - `content_scripts[].js`
  - `content_scripts[].css`
- [ ] Unknown top-level fields fallback gracefully.
- [ ] Unknown nested fields fallback gracefully.
- [ ] Unknown permission values fallback gracefully.
- [ ] Resolver output is deterministic and serializable.

### Core pipeline

- [ ] Core facade composes parser → semantic mapper → explanation resolver.
- [ ] `minimal-mv3.json` produces explanation snapshot.
- [ ] `full-common-mv3.json` resolves common top-level field explanations.
- [ ] `permissions.json` resolves known permission explanations.
- [ ] `host-permissions.json` resolves host permission explanations.
- [ ] `nested-content-scripts.json` resolves content script explanations.
- [ ] `unknown-custom-fields.json` produces fallback explanations.
- [ ] `partial-invalid.json` resolves explanations for recovered nodes where practical.
- [ ] Snapshot round-trips through `JSON.stringify` / `JSON.parse`.
- [ ] Snapshot contains no diagnostics/fixes/health score concepts.

## Content Tone Rules

- Explanations must be neutral and educational.
- Permissions should explain capability, not risk score.
- Host permissions should explain match/access concept, not audit security.
- MV2/MV3 notes may explain context but must not become migration diagnostics.
- Unknown fallbacks should be calm and useful.

## Validation

Run:

```sh
npm run typecheck
npm run test
npm run build
```

Recommended focused loop:

```sh
npm run test -- packages/knowledge/src/index.test.ts
npm run test -- packages/core/src/index.test.ts
```

## Quality Gate

The coordinator will synthesize this work and may send it through review/QA before commit. Passing local validation does not by itself mean the task is accepted.

## Reporting Requirements

Return:

- summary
- files changed
- validation results
- risks/follow-ups
- proposed `docs/journey/memory.md` update

Use this report shape:

```md
# Agent Report — Phase 3 Explanation Knowledge and Resolver

## Summary

...

## Files Changed

...

## Validation

...

## Risks / Follow-ups

...

## Proposed Memory Update

...
```
