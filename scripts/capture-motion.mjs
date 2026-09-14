import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, renameSync } from 'node:fs';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4322';
const browser = await chromium.launch(
  existsSync(chromium.executablePath()) ? {} : { channel: 'chrome' },
);
mkdirSync('artifacts/video', { recursive: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: 'artifacts/video', size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
await page.goto(baseURL, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
async function show(selector, duration = 2500) {
  await page.locator(selector).evaluate((element) =>
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - 120,
      behavior: 'smooth',
    }),
  );
  await page.waitForTimeout(duration);
}
await show('#pilares', 4500);
await page.mouse.move(285, 340, { steps: 18 });
await page.mouse.move(1150, 380, { steps: 28 });
await page.waitForTimeout(1700);
await show('#manifesto', 1700);
const sceneTop = await page
  .locator('[data-server-scene]')
  .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
await page.evaluate(
  (top) => window.scrollTo({ top, behavior: 'instant' }),
  sceneTop - 610,
);
await page.waitForTimeout(500);
await page.evaluate(async (top) => {
  const start = window.scrollY;
  const distance = top - 85 - start;
  const began = performance.now();
  await new Promise((resolve) => {
    function step(now) {
      const progress = Math.min(1, (now - began) / 4300);
      window.scrollTo({
        top: start + distance * progress,
        behavior: 'instant',
      });
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}, sceneTop);
await page.waitForTimeout(2200);
await show('#stack', 3000);
await show('#stack-modelos', 2500);
await show('#stack-frameworks', 2500);
await show('#stack-agentes', 2500);
await show('#stack-infra', 2500);
await show('.join-cta', 2500);
const video = page.video();
await context.close();
renameSync(await video.path(), 'artifacts/motion-preview.webm');
await browser.close();
console.log('Saved artifacts/motion-preview.webm');
