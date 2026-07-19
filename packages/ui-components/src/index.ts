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

const EMPTY_STATE_PROMPT =
  "Paste or drop a manifest.json to understand what each field does.";
const EMPTY_STATE_LOCAL_NOTE =
  "Your manifest is processed locally in this browser.";
const SOURCE_KEYBOARD_INSTRUCTIONS =
  "Use arrow keys to move between explainable fields, Enter or Space to pin an explanation, and Escape to clear.";

interface SourceSegment {
  readonly text: string;
  readonly nodeId: SemanticNodeId | null;
}

function splitIntoSegments(
  snapshot: AnalysisSnapshot,
): readonly SourceSegment[] {
  const text = snapshot.document.text;
  const explainable = snapshot.semantic.nodes.filter(
    (node) => node.id in snapshot.explanationsByNodeId,
  );

  if (explainable.length === 0) {
    return text.length > 0 ? [{ text, nodeId: null }] : [];
  }

  const cutPoints = new Set<number>([0, text.length]);
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

    segments.push({ text: text.slice(start, end), nodeId: bestNode ? bestNode.id : null });
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

function isStructuralSourceText(text: string): boolean {
  return /^[\s{}\[\],:]+$/.test(text);
}

const STYLE = `
  :host {
    display: block;
    overflow: hidden;
    min-height: 360px;
    --mi-color-background: oklch(99% 0.006 255);
    --mi-color-surface: oklch(97.3% 0.012 255);
    --mi-color-surface-raised: oklch(98.7% 0.006 255);
    --mi-color-text: oklch(23% 0.033 255);
    --mi-color-muted: oklch(48% 0.035 255);
    --mi-color-border: oklch(87% 0.021 255);
    --mi-color-highlight: oklch(94% 0.04 260);
    --mi-color-pinned: oklch(91% 0.055 260);
    --mi-color-hover: oklch(96% 0.035 260);
    --mi-color-focus: oklch(52% 0.16 260);
    --mi-font-ui: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --mi-font-code: "SFMono-Regular", Consolas, "Liberation Mono", ui-monospace, monospace;
    font-family: var(--mi-font-ui);
    color: var(--mi-color-text);
    background: var(--mi-color-background);
    border: 1px solid var(--mi-color-border);
    border-radius: 18px;
    box-shadow: inset 0 1px 0 oklch(99.5% 0.004 255 / 0.85);
  }

  .inspector {
    display: grid;
    min-height: inherit;
    grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
    background: linear-gradient(90deg, transparent, transparent 50%, var(--mi-color-border) 50%, var(--mi-color-border));
  }

  @media (max-width: 820px) {
    .inspector {
      grid-template-columns: minmax(0, 1fr);
      background: var(--mi-color-border);
      gap: 1px;
    }
  }

  .source-pane,
  .explanation-pane {
    min-width: 0;
    background: var(--mi-color-background);
    overflow: auto;
    scrollbar-gutter: stable;
    overscroll-behavior: contain;
  }

  .source-pane {
    padding: 1rem;
  }

  .pane-header {
    display: flex;
    gap: 1rem;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.85rem;
  }

  .pane-title {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .pane-kicker {
    margin: 0;
    color: var(--mi-color-muted);
    font-size: 0.82rem;
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

  .source-region {
    display: block;
    border-radius: 14px;
  }

  .source-region:focus-visible {
    outline: 3px solid oklch(70% 0.14 260 / 0.75);
    outline-offset: 3px;
  }

  .explanation-pane {
    padding: 1.15rem 1.25rem 1.35rem;
  }

  .source-pre {
    margin: 0;
    padding: 1rem;
    color: oklch(27% 0.032 255);
    background: var(--mi-color-surface);
    border: 1px solid var(--mi-color-border);
    font-family: var(--mi-font-code);
    font-size: 0.9rem;
    line-height: 1.7;
    white-space: pre;
    tab-size: 2;
    overflow: auto;
  }

  .source-node {
    border-radius: 0.25rem;
    cursor: pointer;
    padding: 0 0.08em;
    background: transparent;
    transition: background-color 0.12s ease, box-shadow 0.12s ease;
  }

  .source-node:hover {
    background: var(--mi-color-hover);
    box-shadow: inset 0 -1px 0 0 oklch(68% 0.11 260);
  }

  .source-node.is-active {
    background: var(--mi-color-highlight);
    box-shadow: inset 0 -2px 0 0 var(--mi-color-focus);
  }

  .source-node.is-pinned {
    background: var(--mi-color-pinned);
    box-shadow: inset 0 -2px 0 0 var(--mi-color-focus);
  }

  .source-node.is-structural {
    padding-inline: 0;
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
      inset 0 -2px 0 0 var(--mi-color-focus),
      0 0 0 2px oklch(70% 0.14 260 / 0.28);
  }

  .explanation-title {
    margin: 0 0 0.45rem;
    font-size: clamp(1.25rem, 2vw, 1.55rem);
    line-height: 1.22;
    letter-spacing: -0.025em;
  }

  .explanation-breadcrumb {
    width: fit-content;
    max-width: 100%;
    margin: 0 0 0.85rem;
    padding: 0.28rem 0.52rem;
    color: var(--mi-color-muted);
    background: var(--mi-color-surface);
    border: 1px solid var(--mi-color-border);
    border-radius: 999px;
    font-family: var(--mi-font-code);
    font-size: 0.76rem;
    overflow-wrap: anywhere;
  }

  .explanation-summary {
    margin: 0 0 0.9rem;
    color: oklch(31% 0.034 255);
    font-size: 1rem;
    line-height: 1.65;
  }

  .explanation-details {
    margin: 0 0 1rem;
    padding-left: 1.2rem;
    color: oklch(34% 0.033 255);
    line-height: 1.65;
  }

  .explanation-details li + li,
  .explanation-docs li + li {
    margin-top: 0.35rem;
  }

  .explanation-section-label {
    margin: 0 0 0.25rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--mi-color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .explanation-docs {
    margin: 0;
    padding-left: 1.25rem;
    line-height: 1.6;
  }

  .explanation-empty {
    color: var(--mi-color-muted);
    line-height: 1.6;
  }

  .empty-state {
    display: grid;
    place-content: center;
    min-height: 320px;
    margin: auto;
    max-width: 38rem;
    padding: 2.5rem 1.5rem;
    text-align: center;
  }

  .empty-state h2 {
    margin: 0 0 0.6rem;
    font-size: clamp(1.35rem, 3vw, 2rem);
    line-height: 1.15;
    letter-spacing: -0.035em;
  }

  .empty-state p {
    margin: 0;
    color: var(--mi-color-muted);
    font-size: 0.98rem;
    line-height: 1.55;
  }

  :host(:focus-visible) {
    outline: 3px solid oklch(70% 0.14 260 / 0.75);
    outline-offset: 3px;
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
  private explanationPane: HTMLElement | null = null;
  private representativeIdByNode: ReadonlyMap<SemanticNodeId, string> =
    new Map();

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

    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";

    const heading = document.createElement("h2");
    heading.textContent = EMPTY_STATE_PROMPT;

    const note = document.createElement("p");
    note.textContent = EMPTY_STATE_LOCAL_NOTE;

    emptyState.append(heading, note);
    container.append(emptyState);

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
        pre.append(document.createTextNode(segment.text));
        continue;
      }

      segmentIndex += 1;
      const domId = `source-node-${segment.nodeId}-${segmentIndex}`;
      const isStructural = isStructuralSourceText(segment.text);
      const existing = representativeIdByNode.get(segment.nodeId);
      const existingIsStructural = representativeIsStructuralByNode.get(segment.nodeId);
      if (existing === undefined || (existingIsStructural === true && !isStructural)) {
        representativeIdByNode.set(segment.nodeId, domId);
        representativeIsStructuralByNode.set(segment.nodeId, isStructural);
      }

      const span = document.createElement("span");
      span.className = isStructural
        ? "source-node is-structural"
        : "source-node";
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
    pane.append(pre);
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
        "Select a highlighted field in the manifest to see what it does.";
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
