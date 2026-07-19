import { test, expect } from "@playwright/test";
import {
  locators,
  readComprehensiveFixture,
  SCREENSHOT_DIR,
} from "./helpers";

const FIXTURE = readComprehensiveFixture();

test.describe("12. File Upload", () => {
  test("uploads fixture via hidden file input, native input not visible", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const l = locators(page);

    await expect(l.uploadButton).toBeVisible();
    await expect(l.fileInput).toHaveClass(/visually-hidden/);

    await l.fileInput.setInputFiles({
      name: "manifest.json",
      mimeType: "application/json",
      buffer: Buffer.from(FIXTURE),
    });

    await expect(l.sourcePre).toBeVisible({ timeout: 5000 });
    await expect(l.clearButton).toBeVisible();

    const sourceText = await l.sourcePre.textContent();
    expect(sourceText).toContain("manifest_version");
    expect(sourceText).toContain("x_custom_metadata");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-upload-state-no-native-input.png`,
    });
  });
});

test.describe("13. Drag-and-Drop Text", () => {
  test("drop text onto manifest-inspector loads fixture", async ({ page }) => {
    await page.goto("/");

    await page.evaluate((fixtureText) => {
      const host = document.querySelector("manifest-inspector");
      if (!host) throw new Error("manifest-inspector not found");
      const dt = new DataTransfer();
      dt.setData("text/plain", fixtureText);
      const event = new DragEvent("drop", {
        dataTransfer: dt,
        bubbles: true,
        cancelable: true,
      });
      host.dispatchEvent(event);
    }, FIXTURE);

    const l = locators(page);
    await expect(l.sourcePre).toBeVisible({ timeout: 5000 });

    const sourceText = await l.sourcePre.textContent();
    expect(sourceText).toContain("manifest_version");
    expect(sourceText).toContain("x_custom_metadata");
  });
});
