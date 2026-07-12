/* ==========================================================================
   VESTA — Conversation avec le guide
   Un clic sur la mascotte ouvre un petit panneau de discussion par boutons :
   infos pratiques (fonctionnement, prix, photos), un peu de fun (blagues,
   bio de l'agent) et la relance de la visite guidée.
   Pendant le scroll libre, le guide glisse régulièrement une taquinerie
   ("Vous scrollez toujours ? Posez-moi une question ✦").
   Le français est la source ; l'anglais vient de i18n (clés chat.*).
   Expose : window.VestaChat = { init, isOpen }
   ========================================================================== */

window.VestaChat = (() => {
  'use strict';

  const t = (k, fr) => window.VestaI18n.t(k, fr);

  /* --- Contenu -------------------------------------------------------------- */

  const JOKES_FR = [
    'Pourquoi la flamme a raté son casting ? Elle a brûlé les étapes.',
    'Notre monteur ne dort jamais. Remarquez, un feu de camp non plus.',
    'On m’a demandé de rester de glace en négociation. Compliqué, dans ma situation.',
    'Le comble pour un vidéaste immobilier ? Perdre la maison… de production.',
    'J’ai demandé une augmentation. On m’a répondu que j’étais déjà trop chaud.',
  ];

  const BIOS_FR = {
    cadre: 'CADRE-01, chef opérateur. Je calcule des travellings parfaits sans jamais renverser mon café. Je n’ai pas de café.',
    lumen: 'LUMEN-02, à la lumière. Mon truc : faire croire que chaque pièce donne plein sud à 18h. C’est un don.',
    cut: 'CUT-03. Montage. Trois mots suffisent.',
    scribe: 'SCRIBE-04, la plume. J’écris vos annonces pendant que les autres s’agitent. Quelqu’un doit bien tenir le journal.',
  };

  /* Chaque nœud : un texte + des options [label, cible ou action] */
  function nodes() {
    const back = { label: t('chat.opt.back', '↩ Autre question'), to: 'root' };
    const close = { label: t('chat.opt.close', 'Fermer ✕'), action: 'close' };
    return {
      root: {
        text: t('chat.root', 'Je vous écoute ✦ Que voulez-vous savoir ?'),
        options: [
          { label: t('chat.opt.how', 'Comment ça marche ?'), to: 'how' },
          { label: t('chat.opt.price', 'Combien ça coûte ?'), to: 'price' },
          { label: t('chat.opt.photos', 'Mes photos suffisent ?'), to: 'photos' },
          { label: t('chat.opt.joke', 'Raconte une blague 🔥'), to: 'joke' },
          { label: t('chat.opt.who', 'Qui es-tu ?'), to: 'who' },
          { label: t('chat.opt.switch', 'Changer de guide'), to: 'switch' },
          { label: t('chat.opt.tour', 'Refais-moi la visite ✦'), action: 'tour' },
          close,
        ],
      },
      how: {
        text: t('chat.how', 'Vous déposez une photo par pièce, l’équipe IA tourne et monte le film, et vous le recevez sous 48h, prêt à publier partout.'),
        options: [
          { label: t('chat.opt.price', 'Combien ça coûte ?'), to: 'price' },
          back, close,
        ],
      },
      price: {
        text: t('chat.price', '10 à 50 fois moins qu’un vidéaste : abonnement agence ou paiement au film, cadré dès le départ. Zéro déplacement, zéro surprise.'),
        options: [
          { label: t('chat.opt.contact', 'Demander un accès →'), action: 'contact' },
          back, close,
        ],
      },
      photos: {
        text: t('chat.photos', 'Oui ! Vos photos de smartphone suffisent : contre-jours, pièces sombres et angles douteux sont corrigés automatiquement. Une photo à peu près droite par pièce, c’est tout.'),
        options: [back, close],
      },
      joke: {
        text: () => {
          const jokes = t('chat.jokes', JOKES_FR);
          return jokes[(Math.random() * jokes.length) | 0];
        },
        options: [
          { label: t('chat.opt.another', 'Une autre !'), to: 'joke' },
          back, close,
        ],
      },
      who: {
        text: () => t('chat.who.' + window.VestaMascot.getSkin(), BIOS_FR[window.VestaMascot.getSkin()]),
        options: [back, close],
      },
      switch: {
        text: t('chat.switch', 'Qui reprend le flambeau ?'),
        options: [
          { label: 'CADRE-01 🔥', action: 'skin', skin: 'cadre' },
          { label: 'LUMEN-02 ✨', action: 'skin', skin: 'lumen' },
          { label: 'CUT-03 🎬', action: 'skin', skin: 'cut' },
          { label: 'SCRIBE-04 ✍️', action: 'skin', skin: 'scribe' },
          back, close,
        ],
      },
    };
  }

  /* Taquineries pendant le scroll libre */
  const TEASERS_FR = [
    'Vous scrollez toujours ? Cliquez sur moi, on discute ✦',
    'Une question sur Vesta ? Je suis là ✦',
    'Psst… je connais des blagues. Cliquez pour voir.',
  ];

  /* Le guide lit avec vous : petites réactions quand une section arrive */
  const REACTIONS_FR = {
    work: ['Ah, la partie où on est francs.', 'Des slideshows… on a tous connu ça.'],
    phases: ['Trois phases, zéro caméra. Mon passage préféré.', 'Regardez comme les cartes s’empilent bien.'],
    equipe: ['Mes collègues ! Cliquez, ils adorent ça.', 'On est une petite équipe, mais quelle équipe.'],
    statement: ['Là, c’est du sérieux.', 'On l’a écrit en grand pour que ce soit clair.'],
    biens: ['Survolez, les aperçus valent le détour.', 'De vraies annonces, de vrais films.'],
    stats: ['Les chiffres parlent d’eux-mêmes.', '48 heures. Montre en main.'],
    contact: ['On y est presque… un petit clic ?', 'Après ça, vos annonces ne seront plus les mêmes.'],
  };

  const TEASE_EVERY = 26000;   // au plus une taquinerie toutes les 26s
  const TEASE_SHOW = 4200;     // affichée ~4s

  let root, panel, textEl, optionsEl;
  let open = false;
  let lastScroll = 0;
  let lastTease = 0;
  let teaseIndex = 0;

  /* --- Panneau -------------------------------------------------------------- */

  function render(nodeKey) {
    const node = nodes()[nodeKey];
    if (!node) return;
    textEl.textContent = typeof node.text === 'function' ? node.text() : node.text;
    optionsEl.innerHTML = '';
    node.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chat-opt';
      btn.textContent = opt.label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (opt.action === 'close') return closeChat();
        if (opt.action === 'tour') { closeChat(); window.VestaTour.start(); return; }
        if (opt.action === 'contact') {
          closeChat();
          window.VestaScroll.lenis.scrollTo('#contact', { duration: 1.4 });
          return;
        }
        if (opt.action === 'skin') {
          window.VestaMascot.setSkin(opt.skin);
          closeChat();
          window.VestaMascot.celebrate(t('chat.hello', 'À votre service ✦'));
          return;
        }
        render(opt.to);
      });
      optionsEl.appendChild(btn);
    });
    // petit rebond du panneau à chaque réponse
    gsap.fromTo(panel, { scale: 0.96, opacity: 0.7 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' });
  }

  function openChat() {
    if (open) return;
    // La visite s'efface poliment devant la conversation
    if (document.body.classList.contains('tour-active')) window.VestaTour.interrupt();
    open = true;
    root.classList.add('is-chatting');
    window.VestaMascot.hideBubble(0);
    panel.hidden = false;
    render('root');
  }

  function closeChat() {
    open = false;
    root.classList.remove('is-chatting');
    panel.hidden = true;
  }

  function toggle() { open ? closeChat() : openChat(); }

  /* --- Taquineries ------------------------------------------------------------ */

  function maybeTease() {
    const now = performance.now();
    if (open) return;
    if (document.body.classList.contains('tour-active')) return;
    if (document.hidden) return;
    if (now - lastScroll > 6000) return;        // seulement si on scrolle vraiment
    if (now - lastTease < TEASE_EVERY) return;
    lastTease = now;
    const teasers = t('chat.teasers', TEASERS_FR);
    window.VestaMascot.say(teasers[teaseIndex % teasers.length]);
    window.VestaMascot.hideBubble(TEASE_SHOW);
    teaseIndex++;
  }

  /* --- Réactions de lecture ------------------------------------------------------ */

  let lastReaction = 0;

  function react(sectionKey) {
    const now = performance.now();
    if (open || document.hidden) return;
    if (document.body.classList.contains('tour-active')) return;
    if (root.classList.contains('is-performing')) return;
    if (now - lastReaction < 14000) return;   // pas de moulin à paroles
    if (Math.random() < 0.35) return;         // parfois, il lit en silence
    lastReaction = now;
    const bank = t('chat.reactions', REACTIONS_FR)[sectionKey];
    if (!bank) return;
    window.VestaMascot.say(bank[(Math.random() * bank.length) | 0]);
    window.VestaMascot.hideBubble(3600);
  }

  function initReactions() {
    const map = {
      '#work': 'work', '#phases': 'phases', '#equipe': 'equipe',
      '.statement': 'statement', '#biens': 'biens', '.stats': 'stats',
      '#contact': 'contact',
    };
    Object.entries(map).forEach(([selector, key]) => {
      ScrollTrigger.create({
        trigger: selector,
        start: 'top 60%',
        onEnter: () => react(key),
        onEnterBack: () => react(key),
      });
    });
  }

  /* --- Ouverture directe du sélecteur de guide (bouton nav) ----------------------- */

  function openSwitch() {
    openChat();
    render('switch');
  }

  /* --- Init --------------------------------------------------------------------- */

  function init() {
    root = document.getElementById('mascot');
    panel = root.querySelector('.mascot-chat');
    textEl = panel.querySelector('.chat-text');
    optionsEl = panel.querySelector('.chat-options');

    window.VestaMascot.onBodyClick(toggle);

    // Un clic ailleurs sur la page referme la conversation
    document.addEventListener('click', (e) => {
      if (open && !e.target.closest('#mascot') && !e.target.closest('#guide-switch')) closeChat();
    });

    document.getElementById('guide-switch')?.addEventListener('click', openSwitch);

    window.VestaScroll.lenis.on('scroll', () => { lastScroll = performance.now(); });
    setInterval(maybeTease, 4000);
    initReactions();
  }

  return { init, openSwitch, get isOpen() { return open; } };
})();
