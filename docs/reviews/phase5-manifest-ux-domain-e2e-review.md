# Phase 5 Manifest UX Domain E2E Review

Date: 2026-07-19  
Role: Manifest UX Domain Specialist  
Scope: Read-only review of comprehensive fixture usage, E2E coverage, and manifest semantics/explanation UX

## Verdict

The new Playwright E2E suite is strong for Phase 5 interaction/regression behavior, but it is not yet a semantic/explanation coverage suite.

It validates that the comprehensive manifest can be loaded and interacted with, but most assertions cover general UI behavior rather than whether explanations help users understand manifest meaning.

## Coverage Findings

`fixtures/manifests/comprehensive-all-browsers.json` contains 68 top-level fields.

Current E2E explicitly clicks/asserts only:

- `manifest_version`
- `permissions`
- `host_permissions`
- `content_scripts`
- `background`
- `action`
- `version`
- `x_custom_metadata`

PRD/roadmap-required fields present in the fixture but not currently clicked in E2E:

- `icons`
- `commands`
- `options_ui`
- `web_accessible_resources`
- `content_security_policy`
- `declarative_net_request`
- `browser_action`
- `page_action`

Important nested semantics are under-covered:

- individual permission strings: `tabs`, `storage`;
- optional permission strings: `activeTab`, `scripting`;
- host patterns: `<all_urls>`, `*://*.example.com/*`, `https://github.com/manifest-lens/*`;
- `content_scripts[].matches`, `js`, `css`, `run_at`, `all_frames`, `world`, `match_origin_as_fallback`;
- `background.service_worker`, `background.scripts`, `background.page`, `background.persistent`;
- `web_accessible_resources[].resources`, `matches`, `use_dynamic_url`, `extension_ids`;
- `declarative_net_request.rule_resources[].path`, `enabled`.

## Domain Concerns

### `optional_permissions` semantic gap

The fixture contains `activeTab` and `scripting` under `optional_permissions`. Current semantic mapping appears to treat `permissions` array items as permission nodes, but `optional_permissions` is not yet a known top-level field in the same way.

Do not turn this into a validation feature. Treat it as an explainer coverage gap to investigate when expanding knowledge/semantic mapping.

### Unknown fallback wording

Fallback wording should avoid implying that browser-specific or legacy fields are invalid or non-standard.

Prefer language like:

> This key is not in manifest-lens’s current field reference. The source is still selectable and shown as-is.

### `host_permissions` wording

Avoid overstating access. Host permissions declare URL scope where certain extension APIs/content scripts/requests may operate; actual behavior depends on other fields and extension code.

### `permissions` wording

Separate browser API capability permissions from host/site access to avoid blurring `permissions` and `host_permissions`.

### `background` wording

For MV3, background service workers are event-driven and non-persistent. Avoid copy that suggests background pages persist state in MV3.

## Recommended Next E2E/Review Matrix

Add a small representative semantic matrix rather than looping over all fields.

1. PRD-required known top-level fields:
   - `web_accessible_resources`
   - `content_security_policy`
   - `declarative_net_request`
   - `commands`
   - `options_ui`
   - `icons`
   - `browser_action`
   - `page_action`

2. Permission/host semantics:
   - `permissions[] = "tabs"`
   - `permissions[] = "storage"`
   - `optional_permissions[] = "activeTab"`
   - `optional_permissions[] = "scripting"`
   - `host_permissions[] = "<all_urls>"`

3. Nested structure semantics:
   - `content_scripts[].matches`
   - `content_scripts[].run_at`
   - `background.service_worker`
   - `background.persistent`
   - `web_accessible_resources[].matches`
   - `declarative_net_request.rule_resources[].enabled`

4. Browser-specific fallback fields:
   - `browser_specific_settings.gecko`
   - `applications.gecko`
   - `sidebar_action`
   - `safari`
   - `compose_action`
   - `message_display_action`
   - `experiment_apis`

## Scope Guardrail

Use the comprehensive fixture for reachability and neutral explanation UX.

Do not use it to introduce:

- compatibility matrices;
- diagnostics;
- mixed-version warnings;
- deprecated-field scoring;
- security audits;
- fixes;
- health scores;
- publish-readiness behavior.

## Proposed Memory Update

Record that E2E coverage is now strong for browser interactions but should add representative manifest semantics checks in future E2E/knowledge slices, especially PRD-required fields, permission/host array items, nested content-script/background/web-accessible-resource fields, and neutral browser-specific fallback behavior.
