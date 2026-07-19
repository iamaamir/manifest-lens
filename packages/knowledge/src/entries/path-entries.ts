import type { KnowledgeEntry } from "../types.js";
import { mke } from "../entry-builder.js";

export function buildPathEntries(): Readonly<Record<string, KnowledgeEntry>> {
  const baseEntries: Record<string, KnowledgeEntry> = {
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
  } as Record<string, KnowledgeEntry>;

  return {
    ...baseEntries,
    ...buildAdditionalTopLevelEntries(),
    ...buildAdditionalNestedEntries(),
  };
}

const chromeManifestDocs = { label: "Chrome: Manifest file format", url: "https://developer.chrome.com/docs/extensions/reference/manifest" };
const mdnManifestDocs = { label: "MDN: manifest.json", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json" };

interface SimplePathEntry {
  readonly path: string;
  readonly title: string;
  readonly summary: string;
  readonly details: readonly string[];
  readonly relatedFields?: readonly string[];
  readonly docs?: "chrome" | "mdn" | "both";
}

function buildAdditionalTopLevelEntries(): Readonly<Record<string, KnowledgeEntry>> {
  return entriesToRecord([
    { path: "default_locale", title: "Default Locale", summary: "Declares the default locale used when the extension provides localized messages.", details: ["Localized extensions use default_locale with a _locales directory so browsers know which message bundle is the fallback."], relatedFields: ["name", "description"], docs: "both" },
    { path: "short_name", title: "Short Name", summary: "Provides a shorter display name for places where the full extension name does not fit.", details: ["Browsers may use short_name in compact UI surfaces instead of truncating the full name."], relatedFields: ["name"], docs: "both" },
    { path: "version_name", title: "Version Name", summary: "Provides a human-readable version label separate from the machine-comparable version string.", details: ["version_name can show labels such as beta or release-candidate text while version remains the browser's update-comparison value."], relatedFields: ["version"], docs: "both" },
    { path: "homepage_url", title: "Homepage URL", summary: "Points to a homepage or project page for the extension.", details: ["Browsers and stores can use this URL to direct users to more information about the extension."], docs: "both" },
    { path: "author", title: "Author", summary: "Identifies the author of the extension in WebExtensions manifests.", details: ["This is descriptive metadata for people reading or managing the extension."], docs: "mdn" },
    { path: "developer", title: "Developer", summary: "Provides developer metadata for extensions in browsers that support this key.", details: ["Developer metadata can identify the person or organization responsible for the extension."], docs: "mdn" },
    { path: "options_page", title: "Options Page", summary: "Declares a standalone HTML page where users can configure extension settings.", details: ["options_page is the older standalone options-page form. options_ui is the newer embedded options-page form in supporting browsers."], relatedFields: ["options_ui"], docs: "both" },
    { path: "optional_permissions", title: "Optional Permissions", summary: "Lists API permissions the extension may request at runtime instead of at install time.", details: ["Optional permissions let an extension ask for extra capabilities only when a feature needs them."], relatedFields: ["permissions"], docs: "both" },
    { path: "optional_host_permissions", title: "Optional Host Permissions", summary: "Lists host match patterns the extension may request at runtime.", details: ["Optional host permissions are useful when access to websites should be granted only after a user chooses a related feature."], relatedFields: ["host_permissions"], docs: "both" },
    { path: "devtools_page", title: "DevTools Page", summary: "Registers an extension page that integrates with browser developer tools.", details: ["A DevTools page can add panels or sidebars to the browser's developer tools for inspected pages."], docs: "both" },
    { path: "omnibox", title: "Omnibox", summary: "Registers a keyword that lets the extension respond to address-bar input.", details: ["After the user types the keyword, the extension can provide suggestions or handle address-bar commands."], docs: "both" },
    { path: "side_panel", title: "Side Panel", summary: "Declares the default side panel page for Chrome extensions that use the side panel surface.", details: ["The side panel gives an extension a persistent panel alongside web content in browsers that support it."], docs: "chrome" },
    { path: "incognito", title: "Incognito Behavior", summary: "Declares how the extension behaves in private or incognito windows.", details: ["Supported values describe whether extension state is shared, split, or unavailable in incognito contexts."], docs: "both" },
    { path: "browser_specific_settings", title: "Browser-Specific Settings", summary: "Contains browser-specific extension metadata such as Firefox Gecko settings.", details: ["This key lets a manifest include settings understood by one browser family without changing the general manifest shape."], docs: "mdn" },
    { path: "externally_connectable", title: "Externally Connectable", summary: "Declares which web pages or extensions may connect to this extension.", details: ["This controls external messaging access to the extension from selected origins or extension IDs."], docs: "both" },
    { path: "chrome_settings_overrides", title: "Chrome Settings Overrides", summary: "Declares Chrome settings that the extension overrides, such as selected search settings.", details: ["Settings overrides let an extension intentionally replace certain browser defaults where supported."], docs: "both" },
    { path: "chrome_url_overrides", title: "Chrome URL Overrides", summary: "Declares extension pages that replace selected built-in browser pages.", details: ["Common examples include replacing the new tab page with an extension-provided HTML page."], docs: "both" },
    { path: "oauth2", title: "OAuth 2", summary: "Declares OAuth client configuration used by identity APIs.", details: ["OAuth configuration identifies the client ID and requested scopes for browser-mediated sign-in flows."], relatedFields: ["permissions", "identity"], docs: "chrome" },
    { path: "sandbox", title: "Sandbox", summary: "Declares extension pages that run in a sandboxed context with restricted extension access.", details: ["Sandboxed pages are useful when a page needs looser web content behavior while staying isolated from privileged extension APIs."], docs: "chrome" },
    { path: "storage", title: "Managed Storage Schema", summary: "Declares a schema for managed extension storage in browsers that support this manifest key.", details: ["This top-level manifest key is different from the storage permission; it describes managed policy-backed storage shape."], relatedFields: ["permissions"], docs: "chrome" },
    { path: "minimum_chrome_version", title: "Minimum Chrome Version", summary: "Declares the oldest Chrome version that can install the extension.", details: ["This communicates that the extension depends on Chrome features introduced in a particular browser version."], docs: "chrome" },
    { path: "key", title: "Extension Key", summary: "Provides a development key that can produce a stable extension ID in Chrome workflows.", details: ["Most published extensions do not hand-author this field; it is mainly relevant for development or controlled distribution."], docs: "chrome" },
    { path: "update_url", title: "Update URL", summary: "Declares where Chrome should check for updates when an extension is hosted outside the Chrome Web Store.", details: ["Store-hosted extensions usually do not need this field because the store handles updates."], docs: "chrome" },
  ]);
}

function buildAdditionalNestedEntries(): Readonly<Record<string, KnowledgeEntry>> {
  return entriesToRecord([
    { path: "action.default_icon", title: "Default Icon", summary: "Declares icon files used for the extension action button.", details: ["The value can map icon sizes to image paths relative to the extension root."], relatedFields: ["action"], docs: "both" },
    { path: "action.default_popup", title: "Default Popup", summary: "Declares the HTML page opened when the user activates the extension action.", details: ["The popup path points to a bundled extension page."], relatedFields: ["action"], docs: "both" },
    { path: "action.default_title", title: "Default Title", summary: "Declares the default tooltip text for the extension action button.", details: ["Browsers can show this text when the user hovers or focuses the toolbar button."], relatedFields: ["action"], docs: "both" },
    { path: "side_panel.default_path", title: "Default Side Panel Path", summary: "Declares the HTML file shown in the extension side panel by default.", details: ["The path is relative to the extension root and is loaded by browsers that support side panels."], relatedFields: ["side_panel"], docs: "chrome" },
    { path: "browser_specific_settings.gecko", title: "Gecko Settings", summary: "Contains Firefox-specific extension settings.", details: ["Gecko settings can include an extension ID and supported Firefox version range."], relatedFields: ["browser_specific_settings"], docs: "mdn" },
    { path: "browser_specific_settings.gecko.id", title: "Gecko Extension ID", summary: "Declares the Firefox/Gecko extension ID.", details: ["Firefox uses this identifier for extension identity in contexts where an explicit ID is required."], relatedFields: ["browser_specific_settings.gecko"], docs: "mdn" },
    { path: "browser_specific_settings.gecko.strict_min_version", title: "Minimum Firefox Version", summary: "Declares the minimum Firefox version supported by the extension.", details: ["This is browser-specific compatibility metadata, not an explanation verdict by Manifest Lens."], relatedFields: ["browser_specific_settings.gecko"], docs: "mdn" },
    { path: "browser_specific_settings.gecko.strict_max_version", title: "Maximum Firefox Version", summary: "Declares the maximum Firefox version supported by the extension when specified.", details: ["Many extensions omit a maximum version so they can continue working with future Firefox releases."], relatedFields: ["browser_specific_settings.gecko"], docs: "mdn" },
    { path: "optional_permissions[]", title: "Optional Permission", summary: "A permission the extension may request later at runtime.", details: ["The extension does not receive this permission at install time; it must ask through the permissions API when needed."], relatedFields: ["optional_permissions", "permissions"], docs: "both" },
    { path: "optional_host_permissions[]", title: "Optional Host Permission", summary: "A host match pattern the extension may request later at runtime.", details: ["This uses the same match-pattern language as host_permissions, but access is requested only when needed."], relatedFields: ["optional_host_permissions", "host_permissions"], docs: "both" },
  ]);
}

function entriesToRecord(entries: readonly SimplePathEntry[]): Readonly<Record<string, KnowledgeEntry>> {
  return Object.fromEntries(entries.map((entry) => [entry.path, simplePathEntry(entry)]));
}

function simplePathEntry(entry: SimplePathEntry): KnowledgeEntry {
  return mke(`explanation:path:${entry.path.replaceAll(".", "_").replaceAll("[]", "_item")}`, entry.title, entry.summary, {
    details: entry.details,
    relatedFields: entry.relatedFields ?? [],
    docsLinks: docsLinks(entry.docs ?? "both"),
  });
}

function docsLinks(kind: "chrome" | "mdn" | "both") {
  if (kind === "chrome") return [chromeManifestDocs];
  if (kind === "mdn") return [mdnManifestDocs];
  return [chromeManifestDocs, mdnManifestDocs];
}
