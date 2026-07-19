import {
  loadManifestText,
  mountWebManifestInspector,
  wireManifestInputFlows,
  clearManifest,
  importManifestFile,
} from "@manifest-lens/host-web";

const SAMPLE_MANIFEST = JSON.stringify(
  {
    manifest_version: 3,
    name: "Example Extension",
    version: "1.0.0",
    description: "A sample extension for preview.",
    permissions: ["storage", "activeTab"],
    host_permissions: ["https://*/*"],
    action: {
      default_popup: "popup.html",
    },
    background: {
      service_worker: "background.js",
    },
  },
  null,
  2,
);

const app = document.querySelector<HTMLElement>("#app");
const inspectorHost = document.querySelector<HTMLElement>("#inspector-host");
const clearButton = document.querySelector<HTMLButtonElement>("#clear-button");
const fileInput = document.querySelector<HTMLInputElement>("#file-input");
const uploadButton = document.querySelector<HTMLButtonElement>("#upload-button");
const loadSampleButton = document.querySelector<HTMLButtonElement>("#load-sample-button");

if (app && inspectorHost) {
  mountWebManifestInspector(inspectorHost);

  // Empty state: show "Load sample", hide "Clear"
  if (loadSampleButton) loadSampleButton.hidden = false;

  wireManifestInputFlows(inspectorHost, {
    onAnalyze: () => {
      if (clearButton) clearButton.hidden = false;
      if (loadSampleButton) loadSampleButton.hidden = true;
    },
    onError: () => {
      if (clearButton) clearButton.hidden = true;
      if (loadSampleButton) loadSampleButton.hidden = false;
    },
  });

  const onClearClick = (): void => {
    clearManifest(inspectorHost);
    if (clearButton) clearButton.hidden = true;
    if (loadSampleButton) loadSampleButton.hidden = false;
    if (fileInput) fileInput.value = "";
  };

  const onUploadClick = (): void => {
    fileInput?.click();
  };

  const onFileChange = (): void => {
    const file = fileInput?.files?.[0];
    if (!file) return;
    importManifestFile(inspectorHost, file)
      .then((outcome) => {
        const hasLoadedManifest = outcome.kind === "analyzed";
        if (!hasLoadedManifest && fileInput) fileInput.value = "";
        if (clearButton) clearButton.hidden = !hasLoadedManifest;
        if (loadSampleButton) loadSampleButton.hidden = hasLoadedManifest;
      })
      .catch(() => {
        if (fileInput) fileInput.value = "";
        if (clearButton) clearButton.hidden = true;
        if (loadSampleButton) loadSampleButton.hidden = false;
      });
  };

  const onLoadSample = (): void => {
    loadManifestText(inspectorHost, SAMPLE_MANIFEST);
    if (clearButton) clearButton.hidden = false;
    if (loadSampleButton) loadSampleButton.hidden = true;
  };

  clearButton?.addEventListener("click", onClearClick);
  uploadButton?.addEventListener("click", onUploadClick);
  fileInput?.addEventListener("change", onFileChange);
  loadSampleButton?.addEventListener("click", onLoadSample);

  inspectorHost.addEventListener("load-sample", () => onLoadSample());
  inspectorHost.addEventListener("clear", () => onClearClick());
}
