# Phase 5 Observatory Product Designer Review

Date: 2026-07-19  
Role: Product Designer  
Scope: Read-only review of current Observatory UI against `design.md`

## Artifact Note

The main coordinator workspace verified these Playwright screenshot artifacts exist after `npm run e2e`:

```text
test-results/screenshots/empty-observatory.png
test-results/screenshots/comprehensive-loaded-top.png
test-results/screenshots/deep-field-scrolled.png
test-results/screenshots/mobile-viewport-390x844.png
test-results/screenshots/upload-file-input.png
test-results/screenshots/dragdrop-text.png
```

The Product Designer sub-agent reported it could not access them and therefore grounded the review primarily in source and durable memory. Treat that as a tooling/access caveat, not as absence of generated artifacts.

## Verdict

Directionally closer to **The Observatory**, but not accepted as fully compliant with `design.md`.

The UI has the correct dark direction, sticky header, split workspace, line numbers, syntax coloring, and local-first behavior. It still reads partly as a form-driven app wrapped around an inspector rather than a single precision instrument.

## Priority Findings

### P0 — Visible paste/analyze control dock still dominates

The visible textarea + `Analyze locally` control dock above the inspector keeps the app in generic JSON-analyzer/form territory.

`design.md` wants input to feel native to the instrument:

- header controls;
- empty source-pane drop/paste/upload guidance;
- page-level paste/drop;
- upload from compact header;
- no persistent textarea above the inspector in the default Observatory shell.

### P1 — Explanation panel hierarchy does not yet match `design.md`

Current panel order is effectively:

1. title chip;
2. breadcrumb;
3. summary;
4. bullet details;
5. docs.

`design.md` requires:

1. semantic eyebrow;
2. exact field-name chip;
3. one-line definition;
4. calm prose details;
5. examples/version/related/docs as secondary.

### P2 — Pane headers compete with product content

Pane headers are useful for orientation, but they compete with the active source/explanation content. The explanation panel should lead with the active field hierarchy, not generic `Explanation` chrome.

### P3 — Empty glyph is too boxed/card-like

The empty glyph should be a restrained bracket mark, not a bordered icon box.

### P4 — Source interaction still reads more token-level than field/row-level

Line numbers, syntax color, and inert punctuation are improvements. The next polish should further reduce the sense of scattered token highlights and emphasize coherent field-level focus/pin cues without implementing the deferred full collapsible tree.

## Next Frontend Slice

Recommended slice:

```text
Phase 5 Observatory Slice: Integrated Input + Explanation Hierarchy
```

### Write scope

Preferred:

```text
apps/web/index.html
apps/web/src/main.ts
packages/host-web/src/index.ts
packages/ui-components/src/index.ts
existing tests only if selectors/copy need updates
```

### Instructions

1. Remove visible form-dock dominance.
   - The first visible surface under the header should be the inspector.
   - No visible persistent textarea or Analyze button in the default Observatory shell.
   - Preserve paste anywhere, upload, drop, clear, invalid-after-valid, hover, pin, keyboard, unknown fallback, and privacy behavior.

2. Move input instruction copy into the empty source pane.
   - Headline: `Drop a manifest.json`.
   - Subtext: `Or paste it anywhere on this page, or click Upload above.`
   - Keep local/privacy copy quiet, not heroic.

3. Keep upload in the compact sticky header.
   - Do not add `Load sample` or help popover yet.

4. Restructure explanation markup and styles.
   - Eyebrow first.
   - Exact field chip second.
   - Summary as one-line definition third.
   - Details as prose paragraphs, not primary bullets.
   - Docs links as quiet secondary content.

5. Refine the empty glyph.
   - Remove bordered-box treatment.
   - Use restrained `{ }`/bracket mark at 48×48, tertiary color.

## Explicit Non-Goals

Do not implement in the next slice:

- full collapsible tree;
- depth collapse;
- large-array truncation;
- mobile inline explanation cards;
- load sample;
- help/about popover;
- mixed-version/deprecated warning banners;
- related-field links;
- large-file spinner;
- pane resizing;
- diagnostics, fixes, health scores, audits, reports, compatibility matrices, AI, remote behavior, worker mode, or new hosts.

## E2E Checks to Preserve/Add

Preserve current Playwright behavior coverage and regenerate screenshot set.

Add assertions for the next slice:

- no visible `.control-dock`, `textarea#manifest-input`, or `#analyze-button` in default layout;
- header compactness: desktop about 56px, mobile about 48px;
- upload remains visible at mobile width;
- empty state instructions live inside source pane;
- empty glyph is not a bordered box/card;
- explanation DOM order: eyebrow → field chip → definition → prose details → secondary docs;
- details render as prose paragraphs rather than primary bullet list.

## Proposed Memory Update

Record that Product Designer review recommends the next Frontend Engineer slice remove the visible form dock and restructure explanation hierarchy before further visual polish.
