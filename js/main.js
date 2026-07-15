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
    "nav.cta": "Réserver",
    "hero.eyebrow": "Studio de films immobiliers · Toulouse",
    "hero.t1": "Vos murs", "hero.t2": "méritent un", "hero.t3": "film.",
    "hero.sub": "Filmé par l'IA. Réalisé par un humain.",
    "hero.scroll": "Faites défiler pour visiter",
    "mask.eyebrow": "Le film coule dans les lettres",
    "ribbon.1": "Premier film offert", "ribbon.2": "Filmé par l'IA",
    "ribbon.3": "Réalisé par un humain", "ribbon.4": "Vos murs méritent un film",
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
    "trav.t1": "La caméra", "trav.t2": "pousse la porte.",
    "trav.text": "Et la maison se raconte, d'une pièce à l'autre — sans coupure, sans diaporama. C'est la traversée qui fait le film.",
    "equipe.eyebrow": "La distribution",
    "equipe.title": "Des IA aux caméras. Un réalisateur humain.",
    "equipe.ai": "IA", "equipe.human": "Humain",
    "equipe.c1": "Cadre", "equipe.c1d": "Compose chaque plan, choisit l'axe et le mouvement.",
    "equipe.c2": "Lumière", "equipe.c2d": "Sculpte l'heure dorée, révèle les matières.",
    "equipe.c3": "Montage", "equipe.c3d": "Assemble le rythme, tient la continuité du plan-séquence.",
    "equipe.c4": "Texte", "equipe.c4d": "Pose les mots justes, sobres, au bon moment.",
    "equipe.c5": "Le Réalisateur",
    "equipe.c5d": "Valide ou refait chaque plan. Tranche, rythme et signe le film. Rien ne sort sans son œil.",
    "offres.eyebrow": "Trois façons de nous confier vos biens",
    "offres.title": "Choisissez votre flamme.",
    "offres.legal": "Visuels virtuellement aménagés, non contractuels.",
    "offer.gift": "Premier film offert",
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
    "reveal.cta": "Réservez votre premier film — offert",
    "footer.tag": "Vos murs méritent un film.",
    "footer.contactlabel": "Prendre rendez-vous",
    "footer.place": "Toulouse, France",
    "footer.cta": "Réserver un rendez-vous",
    "footer.made": "Filmé par l'IA. Réalisé par un humain."
  },
  en: {
    "loader.label": "Developing the film…",
    "nav.cta": "Book a call",
    "hero.eyebrow": "Real-estate film studio · Toulouse",
    "hero.t1": "Your walls", "hero.t2": "deserve a", "hero.t3": "film.",
    "hero.sub": "Shot by AI. Directed by a human.",
    "hero.scroll": "Scroll to step inside",
    "mask.eyebrow": "The film flows through the letters",
    "ribbon.1": "First film on us", "ribbon.2": "Shot by AI",
    "ribbon.3": "Directed by a human", "ribbon.4": "Your walls deserve a film",
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
    "trav.t1": "The camera", "trav.t2": "opens the door.",
    "trav.text": "And the home tells its story, room to room — no cut, no slideshow. The walk-through is what makes it a film.",
    "equipe.eyebrow": "The cast",
    "equipe.title": "AIs on the cameras. One human director.",
    "equipe.ai": "AI", "equipe.human": "Human",
    "equipe.c1": "Framing", "equipe.c1d": "Composes every shot, picks the axis and the move.",
    "equipe.c2": "Light", "equipe.c2d": "Sculpts golden hour, reveals the materials.",
    "equipe.c3": "Editing", "equipe.c3d": "Builds the rhythm, holds the one-shot continuity.",
    "equipe.c4": "Copy", "equipe.c4d": "Places the right words, restrained, at the right moment.",
    "equipe.c5": "The Director",
    "equipe.c5d": "Approves or reshoots every shot. Cuts, paces and signs the film. Nothing ships without their eye.",
    "offres.eyebrow": "Three ways to trust us with your listings",
    "offres.title": "Choose your flame.",
    "offres.legal": "Virtually staged visuals, non-contractual.",
    "offer.gift": "First film on us",
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
    "reveal.cta": "Book your first film — on us",
    "footer.tag": "Your walls deserve a film.",
    "footer.contactlabel": "Book a call",
    "footer.place": "Toulouse, France",
    "footer.cta": "Book a call",
    "footer.made": "Shot by AI. Directed by a human."
  }
};

let currentLang = "fr";

function applyLang(lang) {
  currentLang = lang;
  const dict = I18N[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  document.querySelectorAll(".lang__opt").forEach((o) =>
    o.classList.toggle("is-active", o.dataset.lang === lang)
  );
  // Le mot rempli par le film reste « FILM. » dans les deux langues
  const mt = document.getElementById("maskText");
  if (mt) mt.textContent = "FILM.";
}

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
const state = { frame: 1 }; // frame courante (interpolée par GSAP)
let lastDrawn = -1;

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

// Dessine la frame `n` en mode « cover » (remplit l'écran, centré)
function drawFrame(n, force) {
  const idx = Math.max(1, Math.min(FRAME_COUNT, Math.round(n)));
  if (!force && idx === lastDrawn) return;
  const img = images[idx - 1];
  if (!img || !img.complete || !img.naturalWidth) {
    // Fallback : dégradé chaud animé si la frame n'est pas encore là
    drawFallback();
    return;
  }
  lastDrawn = idx;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih);
  const w = iw * scale, h = ih * scale;
  const x = (cw - w) / 2, y = (ch - h) / 2;
  ctx.drawImage(img, x, y, w, h);
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
  drawFrame(state.frame, false);
}

/* =========================================================================
   7. DÉMARRAGE
   ========================================================================= */
document.documentElement.classList.add("js");
document.getElementById("year").textContent = new Date().getFullYear();

window.addEventListener("resize", sizeCanvas);
window.addEventListener("load", sizeCanvas);
sizeCanvas();

// Curseur : dès qu'on peut, on l'active
if (!isTouch) document.body.classList.add("has-cursor");

// Langue : bouton de bascule
document.getElementById("langSwitch").addEventListener("click", () => {
  applyLang(currentLang === "fr" ? "en" : "fr");
});

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
  let lenis = null;
  if (!prefersReduced) {
    lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Rendu du canvas à chaque frame d'affichage
  gsap.ticker.add(renderLoop);

  /* --- 8.2 FILM : la frame suit le scroll global (hero → reveal) --- */
  // Le film avance en continu du haut du hero au haut de la révélation,
  // puis se fige sur sa dernière image (la chambre) pendant la révélation.
  const progressFill = document.getElementById("progressFill");
  progressFill.style.transformOrigin = "left";
  gsap.to(state, {
    frame: FRAME_COUNT,
    ease: "none",
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      endTrigger: "#reveal",
      end: "top top",
      scrub: prefersReduced ? true : 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progressFill.style.transform = "scaleX(" + self.progress + ")";
      }
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
  maskLayer.classList.add("is-active");
  gsap.set(maskLayer, { opacity: 1 });

  // Taille du mot « FILM. » calculée pour toujours tenir dans la largeur, quel
  // que soit le ratio d'écran (le masque SVG est en « slice », donc le mot est
  // mis à l'échelle par le ratio du viewport). On MESURE la largeur réelle du
  // mot (getBBox) plutôt que de la deviner, puis on résout la taille cible.
  // Largeur de « FILM. » ≈ 2.4 × font-size en unités viewBox (opsz verrouillé).
  const WORD_K = 2.4;
  function sizeMaskWord() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const scale = Math.max(vw / 1000, vh / 600);   // facteur du mode « slice »
    const target = vw * (vw < 680 ? 0.82 : 0.58);  // largeur écran visée pour le mot
    let fs = target / (WORD_K * scale);
    fs = Math.max(56, Math.min(fs, 240));
    maskText.setAttribute("font-size", fs);
  }
  sizeMaskWord();
  window.addEventListener("resize", sizeMaskWord);

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

  /* --- 8.6 FORMAT : recadrage cinéma 16:9 via letterbox --- */
  // Piloté directement au scroll (déterministe, sans conflit de tweens) :
  // les barres se referment en 16:9 centré au milieu de la section, puis
  // se rouvrent en plein écran. Le titre latéral apparaît pendant la fermeture.
  const barTop = document.querySelector(".letterbox__bar--top");
  const barBot = document.querySelector(".letterbox__bar--bottom");
  const barL = document.querySelector(".letterbox__bar--left");
  const barR = document.querySelector(".letterbox__bar--right");
  const fmtAside = document.querySelector(".format__aside");
  const smoothstep = (x) => x * x * (3 - 2 * x);

  ScrollTrigger.create({
    trigger: "#format",
    start: "top bottom",
    end: "bottom top",
    scrub: prefersReduced ? true : 1,
    onUpdate: (self) => {
      const p = self.progress;
      // Cloche avec plateau : ouvert (0) aux extrémités, fermé (1) au centre
      let e;
      if (p < 0.15) e = 0;
      else if (p < 0.35) e = (p - 0.15) / 0.2;
      else if (p < 0.65) e = 1;
      else if (p < 0.85) e = 1 - (p - 0.65) / 0.2;
      else e = 0;
      e = smoothstep(Math.min(1, Math.max(0, e)));

      const vw = window.innerWidth, vh = window.innerHeight;
      const tW = Math.min(vw * 0.84, vh * 0.84 * 16 / 9); // largeur cible 16:9
      const tH = tW * 9 / 16;
      const vB = Math.max(0, (vh - tH) / 2) * e;
      const hB = Math.max(0, (vw - tW) / 2) * e;
      barTop.style.height = vB + "px";
      barBot.style.height = vB + "px";
      barL.style.width = hB + "px";
      barR.style.width = hB + "px";
      fmtAside.style.opacity = e;
    }
  });

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

  /* --- 8.11 Ancres : scroll fluide via Lenis --- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
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

/* =========================================================================
   9. CURSEUR PERSONNALISÉ + BOUTONS MAGNÉTIQUES
   ========================================================================= */
if (!isTouch && !prefersReduced) {
  const cursor = document.getElementById("cursor");
  let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  let tx = cx, ty = cy;
  // Position initiale (centrée) même avant le premier mousemove / tick
  cursor.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";

  window.addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    cursor.classList.add("is-visible");
  });
  // Suivi lissé du curseur
  gsap.ticker.add(() => {
    cx += (tx - cx) * 0.2;
    cy += (ty - cy) * 0.2;
    cursor.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
  });

  const hoverables = document.querySelectorAll("a, button, [data-magnetic]");
  hoverables.forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });

  // Effet magnétique doux sur les boutons
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: mx * 0.3, y: my * 0.4, duration: 0.5, ease: "power3.out" });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
    });
  });
}

// Applique la langue par défaut au chargement
applyLang("fr");
