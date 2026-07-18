/* ==========================================================================
   VESTA — INTRO « LE COULOIR »  (page film uniquement)
   Des cadres rectangulaires concentriques, en perspective. Sur chaque cadre,
   le texte CIRCULE le long du périmètre — il file sur le bord haut, tourne
   le coin, descend le flanc, revient par le bas — un convoyeur fermé.
   Tous les cadres montrent la même fenêtre de texte : les lettres
   s'alignent en rayons du fond du couloir jusqu'aux bords de l'écran.
   Canvas 2D pur, aucune dépendance.
   ========================================================================== */

const VestaIntro = (() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let canvas = null, ctx = null;
  let W = 0, H = 0, dpr = 1;
  let running = false, warping = false;
  let circ = 0;              // position du convoyeur le long du périmètre (px de bande)
  let drift = 0;             // dérive de profondeur (lente en croisière)
  let driftSpeed = 0.05;     // vitesse de la dérive (plongée au warp)
  let circSpeed = 260;       // vitesse de circulation du texte (px de bande / s)
  let lastT = 0;

  /* Profondeur du couloir */
  const Z_NEAR = 0.55, Z_FAR = 6.5;
  const RING_SPACING = 0.42;

  /* ---- La bande de texte (une seule, partagée par tous les cadres) ---- */
  let strip = null, stripLen = 0, STRIP_PAD = 4200;
  const TEX_FONT = 116, texH = Math.round(TEX_FONT * 1.3);

  const SEGMENTS = [
    { t: "VOS MURS MÉRITENT UN FILM", c: "#EFE7D8", f: "640 " },
    { t: "  ✳  ", c: "#FF6B35", f: "700 " },
    { t: "vesta", c: "#EFE7D8", f: "italic 700 " },
    { t: "  ✳  ", c: "#FF6B35", f: "700 " },
    { t: "FILM — PHOTO — HOME STAGING", c: "#EFE7D8", f: "640 " },
    { t: "  ✳  ", c: "#FF6B35", f: "700 " },
    { t: "PREMIER FILM OFFERT", c: "#d8a24a", f: "640 " },
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
    // répète le motif jusqu'à ≥ 6000 px, puis ajoute une marge de bouclage
    const reps = Math.max(1, Math.ceil(6000 / unit));
    stripLen = Math.ceil(unit * reps);
    strip = document.createElement("canvas");
    strip.width = stripLen + STRIP_PAD;
    strip.height = texH;
    const sc = strip.getContext("2d");
    sc.textBaseline = "middle";
    let x = 0;
    for (let r = 0; r < reps; r++) {
      SEGMENTS.forEach((s) => {
        sc.font = s.f + TEX_FONT + "px Fraunces, serif";
        sc.fillStyle = s.c;
        sc.fillText(s.t, x, texH / 2);
        x += s.w;
      });
    }
    // marge : recopie du début (les fenêtres qui débordent rebouclent sans couture)
    sc.drawImage(strip, 0, 0, STRIP_PAD, texH, stripLen, 0, STRIP_PAD, texH);
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

  function render(dt) {
    circ += circSpeed * dt * (warping ? 3 : 1);
    drift += driftSpeed * dt;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0A0806";
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const hw0 = W * 0.61, hh0 = H * 0.61;   // demi-dimensions du cadre à z=1
    const thBase = Math.max(34, Math.min(92, H * 0.082)); // texte à z=1

    /* La même fenêtre de bande pour tous les cadres : les longueurs de côté,
       converties en pixels de bande, ne dépendent pas de la profondeur —
       c'est ce qui aligne les lettres en rayons. */
    const r0 = texH / thBase;
    const LT = 2 * hw0 * r0;   // côté haut/bas, en px de bande
    const LS = 2 * hh0 * r0;   // côté gauche/droit
    const P = 2 * LT + 2 * LS; // périmètre complet
    const U0 = mod(-circ, stripLen);

    // une portion de bande (gère le rebouclage en deux morceaux)
    const seg = (u, srcW, dstLen, th) => {
      let su = mod(u, stripLen);
      const first = Math.min(srcW, stripLen + STRIP_PAD - su);
      ctx.drawImage(strip, su, 0, first, texH, -dstLen / 2, -th, dstLen * (first / srcW), th);
      if (first < srcW) {
        const rest = srcW - first;
        ctx.drawImage(strip, 0, 0, rest, texH,
          -dstLen / 2 + dstLen * (first / srcW), -th, dstLen * (rest / srcW), th);
      }
    };

    const span = Z_FAR - Z_NEAR;
    const count = Math.ceil(span / RING_SPACING);

    // du fond vers l'avant
    for (let i = count - 1; i >= 0; i--) {
      const z = Z_FAR - mod(i * RING_SPACING + drift, span);
      const s = 1 / z;
      const hw = hw0 * s, hh = hh0 * s, th = thBase * s;

      let a = 1;
      if (z > Z_FAR - 1.8) a = (Z_FAR - z) / 1.8;          // naît dans l'ombre
      if (z < Z_NEAR + 0.35) a = Math.min(a, (z - Z_NEAR) / 0.35); // se dissout tout près
      if (a <= 0.015 || hh - th > H) continue;
      ctx.globalAlpha = Math.min(1, a);

      /* Le convoyeur : haut → coin → flanc droit → coin → bas (à l'envers)
         → flanc gauche. Les orientations suivent le chemin. */
      // haut (file vers la droite)
      ctx.setTransform(dpr, 0, 0, dpr, cx, cy - hh);
      seg(U0, LT, 2 * hw, th);
      // droit (descend)
      ctx.setTransform(0, dpr, -dpr, 0, cx + hw, cy);
      seg(U0 + LT, LS, 2 * hh, th);
      // bas (repart vers la gauche, tête en bas — le texte suit le chemin)
      ctx.setTransform(-dpr, 0, 0, -dpr, cx, cy + hh);
      seg(U0 + LT + LS, LT, 2 * hw, th);
      // gauche (remonte)
      ctx.setTransform(0, -dpr, dpr, 0, cx - hw, cy);
      seg(U0 + 2 * LT + LS, LS, 2 * hh, th);
    }

    // la profondeur : un voile qui assombrit le fond du couloir
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.52);
    g.addColorStop(0, "rgba(10, 8, 6, 0.88)");
    g.addColorStop(0.18, "rgba(10, 8, 6, 0.42)");
    g.addColorStop(0.45, "rgba(10, 8, 6, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
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
      lastT = 0;
      gsap.ticker.add(tick);
      return true;
    },

    /* La sortie : on s'engouffre dans le couloir, le convoyeur s'emballe */
    warp() {
      if (!running || warping) return;
      warping = true;
      gsap.to({ v: driftSpeed }, {
        v: 5.5, duration: 0.85, ease: "power2.in",
        onUpdate: function () { driftSpeed = this.targets()[0].v; }
      });
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
