import type {
  DocumentationLink,
  Explanation,
  ExplanationId,
  ExplanationSource,
  FallbackExplanationReason,
  SemanticManifestSnapshot,
  SemanticNode,
  SemanticNodeId,
} from "@manifest-lens/contracts";
import { buildPathEntries } from "./entries/path-entries.js";
import { buildPermissionEntries } from "./entries/permission-entries.js";
import type { KnowledgeEntry, KnowledgeRegistry } from "./types.js";

export type { KnowledgeEntry, KnowledgeRegistry } from "./types.js";

const REGISTRY_PACK_ID = "manifest-lens-knowledge";

const UNKNOWN_FIELD_DOCS_LINKS: readonly DocumentationLink[] = [
  { label: "Chrome: manifest file format", url: "https://developer.chrome.com/docs/extensions/reference/manifest" },
  { label: "MDN: manifest.json reference", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json" },
];

export function createKnowledgeRegistry(): KnowledgeRegistry {
  return {
    pathEntries: buildPathEntries(),
    permissionEntries: buildPermissionEntries(),
  };
}

export function resolveExplanations(
  snapshot: SemanticManifestSnapshot,
  registry: KnowledgeRegistry,
): Readonly<Record<SemanticNodeId, Explanation>> {
  const explanationsByNodeId: Record<SemanticNodeId, Explanation> = {};

  for (const node of snapshot.nodes) {
    explanationsByNodeId[node.id] = resolveNodeExplanation(node, registry);
  }

  return explanationsByNodeId;
}

export function resolveNodeExplanation(
  node: SemanticNode,
  registry: KnowledgeRegistry,
): Explanation {
  if (node.kind === "permission") {
    const permissionEntry = registry.permissionEntries[node.value];

    if (permissionEntry) {
      return entryToExplanation(permissionEntry, { kind: "knowledge", packId: REGISTRY_PACK_ID });
    }

    return createFallbackExplanation(node, "unknown-permission");
  }

  if (node.kind === "hostPermission") {
    if (isRecognizedHostPermission(node.value)) {
      const pathEntry = registry.pathEntries["host_permissions[]"];
      if (pathEntry) {
        return entryToExplanation(pathEntry, { kind: "knowledge", packId: REGISTRY_PACK_ID });
      }
    }
    return createFallbackExplanation(node, "unknown-host-permission");
  }

  const pathEntry = registry.pathEntries[node.normalizedPath];

  if (pathEntry) {
    return entryToExplanation(pathEntry, { kind: "knowledge", packId: REGISTRY_PACK_ID });
  }

  const wildcardPathEntry = findWildcardPathEntry(node.normalizedPath, registry.pathEntries);

  if (wildcardPathEntry) {
    return entryToExplanation(wildcardPathEntry, { kind: "knowledge", packId: REGISTRY_PACK_ID });
  }

  if (node.kind === "contentScriptField") {
    const fieldEntry = registry.pathEntries[`content_scripts[].${node.fieldName}`];

    if (fieldEntry) {
      return entryToExplanation(fieldEntry, { kind: "knowledge", packId: REGISTRY_PACK_ID });
    }
  }

  const fallbackReason = fallbackReasonForNode(node);

  return createFallbackExplanation(node, fallbackReason);
}

function findWildcardPathEntry(
  normalizedPath: string,
  pathEntries: Readonly<Record<string, KnowledgeEntry>>,
): KnowledgeEntry | undefined {
  for (const [pattern, entry] of Object.entries(pathEntries)) {
    if (pattern.includes("*") && wildcardPathMatches(pattern, normalizedPath)) {
      return entry;
    }
  }

  return undefined;
}

function wildcardPathMatches(pattern: string, normalizedPath: string): boolean {
  const patternSegments = pattern.split(".");
  const pathSegments = normalizedPath.split(".");

  if (patternSegments.length !== pathSegments.length) {
    return false;
  }

  return patternSegments.every((segment, index) => segment === "*" || segment === pathSegments[index]);
}

function isRecognizedHostPermission(value: string): boolean {
  if (value === "<all_urls>") {
    return true;
  }
  const knownSchemes = ["http", "https", "file", "ftp", "*"];
  const schemeEnd = value.indexOf("://");
  if (schemeEnd === -1) {
    return false;
  }
  const scheme = value.slice(0, schemeEnd);
  return knownSchemes.includes(scheme);
}

function entryToExplanation(
  entry: KnowledgeEntry,
  source: ExplanationSource,
): Explanation {
  return {
    id: entry.id,
    title: entry.title,
    summary: entry.summary,
    details: entry.details,
    relatedFields: entry.relatedFields,
    examples: entry.examples,
    docsLinks: entry.docsLinks,
    source,
  };
}

function fallbackReasonForNode(node: SemanticNode): FallbackExplanationReason {
  switch (node.kind) {
    case "unknownField":
      return "unknown-field";
    case "permission":
      return "unknown-permission";
    case "hostPermission":
      return "unknown-host-permission";
    default:
      return "unknown-node-kind";
  }
}

function createFallbackExplanation(
  node: SemanticNode,
  reason: FallbackExplanationReason,
): Explanation {
  const title = fallbackTitle(reason);
  const summary = fallbackSummary(reason);

  return {
    id: `explanation:fallback:${reason}:${node.normalizedPath}` as ExplanationId,
    title,
    summary,
    details: fallbackDetails(reason),
    relatedFields: [],
    examples: [],
    docsLinks: fallbackDocsLinks(reason),
    source: { kind: "fallback", reason },
  };
}

function fallbackTitle(reason: FallbackExplanationReason): string {
  switch (reason) {
    case "unknown-field":
      return "Unknown Field";
    case "unknown-permission":
      return "Unknown Permission";
    case "unknown-host-permission":
      return "Unknown Host Permission";
    case "unknown-node-kind":
      return "No Explanation Available";
  }
}

function fallbackSummary(reason: FallbackExplanationReason): string {
  switch (reason) {
    case "unknown-field":
      return "This key is unrecognized by Manifest Lens's current field reference. It may be browser-specific, experimental, or newer than the bundled knowledge.";
    case "unknown-permission":
      return "This permission is not one of the commonly explained permissions. The extension declares it for access to browser capabilities, but Manifest Lens does not yet have a specific explanation.";
    case "unknown-host-permission":
      return "This host permission pattern controls which websites the extension can access, but Manifest Lens does not yet have a specific explanation for this value.";
    case "unknown-node-kind":
      return "This part of the manifest is not yet covered by Manifest Lens's explanation knowledge. You can still interact with it in the source view.";
  }
}

function fallbackDetails(reason: FallbackExplanationReason): readonly string[] {
  switch (reason) {
    case "unknown-field":
      return ["Check the official manifest references below for browser-specific or newly added fields. The source tree still shows the field exactly as it appears in the manifest."];
    case "unknown-permission":
    case "unknown-host-permission":
    case "unknown-node-kind":
      return [];
  }
}

function fallbackDocsLinks(reason: FallbackExplanationReason): readonly DocumentationLink[] {
  switch (reason) {
    case "unknown-field":
      return UNKNOWN_FIELD_DOCS_LINKS;
    case "unknown-permission":
    case "unknown-host-permission":
    case "unknown-node-kind":
      return [];
  }
}
