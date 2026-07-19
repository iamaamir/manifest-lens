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
