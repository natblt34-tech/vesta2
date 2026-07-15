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
    cut: 'CUT-03. Assistant monteur. Je prépare les coupes, le réalisateur tranche.',
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
        text: t('chat.how', 'Vous déposez une photo par pièce et votre brief d’agencement. L’IA tourne les plans, fidèles au bien, puis un réalisateur humain monte, étalonne et signe. Livré sous 48 h, prêt à publier.'),
        options: [
          { label: t('chat.opt.price', 'Combien ça coûte ?'), to: 'price' },
          back, close,
        ],
      },
      price: {
        text: t('chat.price', 'Trois formules selon votre volume de mandats : Étincelle, Flamme et Brasier. Comptez 10 à 50 fois moins qu’un vidéaste, devis sur demande, réponse rapide. Et votre premier film est offert.'),
        options: [
          { label: t('chat.opt.contact', 'Réserver un rendez-vous →'), action: 'contact' },
          { label: t('chat.opt.plans', 'Voir les formules'), action: 'plans' },
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

  /* La VOIX de chaque agent : de loin en loin, le guide lâche une réplique
     dans son ton propre — c'est ce qui rend le choix de l'avatar sensible. */
  const VOICE_FR = {
    cadre: [
      'Joli cadre, cette section ✦',
      'Je vous garde dans le champ.',
      'Un bon plan, ça se compose.',
      'Regardez ça à hauteur d’œil. Mieux, non ?',
    ],
    lumen: [
      'Quelle belle lumière ici ✦',
      'Je réchauffe l’ambiance, hein ?',
      'Tout est plus beau bien éclairé.',
      'Un peu de douceur dorée, et hop.',
    ],
    cut: [
      'On avance. Bien.',
      'Coupez. Section suivante.',
      'Concis. J’aime.',
      'Pas de gras. Juste l’essentiel.',
    ],
    scribe: [
      'Laissez-moi noter ça ✦',
      'Joliment tourné, cette partie.',
      'Ça mériterait une belle légende.',
      'Je garde ça pour l’annonce.',
    ],
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
        if (opt.action === 'plans') {
          closeChat();
          window.VestaScroll.lenis.scrollTo('#formules', { duration: 1.4 });
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

  /* Il commente RAREMENT, et surtout : dans la VOIX de l'agent choisi
     (le ton change nettement selon le guide — c'est là qu'on sent le choix). */
  function react() {
    const now = performance.now();
    if (open || document.hidden) return;
    if (document.body.classList.contains('tour-active')) return;
    if (root.classList.contains('is-performing')) return;
    if (window.VestaMascot.isDismissed && window.VestaMascot.isDismissed()) return;
    if (now - lastReaction < 45000) return;   // discret : il commente rarement
    if (Math.random() < 0.7) return;          // et le plus souvent, il se tait
    lastReaction = now;
    const voice = t('chat.voice', VOICE_FR)[window.VestaMascot.getSkin()] || [];
    if (!voice.length) return;
    window.VestaMascot.say(voice[(Math.random() * voice.length) | 0]);
    window.VestaMascot.hideBubble(3600);
  }

  function initReactions() {
    ['#work', '#phases', '#traversees', '#equipe', '.statement',
     '#biens', '.stats', '#formules', '#contact'].forEach((selector) => {
      ScrollTrigger.create({
        trigger: selector,
        start: 'top 60%',
        onEnter: react,
        onEnterBack: react,
      });
    });
  }

  /* --- Changement de guide express (bouton nav) ------------------------------------ */

  const SKIN_ORDER = ['cadre', 'lumen', 'cut', 'scribe'];

  /* Un clic sur le bouton nav :
     - guide masqué → on le rappelle ;
     - sinon → guide suivant (rotation circulaire). */
  function cycleSkin() {
    if (window.VestaMascot.isDismissed && window.VestaMascot.isDismissed()) {
      window.VestaMascot.summon();
      gsap.fromTo('#guide-switch', { scale: 0.85 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
      return;
    }
    const current = window.VestaMascot.getSkin();
    const next = SKIN_ORDER[(SKIN_ORDER.indexOf(current) + 1) % SKIN_ORDER.length];
    window.VestaMascot.setSkin(next);
    try { localStorage.setItem('vesta-skin', next); } catch (e) { /* nav. privée */ }
    window.VestaMascot.say(window.VestaMascot.skinData().name + ' ✦');
    window.VestaMascot.hideBubble(1200);
    gsap.fromTo('#guide-switch', { scale: 0.85 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
  }

  /* Le sélecteur complet reste accessible depuis la conversation */
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

    document.getElementById('guide-switch')?.addEventListener('click', cycleSkin);

    window.VestaScroll.lenis.on('scroll', () => { lastScroll = performance.now(); });
    // Plus de taquineries spontanées (le guide reste discret) ; il ne parle
    // que si on le sollicite ou, rarement, pour commenter une section.
    initReactions();
  }

  return { init, openSwitch, get isOpen() { return open; } };
})();
