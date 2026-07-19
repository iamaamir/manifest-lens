# Task Brief — Phase 5 Unknown Field Value Example Panel

Date: 2026-07-19

## Role

Manifest UX Domain Specialist for copy/semantics, then Frontend Engineer if approved.

## Goal

Improve unknown/custom field explanations by showing the actual field value or source-backed example in the explanation panel when available.

This strengthens the north star “Understand every field” without turning unknown fields into diagnostics.

## In Scope

- Define product copy for unknown-field value/example display.
- Show value/example using existing source-backed data where reliable.
- Keep unknown field language neutral and explanatory.
- Add tests for unknown field panel content.

## Out of Scope

- Validation or schema checks.
- Browser compatibility claims.
- Fix suggestions.
- AI-generated explanations.
- Remote lookups.

## Suggested Write Scope After UX Approval

- `packages/ui-components/src/index.ts`
- `packages/ui-components/src/index.test.ts`
- optional DOM-free selector in `packages/application/src/index.ts` only if needed
- E2E test for unknown-field value/example if useful

## Acceptance Criteria

- Unknown/custom fields remain selectable.
- Explanation panel title/fallback remains clear.
- Actual value/example is shown when reliable without reserializing unsafely.
- No diagnostics/fixes/report language appears.
- Tests cover at least `unknown-custom-fields.json`.

## Validation

```sh
npm run typecheck
npm run test
npm run e2e
```

Report UX copy, files changed, validation, and proposed memory update.
