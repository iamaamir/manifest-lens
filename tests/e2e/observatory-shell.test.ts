import { test, expect } from "@playwright/test";
import {
  locators,
  readComprehensiveFixture,
  SCREENSHOT_DIR,
  loadFixtureViaTextarea,
} from "./helpers";

const FIXTURE = readComprehensiveFixture();

test.describe("1. Empty Observatory Shell", () => {
  test("page loads with header, empty state, and explanation placeholder", async ({
    page,
  }) => {
    await page.goto("/");

    const l = locators(page);

    await expect(l.header).toBeVisible();
    await expect(l.brandName).toHaveText("Manifest Inspector");
    await expect(l.headerStatus).toBeVisible();
    await expect(l.manifestInput).toBeVisible();
    await expect(l.analyzeButton).toBeVisible();
    await expect(l.clearButton).toBeVisible();

    await expect(l.emptyGlyph).toBeVisible();
    await expect(l.emptyHeading).toHaveText("Drop a manifest.json");
    await expect(l.emptyNote).toBeVisible();
    await expect(l.explanationEmpty).toBeVisible();
    await expect(l.explanationEmpty).toContainText("Hover any field");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/empty-observatory.png`,
      fullPage: true,
    });
  });
});

test.describe("2. Load Comprehensive Fixture", () => {
  test("loads fixture via textarea and renders source with explanation panel", async ({
    page,
  }) => {
    await page.goto("/");

    await loadFixtureViaTextarea(page, FIXTURE);

    const l = locators(page);

    const sourceText = await l.sourcePre.textContent();
    expect(sourceText).toContain("manifest_version");
    expect(sourceText).toContain("permissions");
    expect(sourceText).toContain("content_scripts");
    expect(sourceText).toContain("x_custom_metadata");

    const gutterLines = await l.sourceGutter.locator("li").count();
    expect(gutterLines).toBeGreaterThan(1);

    await expect(l.explanationTitle).toBeVisible();
    const titleText = await l.explanationTitle.textContent();
    expect(titleText).toBeTruthy();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/comprehensive-loaded-top.png`,
      fullPage: true,
    });
  });
});
