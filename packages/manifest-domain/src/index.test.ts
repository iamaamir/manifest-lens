import { describe, expect, it } from "vitest";
import type {
  DocumentId,
  ParseSnapshot,
  SourceDocument,
  SourceRange,
  SyntaxNode,
  SyntaxNodeId,
} from "@manifest-lens/contracts";
import {
  buildSemanticManifestSnapshot,
  findSemanticNodeByPath,
  findSemanticNodesByKind,
} from "./index";

const document: SourceDocument = {
  id: "document:test" as DocumentId,
  language: "json",
  text: "{}",
};

function range(start: number, end: number): SourceRange {
  return {
    start: { line: 0, column: start, offset: start },
    end: { line: 0, column: end, offset: end },
  };
}

function id(path: readonly string[], kind: SyntaxNode["kind"], offset = 0): SyntaxNodeId {
  return `syntax:${path.join("/")}:${kind}:${offset}` as SyntaxNodeId;
}

function stringNode(path: readonly string[], value: string, start = 0): SyntaxNode {
  return {
    id: id(path, "string", start),
    kind: "string",
    range: range(start, start + value.length + 2),
    path,
    value,
  };
}

function numberNode(path: readonly string[], value: number, start = 0): SyntaxNode {
  return {
    id: id(path, "number", start),
    kind: "number",
    range: range(start, start + String(value).length),
    path,
    value,
  };
}

function booleanNode(path: readonly string[], value: boolean, start = 0): SyntaxNode {
  return {
    id: id(path, "boolean", start),
    kind: "boolean",
    range: range(start, start + String(value).length),
    path,
    value,
  };
}

function arrayNode(path: readonly string[], children: readonly SyntaxNode[], start = 0): SyntaxNode {
  return {
    id: id(path, "array", start),
    kind: "array",
    range: range(start, start + 10),
    path,
    children,
  };
}

function objectNode(path: readonly string[], children: readonly SyntaxNode[], start = 0): SyntaxNode {
  return {
    id: id(path, "object", start),
    kind: "object",
    range: range(start, start + 20),
    path,
    children,
  };
}

function propertyNode(path: readonly string[], valueNode: SyntaxNode, start = 0): SyntaxNode {
  return {
    id: id(path, "property", start),
    kind: "property",
    range: range(start, valueNode.range.end.offset),
    path,
    keyRange: range(start, start + String(path.at(-1) ?? "").length + 2),
    valueRange: valueNode.range,
    children: [valueNode],
  };
}

function parseSnapshot(properties: readonly SyntaxNode[]): ParseSnapshot {
  const jsonRoot = objectNode([], properties, 0);

  return {
    document,
    root: {
      id: id([], "document", 0),
      kind: "document",
      range: jsonRoot.range,
      path: [],
      children: [jsonRoot],
    },
    errors: [],
  };
}

describe("buildSemanticManifestSnapshot", () => {
  it("detects MV3 and maps common top-level fields", () => {
    const snapshot = buildSemanticManifestSnapshot(
      parseSnapshot([
        propertyNode(["manifest_version"], numberNode(["manifest_version"], 3, 20), 1),
        propertyNode(["name"], stringNode(["name"], "Example Extension", 40), 30),
        propertyNode(["version"], stringNode(["version"], "1.0.0", 70), 60),
      ]),
    );

    expect(snapshot.manifestVersion).toEqual({ kind: "mv3", version: 3 });
    expect(findSemanticNodeByPath(snapshot, ["manifest_version"])?.kind).toBe("field");
    expect(findSemanticNodeByPath(snapshot, ["name"])?.kind).toBe("field");
    expect(findSemanticNodeByPath(snapshot, ["version"])?.kind).toBe("field");
    expect(snapshot.nodes[0]?.kind).toBe("manifest");
  });

  it("maps all required common top-level fields as known fields", () => {
    const fieldNames = [
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
      "default_locale",
      "short_name",
      "version_name",
      "homepage_url",
      "author",
      "developer",
      "options_page",
      "optional_permissions",
      "optional_host_permissions",
      "devtools_page",
      "omnibox",
      "side_panel",
      "incognito",
      "browser_specific_settings",
      "externally_connectable",
      "chrome_settings_overrides",
      "chrome_url_overrides",
      "oauth2",
      "sandbox",
      "storage",
      "minimum_chrome_version",
      "key",
      "update_url",
    ] as const;
    const properties = fieldNames.map((fieldName, index) =>
      propertyNode([fieldName], fieldName === "manifest_version" ? numberNode([fieldName], 3, index + 10) : stringNode([fieldName], "value", index + 10), index),
    );
    const snapshot = buildSemanticManifestSnapshot(parseSnapshot(properties));

    for (const fieldName of fieldNames) {
      const node = findSemanticNodeByPath(snapshot, [fieldName]);

      expect(node?.kind).toBe("field");
    }
  });

  it("detects MV2, missing, and invalid manifest versions", () => {
    const mv2 = buildSemanticManifestSnapshot(
      parseSnapshot([propertyNode(["manifest_version"], numberNode(["manifest_version"], 2, 20), 1)]),
    );
    const missing = buildSemanticManifestSnapshot(parseSnapshot([propertyNode(["name"], stringNode(["name"], "Missing"), 1)]));
    const invalid = buildSemanticManifestSnapshot(
      parseSnapshot([propertyNode(["manifest_version"], numberNode(["manifest_version"], 4, 20), 1)]),
    );
    const invalidString = buildSemanticManifestSnapshot(
      parseSnapshot([propertyNode(["manifest_version"], stringNode(["manifest_version"], "3", 20), 1)]),
    );

    expect(mv2.manifestVersion).toEqual({ kind: "mv2", version: 2 });
    expect(missing.manifestVersion).toEqual({ kind: "missing" });
    expect(invalid.manifestVersion).toEqual({ kind: "invalid", value: 4 });
    expect(invalidString.manifestVersion).toEqual({ kind: "invalid", value: "3" });
  });

  it("creates selectable permission and host permission item nodes", () => {
    const permissionsValue = arrayNode(
      ["permissions"],
      [stringNode(["permissions", "0"], "tabs", 80), stringNode(["permissions", "1"], "storage", 90)],
      70,
    );
    const hostPermissionsValue = arrayNode(
      ["host_permissions"],
      [stringNode(["host_permissions", "0"], "https://example.com/*", 120)],
      110,
    );
    const snapshot = buildSemanticManifestSnapshot(
      parseSnapshot([
        propertyNode(["manifest_version"], numberNode(["manifest_version"], 3), 1),
        propertyNode(["permissions"], permissionsValue, 60),
        propertyNode(["host_permissions"], hostPermissionsValue, 100),
      ]),
    );

    expect(findSemanticNodeByPath(snapshot, ["permissions"])?.kind).toBe("field");
    expect(findSemanticNodeByPath(snapshot, ["permissions", "0"])?.kind).toBe("permission");
    expect(findSemanticNodeByPath(snapshot, ["permissions", "0"])?.normalizedPath).toBe("permissions[]");
    expect(findSemanticNodeByPath(snapshot, ["host_permissions", "0"])?.kind).toBe("hostPermission");
  });

  it("creates selectable optional permission and optional host permission item nodes", () => {
    const optionalPermissionsValue = arrayNode(
      ["optional_permissions"],
      [stringNode(["optional_permissions", "0"], "cookies", 80)],
      70,
    );
    const optionalHostPermissionsValue = arrayNode(
      ["optional_host_permissions"],
      [stringNode(["optional_host_permissions", "0"], "https://example.com/*", 120)],
      110,
    );
    const snapshot = buildSemanticManifestSnapshot(
      parseSnapshot([
        propertyNode(["manifest_version"], numberNode(["manifest_version"], 3), 1),
        propertyNode(["optional_permissions"], optionalPermissionsValue, 60),
        propertyNode(["optional_host_permissions"], optionalHostPermissionsValue, 100),
      ]),
    );

    expect(findSemanticNodeByPath(snapshot, ["optional_permissions"])?.kind).toBe("field");
    expect(findSemanticNodeByPath(snapshot, ["optional_permissions", "0"])?.kind).toBe("permission");
    expect(findSemanticNodeByPath(snapshot, ["optional_permissions", "0"])?.normalizedPath).toBe("optional_permissions[]");
    expect(findSemanticNodeByPath(snapshot, ["optional_host_permissions", "0"])?.kind).toBe("hostPermission");
  });

  it("creates content script semantic nodes for script objects, matches, files, and fields", () => {
    const scriptObject = objectNode(
      ["content_scripts", "0"],
      [
        propertyNode(
          ["content_scripts", "0", "matches"],
          arrayNode(
            ["content_scripts", "0", "matches"],
            [stringNode(["content_scripts", "0", "matches", "0"], "https://example.com/*", 120)],
            110,
          ),
          100,
        ),
        propertyNode(
          ["content_scripts", "0", "js"],
          arrayNode(["content_scripts", "0", "js"], [stringNode(["content_scripts", "0", "js", "0"], "content.js", 150)], 145),
          140,
        ),
        propertyNode(
          ["content_scripts", "0", "css"],
          arrayNode(["content_scripts", "0", "css"], [stringNode(["content_scripts", "0", "css", "0"], "content.css", 165)], 162),
          155,
        ),
        propertyNode(["content_scripts", "0", "run_at"], stringNode(["content_scripts", "0", "run_at"], "document_idle", 170), 160),
        propertyNode(["content_scripts", "0", "all_frames"], booleanNode(["content_scripts", "0", "all_frames"], true, 190), 180),
      ],
      90,
    );
    const contentScripts = arrayNode(["content_scripts"], [scriptObject], 80);
    const snapshot = buildSemanticManifestSnapshot(
      parseSnapshot([
        propertyNode(["manifest_version"], numberNode(["manifest_version"], 3), 1),
        propertyNode(["content_scripts"], contentScripts, 70),
      ]),
    );

    expect(findSemanticNodeByPath(snapshot, ["content_scripts", "0"])?.kind).toBe("contentScript");
    const matchNode = findSemanticNodeByPath(snapshot, ["content_scripts", "0", "matches", "0"]);
    const jsNode = findSemanticNodeByPath(snapshot, ["content_scripts", "0", "js", "0"]);
    const cssNode = findSemanticNodeByPath(snapshot, ["content_scripts", "0", "css", "0"]);

    expect(findSemanticNodeByPath(snapshot, ["content_scripts", "0", "matches"])?.kind).toBe("contentScriptField");
    expect(matchNode?.kind).toBe("contentScriptMatch");
    expect(matchNode?.kind === "contentScriptMatch" ? matchNode.value : undefined).toBe("https://example.com/*");
    expect(jsNode?.kind).toBe("contentScriptFile");
    expect(jsNode?.kind === "contentScriptFile" ? jsNode.fileKind : undefined).toBe("js");
    expect(cssNode?.kind).toBe("contentScriptFile");
    expect(cssNode?.kind === "contentScriptFile" ? cssNode.fileKind : undefined).toBe("css");
    expect(findSemanticNodeByPath(snapshot, ["content_scripts", "0", "run_at"])?.kind).toBe("contentScriptField");
  });

  it("keeps unknown fields selectable with breadcrumbs", () => {
    const snapshot = buildSemanticManifestSnapshot(
      parseSnapshot([
        propertyNode(["manifest_version"], numberNode(["manifest_version"], 3), 1),
        propertyNode(
          ["x_internal_metadata"],
          objectNode(
            ["x_internal_metadata"],
            [propertyNode(["x_internal_metadata", "owner"], stringNode(["x_internal_metadata", "owner"], "team-a", 60), 50)],
            40,
          ),
          30,
        ),
      ]),
    );

    expect(findSemanticNodeByPath(snapshot, ["x_internal_metadata"])?.kind).toBe("unknownField");
    expect(findSemanticNodeByPath(snapshot, ["x_internal_metadata", "owner"])?.kind).toBe("unknownField");
    expect(findSemanticNodeByPath(snapshot, ["x_internal_metadata", "owner"])?.breadcrumb.map((item) => item.label)).toEqual([
      "x_internal_metadata",
      "owner",
    ]);
  });

  it("creates useful breadcrumbs for manifest fields and permission items", () => {
    const permissionsValue = arrayNode(["permissions"], [stringNode(["permissions", "0"], "tabs", 80)], 70);
    const snapshot = buildSemanticManifestSnapshot(
      parseSnapshot([
        propertyNode(["manifest_version"], numberNode(["manifest_version"], 3), 1),
        propertyNode(["permissions"], permissionsValue, 60),
      ]),
    );

    expect(findSemanticNodeByPath(snapshot, [])?.breadcrumb.map((item) => item.label)).toEqual(["manifest"]);
    expect(findSemanticNodeByPath(snapshot, ["manifest_version"])?.breadcrumb.map((item) => item.label)).toEqual([
      "manifest_version",
    ]);
    expect(findSemanticNodeByPath(snapshot, ["permissions", "0"])?.breadcrumb.map((item) => item.label)).toEqual([
      "permissions",
      "tabs",
    ]);
  });

  it("returns a serializable semantic snapshot with valid parent-child references", () => {
    const permissionsValue = arrayNode(["permissions"], [stringNode(["permissions", "0"], "tabs", 80)], 70);
    const snapshot = buildSemanticManifestSnapshot(
      parseSnapshot([
        propertyNode(["manifest_version"], numberNode(["manifest_version"], 3), 1),
        propertyNode(["permissions"], permissionsValue, 60),
      ]),
    );
    const roundTripped = JSON.parse(JSON.stringify(snapshot)) as typeof snapshot;
    const nodeIds = new Set(snapshot.nodes.map((node) => node.id));
    const childIds = snapshot.nodes.flatMap((node) => node.childIds);
    const permissionNodes = findSemanticNodesByKind(snapshot, "permission");

    expect(roundTripped.rootNodeId).toBe(snapshot.rootNodeId);
    expect(permissionNodes).toHaveLength(1);
    expect(childIds.every((childId) => nodeIds.has(childId))).toBe(true);
    expect(snapshot.nodes.filter((node) => node.parentId).every((node) => nodeIds.has(node.parentId!))).toBe(true);

    for (const parent of snapshot.nodes) {
      for (const childId of parent.childIds) {
        const child = snapshot.nodes.find((candidate) => candidate.id === childId);
        expect(child?.parentId).toBe(parent.id);
      }
    }

    for (const child of snapshot.nodes.filter((node) => node.parentId)) {
      const parent = snapshot.nodes.find((candidate) => candidate.id === child.parentId);
      expect(parent?.childIds).toContain(child.id);
    }
  });
});
