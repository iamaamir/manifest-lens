import type { ExplanationId } from "@manifest-lens/contracts";
import type { KnowledgeEntry, KnowledgeEntryBuilder } from "./types.js";

export function mke(
  id: string,
  title: string,
  summary: string,
  opts?: KnowledgeEntryBuilder,
): KnowledgeEntry {
  return {
    id: id as ExplanationId,
    title,
    summary,
    details: opts?.details ?? [],
    relatedFields: opts?.relatedFields ?? [],
    examples: opts?.examples ?? [],
    docsLinks: opts?.docsLinks ?? [],
  };
}
