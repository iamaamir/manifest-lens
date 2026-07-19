import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSemanticManifestSnapshot, findSemanticNodeByPath } from "@mvviewer/manifest-domain";
import { createSourceDocument, parseJsonDocument } from "@mvviewer/parser-json";

function readFixture(name: string): string {
  return readFileSync(join(process.cwd(), "fixtures", "manifests", name), "utf8");
}

function parseAndMap(name: string) {
  const source = readFixture(name);
  const parseSnapshot = parseJsonDocument(createSourceDocument(source));
  const semanticSnapshot = buildSemanticManifestSnapshot(parseSnapshot);

  return { source, parseSnapshot, semanticSnapshot };
}

describe("Phase 1 parser to Phase 2 semantic integration", () => {
  it("maps permission values from real source ranges", () => {
    const { source, parseSnapshot, semanticSnapshot } = parseAndMap("permissions.json");
    const tabs = findSemanticNodeByPath(semanticSnapshot, ["permissions", "0"]);
    const storage = findSemanticNodeByPath(semanticSnapshot, ["permissions", "1"]);
    const scripting = findSemanticNodeByPath(semanticSnapshot, ["permissions", "3"]);

    expect(parseSnapshot.errors).toEqual([]);
    expect(tabs?.kind).toBe("permission");
    expect(tabs?.kind === "permission" ? tabs.value : undefined).toBe("tabs");
    expect(tabs ? source.slice(tabs.sourceRange.start.offset, tabs.sourceRange.end.offset) : undefined).toBe('"tabs"');
    expect(storage?.kind === "permission" ? storage.value : undefined).toBe("storage");
    expect(scripting?.kind === "permission" ? scripting.value : undefined).toBe("scripting");
  });

  it("maps host permission values from real source ranges", () => {
    const { source, semanticSnapshot } = parseAndMap("host-permissions.json");
    const host = findSemanticNodeByPath(semanticSnapshot, ["host_permissions", "0"]);
    const allUrls = findSemanticNodeByPath(semanticSnapshot, ["host_permissions", "2"]);

    expect(host?.kind).toBe("hostPermission");
    expect(host?.kind === "hostPermission" ? host.value : undefined).toBe("https://example.com/*");
    expect(host ? source.slice(host.sourceRange.start.offset, host.sourceRange.end.offset) : undefined).toBe(
      '"https://example.com/*"',
    );
    expect(allUrls?.kind === "hostPermission" ? allUrls.value : undefined).toBe("<all_urls>");
  });

  it("maps content scripts, CSS files, and unknown fields from parser output", () => {
    const contentScripts = parseAndMap("nested-content-scripts.json").semanticSnapshot;
    const unknown = parseAndMap("unknown-custom-fields.json").semanticSnapshot;
    const cssNode = findSemanticNodeByPath(contentScripts, ["content_scripts", "0", "css", "0"]);

    expect(findSemanticNodeByPath(contentScripts, ["content_scripts", "0"])?.kind).toBe("contentScript");
    expect(cssNode?.kind).toBe("contentScriptFile");
    expect(cssNode?.kind === "contentScriptFile" ? cssNode.fileKind : undefined).toBe("css");
    expect(findSemanticNodeByPath(unknown, ["x_internal_metadata"])?.kind).toBe("unknownField");
    expect(findSemanticNodeByPath(unknown, ["x_internal_metadata", "owner"])?.kind).toBe("unknownField");
  });

  it("maps all common top-level fields from a realistic fixture", () => {
    const { semanticSnapshot } = parseAndMap("full-common-mv3.json");
    const fields = [
      "manifest_version",
      "name",
      "version",
      "description",
      "permissions",
      "host_permissions",
      "content_scripts",
      "background",
      "action",
      "browser_action",
      "page_action",
      "icons",
      "commands",
      "options_ui",
      "web_accessible_resources",
      "content_security_policy",
      "declarative_net_request",
    ];

    for (const field of fields) {
      expect(findSemanticNodeByPath(semanticSnapshot, [field])?.kind).toBe("field");
    }
  });

  it("detects manifest version states from real fixtures", () => {
    expect(parseAndMap("minimal-mv3.json").semanticSnapshot.manifestVersion).toEqual({ kind: "mv3", version: 3 });
    expect(parseAndMap("mv2-common.json").semanticSnapshot.manifestVersion).toEqual({ kind: "mv2", version: 2 });
    expect(parseAndMap("missing-manifest-version.json").semanticSnapshot.manifestVersion).toEqual({ kind: "missing" });
    expect(parseAndMap("invalid-manifest-version.json").semanticSnapshot.manifestVersion).toEqual({
      kind: "invalid",
      value: 4,
    });
  });
});
