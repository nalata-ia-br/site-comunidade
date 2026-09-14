const stackSection = document.querySelector<HTMLElement>(
  '[data-stack-section]',
);

if (stackSection) {
  const section = stackSection;
  const chapters = Array.from(
    section.querySelectorAll<HTMLElement>('[data-stack-chapter]'),
  );
  const links = Array.from(
    section.querySelectorAll<HTMLAnchorElement>('[data-stack-link]'),
  );
  const layers = Array.from(
    section.querySelectorAll<SVGGElement>('[data-engine-layer]'),
  );
  const readout = section.querySelector<HTMLElement>('[data-engine-name]');
  const engine = section.querySelector<HTMLElement>('.engine-frame');
  const motionPreference = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  );
  let visible = false;
  let frame = 0;
  let activeIndex = -1;

  function motionAllowed() {
    return (
      !motionPreference.matches &&
      document.documentElement.dataset.motion !== 'paused'
    );
  }

  function update() {
    frame = 0;
    if (!visible) return;

    const readingLine = window.innerHeight * 0.46;
    const positions = chapters.map(
      (chapter) => chapter.getBoundingClientRect().top,
    );
    let nextIndex = 0;
    positions.forEach((top, index) => {
      if (top <= readingLine) nextIndex = index;
    });

    if (nextIndex !== activeIndex) {
      activeIndex = nextIndex;
      chapters.forEach((chapter, index) => {
        chapter.classList.toggle('is-active', index === activeIndex);
      });
      links.forEach((link, index) => {
        const current = index === activeIndex;
        link.classList.toggle('is-active', current);
        if (current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      layers.forEach((layer) => {
        layer.classList.toggle(
          'is-active',
          Number(layer.dataset.engineLayer) === activeIndex,
        );
      });
      if (readout) {
        readout.textContent = chapters[activeIndex].dataset.stackName || '';
      }
    }

    const distance = positions[positions.length - 1] - positions[0];
    const progress = Math.max(
      0,
      Math.min(1, (readingLine - positions[0]) / Math.max(distance, 1)),
    );
    section.style.setProperty('--stack-progress', progress.toFixed(4));
    section.style.setProperty(
      '--engine-turn',
      motionAllowed() ? `${(-3 + progress * 6).toFixed(2)}deg` : '0deg',
    );
  }

  function scheduleUpdate() {
    if (!frame && visible) frame = window.requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle('is-in-view', entry.isIntersecting);
        if (entry.target === section) {
          visible = entry.isIntersecting;
          scheduleUpdate();
        }
      }
    },
    { threshold: 0 },
  );
  observer.observe(section);
  if (engine) observer.observe(engine);

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('nalata:motion-change', scheduleUpdate);
  motionPreference.addEventListener('change', scheduleUpdate);

  document.addEventListener(
    'astro:before-swap',
    () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('nalata:motion-change', scheduleUpdate);
      motionPreference.removeEventListener('change', scheduleUpdate);
    },
    { once: true },
  );
}
