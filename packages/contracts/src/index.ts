export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand;
};

export type DocumentId = Brand<string, "DocumentId">;
export type SyntaxNodeId = Brand<string, "SyntaxNodeId">;
export type SemanticNodeId = Brand<string, "SemanticNodeId">;

export type SourceLanguage = "json";

export interface SourceDocument {
  readonly id: DocumentId;
  readonly language: SourceLanguage;
  readonly text: string;
}

export interface SourcePosition {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

export interface SourceRange {
  readonly start: SourcePosition;
  readonly end: SourcePosition;
}

export type JsonPrimitive = string | number | boolean | null;

export interface SyntaxNodeBase {
  readonly id: SyntaxNodeId;
  readonly range: SourceRange;
  readonly path: readonly string[];
}

export type SyntaxNode =
  | (SyntaxNodeBase & {
      readonly kind: "document";
      readonly children: readonly SyntaxNode[];
    })
  | (SyntaxNodeBase & {
      readonly kind: "object";
      readonly children: readonly SyntaxNode[];
    })
  | (SyntaxNodeBase & {
      readonly kind: "array";
      readonly children: readonly SyntaxNode[];
    })
  | (SyntaxNodeBase & {
      readonly kind: "property";
      readonly keyRange: SourceRange;
      readonly valueRange?: SourceRange;
      readonly children: readonly SyntaxNode[];
    })
  | (SyntaxNodeBase & {
      readonly kind: "string";
      readonly value: string;
    })
  | (SyntaxNodeBase & {
      readonly kind: "number";
      readonly value: number;
    })
  | (SyntaxNodeBase & {
      readonly kind: "boolean";
      readonly value: boolean;
    })
  | (SyntaxNodeBase & {
      readonly kind: "null";
      readonly value: null;
    })
  | (SyntaxNodeBase & {
      readonly kind: "unknown";
      readonly children: readonly SyntaxNode[];
    });

export interface ParseError {
  readonly message: string;
  readonly range: SourceRange;
}

export interface ParseSnapshot {
  readonly document: SourceDocument;
  readonly root: SyntaxNode;
  readonly errors: readonly ParseError[];
}

export interface SourceParser {
  parse(document: SourceDocument): ParseSnapshot;
}

export type DetectedManifestVersion =
  | { readonly kind: "mv2"; readonly version: 2 }
  | { readonly kind: "mv3"; readonly version: 3 }
  | { readonly kind: "missing" }
  | { readonly kind: "invalid"; readonly value?: JsonPrimitive };

export type ManifestFieldName =
  | "manifest_version"
  | "name"
  | "version"
  | "description"
  | "permissions"
  | "host_permissions"
  | "content_scripts"
  | "background"
  | "action"
  | "browser_action"
  | "page_action"
  | "icons"
  | "commands"
  | "options_ui"
  | "web_accessible_resources"
  | "content_security_policy"
  | "declarative_net_request"
  | "default_locale"
  | "short_name"
  | "version_name"
  | "homepage_url"
  | "author"
  | "developer"
  | "options_page"
  | "optional_permissions"
  | "optional_host_permissions"
  | "devtools_page"
  | "omnibox"
  | "side_panel"
  | "incognito"
  | "browser_specific_settings"
  | "externally_connectable"
  | "chrome_settings_overrides"
  | "chrome_url_overrides"
  | "oauth2"
  | "sandbox"
  | "storage"
  | "minimum_chrome_version"
  | "key"
  | "update_url";

export interface BreadcrumbSegment {
  readonly label: string;
  readonly path: readonly string[];
}

export interface SemanticNodeBase {
  readonly id: SemanticNodeId;
  readonly syntaxNodeId: SyntaxNodeId;
  readonly parentId?: SemanticNodeId;
  readonly childIds: readonly SemanticNodeId[];
  readonly path: readonly string[];
  readonly normalizedPath: string;
  readonly breadcrumb: readonly BreadcrumbSegment[];
  readonly sourceRange: SourceRange;
  readonly keyRange?: SourceRange;
  readonly valueRange?: SourceRange;
}

export type SemanticNode =
  | (SemanticNodeBase & {
      readonly kind: "manifest";
    })
  | (SemanticNodeBase & {
      readonly kind: "field";
      readonly fieldName: ManifestFieldName;
    })
  | (SemanticNodeBase & {
      readonly kind: "unknownField";
      readonly fieldName: string;
    })
  | (SemanticNodeBase & {
      readonly kind: "permission";
      readonly value: string;
    })
  | (SemanticNodeBase & {
      readonly kind: "hostPermission";
      readonly value: string;
    })
  | (SemanticNodeBase & {
      readonly kind: "contentScript";
      readonly index: number;
    })
  | (SemanticNodeBase & {
      readonly kind: "contentScriptField";
      readonly fieldName: string;
    })
  | (SemanticNodeBase & {
      readonly kind: "contentScriptMatch";
      readonly value: string;
    })
  | (SemanticNodeBase & {
      readonly kind: "contentScriptFile";
      readonly value: string;
      readonly fileKind: "js" | "css";
    })
  | (SemanticNodeBase & {
      readonly kind: "arrayItem";
      readonly value?: JsonPrimitive;
    });

export interface SemanticManifestSnapshot {
  readonly document: SourceDocument;
  readonly parseRootId: SyntaxNodeId;
  readonly rootNodeId: SemanticNodeId;
  readonly manifestVersion: DetectedManifestVersion;
  readonly nodes: readonly SemanticNode[];
}

export type ExplanationId = Brand<string, "ExplanationId">;

export interface DocumentationLink {
  readonly label: string;
  readonly url: string;
}

export interface ManifestExample {
  readonly title: string;
  readonly code: string;
  readonly summary?: string;
}

export type FallbackExplanationReason =
  | "unknown-field"
  | "unknown-permission"
  | "unknown-host-permission"
  | "unknown-node-kind";

export type ExplanationSource =
  | { readonly kind: "knowledge"; readonly packId: string }
  | { readonly kind: "fallback"; readonly reason: FallbackExplanationReason };

export interface Explanation {
  readonly id: ExplanationId;
  readonly title: string;
  readonly summary: string;
  readonly details: readonly string[];
  readonly relatedFields: readonly string[];
  readonly examples: readonly ManifestExample[];
  readonly docsLinks: readonly DocumentationLink[];
  readonly source: ExplanationSource;
}

export interface AnalysisSnapshot {
  readonly document: SourceDocument;
  readonly parse: ParseSnapshot;
  readonly semantic: SemanticManifestSnapshot;
  readonly explanationsByNodeId: Readonly<Record<SemanticNodeId, Explanation>>;
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
