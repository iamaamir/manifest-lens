import { describe, expect, it } from "vitest";
import { createKnowledgeRegistry } from "../index.js";
import type { KnowledgeEntry } from "../types.js";
import { requiredNestedPaths } from "./required-nested-paths.js";
import { requiredPermissions } from "./required-permissions.js";
import { requiredTopLevelPaths } from "./required-top-level-paths.js";

const forbiddenDiagnosticTerms = ["fix this", "health score", "publishing will fail"];

describe("knowledge coverage catalogs", () => {
  it("has registry entries for required top-level manifest paths", () => {
    const registry = createKnowledgeRegistry();

    for (const path of requiredTopLevelPaths) {
      const entry = requireEntry(registry.pathEntries[path], `missing path entry: ${path}`);
      expect(entry.summary, `missing summary for ${path}`).not.toHaveLength(0);
      expect(entry.details.length, `missing details for ${path}`).toBeGreaterThan(0);
    }
  });

  it("has registry entries for required nested manifest paths", () => {
    const registry = createKnowledgeRegistry();

    for (const path of requiredNestedPaths) {
      const entry = requireEntry(registry.pathEntries[path], `missing nested path entry: ${path}`);
      expect(entry.summary, `missing summary for ${path}`).not.toHaveLength(0);
    }
  });

  it("has registry entries for required permission values", () => {
    const registry = createKnowledgeRegistry();

    for (const permission of requiredPermissions) {
      const entry = requireEntry(registry.permissionEntries[permission], `missing permission entry: ${permission}`);
      expect(entry.summary, `missing summary for ${permission}`).not.toHaveLength(0);
      expect(entry.details.length, `missing details for ${permission}`).toBeGreaterThan(0);
    }
  });

  it("keeps cataloged knowledge explanatory instead of diagnostic", () => {
    const registry = createKnowledgeRegistry();
    const entries = [
      ...requiredTopLevelPaths.map((path) => requireEntry(registry.pathEntries[path], `missing path entry: ${path}`)),
      ...requiredNestedPaths.map((path) => requireEntry(registry.pathEntries[path], `missing nested path entry: ${path}`)),
      ...requiredPermissions.map((permission) => requireEntry(registry.permissionEntries[permission], `missing permission entry: ${permission}`)),
    ];

    for (const entry of entries) {
      const searchableText = [entry.title, entry.summary, ...entry.details].join(" ").toLowerCase();
      for (const forbiddenTerm of forbiddenDiagnosticTerms) {
        expect(searchableText, `diagnostic wording in ${entry.id}`).not.toContain(forbiddenTerm);
      }
    }
  });
});

function requireEntry(entry: KnowledgeEntry | undefined, message: string): KnowledgeEntry {
  expect(entry, message).toBeDefined();
  if (!entry) {
    throw new Error(message);
  }
  return entry;
}
