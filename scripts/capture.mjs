import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4322';
const browser = await chromium.launch(
  existsSync(chromium.executablePath()) ? {} : { channel: 'chrome' },
);
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const errors = [];
async function captureServer(path) {
  const fixedElements = await page.addStyleTag({
    content:
      '.site-header,.skip-link,.motion-toggle{visibility:hidden!important}',
  });
  await page.locator('#manifesto').screenshot({ path });
  await fixedElements.evaluate((element) => element.remove());
}
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
await page.goto(baseURL, { waitUntil: 'networkidle' });
await page.locator('[data-stack-chapter]').first().waitFor();
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);
mkdirSync('artifacts', { recursive: true });
await page.screenshot({ path: 'artifacts/desktop-hero.png' });
for (const section of [
  '#sobre',
  '#pilares',
  '#manifesto',
  '#stack',
  '#stack-modelos',
  '#stack-frameworks',
  '#stack-agentes',
  '#stack-infra',
  '#participar',
  '#perguntas',
]) {
  await page.locator(section).scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
}
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.waitForTimeout(500);
await page.screenshot({ path: 'artifacts/desktop-full.png', fullPage: true });
await page
  .locator('#pilares')
  .screenshot({ path: 'artifacts/pillars-desktop.png' });
await page.locator('[data-server-scene]').evaluate((element) =>
  window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top - 90,
    behavior: 'instant',
  }),
);
await page.waitForTimeout(600);
await captureServer('artifacts/server-desktop.png');
await page
  .locator('#stack')
  .screenshot({ path: 'artifacts/stack-desktop.png' });
await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: 'networkidle' });
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.waitForTimeout(1200);
await page.screenshot({ path: 'artifacts/mobile-hero.png' });
for (const section of [
  '#sobre',
  '#pilares',
  '#manifesto',
  '#stack',
  '#stack-modelos',
  '#stack-frameworks',
  '#stack-agentes',
  '#stack-infra',
  '#participar',
  '#perguntas',
]) {
  await page.locator(section).scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
}
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.waitForTimeout(300);
await page.screenshot({ path: 'artifacts/mobile-full.png', fullPage: true });
await page.locator('[data-server-scene]').evaluate((element) =>
  window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top - 85,
    behavior: 'instant',
  }),
);
await page.waitForTimeout(600);
await captureServer('artifacts/server-mobile.png');
// The social card is rendered from the actual, code-native hero design.
await page.setViewportSize({ width: 1200, height: 630 });
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto(baseURL, { waitUntil: 'networkidle' });
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.addStyleTag({
  content: `
  .motion-toggle,.hero-scroll-invitation,.site-header,.skip-link,.hero-actions,.hero-meta,.technology-strip,main>section:not(.hero),footer{display:none!important}
  .hero{padding-top:40px!important;height:630px}
  .hero h1{font-size:76px!important;margin-top:22px!important}
  .hero-description{font-size:15px!important}
  .hardware-scene{margin-top:12px!important;transform:scale(.85);transform-origin:top center}
  .scene-caption{display:none!important}
  body::after{content:'nalata.ia.br';position:absolute;bottom:22px;right:36px;color:#94a8ca;font-size:12px;letter-spacing:1px}
`,
});
await page.screenshot({ path: 'public/og-image.png' });
console.log(
  JSON.stringify(
    { errors, screenshots: 'artifacts/', social: 'public/og-image.png' },
    null,
    2,
  ),
);
await browser.close();
