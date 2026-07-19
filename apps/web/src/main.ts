import { mountWebManifestInspector } from "@mvviewer/host-web";

const app = document.querySelector<HTMLElement>("#app");

if (app) {
  mountWebManifestInspector(app);
}
