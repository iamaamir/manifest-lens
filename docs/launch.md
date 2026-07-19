# Initial Launch Plan: Web Extension Manifest Explainer

## Launch Positioning

The initial release is an interactive, local-first explainer for browser extension manifest files.

The product is not launching as a manifest linter, diagnostic report generator, publishing-readiness checker, or automatic fixer. Those capabilities may be added later, but the first release should focus on one clear promise:

> Paste or open a browser extension manifest, hover any meaningful section, and understand what it does.

## Product Promise

The first launch helps users understand a `manifest.json` file by preserving the original source text, mapping it to an explanation-aware AST, and showing contextual explanations for manifest fields, sections, and values.

The primary user journey is:

```text
Import manifest
→ parse it with an explanation-aware AST
→ render the original source
→ hover or select a meaningful section
→ show a contextual explanation in the UI
```

## Target Users

### Primary User: Browser Extension Developer

A developer building, learning, reviewing, or maintaining a browser extension.

They want to understand what a manifest field means without constantly switching between their manifest and browser documentation.

### Secondary User: Developer Reading an Existing Extension

A developer, reviewer, or learner inspecting a manifest they did not write.

They want to quickly understand how the extension is configured, what permissions it declares, and how major manifest sections relate to browser extension behavior.

### Tertiary User: Tooling Integrator

A developer who may later want to embed the explainer in another surface, such as a documentation site, editor extension, browser extension, or internal tool.

The initial release should preserve platform-independent architecture, but not prioritize multiple host integrations before the web experience is proven.

## First Launch Scope

The first launch should include:

- Paste manifest text.
- Drop or select a local `manifest.json` file.
- Preserve original formatting and source text.
- Parse JSON source into a source-aware syntax tree.
- Build semantic manifest nodes from recognized fields and values.
- Render source with interactive semantic ranges.
- Show contextual explanations on hover.
- Pin explanations on click or keyboard selection.
- Show explanations for common manifest fields.
- Show explanations for common permission values.
- Show a fallback explanation for unknown or custom fields.
- Work fully locally without a backend.
- Avoid sending manifest contents to remote services.

## Core Interaction

The launch UI should center on a split view:

```text
┌──────────────────────────────┬──────────────────────────────┐
│ Manifest Source              │ Explanation                  │
│                              │                              │
│ {                            │ permissions                  │
│   "permissions": ["tabs"]    │                              │
│ }                            │ Declares privileged APIs...  │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

Expected behavior:

- Hovering a source range previews the explanation.
- Clicking a source range pins the explanation.
- Moving away from hover restores the pinned explanation.
- Keyboard navigation can move between explainable nodes.
- Touch devices use tap selection instead of hover.
- Unknown fields remain selectable and explain that no manifest-specific explanation is available yet.
- The UI should make source-linked explanation feel immediate and trustworthy.

## Explanation Content Scope

The first launch should prioritize explanation coverage over validation coverage.

### Top-Level Fields

Initial explanation coverage should include common fields such as:

- `manifest_version`
- `name`
- `version`
- `description`
- `icons`
- `action`
- `browser_action`
- `page_action`
- `background`
- `content_scripts`
- `permissions`
- `host_permissions`
- `web_accessible_resources`
- `commands`
- `options_ui`
- `content_security_policy`
- `externally_connectable`
- `declarative_net_request`

### Permission Values

Initial explanation coverage should include common permissions such as:

- `activeTab`
- `tabs`
- `storage`
- `scripting`
- `alarms`
- `contextMenus`
- `notifications`
- `webRequest`
- `webRequestBlocking`
- `declarativeNetRequest`
- `cookies`
- `bookmarks`
- `history`
- `downloads`
- `identity`

### Explanation Structure

Each explanation should aim to provide:

- a short title,
- a plain-language summary,
- when or why the field is used,
- important behavior or constraints,
- related fields where useful,
- links to official documentation where appropriate.

The explanation should educate without presenting itself as a diagnostic verdict.

## Architecture Expectations

The initial launch should preserve the HLD’s platform-independent architecture direction.

The product should be built around:

```text
Source document
→ source-aware syntax tree
→ semantic manifest model
→ explanation resolver
→ immutable explanation snapshot
→ portable UI
```

The core engine should remain independent of:

- DOM APIs,
- browser globals,
- VS Code APIs,
- browser extension APIs,
- storage APIs,
- rendering frameworks,
- backend services.

Platform-specific behavior should remain behind small host adapters.

## Explicit Non-Goals for Initial Launch

The first launch will not attempt to provide:

- complete schema validation,
- a health score,
- a publishing-readiness report,
- severity-based diagnostics,
- automatic fixes,
- source-to-source manifest migration,
- MV2-to-MV3 conversion,
- CI integration,
- VS Code diagnostics,
- browser extension packaging,
- user accounts,
- cloud storage,
- remote analysis,
- AI-generated explanations,
- public share links.

Some of these may be introduced later, but they should not distract from the initial explainer experience.

## Launch Success Criteria

The launch is successful if:

1. A user can paste or drop a manifest and see the original source rendered accurately.
2. A user can hover common manifest fields and immediately see helpful explanations.
3. A user can understand what the major sections of a manifest do without leaving the app.
4. Permission explanations help users understand capability and privacy implications without requiring a diagnostic report.
5. Unknown fields degrade gracefully rather than breaking the experience.
6. The product works locally and does not require a backend.
7. The architecture remains ready for future validation, editor, CLI, and extension-host integrations.

## Product Metrics

Initial product metrics should focus on explanation usefulness rather than diagnostic completeness.

Suggested metrics:

- Percentage of visitors who load or paste a manifest.
- Percentage of loaded manifests with at least one recognized explainable node.
- Percentage of users who hover or select an explainable node.
- Number of explanation panel interactions per session.
- Most-viewed manifest fields and permissions.
- Unknown fields encountered most often.
- User feedback on whether an explanation was helpful.
- Time from manifest import to first explanation viewed.

## Quality Bar

The first release should feel:

- fast,
- local,
- precise,
- educational,
- source-linked,
- trustworthy,
- lightweight.

It should not feel like a generic JSON viewer.

The key product test is:

> Does hovering the manifest make the file easier to understand?

## Later Expansion Paths

After the explainer experience is validated, possible future work includes:

- schema validation,
- compatibility notes,
- diagnostic list,
- source-linked warnings,
- fix previews,
- MV2-to-MV3 guidance,
- browser comparison mode,
- exportable reports,
- VS Code extension,
- browser extension,
- CLI,
- embeddable widget,
- offline PWA,
- broader configuration-file explainers.

These should be prioritized only after the initial explainer proves useful.
