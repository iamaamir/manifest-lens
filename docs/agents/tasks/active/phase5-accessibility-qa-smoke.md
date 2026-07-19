# Task Brief — Phase 5 Accessibility QA Smoke

Date: 2026-07-19

## Role

E2E/UX QA Engineer with Frontend Expert review.

## Goal

Run a focused accessibility smoke review after keyboard-accessible tree controls are implemented.

## In Scope

Verify:

- header controls have accessible names;
- Upload is the only keyboard tab stop for file import;
- source/tree region instructions are understandable;
- keyboard navigation, pin, clear, disclosure, and `+N more` are operable without pointer;
- focus is always visible;
- active field changes are understandable to assistive tech as far as automated/manual smoke can verify;
- no positive `tabindex`;
- reduced motion has no global hacks and no layout animation reliance.

Optional if dependency is already available or explicitly approved:

- automated axe/accessibility scan.

## Out of Scope

- Broad UI redesign.
- New product features.
- Diagnostics/fixes/scores/reports.

## Write Scope

Prefer read-only report first. If tests are assigned:

- `tests/e2e/*.test.ts`
- `tests/e2e/helpers.ts`

## Acceptance Criteria

- Clear pass/fail findings with P0/P1/P2 severity.
- Repro steps for failures.
- Proposed follow-up tasks for fixes.
- Validation command/results if tests are added or run.

## Validation

At minimum:

```sh
npm run e2e
```

If tests are added:

```sh
npm run test
npm run e2e
```
