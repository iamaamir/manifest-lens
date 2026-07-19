# Manifest Inspector — Design Specification
### Concept: "The Observatory" (hybrid, responsive)
Version 1.0 — For direct implementation by an AI coding agent. No value in this document is approximate. If a value appears ambiguous, treat it as an error in the document, not license to improvise.

---

## 1. Design Philosophy (for context, not for parsing)

This is a precision instrument, not a marketing surface. A developer pastes or drops a `manifest.json` and receives, on demand, an authoritative explanation of exactly the field their cursor or focus is resting on. The interface has exactly one job: make the distance between "I wonder what this does" and "I understand it" as short as possible. Every visual decision defers to that single moment of contact between attention and explanation.

The palette is near-black, not pure black, because pure black against white text produces vibration at small type sizes and fails comfortable reading over a 3–8 minute session. The tree is monospace because it is code. The explanation is a proportional humanist sans because it is prose, and the eye must be able to tell, without reading, which register it is in.

---

## 2. Design Tokens

### 2.1 Color

```
--color-bg-canvas:        #121214   /* app background, near-black, warm undertone */
--color-bg-tree-pane:     #16161A   /* left pane surface */
--color-bg-panel:         #1B1B20   /* right / explanation pane surface */
--color-bg-header:        #0D0D0F   /* top bar, darkest surface */
--color-bg-elevated:      #202027   /* pinned card, modals, toasts */

--color-border-hairline:  #2A2A31   /* 1px separators, pane divider */
--color-border-focus:     #5EEAD4   /* focus ring / hover accent (cyan) */

--color-text-primary:     #EDEDEF   /* JSON keys, headings — contrast ratio 14.8:1 on canvas */
--color-text-secondary:   #A6A6AE   /* JSON punctuation, muted labels — 6.9:1 on canvas */
--color-text-tertiary:    #6E6E78   /* line numbers, disabled — 3.9:1, decorative use only */
--color-text-explanation: #D9D9DE   /* explanation panel body text — 11.9:1 on panel bg */

--color-accent-primary:   #5EEAD4   /* cyan — hover state, active key underline */
--color-accent-secondary: #F5A97F   /* warm coral — used ONLY for warnings/deprecated fields */
--color-accent-error:     #F87171   /* invalid JSON, error states */
--color-accent-success:   #4ADE80   /* valid manifest confirmation, used sparingly */

--color-json-key:         #7DD3FC   /* light blue, JSON keys */
--color-json-string:      #A7F3D0   /* mint, string values */
--color-json-number:      #FDE68A   /* pale gold, numeric values */
--color-json-boolean:     #F5A97F   /* coral, booleans */
--color-json-null:        #6E6E78   /* muted gray, null */
--color-json-bracket:     #6E6E78   /* muted gray, {} [] , */
```

All text-on-background pairings above meet or exceed WCAG AA (4.5:1 body, 3:1 large text). `--color-text-tertiary` is decorative-only (line numbers) and never carries required information alone.

### 2.2 Typography

```
--font-mono:  "JetBrains Mono", "SF Mono", ui-monospace, monospace
--font-sans:  "Inter", -apple-system, "Segoe UI", sans-serif

/* Type scale — ratio 1.25 (major third), base 14px */
--text-xs:    11px   / line-height 16px   /* line numbers, meta labels */
--text-sm:    13px   / line-height 20px   /* JSON tree body, secondary UI */
--text-base:  14px   / line-height 22px   /* explanation panel body */
--text-md:    16px   / line-height 24px   /* explanation panel field-name heading */
--text-lg:    20px   / line-height 28px   /* section dividers within panel */
--text-xl:    24px   / line-height 32px   /* empty-state headline */

--weight-regular: 400
--weight-medium:  500
--weight-semibold: 600

--letter-spacing-mono: 0px
--letter-spacing-caps: 0.06em   /* used only for eyebrow labels, e.g. "MANIFEST V3" */
```

Rule: the JSON tree is **always** `--font-mono`. The explanation panel body is **always** `--font-sans`. Field names quoted inside explanation prose (e.g. referring to `"permissions"`) are rendered in `--font-mono` at the surrounding text size, as inline code, to preserve the register distinction even inside prose.

### 2.3 Spacing

8px base grid, harmonic scale:

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 24px
--space-6: 32px
--space-7: 48px
--space-8: 64px
```

### 2.4 Radii, Elevation, Motion

```
--radius-sm: 4px    /* inline code chips, badges */
--radius-md: 6px    /* buttons, input drop-zone */
--radius-lg: 10px   /* pinned explanation card, modals */

--shadow-elevated: 0 8px 24px rgba(0,0,0,0.45)

--ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1)
--duration-fast: 120ms
--duration-base: 200ms
--duration-slow: 320ms
```

Motion principle: nothing bounces, nothing overshoots. All transitions use `--ease-standard`. Cross-fades on the explanation panel use `--duration-base` (200ms). Pane-collapse to mobile layout uses `--duration-slow` (320ms) only on the initial breakpoint transition, not on every resize event (debounce resize handling; only animate on the discrete breakpoint crossing).

---

## 3. Layout System

### 3.1 Breakpoints

```
--bp-mobile:  0–767px    → single column, inline explanation
--bp-tablet:  768–1199px → split pane, panel width 36%
--bp-desktop: 1200px+    → split pane, panel width 40%, max content width 1440px centered
```

### 3.2 Desktop / Tablet Structure (≥768px)

```
┌────────────────────────────────────────────────────────────────┐
│ HEADER  — height 56px, bg var(--color-bg-header)                │
│ [● Manifest Inspector]         [Load sample] [Upload] [Docs ?]  │
├──────────────────────────────┬───────────────────────────────────┤
│ TREE PANE (60% / 64% desktop) │ EXPLANATION PANEL (40% / 36%)     │
│ bg var(--color-bg-tree-pane)  │ bg var(--color-bg-panel)          │
│ padding: var(--space-6)       │ padding: var(--space-6)           │
│                                │                                    │
│  monospace JSON tree,          │  [EMPTY / DEFAULT / ACTIVE state] │
│  line-numbered, collapsible    │  see Section 5                    │
│  at object/array level         │                                    │
│                                │                                    │
└──────────────────────────────┴───────────────────────────────────┘
```

- Pane divider: 1px solid `--color-border-hairline`, not draggable in v1 (fixed ratio; draggable resize is an explicit non-goal to avoid scope creep).
- Tree pane and panel scroll independently. The panel does **not** scroll-sync to the tree; it only updates content on hover/focus/click of a tree node.
- Header height fixed at 56px, never scrolls with content (`position: sticky; top: 0`).

### 3.3 Mobile Structure (<768px)

Single column. No side panel. Explanation appears **inline, directly beneath the selected/tapped key**, pushing subsequent tree lines downward — this is the one deliberate borrowing from the "Card" concept, solving the lack of screen real estate for a fixed second pane.

```
┌───────────────────────────┐
│ HEADER (48px)             │
├───────────────────────────┤
│ "manifest_version": 3     │
│ "name": "My Extension"    │ <- tapped
│ ┌───────────────────────┐ │
│ │ EXPLANATION CARD       │ │ <- inserted inline, bg elevated,
│ │ radius-lg, shadow      │ │    radius-lg, shadow-elevated
│ └───────────────────────┘ │
│ "permissions": [...]      │
└───────────────────────────┘
```

Only one inline card is open at a time; opening a new one closes the previous with a 120ms collapse before the new one expands (never two open simultaneously — avoids runaway vertical scroll).

---

## 4. Component Specifications

### 4.1 Header

- Height: 56px desktop/tablet, 48px mobile.
- Left: small filled circle (8px diameter, `--color-accent-primary`) + wordmark "Manifest Inspector", `--text-md`, `--weight-semibold`, `--color-text-primary`.
- Right (desktop): three items right-aligned, `--space-4` gap: "Load sample" (text button), "Upload" (primary button, see 4.4), "?" (icon button, opens a lightweight keyboard-shortcut/about popover, not a full docs page).
- Right (mobile): collapse "Load sample" and "?" into a single overflow icon button (⋯); "Upload" remains visible.

### 4.2 JSON Tree (left pane)

- Rendered as an indented, syntax-colored tree, not raw pretty-printed text — each key/value pair is an individually interactive DOM node (not just decorated text), because hover/focus targets must be per-field, not per-line-of-text.
- Indentation: `--space-5` (24px) per nesting level, with a 1px vertical guide line in `--color-border-hairline` connecting a parent to its children (classic tree-guide convention).
- Line height: `--text-sm` line-height (20px), fixed row height for alignment with line numbers.
- Line numbers: `--text-xs`, `--color-text-tertiary`, right-aligned in a 32px gutter, `user-select: none`.
- Collapsible nodes: objects and arrays show a disclosure triangle (▸/▾, 12px, `--color-text-secondary`) to the left of the key. Collapsing an object shows `{…}` with item count, e.g. `{ 4 keys }` in `--color-text-tertiary`.
- Default collapse state on load: everything expanded up to depth 2, deeper nested objects (e.g. deeply nested `content_scripts` matches arrays) start collapsed to avoid an overwhelming initial wall of text.

**Interaction states per field row:**
- **Default:** no background, key in `--color-json-key`, no underline.
- **Hover:** background `--color-bg-elevated` at 40% opacity applied as an overlay (`rgba(32,32,39,0.4)`), key gains a 1px bottom border in `--color-accent-primary`, cursor `pointer`. Explanation panel cross-fades to this field's content over `--duration-base`.
- **Focus (keyboard):** identical visual treatment to hover, plus a 2px outline in `--color-border-focus` with 2px offset, for keyboard navigation via Tab/Arrow keys between fields.
- **Active/Pinned (click):** field row background becomes `--color-bg-elevated` at full opacity, a small filled 6px dot appears to the left of the line number (pin indicator). Explanation panel content becomes "pinned" — it will not change on subsequent hover of other fields until the user clicks elsewhere or presses Escape. Clicking the same field again, or pressing Escape, un-pins.
- **Unknown/future field** (key not in our field dictionary — e.g. a newer Manifest field we don't yet document): key renders in `--color-text-secondary` instead of `--color-json-key` (visually flagged as "we don't have a note for this one"), and the explanation panel shows the "Unknown Field" state (see 5.4).
- **Deprecated field** (e.g. Manifest V2 fields like `"browser_action"` when V3 is detected, or vice versa): key gets a dashed underline in `--color-accent-secondary` (coral) instead of the hover cyan, and hovering shows the standard explanation plus a deprecation notice block at the top of the panel content, coral left-border, 4px, `--radius-sm`.

### 4.3 Explanation Panel (right pane / inline card)

This is the product. Structure of its content area, top to bottom:

1. **Eyebrow label** — `--text-xs`, `--letter-spacing-caps`, `--color-text-tertiary`, uppercase, e.g. `TOP-LEVEL FIELD` or `PERMISSIONS[2]` (shows array index if inside an array).
2. **Field name heading** — `--text-md`, `--weight-semibold`, `--color-text-primary`, rendered as inline-code style (monospace, `--radius-sm` background chip in `--color-bg-elevated`, `--space-2` horizontal padding), e.g. `"background"`.
3. **One-line definition** — `--text-base`, `--font-sans`, `--color-text-explanation`, a single authoritative sentence. This is the sentence a developer reads in under two seconds and already understands the field.
4. **Extended explanation** — `--text-base`, `--font-sans`, `--color-text-explanation`, 2–4 sentences of prose giving context: why it exists, common values, gotchas. Field names mentioned inline use the inline-code chip style at `--text-sm`.
5. **Example block** (where relevant) — a small syntax-highlighted code sample showing a realistic value for this field, in `--font-mono`, `--text-sm`, on `--color-bg-elevated` background, `--radius-md`, `--space-4` padding.
6. **Version note** (where relevant) — small badge row: "Manifest V2" / "Manifest V3" / "Both", coral badge if this field behaves differently or is deprecated in one version.
7. **Divider + "Related fields"** (optional) — up to 3 pill-shaped links (`--radius-sm`, `--color-bg-elevated`, `--text-xs`) to related keys, e.g. from `"background"` → `"service_worker"`, `"persistent"`. Clicking scrolls the tree pane to and pins that field.

Panel content transition: outgoing content fades out over 80ms, incoming content fades in over 120ms with a 4px upward slide (`transform: translateY(4px) → translateY(0)`), total perceived transition ≈200ms (`--duration-base`).

### 4.4 Buttons

- **Primary ("Upload")**: bg `--color-accent-primary`, text `--color-bg-header` (dark text on cyan for contrast), `--radius-md`, height 36px, horizontal padding `--space-4`, `--text-sm`, `--weight-medium`. Hover: background lightens 8% (`filter: brightness(1.08)`). Active: brightness(0.95).
- **Text button ("Load sample")**: transparent bg, text `--color-text-secondary`, hover text `--color-text-primary` with underline.
- **Icon button ("?")**: 32×32px, transparent, `--radius-sm`, hover bg `--color-bg-elevated`.

### 4.5 Drop Zone / Input Mechanism

Three input paths, all client-side only (no network call — validate this constraint explicitly in implementation: reading `File.text()` or clipboard paste, never `fetch`/`XMLHttpRequest` of the file content):
1. **Drag-and-drop** anywhere onto the tree pane when empty.
2. **Paste** (Cmd/Ctrl+V) anywhere on the page when empty — captures clipboard text, attempts JSON.parse.
3. **Click "Upload"** → native file picker, accept=".json".

---

## 5. States

### 5.1 Empty State (before any input)

Tree pane shows a centered vertical stack (not left-aligned like the populated tree):
- Icon: a simple 48×48px line-drawn bracket glyph `{ }`, stroke `--color-text-tertiary`, 1.5px stroke width — not a stock icon, not an illustration, a single restrained mark.
- Headline: `--text-xl`, `--weight-semibold`, `--color-text-primary`: "Drop a manifest.json"
- Subtext: `--text-base`, `--color-text-secondary`: "Or paste it anywhere on this page, or click Upload above."
- Secondary text link, `--text-sm`, underlined, `--color-accent-primary`: "Try a sample manifest instead" — loads a bundled example V3 manifest.

Explanation panel in empty state shows a quiet placeholder, vertically centered: `--text-base`, `--color-text-tertiary`, italic-free (no italics anywhere in this UI — use color/weight for emphasis, not style): "Hover any field once your manifest loads, and its explanation appears here."

### 5.2 Loading / Parsing State

For files under ~200KB (the overwhelming majority of manifests), parsing is synchronous and instantaneous — no loading state needed; the tree simply appears. For pasted/dropped content exceeding 200KB, show a brief inline progress treatment: the drop zone icon is replaced by a 20px spinner (simple rotating arc, `--color-accent-primary`, 800ms linear infinite rotation) with text "Parsing large file…" — this state should rarely if ever be visible in practice given manifest.json files are typically under 5KB, but must be handled for robustness (someone may drop the wrong file).

### 5.3 Error State — Invalid JSON

If `JSON.parse` throws:
- Tree pane replaces its content with an error card, `--radius-lg`, `--color-bg-elevated` background, coral left border 4px (`--color-accent-error`), `--space-6` padding.
- Icon: 32×32px triangular alert glyph, stroke `--color-accent-error`.
- Headline: `--text-lg`, `--weight-semibold`, `--color-text-primary`: "This isn't valid JSON"
- Body: `--text-base`, `--color-text-secondary`: report the parser's line/column if available, in plain language, e.g. "There's a syntax problem near line 14 — check for a missing comma or an unclosed brace." Never show the raw parser stack trace.
- Action: text button "Try again" clears input and returns to Empty State.
- Explanation panel remains in its empty-state placeholder — never shows stale content from a previous valid parse.

### 5.4 Valid JSON, Not a Manifest (Unknown Structure)

If the JSON parses but contains none of the expected top-level manifest keys (no `manifest_version`, no `name`, no `version`):
- Tree still renders normally (we don't block rendering of valid JSON), but a persistent banner appears above the tree pane content, full-width within that pane, `--color-bg-elevated` background, `--text-sm`, `--color-text-secondary`: "This doesn't look like a Chrome extension manifest — showing it as raw JSON. Field explanations won't be available." Icon: small info glyph, `--color-text-tertiary`.
- Individual fields still get hover highlighting (visual consistency) but the explanation panel, for every field, shows: "No documentation available — this key isn't part of the standard manifest schema." in `--color-text-tertiary`, `--text-base`.

### 5.5 Unrecognized/Future Field (within an otherwise valid manifest)

Covered in 4.2 — visually flagged key color, and explanation panel shows:
- Eyebrow: "UNRECOGNIZED FIELD"
- Body: `--text-base`, `--color-text-secondary`: "This key isn't in our current field reference. It may be a newer manifest field, or specific to a particular Chrome release. The value is shown as-is below." followed by the example block (4.3, item 5) rendering the actual value found, so the user at least sees what's there even without prose explanation.

### 5.6 Mixed / Ambiguous Version (both V2 and V3 signals present)

If both `"manifest_version": 2` and V3-only fields (e.g. `"action"`, `"service_worker"`) are present, or vice versa — show a persistent warning banner (coral, not red — this is a caution, not a hard error) above the tree: "This manifest mixes Manifest V2 and V3 fields, which Chrome will not accept. Fields inconsistent with the declared version are marked below." Inconsistent fields get the deprecated-field dashed-underline treatment from 4.2.

### 5.7 Very Large Manifest (many permissions / deeply nested content_scripts)

No special visual state — this is handled structurally: arrays beyond 8 visible items show a "+N more" expandable row rather than rendering all items by default, and nesting beyond depth 2 starts collapsed (per 4.2). This prevents the tree pane from becoming an unreadable wall regardless of input size.

---

## 6. Copy Guidelines

- Voice: plain, confident, second-person-implicit (never "you should" — just state facts). "A human-readable string, max 75 characters" not "You need to make sure your name field is under 75 characters."
- Every field's one-line definition (4.3, item 3) must be a single sentence, under ~18 words, that could stand alone as a complete answer.
- Never use "simply," "just," or "obviously" — these words shame the reader for not already knowing.
- Deprecation notices state the fact and the replacement, in that order: "Removed in Manifest V3. Use `service_worker` instead." — not a paragraph of history.
- No exclamation points anywhere in the interface, including empty/success states.
- Error copy never blames the user or the file; it describes the situation and offers the next action.

---

## 7. Accessibility Requirements

- All interactive tree nodes are real focusable elements (`tabindex="0"` or native `button`), navigable via Tab and Arrow Up/Down, not div-with-onclick-only.
- Focus state (4.2) is always visible and distinct from hover — never rely on `:hover` alone to convey interactivity to keyboard users.
- Color is never the sole carrier of meaning: deprecated fields get both a color change AND a dashed underline AND a text badge in the panel; unknown fields get both a color change AND explicit panel copy.
- All text/background pairings meet WCAG AA (verified in Section 2.1).
- Pinning/unpinning and expand/collapse are all operable via Enter/Space when focused, and Escape un-pins.
- Reduced motion: respect `prefers-reduced-motion` — when set, cross-fades and slide transitions collapse to instant (0ms) opacity swaps, no translateY.

---

## 8. Implementation Notes for the Coding Agent

1. Build the field-explanation content as a static, bundled JSON/TS data structure keyed by manifest field path (e.g. `permissions`, `background.service_worker`, `content_scripts[].matches`) — do not call any external API or LLM at runtime; this must work fully offline and instantly, consistent with the "entirely client-side" constraint.
2. The tree renderer should walk the parsed manifest object recursively, emitting one interactive component per key/value pair, and look up its explanation via the data structure in (1) by constructed path; if no match, fall through to the Unrecognized Field state (5.5).
3. Version detection logic: read `manifest_version` first; cross-reference against a maintained list of V2-only and V3-only field names to detect the Mixed/Ambiguous case (5.6).
4. Do not implement pane-resize/drag in v1 — fixed ratios per breakpoint only (Section 3.1).
5. Only one field may be "pinned" at a time (4.2); only one inline card open at a time on mobile (Section 3.3) — enforce this as a single piece of state (`activeFieldPath: string | null`), not independent booleans per field.
6. Use CSS variables exactly as named in Section 2 so future theming/maintenance stays centralized — do not hardcode hex values inline in components.
7. All copy strings from Section 6 and the field-explanation data structure should live in one place (not scattered inline in JSX/template files) to keep tone consistent and easy to audit.
