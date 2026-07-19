# Task Brief — Phase 5 Valid JSON Non-Manifest Banner

Date: 2026-07-19

## Role

Product Manager + Manifest UX Domain Specialist planning, then implementation if approved.

## Goal

Decide and potentially implement a clear banner for valid JSON that does not look like a browser extension manifest.

## Context

`design.md` describes a banner for valid JSON with none of the expected top-level manifest keys. PM full-app review marked this as P2, not a blocker.

## In Scope

- Define what “does not look like a manifest” means.
- Keep the experience explanatory, not diagnostic.
- If implemented, render valid JSON as a source-backed semantic tree where possible while explaining that manifest-specific documentation may be unavailable.

## Out of Scope

- Schema validation.
- Severity diagnostics.
- Fix suggestions.
- Compatibility or security scoring.

## Suggested Future Write Scope

- Product/domain selector if needed, preferably DOM-free.
- `packages/ui-components/src/index.ts`
- tests for valid non-manifest JSON.

## Acceptance Criteria Before Implementation

- PM approves whether this remains in Phase 5 polish or moves to Phase 6.
- Manifest UX Domain Specialist approves copy.
