# Task Brief — Phase 6 Partial-Invalid Recovery Exploration

Date: 2026-07-19
Status: deferred follow-up, not a Phase 5 blocker

## Role

Product Manager + Core Engineer planning first, then implementation only after product semantics are approved.

## PM Decision

PM decided Phase 5 professional signoff does **not** require rendering recoverable partial source/explanations from invalid JSON.

For Phase 5, graceful invalid handling means:

- invalid paste/drop/upload never crashes;
- stale valid-manifest source/explanation/pin state is cleared;
- the same calm inline error-card path appears;
- no diagnostics, severity, fixes, health scores, reports, or validation-tool framing.

Recoverable partial rendering is deferred to Phase 6 quality hardening.

## Goal

Define and later implement bounded, explainer-first partial-invalid recovery behavior for malformed manifests.

The goal is not diagnostics or fixing JSON. The goal is to preserve useful source context and explanations only when parser/core can confidently recover semantic nodes from otherwise invalid JSON.

## Planning Questions

- What does “recoverable” mean in product terms?
- Which parse errors still allow reliable semantic paths and source ranges?
- Which regions should remain inert?
- What copy communicates partial recovery without sounding like diagnostics?
- What fixture set is sufficient?

## Acceptance Criteria Before Implementation

- PM-approved definition of recoverable partial rendering.
- Core Engineer-approved boundary between parser recovery, semantic mapping, and UI rendering.
- Explicit out-of-scope list preserving explainer-first scope.

## Future Implementation Acceptance

- Malformed input never crashes.
- Valid recovered semantic nodes render with normal explanations only when source ranges and paths are reliable.
- Unrecoverable regions remain inert.
- UI copy stays calm and informational, not diagnostic/severity-based.
- No fixes, health score, report, validation panel, compatibility claims, or AI explanations.
- Parser/core/application/UI behavior is covered by fixture-driven tests using `partial-invalid.json` and any new approved fixtures.
- Behavior is documented clearly enough that future reviewers do not need to infer partial recovery promises.

## Suggested Validation After Implementation

```sh
npm run typecheck
npm run test
npm run build
npm run e2e
```

## Reporting

Return product decision, technical design, acceptance criteria, validation results if implemented, risks, and proposed memory update.
