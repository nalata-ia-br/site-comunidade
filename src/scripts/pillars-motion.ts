const cards = Array.from(
  document.querySelectorAll<HTMLElement>('.pillar-card'),
);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const intersecting = new Set<HTMLElement>();

function motionAllowed() {
  return (
    !reducedMotion.matches &&
    document.documentElement.dataset.motion !== 'paused' &&
    !document.hidden
  );
}

function syncScenes() {
  cards.forEach((card) => {
    card.classList.toggle(
      'is-in-view',
      intersecting.has(card) && motionAllowed(),
    );
    if (!motionAllowed()) {
      card.style.removeProperty('--scene-rx');
      card.style.removeProperty('--scene-ry');
    }
  });
}

if (cards.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const card = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          intersecting.add(card);
          card.classList.add('has-entered');
        } else {
          intersecting.delete(card);
        }
      });
      syncScenes();
    },
    { threshold: 0.08 },
  );

  cards.forEach((card) => {
    observer.observe(card);
    card.addEventListener('pointermove', (event) => {
      if (!motionAllowed() || !finePointer.matches) return;
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty('--scene-rx', `${-y * 10}deg`);
      card.style.setProperty('--scene-ry', `${x * 12}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--scene-rx');
      card.style.removeProperty('--scene-ry');
    });
  });

  reducedMotion.addEventListener('change', syncScenes);
  document.addEventListener('visibilitychange', syncScenes);
  window.addEventListener('nalata:motion-change', syncScenes);
}
