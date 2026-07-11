/* ==========================================================================
   VESTA — Smooth scroll (Lenis)
   Instancie Lenis et le synchronise avec GSAP ScrollTrigger :
   - Lenis notifie ScrollTrigger à chaque frame de scroll
   - une SEULE boucle rAF (celle de GSAP) pilote Lenis → zéro double raf
   Expose : window.VestaScroll = { lenis }
   ========================================================================== */

window.VestaScroll = (() => {
  'use strict';

  const lenis = new Lenis({
    duration: 1.2,                                   // inertie douce, proche de la référence
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  // ScrollTrigger doit recalculer ses positions à chaque frame de Lenis
  lenis.on('scroll', () => {
    if (window.ScrollTrigger) ScrollTrigger.update();
  });

  // Une seule boucle rAF : le ticker GSAP pilote Lenis (temps en ms)
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Les ancres internes glissent via Lenis au lieu de sauter brutalement
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.4 });
  });

  return { lenis };
})();
