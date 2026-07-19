# External Agent Self-Review Checklist

Complete this before returning implementation/test/fix work.

## Scope Control

- [ ] I stayed inside the assigned write scope.
- [ ] I did not edit `docs/journey/memory.md` unless explicitly assigned.
- [ ] I did not modify unrelated files.
- [ ] I did not create broad abstractions beyond the task.

## Architecture Boundaries

- [ ] Package imports follow the allowed dependency direction.
- [ ] `contracts` has no internal package imports.
- [ ] External library types do not leak into contracts or unrelated packages.
- [ ] UI/DOM/host/platform types are not present in core/domain/knowledge contracts unless explicitly in scope.
- [ ] Public snapshots remain plain, readonly, immutable, and serializable.

## Phase Scope

- [ ] I did not add out-of-scope UI, diagnostics, fixes, health scores, workers, hosts, remote analysis, or AI-generated behavior.
- [ ] I checked the active phase guide for phase-specific exclusions.
- [ ] I preserved PRD priority: explainer-first MVP.

## Code Quality

- [ ] No `as never` casts were introduced.
- [ ] Meaningful variants use ADT/discriminated-union shapes where appropriate.
- [ ] Major pipeline steps use named intermediate values for debugging.
- [ ] The code avoids clever FP, unnecessary currying, and over-generic abstractions.
- [ ] Any DSA/pattern introduced has a clear reason in the current task.

## Tests and Validation

- [ ] I added or updated behavior-focused tests for changed behavior.
- [ ] I updated package metadata and TypeScript references for new workspace imports.
- [ ] I ran the requested validation commands.
- [ ] I report exact validation command results.

## Task-Specific Known Traps

Copy any known traps from the task brief and answer them here.

- [ ] `<trap 1>`
- [ ] `<trap 2>`

## Memory Proposal

- [ ] I propose a concise `docs/journey/memory.md` update if the work changes durable project state.
- [ ] If no memory update is needed, I explicitly say so.
