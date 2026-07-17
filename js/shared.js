/* ==========================================================================
   VESTA — Socle partagé entre les pages (film / photo / home staging)
   - i18n commun (nav, footer) fusionné avec le dictionnaire de la page
   - Curseur personnalisé + boutons magnétiques
   - Ancres fluides (Lenis)
   - LES GUIDES : un personnage par service, qui commente la visite au scroll
   --------------------------------------------------------------------------
   Chaque page définit :  window.PAGE_I18N  (son dictionnaire fr/en)
   et éventuellement      window.PAGE_LANG_HOOK(lang)  (rappel après bascule)
   ========================================================================== */

const VestaShared = (() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ---------- i18n commun à toutes les pages ---------- */
  const COMMON_I18N = {
    fr: {
      "nav.film": "Film",
      "nav.photo": "Photo",
      "nav.staging": "Home staging",
      "nav.cta": "Réserver",
      "footer.tag": "Vos murs méritent un film",
      "footer.contactlabel": "Prendre rendez-vous",
      "footer.place": "Toulouse, France",
      "footer.cta": "Réserver un rendez-vous",
      "footer.made": "Filmé par l'IA. Réalisé par un humain.",
      "footer.services": "Les services",
      "offer.gift": "Premier film offert"
    },
    en: {
      "nav.film": "Film",
      "nav.photo": "Photo",
      "nav.staging": "Home staging",
      "nav.cta": "Book a call",
      "footer.tag": "Your walls deserve a film",
      "footer.contactlabel": "Book a call",
      "footer.place": "Toulouse, France",
      "footer.cta": "Book a call",
      "footer.made": "Shot by AI. Directed by a human.",
      "footer.services": "Services",
      "offer.gift": "First film on us"
    }
  };

  let currentLang = "fr";

  function dict(lang) {
    const page = (window.PAGE_I18N && window.PAGE_I18N[lang]) || {};
    return Object.assign({}, COMMON_I18N[lang], page);
  }

  function applyLang(lang) {
    currentLang = lang;
    const d = dict(lang);
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (d[key] !== undefined) el.textContent = d[key];
    });
    document.querySelectorAll(".lang__opt").forEach((o) =>
      o.classList.toggle("is-active", o.dataset.lang === lang)
    );
    if (typeof window.PAGE_LANG_HOOK === "function") window.PAGE_LANG_HOOK(lang);
    if (activeGuide) activeGuide.refreshLang();
  }

  function initLang() {
    const btn = document.getElementById("langSwitch");
    if (btn) btn.addEventListener("click", () => applyLang(currentLang === "fr" ? "en" : "fr"));
    applyLang("fr");
  }

  /* ---------- Curseur personnalisé + magnétisme ---------- */
  function initCursor() {
    if (isTouch || prefersReduced) return;
    document.body.classList.add("has-cursor");
    const cursor = document.getElementById("cursor");
    if (!cursor) return;
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let tx = cx, ty = cy;
    cursor.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
    window.addEventListener("mousemove", (e) => {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add("is-visible");
    });
    gsap.ticker.add(() => {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
    });
    document.querySelectorAll("a, button, [data-magnetic]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * 0.3, y: (e.clientY - (r.top + r.height / 2)) * 0.4, duration: 0.5, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" }));
    });
  }

  /* ---------- Ancres fluides ---------- */
  function initAnchors(lenis) {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
        else target.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* ---------- Lenis (smooth scroll) ---------- */
  function initLenis() {
    if (prefersReduced || typeof Lenis === "undefined") return null;
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    return lenis;
  }

  /* =========================================================================
     LES GUIDES — un personnage par service
     cfg = {
       id: "marcel", name: "Marcel", role: {fr,en}, accent: "#FF6B35",
       svg: "<svg …>",                      // l'avatar (visage vectoriel)
       steps: [{ sel: "#hero", text: {fr, en} }, …]  // répliques par section
     }
     ========================================================================= */
  let activeGuide = null;

  function initGuide(cfg) {
    // Construit le DOM du guide (aucun HTML requis dans la page)
    const root = document.createElement("div");
    root.className = "guide";
    root.id = "guide";
    root.style.setProperty("--guide-accent", cfg.accent);
    root.innerHTML =
      '<div class="guide__bubble" role="status">' +
        '<span class="guide__who"><strong class="guide__name">' + cfg.name + "</strong>" +
        ' <span class="guide__role"></span></span>' +
        '<p class="guide__text"></p>' +
      "</div>" +
      '<button class="guide__avatar" aria-label="' + cfg.name + '">' + cfg.svg + "</button>";
    document.body.appendChild(root);

    const bubble = root.querySelector(".guide__bubble");
    const textEl = root.querySelector(".guide__text");
    const roleEl = root.querySelector(".guide__role");
    let currentStep = 0;
    let collapsed = false;

    function setStep(i, instant) {
      currentStep = i;
      const msg = cfg.steps[i].text[currentLang] || cfg.steps[i].text.fr;
      if (instant || prefersReduced) { textEl.textContent = msg; return; }
      gsap.to(textEl, {
        opacity: 0, y: 6, duration: 0.18, ease: "power1.in",
        onComplete: () => {
          textEl.textContent = msg;
          gsap.to(textEl, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
        }
      });
    }

    function refreshLang() {
      roleEl.textContent = "· " + (cfg.role[currentLang] || cfg.role.fr);
      setStep(currentStep, true);
    }

    // Répliques liées aux sections
    cfg.steps.forEach((s, i) => {
      const el = document.querySelector(s.sel);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el, start: "top 55%", end: "bottom 55%",
        onEnter: () => setStep(i),
        onEnterBack: () => setStep(i)
      });
    });

    // Clic sur l'avatar : replie / déplie la bulle
    root.querySelector(".guide__avatar").addEventListener("click", () => {
      collapsed = !collapsed;
      root.classList.toggle("is-collapsed", collapsed);
    });

    // Entrée en scène
    refreshLang();
    setStep(0, true);
    if (!prefersReduced) {
      gsap.from(root, { y: 26, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.8 });
    }

    activeGuide = { refreshLang };
    return activeGuide;
  }

  /* ---------- Divers ---------- */
  function initYear() {
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  return { prefersReduced, isTouch, applyLang, initLang, initCursor, initAnchors, initLenis, initGuide, initYear,
           get lang() { return currentLang; } };
})();
