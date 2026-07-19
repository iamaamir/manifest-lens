# Journey Memory — Web Extension Manifest Explainer

This file is the durable handoff state for the project and must stay in the loop throughout the work.

Every main agent or delegated agent that makes or reviews a meaningful decision should either update this file directly, if it has write scope, or report the memory update that the main agent should apply.

If the chat/session is lost, start here, then read:

1. `web-extension-manifest-inspector-hld.md`
2. `docs/PRD.md`
3. `docs/roadmap-v1.md`
4. the current `docs/journey/phaseN.md`
5. `docs/architecture/coding-style.md`
6. `AGENTS.md` for agent-specific workflow expectations

## Project Intent

Build a local-first Web Extension Manifest Explainer.

The user writes the implementation. The agent acts primarily as tutor, guide, reviewer, planner, and QA coordinator. The agent may code only when explicitly asked or when the user asks for help with a specific implementation step.

## Product North Star

> Hover your manifest. Understand every field.

Initial release priority is explanation and interaction clarity, not validation.

## Source Documents

- HLD: `web-extension-manifest-inspector-hld.md`
  - Architecture source of truth.
  - Defines package structure, portability model, contracts, host architecture, Web Components approach, and future extensibility.
- PRD: `docs/PRD.md`
  - Product source of truth for initial release.
  - Explainer-first.
  - Diagnostics/fixes/reports/CLI/VS Code/browser extension are out of initial scope.
- Roadmap: `docs/roadmap-v1.md`
  - Phase plan derived from HLD + PRD.
- Coding style: `docs/architecture/coding-style.md`
  - Canonical style/enforcement contract for humans and agents.
- Agent instructions: `AGENTS.md`
  - Required operating instructions for future agents.
- Contributor guide: `CONTRIBUTING.md`
  - Human contributor checklist and review expectations.
- AI team model: `docs/agents/team.md` and `docs/agents/workflow.md`
  - Coordinator-led, artifact-driven, role-specialized agent workflow.
- Agent role/persona cards/templates: `docs/agents/roles/` and `docs/agents/templates/`
  - Specialist responsibilities, persona prompts, and report/task formats.
- Persona loading guide: `docs/agents/persona-loading.md`
  - How to start a separate specialist agent by loading a single role/persona file.

## Current Phase

Phase 1 — Source-Aware Parser Foundation is active.

Phase 0 — Repository and Architecture Foundation is complete and reviewed.

## Current Role Split

User:

- Does most coding and setup unless explicitly asking agents to implement.
- Follows phase guides.
- Can ask the coordinator to run planning/review/QA teams automatically.
- Can interrupt, redirect, or guide any specialist role through the coordinator.

Coordinator agent:

- Maintains roadmap and journey docs.
- Explains architecture and implementation steps.
- Reviews user changes.
- Uses specialist sub-agents for focused planning/review/QA when useful.
- Synthesizes specialist reports and resolves conflicts.
- Keeps this memory file updated after major milestones, phase changes, architecture decisions, scope changes, validated setup/test results, blockers, or important user preferences.

- Specialist agents:

- Follow `docs/agents/team.md`, `docs/agents/workflow.md`, and role/persona cards in `docs/agents/roles/`.
- Can be coordinator-spawned or manually started by the user with a persona file.
- Receive narrow scopes from the coordinator when part of coordinated work.
- Avoid overlapping writes.
- Return structured reports with findings, validation, and proposed `memory.md` updates.

Delegated/future agents:

- Must read this file before acting when joining the project.
- Must preserve the tutor-first workflow unless the user explicitly asks for implementation.
- Must not treat chat history as the durable source of truth; durable state belongs here.
- If they discover a decision, risk, blocker, or completed validation, they must include a proposed `memory.md` update in their final response, or update this file if they have permission and write scope.

## Key Architecture Decisions to Preserve

- TypeScript for shared code.
- Strict compiler settings.
- Headless engine independent from UI.
- Functional core, ADT-modeled domain, boring imperative shell.
- Use pragmatic functional TypeScript: pure transformations, immutable serializable data, discriminated unions, exhaustive handling, and named intermediate values for debugging.
- Avoid clever FP: no heavy FP libraries early, no point-free/pipe-heavy style, no unnecessary currying, no deep generic/typeclass abstractions.
- Use DSA pragmatically only when required by product clarity, correctness, or measured complexity/performance needs. Prefer simple trees, indexes, range lookup, path utilities, and state machines first; defer interval trees, tries, graph engines, incremental parsing, and advanced caching until justified.
- Use boring design patterns at boundaries when they reduce complexity: ports/adapters for platform seams, adapters around external libraries, strategy for explanation resolution, registry for knowledge packs, reducer/state machine for interaction, facade for public engine APIs, fallback/null-object for unknown explanations.
- Avoid pattern-heavy OOP and enterprise ceremony: no service-class sprawl, singletons, event buses, abstract factories, inheritance hierarchies, or repository pattern unless a real need appears.
- Ports and adapters.
- Source-aware parsing, preserving original text.
- Serializable immutable snapshots.
- Knowledge registry separated from rendering.
- Web Components for shared UI.
- Host capabilities isolate platform-specific behavior.
- Direct browser execution first; worker execution later if needed.

## Initial Package Plan

Expected package directories:

- `packages/contracts`
- `packages/parser-json`
- `packages/manifest-domain`
- `packages/knowledge`
- `packages/core`
- `packages/application`
- `packages/engine-worker`
- `packages/ui-components`
- `packages/host-web`
- `apps/web`
- `fixtures`

Phase 0 creates structure/placeholders only. Later phases fill behavior.

## Project Style Rule

Guiding style:

> Pragmatic FP + ADTs + simple DSA when needed + boring design patterns at boundaries.

Use a design pattern only if it clearly reduces complexity, improves portability, isolates a dependency, or makes behavior easier to test. Avoid using patterns just because they are named patterns.

Recommended pattern usage by area:

- Parser: adapter around parser library, function-based tree traversal.
- Domain mapping: mapper/visitor-ish traversal without class-heavy visitor ceremony.
- Explanation resolution: strategy chain plus fallback resolver.
- Knowledge: registry/knowledge-pack pattern.
- Application state: reducer/state-machine pattern.
- Engine API: facade over pipeline steps.
- Hosts/platforms: ports and adapters/capability interfaces.

## Implementation Scope Rule

When HLD and PRD differ in emphasis:

- HLD controls architecture and extensibility.
- PRD controls initial product behavior and priority.

Therefore, build architecture seams early, but implement only the explainer-first vertical slice for MVP.

## Deferred from Initial Release

- Full schema validation.
- Severity diagnostics.
- Health score.
- Automatic fixes.
- Quick fixes.
- MV2-to-MV3 conversion.
- Compatibility matrix.
- CI integration beyond basic checks.
- CLI.
- VS Code extension.
- Browser extension packaging.
- Desktop shell.
- User accounts/cloud/share links.
- AI-generated explanations.
- Remote analysis.

## Phase 0 Target Outcome

A clean monorepo-style TypeScript skeleton that makes boundaries visible and allows future phases to add code without restructuring.

## Memory Update Rules

Update this file when any of these change:

- current phase or phase status
- completed deliverables
- validation commands and results
- important architecture/product decisions
- chosen package manager, test runner, build tool, parser library, or other stack choices
- open blockers or unresolved questions
- user preferences about workflow, coding ownership, or review style
- sub-agent review findings that should persist

Keep updates concise. Prefer editing existing sections over appending noisy logs. Use `Latest Update` for the most recent meaningful checkpoint.

## Durable Restart Prompt

If starting a fresh agent session, use this prompt:

```text
We are building mvviewer, a local-first Web Extension Manifest Explainer. Read docs/journey/memory.md first, then AGENTS.md, web-extension-manifest-inspector-hld.md, docs/PRD.md, docs/roadmap-v1.md, the current docs/journey/phaseN.md, docs/architecture/coding-style.md, and, for multi-agent work, docs/agents/team.md and docs/agents/workflow.md. Act as tutor/reviewer/coordinator more than implementor. Preserve HLD architecture, but implement PRD priority: explainer-first MVP. Follow the guiding style: pragmatic FP + ADTs + simple DSA when needed + boring design patterns at boundaries. Keep docs/journey/memory.md updated after major decisions, phase changes, validations, blockers, and user workflow preferences. If using sub-agents, instruct them to report any durable memory updates. Do not code unless asked or unless creating/updating guide docs.
```

## Open Working Questions

- Phase 1 product scope is JSON only. JSONC is intentionally deferred because the MVP targets normal `manifest.json` files.
- Parser implementation may still use `jsonc-parser` as a source-aware JSON parser utility behind the `SourceParser` contract. User can still override if they prefer a custom parser.

## Latest Update

- Upgraded `docs/agents/roles/*` from short role cards into self-contained specialist persona files suitable for direct specialist chats.
- Added `docs/agents/persona-loading.md` with instructions for starting a new specialist agent from a single persona file.
- Added repo-native AI team operating model: `docs/agents/team.md`, `docs/agents/workflow.md`, role cards, report/task templates, task queue README, and `docs/reviews/` directory.
- Updated `AGENTS.md` with coordinator-led AI team workflow instructions.
- Baseline committed on `main` with commit `6c4615b` (`chore: establish project baseline`).
- Active experiment branch is `ai-team-workflow-experiment`, created from the baseline commit, for trying the coordinator-led AI team workflow.
- Experiment branch policy: keep committing meaningful AI-team workflow changes on this branch so `main` remains a stable restore point.
- Added `docs/architecture/coding-style.md` as the canonical coding-style and architecture enforcement contract for humans and agents.
- Added root `AGENTS.md` with required read order, tutor-first role expectations, memory discipline, phase discipline, package boundaries, coding style, validation, and sub-agent rules.
- Added `CONTRIBUTING.md` with contributor checklist, dependency checklist, validation expectations, and review mindset.
- Updated durable restart/read-order guidance to include coding style and agent instructions.
- Created `docs/journey/phase1.md` as the tutor guide for the Source-Aware Parser Foundation.
- Phase 1 is now active.
- Added design-pattern guidance: use boring patterns at boundaries only when they reduce complexity; prefer ports/adapters, adapter, strategy, registry, reducer/state machine, facade, and fallback patterns; avoid pattern-heavy OOP ceremony.
- Added DSA guidance for later: use practical data structures/algorithms when they directly help source-tree traversal, range lookup, node indexing, path matching, or interaction state; avoid advanced structures until required.
- Phase 1 style decision added: parser/core work should follow pragmatic functional TypeScript with ADT-shaped contracts, immutable serializable snapshots, pure transformation functions, exhaustive handling, and debuggable named intermediate values.
- Phase 1 should avoid clever FP, heavy FP libraries, point-free/pipe-heavy code, and over-abstracted generic patterns.
- Phase 1 decision: support JSON only for MVP; defer JSONC support until a future editor/VS Code-style workflow needs it.
- Phase 1 recommended implementation library remains `jsonc-parser`, used only as a source-aware JSON parser utility behind the `SourceParser` contract.
- Phase 1 target: contracts + parser-json implementation + range index + JSON parser fixtures/tests; no semantic manifest explanations or UI yet.
- Phase 0 review passed: expected npm workspace skeleton, strict TypeScript project references, package/app directories, fixtures area, and placeholder public entrypoints are present.
- Validation re-run passed: `npm run typecheck`, `npm run test`, and `npm run build`.
- Independent sub-agent QA also passed Phase 0 structure review.
- Follow-up risks for later phases: add package-level TypeScript `references` when inter-package imports begin; decide later whether package exports should move from `src` to `dist`; add an app bundle build command when Vite production bundling matters.
- Implemented Phase 0 repository skeleton with npm workspaces, strict TypeScript project references, package boundary directories, placeholder public entrypoints, `apps/web` shell, and `fixtures/manifests/README.md`.
- Chosen setup stack is now npm workspaces, TypeScript, Vitest, and Vite for `apps/web`.
- Added `vitest.config.ts` with `passWithNoTests: true` so Phase 0 can pass before test files exist.
