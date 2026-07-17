/* ==========================================================================
   VESTA — Application
   Visite filmée pilotée par le scroll (séquence d'images sur <canvas>)
   Orchestration : GSAP + ScrollTrigger · Smooth scroll : Lenis
   --------------------------------------------------------------------------
   >>> POUR INJECTER VOTRE FILM : réglez les constantes ci-dessous.
       Déposez vos frames dans /frames/  nommées frame-0001.jpg, frame-0002.jpg…
       (voir le README pour la commande ffmpeg exacte)
   ========================================================================== */

/* -------------------------------------------------------------------------
   1. CONFIGURATION DES FRAMES  — les seules valeurs à changer
   ------------------------------------------------------------------------- */
const FRAME_COUNT = 239;            // nombre total de frames dans /frames/
const FRAME_PATH  = "frames/frame-"; // préfixe du chemin
const FRAME_EXT   = ".jpg";         // extension
const FRAME_PAD   = 4;              // zéros de remplissage : 4 → frame-0001.jpg

// Chemin d'une frame à partir de son index (1-based)
function framePath(i) {
  return FRAME_PATH + String(i).padStart(FRAME_PAD, "0") + FRAME_EXT;
}

/* -------------------------------------------------------------------------
   2. INTERNATIONALISATION (FR par défaut / EN)
   ------------------------------------------------------------------------- */
const I18N = {
  fr: {
    "loader.label": "Développement du film…",
    "hero.eyebrow": "Studio de films immobiliers · Toulouse",
    "hero.t1": "Vos murs", "hero.t2": "méritent un", "hero.t3": "film.",
    "hero.sub": "Filmé par l'IA. Réalisé par un humain.",
    "hero.scroll": "Faites défiler pour visiter",
    "ribbon.brand": "Vos murs méritent un film",
    "promesse.eyebrow": "Trois gestes, un film signé",
    "promesse.1t": "Dépôt & brief",
    "promesse.1d": "Vous déposez vos photos et le caractère du bien. On écrit l'intention du film.",
    "promesse.2t": "Tournage IA",
    "promesse.2d": "Nos IA cadrent, éclairent et animent la caméra, pièce après pièce.",
    "promesse.3t": "Montage signé",
    "promesse.3d": "Un réalisateur humain valide chaque plan, rythme et signe le film.",
    "format.eyebrow": "Un format, tous vos canaux",
    "format.title": "Le format cinéma, partout.",
    "format.text": "16:9 pour le portail, 9:16 pour les réseaux. Le même film, recadré au millimètre.",
    "trav.t1": "Les traversées.",
    "trav.text": "La caméra pousse la porte et la maison se raconte, d'une pièce à l'autre — sans coupure, sans diaporama.",
    "equipe.eyebrow": "La distribution",
    "equipe.title": "L'équipe du film.",
    "equipe.ai": "IA", "equipe.human": "Humain",
    "equipe.c1": "Cadre", "equipe.c1d": "Compose chaque plan, choisit l'axe et le mouvement.",
    "equipe.c2": "Lumière", "equipe.c2d": "Sculpte l'heure dorée, révèle les matières.",
    "equipe.c3": "Montage", "equipe.c3d": "Assemble le rythme, tient la continuité du plan-séquence.",
    "equipe.c4": "Texte", "equipe.c4d": "Pose les mots justes, sobres, au bon moment.",
    "equipe.c5": "Le Réalisateur",
    "equipe.c5d": "Valide ou refait chaque plan. Tranche, rythme et signe le film. Rien ne sort sans son œil.",
    "offres.eyebrow": "Trois façons de nous confier vos biens",
    "offres.title": "Trois formules.",
    "offres.legal": "Visuels virtuellement aménagés, non contractuels.",
    "offer.cta": "Réserver un rendez-vous",
    "offer.badge": "La plus choisie",
    "offer.1n": "Étincelle", "offer.1f": "L'agent indépendant",
    "offer.1a": "Des films chaque mois", "offer.1b": "Format cinéma 16:9", "offer.1c": "Livraison en 48 h",
    "offer.2n": "Flamme", "offer.2f": "L'agence active",
    "offer.2a": "Plus de films chaque mois", "offer.2b": "16:9 & 9:16 pour les réseaux",
    "offer.2c": "Home staging virtuel", "offer.2d": "Traversées entre les pièces",
    "offer.3n": "Brasier", "offer.3f": "L'agence qui délègue tout",
    "offer.3a": "Volume maximal de films", "offer.3b": "Home staging illimité",
    "offer.3c": "Posts prêts à publier", "offer.3d": "Priorité, réponse en 24 h",
    "reveal.kicker": "La caméra s'immobilise.",
    "reveal.l1": "Ce film,", "reveal.l2": "vous venez de le piloter", "reveal.l3": "du regard.",
    "reveal.sign": "Généré par",
    "reveal.cta": "Réservez votre premier film — offert"
  },
  en: {
    "loader.label": "Developing the film…",
    "hero.eyebrow": "Real-estate film studio · Toulouse",
    "hero.t1": "Your walls", "hero.t2": "deserve a", "hero.t3": "film.",
    "hero.sub": "Shot by AI. Directed by a human.",
    "hero.scroll": "Scroll to step inside",
    "ribbon.brand": "Your walls deserve a film",
    "promesse.eyebrow": "Three moves, one signed film",
    "promesse.1t": "Upload & brief",
    "promesse.1d": "You drop in your photos and the character of the property. We write the film's intent.",
    "promesse.2t": "AI shoot",
    "promesse.2d": "Our AIs frame, light and move the camera, room after room.",
    "promesse.3t": "Signed edit",
    "promesse.3d": "A human director approves every shot, sets the rhythm and signs the film.",
    "format.eyebrow": "One format, every channel",
    "format.title": "Cinema format, everywhere.",
    "format.text": "16:9 for the listing, 9:16 for social. The same film, reframed to the pixel.",
    "trav.t1": "The walk-throughs.",
    "trav.text": "The camera opens the door and the home tells its story, room to room — no cut, no slideshow.",
    "equipe.eyebrow": "The cast",
    "equipe.title": "The film crew.",
    "equipe.ai": "AI", "equipe.human": "Human",
    "equipe.c1": "Framing", "equipe.c1d": "Composes every shot, picks the axis and the move.",
    "equipe.c2": "Light", "equipe.c2d": "Sculpts golden hour, reveals the materials.",
    "equipe.c3": "Editing", "equipe.c3d": "Builds the rhythm, holds the one-shot continuity.",
    "equipe.c4": "Copy", "equipe.c4d": "Places the right words, restrained, at the right moment.",
    "equipe.c5": "The Director",
    "equipe.c5d": "Approves or reshoots every shot. Cuts, paces and signs the film. Nothing ships without their eye.",
    "offres.eyebrow": "Three ways to trust us with your listings",
    "offres.title": "Three plans.",
    "offres.legal": "Virtually staged visuals, non-contractual.",
    "offer.cta": "Book a call",
    "offer.badge": "Most chosen",
    "offer.1n": "Spark", "offer.1f": "The solo agent",
    "offer.1a": "Films every month", "offer.1b": "16:9 cinema format", "offer.1c": "48 h delivery",
    "offer.2n": "Flame", "offer.2f": "The active agency",
    "offer.2a": "More films every month", "offer.2b": "16:9 & 9:16 for social",
    "offer.2c": "Virtual home staging", "offer.2d": "Room-to-room walk-throughs",
    "offer.3n": "Blaze", "offer.3f": "The agency that delegates all",
    "offer.3a": "Maximum film volume", "offer.3b": "Unlimited home staging",
    "offer.3c": "Ready-to-post social cuts", "offer.3d": "Priority, 24 h response",
    "reveal.kicker": "The camera comes to rest.",
    "reveal.l1": "This film —", "reveal.l2": "you just steered it", "reveal.l3": "with your eyes.",
    "reveal.sign": "Generated by",
    "reveal.cta": "Book your first film — on us"
  }
};

// Dictionnaire de la page, consommé par le socle partagé (js/shared.js)
window.PAGE_I18N = I18N;

/* -------------------------------------------------------------------------
   3. ÉTAT GLOBAL
   ------------------------------------------------------------------------- */
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

const canvas = document.getElementById("tour");
const ctx = canvas.getContext("2d", { alpha: false });

const images = [];          // frames préchargées
let framesReady = false;    // au moins la 1re frame est prête
let allLoaded = false;      // toutes les frames sont prêtes
const state = { frame: 1 }; // frame AFFICHÉE (lissée)
let lastDrawn = -1;

// Deux sources pour la frame : le scroll (scrubbing) et une boucle « ambiante »
// jouée au repos, tout en haut, pour donner vie au mot « FILM. » du hero.
let scrollFrame = 1;        // frame cible dérivée du scroll
let ambientPos = 1;         // tête de lecture de la boucle ambiante
let ambientDir = 1;         // sens du yoyo
let lastTick = 0;           // horodatage pour le calcul de dt
const AMBIENT_MAX = 46;     // la boucle va-et-vient sur les ~2 premières secondes
const AMBIENT_FPS = 15;     // vitesse de la boucle ambiante

/* -------------------------------------------------------------------------
   4. CANVAS — dessin « cover » + gestion du redimensionnement
   ------------------------------------------------------------------------- */
let cw = 0, ch = 0, dpr = 1;

function sizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cw = window.innerWidth || document.documentElement.clientWidth;
  ch = window.innerHeight || document.documentElement.clientHeight;
  // Si le viewport n'est pas encore dimensionné (preview qui démarre à 0px),
  // on réessaie au tick suivant plutôt que de figer un canvas de 0px.
  if (!cw || !ch) { requestAnimationFrame(sizeCanvas); setTimeout(sizeCanvas, 120); return; }
  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  canvas.style.width = cw + "px";
  canvas.style.height = ch + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  lastDrawn = -1;
  drawFrame(state.frame, true);
}

// Dessine une image en mode « cover » (remplit W×H, centré, recadré)
function coverDraw(context, W, H, img) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const s = Math.max(W / iw, H / ih);
  const w = iw * s, h = ih * s;
  context.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

// Écrans d'appareils (section format) : chaque canvas rejoue le film à SON ratio
let deviceCanvases = []; // [{ canvas, ctx }]

// Dessine la frame `n` sur le canvas plein écran ET dans les écrans d'appareils
function drawFrame(n, force) {
  const idx = Math.max(1, Math.min(FRAME_COUNT, Math.round(n)));
  if (!force && idx === lastDrawn) return;
  const img = images[idx - 1];
  if (!img || !img.complete || !img.naturalWidth) {
    drawFallback(); // dégradé chaud si la frame n'est pas encore là
    return;
  }
  lastDrawn = idx;
  coverDraw(ctx, cw, ch, img); // plein écran (16:9-ish → cover viewport)
  for (let i = 0; i < deviceCanvases.length; i++) {
    const d = deviceCanvases[i];
    if (d.canvas.width) coverDraw(d.ctx, d.canvas.width, d.canvas.height, img);
  }
}

// (Re)dimensionne les canvas des appareils selon leur boîte CSS
function sizeDeviceCanvases() {
  for (let i = 0; i < deviceCanvases.length; i++) {
    const c = deviceCanvases[i].canvas;
    // offsetWidth/Height = taille de layout SANS les transforms (scale des anims)
    const w = c.offsetWidth, h = c.offsetHeight;
    if (!w || !h) continue;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
  }
  lastDrawn = -1; // force un redraw
}

// Dégradé de secours (dossier /frames absent)
let fallbackT = 0;
function drawFallback() {
  fallbackT += 0.02;
  const g = ctx.createLinearGradient(0, 0, cw, ch);
  const shift = (Math.sin(fallbackT) + 1) / 2;
  g.addColorStop(0, "#14100b");
  g.addColorStop(0.5 + shift * 0.2, "#241a10");
  g.addColorStop(1, "#0a0806");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = "rgba(255,107,53," + (0.05 + shift * 0.05) + ")";
  ctx.beginPath();
  ctx.arc(cw * 0.5, ch * 0.55, Math.min(cw, ch) * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

/* -------------------------------------------------------------------------
   5. PRÉCHARGEMENT DES FRAMES + écran de chargement
   ------------------------------------------------------------------------- */
const loaderEl = document.getElementById("loader");
const loaderFill = document.getElementById("loader-fill");
const loaderPct = document.getElementById("loader-pct");

function preloadFrames() {
  return new Promise((resolve) => {
    let loaded = 0;
    let failed = 0;

    const done = () => {
      const pct = Math.round(((loaded + failed) / FRAME_COUNT) * 100);
      loaderFill.style.width = pct + "%";
      loaderPct.textContent = pct;
      if (loaded + failed >= FRAME_COUNT) {
        allLoaded = true;
        resolve(failed < FRAME_COUNT); // true si au moins une frame existe
      }
    };

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      // On DÉCODE chaque frame dès son chargement : le bitmap reste prêt en
      // mémoire, si bien que drawImage() ne redéclenche jamais de décodage
      // synchrone pendant le scroll → scrub fluide, sans saccade.
      img.onload = () => {
        loaded++;
        if (!framesReady) { framesReady = true; drawFrame(state.frame, true); }
        done();
        // Réchauffe le décodage en tâche de fond (sans bloquer le compteur) :
        // le bitmap reste prêt → drawImage ne redéclenche pas de décodage
        // synchrone pendant le scroll. On n'attend jamais cette promesse.
        if (img.decode) { try { img.decode().catch(() => {}); } catch (e) {} }
      };
      img.onerror = () => { failed++; done(); };
      img.src = framePath(i);
      images[i - 1] = img;
    }
  });
}

/* -------------------------------------------------------------------------
   6. BOUCLE DE RENDU (dessine la frame courante à chaque tick GSAP)
   ------------------------------------------------------------------------- */
function renderLoop() {
  const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
  if (!lastTick) lastTick = now;
  let dt = (now - lastTick) / 1000; lastTick = now;
  if (dt > 0.1) dt = 0.1; // borne les gros écarts (onglet en arrière-plan)

  if (!framesReady) { drawFrame(state.frame, false); return; }

  const atTop = window.scrollY < 4;
  if (prefersReduced) {
    // Mouvement réduit : pas de boucle, la frame suit directement le scroll
    state.frame = scrollFrame;
  } else if (atTop) {
    // Boucle ambiante (yoyo) tant qu'on n'a pas scrollé : le film « respire »
    // dans le mot FILM. sans jamais couper (aller-retour au lieu d'un saut).
    ambientPos += ambientDir * AMBIENT_FPS * dt;
    if (ambientPos >= AMBIENT_MAX) { ambientPos = AMBIENT_MAX; ambientDir = -1; }
    else if (ambientPos <= 1) { ambientPos = 1; ambientDir = 1; }
    state.frame += (ambientPos - state.frame) * Math.min(1, dt * 9);
  } else {
    // Dès qu'on scrolle : la frame cible du scroll prend la main (lissée)
    state.frame += (scrollFrame - state.frame) * Math.min(1, dt * 8);
    ambientPos = state.frame; // resync pour un retour en douceur en haut
  }
  drawFrame(state.frame, false);
}

/* =========================================================================
   7. DÉMARRAGE
   ========================================================================= */
document.documentElement.classList.add("js");

window.addEventListener("resize", sizeCanvas);
window.addEventListener("load", sizeCanvas);
sizeCanvas();

// On lance le préchargement, puis on construit l'expérience
preloadFrames().then((ok) => {
  drawFrame(state.frame, true); // 1re image tout de suite
  // Sortie du loader via setTimeout (robuste même si le rAF est suspendu)
  setTimeout(() => loaderEl.classList.add("is-done"), 250);
  buildExperience(ok);
});

/* =========================================================================
   8. CONSTRUCTION DE L'EXPÉRIENCE (scroll, timeline, animations)
   ========================================================================= */
function buildExperience(framesOk) {
  gsap.registerPlugin(ScrollTrigger);

  /* --- 8.1 Smooth scroll (Lenis) sauf mouvement réduit --- */
  const lenis = VestaShared.initLenis();

  // Rendu du canvas à chaque frame d'affichage
  gsap.ticker.add(renderLoop);

  /* --- 8.2 FILM : la frame suit le scroll global (hero → reveal) --- */
  // Le film avance en continu du haut du hero au haut de la révélation,
  // puis se fige sur sa dernière image (la chambre) pendant la révélation.
  const progressFill = document.getElementById("progressFill");
  progressFill.style.transformOrigin = "left";
  // Le scroll ne fait que dériver la frame CIBLE ; le renderLoop lisse l'affichage
  // et bascule entre boucle ambiante (en haut) et scrubbing (dès qu'on scrolle).
  ScrollTrigger.create({
    trigger: "#hero",
    start: "top top",
    endTrigger: "#reveal",
    end: "top top",
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      scrollFrame = 1 + self.progress * (FRAME_COUNT - 1);
      progressFill.style.transform = "scaleX(" + self.progress + ")";
    }
  });

  /* --- 8.3 HERO : révélation lettre par lettre (flip 3D) --- */
  // Découpe le titre en lettres (les .line restent des blocs empilés).
  const heroChars = splitChars(".hero__title");
  gsap.set(".hero__title .line", { opacity: 1 });
  gsap.set([".hero__eyebrow", ".hero__sub"], { y: 20 });
  const introTl = gsap.timeline({ delay: 0.35 });
  introTl.to(".hero__eyebrow", { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
  if (heroChars && heroChars.length) {
    gsap.set(heroChars, { yPercent: 120, opacity: 0, rotateX: -90 });
    introTl.to(heroChars, {
      yPercent: 0, opacity: 1, rotateX: 0, duration: 1.1,
      ease: "power4.out", stagger: 0.028
    }, "-=0.35");
  }
  introTl
    .to(".hero__sub", { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }, "-=0.7")
    .to(".scrollhint", { opacity: 1, duration: 0.8 }, "-=0.5");

  // Le texte du hero se fond quand on quitte
  gsap.to([".hero__top", ".hero__bottom"], {
    opacity: 0, ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "60% top", scrub: true }
  });
  gsap.to(".scrollhint", {
    opacity: 0, ease: "none",
    scrollTrigger: { trigger: "#hero", start: "5% top", end: "25% top", scrub: true }
  });

  /* --- 8.4 VIDÉO-DANS-LE-TEXTE (hero) --- */
  // Le hero est un panneau nuit solide (masklayer) troué par le mot « FILM. » :
  // le film coule dans les lettres. En quittant le hero, le panneau s'efface et
  // le film envahit tout l'écran pour la visite.
  const maskLayer = document.getElementById("maskLayer");
  const maskText = document.getElementById("maskText");
  const maskStar = document.getElementById("maskStar");
  maskLayer.classList.add("is-active");
  gsap.set(maskLayer, { opacity: 1 });

  // Taille du mot « FILM » calculée pour toujours tenir dans la largeur, quel
  // que soit le ratio d'écran (le masque SVG est en « slice », donc le mot est
  // mis à l'échelle par le ratio du viewport).
  // Largeur de « FILM » ≈ 2.2 × font-size en unités viewBox (opsz verrouillé).
  // L'astérisque braise — la marque Vesta — se cale au coin supérieur droit.
  const WORD_K = 2.2;
  function sizeMaskWord() {
    const vw = window.innerWidth, vh = window.innerHeight;
    // Viewport pas encore dimensionné (démarrage) : on réessaie, sans poser de NaN
    if (!vw || !vh) { setTimeout(sizeMaskWord, 150); return; }
    const scale = Math.max(vw / 1000, vh / 600);   // facteur du mode « slice »
    const target = vw * (vw < 680 ? 0.8 : 0.56);   // largeur écran visée (mot + astérisque)
    let fs = target / ((WORD_K + 0.3) * scale);    // +0.3 : la place de l'astérisque
    fs = Math.max(56, Math.min(fs, 240));
    maskText.setAttribute("font-size", fs);
    if (maskStar) {
      maskStar.setAttribute("font-size", fs * 0.46);
      maskStar.setAttribute("x", 500 + (WORD_K * fs) / 2 + fs * 0.05);
      maskStar.setAttribute("y", 370 - fs * 0.16);
    }
  }
  sizeMaskWord();
  window.addEventListener("resize", sizeMaskWord);
  window.addEventListener("load", sizeMaskWord);

  if (!prefersReduced) {
    // Le panneau nuit s'efface → révèle le film plein cadre
    gsap.to(maskLayer, {
      opacity: 0, ease: "none",
      scrollTrigger: { trigger: "#hero", start: "26% top", end: "bottom top", scrub: true }
    });
  }

  /* --- 8.5 PROMESSE : 3 volets en stagger --- */
  gsap.from(".volet", {
    y: 60, opacity: 0, duration: prefersReduced ? 0.01 : 1, ease: "power3.out", stagger: 0.15,
    scrollTrigger: { trigger: ".promesse__list", start: "top 78%" }
  });
  gsap.from(".promesse__head .eyebrow", {
    y: 24, opacity: 0, duration: 0.8, ease: "power2.out",
    scrollTrigger: { trigger: "#promesse", start: "top 70%" }
  });

  /* --- 8.6 FORMAT : le film sur ordinateur (16:9) puis mobile (9:16) --- */
  // Les canvas des appareils rejouent le film à leur ratio (voir drawFrame).
  deviceCanvases = Array.prototype.map.call(
    document.querySelectorAll(".device__canvas"),
    (c) => ({ canvas: c, ctx: c.getContext("2d", { alpha: false }) })
  );
  sizeDeviceCanvases();
  window.addEventListener("resize", sizeDeviceCanvases);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeDeviceCanvases);

  const laptop = document.querySelector(".device--laptop");
  const phone = document.querySelector(".device--phone");
  // États de départ (hors-scène)
  gsap.set(".format__backdrop", { autoAlpha: 0 });
  gsap.set(".format__aside", { autoAlpha: 0, y: 24 });
  gsap.set(laptop, { autoAlpha: 0, yPercent: 14, scale: 0.9, rotateX: 12, transformOrigin: "50% 90%" });
  gsap.set(phone, { autoAlpha: 0, xPercent: 60, scale: 0.85, rotateY: -22, transformOrigin: "0% 50%" });

  if (prefersReduced) {
    // Mouvement réduit : on montre simplement la scène, sans chorégraphie
    gsap.set([".format__backdrop", ".format__aside", laptop, phone],
      { autoAlpha: 1, x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0 });
  } else {
    const fmtTl = gsap.timeline({
      scrollTrigger: { trigger: "#format", start: "top top", end: "bottom bottom", scrub: 1 }
    });
    fmtTl
      // 1) le fond nuit se referme sur le plein écran
      .to(".format__backdrop", { autoAlpha: 1, duration: 1, ease: "power2.inOut" }, 0)
      // 2) l'ordinateur monte en scène (16:9)
      .to(laptop, { autoAlpha: 1, yPercent: 0, scale: 1, rotateX: 0, duration: 2.2, ease: "power3.out" }, 0.5)
      .to(".format__aside", { autoAlpha: 1, y: 0, duration: 1.4, ease: "power2.out" }, 1.4)
      // 3) le téléphone vient le rejoindre (9:16) — même film, deux formats
      .to(phone, { autoAlpha: 1, xPercent: 0, scale: 1, rotateY: 0, duration: 2.2, ease: "power3.out" }, 2.8)
      // 4) légère respiration de l'ensemble
      .to(".format__devices", { scale: 0.965, duration: 1.6, ease: "sine.inOut" }, 5)
      // 5) sortie : les appareils se retirent, le film reprend le plein écran
      .to(".format__aside", { autoAlpha: 0, y: -20, duration: 1, ease: "power2.in" }, 7.2)
      .to(phone, { autoAlpha: 0, xPercent: 50, scale: 0.9, rotateY: -14, duration: 1.6, ease: "power2.in" }, 7.2)
      .to(laptop, { autoAlpha: 0, yPercent: -12, scale: 0.92, duration: 1.6, ease: "power2.in" }, 7.4)
      .to(".format__backdrop", { autoAlpha: 0, duration: 1.3, ease: "power2.inOut" }, 8);
  }

  /* --- 8.7 TRAVERSÉE : lettres qui basculent + poids qui s'épaissit --- */
  const travTitle = document.querySelector(".traversee__title");
  const travChars = splitChars(".traversee__title");
  if (travChars && travChars.length) {
    gsap.from(travChars, {
      yPercent: 120, opacity: 0, rotateX: -85, duration: 1, ease: "power4.out", stagger: 0.02,
      scrollTrigger: { trigger: "#traversee", start: "top 72%" }
    });
    // Poids variable Fraunces piloté au scroll (300 → 900) : la typo « prend corps »
    const wp = { w: 320 };
    gsap.to(wp, {
      w: 900, ease: "none",
      scrollTrigger: { trigger: "#traversee", start: "top 78%", end: "center center", scrub: true },
      onUpdate: () => { travTitle.style.fontVariationSettings = '"wght" ' + Math.round(wp.w) + ', "opsz" 144'; }
    });
  }
  gsap.from(".traversee__text", {
    y: 40, opacity: 0, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: ".traversee__text", start: "top 82%" }
  });

  /* --- 8.8 ÉQUIPE --- */
  gsap.from(".equipe__head > *", {
    y: 40, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
    scrollTrigger: { trigger: "#equipe", start: "top 68%" }
  });
  gsap.from(".crew", {
    y: 70, opacity: 0, duration: prefersReduced ? 0.01 : 0.9, ease: "power3.out", stagger: 0.08,
    scrollTrigger: { trigger: ".equipe__grid", start: "top 80%" }
  });

  /* --- 8.9 OFFRES --- */
  gsap.from(".offres__head > *", {
    y: 40, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
    scrollTrigger: { trigger: "#offres", start: "top 70%" }
  });
  gsap.from(".offer", {
    y: 80, opacity: 0, duration: prefersReduced ? 0.01 : 1, ease: "power3.out", stagger: 0.12,
    scrollTrigger: { trigger: ".offres__grid", start: "top 82%" }
  });

  /* --- 8.10 RÉVÉLATION FINALE --- */
  const scrim = document.getElementById("scrim");
  // Assombrissement doux pour poser la phrase par-dessus la chambre figée
  gsap.fromTo(scrim, { opacity: 0 }, {
    opacity: 0.74, ease: "none",
    scrollTrigger: { trigger: "#reveal", start: "top 60%", end: "top top", scrub: true }
  });
  const revealChars = splitChars(".reveal__line");
  const revealTl = gsap.timeline({
    scrollTrigger: { trigger: "#reveal", start: "top 62%" }
  });
  revealTl.from(".reveal__kicker", { opacity: 0, y: 20, duration: 1, ease: "power2.out" });
  if (revealChars && revealChars.length) {
    revealTl.from(revealChars, {
      opacity: 0, yPercent: 110, rotateX: -80, duration: 1.1, ease: "power4.out", stagger: 0.02
    }, "-=0.4");
  } else {
    revealTl.from(".reveal__line .line", { opacity: 0, y: 20, duration: 0.6, stagger: 0.1 }, "-=0.4");
  }
  revealTl
    .from(".reveal__sign", { opacity: 0, y: 20, duration: 1, ease: "power2.out" }, "-=0.4")
    .from(".reveal__cta", { opacity: 0, y: 20, duration: 0.9, ease: "power2.out" }, "-=0.6");

  /* --- 8.10b BANDEAU CINÉTIQUE : boucle continue, vitesse liée au scroll --- */
  const ribbonTrack = document.getElementById("ribbonTrack");
  if (ribbonTrack && !prefersReduced) {
    ribbonTrack.innerHTML += ribbonTrack.innerHTML; // duplique pour une boucle sans couture
    const ribbonTween = gsap.to(ribbonTrack, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
    ScrollTrigger.create({
      trigger: ".ribbon", start: "top bottom", end: "bottom top",
      onUpdate: (self) => {
        // accélère avec la vitesse de scroll (et inverse le sens au scroll arrière)
        const v = self.getVelocity();
        const dir = v < 0 ? -1 : 1;
        ribbonTween.timeScale(dir * (1 + Math.min(Math.abs(v) / 240, 7)));
      }
    });
    // retour progressif à la vitesse de croisière
    gsap.ticker.add(() => {
      ribbonTween.timeScale(gsap.utils.interpolate(ribbonTween.timeScale(), 1, 0.045));
    });
  }

  /* --- 8.11 Socle partagé : ancres, curseur, langue, année --- */
  VestaShared.initAnchors(lenis);
  VestaShared.initCursor();
  VestaShared.initYear();
  VestaShared.initLang();

  /* --- 8.12 LE GUIDE : Marcel, le réalisateur --- */
  VestaShared.initGuide({
    id: "marcel",
    name: "Marcel",
    role: { fr: "réalisateur", en: "director" },
    accent: "#FF6B35",
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<circle cx="32" cy="35" r="21" fill="#EFE7D8"/>' +
      '<path d="M9 27 C11 13 25 9 33 9 C47 9 54 18 55 25 C44 18 20 19 9 27 Z" fill="#FF6B35"/>' +
      '<circle cx="50" cy="14" r="3.4" fill="#FF6B35"/>' +
      '<circle cx="25" cy="33" r="2.4" fill="#0A0806"/>' +
      '<circle cx="39" cy="33" r="2.4" fill="#0A0806"/>' +
      '<path d="M24 44 Q28 41 32 44 Q36 41 40 44" fill="none" stroke="#0A0806" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M27 49 Q32 52 37 49" fill="none" stroke="#0A0806" stroke-width="2" stroke-linecap="round"/>' +
      "</svg>",
    steps: [
      { sel: "#hero", text: {
        fr: "Marcel, réalisateur. Moteur… Scrollez : c'est vous qui pilotez la caméra.",
        en: "Marcel, director. Rolling… Scroll: you're steering the camera." } },
      { sel: "#promesse", text: {
        fr: "Trois gestes de votre côté. Le reste, c'est mon affaire.",
        en: "Three moves on your side. The rest is my job." } },
      { sel: "#format", text: {
        fr: "16:9, 9:16… un bon plan tient dans tous les cadres.",
        en: "16:9, 9:16… a good shot holds in any frame." } },
      { sel: "#traversee", text: {
        fr: "Ma partie préférée : on pousse la porte, sans couper.",
        en: "My favourite part: we open the door, without cutting." } },
      { sel: "#equipe", text: {
        fr: "Les IA cadrent. Moi, je tranche. Rien ne sort sans mon œil.",
        en: "The AIs frame. I decide. Nothing ships without my eye." } },
      { sel: "#offres", text: {
        fr: "Le premier film est offert. Après, on ne pourra plus se quitter.",
        en: "The first film is on us. After that, you won't let go." } },
      { sel: "#reveal", text: {
        fr: "Coupez. … Elle est parfaite. Et c'était vous, ça.",
        en: "Cut. … It's perfect. And that was you." } }
    ]
  });

  // Recalage après chargement complet des polices/frames
  ScrollTrigger.refresh();
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

/* Découpe un titre en lettres (SplitType), ligne par ligne pour préserver
   la structure .line (retours à la ligne). Renvoie null si reduced-motion. */
function splitChars(selector) {
  const el = document.querySelector(selector);
  if (!el || prefersReduced || !window.SplitType) return null;
  const lines = el.querySelectorAll(".line");
  let chars = [];
  if (lines.length) {
    lines.forEach((l) => { chars = chars.concat(new SplitType(l, { types: "chars" }).chars); });
  } else {
    chars = new SplitType(el, { types: "chars" }).chars;
  }
  return chars;
}

/* Le curseur, le magnétisme, la langue et les ancres vivent dans js/shared.js
   (socle commun aux trois pages : film, photo, home staging). */
