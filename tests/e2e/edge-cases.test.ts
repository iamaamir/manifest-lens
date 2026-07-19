import { test, expect } from "@playwright/test";
import {
  locators,
  readComprehensiveFixture,
  INVALID_JSON,
  loadFixtureViaTextarea,
  sourceNodeLabel,
  SCREENSHOT_DIR,
} from "./helpers";

const FIXTURE = readComprehensiveFixture();

test.describe("8. Invalid-After-Valid Regression", () => {
  test("loading invalid JSON after valid clears stale content", async ({
    page,
  }) => {
    await page.goto("/");
    await loadFixtureViaTextarea(page, FIXTURE);

    const l = locators(page);

    const sourceBefore = await l.sourcePre.textContent();
    expect(sourceBefore).toContain("manifest_version");

    await l.manifestInput.fill(INVALID_JSON);
    await l.analyzeButton.click();
    await expect(l.statusMessage).toHaveAttribute("data-kind", "error", { timeout: 3000 });

    await expect(l.sourcePre).not.toBeAttached();
    await expect(l.emptyHeading).toBeVisible();
  });
});

test.describe("9. Mobile/Narrow Viewport", () => {
  test("narrow viewport renders source and explanation without overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await loadFixtureViaTextarea(page, FIXTURE);

    const l = locators(page);

    await expect(l.sourceFrame).toBeVisible();
    await expect(l.explanationPane).toBeVisible();

    const sourceText = await l.sourcePre.textContent();
    expect(sourceText).toContain("manifest_version");

    const hasHorizontalScroll =
      (await page.evaluate(() => document.documentElement.scrollWidth)) >
      (await page.evaluate(() => document.documentElement.clientWidth)) + 5;
    expect(hasHorizontalScroll).toBe(false);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/mobile-viewport-390x844.png`,
      fullPage: true,
    });
  });
});

test.describe("10. Local-Only Privacy Guard", () => {
  test("no unexpected network requests contain manifest content", async ({
    page,
  }) => {
    const requests: string[] = [];
    const requestBodies: string[] = [];

    await page.route("**/*", (route) => {
      const url = route.request().url();
      requests.push(url);
      const postData = route.request().postData();
      if (postData) requestBodies.push(postData);
      route.continue();
    });

    await page.goto("/");
    await loadFixtureViaTextarea(page, FIXTURE);

    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("manifest_version")).click();
    await expect(l.explanationTitle).toHaveText("Manifest Version", { timeout: 3000 });

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(l.sourcePinned().first()).toBeVisible({ timeout: 3000 });

    for (const url of requests) {
      const parsed = new URL(url);
      const isLocal =
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "localhost" ||
        parsed.hostname === "[::1]";
      const isWs = parsed.protocol === "ws:" || parsed.protocol === "wss:";
      expect(isLocal || isWs).toBe(true);
    }

    for (const body of requestBodies) {
      expect(body).not.toContain("manifest_version");
      expect(body).not.toContain("__MSG_extensionName__");
    }
  });
});
