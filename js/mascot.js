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

  const BODY_SIZE = 76;      // diamètre du médaillon (voir CSS .mascot-body)
  const EXCITE_DIST = 130;   // distance curseur → mascotte qui déclenche l'excitation

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

  /* Perchoirs de balade libre : bords et coins, jamais le centre du contenu */
  const ROAM_SPOTS = [
    [4, 78], [45, 82], [86, 78], [88, 55], [86, 28], [5, 30], [4, 55], [8, 78],
  ];

  /* Le guide est-il occupé (visite, arène, démo, conversation) ? */
  function isBusy() {
    return document.body.classList.contains('tour-active')
      || root.classList.contains('is-docked')
      || root.classList.contains('is-performing')
      || root.classList.contains('is-chatting')
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

  /* Balade libre : quand rien ne l'occupe, il change de perchoir et de taille.
     Il s'immobilise dès que le curseur s'approche (sinon impossible à cliquer). */
  function freeRoam() {
    if (isBusy() || excited) return;
    const spot = ROAM_SPOTS[(Math.random() * ROAM_SPOTS.length) | 0];
    moveTo(spot[0], spot[1]);
    gsap.to(root, { scale: 0.85 + Math.random() * 0.35, duration: 1.2, ease: 'power2.inOut' });
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

    // L'ambiance du site (fond, filets, lueur du hero) suit le guide
    document.body.classList.remove('skin-cadre', 'skin-lumen', 'skin-cut', 'skin-scribe');
    document.body.classList.add('skin-' + key);

    // Le mini-avatar du bouton nav suit aussi
    const navFlame = document.querySelector('#guide-switch .mascot-flame');
    if (navFlame) navFlame.className = 'mascot-flame flame-skin--' + key;
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
  function onBodyClick(cb) { body.addEventListener('click', cb); }
  function onSkipClick(cb) { skipBtn.addEventListener('click', cb); }

  function init() {
    root = document.getElementById('mascot');
    body = root.querySelector('.mascot-body');
    bubble = root.querySelector('.mascot-bubble');
    skipBtn = root.querySelector('.mascot-skip');
    pupils = [...root.querySelectorAll('.mascot-pupil')];

    const h = home();
    gsap.set(root, { x: h.x, y: h.y });
    xTo = gsap.quickTo(root, 'x', { duration: 1.3, ease: 'power3.out' });
    yTo = gsap.quickTo(root, 'y', { duration: 1.3, ease: 'power3.out' });

    // Respiration : léger flottement vertical permanent
    gsap.to(body, { y: -6, duration: 1.9, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', () => { if (!document.body.classList.contains('tour-active')) goHome(); });
    scheduleBlink();

    // Vie propre : balade toutes les ~8s, manies toutes les ~11s,
    // réactions au scroll en continu
    setInterval(freeRoam, 8000 + Math.random() * 3000);
    setInterval(idleAct, 11000);
    window.VestaScroll.lenis.on('scroll', onScroll);
  }

  return {
    init, show, moveTo, moveToPx, getCenter, home: goHome, normalize,
    say, hideBubble, setSkip, onBodyClick, onSkipClick,
    catchReact, embarrass, express,
    setSkin, getSkin, skinData, celebrate,
  };
})();
