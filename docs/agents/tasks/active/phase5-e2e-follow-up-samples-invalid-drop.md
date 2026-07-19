# Task Brief — Phase 5 E2E Follow-up: Sample and Invalid File Drop

Date: 2026-07-19

## Role

E2E/UX QA Engineer.

## Goal

Close PM/E2E P2 coverage gaps with focused Playwright tests. Do not change product behavior unless a test exposes a real blocker and coordinator assigns a separate fix.

## In Scope

Add E2E coverage for:

- desktop header `Load sample` click loads a sample manifest;
- mobile in-pane sample link click loads a sample manifest;
- invalid JSON dropped as a `File` shows the same error-card path;
- invalid JSON file drop after a valid pinned manifest clears stale source/explanation/pin state;
- optional: unsupported file-picker upload if feasible in Playwright.

## Out of Scope

- UI redesign.
- Product copy changes.
- Partial-invalid recovery implementation.
- Diagnostics/fixes/scores/reports/AI/remote behavior.

## Write Scope

- `tests/e2e/helpers.ts`
- `tests/e2e/upload-and-dragdrop.test.ts`
- optionally a new focused `tests/e2e/sample-and-invalid-file.test.ts`

Do not edit product code unless coordinator creates a separate implementation task.

## Acceptance Criteria

- Tests fail if sample controls stop loading a manifest.
- Tests fail if invalid JSON file drop leaves stale source/explanation/pin state visible.
- Tests use existing fixtures/helpers where possible.
- `npm run e2e` passes.

## Validation

```sh
npm run e2e
npm run test
```

Report exact results and any proposed product-code fixes separately.
