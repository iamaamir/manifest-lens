# Phase 2 Guide and Completion Note — Semantic Manifest Model

Phase 2 turns source-aware JSON syntax into manifest-aware semantic nodes.

This phase has been implemented on branch `ai-team-workflow-experiment` as part of the Phase 1 + Phase 2 completion task.

## Phase 2 Outcome

Given a `ParseSnapshot`, `packages/manifest-domain` now produces a serializable `SemanticManifestSnapshot` with:

- root manifest semantic node
- source-linked semantic nodes
- manifest version detection
- known top-level manifest fields
- unknown/custom fields preserved as selectable nodes
- permission item nodes
- host permission item nodes
- content script object/field/value nodes
- normalized paths
- breadcrumbs
- parent/child references

## Packages Touched

- `packages/contracts`
  - semantic contracts and ADTs
- `packages/manifest-domain`
  - pure semantic mapper
- `tests/`
  - parser-to-semantic integration tests
- `fixtures/manifests/`
  - realistic manifest fixtures

## Public API

Primary function:

```ts
buildSemanticManifestSnapshot(parseSnapshot: ParseSnapshot): SemanticManifestSnapshot
```

Useful test/helper functions:

```ts
findSemanticNodeByPath(snapshot, path)
findSemanticNodesByKind(snapshot, kind)
```

## Boundary Rules Preserved

`packages/manifest-domain` depends only on `@manifest-lens/contracts`.

It does not import:

- `@manifest-lens/parser-json`
- `jsonc-parser`
- knowledge/explanation packages
- UI packages
- host packages

Parser-to-domain integration is tested from root `tests/` so production package dependency direction remains intact.

## In Scope Implemented

- `DetectedManifestVersion`
  - MV2
  - MV3
  - missing
  - invalid
- common top-level fields:
  - `manifest_version`
  - `name`
  - `version`
  - `description`
  - `permissions`
  - `host_permissions`
  - `content_scripts`
  - `background`
  - `action`
  - `browser_action`
  - `page_action`
  - `icons`
  - `commands`
  - `options_ui`
  - `web_accessible_resources`
  - `content_security_policy`
  - `declarative_net_request`
- permission array items
- host permission array items
- content script objects
- content script `matches`, `js`, and `css` item nodes
- unknown/custom fields
- breadcrumbs and normalized paths
- serializable semantic snapshots

## Explicitly Out of Scope

Not implemented in Phase 2:

- explanation text
- knowledge registry
- docs links
- validation diagnostics
- severity levels
- fixes
- health scoring
- UI behavior
- worker execution
- host integration

These belong to later roadmap phases.

## Validation

Validation commands run after implementation:

```sh
npm run typecheck
npm run test
npm run build
```

Final results are recorded in `docs/journey/memory.md` and the final HTML report.

## Follow-ups

Potential later improvements:

- derive `knownTopLevelFields` from one exported manifest field list to avoid drift
- split test-specific Node ambient types from production package tsconfigs
- remove `passWithNoTests` from Vitest once all packages have tests
- tighten content-script path classification if deeper nested edge cases need it
- expand fixtures in Phase 6 quality hardening
