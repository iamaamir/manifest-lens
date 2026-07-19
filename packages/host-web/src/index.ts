import {
  customElementTagName,
  registerManifestInspector,
} from "@mvviewer/ui-components";

export function mountWebManifestInspector(container: HTMLElement): HTMLElement {
  registerManifestInspector();

  let host = container.querySelector<HTMLElement>(customElementTagName);
  if (!host) {
    host = document.createElement(customElementTagName);
    container.append(host);
  }

  return host;
}
