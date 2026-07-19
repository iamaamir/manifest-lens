# Phase 5 Guide — Web Components UI MVP

Phase 5 creates the first usable local web explainer UI.

The goal is a narrow, explainer-first vertical slice:

```text
paste/drop manifest
→ direct local analysis
→ preserved source split view
→ explanation panel
→ hover/click/tap/keyboard interaction
```

North star:

> Hover your manifest. Understand every field.

Phase 5 must remain UI MVP work. It should not become diagnostics, fixes, security audit, health score, report export, compatibility matrix, remote analysis, worker mode, browser extension, VS Code extension, CLI, or AI-generated explanations.

## Coordinator Note

The coordinator must not directly implement this phase.

Implementation and test-writing should be done by:

- the user, or
- an external implementation agent such as OpenCode using the compact external-agent workflow.

Use task briefs in:

```text
docs/agents/tasks/active/
```

For the first Phase 5 implementation slice, use:

```text
docs/agents/tasks/active/phase5-ui-mvp-slice1.md
```

External agents should read:

```text
docs/agents/external-quickstart.md
docs/agents/templates/external-self-review.md
```

Do not hardcode an OpenCode model. Use local OpenCode default unless the user selects a model/capacity.

## Planning Inputs

Phase 5 planning included Product Manager, Core Engineer, Frontend Expert, QA Engineer, and Staff Engineer read-only reviews.

Key decisions from planning:

- Product Manager: prioritize a narrow explainer vertical slice before polish.
- Core Engineer: current core/application APIs are sufficient, but Phase 5 may need small DOM-free application selectors/helpers for active node/explanation and source range lookup.
- Frontend Expert: use semantic HTML, native controls over ARIA, visible focus, no positive tabindex, responsive split layout, and event delegation.
- QA Engineer: add component/interaction/accessibility/privacy tests early.
- Staff Engineer: keep `ui-components`, `host-web`, and `apps/web` boundaries strict and add package dependencies/references as imports begin.

Modern web guidance reviewed:

- Accessibility is minimum baseline, not polish.
- Use semantic landmarks/headings.
- Prefer native controls over ARIA.
- Ensure visible `:focus-visible` styles.
- Avoid positive `tabindex`.
- Use CSS Grid/Flex for split layout.
- Use `overflow: auto`, `scrollbar-gutter: stable`, and `overscroll-behavior: contain` for panes.

Note: the `modern-web-guidance` skill reported its local metadata is slightly out of date. Upgrade later if deeper UI guidance is needed.

## Phase 5 Outcome

By the end of Phase 5, a user should be able to:

1. open the local web app;
2. paste a manifest or drop/import a `manifest.json`;
3. see a source-backed semantic tree built from the original manifest source;
4. hover an explainable region to preview an explanation;
5. click/tap a region to pin an explanation;
6. hover another region to temporarily preview and then restore pinned explanation on hover leave;
7. use keyboard navigation to move through explainable nodes and select one;
8. see source highlight and explanation panel synchronized;
9. select unknown/custom fields and see fallback explanations;
10. use the MVP without sending manifest contents to a backend.

## Primary Packages

Expected packages:

```text
ui-components -> contracts, application
host-web      -> contracts, core, application?, ui-components
apps/web      -> host-web, ui-components
```

Use `application` in `host-web` only if host code directly manipulates application state. Prefer state handling inside `<manifest-inspector>` where practical.

When any package imports a workspace package, update both:

- `package.json` dependencies
- `tsconfig.json` project references

Add DOM libs to `ui-components` and `host-web` TypeScript configs when Custom Elements/browser adapters are implemented:

```json
"lib": ["ES2022", "DOM", "DOM.Iterable"]
```

## Package Responsibilities

### `packages/ui-components`

Owns reusable Web Components and component styles.

Likely components:

- `<manifest-inspector>`
  - root UI shell;
  - owns UI-local reducer state;
  - composes source view and explanation panel;
  - consumes `AnalysisSnapshot` and application reducer/selectors;
  - exposes small MVP public API only.
- `<manifest-source-view>`
  - renders original source text;
  - maps semantic source ranges to interactive regions;
  - emits semantic-node interaction events;
  - does not call `analyzeManifest`.
- `<manifest-explanation-panel>`
  - renders active explanation title, summary, details, examples, related fields, docs links, and breadcrumb/path.
- `<manifest-split-view>`
  - responsive layout primitive if it reduces complexity.

Do not put browser file APIs, storage, workers, domain logic, diagnostics, fixes, health score, compatibility, or report export in `ui-components`.

### `packages/host-web`

Owns browser-specific local host adapters.

Likely responsibilities:

- create `SourceDocument` from pasted text/file text;
- read local files using browser APIs;
- handle drag/drop and optional file picker;
- call direct `@mvviewer/core/analyzeManifest`;
- mount/register the web inspector in a container.

Do not define manifest semantic/domain behavior here.

### `apps/web`

Owns Vite app composition only.

Likely responsibilities:

- `index.html` page shell with language, title, `<main>`, and heading;
- `src/main.ts` finds `#app` and calls a `host-web` mount function;
- no parser/domain/knowledge/state/rendering logic.

## MVP Component API Guidance

Keep public API small.

Acceptable MVP examples:

```ts
interface ManifestInspectorElement extends HTMLElement {
  snapshot: AnalysisSnapshot | null;
  loadSnapshot(snapshot: AnalysisSnapshot): void;
  clear(): void;
}
```

or a property-based equivalent.

Avoid HLD future API methods for Phase 5:

- `revealDiagnostic`
- `exportReport`
- fix APIs
- compatibility/report APIs

## Source-Backed Semantic Tree Strategy

Preserve original source in snapshots and render the visible inspector as a source-backed semantic tree. The tree may group, collapse, and truncate semantic rows for comprehension, but it must use original source ranges as backing data and must never reserialize values with `JSON.stringify` for display.

Security rule:

- Never inject manifest source with raw `innerHTML`.
- Render source using text nodes or escaped substrings.

Important complexity:

Semantic ranges overlap and nest. Examples:

- root manifest covers the whole object;
- top-level field covers a property;
- permission item covers a string inside an array.

Avoid naïvely wrapping every semantic node range if it creates invalid overlapping spans.

Recommended simple strategy:

1. Use `snapshot.document.text` as canonical source.
2. Build deterministic tree rows or source segments from explainable semantic node ranges.
3. Prefer the smallest explainable semantic node at pointer/focus offset.
4. Keep DOM stable after snapshot load.
5. On hover/focus/select, update active CSS classes and explanation panel without reparsing or reserializing.
6. Do not introduce interval trees or virtualization in Phase 5 unless measured necessary.

If the implementation needs pure helpers such as `findSmallestSemanticNodeAtOffset`, `getActiveExplanation`, or `getSourceDecorationRanges`, add them to `packages/application` as DOM-free selectors rather than duplicating logic in Web Components.

## Interaction Requirements

Use Phase 4 application state instead of inventing UI-local rules.

Required DOM mappings:

- pointer hover → `node/hover`
- pointer leave → `node/hoverEnd`
- click/tap → `node/select`
- keyboard next/previous → `node/focusNext` / `node/focusPrevious`
- Enter/Space → select focused node
- Escape → clear selection if implemented in UI using `node/clearSelection`

The UI should read active node via `getActiveNodeId` and render source highlight/explanation panel from that state.

## Accessibility Requirements

- Use semantic page structure: `<main>`, real heading hierarchy.
- Prefer native controls:
  - `<textarea>` for paste input,
  - `<button>` for actions,
  - `<input type="file" accept="application/json,.json">` for file selection if used.
- Every input/control needs a visible label or accessible name.
- Source interaction must not be hover-only.
- Provide visible `:focus-visible` styles for controls and source nodes.
- Do not use positive `tabindex`.
- Use roving focus or container-level keyboard navigation to avoid hundreds of tab stops.
- Touch/tap must select without hover.
- Color must not be the only indication of active/focused/selected state.
- Explanation changes should be perceivable after keyboard selection. Use normal focus-context updates first; only use a polite live region if necessary and not noisy.

## Layout and Styling Guidance

Use Web Components styling with CSS custom properties and parts.

Start with HLD variables and extend minimally:

```css
:host {
  --mi-color-background: ...;
  --mi-color-surface: ...;
  --mi-color-text: ...;
  --mi-color-muted: ...;
  --mi-color-border: ...;
  --mi-color-highlight: ...;
  --mi-color-focus: ...;
  --mi-font-ui: ...;
  --mi-font-code: ...;
  --mi-panel-radius: ...;
}
```

Expose useful parts, such as:

- `source-pane`
- `source-node`
- `source-node-active`
- `source-node-focused`
- `explanation-panel`
- `split-view`
- `toolbar`

Layout guidance:

- Desktop: CSS Grid split view.
- Narrow viewport: stacked source/explanation flow.
- Source view: `<pre><code>` style with `white-space: pre`.
- Panes: `overflow: auto`, `scrollbar-gutter: stable`, `overscroll-behavior: contain`.
- Avoid modals for import/errors in MVP; use inline status/empty/error states.

## Input Flow Requirements

MVP should include:

- paste flow;
- drag/drop `manifest.json` flow;
- optional file picker if low-cost.

Input copy should say local-first clearly without overclaiming:

- “Paste or drop a `manifest.json` to understand what each field does.”
- “Your manifest is processed locally in this browser.”

Invalid/partial input:

- The UI should not crash.
- Show a calm inline message if parsing has errors.
- Still render recoverable source/explanations where available.
- Do not present errors as diagnostics/report/fixes.

## Out of Scope

Do not implement:

- diagnostic list UI;
- severity diagnostics;
- fixes or quick fixes;
- health scores;
- security audit;
- permission risk scoring;
- compatibility matrix;
- exportable reports;
- remote upload/analysis;
- telemetry/analytics involving manifest contents;
- AI-generated explanations;
- worker execution;
- browser extension/VS Code/CLI/desktop hosts;
- full code editor, folding, incremental editing, persisted pane resizing, command palette.

## Recommended Slices

### Slice 1 — Package wiring and static inspector shell

Goal: real Web Components mount in the Vite app.

Deliverables:

- `ui-components` dependencies/references/libs;
- `host-web` dependencies/references/libs;
- `apps/web` references if imports begin;
- custom element registration;
- `<manifest-inspector>` shell with empty state;
- `host-web` mount helper;
- `apps/web/src/main.ts` calls mount helper.

### Slice 2 — Direct analysis and default explanation

Goal: paste/load a manifest and show preserved source plus default/root explanation.

Deliverables:

- paste input path;
- `SourceDocument` creation;
- direct `analyzeManifest` call in host layer;
- snapshot passed to inspector;
- source text rendered exactly;
- explanation panel shows active/root explanation.

### Slice 3 — Source range interaction

Goal: fulfill hover/click/tap promise.

Deliverables:

- source range mapping/decorations;
- hover preview;
- click/tap pin;
- hover leave restore;
- active source highlight;
- unknown fallback display.

### Slice 4 — Keyboard and accessibility

Goal: non-hover access is real.

Deliverables:

- keyboard next/previous;
- Enter/Space select;
- Escape clear;
- visible focus;
- labels/instructions;
- basic automated accessibility checks if test environment supports them.

### Slice 5 — Drag/drop, responsive, hardening

Goal: first usable UI MVP complete.

Deliverables:

- drag/drop `manifest.json`;
- optional file picker;
- narrow viewport layout;
- local-only privacy/network-spy tests;
- fixture-driven UI tests;
- validation and reviews.

## Required Tests

Test location depends on environment setup. Prefer package-local tests when practical:

```text
packages/ui-components/src/**/*.test.ts
packages/host-web/src/**/*.test.ts
apps/web/src/**/*.test.ts
```

A DOM-capable test environment may be required. Add the smallest suitable dev dependency only when implementation tests need it.

Required coverage:

- component renders empty/local-first prompt;
- paste valid manifest loads preserved source and explanation panel;
- drag/drop or file import loads manifest locally;
- original source text formatting is preserved;
- hover previews explanation;
- click pins explanation;
- hover leave restores pinned explanation;
- tap selects without hover;
- keyboard navigation moves through explainable nodes in semantic order;
- Enter/Space selects focused node;
- unknown/custom field fallback appears;
- partial invalid fixture does not crash UI;
- source highlight and explanation panel stay synchronized;
- controls have accessible labels/names;
- no positive `tabindex`;
- no manifest content is sent through `fetch`, `XMLHttpRequest`, `sendBeacon`, or WebSocket during paste/import/drop.

Primary fixtures:

- `minimal-mv3.json`
- `full-common-mv3.json`
- `permissions.json`
- `host-permissions.json`
- `unknown-custom-fields.json`
- `partial-invalid.json`

## Validation

Implementation agents must run:

```sh
npm run typecheck
npm run test
npm run build
```

Focused commands may be added once package/component tests exist.

## Review Gates

Before accepting Phase 5:

- Product Manager: MVP scope, copy/tone, no scope creep.
- Core Engineer: UI consumes headless APIs correctly; source range strategy does not duplicate core/domain logic.
- Frontend Expert: Web Components, accessibility, responsive layout, event wiring.
- Staff Engineer: package boundaries, dependencies/references, no architecture drift.
- QA Engineer: component/interaction/accessibility/privacy coverage.
- Code Reviewer: maintainability, casts, no clever over-engineering.

## Completion Criteria

Phase 5 is complete when:

- first usable web UI MVP exists;
- paste and drag/drop/import work locally;
- source-backed semantic tree and explanation panel are synchronized;
- hover/click/tap/keyboard interactions work;
- unknown fields in valid manifests are selectable with fallback explanations;
- invalid JSON paste/drop/upload is graceful: it does not crash, clears stale valid-manifest state, and shows the calm error-card path without diagnostics/fixes/scores/reports; recoverable partial rendering is deferred;
- tests and validation pass;
- role reviews pass;
- `docs/journey/memory.md` records completion and validation;
- changes are committed on the active branch.
