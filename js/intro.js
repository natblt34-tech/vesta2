/* ==========================================================================
   VESTA — INTRO « LE COULOIR »  (page film uniquement)
   Reconstruction fidèle de l'intro de 333southwabash.com (« red-boot »),
   étudiée depuis son code, réécrite en canvas 2D aux couleurs de Vesta :
   - un rectangle plein cadre dont l'intérieur est un couloir en perspective ;
   - chaque paroi (sol, plafond, flancs) porte 7 bandes de texte qui
     s'enfoncent vers le point de fuite, baseline tournée vers le centre
     (le haut se lit tête en bas, les flancs à la verticale) ;
   - chaque bande fait GLISSER sa phrase le long de son axe, par vagues :
     entrée 2.6 s en cubic-bezier(.87,0,.13,1), cascade de 250 ms entre les
     bandes, pause 1.25 s, sortie — en boucle pendant le chargement.
   ========================================================================== */

const VestaIntro = (() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let canvas = null, ctx = null;
  let W = 0, H = 0, dpr = 1;
  let running = false, exiting = false;
  let T = 0;                 // horloge de l'intro (ms)
  let exitT = 0;             // heure du déclenchement de la sortie
  let lastT = 0;

  /* --- Réglages calqués sur la référence --- */
  const BANDS = 7;             // bandes de profondeur par paroi
  const SLIDE_MS = 2600;       // durée d'un glissement
  const CASCADE_MS = 250;      // décalage entre bandes
  const HOLD_MS = 1250;        // pause, texte en place
  const HOLD2_MS = 650;        // pause avant de recommencer
  const PERIOD = SLIDE_MS + HOLD_MS + SLIDE_MS + HOLD2_MS;
  const WIN_SHIFT = 0.03;      // décalage de fenêtre par profondeur (leur trS/trE)

  /* cubic-bezier(.87, 0, .13, 1) — l'easing de la référence */
  function bezier(p1x, p1y, p2x, p2y) {
    const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
    const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
    const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
    const sampleY = (t) => ((ay * t + by) * t + cy) * t;
    return (x) => {
      let t = x;
      for (let i = 0; i < 6; i++) {
        const err = sampleX(t) - x;
        const d = (3 * ax * t + 2 * bx) * t + cx;
        if (Math.abs(err) < 1e-4 || Math.abs(d) < 1e-6) break;
        t -= err / d;
      }
      return sampleY(Math.min(1, Math.max(0, t)));
    };
  }
  const EASE = bezier(0.87, 0, 0.13, 1);

  /* ---- La bande : LA punchline, comme leur « BUILT TO BE BOLD » ---- */
  let strip = null, stripLen = 0;
  const TEX_FONT = 130, texH = Math.round(TEX_FONT * 1.26);

  const SEGMENTS = [
    { t: "VOS MURS MÉRITENT UN FILM", c: "#EFE7D8", f: "680 " },
    { t: "  ✳  ", c: "#FF6B35", f: "700 " }
  ];

  function buildStrip() {
    const probe = document.createElement("canvas").getContext("2d");
    let unit = 0;
    SEGMENTS.forEach((s) => {
      probe.font = s.f + TEX_FONT + "px Fraunces, serif";
      s.w = probe.measureText(s.t).width;
      unit += s.w;
    });
    stripLen = Math.ceil(unit);
    strip = document.createElement("canvas");
    strip.width = stripLen;
    strip.height = texH;
    const sc = strip.getContext("2d");
    sc.textBaseline = "middle";
    let x = 0;
    SEGMENTS.forEach((s) => {
      sc.font = s.f + TEX_FONT + "px Fraunces, serif";
      sc.fillStyle = s.c;
      sc.fillText(s.t, x, texH / 2);
      x += s.w;
    });
  }

  function size() {
    if (!canvas) return;
    W = window.innerWidth || document.documentElement.clientWidth;
    H = window.innerHeight || document.documentElement.clientHeight;
    if (!W || !H) { setTimeout(size, 120); return; }
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  const mod = (a, n) => ((a % n) + n) % n;

  /* Glissement d'une bande (0 = en place, ±1 = décalée d'une phrase).
     Cycle : entre (1→0), tient, sort (0→-1), vide (1 : prête à rentrer). */
  function cycleOffset(bandIdx, now) {
    const t = mod(now - bandIdx * CASCADE_MS, PERIOD);
    if (t < SLIDE_MS) return 1 - EASE(t / SLIDE_MS);
    if (t < SLIDE_MS + HOLD_MS) return 0;
    if (t < SLIDE_MS + HOLD_MS + SLIDE_MS) return -EASE((t - SLIDE_MS - HOLD_MS) / SLIDE_MS);
    return 1;
  }
  function bandOffset(bandIdx, now) {
    if (!exiting) return cycleOffset(bandIdx, now);
    // La sortie : chaque bande part de son état gelé au warp et s'échappe,
    // en cascade serrée (70 ms entre bandes).
    const from = cycleOffset(bandIdx, exitT);
    const p = (now - exitT - bandIdx * 70) / 900;
    if (p <= 0) return from;
    return from - (from + 1) * EASE(Math.min(1, p));
  }

  function render(dt) {
    T += dt * 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0A0806";
    ctx.fillRect(0, 0, W, H);

    /* Géométrie de la référence : la phrase est 1.49× plus large que le
       cadre (elle déborde — lettres géantes), l'épaisseur de bande en
       découle, et le cadre COUVRE l'écran (les flancs peuvent être
       hors-champ à l'entrée : ils n'apparaissent qu'en perspective). */
    const cx = W / 2, cy = H / 2;
    const ratio = texH / stripLen;         // hauteur/longueur de la phrase
    const OVER = 1.49;                     // débordement de la phrase (réf)
    let l = W, c = l * OVER * ratio, p = c * 3.66;
    if (p < H) { p = H; c = p / 3.66; l = c / (OVER * ratio); }
    const hw = l / 2, hh = p / 2;
    const srcW = stripLen / OVER;          // portion de phrase visible par bande
    const depth = BANDS * c;               // profondeur du couloir (unités monde)
    const fp = (H / 2) / Math.tan(Math.PI / 6); // focale (fov 60°)

    /* Une paroi : itérée en tranches écran depuis son bord (z=0) vers le fond.
       axis 0 = paroi horizontale (haut/bas), 1 = verticale (flancs).
       dir  -1 = haut/gauche, +1 = bas/droit. */
    const wall = (axis, dir) => {
      const inner = axis === 0 ? hh : hw;   // distance du bord au centre
      const cross = axis === 0 ? hw : hh;   // demi-longueur du bord
      const th = 2;                          // épaisseur de tranche (px écran)
      // inutile de dessiner les tranches hors écran
      const dStart = Math.min(inner, (axis === 0 ? H : W) / 2 + th);
      for (let d = dStart; d > th + 1; d -= th) {
        const z1 = fp * inner / d - fp;                 // profondeur de la tranche
        const z2 = fp * inner / (d - th) - fp;
        if (z2 < 0 || z1 > depth) continue;
        const band = Math.min(BANDS - 1, Math.floor(z1 / c));
        const o = bandOffset(band, T);
        const scale = fp / (fp + z1);
        const half = cross * scale;          // demi-largeur projetée de la tranche
        // la hauteur des lettres s'étend dans la PROFONDEUR de la bande :
        // cette tranche montre la rangée de la phrase correspondant à sa
        // position dans la bande (le haut des lettres vers le fond)
        const f1 = Math.min(1, Math.max(0, (z1 - band * c) / c));
        const f2 = Math.min(1, Math.max(0, (z2 - band * c) / c));
        const v = (1 - f2) * texH;
        const vh = Math.max(0.5, (f2 - f1) * texH);
        /* Fenêtre de bande SANS rebouclage : la phrase glisse dans la bande,
           en sort, et laisse la paroi vide entre deux vagues (la réf). */
        const su = (o + WIN_SHIFT * band) * stripLen;
        const s0 = Math.max(0, su), s1 = Math.min(stripLen, su + srcW);
        if (s1 <= s0) continue; // fenêtre hors phrase : rien à dessiner
        // assombrissement doux vers le fond
        ctx.globalAlpha = Math.max(0.12, 1 - (z1 / depth) * 0.72);
        if (axis === 0) {
          // parois haut/bas : texte horizontal ; le haut se lit tête en bas
          if (dir > 0) ctx.setTransform(dpr, 0, 0, dpr, cx - half, cy + d - th);
          else ctx.setTransform(-dpr, 0, 0, -dpr, cx + half, cy - d + th);
        } else {
          // flancs : texte vertical, baseline vers le centre
          if (dir > 0) ctx.setTransform(0, dpr, -dpr, 0, cx + d - th, cy - half);
          else ctx.setTransform(0, -dpr, dpr, 0, cx - d + th, cy + half);
        }
        const dstX = ((s0 - su) / srcW) * (half * 2);
        const dstW = ((s1 - s0) / srcW) * (half * 2);
        ctx.drawImage(strip, s0, v, s1 - s0, vh, dstX, 0, dstW, th);
      }
    };

    wall(0, -1);  // plafond
    wall(0, 1);   // sol
    wall(1, -1);  // flanc gauche
    wall(1, 1);   // flanc droit

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
  }

  function tick(t) {
    if (!running) return;
    const dt = Math.min(0.05, lastT ? t - lastT : 0.016);
    lastT = t;
    render(dt);
  }

  return {
    start(el) {
      if (prefersReduced || !el || !el.getContext) return false;
      canvas = el;
      ctx = canvas.getContext("2d", { alpha: false });
      buildStrip();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => { if (running) buildStrip(); });
      }
      size();
      window.addEventListener("resize", size);
      running = true;
      exiting = false;
      T = 0;
      lastT = 0;
      gsap.ticker.add(tick);
      return true;
    },

    /* La sortie : les bandes s'échappent en cascade (comme la fin de la réf) */
    warp() {
      if (!running || exiting) return;
      exiting = true;
      exitT = T;
    },

    stop() {
      running = false;
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", size);
    },

    renderOnce(dt) { if (ctx) render(dt || 0.016); },
    get isRunning() { return running; }
  };
})();
