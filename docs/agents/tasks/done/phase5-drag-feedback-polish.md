# Task Brief — Phase 5 Drag Feedback and UI Polish

Date: 2026-07-19
Branch: `ai-team-workflow-experiment`

## Role

Frontend Engineer implementation specialist, with E2E/UX QA discipline.

Fix the Observatory drag/drop interaction gap and adjacent input-state polish. The user reported that dragging a valid or invalid file over the app gives no feedback before drop. This is a professional UI trust failure for a primary Phase 5 input path.

## Required Context

Read first:

1. `docs/journey/memory.md`
2. `AGENTS.md`
3. `docs/agents/external-quickstart.md`
4. `docs/agents/templates/external-self-review.md`
5. `docs/journey/phase5.md`
6. `docs/PRD.md`
7. `design.md`
8. `docs/architecture/coding-style.md`
9. Current files in write scope

Modern web guidance already checked by coordinator:

- Use semantic controls and visible focus.
- Do not rely on color alone for state.
- Use non-color text/icon feedback for validation/state.
- Keep interactions cheap; avoid layout-heavy animation.
- `content-visibility` is not needed for this fix.

## Specialist Findings to Address

Product Manager:

- Missing pre-drop feedback is P1, a release-polish blocker for enterprise-grade UI.
- Drag/drop is an explicit PRD/Phase 5 input path.
- Do not turn this into diagnostics, validation scoring, fixes, security audit, remote analysis, or AI.

Product Designer + Frontend Expert:

- `.drop-overlay` exists but is always hidden.
- Drag feedback only attaches to loaded `.tree-container`, so empty-state drag feedback is missing.
- Upload invalid JSON likely bypasses parse-error-aware handling and may not show the designed error card.
- Current E2E tests prove post-drop success only, not pre-drop feedback.

E2E/UX QA:

- Add drag lifecycle tests: `dragenter`, `dragover`, `dragleave`, `drop`.
- Cover empty and loaded states.
- Cover valid file drop, invalid drop after valid/pinned, cleanup of drag state, and no-data drop no-op.
- Capture screenshots for designer review.

Staff Engineer:

- Keep UI visual state in `ui-components`.
- Keep browser `DragEvent`/`DataTransfer`, file/text extraction, `dropEffect`, and local analysis wiring in `host-web`.
- `apps/web` may only receive thin shell/control wiring changes.
- No `application` or `core` changes are justified for drag pre-drop feedback.

## Write Scope

You may edit only:

- `packages/ui-components/src/index.ts`
- `packages/ui-components/src/index.test.ts`
- `packages/host-web/src/index.ts`
- `packages/host-web/src/index.test.ts`
- `apps/web/src/main.ts`
- `apps/web/index.html`
- `tests/e2e/helpers.ts`
- `tests/e2e/upload-and-dragdrop.test.ts`
- optionally another existing `tests/e2e/*.test.ts` only if a test belongs there
- this task brief only for completion report appended at the end

Do not edit `contracts`, `parser-json`, `manifest-domain`, `knowledge`, `core`, or `application` for this task.

## In Scope

### 1. Visible pre-drop feedback

Implement clear drag-over feedback before drop for both:

- empty state;
- loaded source/tree state.

Expected behavior:

- On `dragenter` / `dragover`, show a pane-contained Observatory-native drop affordance.
- Copy should be calm and local-first, for example:
  - valid/unknown candidate: `Drop manifest.json to inspect locally`
  - clearly unsupported candidate: `Drop a JSON manifest file`
- Feedback must include text or icon/shape, not color alone.
- Visual treatment should use existing design tokens: restrained overlay/ring/accent, no stock dashed upload box, no modal, no exclamation points.
- Feedback clears on `dragleave`, `drop`, and relevant cancellation cleanup.
- Avoid flicker when moving over child elements; use a drag-depth counter or robust containment check.

### 2. Candidate classification before drop

When safely knowable from `DataTransfer`, distinguish:

- acceptable/unknown drop candidates: `.json`, `manifest.json`, `application/json`, or text payloads;
- clearly unsupported candidates: multiple files, non-JSON filename, no files/text.

Important:

- Do not parse file contents before drop.
- Do not claim invalid JSON before reading.
- Browser file details may be limited before drop; if uncertain, show neutral valid/unknown feedback.

### 3. Unified invalid input behavior

Make paste, drop, and Upload produce consistent invalid JSON behavior:

- previous valid source/explanation/pin state clears;
- tree pane shows existing calm error card;
- explanation panel returns to empty placeholder;
- header controls reset consistently;
- no raw parser stack trace;
- no diagnostics/report/fix/score/audit language.

The current `importManifestFile()` path may bypass parse-error-aware handling. Route Upload through the same outcome path or expose a shared parse-error-aware file import helper.

### 4. Focus and upload affordance polish

Ensure the visible Upload control has an obvious keyboard focus state.

Preferred:

- make Upload a real `button` that triggers the hidden file input; or
- otherwise ensure focus on the file input visibly styles the visible upload label.

Do not expose native file input chrome.

### 5. E2E coverage and screenshots

Add/adjust Playwright coverage for:

- empty-state dragover shows visible pre-drop feedback;
- loaded-state dragover shows feedback without losing current content;
- dragleave clears feedback and preserves state;
- valid file drop loads fixture and clears feedback;
- invalid text/file drop after valid/pinned clears stale state and shows error card;
- drop with empty/no data is safe no-op and does not clear valid content;
- upload invalid JSON shows the same error card path;
- dragover prevents default and advertises copy where appropriate;
- upload visible focus state if testable.

Capture/update screenshots under existing E2E screenshot convention when useful:

- `desktop-empty-dragover-feedback.png`
- `desktop-loaded-dragover-feedback.png`
- `desktop-invalid-drop-error-card.png`

## Out of Scope

Do not add:

- diagnostics list UI;
- severity diagnostics;
- schema validation beyond existing parse error handling;
- fixes/quick fixes;
- health score;
- security audit;
- permission risk scoring;
- compatibility matrix;
- export/report features;
- remote upload/analysis;
- telemetry involving manifest contents;
- AI-generated explanations;
- zipped/project-folder extension import;
- worker, CLI, VS Code, browser extension, desktop host;
- new npm dependencies;
- broad refactors outside the input-state path.

## Known Traps

- `ui-components` should not read file contents or call `analyzeManifest`.
- `host-web` should not style Shadow DOM internals.
- Empty state currently may not have `.tree-container`, so component-level drag state must work before a snapshot exists.
- `.drop-overlay` currently exists but may have no display rule.
- Synthetic Playwright drag events can be brittle; keep helpers clear and assert DOM/computed visibility directly.
- Do not use raw `innerHTML`, `outerHTML`, or `insertAdjacentHTML` for manifest source.
- Preserve local-only privacy tests.
- Preserve hover preview, click/tap pin, keyboard selection, source/explanation synchronization, tree disclosure/truncation, mobile inline card behavior.

## Acceptance Criteria

- Dragging a valid/unknown manifest candidate over the empty state visibly changes the drop surface before drop.
- Dragging over a loaded tree visibly shows pane-contained drop feedback before drop.
- Clearly unsupported candidates show calm refusal feedback where browser data allows.
- Feedback clears on leave/drop/cancel and never gets stuck.
- Valid dropped file/text still loads locally.
- Invalid dropped/uploaded JSON shows the same designed error card and clears stale source/explanation/pin state.
- Upload has visible keyboard focus affordance.
- E2E covers drag lifecycle, invalid upload/drop, and cleanup regressions.
- No out-of-scope product language or behavior appears.
- Package boundaries remain aligned with Staff Engineer guidance.

## Validation Required

Run:

```sh
npm run typecheck
npm run test
npm run build
npm run build --workspace=@manifest-lens/web
npm run e2e
git diff --check
```

Run static checks:

```sh
grep -R "innerHTML\|outerHTML\|insertAdjacentHTML" packages/ui-components/src packages/host-web/src apps/web/src apps/web/index.html || true
grep -R "fetch\|XMLHttpRequest\|sendBeacon\|WebSocket" packages/ui-components/src packages/host-web/src apps/web/src apps/web/index.html || true
grep -R "diagnostic\|fix\|health\|score\|report\|audit\|AI-generated\|remote" packages/ui-components/src packages/host-web/src apps/web/src apps/web/index.html || true
```

If validation fails, fix only failures caused by this task.

## Required Report

Append an implementation report to this task brief or return it to the coordinator with:

1. Summary.
2. Files changed.
3. How drag state works in empty and loaded states.
4. How invalid upload/drop behavior was unified.
5. E2E tests added/changed and screenshots captured.
6. Exact validation results.
7. Risks/follow-ups.
8. Proposed `docs/journey/memory.md` update.

## Implementation Report — Frontend Engineer

Date: 2026-07-19

### 1. Summary

Implemented pane-contained Observatory drag/drop feedback for empty, error, and loaded source states. The host now classifies drag candidates before drop using safely available `DataTransfer` metadata, advertises copy only for acceptable/unknown candidates, and clears feedback on leave/drop/cancel. Invalid paste/drop/upload now routes through the same parse-error-aware outcome path and shows the existing calm invalid JSON error card while clearing stale source/explanation/pin state. The visible Upload affordance is now a real button that triggers the hidden native file input and receives the existing visible `:focus-visible` button outline.

### 2. Files changed

Within the brief write scope:

- `packages/ui-components/src/index.ts`
- `packages/ui-components/src/index.test.ts`
- `packages/host-web/src/index.ts`
- `packages/host-web/src/index.test.ts`
- `apps/web/src/main.ts`
- `apps/web/index.html`
- `tests/e2e/helpers.ts`
- `tests/e2e/upload-and-dragdrop.test.ts`
- `docs/agents/tasks/active/phase5-drag-feedback-polish.md`

Note: the working tree already contained unrelated dirty/untracked files outside this task's write scope when inspected after validation. I did not intentionally edit or revert those broader files.

### 3. How drag state works in empty and loaded states

- `ui-components` owns only visual state:
  - `ManifestInspectorElement.showDropFeedback(kind)` adds `is-dragging` plus `data-drop-feedback="accepted" | "rejected"`.
  - `ManifestInspectorElement.clearDropFeedback()` removes that visual state.
  - Empty, error, and loaded source panes all render a `.drop-overlay` with non-color glyph/text feedback.
  - Accepted/unknown copy: `Drop manifest.json to inspect locally`.
  - Rejected copy: `Drop a JSON manifest file`.
- `host-web` owns browser drag/drop behavior:
  - `classifyDropCandidate()` uses `DataTransfer.files`, `DataTransfer.items`, `DataTransfer.types`, and synthetic/test `getData()` fallback where available.
  - `.json`, `manifest.json`, `application/json`, text payloads, and limited/unknown file metadata are accepted/neutral.
  - Multiple files, clearly non-JSON filenames/types, and no files/text are rejected.
  - A drag-depth counter prevents clearing feedback while moving across child elements.
  - Feedback clears on `dragleave`, `drop`, and `dragend`.
  - `dragover` calls `preventDefault()` and sets `dropEffect = "copy"` only for accepted/unknown candidates; rejected candidates get `dropEffect = "none"`.

### 4. How invalid upload/drop behavior was unified

- `analyzeText()` now owns the parse-error-aware host outcome path:
  - empty text returns a safe no-op outcome;
  - parse errors call `host.showError(STATUS_INVALID)`;
  - successful parses call `host.loadSnapshot(snapshot)`.
- `importManifestFile()` now returns `AnalyzeOutcome` and calls the same `analyzeText()` path after `File.text()` instead of bypassing parse-error-aware handling via `loadManifestText()`.
- Dropped text and dropped JSON files also call the same path.
- Result: invalid paste/drop/upload clears previous valid source/explanation/pin state, renders the existing error card, and leaves the explanation panel in the empty placeholder state.

### 5. E2E tests added/changed and screenshots captured

Updated `tests/e2e/upload-and-dragdrop.test.ts` with coverage for:

- empty-state dragover feedback and `preventDefault()`;
- loaded-state dragover feedback preserving current content;
- dragleave cleanup preserving state;
- valid JSON file drop loads fixture and clears feedback;
- invalid text drop after valid/pinned state clears stale source/explanation/pin and shows error card;
- empty/no-data drop no-op that preserves valid content;
- clearly unsupported file candidate refusal feedback;
- invalid JSON upload using the same error-card path;
- visible Upload button focus affordance.

Screenshot paths captured during E2E:

- `test-results/screenshots/desktop-empty-dragover-feedback.png`
- `test-results/screenshots/desktop-loaded-dragover-feedback.png`
- `test-results/screenshots/desktop-invalid-drop-error-card.png`
- existing upload screenshot remains `test-results/screenshots/desktop-upload-state-no-native-input.png`

### 6. Exact validation results

Commands run:

- `npm run typecheck` — passed (`tsc -b --pretty`).
- `npm run test` — first run failed because a new unit assertion expected `manifest_version` in a synthetic snapshot that only contains `name`; fixed the test assertion. Re-run passed: 8 files, 155 tests.
- `npm run build` — passed (`tsc -b`).
- `npm run build --workspace=@manifest-lens/web` — passed (`vite build`, 19 modules transformed, built in 27ms).
- `npm run e2e` — passed: 46 tests, 8.9s.
- `git --no-pager diff --check` — passed with no output.

Required static greps:

- `grep -R "innerHTML\|outerHTML\|insertAdjacentHTML" packages/ui-components/src packages/host-web/src apps/web/src apps/web/index.html || true` — returned test-only `innerHTML` matches in `packages/ui-components/src/index.test.ts` and `packages/host-web/src/index.test.ts`; no production source injection path added.
- `grep -R "fetch\|XMLHttpRequest\|sendBeacon\|WebSocket" packages/ui-components/src packages/host-web/src apps/web/src apps/web/index.html || true` — returned existing privacy-spy test matches in `packages/host-web/src/index.test.ts`; no production network path added.
- `grep -R "diagnostic\|fix\|health\|score\|report\|audit\|AI-generated\|remote" packages/ui-components/src packages/host-web/src apps/web/src apps/web/index.html || true` — returned test names/assertions and fixture-path wording in tests only; no production out-of-scope product language added.

### 7. Risks/follow-ups

- The browser may expose limited file metadata before drop. The implementation intentionally treats unknown file candidates as neutral/accepted feedback until contents are available after drop.
- Drag/drop folder or multi-file import remains out of scope and is refused/no-op.
- Existing generated screenshot artifacts outside this task's write scope appear dirty in the broader working tree; coordinator should decide whether to preserve, promote, or revert them separately.
- Potential future polish outside this task: add a tiny status text for rejected multi-file drops after drop if user testing shows no-op feels too quiet. Do not add diagnostics/report/fix language.

### 8. Proposed `docs/journey/memory.md` update

```md
- Phase 5 drag/drop polish completed by Frontend Engineer specialist: empty and loaded Observatory panes now show pre-drop feedback, host-web classifies DataTransfer candidates before drop, rejected candidates show calm JSON-file copy, drag feedback clears on leave/drop/cancel, Upload is a real focusable button, and invalid paste/drop/upload all route through the same parse-error-aware error-card path with stale source/explanation/pin cleared. Validation passed: `npm run typecheck`, `npm run test` (8 files, 155 tests after fixing one new assertion), `npm run build`, `npm run build --workspace=@manifest-lens/web`, `npm run e2e` (46 passed), `git diff --check`, and required static greps showed only expected test matches.
```

### 9. Self-review checklist

- [x] Stayed inside the assigned write scope for intentional edits.
- [x] Did not edit `docs/journey/memory.md`; proposed an update instead.
- [x] Did not modify core/application/contracts/parser/domain/knowledge for this task.
- [x] Preserved explainer-first MVP scope; no diagnostics/fixes/health scores/reports/audits/AI/remote behavior added.
- [x] Kept UI visual state in `ui-components` and browser/DataTransfer/file/text handling in `host-web`.
- [x] Added behavior-focused unit and E2E coverage for changed behavior.
- [x] Ran the requested validation commands and reported exact results.

## Follow-up Fix Report — Review Blockers

Date: 2026-07-19

### Summary

Resolved the review blockers from the drag-feedback polish pass:

- Removed the visible inert `?` Help/About button and its unused CSS.
- Hid header `Load sample` at `<768px`; mobile now relies on the in-pane sample link while keeping Upload visible.
- Added `tabindex="-1"` to the hidden native file input so keyboard focus lands on the visible Upload button, not hidden chrome.
- Replaced app/component global reduced-motion wildcard `0.01ms` overrides with targeted rules for actual scroll/interactive surfaces.
- Added document/window drag cleanup listeners while `wireManifestInputFlows()` is active and disposed them with the rest of the wiring.
- Cleared `fileInput.value` after invalid upload outcomes so choosing the same invalid file can fire `change` again.

### Files changed in follow-up

- `apps/web/index.html`
- `apps/web/src/main.ts`
- `packages/ui-components/src/index.ts`
- `packages/host-web/src/index.ts`
- `packages/host-web/src/index.test.ts`
- `tests/e2e/helpers.ts`
- `tests/e2e/upload-and-dragdrop.test.ts`
- `docs/agents/tasks/active/phase5-drag-feedback-polish.md`

### Tests added/adjusted

- Host unit test for stuck drag feedback cleanup via `window.blur` and `document.dragend`, plus dispose behavior.
- E2E checks for:
  - no visible/inert Help button;
  - hidden file input has `tabindex="-1"`;
  - invalid upload clears the native file input value;
  - mobile header keeps Upload visible, omits Help, hides header Load sample, and keeps the in-pane sample link;
  - global blur cleanup clears aborted off-element drag feedback.

### Exact validation results

- `npm run typecheck` — passed (`tsc -b --pretty`).
- `npm run test` — passed: 8 test files, 156 tests.
- `npm run build` — passed (`tsc -b`).
- `npm run build --workspace=@manifest-lens/web` — passed (`vite build`, 19 modules transformed, built in 22ms).
- `npm run e2e` — passed: 48 tests, 9.1s.
- `git --no-pager diff --check` — passed with no output.

Static checks:

- `grep -R "innerHTML\|outerHTML\|insertAdjacentHTML" packages/ui-components/src packages/host-web/src apps/web/src apps/web/index.html || true` — returned only existing test references (`document.body.innerHTML = ""` setup and an assertion that source is not injected); no production source-injection usage.
- `grep -R "fetch\|XMLHttpRequest\|sendBeacon\|WebSocket" packages/ui-components/src packages/host-web/src apps/web/src apps/web/index.html || true` — returned only privacy-spy test references in `packages/host-web/src/index.test.ts`; no production network path.
- `grep -R "diagnostic\|fix\|health\|score\|report\|audit\|AI-generated\|remote" packages/ui-components/src packages/host-web/src apps/web/src apps/web/index.html || true` — returned only test names/assertions and fixture path text; no production out-of-scope product language.
- Additional reduced-motion check: `grep -R "0.01ms\|transition-duration: 0.01ms\|animation-duration: 0.01ms" packages/ui-components/src apps/web/index.html || true` — no output.

### Remaining risks / follow-ups

- Mobile header now intentionally omits header Load sample below `768px`; the in-pane sample link remains the mobile path.
- Drag cleanup is hardened for blur/document dragend/off-host document drop, but browser-native drag cancellation behavior can vary; current E2E covers the practical global blur cleanup path.

### Proposed `docs/journey/memory.md` update

```md
- Phase 5 drag/drop polish follow-up blockers resolved: removed inert Help button, hid header Load sample on mobile while preserving in-pane sample, made hidden file input non-tabbable, replaced global reduced-motion wildcard overrides with targeted rules, added document/window drag cleanup listeners, and clears invalid upload file input value. Validation passed: `npm run typecheck`, `npm run test` (8 files, 156 tests), `npm run build`, `npm run build --workspace=@manifest-lens/web`, `npm run e2e` (48 passed), `git diff --check`, required static greps, and an extra `0.01ms` grep with no matches.
```
