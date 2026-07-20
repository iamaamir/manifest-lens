import { test, expect } from "@playwright/test";
import {
  locators,
  readComprehensiveFixture,
  SCREENSHOT_DIR,
  loadFixtureViaPaste,
} from "./helpers";

const FIXTURE = readComprehensiveFixture();

test.describe("1. Empty Observatory Shell", () => {
  test("page loads with header, empty state, and explanation placeholder, no form dock", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const l = locators(page);

    await expect(l.header).toBeVisible();
    await expect(l.brandName).toHaveText("Manifest Lens");
    await expect(l.uploadButton).toBeVisible();

    await expect(l.clearButton).toBeHidden();
    await expect(l.clearButton).toHaveAttribute("hidden", "");

    await expect(l.emptyGlyph).toBeVisible();
    await expect(l.emptyGlyph.locator("svg")).toHaveAttribute("viewBox", "0 0 48 48");
    await expect(l.emptyGlyph).not.toContainText("{ }");

    const emptyGlyphBox = await l.emptyGlyph.boundingBox();
    expect(emptyGlyphBox?.width).toBeCloseTo(48, 0);
    expect(emptyGlyphBox?.height).toBeCloseTo(48, 0);

    await expect(l.emptyHeading).toHaveText("Drop a manifest.json");
    await expect(l.emptyNote).toBeVisible();
    await expect(l.explanationEmpty).toBeVisible();
    await expect(l.explanationEmpty).toContainText("Hover any field");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-empty-viewport.png`,
    });
  });
});

test.describe("2. Load Comprehensive Fixture via Paste", () => {
  test("loads fixture via page-level paste and renders source with explanation panel, clear visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    await loadFixtureViaPaste(page, FIXTURE);

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

    await expect(l.clearButton).toBeVisible();
    await expect(l.clearButton).not.toHaveAttribute("hidden");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-loaded-top-viewport.png`,
    });
  });
});

test.describe("3. No Visible Form Dock", () => {
  test("no textarea, PASTE MANIFEST JSON label, or Analyze button visible in empty or loaded UI", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("textarea")).toHaveCount(0);
    await expect(page.locator('[id*="manifest-input"]')).toHaveCount(0);
    await expect(page.locator("text=PASTE MANIFEST JSON")).toHaveCount(0);
    await expect(page.locator("text=Analyze locally")).toHaveCount(0);

    await loadFixtureViaPaste(page, FIXTURE);

    await expect(page.locator("textarea")).toHaveCount(0);
    await expect(page.locator("text=PASTE MANIFEST JSON")).toHaveCount(0);
    await expect(page.locator("text=Analyze locally")).toHaveCount(0);
  });
});

test.describe("4. Viewport-Bound Desktop Shell", () => {
  test("body is not document-height driven, sourcePane has internal scroll, page scrollY remains 0", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    expect(bodyHeight).toBeLessThan(2000);

    const sourceScrollable = await page.evaluate(() => {
      const inspector = document.querySelector("manifest-inspector");
      if (!inspector || !inspector.shadowRoot) return false;
      const frame = inspector.shadowRoot.querySelector(
        ".source-frame",
      ) as HTMLElement;
      if (!frame) return false;
      return frame.scrollHeight > frame.clientHeight;
    });
    expect(sourceScrollable).toBe(true);

    await page.evaluate(() => {
      const inspector = document.querySelector("manifest-inspector");
      if (!inspector || !inspector.shadowRoot) return;
      const frame = inspector.shadowRoot.querySelector(
        ".source-frame",
      ) as HTMLElement;
      if (frame) frame.scrollTop = frame.scrollHeight;
    });

    const pageScrollY = await page.evaluate(() => window.scrollY);
    expect(pageScrollY).toBe(0);
  });
});

test.describe("4a. Clear Button Visibility Lifecycle", () => {
  test("clear button hidden before load, visible after load, hidden after clear", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const l = locators(page);

    await expect(l.clearButton).toBeHidden();
    await expect(l.clearButton).toHaveAttribute("hidden");

    await loadFixtureViaPaste(page, FIXTURE);

    await expect(l.clearButton).toBeVisible();
    await expect(l.clearButton).not.toHaveAttribute("hidden");

    await l.clearButton.click();

    await expect(l.clearButton).toBeHidden();
    await expect(l.clearButton).toHaveAttribute("hidden");
    await expect(l.emptyGlyph).toBeVisible();
  });
});

test.describe("4b. File Input Is Hidden", () => {
  test("native file input is not visible or layout-affecting", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const l = locators(page);
    const input = l.fileInput;

    await expect(input).toHaveClass(/visually-hidden/);
    await expect(input).toHaveAttribute("type", "file");

    const dimensions = await page.evaluate(() => {
      const input = document.querySelector("#file-input") as HTMLElement;
      if (!input) return { width: 0, height: 0 };
      const rect = input.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    expect(dimensions.width).toBeLessThanOrEqual(1);
    expect(dimensions.height).toBeLessThanOrEqual(1);
  });
});
