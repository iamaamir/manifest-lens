# Task Brief — Phase 5 Design-Led UI Reset

## Context

Phase 5 functionality is implemented and validated, but the user rejected the UI quality twice.

User feedback:

- Current UI looks like AI slop.
- UX has many bugs and poor structure.
- Need professional design leadership before more frontend implementation.
- External agents should be set aside for frontend/UI work.
- Use internal specialist team:
  - Product Designer with Jony-Ive-like design discipline;
  - E2E/UX QA specialist;
  - Manifest/domain specialist who understands `manifest.json` deeply;
  - Frontend Engineer.
- User added `design.md`, which should now drive the UI direction.

North star remains:

> Hover your manifest. Understand every field.

## Source of Truth

Read first:

1. `docs/journey/memory.md`
2. `design.md`
3. `docs/PRD.md`
4. `docs/journey/phase5.md`
5. `docs/reviews/phase5-completion-report.md`
6. `docs/architecture/coding-style.md`
7. current UI files:
   - `apps/web/index.html`
   - `apps/web/src/main.ts`
   - `packages/ui-components/src/index.ts`
   - `packages/host-web/src/index.ts`

## Goal

Create a design-led remediation plan before further implementation.

The output should define a professional UI/UX target based on `design.md`, identify what is wrong with the current UI, decide what parts of `design.md` are MVP-critical vs later, and produce frontend implementation slices with E2E acceptance criteria.

## Roles

### Product Designer

Act like a high-discipline product designer: restrained, exacting, tactile, minimal, and focused on the human moment of understanding.

Do not imitate a living person literally. Use the design qualities requested by the user: high craft, precision, restraint, and strong product taste.

Responsibilities:

- Translate `design.md` into a concrete UI structure.
- Identify current visual/UX failures.
- Define the target screen hierarchy and interaction feel.
- Decide which design-spec details are MVP-critical vs later.
- Provide exact implementation guidance, not vague taste words.

### Manifest UX / Domain Specialist

Responsibilities:

- Ensure the UI structure fits real `manifest.json` reading workflows.
- Identify the most important manifest concepts for initial display:
  - `manifest_version`
  - `name`
  - `version`
  - `permissions`
  - `host_permissions`
  - `content_scripts`
  - `background`
  - `action`
  - `web_accessible_resources`
  - unknown/custom fields.
- Ensure explanation hierarchy matches developer intent.
- Prevent drifting into diagnostics, scoring, fixes, security audit, or compatibility matrix.

### E2E / UX QA Specialist

Responsibilities:

- Convert the target UX into testable journeys.
- Define manual and automated acceptance checks.
- Catch UX bugs such as unreachable drop targets, misleading empty states, broken hover/pin/keyboard behavior, cramped layouts, poor focus, or source highlight noise.
- Propose E2E test strategy without adding tooling unless accepted later.

### Frontend Engineer

Responsibilities:

- Assess implementation feasibility within current architecture.
- Produce implementation slices.
- Keep `apps/web` thin, `host-web` as browser adapter, `ui-components` as component renderer, and behavior in `application` where pure selectors are needed.
- Identify risks in source segmentation, ARIA, syntax coloring, line numbers, and dark theme implementation.

## Design Direction

`design.md` now supersedes the current light/generic UI direction.

Target concept:

> The Observatory: a near-black precision instrument for inspecting a manifest.

Important direction from `design.md`:

- dark near-black canvas, not generic light SaaS UI;
- sticky compact header;
- source/tree pane and explanation pane are the product, not a form above a card;
- input/drop state lives naturally in the inspector experience;
- JSON tree must feel like code: monospace, line numbers, syntax coloring, indentation, precise row states;
- explanation panel must feel like prose: humanist sans, calm hierarchy, field-name chip, concise definition, details, docs/examples where available;
- hover/focus/pin states must be clear but quiet;
- no noisy boxes around punctuation/whitespace;
- no diagnostics/fixes/health/report/audit scope creep.

## Planning Output Required

Each specialist should return concise findings.

The coordinator will synthesize into a single plan with:

1. UI diagnosis: why current UI fails.
2. Target experience: final user journey.
3. MVP-critical design decisions from `design.md`.
4. Deferred design details from `design.md`.
5. Screen structure and component map.
6. Source rendering/highlighting strategy.
7. Accessibility strategy.
8. E2E/UX acceptance criteria.
9. Implementation slices with write scopes.
10. Validation/review plan.
11. Proposed `docs/journey/memory.md` update.

## Non-Goals

Do not implement yet.

Do not add:

- diagnostics UI;
- fixes/quick fixes;
- health scores;
- security audit;
- permission risk scoring;
- compatibility matrix;
- report export;
- AI-generated explanations;
- backend/remote analysis;
- worker mode;
- browser extension, VS Code extension, CLI, desktop host.

## Constraints

- Preserve existing working Phase 5 behavior until explicitly replaced.
- No raw manifest `innerHTML`.
- Local-first only.
- Strict package boundaries.
- Accessibility is not optional.
- Prefer internal specialists for UI/frontend work.
- External low-effort agents may still be used later for non-UI mechanical tasks only if user allows.
