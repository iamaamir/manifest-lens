# Phase 3 Guide — Explanation Knowledge and Resolver

Phase 3 makes source-linked semantic manifest nodes explainable.

The goal is a headless, local-first explanation pipeline:

```text
SourceDocument
→ ParseSnapshot
→ SemanticManifestSnapshot
→ ExplanationSnapshot / AnalysisSnapshot
```

Phase 3 is still **not UI work**. It creates explanation content, registry/resolver behavior, and core engine composition only.

## Coordinator Note

The coordinator must not directly implement this phase.

Implementation and test-writing should be done by:

- the user, or
- an external implementation agent such as OpenCode using `opencode run --pure`, following `docs/agents/external-agents.md`.

Use the task brief:

```text
docs/agents/tasks/active/phase3-explanation-knowledge-resolver.md
```

## Phase 3 Outcome

Given a manifest source document, the headless core should return a serializable snapshot containing semantic nodes with resolved explanations.

By the end of Phase 3:

- explanation contracts exist in `packages/contracts`
- local static knowledge registry exists in `packages/knowledge`
- resolver strategy maps `SemanticNode` → explanation content
- unknown fields/values produce graceful fallback explanations
- `packages/core` composes parser → semantic mapper → explanation resolver
- fixture-driven tests prove explanations resolve for common manifest concepts
- no UI, validation diagnostics, fixes, health scores, worker behavior, host integration, or AI-generated explanations are added

## Primary Packages

Expected write scope:

- `packages/contracts`
- `packages/knowledge`
- `packages/core`
- `fixtures/manifests` only if a targeted fixture gap is found
- root `tests/` only for cross-package integration tests if needed

Expected package dependency direction:

```text
knowledge -> contracts, manifest-domain
core      -> contracts, parser-json, manifest-domain, knowledge
```

Do not introduce reverse dependencies.

## In Scope

### Contracts

Add serializable, UI-independent explanation contracts such as:

- `ExplanationId`
- `Explanation`
- `ExplanationSource`
- `FallbackExplanationReason`
- `DocumentationLink`
- `ManifestExample`
- `ExplanationSnapshot` or `AnalysisSnapshot`
- optional `AnalyzeManifestRequest` / `AnalysisOptions`

Contracts must remain plain immutable data:

- no functions
- no classes
- no DOM types
- no `Map` / `Set`
- no external library types
- no cycles

### Knowledge registry

Add a local, static, UI-independent knowledge registry in `packages/knowledge`.

It should include explanation entries for:

- known top-level fields
- known permissions
- host permissions
- content script concepts
- unknown fallback cases

Use boring patterns:

- registry for knowledge packs
- strategy chain for resolver matching
- fallback/null-object pattern for unknowns

Avoid service-class sprawl and over-abstracted plugin systems.

### Resolver

Implement a pure resolver that maps semantic nodes to explanations.

Recommended resolver order:

1. value-specific semantic match
   - e.g. `permission` value `tabs`
2. normalized path match
   - e.g. `content_scripts[].matches`
3. known field match
   - e.g. `permissions`
4. semantic kind match
   - e.g. `hostPermission`
5. fallback explanation

Keep named intermediate values for debugging.

### Core engine composition

Add a small headless core facade in `packages/core`.

Expected composition:

```text
parseJsonDocument(document)
buildSemanticManifestSnapshot(parseSnapshot)
resolve explanations for semantic nodes
return explanation-aware snapshot
```

The core package may depend on:

- `@manifest-lens/contracts`
- `@manifest-lens/parser-json`
- `@manifest-lens/manifest-domain`
- `@manifest-lens/knowledge`

## Out of Scope

Do not implement:

- explanation panel UI
- hover/click/pin interaction
- keyboard/touch behavior
- Web Components
- validation diagnostics
- severity levels
- fix suggestions
- health scores
- compatibility matrix
- worker execution
- host integration
- browser extension / VS Code extension
- remote docs fetching
- AI-generated explanations
- generated schema pipeline

## Must-Have Explanation Coverage

### Manifest identity fields

- `manifest_version`
- `name`
- `version`
- `description`
- `icons`

### Permissions

Section:

- `permissions`

Individual permissions:

- `tabs`
- `activeTab`
- `storage`
- `scripting`

Tone rule:

- explain what the permission means
- do not grade risk
- do not recommend removal
- do not emit validation or security audit language

### Host permissions

- `host_permissions`
- host permission items such as:
  - `https://example.com/*`
  - `https://*.example.org/*`
  - `<all_urls>`

Explain URL match pattern concepts without validating patterns or scoring risk.

### Content scripts

- `content_scripts`
- `content_scripts[]`
- `content_scripts[].matches`
- `content_scripts[].matches[]`
- `content_scripts[].js`
- `content_scripts[].js[]`
- `content_scripts[].css`
- `content_scripts[].css[]`
- `content_scripts[].run_at`
- `content_scripts[].all_frames`

### Background and browser UI entry points

- `background`
- `background.service_worker`
- `background.scripts`
- `action`
- `browser_action`
- `page_action`

### Settings and commands

- `options_ui`
- `options_ui.page`
- `options_ui.open_in_tab`
- `commands`
- command nested fields where supported by semantic paths

### Web accessible resources, CSP, DNR

- `web_accessible_resources`
- `web_accessible_resources[].resources`
- `web_accessible_resources[].matches`
- `content_security_policy`
- `declarative_net_request`
- `declarative_net_request.rule_resources`

### Unknown fallbacks

Must support graceful fallbacks for:

- unknown top-level field
- unknown nested field
- unknown permission value
- unknown host permission pattern
- unknown semantic node/value

Fallbacks should say the field/value is selectable, but manifest-lens does not yet have a specific explanation for it.

## Docs Link Policy

Explanation content may include official documentation links as static metadata.

Prefer official docs:

- Chrome Extension Manifest reference
- MDN WebExtensions manifest reference
- Chrome permissions reference
- MDN permissions reference
- Chrome match patterns reference
- MDN match patterns reference
- Chrome content scripts reference
- MDN content scripts reference

Rules:

- no network request is required to resolve explanations
- docs links are plain serializable data
- external navigation behavior belongs to future UI/host phases

## Suggested Contract Shape

Implementation agent may adjust names if the concepts remain stable.

```ts
export type ExplanationId = Brand<string, "ExplanationId">;

export interface DocumentationLink {
  readonly label: string;
  readonly url: string;
}

export interface ManifestExample {
  readonly title: string;
  readonly code: string;
  readonly summary?: string;
}

export type FallbackExplanationReason =
  | "unknown-field"
  | "unknown-permission"
  | "unknown-host-permission"
  | "unknown-node-kind";

export type ExplanationSource =
  | { readonly kind: "knowledge"; readonly packId: string }
  | { readonly kind: "fallback"; readonly reason: FallbackExplanationReason };

export interface Explanation {
  readonly id: ExplanationId;
  readonly title: string;
  readonly summary: string;
  readonly details: readonly string[];
  readonly relatedFields: readonly string[];
  readonly examples: readonly ManifestExample[];
  readonly docsLinks: readonly DocumentationLink[];
  readonly source: ExplanationSource;
}
```

Possible snapshot shape:

```ts
export interface AnalysisSnapshot {
  readonly document: SourceDocument;
  readonly parse: ParseSnapshot;
  readonly semantic: SemanticManifestSnapshot;
  readonly explanationsByNodeId: Readonly<Record<SemanticNodeId, Explanation>>;
}
```

Avoid adding diagnostics to this snapshot in Phase 3.

## Suggested Implementation Sequence

1. Add explanation contracts in `packages/contracts`.
2. Update `packages/knowledge/package.json` and `tsconfig.json` references.
3. Implement static knowledge entries for required fields and permissions.
4. Implement resolver strategy and fallback explanations in `packages/knowledge`.
5. Add knowledge resolver tests.
6. Update `packages/core/package.json` and `tsconfig.json` references.
7. Implement core pipeline facade.
8. Add core fixture-driven integration tests.
9. Run validation.
10. Return implementation report with proposed memory update.

## Required Tests

### Knowledge tests

Suggested location:

```text
packages/knowledge/src/index.test.ts
```

Required coverage:

- explanation entries expose required metadata
- registry is serializable
- all required top-level fields are registered
- required permissions are registered
- resolver prefers specific permission value over generic `permissions[]`
- known permissions resolve distinct explanations:
  - `tabs`
  - `activeTab`
  - `storage`
  - `scripting`
- `host_permissions[]` values resolve to host-permission explanation
- content script paths resolve:
  - `content_scripts`
  - `content_scripts[].matches`
  - `content_scripts[].js`
  - `content_scripts[].css`
- unknown top-level and nested fields fallback gracefully
- unknown permission values fallback gracefully
- resolver output is deterministic

### Core integration tests

Suggested location:

```text
packages/core/src/index.test.ts
```

or root integration tests if package direction is easier to preserve.

Required coverage:

- `minimal-mv3.json` produces explanation snapshot
- `full-common-mv3.json` resolves all common top-level fields
- `permissions.json` resolves known permission values
- `host-permissions.json` resolves host permission items
- `nested-content-scripts.json` resolves content script fields/items
- `unknown-custom-fields.json` produces fallback explanations
- `partial-invalid.json` still resolves recovered semantic nodes where possible
- snapshot round-trips through `JSON.stringify` / `JSON.parse`
- snapshot contains no diagnostics/fixes/health score concepts

## Validation

Implementation agent must run:

```sh
npm run typecheck
npm run test
npm run build
```

Recommended tighter loop during implementation:

```sh
npm run test -- packages/knowledge/src/index.test.ts
npm run test -- packages/core/src/index.test.ts
```

## Architecture Review Checklist

Before accepting Phase 3:

- [ ] `contracts` has no internal package imports
- [ ] `knowledge` imports only allowed packages
- [ ] `core` imports only allowed packages
- [ ] package `tsconfig.json` references match workspace imports
- [ ] explanation snapshots are serializable
- [ ] no parser-library types leak
- [ ] no DOM/UI types leak into contracts/core/knowledge
- [ ] no validation diagnostics/fixes/health scores added
- [ ] unknown fallback works
- [ ] official docs links are static metadata only

## Product Review Checklist

- [ ] explanations use neutral educational language
- [ ] permissions are explained, not risk-scored
- [ ] host permissions are explained, not audited
- [ ] unknown fields clearly communicate limited coverage without feeling broken
- [ ] content remains local/static
- [ ] no AI-generated or remote explanations

## External Agent Instructions

For OpenCode or another external implementation agent:

```text
You are an external implementation agent for manifest-lens Phase 3.
Read docs/journey/memory.md, AGENTS.md, docs/architecture/coding-style.md, docs/agents/external-agents.md, docs/journey/phase3.md, docs/PRD.md, and docs/roadmap-v1.md.
Implement only Phase 3: Explanation Knowledge and Resolver.
Do not implement UI, validation diagnostics, fixes, health scores, worker/host integration, remote analysis, or AI-generated explanations.
Use the write scope and acceptance criteria from docs/agents/tasks/active/phase3-explanation-knowledge-resolver.md.
Run npm run typecheck, npm run test, and npm run build.
Return a structured report with files changed, validation results, risks/follow-ups, and proposed memory update.
```

## Completion Criteria

Phase 3 is complete when:

- implementation report exists from user or external implementation agent
- code review passes
- QA review passes
- validation passes
- `docs/journey/memory.md` records completion and validation
- changes are committed on the active branch
