/* ==========================================================================
   VESTA — Les avatars des guides (SVG vectoriels dessinés main)
   Chaque guide est UN SEUL personnage-flamme : une silhouette de flamme en
   goutte (pointe en haut, corps rond en bas) tenant le visage, avec un
   dégradé continu corps→flamme (aucun calque, aucun décalage), des langues
   de flamme de la MÊME couleur qui ondulent à la pointe, et de petites
   flammèches qui s'envolent. Inspiré de la "famille de flammes" fournie.
     cadre  → la Braise ardente (rouge/orange)
     lumen  → l'Esprit bougie (doré)
     cut    → le Feu follet (bleu/cyan)
     scribe → le Feu de sorcière (violet)
   Le visage (.mascot-eye / .mascot-pupil / .mascot-mouth / .av-cheek) est
   piloté par mascot.js. Les mouvements (bob, ondulation, flammèches) sont
   en CSS. Expose : window.VestaAvatars = { init, svg }
   ========================================================================== */

window.VestaAvatars = (() => {
  'use strict';

  /* Visage : gros yeux ronds et brillants, sourire, joues. Le groupe
     .mascot-pupil (iris + reflets) est déplacé par GSAP pour suivre le curseur. */
  function face(cx, cy, iris, mouth, cheek) {
    const gap = 15, r = 9.5, ir = 6.2;
    const eye = (ex) => `
      <g class="mascot-eye">
        <circle cx="${ex}" cy="${cy}" r="${r}" fill="#fffdf7"/>
        <g class="mascot-pupil">
          <circle cx="${ex}" cy="${cy}" r="${ir}" fill="${iris}"/>
          <circle cx="${ex - ir * 0.34}" cy="${cy - ir * 0.42}" r="${ir * 0.36}" fill="#fff"/>
          <circle cx="${ex + ir * 0.42}" cy="${cy + ir * 0.32}" r="${ir * 0.17}" fill="#fff" opacity="0.85"/>
        </g>
      </g>`;
    return `
      <ellipse class="av-cheek" cx="${cx - gap - r - 1}" cy="${cy + r - 1}" rx="4" ry="2.4" fill="${cheek}"/>
      <ellipse class="av-cheek" cx="${cx + gap + r + 1}" cy="${cy + r - 1}" rx="4" ry="2.4" fill="${cheek}"/>
      ${eye(cx - gap)}
      ${eye(cx + gap)}
      <path class="mascot-mouth" d="M ${cx - 4.5} ${cy + r + 4} Q ${cx} ${cy + r + 8} ${cx + 4.5} ${cy + r + 4}"
            stroke="${mouth}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;
  }

  /* Un guide complet. c = { bodyLo, bodyHi, lick, tip, core, iris, legs, cheek } */
  function build(skin, c) {
    return `
<svg class="av-svg av-${skin}" viewBox="0 0 120 176" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="vBody-${skin}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="${c.bodyLo}"/>
      <stop offset="52%" stop-color="${c.bodyHi}"/>
      <stop offset="100%" stop-color="${c.tip}"/>
    </linearGradient>
    <linearGradient id="vLick-${skin}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="${c.lick}"/>
      <stop offset="100%" stop-color="${c.tip}"/>
    </linearGradient>
    <radialGradient id="vCore-${skin}" cx="50%" cy="60%" r="55%">
      <stop offset="0%" stop-color="${c.core}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${c.core}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- flammèches qui s'envolent -->
  <g class="av-embers" fill="${c.tip}">
    <path class="av-ember e1" d="M60 30 c4 6 4 10 0 14 c-4 -4 -4 -8 0 -14 Z"/>
    <path class="av-ember e2" d="M42 44 c3 4 3 7 0 10 c-3 -3 -3 -6 0 -10 Z"/>
    <path class="av-ember e3" d="M80 40 c3 5 3 8 0 11 c-3 -3 -3 -6 0 -11 Z"/>
  </g>

  <!-- langues de flamme qui ondulent (même couleur que la pointe : aucun
       raccord visible ; enracinées dans le haut de la silhouette) -->
  <g class="av-flames">
    <path class="av-lick l1" d="M60 66 C66 46 71 34 66 20 C63 11 57 11 54 20 C49 34 54 48 60 66 Z" fill="url(#vLick-${skin})"/>
    <path class="av-lick l2" d="M45 72 C50 56 53 46 50 36 C48 29 43 30 42 38 C40 50 40 60 45 72 Z" fill="url(#vLick-${skin})"/>
    <path class="av-lick l3" d="M76 70 C81 55 83 46 80 37 C78 30 73 31 72 39 C70 51 71 60 76 70 Z" fill="url(#vLick-${skin})"/>
  </g>

  <!-- SILHOUETTE unifiée : une flamme en goutte, un seul dégradé corps→flamme -->
  <path class="av-flame-body"
        d="M60 24 C72 54 92 70 92 104 C92 138 79 158 60 158 C41 158 28 138 28 104 C28 70 48 54 60 24 Z"
        fill="url(#vBody-${skin})"/>
  <ellipse cx="60" cy="118" rx="30" ry="32" fill="url(#vCore-${skin})"/>

  <!-- jambes -->
  <g class="av-legs" stroke="${c.legs}" stroke-width="4.4" stroke-linecap="round" fill="none">
    <path d="M51 155 L48 173 L42 174.5"/>
    <path d="M69 155 L72 173 L78 174.5"/>
  </g>

  <!-- visage (net, posé sur le corps) -->
  ${face(60, 112, c.iris, c.mouth, c.cheek)}
</svg>`;
  }

  const SKINS = {
    cadre: {
      bodyLo: '#8f2a10', bodyHi: '#d0431a', tip: '#ffb15a', lick: '#ff8a2e',
      core: '#ffd9a6', iris: '#3a1206', mouth: '#3a1206', legs: '#43140a',
      cheek: 'rgba(255, 120, 70, 0.5)',
    },
    lumen: {
      bodyLo: '#cf9430', bodyHi: '#f0bd45', tip: '#fff2c8', lick: '#ffdd75',
      core: '#fff4d6', iris: '#5a3a10', mouth: '#5a3a10', legs: '#6b4413',
      cheek: 'rgba(255, 170, 80, 0.45)',
    },
    cut: {
      bodyLo: '#0d2f34', bodyHi: '#1f7d8a', tip: '#a6f0f8', lick: '#3fc4d6',
      core: '#bff4fb', iris: '#0a2430', mouth: '#0a2430', legs: '#0e2226',
      cheek: 'rgba(90, 200, 220, 0.45)',
    },
    scribe: {
      bodyLo: '#e3c4ec', bodyHi: '#c46fda', tip: '#f2a6f4', lick: '#c93fd6',
      core: '#fbe6ff', iris: '#4a1560', mouth: '#4a1560', legs: '#4a2a4e',
      cheek: 'rgba(230, 100, 190, 0.5)',
    },
  };

  function svg(skin) {
    const c = SKINS[skin] || SKINS.cadre;
    return build(SKINS[skin] ? skin : 'cadre', c);
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
