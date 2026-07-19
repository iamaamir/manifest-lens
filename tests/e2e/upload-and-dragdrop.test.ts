import { test, expect } from "@playwright/test";
import {
  INVALID_JSON,
  locators,
  readComprehensiveFixture,
  SCREENSHOT_DIR,
} from "./helpers";

const FIXTURE = readComprehensiveFixture();

async function dispatchTextDrag(
  page: import("@playwright/test").Page,
  type: "dragenter" | "dragover" | "dragleave" | "drop" | "dragend",
  text: string,
): Promise<boolean> {
  return page.evaluate(
    ({ eventType, payload }) => {
      const host = document.querySelector("manifest-inspector");
      if (!host) throw new Error("manifest-inspector not found");
      const dt = new DataTransfer();
      if (payload.length > 0) dt.setData("text/plain", payload);
      const event = new DragEvent(eventType, {
        dataTransfer: dt,
        bubbles: true,
        cancelable: true,
      });
      host.dispatchEvent(event);
      return event.defaultPrevented;
    },
    { eventType: type, payload: text },
  );
}

async function dispatchFileDrop(
  page: import("@playwright/test").Page,
  fileName: string,
  mimeType: string,
  text: string,
): Promise<void> {
  await page.evaluate(
    ({ name, type, payload }) => {
      const host = document.querySelector("manifest-inspector");
      if (!host) throw new Error("manifest-inspector not found");
      const dt = new DataTransfer();
      dt.items.add(new File([payload], name, { type }));
      const event = new DragEvent("drop", {
        dataTransfer: dt,
        bubbles: true,
        cancelable: true,
      });
      host.dispatchEvent(event);
    },
    { name: fileName, type: mimeType, payload: text },
  );
}

test.describe("12. File Upload", () => {
  test("uploads fixture via hidden file input, native input not visible", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const l = locators(page);

    await expect(l.uploadButton).toBeVisible();
    await expect(l.helpButton).toHaveCount(0);
    await expect(l.fileInput).toHaveClass(/visually-hidden/);
    await expect(l.fileInput).toHaveAttribute("tabindex", "-1");

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

  test("upload invalid JSON shows the same error card path", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const l = locators(page);

    await l.fileInput.setInputFiles({
      name: "manifest.json",
      mimeType: "application/json",
      buffer: Buffer.from(INVALID_JSON),
    });

    await expect(l.errorCard).toBeVisible({ timeout: 5000 });
    await expect(l.errorCardHeadline).toHaveText("This isn't valid JSON");
    await expect(l.sourcePre).toHaveCount(0);
    await expect(l.explanationEmpty).toBeVisible();
    await expect(l.fileInput).toHaveJSProperty("value", "");
  });

  test("mobile header keeps Upload visible without Help or header Load sample", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const l = locators(page);

    await expect(l.uploadButton).toBeVisible();
    await expect(l.helpButton).toHaveCount(0);
    await expect(page.locator("#load-sample-button")).toBeHidden();
    await expect(page.locator("manifest-inspector").locator(".sample-link")).toBeVisible();
  });

  test("visible Upload button has keyboard focus affordance", async ({ page }) => {
    await page.goto("/");
    const l = locators(page);

    await l.uploadButton.focus();
    await expect(l.uploadButton).toBeFocused();
    const outlineStyle = await l.uploadButton.evaluate((button) => {
      const style = getComputedStyle(button);
      return `${style.outlineStyle} ${style.outlineWidth}`;
    });
    expect(outlineStyle).not.toContain("none 0px");
  });
});

test.describe("13. Drag-and-Drop Feedback and Input", () => {
  test("empty-state dragover shows visible pre-drop feedback and advertises copy", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const l = locators(page);

    const prevented = await dispatchTextDrag(page, "dragover", FIXTURE);

    expect(prevented).toBe(true);
    await expect(l.dropOverlay).toBeVisible();
    await expect(l.dropOverlayText).toHaveText("Drop manifest.json to inspect locally");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-empty-dragover-feedback.png` });
  });

  test("loaded-state dragover shows feedback without losing current content", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const l = locators(page);

    await dispatchTextDrag(page, "drop", FIXTURE);
    await expect(l.sourcePre).toBeVisible({ timeout: 5000 });
    await dispatchTextDrag(page, "dragover", FIXTURE);

    await expect(l.dropOverlay).toBeVisible();
    await expect(l.sourcePre).toContainText("manifest_version");
    await expect(l.sourcePre).toContainText("x_custom_metadata");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-loaded-dragover-feedback.png` });
  });

  test("global blur cleanup clears aborted off-element drag feedback", async ({ page }) => {
    await page.goto("/");
    const l = locators(page);

    await dispatchTextDrag(page, "dragenter", FIXTURE);
    await expect(l.dropOverlay).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));

    await expect(l.dropOverlay).toBeHidden();
  });

  test("dragleave clears feedback and preserves loaded state", async ({ page }) => {
    await page.goto("/");
    const l = locators(page);

    await dispatchTextDrag(page, "drop", FIXTURE);
    await expect(l.sourcePre).toBeVisible({ timeout: 5000 });
    await dispatchTextDrag(page, "dragenter", FIXTURE);
    await expect(l.dropOverlay).toBeVisible();

    await dispatchTextDrag(page, "dragleave", "");

    await expect(l.dropOverlay).toBeHidden();
    await expect(l.sourcePre).toContainText("manifest_version");
  });

  test("valid file drop loads fixture and clears feedback", async ({ page }) => {
    await page.goto("/");
    const l = locators(page);

    await dispatchTextDrag(page, "dragover", FIXTURE);
    await expect(l.dropOverlay).toBeVisible();
    await dispatchFileDrop(page, "manifest.json", "application/json", FIXTURE);

    await expect(l.sourcePre).toBeVisible({ timeout: 5000 });
    await expect(l.dropOverlay).toBeHidden();
    await expect(l.sourcePre).toContainText("x_custom_metadata");
  });

  test("invalid text drop after valid pinned state clears stale content and shows error card", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const l = locators(page);

    await dispatchTextDrag(page, "drop", FIXTURE);
    await expect(l.sourcePre).toBeVisible({ timeout: 5000 });
    await l.sourceNode("permissions (permissions)").click();
    await expect(l.sourcePinned()).toHaveCount(1);

    await dispatchTextDrag(page, "drop", INVALID_JSON);

    await expect(l.errorCard).toBeVisible({ timeout: 5000 });
    await expect(l.sourcePre).toHaveCount(0);
    await expect(l.explanationEmpty).toBeVisible();
    await expect(l.explanationTitle).toHaveCount(0);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-invalid-drop-error-card.png` });
  });

  test("drop with empty/no data is safe no-op and does not clear valid content", async ({ page }) => {
    await page.goto("/");
    const l = locators(page);

    await dispatchTextDrag(page, "drop", FIXTURE);
    await expect(l.sourcePre).toBeVisible({ timeout: 5000 });

    await dispatchTextDrag(page, "drop", "");

    await expect(l.sourcePre).toBeVisible();
    await expect(l.sourcePre).toContainText("manifest_version");
    await expect(l.errorCard).toHaveCount(0);
  });

  test("clearly unsupported candidates show calm refusal feedback", async ({ page }) => {
    await page.goto("/");
    const l = locators(page);

    await page.evaluate(() => {
      const host = document.querySelector("manifest-inspector");
      if (!host) throw new Error("manifest-inspector not found");
      const dt = new DataTransfer();
      dt.items.add(new File(["plain text"], "notes.txt", { type: "text/plain" }));
      const event = new DragEvent("dragover", {
        dataTransfer: dt,
        bubbles: true,
        cancelable: true,
      });
      host.dispatchEvent(event);
    });

    await expect(l.dropOverlay).toBeVisible();
    await expect(l.dropOverlayText).toHaveText("Drop a JSON manifest file");
  });
});
