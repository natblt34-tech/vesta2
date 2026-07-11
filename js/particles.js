/* ==========================================================================
   VESTA — Système de particules "braises divines"
   Canvas 2D plein écran derrière le contenu : des braises chaudes s'élèvent
   lentement en dérivant, avec un scintillement doux.
   Choix de performance (60fps garanti) :
     - pool d'objets FIXE, dimensionné à la surface de l'écran (aucune
       allocation pendant l'animation)
     - la braise est un sprite pré-rendu une seule fois (radial gradient) ;
       à chaque frame on ne fait que des drawImage — pas de shadowBlur
     - AUCUNE boucle rAF supplémentaire : on se branche sur le ticker GSAP
       qui pilote déjà Lenis (une seule boucle pour tout le site)
     - pause automatique quand l'onglet est masqué (document.hidden)
     - prefers-reduced-motion : le canvas est retiré, rien ne tourne
   Expose : window.VestaParticles = { init }
   ========================================================================== */

window.VestaParticles = (() => {
  'use strict';

  const DENSITY = 1 / 26000;  // une braise pour ~26 000 px² d'écran
  const MAX_EMBERS = 80;      // plafond absolu, quel que soit l'écran
  const SPRITE_SIZE = 64;     // résolution du sprite pré-rendu

  let canvas, ctx, sprite;
  let width = 0;
  let height = 0;
  let embers = [];

  /* --- Sprite : une braise avec son halo, dessinée une seule fois --------- */

  function makeSprite() {
    const s = document.createElement('canvas');
    s.width = s.height = SPRITE_SIZE;
    const g = s.getContext('2d');
    const half = SPRITE_SIZE / 2;
    const grad = g.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0,    'rgba(255, 240, 210, 1)');   /* cœur incandescent */
    grad.addColorStop(0.25, 'rgba(255, 179, 71, 0.85)'); /* braise */
    grad.addColorStop(0.6,  'rgba(255, 122, 26, 0.22)'); /* halo feu */
    grad.addColorStop(1,    'rgba(255, 122, 26, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    return s;
  }

  /* --- Cycle de vie d'une braise ------------------------------------------ */

  /* (Re)initialise une braise. fromBottom : les braises recyclées renaissent
     sous le bord bas ; au premier remplissage elles sont semées partout. */
  function resetEmber(e, fromBottom) {
    e.x = Math.random() * width;
    e.y = fromBottom ? height + 12 : Math.random() * height;
    e.size = 4 + Math.random() * 8;                 // taille affichée (px)
    e.speed = 14 + Math.random() * 26;              // vitesse d'ascension (px/s)
    e.driftAmp = 8 + Math.random() * 18;            // amplitude de la dérive
    e.driftFreq = 0.3 + Math.random() * 0.5;        // fréquence de la dérive
    e.phase = Math.random() * Math.PI * 2;
    e.alpha = 0.15 + Math.random() * 0.5;           // luminosité de base
    e.flicker = 1.5 + Math.random() * 2.5;          // vitesse de scintillement
    return e;
  }

  function buildPool() {
    const target = Math.min(MAX_EMBERS, Math.round(width * height * DENSITY));
    while (embers.length < target) embers.push(resetEmber({}, false));
    embers.length = target; // rétrécit le pool si l'écran a rapetissé
  }

  /* --- Rendu ---------------------------------------------------------------- */

  function frame(time, deltaMS) {
    if (document.hidden) return;                    // onglet masqué : on ne paie rien
    const dt = Math.min(deltaMS, 100) / 1000;       // clampé : pas de saut après un lag

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      e.y -= e.speed * dt;
      e.x += Math.cos(time * e.driftFreq + e.phase) * e.driftAmp * dt;

      if (e.y < -SPRITE_SIZE) resetEmber(e, true);  // recyclée, jamais réallouée

      // Scintillement : la braise respire entre 55% et 100% de son alpha
      ctx.globalAlpha = e.alpha * (0.775 + 0.225 * Math.sin(time * e.flicker + e.phase));
      ctx.drawImage(sprite, e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    // dpr plafonné à 1.5 : indiscernable pour des halos flous, deux fois
    // moins de pixels à remplir qu'en dpr 2+
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildPool();
  }

  /* --- Init ------------------------------------------------------------------ */

  function init() {
    canvas = document.getElementById('embers');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.remove();
      return;
    }

    ctx = canvas.getContext('2d');
    sprite = makeSprite();
    resize();
    window.addEventListener('resize', resize);

    // Une seule boucle pour tout le site : le ticker GSAP (qui pilote Lenis)
    gsap.ticker.add(frame);
  }

  return { init };
})();
