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

The coordinator agent orchestrates, plans, delegates, reviews, and updates durable memory/docs. The coordinator must not directly implement product code, write tests, or perform low-level coding tasks. Implementation/test-writing/fix work should be done by the user or delegated to specialist/external implementation agents such as `opencode` once configured.

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
- Design source: `design.md`
  - UI design source of truth for the Phase 5 reset: “The Observatory,” a near-black precision manifest inspection instrument.
- External agent policy: `docs/agents/external-agents.md`
  - Coordinator boundary, external implementation-agent preference, and ACP status.
- Agent role/persona cards/templates: `docs/agents/roles/` and `docs/agents/templates/`
  - Specialist responsibilities, persona prompts, and report/task formats.
- UI design loop: `docs/agents/ui-design-loop.md`
  - Phase 5 Observatory workflow: Product Designer → Frontend Engineer → E2E/UX QA → screenshot/artifact feedback → Product Designer review.
- Persona loading guide: `docs/agents/persona-loading.md`
  - How to start a separate specialist agent by loading a single role/persona file.

## Current Phase

Phase 5 — Web Components UI MVP is functionally complete, reviewed, and validated on branch `ai-team-workflow-experiment`, but the visual/UX direction has been rejected and is now in a design-led UI reset.

Next phase is not started yet.

Phase 4 — Application State and Interaction Model is complete, reviewed, and validated.

Phase 3 — Explanation Knowledge and Resolver is complete, reviewed, and validated.

Phase 2 — Semantic Manifest Model is complete, reviewed, and validated.

Phase 1 — Source-Aware Parser Foundation is complete, reviewed, and validated.

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
- Reviews user/external-agent changes.
- Uses specialist sub-agents for focused planning/review/QA when useful.
- Delegates implementation, test-writing, and low-level fixes to the user or specialist/external agents; does not directly code these tasks.
- Prefers external implementation agents such as `opencode` via ACP or another verified mechanism once configured.
- Synthesizes specialist reports and resolves conflicts.
- Keeps this memory file updated after major milestones, phase changes, architecture decisions, scope changes, validated setup/test results, blockers, or important user preferences.

- Specialist agents:

- Follow `docs/agents/team.md`, `docs/agents/workflow.md`, and role/persona cards in `docs/agents/roles/`.
- Can be coordinator-spawned or manually started by the user with a persona file.
- Receive narrow scopes from the coordinator when part of coordinated work.
- Implementation agents own product-code/test edits when agent-led coding is requested.
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
- Coordinator-only boundary: coordinator orchestrates and edits docs/memory/task briefs, but product-code/test implementation must go through user or delegated specialist/external agents.
- Lavish tooling is not to be used for project reports or UI artifacts; reserve it only for debugging/testing if explicitly requested.

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
We are building mvviewer, a local-first Web Extension Manifest Explainer. Read docs/journey/memory.md first, then AGENTS.md, web-extension-manifest-inspector-hld.md, docs/PRD.md, docs/roadmap-v1.md, the current docs/journey/phaseN.md, docs/architecture/coding-style.md, and, for multi-agent work, docs/agents/team.md, docs/agents/workflow.md, and docs/agents/external-agents.md. Act as coordinator/tutor/reviewer, not implementor. Preserve HLD architecture, but implement PRD priority: explainer-first MVP. Follow the guiding style: pragmatic FP + ADTs + simple DSA when needed + boring design patterns at boundaries. Keep docs/journey/memory.md updated after major decisions, phase changes, validations, blockers, and user workflow preferences. Delegate implementation/test-writing/fix work to the user or specialist/external agents such as opencode once configured. Do not use Lavish for reports/UI artifacts; reserve Lavish only for debugging/testing if explicitly requested.
```

## Open Working Questions

- Phase 5 implementation guide exists: `docs/journey/phase5.md`.
- Phase 5 first active task brief exists: `docs/agents/tasks/active/phase5-ui-mvp-slice1.md`.
- Phase 4 implementation guide exists: `docs/journey/phase4.md`.
- Phase 4 external-agent task brief completed and moved to `docs/agents/tasks/done/phase4-application-state.md`.
- Phase 3 implementation guide exists: `docs/journey/phase3.md`.
- Phase 3 external-agent-ready task brief exists: `docs/agents/tasks/active/phase3-explanation-knowledge-resolver.md`.
- External implementation-agent workflow is defined for now: from Zed, use `opencode run --pure "<prompt>"` from the shell with compact repo-native onboarding; do not hardcode a model by default.
- Zed supports external ACP agents via `agent_servers` such as `opencode acp`, but this coordinator thread does not currently appear to have a tool-callable way to spawn/use a configured ACP agent and wait for its result.
- If the coordinator is running inside OpenCode, prefer OpenCode-native internal agents/subagents or task mechanisms instead of recursively shelling out to `opencode run`, unless explicitly needed.
- Phase guides and task briefs should be clear enough that either the user or an external implementation agent can pick them up without chat history.
- External agents are encouraged for low-effort, well-scoped implementation tasks, unit-test writing, fixture expansion, targeted fixes, mechanical refactors, and validation/reporting.
- Coordinator preserves control through narrow write scopes, known-traps sections, required external self-review, quality gates, review/QA, validation, memory updates, and commits only after synthesis.
- For non-trivial external-agent work, create a task brief under `docs/agents/tasks/active/`, run OpenCode against it, and collect stdout or a report under `docs/agents/tasks/done/`.
- Token-saving external-agent approach: point external agents to `docs/agents/external-quickstart.md`, the task brief, and `docs/agents/templates/external-self-review.md` instead of pasting long repeated prompts; for narrow fixes, ask them to read only quickstart + task/prompt + touched files.
- OpenCode model/capacity rule: use the local OpenCode default unless the user selects a specific model/capacity. The user often uses Big Pickle, so offer it for larger/riskier tasks, but ask before adding `--model big-pickle`. Use high/max variants or configured deep-thinking agents only when selected for architecture-sensitive changes, hard bugs, or review-blocker fixes.
- Concurrency rule: default to one external implementation agent at a time in the active working tree; use internal sub-agents for parallel read-only Staff/Code/QA review; consider separate branches/worktrees before parallel external implementation.
- Phase 1 product scope remains JSON only. JSONC is intentionally deferred because the MVP targets normal `manifest.json` files.
- Parser implementation uses `jsonc-parser` as a source-aware JSON parser utility behind the `SourceParser` contract.

## Latest Update

- Phase 5 UI reset Slice 1 implemented by an internal Frontend Engineer specialist and coordinator-reviewed: the app now has an Observatory shell with near-black sticky-header canvas, compact integrated paste/upload/clear controls, dark source/prose panes, quiet in-inspector empty state, and preserved existing local analysis/source/hover/pin/keyboard/privacy behavior.
- Slice 1 validation passed after coordinator rerun: `npm run typecheck`, `npm run test` (8 files, 145 tests), `npm run build`, `npm run build --workspace=@mvviewer/web`, `git diff --check`; static greps showed expected test/generated-output matches only, not new production source-injection/network/scope-creep paths.
- Phase 5 UI reset Slice 2 implemented source-code treatment in `packages/ui-components`: decorative line-number gutter, lightweight syntax coloring from preserved `snapshot.document.text`, and gutter-based non-color focus/pin cues while preserving source text, representative IDs, keyboard/hover/pin interactions, and inert structural punctuation. Validation passed: `npm run typecheck`, `npm run test` (8 files, 151 tests), `npm run build`, `npm run build --workspace=@mvviewer/web`, `git diff --check`; static greps showed expected test-only matches.
- Product Designer and Manifest UX/domain read-only reviews passed Slice 1 directionally with no scope-creep blockers; remaining design priorities are reducing the temporary form-dock feel and improving explanation hierarchy to semantic eyebrow + field chip + definition + prose.
- E2E/UX QA review found concrete Slice 1 blockers, now fixed and validated: page-level paste works without stealing textarea/input paste, invalid-after-valid clears stale source/explanation/pin state, and hidden upload input no longer becomes visible on keyboard focus. Post-fix validation passed: `npm run typecheck`, `npm run test` (8 files, 148 tests), `npm run build`, `npm run build --workspace=@mvviewer/web`, and `git diff --check`.
- User rejected the current Phase 5 UI as AI slop with bad UX. `design.md` is now the durable UI design source of truth for the Phase 5 UI reset.
- Target concept is “The Observatory”: a near-black precision manifest inspection instrument where the source/tree pane and explanation pane are the product surface.
- Frontend/UI work for this reset should use Product Designer, Manifest UX Domain Specialist, E2E/UX QA Engineer, and Frontend Engineer roles through the durable loop in `docs/agents/ui-design-loop.md`.
- User re-authorized trying OpenCode for frontend/UI and especially Playwright E2E now that `design.md` is clear. OpenCode must be quality-gated, use the local default model unless the user selects capacity, and be abandoned/fallback to internal specialists if output is broad, buggy, generic, or visually low-craft.
- Immediate UI reset should not polish the current light shell; it should replace it with a design-led Observatory implementation while preserving Phase 5 behavior.
- MVP-critical reset scope: compact sticky header, integrated local input/drop/upload, dark design tokens, code-like preserved source with line numbers and syntax coloring, calm prose explanation hierarchy, quiet hover/focus/pin states, existing accessibility/privacy behavior, and no diagnostics/fixes/scores/reports/audits/AI/remote scope creep.
- Deferred from immediate reset unless explicitly tasked: full collapsible tree, depth collapse, large-array truncation, mobile inline cards, load sample, help popover, mixed-version/deprecated warnings, related-field links, and large-file spinner. Browser E2E/screenshot tooling is now explicitly approved for the design loop via Playwright.
- Playwright headless E2E should cover comprehensive interactions, especially left/right panel click/scroll/visibility, keyboard, paste/upload/drop paths where feasible, invalid-after-valid, unknown fallback, mobile viewport behavior, screenshots for designer review, and local-only privacy using `fixtures/manifests/comprehensive-all-browsers.json` as the primary payload.
- Phase 5 Web Components UI MVP completed by external OpenCode implementation/fix agents and accepted after coordinator validation plus Product Manager, Core Engineer, Frontend Expert, Staff Engineer, QA Engineer, and Code Reviewer reviews/re-reviews.
- Phase 5 now provides the first usable local web explainer UI: textarea Analyze flow, file picker, paste/drop handling, direct local `@mvviewer/core/analyzeManifest`, preserved source rendering, explanation panel, hover preview, click/tap pinning, keyboard navigation, unknown/custom fallback, partial-invalid graceful status, responsive split/stacked layout, and local-first privacy behavior.
- `apps/web` is a thin composition root that mounts `<manifest-inspector>` and delegates controls to `@mvviewer/host-web`; `host-web` owns browser input adapters and parse-error-aware analysis outcomes; `ui-components` owns Web Components rendering and consumes `@mvviewer/application` reducer/selectors.
- Package direction reviewed and accepted for Phase 5: `apps/web -> host-web`; `host-web -> contracts, core, ui-components`; `ui-components -> contracts, application`; `application -> contracts`. Package metadata, lockfile, and TypeScript project references match imports.
- Source rendering preserves `snapshot.document.text` and uses DOM text APIs only; no production `innerHTML`, `outerHTML`, or `insertAdjacentHTML` source injection. Source segments have unique DOM IDs, deterministic representative IDs for `aria-activedescendant`, and stable source DOM after snapshot load while interactions update classes/ARIA and the explanation panel.
- Keyboard access is reachable through a focusable source region with non-positive tabindex, instructions, Arrow navigation, Enter/Space selection, Escape clear, and visible focus. Hover/click/tap interactions use the Phase 4 application reducer semantics.
- Tests now cover empty state, valid paste/source preservation, Analyze invalid JSON, file import, drop/paste flows, no-network privacy for text/import/drop, hover preview, click pinning, pin A -> hover B -> leave restore, keyboard navigation, unknown/custom fallback, partial-invalid calm status, source/explanation synchronization, unique source DOM IDs, package behavior, and fixture-backed high-risk cases.
- Phase 5 UI remediation completed after user rejected the initial external-agent UI as too raw/default and visually buggy. For frontend/UI quality work, user prefers setting external agents aside and using the internal Frontend Engineer specialist; user requested `gpt-5.4-mini` where model selection is available, but current internal `spawn_agent` tool did not expose model selection.
- UI remediation changed the app shell from raw browser defaults to a styled local developer-tool interface: OKLCH-tinted light theme, compact hero, local/privacy note, styled textarea/buttons/file input/status, inspector card, polished source/explanation split, stronger explanation typography, and responsive layout.
- Source highlighting remediation fixed the visible bug where punctuation/whitespace fragments looked like scattered dotted boxes. Structural fragments are visually muted, non-representative structural fragments are inert for hover/click, representative source segments prefer meaningful non-structural text, DOM IDs remain unique, and `aria-activedescendant` points to a valid representative.
- Explanation pane no longer uses `aria-live` to avoid noisy hover-driven announcements; app-level status remains `role="status"`/`aria-live="polite"`.
- UI remediation validation passed locally: `npm run typecheck`, `npm run test` (8 files, 145 tests), `npm run build`, `npm run build --workspace=@mvviewer/web`, `git diff --check`, plus static greps for unsafe casts and production source injection.
- Completed UI remediation task moved to `docs/agents/tasks/done/phase5-ui-remediation.md`.
- Phase 5 validation before remediation passed locally: `npm run typecheck`, `npm run test` (8 files, 142 tests), `npm run build`, `npm run build --workspace=@mvviewer/web`, `git diff --check`, plus static greps for unsafe casts, production source injection, network APIs, and scope-creep terms.
- Completed task briefs moved to `docs/agents/tasks/done/phase5-ui-mvp-slice1.md` and `docs/agents/tasks/done/phase5-ui-mvp-complete.md`; final review summary recorded in `docs/reviews/phase5-completion-report.md`.
- Non-blocking Phase 5 follow-ups: optionally add host/UI smoke tests for `minimal-mv3.json` and `full-common-mv3.json`, further improve visible file/drop affordance after user tries the new UI, consider one semantic option per explainable node for future accessibility polish, remove unused/near-term-only helpers if they remain unused, and consider moving reusable source decoration selectors from `ui-components` into `application` if they grow.
- Phase 5 Slice 1 completed by external OpenCode implementation/fix agents and accepted after coordinator validation plus Product Manager, Frontend Expert, Staff Engineer, QA Engineer, and Code Reviewer reviews/re-reviews.
- Slice 1 added initial Web Components UI wiring: `apps/web` mounts through `@mvviewer/host-web`; `host-web` registers/mounts `@mvviewer/ui-components`; `ui-components` provides a real `<manifest-inspector>` Web Component with Shadow DOM and an accessible local-first empty state.
- Slice 1 remains package-wiring/static-shell only: no paste/drop/file reading, manifest analysis, source rendering, explanation data rendering, hover/click/tap/keyboard source interaction, diagnostics, fixes, health scores, reports, audits, workers, remote analysis, AI behavior, browser extension, VS Code extension, or CLI.
- Package direction reviewed and accepted for Slice 1: `apps/web -> host-web -> ui-components`; TypeScript project references match imports; `ui-components` has no workspace imports; `host-web` imports only `ui-components`; `apps/web` imports only `host-web`.
- Added focused DOM tests for custom-element registration, empty/local-first state copy, absence of diagnostic/report/fix/health/audit terms, host-web mounting, and repeated mount behavior. Accepted `happy-dom` as the lightweight DOM test environment for Phase 5 component/host tests.
- Slice 1 review fixes applied: Vitest APIs are imported explicitly, Vitest globals are not enabled, package tsconfigs include test files, custom-element registration uses direct `customElements.get` idempotency, unused direct `apps/web -> ui-components` dependency was removed, and the incomplete skip link was deferred.
- Phase 5 Slice 1 validation passed locally: `npm run typecheck`, `npm run test` (8 files, 96 tests), `npm run build`, `npm run build --workspace=@mvviewer/web`, and `git diff --check`.
- Completed Slice 1 task brief moved to `docs/agents/tasks/done/phase5-ui-mvp-slice1.md`.
- Phase 5 planning completed with Product Manager, Core Engineer, Frontend Expert, QA Engineer, and Staff Engineer read-only reviews; created `docs/journey/phase5.md` and first narrow task brief.
- Phase 5 MVP scope confirmed: first usable local Web Components explainer UI with paste/drop/import path, preserved source split view, explanation panel, hover preview, click/tap pinning, keyboard navigation, source/explanation synchronization, unknown fallback, basic responsive layout, and accessibility/privacy checks.
- Phase 5 package plan: `ui-components` owns Web Components/rendering and should consume only `contracts` + `application`; `host-web` owns browser adapters and direct local `core/analyzeManifest`; `apps/web` remains a thin Vite composition root.
- Phase 5 guardrails: direct in-browser engine first; no workers, diagnostics, fixes, health scores, reports/exports, security audits, compatibility matrices, remote analysis, AI-generated explanations, browser extension, VS Code extension, or CLI.
- Phase 5 source-rendering trap: semantic ranges overlap/nest, so avoid naïvely wrapping every range; render preserved `document.text` safely with text nodes/escaped substrings, map interactions to smallest explainable semantic node, and never inject manifest source via raw `innerHTML`.
- Phase 5 planning noted `modern-web-guidance` returned useful accessibility/layout guidance but warned its local skill metadata is slightly out of date; upgrade the skill later if deeper UI guidance is needed.
- Updated `docs/agents/roles/coordinator.md` to improve whole-team coordination: Product Manager should be used heavily as MVP/product-scope guardian, Core Engineer should review headless/shared API and UI-consumed core/application concerns, and default phase workflow now includes planning/review gates by role.
- Staff Engineer and QA read-only reviews completed for architecture and quality through Phase 4 on branch `ai-team-workflow-experiment`; both passed with no blockers for starting Phase 5.
- Staff review confirmed PRD/HLD alignment, clean dependency direction, pure serializable contracts/snapshots, no parser-library/DOM/host leakage into shared core packages, and no diagnostics/fixes/health-score/remote/AI scope creep in implemented packages.
- QA review confirmed Phase 1–4 behavior coverage is strong across parser, semantic model, knowledge/core, and application state; QA ran `npm run test` and it passed locally (6 files, 90 tests).
- Phase 5 guardrails from reviews: keep UI MVP explainer-only despite future-facing HLD diagnostic/report/security examples; add package dependencies and TypeScript project references as soon as `ui-components`, `host-web`, and `apps/web` begin importing workspace packages; add component/interaction/accessibility tests early.
- Non-blocking follow-ups from reviews: update `fixtures/manifests/README.md` from planned to actual fixture catalog, consider removing `passWithNoTests: true`, consider lightweight automated package-boundary checks, and later remove Node ambient types from platform-independent package tsconfigs where only tests need Node.
- External-agent workflow updated to avoid hardcoding OpenCode models: use local OpenCode default unless the user selects a specific model/capacity; Big Pickle is a known user preference to offer for larger/riskier tasks, not a default flag to force.
- Updated `docs/agents/external-agents.md`, `docs/agents/external-quickstart.md`, `docs/agents/workflow.md`, `AGENTS.md`, and this memory file with the model-selection/native-delegation policy.
- Phase 4 implementation completed by external OpenCode agents on branch `ai-team-workflow-experiment` and accepted after coordinator synthesis plus Staff Engineer, Code Reviewer, and QA re-reviews.
- Added headless `@mvviewer/application` state/reducer/selectors for snapshot readiness, hover preview, pinned selection, active-node selection, click/tap selection, focus, and deterministic wrapped keyboard navigation over explainable semantic nodes.
- `packages/application` depends only on `@mvviewer/contracts`; package metadata and TypeScript project reference match.
- Phase 4 review fix completed: `node/focus`, `node/hover`, and `node/select` reject unknown/non-navigable IDs by requiring both `snapshot.semantic.nodes` membership and an explanation entry in `snapshot.explanationsByNodeId`.
- Phase 4 tests now cover focus validation, orphan explanation IDs, hover/pin/restore behavior, touch via select, clear selection, keyboard navigation/wrapping, serializability, and absence of diagnostics/fixes/health-score concepts.
- Phase 4 validation passed locally: `npm run typecheck`, `npm run test` (6 files, 90 tests), and `npm run build`.
- No DOM/UI/host integration, diagnostics, fixes, health scores, remote behavior, or AI-generated behavior were introduced.
- Non-blocking follow-up: `getActiveNodeId` trusts reducer-maintained focused-node invariants for arbitrary externally constructed state; acceptable for Phase 4, but future rehydration hardening may defensively validate focused IDs.
- External-agent workflow improved to reduce token bloat and back-and-forth: added compact onboarding `docs/agents/external-quickstart.md`, self-review template `docs/agents/templates/external-self-review.md`, known-traps guidance in task briefs, and report/self-review requirements.
- Future coordinators should use small task briefs plus known traps, one external implementation/fix run at a time by default, internal sub-agents for parallel read-only review, and one narrow external fix run only when review finds blockers.
- Updated `docs/agents/external-agents.md`, `docs/agents/workflow.md`, `docs/agents/templates/task-brief.md`, `docs/agents/templates/agent-report.md`, and `AGENTS.md` to codify this policy.
- Phase 3 implementation completed by external OpenCode agents on branch `ai-team-workflow-experiment` and accepted after coordinator synthesis plus specialist re-review.
- Added serializable explanation contracts in `packages/contracts`, a static UI-independent knowledge registry/resolver in `packages/knowledge`, and a headless `analyzeManifest` core facade in `packages/core` that composes parser → semantic mapper → explanation resolver.
- Phase 3 boundary fix completed: `packages/knowledge` resolves only `Readonly<Record<SemanticNodeId, Explanation>>`; `packages/core` constructs `AnalysisSnapshot` using the real `parseSnapshot` and `semanticSnapshot`.
- Phase 3 review fixes completed: no `as never` remains, unknown host-permission fallback is reachable and covered by tests, explanation copy was neutralized away from advisory/risk/security-audit framing, and unused `@mvviewer/manifest-domain` dependency/reference was removed from `packages/knowledge`.
- Phase 3 validation passed locally: `npm run typecheck`, `npm run test` (5 files, 50 tests), and `npm run build`.
- Phase 3 specialist reviews passed after fixes: Staff Engineer package-boundary/architecture re-review passed, Code Reviewer re-review passed, and QA re-review passed.
- Important follow-up: `packages/core/tsconfig.json` currently includes Node ambient types for fixture-reading tests; acceptable for now because production core remains headless, but consider moving fixture-heavy integration tests to root `tests/` or a test-specific tsconfig later.
- Phase 3 planning completed for Explanation Knowledge and Resolver.
- Created `docs/journey/phase3.md` as the implementation guide.
- Created external-agent-ready task brief `docs/agents/tasks/active/phase3-explanation-knowledge-resolver.md`.
- Phase 3 scope confirmed: serializable explanation contracts, UI-independent knowledge registry, resolver strategy/fallbacks, initial PRD-required explanation pack, and core engine composition from source → parse → semantic → explanations.
- Phase 3 primary packages: `packages/contracts`, `packages/knowledge`, and `packages/core`.
- Package direction confirmed: `knowledge -> contracts, manifest-domain`; `core -> contracts, parser-json, manifest-domain, knowledge`.
- Phase 3 excludes UI interaction, validation/diagnostics, fixes, health scores, compatibility matrices, remote analysis, and AI-generated explanations.
- Specialist planning completed: Product Manager, Staff Engineer, and QA Engineer provided scope, architecture, and test-plan guidance.
- User clarified coordinator boundary: coordinator must orchestrate/manage/instruct only, not directly implement product code, write tests, or perform low-level coding tasks.
- User clarified current Zed ACP reality: external ACP agents can be configured through `agent_servers` such as `opencode acp`, but a running Zed agent thread does not currently have a tool-callable way to spawn/use that configured ACP agent and await a result.
- External-agent workaround recorded: use `opencode run --pure "<prompt>"` with a strong prompt envelope.
- External-agent delegation philosophy recorded: use clear phase guides/task briefs so either the user or external agents can implement; favor external agents for low-effort coding, unit tests, fixtures, targeted fixes, mechanical refactors, and validation reports while coordinator retains quality control.
- Two-layer workflow recorded: direct `opencode run --pure` for small/review tasks; task brief in `docs/agents/tasks/active/` plus report/stdout synthesis for non-trivial work.
- User preference recorded: implementation/test-writing/fix tasks should be delegated to specialized/external agents, preferably `opencode run --pure` for now.
- User preference recorded: do not use Lavish for reports or UI artifacts; Lavish is reserved only for debugging/testing if explicitly requested.
- Updated `docs/agents/external-agents.md` documenting external-agent policy, coordinator boundary, Zed ACP limitation, and OpenCode workaround.
- Completed Phase 1 Source-Aware Parser Foundation and Phase 2 Semantic Manifest Model on branch `ai-team-workflow-experiment`.
- Implemented parser contracts and `@mvviewer/parser-json` source-aware JSON parser using `jsonc-parser` behind the parser boundary.
- Phase 1 parser preserves source text, produces serializable syntax snapshots, deterministic syntax node IDs, key/value/object/array/item ranges and paths, parse errors for invalid JSON, JSON-only errors for comments/trailing commas, partial recovery where practical, and range-index lookup for smallest containing nodes.
- Implemented Phase 2 semantic manifest mapping in `@mvviewer/manifest-domain`, depending only on `@mvviewer/contracts`.
- Phase 2 semantic mapper produces serializable semantic manifest snapshots with manifest version detection, known top-level fields, unknown/custom fields, permissions, host permissions, content scripts, breadcrumbs, normalized paths, and parent-child references.
- Added realistic parser/domain fixtures under `fixtures/manifests/`.
- Added parser unit tests, semantic unit tests, and root parser-to-semantic integration tests under `tests/` so production package dependency direction remains intact.
- Added `docs/journey/phase2.md` documenting Phase 2 outcome, scope, preserved boundaries, validation, and follow-ups.
- Validation passed: `npm run typecheck`, `npm run test` (3 files, 25 tests), and `npm run build`.
- Specialist reviews passed: QA blockers resolved; architecture/package-boundary review passed; code review approved after memory update.
- Architecture review confirmed no parser-library leakage, `parser-json` depends only on contracts/jsonc-parser, `manifest-domain` depends only on contracts, TypeScript references match workspace imports, and no explanation/diagnostics/fix/validation/health-score/UI scope creep was found.
- Next phase is Phase 3: explanation knowledge and resolver.
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
