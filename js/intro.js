/* ==========================================================================
   VESTA — INTRO « LE COULOIR »  (page film uniquement)
   Des anneaux rectangulaires de texte — la marque, la promesse, les
   services — filent en perspective vers le spectateur, formant un couloir
   typographique dont le centre sombre est la porte du fond. L'intro habille
   le préchargement des frames, puis accélère (« warp ») à travers la porte
   pour révéler le hero.
   Inspiration mécanique : intro de 333southwabash.com, refaite de zéro
   en canvas 2D (aucun code repris), aux couleurs et aux mots de Vesta.
   ========================================================================== */

const VestaIntro = (() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let canvas = null, ctx = null;
  let W = 0, H = 0, dpr = 1;
  let running = false;
  let travel = 0;          // distance parcourue dans le couloir
  let speed = 0.42;        // vitesse de croisière (unités z / seconde)
  let warping = false;
  let lastT = 0;

  /* Géométrie du couloir */
  const Z_NEAR = 0.5, Z_FAR = 7;      // bornes de profondeur
  const RING_SPACING = 0.3;           // écart entre deux anneaux (en z) — dense
  const TEX_FONT = 92;                // hauteur de police dans la texture (px)

  /* La texture : une longue bande de texte pré-rendue, partagée par tous les
     anneaux. Astérisques braise, marque en bas-de-casse serif, le reste en
     capitales — les mots de Vesta. */
  let tex = null, texW = 0, texH = 0;

  const SEGMENTS = [
    { t: "vesta", c: "#EFE7D8", style: "italic 700", caps: false },
    { t: "  ✳  ", c: "#FF6B35", style: "700", caps: false },
    { t: "VOS MURS MÉRITENT UN FILM", c: "#EFE7D8", style: "640", caps: true },
    { t: "  ✳  ", c: "#FF6B35", style: "700", caps: false },
    { t: "FILM", c: "#EFE7D8", style: "640", caps: true },
    { t: " — ", c: "#6b6156", style: "400", caps: false },
    { t: "PHOTO", c: "#EFE7D8", style: "640", caps: true },
    { t: " — ", c: "#6b6156", style: "400", caps: false },
    { t: "HOME STAGING", c: "#EFE7D8", style: "640", caps: true },
    { t: "  ✳  ", c: "#FF6B35", style: "700", caps: false },
    { t: "PREMIER FILM OFFERT", c: "#d8a24a", style: "640", caps: true },
    { t: "  ✳  ", c: "#FF6B35", style: "700", caps: false },
    { t: "TOULOUSE", c: "#EFE7D8", style: "640", caps: true },
    { t: "  ✳  ", c: "#FF6B35", style: "700", caps: false }
  ];

  function buildTexture() {
    const probe = document.createElement("canvas").getContext("2d");
    let total = 0;
    SEGMENTS.forEach((s) => {
      probe.font = s.style + " " + TEX_FONT + "px Fraunces, serif";
      s.w = probe.measureText(s.t).width;
      total += s.w;
    });
    texH = Math.round(TEX_FONT * 1.32);
    // La bande est répétée deux fois : l'échantillonnage peut déborder et
    // reboucler sans couture.
    texW = Math.ceil(total);
    tex = document.createElement("canvas");
    tex.width = texW * 2;
    tex.height = texH;
    const tc = tex.getContext("2d");
    tc.textBaseline = "middle";
    for (let r = 0; r < 2; r++) {
      let x = r * texW;
      SEGMENTS.forEach((s) => {
        tc.font = s.style + " " + TEX_FONT + "px Fraunces, serif";
        tc.fillStyle = s.c;
        tc.fillText(s.t, x, texH / 2);
        x += s.w;
      });
    }
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

  /* Un côté d'anneau : la texture, étirée le long du côté, défilant avec la
     profondeur parcourue. srcW est constant quel que soit le zoom (les
     proportions du texte sont préservées à toutes les profondeurs). */
  function drawSide(len, th, srcX) {
    const srcW = (len / th) * texH;
    let sx = ((srcX % texW) + texW) % texW;
    ctx.drawImage(tex, sx, 0, Math.min(srcW, texW * 2 - sx), texH,
      -len / 2, 0, len, th);
  }

  function render(dt) {
    travel += speed * dt;
    ctx.fillStyle = "#0A0806";
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const hw0 = W * 0.48, hh0 = H * 0.48;  // demi-dimensions du couloir à z=1
    const span = Z_FAR - Z_NEAR;
    const count = Math.ceil(span / RING_SPACING) + 1;
    const thBase = Math.max(30, Math.min(80, H * 0.06)); // hauteur du texte à z=1

    // Du fond vers l'avant (les anneaux proches recouvrent les lointains)
    for (let i = count - 1; i >= 0; i--) {
      const z = Z_FAR - (((travel + i * RING_SPACING) % span + span) % span);
      const s = 1 / z;
      const hw = hw0 * s, hh = hh0 * s, th = thBase * s;

      // Fondus : naissance au fond, dissolution au premier plan
      let a = 1;
      if (z > Z_FAR - 1.6) a = (Z_FAR - z) / 1.6;
      if (z < Z_NEAR + 0.5) a = Math.max(0, (z - Z_NEAR) / 0.5);
      if (a <= 0.01) continue;
      ctx.globalAlpha = Math.min(1, a) * 0.94;

      // Le texte défile le long du périmètre, chaque anneau déphasé
      const slide = travel * 260 + i * texW * 0.37;

      // haut (posé au-dessus du cadre)
      ctx.setTransform(dpr, 0, 0, dpr, cx, cy - hh - th);
      drawSide(hw * 2, th, slide);
      // bas
      ctx.setTransform(dpr, 0, 0, dpr, cx, cy + hh);
      drawSide(hw * 2, th, slide + hw * 2);
      // droite (pivotée, se lit de haut en bas)
      ctx.setTransform(0, dpr, -dpr, 0, cx + hw + th, cy);
      drawSide(hh * 2, th, slide + hw * 4);
      // gauche
      ctx.setTransform(0, -dpr, dpr, 0, cx - hw - th, cy);
      drawSide(hh * 2, th, slide + hw * 4 + hh * 2);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;

    // La porte du fond : un voile qui garde le centre sombre et profond
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.5);
    g.addColorStop(0, "rgba(10, 8, 6, 0.82)");
    g.addColorStop(0.22, "rgba(10, 8, 6, 0.28)");
    g.addColorStop(0.55, "rgba(10, 8, 6, 0)");
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
    /* Démarre le couloir (no-op si mouvement réduit ou canvas absent) */
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
      gsap.to(this, {}); // no-op de sûreté si gsap absent
      gsap.to({ v: speed }, {
        v: 5.2, duration: 0.85, ease: "power2.in",
        onUpdate: function () { speed = this.targets()[0].v; }
      });
    },

    stop() {
      running = false;
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", size);
    },

    /* Pour les tests : rend une frame avec un dt donné */
    renderOnce(dt) { if (ctx) render(dt || 0.016); },
    get isRunning() { return running; }
  };
})();
