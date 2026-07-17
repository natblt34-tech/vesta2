/* ==========================================================================
   VESTA — Générateur de masques pour la démo home staging
   --------------------------------------------------------------------------
   Principe : structure.jpg (pièce rénovée vide) et apres.jpg (pièce meublée)
   sont identiques au pixel près SAUF là où il y a des meubles. La différence
   entre les deux images donne donc la silhouette EXACTE de chaque meuble
   (ombre comprise). Ce script :
     1. calcule la carte de différence,
     2. attribue chaque pixel au meuble dont la zone le contient (les zones
        se recouvrent : le meuble le plus « au-dessus » gagne),
     3. nettoie chaque silhouette (fermeture morpho + bouchage de trous),
     4. adoucit les bords (léger flou),
     5. écrit assets/staging/mask-0.png … mask-6.png (niveaux de gris)
        + des aperçus de contrôle dans scripts/preview/.
   Usage :  node scripts/make-staging-masks.js   (depuis la racine du projet)
   Dépendances : ffmpeg dans le PATH (aucune lib Node).
   ========================================================================== */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const DIR = "assets/staging";
const W = 1600, H = 1066;          // dimensions des JPG source
const OUT_W = 800, OUT_H = 533;    // dimensions des masques écrits
const MIN_COMPONENT = 2000;        // taille mini (px) d'un îlot conservé

/* Zones d'attribution par meuble, en % du cadre (larges : la précision vient
   de la carte de différence, la zone ne sert qu'à séparer les meubles).
   Le salon (tapis + canapé + table + vase + lampadaire) est UNE seule pose :
   ces meubles se chevauchent physiquement, les séparer crée des fragments.
   INDEX = ordre d'APPARITION dans la page :
   0 tableau · 1 fauteuil · 2 salon · 3 table d'appoint */
const ZONES = [
  /* 0 tableau  */ [[63, 20], [89, 20], [89, 53], [63, 53]],
  /* 1 fauteuil */ [[31, 46], [48, 46], [48, 64], [44.5, 66], [44.5, 76], [31, 76]],
  /* 2 salon    */ [[50, 42], [80, 43], [82, 28], [97, 28], [97, 100], [20, 100], [20, 66], [38, 60], [44, 55], [50, 50]],
  /* 3 appoint  */ [[85, 70], [100, 68], [100, 100], [85, 100]]
];
/* Seuil de différence par meuble : le tapis (beige sur parquet clair) demande
   un seuil bas ; les autres zones supportent un seuil plus strict anti-bruit. */
const THRESHOLDS = [40, 40, 26, 40];
/* Qui est AU-DESSUS de qui (du plus haut au plus bas) : un pixel disputé va
   au meuble le plus haut dans cette liste. */
const Z_ORDER = [0, 3, 1, 2];

/* ---------- Outils ---------- */
function run(cmd) { execSync(cmd, { stdio: ["ignore", "ignore", "inherit"] }); }

function decodeRaw(jpg) {
  const raw = path.join(DIR, path.basename(jpg, ".jpg") + ".raw");
  run(`ffmpeg -y -loglevel error -i "${jpg}" -vf scale=${W}:${H} -f rawvideo -pix_fmt rgb24 "${raw}"`);
  const buf = fs.readFileSync(raw);
  fs.unlinkSync(raw);
  return buf;
}

function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Dilatation / érosion binaires par boîte (séparables : lignes puis colonnes)
function boxMorph(mask, r, dilate) {
  const tmp = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = dilate ? 0 : 1;
      for (let k = -r; k <= r; k++) {
        const xx = x + k;
        if (xx < 0 || xx >= W) { if (!dilate) { v = 0; break; } continue; }
        const m = mask[y * W + xx];
        if (dilate ? m : !m) { v = dilate ? 1 : 0; if (dilate) break; else break; }
      }
      tmp[y * W + x] = v;
    }
  }
  const out = new Uint8Array(W * H);
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      let v = dilate ? 0 : 1;
      for (let k = -r; k <= r; k++) {
        const yy = y + k;
        if (yy < 0 || yy >= H) { if (!dilate) { v = 0; break; } continue; }
        const m = tmp[yy * W + x];
        if (dilate ? m : !m) { v = dilate ? 1 : 0; break; }
      }
      out[y * W + x] = v;
    }
  }
  return out;
}

// Bouche les trous : tout 0 non relié au bord de l'image devient 1
function fillHoles(mask) {
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x); }
  for (let y = 0; y < H; y++) { stack.push(y * W, y * W + W - 1); }
  while (stack.length) {
    const idx = stack.pop();
    if (seen[idx] || mask[idx]) continue;
    seen[idx] = 1;
    const x = idx % W, y = (idx / W) | 0;
    if (x > 0) stack.push(idx - 1);
    if (x < W - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - W);
    if (y < H - 1) stack.push(idx + W);
  }
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = mask[i] || !seen[i] ? 1 : 0;
  return out;
}

// Supprime les îlots plus petits que MIN_COMPONENT pixels
function dropSmallComponents(mask) {
  const label = new Int32Array(W * H).fill(-1);
  const out = new Uint8Array(W * H);
  let next = 0;
  for (let start = 0; start < W * H; start++) {
    if (!mask[start] || label[start] !== -1) continue;
    const stack = [start], members = [];
    label[start] = next;
    while (stack.length) {
      const idx = stack.pop();
      members.push(idx);
      const x = idx % W, y = (idx / W) | 0;
      const nb = [];
      if (x > 0) nb.push(idx - 1);
      if (x < W - 1) nb.push(idx + 1);
      if (y > 0) nb.push(idx - W);
      if (y < H - 1) nb.push(idx + W);
      for (const n of nb) if (mask[n] && label[n] === -1) { label[n] = next; stack.push(n); }
    }
    if (members.length >= MIN_COMPONENT) for (const m of members) out[m] = 1;
    next++;
  }
  return out;
}

/* Remplissage par spans : pour chaque colonne (puis chaque ligne), allume
   tout ce qui se trouve entre le premier et le dernier pixel du meuble.
   Inclure du FOND est inoffensif (identique dans les deux images) ; seuls
   les pixels des meubles posés PLUS TARD (forbidden) sont laissés éteints. */
function spanFill(mask, forbidden) {
  const out = Uint8Array.from(mask);
  for (let x = 0; x < W; x++) {
    let top = -1, bot = -1;
    for (let y = 0; y < H; y++) if (mask[y * W + x]) { if (top < 0) top = y; bot = y; }
    for (let y = top; top >= 0 && y <= bot; y++) {
      const i = y * W + x;
      if (!forbidden[i]) out[i] = 1;
    }
  }
  for (let y = 0; y < H; y++) {
    let left = -1, right = -1;
    for (let x = 0; x < W; x++) if (out[y * W + x]) { if (left < 0) left = x; right = x; }
    for (let x = left; left >= 0 && x <= right; x++) {
      const i = y * W + x;
      if (!forbidden[i]) out[i] = 1;
    }
  }
  return out;
}

// Flou boîte séparable sur masque 0..255 (adoucit les bords)
function blur(gray, r) {
  const tmp = new Float32Array(W * H), out = new Uint8Array(W * H);
  const n = 2 * r + 1;
  for (let y = 0; y < H; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += gray[y * W + Math.min(W - 1, Math.max(0, x))];
    for (let x = 0; x < W; x++) {
      tmp[y * W + x] = acc / n;
      const xAdd = Math.min(W - 1, x + r + 1), xSub = Math.max(0, x - r);
      acc += gray[y * W + xAdd] - gray[y * W + xSub];
    }
  }
  for (let x = 0; x < W; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
    for (let y = 0; y < H; y++) {
      out[y * W + x] = Math.round(acc / n);
      const yAdd = Math.min(H - 1, y + r + 1), ySub = Math.max(0, y - r);
      acc += tmp[yAdd * W + x] - tmp[ySub * W + x];
    }
  }
  return out;
}

/* ---------- 1. Carte de différence ---------- */
console.log("Décodage des images…");
const apres = decodeRaw(path.join(DIR, "apres.jpg"));
const struct_ = decodeRaw(path.join(DIR, "structure.jpg"));

console.log("Carte de différence…");
const diffMag = new Uint16Array(W * H);
for (let i = 0; i < W * H; i++) {
  diffMag[i] = Math.abs(apres[i * 3] - struct_[i * 3]) +
               Math.abs(apres[i * 3 + 1] - struct_[i * 3 + 1]) +
               Math.abs(apres[i * 3 + 2] - struct_[i * 3 + 2]);
}

/* ---------- 2. Attribution des pixels aux meubles (seuil par zone) ---------- */
console.log("Attribution aux meubles…");
const zonesPx = ZONES.map((poly) => poly.map(([px, py]) => [px * W / 100, py * H / 100]));
const owner = new Int8Array(W * H).fill(-1);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    for (const z of Z_ORDER) {
      if (diffMag[i] >= THRESHOLDS[z] && inPoly(x, y, zonesPx[z])) { owner[i] = z; break; }
    }
  }
}

/* ---------- 3-5. Nettoyage, adoucissement, écriture ---------- */
const previewDir = "scripts/preview";
fs.mkdirSync(previewDir, { recursive: true });

for (let p = 0; p < ZONES.length; p++) {
  console.log("Masque " + p + "…");
  let m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) m[i] = owner[i] === p ? 1 : 0;
  // ouverture (tue le bruit épars), fermeture (relie le meuble), bouchage de
  // trous, puis suppression des îlots trop petits pour être un meuble
  const rOpen = p === 2 ? 1 : 2; // le salon (seuil bas) supporte mal l'érosion
  m = boxMorph(m, rOpen, false);
  m = boxMorph(m, rOpen, true);
  m = boxMorph(m, 6, true);
  m = boxMorph(m, 6, false);
  m = fillHoles(m);
  m = dropSmallComponents(m);
  // remplissage par spans, borné par les meubles posés APRÈS celui-ci
  const forbidden = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) if (owner[i] > p) forbidden[i] = 1;
  m = spanFill(m, forbidden);
  // léger débordement (2px) pour ne pas rogner le bord du meuble, puis flou
  m = boxMorph(m, 2, true);
  const gray = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) gray[i] = m[i] ? 255 : 0;
  const soft = blur(gray, 2);

  // écriture du masque (réduit à OUT_W×OUT_H)
  const rawPath = path.join(DIR, "mask-" + p + ".raw");
  fs.writeFileSync(rawPath, Buffer.from(soft));
  run(`ffmpeg -y -loglevel error -f rawvideo -pix_fmt gray -s ${W}x${H} -i "${rawPath}" -vf scale=${OUT_W}:${OUT_H} "${path.join(DIR, "mask-" + p + ".png")}"`);

  // aperçu de contrôle : le meuble découpé sur fond neutre
  const prev = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    const a = soft[i] / 255;
    prev[i * 3] = Math.round(apres[i * 3] * a + 40 * (1 - a));
    prev[i * 3 + 1] = Math.round(apres[i * 3 + 1] * a + 38 * (1 - a));
    prev[i * 3 + 2] = Math.round(apres[i * 3 + 2] * a + 36 * (1 - a));
  }
  fs.writeFileSync(rawPath, prev);
  run(`ffmpeg -y -loglevel error -f rawvideo -pix_fmt rgb24 -s ${W}x${H} -i "${rawPath}" -vf scale=800:-2 -q:v 4 "${path.join(previewDir, "piece-" + p + ".jpg")}"`);
  fs.unlinkSync(rawPath);
}

console.log("Terminé : " + DIR + "/mask-0.png … mask-6.png");
