import {
  type BreadcrumbSegment,
  type DetectedManifestVersion,
  type JsonPrimitive,
  type ManifestFieldName,
  type ParseSnapshot,
  type SemanticManifestSnapshot,
  type SemanticNode,
  type SemanticNodeId,
  type SourceRange,
  type SyntaxNode,
  type SyntaxNodeId,
} from "@manifest-lens/contracts";

const knownTopLevelFields = new Set<string>([
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
  "cross_origin_embedder_policy",
  "cross_origin_opener_policy",
  "dark_theme",
  "dictionaries",
  "protocol_handlers",
  "requirements",
  "sidebar_action",
  "theme",
  "theme_experiment",
  "tts_engine",
  "user_scripts",
  "mime_types_handler",
  "offline_enabled",
  "automation",
  "content_capabilities",
  "export",
  "import",
  "file_browser_handlers",
  "file_handlers",
  "file_system_provider_capabilities",
  "input_components",
]);

type PropertySyntaxNode = Extract<SyntaxNode, { readonly kind: "property" }>;

type ObjectSyntaxNode = Extract<SyntaxNode, { readonly kind: "object" }>;

interface SemanticDraftBase {
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

export function buildSemanticManifestSnapshot(parseSnapshot: ParseSnapshot): SemanticManifestSnapshot {
  const rootSyntaxNode = findJsonRoot(parseSnapshot.root) ?? parseSnapshot.root;
  const manifestNode = createManifestNode(rootSyntaxNode);
  const topLevelProperties = collectTopLevelProperties(rootSyntaxNode);
  const childBuilds = topLevelProperties.map((property) => buildPropertySemanticNode(property, manifestNode.id));
  const rootNode = {
    ...manifestNode,
    childIds: childBuilds.map((build) => build.node.id),
  };
  const childNodes = childBuilds.flatMap((build) => flattenSemanticBuild(build));

  return {
    document: parseSnapshot.document,
    parseRootId: parseSnapshot.root.id,
    rootNodeId: rootNode.id,
    manifestVersion: detectManifestVersion(topLevelProperties),
    nodes: [rootNode, ...childNodes],
  };
}

export function findSemanticNodeByPath(
  snapshot: SemanticManifestSnapshot,
  path: readonly string[],
): SemanticNode | undefined {
  return snapshot.nodes.find((node) => pathEquals(node.path, path));
}

export function findSemanticNodesByKind(
  snapshot: SemanticManifestSnapshot,
  kind: SemanticNode["kind"],
): readonly SemanticNode[] {
  return snapshot.nodes.filter((node) => node.kind === kind);
}

interface SemanticBuild {
  readonly node: SemanticNode;
  readonly children: readonly SemanticBuild[];
}

function createManifestNode(syntaxNode: SyntaxNode): SemanticNode {
  return {
    id: createSemanticNodeId([], "manifest", syntaxNode.range.start.offset),
    kind: "manifest",
    syntaxNodeId: syntaxNode.id,
    childIds: [],
    path: [],
    normalizedPath: "manifest",
    breadcrumb: [{ label: "manifest", path: [] }],
    sourceRange: syntaxNode.range,
  };
}

function buildPropertySemanticNode(property: PropertySyntaxNode, parentId: SemanticNodeId): SemanticBuild {
  const fieldName = property.path.at(-1) ?? "<unknown>";
  const children = buildChildrenForProperty(property, createSemanticNodeId(property.path, classifyPropertyKind(property), property.range.start.offset));
  const childIds = children.map((child) => child.node.id);
  const base = createBase(property, parentId, childIds);
  const node = knownTopLevelFields.has(fieldName) && property.path.length === 1
    ? createKnownFieldNode(base, fieldName as ManifestFieldName)
    : createUnknownFieldNode(base, fieldName);

  return {
    node,
    children,
  };
}

function buildChildrenForProperty(property: PropertySyntaxNode, parentId: SemanticNodeId): readonly SemanticBuild[] {
  const valueNode = property.children[0];

  if (!valueNode) {
    return [];
  }

  if (isPermissionsProperty(property)) {
    return valueNode.kind === "array" ? valueNode.children.map((child) => buildPermissionNode(child, parentId)) : [];
  }

  if (isHostPermissionsProperty(property)) {
    return valueNode.kind === "array" ? valueNode.children.map((child) => buildHostPermissionNode(child, parentId)) : [];
  }

  if (isContentScriptsProperty(property)) {
    return valueNode.kind === "array"
      ? valueNode.children.map((child, index) => buildContentScriptNode(child, parentId, index))
      : [];
  }

  return collectNestedPropertyNodes(valueNode).map((nestedProperty) => buildNestedPropertyNode(nestedProperty, parentId));
}

function buildNestedPropertyNode(property: PropertySyntaxNode, parentId: SemanticNodeId): SemanticBuild {
  const fieldName = property.path.at(-1) ?? "<unknown>";
  const children = collectImmediateSemanticChildren(property).map((child) => buildArrayItemNode(child, createSemanticNodeId(property.path, classifyPropertyKind(property), property.range.start.offset)));
  const base = createBase(property, parentId, children.map((child) => child.node.id));
  const node = createUnknownFieldNode(base, fieldName);

  return {
    node,
    children,
  };
}

function buildPermissionNode(node: SyntaxNode, parentId: SemanticNodeId): SemanticBuild {
  const base = createBase(node, parentId, []);

  return {
    node: {
      ...base,
      kind: "permission",
      value: node.kind === "string" ? node.value : sourceLabelForNode(node),
    },
    children: [],
  };
}

function buildHostPermissionNode(node: SyntaxNode, parentId: SemanticNodeId): SemanticBuild {
  const base = createBase(node, parentId, []);

  return {
    node: {
      ...base,
      kind: "hostPermission",
      value: node.kind === "string" ? node.value : sourceLabelForNode(node),
    },
    children: [],
  };
}

function buildContentScriptNode(node: SyntaxNode, parentId: SemanticNodeId, index: number): SemanticBuild {
  const children = collectObjectProperties(node).map((property) => buildContentScriptFieldNode(property, createSemanticNodeId(node.path, "contentScript", node.range.start.offset)));
  const base = createBase(node, parentId, children.map((child) => child.node.id));

  return {
    node: {
      ...base,
      kind: "contentScript",
      index,
    },
    children,
  };
}

function buildContentScriptFieldNode(property: PropertySyntaxNode, parentId: SemanticNodeId): SemanticBuild {
  const fieldName = property.path.at(-1) ?? "<unknown>";
  const children = collectImmediateSemanticChildren(property).map((child) => buildContentScriptValueNode(child, createSemanticNodeId(property.path, "contentScriptField", property.range.start.offset), fieldName));
  const base = createBase(property, parentId, children.map((child) => child.node.id));

  return {
    node: {
      ...base,
      kind: "contentScriptField",
      fieldName,
    },
    children,
  };
}

function buildContentScriptValueNode(node: SyntaxNode, parentId: SemanticNodeId, fieldName: string): SemanticBuild {
  const base = createBase(node, parentId, []);
  const value = node.kind === "string" ? node.value : sourceLabelForNode(node);

  if (fieldName === "matches") {
    return {
      node: {
        ...base,
        kind: "contentScriptMatch",
        value,
      },
      children: [],
    };
  }

  if (fieldName === "js" || fieldName === "css") {
    return {
      node: {
        ...base,
        kind: "contentScriptFile",
        fileKind: fieldName,
        value,
      },
      children: [],
    };
  }

  return buildArrayItemNode(node, parentId);
}

function buildArrayItemNode(node: SyntaxNode, parentId: SemanticNodeId): SemanticBuild {
  const base = createBase(node, parentId, []);
  const primitiveValue = getPrimitiveValue(node);

  const arrayItem = primitiveValue === undefined
    ? {
        ...base,
        kind: "arrayItem" as const,
      }
    : {
        ...base,
        kind: "arrayItem" as const,
        value: primitiveValue,
      };

  return {
    node: arrayItem,
    children: [],
  };
}

function createKnownFieldNode(base: SemanticDraftBase, fieldName: ManifestFieldName): SemanticNode {
  return {
    ...base,
    kind: "field",
    fieldName,
  };
}

function createUnknownFieldNode(base: SemanticDraftBase, fieldName: string): SemanticNode {
  return {
    ...base,
    kind: "unknownField",
    fieldName,
  };
}

function createBase(
  syntaxNode: SyntaxNode,
  parentId: SemanticNodeId | undefined,
  childIds: readonly SemanticNodeId[],
): SemanticDraftBase {
  const kind = classifyPropertyKind(syntaxNode);
  const base = {
    id: createSemanticNodeId(syntaxNode.path, kind, syntaxNode.range.start.offset),
    syntaxNodeId: syntaxNode.id,
    childIds,
    path: syntaxNode.path,
    normalizedPath: normalizePath(syntaxNode.path),
    breadcrumb: createBreadcrumb(syntaxNode),
    sourceRange: syntaxNode.range,
  };
  const withParent = parentId ? { ...base, parentId } : base;

  if (syntaxNode.kind === "property") {
    return syntaxNode.valueRange
      ? {
          ...withParent,
          keyRange: syntaxNode.keyRange,
          valueRange: syntaxNode.valueRange,
        }
      : {
          ...withParent,
          keyRange: syntaxNode.keyRange,
        };
  }

  return withParent;
}

function detectManifestVersion(topLevelProperties: readonly PropertySyntaxNode[]): DetectedManifestVersion {
  const manifestVersionProperty = topLevelProperties.find((property) => pathEquals(property.path, ["manifest_version"]));
  const valueNode = manifestVersionProperty?.children[0];

  if (!valueNode) {
    return { kind: "missing" };
  }

  if (valueNode.kind === "number" && valueNode.value === 2) {
    return { kind: "mv2", version: 2 };
  }

  if (valueNode.kind === "number" && valueNode.value === 3) {
    return { kind: "mv3", version: 3 };
  }

  const value = getPrimitiveValue(valueNode);

  return value === undefined ? { kind: "invalid" } : { kind: "invalid", value };
}

function findJsonRoot(root: SyntaxNode): SyntaxNode | undefined {
  if (root.kind === "document") {
    return root.children[0];
  }

  return root;
}

function collectTopLevelProperties(root: SyntaxNode): readonly PropertySyntaxNode[] {
  return isObjectSyntaxNode(root) ? root.children.filter(isPropertySyntaxNode) : [];
}

function collectObjectProperties(node: SyntaxNode): readonly PropertySyntaxNode[] {
  return isObjectSyntaxNode(node) ? node.children.filter(isPropertySyntaxNode) : [];
}

function collectNestedPropertyNodes(node: SyntaxNode): readonly PropertySyntaxNode[] {
  if (isPropertySyntaxNode(node)) {
    return [node, ...node.children.flatMap((child) => collectNestedPropertyNodes(child))];
  }

  if ("children" in node) {
    return node.children.flatMap((child) => collectNestedPropertyNodes(child));
  }

  return [];
}

function collectImmediateSemanticChildren(property: PropertySyntaxNode): readonly SyntaxNode[] {
  const valueNode = property.kind === "property" ? property.children[0] : undefined;

  if (!valueNode) {
    return [];
  }

  if (valueNode.kind === "array") {
    return valueNode.children;
  }

  return [];
}

function flattenSemanticBuild(build: SemanticBuild): readonly SemanticNode[] {
  return [build.node, ...build.children.flatMap((child) => flattenSemanticBuild(child))];
}

function isPropertySyntaxNode(node: SyntaxNode): node is PropertySyntaxNode {
  return node.kind === "property";
}

function isObjectSyntaxNode(node: SyntaxNode): node is ObjectSyntaxNode {
  return node.kind === "object";
}

function isPermissionsProperty(property: SyntaxNode): boolean {
  return pathEquals(property.path, ["permissions"]) || pathEquals(property.path, ["optional_permissions"]);
}

function isHostPermissionsProperty(property: SyntaxNode): boolean {
  return pathEquals(property.path, ["host_permissions"]) || pathEquals(property.path, ["optional_host_permissions"]);
}

function isContentScriptsProperty(property: SyntaxNode): boolean {
  return pathEquals(property.path, ["content_scripts"]);
}

function classifyPropertyKind(node: SyntaxNode): SemanticNode["kind"] {
  if ((node.path[0] === "permissions" || node.path[0] === "optional_permissions") && node.path.length === 2) {
    return "permission";
  }

  if ((node.path[0] === "host_permissions" || node.path[0] === "optional_host_permissions") && node.path.length === 2) {
    return "hostPermission";
  }

  if (node.path[0] === "content_scripts" && node.path.length === 2) {
    return "contentScript";
  }

  if (node.path[0] === "content_scripts" && node.path.includes("matches") && node.path.length > 3) {
    return "contentScriptMatch";
  }

  if (node.path[0] === "content_scripts" && (node.path.includes("js") || node.path.includes("css")) && node.path.length > 3) {
    return "contentScriptFile";
  }

  if (node.path[0] === "content_scripts" && node.path.length > 2) {
    return "contentScriptField";
  }

  if (node.kind === "property" && node.path.length === 1 && knownTopLevelFields.has(node.path[0] ?? "")) {
    return "field";
  }

  if (node.kind === "property") {
    return "unknownField";
  }

  return "arrayItem";
}

function createSemanticNodeId(
  path: readonly string[],
  kind: SemanticNode["kind"],
  offset: number,
): SemanticNodeId {
  const pathKey = path.length === 0 ? "/" : path.join("/");
  return `semantic:${pathKey}:${kind}:${offset}` as SemanticNodeId;
}

function normalizePath(path: readonly string[]): string {
  if (path.length === 0) {
    return "manifest";
  }

  return path
    .map((segment) => (isArrayIndex(segment) ? "[]" : segment))
    .reduce((pathText, segment) => {
      if (segment === "[]") {
        return `${pathText}[]`;
      }

      return pathText.length === 0 ? segment : `${pathText}.${segment}`;
    }, "");
}

function createBreadcrumb(node: SyntaxNode): readonly BreadcrumbSegment[] {
  if (node.path.length === 0) {
    return [{ label: "manifest", path: [] }];
  }

  return node.path.map((_, index) => {
    const path = node.path.slice(0, index + 1);
    const segment = node.path[index] ?? "";
    const isLast = index === node.path.length - 1;
    const label = isLast && isPrimitiveNode(node) ? sourceLabelForNode(node) : segment;

    return {
      label,
      path,
    };
  });
}

function pathEquals(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((segment, index) => segment === right[index]);
}

function isArrayIndex(segment: string): boolean {
  return /^\d+$/.test(segment);
}

function isPrimitiveNode(node: SyntaxNode): boolean {
  return node.kind === "string" || node.kind === "number" || node.kind === "boolean" || node.kind === "null";
}

function getPrimitiveValue(node: SyntaxNode): JsonPrimitive | undefined {
  switch (node.kind) {
    case "string":
    case "number":
    case "boolean":
    case "null":
      return node.value;
    case "document":
    case "object":
    case "array":
    case "property":
    case "unknown":
      return undefined;
  }
}

function sourceLabelForNode(node: SyntaxNode): string {
  const primitiveValue = getPrimitiveValue(node);

  if (primitiveValue === null) {
    return "null";
  }

  if (primitiveValue !== undefined) {
    return String(primitiveValue);
  }

  return node.path.at(-1) ?? "manifest";
}
