import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const invitationURL = 'https://chat.whatsapp.com/KivInKUIxei22zQE7Ouwzv';
const stackChapters = [
  {
    id: 'stack-modelos',
    name: 'Modelos & Inferência',
    tools: ['Llama', 'Ollama', 'vLLM', 'LLM-d', 'Stable Diffusion'],
  },
  {
    id: 'stack-frameworks',
    name: 'Frameworks de ML',
    tools: ['PyTorch', 'TensorFlow', 'Hugging Face'],
  },
  {
    id: 'stack-agentes',
    name: 'Apps & Agentes',
    tools: ['LangChain', 'RAG', 'OpenCode'],
  },
  {
    id: 'stack-infra',
    name: 'Infra & Orquestração',
    tools: ['Kubernetes', 'Ray', 'Jupyter', 'Apache NiFi'],
  },
];

const serverBrandNames = [
  'Llama',
  'Ollama',
  'Hugging Face',
  'vLLM',
  'LangChain',
  'Ray',
  'PyTorch',
  'TensorFlow',
  'Kubernetes',
  'Jupyter',
  'Apache NiFi',
  'OpenCode',
];

async function expectCompleteServerScene(page: Page) {
  const scene = page.locator('[data-server-scene]');
  const brands = scene.locator('[data-server-brand]');
  await expect(brands).toHaveCount(serverBrandNames.length);
  await expect(brands.locator('.brand-plaque > span')).toHaveText(
    serverBrandNames,
  );
  await expect
    .poll(() =>
      brands.evaluateAll((elements) =>
        elements.every((element) => {
          const style = getComputedStyle(element);
          return (
            Number(style.opacity) >= 0.99 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden'
          );
        }),
      ),
    )
    .toBe(true);

  // Every mark must occupy its own place instead of remaining stacked on the rack.
  await expect
    .poll(() =>
      brands.evaluateAll((elements) => {
        const centers = elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        });
        return Math.min(
          ...centers.flatMap((center, index) =>
            centers
              .slice(index + 1)
              .map((other) =>
                Math.hypot(center.x - other.x, center.y - other.y),
              ),
          ),
        );
      }),
    )
    .toBeGreaterThan(60);

  await scene.scrollIntoViewIfNeeded();
  const logos = brands.locator('img');
  await expect(logos).toHaveCount(serverBrandNames.length);
  await expect
    .poll(() =>
      logos.evaluateAll((elements) =>
        elements.every(
          (image) =>
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth > 0 &&
            new URL(image.currentSrc).pathname.endsWith('.svg'),
        ),
      ),
    )
    .toBe(true);
  await expect(scene.locator('[data-server-rack]')).toBeVisible();
  await expect(scene.locator('[data-rack-face]')).toBeVisible();
  await expect(scene.locator('[data-server-core] img')).toHaveCount(0);
}

test('homepage exposes its content and search metadata without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4322/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page).toHaveTitle(/IA na lata.*[Cc]omunidade/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://nalata.ia.br/',
  );
  const description = await page
    .locator('meta[name="description"]')
    .getAttribute('content');
  expect(description?.length).toBeGreaterThan(80);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    /IA na lata/,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /^https:\/\/nalata\.ia\.br\//,
  );

  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(structuredData.length).toBeGreaterThan(0);
  for (const text of structuredData) {
    const schema = JSON.parse(text);
    const items = Array.isArray(schema) ? schema : [schema];
    expect(
      items.some((item) => item['@context'] === 'https://schema.org'),
    ).toBeTruthy();
  }
  for (const { id, tools } of stackChapters) {
    const chapter = page.locator(`#${id}`);
    await expect(chapter).toBeVisible();
    for (const name of tools) {
      await expect(
        chapter.getByRole('heading', { name, exact: true }),
      ).toBeVisible();
    }
  }
  await expectCompleteServerScene(page);
  await expect(page.locator('#participar')).toBeVisible();
  await context.close();
});

test('community links preserve the invitation and navigation anchors resolve', async ({
  page,
}) => {
  await page.goto('/');
  const invitations = page.locator('a[href*="chat.whatsapp.com"]');
  expect(await invitations.count()).toBeGreaterThan(0);
  for (const link of await invitations.all()) {
    await expect(link).toHaveAttribute('href', invitationURL);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /\bnoopener\b/);
  }

  const unresolvedAnchors = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute('href') || '')
        .filter(
          (href) => !document.getElementById(decodeURIComponent(href.slice(1))),
        ),
    );
  expect(unresolvedAnchors).toEqual([]);
});

test('mobile menu opens, follows a link, and closes with Escape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page
    .locator('.site-header')
    .getByRole('button', { name: /menu/i });
  const navigation = page.getByRole('navigation', {
    name: 'Navegação móvel',
    includeHidden: true,
  });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation).toBeVisible();
  await navigation.getByRole('link', { name: 'A comunidade' }).click();
  await expect(page).toHaveURL(/#sobre$/);
  await expect(navigation).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(navigation).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('FAQ answers can be opened and closed with the keyboard', async ({
  page,
}) => {
  await page.goto('/');
  const question = page.locator('#perguntas details').first();
  const summary = question.locator('summary');
  const answer = question.locator('.faq-answer');
  await expect(answer).toBeHidden();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(question).toHaveAttribute('open', '');
  await expect(answer).toBeVisible();
  await expect(answer).toContainText(/gratuit/i);
  await page.keyboard.press('Enter');
  await expect(answer).toBeHidden();
});

test('all stack tools are available through scrolling without opening tabs', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#stack').getByRole('tab')).toHaveCount(0);
  await expect(page.locator('[data-stack-chapter]')).toHaveCount(
    stackChapters.length,
  );
  for (const { id, tools } of stackChapters) {
    const chapter = page.locator(`#${id}`);
    await chapter.scrollIntoViewIfNeeded();
    await expect(chapter).toBeVisible();
    for (const name of tools) {
      await expect(
        chapter.getByRole('heading', { name, exact: true }),
      ).toBeVisible();
    }
  }
});

test('scrolling the stack updates its navigation and the illustrated layer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const navigation = page.getByRole('navigation', {
    name: 'Explore as camadas da stack',
  });

  for (const [index, { id, name }] of stackChapters.entries()) {
    await page
      .locator(`#${id}`)
      .evaluate((element) =>
        element.scrollIntoView({ behavior: 'instant', block: 'start' }),
      );
    await expect(navigation.locator(`a[href="#${id}"]`)).toHaveAttribute(
      'aria-current',
      'location',
    );
    await expect(navigation.locator('[aria-current="location"]')).toHaveCount(
      1,
    );
    await expect(page.locator(`[data-engine-layer="${index}"]`)).toHaveClass(
      /\bis-active\b/,
    );
    await expect(page.locator('[data-engine-name]')).toHaveText(name);
  }
});

test('scrolling reveals all twelve loaded brand logos outward from the server', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const scene = page.locator('[data-server-scene]');
  const brands = scene.locator('[data-server-brand]');
  await scene.evaluate((element) =>
    window.scrollTo({
      top:
        window.scrollY +
        element.getBoundingClientRect().top -
        window.innerHeight * 0.55,
      behavior: 'instant',
    }),
  );
  await expect(scene).toHaveClass(/\bis-in-view\b/);
  await expect
    .poll(() => scene.getAttribute('data-progress').then(Number))
    .toBeGreaterThan(0);
  expect(Number(await scene.getAttribute('data-progress'))).toBeLessThan(0.5);
  const before = await brands.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).transform),
  );

  await scene.evaluate((element) =>
    window.scrollTo({
      top:
        window.scrollY +
        element.getBoundingClientRect().top -
        window.innerHeight * 0.05,
      behavior: 'instant',
    }),
  );
  await expect
    .poll(async () => {
      const after = await brands.evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).transform),
      );
      return after.filter((transform, index) => transform !== before[index])
        .length;
    })
    .toBe(serverBrandNames.length);
  await expectCompleteServerScene(page);
});

test('the solid server cabinet hides connections passing behind its front', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const scene = page.locator('[data-server-scene]');
    await scene.scrollIntoViewIfNeeded();
    const face = await scene.locator('[data-rack-face]').boundingBox();
    expect(face).not.toBeNull();
    const clip = {
      x: Math.floor(face!.x + face!.width * 0.5),
      y: Math.floor(face!.y + face!.height * 0.55),
      width: 12,
      height: 12,
    };
    const frontBefore = await page.screenshot({ clip });
    const sceneBefore = await scene.screenshot();

    // Add a conspicuous wire through the sampled face, in the real SVG layer.
    // It must change the surroundings without changing the painted cabinet.
    await scene.locator('.server-connections').evaluate((svg, y) => {
      const bounds = svg.getBoundingClientRect();
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      line.setAttribute('data-layer-probe', '');
      line.setAttribute(
        'd',
        `M0 ${((y - bounds.top) / bounds.height) * 700}H1000`,
      );
      line.setAttribute('stroke', '#ff00ff');
      line.setAttribute('stroke-width', '30');
      svg.append(line);
    }, clip.y + 6);

    const frontWithWire = await page.screenshot({ clip });
    const sceneWithWire = await scene.screenshot();
    expect(sceneWithWire.equals(sceneBefore)).toBe(false);
    expect(frontWithWire.equals(frontBefore)).toBe(true);
    await page
      .locator('[data-layer-probe]')
      .evaluate((element) => element.remove());
  }
});

for (const mode of ['reduced motion', 'manually paused'] as const) {
  test(`the server scene is fully readable and stationary with ${mode}`, async ({
    page,
  }) => {
    await page.emulateMedia({
      reducedMotion: mode === 'reduced motion' ? 'reduce' : 'no-preference',
    });
    await page.goto('/');
    if (mode === 'manually paused') {
      await page
        .getByRole('button', { name: 'Pausar animações', exact: true })
        .click();
    }
    await expectCompleteServerScene(page);
    await expect
      .poll(() =>
        page
          .locator('[data-server-scene]')
          .evaluate(
            (element) =>
              element
                .getAnimations({ subtree: true })
                .filter(
                  (animation) =>
                    animation.playState === 'running' &&
                    animation.effect?.getComputedTiming().iterations ===
                      Infinity,
                ).length,
          ),
      )
      .toBe(0);
  });
}

test('each community illustration keeps moving while it is on screen', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const illustrations = page.locator('.pillar-illustration');
  expect(await illustrations.count()).toBeGreaterThan(0);

  for (const illustration of await illustrations.all()) {
    await illustration.scrollIntoViewIfNeeded();
    await expect(illustration).toBeInViewport();
    await expect
      .poll(() =>
        illustration.evaluate(
          (element) =>
            element
              .getAnimations({ subtree: true })
              .filter(
                (animation) =>
                  animation instanceof CSSAnimation &&
                  animation.playState === 'running' &&
                  animation.effect?.getComputedTiming().iterations === Infinity,
              ).length,
        ),
      )
      .toBeGreaterThan(0);

    await expect
      .poll(() =>
        illustration.evaluate(async (element) => {
          const animations = element
            .getAnimations({ subtree: true })
            .filter(
              (animation) =>
                animation instanceof CSSAnimation &&
                animation.playState === 'running' &&
                animation.effect?.getComputedTiming().iterations === Infinity,
            );
          await Promise.all(animations.map((animation) => animation.ready));
          const before = animations.map((animation) =>
            Number(animation.currentTime),
          );
          await new Promise<void>((resolve) => setTimeout(resolve, 120));
          return animations.some(
            (animation, index) => Number(animation.currentTime) > before[index],
          );
        }),
      )
      .toBe(true);
  }
});

test('the motion control pauses and resumes continuous interface animations', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const illustration = page.locator('.pillar-illustration').first();
  await illustration.scrollIntoViewIfNeeded();
  const pause = page.getByRole('button', {
    name: 'Pausar animações',
    exact: true,
  });
  await expect(pause).toHaveAttribute('aria-pressed', 'false');
  await pause.click();
  const resume = page.getByRole('button', {
    name: 'Retomar animações',
    exact: true,
  });
  await expect(resume).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (animation) =>
                animation.playState === 'running' &&
                animation.effect?.getComputedTiming().iterations === Infinity,
            ).length,
      ),
    )
    .toBe(0);

  await resume.click();
  await expect(pause).toHaveAttribute('aria-pressed', 'false');
  await illustration.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      illustration.evaluate(
        (element) =>
          element
            .getAnimations({ subtree: true })
            .filter(
              (animation) =>
                animation.playState === 'running' &&
                animation.effect?.getComputedTiming().iterations === Infinity,
            ).length,
      ),
    )
    .toBeGreaterThan(0);
});

test('layout fits narrow mobile and desktop viewports', async ({ page }) => {
  await page.goto('/');
  for (const width of [320, 375, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(
        async () =>
          page.evaluate(
            () =>
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth,
          ),
        { message: `Horizontal overflow at ${width}px` },
      )
      .toBeLessThanOrEqual(1);
  }
});

test('reduced motion keeps all revealed content readable immediately', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const reveals = page.locator('.reveal');
  expect(await reveals.count()).toBeGreaterThan(0);
  await expect
    .poll(async () =>
      reveals.evaluateAll(
        (elements) =>
          elements.filter((element) => {
            const style = getComputedStyle(element);
            return (
              Number(style.opacity) < 0.99 ||
              style.visibility === 'hidden' ||
              style.display === 'none'
            );
          }).length,
      ),
    )
    .toBe(0);
  for (const illustration of await page.locator('.pillar-illustration').all()) {
    await illustration.scrollIntoViewIfNeeded();
    await expect(illustration).toBeVisible();
    await expect
      .poll(() =>
        illustration.evaluate(
          (element) =>
            element
              .getAnimations({ subtree: true })
              .filter(
                (animation) =>
                  animation.playState === 'running' &&
                  animation.effect?.getComputedTiming().iterations === Infinity,
              ).length,
        ),
      )
      .toBe(0);
  }
});

test('homepage has no serious or critical automated accessibility findings', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  await testInfo.attach('accessibility-report', {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });
  const significant = results.violations.filter(
    ({ impact }) => impact === 'serious' || impact === 'critical',
  );
  expect(
    significant.map(({ id, impact, nodes }) => ({
      id,
      impact,
      elements: nodes.map(({ target }) => target),
    })),
  ).toEqual([]);
});
