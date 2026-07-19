# Task Brief — Phase 5 Related Fields Actionability

Date: 2026-07-19

## Role

Product Manager + Frontend Expert planning first.

## Goal

Decide whether related-field pills in the explanation panel should become actionable links/buttons or be styled as clearly informational metadata.

## Context

PM full-app review found related-field pills look somewhat interactive but are not actionable. This is P2 polish, not a blocker.

## Options

1. Make related fields actionable:
   - click scrolls/pins related source-backed tree row;
   - keyboard operable;
   - unavailable related fields are omitted or disabled with clear semantics.
2. Make related fields clearly informational:
   - remove pointer-like styling;
   - no implied action.

## Out of Scope

- Search/filter.
- Diagnostics or recommendations.
- Compatibility/fix guidance.

## Acceptance Criteria Before Implementation

- PM chooses actionable vs informational.
- Frontend Expert approves accessibility semantics.
- If actionable, target resolution behavior is defined for missing/collapsed/truncated nodes.

## Suggested Future Write Scope

- `packages/ui-components/src/index.ts`
- `packages/ui-components/src/index.test.ts`
- optional application selector only if target lookup should be DOM-free
- E2E for related-field action if implemented
