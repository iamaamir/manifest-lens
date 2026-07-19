# Phase 5 Full App PM + E2E/UX QA Review

Date: 2026-07-19
Scope: current Observatory app, all major user flows
Mode: read-only review plus E2E validation by E2E/UX QA

## Verdict

PM verdict: **conditionally shippable as a strong local-first explainer MVP for valid manifests**, but **not yet professional/enterprise-grade signed off**.

E2E/UX QA verdict: **48/48 E2E tests passed** and the main explainer flows are covered, but several product and QA gaps remain before final professional signoff.

No P0 blockers were found for the valid-manifest MVP path.

## Validation Evidence

E2E/UX QA ran:

```sh
npm run e2e
```

Result:

```text
48 passed
```

Coordinator had already validated the drag/drop remediation with:

```sh
npm run typecheck
npm run test
npm run build
npm run build --workspace=@mvviewer/web
npm run e2e
git --no-pager diff --check
```

## Flow-by-Flow Assessment

| Flow | PM/QA status | Notes |
|---|---:|---|
| Empty state | Good MVP | Clear entry point, paste/upload/sample paths, local trust copy, no form dock. Local-only note disappears after load. |
| Paste valid | Good MVP | Page-level paste covered and does not steal editable paste. |
| Upload valid | Good MVP | Upload button, hidden input, valid file load, focus behavior covered. |
| Upload invalid JSON | Good MVP | Routes to same calm error-card path; stale source/explanation cleared. |
| Drag/drop valid | Good MVP | Pre-drop feedback, valid file drop, cleanup covered. Real Finder/native drag smoke still useful. |
| Drag/drop invalid/unsupported | Mostly good MVP | Unsupported pre-drop refusal and invalid text drop after valid are covered. Invalid JSON file drop is not separately E2E-covered. |
| Sample | Good MVP, coverage gap | Desktop/mobile visibility covered, but sample click/load is not E2E-proven. |
| Clear | Good MVP | Clear lifecycle covered. |
| Loaded source/tree | Strong MVP, product ambiguity | Tree is source-backed and useful, but not exact raw source formatting. Product wording needs clarification. |
| Hover preview | Good MVP | Covered. |
| Click/tap pin | Good MVP | Covered through click/tap-like behavior and mobile inline card. |
| Keyboard navigation | Baseline pass, accessibility gap | Navigation/pin/clear covered. Disclosure/expand-collapse controls are pointer-first spans. |
| Unknown fallback | Good MVP, needs polish | Unknown fields selectable with fallback. Panel should show actual value/example later. |
| Partial/invalid JSON | Safe but acceptance gap | Invalid JSON shows error card. Recoverable partial-invalid source/explanation is not rendered despite Phase 5 wording. |
| Mobile | Good MVP, narrow coverage | Empty and selected inline card covered. Needs broader real touch/mobile edge coverage. |
| Privacy/local-only | Technically good | Network spies exist. Trust signal should remain discoverable after load. |
| Accessibility | Good baseline, not complete | Visible focus and keyboard path exist. Needs disclosure keyboard support and broader a11y/screen-reader smoke. |

## P0 Findings

None.

## P1 Findings — Required Before Professional/Enterprise-Grade Signoff

### P1-1 — Partial-invalid recovery does not meet Phase 5 acceptance wording

Phase 5 states partial/invalid input should not crash, show a calm message, and still render recoverable source/explanations where available.

Current behavior treats any parse errors as invalid and shows the error card, clearing the snapshot. This is safe, but it does not fulfill recoverable partial rendering.

Decision needed:

1. Implement recoverable partial rendering; or
2. Explicitly revise/defer the acceptance criterion to invalid JSON error-card only.

PM recommendation: implement recoverable rendering eventually because it differentiates the product, but document the decision before claiming enterprise-grade completion.

### P1-2 — Source preservation semantics are ambiguous

The app preserves source internally and renders a source-backed semantic tree, but the visible UI is transformed: rows, collapsed containers, truncation, omitted full raw formatting/punctuation.

This is good for comprehension, but weaker than PRD phrasing such as “original source formatting should be preserved.”

Decision needed:

1. Update acceptance/product language to “source-backed semantic tree preserving original values/ranges”; or
2. Add a raw-source view/toggle later.

### P1-3 — Disclosure/expand-collapse controls need keyboard accessibility

Keyboard users can navigate and pin explanations, but tree disclosure controls are pointer-first spans and not directly keyboard-operable.

Professional accessibility signoff requires either:

- native disclosure buttons; or
- active-row keyboard behavior such as ArrowRight expand / ArrowLeft collapse and support for `+N more`.

### P1-4 — Local-only/privacy trust signal should persist after load

The local processing note appears in the empty state, but after a manifest loads the assurance is no longer visible/discoverable.

Recommendation: add a compact persistent trust affordance such as a `Local only` header badge or a small help/about disclosure. Keep this as trust copy, not a privacy-policy/product expansion.

## P2 Findings — Polish / Public Launch Follow-ups

- Add E2E coverage for desktop header sample click and mobile in-pane sample link click.
- Add invalid JSON file-drop E2E coverage.
- Add unsupported file-picker upload E2E coverage if forced-selection behavior matters.
- Broaden mobile E2E/manual coverage: invalid state, clear, sample, unknown field, deep field, truncation.
- Add automated accessibility scan or manual screen-reader smoke.
- Unknown-field explanation panel should include actual value/example when available.
- Valid JSON that is not a manifest should show a clear non-manifest banner if the design requirement remains active.
- Related-field pills should become actionable or visually read as informational only.
- Promote fresh screenshots from `test-results/screenshots/` into `docs/reviews/ui-screenshots/latest/`, especially drag feedback and invalid-drop screenshots.

## QA Evidence Gaps Requested by PM

PM requested the next QA evidence set cover:

1. Real browser/Finder drag/drop:
   - valid `manifest.json` into empty app;
   - invalid JSON file into empty app;
   - invalid JSON file after a valid pinned manifest;
   - unsupported `.txt` file.
2. Source preservation decision evidence:
   - paste deliberately formatted manifest;
   - capture whether visible tree is acceptable or raw source mode is needed.
3. Keyboard-only tree operation:
   - load sample;
   - navigate fields;
   - pin/clear;
   - expand/collapse a container;
   - expand `+N more`.
4. Mobile real touch:
   - known field;
   - unknown field;
   - deep field after scrolling;
   - clear;
   - invalid input where feasible.
5. Privacy/network:
   - paste/upload/drop with request logging;
   - docs links do not send manifest content.
6. Accessibility smoke:
   - control names;
   - source region instructions;
   - active field announcements;
   - disclosure controls after fix.

## Scope Guardrails

Do not turn these follow-ups into:

- diagnostics dashboard;
- severity scoring;
- health score;
- fixes/quick fixes;
- security audit;
- compatibility matrix;
- remote analysis;
- AI-generated explanations.

Partial-invalid recovery should remain best-effort explanation, not a diagnostic editor.

Privacy affordance should be trust copy, not telemetry/legal infrastructure.

## Proposed Next Actions

1. Ask user/Product to decide the source-preservation wording: source-backed tree vs raw-source view.
2. Create a narrow accessibility task for keyboard-operable disclosure/truncation controls.
3. Create a narrow product/host task for persistent `Local only` trust affordance.
4. Create a QA task for sample-flow E2E, invalid file-drop E2E, and screenshot promotion.
5. Decide whether partial-invalid recovery is a Phase 5 hardening task or explicitly deferred to the next phase.
