# Phase 1 Guide — Source-Aware Parser Foundation

Phase 1 builds the first real foundation: parse manifest source text into a serializable syntax tree with stable source ranges.

Do not implement manifest explanations, semantic manifest concepts, UI behavior, diagnostics, or validation yet. This phase is only about preserving source text and mapping JSON structure to source ranges.

## Phase 1 Outcome

By the end of this phase, given manifest source text, `packages/parser-json` should produce a `ParseSnapshot` that contains:

- the original `SourceDocument`
- a root syntax node
- syntax nodes for objects, arrays, properties, keys, values, and array items
- stable node IDs
- source ranges for meaningful regions
- parse errors when input is invalid or incomplete
- a range index helper for finding the smallest syntax node at a character offset

This is the foundation for later hover/click explanations.

## Phase 1 Coding Style Decision

Use a pragmatic functional TypeScript style for parser/core work.

Preferred:

- pure functions for transformations
- immutable serializable objects
- `readonly` contracts
- discriminated unions/ADTs for variants
- exhaustive `switch` handling with `never`
- named intermediate values that are easy to log/debug
- deterministic IDs where practical

Avoid:

- heavy FP libraries
- point-free or pipe-heavy code
- clever currying
- deep generic abstractions
- monad/typeclass jargon
- forcing DOM/host-style imperative code into artificial FP shapes

Debugging rule:

Prefer this style:

```ts
const parseTree = parseJsonTree(document);
const syntaxRoot = buildSyntaxTree(parseTree, document);
const errors = mapParseErrors(parseTree.errors, document);
```

Over this style:

```ts
const snapshot = pipe(document, parseJsonTree, buildSyntaxTree, attachErrors);
```

The project principle is:

> Pragmatic FP + ADTs + simple DSA when needed + boring design patterns at boundaries.

In Phase 1, this means parser outputs should be ADT-shaped/plain data, but the adapter around `jsonc-parser` can be straightforward and imperative internally if that is clearer.

Use these patterns only where they simplify the parser foundation:

- Adapter: convert `jsonc-parser` nodes/errors into our serializable contracts.
- Function-based traversal: walk/convert parser trees without class-heavy visitor ceremony.
- Facade: expose a simple `parseJsonDocument(document)` entry point over internal helper steps.
- Small index helper: expose `createSourceRangeIndex(snapshot)` without leaking internal lookup details.

Avoid service-class sprawl, inheritance hierarchies, singletons, event buses, and abstract factories in Phase 1.

## Phase Boundary

### In scope

- Core parser contracts in `packages/contracts`
- JSON parser implementation in `packages/parser-json`
- Source range model
- Syntax node model
- Parse snapshot model
- Range index helper
- Parser unit tests
- Initial parser fixtures

### Out of scope

- Manifest-specific semantic nodes
- Manifest version detection
- Permissions knowledge
- Explanation content
- UI rendering
- Hover/click behavior
- Validation severity/diagnostics
- Fixes
- Worker execution

## Parser Scope Decision

Phase 1 supports **JSON only**.

Do not add JSONC product support yet. Browser extension manifests are normally `manifest.json`, and the PRD's initial release does not require comments or trailing commas. JSONC can be added later behind the same parser boundary if a future VS Code/editor workflow needs it.

Recommended implementation library is still `jsonc-parser`, but only as a source-aware JSON parser utility.

Why use `jsonc-parser` while supporting JSON only:

- It handles normal JSON.
- It exposes offsets, lengths, node types, and parse errors.
- It lets us preserve original source rather than reserializing JSON.
- It avoids spending Phase 1 writing a custom source-aware parser.

Phase 1 behavior rule:

- Accept standard JSON manifests.
- Do not document JSONC as supported.
- Do not add JSONC fixtures.
- Do not add tests for comments/trailing commas unless they assert unsupported behavior.

Install:

```sh
npm install jsonc-parser
```

Add it as a dependency of `@mvviewer/parser-json` in `packages/parser-json/package.json`, or rely on npm workspace root installation if you prefer first-pass simplicity. Prefer package-local dependency for clearer ownership.

## Step 1 — Define Contracts

Edit `packages/contracts/src/index.ts`.

Start with minimal but durable contracts. Keep them serializable: plain objects, arrays, strings, numbers, booleans, nulls. No class instances, Maps, Sets, functions, DOM objects, or parser-library objects in snapshots.

Suggested first contract set:

```ts
export type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type DocumentId = Brand<string, "DocumentId">;
export type SyntaxNodeId = Brand<string, "SyntaxNodeId">;

export type SourceLanguage = "json";

export interface SourceDocument {
  readonly id: DocumentId;
  readonly language: SourceLanguage;
  readonly text: string;
}

export interface SourcePosition {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

export interface SourceRange {
  readonly start: SourcePosition;
  readonly end: SourcePosition;
}

export interface SyntaxNodeBase {
  readonly id: SyntaxNodeId;
  readonly range: SourceRange;
  readonly path: readonly string[];
}

export type SyntaxNode =
  | (SyntaxNodeBase & {
      readonly kind: "document";
      readonly children: readonly SyntaxNode[];
    })
  | (SyntaxNodeBase & {
      readonly kind: "object";
      readonly children: readonly SyntaxNode[];
    })
  | (SyntaxNodeBase & {
      readonly kind: "array";
      readonly children: readonly SyntaxNode[];
    })
  | (SyntaxNodeBase & {
      readonly kind: "property";
      readonly keyRange: SourceRange;
      readonly valueRange?: SourceRange;
      readonly children: readonly SyntaxNode[];
    })
  | (SyntaxNodeBase & {
      readonly kind: "string";
      readonly value?: string;
    })
  | (SyntaxNodeBase & {
      readonly kind: "number";
      readonly value?: number;
    })
  | (SyntaxNodeBase & {
      readonly kind: "boolean";
      readonly value?: boolean;
    })
  | (SyntaxNodeBase & {
      readonly kind: "null";
    })
  | (SyntaxNodeBase & {
      readonly kind: "unknown";
      readonly children?: readonly SyntaxNode[];
    });

export interface ParseError {
  readonly message: string;
  readonly range: SourceRange;
}

export interface ParseSnapshot {
  readonly document: SourceDocument;
  readonly root: SyntaxNode;
  readonly errors: readonly ParseError[];
}

export interface SourceParser {
  parse(document: SourceDocument): ParseSnapshot;
}
```

Notes:

- The HLD separates syntax and semantic nodes. Keep this file syntax-only for Phase 1.
- `SyntaxNode` is intentionally an ADT/discriminated union rather than one loose interface full of optional fields.
- `path` is a JSON path-like list of property names or array indexes as strings. Example: `permissions`, `0`.
- `keyRange` and `valueRange` are useful for future source interaction.
- If exact contract names differ later, that is fine; preserve the concepts.

## Step 2 — Add Parser Package Dependency

Edit `packages/parser-json/package.json` to include:

```json
"dependencies": {
  "@mvviewer/contracts": "0.0.0",
  "jsonc-parser": "latest"
}
```

Because this package now imports `contracts`, also update `packages/parser-json/tsconfig.json` with a project reference:

```json
"references": [
  { "path": "../contracts" }
]
```

Keep this rule in mind: once a package imports another workspace package, its `tsconfig.json` should reference it.

## Step 3 — Implement Offset-to-Position Helpers

In `packages/parser-json/src/index.ts`, create helper functions before the parser logic:

- `createDocumentId`
- `createSyntaxNodeId`
- `rangeFromOffsetLength`
- `positionAtOffset`

For Phase 1, stable IDs can be deterministic from path/kind/start offset.

Example ID shape:

```text
syntax:/permissions/0:string:42
```

Guidance:

- `line` and `column` should be zero-based or one-based, but choose once and document it.
- Recommended: zero-based line/column because offsets are zero-based and many editor APIs use zero-based positions.
- Always include `offset`; later UI can rely on offsets first.

## Step 4 — Implement JSON Parser Entry Point

Prefer a simple function as the primary API:

```ts
export function parseJsonDocument(document: SourceDocument): ParseSnapshot {
  // parse using jsonc-parser
}
```

If you still want to satisfy the `SourceParser` interface, keep the class as a thin adapter around the function:

```ts
export class JsonSourceParser implements SourceParser {
  parse(document: SourceDocument): ParseSnapshot {
    return parseJsonDocument(document);
  }
}
```

This preserves the functional core while still allowing adapter-style use where useful.

Use `jsonc-parser` APIs conceptually like:

```ts
import { parseTree, type Node as JsonNode, type ParseError as JsonParseError } from "jsonc-parser";
```

Implementation responsibilities:

1. Call `parseTree(document.text, errors, options)`.
2. Convert the parser tree into your serializable `SyntaxNode` tree.
3. Convert parser errors into serializable `ParseError[]`.
4. If parsing fails completely, still return a root `document` or `unknown` node covering the available source.

Important:

- Do not return `jsonc-parser` nodes directly.
- Do not parse into JS objects using `JSON.parse`.
- Do not reserialize or format the source.

## Step 5 — Node Mapping Rules

Map parser node types to your `SyntaxNodeKind`.

Suggested mapping:

| jsonc-parser node type | Syntax kind |
|---|---|
| `object` | `object` |
| `array` | `array` |
| `property` | `property` |
| `string` | `string` |
| `number` | `number` |
| `boolean` | `boolean` |
| `null` | `null` |
| anything else | `unknown` |

For object properties:

- create a `property` node for the full property range
- include `keyRange` for the property key
- include `valueRange` for the property value
- path should append the property name
- children should include key/value or nested value structure based on your chosen representation

Keep it simple:

- It is okay if the `property` node is selectable and contains the value node as a child.
- Later Phase 2 can decide whether semantic nodes attach to property nodes, value nodes, or both.

For arrays:

- array children should use string indexes in path: `"0"`, `"1"`, etc.
- permission strings later need precise ranges for each array item.

## Step 6 — Implement Range Index Helper

Add a small helper to find the smallest syntax node containing an offset.

Possible contract:

```ts
export interface SourceRangeIndex {
  findSmallestContaining(offset: number): SyntaxNode | undefined;
}

export function createSourceRangeIndex(snapshot: ParseSnapshot): SourceRangeIndex;
```

Implementation idea:

- flatten syntax nodes into a list
- filter nodes where `start.offset <= offset && offset < end.offset`
- choose the smallest range length

This does not need to be highly optimized in Phase 1. Normal manifests are small.

## Step 7 — Add Fixtures

Create initial fixture files under `fixtures/manifests`:

```text
minimal-mv3.json
permissions.json
nested-content-scripts.json
partial-invalid.json
```

Suggested `minimal-mv3.json`:

```json
{
  "manifest_version": 3,
  "name": "Example Extension",
  "version": "1.0.0"
}
```

Suggested `permissions.json`:

```json
{
  "manifest_version": 3,
  "name": "Permission Example",
  "version": "1.0.0",
  "permissions": ["tabs", "storage", "activeTab"]
}
```

Suggested `nested-content-scripts.json`:

```json
{
  "manifest_version": 3,
  "name": "Content Script Example",
  "version": "1.0.0",
  "content_scripts": [
    {
      "matches": ["https://example.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

Suggested `partial-invalid.json`:

```json
{
  "manifest_version": 3,
  "name": "Broken Example",
  "permissions": ["tabs",
}
```

## Step 8 — Add Parser Tests

Create tests close to the parser package, for example:

```text
packages/parser-json/src/index.test.ts
```

Test behavior, not implementation details.

Suggested tests:

1. Parses minimal manifest without errors.
2. Root node covers the full source range.
3. Top-level fields have property nodes with paths:
   - `manifest_version`
   - `name`
   - `version`
4. Permission array items are represented with paths:
   - `permissions`, `0`
   - `permissions`, `1`
   - `permissions`, `2`
5. Nested content script fields have paths like:
   - `content_scripts`, `0`, `matches`
   - `content_scripts`, `0`, `js`
   - `content_scripts`, `0`, `run_at`
6. Range index returns the string node for an offset inside `"tabs"`.
7. Partial invalid manifest returns parse errors and does not throw.
8. Snapshot can round-trip through `JSON.stringify`/`JSON.parse`.

## Step 9 — Validate

Run:

```sh
npm run typecheck
npm run test
npm run build
```

Expected:

- Typecheck passes.
- Parser tests pass.
- Build passes.

If a package import fails, check:

- package dependency in `package.json`
- `tsconfig.json` project reference
- exported symbols from `packages/contracts/src/index.ts`

## Design Checks Before Moving On

Confirm:

- [ ] Source text is preserved in `ParseSnapshot.document.text`.
- [ ] Syntax tree is serializable.
- [ ] Nodes have stable IDs.
- [ ] Nodes have source ranges with offsets.
- [ ] Object properties have useful paths.
- [ ] Array items have useful index paths.
- [ ] Invalid input returns errors instead of crashing.
- [ ] Range index can find the smallest node at an offset.
- [ ] No manifest-specific explanation/domain logic has leaked into parser code.

## Common Mistakes to Avoid

### Mistake: Using `JSON.parse`

`JSON.parse` loses source ranges and formatting. Do not use it for parser snapshots.

### Mistake: Making parser nodes too semantic

Do not create `permission`, `background`, or `contentScript` node kinds in Phase 1. Those belong in Phase 2 semantic mapping.

### Mistake: Returning library nodes directly

The output must be serializable and independent from `jsonc-parser` internals.

### Mistake: Overbuilding JSONPath

A simple `readonly string[]` path is enough for now.

### Mistake: Perfect invalid parsing

Graceful error capture is enough. Do not spend too long making partial AST recovery perfect in Phase 1.

## Suggested Learning Path

Before coding, skim these HLD sections:

- 8.1 Source document
- 8.2 Source range
- 8.3 Syntax node
- 9.3 Processing pipeline
- 10 Source Parsing and Mapping
- 26.1 Parser tests

Then implement in this order:

1. Contracts.
2. Parser package dependency/reference.
3. Offset/range helpers.
4. Parser tree conversion.
5. Range index.
6. Fixtures.
7. Tests.
8. Validation.

## When You Come Back

Tell me one of these:

- "Phase 1 parser is done; review it."
- "I need help designing the contracts."
- "I hit this TypeScript error: ..."
- "I hit this parser behavior issue: ..."
- "Please implement Phase 1 with me step by step."
