import { type Locator, type Page, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const FIXTURES_DIR = resolve(process.cwd(), "fixtures", "manifests");
const COMPREHENSIVE_FIXTURE = "comprehensive-all-browsers.json";

export function readFixture(name: string): string {
  return readFileSync(resolve(FIXTURES_DIR, name), "utf-8");
}

let _fixtureText: string | null = null;

export function readComprehensiveFixture(): string {
  if (_fixtureText === null) {
    _fixtureText = readFixture(COMPREHENSIVE_FIXTURE);
  }
  return _fixtureText;
}

export const FIXTURE_PATH = resolve(FIXTURES_DIR, COMPREHENSIVE_FIXTURE);

export const INVALID_JSON = `{ "manifest_version": 3, "name": "Broken", "permissions": ["tabs", }`;

export const FIELD_TITLES: Record<string, string> = {
  manifest_version: "Manifest Version",
  permissions: "Permissions",
  host_permissions: "Host Permissions",
  content_scripts: "Content Scripts",
  background: "Background",
  action: "Action (Toolbar Button)",
  version: "Extension Version",
};

export const FALLBACK_TITLE = "Unknown Field";

export const FALLBACK_SUMMARY_PATTERN = /not one of the standard|unrecognized|unsupported|no documentation/i;

export function locators(page: Page) {
  return {
    header: page.locator("header"),
    brandName: page.locator(".brand-name"),
    clearButton: page.locator("#clear-button"),
    uploadButton: page.locator(".upload-button"),
    fileInput: page.locator("#file-input"),

    inspector: page.locator("manifest-inspector"),
    emptyGlyph: page.locator("manifest-inspector").locator(".empty-glyph"),
    emptyHeading: page.locator("manifest-inspector").locator(".empty-state h2"),
    emptyNote: page.locator("manifest-inspector").locator(".empty-state p"),
    explanationEmpty: page.locator("manifest-inspector").locator(".explanation-empty"),
    sourceFrame: page.locator("manifest-inspector").locator(".source-frame"),
    sourceRegion: page.locator("manifest-inspector").locator('[part="source-region"]'),
    sourcePane: page.locator("manifest-inspector").locator('[part="source-pane"]'),
    sourcePre: page.locator("manifest-inspector").locator("pre.source-pre"),
    sourceGutter: page.locator("manifest-inspector").locator(".source-gutter"),
    sourceNode: (ariaLabel: string) =>
      page
        .locator("manifest-inspector")
        .locator(`[role="option"][aria-label="${ariaLabel}"].is-representative`),
    sourceNodes: () =>
      page.locator("manifest-inspector").locator('.source-node:not(.is-structural)'),
    sourcePinned: () =>
      page.locator("manifest-inspector").locator(".source-node.is-pinned"),
    explanationPane: page.locator("manifest-inspector").locator('[part="explanation-panel"]'),
    explanationTitle: page.locator("manifest-inspector").locator(".explanation-title"),
    explanationSummary: page.locator("manifest-inspector").locator(".explanation-summary"),
    explanationEyebrow: page.locator("manifest-inspector").locator(".explanation-eyebrow"),
    explanationDetails: page.locator("manifest-inspector").locator(".explanation-details"),
    explanationDocs: page.locator("manifest-inspector").locator(".explanation-docs"),
    explanationExamples: page.locator("manifest-inspector").locator(".explanation-examples"),
    paneHeader: page.locator("manifest-inspector").locator(".pane-header"),
    paneTitle: page.locator("manifest-inspector").locator(".pane-title"),
    mobileInlineCard: page.locator("manifest-inspector").locator(".mobile-inline-card"),
  };
}

export async function loadFixtureViaPaste(page: Page, text: string) {
  await page.evaluate((fixtureText) => {
    const pasteEvent = new Event("paste", {
      bubbles: true,
      cancelable: true,
    }) as ClipboardEvent;
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: { getData: () => fixtureText },
    });
    document.dispatchEvent(pasteEvent);
  }, text);
  const l = locators(page);
  await expect(l.sourcePre).toBeVisible({ timeout: 5000 });
}

export function sourceNodeLabel(fieldName: string): string {
  return `${fieldName} (${fieldName})`;
}

export const SCREENSHOT_DIR = "test-results/screenshots";
