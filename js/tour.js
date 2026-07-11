/* ==========================================================================
   VESTA — Visite guidée automatique
   L'esprit de Vesta (petite flamme) pilote le scroll via Lenis et commente
   chaque section dans une bulle. L'utilisateur reprend la main à tout
   moment : molette / toucher / clavier / bouton "Passer la visite".
   Un clic sur la flamme relance la visite.
   Expose : window.VestaTour = { init }
   ========================================================================== */

window.VestaTour = (() => {
  'use strict';

  /* Étapes de la visite : cible à atteindre + réplique de la flamme.
     La durée d'affichage s'adapte à la longueur du texte.
     offset (px ou fonction) et duration (s) sont optionnels — l'étape démo
     traverse lentement toute la séquence pinnée pour que la fusion se joue
     sous les yeux du visiteur. */
  const STEPS = [
    {
      target: '#hero',
      text: 'Bienvenue. Je suis l’esprit de Vesta ✦ Ici, de simples photos deviennent des films. Suivez-moi.',
    },
    {
      target: '#demo',
      // On glisse jusqu'à 95% de la séquence pinnée : convergence,
      // embrasement et révélation de la vidéo se jouent pendant le trajet.
      offset: () => (window.VestaAnimations ? window.VestaAnimations.DEMO_PIN * 0.95 : 0),
      duration: 4.2,
      text: 'Regardez bien : une photo par pièce… et Vesta les fusionne en un plan-séquence continu, comme tourné en une seule prise.',
    },
    {
      target: '#features',
      text: 'Trois gestes, aucune caméra. Vous déposez, l’IA compose, vous publiez. Vos annonces changent de catégorie.',
    },
    {
      target: '#contact',
      text: 'Prêt à donner vie à vos biens ? C’est par ici. Je vous laisse explorer ✦',
    },
  ];

  const SCROLL_DURATION = 1.8;      // durée du glissement Lenis vers chaque section (s)
  const READ_BASE = 2200;           // temps de lecture minimal d'une bulle (ms)
  const READ_PER_CHAR = 38;         // + par caractère (ms)

  let overlay, guide, bubble, flameBtn, stopBtn;
  let active = false;
  let stepTimer = null;
  let bubbleTimer = null;

  /* --- Bulle de dialogue ------------------------------------------------ */

  function say(text) {
    clearTimeout(bubbleTimer);
    bubble.textContent = text;
    bubble.classList.add('is-visible');
  }

  function hideBubble(delay = 0) {
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('is-visible'), delay);
  }

  /* --- Déroulé de la visite --------------------------------------------- */

  function goToStep(index) {
    if (!active) return;
    if (index >= STEPS.length) return end();

    const step = STEPS[index];
    const duration = step.duration || SCROLL_DURATION;
    const offset = typeof step.offset === 'function' ? step.offset() : (step.offset || 0);

    say(step.text);
    window.VestaScroll.lenis.scrollTo(step.target, { duration, offset });

    // Étape suivante une fois le texte "lu" (durée proportionnelle au texte)
    const readTime = READ_BASE + step.text.length * READ_PER_CHAR;
    stepTimer = setTimeout(() => goToStep(index + 1), duration * 1000 + readTime);
  }

  function start() {
    if (active) return;
    active = true;
    document.body.classList.add('tour-active');
    stopBtn.hidden = false;
    goToStep(0);
  }

  /* Fin naturelle : la flamme conclut puis se tait. */
  function end() {
    active = false;
    document.body.classList.remove('tour-active');
    stopBtn.hidden = true;
    hideBubble(400);
  }

  /* Interruption (utilisateur) : la flamme rend la main immédiatement. */
  function interrupt() {
    if (!active) return;
    active = false;
    clearTimeout(stepTimer);
    document.body.classList.remove('tour-active');
    stopBtn.hidden = true;
    say('Je vous laisse la main ✦');
    hideBubble(2000);
  }

  /* --- Overlay d'accueil ------------------------------------------------ */

  function closeOverlay() {
    overlay.classList.add('is-closed');
    guide.hidden = false;
    // L'overlay est retiré du flux une fois sa transition terminée
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    // Signale au reste du site que le rideau se lève (déclenche l'intro du hero)
    document.dispatchEvent(new CustomEvent('vesta:overlay-closed'));
  }

  /* --- Init ------------------------------------------------------------- */

  function init() {
    overlay = document.getElementById('tour-overlay');
    guide = document.getElementById('tour-guide');
    bubble = guide.querySelector('.tour-bubble');
    flameBtn = guide.querySelector('.tour-flame');
    stopBtn = guide.querySelector('.tour-stop');

    // Choix d'entrée : visite guidée ou exploration libre
    document.getElementById('tour-start').addEventListener('click', () => {
      closeOverlay();
      // Petit délai pour laisser l'overlay s'effacer avant de partir
      setTimeout(start, 450);
    });
    document.getElementById('tour-skip-intro').addEventListener('click', closeOverlay);

    // Reprise de contrôle : toute interaction de scroll manuelle interrompt
    ['wheel', 'touchmove'].forEach((evt) =>
      window.addEventListener(evt, interrupt, { passive: true })
    );
    window.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) interrupt();
    });

    stopBtn.addEventListener('click', interrupt);

    // La flamme reste cliquable après coup pour relancer la visite
    flameBtn.addEventListener('click', () => {
      if (!active) start();
    });

    // Accessibilité : pas de visite auto si l'utilisateur refuse le mouvement
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.getElementById('tour-start').style.display = 'none';
    }
  }

  return { init };
})();
