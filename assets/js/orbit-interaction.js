/* Orbit 4.0: progressive-enhancement parallax, never reads or stores health data. */
(() => {
  const hero = document.getElementById("hero");
  if (!hero) return;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  let frame = 0, x = 0, y = 0;
  const paint = () => {
    frame = 0;
    hero.style.setProperty("--orbit-x", x.toFixed(3));
    hero.style.setProperty("--orbit-y", y.toFixed(3));
  };
  hero.addEventListener("pointermove", event => {
    if (motion.matches || !finePointer.matches) return;
    const bounds = hero.getBoundingClientRect();
    x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - .5) * 2));
    y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - .5) * 2));
    if (!frame) frame = requestAnimationFrame(paint);
  }, { passive: true });
  hero.addEventListener("pointerleave", () => {
    x = 0; y = 0;
    if (!frame) frame = requestAnimationFrame(paint);
  });
  motion.addEventListener?.("change", () => {
    if (motion.matches) { x = 0; y = 0; if (!frame) frame = requestAnimationFrame(paint); }
  });
})();
