# Roadmap v1 — Web Extension Manifest Explainer

This roadmap translates the HLD architecture into an explainer-first implementation plan from `docs/PRD.md`.

The HLD remains the architectural source of truth for structure, portability, extensibility, package boundaries, and host strategy. The PRD overrides delivery priority: the initial release is an interactive local-first explainer, not a validator or diagnostics product.

## North Star

> Hover your manifest. Understand every field.

A user should be able to paste or import a browser extension manifest, interact with its preserved source text, and get clear explanations for fields, sections, permissions, host permissions, and common nested structures.

## Architectural Constraints

Keep these constraints throughout all phases:

- TypeScript-first, strict mode.
- Platform-independent headless core.
- Ports/adapters boundaries.
- Source text is preserved; do not reserialize JSON for display.
- Parser, domain model, knowledge, application state, and UI stay separate.
- Core outputs are immutable and serializable.
- Web Components are the shared UI primitive.
- Direct in-browser engine is enough for initial release; workers remain an extension point.
- Validation, diagnostics, fixes, reports, scores, CLI, VS Code, and browser-extension packaging are future work unless explicitly pulled in later.

## Phase 0 — Repository and Architecture Foundation

Goal: create the project skeleton only. No product behavior yet.

Deliverables:

- Workspace/package setup.
- TypeScript configuration.
- Package directories from the HLD.
- App shell directory.
- Test/fixture directories.
- Journey docs and memory process.
- Placeholder entry files that make boundaries visible without implementing logic.

Exit criteria:

- The repo structure clearly reflects HLD package boundaries.
- `package.json` scripts exist for typecheck/test/build, even if implementation is minimal.
- No cross-package implementation dependencies violate the planned direction.
- `docs/journey/phase0.md` can guide a human through setup.

## Phase 1 — Source-Aware Parser Foundation

Goal: parse manifest source while preserving ranges.

Primary packages:

- `packages/contracts`
- `packages/parser-json`

Deliverables:

- `SourceDocument`, `SourceRange`, `SyntaxNode`, and `ParseSnapshot` contracts.
- JSON parser contract and initial TypeScript implementation.
- Range index utility for finding the smallest syntax node at an offset.
- Support for objects, arrays, properties, primitive values, and array items.
- Graceful partial/error representation where practical.
- Golden parser fixtures.

Tests:

- Ranges map to top-level keys.
- Ranges map to nested keys/values.
- Ranges map to permission strings inside arrays.
- Original source text remains unchanged.
- Invalid/partial manifest does not crash the parser.

Exit criteria:

- Given source text, we can produce a serializable parse snapshot with stable node IDs and source ranges.

## Phase 2 — Semantic Manifest Model

Goal: turn syntax into meaningful manifest concepts.

Primary packages:

- `packages/manifest-domain`
- `packages/contracts`

Deliverables:

- `SemanticNode` model aligned with the HLD but tuned for explanation-first use.
- Manifest version detection.
- Semantic mapping for:
  - `manifest_version`
  - `name`
  - `version`
  - `description`
  - `permissions`
  - `host_permissions`
  - `content_scripts`
  - `background`
  - `action`, `browser_action`, `page_action`
  - `icons`
  - `commands`
  - `options_ui`
  - `web_accessible_resources`
  - `content_security_policy`
  - `declarative_net_request`
  - unknown/custom fields
- Breadcrumb/path generation.

Tests:

- Common fields become expected semantic nodes.
- Permission array items become selectable semantic nodes.
- Host permission patterns become selectable semantic nodes.
- Unknown fields remain selectable and identifiable.

Exit criteria:

- Given a parse snapshot, we can produce semantic nodes that match explainable regions in the source.

## Phase 3 — Explanation Knowledge and Resolver

Goal: resolve semantic nodes into explanation content.

Primary packages:

- `packages/knowledge`
- `packages/core`

Deliverables:

- Explanation content model with title, summary, details, related fields, examples, and docs links.
- Knowledge registry independent of UI.
- Resolver strategy for field paths, section kinds, permission values, host permissions, and unknown fields.
- Initial explanation pack for PRD-required fields and common permissions.
- `AnalysisSnapshot` or `ExplanationSnapshot` produced by the core engine.

Tests:

- Known top-level fields resolve to expected explanation metadata.
- `tabs`, `activeTab`, `storage`, and `scripting` resolve to specific permission explanations.
- Unknown fields produce fallback explanations.
- Snapshot is serializable.

Exit criteria:

- Given manifest source, the headless engine returns source-linked semantic nodes with explanations.

## Phase 4 — Application State and Interaction Model

Goal: model hover preview, click pinning, keyboard selection, and touch selection without UI-specific coupling.

Primary packages:

- `packages/application`
- `packages/contracts`

Deliverables:

- `InspectorState` for source, snapshot, hovered node, pinned node, active node, loading/error state.
- Actions/reducer or equivalent state transition module.
- Effective active node rule:
  - hover previews if present,
  - otherwise pinned node,
  - otherwise default/root explanation.
- Keyboard navigation order over explainable nodes.

Tests:

- Hover previews explanation.
- Click pins explanation.
- Hover leave restores pinned explanation.
- Keyboard next/previous moves through semantic nodes.
- Touch/tap selection can use the same selection action.

Exit criteria:

- Interaction behavior is testable without rendering Web Components.

## Phase 5 — Web Components UI MVP

Goal: ship the first usable local web explainer UI.

Primary packages:

- `packages/ui-components`
- `packages/host-web`
- `apps/web`

Deliverables:

- `<manifest-inspector>` root component.
- `<manifest-source-view>` preserving original source formatting.
- `<manifest-explanation-panel>` showing active explanation.
- Split-view layout.
- Paste/import flow.
- Drag-and-drop `manifest.json` flow.
- Hover, click, keyboard, and touch interaction wired to state.
- Source highlight synchronized with explanation panel.
- Basic responsive layout.
- Accessibility pass for keyboard/focus/non-hover access.

Tests:

- Component tests for source/explanation synchronization.
- Interaction tests for hover/pin/restore.
- Keyboard interaction tests.
- Basic accessibility checks.

Exit criteria:

- A user can inspect a realistic manifest locally in the browser and understand common fields.

## Phase 6 — Fixtures, Quality, and Privacy Hardening

Goal: make the MVP reliable against realistic manifests.

Primary packages:

- all MVP packages
- `fixtures/`

Deliverables:

- Realistic fixtures:
  - minimal MV3 manifest
  - permissions
  - host permissions
  - content scripts
  - background service worker
  - web-accessible resources
  - unknown/custom fields
  - partial/invalid manifest
- Performance sanity checks for normal extension manifests.
- Privacy test/assertion that no manifest content is sent to a remote endpoint.
- Better empty/loading/error states.
- Documentation for local-first behavior.

Exit criteria:

- MVP behavior is covered by fixture-driven tests and remains local-only.

## Phase 7 — Optional Worker Boundary

Goal: prove the serializable architecture can move analysis off the UI thread if needed.

Primary packages:

- `packages/engine-worker`
- `packages/core`

Deliverables:

- Typed message protocol skeleton.
- Worker-backed engine adapter.
- Contract tests comparing direct engine and worker engine output.
- Feature flag or host capability to choose direct vs worker execution.

Exit criteria:

- Worker mode is available without changing UI or domain code.

## Phase 8 — Post-MVP Extension Points

Goal: prepare for future capabilities after the explainer proves useful.

Potential tracks:

- Diagnostics/validation layer.
- Browser compatibility hints.
- VS Code host.
- Browser extension host.
- Embeddable widget packaging.
- CLI.
- Schema/knowledge generation pipeline.
- Optional WebAssembly parser implementation.

These should not be started until the explainer MVP is usable and validated.

## Phase Ownership Pattern

For each phase, create or update:

- `docs/journey/phaseN.md` — human implementation guide.
- `docs/journey/memory.md` — durable state, decisions, current phase, completed work, next actions.
- Tests/fixtures relevant to that phase.

Use sub-agents for:

- Architecture reviews.
- Test-plan review.
- UX/accessibility review.
- Boundary/import-rule review.
- Docs/memory consistency review.

Keep the main agent context lean by recording durable state in `docs/journey/memory.md` after each major decision or completed phase.
