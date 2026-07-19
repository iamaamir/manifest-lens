// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { mountWebManifestInspector } from "./index";

describe("@mvviewer/host-web mount helper", () => {
  it("exposes a mount function without depending on a DOM environment at import time", () => {
    expect(typeof mountWebManifestInspector).toBe("function");
  });

  it("appends and returns a manifest-inspector host when run in a DOM-capable environment", () => {
    const container = document.createElement("div");
    const host = mountWebManifestInspector(container);
    expect(host.tagName.toLowerCase()).toBe("manifest-inspector");
    expect(container.contains(host)).toBe(true);
  });

  it("does not append a duplicate host on repeated mount", () => {
    const container = document.createElement("div");
    mountWebManifestInspector(container);
    mountWebManifestInspector(container);
    const hosts = container.querySelectorAll("manifest-inspector");
    expect(hosts.length).toBe(1);
  });
});
