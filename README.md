# Manifest Lens

> Hover your manifest. Understand every field.




https://github.com/user-attachments/assets/645f609b-69b3-4f46-8ca0-5336f4801485




Manifest Lens is a local-first web explainer for browser extension `manifest.json` files. Paste, upload, or drop a manifest and explore a source-backed semantic tree with contextual explanations for fields, sections, permissions, host access, content scripts, background configuration, and other common extension concepts.

The first release is intentionally an explainer, not a linter or publishing-readiness checker. It focuses on helping developers understand what a manifest means directly in context.

## What it does

- Preserves the original manifest source as the backing text.
- Parses JSON into a source-aware syntax tree.
- Maps source ranges to semantic manifest nodes.
- Shows plain-language explanations for common manifest fields and permission values.
- Lets users hover, click, tap, or use the keyboard to select explainable nodes.
- Keeps unknown/custom fields selectable with a graceful fallback explanation.
- Runs locally in the browser without a required backend.

## Current scope

Manifest Lens currently targets the local web MVP:

```text
paste/drop manifest
→ local analysis
→ source-backed semantic tree
→ contextual explanation panel
→ hover/click/tap/keyboard interaction
```

Out of scope for the initial release: complete schema validation, diagnostics, health scores, automatic fixes, compatibility reports, CLI, VS Code extension, browser-extension packaging, cloud sync, and AI-generated explanations.

## Repository structure

```text
apps/web                 Vite web app host
packages/contracts       Shared serializable contracts
packages/parser-json     Source-aware JSON parser
packages/manifest-domain Semantic manifest model
packages/knowledge       Explanation knowledge registry
packages/core            Headless analysis pipeline
packages/application     DOM-free interaction/state helpers
packages/ui-components   Web Components UI
packages/host-web        Browser host adapters
fixtures/manifests       Test and demo manifest fixtures
docs                     Product, architecture, journey, and review docs
```

The architecture keeps the core engine platform-independent and isolates browser/UI behavior behind host packages.

## Getting started

### Prerequisites

- Node.js
- npm

### Install

```sh
npm install
```

### Run the web app in development

```sh
npm run dev --workspace=@manifest-lens/web
```

Then open the local Vite URL printed by the command.

### Build

```sh
npm run build
npm run build --workspace=@manifest-lens/web
```

### Local production preview

```sh
npm run local:preview
```

This builds the web app and serves `apps/web/dist`.

## Validation

```sh
npm run typecheck
npm run test
npm run build
npm run build --workspace=@manifest-lens/web
npm run e2e
```

The e2e suite uses Playwright. If browsers are not installed yet, run:

```sh
npx playwright install chromium
```

## Design principles

- Explainer-first, not diagnostics-first.
- Source preservation over JSON reserialization.
- Functional core, imperative shell.
- Serializable immutable snapshots.
- Ports and adapters for platform boundaries.
- Web Components for portable UI.
- Clear package boundaries and TypeScript project references.

## Documentation

Start with:

- `docs/PRD.md`
- `web-extension-manifest-inspector-hld.md`
- `docs/roadmap-v1.md`
- `docs/architecture/coding-style.md`
- `docs/journey/memory.md`

## License

No license file has been added yet.
