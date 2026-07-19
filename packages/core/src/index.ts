import type { AnalysisSnapshot, SourceDocument } from "@mvviewer/contracts";
import { createKnowledgeRegistry, resolveExplanations } from "@mvviewer/knowledge";
import { buildSemanticManifestSnapshot } from "@mvviewer/manifest-domain";
import { parseJsonDocument } from "@mvviewer/parser-json";

const defaultRegistry = createKnowledgeRegistry();

export function analyzeManifest(document: SourceDocument): AnalysisSnapshot {
  const parseSnapshot = parseJsonDocument(document);
  const semanticSnapshot = buildSemanticManifestSnapshot(parseSnapshot);
  const explanationsByNodeId = resolveExplanations(semanticSnapshot, defaultRegistry);

  return {
    document,
    parse: parseSnapshot,
    semantic: semanticSnapshot,
    explanationsByNodeId,
  };
}
