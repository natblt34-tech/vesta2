/* ==========================================================================
   VESTA — Animations GSAP ScrollTrigger
   Vocabulaire (déclaré dans le HTML, comme sur le site de référence) :
     [data-reveal] / [data-reveal-delay]  apparitions au scroll
     [data-scramble]                       labels mono qui se "déchiffrent"
     [data-count]                          compteurs 0 → valeur
     .fillword-box                         mot rotatif barré du manifeste
     .phase-card                           pile sticky (profondeur au scroll)
     #demo                                 séquence pinnée Polaroïds → vidéo
     #work-rows / #work-preview            aperçu flottant au survol
     [data-faq]                            accordéon FAQ
   prefers-reduced-motion : tout est neutralisé, le contenu reste visible.
   Expose : window.VestaAnimations = { init, DEMO_PIN }
   ========================================================================== */

window.VestaAnimations = (() => {
  'use strict';

  const DEMO_PIN = 2600; // px de scroll consacrés à la séquence démo (lu par tour.js)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Reveals génériques --------------------------------------------------- */

  function initReveals() {
    gsap.utils.toArray('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        y: 42,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: parseFloat(el.dataset.revealDelay) || 0,
        scrollTrigger: { trigger: el, start: 'top 84%' },
      });
    });
  }

  /* --- Scramble : les labels mono se déchiffrent à l'arrivée ----------------- */

  const SCRAMBLE_POOL = '▘▝▖▗◆✦#%*+·';

  function scrambleEl(el) {
    const target = el.textContent;
    const proxy = { p: 0 };
    gsap.to(proxy, {
      p: 1,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate() {
        const solved = Math.floor(proxy.p * target.length);
        el.textContent =
          target.slice(0, solved) +
          [...target.slice(solved)]
            .map((c) => (c === ' ' ? ' ' : SCRAMBLE_POOL[(Math.random() * SCRAMBLE_POOL.length) | 0]))
            .join('');
      },
      onComplete() { el.textContent = target; },
    });
  }

  function initScrambles() {
    gsap.utils.toArray('[data-scramble]').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => scrambleEl(el),
      });
    });
  }

  /* --- Fillword : le mot rotatif du manifeste --------------------------------- */

  const FILL_WORDS = [
    { text: 'des photos figées.', strike: true },
    { text: 'des slideshows.', strike: true },
    { text: 'des visites 360°.', strike: true },
    { text: 'un simple lien.', strike: true },
    { text: 'ça : un film.', strike: false }, // le mot final, doré, tient plus longtemps
  ];

  function initFillword() {
    const box = document.querySelector('.fillword-box');
    if (!box) return;
    const textEl = box.querySelector('.fw-text');
    const strikeEl = box.querySelector('.fw-strike');
    let index = 0;
    let running = false;

    function playWord() {
      const word = FILL_WORDS[index];
      const isFinal = !word.strike;
      box.classList.toggle('is-final', isFinal);
      textEl.textContent = word.text;

      const tl = gsap.timeline({
        onComplete() {
          index = (index + 1) % FILL_WORDS.length;
          playWord();
        },
      });

      tl.set(strikeEl, { scaleX: 0 })
        .fromTo(textEl, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });

      if (word.strike) {
        tl.to(strikeEl, { scaleX: 1, duration: 0.35, ease: 'power2.inOut' }, '+=0.55')
          .to(textEl, { yPercent: -50, opacity: 0, duration: 0.4, ease: 'power3.in' }, '+=0.35');
      } else {
        tl.to(textEl, { yPercent: -50, opacity: 0, duration: 0.4, ease: 'power3.in' }, '+=2.6');
      }
    }

    // La rotation ne démarre qu'une fois le manifeste visible
    ScrollTrigger.create({
      trigger: box,
      start: 'top 85%',
      once: true,
      onEnter() {
        if (!running) { running = true; playWord(); }
      },
    });
  }

  /* --- Compteurs ---------------------------------------------------------------- */

  function initCounters() {
    gsap.utils.toArray('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const proxy = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () =>
          gsap.to(proxy, {
            v: target,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate() { el.textContent = Math.round(proxy.v).toLocaleString('fr-FR'); },
          }),
      });
    });
  }

  /* --- Pile sticky : la carte du dessous s'enfonce quand la suivante recouvre --- */

  function initStackDepth() {
    const cards = gsap.utils.toArray('.phase-card');
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      gsap.to(card.querySelector('.phase-inner'), {
        scale: 0.94,
        opacity: 0.45,
        ease: 'none',
        scrollTrigger: {
          trigger: next,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
        },
      });
    });
  }

  /* --- Nav : fond opaque dès qu'on quitte le sommet ------------------------------- */

  function initNav() {
    const nav = document.getElementById('site-nav');
    ScrollTrigger.create({
      start: 50,
      end: 'max',
      onToggle: (self) => nav.classList.toggle('is-scrolled', self.isActive),
    });
  }

  /* --- Intro du hero (lignes masquées) --------------------------------------------- */

  function heroIntro() {
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.hero-pill', { y: 24, opacity: 0, duration: 0.7 })
      .from('.hero-line-inner', { yPercent: 112, duration: 1.0, stagger: 0.12 }, '<0.1')
      .from('.hero-foot', { y: 30, opacity: 0, duration: 0.8 }, '<0.5')
      .from('.marquee', { opacity: 0, duration: 0.8 }, '<');
  }

  function initHeroIntro() {
    if (document.getElementById('tour-overlay')) {
      document.addEventListener('vesta:overlay-closed', heroIntro, { once: true });
    } else {
      heroIntro();
    }
  }

  /* --- Séquence démo : Polaroïds → embrasement → vidéo ------------------------------ */

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

    polaroids.forEach((p) => gsap.set(p, { rotation: parseFloat(p.dataset.rotate) || 0 }));
    gsap.set(player, { opacity: 0, scale: 0.85, yPercent: 4 });
    gsap.set('.demo-flash', { opacity: 0, scale: 0.6 });

    const toCenter = (axis) => (i, el) => {
      const s = stage.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const delta = axis === 'x'
        ? (s.left + s.width / 2) - (r.left + r.width / 2)
        : (s.top + s.height / 2) - (r.top + r.height / 2);
      return delta + FUSION_OFFSET[i % FUSION_OFFSET.length][axis];
    };

    gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: '#demo',
        start: 'top top',
        end: '+=' + DEMO_PIN,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    })
      .to('.demo-head', { opacity: 0, y: -40, duration: 0.5 }, 0.15)
      .to(polaroids, {
        x: toCenter('x'),
        y: toCenter('y'),
        rotation: (i) => FUSION_OFFSET[i % FUSION_OFFSET.length].r,
        scale: 0.95,
        duration: 1.1,
        stagger: 0.07,
      }, 0)
      .to('.polaroid-burn', { opacity: 1, duration: 0.35, stagger: 0.05 }, 1.05)
      .to(polaroids, { filter: 'brightness(1.9) saturate(1.6)', duration: 0.35 }, 1.05)
      .to('.demo-flash', { opacity: 1, scale: 1.3, duration: 0.35, ease: 'power1.in' }, 1.35)
      .to(polaroids, { opacity: 0, scale: 0.45, duration: 0.45 }, 1.5)
      .to(player, { opacity: 1, scale: 1, yPercent: 0, duration: 0.7, ease: 'power3.out' }, 1.65)
      .to('.demo-flash', { opacity: 0, scale: 2, duration: 0.5 }, 1.85)
      .to({}, { duration: 0.4 });
  }

  /* --- Biens sublimés : aperçu flottant au survol -------------------------------------- */

  function initWorkPreview() {
    const rows = document.getElementById('work-rows');
    const preview = document.getElementById('work-preview');
    if (!rows || !preview) return;

    const label = preview.querySelector('.work-preview-label');
    const xTo = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3.out' });

    rows.addEventListener('mousemove', (e) => {
      xTo(e.clientX + 24);
      yTo(e.clientY - 210);
    });

    rows.querySelectorAll('.work-row').forEach((row) => {
      row.addEventListener('mouseenter', () => {
        preview.dataset.tint = row.dataset.tint;
        label.textContent = row.querySelector('.work-name').textContent + ' — film vesta';
        gsap.to(preview, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' });
      });
    });

    rows.addEventListener('mouseleave', () => {
      gsap.to(preview, { opacity: 0, scale: 0.92, duration: 0.3, ease: 'power3.in' });
    });

    gsap.set(preview, { scale: 0.92 });
  }

  /* --- Deck : cartes staff cliquables --------------------------------------------------- */

  function initDeck() {
    const deck = document.getElementById('deck');
    if (!deck) return;
    let order = gsap.utils.toArray(deck.querySelectorAll('.staff-card'));
    let animating = false;

    // Éventail : la carte 0 est dessus, les suivantes dépassent derrière
    function layout(animate) {
      order.forEach((card, i) => {
        const props = {
          x: i * 7,
          y: -i * 12,
          rotation: (i % 2 ? 1 : -1) * i * 1.6,
          scale: 1 - i * 0.03,
          zIndex: order.length - i,
          duration: 0.45,
          ease: 'power3.out',
        };
        animate ? gsap.to(card, props) : gsap.set(card, props);
      });
    }

    // Clic : la carte du dessus est "jetée" et se range derrière
    deck.addEventListener('click', () => {
      if (animating) return;
      animating = true;
      const top = order.shift();
      order.push(top);

      gsap.timeline({ onComplete: () => { animating = false; } })
        .to(top, { x: 300, rotation: 16, opacity: 0, duration: 0.32, ease: 'power2.in' })
        .add(() => layout(true))
        .to(top, { opacity: 1, duration: 0.3 }, '<0.15');
    });

    layout(false);
  }

  /* --- FAQ : accordéon ------------------------------------------------------------------- */

  function initFaq() {
    gsap.utils.toArray('[data-faq]').forEach((item) => {
      const question = item.querySelector('.faq-q');
      const answer = item.querySelector('.faq-a');
      question.addEventListener('click', () => {
        const open = item.classList.toggle('is-open');
        gsap.to(answer, {
          height: open ? answer.scrollHeight : 0,
          duration: 0.45,
          ease: 'power2.inOut',
        });
      });
    });
  }

  /* --- Init ---------------------------------------------------------------------------------- */

  function staticFallback() {
    // Pas de mouvement : valeurs finales posées, tout reste lisible
    gsap.utils.toArray('[data-count]').forEach((el) => {
      el.textContent = parseFloat(el.dataset.count).toLocaleString('fr-FR');
    });
    gsap.set('.polaroid', { opacity: 0.25 });
    initFaq(); // l'accordéon reste utilisable
  }

  function init() {
    if (reducedMotion) { staticFallback(); return; }
    initReveals();
    initScrambles();
    initFillword();
    initCounters();
    initStackDepth();
    initNav();
    initHeroIntro();
    initDemoSequence();
    initWorkPreview();
    initDeck();
    initFaq();
  }

  return { init, DEMO_PIN };
})();
