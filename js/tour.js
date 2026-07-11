/* ==========================================================================
   VESTA — Visite guidée automatique
   La mascotte pilote le scroll via Lenis, se déplace sur l'écran à chaque
   étape et commente dans sa bulle. L'utilisateur reprend la main à tout
   moment (molette / toucher / clavier / bouton passer). Un clic sur la
   mascotte relance la visite.
   Expose : window.VestaTour = { init }
   ========================================================================== */

window.VestaTour = (() => {
  'use strict';

  /* Étapes : cible de scroll, position de la mascotte (% viewport) et réplique.
     offset/duration optionnels — les sections pinnées ou empilées sont
     traversées lentement pour que leurs animations se jouent sous les yeux. */
  const STEPS = [
    {
      target: '#top',
      mascot: [82, 76],   // coin bas droit : le titre plein écran reste lisible
      text: 'Bienvenue ✦ Je suis Vesta, l’esprit du foyer. Suivez-moi, je vous fais visiter.',
    },
    {
      target: '#work',
      mascot: [84, 66],   // le manifeste est calé à gauche
      text: 'Ici on dit les choses franchement : vos biens méritent mieux que des photos figées.',
    },
    /* Les trois phases : un arrêt par carte de la pile sticky, sinon le
       glissement traverse tout et seule la dernière reste visible. */
    {
      target: '#phases',
      mascot: [3, 82],    // coin bas gauche, sous le grand numéro
      text: 'Phase un : déposez une photo par pièce, brutes, au smartphone. Vesta lit les volumes et la lumière.',
    },
    {
      target: '#phases',
      offset: () => window.innerHeight,
      duration: 2.2,
      mascot: [3, 82],
      text: 'Phase deux : l’IA monte le film. Caméra, transitions, étalonnage, musique.',
    },
    {
      target: '#phases',
      offset: () => window.innerHeight * 2,
      duration: 2.2,
      mascot: [3, 82],
      text: 'Phase trois : un clic, et le film sort partout. Portails, réseaux, vitrine.',
    },
    {
      target: '#demo',
      offset: () => (window.VestaAnimations ? window.VestaAnimations.DEMO_PIN * 0.95 : 0),
      duration: 4.2,
      mascot: [50, 36],   // au centre : c'est elle qui fait le numéro
      text: 'Et voici mon numéro préféré : je goûte vos photos, et je vous rends un film.',
    },
    {
      target: '#equipe',
      mascot: [6, 74],    // le deck et le titre sont centrés
      text: 'Votre équipe de tournage IA. Cliquez sur les cartes pour la rencontrer.',
    },
    {
      target: '#toolkit',
      mascot: [80, 26],   // en l'air dans l'arène, au-dessus du tas de tags
      text: 'Lancez-moi un tag, je l’attrape au lasso ! Mais ne me touchez pas avec, tout brûle ici.',
    },
    {
      target: '#contact',
      mascot: [8, 74],    // le titre et le bouton sont centrés
      text: 'Prêt à donner vie à vos biens ? C’est par ici. Je vous laisse explorer ✦',
    },
  ];

  const SCROLL_DURATION = 1.8;
  const READ_BASE = 2200;
  const READ_PER_CHAR = 38;

  let overlay;
  let active = false;
  let stepTimer = null;

  /* --- Déroulé ---------------------------------------------------------------- */

  function goToStep(index) {
    if (!active) return;
    if (index >= STEPS.length) return end();

    const step = STEPS[index];
    const duration = step.duration || SCROLL_DURATION;
    const offset = typeof step.offset === 'function' ? step.offset() : (step.offset || 0);

    window.VestaMascot.moveTo(step.mascot[0], step.mascot[1]);
    window.VestaMascot.say(step.text);
    window.VestaScroll.lenis.scrollTo(step.target, { duration, offset });

    const readTime = READ_BASE + step.text.length * READ_PER_CHAR;
    stepTimer = setTimeout(() => goToStep(index + 1), duration * 1000 + readTime);
  }

  function start() {
    if (active) return;
    active = true;
    document.body.classList.add('tour-active');
    window.VestaMascot.setSkip(true);
    goToStep(0);
  }

  function end() {
    active = false;
    clearTimeout(stepTimer);
    document.body.classList.remove('tour-active');
    window.VestaMascot.setSkip(false);
    window.VestaMascot.hideBubble(400);
    window.VestaMascot.home();
  }

  function interrupt() {
    if (!active) return;
    active = false;
    clearTimeout(stepTimer);
    document.body.classList.remove('tour-active');
    window.VestaMascot.setSkip(false);
    window.VestaMascot.say('Je vous laisse la main ✦');
    window.VestaMascot.hideBubble(2000);
    window.VestaMascot.home();
  }

  /* --- Overlay d'accueil --------------------------------------------------------- */

  function closeOverlay() {
    overlay.classList.add('is-closed');
    window.VestaMascot.show();
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    document.dispatchEvent(new CustomEvent('vesta:overlay-closed'));
  }

  /* --- Init ------------------------------------------------------------------------ */

  function init() {
    overlay = document.getElementById('tour-overlay');

    document.getElementById('tour-start').addEventListener('click', () => {
      closeOverlay();
      setTimeout(start, 500);
    });
    document.getElementById('tour-skip-intro').addEventListener('click', closeOverlay);

    // Reprise de main : tout geste de scroll manuel interrompt la visite
    ['wheel', 'touchmove'].forEach((evt) =>
      window.addEventListener(evt, interrupt, { passive: true })
    );
    window.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) interrupt();
    });

    window.VestaMascot.onSkipClick(interrupt);
    window.VestaMascot.onBodyClick(() => {
      // Pas de relance pendant qu'elle joue dans l'arène du toolkit
      const docked = document.getElementById('mascot').classList.contains('is-docked');
      if (!active && !docked) start();
    });

    // Accessibilité : pas de visite auto en mouvement réduit
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.getElementById('tour-start').style.display = 'none';
    }
  }

  return { init };
})();
