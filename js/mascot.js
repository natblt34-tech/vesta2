/* ==========================================================================
   VESTA — La mascotte, "l'esprit du foyer"
   Petit personnage-flamme avec un visage, qui vit en bas de l'écran :
     - ses pupilles suivent le curseur en permanence
     - il cligne des yeux à intervalles irréguliers
     - il s'excite quand le curseur s'approche (yeux grands, bouche ronde)
     - il flotte doucement sur place (respiration)
     - la visite guidée le déplace n'importe où sur l'écran (moveTo)
     - il porte la bulle de dialogue (say / hideBubble)
   Expose : window.VestaMascot = { init, show, moveTo, home, say, hideBubble,
                                   setSkip, onBodyClick, onSkipClick }
   ========================================================================== */

window.VestaMascot = (() => {
  'use strict';

  const BODY_SIZE = 84;      // encombrement du personnage (voir CSS .mascot-body)
  const EXCITE_DIST = 130;   // distance curseur → mascotte qui déclenche l'excitation

  let dropHoldUntil = 0;     // après un lâcher, il reste sur place un instant

  /* Les quatre agents jouables : apparence (classe CSS) et caractère (textes).
     `greeting` ouvre la visite, `self` est son petit moment de fierté quand
     sa propre carte d'équipe apparaît. */
  const SKINS = {
    cadre: {
      name: 'CADRE-01',
      greeting: 'Bienvenue ✦ CADRE-01, chef opérateur de Vesta. Suivez-moi, je cadre la visite.',
      self: 'Et cette carte-là… CADRE-01 : c’est moi ! ✦',
    },
    lumen: {
      name: 'LUMEN-02',
      greeting: 'Bienvenue ✦ Moi c’est LUMEN-02, je m’occupe de la lumière. Venez, je vous éclaire le chemin.',
      self: 'Oh, LUMEN-02… mais c’est moi, ça ! ✦',
    },
    cut: {
      name: 'CUT-03',
      greeting: 'CUT-03. Montage. On visite, on ne traîne pas. Suivez-moi.',
      self: 'CUT-03. C’est moi. Évidemment.',
    },
    scribe: {
      name: 'SCRIBE-04',
      greeting: 'Bienvenue ✦ SCRIBE-04, plume officielle de Vesta. Laissez-moi vous raconter ce site.',
      self: 'Et la carte SCRIBE-04… c’est bibi ! ✦',
    },
  };

  let currentSkin = 'cadre';

  let root, body, bubble, skipBtn, pupils;
  let xTo, yTo;              // déplacement fluide du conteneur
  let excited = false;
  let embarrassed = false;
  let blinkTimer = null;
  let bubbleTimer = null;
  let embarrassTimer = null;

  /* Position de repos : coin bas-gauche, hors du contenu */
  const home = () => ({ x: 26, y: window.innerHeight - BODY_SIZE - 44 });

  /* Compagnon de lecture : le guide s'ancre sur les BLOCS DE CONTENU
     eux-mêmes (titres, paragraphes, listes). À chaque frame de scroll il
     rejoint le bloc le plus proche du centre de l'écran et se place juste
     à côté, comme un doigt qui suit les lignes. */
  let readEls = [];

  function collectReadTargets() {
    readEls = [...document.querySelectorAll(
      '.manifesto-title, .manifesto-sub, .bucket-chips, ' +
      '.phase-title, .phase-text, .arrow-list, ' +
      '.traversees-title, .traversees-lead, .traversees-text, ' +
      '.workforce-title, .workforce-sub, .deck, ' +
      '.statement-title, .statement-sub, ' +
      '.works-title, .work-row, .stat, ' +
      '.plans-title, .plan-card, ' +
      '.contact-title, .contact-actions, .footer-brand'
    )];
  }

  /* Le bloc lisible le plus proche du centre de l'écran */
  function readingAnchor() {
    const mid = window.innerHeight * 0.45;
    let best = null;
    let bestDist = Infinity;
    for (const el of readEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 70 || r.top > window.innerHeight - 70) continue;
      const d = Math.abs((r.top + r.bottom) / 2 - mid);
      if (d < bestDist) { bestDist = d; best = r; }
    }
    return best;
  }

  /* Le guide est-il occupé (visite, arène, démo, conversation) ? */
  function isBusy() {
    return document.body.classList.contains('tour-active')
      || root.classList.contains('is-docked')
      || root.classList.contains('is-performing')
      || root.classList.contains('is-chatting')
      || root.classList.contains('is-dragging')
      || performance.now() < dropHoldUntil   // il savoure là où on l'a posé
      || root.hidden;
  }

  /* --- Regard & humeurs ----------------------------------------------------- */

  function onMouseMove(e) {
    const r = body.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // Les pupilles visent le curseur (débattement max ±2.4px)
    const nx = Math.max(-1, Math.min(1, dx / 180));
    const ny = Math.max(-1, Math.min(1, dy / 180));
    pupils.forEach((p) => gsap.to(p, { x: nx * 2.4, y: ny * 2.4, duration: 0.25, ease: 'power2.out' }));

    // La flamme se penche légèrement vers le curseur
    gsap.to(root.querySelector('.mascot-flame'), { rotation: nx * 8, duration: 0.5, ease: 'power2.out' });

    // Pendant la séquence démo, la timeline scrubbing pilote son échelle :
    // pas de réaction d'excitation qui viendrait la parasiter
    if (root.classList.contains('is-performing')) return;

    // Curseur proche → excitation (sauf si elle est en pleine gêne)
    const near = Math.hypot(dx, dy) < EXCITE_DIST && !embarrassed;
    if (near !== excited) {
      excited = near;
      root.classList.toggle('is-excited', near);
      gsap.to(body, { scale: near ? 1.08 : 1, duration: 0.3, ease: 'back.out(2)' });
    }
  }

  function scheduleBlink() {
    blinkTimer = setTimeout(() => {
      root.classList.add('is-blink');
      setTimeout(() => root.classList.remove('is-blink'), 140);
      scheduleBlink();
    }, 2200 + Math.random() * 3600);
  }

  /* --- Un vrai petit bonhomme : balade, scroll, manies --------------------------- */

  /* Il se place à CÔTÉ du bloc en cours de lecture, à hauteur du texte.
     Il COLLE À SON CÔTÉ tant que la place existe (pas de ping-pong
     gauche-droite d'un bloc à l'autre) et glisse en continu pendant le
     scroll. Il s'immobilise dès que le curseur s'approche. */
  let lastFollow = 0;
  let lastSide = 'right';

  function readAlong(force) {
    if (isBusy() || excited) return;
    // Mobile : pas de marge à côté des textes, il reste sagement en bas
    if (window.innerWidth < 760) return;
    const now = performance.now();
    if (!force && now - lastFollow < 140) return; // throttle : fluide sans spam
    lastFollow = now;

    const r = readingAnchor();
    if (!r) return;

    const margin = 42;
    const rightFits = r.right + margin + BODY_SIZE < window.innerWidth - 12;
    const leftFits = r.left - margin - BODY_SIZE > 12;

    // Adhérence : il ne change de côté que si le sien ne passe plus
    if (lastSide === 'right' && !rightFits && leftFits) lastSide = 'left';
    else if (lastSide === 'left' && !leftFits && rightFits) lastSide = 'right';

    const px = lastSide === 'right' && rightFits
      ? r.right + margin
      : leftFits
        ? r.left - margin - BODY_SIZE
        : r.right + margin; // le clamp de moveToPx fera le reste
    const py = r.top + r.height / 2 - BODY_SIZE / 2;
    moveToPx(px, py);
  }

  function onScrollForReading() {
    readAlong(false);
  }

  /* Réactions au scroll : il s'étire dans le mouvement et suit des yeux */
  let settleTimer = null;

  function onScroll(e) {
    if (root.classList.contains('is-performing') || root.hidden) return;
    const v = gsap.utils.clamp(-60, 60, e.velocity || 0);
    const s = Math.abs(v) / 60;

    // Étirement dans le sens du mouvement (squash & stretch)
    gsap.to(body, {
      scaleY: 1 + s * 0.22,
      scaleX: 1 - s * 0.1,
      duration: 0.2,
      overwrite: 'auto',
    });
    // Le regard suit le défilement
    pupils.forEach((p) => gsap.to(p, { y: v > 0 ? 2.2 : -2.2, duration: 0.25, overwrite: 'auto' }));

    // Retour élastique dès que le scroll se calme
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      gsap.to(body, { scaleX: 1, scaleY: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      pupils.forEach((p) => gsap.to(p, { y: 0, duration: 0.3 }));
    }, 160);
  }

  /* Manies d'inactivité : de temps en temps, il vit sa vie */
  const IDLE_ACTS = [
    function lookAround() {
      gsap.timeline()
        .to(pupils, { x: -2.4, duration: 0.25 })
        .to(pupils, { x: 2.4, duration: 0.4, delay: 0.35 })
        .to(pupils, { x: 0, duration: 0.3, delay: 0.3 });
    },
    function doubleBlink() {
      root.classList.add('is-blink');
      setTimeout(() => root.classList.remove('is-blink'), 110);
      setTimeout(() => root.classList.add('is-blink'), 220);
      setTimeout(() => root.classList.remove('is-blink'), 330);
    },
    function hop() {
      // yPercent : aucune collision avec le flottement (qui anime y)
      gsap.timeline()
        .to(body, { yPercent: -32, duration: 0.22, ease: 'power2.out' })
        .to(body, { yPercent: 0, duration: 0.4, ease: 'bounce.out' });
    },
    function wiggle() {
      gsap.timeline()
        .to(body, { rotation: -8, duration: 0.09 })
        .to(body, { rotation: 8, duration: 0.14, yoyo: true, repeat: 2 })
        .to(body, { rotation: 0, duration: 0.18, ease: 'power2.out' });
    },
  ];

  function idleAct() {
    if (isBusy() || excited || embarrassed || document.hidden) return;
    IDLE_ACTS[(Math.random() * IDLE_ACTS.length) | 0]();
  }

  /* --- Déplacements ----------------------------------------------------------- */

  /* Déplace la mascotte vers un point en pixels viewport (coin haut-gauche du
     médaillon). Les valeurs sont bornées pour qu'elle reste entièrement visible. */
  function moveToPx(px, py) {
    const x = Math.max(14, Math.min(window.innerWidth - BODY_SIZE - 14, px));
    const y = Math.max(80, Math.min(window.innerHeight - BODY_SIZE - 50, py));
    xTo(x);
    yTo(y);
    // La bulle bascule du bon côté selon la moitié d'écran
    root.classList.toggle('flip', x > window.innerWidth * 0.52);
  }

  /* Idem, en % du viewport (x: 0-100, y: 0-100). */
  function moveTo(xPercent, yPercent) {
    moveToPx((window.innerWidth * xPercent) / 100, (window.innerHeight * yPercent) / 100);
  }

  /* Centre actuel du médaillon, en coordonnées viewport (pour physics.js). */
  function getCenter() {
    const r = body.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function goHome() {
    const h = home();
    xTo(h.x);
    yTo(h.y);
    root.classList.remove('flip');
  }

  /* Retour à la taille de référence (la balade libre le laisse parfois
     à 0.85× ou 1.2×) — appelé quand un rôle sérieux commence. */
  function normalize() {
    if (gsap.getProperty(root, 'scale') !== 1) {
      gsap.to(root, { scale: 1, duration: 0.5, ease: 'power2.out' });
    }
  }

  /* --- Bulle de dialogue --------------------------------------------------------- */

  function say(text) {
    clearTimeout(bubbleTimer);
    bubble.textContent = text;
    bubble.classList.add('is-visible');
  }

  function hideBubble(delay = 0) {
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('is-visible'), delay);
  }

  /* --- Réactions au jeu (toolkit) ---------------------------------------------------- */

  /* Un tag lui a été lancé dessus et elle le renvoie : petit sursaut ravi. */
  function catchReact() {
    if (embarrassed) return;
    gsap.fromTo(body, { scale: 1.18 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' });
    if (Math.random() < 0.5) {
      say(window.VestaI18n.t('mascot.hop', 'Et hop ! ✦'));
      hideBubble(900);
    }
  }

  /* Expression jouée manuellement (ex. pendant qu'elle tient un tag au lasso) */
  function express(on) {
    if (embarrassed) return;
    root.classList.toggle('is-excited', !!on);
  }

  /* --- Skins : les quatre agents ------------------------------------------------------ */

  function setSkin(key) {
    if (!SKINS[key]) return;
    currentSkin = key;
    const flame = root.querySelector('.mascot-flame');
    flame.className = 'mascot-flame flame-skin--' + key;
    flame.innerHTML = window.VestaAvatars.svg(key); // recharge le SVG du guide
    pupils = [...root.querySelectorAll('.mascot-pupil')]; // les yeux ont changé

    // L'ambiance du site (fond, filets, lueur du hero) suit le guide
    document.body.classList.remove('skin-cadre', 'skin-lumen', 'skin-cut', 'skin-scribe');
    document.body.classList.add('skin-' + key);

    // Le mini-avatar du bouton nav suit aussi
    const navFlame = document.querySelector('#guide-switch .mascot-flame');
    if (navFlame) {
      navFlame.className = 'mascot-flame flame-skin--' + key;
      navFlame.innerHTML = window.VestaAvatars.svg(key);
    }
  }

  function getSkin() { return currentSkin; }

  /* Les textes du personnage passent par i18n (le FR inline sert de source) */
  function skinData() {
    const s = SKINS[currentSkin];
    return {
      name: s.name,
      greeting: window.VestaI18n.t(`skin.${currentSkin}.greeting`, s.greeting),
      self: window.VestaI18n.t(`skin.${currentSkin}.self`, s.self),
    };
  }

  /* Petit moment de fierté : sursaut, frétillement, et sa réplique signature */
  function celebrate(text) {
    say(text);
    hideBubble(2800);
    root.classList.add('is-excited');
    gsap.timeline()
      .fromTo(body, { scale: 1.22 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, 0)
      .to(body, { rotation: -9, duration: 0.07 }, 0)
      .to(body, { rotation: 9, duration: 0.12, yoyo: true, repeat: 3 }, 0.07)
      .to(body, { rotation: 0, duration: 0.16, ease: 'power2.out' }, 0.55);
    setTimeout(() => { if (!embarrassed) root.classList.remove('is-excited'); }, 1800);
  }

  /* Un tag l'a touchée et a brûlé : "Oops !" et mine gênée. */
  function embarrass() {
    clearTimeout(embarrassTimer);
    embarrassed = true;
    excited = false;
    root.classList.remove('is-excited');
    root.classList.add('is-embarrassed');
    say(window.VestaI18n.t('mascot.oops', 'Oops !'));
    hideBubble(1800);
    embarrassTimer = setTimeout(() => {
      embarrassed = false;
      root.classList.remove('is-embarrassed');
    }, 2200);
  }

  /* --- API ------------------------------------------------------------------------- */

  function show() {
    if (!root.hidden) return;
    root.hidden = false;
    gsap.from(body, { scale: 0, duration: 0.7, ease: 'back.out(1.8)' });
  }

  function setSkip(visible) { skipBtn.hidden = !visible; }
  function onSkipClick(cb) { skipBtn.addEventListener('click', cb); }

  /* Clic sur le guide → ouvre le chat, SAUF si on vient de le glisser
     (le drag consomme le clic pour ne pas ouvrir la conversation par erreur) */
  function onBodyClick(cb) {
    body.addEventListener('click', (e) => {
      if (dragMoved) { dragMoved = false; return; } // c'était un glissé
      cb(e);
    });
  }

  /* --- Cliqué-glissé : on attrape le guide et on le déplace, il adore ça --- */

  let dragging = false;
  let dragMoved = false;
  let pointerStart = { x: 0, y: 0 };
  let grabOffset = { x: 0, y: 0 };

  function initDrag() {
    body.addEventListener('pointerdown', (e) => {
      if (e.button && e.button !== 0) return;
      dragging = true;
      dragMoved = false;
      pointerStart = { x: e.clientX, y: e.clientY };
      grabOffset = {
        x: e.clientX - (gsap.getProperty(root, 'x') || 0),
        y: e.clientY - (gsap.getProperty(root, 'y') || 0),
      };
      try { body.setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
    });

    body.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - pointerStart.x;
      const dy = e.clientY - pointerStart.y;

      // Seuil : en-deçà, c'est un clic (on n'interrompt rien)
      if (!dragMoved && Math.hypot(dx, dy) < 5) return;

      if (!dragMoved) {
        // Début réel du glissé : il jubile (l'auto-déplacement se suspend
        // tout seul via isBusy() tant que .is-dragging est posé)
        dragMoved = true;
        root.classList.add('is-dragging', 'is-excited');
        excited = true;
        say(pickGrab());
        hideBubble(1600);
      }

      // Suivi direct du pointeur (1:1) — la dérive interne ajoute un micro-flottement
      gsap.set(root, {
        x: Math.max(6, Math.min(window.innerWidth - BODY_SIZE, e.clientX - grabOffset.x)),
        y: Math.max(6, Math.min(window.innerHeight - BODY_SIZE, e.clientY - grabOffset.y)),
      });
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      try { body.releasePointerCapture(e.pointerId); } catch (_) { /* ok */ }
      if (!dragMoved) return;

      // Atterrissage élastique, puis il reste sur place quelques secondes
      root.classList.remove('is-dragging');
      excited = false;
      root.classList.remove('is-excited');
      gsap.fromTo(body, { scale: 0.82 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)' });
      say(pickDrop());
      hideBubble(1800);
      dropHoldUntil = performance.now() + 4500; // il savoure avant de repartir
    };

    body.addEventListener('pointerup', endDrag);
    body.addEventListener('pointercancel', endDrag);
  }

  /* Petites répliques du jeu de déplacement */
  const GRABS_FR = ['Wiii ✦', 'Ouah, on décolle !', 'Emmenez-moi ✦', 'Héhé !'];
  const DROPS_FR = ['Atterrissage réussi ✦', 'On refait un tour ?', 'Merci du voyage !', 'Pouf.'];
  const pickFrom = (key, fr) => { const a = window.VestaI18n.t(key, fr); return a[(Math.random() * a.length) | 0]; };
  const pickGrab = () => pickFrom('mascot.grabs', GRABS_FR);
  const pickDrop = () => pickFrom('mascot.drops', DROPS_FR);

  function init() {
    root = document.getElementById('mascot');
    body = root.querySelector('.mascot-body');
    bubble = root.querySelector('.mascot-bubble');
    skipBtn = root.querySelector('.mascot-skip');
    pupils = [...root.querySelectorAll('.mascot-pupil')];

    const h = home();
    gsap.set(root, { x: h.x, y: h.y });
    // Trajets paresseux : il glisse, il ne saute pas
    xTo = gsap.quickTo(root, 'x', { duration: 1.8, ease: 'power2.out' });
    yTo = gsap.quickTo(root, 'y', { duration: 1.8, ease: 'power2.out' });

    // Dérive organique PERMANENTE : sinusoïdes lentes et déphasées sur le
    // médaillon, il flotte et dérive sans jamais s'immobiliser, même sans
    // scroll (x/y du médaillon : aucune collision avec les autres tweens,
    // qui animent scale, rotation ou yPercent)
    gsap.ticker.add((time) => {
      if (root.hidden || document.hidden) return;
      gsap.set(body, {
        x: Math.sin(time * 0.55) * 9 + Math.sin(time * 0.23 + 2) * 5,
        y: Math.sin(time * 0.8) * 6 + Math.cos(time * 0.31) * 4,
      });
    });

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', () => { if (!document.body.classList.contains('tour-active')) goHome(); });
    scheduleBlink();
    initDrag();

    // Vie propre : il suit la lecture EN CONTINU pendant le scroll
    // (ancré aux blocs de texte), se recale régulièrement, fait ses manies,
    // et s'étire dans le sens du scroll
    collectReadTargets();
    setInterval(() => readAlong(true), 6000 + Math.random() * 3000);
    setInterval(idleAct, 11000);
    window.VestaScroll.lenis.on('scroll', onScroll);
    window.VestaScroll.lenis.on('scroll', onScrollForReading);
  }

  return {
    init, show, moveTo, moveToPx, getCenter, home: goHome, normalize,
    say, hideBubble, setSkip, onBodyClick, onSkipClick,
    catchReact, embarrass, express,
    setSkin, getSkin, skinData, celebrate,
  };
})();
