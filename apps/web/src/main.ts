import {
  mountWebManifestInspector,
  wireManifestApp,
} from "@mvviewer/host-web";

const app = document.querySelector<HTMLElement>("#app");
const inspectorHost = document.querySelector<HTMLElement>("#inspector-host");
const textarea = document.querySelector<HTMLTextAreaElement>("#manifest-input");
const analyzeButton = document.querySelector<HTMLButtonElement>("#analyze-button");
const clearButton = document.querySelector<HTMLButtonElement>("#clear-button");
const fileInput = document.querySelector<HTMLInputElement>("#file-input");
const statusMessage = document.querySelector<HTMLElement>("#status-message");

if (app && inspectorHost) {
  mountWebManifestInspector(inspectorHost);

  wireManifestApp(
    inspectorHost,
    { textarea, analyzeButton, clearButton, fileInput },
    {
      onStatus: (message, kind) => {
        if (!statusMessage) return;
        statusMessage.textContent = message;
        if (message.length > 0) {
          statusMessage.dataset.kind = kind;
        } else {
          delete statusMessage.dataset.kind;
        }
      },
    },
  );
}
