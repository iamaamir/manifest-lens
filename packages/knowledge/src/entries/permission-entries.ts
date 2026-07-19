import type { KnowledgeEntry } from "../types.js";
import { mke } from "../entry-builder.js";

export function buildPermissionEntries(): Readonly<Record<string, KnowledgeEntry>> {
  const baseEntries: Record<string, KnowledgeEntry> = {
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
  } as Record<string, KnowledgeEntry>;

  return {
    ...baseEntries,
    ...buildAdditionalPermissionEntries(),
  };
}

const chromePermissionDocs = { label: "Chrome: Permissions reference", url: "https://developer.chrome.com/docs/extensions/reference/permissions-list" };
const mdnPermissionDocs = { label: "MDN: permissions", url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions" };

interface SimplePermissionEntry {
  readonly permission: string;
  readonly title: string;
  readonly summary: string;
  readonly details: readonly string[];
  readonly relatedFields?: readonly string[];
  readonly docs?: "chrome" | "mdn" | "both";
}

function buildAdditionalPermissionEntries(): Readonly<Record<string, KnowledgeEntry>> {
  return Object.fromEntries([
    perm("alarms", "Alarms Permission", "Allows the extension to schedule code to run later or on a repeating interval.", ["The alarms API is commonly used for periodic background work without keeping a background context alive."], ["background"]),
    perm("bookmarks", "Bookmarks Permission", "Allows the extension to read and modify browser bookmarks.", ["Extensions use this permission with the bookmarks API to create, organize, or inspect bookmark entries."]),
    perm("contextMenus", "Context Menus Permission", "Allows the extension to add items to browser context menus.", ["Context menu items can appear for pages, selections, links, images, tabs, or extension surfaces depending on browser support."], ["commands"]),
    perm("cookies", "Cookies Permission", "Allows the extension to use the cookies API for sites it can access.", ["Cookie access usually also depends on matching host permissions for the relevant websites."], ["host_permissions"]),
    perm("declarativeNetRequest", "Declarative Net Request Permission", "Allows the extension to use declarative rules for blocking, redirecting, or modifying network requests.", ["DNR rules are evaluated by the browser from declared or dynamic rule sets rather than by long-running extension code."], ["declarative_net_request", "host_permissions"]),
    perm("declarativeNetRequestFeedback", "DNR Feedback Permission", "Allows feedback and debugging support for declarativeNetRequest rules where supported.", ["This permission is mainly useful while developing or debugging rule behavior."], ["declarative_net_request"]),
    perm("downloads", "Downloads Permission", "Allows the extension to use the downloads API.", ["Extensions can create downloads, observe download progress, and manage downloaded items through this API." ]),
    perm("history", "History Permission", "Allows the extension to read or modify browser history through the history API.", ["History access concerns browsing-history entries, not arbitrary page content." ]),
    perm("identity", "Identity Permission", "Allows the extension to use browser identity APIs for authentication flows.", ["Identity APIs can support OAuth-style sign-in and account-related extension features."], ["oauth2"]),
    perm("notifications", "Notifications Permission", "Allows the extension to display system notifications.", ["Notifications are useful for timely extension events that should be visible outside the extension UI." ]),
    perm("offscreen", "Offscreen Permission", "Allows the extension to create offscreen documents for supported background tasks.", ["Offscreen documents provide a hidden document context for APIs that need DOM access in Manifest V3."], ["background"], "chrome"),
    perm("sidePanel", "Side Panel Permission", "Allows the extension to use the Chrome side panel API.", ["This permission pairs with side_panel manifest configuration for side-panel experiences."], ["side_panel"], "chrome"),
    perm("tabGroups", "Tab Groups Permission", "Allows the extension to read and manage browser tab groups.", ["Tab group APIs organize tabs into named or colored groups where supported." ]),
    perm("unlimitedStorage", "Unlimited Storage Permission", "Allows extension storage to exceed normal quota limits where supported.", ["This affects storage quota behavior; it does not by itself define what data the extension stores."], ["storage"]),
    perm("webNavigation", "Web Navigation Permission", "Allows the extension to observe browser navigation events.", ["Navigation events describe page/frame navigation lifecycle and are often used to coordinate extension behavior with page loads." ]),
    perm("webRequest", "Web Request Permission", "Allows the extension to observe network requests through the webRequest API.", ["In modern Chrome MV3, declarativeNetRequest is preferred for many blocking/modification use cases."], ["declarativeNetRequest", "host_permissions"]),
    perm("accessibilityFeatures.modify", "Accessibility Features Modify Permission", "Allows modifying Chrome accessibility feature settings.", ["This is a Chrome-specific accessibility settings capability."], ["permissions"], "chrome"),
    perm("accessibilityFeatures.read", "Accessibility Features Read Permission", "Allows reading Chrome accessibility feature settings.", ["This is a Chrome-specific accessibility settings capability."], ["permissions"], "chrome"),
    perm("audio", "Audio Permission", "Allows access to the Chrome audio API where supported.", ["This permission is mainly relevant in ChromeOS or specialized Chrome environments."], ["permissions"], "chrome"),
    perm("background", "Background Permission", "Declares legacy background capability semantics in browsers that recognize this permission.", ["This is mostly relevant to older manifest patterns."], ["permissions"], "both"),
    perm("browserSettings", "Browser Settings Permission", "Allows access to browser settings APIs where supported.", ["Firefox/WebExtensions expose browser settings APIs under this permission."], ["permissions"], "mdn"),
    perm("browsingData", "Browsing Data Permission", "Allows the extension to use APIs for removing or managing browsing data.", ["This concerns browser data categories such as history, cache, cookies, or downloads depending on API support."], ["permissions"], "both"),
    perm("captivePortal", "Captive Portal Permission", "Allows access to captive portal APIs where supported.", ["This is a Firefox/WebExtensions-specific network environment capability."], ["permissions"], "mdn"),
    perm("certificateProvider", "Certificate Provider Permission", "Allows access to Chrome certificate provider APIs.", ["This supports extensions that provide certificates to Chrome."], ["permissions"], "chrome"),
    perm("clipboardRead", "Clipboard Read Permission", "Allows reading from the clipboard through supported clipboard APIs.", ["Clipboard read access is sensitive because copied data can contain private information."], ["permissions"], "both"),
    perm("clipboardWrite", "Clipboard Write Permission", "Allows writing to the clipboard through supported clipboard APIs.", ["This lets an extension place text or other supported data on the clipboard."], ["permissions"], "both"),
    perm("contentSettings", "Content Settings Permission", "Allows access to browser content setting controls.", ["Content settings include site behavior such as cookies, JavaScript, plugins, geolocation, microphone, or camera where supported."], ["permissions"], "both"),
    perm("contextualIdentities", "Contextual Identities Permission", "Allows access to Firefox container identity APIs.", ["Container identities separate browsing contexts such as work or personal containers."], ["permissions"], "mdn"),
    perm("debugger", "Debugger Permission", "Allows access to browser debugger protocol APIs.", ["Debugger access can inspect or control pages through browser debugging interfaces where supported."], ["permissions"], "both"),
    perm("declarativeContent", "Declarative Content Permission", "Allows the extension to use declarative content APIs.", ["Declarative content rules let the browser decide when extension actions should apply."], ["permissions"], "chrome"),
    perm("declarativeNetRequestWithHostAccess", "DNR With Host Access Permission", "Allows declarativeNetRequest behavior that depends on declared host permissions.", ["This variant ties DNR capabilities to host access declarations."], ["permissions"], "both"),
    perm("desktopCapture", "Desktop Capture Permission", "Allows capture of screen, window, or tab content through supported APIs.", ["This is used by screen-recording or sharing extensions where supported."], ["permissions"], "chrome"),
    perm("displaySource", "Display Source Permission", "Allows access to display source APIs where supported.", ["This is a Chrome-specific or platform-specific capability associated with choosing or describing display capture sources."], ["permissions"], "chrome"),
    perm("devtools", "DevTools Permission", "Represents DevTools API access in browsers that model it as a permission.", ["MDN notes this can be granted implicitly when devtools_page is present."], ["permissions"], "mdn"),
    perm("dns", "DNS Permission", "Allows access to DNS APIs where supported.", ["DNS APIs expose name-resolution behavior to extensions."], ["permissions"], "both"),
    perm("documentScan", "Document Scan Permission", "Allows access to document scanning APIs where supported.", ["This is a specialized Chrome capability for scanning devices."], ["permissions"], "chrome"),
    perm("downloads.open", "Downloads Open Permission", "Allows opening downloaded files through the downloads API where supported.", ["This extends downloads API behavior to opening files."], ["permissions"], "both"),
    perm("downloads.shelf", "Downloads Shelf Permission", "Allows controlling legacy downloads shelf behavior where supported.", ["This is a Chrome-specific legacy downloads UI capability; newer Chrome versions changed the downloads surface, but manifests may still contain the permission."], ["permissions"], "chrome"),
    perm("downloads.ui", "Downloads UI Permission", "Allows changing downloads UI behavior where supported.", ["This is a Chrome-specific downloads API capability."], ["permissions"], "chrome"),
    perm("experimental", "Experimental Permission", "Allows access to experimental extension APIs in development or specialized browser builds.", ["Experimental APIs are not stable cross-browser extension capabilities; the permission usually appears in development, policy-controlled, or legacy manifests."], ["permissions"], "chrome"),
    perm("favicon", "Favicon Permission", "Allows access to favicon data for visited websites where supported.", ["Favicons are site icons used in tabs, history, and bookmarks."], ["permissions"], "chrome"),
    perm("fileBrowserHandler", "File Browser Handler Permission", "Allows ChromeOS file browser integration where supported.", ["This pairs with file browser handler manifest declarations so an extension can appear as a handler for selected file types."], ["file_browser_handlers"], "chrome"),
    perm("fileSystemProvider", "File System Provider Permission", "Allows ChromeOS file system provider integration where supported.", ["This lets an extension expose a virtual or remote file system to the browser file manager in supported ChromeOS environments."], ["file_system_provider"], "chrome"),
    perm("find", "Find Permission", "Allows access to page find APIs where supported.", ["This is mainly a Firefox/WebExtensions capability."], ["permissions"], "mdn"),
    perm("fontSettings", "Font Settings Permission", "Allows access to Chrome font settings APIs.", ["This lets extensions inspect or modify browser font preferences where supported."], ["permissions"], "chrome"),
    perm("gcm", "GCM Permission", "Allows access to legacy Google Cloud Messaging-related extension APIs.", ["This is Chrome-specific legacy messaging capability."], ["permissions"], "chrome"),
    perm("geolocation", "Geolocation Permission", "Allows the extension to use geolocation without the ordinary page prompt where supported.", ["Geolocation can reveal physical location, so explain this capability plainly."], ["permissions"], "both"),
    perm("identity.email", "Identity Email Permission", "Allows access to the user email address through Chrome identity APIs.", ["This is an extension identity capability separate from general OAuth flow configuration."], ["permissions"], "chrome"),
    perm("idle", "Idle Permission", "Allows detecting user idle, active, or locked state where supported.", ["Idle state can coordinate background behavior with user activity."], ["permissions"], "both"),
    perm("loginState", "Login State Permission", "Allows access to Chrome login state APIs where supported.", ["This is a specialized Chrome environment capability."], ["permissions"], "chrome"),
    perm("management", "Management Permission", "Allows managing or inspecting installed extensions/apps through supported APIs.", ["This is about browser extension/app management, not app business data."], ["permissions"], "both"),
    perm("menus", "Menus Permission", "Allows menu integration in WebExtensions browsers that use the menus API naming.", ["This is closely related to contextMenus in Chrome."], ["permissions"], "mdn"),
    perm("menus.overrideContext", "Menus Override Context Permission", "Allows overriding menu context behavior where supported.", ["This is a Firefox/WebExtensions-specific menu capability."], ["permissions"], "mdn"),
    perm("nativeMessaging", "Native Messaging Permission", "Allows communication with registered native applications.", ["Native messaging connects browser extensions to installed host applications."], ["permissions"], "both"),
    perm("pageCapture", "Page Capture Permission", "Allows saving page content as MHTML or equivalent where supported.", ["This captures a representation of the current page."], ["permissions"], "both"),
    perm("platformKeys", "Platform Keys Permission", "Allows access to platform-managed keys and certificates where supported.", ["This is used by certificate and authentication-focused extensions."], ["permissions"], "chrome"),
    perm("power", "Power Permission", "Allows the extension to request power-management behavior such as keeping the display awake.", ["This is a Chrome-specific device capability."], ["permissions"], "chrome"),
    perm("printerProvider", "Printer Provider Permission", "Allows an extension to provide printers to Chrome where supported.", ["This is a specialized printing integration capability."], ["permissions"], "chrome"),
    perm("printing", "Printing Permission", "Allows access to printing APIs where supported.", ["This supports extensions that submit or manage print jobs."], ["permissions"], "chrome"),
    perm("printingMetrics", "Printing Metrics Permission", "Allows access to printing metrics APIs where supported.", ["This is a Chrome-specific printing information capability."], ["permissions"], "chrome"),
    perm("privacy", "Privacy Permission", "Allows access to browser privacy settings APIs.", ["Privacy settings APIs can inspect or change browser privacy-related preferences."], ["permissions"], "both"),
    perm("processes", "Processes Permission", "Allows access to Chrome process information APIs.", ["This is a Chrome-specific diagnostics-like browser process capability; Manifest Lens only explains the declaration."], ["permissions"], "chrome"),
    perm("proxy", "Proxy Permission", "Allows controlling browser proxy settings where supported.", ["Proxy settings affect how browser traffic is routed."], ["permissions"], "both"),
    perm("publicSuffix", "Public Suffix Permission", "Allows access to public suffix APIs where supported.", ["This is a Firefox/WebExtensions-specific domain utility capability."], ["permissions"], "mdn"),
    perm("readingList", "Reading List Permission", "Allows access to Chrome reading list APIs.", ["This permission lets extensions read or modify reading list entries where supported."], ["permissions"], "chrome"),
    perm("runtime", "Runtime Native Messaging Permission", "Allows selected runtime native messaging methods in Chrome permission declarations.", ["Most runtime APIs do not require declaring this permission; this is about native messaging methods."], ["permissions"], "chrome"),
    perm("savedPages", "Saved Pages Permission", "Allows access to saved pages APIs where supported.", ["This is a browser-specific or legacy capability for interacting with pages saved for offline reading or later access."], ["permissions"], "chrome"),
    perm("search", "Search Permission", "Allows access to browser search APIs where supported.", ["Extensions can use this to query or interact with browser search behavior."], ["permissions"], "both"),
    perm("sessions", "Sessions Permission", "Allows access to recently closed tabs/windows or session restore information where supported.", ["Sessions APIs describe browser session state."], ["permissions"], "both"),
    perm("system.cpu", "System CPU Permission", "Allows access to CPU information APIs in Chrome.", ["This is a system information capability."], ["permissions"], "chrome"),
    perm("system.display", "System Display Permission", "Allows access to display information APIs in Chrome.", ["This describes connected displays and display configuration where supported."], ["permissions"], "chrome"),
    perm("system.memory", "System Memory Permission", "Allows access to memory information APIs in Chrome.", ["This is a system information capability."], ["permissions"], "chrome"),
    perm("system.storage", "System Storage Permission", "Allows access to storage device information APIs in Chrome.", ["This describes storage devices where supported."], ["permissions"], "chrome"),
    perm("tabCapture", "Tab Capture Permission", "Allows capturing tab media streams where supported.", ["This is used by recording, streaming, or sharing extensions."], ["permissions"], "chrome"),
    perm("tabHide", "Tab Hide Permission", "Allows hiding browser tabs where supported.", ["This is a Firefox/WebExtensions tab-management capability."], ["permissions"], "mdn"),
    perm("theme", "Theme Permission", "Allows access to theme APIs where supported.", ["This is distinct from the top-level theme manifest key."], ["permissions"], "mdn"),
    perm("topSites", "Top Sites Permission", "Allows access to the browser top sites API.", ["Top sites represent frequently visited sites as exposed by the browser."], ["permissions"], "both"),
    perm("tts", "Text-to-Speech Permission", "Allows access to text-to-speech APIs.", ["Extensions can use this to speak text through browser TTS support."], ["permissions"], "chrome"),
    perm("ttsEngine", "Text-to-Speech Engine Permission", "Allows the extension to provide a text-to-speech engine.", ["This pairs with tts_engine manifest registration where supported."], ["permissions"], "chrome"),
    perm("userScripts", "User Scripts Permission", "Allows access to userScripts APIs where supported.", ["User scripts are registered scripts managed through a dedicated extension API."], ["permissions"], "both"),
    perm("vpnProvider", "VPN Provider Permission", "Allows the extension to provide VPN functionality where supported.", ["This is a specialized network provider capability."], ["permissions"], "chrome"),
    perm("wallpaper", "Wallpaper Permission", "Allows access to wallpaper APIs where supported.", ["This is mainly relevant to ChromeOS-style environments."], ["permissions"], "chrome"),
    perm("webAuthenticationProxy", "Web Authentication Proxy Permission", "Allows access to Web Authentication proxy APIs where supported.", ["This supports extensions that proxy WebAuthn requests."], ["permissions"], "chrome"),
    perm("webRequestAuthProvider", "Web Request Auth Provider Permission", "Allows authentication-provider behavior for webRequest in Manifest V3 where supported.", ["This relates to handling authentication challenges for network requests."], ["permissions"], "mdn"),
    perm("webRequestBlocking", "Web Request Blocking Permission", "Allows blocking behavior in webRequest APIs where supported.", ["This enables modifying or canceling requests in browsers and manifest versions that support blocking webRequest."], ["permissions"], "both"),
    perm("webRequestFilterResponse", "Web Request Filter Response Permission", "Allows filtering response bodies in browsers that support this WebExtensions permission.", ["This is Firefox/WebExtensions-specific response filtering capability."], ["permissions"], "mdn"),
    perm("webRequestFilterResponse.serviceWorkerScript", "Service Worker Script Response Filter Permission", "Allows response filtering for service worker scripts where supported.", ["This is a Firefox/WebExtensions-specific filtering capability."], ["permissions"], "mdn"),
  ].map((entry) => [entry.permission, simplePermissionEntry(entry)]));
}

function perm(permission: string, title: string, summary: string, details: readonly string[], relatedFields: readonly string[] = ["permissions"], docs: "chrome" | "mdn" | "both" = "both"): SimplePermissionEntry {
  return { permission, title, summary, details, relatedFields, docs };
}

function simplePermissionEntry(entry: SimplePermissionEntry): KnowledgeEntry {
  return mke(`explanation:permission:${entry.permission}`, entry.title, entry.summary, {
    details: entry.details,
    relatedFields: entry.relatedFields ?? [],
    docsLinks: docsLinks(entry.docs ?? "both"),
  });
}

function docsLinks(kind: "chrome" | "mdn" | "both") {
  if (kind === "chrome") return [chromePermissionDocs];
  if (kind === "mdn") return [mdnPermissionDocs];
  return [chromePermissionDocs, mdnPermissionDocs];
}
