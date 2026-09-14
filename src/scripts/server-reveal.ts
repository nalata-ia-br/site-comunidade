import { isMotionPaused } from './motion-state';

const scene = document.querySelector<HTMLElement>('[data-server-scene]');
if (scene) {
  const stage = scene;
  const brands = Array.from(
    stage.querySelectorAll<HTMLElement>('[data-server-brand]'),
  );
  const connections = Array.from(
    stage.querySelectorAll<SVGGElement>('[data-server-connection]'),
  );
  const core = stage.querySelector<HTMLElement>('[data-server-core]');
  const compact = window.matchMedia('(max-width: 640px)');
  let frame = 0;
  let visible = false;
  let width = stage.clientWidth;
  let height = stage.clientHeight;
  const clamp = (value: number) => Math.max(0, Math.min(1, value));

  function render() {
    frame = 0;
    const paused = isMotionPaused();
    const rect = stage.getBoundingClientRect();
    const progress = paused
      ? 1
      : clamp(
          (window.innerHeight * 0.65 - rect.top) / (window.innerHeight * 0.54),
        );
    stage.dataset.progress = progress.toFixed(3);
    brands.forEach((brand, index) => {
      const x =
        (Number(compact.matches ? brand.dataset.mx : brand.dataset.x) / 100) *
        width;
      const y =
        (Number(compact.matches ? brand.dataset.my : brand.dataset.y) / 100) *
        height;
      const start = 0.015 + index * 0.033;
      const local = paused ? 1 : clamp((progress - start) / 0.56);
      const eased = 1 - Math.pow(1 - local, 3);
      brand.style.setProperty(
        '--eject-x',
        `${(width * 0.5 - x) * (1 - eased)}px`,
      );
      brand.style.setProperty(
        '--eject-y',
        `${(height * 0.59 - y) * (1 - eased)}px`,
      );
      brand.style.setProperty('--eject-scale', String(0.25 + eased * 0.75));
      brand.style.setProperty(
        '--eject-rotation',
        `${(index % 2 === 0 ? -18 : 18) * (1 - eased)}deg`,
      );
      brand.style.setProperty('--logo-opacity', String(clamp(local * 3.5)));
      connections[index]?.style.setProperty(
        '--wire-progress',
        eased.toFixed(3),
      );
      connections[index]?.style.setProperty(
        '--wire-opacity',
        String(eased * 0.5),
      );
    });
    core?.style.setProperty('--rack-y', `${(1 - progress) * 20}px`);
    core?.style.setProperty('--rack-scale', String(0.96 + progress * 0.04));
  }
  function schedule() {
    if (!frame && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function resize() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    render();
  }
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    stage.classList.toggle('is-in-view', visible);
    if (visible) render();
  });
  observer.observe(stage);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('nalata:motion-change', render);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible) render();
  });
  render();
}
