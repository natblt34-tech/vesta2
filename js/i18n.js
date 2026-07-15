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
    ['.nav-link[href="#formules"]', 'Plans'],
    ['.site-nav .btn-pill', 'Book a meeting →'],

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
    ['.hk-line:nth-child(1) .hk-word:first-child .hw-in', 'Your'],
    ['.hk-line:nth-child(1) .hk-word:last-child .hw-in', 'photos'],
    ['.hk-line:nth-child(2) .hw-in', 'become'],
    ['.hk-line:nth-child(3) .hw-in', 'a film.'],
    ['.hk-media-tag', 'THE FILM · 00:42'],
    ['.hk-endtag', '↓ Watch the demo'],
    ['.hero-tagline', 'AI shoots. A director signs. Delivered in 48h.'],
    ['.hero-cta .btn-solid', 'Book a meeting →'],
    ['.hero-trust', '✦ FIRST FILM ON US · NO COMMITMENT · REPLY WITHIN 24H'],

    // Manifeste
    ['#work > .mono-label', '( WHAT VESTA DOES )'],
    ['.manifesto-lead', 'Your listings deserve more<br>than ', true],
    ['.manifesto-sub', 'Vesta is a studio, not a factory. AI holds the cameras; a human director edits, grades and signs every film before it reaches you. Your listings come out with a real film. The kind that makes the seller say: wait, that\'s my place?'],
    ['.bucket-chip:nth-child(1)', '◆ UPLOAD & BRIEF'],
    ['.bucket-chip:nth-child(2)', '◆ AI CINEMATOGRAPHY'],
    ['.bucket-chip:nth-child(3)', '◆ SIGNED EDIT'],

    // Phase 1 — dépôt & brief
    ['.phase-card:nth-child(1) .mono-label.gold', '( PHOTOS · BRIEF · VISIT ORDER )'],
    ['.phase-card:nth-child(1) .phase-title', 'Upload & layout brief'],
    ['.phase-card:nth-child(1) .phase-text', 'One photo per room, taken on a smartphone. Then you describe the layout: which rooms connect, in what order the visit flows. That brief is what lets the camera walk the property like a visitor, not like a slideshow.'],
    ['.phase-card:nth-child(1) .arrow-list li:nth-child(1)', '→ One photo per room, no gear'],
    ['.phase-card:nth-child(1) .arrow-list li:nth-child(2)', '→ Your brief: which rooms connect'],
    ['.phase-card:nth-child(1) .arrow-list li:nth-child(3)', '→ The visit order you want buyers to feel'],
    ['.phase-card:nth-child(1) .badge-live', '5 MINUTES, TOPS'],
    ['.phase-card:nth-child(1) .mock-title', 'upload · photos + brief'],
    ['.phase-card:nth-child(1) .mock-file:nth-child(1)', 'living.jpg <b>✓</b>', true],
    ['.phase-card:nth-child(1) .mock-file:nth-child(2)', 'kitchen.jpg <b>✓</b>', true],
    ['.phase-card:nth-child(1) .mock-file:nth-child(3)', 'bedroom.jpg <b>✓</b>', true],
    ['.phase-card:nth-child(1) .mock-file:nth-child(4)', 'layout brief <b>✓</b>', true],

    // Phase 2 — tournage IA + réalisation humaine
    ['.phase-card:nth-child(2) .mono-label.gold', '( AI CAMERAS · HUMAN DIRECTOR )'],
    ['.phase-card:nth-child(2) .phase-title', 'AI cinematography, human direction'],
    ['.phase-card:nth-child(2) .phase-text', 'The AI shoots dolly moves as if on rails, strictly faithful to your photos: nothing invented, nothing distorted. Then a human editor with a film background assembles, sets the pacing and the music, grades the color. And he reshoots any take that doesn\'t convince him, before you ever see it.'],
    ['.phase-card:nth-child(2) .arrow-list li:nth-child(1)', '→ Photorealistic camera moves, faithful to the property'],
    ['.phase-card:nth-child(2) .arrow-list li:nth-child(2)', '→ Editing, music and grading by hand'],
    ['.phase-card:nth-child(2) .arrow-list li:nth-child(3)', '→ Every shot approved or redone by the director'],
    ['.phase-card:nth-child(2) .badge-live', 'DELIVERED WITHIN 48H'],
    ['.phase-card:nth-child(2) .mock-title', 'studio · property_film.mp4'],
    ['.phase-card:nth-child(2) .mock-log:nth-of-type(1)', 'shooting the takes <b>✓</b>', true],
    ['.phase-card:nth-child(2) .mock-log:nth-of-type(2)', 'edit & music <b>✓</b>', true],
    ['.phase-card:nth-child(2) .mock-log:nth-of-type(3)', 'approved by the director <b>✓</b>', true],

    // Phase 3 — livré prêt à publier
    ['.phase-card:nth-child(3) .mono-label.gold', '( PORTALS · SOCIAL · STOREFRONT )'],
    ['.phase-card:nth-child(3) .phase-title', 'Delivered ready to publish'],
    ['.phase-card:nth-child(3) .phase-text', 'The film arrives finished, ready to go live: 16:9 for the portals, 9:16 for social, royalty-free music included. Nothing to set up, nothing to export. Your listing stands out the same day.'],
    ['.phase-card:nth-child(3) .arrow-list li:nth-child(1)', '→ 16:9 portals, 9:16 social'],
    ['.phase-card:nth-child(3) .arrow-list li:nth-child(2)', '→ Royalty-free music included'],
    ['.phase-card:nth-child(3) .arrow-list li:nth-child(3)', '→ Share links ready to send'],
    ['.phase-card:nth-child(3) .badge-live', 'READY TO PUBLISH'],

    // Les traversées — la signature
    ['#traversees > .mono-label', '( THE VESTA SIGNATURE )'],
    ['.traversees-title', 'Walkthroughs.'],
    ['.traversees-lead', 'The camera pushes the living-room door, follows the hallway, and steps into the kitchen still lit by the evening.'],
    ['.traversees-text', 'A slideshow shows rooms. A walkthrough gives a visit. Guided by your layout brief, the camera moves from room to room through the property\'s real passages: doors, hallways, enfilades. Buyers stop looking at photos, they project themselves. They already live there.'],
    ['.traversees-note', 'INCLUDED FROM THE FLAME PLAN'],
    ['.phase-card:nth-child(3) .mock-title', 'delivery · your film'],
    ['.phase-card:nth-child(3) .mock-log', '16:9 + 9:16 · music included · signed by the director'],

    // Démo
    ['.demo-head .mono-label', '( THE DEMO · SCROLL )'],
    ['.demo-title', 'Simple photos.<br>A real film.', true],
    ['.polaroid[data-room="salon"] figcaption', 'Living room'],
    ['.polaroid[data-room="cuisine"] figcaption', 'Kitchen'],
    ['.polaroid[data-room="chambre"] figcaption', 'Bedroom'],
    ['.polaroid[data-room="entree"] figcaption', 'Entrance'],
    ['.demo-player-label', 'VESTA · THE FILM · 00:42'],
    ['.demo-player figcaption', 'a film signed by vesta · ai cameras, human direction'],

    // Équipe
    ['.workforce-head .mono-label', '( THE STUDIO CREW )'],
    ['.workforce-title', 'AI ON THE CAMERAS.<br>A HUMAN IN THE DIRECTOR\'S CHAIR.', true],
    ['.workforce-sub', 'Four AIs run the set, tireless. And one director, with a film background, is in charge: he approves or reshoots every take, and signs every film before delivery. Click to meet the crew.'],
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
    ['[data-worker="cut"] .staff-rows div:nth-child(1) dd', 'Assistant editor'],
    ['[data-worker="cut"] .staff-rows div:nth-child(3) dd', 'a cent per cut'],
    ['[data-worker="cut"] .staff-tag', 'Preps the cuts. The director decides.'],
    ['[data-worker="real"] .staff-name', 'THE DIRECTOR'],
    ['[data-worker="real"] .staff-type', 'HUMAN · FILM BACKGROUND'],
    ['[data-worker="real"] .staff-rows div:nth-child(1) dt', 'ROLE'],
    ['[data-worker="real"] .staff-rows div:nth-child(1) dd', 'Final direction'],
    ['[data-worker="real"] .staff-rows div:nth-child(2) dt', 'EYES ON'],
    ['[data-worker="real"] .staff-rows div:nth-child(2) dd', 'every take, every film'],
    ['[data-worker="real"] .staff-rows div:nth-child(3) dt', 'SIGNATURE'],
    ['[data-worker="real"] .staff-rows div:nth-child(3) dd', 'on every delivery'],
    ['[data-worker="real"] .staff-tag', 'Nothing ships without his signature.'],
    ['[data-worker="scribe"] .staff-rows div:nth-child(1) dd', 'Listing copy'],
    ['[data-worker="scribe"] .staff-rows div:nth-child(3) dd', 'a cent per line'],
    ['[data-worker="scribe"] .staff-tag', 'Writes the listing while the film exports.'],
    ['.deck-hint', 'CLICK · MEET THE WHOLE CREW'],

    // Statement
    ['.statement .mono-label', '( OUR PROMISE )'],
    ['.st-line:nth-child(1) .st-line-inner', 'WE PUT'],
    ['.st-line:nth-child(2) .st-line-inner', 'YOUR LISTINGS ON SCREEN.'],
    ['.statement-sub', 'Rendering, warmth and movement are not add-ons. They are the standard of every film Vesta signs.'],

    // Démonstrations
    ['.works-title', 'Demonstrations'],
    ['.works-head .mono-label', 'HOVER · DEMO FILMS BY PROPERTY TYPE'],
    ['.work-row:nth-child(1) .work-name', 'Classic apartment'],
    ['.work-row:nth-child(2) .work-name', 'Modern villa'],
    ['.work-row:nth-child(3) .work-name', 'Industrial loft'],
    ['.work-row:nth-child(4) .work-name', 'Renovated farmhouse'],
    ['.work-row:nth-child(1) .work-meta', 'DEMONSTRATION · 00:47'],
    ['.work-row:nth-child(2) .work-meta', 'DEMONSTRATION · 01:12'],
    ['.work-row:nth-child(3) .work-meta', 'DEMONSTRATION · 00:52'],
    ['.work-row:nth-child(4) .work-meta', 'DEMONSTRATION · 00:58'],

    // Stats (honnêtes : rien d'inventé)
    ['.stat:nth-child(1) .stat-label', 'DELIVERY, MAXIMUM'],
    ['.stat:nth-child(2) .stat-label', 'OF FILMS APPROVED BY A HUMAN EYE'],
    ['.stat:nth-child(3) .stat-label', 'FOR YOUR FIRST FILM'],
    ['.stat:nth-child(4) .stat-label', 'ROOMS FILMED PER PROPERTY, ON AVERAGE'],

    // Formules (aucun prix : il se découvre en rendez-vous)
    ['.plans-head .mono-label', '( THE PLANS )'],
    ['.plans-title', 'A plan for<br>every ambition.', true],
    ['.plans-sub', 'Three tiers, built around your listing volume. Quote on request, quick reply. And whichever plan you pick, your first film is free.'],
    ['.plan-card:nth-child(1) .plan-tier', 'PLAN 01'],
    ['.plan-card:nth-child(1) .plan-name', 'Spark'],
    ['.plan-card:nth-child(1) .plan-for', 'For the agent with a few listings'],
    ['.plan-card:nth-child(1) .arrow-list li:nth-child(1)', '→ 2 films per month'],
    ['.plan-card:nth-child(1) .arrow-list li:nth-child(2)', '→ 16:9 format for the portals'],
    ['.plan-card:nth-child(1) .arrow-list li:nth-child(3)', '→ Delivered in 48h'],
    ['.plan-flag', 'MOST POPULAR ✦'],
    ['.plan-card:nth-child(2) .plan-tier', 'PLAN 02'],
    ['.plan-card:nth-child(2) .plan-name', 'Flame'],
    ['.plan-card:nth-child(2) .plan-for', 'For the active agency'],
    ['.plan-card:nth-child(2) .arrow-list li:nth-child(1)', '→ 5 films per month'],
    ['.plan-card:nth-child(2) .arrow-list li:nth-child(2)', '→ 9:16 for social included'],
    ['.plan-card:nth-child(2) .arrow-list li:nth-child(3)', '→ Virtual staging (10 photos/month)*'],
    ['.plan-card:nth-child(2) .arrow-list li:nth-child(4)', '→ Signature room-to-room walkthroughs'],
    ['.plan-card:nth-child(3) .plan-tier', 'PLAN 03'],
    ['.plan-card:nth-child(3) .plan-name', 'Blaze'],
    ['.plan-card:nth-child(3) .plan-for', 'For the agency that delegates everything'],
    ['.plan-card:nth-child(3) .arrow-list li:nth-child(1)', '→ 10 films per month'],
    ['.plan-card:nth-child(3) .arrow-list li:nth-child(2)', '→ Unlimited virtual staging*'],
    ['.plan-card:nth-child(3) .arrow-list li:nth-child(3)', '→ Ready-to-post visuals and captions'],
    ['.plan-card:nth-child(3) .arrow-list li:nth-child(4)', '→ 24h priority'],
    ['.plan-card .badge-live', 'FIRST FILM FREE'],
    ['.plans-cta .btn-solid', 'Book a meeting →'],
    ['.plans-cta > .mono-label:not(.plans-legal)', 'QUOTE ON REQUEST · 30 MINUTES · NO COMMITMENT'],
    ['.plans-legal', '* VIRTUAL STAGING: VIRTUALLY FURNISHED VISUALS, NON-CONTRACTUAL'],

    // Toolkit
    ['.toolkit-title', 'The toolbox'],
    ['#toolkit > .mono-label', 'DRAG & THROW · EVERY TOOL RUNS IN PRODUCTION'],
    ['.toolkit-arena .tool-tag:nth-child(1)', 'Room-to-room walkthroughs'],
    ['.toolkit-arena .tool-tag:nth-child(2)', 'Virtual staging*'],
    ['.toolkit-arena .tool-tag:nth-child(3)', '9:16 formats'],
    ['.toolkit-arena .tool-tag:nth-child(4)', 'Cinema color grading'],
    ['.toolkit-arena .tool-tag:nth-child(5)', 'Royalty-free music'],
    ['.toolkit-arena .tool-tag:nth-child(6)', 'Fidelity guaranteed'],
    ['.toolkit-arena .tool-tag:nth-child(7)', 'Pro stabilization'],
    ['.toolkit-arena .tool-tag:nth-child(8)', 'Layout brief'],
    ['.toolkit-arena .tool-tag:nth-child(9)', 'Virtual twilight (soon)'],
    ['.toolkit-arena .tool-tag:nth-child(10)', 'Drone shots (soon)'],
    ['.toolkit-legal', '* VIRTUALLY FURNISHED VISUALS, NON-CONTRACTUAL'],

    // FAQ
    ['.faq-head .mono-label', '( FREQUENTLY ASKED )'],
    ['.faq-title', 'What people<br>often ask us.', true],
    ['.faq-item:nth-child(1) .faq-q-text', 'Do I need any gear, a drone or a photographer?'],
    ['.faq-item:nth-child(1) .faq-a p', 'No. One photo per room, taken on a smartphone, is enough. No on-site shoot, no appointment to schedule, no gear to rent. You upload, you describe the layout, we handle the rest.'],
    ['.faq-item:nth-child(2) .faq-q-text', 'Does the AI invent rooms or distort the property?'],
    ['.faq-item:nth-child(2) .faq-a p', 'Never. The camera stays strictly faithful to your photos: nothing invented, nothing distorted. It sets in motion what already exists. That\'s our fidelity promise — and a human director checks it shot by shot.'],
    ['.faq-item:nth-child(3) .faq-q-text', 'What if the film doesn\'t work for me?'],
    ['.faq-item:nth-child(3) .faq-a p', 'It never reaches you blind. The director reshoots any take that doesn\'t convince him before you even see it. And on delivery, one round of revisions is included: you approve, we adjust.'],
    ['.faq-item:nth-child(4) .faq-q-text', 'How long until I get my film?'],
    ['.faq-item:nth-child(4) .faq-a p', '48 hours max after we receive your photos and brief. The Blaze plan gets 24h priority. Your listing can stand out as soon as the next day.'],
    ['.faq-item:nth-child(5) .faq-q-text', 'Is the first film really free?'],
    ['.faq-item:nth-child(5) .faq-a p', 'Yes, no credit card and no commitment. You judge on a real property of your own. If the result convinces you, we talk plans. If not, you walk away with the film.'],
    ['.faq-item:nth-child(6) .faq-q-text', 'Which formats and rights do I get?'],
    ['.faq-item:nth-child(6) .faq-a p', '16:9 for the portals and 9:16 for social, with royalty-free music included. Ready to publish, nothing to export or set up.'],
    ['.faq-foot', 'ANOTHER QUESTION? <a class="mono-link" href="mailto:contact@vesta.app">CONTACT@VESTA.APP</a>', true],

    // Contact & footer
    ['#contact .mono-label', '( YOUR NEXT LISTING )'],
    ['.contact-title', 'Bring your<br>listings to life.', true],
    ['.contact-actions .btn-solid', 'Book a meeting →'],
    ['.contact-actions .mono-label', 'YOUR FIRST FILM IS FREE'],
    ['.footer-tag', 'The spirit of the hearth that puts your listings on screen.'],
    ['.footer-col:nth-child(1) .mono-label', 'EXPLORE'],
    ['.footer-col:nth-child(1) a:nth-of-type(1)', 'The demo'],
    ['.footer-col:nth-child(1) a:nth-of-type(2)', 'The crew'],
    ['.footer-col:nth-child(1) a:nth-of-type(3)', 'The plans'],
    ['.footer-col:nth-child(1) a:nth-of-type(4)', 'The toolbox'],
    ['.footer-col:nth-child(1) a:nth-of-type(5)', 'FAQ'],
    ['.footer-col:nth-child(2) .mono-label', 'CONTACT'],
    ['.footer-col:nth-child(2) a:nth-of-type(2)', 'Book a meeting'],
    ['.footer-meta .mono-label', '© 2026 VESTA · AI FOR REAL ESTATE'],
    ['.footer .mono-link', 'BACK TO TOP ↑'],

    // Popup de pause de la visite
    ['.tour-pause-text', 'Taking the wheel?'],
    ['#pause-resume', 'Continue the tour →'],
    ['#pause-manual', 'I\'ll browse on my own'],

    // Bouton nav "changer de guide"
    ['.guide-switch-label', 'GUIDE'],
  ];

  /* --- Chaînes utilisées par les modules JS ------------------------------------ */

  const JS_EN = {
    'meta.title': 'Vesta · Your photos become a film',
    'meta.description': 'Vesta turns your property photos into a high-end film: AI cameras, human direction, delivered in 48h, ready to publish.',

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
    'mascot.grabs': ['Wheee ✦', 'Ooh, lift-off!', 'Take me along ✦', 'Hehe!'],
    'mascot.drops': ['Nice landing ✦', 'Another ride?', 'Thanks for the trip!', 'Poof.'],
    'works.preview': ' · demo film',

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
    'chat.how': 'You upload one photo per room plus your layout brief. The AI shoots the takes, faithful to the property, then a human director edits, grades and signs. Delivered within 48 hours, ready to publish.',
    'chat.price': 'Three plans built around your listing volume: Spark, Flame and Blaze. Expect 10 to 50 times less than a videographer, quote on request, quick reply. And your first film is free.',
    'chat.opt.plans': 'See the plans',
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
    'chat.who.cut': 'CUT-03. Assistant editor. I prep the cuts, the director decides.',
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
    'chat.switch': 'Who takes the torch?',
    'chat.opt.switch': 'Change guide',
    'chat.hello': 'At your service ✦',
    'mascot.back': 'I\'m back ✦',
    'chat.voice': {
      cadre: ['Nice framing, this section ✦', 'Keeping you in the shot.', 'A good shot is composed.', 'Look at it at eye level. Better, right?'],
      lumen: ['Lovely light in here ✦', 'I warm the mood, don\'t I?', 'Everything looks better well lit.', 'A touch of golden glow, and there.'],
      cut: ['Moving on. Good.', 'Cut. Next section.', 'Concise. I like it.', 'No filler. Just the essentials.'],
      scribe: ['Let me note that down ✦', 'Nicely shot, this part.', 'That deserves a good caption.', 'Saving this for the listing.'],
    },

    // Visite guidée
    'tour.work': 'Let\'s say it plainly: Vesta is a studio. AI shoots, a human directs.',
    'tour.phase1': 'Phase one: one photo per room, plus your layout brief. Five minutes, tops.',
    'tour.phase2': 'Phase two: the AI shoots the takes, faithful to the property. And a human director edits, grades and signs.',
    'tour.phase3': 'Phase three: delivered ready to publish. Portals in 16:9, social in 9:16, music included.',
    'tour.demo': 'And here comes my favorite trick: I taste your photos, and hand you back a film.',
    'tour.traversees': 'Our signature: walkthroughs. The camera moves room to room through the property\'s real passages.',
    'tour.equipe': 'The crew: four AIs on the cameras… and a human director who signs every film. Click the cards.',
    'tour.formules': 'Three plans, built around your listing volume. First film free, quote on request ✦',
    'tour.toolkit': 'Throw me a tag, I\'ll catch it with my lasso! Just don\'t touch me with one, everything burns around here.',
    'tour.faq': 'One last doubt? The answers are right here — gear, fidelity, deadlines, the free first film.',
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
