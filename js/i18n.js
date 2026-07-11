/* ==========================================================================
   VESTA — Internationalisation FR / EN
   Principe : le FRANÇAIS est la source de vérité, écrite dans le HTML et
   dans les modules JS. L'anglais vit ici, en deux structures :
     - DOM_EN : [sélecteur, texte anglais, isHtml?] appliqué au chargement
       quand la langue est "en" (querySelectorAll : un sélecteur peut
       traduire plusieurs éléments d'un coup, ex. les 4 cartes staff)
     - JS_EN  : chaînes utilisées par les modules (visite, mascotte…),
       consommées via t(clé, versionFrançaise)
   Le bouton EN/FR mémorise le choix puis RECHARGE la page : c'est le seul
   moyen d'avoir un état parfaitement cohérent (les corps physiques de
   l'arène sont mesurés sur la largeur des tags, le scramble lit le texte
   au déclenchement, etc.).
   Expose : window.VestaI18n = { init, t, lang }
   ========================================================================== */

window.VestaI18n = (() => {
  'use strict';

  let lang = 'fr';
  try { lang = localStorage.getItem('vesta-lang') || 'fr'; } catch (e) { /* nav. privée */ }

  /* --- Traductions du DOM ---------------------------------------------------- */

  const DOM_EN = [
    // Nav
    ['.nav-link[href="#demo"]', 'Demo'],
    ['.nav-link[href="#equipe"]', 'Crew'],
    ['.site-nav .btn-pill', 'Book a demo →'],

    // Overlay d'accueil
    ['.tour-overlay-inner > .mono-label', '( CHOOSE YOUR GUIDE )'],
    ['.tour-overlay-title', 'This site is alive.'],
    ['.mascot-choice[data-skin="cadre"] .choice-role', 'CAMERA'],
    ['.mascot-choice[data-skin="lumen"] .choice-role', 'LIGHT'],
    ['.mascot-choice[data-skin="cut"] .choice-role', 'EDITING'],
    ['.mascot-choice[data-skin="scribe"] .choice-role', 'COPY'],
    ['#tour-start .cta-before', 'Let '],
    ['#tour-start .cta-after', ' guide →'],
    ['#tour-skip-intro', 'SKIP · EXPLORE ON MY OWN →'],
    ['.mascot-skip', 'SKIP THE TOUR ✕'],

    // Hero
    ['.hero-line:nth-child(1) .hero-line-inner', 'Your photos'],
    ['.hero-line:nth-child(2) .hero-line-inner', 'become'],
    ['.hero-line:nth-child(3) .hero-line-inner', 'a film.'],

    // Manifeste
    ['#work > .mono-label', '( WHAT VESTA DOES )'],
    ['.manifesto-lead', 'Your listings deserve more<br>than ', true],
    ['.manifesto-sub', 'A studio at the crossroads of AI and image. Every listing that goes through Vesta comes out with a real film, edited and graded, not a slideshow. Three moves, and everything ships.'],
    ['.bucket-chip:nth-child(1)', '◆ UPLOAD & ANALYSIS'],
    ['.bucket-chip:nth-child(2)', '◆ FILM GENERATION'],
    ['.bucket-chip:nth-child(3)', '◆ DISTRIBUTION'],

    // Phase 1 — dépôt
    ['.phase-card:nth-child(1) .mono-label.gold', '( LIVING ROOM · KITCHEN · BEDROOM )'],
    ['.phase-card:nth-child(1) .phase-title', 'Photo upload'],
    ['.phase-card:nth-child(1) .phase-text', 'One photo per room, taken on a smartphone. No stabilizer, no wide-angle lens, no editing. Vesta reads the volumes, the light and the flow between rooms for you.'],
    ['.phase-card:nth-child(1) .arrow-list li:nth-child(1)', '→ Drag-and-drop import'],
    ['.phase-card:nth-child(1) .arrow-list li:nth-child(2)', '→ Automatic room detection'],
    ['.phase-card:nth-child(1) .arrow-list li:nth-child(3)', '→ Suggested visit order'],
    ['.phase-card:nth-child(1) .badge-live', 'READY IN 2 MINUTES'],
    ['.phase-card:nth-child(1) .mock-title', 'upload · drop your photos here'],
    ['.phase-card:nth-child(1) .mock-file:nth-child(1)', 'living.jpg <b>✓</b>', true],
    ['.phase-card:nth-child(1) .mock-file:nth-child(2)', 'kitchen.jpg <b>✓</b>', true],
    ['.phase-card:nth-child(1) .mock-file:nth-child(3)', 'bedroom.jpg <b>✓</b>', true],
    ['.phase-card:nth-child(1) .mock-file:nth-child(4)', 'entrance.jpg <b>✓</b>', true],

    // Phase 2 — génération
    ['.phase-card:nth-child(2) .mono-label.gold', '( AI · EDITING · COLOR GRADING )'],
    ['.phase-card:nth-child(2) .phase-title', 'Film generation'],
    ['.phase-card:nth-child(2) .phase-text', 'The AI animates every room and edits the film: smooth camera moves, polished transitions, warm color grading worthy of a production. And it reviews its own work: any disappointing render is redone, up to three times.'],
    ['.phase-card:nth-child(2) .arrow-list li:nth-child(1)', '→ Generated camera moves'],
    ['.phase-card:nth-child(2) .arrow-list li:nth-child(2)', '→ Music and pacing matched to the property'],
    ['.phase-card:nth-child(2) .arrow-list li:nth-child(3)', '→ Quality check: up to three tries'],
    ['.phase-card:nth-child(2) .badge-live', 'DELIVERED WITHIN 48H'],
    ['.phase-card:nth-child(2) .mock-title', 'generating · property_film.mp4'],
    ['.phase-card:nth-child(2) .mock-log:nth-of-type(1)', 'volume analysis <b>✓</b>', true],
    ['.phase-card:nth-child(2) .mock-log:nth-of-type(2)', 'transitions <b>✓</b>', true],
    ['.phase-card:nth-child(2) .mock-log:nth-of-type(3)', 'warmth grading <b>✓</b>', true],

    // Phase 3 — diffusion
    ['.phase-card:nth-child(3) .mono-label.gold', '( PORTALS · SOCIAL · STOREFRONT )'],
    ['.phase-card:nth-child(3) .phase-title', 'Distribute everywhere'],
    ['.phase-card:nth-child(3) .phase-text', 'One click and the film ships in every format: property portals, social media, agency storefront. Your listings move up a class.'],
    ['.phase-card:nth-child(3) .arrow-list li:nth-child(1)', '→ 16:9, 9:16 and 1:1 exports'],
    ['.phase-card:nth-child(3) .arrow-list li:nth-child(2)', '→ Instant share links'],
    ['.phase-card:nth-child(3) .arrow-list li:nth-child(3)', '→ Royalty-free music included'],
    ['.phase-card:nth-child(3) .badge-live', 'READY TO PUBLISH'],
    ['.phase-card:nth-child(3) .mock-title', 'distribution · last 30 days'],
    ['.phase-card:nth-child(3) .mock-log', '99.9% online · 2,847 plays · 0 errors'],

    // Démo
    ['.demo-head .mono-label', '( THE DEMO · SCROLL )'],
    ['.demo-title', 'Simple photos.<br>A real film.', true],
    ['.polaroid[data-room="salon"] figcaption', 'Living room'],
    ['.polaroid[data-room="cuisine"] figcaption', 'Kitchen'],
    ['.polaroid[data-room="chambre"] figcaption', 'Bedroom'],
    ['.polaroid[data-room="entree"] figcaption', 'Entrance'],
    ['.demo-player-label', 'VESTA · THE FILM · 00:42'],
    ['.demo-player figcaption', 'video generated automatically by vesta'],

    // Équipe
    ['.workforce-head .mono-label', '( THE FILM CREW )'],
    ['.workforce-title', 'YOUR VIDEO CREW<br>ISN\'T HUMAN ANYMORE.', true],
    ['.workforce-sub', 'Every Vesta film is shot by a full AI crew: a real role, a 24/7 shift and a salary in cents, never in shooting days. Click to meet the crew.'],
    ['.staff-head', 'VESTA · CREW PASS'],
    ['.staff-type', 'AI WORKER'],
    ['.staff-rows div:nth-child(1) dt', 'ROLE'],
    ['.staff-rows div:nth-child(2) dt', 'SHIFT'],
    ['.staff-rows div:nth-child(3) dt', 'PAY'],
    ['.staff-rows div:nth-child(2) dd', '24/7 · no breaks'],
    ['[data-worker="cadre"] .staff-rows div:nth-child(1) dd', 'Camera moves'],
    ['[data-worker="cadre"] .staff-rows div:nth-child(3) dd', 'a few cents per film'],
    ['[data-worker="cadre"] .staff-tag', 'Perfect dolly moves, no steadicam.'],
    ['[data-worker="lumen"] .staff-rows div:nth-child(1) dd', 'Light & color grading'],
    ['[data-worker="lumen"] .staff-rows div:nth-child(3) dd', 'tokens, not day rates'],
    ['[data-worker="lumen"] .staff-tag', 'Every room bathed in golden light.'],
    ['[data-worker="cut"] .staff-rows div:nth-child(1) dd', 'Editing & pacing'],
    ['[data-worker="cut"] .staff-rows div:nth-child(3) dd', 'a cent per cut'],
    ['[data-worker="cut"] .staff-tag', 'Cuts right, at the right moment.'],
    ['[data-worker="scribe"] .staff-rows div:nth-child(1) dd', 'Listing copy'],
    ['[data-worker="scribe"] .staff-rows div:nth-child(3) dd', 'a cent per line'],
    ['[data-worker="scribe"] .staff-tag', 'Writes the listing while the film exports.'],
    ['.deck-hint', 'CLICK · MEET THE WHOLE CREW'],

    // Statement
    ['.statement .mono-label', '( OUR PROMISE )'],
    ['.st-line:nth-child(1) .st-line-inner', 'WE PUT'],
    ['.st-line:nth-child(2) .st-line-inner', 'YOUR LISTINGS ON SCREEN.'],
    ['.statement-sub', 'Rendering, warmth and movement are not add-ons. They are the standard for every film that leaves Vesta.'],

    // Biens sublimés
    ['.works-title', 'Listings, elevated'],
    ['.works-head .mono-label', 'HOVER · FILMS GENERATED FOR REAL LISTINGS'],
    ['.work-row:nth-child(1) .work-name', 'Haussmann apartment'],
    ['.work-row:nth-child(2) .work-name', 'Modern villa'],
    ['.work-row:nth-child(3) .work-name', 'Industrial loft'],
    ['.work-row:nth-child(4) .work-name', 'Renovated farmhouse'],

    // Stats
    ['.stat:nth-child(1) .stat-label', 'FILMS GENERATED'],
    ['.stat:nth-child(2) .stat-label', 'AGENCIES ON BOARD'],
    ['.stat:nth-child(3) .stat-label', 'DELIVERY TIME'],
    ['.stat:nth-child(4) .stat-label', 'TRIES PER FILM'],

    // Toolkit
    ['.toolkit-title', 'The toolbox'],
    ['#toolkit > .mono-label', 'DRAG & THROW · EVERY TOOL RUNS IN PRODUCTION'],
    ['.toolkit-arena .tool-tag:nth-child(1)', 'Smooth transitions'],
    ['.toolkit-arena .tool-tag:nth-child(2)', 'Virtual home staging'],
    ['.toolkit-arena .tool-tag:nth-child(3)', 'AI decluttering'],
    ['.toolkit-arena .tool-tag:nth-child(4)', 'Cinema color grading'],
    ['.toolkit-arena .tool-tag:nth-child(5)', 'Smart editing'],
    ['.toolkit-arena .tool-tag:nth-child(6)', 'Portal exports'],
    ['.toolkit-arena .tool-tag:nth-child(7)', 'Custom music'],
    ['.toolkit-arena .tool-tag:nth-child(8)', 'Vertical formats'],
    ['.toolkit-arena .tool-tag:nth-child(9)', 'Virtual twilight'],
    ['.toolkit-arena .tool-tag:nth-child(10)', 'Simulated drone shots'],

    // Contact & footer
    ['#contact .mono-label', '( YOUR NEXT LISTING )'],
    ['.contact-title', 'Bring your<br>listings to life.', true],
    ['.contact-actions .btn-solid', 'Request access →'],
    ['.footer span.mono-label:nth-of-type(2)', 'AI FOR REAL ESTATE'],
    ['.footer .mono-link', 'BACK TO TOP ↑'],
  ];

  /* --- Chaînes utilisées par les modules JS ------------------------------------ */

  const JS_EN = {
    'meta.title': 'Vesta · Your photos become a film',
    'meta.description': 'Vesta turns simple photos of your property into a warm, high-end promotional video, edited by AI.',

    // Rotateur du manifeste (même structure que le FR : barrés puis final doré)
    'fillwords': [
      { text: 'still photos.', strike: true },
      { text: 'slideshows.', strike: true },
      { text: 'this: a film.', strike: false },
    ],

    // Mascotte
    'mascot.handover': 'All yours ✦',
    'mascot.hop': 'Gotcha! ✦',
    'mascot.oops': 'Oops!',
    'works.preview': ' · vesta film',

    // Les quatre agents
    'skin.cadre.greeting': 'Welcome ✦ CADRE-01, Vesta\'s director of photography. Follow me, I\'ll frame the visit.',
    'skin.cadre.self': 'And this card… CADRE-01: that\'s me! ✦',
    'skin.lumen.greeting': 'Welcome ✦ I\'m LUMEN-02, I handle the light. Come along, I\'ll light the way.',
    'skin.lumen.self': 'Oh, LUMEN-02… wait, that\'s me! ✦',
    'skin.cut.greeting': 'CUT-03. Editing. We visit, we don\'t linger. Follow me.',
    'skin.cut.self': 'CUT-03. That\'s me. Obviously.',
    'skin.scribe.greeting': 'Welcome ✦ SCRIBE-04, Vesta\'s official quill. Let me tell you the story of this site.',
    'skin.scribe.self': 'And the SCRIBE-04 card… yours truly! ✦',

    // Curseur & nuage de points
    'cursor.talk': 'Talk',
    'morph.words': ['VESTA', 'A FILM', '48H', 'HOME'],

    // Conversation avec le guide
    'chat.root': 'I\'m listening ✦ What would you like to know?',
    'chat.how': 'You upload one photo per room, the AI crew shoots and edits the film, and you get it within 48 hours, ready to publish everywhere.',
    'chat.price': '10 to 50 times less than a videographer: an agency subscription or pay-per-film, set upfront. No travel, no surprises.',
    'chat.photos': 'Yes! Your smartphone photos are enough: backlight, dark rooms and rough angles are fixed automatically. One roughly straight photo per room, that\'s all.',
    'chat.jokes': [
      'Why did the flame fail her casting? She skipped too many steps and burned the rest.',
      'Our editor never sleeps. Then again, neither does a campfire.',
      'They told me to stay cool during negotiations. Tricky, in my situation.',
      'What\'s the worst thing for a real-estate videographer? Losing the production house.',
      'I asked for a raise. They said I was already too hot.',
    ],
    'chat.who.cadre': 'CADRE-01, director of photography. I compute perfect dolly moves without ever spilling my coffee. I don\'t have coffee.',
    'chat.who.lumen': 'LUMEN-02, on lights. My trick: making every room look south-facing at 6pm. It\'s a gift.',
    'chat.who.cut': 'CUT-03. Editing. Three words are enough.',
    'chat.who.scribe': 'SCRIBE-04, the quill. I write your listings while the others fuss around. Someone has to keep the record.',
    'chat.opt.how': 'How does it work?',
    'chat.opt.price': 'What does it cost?',
    'chat.opt.photos': 'Are my photos enough?',
    'chat.opt.joke': 'Tell me a joke 🔥',
    'chat.opt.who': 'Who are you?',
    'chat.opt.tour': 'Run the tour again ✦',
    'chat.opt.contact': 'Request access →',
    'chat.opt.another': 'Another one!',
    'chat.opt.back': '↩ Another question',
    'chat.opt.close': 'Close ✕',
    'chat.teasers': [
      'Still scrolling? Click me, let\'s chat ✦',
      'A question about Vesta? I\'m right here ✦',
      'Psst… I know jokes. Click and see.',
    ],

    // Visite guidée
    'tour.work': 'Let\'s say it plainly: your listings deserve better than still photos.',
    'tour.phase1': 'Phase one: upload one photo per room, raw, from your phone. Vesta reads the volumes and the light.',
    'tour.phase2': 'Phase two: the AI edits the film. Camera, transitions, grading, music.',
    'tour.phase3': 'Phase three: one click, and the film ships everywhere. Portals, social, storefront.',
    'tour.demo': 'And here comes my favorite trick: I taste your photos, and hand you back a film.',
    'tour.equipe': 'Your AI film crew. Click the cards to meet everyone.',
    'tour.toolkit': 'Throw me a tag, I\'ll catch it with my lasso! Just don\'t touch me with one, everything burns around here.',
    'tour.contact': 'Ready to bring your listings to life? Right this way. I\'ll let you explore ✦',
  };

  /* --- Application ---------------------------------------------------------------- */

  /* Renvoie la version localisée : l'anglais si actif et connu, sinon le
     français passé en second argument (la source inline des modules). */
  function t(key, fr) {
    if (lang === 'en' && key in JS_EN) return JS_EN[key];
    return fr;
  }

  function applyDom() {
    document.documentElement.lang = 'en';
    document.title = JS_EN['meta.title'];
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', JS_EN['meta.description']);

    DOM_EN.forEach(([selector, value, isHtml]) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (isHtml) el.innerHTML = value;
        else el.textContent = value;
      });
    });
  }

  function init() {
    if (lang === 'en') applyDom();

    // Les bascules (nav + overlay d'accueil) affichent la langue CIBLE et
    // rechargent la page (seul moyen d'avoir un état 100% cohérent :
    // physique, scramble, rotateur…)
    document.querySelectorAll('.lang-toggle').forEach((btn) => {
      btn.textContent = lang === 'fr' ? 'EN' : 'FR';
      btn.addEventListener('click', () => {
        try { localStorage.setItem('vesta-lang', lang === 'fr' ? 'en' : 'fr'); } catch (e) { /* tant pis */ }
        window.location.reload();
      });
    });
  }

  return { init, t, get lang() { return lang; } };
})();
