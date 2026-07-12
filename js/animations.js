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
    { text: 'ça : un film.', strike: false }, // le mot final, doré, tient plus longtemps
  ];

  function initFillword() {
    const box = document.querySelector('.fillword-box');
    if (!box) return;
    const words = window.VestaI18n.t('fillwords', FILL_WORDS);
    const textEl = box.querySelector('.fw-text');
    const strikeEl = box.querySelector('.fw-strike');
    let index = 0;
    let running = false;

    function playWord() {
      const word = words[index];
      const isFinal = !word.strike;
      box.classList.toggle('is-final', isFinal);
      textEl.textContent = word.text;

      const tl = gsap.timeline({
        onComplete() {
          index = (index + 1) % words.length;
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
    gsap.from('.hero-line-inner', {
      yPercent: 112,
      duration: 1.1,
      stagger: 0.13,
      ease: 'power3.out',
    });
  }

  function initHeroIntro() {
    if (document.getElementById('tour-overlay')) {
      document.addEventListener('vesta:overlay-closed', heroIntro, { once: true });
    } else {
      heroIntro();
    }
  }

  /* --- Séquence démo : la mascotte avale les photos, recrache la vidéo ---------------
     Chorégraphie scrubbing sur DEMO_PIN px de scroll :
       1. la mascotte vient se placer au centre de la scène (docking dédié)
       2. chaque photo s'arme (anticipation), file dans sa bouche en spirale
          et disparaît ; elle gonfle d'un cran à chaque bouchée
       3. digestion : elle frétille
       4. grande inspiration, expulsion : le lecteur vidéo jaillit d'elle
          dans un éclat de lumière, avec un rebond élastique                      */

  const MOUTH = { fx: 0.5, fy: 0.36 }; // position de sa bouche dans la scène

  function initDemoSequence() {
    const stage = document.querySelector('.demo-stage');
    const polaroids = gsap.utils.toArray('.polaroid');
    const player = document.querySelector('.demo-player');
    const video = document.querySelector('.demo-video');
    const mascotEl = document.getElementById('mascot');

    // Dès que la vraie vidéo est là, l'habillage factice (▶) disparaît
    if (video) {
      video.addEventListener('loadeddata', () => {
        const ui = document.querySelector('.demo-player-ui');
        if (ui) ui.style.display = 'none';
      }, { once: true });
    }

    polaroids.forEach((p) => gsap.set(p, { rotation: parseFloat(p.dataset.rotate) || 0 }));
    gsap.set(player, { opacity: 0, scale: 0.08, transformOrigin: '50% -12%' });
    gsap.set('.demo-flash', { opacity: 0, scale: 0.5 });

    /* La mascotte tient la scène : ancrée bouche au centre pendant tout le pin.
       is-performing suspend ses réactions au curseur (le spectacle d'abord). */
    const dockDemo = () => {
      const r = stage.getBoundingClientRect();
      window.VestaMascot.moveToPx(
        r.left + r.width * MOUTH.fx - 38,
        r.top + r.height * MOUTH.fy - 38
      );
    };

    ScrollTrigger.create({
      trigger: '#demo',
      start: 'top top',
      end: '+=' + DEMO_PIN,
      onUpdate: dockDemo,
      onToggle(self) {
        mascotEl.classList.toggle('is-docked', self.isActive);
        mascotEl.classList.toggle('is-performing', self.isActive);
        if (self.isActive) { window.VestaMascot.normalize(); dockDemo(); }
        else if (!document.body.classList.contains('tour-active')) window.VestaMascot.home();
      },
    });

    /* Delta d'une photo vers la bouche (recalculé au resize) */
    const toMouth = (axis) => (i, el) => {
      const s = stage.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return axis === 'x'
        ? (s.left + s.width * MOUTH.fx) - (r.left + r.width / 2)
        : (s.top + s.height * MOUTH.fy) - (r.top + r.height / 2);
    };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#demo',
        start: 'top top',
        end: '+=' + DEMO_PIN,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.to('.demo-head', { opacity: 0, y: -40, duration: 0.4, ease: 'power2.inOut' }, 0.1);

    // Les 4 photos avalées une à une
    polaroids.forEach((p, i) => {
      const t = 0.3 + i * 0.5;
      tl
        // anticipation : la photo se soulève et s'arme
        .to(p, { y: '-=28', rotation: '+=5', scale: 1.06, duration: 0.16, ease: 'power2.out' }, t)
        // aspiration : elle spirale vers la bouche et s'y engouffre
        .to(p, {
          x: toMouth('x'),
          y: toMouth('y'),
          rotation: (i % 2 ? 1 : -1) * 50,
          scale: 0.04,
          opacity: 0,
          duration: 0.34,
          ease: 'power3.in',
        }, t + 0.16)
        // gloup : elle gonfle un peu plus à chaque bouchée
        .to('.mascot-body', { scale: 1 + 0.09 * (i + 1), duration: 0.1, ease: 'back.out(3)' }, t + 0.46)
        .to('.mascot-body', { scale: 1 + 0.055 * (i + 1), duration: 0.14, ease: 'power2.out' }, t + 0.56);
    });

    // Digestion : elle frétille, pleine à craquer
    const tShake = 0.3 + polaroids.length * 0.5 + 0.15;
    tl.to('.mascot-body', { rotation: 5, duration: 0.055, yoyo: true, repeat: 7, ease: 'sine.inOut' }, tShake)
      .set('.mascot-body', { rotation: 0 }, tShake + 0.45);

    // L'expulsion : inspiration, compression, et la vidéo jaillit
    const tSpit = tShake + 0.65;
    tl.to('.mascot-body', { scale: 1.4, duration: 0.14, ease: 'power2.in' }, tSpit)
      .to('.demo-flash', { opacity: 1, scale: 1.25, duration: 0.16, ease: 'power1.in' }, tSpit + 0.08)
      .to('.mascot-body', { scale: 0.82, duration: 0.09, ease: 'power3.in' }, tSpit + 0.16)
      .to(player, { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.6)' }, tSpit + 0.2)
      .to('.mascot-body', { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.45)' }, tSpit + 0.3)
      .to('.demo-flash', { opacity: 0, scale: 1.9, duration: 0.4, ease: 'power2.out' }, tSpit + 0.42)
      .to({}, { duration: 0.5 });
  }

  /* --- Statement : les lignes sortent de leurs masques --------------------------------- */

  function initStatement() {
    const lines = gsap.utils.toArray('.st-line-inner');
    if (!lines.length) return;
    gsap.from(lines, {
      yPercent: 115,
      skewY: 4,
      duration: 1.15,
      ease: 'power4.out',
      stagger: 0.14,
      scrollTrigger: { trigger: '.statement', start: 'top 62%' },
    });
  }

  /* --- Biens sublimés : aperçu flottant au survol -------------------------------------- */

  function initWorkPreview() {
    const rows = document.getElementById('work-rows');
    const preview = document.getElementById('work-preview');
    if (!rows || !preview) return;

    const label = preview.querySelector('.work-preview-label');
    const xTo = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3.out' });
    let visible = false;
    let mouseX = 0;
    let mouseY = 0;

    const hide = () => {
      if (!visible) return;
      visible = false;
      gsap.to(preview, { opacity: 0, scale: 0.92, duration: 0.3, ease: 'power3.in' });
    };

    rows.addEventListener('mousemove', (e) => {
      xTo(e.clientX + 24);
      yTo(e.clientY - 210);
    });

    rows.querySelectorAll('.work-row').forEach((row) => {
      row.addEventListener('mouseenter', () => {
        visible = true;
        preview.dataset.tint = row.dataset.tint;
        label.textContent = row.querySelector('.work-name').textContent
          + window.VestaI18n.t('works.preview', ' · film vesta');
        gsap.to(preview, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' });
      });
    });

    rows.addEventListener('mouseleave', hide);

    /* Anti-fantôme, ceinture ET bretelles :
       1. à chaque frame de scroll, si le point sous le curseur n'est plus
          une ligne de bien, l'aperçu s'efface ;
       2. dès que la section quitte l'écran (dans un sens ou l'autre),
          extinction forcée ;
       3. un chien de garde re-vérifie toutes les 400ms quoi qu'il arrive. */
    window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });

    const underCursorIsRow = () => {
      const under = document.elementFromPoint(mouseX, mouseY);
      return under && under.closest('#work-rows');
    };

    window.VestaScroll.lenis.on('scroll', () => {
      if (visible && !underCursorIsRow()) hide();
    });

    ScrollTrigger.create({
      trigger: '#biens',
      start: 'top bottom',
      end: 'bottom top',
      onLeave: hide,
      onLeaveBack: hide,
    });

    setInterval(() => {
      if (visible && !underCursorIsRow()) hide();
    }, 400);

    gsap.set(preview, { scale: 0.92 });
  }

  /* --- Deck : cartes staff cliquables --------------------------------------------------- */

  let deckShowFn = null; // rempli par initDeck, consommé par deckShow()

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

    /* Fait remonter la carte d'un agent sur le dessus du deck (le moment
       "Ça, c'est moi !" de la visite guidée) */
    deckShowFn = (workerKey) => {
      const target = order.find((c) => c.dataset.worker === workerKey);
      if (!target || order[0] === target) return;
      order = [target, ...order.filter((c) => c !== target)];
      layout(true);
      gsap.fromTo(target, { scale: 1.07 }, { scale: 1, duration: 0.55, ease: 'back.out(2.5)' });
    };
  }

  function deckShow(workerKey) {
    if (deckShowFn) deckShowFn(workerKey);
  }

  /* --- Init ---------------------------------------------------------------------------------- */

  function staticFallback() {
    // Pas de mouvement : valeurs finales posées, tout reste lisible
    gsap.utils.toArray('[data-count]').forEach((el) => {
      el.textContent = parseFloat(el.dataset.count).toLocaleString('fr-FR');
    });
    gsap.set('.polaroid', { opacity: 0.25 });
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
    initStatement();
    initWorkPreview();
    initDeck();
  }

  return { init, DEMO_PIN, deckShow };
})();
