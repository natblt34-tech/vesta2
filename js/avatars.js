/* ==========================================================================
   VESTA — Les avatars des guides (SVG vectoriels dessinés main)
   Quatre petits esprits inspirés de la "famille de flammes" :
     cadre  → la Braise ardente (boule de roche incandescente, halo orange)
     lumen  → l'Esprit bougie (cylindre doré, flamme dansante sur la mèche)
     cut    → le Feu follet bleu (boule sombre, flammes azur)
     scribe → le Feu de sorcière (boule claire, flammes violettes)
   Chaque avatar embarque des yeux VIVANTS (classes .mascot-eye /
   .mascot-pupil pilotées par mascot.js : suivi du curseur, clignements)
   et des joues de gêne (.av-cheek). Les flammes (.av-flames) et la
   silhouette entière (.av-svg) sont animées en CSS.
   Expose : window.VestaAvatars = { init, svg }
   ========================================================================== */

window.VestaAvatars = (() => {
  'use strict';

  /* Visage commun : gros yeux ronds et brillants, sourire, joues.
     Le groupe .mascot-pupil (iris + reflets) est déplacé par GSAP. */
  function face(cx, cy, opts) {
    const o = Object.assign({
      gap: 13.5,       // demi-écart des yeux
      r: 8.6,          // rayon du blanc de l'œil
      ir: 5.6,         // rayon de l'iris
      ring: '#ffffff', // blanc de l'œil
      iris: '#241322', // couleur de l'iris
      mouth: '#241322',
      cheek: 'rgba(255, 110, 90, 0.55)',
    }, opts);

    const eye = (ex) => `
      <g class="mascot-eye">
        <circle cx="${ex}" cy="${cy}" r="${o.r}" fill="${o.ring}" opacity="0.96"/>
        <g class="mascot-pupil">
          <circle cx="${ex}" cy="${cy}" r="${o.ir}" fill="${o.iris}"/>
          <circle cx="${ex - o.ir * 0.35}" cy="${cy - o.ir * 0.4}" r="${o.ir * 0.34}" fill="#fff" opacity="0.95"/>
          <circle cx="${ex + o.ir * 0.4}" cy="${cy + o.ir * 0.35}" r="${o.ir * 0.16}" fill="#fff" opacity="0.8"/>
        </g>
      </g>`;

    return `
      ${eye(cx - o.gap)}
      ${eye(cx + o.gap)}
      <path class="mascot-mouth" d="M ${cx - 3.6} ${cy + o.r + 3.2} Q ${cx} ${cy + o.r + 6.4} ${cx + 3.6} ${cy + o.r + 3.2}"
            stroke="${o.mouth}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <ellipse class="av-cheek" cx="${cx - o.gap - o.r - 2}" cy="${cy + o.r}" rx="3.4" ry="2" fill="${o.cheek}"/>
      <ellipse class="av-cheek" cx="${cx + o.gap + o.r + 2}" cy="${cy + o.r}" rx="3.4" ry="2" fill="${o.cheek}"/>`;
  }

  /* Jambes-allumettes + petits pieds */
  function legs(cx, y, color) {
    return `
      <g class="av-legs" stroke="${color}" stroke-width="2.6" stroke-linecap="round">
        <line x1="${cx - 8}" y1="${y}" x2="${cx - 9}" y2="${y + 11}"/>
        <line x1="${cx - 9}" y1="${y + 11}" x2="${cx - 12.5}" y2="${y + 11.5}"/>
        <line x1="${cx + 8}" y1="${y}" x2="${cx + 9}" y2="${y + 11}"/>
        <line x1="${cx + 9}" y1="${y + 11}" x2="${cx + 12.5}" y2="${y + 11.5}"/>
      </g>`;
  }

  /* Petite ficelle nouée autour du corps */
  function string(cx, y, w, color) {
    return `
      <g stroke="${color}" stroke-width="1.3" fill="none" opacity="0.75">
        <path d="M ${cx - w} ${y} Q ${cx} ${y + 4} ${cx + w} ${y}"/>
        <path d="M ${cx - 2.5} ${y + 2.4} q -3.5 1.5 -4.5 4.5 M ${cx + 2.5} ${y + 2.4} q 3.5 1.5 4.5 4.5"/>
      </g>`;
  }

  const SVGS = {

    /* CADRE-01 · la Braise ardente : roche incandescente, halo orange */
    cadre: `
<svg class="av-svg av-cadre" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="gEmberBody" cx="42%" cy="34%" r="75%">
      <stop offset="0%" stop-color="#e85a2e"/>
      <stop offset="55%" stop-color="#c33a17"/>
      <stop offset="100%" stop-color="#7e1f0c"/>
    </radialGradient>
    <filter id="fEmberGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="5"/>
    </filter>
  </defs>
  <g class="av-flames">
    <ellipse cx="50" cy="58" rx="34" ry="40" fill="#ff8a2a" opacity="0.5" filter="url(#fEmberGlow)"/>
    <path d="M50 8 C57 20 62 24 60 33 C58 40 42 40 40 33 C38 24 43 20 50 8 Z" fill="#ffb054" opacity="0.85"/>
    <path d="M32 24 C36 30 38 33 36 38 C34 42 27 41 26 37 C25 32 28 29 32 24 Z" fill="#ff9b3d" opacity="0.7"/>
    <path d="M69 26 C72 31 74 34 72 38 C70 42 64 41 63 37 C62 33 65 30 69 26 Z" fill="#ff9b3d" opacity="0.7"/>
  </g>
  <circle cx="50" cy="60" r="29" fill="url(#gEmberBody)"/>
  <circle cx="36" cy="48" r="3.2" fill="#77200d" opacity="0.8"/>
  <circle cx="63" cy="42" r="2.4" fill="#77200d" opacity="0.7"/>
  <circle cx="68" cy="70" r="2.8" fill="#8d2a11" opacity="0.7"/>
  <circle cx="33" cy="72" r="2.2" fill="#8d2a11" opacity="0.7"/>
  ${string(50, 76, 24, '#5e1508')}
  ${legs(50, 88, '#3a1008')}
  ${face(50, 56, { ring: '#ffe9c9', iris: '#43140a', mouth: '#43140a' })}
</svg>`,

    /* LUMEN-02 · l'Esprit bougie : cire dorée, flamme sur la mèche */
    lumen: `
<svg class="av-svg av-lumen" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="gWax" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f0c26a"/>
      <stop offset="55%" stop-color="#dfa940"/>
      <stop offset="100%" stop-color="#b9822a"/>
    </linearGradient>
    <radialGradient id="gCandleFlame" cx="50%" cy="72%" r="60%">
      <stop offset="0%" stop-color="#fff3c4"/>
      <stop offset="55%" stop-color="#ffd977"/>
      <stop offset="100%" stop-color="#ff9b30"/>
    </radialGradient>
  </defs>
  <g class="av-flames">
    <path d="M50 10 C55 19 58 23 56 30 C54.5 35.5 45.5 35.5 44 30 C42 23 45 19 50 10 Z" fill="url(#gCandleFlame)"/>
    <ellipse cx="50" cy="24" rx="9" ry="12" fill="#ffb054" opacity="0.28"/>
  </g>
  <line x1="50" y1="30" x2="50" y2="37" stroke="#6b4413" stroke-width="2"/>
  <g>
    <rect x="29" y="37" width="42" height="52" rx="11" fill="url(#gWax)"/>
    <ellipse cx="50" cy="39" rx="21" ry="6" fill="#f7dfa2"/>
    <path d="M33 41 q 1.5 9 -1 13 q 4 1 4.5 -2 q 1 -6 -0.5 -11 Z" fill="#f2d491" opacity="0.9"/>
  </g>
  ${string(50, 78, 22, '#8a5c1a')}
  ${legs(50, 89, '#4a2f10')}
  ${face(50, 60, { ring: '#fff6df', iris: '#4a2c0c', mouth: '#4a2c0c' })}
</svg>`,

    /* CUT-03 · le Feu follet bleu : boule sombre, flammes azur */
    cut: `
<svg class="av-svg av-cut" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="gBlazeBody" cx="42%" cy="34%" r="75%">
      <stop offset="0%" stop-color="#2b6a6e"/>
      <stop offset="60%" stop-color="#174b50"/>
      <stop offset="100%" stop-color="#0a2b30"/>
    </radialGradient>
    <linearGradient id="gBlazeFlame" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#2b7de0"/>
      <stop offset="60%" stop-color="#35c8e8"/>
      <stop offset="100%" stop-color="#9df1f7"/>
    </linearGradient>
  </defs>
  <g class="av-flames">
    <path d="M50 4 C58 16 66 20 64 32 C72 28 76 24 78 18 C82 30 78 40 70 46 C76 46 80 44 84 40 C82 54 72 62 60 64 L40 64 C28 62 18 54 16 40 C20 44 24 46 30 46 C22 40 18 30 22 18 C24 24 28 28 36 32 C34 20 42 16 50 4 Z"
          fill="url(#gBlazeFlame)" opacity="0.9"/>
    <path d="M50 16 C55 24 59 27 58 34 C64 31 66 28 68 24 C69 34 65 41 59 45 L41 45 C35 41 31 34 32 24 C34 28 36 31 42 34 C41 27 45 24 50 16 Z"
          fill="#c9f6fb" opacity="0.85"/>
  </g>
  <circle cx="50" cy="62" r="27" fill="url(#gBlazeBody)"/>
  ${string(50, 76, 22, '#0a2226')}
  ${legs(50, 88, '#0e1e22')}
  ${face(50, 58, { ring: '#dbfbff', iris: '#0a2438', mouth: '#0a2438' })}
</svg>`,

    /* SCRIBE-04 · le Feu de sorcière : boule claire, flammes violettes */
    scribe: `
<svg class="av-svg av-scribe" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="gWitchBody" cx="42%" cy="34%" r="75%">
      <stop offset="0%" stop-color="#fff8fb"/>
      <stop offset="65%" stop-color="#f6dcea"/>
      <stop offset="100%" stop-color="#e6b9d6"/>
    </radialGradient>
    <linearGradient id="gWitchFlame" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#8e24aa"/>
      <stop offset="55%" stop-color="#c136d8"/>
      <stop offset="100%" stop-color="#f39ae0"/>
    </linearGradient>
  </defs>
  <g class="av-flames">
    <path d="M50 2 C56 14 63 18 62 30 C69 26 72 22 74 15 C79 27 75 38 68 45 C74 44 78 42 82 38 C80 52 70 61 58 63 L42 63 C30 61 20 52 18 38 C22 42 26 44 32 45 C25 38 21 27 26 15 C28 22 31 26 38 30 C37 18 44 14 50 2 Z"
          fill="url(#gWitchFlame)" opacity="0.92"/>
    <path d="M50 14 C54 22 58 25 57 32 C62 29 64 26 65 22 C67 31 63 39 58 43 L42 43 C37 39 33 31 35 22 C36 26 38 29 43 32 C42 25 46 22 50 14 Z"
          fill="#ffd9f2" opacity="0.9"/>
  </g>
  <circle cx="50" cy="61" r="26" fill="url(#gWitchBody)"/>
  ${string(50, 74, 21, '#9c5a86')}
  ${legs(50, 86, '#4a2a4e')}
  ${face(50, 57, { ring: '#ffffff', iris: '#571270', mouth: '#571270', cheek: 'rgba(233, 90, 160, 0.5)' })}
</svg>`,
  };

  function svg(skin) {
    return SVGS[skin] || SVGS.cadre;
  }

  /* Remplit chaque conteneur .mascot-flame avec le SVG de son skin
     (lu depuis la classe flame-skin--X posée dans le HTML) */
  function init() {
    document.querySelectorAll('.mascot-flame').forEach((el) => {
      const m = el.className.match(/flame-skin--(\w+)/);
      el.innerHTML = svg(m ? m[1] : 'cadre');
    });
  }

  return { init, svg };
})();
