// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import {
  clearManifest,
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

  it("loads a valid manifest locally and renders preserved source", () => {
    const container = appendContainer();
    const snapshot = loadManifestText(container, VALID_MANIFEST);
    expect(snapshot.semantic.manifestVersion).toEqual({ kind: "mv3", version: 3 });

    const host = container.querySelector("manifest-inspector");
    const pre = host?.shadowRoot?.querySelector("pre.source-pre");
    expect(pre?.textContent).toBe(VALID_MANIFEST);
  });

  it("preserves original formatting of the source text", () => {
    const container = appendContainer();
    loadManifestText(container, VALID_MANIFEST);
    const host = container.querySelector("manifest-inspector");
    const text = host?.shadowRoot?.querySelector("pre.source-pre")?.textContent ?? "";
    expect(text).toContain('\n  "manifest_version": 3,');
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
    ).toContain("Paste or drop a manifest.json");
  });

  it("imports a manifest from a File locally", async () => {
    const container = appendContainer();
    const file = new File([VALID_MANIFEST], "manifest.json", {
      type: "application/json",
    });
    const snapshot = await importManifestFile(container, file);
    expect(snapshot.semantic.manifestVersion).toEqual({ kind: "mv3", version: 3 });
  });
});

describe("@mvviewer/host-web input wiring", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
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

    const pre = host.shadowRoot?.querySelector("pre.source-pre");
    expect(pre?.textContent).toBe(VALID_MANIFEST);
  });

  it("shows a calm inline message for invalid manifest input", () => {
    const container = appendContainer();
    mountWebManifestInspector(container);
    const status = { message: "", kind: "info" as "info" | "error" };
    wireManifestInputFlows(container, { onStatus: (m, k) => {
      status.message = m;
      status.kind = k;
    } });

    const host = container.querySelector("manifest-inspector")!;
    const dropEvent = new Event("drop", { bubbles: true }) as DragEvent;
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: { getData: () => INVALID_MANIFEST, files: null, dropEffect: "copy" },
    });
    host.dispatchEvent(dropEvent);

    expect(status.kind).toBe("error");
    expect(status.message.toLowerCase()).not.toMatch(/diagnos|fix|health score|report|audit/);
    expect(host.shadowRoot?.textContent ?? "").not.toMatch(/diagnos|fix|health score|report|audit/i);
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

  it("reports success for valid manifest via the Analyze button", () => {
    const { container, textarea, analyzeButton, clearButton, fileInput } =
      buildControls();
    const status = { message: "", kind: "info" as "info" | "error" };
    wireManifestApp(
      container,
      { textarea, analyzeButton, clearButton, fileInput },
      { onStatus: (m, k) => ((status.message = m), (status.kind = k)) },
    );

    textarea.value = VALID_MANIFEST;
    analyzeButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(status.kind).toBe("info");
    expect(status.message).toBe("Analyzed locally in your browser.");
  });

  it("never reports success for invalid JSON via the Analyze button", () => {
    const { container, textarea, analyzeButton, clearButton, fileInput } =
      buildControls();
    const status = { message: "", kind: "info" as "info" | "error" };
    wireManifestApp(
      container,
      { textarea, analyzeButton, clearButton, fileInput },
      { onStatus: (m, k) => ((status.message = m), (status.kind = k)) },
    );

    textarea.value = INVALID_MANIFEST;
    analyzeButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(status.kind).toBe("error");
    expect(status.message).not.toBe("Analyzed locally in your browser.");
  });

  it("clears status and textarea via the Clear button", () => {
    const { container, textarea, analyzeButton, clearButton, fileInput } =
      buildControls();
    const status = { message: "seed", kind: "info" as "info" | "error" };
    wireManifestApp(
      container,
      { textarea, analyzeButton, clearButton, fileInput },
      { onStatus: (m, k) => ((status.message = m), (status.kind = k)) },
    );

    textarea.value = VALID_MANIFEST;
    analyzeButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    clearButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(status.message).toBe("");
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
    const customSpan = host.shadowRoot?.querySelector(
      '.source-node[data-node-id*="unknownField"]',
    ) as HTMLElement | null;
    expect(customSpan).not.toBeNull();
    customSpan?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const title = host.shadowRoot?.querySelector(".explanation-title");
    expect(title?.textContent).toBeTruthy();
    expect(host.shadowRoot?.textContent ?? "").not.toMatch(
      /diagnos|fix|health score|report|audit/i,
    );
  });

  it("analyzes the permissions fixture and renders permission source nodes", () => {
    const container = appendContainer();
    const text = readFixture("permissions.json");
    const snapshot = loadManifestText(container, text);

    const permissionNodes = snapshot.semantic.nodes.filter(
      (node) => node.kind === "permission",
    );
    expect(permissionNodes.length).toBeGreaterThan(0);

    const host = container.querySelector("manifest-inspector")!;
    const permissionSpans = host.shadowRoot?.querySelectorAll(
      '.source-node[data-node-id*="permission:"]',
    );
    expect(permissionSpans?.length ?? 0).toBeGreaterThan(0);
  });

  it("analyzes the host-permissions fixture and renders host permission source nodes", () => {
    const container = appendContainer();
    const text = readFixture("host-permissions.json");
    const snapshot = loadManifestText(container, text);

    const hostPermissionNodes = snapshot.semantic.nodes.filter(
      (node) => node.kind === "hostPermission",
    );
    expect(hostPermissionNodes.length).toBeGreaterThan(0);

    const host = container.querySelector("manifest-inspector")!;
    const hostPermissionSpans = host.shadowRoot?.querySelectorAll(
      '.source-node[data-node-id*="hostPermission:"]',
    );
    expect(hostPermissionSpans?.length ?? 0).toBeGreaterThan(0);
  });

  it("reports a calm inline status for partial-invalid input without crashing", () => {
    const container = appendContainer();
    mountWebManifestInspector(container);
    const status = { message: "", kind: "info" as "info" | "error" };
    wireManifestInputFlows(container, {
      onStatus: (m, k) => {
        status.message = m;
        status.kind = k;
      },
    });

    const text = readFixture("partial-invalid.json");
    const host = container.querySelector("manifest-inspector")!;
    const dropEvent = new Event("drop", { bubbles: true }) as DragEvent;
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: { getData: () => text, files: null, dropEffect: "copy" },
    });
    expect(() => host.dispatchEvent(dropEvent)).not.toThrow();

    expect(status.kind).toBe("error");
    expect(status.message.toLowerCase()).not.toMatch(
      /diagnos|fix|health score|report|audit/i,
    );
    expect(host.shadowRoot?.textContent ?? "").not.toMatch(
      /diagnos|fix|health score|report|audit/i,
    );
  });
});
