# PRD: Initial Release — Web Extension Manifest Explainer

## Problem Statement

Browser extension manifests are compact but dense configuration files. A single `manifest.json` can declare extension identity, browser capabilities, permissions, background behavior, content-script injection, security policies, host access, commands, icons, and browser-specific behavior.

Developers often need to switch between their manifest, Chrome documentation, MDN documentation, examples, and scattered migration guides to understand what each field means. This is especially difficult for newer extension developers, developers reading an existing extension, and developers encountering unfamiliar fields or permissions.

The initial product should make a manifest understandable directly in context.

The first release should not primarily be a diagnostic or validation tool. It should be an interactive explainer:

> Import a manifest, hover or select any meaningful section, and see a clear explanation of what that section means.

## Solution

Build a local-first interactive web experience that parses a browser extension manifest into a source-aware, explanation-aware model.

The product should preserve the original manifest source, render it in a split-view interface, and connect source ranges to contextual explanations. When users hover or select a manifest field, value, permission, object, or array item, the explanation panel should describe what that part of the manifest does.

The initial release should focus on explanation quality, source precision, and interaction clarity. Platform-independent architecture should be preserved so that future releases can reuse the same core engine and UI across web, VS Code, browser extensions, CLI, embeddable widgets, and other hosts.

## User Stories

1. As a browser extension developer, I want to paste a manifest into the app, so that I can quickly understand what its fields mean.
2. As a browser extension developer, I want to drag and drop a `manifest.json` file, so that I can inspect it without manually copying text.
3. As a browser extension developer, I want the original source formatting to be preserved, so that the manifest I inspect still looks like the file I wrote.
4. As a browser extension developer, I want to hover over a top-level manifest field, so that I can understand its purpose.
5. As a browser extension developer, I want to click a manifest field to pin its explanation, so that I can read the explanation without keeping my pointer in place.
6. As a browser extension developer, I want hovering another field to temporarily preview a different explanation, so that I can explore the manifest quickly.
7. As a browser extension developer, I want the pinned explanation to return when I stop hovering another field, so that I do not lose my place.
8. As a browser extension developer, I want to select a manifest field with the keyboard, so that I can use the tool without relying on a mouse.
9. As a browser extension developer using a touch device, I want to tap a manifest section to see its explanation, so that the product works without hover.
10. As a new extension developer, I want plain-language explanations, so that I can understand manifest concepts without already knowing browser extension terminology.
11. As an experienced extension developer, I want concise explanations for common fields, so that I can quickly confirm what an unfamiliar manifest is doing.
12. As a developer reviewing someone else’s extension, I want permission values to be explained, so that I can understand what capabilities the extension declares.
13. As a developer reviewing someone else’s extension, I want host permission sections to be explained, so that I can understand what sites or URL patterns the extension may interact with.
14. As a developer reading a manifest, I want `content_scripts` to be explained, so that I can understand when and where extension code runs.
15. As a developer reading a manifest, I want `background` to be explained, so that I can understand background execution behavior.
16. As a developer reading a manifest, I want `action`, `browser_action`, and `page_action` to be explained, so that I can understand browser toolbar behavior.
17. As a developer reading a manifest, I want `web_accessible_resources` to be explained, so that I can understand which packaged resources can be accessed by pages or extensions.
18. As a developer reading a manifest, I want `content_security_policy` to be explained, so that I can understand the security restrictions declared by the extension.
19. As a developer reading a manifest, I want `commands` to be explained, so that I can understand extension keyboard shortcuts.
20. As a developer reading a manifest, I want `options_ui` to be explained, so that I can understand how the extension exposes settings.
21. As a developer reading a manifest, I want `declarative_net_request` to be explained, so that I can understand declarative network filtering configuration.
22. As a developer reading a manifest, I want `manifest_version` to be explained, so that I can understand which extension platform version the file targets.
23. As a developer reading a manifest, I want common permission names like `tabs`, `activeTab`, `storage`, and `scripting` to be explained, so that I can understand the meaning of individual permission strings.
24. As a developer reading a manifest, I want unknown fields to remain selectable, so that the UI still helps me understand the source structure even when no manifest-specific explanation exists.
25. As a developer reading a manifest, I want unknown fields to have a clear fallback message, so that I know the tool did not silently fail.
26. As a developer reading a nested manifest section, I want to see a breadcrumb or path, so that I know where I am in the document.
27. As a developer reading a large manifest, I want the highlighted source range and explanation panel to stay synchronized, so that I can connect explanation to source.
28. As a privacy-conscious developer, I want the manifest to be processed locally, so that I do not have to upload extension configuration to a backend.
29. As a user working offline, I want the core explainer to function without a required network request, so that I can inspect manifests locally.
30. As a future platform integrator, I want the explanation engine to be independent from the UI host, so that it can later be reused in other environments.
31. As a future platform integrator, I want the explanation result to be serializable, so that it can later cross worker, extension, webview, or backend boundaries.
32. As a future UI integrator, I want the inspector UI to expose stable component contracts, so that another host can embed the explainer without depending on internals.
33. As a maintainer, I want explanation knowledge to be separate from rendering logic, so that explanations can be expanded and corrected without rewriting the UI.
34. As a maintainer, I want source-aware parsing behind an explicit parser contract, so that the parser can evolve without changing product behavior.
35. As a maintainer, I want common manifest fixtures, so that explanation behavior can be tested against realistic examples.

## Implementation Decisions

- The initial release is an explainer-first product, not a diagnostic-first product.
- The primary product object is an explanation-aware manifest model, not a validation report.
- The core processing flow should be:

  ```text
  source document
  → source-aware syntax tree
  → semantic manifest nodes
  → explanation resolution
  → immutable explanation snapshot
  → interactive UI
  ```

- The original source text should be preserved and rendered from source ranges rather than re-serialized JSON.
- The parser should produce enough source range information to associate keys, values, objects, arrays, and array items with semantic manifest nodes.
- The semantic model should recognize common manifest concepts such as fields, sections, permissions, host permissions, content scripts, background configuration, actions, commands, icons, and web-accessible resources.
- The explanation resolver should map semantic manifest nodes to explanation content.
- The explanation registry should be independent from the UI.
- Explanation content should support at least:
  - title,
  - summary,
  - details,
  - related fields,
  - examples where useful,
  - official documentation links where appropriate.
- Unknown or unsupported manifest fields should produce a graceful fallback explanation rather than breaking interaction.
- The UI should use a split-view layout with source on one side and explanation on the other.
- Hover should preview explanations.
- Click should pin explanations.
- Keyboard navigation should allow users to move through explainable semantic nodes.
- Touch interaction should use tap selection instead of hover.
- The app should not require a backend for initial release.
- Manifest contents should not be uploaded to a server for the initial release.
- The core engine should remain platform independent.
- Platform-specific features should be isolated behind host capabilities.
- The first launch may run the engine directly in the browser. Worker execution should remain possible later but is not required unless performance measurements justify it.
- Validation and diagnostics may be represented as future extension points, but they should not drive the initial launch experience.
- The initial release should not include automatic fixes, health scores, exportable diagnostic reports, or publishing-readiness scoring.

## Testing Decisions

- Tests should focus on external behavior rather than internal implementation details.
- Parser tests should verify that source ranges correctly map to keys, values, objects, arrays, nested sections, and permission strings.
- Semantic mapping tests should verify that common manifest fields become the expected semantic nodes.
- Explanation resolver tests should verify that known fields and permission values produce the expected explanation metadata.
- Unknown-field tests should verify that unsupported fields produce fallback explanations.
- Interaction tests should verify that hover previews an explanation, click pins an explanation, and leaving hover restores the pinned explanation.
- Keyboard interaction tests should verify that users can move between explainable nodes and pin or clear explanations.
- Accessibility tests should verify that hover is not the only way to access explanation content.
- Fixture tests should use realistic manifest examples, including:
  - minimal MV3 manifest,
  - manifest with permissions,
  - manifest with host permissions,
  - manifest with content scripts,
  - manifest with background service worker,
  - manifest with web-accessible resources,
  - manifest with unknown/custom fields,
  - partially invalid or incomplete manifest where source ranges can still be recovered.
- Performance tests should verify that normal extension manifests parse, resolve explanations, and render quickly enough for immediate interaction.
- Privacy behavior should be tested by ensuring the initial release does not send manifest content to remote services.

## Out of Scope

The following are out of scope for the initial release:

- Complete schema validation.
- Severity-based diagnostics.
- Manifest health score.
- Publishing-readiness report.
- Automatic fixes.
- Quick fixes.
- MV2-to-MV3 conversion.
- Full browser compatibility matrix.
- CI integration.
- CLI.
- VS Code extension.
- Browser extension packaging.
- Desktop shell.
- User accounts.
- Cloud storage.
- Public share links.
- AI-generated explanations.
- Remote manifest analysis.
- Project-wide extension source-code analysis.
- Runtime behavior tracing.
- Complete extension security auditing.

These capabilities may be considered after the explainer experience proves useful.

## Further Notes

The initial launch should remain focused on one product promise:

> Hover your manifest. Understand every field.

The architecture should still support future portability, but the launch should not be delayed by building every host integration upfront.

The first release should be judged by whether users can quickly understand a manifest in context, not by whether the product catches every possible manifest issue.

Diagnostics, compatibility checks, recommendations, and fixes are natural future layers once the explanation-aware AST and source-linked interaction model are successful.
