# Vesta — Landing page

Landing page statique de **Vesta** : le SaaS qui transforme de simples photos
d'un bien immobilier en vidéo promotionnelle "plan-séquence" générée par IA.

## Stack

- HTML / CSS / Vanilla JS — **100 % statique**, aucun build, aucun backend
- [GSAP 3 + ScrollTrigger](https://gsap.com/) — animations au scroll (CDN)
- [Lenis](https://lenis.darkroom.engineering/) — smooth scroll (CDN)
- Canvas 2D — braises en arrière-plan (pool fixe, sprite pré-rendu, ticker GSAP partagé)
- [Fraunces · Manrope · IBM Plex Mono](https://fonts.google.com/) — typographies (Google Fonts)

## Fonctionnalités

- **Visite guidée automatique** : une flamme-avatar pilote le scroll section
  par section (Lenis) et commente dans une bulle ; l'utilisateur reprend la
  main à la moindre interaction (molette, toucher, clavier).
- **Séquence démo pinnée** : au scroll, 5 Polaroïds convergent, s'embrasent
  et fusionnent pour révéler le lecteur vidéo du plan-séquence.
- `prefers-reduced-motion` respecté partout (ni visite auto, ni pin, ni braises).

## Structure

```
vesta/
├── index.html          # Page unique
├── css/
│   └── main.css        # Palette, reset, sections
├── js/
│   ├── smooth-scroll.js  # Lenis + synchro ScrollTrigger
│   ├── animations.js     # Reveals + séquence démo Polaroïds → vidéo
│   ├── particles.js      # Braises en arrière-plan (canvas)
│   └── main.js           # Point d'entrée / orchestration
└── assets/
    ├── img/            # Photos immobilières (Polaroïds)
    └── video/          # Vidéo plan-séquence de démo
```

## Déploiement (GitHub Pages)

Le site est servable tel quel : pousser ce dossier sur une branche `main`
et activer GitHub Pages (Settings → Pages → Deploy from branch → `/`).

## Développement local

Ouvrir `index.html` directement, ou servir le dossier :

```
python -m http.server 8000
```
