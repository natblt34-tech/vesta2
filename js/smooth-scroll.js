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

  const root = document.documentElement;
  const NAV_OFFSET = -80; // la nav fixe ne doit plus recouvrir le haut des sections

  // ScrollTrigger recalcule ses positions à chaque frame ; on en profite pour
  // alimenter la barre de progression (--sp) et signaler le premier défilement.
  lenis.on('scroll', ({ scroll, progress }) => {
    if (window.ScrollTrigger) ScrollTrigger.update();
    const p = typeof progress === 'number' ? progress : 0;
    root.style.setProperty('--sp', p.toFixed(4));
    document.body.classList.toggle('scrolled', (scroll || 0) > 12);
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
    // #top revient tout en haut ; les autres ancres laissent la place à la nav
    const offset = link.getAttribute('href') === '#top' ? 0 : NAV_OFFSET;
    lenis.scrollTo(target, { duration: 1.4, offset });
  });

  return { lenis };
})();
