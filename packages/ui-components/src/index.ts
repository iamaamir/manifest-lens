import type {
  AnalysisSnapshot,
  SemanticNodeId,
} from "@mvviewer/contracts";
import {
  createInitialInspectorState,
  getActiveExplanation,
  getActiveNodeId,
  getNavigableNodeIds,
  inspectorReducer,
  type InspectorAction,
  type InspectorState,
} from "@mvviewer/application";

const MANIFEST_INSPECTOR_TAG = "manifest-inspector";

const EMPTY_STATE_PROMPT = "Drop a manifest.json";
const EMPTY_STATE_LOCAL_NOTE =
  "Paste or drop a manifest.json here, or use Upload above. Processing stays local to this browser.";
const SOURCE_KEYBOARD_INSTRUCTIONS =
  "Use arrow keys to move between explainable fields, Enter or Space to pin an explanation, and Escape to clear.";

type SourceTokenKind =
  | "whitespace"
  | "key"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "bracket";

interface SourceLexeme {
  readonly start: number;
  readonly end: number;
  readonly kind: SourceTokenKind;
}

interface SourceSegment {
  readonly text: string;
  readonly nodeId: SemanticNodeId | null;
  readonly tokenKind: SourceTokenKind;
}

function isJsonWhitespace(character: string): boolean {
  return (
    character === " " || character === "\n" || character === "\r" || character === "\t"
  );
}

function isJsonPunctuation(character: string): boolean {
  return (
    character === "{"
    || character === "}"
    || character === "["
    || character === "]"
    || character === ":"
    || character === ","
  );
}

function isNumberStart(character: string): boolean {
  return character === "-" || (character >= "0" && character <= "9");
}

function readJsonStringEnd(text: string, start: number): number {
  let offset = start + 1;
  let escaped = false;
  while (offset < text.length) {
    const character = text[offset]!;
    offset += 1;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === "\"") {
      return offset;
    }
  }
  return offset;
}

function readWhile(text: string, start: number, predicate: (character: string) => boolean): number {
  let offset = start;
  while (offset < text.length && predicate(text[offset]!)) {
    offset += 1;
  }
  return offset;
}

function classifyJsonString(text: string, end: number): SourceTokenKind {
  let offset = end;
  while (offset < text.length && isJsonWhitespace(text[offset]!)) {
    offset += 1;
  }
  return text[offset] === ":" ? "key" : "string";
}

function lexSourceText(text: string): readonly SourceLexeme[] {
  const lexemes: SourceLexeme[] = [];
  let offset = 0;

  while (offset < text.length) {
    const character = text[offset]!;

    if (isJsonWhitespace(character)) {
      const end = readWhile(text, offset, isJsonWhitespace);
      lexemes.push({ start: offset, end, kind: "whitespace" });
      offset = end;
      continue;
    }

    if (character === "\"") {
      const end = readJsonStringEnd(text, offset);
      lexemes.push({ start: offset, end, kind: classifyJsonString(text, end) });
      offset = end;
      continue;
    }

    if (isJsonPunctuation(character)) {
      lexemes.push({ start: offset, end: offset + 1, kind: "bracket" });
      offset += 1;
      continue;
    }

    if (text.startsWith("true", offset) || text.startsWith("false", offset)) {
      const end = offset + (text.startsWith("true", offset) ? 4 : 5);
      lexemes.push({ start: offset, end, kind: "boolean" });
      offset = end;
      continue;
    }

    if (text.startsWith("null", offset)) {
      const end = offset + 4;
      lexemes.push({ start: offset, end, kind: "null" });
      offset = end;
      continue;
    }

    if (isNumberStart(character)) {
      const end = readWhile(text, offset, (candidate) => /[0-9eE+.-]/.test(candidate));
      lexemes.push({ start: offset, end, kind: "number" });
      offset = end;
      continue;
    }

    lexemes.push({ start: offset, end: offset + 1, kind: "string" });
    offset += 1;
  }

  return lexemes;
}

function lexemeAt(lexemes: readonly SourceLexeme[], start: number, end: number): SourceLexeme | undefined {
  return lexemes.find((lexeme) => lexeme.start <= start && end <= lexeme.end);
}

function splitIntoSegments(
  snapshot: AnalysisSnapshot,
): readonly SourceSegment[] {
  const text = snapshot.document.text;
  const explainable = snapshot.semantic.nodes.filter(
    (node) => node.id in snapshot.explanationsByNodeId,
  );
  const lexemes = lexSourceText(text);

  if (text.length === 0) {
    return [];
  }

  const cutPoints = new Set<number>([0, text.length]);
  for (const lexeme of lexemes) {
    cutPoints.add(lexeme.start);
    cutPoints.add(lexeme.end);
  }
  for (const node of explainable) {
    cutPoints.add(node.sourceRange.start.offset);
    cutPoints.add(node.sourceRange.end.offset);
  }
  const offsets = [...cutPoints]
    .filter((offset) => offset >= 0 && offset <= text.length)
    .sort((left, right) => left - right);

  const segments: SourceSegment[] = [];
  for (let i = 0; i < offsets.length - 1; i += 1) {
    const start = offsets[i]!;
    const end = offsets[i + 1]!;
    if (start === end) continue;

    let bestNode: (typeof explainable)[number] | null = null;
    for (const node of explainable) {
      const nodeStart = node.sourceRange.start.offset;
      const nodeEnd = node.sourceRange.end.offset;
      if (nodeStart <= start && end <= nodeEnd) {
        if (
          bestNode === null ||
          nodeEnd - nodeStart < bestNode.sourceRange.end.offset - bestNode.sourceRange.start.offset
        ) {
          bestNode = node;
        }
      }
    }

    const lexeme = lexemeAt(lexemes, start, end);
    segments.push({
      text: text.slice(start, end),
      nodeId: bestNode ? bestNode.id : null,
      tokenKind: lexeme?.kind ?? "string",
    });
  }

  return segments;
}

function explainableNodeIdsFor(snapshot: AnalysisSnapshot): readonly SemanticNodeId[] {
  return snapshot.semantic.nodes
    .filter((node) => node.id in snapshot.explanationsByNodeId)
    .map((node) => node.id);
}

function nodeLabel(snapshot: AnalysisSnapshot, nodeId: SemanticNodeId): string {
  const node = snapshot.semantic.nodes.find((n) => n.id === nodeId);
  if (!node) return nodeId;
  const pathText = node.normalizedPath || "manifest";
  const fieldText = "fieldName" in node ? String(node.fieldName) : node.kind;
  return `${fieldText} (${pathText})`;
}

function isStructuralSourceSegment(segment: SourceSegment): boolean {
  return segment.tokenKind === "whitespace" || segment.tokenKind === "bracket";
}

function sourceTokenClass(kind: SourceTokenKind): string {
  switch (kind) {
    case "key":
      return "source-token-key";
    case "string":
      return "source-token-string";
    case "number":
      return "source-token-number";
    case "boolean":
      return "source-token-boolean";
    case "null":
      return "source-token-null";
    case "bracket":
      return "source-token-bracket";
    case "whitespace":
      return "source-token-whitespace";
  }
}

function sourceLineCount(text: string): number {
  return Math.max(1, text.split("\n").length);
}

const STYLE = `
  :host {
    display: block;
    overflow: hidden;
    min-height: 360px;
    color-scheme: dark;
    --color-bg-canvas: #121214;
    --color-bg-tree-pane: #16161A;
    --color-bg-panel: #1B1B20;
    --color-bg-header: #0D0D0F;
    --color-bg-elevated: #202027;
    --color-border-hairline: #2A2A31;
    --color-border-focus: #5EEAD4;
    --color-text-primary: #EDEDEF;
    --color-text-secondary: #A6A6AE;
    --color-text-tertiary: #6E6E78;
    --color-text-explanation: #D9D9DE;
    --color-accent-primary: #5EEAD4;
    --color-accent-error: #F87171;
    --color-json-key: #7DD3FC;
    --color-json-string: #A7F3D0;
    --color-json-number: #FDE68A;
    --color-json-boolean: #F5A97F;
    --color-json-null: #6E6E78;
    --color-json-bracket: #6E6E78;
    --mi-color-background: var(--color-bg-canvas);
    --mi-color-surface: var(--color-bg-tree-pane);
    --mi-color-surface-raised: var(--color-bg-elevated);
    --mi-color-text: var(--color-text-primary);
    --mi-color-muted: var(--color-text-secondary);
    --mi-color-border: var(--color-border-hairline);
    --mi-color-highlight: rgba(94, 234, 212, 0.14);
    --mi-color-pinned: var(--color-bg-elevated);
    --mi-color-hover: rgba(32, 32, 39, 0.72);
    --mi-color-focus: var(--color-border-focus);
    --mi-font-ui: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --mi-font-code: "JetBrains Mono", "SF Mono", ui-monospace, monospace;
    --mi-radius-sm: 4px;
    --mi-radius-md: 6px;
    --mi-radius-lg: 10px;
    font-family: var(--mi-font-ui);
    color: var(--mi-color-text);
    background: var(--color-bg-canvas);
    border: 0;
    border-radius: 0;
  }

  .inspector {
    display: grid;
    min-height: inherit;
    grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr);
    background: var(--color-border-hairline);
    gap: 1px;
  }

  @media (max-width: 820px) {
    .inspector {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .source-pane,
  .explanation-pane {
    min-width: 0;
    overflow: auto;
    scrollbar-gutter: stable;
    overscroll-behavior: contain;
  }

  .source-pane {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    padding: 24px;
    background: var(--color-bg-tree-pane);
  }

  .explanation-pane {
    padding: 24px;
    background: var(--color-bg-panel);
    color: var(--color-text-explanation);
  }

  .pane-header {
    display: flex;
    gap: 16px;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-border-hairline);
  }

  .pane-title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 11px;
    font-weight: 600;
    line-height: 16px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .pane-kicker {
    margin: 0;
    color: var(--color-text-tertiary);
    font-size: 11px;
    line-height: 16px;
  }

  .source-instructions {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .source-frame {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    min-height: 100%;
    overflow: auto;
    color: var(--color-text-secondary);
    background: #101013;
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--mi-radius-lg);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
  }

  .source-gutter {
    margin: 0;
    padding: 16px 10px 16px 0;
    color: var(--color-text-tertiary);
    border-right: 1px solid rgba(42, 42, 49, 0.72);
    font-family: var(--mi-font-code);
    font-size: 11px;
    line-height: 20px;
    list-style: none;
    text-align: right;
    user-select: none;
  }

  .source-gutter-line {
    position: relative;
    height: 20px;
    font-variant-numeric: tabular-nums;
  }

  .source-gutter-line::before {
    position: absolute;
    top: 7px;
    left: 7px;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    content: "";
  }

  .source-gutter-line.is-focused::before {
    background: transparent;
    box-shadow: 0 0 0 1px var(--color-border-focus);
  }

  .source-gutter-line.is-active::before,
  .source-gutter-line.is-pinned::before {
    background: var(--color-accent-primary);
  }

  .source-gutter-line.is-pinned::after {
    position: absolute;
    top: 4px;
    left: 4px;
    color: var(--color-accent-primary);
    font-size: 10px;
    line-height: 1;
    content: "•";
  }

  .source-region {
    display: block;
    min-width: max-content;
    border-radius: 0;
  }

  .source-region:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: -2px;
  }

  .source-pre {
    min-height: 100%;
    margin: 0;
    padding: 16px;
    color: var(--color-text-secondary);
    background: transparent;
    border: 0;
    border-radius: 0;
    font-family: var(--mi-font-code);
    font-size: 13px;
    line-height: 20px;
    white-space: pre;
    tab-size: 2;
    overflow: visible;
  }

  .source-node {
    border-radius: var(--mi-radius-sm);
    cursor: pointer;
    padding: 0 0.08em;
    color: inherit;
    background: transparent;
    transition:
      background-color 120ms cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 120ms cubic-bezier(0.4, 0, 0.2, 1),
      color 120ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .source-node:hover {
    background: var(--mi-color-hover);
    box-shadow: inset 0 -1px 0 0 var(--color-accent-primary);
  }

  .source-node.is-active {
    background: var(--mi-color-highlight);
    box-shadow: inset 0 -2px 0 0 var(--color-accent-primary);
  }

  .source-node.is-pinned {
    background: var(--mi-color-pinned);
    box-shadow:
      inset 0 -2px 0 0 var(--color-accent-primary),
      0 0 0 1px rgba(94, 234, 212, 0.16);
  }

  .source-token-key {
    color: var(--color-json-key);
  }

  .source-token-string {
    color: var(--color-json-string);
  }

  .source-token-number {
    color: var(--color-json-number);
  }

  .source-token-boolean {
    color: var(--color-json-boolean);
  }

  .source-token-null {
    color: var(--color-json-null);
  }

  .source-token-bracket {
    color: var(--color-json-bracket);
  }

  .source-token-whitespace {
    color: inherit;
  }

  .source-node.is-structural {
    padding-inline: 0;
    color: var(--color-json-bracket);
    cursor: default;
  }

  .source-node.is-structural:not(.is-representative) {
    pointer-events: none;
  }

  .source-node.is-structural:not(.is-representative-focused) {
    background: transparent;
    box-shadow: none;
  }

  .source-node.is-structural.is-representative {
    cursor: pointer;
  }

  .source-node.is-representative-focused {
    background: var(--mi-color-highlight);
    box-shadow:
      inset 0 -2px 0 0 var(--color-accent-primary),
      0 0 0 2px rgba(94, 234, 212, 0.3);
  }

  .explanation-title {
    display: inline-block;
    max-width: 100%;
    margin: 0 0 16px;
    padding: 4px 8px;
    color: var(--color-text-primary);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--mi-radius-sm);
    font-family: var(--mi-font-code);
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
    overflow-wrap: anywhere;
  }

  .explanation-breadcrumb {
    width: fit-content;
    max-width: 100%;
    margin: 0 0 16px;
    color: var(--color-text-tertiary);
    font-size: 11px;
    font-weight: 600;
    line-height: 16px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    overflow-wrap: anywhere;
  }

  .explanation-summary {
    margin: 0 0 16px;
    color: var(--color-text-explanation);
    font-size: 14px;
    line-height: 22px;
  }

  .explanation-details {
    margin: 0 0 20px;
    padding-left: 20px;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 22px;
  }

  .explanation-details li + li,
  .explanation-docs li + li {
    margin-top: 8px;
  }

  .explanation-section-label {
    margin: 0 0 8px;
    color: var(--color-text-tertiary);
    font-size: 11px;
    font-weight: 600;
    line-height: 16px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .explanation-docs {
    margin: 0;
    padding-left: 20px;
    color: var(--color-text-secondary);
    font-size: 13px;
    line-height: 20px;
  }

  .explanation-docs a {
    color: var(--color-accent-primary);
    text-underline-offset: 3px;
  }

  .explanation-docs a:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
    border-radius: var(--mi-radius-sm);
  }

  .explanation-empty {
    display: grid;
    min-height: 240px;
    place-content: center;
    margin: 0;
    color: var(--color-text-tertiary);
    font-size: 14px;
    line-height: 22px;
    text-align: center;
  }

  .empty-state {
    display: grid;
    place-content: center;
    justify-items: center;
    min-height: 320px;
    margin: 0;
    padding: 32px 24px;
    text-align: center;
  }

  .empty-glyph {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    margin-bottom: 16px;
    color: var(--color-text-tertiary);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--mi-radius-lg);
    font-family: var(--mi-font-code);
    font-size: 20px;
    line-height: 1;
  }

  .empty-state h2 {
    margin: 0 0 8px;
    color: var(--color-text-primary);
    font-size: 24px;
    font-weight: 600;
    line-height: 32px;
    letter-spacing: -0.03em;
  }

  .empty-state p {
    max-width: 30rem;
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 22px;
  }

  :host(:focus-visible) {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 3px;
  }

  @media (max-width: 820px) {
    .source-pane,
    .explanation-pane {
      padding: 16px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .source-node {
      transition-duration: 0.01ms;
    }
  }

  @media (forced-colors: active) {
    .source-gutter-line.is-active::before,
    .source-gutter-line.is-pinned::before {
      background: Highlight;
    }

    .source-gutter-line.is-focused::before {
      box-shadow: 0 0 0 1px Highlight;
    }
  }

  @media (prefers-contrast: more) {
    .source-node.is-active,
    .source-node.is-pinned,
    .source-node.is-representative-focused {
      outline: 2px solid CanvasText;
      outline-offset: 1px;
    }
  }
`;

export class ManifestInspectorElement extends HTMLElement {
  static get observedAttributes(): readonly string[] {
    return [];
  }

  private readonly root: ShadowRoot;
  private state: InspectorState = createInitialInspectorState();
  private snapshot: AnalysisSnapshot | null = null;
  private sourceRegion: HTMLElement | null = null;
  private sourceGutter: HTMLElement | null = null;
  private explanationPane: HTMLElement | null = null;
  private representativeIdByNode = new Map<SemanticNodeId, string>();

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.renderEmptyState();
  }

  get snapshotValue(): AnalysisSnapshot | null {
    return this.snapshot;
  }

  loadSnapshot(snapshot: AnalysisSnapshot): void {
    this.snapshot = snapshot;
    this.state = inspectorReducer(this.state, { type: "snapshot/set", snapshot });
    this.render();
  }

  clear(): void {
    this.snapshot = null;
    this.sourceRegion = null;
    this.explanationPane = null;
    this.representativeIdByNode = new Map();
    this.state = inspectorReducer(this.state, { type: "snapshot/clear" });
    this.renderEmptyState();
  }

  private dispatch(action: InspectorAction): void {
    this.state = inspectorReducer(this.state, action);
    this.updateInteractionState();
  }

  private updateInteractionState(): void {
    if (!this.snapshot) return;
    if (this.sourceRegion) this.updateSourceHighlight(this.sourceRegion);
    this.updateExplanationPane();
  }

  private renderEmptyState(): void {
    const style = document.createElement("style");
    style.textContent = STYLE;

    const container = document.createElement("section");
    container.className = "inspector";

    const sourcePane = document.createElement("section");
    sourcePane.className = "source-pane";
    sourcePane.setAttribute("part", "source-pane");

    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";

    const glyph = document.createElement("div");
    glyph.className = "empty-glyph";
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = "{ }";

    const heading = document.createElement("h2");
    heading.textContent = EMPTY_STATE_PROMPT;

    const note = document.createElement("p");
    note.textContent = EMPTY_STATE_LOCAL_NOTE;

    emptyState.append(glyph, heading, note);
    sourcePane.append(emptyState);

    const explanationPane = document.createElement("section");
    explanationPane.className = "explanation-pane";
    explanationPane.setAttribute("part", "explanation-panel");

    const placeholder = document.createElement("p");
    placeholder.className = "explanation-empty";
    placeholder.textContent =
      "Hover any field once your manifest loads, and its explanation appears here.";
    explanationPane.append(placeholder);

    container.append(sourcePane, explanationPane);

    this.root.replaceChildren(style, container);
  }

  private render(): void {
    if (!this.snapshot) {
      this.renderEmptyState();
      return;
    }

    const style = document.createElement("style");
    style.textContent = STYLE;

    const layout = document.createElement("div");
    layout.className = "inspector";

    const sourcePane = this.renderSourcePane();
    const explanationPane = this.renderExplanationPane();
    this.explanationPane = explanationPane;

    layout.append(sourcePane, explanationPane);
    this.root.replaceChildren(style, layout);

    this.updateInteractionState();
  }

  private renderSourcePane(): HTMLElement {
    const pane = document.createElement("section");
    pane.className = "source-pane";
    pane.setAttribute("part", "source-pane");

    const header = document.createElement("div");
    header.className = "pane-header";

    const heading = document.createElement("h2");
    heading.className = "pane-title";
    heading.textContent = "Source";

    const kicker = document.createElement("p");
    kicker.className = "pane-kicker";
    kicker.textContent = "Original formatting preserved";

    header.append(heading, kicker);
    pane.append(header);

    const instructions = document.createElement("p");
    instructions.id = "source-instructions";
    instructions.className = "source-instructions";
    instructions.textContent = SOURCE_KEYBOARD_INSTRUCTIONS;
    pane.append(instructions);

    const sourceFrame = document.createElement("div");
    sourceFrame.className = "source-frame";

    const gutter = document.createElement("ol");
    gutter.className = "source-gutter";
    gutter.setAttribute("aria-hidden", "true");
    const lineCount = sourceLineCount(this.snapshot!.document.text);
    for (let line = 1; line <= lineCount; line += 1) {
      const lineNumber = document.createElement("li");
      lineNumber.className = "source-gutter-line";
      lineNumber.dataset.line = String(line);
      lineNumber.textContent = String(line);
      gutter.append(lineNumber);
    }

    const pre = document.createElement("pre");
    pre.className = "source-pre source-region";
    pre.setAttribute("part", "source-region");
    pre.setAttribute("tabindex", "0");
    pre.setAttribute("role", "listbox");
    pre.setAttribute("aria-label", "Explainable manifest fields");
    pre.setAttribute("aria-describedby", "source-instructions");

    const segments = splitIntoSegments(this.snapshot!);
    const navigableIds = new Set(getNavigableNodeIds(this.snapshot!));

    const representativeIdByNode = new Map<SemanticNodeId, string>();
    const representativeIsStructuralByNode = new Map<SemanticNodeId, boolean>();
    let segmentIndex = 0;

    for (const segment of segments) {
      if (segment.nodeId === null || !navigableIds.has(segment.nodeId)) {
        const token = document.createElement("span");
        token.className = sourceTokenClass(segment.tokenKind);
        token.textContent = segment.text;
        pre.append(token);
        continue;
      }

      segmentIndex += 1;
      const domId = `source-node-${segment.nodeId}-${segmentIndex}`;
      const isStructural = isStructuralSourceSegment(segment);
      const existing = representativeIdByNode.get(segment.nodeId);
      const existingIsStructural = representativeIsStructuralByNode.get(segment.nodeId);
      if (existing === undefined || (existingIsStructural === true && !isStructural)) {
        representativeIdByNode.set(segment.nodeId, domId);
        representativeIsStructuralByNode.set(segment.nodeId, isStructural);
      }

      const span = document.createElement("span");
      span.className = isStructural
        ? `source-node is-structural ${sourceTokenClass(segment.tokenKind)}`
        : `source-node ${sourceTokenClass(segment.tokenKind)}`;
      span.setAttribute("part", "source-node");
      span.dataset.nodeId = segment.nodeId;
      span.id = domId;
      span.setAttribute("role", "option");
      span.setAttribute("aria-selected", "false");
      span.setAttribute("aria-label", nodeLabel(this.snapshot!, segment.nodeId));
      span.textContent = segment.text;
      pre.append(span);
    }

    const sourceNodes = pre.querySelectorAll<HTMLElement>(".source-node");
    sourceNodes.forEach((span) => {
      const nodeId = span.dataset.nodeId as SemanticNodeId | undefined;
      if (!nodeId) return;
      const representativeId = representativeIdByNode.get(nodeId);
      if (!representativeId) return;
      span.dataset.representativeId = representativeId;
      span.classList.toggle("is-representative", span.id === representativeId);
    });

    this.representativeIdByNode = representativeIdByNode;

    pre.addEventListener("mouseover", this.handleSourcePointerOver);
    pre.addEventListener("mouseout", this.handleSourcePointerOut);
    pre.addEventListener("click", this.handleSourceClick);
    pre.addEventListener("keydown", this.handleSourceKeydown);

    this.sourceRegion = pre;
    this.sourceGutter = gutter;
    sourceFrame.append(gutter, pre);
    pane.append(sourceFrame);
    return pane;
  }

  private updateSourceHighlight(pre: HTMLElement): void {
    if (!this.snapshot) return;

    const activeId = getActiveNodeId(this.state);
    const pinnedId =
      this.state.selection.kind === "pinned"
        ? this.state.selection.nodeId
        : this.state.selection.kind === "hoverPreview"
          ? this.state.selection.pinnedNodeId
          : null;
    const hoveredId =
      this.state.selection.kind === "hovered"
        ? this.state.selection.nodeId
        : this.state.selection.kind === "hoverPreview"
          ? this.state.selection.hoveredNodeId
          : null;
    const focusedId = this.state.focusedNodeId;

    const representativeId = focusedId
      ? this.representativeIdByNode.get(focusedId)
      : undefined;

    const spans = pre.querySelectorAll<HTMLElement>(".source-node");
    spans.forEach((span) => {
      const nodeId = span.dataset.nodeId ?? "";
      const isActive = nodeId === activeId || nodeId === hoveredId;
      const isPinned = nodeId === pinnedId;
      const isFocused = nodeId === focusedId;
      const isRepresentativeFocused = isFocused && span.id === representativeId;
      span.classList.toggle("is-active", isActive);
      span.classList.toggle("is-pinned", isPinned);
      span.classList.toggle("is-focused", isFocused);
      span.classList.toggle("is-representative-focused", isRepresentativeFocused);
      span.setAttribute("aria-selected", isPinned ? "true" : "false");
    });

    if (representativeId) {
      pre.setAttribute("aria-activedescendant", representativeId);
    } else {
      pre.removeAttribute("aria-activedescendant");
    }

    this.updateSourceGutter(activeId, pinnedId, focusedId);
  }

  private updateSourceGutter(
    activeId: SemanticNodeId | null,
    pinnedId: SemanticNodeId | null,
    focusedId: SemanticNodeId | null,
  ): void {
    if (!this.snapshot || !this.sourceGutter) return;

    const activeLines = this.lineSetForNodeId(activeId);
    const pinnedLines = this.lineSetForNodeId(pinnedId);
    const focusedLines = this.lineSetForNodeId(focusedId);

    const lines = this.sourceGutter.querySelectorAll<HTMLElement>(
      ".source-gutter-line",
    );
    lines.forEach((line) => {
      const lineNumber = Number(line.dataset.line);
      line.classList.toggle("is-active", activeLines.has(lineNumber));
      line.classList.toggle("is-pinned", pinnedLines.has(lineNumber));
      line.classList.toggle("is-focused", focusedLines.has(lineNumber));
    });
  }

  private lineSetForNodeId(nodeId: SemanticNodeId | null): ReadonlySet<number> {
    const lines = new Set<number>();
    if (!this.snapshot || !nodeId) return lines;
    const node = this.snapshot.semantic.nodes.find(
      (candidate) => candidate.id === nodeId,
    );
    if (!node) return lines;

    const startLine = Math.max(1, node.sourceRange.start.line);
    const endLine = Math.max(startLine, node.sourceRange.end.line);
    for (let line = startLine; line <= endLine; line += 1) {
      lines.add(line);
    }
    return lines;
  }

  private closestInteractiveSourceNode(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) return null;
    const sourceNode = target.closest<HTMLElement>(".source-node");
    if (!sourceNode || !sourceNode.dataset.nodeId) return null;
    if (
      sourceNode.classList.contains("is-structural") &&
      !sourceNode.classList.contains("is-representative")
    ) {
      return null;
    }
    return sourceNode;
  }

  private handleSourcePointerOver = (event: MouseEvent): void => {
    if (!this.snapshot) return;
    const target = this.closestInteractiveSourceNode(event.target);
    if (!target || !target.dataset.nodeId) return;
    this.dispatch({ type: "node/hover", nodeId: target.dataset.nodeId as SemanticNodeId });
  };

  private handleSourcePointerOut = (event: MouseEvent): void => {
    if (!this.snapshot) return;
    if (this.closestInteractiveSourceNode(event.relatedTarget)) return;
    this.dispatch({ type: "node/hoverEnd" });
  };

  private handleSourceClick = (event: MouseEvent): void => {
    if (!this.snapshot) return;
    const target = this.closestInteractiveSourceNode(event.target);
    if (!target || !target.dataset.nodeId) return;
    this.dispatch({ type: "node/select", nodeId: target.dataset.nodeId as SemanticNodeId });
  };

  private renderExplanationPane(): HTMLElement {
    const pane = document.createElement("section");
    pane.className = "explanation-pane";
    pane.setAttribute("part", "explanation-panel");

    const header = document.createElement("div");
    header.className = "pane-header";

    const heading = document.createElement("h2");
    heading.className = "pane-title";
    heading.textContent = "Explanation";

    const kicker = document.createElement("p");
    kicker.className = "pane-kicker";
    kicker.textContent = "Hover, tap, or pin a field";

    header.append(heading, kicker);
    pane.append(header, this.buildExplanationContent());
    return pane;
  }

  private updateExplanationPane(): void {
    if (!this.explanationPane) return;
    const content = this.buildExplanationContent();
    const header = this.explanationPane.querySelector(".pane-header");
    if (header) {
      this.explanationPane.replaceChildren(header, content);
    } else {
      this.explanationPane.replaceChildren(content);
    }
  }

  private buildExplanationContent(): DocumentFragment {
    const fragment = document.createDocumentFragment();

    const explanation = getActiveExplanation(this.state);
    if (!explanation) {
      const empty = document.createElement("p");
      empty.className = "explanation-empty";
      empty.textContent =
        "Hover any field once your manifest loads, and its explanation appears here.";
      fragment.append(empty);
      return fragment;
    }

    const title = document.createElement("h2");
    title.className = "explanation-title";
    title.textContent = explanation.title;
    fragment.append(title);

    const breadcrumb = this.renderBreadcrumb();
    if (breadcrumb) fragment.append(breadcrumb);

    const summary = document.createElement("p");
    summary.className = "explanation-summary";
    summary.textContent = explanation.summary;
    fragment.append(summary);

    if (explanation.details.length > 0) {
      const list = document.createElement("ul");
      list.className = "explanation-details";
      for (const detail of explanation.details) {
        const item = document.createElement("li");
        item.textContent = detail;
        list.append(item);
      }
      fragment.append(list);
    }

    if (explanation.docsLinks.length > 0) {
      const label = document.createElement("p");
      label.className = "explanation-section-label";
      label.textContent = "Documentation";
      const list = document.createElement("ul");
      list.className = "explanation-docs";
      for (const link of explanation.docsLinks) {
        const item = document.createElement("li");
        const anchor = document.createElement("a");
        anchor.href = link.url;
        anchor.textContent = link.label;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        item.append(anchor);
        list.append(item);
      }
      fragment.append(label, list);
    }

    return fragment;
  }

  private renderBreadcrumb(): HTMLElement | null {
    if (!this.snapshot) return null;
    const activeId = getActiveNodeId(this.state);
    if (!activeId) return null;
    const node = this.snapshot.semantic.nodes.find((n) => n.id === activeId);
    if (!node) return null;

    const text = node.breadcrumb.map((segment) => segment.label).join(" › ");
    if (!text) return null;

    const paragraph = document.createElement("p");
    paragraph.className = "explanation-breadcrumb";
    paragraph.textContent = text;
    return paragraph;
  }

  private handleSourceKeydown = (event: KeyboardEvent): void => {
    if (!this.snapshot) return;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        this.dispatch({ type: "node/focusNext" });
        this.scrollFocusedIntoView();
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        this.dispatch({ type: "node/focusPrevious" });
        this.scrollFocusedIntoView();
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (this.state.focusedNodeId) {
          this.dispatch({ type: "node/select", nodeId: this.state.focusedNodeId });
        }
        break;
      case "Escape":
        event.preventDefault();
        this.dispatch({ type: "node/clearSelection" });
        break;
    }
  };

  private scrollFocusedIntoView(): void {
    const focusedId = this.state.focusedNodeId;
    if (!focusedId) return;
    const representativeId = this.representativeIdByNode.get(focusedId);
    if (!representativeId) return;
    const span = this.root.getElementById(representativeId);
    span?.scrollIntoView({ block: "nearest" });
  }
}

export function registerManifestInspector(): void {
  if (!customElements.get(MANIFEST_INSPECTOR_TAG)) {
    customElements.define(MANIFEST_INSPECTOR_TAG, ManifestInspectorElement);
  }
}

export const customElementTagName = MANIFEST_INSPECTOR_TAG;
