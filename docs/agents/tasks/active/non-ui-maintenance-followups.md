# Task Brief — Non-UI Maintenance Follow-ups

Date: 2026-07-19
Branch: `ai-team-workflow-experiment`

## Purpose

Keep non-UI cleanup separate from Phase 5 UI polish. These items came from Staff Engineer consultation during the drag/drop feedback remediation.

## Coordinator Rule

Do not bundle these with UI fixes. Assign one narrow task at a time to the relevant specialist/external agent with disjoint write scope.

## Assignments

### P1 — Stale active task cleanup

Responsible role: Coordinator / Documentation Maintainer.

Why:

- `docs/agents/tasks/active/` contains briefs that appear completed according to `docs/journey/memory.md`.
- Stale active tasks can mislead future agents.

Suggested write scope:

- `docs/agents/tasks/active/**`
- `docs/agents/tasks/done/**`
- `docs/journey/memory.md` only if durable status needs correction

Acceptance:

- Completed briefs are moved to `done/` or otherwise reconciled.
- `active/` contains only genuinely active tasks.
- Memory and task locations agree.

### P1 — Fixtures README catalog update

Responsible role: QA Engineer or Technical Writer.

Why:

- `fixtures/manifests/README.md` may still describe planned fixtures while real fixtures now exist.

Suggested write scope:

- `fixtures/manifests/README.md`

Acceptance:

- README lists actual current fixtures and their purpose.
- No source/test behavior changes.

### P1/P2 — Lightweight package-boundary checks

Responsible role: Staff Engineer + Build/Tooling Engineer.

Why:

- Current dependency direction is review-enforced but not mechanically checked.

Suggested write scope:

- root scripts/config
- package manifests/tsconfig files only if needed
- documentation for the check

Acceptance:

- Detect forbidden workspace imports according to `docs/architecture/coding-style.md`.
- Check package dependencies and TypeScript references match imports.
- Prefer no new dependency unless clearly justified.

### P2 — Remove or justify `passWithNoTests: true`

Responsible role: QA Engineer / Build Tooling.

Why:

- Tests now exist; allowing no-test success can hide misconfigured discovery.

Suggested write scope:

- `vitest.config.ts`
- test config only if needed

Acceptance:

- `npm run test` still passes.
- Empty/misconfigured discovery no longer passes silently, unless explicitly justified.

### P2 — Node ambient types cleanup

Responsible role: Staff Engineer / Build Tooling.

Why:

- Platform-independent package tsconfigs should not carry Node ambient types unless production source needs them.

Suggested write scope:

- package tsconfigs
- test-specific tsconfig/config if needed

Acceptance:

- Remove unnecessary production Node ambient types where feasible.
- Tests/build/typecheck still pass.
- Do not break fixture-reading tests.

### P3 — `getActiveNodeId` defensive hardening

Responsible role: Application/Core Engineer.

Why:

- Existing selector trusts reducer-maintained focused-node invariants; acceptable now, but arbitrary rehydrated state could be stale.

Suggested write scope:

- `packages/application/src/index.ts`
- `packages/application/src/index.test.ts`

Acceptance:

- Externally constructed stale focused IDs fall back safely.
- Existing reducer behavior remains unchanged.
- Behavior-focused tests added.

## Validation

For docs-only tasks, run no code validation unless files touched require it.

For code/config tasks, run at minimum:

```sh
npm run typecheck
npm run test
npm run build
```

Add focused validation for any new script/check.

## Reporting

Each agent should report:

1. Task completed.
2. Files changed.
3. Validation run and exact result.
4. Risks/follow-ups.
5. Proposed `docs/journey/memory.md` update if durable.
