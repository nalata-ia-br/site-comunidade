const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let manuallyPaused = false;
try {
  manuallyPaused = localStorage.getItem('nalata-motion') === 'paused';
} catch {
  /* Storage is optional. */
}
export const isMotionPaused = () => preference.matches || manuallyPaused;
function publishMotionState() {
  const paused = isMotionPaused();
  document.documentElement.dataset.motion = paused ? 'paused' : 'running';
  const button = document.querySelector<HTMLButtonElement>('.motion-toggle');
  const label = preference.matches
    ? 'Movimento reduzido ativado'
    : paused
      ? 'Retomar animações'
      : 'Pausar animações';
  if (button) {
    button.hidden = false;
    button.disabled = preference.matches;
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', label);
    const tooltip = button.querySelector<HTMLElement>('.motion-tooltip');
    if (tooltip) tooltip.textContent = label;
  }
  window.dispatchEvent(
    new CustomEvent('nalata:motion-change', { detail: { paused } }),
  );
}
document.querySelector('.motion-toggle')?.addEventListener('click', () => {
  manuallyPaused = !manuallyPaused;
  try {
    localStorage.setItem(
      'nalata-motion',
      manuallyPaused ? 'paused' : 'running',
    );
  } catch {
    /* Storage is optional. */
  }
  publishMotionState();
});
preference.addEventListener('change', publishMotionState);
publishMotionState();
