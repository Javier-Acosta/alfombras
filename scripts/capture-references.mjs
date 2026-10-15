import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
    : {}),
});
await mkdir("test-results/references", { recursive: true });
const metrics = [];
async function loadImages(page) {
  await page.evaluate(async()=>{
    for(const img of Array.from(document.images)) img.loading="eager";
    await Promise.all(Array.from(document.images).map(img=>img.decode().catch(()=>{})));
    await document.fonts.ready;
  });
}
for (const [name, url] of [
  ["feria", "http://localhost:3218"],
  ["tienda", "http://localhost:3219"],
  ["alfombras-inicio", "http://localhost:3217"],
  ["alfombras-tienda", "http://localhost:3217/tienda"],
]) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await loadImages(page);
    await page.screenshot({
      path: `test-results/references/${name}-desktop.png`,
      fullPage: true,
    });
    metrics.push({
      name,
      viewport: "desktop",
      styles: await page.evaluate(() => {
        const e =
          document.querySelector(".hero") || document.querySelector("h1");
        return e
          ? {
              font: getComputedStyle(e).fontFamily,
              color: getComputedStyle(e).color,
              background: getComputedStyle(e).backgroundColor,
            }
          : {};
      }),
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await loadImages(page);
    await page.screenshot({
      path: `test-results/references/${name}-mobile.png`,
      fullPage: true,
    });
  } catch (e) {
    console.log(`${name}: ${e.message}`);
  } finally {
    await page.close();
  }
}
await writeFile(
  "test-results/references/metrics.json",
  JSON.stringify(metrics, null, 2),
);
await browser.close();
console.log("Capturas de referencias guardadas en test-results/references.");
