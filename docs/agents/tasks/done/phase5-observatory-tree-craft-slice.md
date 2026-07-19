# Task Brief — Phase 5 Observatory Tree Craft Slice

Date: 2026-07-19
Branch: `ai-team-workflow-experiment`

## Role

Internal Frontend Engineer implementation specialist.

Preserve behavior, add tree craft. The source pane currently renders decorated preserved text — this slice moves it toward the `design.md` JSON tree model: indented rows per key/value, guide lines, disclosure controls, depth collapse, large-array truncation, and quieter active/focus/pin treatment.

## Context to Read First

1. `docs/journey/memory.md`
2. `AGENTS.md`
3. `design.md` — Section 4.2 (JSON Tree) is the primary target
4. `docs/reviews/phase5-structural-reset-accepted-review.md`
5. `docs/PRD.md`
6. `docs/architecture/coding-style.md`
7. Current files in write scope (read these)

## Write Scope

You may edit only:

- `packages/ui-components/src/index.ts`
- `packages/ui-components/src/index.test.ts`
- `packages/application/src/index.ts` only if DOM-free tree helpers are needed
- `packages/application/src/index.test.ts` only if adding such helpers
- `apps/web/index.html` only if layout shell changes are needed for the tree
- `apps/web/src/main.ts` only if wiring changes are needed

Do not edit contracts/parser/domain/knowledge/core/host-web unless a blocker is impossible to solve in this scope.

## In Scope

### 1. Tree row structure

Replace the flat `<pre>` source rendering with an indented tree where each key/value pair, permission item, host permission, content-script field, or array item is an individual interactive DOM row.

- Walk the semantic nodes tree (parent-child relationships from `snapshot.semantic.nodes`).
- Render each explainable node as a tree row with indentation proportional to its depth.
- Each row shows the key (or array index) and the value preview on the same line where practical.
- Preserve the exact source text per node via `node.sourceRange` for the value display.
- Keep syntax coloring per token (keys, strings, numbers, booleans, null, brackets) via existing `lexSourceText`/`sourceTokenClass`.
- Maintain unique DOM IDs, representative IDs, `role="option"`, `aria-selected`, and `aria-label` for each interactive row.

### 2. Guide lines

- Add subtle 1px vertical guide lines (`--color-border-hairline`) connecting parent rows to their children.
- Guide lines should be purely decorative, `aria-hidden="true"`, and not interfere with keyboard navigation or text selection.
- Use CSS `::before` pseudo-elements or dedicated gutter/indent markers — not images or SVG.

### 3. Disclosure controls

- Objects and arrays show a disclosure triangle (▸/▾, 12px, `--color-text-secondary`) to the left of the key.
- Clicking the triangle toggles collapse/expand for that node's children.
- Collapsed state: object shows `{…}` with child count (`{ 4 keys }`), array shows `[…]` with item count.
- Disclosure controls are keyboard-operable (Enter/Space when focused).
- Only one level of collapse is needed — no recursive collapse-all.

### 4. Default depth collapse

- On initial load, expand everything up to depth 2.
- Deeper nested objects/arrays (depth >= 3) start collapsed.

### 5. Large-array truncation

- Arrays with more than 8 visible items show only the first 8, then a "+N more" expandable row.
- Clicking "+N more" expands the remaining items inline.
- "+N more" is styled as a muted text button (`--color-text-tertiary`, italic or subdued).

### 6. Quieter active/focus/pin treatment

- Only the active/pinned row gets the strong indicator treatment.
- `design.md` says:
  - **Default:** no background, key in `--color-json-key`, no underline.
  - **Hover:** background `--color-bg-elevated` at 40% opacity, key gains a 1px bottom border in `--color-accent-primary`.
  - **Focus (keyboard):** same as hover, plus 2px outline in `--color-border-focus` with 2px offset.
  - **Active/Pinned (click):** background `--color-bg-elevated` at full opacity, small filled 6px dot in gutter.
- Remove the noisy "confetti" effect where every fragment gets highlighted independently.
- Gutter indicators (line-number dot/outline) should only appear for the active/pinned/focused row, not every related line.

### 7. Behavior preservation

Preserve all existing Phase 5 behavior:
- local direct `analyzeManifest` path
- source preservation (no reserializing JSON for display)
- no raw manifest `innerHTML`, `outerHTML`, `insertAdjacentHTML`
- hover preview
- click/tap pinning
- pin A → hover B → leave restores A
- keyboard navigation
- unknown/custom fallback
- partial-invalid calm status
- no-network privacy behavior
- mobile inline explanation card behavior
- explanation panel hierarchy (eyebrow → field chip → definition/prose → related/docs)

## Out of Scope

Do not add:
- diagnostics, fixes, health scores, reports, audits, security warnings, AI, remote behavior, backend
- row virtualization (not needed for typical manifest sizes)
- pane resize/drag
- collapsible-all / expand-all controls
- search/filter
- editing or inline value changing
- new npm dependencies
- external API calls
- browser extension, VS Code extension, CLI, worker mode
- changes to contracts/parser/domain/knowledge/core

## Known Traps

- `design.md` says "tree" but HLD/PRD require source preservation. Each tree row must show the exact source text from `node.sourceRange`, not a reserialized value. Render the source text from the snapshot, not from a new `JSON.stringify`.
- The existing `splitIntoSegments` + lexer approach segments source by semantic nodes. For the tree, you can still use `snapshot.document.text` and `node.sourceRange` to extract each node's source substring — just present it as rows instead of a flat `<pre>`.
- Do not use `innerHTML` for manifest source text. Use `textContent` on created elements.
- Existing tests assert exact preserved source text via `.source-pre` selectors. If you change the source DOM structure, update tests to assert through the correct tree row selectors.
- The semantic node tree has parent-child relationships via `parentId`/`children` on nodes. Walk these for tree structure.
- Keep `aria-activedescendant` pointing to a valid representative DOM ID.
- Do not add positive `tabindex`.
- Ensure `prefers-reduced-motion` is respected.

## Acceptance Criteria

- Source pane renders as an indented tree, not a flat `<pre>` block.
- Each explainable node is a distinct interactive row with proper indentation.
- Tree guide lines are visible and calm.
- Objects/arrays have clickable disclosure controls.
- Collapsing an object/array hides its children and shows count.
- Default load: depth 1-2 expanded, depth 3+ collapsed.
- Arrays with >8 items show first 8 + "+N more".
- Active/focus/pin styling is quiet and row-level, not fragment-level.
- Hover, click pin, keyboard, pin-restore, unknown fallback, invalid-after-valid, privacy behaviors all still work.
- Existing unit tests pass (or are updated only for legitimate DOM structure changes).
- No out-of-scope product language or behavior appears.

## Validation Required

```sh
npm run typecheck
npm run test
npm run build
npm run build --workspace=@mvviewer/web
git diff --check
```

Static checks:

```sh
grep -R "innerHTML\|outerHTML\|insertAdjacentHTML" packages/ui-components/src packages/application/src apps/web/src apps/web/index.html || true
grep -R "diagnostic\|fix\|health\|score\|report\|audit\|AI-generated\|remote" packages/ui-components/src packages/application/src apps/web/src apps/web/index.html || true
```

If validation fails, fix only issues caused by this slice.

## Required Report

Return:
1. Summary of tree-craft changes.
2. Files changed.
3. How source preservation was maintained.
4. How tree structure, guide lines, disclosure, depth collapse, and array truncation are implemented.
5. Validation commands and exact results.
6. Risks/follow-ups.
7. Proposed `docs/journey/memory.md` update.
