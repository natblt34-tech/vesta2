/* ==========================================================================
   VESTA — Curseur personnalisé
   Un point-braise incandescent suivi d'un anneau d'or traînant. L'anneau
   s'ouvre et prend feu au survol des éléments interactifs.
   Désactivé sur écran tactile (le curseur natif n'y existe pas) et si
   l'utilisateur préfère un mouvement réduit.
   Expose : window.VestaCursor = { init }
   ========================================================================== */

window.VestaCursor = (() => {
  'use strict';

  const HOT_SELECTOR = 'a, button, .tool-tag, .deck, .faq-q, .work-row';

  function init() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.append(ring, dot);
    document.documentElement.classList.add('has-cursor');

    // Le point colle au curseur, l'anneau traîne derrière
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3.out' });

    gsap.set([dot, ring], { opacity: 0 });

    window.addEventListener('mousemove', (e) => {
      gsap.set(dot, { x: e.clientX, y: e.clientY, opacity: 1 });
      gsap.set(ring, { opacity: 1 });
      ringX(e.clientX);
      ringY(e.clientY);

      const hot = e.target.closest ? e.target.closest(HOT_SELECTOR) : null;
      document.documentElement.classList.toggle('cursor-hot', !!hot);
    }, { passive: true });

    // Le curseur s'efface quand la souris quitte la fenêtre
    document.documentElement.addEventListener('mouseleave', () =>
      gsap.to([dot, ring], { opacity: 0, duration: 0.25 })
    );
    document.documentElement.addEventListener('mouseenter', () =>
      gsap.to([dot, ring], { opacity: 1, duration: 0.25 })
    );
  }

  return { init };
})();
