/* INDUSIAX — menu mobile + reveal au scroll + formulaires (essai / contact) */
(function () {
  try {
    console.log('%c Indusiax ', 'background:#E84C2B;color:#fff;font-weight:800;padding:3px 8px;border-radius:3px;',
      '— By Industry, For Industry. Cet outil aussi, on l\'a fabriqué nous-mêmes.');
  } catch (e) {}

  /* Header à deux états (transparent → posé) + masqué au scroll vers le bas en mobile. */
  var siteHeader = document.querySelector('header.site');
  if (siteHeader) {
    var lastY = window.scrollY;
    var isMobile = window.matchMedia('(max-width: 820px)').matches;
    var onHeaderScroll = function () {
      var y = window.scrollY;
      siteHeader.classList.toggle('scrolled', y > 24);
      if (isMobile && !document.querySelector('.nav-links.open')) {
        if (y > lastY && y > 140) siteHeader.classList.add('hide');
        else siteHeader.classList.remove('hide');
      } else {
        siteHeader.classList.remove('hide');
      }
      lastY = y;
    };
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    onHeaderScroll();
  }

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

  /* Effet ripple au clic des boutons (.btn). */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.addEventListener('mousedown', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('.btn') : null;
      if (!btn) return;
      var r = btn.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 1.4;
      var span = document.createElement('span');
      span.className = 'btn-ripple';
      span.style.width = span.style.height = size + 'px';
      span.style.left = (ev.clientX - r.left - size / 2) + 'px';
      span.style.top = (ev.clientY - r.top - size / 2) + 'px';
      btn.appendChild(span);
      span.addEventListener('animationend', function () { span.remove(); });
    });
  }

  /* Compteur animé (easeOutCubic) — cible un span.cnum avec data-count. */
  function animateCount(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    var target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    var dur = 900;
    var t0 = null;
    function frame(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = prefix + target + suffix;
    }
    requestAnimationFrame(frame);
  }

  /* Compteurs d'engagement de la maquette Flux (chargement, pas de scroll). */
  var fluxEng = document.querySelectorAll('.post .eng .cnum');
  if (fluxEng.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(function () { fluxEng.forEach(animateCount); }, 2250);
  }

  /* Jauge circulaire (conic-gradient) et barre de score — cible .gauge[data-pct] et .mk-bar[data-pct]. */
  function animateGauge(el) {
    if (el.dataset.animated) return;
    el.dataset.animated = '1';
    var target = parseFloat(el.dataset.pct);
    if (isNaN(target)) return;
    var span = el.querySelector('span');
    var dur = 1100;
    var t0 = null;
    function frame(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.style.background = 'conic-gradient(var(--ok) ' + val + '%, var(--pline) 0)';
      if (span) span.textContent = Math.round(val) + '%';
      if (p < 1) requestAnimationFrame(frame);
      else {
        el.style.background = 'conic-gradient(var(--ok) ' + target + '%, var(--pline) 0)';
        if (span) span.textContent = target + '%';
      }
    }
    requestAnimationFrame(frame);
  }
  function animateMkBar(el) {
    if (el.dataset.animated) return;
    el.dataset.animated = '1';
    var target = parseFloat(el.dataset.pct);
    if (isNaN(target)) return;
    var bar = el.querySelector('i');
    var scEl = el.parentElement ? el.parentElement.querySelector('.sc') : null;
    if (bar) {
      bar.style.width = '0%';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          bar.style.transition = 'width 1s cubic-bezier(.22,1,.36,1)';
          bar.style.width = target + '%';
        });
      });
    }
    if (scEl) {
      var dur = 1000, t0 = null;
      function frame(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        scEl.textContent = Math.round(target * eased) + '%';
        if (p < 1) requestAnimationFrame(frame);
        else scEl.textContent = target + '%';
      }
      requestAnimationFrame(frame);
    }
  }
  var gaugeEls = document.querySelectorAll('.gauge[data-pct]');
  var barEls = document.querySelectorAll('.mk-bar[data-pct]');
  if ((gaugeEls.length || barEls.length) && 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var gaugeIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (entry.target.classList.contains('gauge')) animateGauge(entry.target);
        else animateMkBar(entry.target);
        gaugeIO.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    gaugeEls.forEach(function (el) { gaugeIO.observe(el); });
    barEls.forEach(function (el) { gaugeIO.observe(el); });
  }

  /* Reveal au scroll — voir le bloc @media(scripting:enabled) de site.css.
     Sans IntersectionObserver, on affiche tout directement (.no-io). */
  if ('IntersectionObserver' in window) {
    var revSel = 'h2.sec,p.sec-sub,.card,.step,.pv-step,.price-card,.pv-origin,.pv-aud-i,.hp-card,' +
      '.blog-card,.schema-fig,.article-figure,.article-cta-inline,.faq-block details,' +
      '.table-wrap,.checklist li,.rappel-card,.rappel-txt,.pv-two,.pv-band .in,' +
      '.stat-strip .s,.tl-i,.article-sig,.article-related,.hub,.sectors-marquee,table.mk';
    var revEls = document.querySelectorAll(revSel);
    if (revEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
            entry.target.querySelectorAll('.cnum').forEach(animateCount);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revEls.forEach(function (el) { io.observe(el); });
    }
  } else {
    document.documentElement.classList.add('no-io');
    document.querySelectorAll('.cnum').forEach(function (el) {
      el.textContent = (el.dataset.prefix || '') + el.dataset.count + (el.dataset.suffix || '');
    });
  }

  /* Fondu d'apparition des images en lazy-load une fois chargées. */
  document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
    if (img.complete && img.naturalWidth) { img.classList.add('loaded'); return; }
    img.addEventListener('load', function () { img.classList.add('loaded'); });
    img.addEventListener('error', function () { img.classList.add('loaded'); });
  });

  /* Filtres du blog par produit (chips au-dessus de la grille). */
  var blogFilters = document.querySelectorAll('.bf-chip');
  if (blogFilters.length) {
    var blogCards = document.querySelectorAll('.blog-card');
    blogFilters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        blogFilters.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        var f = btn.dataset.filter;
        blogCards.forEach(function (card) {
          var tagEl = card.querySelector('.bc-tag');
          var show = f === 'all' || (tagEl && tagEl.classList.contains(f));
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* Calculateur d'économies (page /tarifs/). */
  var calcCrm = document.getElementById('c-crm');
  if (calcCrm) {
    var calcIds = ['c-crm', 'c-terrain', 'c-cr', 'c-li', 'c-users'];
    var calcEl = {};
    calcIds.forEach(function (id) { calcEl[id] = document.getElementById(id); });
    var cTotalNow = document.getElementById('c-total-now');
    var cTotalSuite = document.getElementById('c-total-suite');
    var cDiffAmt = document.getElementById('c-diff-amt');
    var cDiffLabel = document.getElementById('c-diff-label');
    var cDiffBox = document.getElementById('c-diff');
    var SUITE_PRICE = 99;
    function fmtEur(n) { return Math.round(n).toLocaleString('fr-FR') + ' €'; }
    function recalcSavings() {
      var users = Math.max(1, parseInt(calcEl['c-users'].value, 10) || 1);
      var perUser = ['c-crm', 'c-terrain', 'c-cr', 'c-li'].reduce(function (sum, id) {
        return sum + Math.max(0, parseFloat(calcEl[id].value) || 0);
      }, 0);
      var now = perUser * users;
      var suite = SUITE_PRICE * users;
      cTotalNow.innerHTML = fmtEur(now) + '<small>/mois</small>';
      cTotalSuite.innerHTML = fmtEur(suite) + '<small>/mois</small>';
      var diff = now - suite;
      if (diff > 0) {
        cDiffAmt.textContent = fmtEur(diff);
        cDiffLabel.textContent = "d'économie par mois avec la suite (" + fmtEur(diff * 12) + " par an)";
        cDiffBox.classList.remove('calc-neg');
      } else {
        cDiffAmt.textContent = fmtEur(Math.abs(diff));
        cDiffLabel.textContent = diff === 0
          ? "à l'équilibre — et tout est relié, sans ressaisie"
          : "de plus qu'aujourd'hui — mais tout est relié, sans ressaisie";
        cDiffBox.classList.add('calc-neg');
      }
    }
    calcIds.forEach(function (id) { calcEl[id].addEventListener('input', recalcSavings); });
    var cMinus = document.getElementById('c-users-minus');
    var cPlus = document.getElementById('c-users-plus');
    if (cMinus) cMinus.addEventListener('click', function () {
      calcEl['c-users'].value = Math.max(1, (parseInt(calcEl['c-users'].value, 10) || 1) - 1);
      recalcSavings();
    });
    if (cPlus) cPlus.addEventListener('click', function () {
      calcEl['c-users'].value = Math.min(50, (parseInt(calcEl['c-users'].value, 10) || 1) + 1);
      recalcSavings();
    });
    recalcSavings();
  }

  /* Quiz "par où commencer" (page /essai/). */
  var quizBox = document.getElementById('quiz-box');
  if (quizBox) {
    var QUIZ_INFO = {
      stator: { title: 'Commencez par Stator-CRM', txt: "Le CRM industriel, pour ne plus jamais perdre le fil d'un client ou d'un devis.", icon: '📇' },
      rotor: { title: 'Commencez par Rotor-FSM', txt: 'La démo en libre accès pour vos interventions et contrôles terrain — testez en 3 minutes.', icon: '🛠️' },
      vector: { title: 'Commencez par Vector-MOM', txt: 'Créez votre compte et enregistrez votre première réunion dans 30 secondes.', icon: '🗣️' },
      flux: { title: 'Commencez par Flux-Link', txt: "Créez votre compte et publiez votre premier post LinkedIn aujourd'hui.", icon: '📣' }
    };
    var qSteps = quizBox.querySelectorAll('.quiz-step');
    var qDots = quizBox.querySelectorAll('.qp-dot');
    var qResult = document.getElementById('quiz-result');
    var qScores = { stator: 0, rotor: 0, vector: 0, flux: 0 };
    var qCurrent = 0;

    function showQuizStep(i) {
      qSteps.forEach(function (s) { s.hidden = (parseInt(s.dataset.step, 10) !== i); });
      qDots.forEach(function (d) { d.classList.toggle('on', parseInt(d.dataset.step, 10) <= i); });
    }

    quizBox.querySelectorAll('.quiz-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.dataset.scores.split(':');
        qScores[parts[0]] += parseInt(parts[1], 10);
        qCurrent++;
        if (qCurrent < qSteps.length) {
          showQuizStep(qCurrent);
        } else {
          qSteps.forEach(function (s) { s.hidden = true; });
          var winner = 'stator';
          var best = -1;
          ['stator', 'rotor', 'vector', 'flux'].forEach(function (k) {
            if (qScores[k] > best) { best = qScores[k]; winner = k; }
          });
          var info = QUIZ_INFO[winner];
          document.getElementById('qr-ic').textContent = info.icon;
          document.getElementById('qr-title').textContent = info.title;
          document.getElementById('qr-txt').textContent = info.txt;
          qResult.dataset.winner = winner;
          qResult.hidden = false;
        }
      });
    });

    var qRestart = document.getElementById('qr-restart');
    if (qRestart) qRestart.addEventListener('click', function () {
      qScores = { stator: 0, rotor: 0, vector: 0, flux: 0 };
      qCurrent = 0;
      qResult.hidden = true;
      showQuizStep(0);
    });

    var qCta = document.getElementById('qr-cta');
    if (qCta) qCta.addEventListener('click', function () {
      var winner = qResult.dataset.winner || 'stator';
      if (winner === 'stator') {
        var selEl = document.getElementById('sel-produit');
        if (selEl) selEl.value = 'stator';
        var formSec = document.getElementById('formulaire');
        if (formSec) formSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        var card = document.querySelector('.ec-card[data-product="' + winner + '"]');
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('rec');
          setTimeout(function () { card.classList.remove('rec'); }, 3600);
        }
      }
    });
  }

  /* Barre de progression de lecture (articles de blog). */
  var readBar = document.querySelector('.read-progress');
  var articleBody = document.querySelector('.article-body');
  if (readBar && articleBody) {
    var onReadScroll = function () {
      var rect = articleBody.getBoundingClientRect();
      var total = articleBody.offsetHeight - window.innerHeight;
      var scrolled = -rect.top;
      var p = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
      readBar.style.transform = 'scaleX(' + p + ')';
    };
    window.addEventListener('scroll', onReadScroll, { passive: true });
    onReadScroll();
  }

  /* Barre CTA sticky mobile — apparaît après le hero, s'efface près du CTA final. */
  if (window.matchMedia('(max-width: 820px)').matches &&
      !/^\/essai\/?/.test(location.pathname)) {
    var stickyBar = document.createElement('div');
    stickyBar.className = 'sticky-cta';
    stickyBar.innerHTML = '<a class="btn btn-acc" href="/essai/">Essai gratuit 30 jours</a>';
    document.body.appendChild(stickyBar);
    var ctaTarget = document.querySelector('.cta-final, #formulaire, #choix');
    var stickyVisible = false;
    var updateSticky = function () {
      var shouldShow = window.scrollY > 500;
      if (shouldShow && ctaTarget) {
        var r = ctaTarget.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) shouldShow = false;
      }
      if (shouldShow !== stickyVisible) {
        stickyVisible = shouldShow;
        stickyBar.classList.toggle('show', shouldShow);
      }
    };
    window.addEventListener('scroll', updateSticky, { passive: true });
    window.addEventListener('resize', updateSticky);
    updateSticky();
  }

  /* Indicateur de scroll sur les tableaux comparatifs et schémas (masque le dégradé en fin de scroll). */
  document.querySelectorAll('.table-wrap, .schema-fig').forEach(function (wrap) {
    var check = function () {
      var atEnd = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 2;
      wrap.classList.toggle('at-end', atEnd || wrap.scrollWidth <= wrap.clientWidth);
    };
    wrap.addEventListener('scroll', check, { passive: true });
    check();
    window.addEventListener('resize', check);
  });

  /* Commutateur de segment (accueil) — réordonne les 4 cartes produit par pertinence. */
  var segSwitch = document.querySelector('.seg-switch');
  var hpGrid = document.querySelector('.hp-grid');
  if (segSwitch && hpGrid) {
    var SEG_ORDER = {
      fabricant: ['stator', 'rotor', 'vector', 'flux'],
      distributeur: ['stator', 'flux', 'vector', 'rotor'],
      maintien: ['rotor', 'stator', 'vector', 'flux'],
      service: ['rotor', 'vector', 'stator', 'flux']
    };
    segSwitch.querySelectorAll('.seg-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        segSwitch.querySelectorAll('.seg-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var order = SEG_ORDER[chip.dataset.segment];
        if (!order) return;
        order.forEach(function (prod, i) {
          var card = hpGrid.querySelector('.hp-card[data-product="' + prod + '"]');
          if (card) card.style.order = i;
        });
        hpGrid.classList.remove('reordering');
        void hpGrid.offsetWidth;
        hpGrid.classList.add('reordering');
      });
    });
  }

  /* Bouton magnétique — les CTA principaux suivent légèrement le curseur. */
  if (window.matchMedia('(hover: hover)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.btn-big').forEach(function (btn) {
      var reset = function () { btn.style.transform = ''; };
      btn.addEventListener('mousemove', function (ev) {
        var r = btn.getBoundingClientRect();
        var mx = ev.clientX - (r.left + r.width / 2);
        var my = ev.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (mx * 0.15).toFixed(1) + 'px,' + (my * 0.25).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', reset);
      btn.addEventListener('mousedown', reset);
    });
  }

  /* Parallaxe légère sur les grandes bandes photo et héros statiques (desktop uniquement). */
  if (window.matchMedia('(min-width: 900px)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var parallaxImgs = document.querySelectorAll('.pv-band img, .pv-hero .bg img');
    if (parallaxImgs.length) {
      var pxTicking = false;
      var updateParallax = function () {
        pxTicking = false;
        var vh = window.innerHeight;
        parallaxImgs.forEach(function (img) {
          var host = img.closest('.pv-band, .bg');
          if (!host) return;
          var rect = host.getBoundingClientRect();
          var mid = rect.top + rect.height / 2;
          var progress = (mid - vh / 2) / vh;
          var offset = Math.max(-7, Math.min(7, progress * 7));
          img.style.setProperty('--px', offset + '%');
        });
      };
      var onPxScroll = function () {
        if (!pxTicking) { pxTicking = true; requestAnimationFrame(updateParallax); }
      };
      window.addEventListener('scroll', onPxScroll, { passive: true });
      window.addEventListener('resize', onPxScroll);
      updateParallax();
    }
  }

  /* Rail de partage social (articles de blog) — injecté en JS, pas de HTML à dupliquer. */
  var shareArticleBody = document.querySelector('.article-body');
  if (shareArticleBody && shareArticleBody.parentElement) {
    var shareUrl = encodeURIComponent(location.href);
    var shareTitle = encodeURIComponent(document.title);
    var rail = document.createElement('div');
    rail.className = 'share-rail';
    rail.setAttribute('aria-label', 'Partager cet article');
    rail.innerHTML =
      '<a class="share-btn share-li" href="https://www.linkedin.com/sharing/share-offsite/?url=' + shareUrl +
      '" target="_blank" rel="noopener" aria-label="Partager sur LinkedIn">in</a>' +
      '<a class="share-btn share-x" href="https://twitter.com/intent/tweet?url=' + shareUrl + '&text=' + shareTitle +
      '" target="_blank" rel="noopener" aria-label="Partager sur X">𝕏</a>' +
      '<button type="button" class="share-btn share-copy" aria-label="Copier le lien">🔗</button>';
    shareArticleBody.parentElement.insertBefore(rail, shareArticleBody);
    var copyBtn = rail.querySelector('.share-copy');
    copyBtn.addEventListener('click', function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(location.href).then(function () {
        copyBtn.textContent = '✓';
        copyBtn.setAttribute('aria-label', 'Lien copié');
        setTimeout(function () {
          copyBtn.textContent = '🔗';
          copyBtn.setAttribute('aria-label', 'Copier le lien');
        }, 1800);
      }).catch(function () {});
    });
  }

  /* Sommaire des articles — surlignage de la section active au scroll. */
  var articleToc = document.querySelector('.article-toc');
  if (articleToc && 'IntersectionObserver' in window) {
    var tocLinks = {};
    articleToc.querySelectorAll('a[href^="#"]').forEach(function (a) {
      tocLinks[a.getAttribute('href').slice(1)] = a;
    });
    var tocHeadings = document.querySelectorAll('.article-body h2[id]');
    var tocIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = tocLinks[entry.target.id];
        if (!link) return;
        var prevActive = articleToc.querySelector('a.active');
        if (prevActive) prevActive.classList.remove('active');
        link.classList.add('active');
      });
    }, { rootMargin: '-90px 0px -70% 0px', threshold: 0 });
    tocHeadings.forEach(function (h) { tocIO.observe(h); });
  }

  /* Vidéo hero : chargée uniquement sur desktop + sans reduced-motion, mise en pause hors écran. */
  var heroVideo = document.querySelector('.pv-hero .bg video[data-src]');
  if (heroVideo) {
    var wantsVideo = window.matchMedia('(min-width: 900px)').matches &&
      window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    if (wantsVideo) {
      var srcEl = document.createElement('source');
      srcEl.src = heroVideo.dataset.src;
      srcEl.type = 'video/mp4';
      heroVideo.appendChild(srcEl);
      heroVideo.load();
      heroVideo.style.transition = 'opacity 1s ease';
      heroVideo.style.opacity = '0';
      var revealVideo = function () { heroVideo.style.opacity = '1'; };
      heroVideo.addEventListener('canplay', revealVideo, { once: true });
      setTimeout(revealVideo, 2000);
      var heroVideoPaused = false;
      if ('IntersectionObserver' in window) {
        var heroVideoIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) { if (!heroVideoPaused) heroVideo.play().catch(function () {}); }
            else heroVideo.pause();
          });
        }, { threshold: 0 });
        heroVideoIO.observe(heroVideo);
      }
      var heroVideoToggle = document.getElementById('hero-video-toggle');
      if (heroVideoToggle) {
        heroVideoToggle.hidden = false;
        heroVideoToggle.addEventListener('click', function () {
          heroVideoPaused = !heroVideo.paused;
          if (heroVideoPaused) { heroVideo.pause(); heroVideoToggle.textContent = '►'; heroVideoToggle.setAttribute('aria-label', 'Lire la vidéo'); }
          else { heroVideo.play().catch(function () {}); heroVideoToggle.textContent = '❚❚'; heroVideoToggle.setAttribute('aria-label', 'Mettre en pause la vidéo'); }
        });
      }
    } else {
      heroVideo.remove();
    }
  }

  /* Validation en direct des champs de formulaire (au blur + à la frappe une fois en erreur). */
  function fieldErrEl(field) {
    var next = field.nextElementSibling;
    if (next && next.classList.contains('f-field-err')) return next;
    var el = document.createElement('div');
    el.className = 'f-field-err';
    field.insertAdjacentElement('afterend', el);
    return el;
  }
  function showFieldError(field) {
    field.classList.add('invalid');
    field.classList.remove('shake');
    void field.offsetWidth;
    field.classList.add('shake');
    fieldErrEl(field).textContent = field.validationMessage || 'Champ invalide.';
    fieldErrEl(field).classList.add('show');
  }
  function clearFieldError(field) {
    field.classList.remove('invalid');
    var next = field.nextElementSibling;
    if (next && next.classList.contains('f-field-err')) next.classList.remove('show');
  }
  document.querySelectorAll('form.f').forEach(function (form) {
    form.querySelectorAll('input:not(.hp),select,textarea').forEach(function (field) {
      field.addEventListener('blur', function () {
        if (!field.value && !field.required) return;
        if (!field.checkValidity()) showFieldError(field);
        else clearFieldError(field);
      });
      field.addEventListener('input', function () {
        if (field.classList.contains('invalid') && field.checkValidity()) clearFieldError(field);
      });
    });
  });

  /* Soumission des formulaires vers le service /api (même domaine).
     data-endpoint="/api/essai" ou "/api/contact" sur la balise <form>. */
  document.querySelectorAll('form[data-endpoint]').forEach(function (form) {
    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      var err = form.querySelector('.form-err');
      if (err) err.textContent = '';
      var invalidField = null;
      form.querySelectorAll('input:not(.hp),select,textarea').forEach(function (field) {
        if (!field.checkValidity()) {
          showFieldError(field);
          if (!invalidField) invalidField = field;
        }
      });
      if (invalidField) {
        invalidField.focus();
        return;
      }
      btn.disabled = true;
      btn.classList.add('loading');
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
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { ok.classList.add('show'); });
          });
          ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (e) {
        if (err) err.textContent = e.message;
        btn.disabled = false;
        btn.classList.remove('loading');
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
