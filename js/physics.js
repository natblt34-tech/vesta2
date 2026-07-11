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
  const CATCH_DIST = 120;  // distance de "réception" d'un tag lancé
  const CATCH_SPEED = 7;   // vitesse minimale pour compter comme un lancer

  let arena, engine, mouseConstraint;
  let tags = [];      // { el, body, w, h, burned, lastCatch }
  let running = false;
  let built = false;
  let docked = false; // la mascotte est-elle installée dans l'arène ?

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
      return { el, body, w, h, burned: false, lastCatch: 0 };
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
     Tag lancé qui passe près d'elle → elle l'attrape et le relance.
     Tag qui la touche directement → il brûle, "Oops !" et mine gênée. */

  function interactWithMascot() {
    const mascot = window.VestaMascot;
    if (!mascot) return;
    const m = mascot.getCenter();
    const rect = arena.getBoundingClientRect();
    // La mascotte ne joue que si elle se tient dans l'arène
    if (m.x < rect.left || m.x > rect.right || m.y < rect.top || m.y > rect.bottom) return;

    const now = performance.now();
    for (let i = 0; i < tags.length; i++) {
      const t = tags[i];
      if (t.burned) continue;
      // Position du tag en coordonnées viewport
      const tx = rect.left + t.body.position.x;
      const ty = rect.top + t.body.position.y;
      const dist = Math.hypot(tx - m.x, ty - m.y);

      const held = mouseConstraint.body === t.body;

      if (held && dist < BURN_DIST) {
        // Seul un tag TENU À LA SOURIS peut la toucher et brûler — un tag en
        // vol libre est toujours attrapé/relancé (sinon les rebonds sur les
        // murs finissent en crémation collective).
        burnTag(t);
        mascot.embarrass();
      } else if (!held && dist < CATCH_DIST && t.body.speed > CATCH_SPEED && now - t.lastCatch > 700) {
        // Réception : renvoi vers le haut, à l'opposé de la mascotte
        t.lastCatch = now;
        const dir = tx < m.x ? -1 : 1;
        Matter.Body.setVelocity(t.body, {
          x: dir * (7 + Math.random() * 6),
          y: -(9 + Math.random() * 5),
        });
        Matter.Body.setAngularVelocity(t.body, dir * 0.25);
        mascot.catchReact();
      }
    }
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

  /* --- Ancrage de la mascotte dans l'arène (même en scroll manuel) ----------------- */

  function dockMascot() {
    // Pendant la visite guidée, tour.js gère les positions lui-même
    if (document.body.classList.contains('tour-active')) return;
    const rect = arena.getBoundingClientRect();
    // Perchée en haut à droite de l'arène, au-dessus du tas de tags
    window.VestaMascot.moveToPx(rect.left + rect.width * 0.82, rect.top + rect.height * 0.3);
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
        if (self.isActive) {
          dockMascot();
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
      },
    });

    initDocking();
  }

  return { init };
})();
