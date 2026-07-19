import type { DocumentationLink, ExplanationId, ManifestExample } from "@manifest-lens/contracts";

export interface KnowledgeEntry {
  readonly id: ExplanationId;
  readonly title: string;
  readonly summary: string;
  readonly details: readonly string[];
  readonly relatedFields: readonly string[];
  readonly examples: readonly ManifestExample[];
  readonly docsLinks: readonly DocumentationLink[];
}

export interface KnowledgeRegistry {
  readonly pathEntries: Readonly<Record<string, KnowledgeEntry>>;
  readonly permissionEntries: Readonly<Record<string, KnowledgeEntry>>;
}

export interface KnowledgeEntryBuilder {
  details?: readonly string[];
  relatedFields?: readonly string[];
  examples?: readonly ManifestExample[];
  docsLinks?: readonly DocumentationLink[];
}
