import { isMotionPaused } from './motion-state';
const canvas = document.querySelector<HTMLCanvasElement>('.atmosphere-canvas');
const context = canvas?.getContext('2d', { alpha: true });
if (canvas && context) {
  const surface = canvas;
  const ctx = context;
  let width = 0,
    height = 0,
    frame = 0,
    lastTime = 0,
    elapsed = 0;
  let cursor = { x: 0, y: 0 },
    targetCursor = { x: 0, y: 0 };
  let scrollOffset = window.scrollY;
  let points: Array<{
    x: number;
    y: number;
    radius: number;
    speed: number;
    phase: number;
  }> = [];
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    surface.width = Math.round(width * ratio);
    surface.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    points = Array.from({ length: width < 700 ? 27 : 65 }, (_, i) => ({
      x: ((i * 0.61803398875) % 1) * width,
      y: ((i * 0.41421356237 + 0.13) % 1) * height,
      radius: i % 8 === 0 ? 1.7 : 0.8,
      speed: 0.22 + (i % 5) * 0.1,
      phase: i * 1.37,
    }));
    draw();
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    const positions = points.map((point) => ({
      x:
        point.x +
        Math.sin(elapsed * 0.13 + point.phase) * 24 +
        cursor.x * point.speed,
      y:
        ((((point.y -
          elapsed * point.speed * 4 -
          scrollOffset * point.speed * 0.09) %
          height) +
          height) %
          height) +
        cursor.y * point.speed,
    }));
    positions.forEach((point, i) => {
      const twinkle =
        0.25 + (1 + Math.sin(elapsed * 0.6 + points[i].phase)) * 0.18;
      ctx.fillStyle = `rgba(140,197,246,${twinkle})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, points[i].radius, 0, Math.PI * 2);
      ctx.fill();
      if (i % 8 === 0) {
        ctx.strokeStyle = `rgba(135,197,244,${twinkle * 0.4})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(point.x - 4, point.y);
        ctx.lineTo(point.x + 4, point.y);
        ctx.moveTo(point.x, point.y - 4);
        ctx.lineTo(point.x, point.y + 4);
        ctx.stroke();
      }
      for (let j = i + 1; j < Math.min(i + 8, positions.length); j++) {
        const other = positions[j];
        const distance = Math.hypot(point.x - other.x, point.y - other.y);
        if (distance > 150) continue;
        ctx.strokeStyle = `rgba(91,162,225,${(1 - distance / 150) * 0.1})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    });
  }
  function tick(time: number) {
    frame = 0;
    if (isMotionPaused() || document.hidden) return;
    if (time - lastTime >= (width < 700 ? 50 : 33)) {
      elapsed += Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      cursor.x += (targetCursor.x - cursor.x) * 0.055;
      cursor.y += (targetCursor.y - cursor.y) * 0.055;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = performance.now();
    if (!isMotionPaused() && !document.hidden)
      frame = requestAnimationFrame(tick);
    else draw();
  }
  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse' || isMotionPaused()) return;
      targetCursor = {
        x: (event.clientX / width - 0.5) * 26,
        y: (event.clientY / height - 0.5) * 20,
      };
    },
    { passive: true },
  );
  window.addEventListener(
    'scroll',
    () => {
      if (!isMotionPaused()) scrollOffset = window.scrollY;
    },
    { passive: true },
  );
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('nalata:motion-change', sync);
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('page-inactive', document.hidden);
    sync();
  });
  resize();
  sync();
}
