import { test, expect } from "@playwright/test";
import {
  locators,
  readComprehensiveFixture,
  loadFixtureViaPaste,
  sourceNodeLabel,
  SCREENSHOT_DIR,
} from "./helpers";

const FIXTURE = readComprehensiveFixture();

test.describe("12. Tree Craft", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);
  });

  test("12a. Disclosure controls presence", async ({ page }) => {
    const l = locators(page);

    const permissionsRow = l.sourceNode(sourceNodeLabel("permissions"));
    await expect(permissionsRow.locator(".tree-disclosure")).toBeVisible();
    await expect(permissionsRow.locator(".tree-disclosure.is-hidden")).toHaveCount(0);

    const backgroundRow = l.sourceNode(sourceNodeLabel("background"));
    await expect(backgroundRow.locator(".tree-disclosure")).toBeVisible();
    await expect(backgroundRow.locator(".tree-disclosure.is-hidden")).toHaveCount(0);

    const mvRow = l.sourceNode(sourceNodeLabel("manifest_version"));
    await expect(mvRow.locator(".tree-disclosure.is-hidden")).toHaveCount(1);
  });

  test("12b. Default depth collapse", async ({ page }) => {
    const l = locators(page);

    const initialRowCount = await l.sourceNodes().count();

    const contentScriptItem = l.sourceNode(
      "contentScript (content_scripts[])",
    ).first();
    const disclosure = contentScriptItem.locator(".tree-disclosure");
    const initialText = await disclosure.textContent();
    expect(initialText).toBe("\u25BE");

    await disclosure.click();
    await page.waitForTimeout(100);
    const afterCollapseCount = await l.sourceNodes().count();
    expect(afterCollapseCount).toBeLessThan(initialRowCount);

    await disclosure.click();
    await page.waitForTimeout(100);
    const afterExpandCount = await l.sourceNodes().count();
    expect(afterExpandCount).toBeGreaterThan(afterCollapseCount);
  });

  test("12c. Large-array truncation", async ({ page }) => {
    const l = locators(page);

    const moreRows = l.sourceTree.locator(".tree-row-more");
    const initialMoreCount = await moreRows.count();
    expect(initialMoreCount).toBeGreaterThan(0);

    const firstMore = moreRows.first();
    await expect(firstMore).toBeVisible();
    await expect(firstMore).toHaveText(/^\+[0-9]+ more$/);

    const beforeRowCount = await l.sourceNodes().count();
    await firstMore.click();
    await page.waitForTimeout(100);

    const afterMoreCount = await l.sourceTree.locator(".tree-row-more").count();
    expect(afterMoreCount).toBe(initialMoreCount - 1);

    const afterRowCount = await l.sourceNodes().count();
    expect(afterRowCount).toBeGreaterThanOrEqual(beforeRowCount);
  });

  test("12d. Disclosure toggle", async ({ page }) => {
    const l = locators(page);

    const permissionsRow = l.sourceNode(sourceNodeLabel("permissions"));
    const disclosure = permissionsRow.locator(".tree-disclosure");

    const expandedText = await disclosure.textContent();
    expect(expandedText).toBe("\u25BE");

    const beforeChildren = await l.sourceNodes().count();
    await disclosure.click();
    await page.waitForTimeout(100);
    const afterCollapse = await l.sourceNodes().count();
    expect(afterCollapse).toBeLessThan(beforeChildren);
    await expect(l.sourceNode("permission (permissions[])").first()).toHaveCount(0);

    await disclosure.click();
    await page.waitForTimeout(100);
    const afterExpand = await l.sourceNodes().count();
    expect(afterExpand).toBeGreaterThan(afterCollapse);
    await expect(l.sourceNode("permission (permissions[])").first()).toBeVisible();
  });

  test("12e. Deep selected row keeps gutter marker aligned", async ({ page }) => {
    const l = locators(page);

    const row = l.sourceNode(sourceNodeLabel("declarative_net_request"));
    await row.scrollIntoViewIfNeeded();
    await row.click();

    const pinnedMarkers = l.sourceGutter.locator(".source-gutter-line.is-pinned");
    await expect(pinnedMarkers).toHaveCount(1);
    await expect(pinnedMarkers.first()).toHaveAttribute(
      "data-node-id",
      /declarative_net_request/,
    );

    const rowBox = await row.boundingBox();
    const markerBox = await pinnedMarkers.first().boundingBox();
    expect(rowBox).not.toBeNull();
    expect(markerBox).not.toBeNull();
    expect(Math.abs((rowBox?.y ?? 0) - (markerBox?.y ?? 0))).toBeLessThanOrEqual(4);
  });

  test("12f. Tree craft screenshots", async ({ page }) => {
    const l = locators(page);

    await l.sourceNode(sourceNodeLabel("x_custom_metadata")).click();
    await l.sourcePinned().first().waitFor({ state: "visible", timeout: 3000 });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-tree-unknown-field.png`,
    });

    await page.goto("/");
    await loadFixtureViaPaste(page, FIXTURE);

    await l.sourceNode(sourceNodeLabel("content_scripts")).locator(".tree-disclosure").click();
    await page.waitForTimeout(100);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-tree-depth-collapse.png`,
    });

    await l.sourceNode(sourceNodeLabel("content_scripts")).locator(".tree-disclosure").click();
    await page.waitForTimeout(100);

    await l.sourceNode(sourceNodeLabel("permissions")).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-tree-array-truncation.png`,
    });

    await l.sourceNode(sourceNodeLabel("permissions")).locator(".tree-disclosure").click();
    await page.waitForTimeout(100);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-tree-disclosure-collapsed.png`,
    });
  });
});
