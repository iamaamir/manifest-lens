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

const STYLE = `
  :host {
    display: block;
    --mi-color-background: #ffffff;
    --mi-color-surface: #f6f7f9;
    --mi-color-text: #1b1f23;
    --mi-color-muted: #5b6470;
    --mi-color-border: #d8dce2;
    --mi-color-highlight: #fff4cc;
    --mi-color-pinned: #dce9ff;
    --mi-color-focus: #2563eb;
    --mi-font-ui: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --mi-font-code: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-family: var(--mi-font-ui);
    color: var(--mi-color-text);
    background: var(--mi-color-background);
    border: 1px solid var(--mi-color-border);
    border-radius: 12px;
  }

  .inspector {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1px;
    background: var(--mi-color-border);
  }

  @media (max-width: 720px) {
    .inspector {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .source-pane,
  .explanation-pane {
    background: var(--mi-color-background);
    overflow: auto;
    scrollbar-gutter: stable;
    overscroll-behavior: contain;
  }

  .source-pane {
    padding: 1rem;
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
    border-radius: 6px;
  }

  .source-region:focus-visible {
    outline: 2px solid var(--mi-color-focus);
    outline-offset: 2px;
  }

  .explanation-pane {
    padding: 1rem 1.25rem;
  }

  .source-pre {
    margin: 0;
    font-family: var(--mi-font-code);
    font-size: 0.875rem;
    line-height: 1.6;
    white-space: pre;
    tab-size: 2;
  }

  .source-node {
    border-radius: 4px;
    cursor: pointer;
    padding: 0 1px;
    background: transparent;
    transition: background-color 0.12s ease;
  }

  .source-node:hover {
    background: var(--mi-color-highlight);
  }

  .source-node:focus-visible {
    outline: 2px solid var(--mi-color-focus);
    outline-offset: 1px;
  }

  .source-node.is-active {
    background: var(--mi-color-highlight);
    box-shadow: inset 0 -2px 0 0 var(--mi-color-focus);
  }

  .source-node.is-pinned {
    background: var(--mi-color-pinned);
    box-shadow: inset 0 -2px 0 0 var(--mi-color-focus);
  }

  .source-node.is-focused:not(.is-pinned) {
    outline: 2px dotted var(--mi-color-focus);
    outline-offset: 1px;
  }

  .explanation-title {
    margin: 0 0 0.5rem;
    font-size: 1.125rem;
    line-height: 1.4;
  }

  .explanation-breadcrumb {
    margin: 0 0 0.75rem;
    font-size: 0.8125rem;
    color: var(--mi-color-muted);
  }

  .explanation-summary {
    margin: 0 0 0.75rem;
    line-height: 1.6;
  }

  .explanation-details {
    margin: 0 0 0.75rem;
    padding-left: 1.25rem;
    line-height: 1.6;
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
    margin: auto;
    max-width: 36rem;
    padding: 2rem 1.5rem;
    text-align: center;
  }

  .empty-state h2 {
    margin: 0 0 0.5rem;
    font-size: 1.125rem;
    line-height: 1.4;
  }

  .empty-state p {
    margin: 0;
    color: var(--mi-color-muted);
    font-size: 0.9375rem;
    line-height: 1.5;
  }

  :host(:focus-visible) {
    outline: 2px solid var(--mi-color-focus);
    outline-offset: 2px;
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
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "Manifest inspector");

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
    pane.setAttribute("aria-label", "Manifest source");

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
    let segmentIndex = 0;

    for (const segment of segments) {
      if (segment.nodeId === null || !navigableIds.has(segment.nodeId)) {
        pre.append(document.createTextNode(segment.text));
        continue;
      }

      segmentIndex += 1;
      const domId = `source-node-${segment.nodeId}-${segmentIndex}`;
      const existing = representativeIdByNode.get(segment.nodeId);
      if (existing === undefined) {
        representativeIdByNode.set(segment.nodeId, domId);
      }

      const span = document.createElement("span");
      span.className = "source-node";
      span.setAttribute("part", "source-node");
      span.dataset.nodeId = segment.nodeId;
      span.dataset.representativeId = representativeIdByNode.get(segment.nodeId);
      span.id = domId;
      span.setAttribute("role", "option");
      span.setAttribute("aria-selected", "false");
      span.setAttribute("aria-label", nodeLabel(this.snapshot!, segment.nodeId));
      span.textContent = segment.text;
      pre.append(span);
    }

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

    const spans = pre.querySelectorAll<HTMLElement>(".source-node");
    spans.forEach((span) => {
      const nodeId = span.dataset.nodeId ?? "";
      const isActive = nodeId === activeId || nodeId === hoveredId;
      span.classList.toggle("is-active", isActive);
      span.classList.toggle("is-pinned", nodeId === pinnedId);
      span.classList.toggle("is-focused", nodeId === focusedId);
      span.setAttribute("aria-selected", nodeId === pinnedId ? "true" : "false");
    });

    if (focusedId) {
      const representativeId = this.representativeIdByNode.get(focusedId);
      if (representativeId) {
        pre.setAttribute("aria-activedescendant", representativeId);
      } else {
        pre.removeAttribute("aria-activedescendant");
      }
    } else {
      pre.removeAttribute("aria-activedescendant");
    }
  }

  private handleSourcePointerOver = (event: MouseEvent): void => {
    if (!this.snapshot) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>(".source-node");
    if (!target || !target.dataset.nodeId) return;
    this.dispatch({ type: "node/hover", nodeId: target.dataset.nodeId as SemanticNodeId });
  };

  private handleSourcePointerOut = (event: MouseEvent): void => {
    if (!this.snapshot) return;
    const related = event.relatedTarget as HTMLElement | null;
    if (related && related.closest?.(".source-node")) return;
    this.dispatch({ type: "node/hoverEnd" });
  };

  private handleSourceClick = (event: MouseEvent): void => {
    if (!this.snapshot) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>(".source-node");
    if (!target || !target.dataset.nodeId) return;
    this.dispatch({ type: "node/select", nodeId: target.dataset.nodeId as SemanticNodeId });
  };

  private renderExplanationPane(): HTMLElement {
    const pane = document.createElement("section");
    pane.className = "explanation-pane";
    pane.setAttribute("part", "explanation-panel");
    pane.setAttribute("aria-label", "Explanation");
    pane.setAttribute("aria-live", "polite");
    pane.append(this.buildExplanationContent());
    return pane;
  }

  private updateExplanationPane(): void {
    if (!this.explanationPane) return;
    this.explanationPane.replaceChildren(this.buildExplanationContent());
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
