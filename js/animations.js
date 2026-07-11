/* ==========================================================================
   VESTA — Animations GSAP ScrollTrigger
   Trois responsabilités :
     1. Intro du hero (lignes masquées) — jouée à la fermeture de l'overlay
     2. Apparitions génériques au scroll ([data-reveal])
     3. Séquence démo pinnée : les Polaroïds convergent, s'embrasent,
        se consument, et le lecteur vidéo se révèle dans la lueur.
   prefers-reduced-motion : tout est désactivé, le contenu reste visible.
   Expose : window.VestaAnimations = { init, DEMO_PIN }
   ========================================================================== */

window.VestaAnimations = (() => {
  'use strict';

  /* Longueur de scroll (px) consacrée à la séquence démo pinnée.
     Lue aussi par tour.js pour traverser la séquence pendant la visite. */
  const DEMO_PIN = 2600;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- 1. Intro du hero --------------------------------------------------- */

  function heroIntro() {
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.hero .eyebrow', { y: 24, opacity: 0, duration: 0.7 })
      .from('.hero-line-inner', { yPercent: 112, duration: 1.0, stagger: 0.12 }, '<0.1')
      .from('.hero-sub', { y: 30, opacity: 0, duration: 0.8 }, '<0.5')
      .from('.hero .btn-cta', { y: 20, opacity: 0, duration: 0.6 }, '<0.2')
      .from('.marquee', { opacity: 0, duration: 0.8 }, '<');
  }

  function initHeroIntro() {
    // L'overlay d'accueil masque le hero : on attend sa fermeture pour jouer
    // l'intro (l'événement est émis par tour.js). Sans overlay → tout de suite.
    if (document.getElementById('tour-overlay')) {
      document.addEventListener('vesta:overlay-closed', heroIntro, { once: true });
    } else {
      heroIntro();
    }
  }

  /* --- 2. Apparitions au scroll ------------------------------------------- */

  function initReveals() {
    gsap.utils.toArray('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        y: 44,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: parseFloat(el.dataset.reveal) || 0, // décalage en cascade (cartes)
        scrollTrigger: { trigger: el, start: 'top 82%' },
      });
    });
  }

  /* --- 3. Séquence démo : Polaroïds → embrasement → vidéo ------------------ */

  /* Léger éventail au point de fusion : les photos s'empilent sans s'aligner
     parfaitement, comme jetées dans l'âtre. Une entrée par Polaroïd. */
  const FUSION_OFFSET = [
    { x: 0,   y: 0,   r: -3 },
    { x: 16,  y: -12, r: 5 },
    { x: -18, y: 8,   r: 2 },
    { x: 12,  y: 16,  r: -6 },
    { x: -10, y: -16, r: 4 },
  ];

  function initDemoSequence() {
    const stage = document.querySelector('.demo-stage');
    const polaroids = gsap.utils.toArray('.polaroid');
    const player = document.querySelector('.demo-player');

    // L'inclinaison initiale vient du HTML (data-rotate), posée par GSAP
    // pour que la rotation vive dans la même transform que x/y animés.
    polaroids.forEach((p) => gsap.set(p, { rotation: parseFloat(p.dataset.rotate) || 0 }));

    // États initiaux des acteurs révélés plus tard
    gsap.set(player, { opacity: 0, scale: 0.85, yPercent: 4 });
    gsap.set('.demo-flash', { opacity: 0, scale: 0.6 });

    /* Déplacement vers le centre de la scène, recalculé à chaque refresh
       de ScrollTrigger (resize) grâce aux valeurs fonctionnelles. */
    const toCenter = (axis) => (i, el) => {
      const s = stage.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const delta = axis === 'x'
        ? (s.left + s.width / 2) - (r.left + r.width / 2)
        : (s.top + s.height / 2) - (r.top + r.height / 2);
      return delta + FUSION_OFFSET[i % FUSION_OFFSET.length][axis];
    };

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: '#demo',
        start: 'top top',
        end: '+=' + DEMO_PIN,
        scrub: 1,            // légère inertie : le scroll "traîne" l'animation
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true, // re-mesure les positions au resize
      },
    });

    tl
      // Le titre s'efface pendant que les photos convergent
      .to('.demo-head', { opacity: 0, y: -40, duration: 0.5 }, 0.15)

      // Phase 1 — convergence : chaque Polaroïd glisse vers le centre
      .to(polaroids, {
        x: toCenter('x'),
        y: toCenter('y'),
        rotation: (i) => FUSION_OFFSET[i % FUSION_OFFSET.length].r,
        scale: 0.95,
        duration: 1.1,
        stagger: 0.07,
      }, 0)

      // Phase 2 — embrasement : les calques de feu montent, tout surchauffe
      .to('.polaroid-burn', { opacity: 1, duration: 0.35, stagger: 0.05 }, 1.05)
      .to(polaroids, { filter: 'brightness(1.9) saturate(1.6)', duration: 0.35 }, 1.05)

      // Le flash éclate, les photos se consument
      .to('.demo-flash', { opacity: 1, scale: 1.3, duration: 0.35, ease: 'power1.in' }, 1.35)
      .to(polaroids, { opacity: 0, scale: 0.45, duration: 0.45 }, 1.5)

      // Phase 3 — révélation : le lecteur émerge de la lueur qui retombe
      .to(player, { opacity: 1, scale: 1, yPercent: 0, duration: 0.7, ease: 'power3.out' }, 1.65)
      .to('.demo-flash', { opacity: 0, scale: 2, duration: 0.5 }, 1.85)

      // Temps mort final : on contemple la vidéo avant que le pin ne lâche
      .to({}, { duration: 0.4 });
  }

  /* --- Init ---------------------------------------------------------------- */

  function init() {
    if (reducedMotion) {
      // Pas de mouvement : les Polaroïds s'estompent, le lecteur reste visible.
      gsap.set('.polaroid', { opacity: 0.25 });
      return;
    }
    initHeroIntro();
    initReveals();
    initDemoSequence();
  }

  return { init, DEMO_PIN };
})();
