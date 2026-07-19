import type { AnalysisSnapshot, SourceDocument } from "@manifest-lens/contracts";
import { createKnowledgeRegistry, resolveExplanations } from "@manifest-lens/knowledge";
import { buildSemanticManifestSnapshot } from "@manifest-lens/manifest-domain";
import { parseJsonDocument } from "@manifest-lens/parser-json";

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
