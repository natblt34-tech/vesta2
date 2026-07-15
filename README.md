# Vesta — Vos murs méritent un film

Site vitrine de **Vesta**, studio qui transforme les photos d'un bien immobilier
en **films cinématiques** (IA aux caméras, réalisateur humain au montage).

Le site tout entier est une **visite filmée** qui avance au rythme du scroll :
c'est le scroll de l'utilisateur qui fait avancer la caméra dans le bien, du hall
d'entrée jusqu'à la chambre. La révélation finale : *« Ce film, vous venez de le
piloter du regard. Généré par Vesta. »* — le médium est le message.

---

## Stack

- **HTML / CSS / JS vanilla** — 100 % statique, aucun build, aucun backend.
  Le site s'ouvre en double-cliquant `index.html` (ou via un petit serveur local, cf. plus bas).
- **[GSAP 3 + ScrollTrigger](https://gsap.com/)** (CDN) — toute l'orchestration scroll.
- **[Lenis](https://lenis.darkroom.engineering/)** (CDN) — smooth scroll inertiel.
- **Canvas 2D** — la visite est une **séquence d'images** scrubée au scroll
  (technique Apple AirPods), *pas* une balise `<video>` : le scrub image par image
  est parfaitement fluide, jamais saccadé.
- Polices **Fraunces** (display serif) + **Archivo** (sans), Google Fonts.

---

## Arborescence

```
vesta/
├── index.html          Structure + libs CDN
├── css/
│   └── main.css         Direction artistique complète (nuit / os / braise)
├── js/
│   └── main.js          Application : config frames, i18n, canvas, scroll, animations
├── frames/              ← LA VISITE : frame-0001.jpg … frame-0192.jpg
│   └── frame-0001.jpg …
├── assets/
│   ├── video/visite.mp4 Le film source (sert à (ré)générer les frames)
│   └── img/             Images diverses
├── .claude/
│   └── launch.json      Config serveur de dev local (port 4173)
└── README.md
```

---

## Injecter VOTRE film

La visite affichée est une suite d'images numérotées dans `frames/`. Pour mettre
votre propre film de visite (généré par Vesta) :

### 1. Découper le mp4 en frames avec ffmpeg

Depuis le dossier du projet, avec votre film dans `assets/video/visite.mp4` :

```bash
ffmpeg -i assets/video/visite.mp4 -vf "fps=8,scale=1600:-2:flags=lanczos" -q:v 3 frames/frame-%04d.jpg
```

- `fps=8` → ~8 images par seconde de film. Un film de ~24 s donne ~192 frames.
  Pour viser exactement ~200 frames : `fps = 200 / durée_du_film_en_secondes`.
- `scale=1600:-2` → largeur 1600 px (hauteur auto, paire). Bon compromis netteté / poids.
- `-q:v 3` → qualité JPEG élevée (2 = quasi sans perte, 5 = plus léger).
- `frame-%04d.jpg` → nommage `frame-0001.jpg`, `frame-0002.jpg`… (4 chiffres).

> 💡 Visez **150 à 240 frames**. Trop de frames = préchargement lourd ; trop peu = scrub haché.

### 2. Régler les constantes dans `js/main.js` (tout en haut)

```js
const FRAME_COUNT = 192;             // ← nombre exact de frames générées
const FRAME_PATH  = "frames/frame-"; // préfixe du chemin
const FRAME_EXT   = ".jpg";          // extension
const FRAME_PAD   = 4;               // nombre de zéros : 4 → frame-0001.jpg
```

Comptez vos frames pour ajuster `FRAME_COUNT` :

```bash
ls frames | wc -l        # macOS / Linux / Git Bash
```

C'est tout. Rechargez la page : la nouvelle visite est en place.

> Si le dossier `frames/` est absent, le canvas affiche un **dégradé chaud animé**
> de secours (le site ne casse jamais).

---

## Lancer en local

Ouvrir `index.html` directement fonctionne, mais un petit serveur évite les
restrictions de chargement des images selon le navigateur :

```bash
# Python 3 (déjà installé sur la plupart des machines)
python -m http.server 4173
# puis ouvrir http://localhost:4173
```

---

## Déployer sur GitHub Pages

1. Créez un dépôt GitHub et poussez le contenu de ce dossier à la racine :

   ```bash
   git init
   git add .
   git commit -m "Vesta — site vitrine"
   git branch -M main
   git remote add origin https://github.com/VOTRE-COMPTE/vesta.git
   git push -u origin main
   ```

2. Sur GitHub : **Settings → Pages → Build and deployment**
   - *Source* : **Deploy from a branch**
   - *Branch* : **main** / dossier **/ (root)** → **Save**.

3. Le site est publié sous quelques minutes sur
   `https://VOTRE-COMPTE.github.io/vesta/`.

> ⚠️ Les frames (`frames/*.jpg`) doivent être **commitées** dans le dépôt pour
> apparaître en ligne. Pour ~200 images à 1600 px (~70 Ko chacune), comptez ~15 Mo :
> parfait pour GitHub Pages. Pour alléger, réduisez `scale` à `1280`.

---

## Personnaliser

| Quoi | Où |
|------|----|
| Textes FR / EN | objet `I18N` en haut de `js/main.js` |
| Couleurs (nuit / os / braise) | variables `:root` en haut de `css/main.css` |
| Mot du masque vidéo-dans-le-texte | clé `mask` dans `applyLang()` (`VISITE` / `STEP IN`) |
| E-mail de contact | `mailto:` dans le `<footer>` de `index.html` |
| Rythme du scrub | valeur `scrub` du film dans `js/main.js` (§ 8.2) |

---

## Accessibilité & performance

- **`prefers-reduced-motion`** respecté : smooth scroll et grosses animations désactivés.
- Animations sur `transform` / `opacity` uniquement (pas de reflow).
- Préchargement des frames avec **compteur %** ; rendu canvas en mode *cover*,
  `devicePixelRatio` plafonné à 2.
- Responsive : les grilles se réorganisent, la typo se met à l'échelle en `clamp()`.

---

*Filmé par l'IA. Réalisé par un humain. — Vesta, Toulouse.*
