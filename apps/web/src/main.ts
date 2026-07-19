import {
  mountWebManifestInspector,
  wireManifestInputFlows,
  clearManifest,
  importManifestFile,
} from "@mvviewer/host-web";

const app = document.querySelector<HTMLElement>("#app");
const inspectorHost = document.querySelector<HTMLElement>("#inspector-host");
const clearButton = document.querySelector<HTMLButtonElement>("#clear-button");
const fileInput = document.querySelector<HTMLInputElement>("#file-input");

if (app && inspectorHost) {
  mountWebManifestInspector(inspectorHost);

  wireManifestInputFlows(inspectorHost, {
    onAnalyze: () => {
      if (clearButton) clearButton.hidden = false;
    },
  });

  const onClearClick = (): void => {
    clearManifest(inspectorHost);
    if (clearButton) clearButton.hidden = true;
    if (fileInput) fileInput.value = "";
  };

  const onFileChange = (): void => {
    const file = fileInput?.files?.[0];
    if (!file) return;
    importManifestFile(inspectorHost, file)
      .then(() => {
        if (clearButton) clearButton.hidden = false;
      })
      .catch(() => {
        if (clearButton) clearButton.hidden = true;
      });
  };

  clearButton?.addEventListener("click", onClearClick);
  fileInput?.addEventListener("change", onFileChange);
}
