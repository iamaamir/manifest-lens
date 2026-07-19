const MANIFEST_INSPECTOR_TAG = "manifest-inspector";

const EMPTY_STATE_PROMPT =
  "Paste or drop a manifest.json to understand what each field does.";
const EMPTY_STATE_LOCAL_NOTE =
  "Your manifest is processed locally in this browser.";

const STYLE = `
  :host {
    display: block;
    --mi-color-background: #ffffff;
    --mi-color-surface: #f6f7f9;
    --mi-color-text: #1b1f23;
    --mi-color-muted: #5b6470;
    --mi-color-border: #d8dce2;
    --mi-color-focus: #2563eb;
    --mi-font-ui: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-family: var(--mi-font-ui);
    color: var(--mi-color-text);
    background: var(--mi-color-background);
    border: 1px solid var(--mi-color-border);
    border-radius: 12px;
  }

  .inspector {
    display: flex;
    min-height: 240px;
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

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.renderEmptyState();
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
}

export function registerManifestInspector(): void {
  if (!customElements.get(MANIFEST_INSPECTOR_TAG)) {
    customElements.define(MANIFEST_INSPECTOR_TAG, ManifestInspectorElement);
  }
}

export const customElementTagName = MANIFEST_INSPECTOR_TAG;
