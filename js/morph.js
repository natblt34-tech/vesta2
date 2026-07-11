/* ==========================================================================
   VESTA — Nuage de points morphing (hero, moitié droite)
   Des centaines de points chauds avec un faux relief 3D (taille, luminosité
   et parallaxe liées à une profondeur par point). Toutes les 5 secondes,
   le nuage se reforme en une nouvelle silhouette : mots liés à Vesta
   ("VESTA", "48H", "UN FILM"…) ou pictogrammes (flamme, lecture, maison).
   Le curseur repousse les points, qui reviennent en ressort.
   Choix de performance :
     - sprite pré-rendu (un seul drawImage par point, pas de shadowBlur)
     - AUCUNE boucle dédiée : branché sur le ticker GSAP partagé
     - en pause dès que le hero sort de l'écran ou que l'onglet est masqué
     - absent sur mobile (< 900px) et en prefers-reduced-motion
   Expose : window.VestaMorph = { init }
   ========================================================================== */

window.VestaMorph = (() => {
  'use strict';

  const COUNT = 620;          // points dans le nuage
  const SHAPE_EVERY = 5000;   // nouvelle forme toutes les 5s
  const SPRING = 0.055;       // rappel vers la cible
  const FRICTION = 0.86;
  const REPULSE_R = 90;       // rayon de répulsion du curseur (px)

  let canvas, ctx, sprite;
  let W = 0;
  let H = 0;
  let particles = [];
  let running = false;
  let shapeIndex = 0;
  let shapeTimer = null;
  const mouse = { x: -9999, y: -9999 };
  const parallax = { x: 0, y: 0 };

  /* --- Les formes ------------------------------------------------------------- */

  const drawWord = (word) => (g, w, h) => {
    g.font = `900 ${Math.min(h * 0.3, (w / word.length) * 1.5)}px "Bricolage Grotesque", sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(word, w / 2, h / 2);
  };

  const drawFlame = (g, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const s = Math.min(w, h) * 0.36;
    g.beginPath();
    g.moveTo(cx, cy - s);
    g.bezierCurveTo(cx + s * 0.9, cy - s * 0.15, cx + s * 0.75, cy + s * 0.7, cx, cy + s * 0.85);
    g.bezierCurveTo(cx - s * 0.75, cy + s * 0.7, cx - s * 0.9, cy - s * 0.15, cx, cy - s);
    g.fill();
  };

  const drawPlay = (g, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const s = Math.min(w, h) * 0.34;
    g.beginPath();
    g.moveTo(cx - s * 0.6, cy - s);
    g.lineTo(cx + s, cy);
    g.lineTo(cx - s * 0.6, cy + s);
    g.closePath();
    g.fill();
  };

  const drawHouse = (g, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const s = Math.min(w, h) * 0.32;
    g.beginPath(); // toit
    g.moveTo(cx - s * 1.15, cy - s * 0.1);
    g.lineTo(cx, cy - s * 1.05);
    g.lineTo(cx + s * 1.15, cy - s * 0.1);
    g.closePath();
    g.fill();
    g.fillRect(cx - s * 0.85, cy - s * 0.05, s * 1.7, s * 1.1); // murs
    g.clearRect(cx - s * 0.22, cy + s * 0.35, s * 0.44, s * 0.7); // porte
  };

  function shapeList() {
    const words = window.VestaI18n.t('morph.words', ['VESTA', 'UN FILM', '48H', 'FOYER']);
    const shapes = [drawFlame];
    words.forEach((wd, i) => {
      shapes.push(drawWord(wd));
      if (i === 0) shapes.push(drawPlay);
      if (i === 1) shapes.push(drawHouse);
    });
    return shapes;
  }

  /* --- Échantillonnage : une forme → des cibles pour chaque point --------------- */

  function sampleShape(drawFn) {
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const g = off.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff';
    drawFn(g, W, H);

    const data = g.getImageData(0, 0, W, H).data;
    const pts = [];
    const step = 4;
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) pts.push({ x, y });
      }
    }
    if (!pts.length) return;

    // Chaque point reçoit une cible ; s'il y a plus de points que de pixels,
    // plusieurs points partagent une cible avec un léger désaxage
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const target = pts[(Math.random() * pts.length) | 0];
      p.tx = target.x + (Math.random() - 0.5) * 3;
      p.ty = target.y + (Math.random() - 0.5) * 3;
    }
  }

  function nextShape() {
    const shapes = shapeList();
    sampleShape(shapes[shapeIndex % shapes.length]);
    shapeIndex++;
  }

  /* --- Rendu ---------------------------------------------------------------------- */

  function makeSprite() {
    const s = document.createElement('canvas');
    s.width = s.height = 32;
    const g = s.getContext('2d');
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 236, 200, 1)');
    grad.addColorStop(0.4, 'rgba(255, 179, 71, 0.9)');
    grad.addColorStop(1, 'rgba(255, 122, 26, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return s;
  }

  function frame(time) {
    if (!running || document.hidden) return;

    // Parallaxe douce : le nuage "penche" vers le curseur
    parallax.x += ((mouse.x - W / 2) * 0.02 - parallax.x) * 0.04;
    parallax.y += ((mouse.y - H / 2) * 0.02 - parallax.y) * 0.04;

    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Ressort vers la cible
      p.vx += (p.tx - p.x) * SPRING;
      p.vy += (p.ty - p.y) * SPRING;

      // Répulsion du curseur
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < REPULSE_R * REPULSE_R && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const force = (1 - d / REPULSE_R) * 3.2;
        p.vx += (dx / d) * force;
        p.vy += (dy / d) * force;
      }

      p.vx *= FRICTION;
      p.vy *= FRICTION;
      p.x += p.vx;
      p.y += p.vy;

      // Relief : taille, transparence et parallaxe dépendent de la profondeur,
      // plus une respiration sinusoïdale propre à chaque point
      const breathe = 1 + 0.12 * Math.sin(time * 1.4 + p.phase);
      const size = p.size * p.z * breathe;
      ctx.globalAlpha = 0.35 + p.z * 0.65;
      ctx.drawImage(
        sprite,
        p.x + parallax.x * p.z - size / 2,
        p.y + parallax.y * p.z - size / 2,
        size, size
      );
    }
    ctx.globalAlpha = 1;
  }

  /* --- Mise en place ------------------------------------------------------------------ */

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = canvas.getBoundingClientRect();
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function init() {
    canvas = document.getElementById('morph');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { canvas.remove(); return; }

    // Sous 900px le CSS masque le canvas ; on ne construit le nuage qu'une
    // fois un vrai écran disponible (la fenêtre peut être agrandie après coup)
    if (window.innerWidth < 900) {
      const retry = () => {
        if (window.innerWidth >= 900) {
          window.removeEventListener('resize', retry);
          build();
        }
      };
      window.addEventListener('resize', retry);
      return;
    }
    build();
  }

  function build() {
    ctx = canvas.getContext('2d');
    sprite = makeSprite();
    resize();

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: 0, vy: 0,
        tx: W / 2, ty: H / 2,
        z: 0.35 + Math.random() * 0.65,   // profondeur
        size: 5 + Math.random() * 7,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // La position du curseur, convertie dans le repère du canvas
    window.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }, { passive: true });

    window.addEventListener('resize', () => { resize(); nextShape(); });

    // Première forme une fois la typo chargée (les mots sont dessinés avec)
    document.fonts.ready.then(nextShape);

    // En pause hors écran ; le cycle des formes ne tourne que si visible
    ScrollTrigger.create({
      trigger: '#top',
      start: 'top bottom',
      end: 'bottom top',
      onToggle(self) {
        running = self.isActive;
        clearInterval(shapeTimer);
        if (self.isActive) shapeTimer = setInterval(nextShape, SHAPE_EVERY);
      },
    });

    gsap.ticker.add(frame);
  }

  return { init };
})();
