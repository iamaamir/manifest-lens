import { test, expect } from "@playwright/test";
import {
  locators,
  readComprehensiveFixture,
  loadFixtureViaPaste,
  sourceNodeLabel,
  FALLBACK_TITLE,
  FALLBACK_SUMMARY_PATTERN,
  SCREENSHOT_DIR,
} from "./helpers";

const FIXTURE = readComprehensiveFixture();

test.describe("5. Known Field Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);
  });

  test("click manifest_version shows correct explanation", async ({ page }) => {
    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("manifest_version")).click();
    await expect(l.explanationTitle).toHaveText("Manifest Version", { timeout: 3000 });
    await expect(l.explanationEyebrow).toBeVisible();
    await expect(l.explanationEyebrow).toHaveText("TOP-LEVEL FIELD");
    await expect(l.explanationSummary).toBeVisible();
  });

  test("click permissions shows correct explanation", async ({ page }) => {
    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("permissions")).click();
    await expect(l.explanationTitle).toHaveText("Permissions", { timeout: 3000 });
    await expect(l.explanationEyebrow).toBeVisible();
    await expect(l.explanationEyebrow).toHaveText("TOP-LEVEL FIELD");
    await expect(l.explanationSummary).toBeVisible();
  });

  test("click host_permissions shows correct explanation", async ({ page }) => {
    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("host_permissions")).click();
    await expect(l.explanationTitle).toHaveText("Host Permissions", { timeout: 3000 });
    await expect(l.explanationEyebrow).toBeVisible();
    await expect(l.explanationEyebrow).toHaveText("TOP-LEVEL FIELD");
    await expect(l.explanationSummary).toBeVisible();
  });

  test("click content_scripts shows correct explanation", async ({ page }) => {
    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("content_scripts")).click();
    await expect(l.explanationTitle).toHaveText("Content Scripts", { timeout: 3000 });
    await expect(l.explanationEyebrow).toBeVisible();
    await expect(l.explanationEyebrow).toHaveText("TOP-LEVEL FIELD");
    await expect(l.explanationSummary).toBeVisible();
  });

  test("click background shows correct explanation", async ({ page }) => {
    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("background")).click();
    await expect(l.explanationTitle).toHaveText("Background", { timeout: 3000 });
    await expect(l.explanationEyebrow).toBeVisible();
    await expect(l.explanationEyebrow).toHaveText("TOP-LEVEL FIELD");
    await expect(l.explanationSummary).toBeVisible();
  });

  test("click action shows correct explanation", async ({ page }) => {
    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("action")).click();
    await expect(l.explanationTitle).toHaveText("Action (Toolbar Button)", { timeout: 3000 });
    await expect(l.explanationEyebrow).toBeVisible();
    await expect(l.explanationEyebrow).toHaveText("TOP-LEVEL FIELD");
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

test.describe("6. Scroll and Deep-Field Behavior", () => {
  test("scrolls source pane to deep field, explanation stays visible, selects deep field, page scrollY remains 0", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);

    await page.evaluate(() => {
      const inspector = document.querySelector("manifest-inspector");
      if (!inspector || !inspector.shadowRoot) return;
      const sourcePane = inspector.shadowRoot.querySelector(
        '[part="source-pane"]',
      ) as HTMLElement;
      if (sourcePane) sourcePane.scrollTop = sourcePane.scrollHeight;
    });

    const pageScrollY = await page.evaluate(() => window.scrollY);
    expect(pageScrollY).toBe(0);

    const deepNode = l.sourceNode(sourceNodeLabel("x_custom_metadata"));
    await deepNode.scrollIntoViewIfNeeded();
    await deepNode.click();
    await expect(l.explanationTitle).toHaveText(FALLBACK_TITLE, { timeout: 3000 });

    const pageScrollYAfter = await page.evaluate(() => window.scrollY);
    expect(pageScrollYAfter).toBe(0);

    await expect(l.explanationPane).toBeVisible();
    await expect(l.sourcePre).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-deep-source-scroll-viewport.png`,
    });
  });
});

test.describe("7. Unknown/Custom Fallback", () => {
  test("x_custom_metadata shows unrecognized field fallback", async ({
    page,
  }) => {
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("x_custom_metadata")).click();
    await expect(l.explanationTitle).toHaveText(FALLBACK_TITLE, { timeout: 3000 });
    await expect(l.explanationSummary).toContainText(FALLBACK_SUMMARY_PATTERN);
  });
});

test.describe("8. Explanation Panel Hierarchy", () => {
  test("active field panel follows eyebrow -> field chip -> definition -> prose order by DOM order", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);
    await l.sourceNode(sourceNodeLabel("manifest_version")).click();

    await expect(l.explanationEyebrow).toBeVisible();
    await expect(l.explanationTitle).toBeVisible();
    await expect(l.explanationSummary).toBeVisible();

    const order = await page.evaluate(() => {
      const inspector = document.querySelector("manifest-inspector");
      if (!inspector || !inspector.shadowRoot) return [];
      const pane = inspector.shadowRoot.querySelector(
        '[part="explanation-panel"]',
      );
      if (!pane) return [];
      const children = [...pane.children] as HTMLElement[];
      const classes = children
        .map((el) => el.className)
        .filter((c) => c.startsWith("explanation-"));
      return classes;
    });

    const eyebrowIdx = order.findIndex((c) => c === "explanation-eyebrow");
    const titleIdx = order.findIndex((c) => c === "explanation-title");
    const summaryIdx = order.findIndex((c) => c === "explanation-summary");
    const detailsIdx = order.findIndex((c) => c.startsWith("explanation-details"));

    expect(eyebrowIdx).toBeLessThan(titleIdx);
    expect(titleIdx).toBeLessThan(summaryIdx);
    if (detailsIdx >= 0) expect(summaryIdx).toBeLessThan(detailsIdx);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-active-field-hierarchy.png`,
    });
  });
});

test.describe("9. Pin/Preview/Restore", () => {
  test("pin field A, hover field B, leave restores A's explanation", async ({
    page,
  }) => {
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

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

test.describe("10. Keyboard Path", () => {
  test("keyboard navigation selects and pins a field via Arrow+Enter", async ({
    page,
  }) => {
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);
    await l.sourceRegion.focus();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(l.sourcePinned().first()).toBeVisible({ timeout: 3000 });
  });

  test("Space pin and Escape clear works", async ({ page }) => {
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);
    await l.sourceRegion.focus();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press(" ");

    await expect(l.sourcePinned().first()).toBeVisible({ timeout: 3000 });
    // 10e: pinned row after Space has correct aria-selected
    await expect(l.sourcePinned().first()).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("Escape");
    await expect(l.sourcePinned()).toHaveCount(0, { timeout: 3000 });

    // 10d: after clearing with Escape, keyboard navigation still works
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(l.sourcePinned().first()).toBeVisible({ timeout: 3000 });
  });

  test("10a: ArrowDown navigates through top-level fields with distinct titles", async ({ page }) => {
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);
    await l.sourceRegion.focus();

    await expect(l.explanationTitle).toBeVisible({ timeout: 3000 });

    const titles: (string | null)[] = [await l.explanationTitle.textContent()];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowDown");
      titles.push(await l.explanationTitle.textContent());
    }

    const unique = new Set(titles);
    expect(unique.size).toBe(titles.length);

    await page.keyboard.press("Enter");
    await expect(l.sourcePinned().first()).toBeVisible({ timeout: 3000 });
  });

  test("10b: ArrowUp navigates backwards with wrapping", async ({ page }) => {
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);
    await l.sourceRegion.focus();

    await page.keyboard.press("ArrowDown"); // pos 1: Manifest Version
    await page.keyboard.press("ArrowDown"); // pos 2: Extension Name
    await page.keyboard.press("ArrowDown"); // pos 3: Extension Version
    const titleAt3 = await l.explanationTitle.textContent();

    await page.keyboard.press("ArrowUp"); // back to pos 2: Extension Name
    await expect(l.explanationTitle).toHaveText("Extension Name", { timeout: 3000 });

    await page.keyboard.press("ArrowUp"); // pos 1: Manifest Version
    await page.keyboard.press("ArrowUp"); // pos 0: Manifest
    const titleAtRoot = await l.explanationTitle.textContent();

    await page.keyboard.press("ArrowUp"); // wraps to last
    const wrappedTitle = await l.explanationTitle.textContent();
    expect(wrappedTitle).not.toBe(titleAtRoot);
    expect(wrappedTitle).not.toBe(titleAt3);
  });

  test("10c: ArrowUp wraps to last field at top boundary", async ({ page }) => {
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);
    await l.sourceRegion.focus();

    await expect(l.explanationTitle).toHaveText("Manifest", { timeout: 3000 });

    await page.keyboard.press("ArrowUp");
    const wrappedTitle = await l.explanationTitle.textContent();
    expect(wrappedTitle).not.toBe("Manifest");

    await page.keyboard.press("ArrowDown");
    await expect(l.explanationTitle).toHaveText("Manifest", { timeout: 3000 });
  });

  test("10f: Navigate into nested containers via keyboard", async ({ page }) => {
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);
    await l.sourceRegion.focus();

    let reachedRunAt = false;
    for (let i = 0; i < 220; i++) {
      await page.keyboard.press("ArrowDown");
      const currentTitle = await l.explanationTitle.textContent();
      if (currentTitle === "Run At") {
        reachedRunAt = true;
        break;
      }
    }

    expect(reachedRunAt).toBe(true);

    await page.keyboard.press("Enter");
    await expect(l.sourcePinned().first()).toBeVisible({ timeout: 3000 });
  });

  test("10g: Many ArrowDown presses do not crash", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);
    await l.sourceRegion.focus();

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("ArrowDown");
    }

    expect(errors).toHaveLength(0);
    await expect(l.sourcePre).toBeVisible();
    await expect(l.sourceNodes().first()).toBeVisible({ timeout: 3000 });
  });

  test("10h: Focus + Enter on container node pins the container", async ({ page }) => {
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);
    await l.sourceRegion.focus();

    // Navigate from root (position 0) to permissions (position 24)
    for (let i = 0; i < 24; i++) {
      await page.keyboard.press("ArrowDown");
    }
    await expect(l.explanationTitle).toHaveText("Permissions", { timeout: 3000 });

    // Enter pins the container
    await page.keyboard.press("Enter");
    await expect(l.sourcePinned().first()).toBeVisible({ timeout: 3000 });
    await expect(l.explanationTitle).toHaveText("Permissions", { timeout: 3000 });

    // Escape to clear
    await page.keyboard.press("Escape");
    await expect(l.sourcePinned()).toHaveCount(0, { timeout: 3000 });
  });

  test("10i: Keyboard navigation after clear still works", async ({ page }) => {
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    const l = locators(page);
    await l.sourceRegion.focus();

    // First round: navigate and pin
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(l.sourcePinned().first()).toBeVisible({ timeout: 3000 });

    // Clear via Escape
    await page.keyboard.press("Escape");
    await expect(l.sourcePinned()).toHaveCount(0, { timeout: 3000 });

    // Second round: navigate and pin — should still work
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(l.sourcePinned().first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe("11. Paste Flow", () => {
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
