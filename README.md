# Vesta — Landing page

Landing page statique de **Vesta** : le SaaS qui transforme de simples photos
d'un bien immobilier en vidéo promotionnelle "plan-séquence" générée par IA.
Architecture visuelle et mécaniques calquées sur les standards créatifs
(cloudstudio.es), direction artistique "Déesse du Foyer" : dark mode, or et feu.

## Stack

- HTML / CSS / Vanilla JS — **100 % statique**, aucun build, aucun backend
- [GSAP 3 + ScrollTrigger](https://gsap.com/) — animations au scroll (CDN)
- [Lenis](https://lenis.darkroom.engineering/) — smooth scroll (CDN)
- [Matter.js](https://brm.io/matter-js/) — physique du toolkit (CDN)
- [Bricolage Grotesque · Geist Mono](https://fonts.google.com/) — typographies
- Canvas 2D — braises en arrière-plan (pool fixe, sprite pré-rendu)

## Sections & mécaniques

1. **Overlay d'accueil** — "Ce site est vivant" : visite guidée ou exploration libre
2. **Hero** 100svh — titre massif, badge mono scramblé, marquee défilant
3. **Manifeste** — mot rotatif barré (`.fillword-box`)
4. **3 phases** — pile de cartes sticky plein écran avec profondeur au scroll
5. **Démo** — section pinnée : 5 Polaroïds convergent, s'embrasent, révèlent la vidéo
6. **Équipe** — deck de cartes staff IA cliquables (CADRE-01, LUMEN-02…)
7. **Méthode** — 3 colonnes + punchline
8. **Statement** — section inversée or pleine page
9. **Biens sublimés** — lignes avec aperçu flottant au survol
10. **Stats** — compteurs animés (formatage fr-FR)
11. **Toolkit** — tags physiques à attraper et lancer (Matter.js)
12. **FAQ** — accordéon
13. **Contact + footer**

**La mascotte** (`js/mascot.js`) : petit esprit-flamme avec visage — pupilles
qui suivent le curseur, clignements, excitation à proximité, flottement — qui
se déplace sur l'écran pendant la visite guidée (`js/tour.js`) et commente
chaque section. Interruption instantanée à la molette/toucher/clavier.

## Structure

```
vesta/
├── index.html
├── css/main.css          # tokens, composants, 13 sections, mascotte
├── js/
│   ├── smooth-scroll.js  # Lenis + synchro ScrollTrigger + ancres fluides
│   ├── animations.js     # reveals, scramble, fillword, compteurs, pile,
│   │                     #   démo pinnée, aperçus, deck, FAQ
│   ├── mascot.js         # l'esprit du foyer (visage, regard, humeurs)
│   ├── tour.js           # visite guidée auto-scrollée
│   ├── physics.js        # toolkit Matter.js (construit à la demande)
│   ├── particles.js      # braises canvas (ticker GSAP partagé)
│   └── main.js           # orchestration
└── assets/               # img/ et video/ — placeholders à remplacer
```

## Performance

- Une **seule boucle rAF** (ticker GSAP) pilote Lenis, les braises et la physique
- Physique construite au premier passage, en pause hors viewport
- Pas de `backdrop-filter` sur éléments mobiles (÷2 sur les FPS)
- `prefers-reduced-motion` respecté partout
- 60 FPS mesurés en traversée complète

## Déploiement (GitHub Pages)

Pousser sur `main` puis Settings → Pages → Deploy from branch → `/ (root)`.
Chemins relatifs : fonctionne tel quel en sous-répertoire.
