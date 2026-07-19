# Coding Style and Architecture Enforcement

This document is the canonical coding-style contract for `mvviewer`.

It applies to human contributors and agents. Phase guides may add stricter temporary rules, but they should not contradict this document.

## Guiding Principle

> Pragmatic FP + ADTs + simple DSA when needed + boring design patterns at boundaries.

Use style, patterns, and data structures to make the product easier to understand, test, debug, and extend. Do not use them for ceremony.

## Product Architecture Bias

The project is a local-first Web Extension Manifest Explainer.

The implementation should preserve the HLD architecture while prioritizing the PRD's explainer-first MVP.

Important constraints:

- The core engine is headless and platform-independent.
- Source text is preserved; do not reserialize JSON for display.
- Parser/domain/knowledge/application/UI/host responsibilities remain separate.
- Snapshots crossing package or execution boundaries are immutable and serializable.
- Platform-specific behavior is isolated behind host capabilities or adapters.

## Functional Core, Imperative Shell

Core packages should prefer pure transformations:

```text
SourceDocument
→ ParseSnapshot
→ SemanticManifestSnapshot
→ ExplanationSnapshot
→ InspectorState
```

Good:

```ts
const parseSnapshot = parseJsonDocument(document);
const semanticSnapshot = buildSemanticSnapshot(parseSnapshot);
const explanationSnapshot = resolveExplanations(semanticSnapshot, registry);
```

Avoid pipe-heavy or point-free code that makes debugging harder:

```ts
const snapshot = pipe(document, parseJsonDocument, buildSemanticSnapshot, resolveExplanations);
```

Imperative code is expected in:

- Web Components
- DOM event handling
- file input and drag/drop
- storage adapters
- worker adapters
- future VS Code/browser-extension hosts

The rule is not "no imperative code." The rule is: keep side effects in shells and adapters.

## ADTs and Discriminated Unions

Use discriminated unions for meaningful variants.

Preferred:

```ts
type SelectionState =
  | { readonly kind: "none" }
  | { readonly kind: "hovered"; readonly nodeId: SemanticNodeId }
  | { readonly kind: "pinned"; readonly nodeId: SemanticNodeId }
  | {
      readonly kind: "hoverPreview";
      readonly hoveredNodeId: SemanticNodeId;
      readonly pinnedNodeId: SemanticNodeId;
    };
```

Avoid boolean flag soup:

```ts
interface SelectionState {
  hoveredNodeId?: string;
  pinnedNodeId?: string;
  isPinned: boolean;
}
```

Use exhaustive handling for unions:

```ts
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
```

## Immutability and Serialization

Public contracts and snapshots should use:

- `readonly` object properties
- `readonly` arrays
- plain serializable data
- branded string IDs where useful

Avoid exposing these in snapshots:

- class instances
- functions
- DOM objects
- `Map`
- `Set`
- parser-library node objects
- cyclic references

Temporary internal `Map`/`Set` values are fine inside helper functions, as long as public outputs remain serializable.

## Error Modeling

Expected recoverable outcomes should be represented in data.

For parser work, prefer snapshots with errors:

```ts
interface ParseSnapshot {
  readonly document: SourceDocument;
  readonly root: SyntaxNode;
  readonly errors: readonly ParseError[];
}
```

Use a `Result` ADT only when an operation truly cannot produce a useful value.

Throw only for programmer errors or impossible states.

## Debuggability Rules

Prefer named intermediate values over clever composition.

Good:

```ts
const jsonTree = parseJsonTree(document);
const syntaxRoot = buildSyntaxTree(jsonTree.root, document);
const errors = mapParseErrors(jsonTree.errors, document);

return { document, root: syntaxRoot, errors };
```

Avoid:

```ts
return pipe(document, parseJsonTree, buildSyntaxTree, attachErrors);
```

Every major pipeline stage should produce an inspectable value that can be logged, tested, or snapshotted.

## DSA Guidance

Use data structures and algorithms pragmatically only when they directly help product clarity, correctness, or measured performance.

Prefer first:

- tree traversal
- flattened indexes
- node-by-ID maps internally
- source range containment checks
- path utilities
- reducer/state-machine transitions
- deterministic navigation order

Defer until justified:

- interval trees
- tries
- graph engines
- incremental parsing
- advanced caching
- virtualized rendering

Do not introduce advanced DSA because it is interesting. Introduce it because a simpler solution became insufficient.

## Design Pattern Guidance

Use design patterns only when they reduce complexity.

Recommended patterns:

- Ports and adapters for platform boundaries.
- Adapter around external APIs/libraries.
- Strategy for explanation resolution.
- Registry for knowledge packs.
- Reducer/state machine for interaction.
- Facade for public engine APIs.
- Fallback/null-object for unknown explanations.

Avoid unless a real need appears:

- service-class sprawl
- singletons
- event buses
- abstract factories
- inheritance-heavy hierarchies
- repository pattern
- command objects for every action

Use this test:

> This pattern reduces complexity because _____.

If the sentence cannot be completed convincingly, do not use the pattern.

## Package Boundary Rules

Intended dependency direction:

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

Rules:

- Lower-level packages must not import higher-level packages.
- UI packages must not leak DOM types into core/domain contracts.
- Parser-library types must not leak outside parser adapter packages.
- Knowledge content must not depend on UI rendering.
- Host packages adapt platform APIs; they do not define core domain behavior.

When a package imports another workspace package, add the appropriate TypeScript project reference.

## Dependency Policy

Prefer no new dependency unless it clearly reduces risk or scope.

Before adding a dependency, ask:

- Is this dependency needed for the current phase?
- Does it respect platform portability?
- Can it stay behind an adapter?
- Does it leak types into contracts?
- Is it actively maintained and compatible with the stack?

For Phase 1, `jsonc-parser` is acceptable as a source-aware JSON parser utility, while product support remains JSON-only.

## Testing Style

Tests should focus on externally observable behavior and architectural boundaries.

Examples:

- parser snapshots preserve source text
- parser snapshots are serializable
- range lookup finds the expected smallest node
- semantic mapping creates expected node kinds
- unknown fields produce fallback explanations
- hover preview and pin/restore state transitions work
- no package boundary violations

Avoid tests that overfit private implementation details.

## Agent and Human Enforcement

Contributors must read this file before significant implementation work.

Agents must:

- read `docs/journey/memory.md` first
- read the active `docs/journey/phaseN.md`
- follow this coding-style contract
- propose or apply `memory.md` updates for durable decisions
- run or request validation after changes

Humans should use `CONTRIBUTING.md` before opening/reviewing changes.

## Review Checklist

Before accepting a change, ask:

- Does it belong in the package it touches?
- Are outputs immutable and serializable where required?
- Are variants modeled as ADTs instead of optional-field blobs?
- Are side effects isolated?
- Are external library shapes hidden behind adapters?
- Is the code debuggable with named intermediate values?
- Are advanced DSA or patterns justified by current needs?
- Were relevant tests added or updated?
- Was `docs/journey/memory.md` updated if a durable decision changed?
