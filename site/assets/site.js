/* INDUSIAX — menu mobile + reveal au scroll + formulaires (essai / contact) */
(function () {
  var burger = document.getElementById('burger');
  var links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (ev) {
      if (links.classList.contains('open') && !links.contains(ev.target) && !burger.contains(ev.target)) {
        links.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Reveal au scroll — voir le bloc @media(scripting:enabled) de site.css.
     Sans IntersectionObserver, on affiche tout directement (.no-io). */
  if ('IntersectionObserver' in window) {
    var revSel = 'h2.sec,p.sec-sub,.card,.step,.price-card,.pv-origin,.pv-aud-i,.hp-card,' +
      '.blog-card,.schema-fig,.article-figure,.article-cta-inline,.faq-block details,' +
      '.table-wrap,.checklist li,.rappel-card,.rappel-txt,.pv-two,.pv-band .in,' +
      '.stat-strip .s,.tl-i,.article-sig,.article-related,.hub';
    var revEls = document.querySelectorAll(revSel);
    if (revEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revEls.forEach(function (el) { io.observe(el); });
    }
  } else {
    document.documentElement.classList.add('no-io');
  }

  /* Fondu d'apparition de la vidéo hero une fois prête à jouer. */
  var heroVideo = document.querySelector('.pv-hero .bg video');
  if (heroVideo) {
    heroVideo.style.transition = 'opacity 1s ease';
    heroVideo.style.opacity = '0';
    var revealVideo = function () { heroVideo.style.opacity = '1'; };
    heroVideo.addEventListener('canplay', revealVideo, { once: true });
    setTimeout(revealVideo, 2000);
  }

  /* Soumission des formulaires vers le service /api (même domaine).
     data-endpoint="/api/essai" ou "/api/contact" sur la balise <form>. */
  document.querySelectorAll('form[data-endpoint]').forEach(function (form) {
    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      var err = form.querySelector('.form-err');
      if (err) err.textContent = '';
      btn.disabled = true;
      btn.dataset.label = btn.dataset.label || btn.textContent;
      btn.textContent = 'Envoi en cours…';
      var payload = {};
      new FormData(form).forEach(function (v, k) { payload[k] = v; });
      try {
        var r = await fetch(form.dataset.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!r.ok) {
          var d = {};
          try { d = await r.json(); } catch (e) {}
          throw new Error(d.detail || 'Envoi impossible pour le moment — écrivez-nous à contact@indusiax.com');
        }
        var ok = document.getElementById(form.dataset.success || 'form-ok');
        if (ok) {
          var mail = ok.querySelector('.echo-email');
          if (mail && payload.email) mail.textContent = payload.email;
          form.style.display = 'none';
          ok.style.display = 'block';
          ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (e) {
        if (err) err.textContent = e.message;
        btn.disabled = false;
        btn.textContent = btn.dataset.label;
      }
    });
  });

  /* Pré-sélection du produit sur /essai/ via ?produit=stator */
  var sel = document.getElementById('sel-produit');
  if (sel) {
    var p = new URLSearchParams(location.search).get('produit');
    if (p && sel.querySelector('option[value="' + p + '"]')) sel.value = p;
  }
})();
