/* ==========================================================================
   VESTA — Point d'entrée
   Ordre d'initialisation :
   1. Smooth scroll (Lenis)   → auto-instancié par smooth-scroll.js
   2. Animations ScrollTrigger
   3. Mascotte (l'esprit du foyer)
   4. Visite guidée
   5. Toolkit physique (Matter.js)
   6. Braises (canvas)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  window.VestaAnimations.init();
  window.VestaMascot.init();
  window.VestaTour.init();
  window.VestaPhysics.init();
  window.VestaParticles.init();
  window.VestaCursor.init();

  console.info('[Vesta] Site complet — architecture calquée sur la référence.');
});
