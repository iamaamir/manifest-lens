# Contributing to mvviewer

Thanks for contributing. This project is intentionally architecture-driven, but not ceremony-driven.

Before significant work, read:

1. `docs/journey/memory.md`
2. `docs/architecture/coding-style.md`
3. active `docs/journey/phaseN.md`
4. `docs/roadmap-v1.md`
5. `docs/PRD.md` as needed
6. `web-extension-manifest-inspector-hld.md` as needed

## Product Focus

Initial MVP is a local-first Web Extension Manifest Explainer.

North star:

> Hover your manifest. Understand every field.

The initial product is not primarily a validator, fixer, report generator, CLI, VS Code extension, or browser extension package.

## Coding Style

Guiding style:

> Pragmatic FP + ADTs + simple DSA when needed + boring design patterns at boundaries.

See `docs/architecture/coding-style.md` for details.

In short:

- use pure functions in core/domain/application logic
- model variants with discriminated unions/ADTs
- keep snapshots immutable and serializable
- isolate side effects in hosts, adapters, UI shells, and worker boundaries
- hide external library types behind adapters
- use simple data structures first
- use design patterns only when they reduce complexity

## Package Boundaries

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

Do not introduce reverse dependencies.

If a package imports another workspace package, update its TypeScript project references.

## Memory Updates

Update `docs/journey/memory.md` when your change creates durable project knowledge, such as:

- phase completion/status
- architecture decisions
- dependency choices
- validation results
- important blockers
- user/contributor workflow decisions

Keep memory concise. Do not append noisy logs.

## Tests and Validation

Before asking for review, run the most relevant commands:

```sh
npm run typecheck
npm run test
npm run build
```

Add or update tests when behavior changes.

Tests should focus on behavior and boundaries rather than private implementation details.

## Pull/Review Checklist

Use this checklist before review:

- [ ] I read `docs/architecture/coding-style.md`.
- [ ] I stayed within the active phase scope or documented why not.
- [ ] I touched the correct package/layer.
- [ ] I preserved package dependency direction.
- [ ] I added TypeScript project references for new workspace imports.
- [ ] I kept public snapshots serializable.
- [ ] I modeled variants with ADTs/discriminated unions where appropriate.
- [ ] I avoided service-class sprawl and pattern ceremony.
- [ ] I avoided advanced DSA unless justified.
- [ ] I hid external library types behind adapters.
- [ ] I added/updated behavior tests where needed.
- [ ] I ran relevant validation and recorded results.
- [ ] I updated `docs/journey/memory.md` if durable state changed.

## Dependency Checklist

Before adding a dependency:

- [ ] It is needed for the current phase.
- [ ] It reduces complexity or risk.
- [ ] It does not compromise local-first/privacy goals.
- [ ] It can stay behind an adapter if external types are unstable or irrelevant to contracts.
- [ ] It does not force a UI framework into shared UI components.
- [ ] It is compatible with the current TypeScript/build setup.

## AI Coordinator Boundary

In coordinator-led workflows, the coordinator plans, delegates, reviews, synthesizes, updates memory/docs, and commits when appropriate.

The coordinator should not directly implement product code, write tests, or perform low-level fixes. Agent-led implementation should be delegated to specialist/external agents, preferably `opencode` via ACP or another verified external-agent mechanism once configured.

Do not use Lavish to create project reports or UI artifacts. Lavish is reserved only for debugging/testing if explicitly requested.

## Review Mindset

Prefer simple, explicit, debuggable code.

Do not block useful progress for theoretical purity. Do block changes that blur architecture boundaries, leak external library types into contracts, or make the MVP harder to understand and test.
