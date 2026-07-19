import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "@playwright/test";

const rootDir = resolve(import.meta.dirname, "..");
const outputPath = resolve(rootDir, "apps/web/public/social-card.png");
const appUrl = "http://127.0.0.1:4174";

function waitForServer(url, timeoutMs = 30_000) {
  const startedAt = Date.now();

  return new Promise((resolveReady, reject) => {
    const check = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          resolveReady();
          return;
        }
      } catch {
        // Server is not ready yet.
      }

      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }

      setTimeout(check, 250);
    };

    check();
  });
}

async function captureAppScreenshot(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.locator("#load-sample-button").click();
  await page.locator("manifest-inspector").locator(".tree-row", { hasText: '"permissions"' }).first().click();
  await page.locator("manifest-inspector").locator(".explanation-title", { hasText: "Permissions" }).waitFor({ state: "visible" });
  await page.addStyleTag({
    content: `
      *, *::before, *::after { transition-duration: 0ms !important; animation-duration: 0ms !important; }
      body { background: #121214 !important; }
    `,
  });

  const screenshot = await page.screenshot({ type: "png" });
  await page.close();
  return screenshot;
}

async function composeSocialCard(browser, appScreenshot) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const screenshotDataUrl = `data:image/png;base64,${appScreenshot.toString("base64")}`;

  await page.setContent(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          * { box-sizing: border-box; }
          html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
          body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: #ededef;
            background:
              radial-gradient(circle at 78% 18%, rgba(94, 234, 212, 0.20), transparent 28%),
              radial-gradient(circle at 18% 92%, rgba(125, 211, 252, 0.12), transparent 34%),
              linear-gradient(135deg, #0d0d0f 0%, #121214 48%, #1b1b20 100%);
          }
          .card {
            position: relative;
            width: 1200px;
            height: 630px;
            padding: 56px;
            display: grid;
            grid-template-columns: 400px 1fr;
            gap: 44px;
          }
          .copy {
            align-self: center;
            z-index: 2;
          }
          .brand {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 34px;
            color: #a6a6ae;
            font-size: 20px;
            font-weight: 650;
            letter-spacing: -0.02em;
          }
          .dot {
            width: 13px;
            height: 13px;
            border-radius: 999px;
            background: #5eead4;
            box-shadow: 0 0 26px rgba(94, 234, 212, 0.65);
          }
          h1 {
            margin: 0;
            max-width: 390px;
            color: #ededef;
            font-size: 58px;
            line-height: 0.96;
            letter-spacing: -0.055em;
          }
          p {
            margin: 28px 0 0;
            max-width: 360px;
            color: #d9d9de;
            font-size: 22px;
            line-height: 1.35;
          }
          .pill {
            display: inline-flex;
            margin-top: 32px;
            padding: 9px 13px;
            border: 1px solid rgba(94, 234, 212, 0.28);
            border-radius: 999px;
            color: #a7f3d0;
            background: rgba(32, 32, 39, 0.72);
            font-family: "JetBrains Mono", "SF Mono", ui-monospace, monospace;
            font-size: 15px;
          }
          .frame-wrap {
            position: relative;
            align-self: center;
            height: 492px;
          }
          .frame {
            position: absolute;
            inset: 0 -44px 0 0;
            overflow: hidden;
            border: 1px solid rgba(94, 234, 212, 0.28);
            border-radius: 24px;
            background: #16161a;
            box-shadow:
              0 34px 90px rgba(0, 0, 0, 0.62),
              0 0 0 1px rgba(255, 255, 255, 0.03) inset;
          }
          .frame::before {
            content: "";
            position: absolute;
            inset: 0;
            z-index: 2;
            pointer-events: none;
            background: linear-gradient(90deg, transparent 0%, transparent 64%, rgba(94, 234, 212, 0.08) 100%);
          }
          img {
            width: 790px;
            height: 492px;
            object-fit: cover;
            object-position: 50% 6%;
            display: block;
            filter: saturate(1.04) contrast(1.02);
          }
          .hairline {
            position: absolute;
            left: 56px;
            right: 56px;
            bottom: 34px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(94, 234, 212, 0.45), transparent);
          }
        </style>
      </head>
      <body>
        <main class="card" aria-label="Manifest Lens social preview">
          <section class="copy">
            <div class="brand"><span class="dot"></span><span>Manifest Lens</span></div>
            <h1>Hover your manifest. Understand every field.</h1>
            <p>Local-first explainer for browser extension manifest.json files.</p>
            <div class="pill">manifest.json</div>
          </section>
          <section class="frame-wrap" aria-hidden="true">
            <div class="frame"><img src="${screenshotDataUrl}" alt="" /></div>
          </section>
          <div class="hairline" aria-hidden="true"></div>
        </main>
      </body>
    </html>`);

  mkdirSync(dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, type: "png" });
  await page.close();
}

const server = spawn("npm", ["run", "dev", "--workspace=@manifest-lens/web", "--", "--host", "127.0.0.1", "--port", "4174"], {
  cwd: rootDir,
  stdio: ["ignore", "pipe", "pipe"],
});

try {
  await waitForServer(appUrl);
  const browser = await chromium.launch();
  try {
    const appScreenshot = await captureAppScreenshot(browser);
    await composeSocialCard(browser, appScreenshot);
    writeFileSync(1, `Generated ${outputPath}\n`);
  } finally {
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}
