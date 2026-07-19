# AI Team Workflow

This document defines coordinator-led workflows for planning, implementation, review, and QA.

## Required Read Order

Before team workflow starts, the coordinator reads:

1. `docs/journey/memory.md`
2. `AGENTS.md`
3. active `docs/journey/phaseN.md`
4. `docs/architecture/coding-style.md`
5. `docs/PRD.md` and HLD sections relevant to the task

Specialist agents receive a focused prompt containing the relevant context and file paths.

## Standard Lifecycle

```text
Intake
→ Scope check
→ Specialist planning/review as needed
→ Task brief
→ Implementation by user or assigned agent
→ Code review
→ QA validation
→ Memory/docs update
→ Commit on active branch when appropriate
```

## Planning Workflow

Use when starting a phase or substantial feature.

1. Coordinator summarizes active phase goal.
2. Product Manager reviews PRD/MVP alignment.
3. Staff Engineer reviews architecture and package boundaries.
4. QA Engineer proposes test plan and fixtures.
5. Coordinator synthesizes:
   - implementation brief
   - acceptance criteria
   - task breakdown
   - risks
   - proposed memory update

Optional artifact:

```text
docs/agents/tasks/active/phaseN-<topic>.md
```

## Implementation Workflow

Default: user implements, coordinator tutors/reviews.

If user asks an agent to implement:

1. Coordinator creates a narrow task brief.
2. Implementation agent gets a disjoint write scope.
3. Agent edits only assigned files.
4. Agent reports validation and proposed memory updates.
5. Coordinator reviews/synthesizes before broader changes.

Avoid multiple agents editing the same files simultaneously.

## Review Workflow

Use when user says implementation is ready or risk is high.

Recommended reviewers:

- Staff Engineer: architecture/package boundaries
- Code Reviewer: readability/style/maintainability
- QA Engineer: test coverage/edge cases
- Frontend Expert: UI/accessibility only when UI changed

Coordinator writes or summarizes findings in `docs/reviews/` when useful.

## QA Workflow

QA should check:

- acceptance criteria
- relevant tests
- fixture coverage
- validation commands
- regressions or out-of-scope behavior
- privacy/local-first constraints when relevant

Validation must be reported exactly.

## Memory Update Workflow

Update `docs/journey/memory.md` when any of these change:

- current phase/status
- completed deliverables
- validation results
- architecture/product decisions
- stack/dependency choices
- blockers
- important user preferences
- durable sub-agent findings

Specialists propose memory updates. Coordinator applies them.

## Commit Workflow

On experiment branches, commit meaningful workflow changes and implementation milestones.

Use Conventional Commits:

```text
docs(agents): define ai team workflow
feat(parser): add source-aware JSON parser
test(parser): add range lookup coverage
```

Do not commit unless requested by the user or established branch policy says to keep committing experiment work.

Current experiment branch policy: commit meaningful AI-team workflow changes on `ai-team-workflow-experiment`.

## Conflict Resolution

If specialists disagree:

1. Coordinator identifies the actual decision.
2. Prefer PRD/HLD/coding-style docs over personal preference.
3. If tradeoff remains material, ask the user.
4. Record durable decision in memory or ADR.

## Commands the User Can Use

```text
Run Phase 1 planning team.
Run architecture review for <topic>.
Run QA review for <topic>.
Run code review for these changes.
Generate task tickets for <phase/topic>.
Ask <role> to review <question>.
Synthesize agent reports.
Update memory from these findings.
```
