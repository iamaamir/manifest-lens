# Task Brief — Phase 5 UI Reset Slice 1: Observatory Shell

Date: 2026-07-19
Branch: `ai-team-workflow-experiment`

## Role

Internal Frontend Engineer implementation specialist.

Work as a product-minded Web Components frontend engineer. Preserve behavior first, but replace the rejected light SaaS shell with the `design.md` Observatory direction.

## Context to Read First

1. `docs/journey/memory.md`
2. `AGENTS.md`
3. `design.md`
4. `docs/reviews/phase5-ui-reset-plan.md`
5. `docs/PRD.md`
6. `docs/journey/phase5.md`
7. `docs/architecture/coding-style.md`
8. Current files in write scope

Modern-web accessibility guidance has been checked by the coordinator. Apply these points:

- use landmarks and sequential headings;
- prefer native controls over ARIA when possible;
- every interactive control needs a visible label or accessible name;
- visible focus is mandatory;
- avoid positive `tabindex`;
- support `prefers-reduced-motion` where transitions are introduced;
- do not add modals for this slice.

## Goal

Replace the current light hero/form-first UI with the first Observatory shell:

- near-black app canvas;
- compact sticky header;
- inspector workspace dominates the screen;
- upload/paste/drop controls feel integrated with the inspector, not a separate large form above it;
- current Phase 5 behavior remains intact.

This slice is about the shell and component skin. Do **not** attempt the full tree renderer/collapsible tree yet.

## Write Scope

You may edit only:

- `apps/web/index.html`
- `apps/web/src/main.ts` only if needed for wiring changes
- `packages/ui-components/src/index.ts`
- `packages/ui-components/src/index.test.ts` only if existing structure/copy assertions need updates
- `packages/host-web/src/index.ts` only if control wiring must move
- `packages/host-web/src/index.test.ts` only if wiring behavior assertions need updates

Do not edit contracts/parser/domain/knowledge/core/application unless a blocker is impossible to solve in this slice.

## In Scope

### App shell

- Remove the large light hero and separate dominant input panel.
- Set `color-scheme: dark` and near-black body/canvas.
- Add a compact sticky header, 56px desktop/tablet and 48px mobile if practical.
- Header should include:
  - restrained mark/dot;
  - `Manifest Lens` wordmark;
  - concise local-first copy or status;
  - Upload and Clear controls if keeping controls outside the component.
- Keep `apps/web` thin. It can own page shell markup/styles and call `host-web` wiring only.

### Integrated input UX

- Keep paste textarea and Analyze behavior if needed for existing host wiring, but make it compact and subordinate, not the primary surface.
- Prefer integrating controls into a toolbar/header band above or around the inspector.
- File picker remains native and local.
- Drop/paste behavior on the inspector must continue.
- Status remains a polite app-level live region, but avoid noisy hover announcements.

### Component skin

- Apply `design.md` tokens in `packages/ui-components/src/index.ts` CSS variables:
  - `--color-bg-canvas: #121214`
  - `--color-bg-tree-pane: #16161A`
  - `--color-bg-panel: #1B1B20`
  - `--color-bg-header: #0D0D0F`
  - `--color-border-hairline: #2A2A31`
  - `--color-border-focus: #5EEAD4`
  - text/accent/json colors as needed.
- Source pane should use near-black code-pane treatment.
- Explanation pane should use near-black prose-pane treatment.
- Empty state should live inside the inspector/source pane and say `Drop a manifest.json` or equivalent.
- Explanation placeholder should be quiet and panel-local.

### Behavior preservation

Preserve:

- local direct `analyzeManifest` path;
- source preservation from `snapshot.document.text`;
- no raw manifest `innerHTML`;
- hover preview;
- click/tap pinning;
- pin A → hover B → leave restores A;
- keyboard navigation;
- unknown/custom fallback;
- partial-invalid calm status;
- no-network privacy behavior.

## Out of Scope

Do not add in this slice:

- full collapsible JSON tree;
- default depth collapse;
- large-array truncation;
- mobile inline explanation cards;
- Load sample;
- help/about popover;
- mixed MV2/MV3 warning banners;
- deprecated-field warning treatment;
- related-field scroll/pin links;
- Playwright/browser E2E tooling;
- diagnostics UI, fixes, health scores, reports, audits, permission risk scoring, AI, remote analysis, workers, browser extension, VS Code, CLI.

## Known Traps

- `design.md` says “tree,” but HLD/PRD require source preservation. Do not reserialize JSON for display.
- Do not assign raw manifest source to `innerHTML`, `outerHTML`, or `insertAdjacentHTML`.
- Do not bring back noisy boxes around punctuation/whitespace. Existing structural fragment logic is important.
- Do not use side-stripe accent borders as the main design move.
- Do not add positive `tabindex`.
- Do not make the app shell contain domain/rendering logic.
- Do not add external dependencies for this slice.

## Acceptance Criteria

- First load no longer reads as generic light SaaS or hero/form page.
- The first visual impression is a restrained near-black instrument.
- Inspector workspace is the product surface.
- Input controls are compact/integrated.
- Existing behavior tests pass or are updated only for legitimate copy/structure changes.
- No source preservation, privacy, hover/pin/keyboard, unknown, or partial-invalid regressions.
- No out-of-scope product language appears in UI code.

## Validation Required

Run:

```sh
npm run typecheck
npm run test
npm run build
npm run build --workspace=@manifest-lens/web
git diff --check
```

Static checks:

```sh
grep -R "innerHTML\|outerHTML\|insertAdjacentHTML" packages/ui-components apps/web packages/host-web || true
grep -R "fetch\|XMLHttpRequest\|sendBeacon\|WebSocket" packages/ui-components apps/web packages/host-web || true
grep -R "diagnostic\|fix\|health\|score\|report\|audit\|AI-generated\|remote" packages/ui-components/src packages/host-web/src apps/web/src apps/web/index.html || true
```

If validation fails, fix only issues caused by this slice. Do not hide failures by deleting meaningful tests.

## Required Report

Return:

1. Summary of UI changes.
2. Files changed.
3. Behavior preserved.
4. Validation commands and exact results.
5. Risks/follow-ups.
6. Proposed `docs/journey/memory.md` update, if any.
