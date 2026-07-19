# UI Design Loop — Observatory Phase 5

This document defines the design-led loop for Phase 5 UI work.

## Purpose

The UI must stop drifting into generic AI-generated SaaS output. `design.md` is the fixed design source of truth for **The Observatory**: a near-black precision instrument for understanding a manifest field at the moment of hover, focus, or selection.

The loop exists to turn that design direction into implementation evidence:

```text
Product Designer
→ Frontend Engineer implementation
→ E2E/UX QA with Playwright
→ screenshots/artifact feedback
→ Product Designer review
→ repeat
```

## Roles

| Role | Loop responsibility |
|---|---|
| Coordinator | Owns scope, task briefs, synthesis, quality gates, memory/docs, commits |
| Product Designer | Reviews screenshots/current UI against `design.md`; gives precise bounded instructions |
| Manifest UX Domain Specialist | Ensures manifest semantics and explanation copy remain correct, neutral, and explainer-first |
| Frontend Engineer | Implements the designer-approved slice in Web Components/app shell with accessibility preserved |
| E2E/UX QA Engineer | Writes/runs headless Playwright tests, captures screenshots/traces, reports UX regressions |
| Staff/Code/Frontend reviewers | Optional read-only reviews for architecture, implementation quality, and accessibility |

## Hard Boundaries

- `design.md` is canonical. Do not invent a new visual/product direction.
- Initial release remains explainer-first and local-first.
- Do not add diagnostics UI, fixes, health scores, security audits, compatibility matrices, reports, AI-generated explanations, backends, remote analysis, new hosts, or worker mode unless explicitly scoped later.
- Do not use Lavish for reports or UI artifacts in this project.
- Screenshot artifacts support review; they do not become design authority.

## Standard Iteration

### 1. Designer review

Inputs:

- `design.md`
- latest UI/screenshots
- latest E2E findings
- relevant task brief or review report

Output:

- verdict against `design.md`
- priority-ordered issues
- exact implementation instructions
- explicit non-goals
- screenshot states E2E should preserve or add

### 2. Coordinator task brief

The coordinator turns designer instructions into a narrow task brief under:

```text
docs/agents/tasks/active/
```

The brief must include:

- assigned role
- write scope
- in/out of scope
- acceptance criteria
- known traps
- validation commands
- self-review/reporting requirements

### 3. Frontend implementation

Implementation may be done by a Frontend Engineer specialist or external OpenCode when the task is clear enough.

OpenCode is allowed again for Phase 5 UI/E2E work because `design.md` is now explicit, but it is quality-gated:

- use the local OpenCode default unless the user selects a model/capacity;
- prefer one external implementation agent at a time;
- stop using OpenCode for UI implementation if output is broad, generic, buggy, or visually low-craft;
- continue using OpenCode for mechanical/test-heavy work when it performs well.

### 4. E2E/UX QA

E2E/UX QA uses Playwright headlessly.

Primary payload:

```text
fixtures/manifests/comprehensive-all-browsers.json
```

Coverage should emphasize:

- empty Observatory shell
- paste/upload/drop flows where implemented
- comprehensive fixture load
- left source pane visibility, scroll, line numbers, preserved source
- right explanation panel visibility, scroll, and content changes
- click, hover, focus, keyboard, touch/mobile interactions
- pin A → preview B → restore A
- invalid-after-valid clearing
- unknown/custom fallback
- local-only privacy/no manifest-content network leakage

Artifacts should include screenshots for designer review. Prefer Playwright `test-results/` and `playwright-report/` for run artifacts. Commit curated screenshots under `docs/reviews/ui-screenshots/` only when a coordinator intentionally promotes them into durable review evidence.

### 5. Coordinator synthesis

The coordinator reviews diffs/results, runs validation as appropriate, requests read-only reviews when useful, updates `docs/journey/memory.md`, and commits meaningful checkpoints on the experiment branch.

## Screenshot Set

For each meaningful UI iteration, E2E should try to capture at least:

1. empty state desktop
2. loaded comprehensive manifest near top
3. loaded comprehensive manifest scrolled to a mid/deep field
4. unknown/custom field selected
5. mobile/narrow viewport loaded state
6. failing-state screenshots when a test fails

## Quality Gate

An iteration is not accepted until:

- implementation matches the assigned slice and `design.md`;
- scope did not expand;
- typecheck/unit/build validation still passes, unless failure is explicitly unrelated and accepted;
- Playwright E2E for the assigned coverage passes or the failure is reported with actionable evidence;
- the Product Designer can review actual screenshots/artifacts when visual quality is at stake;
- memory/docs are updated for durable workflow, decisions, validations, or blockers.
