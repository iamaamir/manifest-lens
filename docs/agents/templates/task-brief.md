# Task Brief — <title>

## Context

<phase, product goal, relevant docs>

This brief should be self-contained enough for either the user or an external implementation agent to complete without relying on chat history.

External agents should read `docs/agents/external-quickstart.md` before this brief.

## Assigned Role

<role or external agent, e.g. opencode when configured>

## Goal

<clear outcome>

## In Scope

- ...

## Out of Scope

- ...

## Files / Write Scope

- ...

The coordinator must not edit these implementation/test files directly; assigned implementation agent owns this write scope.

## Acceptance Criteria

- [ ] ...

## Known Traps / Common Failure Modes

- Do not use `as never` to force type compatibility.
- Do not modify files outside the write scope.
- Do not add out-of-scope product concepts from future phases.
- <task-specific trap>

## Validation

```sh
<commands>
```

## Quality Gate

The coordinator will synthesize this work and may send it through review/QA before commit. Passing local validation does not by itself mean the task is accepted.

Before returning, external agents must complete `docs/agents/templates/external-self-review.md`.

## Reporting Requirements

Return:

- summary
- files changed
- validation results
- self-review checklist result
- risks/follow-ups
- proposed `docs/journey/memory.md` update
