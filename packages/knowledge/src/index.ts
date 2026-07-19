import type {
  DocumentationLink,
  Explanation,
  ExplanationId,
  ExplanationSource,
  FallbackExplanationReason,
  ManifestExample,
  SemanticManifestSnapshot,
  SemanticNode,
  SemanticNodeId,
} from "@mvviewer/contracts";

const REGISTRY_PACK_ID = "mvviewer-knowledge";

interface KnowledgeEntry {
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

  if (node.kind === "contentScriptField") {
    const fieldEntry = registry.pathEntries[`content_scripts[].${node.fieldName}`];

    if (fieldEntry) {
      return entryToExplanation(fieldEntry, { kind: "knowledge", packId: REGISTRY_PACK_ID });
    }
  }

  const fallbackReason = fallbackReasonForNode(node);

  return createFallbackExplanation(node, fallbackReason);
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
    details: [],
    relatedFields: [],
    examples: [],
    docsLinks: [],
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
      return "This field is not one of the standard manifest fields mvviewer currently explains. You can still see its structure and values in the source view.";
    case "unknown-permission":
      return "This permission is not one of the commonly explained permissions. The extension declares it for access to browser capabilities, but mvviewer does not yet have a specific explanation.";
    case "unknown-host-permission":
      return "This host permission pattern controls which websites the extension can access, but mvviewer does not yet have a specific explanation for this value.";
    case "unknown-node-kind":
      return "This part of the manifest is not yet covered by mvviewer's explanation knowledge. You can still interact with it in the source view.";
  }
}

function buildPathEntries(): Readonly<Record<string, KnowledgeEntry>> {
  return {
    "manifest": mke("explanation:path:manifest", "Manifest", "The root of the browser extension manifest. It declares the extension's identity, capabilities, permissions, and behavior.", {
      details: [
        "The manifest.json file is the only required file for a browser extension. It tells the browser about the extension: its name, version, permissions, and which scripts to run.",
        "Every field in the manifest serves a specific purpose. Hover or select a field to learn what it does.",
      ],
      relatedFields: ["manifest_version", "name", "version"],
    }),

    "manifest_version": mke("explanation:path:manifest_version", "Manifest Version", "Declares the version of the extension manifest format used by this extension.", {
      details: [
        "Manifest V3 is the current extension platform supported by modern browsers. Manifest V2 is being phased out.",
        "The manifest version determines which APIs and extension capabilities are available.",
      ],
      relatedFields: ["name", "version"],
      docsLinks: [
        { label: "Chrome: Manifest version", url: "https://developer.chrome.com/docs/extensions/mv3/manifest/" },
        { label: "MDN: manifest_version", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/manifest_version" },
      ],
    }),

    "name": mke("explanation:path:name", "Extension Name", "The display name for the extension, shown in the browser's extension management interface and store listing.", {
      details: [
        "The name is displayed in the toolbar, extension management page, and any store listing. It should clearly identify the extension.",
        "The name is a required field and must be a string.",
      ],
      relatedFields: ["version", "description"],
      docsLinks: [
        { label: "MDN: name", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/name" },
      ],
    }),

    "version": mke("explanation:path:version", "Extension Version", "The version string of the extension, used for update checks and to identify releases.", {
      details: [
        "The version format typically follows number-dot notation (e.g., 1.0.0). Browsers use this to determine when an update is available.",
        "When you publish an update, the version must be higher than the previous version.",
      ],
      relatedFields: ["name"],
      docsLinks: [
        { label: "MDN: version", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/version" },
      ],
    }),

    "description": mke("explanation:path:description", "Description", "A plain-text description of the extension, shown in the browser's extension management interface and store listing.", {
      details: [
        "The description helps users understand what the extension does. It is displayed in the extension management page and any store listing.",
      ],
      relatedFields: ["name"],
      docsLinks: [
        { label: "MDN: description", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/description" },
      ],
    }),

    "icons": mke("explanation:path:icons", "Icons", "Icons representing the extension, used in the toolbar, management page, and store listing.", {
      details: [
        "Each entry maps a pixel size (like 128 or 48) to an icon file path relative to the extension root.",
        "A 128x128 icon is commonly displayed in the Chrome Web Store listing.",
      ],
      relatedFields: ["name"],
      docsLinks: [
        { label: "MDN: icons", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/icons" },
      ],
    }),

    "permissions": mke("explanation:path:permissions", "Permissions", "Declares what browser API capabilities and data access the extension requires.", {
      details: [
        "Permissions must be declared at install time. Users are informed of the requested permissions during installation.",
        "Some permissions require user consent; others are granted automatically. Each permission enables specific browser APIs.",
        "Permissions listed here apply globally to the extension. Host permissions are declared separately.",
      ],
      relatedFields: ["host_permissions", "activeTab"],
      docsLinks: [
        { label: "MDN: permissions", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions" },
        { label: "Chrome: permissions", url: "https://developer.chrome.com/docs/extensions/mv3/declare_permissions/" },
      ],
    }),

    "host_permissions": mke("explanation:path:host_permissions", "Host Permissions", "Declares which URL patterns the extension may access.", {
      details: [
        "Host permissions use URL match patterns to specify which websites the extension can interact with.",
        "The extension can read and modify data on pages matching these patterns. The pattern controls which URLs the extension can interact with.",
      ],
      relatedFields: ["permissions", "content_scripts"],
      docsLinks: [
        { label: "MDN: host_permissions", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/host_permissions" },
        { label: "Chrome: host permissions", url: "https://developer.chrome.com/docs/extensions/mv3/host_permissions/" },
      ],
    }),

    "host_permissions[]": mke("explanation:path:host_permissions_item", "Host Permission", "Grants the extension access to a specific URL pattern.", {
      details: [
        "Host permissions use match patterns like https://example.com/* or <all_urls> to specify which websites the extension can interact with.",
        "Match patterns can include wildcards for subdomains and paths to describe a set of URLs.",
      ],
      relatedFields: ["host_permissions", "permissions"],
      docsLinks: [
        { label: "Chrome: match patterns", url: "https://developer.chrome.com/docs/extensions/mv3/match_patterns/" },
        { label: "MDN: match patterns", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns" },
      ],
    }),

    "content_scripts": mke("explanation:path:content_scripts", "Content Scripts", "Declares scripts and styles that the extension injects into web pages.", {
      details: [
        "Content scripts run in the context of web pages and can read and modify page content.",
        "They have limited access to extension APIs. Communication with the background script is done through messaging.",
        "Each content script entry specifies which pages to inject into, which files to inject, and when to inject them.",
      ],
      relatedFields: ["permissions", "host_permissions"],
      docsLinks: [
        { label: "MDN: content_scripts", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts" },
        { label: "Chrome: content scripts", url: "https://developer.chrome.com/docs/extensions/mv3/content_scripts/" },
      ],
    }),

    "content_scripts[]": mke("explanation:path:content_scripts_entry", "Content Script Entry", "A single content script configuration specifying which files to inject and on which pages.", {
      details: [
        "Each entry can specify its own set of URL matches, JavaScript files, CSS files, and injection settings.",
        "You can declare multiple content script entries to inject different scripts on different pages.",
      ],
      relatedFields: ["content_scripts[].matches", "content_scripts[].js", "content_scripts[].run_at"],
    }),

    "content_scripts[].matches": mke("explanation:path:content_scripts_matches", "Matches (URL Patterns)", "Specifies the URL patterns that determine which pages this content script is injected into.", {
      details: [
        "Match patterns define the URLs where the content script will run. Only pages matching these patterns will have the script injected.",
        "Common patterns include specific pages (https://example.com/*), entire domains (https://*.example.org/*), or all HTTP/HTTPS URLs (<all_urls>).",
      ],
      relatedFields: ["host_permissions", "content_scripts[]"],
      docsLinks: [
        { label: "Chrome: match patterns", url: "https://developer.chrome.com/docs/extensions/mv3/match_patterns/" },
      ],
    }),

    "content_scripts[].matches[]": mke("explanation:path:content_scripts_match", "Match Pattern", "A URL pattern that controls which pages receive this content script.", {
      details: [
        "This pattern specifies a URL or URL pattern where the content script will be injected. The extension can access and modify content on matching pages.",
      ],
      relatedFields: ["content_scripts[].matches"],
    }),

    "content_scripts[].js": mke("explanation:path:content_scripts_js", "JavaScript Files", "Lists JavaScript files to inject into matching pages.", {
      details: [
        "These files run as content scripts in the context of matched web pages. Multiple files can be specified and are injected in order.",
        "Content scripts can read and modify the DOM but have limited access to extension APIs.",
      ],
      relatedFields: ["content_scripts[].css", "content_scripts[]"],
    }),

    "content_scripts[].js[]": mke("explanation:path:content_scripts_js_file", "JavaScript File", "A JavaScript file that is injected as a content script into matching pages.", {
      details: [
        "The file path is relative to the extension root. This script runs in the context of the web page.",
      ],
      relatedFields: ["content_scripts[].js"],
    }),

    "content_scripts[].css": mke("explanation:path:content_scripts_css", "CSS Files", "Lists CSS stylesheets to inject into matching pages.", {
      details: [
        "These stylesheets are automatically applied to matched pages before the page loads. They can be used to restyle or modify the appearance of web pages.",
      ],
      relatedFields: ["content_scripts[].js", "content_scripts[]"],
    }),

    "content_scripts[].css[]": mke("explanation:path:content_scripts_css_file", "CSS File", "A CSS stylesheet that is injected into matching pages.", {
      details: [
        "The file path is relative to the extension root. This stylesheet is applied to the web page automatically.",
      ],
      relatedFields: ["content_scripts[].css"],
    }),

    "content_scripts[].run_at": mke("explanation:path:content_scripts_run_at", "Run At", "Controls when the content script is injected relative to page loading.", {
      details: [
        "document_start: scripts run after any CSS but before the DOM is constructed.",
        "document_end: scripts run after the DOM is complete but before subresources load.",
        "document_idle (default): scripts run after the page is ready, balancing performance and timing.",
      ],
      relatedFields: ["content_scripts[]", "content_scripts[].all_frames"],
      docsLinks: [
        { label: "MDN: run_at", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts#run_at" },
      ],
    }),

    "content_scripts[].all_frames": mke("explanation:path:content_scripts_all_frames", "All Frames", "Controls whether the content script is injected into all frames or only the top frame.", {
      details: [
        "When true, the content script runs in every frame (including iframes) whose URL matches the specified patterns.",
        "When false (default), the content script runs only in the top-level frame.",
      ],
      relatedFields: ["content_scripts[].matches", "content_scripts[]"],
    }),

    "background": mke("explanation:path:background", "Background", "Declares the extension's background script or service worker that handles events and maintains state.", {
      details: [
        "In Manifest V3, background pages are replaced by service workers. The background context runs in the background and handles extension events.",
        "Background scripts can use the full extension API and can persist state. They communicate with content scripts through messaging.",
      ],
      relatedFields: ["permissions"],
      docsLinks: [
        { label: "MDN: background", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background" },
        { label: "Chrome: service workers", url: "https://developer.chrome.com/docs/extensions/mv3/service_workers/" },
      ],
    }),

    "background.service_worker": mke("explanation:path:background_service_worker", "Service Worker", "The JavaScript file that runs as the extension's service worker in Manifest V3.", {
      details: [
        "The service worker handles extension events such as browser action clicks, network requests, and lifecycle events.",
        "Service workers are not persistent — they may be terminated when not in use. Use storage APIs to persist state.",
        "This field replaces background.scripts from Manifest V2.",
      ],
      relatedFields: ["background"],
    }),

    "background.scripts": mke("explanation:path:background_scripts", "Background Scripts", "JavaScript files that run as a persistent background page in Manifest V2.", {
      details: [
        "Background scripts run in a persistent background page that stays active as long as the browser is running.",
        "This approach is only available in Manifest V2. Manifest V3 uses service workers instead.",
      ],
      relatedFields: ["background"],
    }),

    "action": mke("explanation:path:action", "Action (Toolbar Button)", "Configures the extension's toolbar button behavior in Manifest V3.", {
      details: [
        "The action API controls the toolbar icon, tooltip text, badge, and popup. This replaces browser_action from Manifest V2.",
        "Users can click the toolbar button to trigger extension functionality or open a popup.",
      ],
      relatedFields: ["browser_action", "page_action"],
      docsLinks: [
        { label: "Chrome: action", url: "https://developer.chrome.com/docs/extensions/mv3/action/" },
        { label: "MDN: action", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/action" },
      ],
    }),

    "browser_action": mke("explanation:path:browser_action", "Browser Action (Toolbar Button)", "Configures the extension's toolbar button behavior in Manifest V2.", {
      details: [
        "In Manifest V2, browser_action adds a button to the browser toolbar. Clicking it triggers extension behavior or opens a popup.",
        "In Manifest V3, use action instead of browser_action.",
      ],
      relatedFields: ["action", "page_action"],
    }),

    "page_action": mke("explanation:path:page_action", "Page Action (Contextual Button)", "Configures a context-dependent toolbar button available only on certain pages in Manifest V2.", {
      details: [
        "Page actions are toolbar buttons that are only active on specific pages, as determined by the extension.",
        "They are useful when extension functionality is only relevant on certain websites.",
      ],
      relatedFields: ["action", "browser_action"],
    }),

    "options_ui": mke("explanation:path:options_ui", "Options Page", "Declares the extension's settings page where users can configure extension preferences.", {
      details: [
        "The options page is a regular HTML page bundled with the extension. Users access it through the browser's extension management interface.",
        "Options pages can use extension APIs and typically use chrome.storage to persist settings.",
      ],
      relatedFields: ["options_ui.page", "options_ui.open_in_tab"],
      docsLinks: [
        { label: "MDN: options_ui", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/options_ui" },
      ],
    }),

    "options_ui.page": mke("explanation:path:options_ui_page", "Options Page (File)", "The HTML file that implements the extension's settings page.", {
      details: [
        "The file path is relative to the extension root. This HTML page is displayed when the user opens the extension's options.",
      ],
      relatedFields: ["options_ui"],
    }),

    "options_ui.open_in_tab": mke("explanation:path:options_ui_open_in_tab", "Open in Tab", "Controls whether the options page opens in a new tab or in a dialog.", {
      details: [
        "When true, the options page opens as a full browser tab instead of a smaller dialog overlay.",
        "Use a tab for complex settings pages that benefit from more space.",
      ],
      relatedFields: ["options_ui"],
    }),

    "commands": mke("explanation:path:commands", "Commands", "Declares keyboard shortcuts that trigger extension actions.", {
      details: [
        "Commands allow users to trigger extension functionality using keyboard shortcuts.",
        "Each command has a name and an optional suggested key combination. Users can customize shortcuts in the browser's extension settings.",
        "The special command _execute_action triggers the extension's toolbar button action.",
      ],
      relatedFields: ["action"],
      docsLinks: [
        { label: "Chrome: commands", url: "https://developer.chrome.com/docs/extensions/mv3/commands/" },
        { label: "MDN: commands", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/commands" },
      ],
    }),

    "web_accessible_resources": mke("explanation:path:web_accessible_resources", "Web Accessible Resources", "Lists extension resources that web pages or other extensions can access.", {
      details: [
        "By default, extension resources are not accessible to web pages. This field allows specific resources to be accessed by specific URL patterns.",
        "Each entry specifies which resources are exposed and which websites can access them.",
        "This is important for extensions that need to share assets like images or JSON data with web pages.",
      ],
      relatedFields: ["content_scripts"],
      docsLinks: [
        { label: "MDN: web_accessible_resources", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/web_accessible_resources" },
        { label: "Chrome: web accessible resources", url: "https://developer.chrome.com/docs/extensions/mv3/manifest/web_accessible_resources/" },
      ],
    }),

    "web_accessible_resources[]": mke("explanation:path:web_accessible_resources_entry", "Web Accessible Resource Entry", "A single entry specifying which resources are exposed and to which websites.", {
      details: [
        "Each entry defines a set of resources (file paths) and the URL patterns allowed to access them.",
        "This allows fine-grained control over which websites can load which extension resources.",
      ],
      relatedFields: ["web_accessible_resources"],
    }),

    "web_accessible_resources[].resources": mke("explanation:path:web_accessible_resources_resources", "Resources", "Lists the extension file paths that are exposed to web pages.", {
      details: [
        "These file paths are relative to the extension root. Only files listed here can be loaded by external pages.",
      ],
      relatedFields: ["web_accessible_resources[]"],
    }),

    "web_accessible_resources[].matches": mke("explanation:path:web_accessible_resources_matches", "URL Patterns", "Specifies which websites can access the listed resources.", {
      details: [
        "Only pages whose URL matches these patterns can load the declared resources.",
      ],
      relatedFields: ["web_accessible_resources[].resources"],
    }),

    "content_security_policy": mke("explanation:path:content_security_policy", "Content Security Policy", "Declares the extension's content security policy, restricting which resources can be loaded.", {
      details: [
        "CSP restricts which scripts, styles, and other resources the extension can load from specified sources.",
        "In Manifest V3, CSP is configured per document type (extension_pages, sandbox).",
        "A stricter CSP restricts more resource types but may limit some extension capabilities.",
      ],
      relatedFields: ["permissions"],
      docsLinks: [
        { label: "Chrome: CSP", url: "https://developer.chrome.com/docs/extensions/mv3/manifest/content_security_policy/" },
        { label: "MDN: CSP", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_security_policy" },
      ],
    }),

    "declarative_net_request": mke("explanation:path:declarative_net_request", "Declarative Net Request", "Declares declarative network request rules for blocking, modifying, or redirecting network requests.", {
      details: [
        "DNR rules are declared in JSON rule files and processed by the browser without requiring a background page.",
        "This provides an alternative to the webRequest API for common network modification tasks, processed at the browser level.",
        "Rules can block, redirect, upgrade, or modify headers of network requests.",
      ],
      relatedFields: ["permissions", "host_permissions"],
      docsLinks: [
        { label: "Chrome: DNR", url: "https://developer.chrome.com/docs/extensions/mv3/declarative_net_request/" },
      ],
    }),

    "declarative_net_request.rule_resources": mke("explanation:path:dnr_rule_resources", "Rule Resources", "Lists JSON files containing declarative network request rules.", {
      details: [
        "Each rule resource file contains an array of rule objects. Rules are evaluated by the browser at the network level.",
        "Multiple rule files can be specified and are combined into a single rule set.",
      ],
      relatedFields: ["declarative_net_request"],
    }),
  };
}

function buildPermissionEntries(): Readonly<Record<string, KnowledgeEntry>> {
  return {
    "tabs": mke("explanation:permission:tabs", "tabs Permission", "Allows the extension to access tab properties and observe tab updates.", {
      details: [
        "The tabs permission grants access to tab URLs, titles, and other tab metadata across all tabs.",
        "It also enables the extension to execute certain tab operations like creating, updating, and reordering tabs.",
      ],
      relatedFields: ["activeTab"],
      docsLinks: [
        { label: "Chrome: tabs permission", url: "https://developer.chrome.com/docs/extensions/mv3/tabs/" },
        { label: "MDN: tabs permission", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs" },
      ],
    }),

    "activeTab": mke("explanation:permission:activeTab", "activeTab Permission", "Grants temporary access to the currently active tab in response to a user gesture.", {
      details: [
        "activeTab provides temporary access to the current tab only when the user invokes the extension (for example, by clicking the toolbar button).",
        "Access lasts only while that tab remains the active tab. This provides temporary tab access without broad host permissions.",
        "The extension can read the page content, access tab details, and inject scripts — but only for the current tab and only after a user action.",
      ],
      relatedFields: ["permissions", "tabs", "scripting"],
      docsLinks: [
        { label: "Chrome: activeTab", url: "https://developer.chrome.com/docs/extensions/mv3/manifest/activeTab/" },
        { label: "MDN: activeTab", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions#activetab" },
      ],
    }),

    "storage": mke("explanation:permission:storage", "storage Permission", "Allows the extension to store and retrieve data using the storage API.", {
      details: [
        "The storage API provides persistent key-value storage for extension data. It supports multiple storage areas: local (local machine), sync (synced across browsers), and managed (admin-configured).",
        "Storage is the standard way to persist extension state, preferences, and cached data.",
      ],
      relatedFields: ["permissions"],
      docsLinks: [
        { label: "Chrome: storage", url: "https://developer.chrome.com/docs/extensions/mv3/storage/" },
        { label: "MDN: storage", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage" },
      ],
    }),

    "scripting": mke("explanation:permission:scripting", "scripting Permission", "Allows the extension to programmatically inject scripts and CSS into web pages.", {
      details: [
        "The scripting API provides methods to execute scripts, insert CSS, and register dynamic content scripts at runtime.",
        "This is the Manifest V3 replacement for tabs.executeScript and related methods.",
        "The scripting permission is required in addition to host permissions or activeTab for script injection.",
      ],
      relatedFields: ["permissions", "activeTab", "content_scripts"],
      docsLinks: [
        { label: "Chrome: scripting", url: "https://developer.chrome.com/docs/extensions/mv3/scripting/" },
        { label: "MDN: scripting", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting" },
      ],
    }),
  };
}

interface KnowledgeEntryBuilder {
  details?: readonly string[];
  relatedFields?: readonly string[];
  examples?: readonly ManifestExample[];
  docsLinks?: readonly DocumentationLink[];
}

function mke(
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
