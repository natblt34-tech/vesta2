/* ==========================================================================
   VESTA — Page HOME STAGING VIRTUEL
   La démo : une chambre en line-art dont les meubles s'assemblent au rythme
   du scroll (tapis, lit, literie, chevets, tableau, rideaux, plante,
   suspension), avec compteur d'aménagement et lumière finale.
   Guide de la page : Colette, home stagère.
   --------------------------------------------------------------------------
   >>> PLUS TARD, EN VIDÉO : quand le film d'assemblage sera généré, découpez-
   le en frames (voir README) et remplacez la scène SVG par le moteur canvas
   de la page film (même mécanique que index.html).
   ========================================================================== */

/* ---------- i18n de la page ---------- */
window.PAGE_I18N = {
  fr: {
    "hs.eyebrow": "Vesta · Home staging virtuel",
    "hs.title": "Home staging virtuel.",
    "hs.sub": "Faites défiler : la chambre se meuble sous vos yeux.",
    "hs.counter": "Aménagement",
    "hs.phase1": "01 · La structure",
    "hs.phase2": "02 · Les meubles",
    "hs.done": "Prête à séduire.",
    "hs.legal": "Visuels virtuellement aménagés, non contractuels.",
    "hs.stepseyebrow": "Sans déménager personne",
    "hs.s1t": "La pièce nue",
    "hs.s1d": "Vos photos, même vides, même datées. C'est notre matière première.",
    "hs.s2t": "L'intention",
    "hs.s2d": "Un style choisi pour vos acheteurs : chaleureux, épuré, familial.",
    "hs.s3t": "Le décor",
    "hs.s3d": "La pièce meublée, livrée en 48 h, prête pour le portail et le film.",
    "hs.ctatitle": "Une pièce vide fait fuir. Une pièce racontée fait visiter.",
    "hs.ctabtn": "Réserver un rendez-vous",
    "hs.ctaalt": "Découvrir le film Vesta →"
  },
  en: {
    "hs.eyebrow": "Vesta · Virtual home staging",
    "hs.title": "Virtual home staging.",
    "hs.sub": "Scroll: the bedroom furnishes itself before your eyes.",
    "hs.counter": "Staging",
    "hs.phase1": "01 · The structure",
    "hs.phase2": "02 · The furniture",
    "hs.done": "Ready to charm.",
    "hs.legal": "Virtually staged visuals, non-contractual.",
    "hs.stepseyebrow": "Without moving anyone",
    "hs.s1t": "The bare room",
    "hs.s1d": "Your photos, even empty, even dated. That's our raw material.",
    "hs.s2t": "The intent",
    "hs.s2d": "A style chosen for your buyers: warm, minimal, family-friendly.",
    "hs.s3t": "The décor",
    "hs.s3d": "The furnished room, delivered in 48 h, ready for the portal and the film.",
    "hs.ctatitle": "An empty room scares off. A story-filled room sells visits.",
    "hs.ctabtn": "Book a call",
    "hs.ctaalt": "Discover the Vesta film →"
  }
};

document.documentElement.classList.add("js");
gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Socle ---------- */
const lenis = VestaShared.initLenis();
VestaShared.initAnchors(lenis);
VestaShared.initCursor();
VestaShared.initYear();
VestaShared.initLang();

/* ---------- Barre de progression ---------- */
const progressFill = document.getElementById("progressFill");
progressFill.style.transformOrigin = "left";
ScrollTrigger.create({
  trigger: document.body, start: "top top", end: "bottom bottom",
  onUpdate: (self) => { progressFill.style.transform = "scaleX(" + self.progress + ")"; }
});

/* -------------------------------------------------------------------------
   LA DÉMO PHOTO — les vraies images (assets/staging/)
   avant.jpg → structure.jpg (balayage de rénovation) → les meubles
   d'apres.jpg apparaissent un à un, par découpes clip-path.
   Les découpes sont calées sur la photo « après » (cadre 3:2) : en dehors
   des meubles, structure.jpg et apres.jpg sont identiques, donc les bords
   des découpes sont invisibles.
   ------------------------------------------------------------------------- */
const PHOTO_DIR = "assets/staging/";
const PHOTO_PIECE_COUNT = 4;
// Les images ET les masques de découpe doivent tous exister pour le mode photo.
// Les masques (silhouette exacte de chaque meuble, ombre comprise) sont
// générés par `node scripts/make-staging-masks.js` à partir de la différence
// entre structure.jpg et apres.jpg.
const PHOTO_SOURCES = ["avant.jpg", "structure.jpg", "apres.jpg",
  "mask-0.png", "mask-1.png", "mask-2.png", "mask-3.png"];

let photoMode = false;
const hsPhoto = document.getElementById("hsPhoto");
const hsScene = document.getElementById("hsScene");
const hsSweep = document.getElementById("hsSweep");
const hsStructure = document.getElementById("hsStructure");
const hsPhase = document.getElementById("hsPhase");
const hsTotal = document.getElementById("hsTotal");
const photoPieces = Array.from(document.querySelectorAll(".hs-photo__piece"));
const photoPings = Array.from(document.querySelectorAll(".hs-ping"));
const hsComplete = document.getElementById("hsComplete");

// Chaque calque d'apres.jpg est découpé par le masque de SON meuble
photoPieces.forEach((el, i) => {
  const url = "url(" + PHOTO_DIR + "mask-" + i + ".png)";
  el.style.webkitMaskImage = url;
  el.style.maskImage = url;
  el.style.webkitMaskSize = "100% 100%";
  el.style.maskSize = "100% 100%";
});

// Détecte les 3 images (fetch HEAD : silencieux si absentes), puis les
// précharge ; si TOUT est là → mode photo, sinon scène vectorielle.
function tryPhotoMode() {
  return Promise.all(PHOTO_SOURCES.map((f) =>
    fetch(PHOTO_DIR + f, { method: "HEAD" }).then((r) => r.ok).catch(() => false)
  )).then((oks) => {
    if (!oks.every(Boolean)) return false;
    return Promise.all(PHOTO_SOURCES.map((f) => new Promise((res) => {
      const img = new Image();
      img.onload = () => res(true);
      img.onerror = () => res(false);
      img.src = PHOTO_DIR + f;
    }))).then((loads) => loads.every(Boolean));
  });
}

function phaseLabel(key) {
  const d = window.PAGE_I18N[document.documentElement.lang] || window.PAGE_I18N.fr;
  hsPhase.textContent = d[key] || "";
}

/* ---------- LA DÉMO VECTORIELLE (repli sans images) ---------- */
const PIECES = Array.from({ length: 9 }, (_, i) => document.getElementById("hs-p" + (i + 1)));
const hsCount = document.getElementById("hsCount");
const hsGlowRect = document.getElementById("hsGlowRect");
const hsDone = document.getElementById("hsDone");
const hsHero = document.querySelector(".hs-hero");
const smooth = (x) => x * x * (3 - 2 * x); // adoucissement

// Chaque meuble entre pendant une fenêtre de progression [start, start+DUR]
const START = 0.1;    // début de l'assemblage
const SPAN = 0.68;    // durée totale de l'assemblage (jusqu'à 0.78)
const DUR = 0.075;    // durée d'entrée d'un meuble
// Directions d'arrivée : le mobilier « se pose » (haut/bas alternés, léger biais)
const FROM = [
  { y: 60, r: 0 },   { y: -70, r: -2 }, { y: -50, r: 2 },
  { y: 70, r: -3 },  { y: 70, r: 3 },   { y: -60, r: 0 },
  { y: -60, r: 0 },  { y: 60, r: -2 },  { y: -80, r: 0 }
];

function setScene(p) {
  let placed = 0;
  PIECES.forEach((piece, i) => {
    if (!piece) return;
    const s = START + (SPAN / PIECES.length) * i;
    let e = (p - s) / DUR;
    e = smooth(Math.min(1, Math.max(0, e)));
    if (e >= 0.99) placed++;
    const f = FROM[i];
    piece.style.opacity = e;
    piece.setAttribute("transform",
      "translate(0 " + ((1 - e) * f.y).toFixed(1) + ") rotate(" + ((1 - e) * f.r).toFixed(2) + " 600 400)");
  });
  hsCount.textContent = placed;

  // Fin : la lumière s'installe, la signature apparaît
  const g = smooth(Math.min(1, Math.max(0, (p - 0.82) / 0.12)));
  hsGlowRect.setAttribute("opacity", g);
  hsDone.style.opacity = g;
  hsDone.style.transform = "translateX(-50%) translateY(" + ((1 - g) * 18).toFixed(1) + "px)";

  // Le titre s'efface dès qu'on commence
  hsHero.style.opacity = Math.max(0, 1 - p / 0.1);
}

/* ---------- La chorégraphie PHOTO : rénovation, puis meubles un à un ---------- */
let lastPhaseKey = "hs.phase1";
// Le rythme : chaque meuble a son seuil de scroll (étalés sur la section)…
const PIECE_START = 0.32;  // début de la pose des meubles
const PIECE_SPAN = 0.5;    // fenêtre totale des seuils (un meuble tous les 0.125)
// …mais la pose est JOUÉE DANS LE TEMPS : au moins MIN_GAP secondes entre
// deux départs. C'est la garantie du « un par un », quel que soit le scroll.
const MIN_GAP = 0.5;       // secondes minimum entre deux poses
const POP_DUR = 0.65;      // durée du fondu de pose d'un meuble

const pieceShown = [false, false, false, false];
let lastPopAt = -1e9;      // horodatage (gsap.ticker.time) du dernier départ

function popPiece(i) {
  const el = photoPieces[i];
  const now = gsap.ticker.time;
  const startAt = Math.max(now, lastPopAt + MIN_GAP);
  lastPopAt = startAt;
  const delay = startAt - now;
  gsap.killTweensOf(el);
  gsap.to(el, { opacity: 1, duration: POP_DUR, ease: "power2.out", delay: delay });
  // Compteur + onde braise au moment où la pose démarre vraiment
  gsap.delayedCall(delay + 0.05, () => {
    hsCount.textContent = pieceShown.filter(Boolean).length;
    const ping = photoPings[i];
    if (ping) {
      ping.classList.remove("is-live");
      void ping.offsetWidth; // relance l'animation CSS
      ping.classList.add("is-live");
    }
  });
}

function unpopPiece(i) {
  const el = photoPieces[i];
  gsap.killTweensOf(el);
  gsap.to(el, { opacity: 0, duration: 0.3, ease: "power1.in" });
  hsCount.textContent = pieceShown.filter(Boolean).length;
}

function setPhotoScene(p) {
  // Le titre s'efface dès qu'on commence
  hsHero.style.opacity = Math.max(0, 1 - p / 0.1);

  // PHASE 1 (0.06 → 0.26) : le balayage de rénovation, du plafond au parquet.
  // structure.jpg recouvre avant.jpg derrière une ligne braise qui descend.
  const sw = smooth(Math.min(1, Math.max(0, (p - 0.06) / 0.2)));
  hsStructure.style.clipPath = "inset(0 0 " + ((1 - sw) * 100).toFixed(2) + "% 0)";
  hsSweep.style.top = (sw * 100).toFixed(2) + "%";
  hsSweep.style.opacity = sw > 0.005 && sw < 0.995 ? 1 : 0;

  // PHASE 2 : les meubles. Le scroll ne fait que FRANCHIR des seuils ; la
  // pose elle-même se joue dans le temps (tween + espacement minimum), si
  // bien qu'un seul grand coup de molette pose quand même les meubles UN PAR
  // UN, jamais d'un coup.
  photoPieces.forEach((el, i) => {
    const s = PIECE_START + i * (PIECE_SPAN / PHOTO_PIECE_COUNT);
    if (prefersReduced) {
      el.style.opacity = p >= s ? 1 : 0;
      return;
    }
    if (p >= s && !pieceShown[i]) { pieceShown[i] = true; popPiece(i); }
    else if (p < s - 0.03 && pieceShown[i]) { pieceShown[i] = false; unpopPiece(i); }
  });
  if (prefersReduced) {
    let n = 0;
    for (let i = 0; i < PHOTO_PIECE_COUNT; i++) {
      if (p >= PIECE_START + i * (PIECE_SPAN / PHOTO_PIECE_COUNT)) n++;
    }
    hsCount.textContent = n;
  }

  // Libellé de phase
  const key = p < 0.3 ? "hs.phase1" : "hs.phase2";
  if (key !== lastPhaseKey) { lastPhaseKey = key; }
  phaseLabel(key);

  // COMPLÉTION : l'après complet se fond par-dessus (rattrape les ombres
  // diffuses que les masques ne capturent pas — l'image finale est exacte)
  if (hsComplete) {
    hsComplete.style.opacity = smooth(Math.min(1, Math.max(0, (p - 0.86) / 0.06)));
  }

  // FINAL : la lumière s'installe, la signature apparaît
  const g = smooth(Math.min(1, Math.max(0, (p - 0.9) / 0.09)));
  document.getElementById("hsPhotoGlow").style.opacity = g;
  hsDone.style.opacity = g;
  hsDone.style.transform = "translateX(-50%) translateY(" + ((1 - g) * 18).toFixed(1) + "px)";
}

/* ---------- Choix du mode + démarrage ---------- */
function initDemo(driver) {
  if (prefersReduced) { driver(1); hsHero.style.opacity = 1; return; }
  driver(0);
  ScrollTrigger.create({
    trigger: "#demo", start: "top top", end: "bottom bottom", scrub: 0.6,
    onUpdate: (self) => driver(self.progress)
  });
}

tryPhotoMode().then((ok) => {
  photoMode = ok;
  if (ok) {
    // Mode photo : la vraie pièce, le vrai staging.
    // Les <img> n'ont pas de src en HTML (pour éviter des 404 quand les
    // fichiers manquent) : on le pose maintenant, les images sont déjà en cache.
    hsPhoto.querySelectorAll("img[data-src]").forEach((el) => { el.src = el.dataset.src; });
    hsPhoto.hidden = false;
    hsScene.style.display = "none";
    hsTotal.textContent = PHOTO_PIECE_COUNT;
    phaseLabel("hs.phase1");
    initDemo(setPhotoScene);
  } else {
    // Repli : la scène vectorielle (aucune image requise)
    hsPhase.textContent = "";
    initDemo(setScene);
  }
  ScrollTrigger.refresh();
});

// À la bascule de langue, le libellé de phase suit
window.PAGE_LANG_HOOK = () => { if (photoMode) phaseLabel(lastPhaseKey); };

/* ---------- Sections suivantes ---------- */
if (!prefersReduced) {
  gsap.from(".hs-steps .volet", {
    y: 60, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.15,
    scrollTrigger: { trigger: ".hs-steps", start: "top 74%" }
  });
  gsap.from(".hs-cta .ph-cta__inner > *", {
    y: 30, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1,
    scrollTrigger: { trigger: "#cta", start: "top 72%" }
  });
}

/* ---------- LE GUIDE : Colette, home stagère ---------- */
VestaShared.initGuide({
  id: "colette",
  name: "Colette",
  role: { fr: "home stagère", en: "home stager" },
  accent: "#A8B78F",
  svg: '<svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<circle cx="32" cy="36" r="20" fill="#EFE7D8"/>' +
    '<circle cx="32" cy="12" r="7" fill="#3a2c1e"/>' +
    '<path d="M12 32 C13 18 22 13 32 13 C42 13 51 18 52 32 C46 24 38 22 32 22 C26 22 18 24 12 32 Z" fill="#3a2c1e"/>' +
    '<circle cx="25" cy="35" r="2.3" fill="#0A0806"/>' +
    '<circle cx="39" cy="35" r="2.3" fill="#0A0806"/>' +
    '<circle cx="13.5" cy="40" r="2.6" fill="#A8B78F"/>' +
    '<circle cx="50.5" cy="40" r="2.6" fill="#A8B78F"/>' +
    '<path d="M26 46 Q32 50 38 46" fill="none" stroke="#0A0806" stroke-width="2.2" stroke-linecap="round"/>' +
    "</svg>",
  steps: [
    { sel: "#demo", text: {
      fr: "Colette, home stagère. Cette chambre est nue ? Donnez-moi trois scrolls.",
      en: "Colette, home stager. This bedroom is bare? Give me three scrolls." } },
    { sel: "#etapes", text: {
      fr: "Un plan, une intention, 48 h. Je meuble sans déménager personne.",
      en: "A plan, an intent, 48 h. I furnish without moving anyone." } },
    { sel: "#cta", text: {
      fr: "Les acheteurs n'achètent pas des murs. Ils achètent une vie dedans.",
      en: "Buyers don't buy walls. They buy a life inside them." } }
  ]
});

ScrollTrigger.refresh();
window.addEventListener("load", () => ScrollTrigger.refresh());
