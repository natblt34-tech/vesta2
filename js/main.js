/* ==========================================================================
   VESTA — Point d'entrée
   Orchestre l'initialisation des modules dans l'ordre :
   1. Smooth scroll (Lenis)  → auto-instancié par smooth-scroll.js
   2. Animations (GSAP)      → Étape 3
   3. Visite guidée          → tour.js
   4. Particules (canvas)    → Étape 4
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  window.VestaAnimations.init();
  window.VestaTour.init();
  window.VestaParticles.init();

  console.info('[Vesta] Étape 4 — DA finale + braises. Site complet.');
});
