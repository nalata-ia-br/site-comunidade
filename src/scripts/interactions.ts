import { animate, inView, scroll, stagger } from 'motion';
import { isMotionPaused } from './motion-state';

const desktop = window.matchMedia('(min-width: 761px)');
const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const mobileNav = document.querySelector<HTMLElement>('#mobile-nav');

function closeMenu(returnFocus = false) {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menu');
  if (mobileNav) mobileNav.hidden = true;
  if (returnFocus) menuButton?.focus();
}

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  if (mobileNav) mobileNav.hidden = !open;
});
mobileNav?.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => {
    closeMenu();
    const target = document.querySelector<HTMLElement>(
      link.getAttribute('href') || '',
    );
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.addEventListener(
        'blur',
        () => target.removeAttribute('tabindex'),
        { once: true },
      );
    }
  }),
);
document.addEventListener('keydown', (event) => {
  if (
    event.key === 'Escape' &&
    menuButton?.getAttribute('aria-expanded') === 'true'
  )
    closeMenu(true);
});
document.addEventListener('click', (event) => {
  if (
    event.target instanceof Node &&
    !document.querySelector('.site-header')?.contains(event.target)
  )
    closeMenu();
});
desktop.addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});

const animationCleanup: Array<() => void> = [];
function setupMotion() {
  if (isMotionPaused()) return;
  const headline = animate(
    '.headline-line',
    { opacity: [0, 1], y: [22, 0], filter: ['blur(8px)', 'blur(0px)'] },
    { duration: 0.85, delay: stagger(0.12), ease: [0.22, 1, 0.36, 1] },
  );
  const intro = animate(
    '.hero-enter:not(.hero-description)',
    { opacity: [0, 1], y: [12, 0] },
    {
      duration: 0.65,
      delay: stagger(0.08, { startDelay: 0.15 }),
      ease: [0.22, 1, 0.36, 1],
    },
  );
  const descriptionEntrance = animate(
    '.hero-description',
    { y: [8, 0] },
    { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  );
  animationCleanup.push(
    () => headline.complete(),
    () => intro.complete(),
    () => descriptionEntrance.complete(),
  );

  // Content is visible by default, including if JavaScript fails or is disabled.
  document.querySelectorAll<HTMLElement>('.reveal').forEach((element) => {
    if (element.getBoundingClientRect().top <= window.innerHeight) return;
    element.style.opacity = '0';
    const stop = inView(
      element,
      () => {
        const isText = element.classList.contains('text-reveal');
        const animation = animate(
          element,
          {
            opacity: [0, 1],
            y: [isText ? 22 : 18, 0],
            ...(isText ? { filter: ['blur(5px)', 'blur(0px)'] } : {}),
          },
          { duration: isText ? 0.8 : 0.65, ease: [0.22, 1, 0.36, 1] },
        );
        animationCleanup.push(() => animation.complete());
      },
      { margin: '0px 0px -35px 0px' },
    );
    animationCleanup.push(stop, () => {
      element.style.opacity = '1';
      element.style.transform = '';
      element.style.filter = '';
    });
  });
  document.querySelectorAll<HTMLElement>('.text-reveal').forEach((heading) => {
    if (!heading.dataset.split) {
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) nodes.push(node as Text);
      nodes.forEach((text) => {
        const fragment = document.createDocumentFragment();
        (text.textContent || '').split(/(\s+)/).forEach((word) => {
          if (!word.trim()) {
            fragment.append(document.createTextNode(word));
            return;
          }
          const span = document.createElement('span');
          span.className = 'motion-word';
          span.textContent = word;
          fragment.append(span);
        });
        text.replaceWith(fragment);
      });
      heading.dataset.split = 'true';
    }
    const words = Array.from(
      heading.querySelectorAll<HTMLElement>('.motion-word'),
    );
    const motion = animate(
      words,
      { opacity: [0.18, 1], y: [12, 0] },
      { duration: 0.8, delay: stagger(0.065), ease: 'linear' },
    );
    const stop = scroll(motion, {
      target: heading,
      offset: ['start 0.95', 'end 0.65'],
    });
    animationCleanup.push(stop, () => {
      motion.complete();
      words.forEach((word) => {
        word.style.opacity = '1';
        word.style.transform = '';
      });
    });
  });
  const progress = document.querySelector<HTMLElement>('.scroll-progress');
  if (progress)
    animationCleanup.push(
      scroll(animate(progress, { scaleX: [0, 1] }, { ease: 'linear' })),
    );

  // Animate only the visible hero with transform-only updates, never a scroll hijack.
  const scene = document.querySelector<HTMLElement>('.hardware-scene');
  const layers = Array.from(
    document.querySelectorAll<HTMLElement>('.parallax-layer'),
  );
  let sceneVisible = true;
  let frame = 0;
  const observer = new IntersectionObserver((entries) => {
    sceneVisible = entries[0].isIntersecting;
    scene?.classList.toggle('is-in-view', sceneVisible);
    if (sceneVisible) updateParallax();
  });
  if (scene) observer.observe(scene);
  const updateParallax = () => {
    frame = 0;
    if (!sceneVisible || !desktop.matches) return;
    const offset = Math.min(window.scrollY, 950);
    if (scene)
      scene.style.setProperty(
        '--scene-scroll',
        String(Math.min(offset / 850, 1)),
      );
    layers.forEach((layer) => {
      layer.style.translate = `0 ${offset * Number(layer.dataset.depth || 0)}px`;
    });
  };
  const onScroll = () => {
    if (!frame && sceneVisible) frame = requestAnimationFrame(updateParallax);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  const resetParallax = () => {
    if (!desktop.matches)
      layers.forEach((layer) => {
        layer.style.translate = '';
      });
  };
  desktop.addEventListener('change', resetParallax);
  animationCleanup.push(() => {
    window.removeEventListener('scroll', onScroll);
    desktop.removeEventListener('change', resetParallax);
    cancelAnimationFrame(frame);
    observer.disconnect();
    layers.forEach((layer) => {
      layer.style.translate = '';
    });
    scene?.style.setProperty('--scene-scroll', '0');
  });
}
setupMotion();
window.addEventListener('nalata:motion-change', () => {
  animationCleanup.splice(0).forEach((cleanup) => cleanup());
  if (!isMotionPaused()) setupMotion();
});

if (window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('.spotlight-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (isMotionPaused()) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    });
  });
}

const magneticButtons =
  document.querySelectorAll<HTMLElement>('.button, .nav-join');
if (window.matchMedia('(pointer: fine)').matches) {
  magneticButtons.forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      if (isMotionPaused()) return;
      const rect = button.getBoundingClientRect();
      button.style.translate = `${(event.clientX - rect.left - rect.width / 2) * 0.07}px ${(event.clientY - rect.top - rect.height / 2) * 0.12}px`;
    });
    button.addEventListener('pointerleave', () => {
      button.style.translate = '';
    });
  });
}
window.addEventListener('nalata:motion-change', () => {
  if (isMotionPaused())
    magneticButtons.forEach((button) => {
      button.style.translate = '';
    });
});
