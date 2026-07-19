# Manifest Knowledge Coverage Matrix

Last reviewed: 2026-07-19

This document is the working coverage matrix for Manifest Lens explanation knowledge. It tracks what official manifest concepts exist, what the current registry explains, and what should be added next.

Source inventory: `docs/knowledge/manifest-knowledge-sources.md`.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `covered` | Current registry has a specific explanation entry for this path/value. |
| `generic-covered` | Current registry has a generic/category explanation, usually for arbitrary values such as host match patterns. |
| `fallback-intentional` | Custom/vendor/user-defined values should use graceful fallback, not a fake standard explanation. |
| `missing` | Officially documented concept with no current specific registry entry. |
| `deferred` | Known concept intentionally not targeted for the next coverage slice. |
| `verify-source` | Listed by a source, but needs a dedicated source page/schema review before writing explanatory copy. |

## Coverage tiers

| Tier | Goal | Deliverable |
| --- | --- | --- |
| Tier 0 | Audit current entries for accuracy and source links | Existing entries have correct docs links and no misleading diagnostic language. |
| Tier 1 | Cover documented top-level manifest keys | Every Chrome/MDN top-level key has `covered`, `generic-covered`, `fallback-intentional`, or `deferred` status. |
| Tier 2 | Cover high-value nested manifest paths | Common nested objects/arrays explain their fields and item roles. |
| Tier 3 | Cover documented permission strings | Common Chrome and MDN permission values have specific explanations. |
| Tier 4 | Cover enum-like manifest values | Values such as `document_idle`, `spanning`, or `ISOLATED` have explanations where the semantic model can expose them. |

## Current implementation snapshot

Extracted from `packages/knowledge/src/index.ts` on 2026-07-19.

Current path entries:

```text
manifest
manifest_version
name
version
description
icons
permissions
host_permissions
host_permissions[]
content_scripts
content_scripts[]
content_scripts[].matches
content_scripts[].matches[]
content_scripts[].js
content_scripts[].js[]
content_scripts[].css
content_scripts[].css[]
content_scripts[].run_at
content_scripts[].all_frames
background
background.service_worker
background.scripts
action
browser_action
page_action
options_ui
options_ui.page
options_ui.open_in_tab
commands
web_accessible_resources
web_accessible_resources[]
web_accessible_resources[].resources
web_accessible_resources[].matches
content_security_policy
declarative_net_request
declarative_net_request.rule_resources
```

Current permission entries:

```text
tabs
activeTab
storage
scripting
```

## Top-level manifest keys

Union of Chrome manifest file format and MDN WebExtensions `manifest.json` key lists reviewed on 2026-07-19.

| Key | Source coverage | Current status | Registry key | Notes |
| --- | --- | --- | --- | --- |
| `action` | Chrome, MDN | covered | `action` | MV3 toolbar action. Nested paths need expansion. |
| `author` | MDN | missing | — | WebExtensions metadata. |
| `automation` | Older/Chrome-specific | verify-source | — | Not in fetched Chrome manifest page; verify before adding. |
| `background` | Chrome, MDN | covered | `background` | Nested MV2/MV3 differences need clearer coverage. |
| `browser_action` | MDN, Chrome legacy | covered | `browser_action` | MV2/legacy action surface. |
| `browser_specific_settings` | MDN | missing | — | Important Firefox/Gecko metadata. Chrome docs note unsupported in Google Chrome. |
| `chrome_settings_overrides` | Chrome, MDN | missing | — | Chrome settings/search overrides. |
| `chrome_url_overrides` | Chrome, MDN | missing | — | New tab/bookmarks/history override pages. |
| `commands` | Chrome, MDN | covered | `commands` | Nested command object paths missing. |
| `content_capabilities` | Older/Chrome-specific | verify-source | — | Verify support/source before adding. |
| `content_scripts` | Chrome, MDN | covered | `content_scripts` | Several nested fields covered; others missing. |
| `content_security_policy` | Chrome, MDN | covered | `content_security_policy` | MV2 string vs MV3 object differences need explicit coverage. |
| `cross_origin_embedder_policy` | Chrome | missing | — | Chrome optional MV3 key. |
| `cross_origin_opener_policy` | Chrome | missing | — | Chrome optional MV3 key. |
| `dark_theme` | MDN | missing | — | Theme-related WebExtensions key. |
| `declarative_net_request` | Chrome, MDN | covered | `declarative_net_request` | Rule resource item paths missing. |
| `default_locale` | Chrome, MDN | missing | — | Required only when `_locales` exists; explain without validation. |
| `description` | Chrome, MDN | covered | `description` | Chrome Web Store required; platform optional in MDN except product needs. |
| `developer` | MDN | missing | — | Browser/vendor metadata. |
| `devtools_page` | Chrome, MDN | missing | — | DevTools extension page. |
| `dictionaries` | MDN | missing | — | Firefox/WebExtensions dictionary support. |
| `export` | Chrome | missing | — | Chrome optional resource export key; verify source page before entry. |
| `externally_connectable` | Chrome, MDN | missing | — | MDN notes not supported in Firefox. |
| `file_browser_handlers` | ChromeOS | deferred | — | ChromeOS-specific optional key. |
| `file_handlers` | ChromeOS | deferred | — | ChromeOS-specific optional key. |
| `file_system_provider_capabilities` | ChromeOS | deferred | — | ChromeOS-specific optional key. |
| `homepage_url` | Chrome, MDN | missing | — | Extension homepage metadata. |
| `host_permissions` | Chrome, MDN | covered | `host_permissions` | Item values generic-covered through `host_permissions[]`. |
| `icons` | Chrome, MDN | covered | `icons` | Size-specific icon path values need generic coverage. |
| `import` | Chrome | missing | — | Chrome optional resource import key; verify source page before entry. |
| `incognito` | Chrome, MDN | missing | — | Enum values should be Tier 4. |
| `input_components` | ChromeOS | deferred | — | ChromeOS-specific optional key. |
| `key` | Chrome | missing | — | Stable extension ID/development use. |
| `manifest_version` | Chrome, MDN | covered | `manifest_version` | Required key. |
| `mime_types_handler` | Chrome | missing | — | Chrome MIME handler key. |
| `minimum_chrome_version` | Chrome | missing | — | Chrome version gating. |
| `name` | Chrome, MDN | covered | `name` | Required key. |
| `oauth2` | Chrome | missing | — | OAuth client configuration. |
| `offline_enabled` | MDN | missing | — | MDN notes not supported in Firefox. Verify Chrome status. |
| `omnibox` | Chrome, MDN | missing | — | Address bar keyword integration. |
| `optional_host_permissions` | Chrome, MDN | missing | — | Runtime-requested host permissions. |
| `optional_permissions` | Chrome, MDN | missing | — | Runtime-requested API permissions. |
| `options_page` | Chrome, MDN | missing | — | Standalone options page. |
| `options_ui` | Chrome, MDN | covered | `options_ui` | `page` and `open_in_tab` covered. More fields may exist per browser. |
| `page_action` | MDN, Chrome legacy | covered | `page_action` | MV2/legacy page action. |
| `permissions` | Chrome, MDN | covered | `permissions` | Only four specific permission values covered today. |
| `protocol_handlers` | MDN | missing | — | Firefox-only. |
| `requirements` | Chrome | missing | — | Chrome technology requirements. |
| `sandbox` | Chrome | missing | — | Sandboxed extension pages. |
| `short_name` | Chrome, MDN | missing | — | Short display name. |
| `side_panel` | Chrome | missing | — | Chrome side panel integration. |
| `sidebar_action` | MDN | missing | — | Firefox sidebar action. |
| `storage` | Chrome, MDN | missing | — | Managed storage schema manifest key; distinct from `storage` permission. |
| `theme` | MDN | missing | — | Firefox/browser theme manifest key. |
| `theme_experiment` | MDN | deferred | — | Firefox-only experimental. |
| `tts_engine` | Chrome | missing | — | Text-to-speech engine registration. |
| `update_url` | Chrome | missing | — | Update URL for non-store distribution. |
| `user_scripts` | MDN | missing | — | MDN marks Manifest V2 only. Distinct from `userScripts` permission. |
| `version` | Chrome, MDN | covered | `version` | Required key. |
| `version_name` | Chrome, MDN | missing | — | Human-readable version label. |
| `web_accessible_resources` | Chrome, MDN | covered | `web_accessible_resources` | MV2 vs MV3 shape differences need clearer coverage. |

## High-value nested path gaps

These are Tier 2 candidates. The list prioritizes fields that appear in common MV3 manifests or project fixtures.

| Path | Current status | Notes |
| --- | --- | --- |
| `action.default_icon` | missing | Generic icon-object/path explanation. |
| `action.default_popup` | missing | Popup HTML path. |
| `action.default_title` | missing | Tooltip/title text. |
| `background.type` | missing | MV3 service worker module/classic distinction where supported. |
| `browser_specific_settings.gecko` | missing | Firefox/Gecko settings container. |
| `browser_specific_settings.gecko.id` | missing | Gecko extension ID. |
| `browser_specific_settings.gecko.strict_min_version` | missing | Firefox minimum version. |
| `browser_specific_settings.gecko.strict_max_version` | missing | Firefox maximum version. |
| `chrome_settings_overrides.search_provider` | missing | Search provider override. |
| `chrome_url_overrides.newtab` | missing | New tab override. |
| `commands.*.description` | missing | Command description. |
| `commands.*.suggested_key` | missing | Suggested keyboard shortcut mapping. |
| `commands.*.suggested_key.default` | missing | Default shortcut. |
| `content_scripts[].exclude_matches` | missing | Excluded URL match patterns. |
| `content_scripts[].include_globs` | missing | Glob include filters. |
| `content_scripts[].exclude_globs` | missing | Glob exclude filters. |
| `content_scripts[].match_about_blank` | missing | Related-frame injection behavior. |
| `content_scripts[].match_origin_as_fallback` | missing | Origin fallback injection behavior where supported. |
| `content_scripts[].world` | missing | Isolated vs main world choice. |
| `content_security_policy.extension_pages` | missing | MV3 extension page CSP. |
| `content_security_policy.sandbox` | missing | MV3 sandbox page CSP. |
| `declarative_net_request.rule_resources[]` | missing | Rule resource item. |
| `declarative_net_request.rule_resources[].id` | missing | Rule set identifier. |
| `declarative_net_request.rule_resources[].enabled` | missing | Whether rule set starts enabled. |
| `declarative_net_request.rule_resources[].path` | missing | Rule JSON file path. |
| `externally_connectable.ids` | missing | Extension IDs allowed to connect. |
| `externally_connectable.matches` | missing | Web origins allowed to connect. |
| `externally_connectable.matches[]` | missing | Match pattern item. |
| `icons.*` | missing | Icon size to path mapping. |
| `oauth2.client_id` | missing | OAuth client ID. |
| `oauth2.scopes` | missing | OAuth scopes array. |
| `optional_host_permissions[]` | missing | Optional host match pattern item. |
| `optional_permissions[]` | missing | Optional API permission item. |
| `options_ui.browser_style` | missing | Firefox-specific styling option where relevant. |
| `side_panel.default_path` | missing | Chrome side panel HTML path. |
| `web_accessible_resources[].extension_ids` | missing | Extensions allowed to access resources. |
| `web_accessible_resources[].use_dynamic_url` | missing | Dynamic URL behavior. |

## Permission value coverage

Chrome and MDN permission references reviewed on 2026-07-19. Current registry covers only `activeTab`, `scripting`, `storage`, and `tabs`.

| Permission | Source coverage | Current status | Notes |
| --- | --- | --- | --- |
| `accessibilityFeatures.modify` | Chrome | missing | Chrome accessibility features API. |
| `accessibilityFeatures.read` | Chrome | missing | Chrome accessibility features API. |
| `activeTab` | Chrome, MDN | covered | Temporary active-tab access after user gesture. |
| `alarms` | Chrome, MDN | missing | Scheduled alarms/timers API. |
| `audio` | Chrome | missing | ChromeOS/audio API. |
| `background` | Chrome, MDN | missing | Legacy/background permission concept. |
| `bookmarks` | Chrome, MDN | missing | Bookmark API access. |
| `browserSettings` | MDN | missing | Firefox/WebExtensions browser settings. |
| `browsingData` | Chrome, MDN | missing | Browsing data removal/settings API. |
| `captivePortal` | MDN | missing | Firefox/WebExtensions captive portal API. |
| `certificateProvider` | Chrome | missing | Chrome certificate provider API. |
| `clipboardRead` | Chrome, MDN | missing | Clipboard read access. |
| `clipboardWrite` | Chrome, MDN | missing | Clipboard write access. |
| `contentSettings` | Chrome, MDN | missing | Website content settings. |
| `contextMenus` | Chrome, MDN | missing | Context menu integration. MDN also has `menus`. |
| `contextualIdentities` | MDN | missing | Firefox container identities. |
| `cookies` | Chrome, MDN | missing | Cookie API access, often with host permissions. |
| `debugger` | Chrome, MDN | missing | Debugger protocol access. |
| `declarativeContent` | Chrome | missing | Declarative content API. |
| `declarativeNetRequest` | Chrome, MDN | missing | Declarative network rules API. |
| `declarativeNetRequestFeedback` | Chrome, MDN | missing | DNR feedback/debugging support. |
| `declarativeNetRequestWithHostAccess` | Chrome, MDN | missing | DNR with host permission model. |
| `desktopCapture` | Chrome | missing | Screen/window capture API. |
| `devtools` | MDN | missing | MDN notes implicit with `devtools_page`. |
| `dns` | Chrome, MDN | missing | DNS API. |
| `documentScan` | Chrome | missing | Document scanning API. |
| `downloads` | Chrome, MDN | missing | Downloads API. |
| `downloads.open` | Chrome, MDN | missing | Allows opening downloaded files. |
| `downloads.ui` | Chrome | missing | Downloads UI options. |
| `enterprise.deviceAttributes` | Chrome | deferred | Enterprise/managed-device specific. |
| `enterprise.hardwarePlatform` | Chrome | deferred | Enterprise/managed-device specific. |
| `enterprise.networkingAttributes` | Chrome | deferred | Enterprise/managed-device specific. |
| `enterprise.platformKeys` | Chrome | deferred | Enterprise/managed-device specific. |
| `favicon` | Chrome | missing | Favicon API. |
| `fileBrowserHandler` | Chrome | deferred | ChromeOS-specific. |
| `fileSystemProvider` | Chrome | deferred | ChromeOS-specific. |
| `find` | MDN | missing | Firefox/WebExtensions find API. |
| `fontSettings` | Chrome | missing | Font settings API. |
| `gcm` | Chrome | missing | Google Cloud Messaging/instance ID legacy API. |
| `geolocation` | Chrome, MDN | missing | Geolocation access. |
| `history` | Chrome, MDN | missing | Browser history API. |
| `identity` | Chrome, MDN | missing | Identity/OAuth APIs. |
| `identity.email` | Chrome | missing | User email through Chrome identity API. |
| `idle` | Chrome, MDN | missing | Idle state API. |
| `loginState` | Chrome | missing | Chrome login state API. |
| `management` | Chrome, MDN | missing | Extension/app management API. |
| `menus` | MDN | missing | WebExtensions menu API alias/surface. |
| `menus.overrideContext` | MDN | missing | Firefox menu context override. |
| `nativeMessaging` | Chrome, MDN | missing | Native messaging hosts. |
| `notifications` | Chrome, MDN | missing | Notification API. |
| `offscreen` | Chrome | missing | Offscreen documents API. |
| `pageCapture` | Chrome, MDN | missing | Save page capture API. |
| `pkcs11` | MDN | deferred | Firefox/security-module specific. |
| `platformKeys` | Chrome | missing | Platform keys/certificates API. |
| `power` | Chrome | missing | Power management API. |
| `printerProvider` | Chrome | missing | Printer provider API. |
| `printing` | Chrome | missing | Printing API. |
| `printingMetrics` | Chrome | missing | Printing metrics API. |
| `privacy` | Chrome, MDN | missing | Privacy settings API. |
| `processes` | Chrome | missing | Chrome process API. |
| `proxy` | Chrome, MDN | missing | Proxy settings/API. |
| `publicSuffix` | MDN | missing | Firefox public suffix API. |
| `readingList` | Chrome | missing | Chrome reading list API. |
| `runtime` | Chrome | missing | Chrome native messaging subset; runtime otherwise often no permission. |
| `scripting` | Chrome, MDN | covered | Programmatic script/style injection in MV3. |
| `search` | Chrome, MDN | missing | Search API. |
| `sessions` | Chrome, MDN | missing | Recently closed/session API. |
| `sidePanel` | Chrome | missing | Chrome side panel API. |
| `storage` | Chrome, MDN | covered | Extension storage API. |
| `system.cpu` | Chrome | missing | System CPU API. |
| `system.display` | Chrome | missing | System display API. |
| `system.memory` | Chrome | missing | System memory API. |
| `system.storage` | Chrome | missing | System storage API. |
| `tabCapture` | Chrome | missing | Tab capture API. |
| `tabGroups` | Chrome, MDN | missing | Tab group API. |
| `tabHide` | MDN | missing | Firefox tab hiding API. |
| `tabs` | Chrome, MDN | covered | Privileged tab metadata. |
| `theme` | MDN | missing | WebExtensions theme API. |
| `topSites` | Chrome, MDN | missing | Top sites API. |
| `tts` | Chrome | missing | Text-to-speech API. |
| `ttsEngine` | Chrome | missing | Text-to-speech engine API. |
| `unlimitedStorage` | Chrome, MDN | missing | Extended local storage quota. |
| `userScripts` | Chrome, MDN | missing | User scripts API permission. |
| `vpnProvider` | Chrome | missing | VPN provider API. |
| `wallpaper` | Chrome | missing | ChromeOS wallpaper API. |
| `webAuthenticationProxy` | Chrome | missing | Web authentication proxy API. |
| `webNavigation` | Chrome, MDN | missing | Navigation event API. |
| `webRequest` | Chrome, MDN | missing | Network request observation API. |
| `webRequestAuthProvider` | MDN | missing | MV3 and above in MDN list. |
| `webRequestBlocking` | Chrome, MDN | missing | Blocking webRequest behavior. |
| `webRequestFilterResponse` | MDN | missing | Firefox response filtering. |
| `webRequestFilterResponse.serviceWorkerScript` | MDN | missing | Firefox service worker script filtering. |

## Generic value coverage

| Value shape | Current status | Current behavior | Needed improvement |
| --- | --- | --- | --- |
| `host_permissions[]` match patterns | generic-covered | Recognized schemes resolve to `Host Permission`; unrecognized patterns fall back. | Expand explanation with Chrome/MDN scheme differences and `<all_urls>` nuance. |
| `content_scripts[].matches[]` match patterns | covered | Specific path entry exists. | Align copy with Chrome/MDN match-pattern grammar. |
| `web_accessible_resources[].matches[]` match patterns | missing | Parent path exists but item path does not. | Add item-level match-pattern explanation. |
| File paths such as scripts, CSS, icons, popup pages | partially covered | Some array item entries exist for JS/CSS. | Add generic file-path role entries for icon sizes, popups, side panel, options pages, DNR rule files. |
| Locale message references such as `__MSG_name__` | missing | Treated as plain values today. | Add explanatory note under localized fields after semantic model supports value explanations. |

## Enum-like value candidates

Tier 4 should add these after the semantic model can expose value-level explanations consistently.

| Path | Values | Current status | Notes |
| --- | --- | --- | --- |
| `content_scripts[].run_at` | `document_start`, `document_end`, `document_idle` | missing | Field is covered; values are not. |
| `content_scripts[].world` | `ISOLATED`, `MAIN` | missing | Chrome MV3 content script execution world. |
| `incognito` | `spanning`, `split`, `not_allowed` | missing | Listed by Chrome manifest page. |
| `options_ui.open_in_tab` | `true`, `false` | missing | Field is covered; boolean meaning could be clearer. |
| `declarative_net_request.rule_resources[].enabled` | `true`, `false` | missing | Requires item path first. |
| `content_security_policy` shape | string vs object | missing | Explain MV2/MV3 shape difference without validation. |

## Initial implementation recommendation

Do not immediately fill every missing row by hand in `packages/knowledge/src/index.ts`. First make the registry maintainable and testable.

Recommended next implementation sequence:

1. Add checked-in coverage catalogs under `packages/knowledge/src/coverage/`:
   - `required-top-level-paths.ts`
   - `required-nested-paths.ts`
   - `required-permissions.ts`
2. Add tests that compare the catalogs to `createKnowledgeRegistry()`.
3. Refactor `packages/knowledge/src/index.ts` into small entry modules under `packages/knowledge/src/entries/`.
4. Fill Tier 1 top-level key entries.
5. Fill Tier 2 high-value nested path entries.
6. Fill Tier 3 permission entries.
7. Add value-level support and then fill Tier 4 enum-like values.

## Acceptance criteria for the next slice

A documentation/audit slice is complete when:

- `docs/knowledge/manifest-knowledge-sources.md` lists reviewed sources and dates.
- This coverage matrix records current and missing coverage.
- Every missing/deferred distinction is explicit enough for an implementation agent to pick up.
- `docs/journey/memory.md` records the knowledge coverage audit decision.

A later implementation slice is complete when:

- Coverage catalogs exist in source.
- Tests fail if required entries are missing.
- Registry modules are split enough to avoid a single giant knowledge file.
- All Tier 1 entries are covered with official docs links.
- Validation passes: `npm run typecheck`, `npm run test`, `npm run build`, and `git diff --check`.
