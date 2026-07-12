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

  const COUNT = 1100;         // points dans le nuage (dense : les mots se lisent)
  const SHAPE_EVERY = 7500;   // une forme tient ~6s une fois posée
  const SPRING = 0.085;       // rappel vif : la forme se constitue en ~1s
  const FRICTION = 0.85;
  const REPULSE_R = 90;       // rayon de répulsion du curseur (px)

  let canvas, ctx, spriteSharp, spriteSoft;
  let W = 0;
  let H = 0;
  let particles = [];
  let running = false;
  let shapeIndex = 0;
  let shapeTimer = null;
  /* seen : tant qu'aucun mousemove n'est arrivé, la parallaxe reste neutre
     (sinon la sentinelle -9999 décalait tout le nuage de ~220px) */
  const mouse = { x: -9999, y: -9999, seen: false };
  const parallax = { x: 0, y: 0 };

  /* --- Les formes ------------------------------------------------------------- */

  const drawWord = (word) => (g, w, h) => {
    // Taille mesurée pour remplir le canvas au maximum sans déborder
    g.font = '900 100px "Bricolage Grotesque", sans-serif';
    const at100 = g.measureText(word).width;
    const size = Math.min(((w * 0.92) / at100) * 100, h * 0.36);
    g.font = `900 ${size}px "Bricolage Grotesque", sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(word, w / 2, h / 2);
  };

  /* Pictos Vesta : grands, pleins, sans ambiguïté à la résolution des points */
  const drawFlame = (g, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const s = Math.min(w * 0.62, h * 0.42);
    g.beginPath();
    g.moveTo(cx, cy - s);
    g.bezierCurveTo(cx + s * 0.95, cy - s * 0.1, cx + s * 0.8, cy + s * 0.72, cx, cy + s * 0.9);
    g.bezierCurveTo(cx - s * 0.8, cy + s * 0.72, cx - s * 0.95, cy - s * 0.1, cx, cy - s);
    g.fill();
    // cœur évidé : silhouette de flamme reconnaissable, pas une patate
    const prev = g.globalCompositeOperation;
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.moveTo(cx, cy + s * 0.05);
    g.bezierCurveTo(cx + s * 0.38, cy + s * 0.35, cx + s * 0.3, cy + s * 0.72, cx, cy + s * 0.8);
    g.bezierCurveTo(cx - s * 0.3, cy + s * 0.72, cx - s * 0.38, cy + s * 0.35, cx, cy + s * 0.05);
    g.fill();
    g.globalCompositeOperation = prev;
  };

  const drawPlay = (g, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const s = Math.min(w * 0.55, h * 0.4);
    // cercle de lecteur + triangle évidé : le bouton "lecture" universel
    g.beginPath();
    g.arc(cx, cy, s, 0, Math.PI * 2);
    g.fill();
    const prev = g.globalCompositeOperation;
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.arc(cx, cy, s * 0.72, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = prev;
    g.beginPath();
    g.moveTo(cx - s * 0.28, cy - s * 0.42);
    g.lineTo(cx + s * 0.5, cy);
    g.lineTo(cx - s * 0.28, cy + s * 0.42);
    g.closePath();
    g.fill();
  };

  const drawHouse = (g, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const s = Math.min(w * 0.5, h * 0.36);
    g.beginPath(); // toit
    g.moveTo(cx - s * 1.3, cy - s * 0.05);
    g.lineTo(cx, cy - s * 1.15);
    g.lineTo(cx + s * 1.3, cy - s * 0.05);
    g.closePath();
    g.fill();
    g.fillRect(cx - s * 0.95, cy, s * 1.9, s * 1.15); // murs
    const prev = g.globalCompositeOperation;
    g.globalCompositeOperation = 'destination-out';
    g.fillRect(cx - s * 0.25, cy + s * 0.4, s * 0.5, s * 0.75); // porte
    g.globalCompositeOperation = prev;
  };

  function shapeList() {
    const words = window.VestaI18n.t('morph.words', ['VESTA', 'UN FILM', '48H', 'FOYER', 'IA']);
    // Priorité aux mots (toujours lisibles), entrecoupés de trois pictos sûrs.
    // calm : les mots tournent deux fois moins pour rester nets.
    return [
      { draw: drawWord(words[0] || 'VESTA'), calm: 0.45 },
      { draw: drawFlame, calm: 1 },
      { draw: drawWord(words[1] || 'UN FILM'), calm: 0.45 },
      { draw: drawPlay, calm: 1 },
      { draw: drawWord(words[2] || '48H'), calm: 0.45 },
      { draw: drawHouse, calm: 1 },
      { draw: drawWord(words[3] || 'FOYER'), calm: 0.45 },
      { draw: drawWord(words[4] || 'IA'), calm: 0.45 },
    ];
  }

  /* --- Échantillonnage : une forme → des cibles pour chaque point --------------- */

  function sampleShape(drawFn) {
    // La forme est dessinée aux dimensions de la ZONE (droite du titre)
    // puis décalée : les cibles ne recouvrent jamais le texte
    const ZW = zone.width;
    const off = document.createElement('canvas');
    off.width = ZW;
    off.height = H;
    const g = off.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff';
    drawFn(g, ZW, H);

    const data = g.getImageData(0, 0, ZW, H).data;
    const pts = [];
    const step = 3; // échantillonnage fin : contours nets, lettres lisibles
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < ZW; x += step) {
        if (data[(y * ZW + x) * 4 + 3] > 128) pts.push({ x: x + zone.left, y });
      }
    }
    if (!pts.length) return;

    // Chaque point reçoit une cible ; s'il y a plus de points que de pixels,
    // plusieurs points partagent une cible avec un léger désaxage.
    // Le départ est étalé (vague organique : les points partent en nappes
    // successives plutôt que tous d'un bloc, comme sur la référence).
    const now = performance.now();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const target = pts[(Math.random() * pts.length) | 0];
      p.ntx = target.x + (Math.random() - 0.5) * 3;
      p.nty = target.y + (Math.random() - 0.5) * 3;
      p.swapAt = now + Math.random() * 400;
    }
  }

  let calmTarget = 0.45; // la première forme est un mot
  let calm = 0.45;

  function nextShape() {
    if (!zone.ok) return;
    const shapes = shapeList();
    const shape = shapes[shapeIndex % shapes.length];
    sampleShape(shape.draw);
    calmTarget = shape.calm;
    shapeIndex++;
  }

  /* --- Rendu ---------------------------------------------------------------------- */

  /* Deux sprites pour le relief : les points proches sont nets et brillants,
     les points lointains sont doux et diffus */
  function makeSprite(coreStop, midAlpha) {
    const s = document.createElement('canvas');
    s.width = s.height = 32;
    const g = s.getContext('2d');
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 240, 210, 1)');
    grad.addColorStop(coreStop, `rgba(255, 179, 71, ${midAlpha})`);
    grad.addColorStop(1, 'rgba(255, 122, 26, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return s;
  }

  function frame(time) {
    if (!running || !zone.ok || document.hidden) return;

    // Parallaxe douce : le nuage "penche" vers le curseur (neutre sans souris)
    const targetPX = mouse.seen ? (mouse.x - W / 2) * 0.02 : 0;
    const targetPY = mouse.seen ? (mouse.y - H / 2) * 0.02 : 0;
    parallax.x += (targetPX - parallax.x) * 0.04;
    parallax.y += (targetPY - parallax.y) * 0.04;

    /* Vraie 3D : le nuage oscille lentement autour de son axe vertical
       (rotY) avec un léger tangage (rotX), amplitudes calibrées pour que
       les mots restent lisibles. Projection perspective : les points
       proches grossissent et brillent, les lointains s'estompent. */
    const cx = zone.left + zone.width / 2;
    const cy = H * 0.52;
    calm += (calmTarget - calm) * 0.02; // transition douce mot ↔ picto
    const rotY = 0.3 * calm * Math.sin(time * 0.38);
    const rotX = 0.13 * calm * Math.sin(time * 0.26 + 1.3);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const FOCAL = 850;

    ctx.clearRect(0, 0, W, H);
    const now = performance.now();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Départ en vague : la nouvelle cible ne prend effet qu'à son tour
      if (p.swapAt && now >= p.swapAt) {
        p.tx = p.ntx;
        p.ty = p.nty;
        p.swapAt = 0;
      }

      // Ressort vers la cible (dans l'espace "modèle", non tourné)
      p.vx += (p.tx - p.x) * SPRING;
      p.vy += (p.ty - p.y) * SPRING;

      // Projection : rotation Y puis X autour du centre de la zone, à la
      // profondeur d'extrusion propre du point (z3)
      const mx = p.x - cx;
      const my = p.y - cy;
      const x1 = mx * cosY + p.z3 * sinY;
      const z1 = -mx * sinY + p.z3 * cosY;
      const y1 = my * cosX - z1 * sinX;
      const z2 = my * sinX + z1 * cosX;
      const persp = FOCAL / (FOCAL + z2);
      const sx = cx + x1 * persp + parallax.x * p.z * 1.6;
      const sy = cy + y1 * persp + parallax.y * p.z * 1.6;

      // Répulsion du curseur, en coordonnées ÉCRAN (là où l'œil voit le point)
      const dx = sx - mouse.x;
      const dy = sy - mouse.y;
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

      // Relief : taille et transparence combinent la profondeur "matière"
      // (p.z), la perspective (persp) et une respiration sinusoïdale
      const breathe = 1 + 0.12 * Math.sin(time * 1.4 + p.phase);
      const size = p.size * (0.4 + p.z * 0.95) * breathe * persp;
      ctx.globalAlpha = Math.min(1, (0.22 + p.z * 0.78) * persp * persp);
      ctx.drawImage(
        p.z > 0.62 ? spriteSharp : spriteSoft,
        sx - size / 2,
        sy - size / 2,
        size, size
      );
    }
    ctx.globalAlpha = 1;
  }

  /* --- Mise en place ------------------------------------------------------------------ */

  /* Le canvas couvre tout le hero (les points voyagent librement pendant
     les transitions, même derrière le titre) mais les FORMES se posent
     dans la zone libre à droite du texte, mesurée au pixel. */
  let zone = { left: 0, width: 0, ok: false };

  function layout() {
    // La ligne de titre la plus large (les inners sont inline-block :
    // leur boîte colle au texte, contrairement au h1 qui prend tout)
    const lines = [...document.querySelectorAll('.hero-line-inner')];
    const textRight = Math.max(...lines.map((l) => l.getBoundingClientRect().right));
    zone.left = textRight + 36;
    zone.width = window.innerWidth - zone.left - 12;
    zone.ok = zone.width >= 250;
    canvas.style.display = zone.ok ? '' : 'none';
  }

  function resize() {
    layout();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = canvas.getBoundingClientRect();
    W = Math.round(rect.width) || window.innerWidth;
    H = Math.round(rect.height) || window.innerHeight;
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
    spriteSharp = makeSprite(0.72, 0.95); // cœur dense, halo court : premier plan
    spriteSoft = makeSprite(0.3, 0.5);    // diffus : arrière-plan
    resize();

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: 0, vy: 0,
        tx: W / 2, ty: H / 2,
        z: 0.25 + Math.random() * 0.75,   // profondeur "matière" (taille, éclat)
        z3: (Math.random() - 0.5) * 72,   // extrusion : épaisseur révélée par la rotation
        size: 4 + Math.random() * 6.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // La position du curseur, convertie dans le repère du canvas
    window.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.seen = true;
    }, { passive: true });

    window.addEventListener('resize', () => { resize(); nextShape(); });

    // Première forme une fois la typo chargée : la largeur du titre (donc la
    // place du canvas) et le dessin des mots dépendent de Bricolage
    document.fonts.ready.then(() => { resize(); nextShape(); });

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

  /* Sonde de diagnostic (console uniquement) */
  function debug() {
    const mean = (fn) => Math.round(particles.reduce((a, p) => a + fn(p), 0) / particles.length);
    return {
      W, H, zone: { ...zone },
      cibleMoyenne: { x: mean((p) => p.tx), y: mean((p) => p.ty) },
      positionMoyenne: { x: mean((p) => p.x), y: mean((p) => p.y) },
      vitesseMoyenne: mean((p) => Math.abs(p.vx) + Math.abs(p.vy)),
    };
  }

  return { init, debug };
})();
