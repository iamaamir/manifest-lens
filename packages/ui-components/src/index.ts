import type {
  AnalysisSnapshot,
  SemanticNode,
  SemanticNodeId,
} from "@manifest-lens/contracts";
import {
  buildFlatTree,
  createInitialInspectorState,
  getActiveExplanation,
  getActiveNodeId,
  getNavigableNodeIds,
  inspectorReducer,
  type InspectorAction,
  type InspectorState,
  type TreeRowInfo,
} from "@manifest-lens/application";

const MANIFEST_INSPECTOR_TAG = "manifest-inspector";

const EMPTY_STATE_PROMPT = "Drop a manifest.json";
const EMPTY_STATE_LOCAL_NOTE =
  "Or paste it anywhere on this page, or click Upload above.";
const SOURCE_KEYBOARD_INSTRUCTIONS =
  "Use arrow keys to move between explainable fields, Enter or Space to pin an explanation, and Escape to clear.";

export type DropFeedbackKind = "accepted" | "rejected";

const DROP_FEEDBACK_COPY: Record<DropFeedbackKind, string> = {
  accepted: "Drop manifest.json to inspect locally",
  rejected: "Drop a JSON manifest file",
};

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

function nodeKindToEyebrow(kind: SemanticNode["kind"]): string {
  switch (kind) {
    case "manifest": return "MANIFEST";
    case "field": return "TOP-LEVEL FIELD";
    case "unknownField": return "UNRECOGNIZED FIELD";
    case "permission": return "PERMISSION";
    case "hostPermission": return "HOST PERMISSION";
    case "contentScript": return "CONTENT SCRIPT";
    case "contentScriptField": return "CONTENT SCRIPT FIELD";
    case "contentScriptMatch": return "MATCH PATTERN";
    case "contentScriptFile": return "SCRIPT FILE";
    case "arrayItem": return "ARRAY ITEM";
  }
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

function createBracketGlyph(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 48 48");
  svg.setAttribute("width", "48");
  svg.setAttribute("height", "48");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const leftVertical = document.createElementNS("http://www.w3.org/2000/svg", "line");
  leftVertical.setAttribute("x1", "10");
  leftVertical.setAttribute("y1", "8");
  leftVertical.setAttribute("x2", "10");
  leftVertical.setAttribute("y2", "40");

  const leftTopHoriz = document.createElementNS("http://www.w3.org/2000/svg", "line");
  leftTopHoriz.setAttribute("x1", "10");
  leftTopHoriz.setAttribute("y1", "8");
  leftTopHoriz.setAttribute("x2", "18");
  leftTopHoriz.setAttribute("y2", "8");

  const leftBottomHoriz = document.createElementNS("http://www.w3.org/2000/svg", "line");
  leftBottomHoriz.setAttribute("x1", "10");
  leftBottomHoriz.setAttribute("y1", "40");
  leftBottomHoriz.setAttribute("x2", "18");
  leftBottomHoriz.setAttribute("y2", "40");

  const rightVertical = document.createElementNS("http://www.w3.org/2000/svg", "line");
  rightVertical.setAttribute("x1", "38");
  rightVertical.setAttribute("y1", "8");
  rightVertical.setAttribute("x2", "38");
  rightVertical.setAttribute("y2", "40");

  const rightTopHoriz = document.createElementNS("http://www.w3.org/2000/svg", "line");
  rightTopHoriz.setAttribute("x1", "38");
  rightTopHoriz.setAttribute("y1", "8");
  rightTopHoriz.setAttribute("x2", "30");
  rightTopHoriz.setAttribute("y2", "8");

  const rightBottomHoriz = document.createElementNS("http://www.w3.org/2000/svg", "line");
  rightBottomHoriz.setAttribute("x1", "38");
  rightBottomHoriz.setAttribute("y1", "40");
  rightBottomHoriz.setAttribute("x2", "30");
  rightBottomHoriz.setAttribute("y2", "40");

  svg.append(
    leftVertical,
    leftTopHoriz,
    leftBottomHoriz,
    rightVertical,
    rightTopHoriz,
    rightBottomHoriz,
  );

  return svg;
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
    height: 100%;
    min-height: inherit;
    grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr);
    background: var(--color-border-hairline);
    gap: 1px;
  }

  @media (max-width: 767px) {
    .inspector {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .drop-overlay {
    display: none;
    position: absolute;
    inset: 0;
    z-index: 10;
    place-items: center;
    padding: 32px;
    color: var(--color-text-primary);
    background: rgba(18, 18, 20, 0.88);
    border: 1px solid rgba(94, 234, 212, 0.4);
    border-radius: var(--mi-radius-lg);
    box-shadow:
      inset 0 0 0 1px rgba(94, 234, 212, 0.18),
      0 0 0 1px rgba(0, 0, 0, 0.2);
    pointer-events: none;
  }

  :host(.is-dragging) .drop-overlay {
    display: grid;
  }

  :host(.is-dragging[data-drop-feedback="rejected"]) .drop-overlay {
    border-color: rgba(248, 113, 113, 0.48);
    box-shadow:
      inset 0 0 0 1px rgba(248, 113, 113, 0.18),
      0 0 0 1px rgba(0, 0, 0, 0.2);
  }

  .drop-overlay-card {
    display: inline-grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    max-width: min(420px, 100%);
    padding: 16px 18px;
    background: rgba(32, 32, 39, 0.92);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--mi-radius-lg);
  }

  .drop-overlay-glyph {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    color: var(--color-accent-primary);
    border: 1px solid currentColor;
    border-radius: var(--mi-radius-sm);
    font-family: var(--mi-font-code);
    font-size: 14px;
    line-height: 1;
  }

  :host([data-drop-feedback="rejected"]) .drop-overlay-glyph {
    color: var(--color-accent-error);
  }

  .drop-overlay-text {
    font-size: 15px;
    font-weight: 500;
    line-height: 22px;
  }

  .source-pane,
  .explanation-pane {
    min-width: 0;
    overflow: auto;
    scrollbar-gutter: stable;
    overscroll-behavior: contain;
  }

  .source-pane {
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    padding: 32px;
    background: var(--color-bg-tree-pane);
  }

  .explanation-pane {
    padding: 32px;
    background: var(--color-bg-panel);
    color: var(--color-text-explanation);
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
    position: relative;
    min-height: 100%;
    overflow: auto;
    scroll-behavior: auto;
    color: var(--color-text-secondary);
    background: #101013;
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--mi-radius-lg);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
  }

  .source-gutter {
    margin: 0;
    padding: 8px 10px 8px 0;
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

  .source-gutter-line.is-pinned::before {
    background: var(--color-accent-primary);
  }

  .source-gutter-line.is-focused::before {
    box-shadow: 0 0 0 2px var(--color-accent-primary);
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

  .tree-container {
    min-height: 100%;
    padding: 8px 0;
    border-radius: 0;
    outline: none;
    scroll-behavior: auto;
  }

  .tree-container:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: -2px;
  }

  .tree-row {
    position: relative;
    display: flex;
    align-items: flex-start;
    min-height: 20px;
    font-family: var(--mi-font-code);
    font-size: 13px;
    line-height: 20px;
    white-space: nowrap;
    cursor: pointer;
    border-radius: var(--mi-radius-sm);
  }

  .tree-row::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    pointer-events: none;
    background: var(--guide-bg, none);
  }

  .tree-row:hover {
    background: rgba(32, 32, 39, 0.4);
    box-shadow: inset 0 -1px 0 0 var(--color-accent-primary);
  }

  .tree-row.is-hovered {
    background: rgba(32, 32, 39, 0.4);
    box-shadow: inset 0 -1px 0 0 var(--color-accent-primary);
  }

  .tree-row.is-focused {
    background: rgba(32, 32, 39, 0.4);
    box-shadow: inset 0 -1px 0 0 var(--color-accent-primary);
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }

  .tree-row.is-pinned {
    background: var(--color-bg-elevated);
    box-shadow:
      inset 0 -2px 0 0 var(--color-accent-primary),
      0 0 0 1px rgba(94, 234, 212, 0.16);
  }

  .tree-disclosure {
    flex: none;
    width: 12px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    cursor: pointer;
    user-select: none;
    font-size: 10px;
    line-height: 1;
    margin-right: 2px;
  }

  .tree-disclosure.is-hidden {
    visibility: hidden;
    pointer-events: none;
  }

  .tree-key {
    flex: none;
    color: var(--color-json-key);
    margin-right: 2px;
  }

  .tree-key.is-unknown {
    color: var(--color-text-secondary);
  }

  .tree-sep {
    flex: none;
    color: var(--color-json-bracket);
    margin-right: 4px;
  }

  .tree-value {
    flex: none;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tree-value-collapsed {
    color: var(--color-text-tertiary);
  }

  .tree-row-more {
    color: var(--color-text-tertiary);
    cursor: pointer;
    padding-left: calc(var(--more-depth, 0) * 24px + 36px);
  }

  .tree-row-more:hover {
    color: var(--color-text-primary);
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

  .explanation-eyebrow {
    margin: 0 0 16px;
    color: var(--color-text-tertiary);
    font-size: 11px;
    font-weight: 600;
    line-height: 16px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .explanation-examples {
    margin: 0 0 20px;
  }

  .explanation-examples pre {
    margin: 8px 0 0;
    padding: 16px;
    color: var(--color-text-secondary);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-hairline);
    border-radius: 6px;
    font-family: var(--mi-font-code);
    font-size: 13px;
    line-height: 20px;
    white-space: pre;
    overflow-x: auto;
  }

  .explanation-related {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 20px;
    padding: 0;
    list-style: none;
  }

  .explanation-related li {
    margin: 0;
  }

  .explanation-related-pill {
    display: inline-block;
    padding: 4px 10px;
    color: var(--color-text-secondary);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-hairline);
    border-radius: 4px;
    font-size: 11px;
    line-height: 16px;
    cursor: default;
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
  }

  .empty-glyph svg {
    width: 100%;
    height: 100%;
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

  .sample-link {
    display: inline-block;
    margin-top: 16px;
    padding: 0;
    font-size: 13px;
    line-height: 20px;
    color: var(--color-accent-primary);
    background: transparent;
    border: none;
    border-radius: var(--mi-radius-sm);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    font-family: inherit;
  }

  .sample-link:hover {
    color: var(--color-text-primary);
  }

  .sample-link:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }

  .error-card {
    padding: 32px;
    border-left: 4px solid var(--color-accent-error);
    background: var(--color-bg-elevated);
    margin: 24px;
    border-radius: 10px;
  }

  .error-card-headline {
    margin: 0 0 8px;
    color: var(--color-text-primary);
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
  }

  .error-card-message {
    margin: 0 0 16px;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 20px;
  }

  .error-card-try-again {
    padding: 0;
    color: var(--color-accent-primary);
    background: transparent;
    border: none;
    border-radius: var(--mi-radius-sm);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    line-height: 20px;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .error-card-try-again:hover {
    color: var(--color-text-primary);
  }

  .error-card-try-again:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }

  :host(:focus-visible) {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 3px;
  }

  @media (max-width: 767px) {
    .source-pane,
    .explanation-pane {
      padding: 16px;
    }
  }

  .mobile-inline-card {
    display: none;
    margin: 0;
    padding: 16px 20px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--mi-radius-lg);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    color: var(--color-text-explanation);
  }

  .mobile-inline-card.is-visible {
    display: block;
  }

  .mobile-inline-card .explanation-eyebrow {
    margin: 0 0 12px;
    color: var(--color-text-tertiary);
    font-size: 11px;
    font-weight: 600;
    line-height: 16px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .mobile-inline-card .explanation-title {
    display: inline-block;
    max-width: 100%;
    margin: 0 0 12px;
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

  .mobile-inline-card .explanation-summary {
    margin: 0 0 12px;
    color: var(--color-text-explanation);
    font-size: 14px;
    line-height: 22px;
  }

  .mobile-inline-card .explanation-details {
    margin: 0 0 12px;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 22px;
  }

  .mobile-inline-card .explanation-section-label {
    margin: 0 0 8px;
    color: var(--color-text-tertiary);
    font-size: 11px;
    font-weight: 600;
    line-height: 16px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .mobile-inline-card .explanation-docs {
    margin: 0;
    padding-left: 20px;
    color: var(--color-text-secondary);
    font-size: 13px;
    line-height: 20px;
  }

  .mobile-inline-card .explanation-docs a {
    color: var(--color-accent-primary);
    text-underline-offset: 3px;
  }

  .mobile-inline-card .explanation-docs a:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
    border-radius: var(--mi-radius-sm);
  }

  .mobile-inline-card .explanation-related {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
  }

  .mobile-inline-card .explanation-related li {
    margin: 0;
  }

  .mobile-inline-card .explanation-related-pill {
    display: inline-block;
    padding: 4px 10px;
    color: var(--color-text-secondary);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-hairline);
    border-radius: 4px;
    font-size: 11px;
    line-height: 16px;
    cursor: default;
  }

  @media (max-width: 767px) {
    .explanation-pane {
      display: none !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .source-frame,
    .tree-container {
      scroll-behavior: auto;
    }

    .drop-overlay,
    .tree-row,
    .sample-link,
    .error-card-try-again,
    .explanation-docs a {
      transition: none;
      animation: none;
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
    .tree-row.is-pinned {
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
  private sourceGutter: HTMLOListElement | null = null;
  private explanationPane: HTMLElement | null = null;
  private mobileInlineCard: HTMLElement | null = null;
  private representativeIdByNode = new Map<SemanticNodeId, string>();
  private treeRowsInfo: TreeRowInfo[] = [];
  private collapsedNodeIds = new Set<SemanticNodeId>();
  private expandedTruncatedIds = new Set<SemanticNodeId>();
  private rowIdCounter = 0;

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
    this.clearDropFeedback();
    this.render();
  }

  showDropFeedback(kind: DropFeedbackKind): void {
    this.classList.add("is-dragging");
    this.dataset.dropFeedback = kind;
    const overlay = this.root.querySelector<HTMLElement>(".drop-overlay-text");
    if (overlay) overlay.textContent = DROP_FEEDBACK_COPY[kind];
  }

  clearDropFeedback(): void {
    this.classList.remove("is-dragging");
    delete this.dataset.dropFeedback;
  }

  clear(): void {
    this.snapshot = null;
    this.sourceRegion = null;
    this.explanationPane = null;
    this.mobileInlineCard = null;
    this.representativeIdByNode = new Map();
    this.treeRowsInfo = [];
    this.collapsedNodeIds = new Set();
    this.expandedTruncatedIds = new Set();
    this.state = inspectorReducer(this.state, { type: "snapshot/clear" });
    this.clearDropFeedback();
    this.renderEmptyState();
  }

  showError(message: string): void {
    this.snapshot = null;
    this.sourceRegion = null;
    this.explanationPane = null;
    this.mobileInlineCard = null;
    this.representativeIdByNode = new Map();
    this.treeRowsInfo = [];
    this.collapsedNodeIds = new Set();
    this.expandedTruncatedIds = new Set();
    this.state = inspectorReducer(this.state, { type: "snapshot/clear" });
    this.clearDropFeedback();

    const style = document.createElement("style");
    style.textContent = STYLE;

    const container = document.createElement("section");
    container.className = "inspector";

    const sourcePane = document.createElement("section");
    sourcePane.className = "source-pane";

    const errorCard = document.createElement("div");
    errorCard.className = "error-card";

    const headline = document.createElement("h3");
    headline.className = "error-card-headline";
    headline.textContent = "This isn't valid JSON";

    const errMessage = document.createElement("p");
    errMessage.className = "error-card-message";
    errMessage.textContent = message;

    const tryAgainBtn = document.createElement("button");
    tryAgainBtn.className = "error-card-try-again";
    tryAgainBtn.textContent = "Try again";
    tryAgainBtn.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("clear", { bubbles: true, composed: true }),
      );
      this.clear();
    });

    errorCard.append(headline, errMessage, tryAgainBtn);
    sourcePane.append(errorCard, this.createDropOverlay("accepted"));

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

  private dispatch(action: InspectorAction): void {
    this.state = inspectorReducer(this.state, action);
    this.updateInteractionState();
  }

  private updateInteractionState(): void {
    if (!this.snapshot) return;
    if (this.sourceRegion) this.updateSourceHighlight(this.sourceRegion);
    this.updateExplanationPane();
    this.updateMobileCard();
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
    glyph.append(createBracketGlyph());

    const heading = document.createElement("h2");
    heading.textContent = EMPTY_STATE_PROMPT;

    const note = document.createElement("p");
    note.textContent = EMPTY_STATE_LOCAL_NOTE;

    const localNote = document.createElement("p");
    localNote.textContent = "Processing stays local to this browser.";
    localNote.style.marginTop = "16px";
    localNote.style.fontSize = "12px";
    localNote.style.color = "var(--color-text-tertiary)";

    const sampleLink = document.createElement("button");
    sampleLink.className = "sample-link";
    sampleLink.textContent = "Try a sample manifest instead";
    sampleLink.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("load-sample", { bubbles: true, composed: true }),
      );
    });

    emptyState.append(glyph, heading, note, localNote, sampleLink);
    sourcePane.append(emptyState, this.createDropOverlay("accepted"));

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

  private createDropOverlay(kind: DropFeedbackKind): HTMLElement {
    const overlay = document.createElement("div");
    overlay.className = "drop-overlay";
    overlay.setAttribute("aria-hidden", "true");

    const card = document.createElement("div");
    card.className = "drop-overlay-card";

    const glyph = document.createElement("span");
    glyph.className = "drop-overlay-glyph";
    glyph.textContent = "{}";

    const text = document.createElement("span");
    text.className = "drop-overlay-text";
    text.textContent = DROP_FEEDBACK_COPY[kind];

    card.append(glyph, text);
    overlay.append(card);
    return overlay;
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
    pane.setAttribute("aria-label", "Source");

    const instructions = document.createElement("p");
    instructions.id = "source-instructions";
    instructions.className = "source-instructions";
    instructions.textContent = SOURCE_KEYBOARD_INSTRUCTIONS;
    pane.append(instructions);

    const sourceFrame = document.createElement("div");
    sourceFrame.className = "source-frame";

    const treeContainer = document.createElement("div");
    treeContainer.className = "tree-container source-region";
    treeContainer.setAttribute("part", "source-region");
    treeContainer.setAttribute("tabindex", "0");
    treeContainer.setAttribute("role", "listbox");
    treeContainer.setAttribute("aria-label", "Explainable manifest fields");
    treeContainer.setAttribute("aria-describedby", "source-instructions");

    const snapshot = this.snapshot!;
    const navigableIds = new Set(getNavigableNodeIds(snapshot));
    const treeInfo = buildFlatTree(snapshot);
    this.treeRowsInfo = treeInfo;
    this.rowIdCounter = 0;

    this.collapsedNodeIds = new Set(
      treeInfo
        .filter((t) => t.isContainer && t.depth >= 3)
        .map((t) => t.nodeId),
    );

    const representativeIdByNode = new Map<SemanticNodeId, string>();

    let pendingMore: TreeRowInfo | null = null;

    for (const info of treeInfo) {
      if (this.shouldHideNode(info)) continue;

      if (pendingMore && info.depth <= pendingMore.depth) {
        treeContainer.append(this.createMoreRow(pendingMore));
        pendingMore = null;
      }

      if (this.shouldTruncateNode(info)) continue;

      const rowEl = this.createTreeRowElement(info, navigableIds, representativeIdByNode);
      treeContainer.append(rowEl);

      if (info.isContainer && info.childCount > 8 && this.isArrayNode(info.nodeId) && !this.expandedTruncatedIds.has(info.nodeId)) {
        pendingMore = info;
      }
    }

    if (pendingMore) {
      treeContainer.append(this.createMoreRow(pendingMore));
    }

    this.representativeIdByNode = representativeIdByNode;

    treeContainer.addEventListener("mouseover", this.handleTreePointerOver);
    treeContainer.addEventListener("mouseout", this.handleTreePointerOut);
    treeContainer.addEventListener("click", this.handleTreeClick);
    treeContainer.addEventListener("keydown", this.handleSourceKeydown);

    this.sourceRegion = treeContainer;
    this.sourceGutter = this.createSourceGutter(treeContainer);

    sourceFrame.append(this.sourceGutter, treeContainer, this.createDropOverlay("accepted"));

    pane.append(sourceFrame);

    const mobileCard = document.createElement("div");
    mobileCard.className = "mobile-inline-card";
    treeContainer.append(mobileCard);
    this.mobileInlineCard = mobileCard;

    return pane;
  }

  private shouldHideNode(info: TreeRowInfo): boolean {
    let parentId = info.parentId;
    while (parentId) {
      if (this.collapsedNodeIds.has(parentId)) return true;
      const parentInfo = this.treeRowsInfo.find(
        (t) => t.nodeId === parentId,
      );
      parentId = parentInfo?.parentId;
    }
    return false;
  }

  private shouldTruncateNode(info: TreeRowInfo): boolean {
    if (!info.parentId) return false;
    if (this.expandedTruncatedIds.has(info.parentId)) return false;
    const parentInfo = this.treeRowsInfo.find(
      (t) => t.nodeId === info.parentId,
    );
    if (!parentInfo || parentInfo.childCount <= 8) return false;
    if (!this.isArrayNode(info.parentId)) return false;
    return info.siblingIndex >= 8;
  }

  private createTreeRowElement(
    info: TreeRowInfo,
    navigableIds: Set<SemanticNodeId>,
    representativeIdByNode: Map<SemanticNodeId, string>,
  ): HTMLElement {
    if (!this.snapshot) throw new Error("No snapshot");

    const row = document.createElement("div");
    const rowId = `tn-${String(this.rowIdCounter)}`;
    this.rowIdCounter += 1;
    row.className = "tree-row";
    row.id = rowId;
    row.dataset.nodeId = info.nodeId;
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", "false");
    row.setAttribute("aria-label", nodeLabel(this.snapshot, info.nodeId));

    const paddingLeft = info.depth * 24 + 20;
    row.style.paddingLeft = `${paddingLeft}px`;

    const guideBgParts: string[] = [];
    for (const guideDepth of info.guideDepths) {
      const x = guideDepth * 24 + 11;
      guideBgParts.push(
        `linear-gradient(var(--color-border-hairline), var(--color-border-hairline)) no-repeat ${x}px 0 / 1px 100%`,
      );
    }
    if (guideBgParts.length > 0) {
      row.style.setProperty("--guide-bg", guideBgParts.join(", "));
    }

    representativeIdByNode.set(info.nodeId, rowId);

    if (info.isContainer) {
      const disclosure = document.createElement("span");
      disclosure.className = "tree-disclosure";
      const isCollapsed = this.collapsedNodeIds.has(info.nodeId);
      disclosure.textContent = isCollapsed ? "\u25B8" : "\u25BE";
      disclosure.dataset.disclosure = info.nodeId;
      row.append(disclosure);
    } else {
      const spacer = document.createElement("span");
      spacer.className = "tree-disclosure is-hidden";
      spacer.textContent = "\u25B8";
      row.append(spacer);
    }

    const keyLabel = this.getNodeKeyText(info.nodeId);
    if (keyLabel) {
      const keySpan = document.createElement("span");
      const node = this.snapshot.semantic.nodes.find(n => n.id === info.nodeId);
      const isUnknown = node?.kind === "unknownField";
      keySpan.className = isUnknown ? "tree-key is-unknown" : "tree-key source-token-key";
      keySpan.textContent = keyLabel;
      row.append(keySpan);

      const sep = document.createElement("span");
      sep.className = "tree-sep";
      sep.textContent = ": ";
      row.append(sep);
    }

    if (info.childCount > 0 && this.collapsedNodeIds.has(info.nodeId)) {
      const collapsedSpan = document.createElement("span");
      collapsedSpan.className = "tree-value-collapsed";
      const label = this.collapsedLabel(info);
      collapsedSpan.textContent = label;
      row.append(collapsedSpan);
    } else {
      const valueEl = this.createValuePreview(info.nodeId);
      row.append(valueEl);
    }

    return row;
  }

  private collapsedLabel(info: TreeRowInfo): string {
    if (info.childCount === 0) return "";
    const noun =
      this.isArrayNode(info.nodeId) ? "items" : "keys";
    return `{ ${String(info.childCount)} ${noun} }`;
  }

  private isArrayNode(nodeId: SemanticNodeId): boolean {
    if (!this.snapshot) return false;
    const node = this.snapshot.semantic.nodes.find(
      (n) => n.id === nodeId,
    );
    if (!node) return false;
    if (
      node.kind === "field" &&
      (node.fieldName === "permissions" ||
        node.fieldName === "host_permissions" ||
        node.fieldName === "content_scripts")
    ) {
      return true;
    }
    const children = this.snapshot.semantic.nodes.filter(
      (n) => n.parentId === nodeId,
    );
    const explainableChildren = children.filter(
      (n) => n.id in this.snapshot!.explanationsByNodeId,
    );
    if (explainableChildren.length === 0) return false;
    return explainableChildren.some(
      (c) => c.kind === "permission" || c.kind === "hostPermission" || c.kind === "arrayItem" || c.kind === "contentScript",
    );
  }

  private getNodeKeyText(nodeId: SemanticNodeId): string {
    if (!this.snapshot) return "";
    const node = this.snapshot.semantic.nodes.find(
      (n) => n.id === nodeId,
    );
    if (!node) return "";
    switch (node.kind) {
      case "manifest":
        return "";
      case "field":
        return `"${node.fieldName}"`;
      case "unknownField":
        return `"${node.fieldName}"`;
      case "contentScriptField":
        return `"${node.fieldName}"`;
      case "contentScript":
        return `[${String(node.index)}]`;
      case "permission":
      case "hostPermission":
      case "contentScriptMatch":
      case "contentScriptFile":
      case "arrayItem":
        return "";
    }
  }

  private createValuePreview(nodeId: SemanticNodeId): HTMLElement {
    const valueSpan = document.createElement("span");
    valueSpan.className = "tree-value";

    if (!this.snapshot) return valueSpan;

    const node = this.snapshot.semantic.nodes.find(
      (n) => n.id === nodeId,
    );
    if (!node) return valueSpan;

    const valueText = this.getNodeValueSourceText(node);
    if (!valueText) return valueSpan;

    const lexemes = lexSourceText(valueText);
    const fragment = document.createDocumentFragment();

    for (const lexeme of lexemes) {
      const tokenSpan = document.createElement("span");
      tokenSpan.className = sourceTokenClass(lexeme.kind);
      if (lexeme.kind === "whitespace") {
        tokenSpan.textContent = valueText.slice(lexeme.start, lexeme.end);
      } else {
        tokenSpan.textContent = valueText.slice(lexeme.start, lexeme.end);
      }
      fragment.append(tokenSpan);
    }

    valueSpan.append(fragment);
    return valueSpan;
  }

  private getNodeValueSourceText(node: SemanticNode): string {
    if (!this.snapshot) return "";
    const text = this.snapshot.document.text;

    if (
      node.kind === "manifest" ||
      node.kind === "contentScript" ||
      (node.kind === "field" && this.isContainerNode(node))
    ) {
      const valueStartOffset = node.valueRange?.start.offset ?? node.sourceRange.start.offset;
      const openingBracket = text[valueStartOffset];
      if (openingBracket === "{" || openingBracket === "[") {
        return openingBracket;
      }
    }

    if ("valueRange" in node && node.valueRange) {
      return text.slice(
        node.valueRange.start.offset,
        node.valueRange.end.offset,
      );
    }

    return text.slice(
      node.sourceRange.start.offset,
      node.sourceRange.end.offset,
    );
  }

  private isContainerNode(
    node: SemanticNode,
  ): boolean {
    return this.treeRowsInfo.some(
      (t) => t.nodeId === node.id && t.isContainer,
    );
  }

  private createMoreRow(info: TreeRowInfo): HTMLElement {
    const row = document.createElement("div");
    row.className = "tree-row-more";
    row.style.setProperty("--more-depth", String(info.depth + 1));
    const hiddenCount = info.childCount - 8;
    row.textContent = `+${String(hiddenCount)} more`;
    row.dataset.truncatedParent = info.nodeId;
    row.addEventListener("click", (e) => {
      e.stopPropagation();
      this.expandTruncated(info.nodeId);
    });
    return row;
  }

  private expandTruncated(nodeId: SemanticNodeId): void {
    this.expandedTruncatedIds.add(nodeId);
    if (this.sourceRegion) {
      this.rebuildTreeContainer(this.sourceRegion);
    }
  }

  private toggleCollapse(nodeId: SemanticNodeId): void {
    if (this.collapsedNodeIds.has(nodeId)) {
      this.collapsedNodeIds.delete(nodeId);
    } else {
      this.collapsedNodeIds.add(nodeId);
    }
    if (this.sourceRegion) {
      this.rebuildTreeContainer(this.sourceRegion);
    }
  }

  private rebuildTreeContainer(container: HTMLElement): void {
    if (!this.snapshot) return;

    const navigableIds = new Set(getNavigableNodeIds(this.snapshot));
    const representativeIdByNode = new Map<SemanticNodeId, string>();

    container.replaceChildren();
    this.rowIdCounter = 0;

    let pendingMore: TreeRowInfo | null = null;

    for (const info of this.treeRowsInfo) {
      if (this.shouldHideNode(info)) continue;

      if (pendingMore && info.depth <= pendingMore.depth) {
        container.append(this.createMoreRow(pendingMore));
        pendingMore = null;
      }

      if (this.shouldTruncateNode(info)) continue;

      const rowEl = this.createTreeRowElement(
        info,
        navigableIds,
        representativeIdByNode,
      );
      container.append(rowEl);

      if (
        info.isContainer &&
        info.childCount > 8 &&
        this.isArrayNode(info.nodeId) &&
        !this.expandedTruncatedIds.has(info.nodeId)
      ) {
        pendingMore = info;
      }
    }

    if (pendingMore) {
      container.append(this.createMoreRow(pendingMore));
    }

    this.representativeIdByNode = representativeIdByNode;
    this.syncSourceGutterRows(container);
    this.updateInteractionState();
  }

  private createSourceGutter(container: HTMLElement): HTMLOListElement {
    const gutter = document.createElement("ol");
    gutter.className = "source-gutter";
    gutter.setAttribute("aria-hidden", "true");
    this.appendGutterRows(gutter, container);
    return gutter;
  }

  private syncSourceGutterRows(container: HTMLElement): void {
    if (!this.sourceGutter) return;
    this.sourceGutter.replaceChildren();
    this.appendGutterRows(this.sourceGutter, container);
  }

  private appendGutterRows(gutter: HTMLOListElement, container: HTMLElement): void {
    for (const child of Array.from(container.children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (child.classList.contains("tree-row")) {
        gutter.append(this.createSemanticGutterLine(child));
      }
      if (child.classList.contains("tree-row-more")) {
        gutter.append(this.createMoreGutterLine());
      }
    }
  }

  private createSemanticGutterLine(row: HTMLElement): HTMLLIElement {
    const lineNumber = document.createElement("li");
    lineNumber.className = "source-gutter-line";
    const nodeId = row.dataset.nodeId as SemanticNodeId | undefined;
    if (nodeId) {
      const node = this.snapshot?.semantic.nodes.find(
        (candidate) => candidate.id === nodeId,
      );
      lineNumber.dataset.nodeId = nodeId;
      lineNumber.textContent = node ? String(node.sourceRange.start.line) : "";
    }
    return lineNumber;
  }

  private createMoreGutterLine(): HTMLLIElement {
    const lineNumber = document.createElement("li");
    lineNumber.className = "source-gutter-line is-more";
    lineNumber.textContent = "…";
    return lineNumber;
  }

  private updateSourceHighlight(container: HTMLElement): void {
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

    const rows = container.querySelectorAll<HTMLElement>(".tree-row");
    rows.forEach((row) => {
      const nodeId = row.dataset.nodeId ?? "";
      const isPinned =
        nodeId === pinnedId ||
        (nodeId === activeId &&
          this.state.selection.kind === "pinned");
      const isHovered = nodeId === hoveredId;
      const isFocused = nodeId === focusedId;
      row.classList.toggle("is-hovered", isHovered);
      row.classList.toggle("is-pinned", isPinned);
      row.classList.toggle("is-focused", isFocused);
      row.setAttribute("aria-selected", isPinned ? "true" : "false");
    });

    if (representativeId) {
      container.setAttribute(
        "aria-activedescendant",
        representativeId,
      );
    } else {
      container.removeAttribute("aria-activedescendant");
    }

    this.updateSourceGutter(activeId, pinnedId, focusedId);
  }

  private updateSourceGutter(
    activeId: SemanticNodeId | null,
    pinnedId: SemanticNodeId | null,
    focusedId: SemanticNodeId | null,
  ): void {
    if (!this.snapshot || !this.sourceGutter) return;

    const lines = this.sourceGutter.querySelectorAll<HTMLElement>(
      ".source-gutter-line",
    );
    lines.forEach((line) => {
      const nodeId = line.dataset.nodeId ?? null;
      line.classList.toggle("is-active", nodeId === activeId);
      line.classList.toggle("is-pinned", nodeId === pinnedId);
      line.classList.toggle("is-focused", nodeId === focusedId);
    });
  }

  private closestTreeRow(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) return null;
    return target.closest<HTMLElement>(".tree-row");
  }

  private handleTreePointerOver = (event: MouseEvent): void => {
    if (!this.snapshot) return;
    const row = this.closestTreeRow(event.target);
    if (!row || !row.dataset.nodeId) return;
    this.dispatch({
      type: "node/hover",
      nodeId: row.dataset.nodeId as SemanticNodeId,
    });
  };

  private handleTreePointerOut = (event: MouseEvent): void => {
    if (!this.snapshot) return;
    if (this.closestTreeRow(event.relatedTarget)) return;
    this.dispatch({ type: "node/hoverEnd" });
  };

  private handleTreeClick = (event: MouseEvent): void => {
    if (!this.snapshot) return;

    const disclosure = (event.target as HTMLElement).closest(
      ".tree-disclosure",
    ) as HTMLElement | null;
    if (
      disclosure &&
      disclosure.dataset.disclosure
    ) {
      event.stopPropagation();
      this.toggleCollapse(
        disclosure.dataset.disclosure as SemanticNodeId,
      );
      return;
    }

    const row = this.closestTreeRow(event.target);
    if (!row || !row.dataset.nodeId) return;
    this.dispatch({
      type: "node/select",
      nodeId: row.dataset.nodeId as SemanticNodeId,
    });
  };

  private renderExplanationPane(): HTMLElement {
    const pane = document.createElement("section");
    pane.className = "explanation-pane";
    pane.setAttribute("aria-label", "Explanation");
    pane.setAttribute("part", "explanation-panel");

    pane.append(this.buildExplanationContent());
    return pane;
  }

  private updateExplanationPane(): void {
    if (!this.explanationPane) return;
    const content = this.buildExplanationContent();
    this.explanationPane.replaceChildren(content);
  }

  private updateMobileCard(): void {
    const card = this.mobileInlineCard;
    if (!card) return;

    card.remove();
    card.classList.remove("is-visible");

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;

    const showCard =
      this.state.selection.kind === "pinned" ||
      this.state.selection.kind === "hoverPreview";
    if (!showCard) return;

    const explanation = getActiveExplanation(this.state);
    if (!explanation) return;

    const activeId = getActiveNodeId(this.state);
    if (!activeId) return;

    const representativeId = this.representativeIdByNode.get(activeId);
    if (!representativeId) return;

    const activeRow = this.root.getElementById(representativeId);
    if (!activeRow) return;

    const treeContainer = activeRow.closest(".tree-container");
    if (!treeContainer) return;

    const content = this.buildExplanationContent();
    card.replaceChildren(content);
    card.classList.add("is-visible");
    activeRow.insertAdjacentElement("afterend", card);
    card.scrollIntoView({ block: "nearest" });
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

    const eyebrow = this.renderEyebrow();
    if (eyebrow) fragment.append(eyebrow);

    const title = document.createElement("h2");
    title.className = "explanation-title";
    title.textContent = explanation.title;
    fragment.append(title);

    const summary = document.createElement("p");
    summary.className = "explanation-summary";
    summary.textContent = explanation.summary;
    fragment.append(summary);

    if (explanation.details.length > 0) {
      for (const detail of explanation.details) {
        const paragraph = document.createElement("p");
        paragraph.className = "explanation-details";
        paragraph.textContent = detail;
        fragment.append(paragraph);
      }
    }

    if (explanation.examples.length > 0) {
      const label = document.createElement("p");
      label.className = "explanation-section-label";
      label.textContent = "Example";
      const container = document.createElement("div");
      container.className = "explanation-examples";
      container.append(label);
      for (const example of explanation.examples) {
        const pre = document.createElement("pre");
        pre.textContent = example.code;
        container.append(pre);
      }
      fragment.append(container);
    }

    if (explanation.relatedFields.length > 0) {
      const label = document.createElement("p");
      label.className = "explanation-section-label";
      label.textContent = "Related Fields";
      const list = document.createElement("ul");
      list.className = "explanation-related";
      for (const field of explanation.relatedFields) {
        const item = document.createElement("li");
        const pill = document.createElement("span");
        pill.className = "explanation-related-pill";
        pill.textContent = field;
        item.append(pill);
        list.append(item);
      }
      fragment.append(label, list);
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

  private renderEyebrow(): HTMLElement | null {
    if (!this.snapshot) return null;
    const activeId = getActiveNodeId(this.state);
    if (!activeId) return null;
    const node = this.snapshot.semantic.nodes.find((n) => n.id === activeId);
    if (!node) return null;

    const label = nodeKindToEyebrow(node.kind);
    if (!label) return null;

    const element = document.createElement("p");
    element.className = "explanation-eyebrow";
    element.textContent = label;
    return element;
  }

  private handleSourceKeydown = (event: KeyboardEvent): void => {
    if (!this.snapshot) return;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        this.dispatch({ type: "node/focusNext" });
        this.scrollFocusedIntoView();
        if (this.state.focusedNodeId) {
          this.dispatch({
            type: "node/hover",
            nodeId: this.state.focusedNodeId,
          });
        }
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        this.dispatch({ type: "node/focusPrevious" });
        this.scrollFocusedIntoView();
        if (this.state.focusedNodeId) {
          this.dispatch({
            type: "node/hover",
            nodeId: this.state.focusedNodeId,
          });
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (this.state.focusedNodeId) {
          this.dispatch({
            type: "node/select",
            nodeId: this.state.focusedNodeId,
          });
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
