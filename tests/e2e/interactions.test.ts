import { test, expect } from "@playwright/test";
import {
  locators,
  readComprehensiveFixture,
  loadFixtureViaTextarea,
  loadFixtureViaPaste,
  sourceNodeLabel,
  FALLBACK_TITLE,
  FALLBACK_SUMMARY_PATTERN,
  SCREENSHOT_DIR,
} from "./helpers";

const FIXTURE = readComprehensiveFixture();

test.describe("3. Known Field Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loadFixtureViaTextarea(page, FIXTURE);
  });

  test("click manifest_version shows correct explanation", async ({ page }) => {
    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("manifest_version")).click();
    await expect(l.explanationTitle).toHaveText("Manifest Version", { timeout: 3000 });
    await expect(l.explanationBreadcrumb).toBeVisible();
    await expect(l.explanationBreadcrumb).toHaveText("manifest_version");
    await expect(l.explanationSummary).toBeVisible();
  });

  test("click permissions shows correct explanation", async ({ page }) => {
    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("permissions")).click();
    await expect(l.explanationTitle).toHaveText("Permissions", { timeout: 3000 });
    await expect(l.explanationBreadcrumb).toBeVisible();
    await expect(l.explanationBreadcrumb).toHaveText("permissions");
    await expect(l.explanationSummary).toBeVisible();
  });

  test("click host_permissions shows correct explanation", async ({ page }) => {
    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("host_permissions")).click();
    await expect(l.explanationTitle).toHaveText("Host Permissions", { timeout: 3000 });
    await expect(l.explanationBreadcrumb).toBeVisible();
    await expect(l.explanationBreadcrumb).toHaveText("host_permissions");
    await expect(l.explanationSummary).toBeVisible();
  });

  test("click content_scripts shows correct explanation", async ({ page }) => {
    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("content_scripts")).click();
    await expect(l.explanationTitle).toHaveText("Content Scripts", { timeout: 3000 });
    await expect(l.explanationBreadcrumb).toBeVisible();
    await expect(l.explanationBreadcrumb).toHaveText("content_scripts");
    await expect(l.explanationSummary).toBeVisible();
  });

  test("click background shows correct explanation", async ({ page }) => {
    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("background")).click();
    await expect(l.explanationTitle).toHaveText("Background", { timeout: 3000 });
    await expect(l.explanationBreadcrumb).toBeVisible();
    await expect(l.explanationBreadcrumb).toHaveText("background");
    await expect(l.explanationSummary).toBeVisible();
  });

  test("click action shows correct explanation", async ({ page }) => {
    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("action")).click();
    await expect(l.explanationTitle).toHaveText("Action (Toolbar Button)", { timeout: 3000 });
    await expect(l.explanationBreadcrumb).toBeVisible();
    await expect(l.explanationBreadcrumb).toHaveText("action");
    await expect(l.explanationSummary).toBeVisible();
  });

  test("different fields show different explanation titles", async ({ page }) => {
    const l = locators(page);

    await l.sourceNode(sourceNodeLabel("manifest_version")).click();
    await expect(l.explanationTitle).toHaveText("Manifest Version", { timeout: 3000 });

    const firstTitle = await l.explanationTitle.textContent();

    await l.sourceNode(sourceNodeLabel("permissions")).click();
    await expect(l.explanationTitle).toHaveText("Permissions", { timeout: 3000 });

    const secondTitle = await l.explanationTitle.textContent();
    expect(firstTitle).not.toBe(secondTitle);
  });
});

test.describe("4. Scroll and Deep-Field Behavior", () => {
  test("scrolls to deep field and asserts explanation panel updates", async ({
    page,
  }) => {
    await page.goto("/");
    await loadFixtureViaTextarea(page, FIXTURE);

    const l = locators(page);

    await page.evaluate(() => {
      const inspector = document.querySelector("manifest-inspector");
      if (!inspector || !inspector.shadowRoot) return;
      const sourcePane = inspector.shadowRoot.querySelector(
        '[part="source-pane"]',
      ) as HTMLElement;
      if (sourcePane) sourcePane.scrollTop = sourcePane.scrollHeight;
    });

    const deepNode = l.sourceNode(sourceNodeLabel("x_custom_metadata"));
    await deepNode.scrollIntoViewIfNeeded();
    await deepNode.click();
    await expect(l.explanationTitle).toHaveText(FALLBACK_TITLE, { timeout: 3000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/deep-field-scrolled.png`,
      fullPage: true,
    });
  });
});

test.describe("5. Unknown/Custom Fallback", () => {
  test("x_custom_metadata shows unrecognized field fallback", async ({
    page,
  }) => {
    await page.goto("/");
    await loadFixtureViaTextarea(page, FIXTURE);

    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("x_custom_metadata")).click();
    await expect(l.explanationTitle).toHaveText(FALLBACK_TITLE, { timeout: 3000 });
    await expect(l.explanationSummary).toContainText(FALLBACK_SUMMARY_PATTERN);
  });
});

test.describe("6. Pin/Preview/Restore", () => {
  test("pin field A, hover field B, leave restores A's explanation", async ({
    page,
  }) => {
    await page.goto("/");
    await loadFixtureViaTextarea(page, FIXTURE);

    const l = locators(page);

    const nodeA = l.sourceNode(sourceNodeLabel("manifest_version"));
    const nodeB = l.sourceNode(sourceNodeLabel("version"));

    await nodeA.click();
    await expect(l.explanationTitle).toHaveText("Manifest Version", { timeout: 3000 });
    const pinnedTitle = await l.explanationTitle.textContent();

    await nodeB.hover();
    await expect(l.explanationTitle).toHaveText("Extension Version", { timeout: 3000 });
    const hoverTitle = await l.explanationTitle.textContent();
    expect(hoverTitle).not.toBe(pinnedTitle);

    await l.sourcePane.hover({ position: { x: 0, y: 0 }, force: true });
    await expect(l.explanationTitle).toHaveText("Manifest Version", { timeout: 3000 });
    const restoredTitle = await l.explanationTitle.textContent();
    expect(restoredTitle).toBe(pinnedTitle);
  });
});

test.describe("7. Keyboard Path", () => {
  test("keyboard navigation selects and pins a field via Arrow+Enter", async ({
    page,
  }) => {
    await page.goto("/");
    await loadFixtureViaTextarea(page, FIXTURE);

    const l = locators(page);
    await l.sourceRegion.focus();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(l.sourcePinned().first()).toBeVisible({ timeout: 3000 });
  });

  test("Space pin and Escape clear works", async ({ page }) => {
    await page.goto("/");
    await loadFixtureViaTextarea(page, FIXTURE);

    const l = locators(page);
    await l.sourceRegion.focus();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press(" ");

    await expect(l.sourcePinned().first()).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Escape");
    await expect(l.sourcePinned()).toHaveCount(0, { timeout: 3000 });
  });
});

test.describe("Paste flow", () => {
  test("dispatched paste event loads the fixture", async ({ page }) => {
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);
    await expect(l.sourcePre).toBeVisible();
    const sourceText = await l.sourcePre.textContent();
    expect(sourceText).toContain("manifest_version");
    expect(sourceText).toContain("x_custom_metadata");
  });
});
