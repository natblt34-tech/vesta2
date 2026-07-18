/* ==========================================================================
   VESTA — INTRO « LE COULOIR »  (page film uniquement)
   Un couloir rectangulaire en une seule fuite : les phrases de Vesta sont
   COUCHÉES sur les quatre parois (sol, plafond, murs) et filent vers le
   spectateur avec une vraie déformation perspective — lettres étirées au
   premier plan, tassées vers la porte sombre du fond.
   Technique : projection par tranches (façon « mode 7 ») d'une texture de
   texte pré-rendue. Canvas 2D pur, aucune dépendance.
   ========================================================================== */

const VestaIntro = (() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let canvas = null, ctx = null;
  let W = 0, H = 0, dpr = 1;
  let running = false, warping = false;
  let travel = 0;            // distance parcourue dans le couloir (unités z)
  let speed = 0.75;          // vitesse de croisière
  let lastT = 0;

  /* Projection : à la profondeur z, un point de paroi se projette à
     K/z pixels du centre. Z_DOOR = profondeur de la porte du fond. */
  const Z_DOOR = 7;
  const ZTEX = 340;          // pixels de texture par unité de profondeur
  const SLICE = 2;           // épaisseur des tranches écran (px)

  /* ---- La texture des parois : des rangées de phrases empilées ---- */
  let tex = null, texV = null;   // horizontale (sol/plafond) et pivotée (murs)
  let TW = 0, TH = 0;
  const ROW_PITCH = 160, ROW_FONT = 92, PAD = 320;

  const ROWS = [
    [ { t: "VOS MURS MÉRITENT UN FILM", c: "#EFE7D8", f: "640 " }, { t: "  ✳  ", c: "#FF6B35", f: "700 " } ],
    [ { t: "vesta", c: "#EFE7D8", f: "italic 700 " }, { t: "  ✳  ", c: "#FF6B35", f: "700 " } ],
    [ { t: "FILM — PHOTO — HOME STAGING", c: "#EFE7D8", f: "640 " }, { t: "  ✳  ", c: "#FF6B35", f: "700 " } ],
    [ { t: "PREMIER FILM OFFERT", c: "#d8a24a", f: "640 " }, { t: "  ✳  ", c: "#FF6B35", f: "700 " } ]
  ];

  function buildTexture() {
    TW = 2048;
    TH = ROWS.length * ROW_PITCH;
    tex = document.createElement("canvas");
    tex.width = TW;
    tex.height = TH + PAD; // marge basse = copie du haut (échantillonnage sans couture)
    const tc = tex.getContext("2d");
    tc.fillStyle = "#0A0806";
    tc.fillRect(0, 0, TW, TH + PAD);
    tc.textBaseline = "middle";

    ROWS.forEach((segs, r) => {
      const y = r * ROW_PITCH + ROW_PITCH / 2;
      // largeur d'un motif complet de la rangée
      let unit = 0;
      segs.forEach((s) => {
        tc.font = s.f + ROW_FONT + "px Fraunces, serif";
        s.w = tc.measureText(s.t).width;
        unit += s.w;
      });
      // répète le motif sur toute la largeur, avec un décalage propre à la rangée
      let x = -((r * 431) % unit);
      while (x < TW) {
        segs.forEach((s) => {
          tc.font = s.f + ROW_FONT + "px Fraunces, serif";
          tc.fillStyle = s.c;
          tc.fillText(s.t, x, y);
          x += s.w;
        });
      }
    });
    // couture : recopie le haut dans la marge basse
    tc.drawImage(tex, 0, 0, TW, PAD, 0, TH, TW, PAD);

    // version pivotée de 90° pour les murs (les tranches y sont verticales)
    texV = document.createElement("canvas");
    texV.width = TH + PAD;
    texV.height = TW;
    const vc = texV.getContext("2d");
    vc.translate((TH + PAD) / 2, TW / 2);
    vc.rotate(Math.PI / 2);
    vc.drawImage(tex, -TW / 2, -(TH + PAD) / 2);
  }

  function size() {
    if (!canvas) return;
    W = window.innerWidth || document.documentElement.clientWidth;
    H = window.innerHeight || document.documentElement.clientHeight;
    if (!W || !H) { setTimeout(size, 120); return; }
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const mod = (a, n) => ((a % n) + n) % n;

  function render(dt) {
    travel += speed * dt;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0A0806";
    ctx.fillRect(0, 0, W, H);

    // Léger balancement de caméra : le couloir respire
    const cx = W / 2 + Math.sin(travel * 0.6) * W * 0.006;
    const cy = H / 2 + Math.cos(travel * 0.45) * H * 0.005;

    const KY = H * 0.62;             // demi-hauteur du couloir (projection)
    const KX = W * 0.62;             // demi-largeur
    const doorY = KY / Z_DOOR;       // demi-dimensions de la porte à l'écran
    const doorX = KX / Z_DOOR;
    const travelPx = travel * ZTEX;

    // Une paroi horizontale (sol dir=1, plafond dir=-1)
    const wallH = (dir) => {
      const edge = dir > 0 ? H : 0;
      for (let d = doorY; ; d += SLICE) {
        const sy = cy + dir * d;
        if (dir > 0 ? sy > edge : sy < edge) break;
        const z1 = KY / d, z2 = KY / (d + SLICE);
        const sv = mod(z2 * ZTEX + travelPx, TH);
        const sh = Math.min((z1 - z2) * ZTEX, PAD + TH - sv);
        const half = KX / z1;
        // au loin, on s'enfonce dans l'ombre de la porte
        ctx.globalAlpha = Math.min(1, Math.max(0.06, 1.25 - z1 / Z_DOOR));
        ctx.drawImage(tex, 0, sv, TW, Math.max(1, sh),
          cx - half, dir > 0 ? sy : sy - SLICE, half * 2, SLICE + 0.6);
      }
    };
    // Une paroi verticale (mur droit dir=1, gauche dir=-1)
    const wallV = (dir) => {
      const edge = dir > 0 ? W : 0;
      for (let d = doorX; ; d += SLICE) {
        const sx = cx + dir * d;
        if (dir > 0 ? sx > edge : sx < edge) break;
        const z1 = KX / d, z2 = KX / (d + SLICE);
        const sv = mod(z2 * ZTEX + travelPx, TH);
        const sh = Math.min((z1 - z2) * ZTEX, PAD + TH - sv);
        const half = KY / z1;
        ctx.globalAlpha = Math.min(1, Math.max(0.06, 1.25 - z1 / Z_DOOR));
        ctx.drawImage(texV, sv, 0, Math.max(1, sh), TW,
          dir > 0 ? sx : sx - SLICE, cy - half, SLICE + 0.6, half * 2);
      }
    };

    wallH(1); wallH(-1); wallV(1); wallV(-1);

    // La porte du fond : un rectangle d'ombre net, puis un voile de profondeur
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(8, 6, 5, 0.92)";
    ctx.fillRect(cx - doorX, cy - doorY, doorX * 2, doorY * 2);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.55);
    g.addColorStop(0, "rgba(10, 8, 6, 0.55)");
    g.addColorStop(0.3, "rgba(10, 8, 6, 0.12)");
    g.addColorStop(0.65, "rgba(10, 8, 6, 0)");
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
      buildTexture();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => { if (running) buildTexture(); });
      }
      size();
      window.addEventListener("resize", size);
      running = true;
      lastT = 0;
      gsap.ticker.add(tick);
      return true;
    },

    /* L'accélération finale : on fonce à travers la porte */
    warp() {
      if (!running || warping) return;
      warping = true;
      gsap.to({ v: speed }, {
        v: 7, duration: 0.85, ease: "power2.in",
        onUpdate: function () { speed = this.targets()[0].v; }
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
