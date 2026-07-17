/* ==========================================================================
   VESTA — Page RETOUCHE PHOTO
   La démo : une photo terne, révélée par un balayage avant/après piloté
   par le scroll. Les réglages (Lumière / Couleur / Netteté) s'allument au
   passage du balayage. Guide de la page : Iris, la retoucheuse.
   ========================================================================== */

/* ---------- i18n de la page (fusionné avec le socle par shared.js) ---------- */
window.PAGE_I18N = {
  fr: {
    "ph.eyebrow": "Vesta · Retouche photo",
    "ph.title": "La photo, à sa vraie lumière.",
    "ph.sub": "Faites défiler : la retouche se fait sous vos yeux.",
    "ph.before": "Avant", "ph.after": "Après",
    "ph.c1": "Lumière", "ph.c2": "Couleur", "ph.c3": "Netteté",
    "ph.credoeyebrow": "Notre règle",
    "ph.credotitle": "Le bien à son avantage. Jamais au-delà du vrai.",
    "ph.credotext": "On révèle la lumière qui était là, les couleurs qu'avait la pièce, la netteté que mérite la pierre. On n'invente rien : la visite confirme la photo.",
    "ph.pieceseyebrow": "Sur toutes vos pièces",
    "ph.p1": "Le salon", "ph.p2": "La cuisine", "ph.p3": "L'entrée",
    "ph.piecesnote": "Livraison en 24 h, formats portail et réseaux.",
    "ph.ctatitle": "Vos photos méritent mieux.",
    "ph.ctabtn": "Réserver un rendez-vous",
    "ph.ctaalt": "Découvrir le film Vesta →"
  },
  en: {
    "ph.eyebrow": "Vesta · Photo retouching",
    "ph.title": "Your photos, in their true light.",
    "ph.sub": "Scroll: the retouch happens before your eyes.",
    "ph.before": "Before", "ph.after": "After",
    "ph.c1": "Light", "ph.c2": "Colour", "ph.c3": "Sharpness",
    "ph.credoeyebrow": "Our rule",
    "ph.credotitle": "The property at its best. Never beyond the truth.",
    "ph.credotext": "We reveal the light that was there, the colours the room had, the sharpness the stone deserves. We invent nothing: the visit confirms the photo.",
    "ph.pieceseyebrow": "On every room",
    "ph.p1": "The living room", "ph.p2": "The kitchen", "ph.p3": "The entrance",
    "ph.piecesnote": "24 h delivery, portal and social formats.",
    "ph.ctatitle": "Your photos deserve better.",
    "ph.ctabtn": "Book a call",
    "ph.ctaalt": "Discover the Vesta film →"
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

/* ---------- LA DÉMO : balayage avant / après ---------- */
const phAfter = document.getElementById("phAfter");
const phLine = document.getElementById("phLine");
const chips = [document.getElementById("chipLum"), document.getElementById("chipCol"), document.getElementById("chipNet")];
const chipAt = [0.3, 0.55, 0.8]; // seuils de balayage où chaque réglage s'allume

function setWipe(p) {
  // p ∈ [0,1] : position du balayage (0 = tout « avant », 1 = tout « après »)
  const pct = Math.min(1, Math.max(0, p)) * 100;
  phAfter.style.clipPath = "inset(0 " + (100 - pct) + "% 0 0)";
  phLine.style.left = pct + "%";
  phLine.style.opacity = pct > 0.5 && pct < 99.5 ? 1 : 0;
  chips.forEach((c, i) => c.classList.toggle("is-on", p >= chipAt[i]));
}

if (prefersReduced) {
  // Mouvement réduit : l'« après » est montré directement, réglages allumés
  setWipe(1);
  document.querySelector(".ph-hero").style.opacity = 1;
} else {
  setWipe(0);
  ScrollTrigger.create({
    trigger: "#demo", start: "top top", end: "bottom bottom", scrub: 0.4,
    onUpdate: (self) => {
      const p = self.progress;
      // 0 → 0.12 : le titre s'efface ; 0.1 → 0.9 : le balayage traverse
      const wipe = (p - 0.1) / 0.8;
      setWipe(wipe);
      const hero = document.querySelector(".ph-hero");
      hero.style.opacity = Math.max(0, 1 - p / 0.14);
      // Les étiquettes suivent le balayage
      document.querySelector(".ph-tag--before").style.opacity = p > 0.08 && wipe < 0.97 ? 1 : 0;
      document.querySelector(".ph-tag--after").style.opacity = wipe > 0.06 ? 1 : 0;
      // Légère respiration de la photo sur toute la traversée
      const z = 1 + p * 0.05;
      document.querySelector(".ph-stage__before").style.transform = "scale(" + z + ")";
      phAfter.style.transform = "scale(" + z + ")";
    }
  });
}

/* ---------- Sections suivantes : révélations douces ---------- */
if (!prefersReduced) {
  gsap.from(".ph-credo__inner > *", {
    y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12,
    scrollTrigger: { trigger: "#credo", start: "top 70%" }
  });
  gsap.from(".ph-card", {
    y: 60, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
    scrollTrigger: { trigger: ".ph-pieces__grid", start: "top 80%" }
  });
  gsap.from(".ph-cta__inner > *", {
    y: 30, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1,
    scrollTrigger: { trigger: "#cta", start: "top 72%" }
  });
}

/* ---------- LE GUIDE : Iris, la retoucheuse ---------- */
VestaShared.initGuide({
  id: "iris",
  name: "Iris",
  role: { fr: "retoucheuse", en: "retoucher" },
  accent: "#d8a24a",
  svg: '<svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<circle cx="32" cy="35" r="21" fill="#EFE7D8"/>' +
    '<path d="M11 30 C11 14 22 10 32 10 C42 10 53 14 53 30 C48 22 40 20 32 20 C24 20 16 22 11 30 Z" fill="#3a2c1e"/>' +
    '<circle cx="24" cy="35" r="7" fill="none" stroke="#d8a24a" stroke-width="2.4"/>' +
    '<circle cx="40" cy="35" r="7" fill="none" stroke="#d8a24a" stroke-width="2.4"/>' +
    '<path d="M31 35 h2" stroke="#d8a24a" stroke-width="2.4"/>' +
    '<circle cx="24" cy="35" r="2.2" fill="#0A0806"/>' +
    '<circle cx="40" cy="35" r="2.2" fill="#0A0806"/>' +
    '<path d="M27 48 Q32 51 37 48" fill="none" stroke="#0A0806" stroke-width="2" stroke-linecap="round"/>' +
    "</svg>",
  steps: [
    { sel: "#demo", text: {
      fr: "Iris, retoucheuse. Cette photo dort. Scrollez, je la réveille.",
      en: "Iris, retoucher. This photo is asleep. Scroll — I'll wake it." } },
    { sel: "#credo", text: {
      fr: "Ma règle est simple : tout doit rester vrai. La visite confirme la photo.",
      en: "My rule is simple: everything stays true. The visit confirms the photo." } },
    { sel: "#pieces", text: {
      fr: "Salon, cuisine, entrée… chaque pièce a sa lumière. Je la retrouve.",
      en: "Living room, kitchen, entrance… every room has its light. I find it." } },
    { sel: "#cta", text: {
      fr: "Envoyez-moi vos photos ternes. Je vous les rends éclatantes, en 24 h.",
      en: "Send me your dull photos. I'll return them glowing, in 24 h." } }
  ]
});

ScrollTrigger.refresh();
window.addEventListener("load", () => ScrollTrigger.refresh());
