# Repository Structure


## Goals

The structure is designed to:

- make package boundaries visible early;
- support strict TypeScript project references;
- keep core manifest logic independent from browser/UI hosts;
- allow the explainer-first MVP to grow without later restructuring;
- keep future platform targets possible, such as workers, browser extensions, VS Code, CLI, or desktop shells.

## Top-Level Layout

```text
mvviewer/
  apps/
    web/
  packages/
    contracts/
    parser-json/
    manifest-domain/
    knowledge/
    core/
    application/
    engine-worker/
    ui-components/
    host-web/
  fixtures/
    manifests/
  docs/
  package.json
  package-lock.json
  tsconfig.base.json
  tsconfig.json
  vitest.config.ts
```

## Why npm Workspaces

The project uses npm workspaces because:

- the repository already started with a root `package.json`;
- npm workspaces are enough for local package linking;
- they work well with TypeScript project references;
- they avoid adding extra package-manager complexity during setup.

Workspace packages are declared in root `package.json`:

```json
"workspaces": [
  "packages/*",
  "apps/*"
]
```

## TypeScript Configuration

### `tsconfig.base.json`

Shared strict compiler options live in `tsconfig.base.json`.

Important choices:

- `strict: true` keeps type safety high from the start.
- `noUncheckedIndexedAccess: true` prevents accidental unsafe indexed reads.
- `exactOptionalPropertyTypes: true` makes optional fields more precise.
- `isolatedModules: true` and `verbatimModuleSyntax: true` keep ESM behavior explicit and bundler-friendly.
- `declaration: true` prepares packages to expose typed public surfaces.

### `tsconfig.json`

The root `tsconfig.json` contains only project references. It does not compile source directly.

This lets `tsc -b` build packages as separate TypeScript projects and catch broken boundaries as the codebase grows.

## Applications

### `apps/web`

The web app is the first host application for the Manifest Explainer.

```text
apps/web/
  index.html
  package.json
  tsconfig.json
  src/
    main.ts
```

For Phase 0, it is only a shell. It proves that the app can exist as a workspace package and can later import from `@mvviewer/host-web` and `@mvviewer/ui-components`.

Vite is listed in this package because it will be the web app build/dev tool when real UI work begins.

## Packages

Every package currently has the same basic shape:

```text
package-name/
  package.json
  tsconfig.json
  src/
    index.ts
```

Each package has a placeholder public entrypoint so TypeScript and workspace wiring can be validated before behavior is added.

### `packages/contracts`

Shared public contracts and serializable types.

This package should stay low-level and stable. Other packages can depend on it, but it should not depend on internal packages.

### `packages/parser-json`

Future source-aware JSON parsing package.

It will eventually turn manifest text into parsed structures with source locations. In Phase 0 it contains no parser implementation.

### `packages/manifest-domain`

Future manifest domain model package.

It will eventually represent manifest concepts in product/domain language, separate from raw JSON parsing details.

### `packages/knowledge`

Future explanation knowledge registry.

It will eventually contain field descriptions, explanation metadata, and knowledge lookup behavior. Keeping this separate from rendering allows explanations to be reused across hosts.

### `packages/core`

Future headless engine package.

This should become the functional core that coordinates parsing, domain mapping, and knowledge lookup without depending on browser or UI APIs.

### `packages/application`

Future application orchestration package.

This layer should coordinate user-facing workflows and use cases on top of `core`, while still avoiding direct DOM/browser coupling.

### `packages/engine-worker`

Future worker adapter package.

Worker support is intentionally deferred, but this package reserves the boundary so the engine can later move off the main thread without reshaping the repository.

### `packages/ui-components`

Future shared Web Components package.

The project uses Web Components for shared UI primitives instead of React/Vue/Svelte dependencies, so components can remain portable across hosts.

### `packages/host-web`

Future browser/web host adapter package.

This package should contain web-specific integration code and host capabilities, keeping platform details outside the core engine.

## Fixtures

### `fixtures/manifests`

Manifest fixtures will live here once parser, semantic, explanation, and UI tests begin.

No real fixtures are added in Phase 0 because this phase is only about repository and architecture setup.

## Intended Import Direction

These boundaries are not enforced by tooling yet, but future code should follow this direction:

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

The main idea is that stable data contracts sit at the bottom, the headless engine stays independent from UI/platform details, and app hosts depend inward rather than core packages depending outward.

## Commands

Run commands from the repository root.

### Install dependencies

```sh
npm install
```

Installs root and workspace dependencies and updates `package-lock.json`.

### Typecheck

```sh
npm run typecheck
```

Runs TypeScript build mode with pretty output:

```sh
tsc -b --pretty
```

Use this during development to verify project references and strict typing.

### Build

```sh
npm run build
```

Runs:

```sh
tsc -b
```

This validates the TypeScript project graph and emits package build outputs according to each package `tsconfig.json`.

### Test

```sh
npm run test
```

Runs Vitest once:

```sh
vitest run
```

Phase 0 has no test files yet. `vitest.config.ts` sets `passWithNoTests: true` so the empty skeleton still validates cleanly.

### Watch tests

```sh
npm run test:watch
```

Runs Vitest in watch mode for later development phases.

### Web app development

When UI work begins, run:

```sh
npm run dev --workspace @mvviewer/web
```

This starts the Vite dev server for `apps/web`.

### Web app build

```sh
npm run build --workspace @mvviewer/web
```

This runs the Vite production build for the web app package.

## Phase 0 Non-Goals

Do not add these during Phase 0:

- JSON parser behavior;
- manifest validation;
- explanation content;
- UI components;
- worker behavior;
- CLI/browser extension/VS Code integration;
- import-boundary lint tooling.

Those belong to later phases once the skeleton is reviewed and accepted.

## Linking from README Later

When the root `README.md` is created, link to this guide with:

```md
- [Repository Structure](docs/repository-structure.md)
```
