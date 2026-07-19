import {
  type AnalysisSnapshot,
  type DocumentId,
  type SourceDocument,
} from "@manifest-lens/contracts";
import { analyzeManifest } from "@manifest-lens/core";
import {
  customElementTagName,
  type DropFeedbackKind,
  ManifestInspectorElement,
  registerManifestInspector,
} from "@manifest-lens/ui-components";

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

const STATUS_INVALID =
  "This file could not be analyzed. Check that it is a manifest.json with valid JSON.";

export type AnalyzeOutcome =
  | { readonly kind: "empty"; readonly message: string }
  | {
      readonly kind: "analyzed";
      readonly message: string;
      readonly snapshot: AnalysisSnapshot;
    }
  | { readonly kind: "invalid"; readonly message: string };

type DropCandidate =
  | { readonly kind: "accepted" }
  | { readonly kind: "rejected" };

function isJsonFileCandidate(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  if (lowerName === "manifest.json") return true;
  if (lowerName.endsWith(".json")) return true;
  return file.type === "application/json";
}

function hasTextCandidate(dataTransfer: DataTransfer): boolean {
  const types = Array.from(dataTransfer.types ?? []);
  return types.some((type) => type === "text/plain" || type === "text");
}

export function classifyDropCandidate(dataTransfer: DataTransfer | null): DropCandidate {
  if (!dataTransfer) return { kind: "rejected" };

  const files = dataTransfer.files ?? null;
  if (files && files.length > 1) return { kind: "rejected" };
  if (files && files.length === 1) {
    const file = files[0]!;
    return isJsonFileCandidate(file) ? { kind: "accepted" } : { kind: "rejected" };
  }

  const items = Array.from(dataTransfer.items ?? []);
  if (items.length > 1 && items.filter((item) => item.kind === "file").length > 1) {
    return { kind: "rejected" };
  }
  if (items.some((item) => item.kind === "string")) return { kind: "accepted" };
  if (items.some((item) => item.kind === "file" && item.type === "application/json")) {
    return { kind: "accepted" };
  }
  if (items.some((item) => item.kind === "file" && item.type === "")) {
    return { kind: "accepted" };
  }
  if (hasTextCandidate(dataTransfer)) return { kind: "accepted" };

  const plainText = dataTransfer.getData?.("text/plain") ?? "";
  const fallbackText = dataTransfer.getData?.("text") ?? "";
  if (plainText.trim().length > 0 || fallbackText.trim().length > 0) {
    return { kind: "accepted" };
  }

  return { kind: "rejected" };
}

function analyzeText(container: HTMLElement, text: string): AnalyzeOutcome {
  if (text.trim().length === 0) {
    return { kind: "empty", message: "" };
  }
  try {
    const document: SourceDocument = createSourceDocument(text);
    const snapshot = analyzeManifest(document);
    const host = ensureInspector(container);
    if (snapshot.parse.errors.length > 0) {
      host.showError(STATUS_INVALID);
      return { kind: "invalid", message: STATUS_INVALID };
    }
    host.loadSnapshot(snapshot);
    return { kind: "analyzed", message: "", snapshot };
  } catch {
    const host = ensureInspector(container);
    host.showError(STATUS_INVALID);
    return { kind: "invalid", message: STATUS_INVALID };
  }
}

export interface HostInputFlowOptions {
  readonly onAnalyze?: () => void;
  readonly onError?: (message: string) => void;
}

function isEditablePasteTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === "textarea") return true;
  if (tagName === "input") return true;
  return target.isContentEditable;
}

export function wireManifestInputFlows(
  container: HTMLElement,
  options: HostInputFlowOptions = {},
): { readonly dispose: () => void } {
  const host = ensureInspector(container);

  const analyze = (text: string): void => {
    const outcome = analyzeText(container, text);
    if (outcome.kind === "analyzed") {
      options.onAnalyze?.();
    }
    if (outcome.kind === "invalid") {
      options.onError?.(outcome.message);
    }
  };

  let dragDepth = 0;

  const showDropFeedback = (kind: DropFeedbackKind): void => {
    host.showDropFeedback(kind);
  };

  const clearDropFeedback = (): void => {
    dragDepth = 0;
    host.clearDropFeedback();
  };

  const handleFiles = (files: FileList | null): void => {
    if (!files || files.length !== 1) return;
    const file = files[0]!;
    if (!isJsonFileCandidate(file)) return;
    readFileText(file)
      .then((text) => analyze(text))
      .catch(() => {});
  };

  const onPaste = (event: ClipboardEvent): void => {
    if (!container.isConnected) return;
    if (event.defaultPrevented || isEditablePasteTarget(event.target)) return;
    const text = event.clipboardData?.getData("text") ?? "";
    if (text.trim().length > 0) {
      event.preventDefault();
      analyze(text);
    }
  };

  const onDragEnter = (event: DragEvent): void => {
    dragDepth += 1;
    const candidate = classifyDropCandidate(event.dataTransfer ?? null);
    showDropFeedback(candidate.kind);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = candidate.kind === "accepted" ? "copy" : "none";
    }
    event.preventDefault();
  };

  const onDragOver = (event: DragEvent): void => {
    const candidate = classifyDropCandidate(event.dataTransfer ?? null);
    showDropFeedback(candidate.kind);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = candidate.kind === "accepted" ? "copy" : "none";
    }
    event.preventDefault();
  };

  const onDragLeave = (): void => {
    dragDepth -= 1;
    if (dragDepth <= 0) clearDropFeedback();
  };

  const onDrop = (event: DragEvent): void => {
    event.preventDefault();
    const candidate = classifyDropCandidate(event.dataTransfer ?? null);
    clearDropFeedback();
    if (candidate.kind === "rejected") return;

    const files = event.dataTransfer?.files ?? null;
    if (files && files.length > 0) {
      handleFiles(files);
      return;
    }

    const text = event.dataTransfer?.getData("text/plain") || event.dataTransfer?.getData("text") || "";
    if (text.trim().length === 0) return;
    analyze(text);
  };

  const onDragEnd = (): void => {
    clearDropFeedback();
  };

  const onDocumentDrop = (event: DragEvent): void => {
    if (event.target === host || event.composedPath().includes(host)) return;
    clearDropFeedback();
  };

  const onGlobalDragCleanup = (): void => {
    clearDropFeedback();
  };

  host.addEventListener("paste", onPaste as EventListener);
  document.addEventListener("paste", onPaste as EventListener);
  host.addEventListener("dragenter", onDragEnter as EventListener);
  host.addEventListener("dragover", onDragOver as EventListener);
  host.addEventListener("dragleave", onDragLeave as EventListener);
  host.addEventListener("drop", onDrop as EventListener);
  host.addEventListener("dragend", onDragEnd as EventListener);
  document.addEventListener("drop", onDocumentDrop as EventListener);
  document.addEventListener("dragend", onGlobalDragCleanup as EventListener);
  window.addEventListener("blur", onGlobalDragCleanup as EventListener);

  return {
    dispose(): void {
      host.removeEventListener("paste", onPaste as EventListener);
      document.removeEventListener("paste", onPaste as EventListener);
      host.removeEventListener("dragenter", onDragEnter as EventListener);
      host.removeEventListener("dragover", onDragOver as EventListener);
      host.removeEventListener("dragleave", onDragLeave as EventListener);
      host.removeEventListener("drop", onDrop as EventListener);
      host.removeEventListener("dragend", onDragEnd as EventListener);
      document.removeEventListener("drop", onDocumentDrop as EventListener);
      document.removeEventListener("dragend", onGlobalDragCleanup as EventListener);
      window.removeEventListener("blur", onGlobalDragCleanup as EventListener);
    },
  };
}

export async function importManifestFile(
  container: HTMLElement,
  file: File,
): Promise<AnalyzeOutcome> {
  if (!isJsonFileCandidate(file)) {
    const host = ensureInspector(container);
    host.showError(STATUS_INVALID);
    return { kind: "invalid", message: STATUS_INVALID };
  }
  const text = await readFileText(file);
  return analyzeText(container, text);
}

export interface ManifestAppControls {
  readonly textarea?: HTMLTextAreaElement | null;
  readonly analyzeButton?: HTMLButtonElement | null;
  readonly clearButton?: HTMLButtonElement | null;
  readonly fileInput?: HTMLInputElement | null;
}

export function wireManifestApp(
  container: HTMLElement,
  controls: ManifestAppControls,
): { readonly dispose: () => void } {
  const analyze = (text: string): void => {
    analyzeText(container, text);
  };

  const inputFlow = wireManifestInputFlows(container);

  const onAnalyzeClick = (): void => {
    analyze(controls.textarea?.value ?? "");
  };

  const onClearClick = (): void => {
    clearManifest(container);
    if (controls.textarea) controls.textarea.value = "";
  };

  const onFileChange = (): void => {
    const file = controls.fileInput?.files?.[0];
    if (!file) return;
    importManifestFile(container, file).catch(() => {});
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
