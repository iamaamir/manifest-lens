# Task Brief — Phase 5 Playwright E2E Setup

## Completion

Completed by external OpenCode E2E/UX QA agent and coordinator-reviewed on 2026-07-19.

Delivered:

- `@playwright/test` setup with root E2E scripts.
- `playwright.config.ts` with Vite `webServer` and Chromium/headless defaults.
- 20 Playwright E2E tests under `tests/e2e/`.
- Coverage for empty shell, comprehensive fixture load, known field interactions, deep scroll, unknown fallback, pin/preview/restore, keyboard path, paste, upload, drag/drop text, invalid-after-valid, mobile viewport, and local-only privacy.
- Screenshot artifacts generated under ignored `test-results/screenshots/` for designer review.

Coordinator validation passed:

```sh
npm run typecheck
npm run test                    # 8 files, 151 tests
npm run build
npm run build --workspace=@manifest-lens/web
npm run e2e                     # 20 passed
npx playwright install chromium # completed during setup
git diff --check
```

Note: `.gitignore` and `vitest.config.ts` were adjusted as mechanical integration changes so Playwright artifacts stay untracked and Vitest does not try to execute Playwright tests.

## Context

Phase 5 is the Web Components UI MVP and is currently in a design-led Observatory reset. The product is a local-first Web Extension Manifest Explainer.

North star:

> Hover your manifest. Understand every field.

The UI design source of truth is:

```text
design.md
```

The design-led loop is defined in:

```text
docs/agents/ui-design-loop.md
```

This task creates the first Playwright E2E foundation and headless UX artifact path for the loop. It must validate the current implemented UI behavior without expanding product scope.

External agents must read `docs/agents/external-quickstart.md` before this brief.

## Assigned Role

External OpenCode agent acting as E2E/UX QA Engineer.

Load and follow:

```text
docs/agents/roles/e2e-ux-qa-engineer.md
```

## Goal

Add Playwright E2E test infrastructure and an initial comprehensive test suite that exercises the current Observatory UI with:

```text
fixtures/manifests/comprehensive-all-browsers.json
```

The suite must run headlessly and produce screenshots/artifacts useful for Product Designer review.

## In Scope

- Add Playwright Test as a dev dependency at the root if missing.
- Add root npm scripts for E2E execution/reporting.
- Add `playwright.config.ts` using a Vite web server for `apps/web`.
- Add E2E tests under `tests/e2e/`.
- Use Chromium/headless by default for the first setup; do not configure all browsers yet unless trivial and stable.
- Use Playwright screenshots/traces for evidence.
- Use robust user-facing locators where possible; use shadow-DOM-piercing locators where needed.
- Test current implemented behavior only. If a `design.md` feature is deferred/not implemented, record it as a follow-up instead of forcing the product code to add it.
- If absolutely necessary for stable E2E selectors, add minimal accessibility/test-friendly attributes to product code, but only when they are user-meaningful and inside the write scope.

## Out of Scope

- Do not redesign the UI.
- Do not implement missing `design.md` features such as full collapsible tree, depth collapse, mobile inline explanation cards, load sample, help popover, mixed-version banners, deprecated warnings, related-field links, or large-file spinner.
- Do not add diagnostics, fixes, health scores, security audits, compatibility matrices, report export, AI-generated explanations, backend/remote analysis, browser extension packaging, VS Code, CLI, worker mode, or new hosts.
- Do not add visual snapshot baselines yet.
- Do not commit screenshots to docs unless the coordinator explicitly asks after review.
- Do not use Lavish.

## Files / Write Scope

Primary write scope:

- `package.json`
- `package-lock.json`
- `playwright.config.ts`
- `tests/e2e/**`

Conditional write scope only if needed for stable, user-meaningful selectors or missing accessible names:

- `packages/ui-components/src/index.ts`
- `packages/ui-components/src/index.test.ts`
- `packages/host-web/src/index.ts`
- `packages/host-web/src/index.test.ts`
- `apps/web/index.html`
- `apps/web/src/main.ts`

If you touch conditional product-code files, keep changes minimal, preserve behavior, and update existing unit/component tests if needed.

The coordinator must not edit these implementation/test files directly; assigned implementation agent owns this write scope.

## Expected Playwright Setup

Use current Playwright conventions:

- `defineConfig` from `@playwright/test`
- `webServer` to launch the Vite app, for example:

  ```ts
  webServer: {
    command: "npm run dev --workspace=@manifest-lens/web -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  }
  ```

- `use.screenshot` should retain useful failure screenshots.
- `use.trace` should retain traces on failure or first retry.
- Keep `test-results/` and `playwright-report/` as generated artifacts, not source docs.

## Required E2E Coverage

Create helper utilities where useful, but keep them simple.

At minimum, cover:

1. **Empty Observatory shell**
   - page loads;
   - header/app landmark exists;
   - empty/drop/paste/upload guidance is visible;
   - explanation placeholder is visible;
   - capture screenshot.

2. **Load comprehensive fixture**
   - load `fixtures/manifests/comprehensive-all-browsers.json` via page-level paste or upload;
   - assert source pane displays preserved manifest content such as `manifest_version`, `permissions`, `content_scripts`, and `x_custom_metadata`;
   - assert line-number/source treatment is visible if current UI exposes it;
   - assert explanation panel exists;
   - capture screenshot near top.

3. **Known field interactions**
   - select/click at least `manifest_version`, `permissions`, `host_permissions`, `content_scripts`, `background`, and `action` if reachable in current UI;
   - assert the right panel changes to the selected field's explanation or visible field/path/title text.

4. **Scroll and deep-field behavior**
   - scroll the left/source pane to a lower field such as `browser_specific_settings`, `theme`, or `x_custom_metadata`;
   - assert the field becomes visible and selectable;
   - assert the explanation panel updates;
   - capture screenshot of the scrolled/deep state.

5. **Unknown/custom fallback**
   - select `x_custom_metadata` or a nested custom key;
   - assert a clear unknown/unrecognized/no-documentation fallback is visible.

6. **Pin/preview/restore if currently supported in browser E2E**
   - pin field A;
   - hover/focus field B;
   - leave/restore;
   - assert field A's explanation returns.

7. **Keyboard path**
   - focus the source interaction region;
   - use Arrow navigation;
   - use Enter or Space to select/pin;
   - use Escape to clear if current UI supports it;
   - assert visible focus/active behavior through accessible or visual state available to Playwright.

8. **Invalid-after-valid regression**
   - load a valid comprehensive fixture;
   - then input invalid JSON through a supported route;
   - assert stale source/explanation/pin content clears and the invalid JSON state is visible.

9. **Mobile/narrow viewport**
   - run a scenario at a narrow viewport such as 390×844;
   - load the comprehensive fixture;
   - assert source and explanation remain reachable and no obvious horizontal overflow blocks use;
   - capture screenshot.

10. **Local-only privacy guard**
    - observe requests during load/interactions;
    - allow Vite/local app asset requests;
    - assert no request body or unexpected external request contains manifest content from the fixture;
    - do not click external documentation links.

## Acceptance Criteria

- [ ] `npm run e2e` runs Playwright headlessly.
- [ ] `npm run e2e:report` or equivalent opens/reports Playwright output.
- [ ] Playwright config starts/reuses the Vite app through `webServer`.
- [ ] Tests use `fixtures/manifests/comprehensive-all-browsers.json` as the primary payload.
- [ ] Tests cover left/source pane click, scroll, visibility, and synchronization with right/explanation panel.
- [ ] Tests cover keyboard path and at least one mobile/narrow viewport scenario.
- [ ] Tests capture screenshots for designer review.
- [ ] Tests do not add product features beyond current scope.
- [ ] Existing validation still passes, or any failure is reported with exact output and likely cause.

## Known Traps / Common Failure Modes

- Do not reserialize manifest JSON for display or test convenience.
- Do not inject fixture/source content with raw `innerHTML`.
- Do not make tests pass by weakening UI behavior or hiding bugs.
- Do not add `data-testid` everywhere. Prefer accessible names/text/roles; add stable attributes only if needed and minimal.
- Playwright can query open shadow DOM, but selectors must remain maintainable.
- Do not assume all `design.md` features are implemented. Test current behavior and report deferred design gaps.
- Do not require headed/manual testing for acceptance.
- Do not hardcode a random port different from the Vite default unless config requires it.
- Do not perform external network requests as part of tests.

## Validation

Run as much as possible and report exact results:

```sh
npm run typecheck
npm run test
npm run build
npm run build --workspace=@manifest-lens/web
npx playwright install chromium
npm run e2e
```

If browser installation is already satisfied, say so. If Playwright browser install fails due to environment/network, report the exact failure and still run non-browser validation.

## Quality Gate

The coordinator will synthesize this work and may send it through review/QA before commit. Passing local validation does not by itself mean the task is accepted.

Before returning, external agents must complete `docs/agents/templates/external-self-review.md`.

## Reporting Requirements

Return:

- summary
- files changed
- E2E scenarios added
- screenshots/artifacts produced and paths
- validation command results with exact pass/fail output
- self-review checklist result
- risks/follow-ups, especially deferred `design.md` gaps
- proposed `docs/journey/memory.md` update
