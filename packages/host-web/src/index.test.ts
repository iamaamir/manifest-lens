// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import {
  clearManifest,
  classifyDropCandidate,
  importManifestFile,
  loadManifestText,
  mountWebManifestInspector,
  wireManifestApp,
  wireManifestInputFlows,
} from "./index";

function readFixture(name: string): string {
  return readFileSync(join(process.cwd(), "fixtures", "manifests", name), "utf8");
}

const VALID_MANIFEST = `{
  "manifest_version": 3,
  "name": "Example Extension",
  "version": "1.0.0"
}`;

const INVALID_MANIFEST = `{
  "manifest_version": 3,
  "name": "Broken Example",
  "permissions": ["tabs",
}`;

function pasteEventWithText(text: string): ClipboardEvent {
  const event = new Event("paste", {
    bubbles: true,
    cancelable: true,
  }) as ClipboardEvent;
  Object.defineProperty(event, "clipboardData", {
    value: { getData: () => text },
  });
  return event;
}

function appendContainer(): HTMLElement {
  const container = document.createElement("div");
  document.body.append(container);
  return container;
}

describe("@mvviewer/host-web mount helper", () => {
  beforeAll(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("network should never be used");
    });
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("exposes a mount function without depending on a DOM environment at import time", () => {
    expect(typeof mountWebManifestInspector).toBe("function");
  });

  it("appends and returns a manifest-inspector host when run in a DOM-capable environment", () => {
    const container = appendContainer();
    const host = mountWebManifestInspector(container);
    expect(host.tagName.toLowerCase()).toBe("manifest-inspector");
    expect(container.contains(host)).toBe(true);
  });

  it("does not append a duplicate host on repeated mount", () => {
    const container = appendContainer();
    mountWebManifestInspector(container);
    mountWebManifestInspector(container);
    const hosts = container.querySelectorAll("manifest-inspector");
    expect(hosts.length).toBe(1);
  });
});

describe("@mvviewer/host-web local analysis flow", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("loads a valid manifest locally and renders a tree", () => {
    const container = appendContainer();
    const snapshot = loadManifestText(container, VALID_MANIFEST);
    expect(snapshot.semantic.manifestVersion).toEqual({ kind: "mv3", version: 3 });

    const host = container.querySelector("manifest-inspector");
    const tree = host?.shadowRoot?.querySelector(".tree-container");
    expect(tree).not.toBeNull();
    expect(tree?.textContent).toContain("manifest_version");
  });

  it("preserves original formatting of the source text", () => {
    const container = appendContainer();
    loadManifestText(container, VALID_MANIFEST);
    const host = container.querySelector("manifest-inspector");
    const tree = host?.shadowRoot?.querySelector(".tree-container");
    expect(tree?.textContent).not.toBeNull();
    expect(tree?.textContent).toContain("manifest_version");
  });

  it("shows an explanation panel for the loaded manifest", () => {
    const container = appendContainer();
    loadManifestText(container, VALID_MANIFEST);
    const host = container.querySelector("manifest-inspector");
    const title = host?.shadowRoot?.querySelector(".explanation-title");
    expect(title?.textContent).toBeTruthy();
  });

  it("does not send manifest contents over the network during paste analysis", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const xhrSpy = vi.spyOn(globalThis, "XMLHttpRequest");
    const beaconSpy = vi.spyOn(globalThis.navigator, "sendBeacon");
    const wsSpy = vi.spyOn(globalThis, "WebSocket");

    const container = appendContainer();
    loadManifestText(container, VALID_MANIFEST);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
    expect(beaconSpy).not.toHaveBeenCalled();
    expect(wsSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    xhrSpy.mockRestore();
    beaconSpy.mockRestore();
    wsSpy.mockRestore();
  });

  it("clears the inspector without crashing", () => {
    const container = appendContainer();
    loadManifestText(container, VALID_MANIFEST);
    expect(() => clearManifest(container)).not.toThrow();
    const host = container.querySelector("manifest-inspector");
    expect(
      host?.shadowRoot?.textContent ?? "",
    ).toContain("Drop a manifest.json");
  });

  it("imports a manifest from a File locally", async () => {
    const container = appendContainer();
    const file = new File([VALID_MANIFEST], "manifest.json", {
      type: "application/json",
    });
    const outcome = await importManifestFile(container, file);
    expect(outcome.kind).toBe("analyzed");
    if (outcome.kind === "analyzed") {
      expect(outcome.snapshot.semantic.manifestVersion).toEqual({ kind: "mv3", version: 3 });
    }
  });

  it("shows the same calm error card when uploading invalid JSON", async () => {
    const container = appendContainer();
    loadManifestText(container, VALID_MANIFEST);
    const file = new File([INVALID_MANIFEST], "manifest.json", {
      type: "application/json",
    });

    const outcome = await importManifestFile(container, file);
    const host = container.querySelector("manifest-inspector")!;

    expect(outcome.kind).toBe("invalid");
    expect(host.shadowRoot?.querySelector(".tree-container")).toBeNull();
    expect(host.shadowRoot?.querySelector(".error-card")).not.toBeNull();
    expect(host.shadowRoot?.querySelector(".explanation-empty")?.textContent).toContain(
      "Hover any field once your manifest loads",
    );
    expect(host.shadowRoot?.textContent ?? "").not.toContain("Example Extension");
  });
});

describe("@mvviewer/host-web input wiring", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("classifies safely knowable drop candidates", () => {
    const jsonFile = new File([VALID_MANIFEST], "manifest.json", { type: "application/json" });
    const textTransfer = {
      files: null,
      items: [],
      types: ["text/plain"],
      getData: () => VALID_MANIFEST,
    } as unknown as DataTransfer;
    const nonJsonTransfer = {
      files: [new File(["plain"], "notes.txt", { type: "text/plain" })],
      items: [],
      types: [],
      getData: () => "",
    } as unknown as DataTransfer;
    const jsonTransfer = {
      files: [jsonFile],
      items: [],
      types: [],
      getData: () => "",
    } as unknown as DataTransfer;

    expect(classifyDropCandidate(textTransfer).kind).toBe("accepted");
    expect(classifyDropCandidate(jsonTransfer).kind).toBe("accepted");
    expect(classifyDropCandidate(nonJsonTransfer).kind).toBe("rejected");
  });

  it("shows pre-drop feedback and advertises copy on dragover", () => {
    const container = appendContainer();
    mountWebManifestInspector(container);
    wireManifestInputFlows(container);

    const host = container.querySelector("manifest-inspector")!;
    const dragOverEvent = new Event("dragover", { bubbles: true, cancelable: true }) as DragEvent;
    const dataTransfer = { getData: () => VALID_MANIFEST, files: null, items: [], types: [], dropEffect: "none" };
    Object.defineProperty(dragOverEvent, "dataTransfer", { value: dataTransfer });
    host.dispatchEvent(dragOverEvent);

    expect(dragOverEvent.defaultPrevented).toBe(true);
    expect(dataTransfer.dropEffect).toBe("copy");
    expect(host.classList.contains("is-dragging")).toBe(true);
    expect(host.shadowRoot?.querySelector(".drop-overlay-text")?.textContent).toBe(
      "Drop manifest.json to inspect locally",
    );
  });

  it("clears pre-drop feedback on dragleave", () => {
    const container = appendContainer();
    mountWebManifestInspector(container);
    wireManifestInputFlows(container);

    const host = container.querySelector("manifest-inspector")!;
    const dragEnterEvent = new Event("dragenter", { bubbles: true, cancelable: true }) as DragEvent;
    Object.defineProperty(dragEnterEvent, "dataTransfer", {
      value: { getData: () => VALID_MANIFEST, files: null, items: [], types: [], dropEffect: "none" },
    });
    host.dispatchEvent(dragEnterEvent);
    host.dispatchEvent(new Event("dragleave", { bubbles: true }));

    expect(host.classList.contains("is-dragging")).toBe(false);
  });

  it("clears stuck drag feedback on global cleanup events", () => {
    const container = appendContainer();
    mountWebManifestInspector(container);
    const wiring = wireManifestInputFlows(container);

    const host = container.querySelector("manifest-inspector")!;
    const dragEnterEvent = new Event("dragenter", { bubbles: true, cancelable: true }) as DragEvent;
    Object.defineProperty(dragEnterEvent, "dataTransfer", {
      value: { getData: () => VALID_MANIFEST, files: null, items: [], types: [], dropEffect: "none" },
    });
    host.dispatchEvent(dragEnterEvent);
    expect(host.classList.contains("is-dragging")).toBe(true);

    window.dispatchEvent(new Event("blur"));
    expect(host.classList.contains("is-dragging")).toBe(false);

    host.dispatchEvent(dragEnterEvent);
    expect(host.classList.contains("is-dragging")).toBe(true);
    document.dispatchEvent(new Event("dragend", { bubbles: true }));
    expect(host.classList.contains("is-dragging")).toBe(false);

    wiring.dispose();
    host.dispatchEvent(dragEnterEvent);
    expect(host.classList.contains("is-dragging")).toBe(false);
  });

  it("analyze drop text through wired drop flow", () => {
    const container = appendContainer();
    mountWebManifestInspector(container);
    wireManifestInputFlows(container);

    const host = container.querySelector("manifest-inspector")!;
    const dropEvent = new Event("drop", { bubbles: true }) as DragEvent;
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: { getData: () => VALID_MANIFEST, files: null, dropEffect: "copy" },
    });
    host.dispatchEvent(dropEvent);

    const tree = host.shadowRoot?.querySelector(".tree-container");
    expect(tree).not.toBeNull();
    expect(tree?.textContent).toContain("manifest_version");
  });

  it("analyzes pasted page-level text through wired paste flow", () => {
    const container = appendContainer();
    mountWebManifestInspector(container);
    wireManifestInputFlows(container);

    const pasteEvent = pasteEventWithText(VALID_MANIFEST);
    document.body.dispatchEvent(pasteEvent);

    const host = container.querySelector("manifest-inspector")!;
    const tree = host.shadowRoot?.querySelector(".tree-container");
    expect(pasteEvent.defaultPrevented).toBe(true);
    expect(tree).not.toBeNull();
    expect(tree?.textContent).toContain("manifest_version");
  });

  it("does not steal paste from textarea controls", () => {
    const container = appendContainer();
    mountWebManifestInspector(container);
    const textarea = document.createElement("textarea");
    document.body.append(textarea);
    wireManifestInputFlows(container);

    const pasteEvent = pasteEventWithText(VALID_MANIFEST);
    textarea.dispatchEvent(pasteEvent);

    const host = container.querySelector("manifest-inspector")!;
    expect(pasteEvent.defaultPrevented).toBe(false);
    expect(host.shadowRoot?.querySelector(".tree-container")).toBeNull();
  });

  it("shows a calm inline state for invalid manifest input", () => {
    const container = appendContainer();
    mountWebManifestInspector(container);
    wireManifestInputFlows(container);

    const host = container.querySelector("manifest-inspector")!;
    const dropEvent = new Event("drop", { bubbles: true }) as DragEvent;
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: { getData: () => INVALID_MANIFEST, files: null, dropEffect: "copy" },
    });
    host.dispatchEvent(dropEvent);

    expect(host.shadowRoot?.textContent ?? "").not.toMatch(/diagnos|fix|health score|report|audit/i);
  });

  it("clears previous source and explanation when invalid input follows a valid pinned manifest", () => {
    const container = appendContainer();
    mountWebManifestInspector(container);
    wireManifestInputFlows(container);

    const host = container.querySelector("manifest-inspector")!;
    loadManifestText(container, VALID_MANIFEST);
    const sourceRow = host.shadowRoot?.querySelector(".tree-row") as HTMLElement | null;
    sourceRow?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(host.shadowRoot?.querySelector(".tree-container")?.textContent).toContain("manifest_version");

    const dropEvent = new Event("drop", { bubbles: true }) as DragEvent;
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: { getData: () => INVALID_MANIFEST, files: null, dropEffect: "copy" },
    });
    host.dispatchEvent(dropEvent);

    expect(host.shadowRoot?.querySelector(".tree-container")).toBeNull();
    expect(host.shadowRoot?.textContent ?? "").not.toContain("Example Extension");
    expect(host.shadowRoot?.textContent ?? "").not.toContain("Manifest Version");
  });
});

describe("@mvviewer/host-web app control wiring", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  function buildControls(): {
    container: HTMLElement;
    textarea: HTMLTextAreaElement;
    analyzeButton: HTMLButtonElement;
    clearButton: HTMLButtonElement;
    fileInput: HTMLInputElement;
  } {
    const container = appendContainer();
    mountWebManifestInspector(container);
    const textarea = document.createElement("textarea");
    const analyzeButton = document.createElement("button");
    const clearButton = document.createElement("button");
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    document.body.append(textarea, analyzeButton, clearButton, fileInput);
    return { container, textarea, analyzeButton, clearButton, fileInput };
  }

  it("loads valid manifest via the Analyze button", () => {
    const { container, textarea, analyzeButton } =
      buildControls();
    wireManifestApp(
      container,
      { textarea, analyzeButton },
    );

    textarea.value = VALID_MANIFEST;
    analyzeButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const host = container.querySelector("manifest-inspector")!;
    expect(host.shadowRoot?.querySelector(".tree-container")).not.toBeNull();
  });

  it("clears textarea via the Clear button", () => {
    const { container, textarea, analyzeButton, clearButton } =
      buildControls();
    wireManifestApp(
      container,
      { textarea, analyzeButton, clearButton },
    );

    textarea.value = VALID_MANIFEST;
    analyzeButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    clearButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(textarea.value).toBe("");
  });
});

describe("@mvviewer/host-web privacy on import and drop paths", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  function spyNetwork() {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("network should never be used");
    });
    const xhrSpy = vi.spyOn(globalThis, "XMLHttpRequest");
    const beaconSpy = vi.spyOn(globalThis.navigator, "sendBeacon");
    const wsSpy = vi.spyOn(globalThis, "WebSocket");
    return { fetchSpy, xhrSpy, beaconSpy, wsSpy };
  }

  function expectNoNetwork(spies: ReturnType<typeof spyNetwork>): void {
    expect(spies.fetchSpy).not.toHaveBeenCalled();
    expect(spies.xhrSpy).not.toHaveBeenCalled();
    expect(spies.beaconSpy).not.toHaveBeenCalled();
    expect(spies.wsSpy).not.toHaveBeenCalled();
    spies.fetchSpy.mockRestore();
    spies.xhrSpy.mockRestore();
    spies.beaconSpy.mockRestore();
    spies.wsSpy.mockRestore();
  }

  it("does not send manifest contents over the network when importing a file", async () => {
    const spies = spyNetwork();
    const container = appendContainer();
    const file = new File([VALID_MANIFEST], "manifest.json", {
      type: "application/json",
    });
    await importManifestFile(container, file);
    expectNoNetwork(spies);
  });

  it("does not send manifest contents over the network on the wired drop path", () => {
    const spies = spyNetwork();
    const container = appendContainer();
    mountWebManifestInspector(container);
    wireManifestInputFlows(container);

    const host = container.querySelector("manifest-inspector")!;
    const dropEvent = new Event("drop", { bubbles: true }) as DragEvent;
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: { getData: () => VALID_MANIFEST, files: null, dropEffect: "copy" },
    });
    host.dispatchEvent(dropEvent);

    expectNoNetwork(spies);
  });
});

describe("@mvviewer/host-web fixture-backed coverage", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("analyzes the unknown/custom fields fixture locally and shows fallback", () => {
    const container = appendContainer();
    const text = readFixture("unknown-custom-fields.json");
    const snapshot = loadManifestText(container, text);

    const customNodes = snapshot.semantic.nodes.filter(
      (node) => node.kind === "unknownField",
    );
    expect(customNodes.length).toBeGreaterThan(0);

    const host = container.querySelector("manifest-inspector")!;
    const customRow = host.shadowRoot?.querySelector(
      '.tree-row[data-node-id*="unknownField"]',
    ) as HTMLElement | null;
    expect(customRow).not.toBeNull();
    customRow?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const title = host.shadowRoot?.querySelector(".explanation-title");
    expect(title?.textContent).toBeTruthy();
    expect(host.shadowRoot?.textContent ?? "").not.toMatch(
      /diagnos|fix|health score|report|audit/i,
    );
  });

  it("analyzes the permissions fixture and renders permission tree rows", () => {
    const container = appendContainer();
    const text = readFixture("permissions.json");
    const snapshot = loadManifestText(container, text);

    const permissionNodes = snapshot.semantic.nodes.filter(
      (node) => node.kind === "permission",
    );
    expect(permissionNodes.length).toBeGreaterThan(0);

    const host = container.querySelector("manifest-inspector")!;
    const permissionRows = host.shadowRoot?.querySelectorAll(
      '.tree-row[data-node-id*="permission:"]',
    );
    expect(permissionRows?.length ?? 0).toBeGreaterThan(0);
  });

  it("analyzes the host-permissions fixture and renders host permission tree rows", () => {
    const container = appendContainer();
    const text = readFixture("host-permissions.json");
    const snapshot = loadManifestText(container, text);

    const hostPermissionNodes = snapshot.semantic.nodes.filter(
      (node) => node.kind === "hostPermission",
    );
    expect(hostPermissionNodes.length).toBeGreaterThan(0);

    const host = container.querySelector("manifest-inspector")!;
    const hostPermissionRows = host.shadowRoot?.querySelectorAll(
      '.tree-row[data-node-id*="hostPermission:"]',
    );
    expect(hostPermissionRows?.length ?? 0).toBeGreaterThan(0);
  });

  it("reports a calm inline state for partial-invalid input without crashing", () => {
    const container = appendContainer();
    mountWebManifestInspector(container);
    wireManifestInputFlows(container);

    const text = readFixture("partial-invalid.json");
    const host = container.querySelector("manifest-inspector")!;
    const dropEvent = new Event("drop", { bubbles: true }) as DragEvent;
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: { getData: () => text, files: null, dropEffect: "copy" },
    });
    expect(() => host.dispatchEvent(dropEvent)).not.toThrow();

    expect(host.shadowRoot?.textContent ?? "").not.toMatch(
      /diagnos|fix|health score|report|audit/i,
    );
  });
});
