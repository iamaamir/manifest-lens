import {
  type DocumentId,
  type ParseError,
  type ParseSnapshot,
  type SourceDocument,
  type SourceParser,
  type SourcePosition,
  type SourceRange,
  type SyntaxNode,
  type SyntaxNodeId,
} from "@manifest-lens/contracts";
import {
  parseTree,
  printParseErrorCode,
  type Node as JsonNode,
  type ParseError as JsonParseError,
} from "jsonc-parser";

export interface SourceRangeIndex {
  findSmallestContaining(offset: number): SyntaxNode | undefined;
}

interface LineIndex {
  readonly textLength: number;
  readonly lineStarts: readonly number[];
}

export function createSourceDocument(text: string): SourceDocument {
  return {
    id: createDocumentId(text),
    language: "json",
    text,
  };
}

export function createDocumentId(text: string): DocumentId {
  return `document:${text.length}:${hashText(text)}` as DocumentId;
}

export function parseJsonDocument(document: SourceDocument): ParseSnapshot {
  const parseErrors: JsonParseError[] = [];
  const jsonRoot = parseTree(document.text, parseErrors, {
    allowEmptyContent: false,
    allowTrailingComma: false,
    disallowComments: true,
  });
  const lineIndex = createLineIndex(document.text);
  const documentRange = rangeFromOffsetLength(lineIndex, 0, document.text.length);
  const rootChildren = jsonRoot ? [convertJsonNode(jsonRoot, [], lineIndex)] : [createUnknownRoot(documentRange)];
  const root: SyntaxNode = {
    id: createSyntaxNodeId([], "document", 0),
    kind: "document",
    range: documentRange,
    path: [],
    children: rootChildren,
  };
  const errors = parseErrors.map((error) => mapParseError(error, lineIndex));

  return {
    document,
    root,
    errors,
  };
}

export class JsonSourceParser implements SourceParser {
  parse(document: SourceDocument): ParseSnapshot {
    return parseJsonDocument(document);
  }
}

export function createSourceRangeIndex(snapshot: ParseSnapshot): SourceRangeIndex {
  const nodes = flattenSyntaxTree(snapshot.root);

  return {
    findSmallestContaining(offset: number): SyntaxNode | undefined {
      const containingNodes = nodes.filter((node) => containsOffset(node.range, offset));
      const sortedNodes = [...containingNodes].sort(
        (left: SyntaxNode, right: SyntaxNode) => rangeLength(left.range) - rangeLength(right.range),
      );
      return sortedNodes[0];
    },
  };
}

export function flattenSyntaxTree(root: SyntaxNode): readonly SyntaxNode[] {
  const children = "children" in root ? root.children.flatMap((child) => flattenSyntaxTree(child)) : [];
  return [root, ...children];
}

function convertJsonNode(node: JsonNode, path: readonly string[], lineIndex: LineIndex): SyntaxNode {
  switch (node.type) {
    case "object":
      return convertObjectNode(node, path, lineIndex);
    case "array":
      return convertArrayNode(node, path, lineIndex);
    case "property":
      return convertPropertyNode(node, path, lineIndex);
    case "string":
      return {
        id: createSyntaxNodeId(path, "string", node.offset),
        kind: "string",
        range: rangeFromOffsetLength(lineIndex, node.offset, node.length),
        path,
        value: String(node.value),
      };
    case "number":
      return {
        id: createSyntaxNodeId(path, "number", node.offset),
        kind: "number",
        range: rangeFromOffsetLength(lineIndex, node.offset, node.length),
        path,
        value: Number(node.value),
      };
    case "boolean":
      return {
        id: createSyntaxNodeId(path, "boolean", node.offset),
        kind: "boolean",
        range: rangeFromOffsetLength(lineIndex, node.offset, node.length),
        path,
        value: Boolean(node.value),
      };
    case "null":
      return {
        id: createSyntaxNodeId(path, "null", node.offset),
        kind: "null",
        range: rangeFromOffsetLength(lineIndex, node.offset, node.length),
        path,
        value: null,
      };
  }
}

function convertObjectNode(node: JsonNode, path: readonly string[], lineIndex: LineIndex): SyntaxNode {
  const children = (node.children ?? []).map((child) => convertJsonNode(child, path, lineIndex));

  return {
    id: createSyntaxNodeId(path, "object", node.offset),
    kind: "object",
    range: rangeFromOffsetLength(lineIndex, node.offset, node.length),
    path,
    children,
  };
}

function convertArrayNode(node: JsonNode, path: readonly string[], lineIndex: LineIndex): SyntaxNode {
  const children = (node.children ?? []).map((child, index) => convertJsonNode(child, [...path, String(index)], lineIndex));

  return {
    id: createSyntaxNodeId(path, "array", node.offset),
    kind: "array",
    range: rangeFromOffsetLength(lineIndex, node.offset, node.length),
    path,
    children,
  };
}

function convertPropertyNode(node: JsonNode, path: readonly string[], lineIndex: LineIndex): SyntaxNode {
  const keyNode = node.children?.[0];
  const valueNode = node.children?.[1];
  const propertyName = typeof keyNode?.value === "string" ? keyNode.value : "<unknown>";
  const propertyPath = [...path, propertyName];
  const children = valueNode ? [convertJsonNode(valueNode, propertyPath, lineIndex)] : [];
  const base = {
    id: createSyntaxNodeId(propertyPath, "property", node.offset),
    kind: "property" as const,
    range: rangeFromOffsetLength(lineIndex, node.offset, node.length),
    path: propertyPath,
    keyRange: keyNode
      ? rangeFromOffsetLength(lineIndex, keyNode.offset, keyNode.length)
      : rangeFromOffsetLength(lineIndex, node.offset, 0),
    children,
  };

  return valueNode
    ? {
        ...base,
        valueRange: rangeFromOffsetLength(lineIndex, valueNode.offset, valueNode.length),
      }
    : base;
}

function createUnknownRoot(range: SourceRange): SyntaxNode {
  return {
    id: createSyntaxNodeId([], "unknown", range.start.offset),
    kind: "unknown",
    range,
    path: [],
    children: [],
  };
}

function mapParseError(error: JsonParseError, lineIndex: LineIndex): ParseError {
  return {
    message: printParseErrorCode(error.error),
    range: rangeFromOffsetLength(lineIndex, error.offset, error.length),
  };
}

function createSyntaxNodeId(path: readonly string[], kind: SyntaxNode["kind"], offset: number): SyntaxNodeId {
  const pathKey = path.length === 0 ? "/" : path.join("/");
  return `syntax:${pathKey}:${kind}:${offset}` as SyntaxNodeId;
}

function createLineIndex(text: string): LineIndex {
  const lineStarts = [0];

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") {
      lineStarts.push(index + 1);
    }
  }

  return {
    textLength: text.length,
    lineStarts,
  };
}

function rangeFromOffsetLength(lineIndex: LineIndex, offset: number, length: number): SourceRange {
  const startOffset = clampOffset(lineIndex, offset);
  const endOffset = clampOffset(lineIndex, offset + length);

  return {
    start: positionAtOffset(lineIndex, startOffset),
    end: positionAtOffset(lineIndex, endOffset),
  };
}

function positionAtOffset(lineIndex: LineIndex, offset: number): SourcePosition {
  const clampedOffset = clampOffset(lineIndex, offset);
  const line = findLineForOffset(lineIndex.lineStarts, clampedOffset);
  const lineStart = lineIndex.lineStarts[line] ?? 0;

  return {
    line,
    column: clampedOffset - lineStart,
    offset: clampedOffset,
  };
}

function findLineForOffset(lineStarts: readonly number[], offset: number): number {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const lineStart = lineStarts[middle] ?? 0;
    const nextLineStart = lineStarts[middle + 1];

    if (offset < lineStart) {
      high = middle - 1;
    } else if (nextLineStart !== undefined && offset >= nextLineStart) {
      low = middle + 1;
    } else {
      return middle;
    }
  }

  return Math.max(0, lineStarts.length - 1);
}

function clampOffset(lineIndex: LineIndex, offset: number): number {
  return Math.min(Math.max(offset, 0), lineIndex.textLength);
}

function containsOffset(range: SourceRange, offset: number): boolean {
  return range.start.offset <= offset && offset < range.end.offset;
}

function rangeLength(range: SourceRange): number {
  return range.end.offset - range.start.offset;
}

function hashText(text: string): string {
  let hash = 5381;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33) ^ text.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}
