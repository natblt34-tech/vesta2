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

  const WALL = 120;   // épaisseur des murs invisibles

  let arena, engine, mouseConstraint;
  let tags = [];      // { el, body, w, h }
  let running = false;
  let built = false;

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
      return { el, body, w, h };
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
      t.el.style.transform =
        `translate(${t.body.position.x - t.w / 2}px, ${t.body.position.y - t.h / 2}px) ` +
        `rotate(${t.body.angle}rad)`;
    }
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
  }

  return { init };
})();
