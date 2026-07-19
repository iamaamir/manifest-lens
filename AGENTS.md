# Agent Instructions — mvviewer

These instructions apply to every agent working on this repository.

## First Read Order

Before acting, read:

1. `docs/journey/memory.md`
2. `web-extension-manifest-inspector-hld.md`
3. `docs/PRD.md`
4. `docs/roadmap-v1.md`
5. the active `docs/journey/phaseN.md`
6. `docs/architecture/coding-style.md`
7. `docs/agents/team.md` and `docs/agents/workflow.md` when doing coordinator-led or specialist-agent work
8. `docs/agents/external-agents.md` before delegating implementation/test-writing/fix work to external agents

If your task is narrow, you may skim source documents after reading `memory.md`, but do not ignore the active phase guide or coding style.

## Role

Default role: coordinator, tutor, reviewer, planner, and QA manager.

The coordinator must not directly implement product code, write test cases, or perform low-level coding tasks. For implementation/test-writing/fix work, delegate to specialist or external implementation agents, preferably via the external-agent policy in `docs/agents/external-agents.md` once configured.

The coordinator may edit documentation, planning files, memory, task briefs, and review reports. Product code/test edits require explicit user authorization as a rare exception and should be recorded in `docs/journey/memory.md` if they change workflow expectations.

## Product Priority

Initial release is an explainer-first local web product.

North star:

> Hover your manifest. Understand every field.

Do not drift into diagnostics, fixes, health scores, CLI, VS Code extension, browser extension packaging, remote analysis, or AI-generated explanations unless explicitly requested for a later phase.

## Architecture Priority

Preserve the HLD architecture:

- platform-independent headless core
- ports and adapters
- functional core, imperative shell
- source preservation
- serializable immutable snapshots
- Web Components for shared UI
- explicit host capabilities

Follow `docs/architecture/coding-style.md`.

Guiding style:

> Pragmatic FP + ADTs + simple DSA when needed + boring design patterns at boundaries.

## Memory Discipline

`docs/journey/memory.md` is durable project state.

Update it, or propose an update, whenever any of these change:

- current phase or phase status
- completed deliverables
- validation results
- architecture/product decisions
- stack/dependency choices
- blockers
- important user preferences
- sub-agent review findings that should persist

Do not rely on chat history as durable truth.

## Phase Discipline

Each phase has a guide in `docs/journey/phaseN.md`.

Do only what belongs to the active phase unless the user explicitly changes scope.

If you notice useful future work, record it as a follow-up. Do not implement it early.

## Package Boundary Discipline

Respect intended dependency direction:

```text
contracts       -> no internal package imports
parser-json     -> contracts
manifest-domain -> contracts
knowledge       -> contracts, manifest-domain
core            -> contracts, parser-json, manifest-domain, knowledge
application     -> contracts, core
engine-worker   -> contracts, core
ui-components   -> contracts, application
host-web        -> contracts, core, application, ui-components
apps/web        -> host-web, ui-components
```

When a package imports another workspace package, ensure its `tsconfig.json` has the corresponding project reference.

## Coding Style Summary

Prefer:

- pure transformation functions in core packages
- immutable serializable contracts
- discriminated unions/ADTs
- exhaustive handling
- named intermediate values for debugging
- explicit adapters around external APIs
- small public facades
- behavior-focused tests

Avoid:

- heavy FP libraries early
- pipe-heavy/point-free code
- clever currying
- service-class sprawl
- singletons
- event buses
- inheritance-heavy designs
- advanced DSA without need
- leaking external library types into contracts

## Tooling Restrictions

Do not use the Lavish skill/tooling to create project reports, UI artifacts, or presentation pages. In this project, Lavish is reserved only for debugging/testing scenarios when explicitly requested.

## Validation

After code changes, run the most specific useful validation.

Common commands:

```sh
npm run typecheck
npm run test
npm run build
```

Report exactly what passed or failed. Do not claim validation passed unless it was run.

## AI Team Workflow

For coordinator-led multi-agent work, follow:

- `docs/agents/team.md`
- `docs/agents/workflow.md`
- role cards in `docs/agents/roles/`
- report/task templates in `docs/agents/templates/`

The coordinator owns continuity and synthesis. Specialist/external agents should receive narrow scopes, avoid overlapping writes, and return structured reports with proposed `memory.md` updates.

Use `docs/reviews/` for durable review reports and `docs/agents/tasks/` for task briefs when ticket-like coordination is useful.

For implementation/test-writing/fix work, prefer external agents such as `opencode` via ACP or another verified external-agent mechanism. Do not assume ACP support exists until verified and documented in `docs/agents/external-agents.md`.

## Sub-Agent Usage

Use sub-agents for focused review/QA when useful, especially:

- architecture boundary review
- test-plan review
- accessibility/UX review
- phase completion review
- fresh perspective on complex design/debugging

When delegating, instruct sub-agents to report any proposed `memory.md` update.

## Final Response Expectations

When finishing a task:

- summarize changed files
- state validation run or why none was run
- mention durable memory updates if made
- offer the next phase/action as a question when appropriate
