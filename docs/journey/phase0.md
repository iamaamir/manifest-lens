# Phase 0 Guide — Repository and Architecture Foundation

Phase 0 is setup only. Do not implement parser, analyzer, explanations, or UI behavior yet.

The goal is to create a skeleton that matches the HLD package architecture while staying focused on the PRD's explainer-first MVP.

## Phase 0 Outcome

By the end of this phase, the repository should have:

- npm workspace structure.
- strict TypeScript baseline.
- package directories matching HLD boundaries.
- placeholder public entry files.
- app shell directory for the future web app.
- fixture and test directories.
- scripts for `typecheck`, `test`, and `build`.
- enough README/package metadata to make each package's responsibility clear.

## Recommended Stack for Setup

Use these defaults unless you have a strong reason not to:

- Package manager: npm workspaces.
- Language: TypeScript.
- Unit test runner: Vitest.
- Web app build tool: Vite, added when `apps/web` begins real UI work.
- UI primitive: Web Components, no React/Vue/Svelte dependency for shared UI.

Why npm workspaces now:

- Current repo already has a root `package.json`.
- It keeps setup simple.
- It is enough for TypeScript project references and package boundaries.

## Target Directory Structure

Create this structure:

```text
manifest-lens/
  apps/
    web/
      src/
        main.ts
      package.json
      tsconfig.json
      index.html
  packages/
    contracts/
      src/
        index.ts
      package.json
      tsconfig.json
    parser-json/
      src/
        index.ts
      package.json
      tsconfig.json
    manifest-domain/
      src/
        index.ts
      package.json
      tsconfig.json
    knowledge/
      src/
        index.ts
      package.json
      tsconfig.json
    core/
      src/
        index.ts
      package.json
      tsconfig.json
    application/
      src/
        index.ts
      package.json
      tsconfig.json
    engine-worker/
      src/
        index.ts
      package.json
      tsconfig.json
    ui-components/
      src/
        index.ts
      package.json
      tsconfig.json
    host-web/
      src/
        index.ts
      package.json
      tsconfig.json
  fixtures/
    manifests/
      README.md
  docs/
    journey/
      memory.md
      phase0.md
  tsconfig.base.json
  tsconfig.json
  package.json
```

## Step 1 — Update Root `package.json`

Change root `package.json` toward this shape:

```json
{
  "name": "manifest-lens",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b --pretty",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

Notes:

- `private: true` prevents accidental publishing of the workspace root.
- `type: module` aligns with HLD's modern ESM direction.
- Use `npm install` after editing.

## Step 2 — Add TypeScript Configs

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useDefineForClassFields": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true
  }
}
```

Create root `tsconfig.json` with project references:

```json
{
  "files": [],
  "references": [
    { "path": "packages/contracts" },
    { "path": "packages/parser-json" },
    { "path": "packages/manifest-domain" },
    { "path": "packages/knowledge" },
    { "path": "packages/core" },
    { "path": "packages/application" },
    { "path": "packages/engine-worker" },
    { "path": "packages/ui-components" },
    { "path": "packages/host-web" },
    { "path": "apps/web" }
  ]
}
```

## Step 3 — Create Package Skeletons

For each package under `packages/*`, create:

```text
package.json
tsconfig.json
src/index.ts
```

Use this `tsconfig.json` shape:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
```

Use this package JSON pattern, changing the package name:

```json
{
  "name": "@manifest-lens/contracts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

For now, each `src/index.ts` can contain only a placeholder export, for example:

```ts
export const packageName = "@manifest-lens/contracts";
```

This is intentionally boring. The point is to validate package wiring before behavior.

## Step 4 — Add App Shell

Create `apps/web` with:

```text
apps/web/
  index.html
  package.json
  tsconfig.json
  src/main.ts
```

Suggested `apps/web/package.json`:

```json
{
  "name": "@manifest-lens/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@manifest-lens/host-web": "0.0.0",
    "@manifest-lens/ui-components": "0.0.0"
  },
  "devDependencies": {
    "vite": "latest"
  }
}
```

Suggested `apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "src",
    "outDir": "dist",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*.ts"]
}
```

Suggested `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Manifest Explainer</title>
  </head>
  <body>
    <main id="app"></main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Suggested `src/main.ts`:

```ts
const app = document.querySelector<HTMLElement>("#app");

if (app) {
  app.textContent = "Manifest Explainer setup ready.";
}
```

## Step 5 — Add Fixtures Directory

Create:

```text
fixtures/manifests/README.md
```

Suggested content:

```md
# Manifest Fixtures

Realistic manifests used by parser, semantic, explanation, and UI tests.

Planned fixtures:

- minimal MV3 manifest
- permissions
- host permissions
- content scripts
- background service worker
- web-accessible resources
- unknown/custom fields
- partial/invalid manifest
```

Do not add fixtures yet unless you want to prepare for Phase 1.

## Step 6 — Install Dependencies

Run:

```sh
npm install
```

This should create/update `package-lock.json` and install TypeScript/Vitest/Vite.

## Step 7 — Validate Setup

Run:

```sh
npm run typecheck
npm run test
```

Expected Phase 0 behavior:

- `typecheck` should pass.
- `test` may report no tests depending on Vitest config/version. If Vitest exits non-zero for no tests, we can add a tiny smoke test or configure pass-with-no-tests in the next update.

## Import Boundary Rules for Later

Do not enforce these with tooling yet unless you want extra setup, but keep them in mind:

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

## What Not To Do in Phase 0

Avoid:

- Implementing JSON parsing.
- Designing all domain types in detail.
- Writing explanation content.
- Building UI components.
- Adding diagnostics or validation.
- Adding worker support.
- Adding VS Code/browser extension/CLI code.
- Over-optimizing package tooling.

## Suggested Workflow

1. Create directories and placeholder files.
2. Edit root configs.
3. Install dependencies.
4. Run typecheck.
5. If stuck, ask the agent with the exact error output.
6. After Phase 0 passes, ask for a Phase 0 review.

## Phase 0 Review Checklist

Before moving to Phase 1, confirm:

- [ ] Root `package.json` uses workspaces.
- [ ] Root TypeScript project references every package/app.
- [ ] Every package has `package.json`, `tsconfig.json`, and `src/index.ts`.
- [ ] Package names use `@manifest-lens/*`.
- [ ] `apps/web` exists and can be built or typechecked.
- [ ] `fixtures/manifests/README.md` exists.
- [ ] `npm run typecheck` passes or the failure is understood.
- [ ] `docs/journey/memory.md` current phase/status is updated.

## When You Come Back

Tell me one of these:

- "Phase 0 files are created; review them."
- "I hit this error: ..."
- "Please implement Phase 0 for me."
- "Generate Phase 1 guide."
