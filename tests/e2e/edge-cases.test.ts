import { test, expect } from "@playwright/test";
import {
  locators,
  readComprehensiveFixture,
  INVALID_JSON,
  loadFixtureViaPaste,
  sourceNodeLabel,
  SCREENSHOT_DIR,
} from "./helpers";

const FIXTURE = readComprehensiveFixture();

test.describe("14. Invalid-After-Valid Regression", () => {
  test("loading invalid JSON after valid clears stale content", async ({
    page,
  }) => {
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);

    const sourceBefore = await l.sourcePre.textContent();
    expect(sourceBefore).toContain("manifest_version");

    await page.evaluate((invalidText) => {
      const pasteEvent = new Event("paste", {
        bubbles: true,
        cancelable: true,
      }) as ClipboardEvent;
      Object.defineProperty(pasteEvent, "clipboardData", {
        value: { getData: () => invalidText },
      });
      document.dispatchEvent(pasteEvent);
    }, INVALID_JSON);

    await expect(l.sourcePre).not.toBeAttached({ timeout: 3000 });
    await expect(l.emptyHeading).toBeVisible();
  });
});

test.describe("15. Mobile/Narrow Viewport", () => {
  test("truly empty mobile viewport at 390x844 with no form dock, no side-by-side panel", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const l = locators(page);

    await expect(page.locator("textarea")).toHaveCount(0);

    await expect(l.emptyGlyph).toBeVisible();
    await expect(l.emptyHeading).toHaveText("Drop a manifest.json");
    await expect(l.emptyNote).toBeVisible();

    await expect(l.explanationPane).not.toBeVisible();

    const hasExplanationPane = await page.evaluate(() => {
      const inspector = document.querySelector("manifest-inspector");
      if (!inspector || !inspector.shadowRoot) return true;
      const pane = inspector.shadowRoot.querySelector(".explanation-pane");
      return pane !== null;
    });
    expect(hasExplanationPane).toBe(true);

    const hasHorizontalScroll =
      (await page.evaluate(() => document.documentElement.scrollWidth)) >
      (await page.evaluate(() => document.documentElement.clientWidth)) + 5;
    expect(hasHorizontalScroll).toBe(false);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/mobile-empty-viewport-390x844.png`,
    });
  });

  test("loaded mobile viewport shows inline card after tapping field", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);

    await expect(l.sourcePre).toBeVisible();
    await expect(l.explanationPane).not.toBeVisible();

    const fieldNode = l.sourceNode(sourceNodeLabel("manifest_version"));
    await fieldNode.click();
    await expect(l.mobileInlineCard).toBeVisible();
    await expect(l.mobileInlineCard.locator(".explanation-eyebrow")).toBeVisible();
    await expect(l.mobileInlineCard.locator(".explanation-title")).toHaveText("Manifest Version", { timeout: 3000 });
    await expect(l.mobileInlineCard.locator(".explanation-summary")).toBeVisible();

    const fieldBox = await fieldNode.boundingBox();
    const cardBox = await l.mobileInlineCard.boundingBox();
    expect(fieldBox).not.toBeNull();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.y).toBeGreaterThan(fieldBox!.y);
    expect(cardBox!.y - fieldBox!.y).toBeLessThan(120);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/mobile-loaded-selected-inline-card-390x844.png`,
    });
  });
});

test.describe("16. Local-Only Privacy Guard", () => {
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
    await loadFixtureViaPaste(page, FIXTURE);

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
