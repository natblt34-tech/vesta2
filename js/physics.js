/* ==========================================================================
   VESTA — Toolkit physique (Matter.js)
   Les tags de la boîte à outils sont des corps rigides : ils pleuvent dans
   l'arène à son entrée dans le viewport, puis se laissent attraper et
   lancer à la souris.
   Choix de performance :
     - le moteur n'est construit qu'à la première entrée dans le viewport
     - la simulation est mise en pause dès que l'arène sort de l'écran
     - AUCUNE boucle dédiée : Engine.update est appelé par le ticker GSAP
   Expose : window.VestaPhysics = { init }
   ========================================================================== */

window.VestaPhysics = (() => {
  'use strict';

  const WALL = 120;        // épaisseur des murs invisibles
  const BURN_DIST = 52;    // distance de contact direct : le tag brûle
  const CATCH_DIST = 130;  // distance de capture au lasso d'un tag lancé
  const CATCH_SPEED = 7;   // vitesse minimale pour compter comme un lancer
  const REEL_TIME = 0.45;  // durée du remorquage au lasso (s)
  const HOLD_TIME = 2000;  // elle garde le tag en main (ms)

  let arena, engine, mouseConstraint;
  let tags = [];      // { el, body, w, h, burned, lastCatch }
  let running = false;
  let built = false;
  let docked = false; // la mascotte est-elle installée dans l'arène ?

  /* Capture au lasso en cours (une seule à la fois : elle n'a que deux mains) */
  let capture = null; // { t, from:{x,y}, progress, holdUntil }
  let lassoSvg = null;
  let lassoRope = null;
  let lassoLoop = null;

  /* Vagabondage : elle se déplace dans l'arène pendant qu'on joue */
  let wander = { fx: 0.82, fy: 0.3 };
  let wanderTimer = null;

  /* --- Construction du monde ------------------------------------------------ */

  function build() {
    if (built) return;
    built = true;

    const { Engine, Bodies, Composite, Mouse, MouseConstraint } = Matter;
    engine = Engine.create();
    engine.gravity.y = 1;

    const W = arena.clientWidth;
    const H = arena.clientHeight;

    // Sol, murs et plafond. Le plafond est bien plus haut que la file
    // d'apparition des tags (sinon les derniers naissent dessus et n'entrent
    // jamais dans l'arène) tout en rattrapant les lancers vigoureux.
    const bounds = [
      Bodies.rectangle(W / 2, H + WALL / 2, W + WALL * 2, WALL, { isStatic: true }),
      Bodies.rectangle(-WALL / 2, H / 2 - 400, WALL, H + 1100, { isStatic: true }),
      Bodies.rectangle(W + WALL / 2, H / 2 - 400, WALL, H + 1100, { isStatic: true }),
      Bodies.rectangle(W / 2, -800 - WALL / 2, W + WALL * 2, WALL, { isStatic: true }),
    ];

    // Chaque tag DOM devient un corps arrondi qui pleut depuis le haut
    tags = [...arena.querySelectorAll('.tool-tag')].map((el, i) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      // On neutralise la position CSS de repos : la physique prend la main
      el.style.left = '0';
      el.style.top = '0';
      const body = Matter.Bodies.rectangle(
        40 + Math.random() * Math.max(60, W - 80),
        -50 - i * 44,                       // en file compacte au-dessus de l'arène
        w, h,
        {
          restitution: 0.45,
          friction: 0.28,
          frictionAir: 0.012,
          chamfer: { radius: h / 2 },       // flancs arrondis, comme le pill CSS
        }
      );
      Matter.Body.setAngle(body, (Math.random() - 0.5) * 0.5);
      // catchable : seul un tag LANCÉ PAR L'UTILISATEUR peut être attrapé
      // au lasso (la pluie initiale et les relances du guide ne comptent pas)
      return { el, body, w, h, burned: false, lastCatch: 0, catchable: false };
    });

    Composite.add(engine.world, [...bounds, ...tags.map((t) => t.body)]);

    // Attraper / lancer à la souris
    const mouse = Mouse.create(arena);
    mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, damping: 0.1 },
    });
    Composite.add(engine.world, mouseConstraint);

    // Matter capture la molette par défaut → on la lui retire pour que la
    // page continue de scroller au-dessus de l'arène
    mouse.element.removeEventListener('wheel', mouse.mousewheel);
    mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);

    // Un tag devient attrapable au lasso UNIQUEMENT quand l'utilisateur le
    // relâche avec de l'élan (= un vrai lancer)
    Matter.Events.on(mouseConstraint, 'enddrag', (e) => {
      const t = tags.find((tag) => tag.body === e.body);
      if (t && !t.burned && e.body.speed > CATCH_SPEED * 0.7) t.catchable = true;
    });

    // Le lasso : une corde d'or en SVG par-dessus la page
    lassoSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    lassoSvg.setAttribute('class', 'lasso-svg');
    lassoRope = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    lassoRope.setAttribute('class', 'lasso-rope');
    lassoLoop = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    lassoLoop.setAttribute('class', 'lasso-rope');
    lassoSvg.append(lassoRope, lassoLoop);
    lassoSvg.style.opacity = '0';
    document.body.appendChild(lassoSvg);

    // Une seule boucle : le ticker GSAP (déjà utilisé par Lenis et les braises)
    gsap.ticker.add(step);
  }

  /* --- Simulation & rendu ------------------------------------------------------ */

  function step(time, deltaMS) {
    if (!running || document.hidden) return;
    Matter.Engine.update(engine, Math.min(deltaMS, 33)); // clampé : stable après un lag

    for (let i = 0; i < tags.length; i++) {
      const t = tags[i];
      if (t.burned) continue;
      t.el.style.transform =
        `translate(${t.body.position.x - t.w / 2}px, ${t.body.position.y - t.h / 2}px) ` +
        `rotate(${t.body.angle}rad)`;
    }

    interactWithMascot();
  }

  /* --- Le jeu avec la mascotte ---------------------------------------------------
     Tag lancé qui passe près d'elle → capture au LASSO : la corde d'or part,
     le tag est remorqué jusqu'à sa main, elle le garde deux secondes (il la
     suit dans ses déplacements), puis elle le relance d'un grand arc.
     Tag TENU À LA SOURIS qui la touche → il brûle, "Oops !" et mine gênée. */

  /* Le bout de sa laisse : à bonne distance d'elle, côté intérieur de
     l'arène, légèrement plus bas — le tag pend, il n'est pas collé. */
  function handPos(mascotCenter, rect) {
    const side = mascotCenter.x - rect.left > rect.width / 2 ? -1 : 1;
    return {
      x: mascotCenter.x - rect.left + side * 110,
      y: mascotCenter.y - rect.top + 38,
    };
  }

  function interactWithMascot() {
    const mascot = window.VestaMascot;
    if (!mascot) return;
    const m = mascot.getCenter();
    const rect = arena.getBoundingClientRect();

    // Capture en cours : le tag est remorqué puis tenu contre sa main
    if (capture) {
      updateCapture(m, rect);
      return; // une prise à la fois, et pas de brûlure pendant le numéro
    }

    // La mascotte ne joue que si elle se tient dans l'arène
    if (m.x < rect.left || m.x > rect.right || m.y < rect.top || m.y > rect.bottom) return;

    const now = performance.now();
    for (let i = 0; i < tags.length; i++) {
      const t = tags[i];
      if (t.burned) continue;
      const tx = rect.left + t.body.position.x;
      const ty = rect.top + t.body.position.y;
      const dist = Math.hypot(tx - m.x, ty - m.y);
      const held = mouseConstraint.body === t.body;

      if (held && dist < BURN_DIST) {
        // Seul un tag tenu à la souris peut la toucher et brûler : un tag en
        // vol libre est toujours attrapé (sinon les rebonds sur les murs
        // finissent en crémation collective).
        burnTag(t);
        mascot.embarrass();
      } else if (!held && t.catchable && dist < CATCH_DIST && now - t.lastCatch > 900) {
        lassoTag(t);
      }
    }
  }

  function lassoTag(t) {
    t.catchable = false; // consommé : sa propre relance ne se rattrape pas
    Matter.Body.setStatic(t.body, true);
    t.el.classList.add('is-lassoed');
    capture = {
      t,
      // position courante du tag, pilotée en douceur vers le bout de laisse
      cx: t.body.position.x,
      cy: t.body.position.y,
      progress: 0,
      holdUntil: performance.now() + REEL_TIME * 1000 + HOLD_TIME,
    };
    gsap.to(capture, { progress: 1, duration: REEL_TIME, ease: 'power2.out' });
    lassoSvg.style.opacity = '1';
    window.VestaMascot.express(true);
  }

  function updateCapture(m, rect) {
    const { t } = capture;
    const now = performance.now();
    const hand = handPos(m, rect);

    // Le tag pend au bout de la laisse et se balance doucement ;
    // la position est LERPÉE à chaque frame : tout est fluide, même
    // quand le guide se déplace en le tenant.
    const sway = capture.progress; // le balancement ne démarre qu'une fois remorqué
    const target = {
      x: hand.x + Math.sin(now * 0.0021) * 16 * sway,
      y: hand.y + Math.cos(now * 0.0017) * 10 * sway,
    };
    const ease = 0.06 + capture.progress * 0.06;
    capture.cx += (target.x - capture.cx) * ease;
    capture.cy += (target.y - capture.cy) * ease;
    Matter.Body.setPosition(t.body, { x: capture.cx, y: capture.cy });
    // Le tag s'incline dans le sens du balancement
    Matter.Body.setAngle(t.body, Math.sin(now * 0.0021) * 0.14 * sway);
    t.el.style.transform =
      `translate(${capture.cx - t.w / 2}px, ${capture.cy - t.h / 2}px) rotate(${t.body.angle}rad)`;

    // La corde relie sa main au tag, avec un ventre qui respire
    const x1 = m.x;
    const y1 = m.y + 10;
    const x2 = rect.left + capture.cx;
    const y2 = rect.top + capture.cy;
    const sag = 18 + Math.sin(now * 0.0019) * 8;
    lassoRope.setAttribute('d',
      `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.max(y1, y2) + sag} ${x2} ${y2}`);
    lassoLoop.setAttribute('cx', x2);
    lassoLoop.setAttribute('cy', y2);
    lassoLoop.setAttribute('rx', t.w / 2 + 8);
    lassoLoop.setAttribute('ry', t.h / 2 + 8);

    if (now >= capture.holdUntil) releaseCapture(m, rect);
  }

  /* Libération immédiate et silencieuse (l'arène sort de l'écran en pleine
     prise : sans ça, le lasso resterait affiché sur tout le site) */
  function forceReleaseCapture() {
    if (!capture) return;
    const { t } = capture;
    capture = null;
    lassoSvg.style.opacity = '0';
    t.el.classList.remove('is-lassoed');
    Matter.Body.setStatic(t.body, false);
    t.lastCatch = performance.now();
    window.VestaMascot.express(false);
  }

  function releaseCapture(m, rect) {
    const { t } = capture;
    capture = null;
    lassoSvg.style.opacity = '0';
    t.el.classList.remove('is-lassoed');
    Matter.Body.setStatic(t.body, false);
    // Grand arc de relance vers l'intérieur de l'arène
    const dir = m.x - rect.left > rect.width / 2 ? -1 : 1;
    Matter.Body.setVelocity(t.body, {
      x: dir * (8 + Math.random() * 6),
      y: -(10 + Math.random() * 5),
    });
    Matter.Body.setAngularVelocity(t.body, dir * 0.3);
    t.lastCatch = performance.now();
    window.VestaMascot.express(false);
    window.VestaMascot.catchReact();
  }

  function burnTag(t) {
    t.burned = true;
    t.el.classList.add('is-burning');
    // Si le tag était tenu à la souris, on libère la contrainte avant de le retirer
    if (mouseConstraint.body === t.body) {
      mouseConstraint.body = null;
      mouseConstraint.constraint.bodyB = null;
    }
    Matter.Composite.remove(engine.world, t.body);
    gsap.to(t.el, {
      opacity: 0,
      scale: 0.2,
      filter: 'brightness(3) blur(3px)',
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        t.el.style.display = 'none';
        setTimeout(() => respawnTag(t), 2600);
      },
    });
  }

  /* Le tag renaît de ses cendres : il retombe du haut de l'arène */
  function respawnTag(t) {
    const W = arena.clientWidth;
    Matter.Body.setPosition(t.body, { x: 40 + Math.random() * Math.max(60, W - 80), y: -60 });
    Matter.Body.setVelocity(t.body, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(t.body, 0);
    Matter.Composite.add(engine.world, t.body);
    t.el.style.display = '';
    t.el.classList.remove('is-burning');
    gsap.fromTo(t.el, { opacity: 0, scale: 0.6, filter: 'brightness(2)' },
      { opacity: 1, scale: 1, filter: 'brightness(1)', duration: 0.5 });
    t.burned = false;
    t.lastCatch = performance.now(); // petit délai de grâce avant de rejouer
  }

  /* --- Ancrage + vagabondage de la mascotte dans l'arène --------------------------- */

  function pickWanderSpot() {
    // Moitié haute de l'arène : jamais dans le tas de tags au sol
    wander.fx = 0.15 + Math.random() * 0.7;
    wander.fy = 0.15 + Math.random() * 0.35;
  }

  function dockMascot() {
    // Pendant la visite guidée, tour.js gère les positions lui-même
    if (document.body.classList.contains('tour-active')) return;
    const rect = arena.getBoundingClientRect();
    window.VestaMascot.moveToPx(
      rect.left + rect.width * wander.fx - 38,
      rect.top + rect.height * wander.fy - 38
    );
  }

  function initDocking() {
    ScrollTrigger.create({
      trigger: arena,
      start: 'top 70%',
      end: 'bottom 20%',
      onUpdate: () => { if (docked) dockMascot(); },
      onToggle(self) {
        docked = self.isActive;
        // Signale l'état "en jeu" : le clic sur la mascotte ne relance pas
        // la visite pendant qu'elle est dans l'arène (clic raté = frustration)
        document.getElementById('mascot').classList.toggle('is-docked', self.isActive);
        clearInterval(wanderTimer);
        if (self.isActive) {
          window.VestaMascot.normalize();
          pickWanderSpot();
          dockMascot();
          // Elle change de perchoir régulièrement pendant qu'on joue
          wanderTimer = setInterval(() => { pickWanderSpot(); dockMascot(); }, 3400);
        } else if (!document.body.classList.contains('tour-active')) {
          window.VestaMascot.home();
        }
      },
    });
  }

  /* --- Init ------------------------------------------------------------------------ */

  function init() {
    arena = document.getElementById('toolkit-arena');
    if (!arena || !window.Matter) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    ScrollTrigger.create({
      trigger: arena,
      start: 'top 85%',
      end: 'bottom top',
      onToggle(self) {
        running = self.isActive;
        if (self.isActive) build();   // construit au premier passage seulement
        else forceReleaseCapture();   // jamais de lasso fantôme hors de l'arène
      },
    });

    initDocking();
  }

  return { init };
})();
