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

  let root, body, bubble, skipBtn, pupils;
  let xTo, yTo;              // déplacement fluide du conteneur
  let excited = false;
  let embarrassed = false;
  let blinkTimer = null;
  let bubbleTimer = null;
  let embarrassTimer = null;

  /* Position de repos : coin bas-gauche, hors du contenu */
  const home = () => ({ x: 26, y: window.innerHeight - BODY_SIZE - 44 });

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
      say('Et hop ! ✦');
      hideBubble(900);
    }
  }

  /* Expression jouée manuellement (ex. pendant qu'elle tient un tag au lasso) */
  function express(on) {
    if (embarrassed) return;
    root.classList.toggle('is-excited', !!on);
  }

  /* Un tag l'a touchée et a brûlé : "Oops !" et mine gênée. */
  function embarrass() {
    clearTimeout(embarrassTimer);
    embarrassed = true;
    excited = false;
    root.classList.remove('is-excited');
    root.classList.add('is-embarrassed');
    say('Oops !');
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
  }

  return {
    init, show, moveTo, moveToPx, getCenter, home: goHome,
    say, hideBubble, setSkip, onBodyClick, onSkipClick,
    catchReact, embarrass, express,
  };
})();
