import {
  type AnalysisSnapshot,
  type DocumentId,
  type SourceDocument,
} from "@mvviewer/contracts";
import { analyzeManifest } from "@mvviewer/core";
import {
  customElementTagName,
  ManifestInspectorElement,
  registerManifestInspector,
} from "@mvviewer/ui-components";

export { customElementTagName };

function createSourceDocument(text: string): SourceDocument {
  return {
    id: `document:${text.length}` as DocumentId,
    language: "json",
    text,
  };
}

function ensureInspector(container: HTMLElement): ManifestInspectorElement {
  registerManifestInspector();

  let host = container.querySelector<ManifestInspectorElement>(customElementTagName);
  if (!host) {
    host = document.createElement(customElementTagName) as ManifestInspectorElement;
    container.append(host);
  }

  return host;
}

export function mountWebManifestInspector(container: HTMLElement): HTMLElement {
  const host = ensureInspector(container);
  return host;
}

export function loadManifestText(
  container: HTMLElement,
  text: string,
): AnalysisSnapshot {
  const document: SourceDocument = createSourceDocument(text);
  const snapshot = analyzeManifest(document);
  const host = ensureInspector(container);
  host.loadSnapshot(snapshot);
  return snapshot;
}

export function clearManifest(container: HTMLElement): void {
  const host = ensureInspector(container);
  host.clear();
}

async function readFileText(file: File): Promise<string> {
  return file.text();
}

export type HostStatusKind = "info" | "error";

const STATUS_EMPTY = "Paste or drop a manifest.json to begin.";
const STATUS_ANALYZED = "Analyzed locally in your browser.";
const STATUS_INVALID =
  "This file could not be analyzed. Check that it is a manifest.json with valid JSON.";
const STATUS_UNREADABLE = "The selected file could not be read.";

export type AnalyzeOutcome =
  | { readonly kind: "empty"; readonly message: string }
  | {
      readonly kind: "analyzed";
      readonly message: string;
      readonly snapshot: AnalysisSnapshot;
    }
  | { readonly kind: "invalid"; readonly message: string };

function analyzeText(container: HTMLElement, text: string): AnalyzeOutcome {
  if (text.trim().length === 0) {
    return { kind: "empty", message: STATUS_EMPTY };
  }
  try {
    const snapshot = loadManifestText(container, text);
    if (snapshot.parse.errors.length > 0) {
      return { kind: "invalid", message: STATUS_INVALID };
    }
    return { kind: "analyzed", message: STATUS_ANALYZED, snapshot };
  } catch {
    return { kind: "invalid", message: STATUS_INVALID };
  }
}

function statusKindFor(outcome: AnalyzeOutcome): HostStatusKind {
  return outcome.kind === "invalid" ? "error" : "info";
}

export interface HostInputFlowOptions {
  readonly onStatus?: (message: string, kind: HostStatusKind) => void;
}

export function wireManifestInputFlows(
  container: HTMLElement,
  options: HostInputFlowOptions = {},
): { readonly dispose: () => void } {
  const host = ensureInspector(container);
  const report = (message: string, kind: HostStatusKind = "info") =>
    options.onStatus?.(message, kind);

  const analyze = (text: string): void => {
    const outcome = analyzeText(container, text);
    report(outcome.message, statusKindFor(outcome));
  };

  const handleFiles = (files: FileList | null): void => {
    if (!files || files.length === 0) return;
    const file = files[0]!;
    readFileText(file)
      .then((text) => analyze(text))
      .catch(() => {
        report(STATUS_UNREADABLE, "error");
      });
  };

  const onPaste = (event: ClipboardEvent): void => {
    const text = event.clipboardData?.getData("text") ?? "";
    if (text.trim().length > 0) {
      event.preventDefault();
      analyze(text);
    }
  };

  const onDragOver = (event: DragEvent): void => {
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    event.preventDefault();
  };

  const onDrop = (event: DragEvent): void => {
    event.preventDefault();
    const files = event.dataTransfer?.files ?? null;
    if (files && files.length > 0) {
      handleFiles(files);
    } else {
      const text = event.dataTransfer?.getData("text") ?? "";
      analyze(text);
    }
  };

  host.addEventListener("paste", onPaste as EventListener);
  host.addEventListener("dragover", onDragOver as EventListener);
  host.addEventListener("drop", onDrop as EventListener);

  return {
    dispose(): void {
      host.removeEventListener("paste", onPaste as EventListener);
      host.removeEventListener("dragover", onDragOver as EventListener);
      host.removeEventListener("drop", onDrop as EventListener);
    },
  };
}

export async function importManifestFile(
  container: HTMLElement,
  file: File,
): Promise<AnalysisSnapshot> {
  const text = await readFileText(file);
  return loadManifestText(container, text);
}

export interface ManifestAppControls {
  readonly textarea?: HTMLTextAreaElement | null;
  readonly analyzeButton?: HTMLButtonElement | null;
  readonly clearButton?: HTMLButtonElement | null;
  readonly fileInput?: HTMLInputElement | null;
}

export interface ManifestAppOptions {
  readonly onStatus?: (message: string, kind: HostStatusKind) => void;
}

export function wireManifestApp(
  container: HTMLElement,
  controls: ManifestAppControls,
  options: ManifestAppOptions = {},
): { readonly dispose: () => void } {
  const report = (message: string, kind: HostStatusKind = "info") =>
    options.onStatus?.(message, kind);

  const analyze = (text: string): void => {
    const outcome = analyzeText(container, text);
    report(outcome.message, statusKindFor(outcome));
  };

  const inputFlow = wireManifestInputFlows(
    container,
    options.onStatus ? { onStatus: options.onStatus } : {},
  );

  const onAnalyzeClick = (): void => {
    analyze(controls.textarea?.value ?? "");
  };

  const onClearClick = (): void => {
    clearManifest(container);
    if (controls.textarea) controls.textarea.value = "";
    report("", "info");
  };

  const onFileChange = (): void => {
    const file = controls.fileInput?.files?.[0];
    if (!file) return;
    readFileText(file)
      .then((text) => analyze(text))
      .catch(() => {
        report(STATUS_UNREADABLE, "error");
      });
  };

  controls.analyzeButton?.addEventListener("click", onAnalyzeClick);
  controls.clearButton?.addEventListener("click", onClearClick);
  controls.fileInput?.addEventListener("change", onFileChange);

  return {
    dispose(): void {
      inputFlow.dispose();
      controls.analyzeButton?.removeEventListener("click", onAnalyzeClick);
      controls.clearButton?.removeEventListener("click", onClearClick);
      controls.fileInput?.removeEventListener("change", onFileChange);
    },
  };
}
