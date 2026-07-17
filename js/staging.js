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

/* ---------- LA DÉMO : l'assemblage des meubles ---------- */
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
  hsDone.style.transform = "translateY(" + ((1 - g) * 18).toFixed(1) + "px)";

  // Le titre s'efface dès qu'on commence
  hsHero.style.opacity = Math.max(0, 1 - p / 0.1);
}

if (prefersReduced) {
  setScene(1); // pièce entièrement meublée, sans chorégraphie
  hsHero.style.opacity = 1;
} else {
  setScene(0);
  ScrollTrigger.create({
    trigger: "#demo", start: "top top", end: "bottom bottom", scrub: 0.4,
    onUpdate: (self) => setScene(self.progress)
  });
}

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
