// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from "vitest";
import {
  customElementTagName,
  registerManifestInspector,
} from "./index";

describe("@mvviewer/ui-components public contract", () => {
  it("exposes the manifest-inspector custom element tag name", () => {
    expect(customElementTagName).toBe("manifest-inspector");
  });

  it("does not throw when registration is invoked in a DOM-capable environment", () => {
    expect(() => registerManifestInspector()).not.toThrow();
    expect(() => registerManifestInspector()).not.toThrow();
    expect(customElements.get(customElementTagName)).toBeDefined();
  });
});

describe("manifest-inspector empty state", () => {
  beforeAll(() => {
    registerManifestInspector();
  });

  it("renders a local-first prompt without diagnostics or reports", () => {
    const host = document.createElement(customElementTagName);
    document.body.append(host);

    const shadow = host.shadowRoot;
    expect(shadow).not.toBeNull();

    const text = shadow?.textContent ?? "";
    expect(text).toContain(
      "Paste or drop a manifest.json to understand what each field does.",
    );
    expect(text).toContain("Your manifest is processed locally in this browser.");

    expect(text).not.toMatch(/diagnos|fix|health score|report|audit/i);

    host.remove();
  });
});
