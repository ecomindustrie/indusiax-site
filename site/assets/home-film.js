/* ══════════════════════════════════════════════════════════════════
   INDUSIAX — film d'accueil « Comment tout se relie »
   ------------------------------------------------------------------
   Composition continue de 7 scènes (46 s, en boucle) écrite en
   1920×1080 et remise à l'échelle du conteneur.

   Le principe repris de la maquette : l'image entière est une fonction
   pure du temps T. L'arbre DOM est donc construit UNE fois, puis chaque
   frame ne réécrit que les propriétés qui bougent (via st/at/tx, qui
   sautent l'écriture quand la valeur n'a pas changé).

   Le film ne tourne que lorsqu'il est visible à l'écran, et pas du tout
   si l'utilisateur demande un mouvement réduit — dans ce cas une seule
   image est peinte : le réseau formé autour de Stator-CRM.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root = document.querySelector('.fx');
  if (!root || !window.requestAnimationFrame) return;

  /* ── temps ───────────────────────────────────────────────────────
     Chaque scène est jouée 1,15× plus lentement que sa durée d'écriture.
     Le rapport étant le même partout, le temps de lecture se ramène à une
     division. CUES = début de chaque scène en temps d'écriture. */
  var CUES = { Stator: 4, Rotor: 10, Vector: 16, Flux: 22, Suite: 28, Signature: 35 };
  var AUTHORED = 40, WARP = 1.15, PLAY = AUTHORED * WARP;
  var STILL = 31.5; /* image fixe en mouvement réduit : le réseau formé */

  /* ── maths ─────────────────────────────────────────────────────── */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function eOutQuart(t) { t -= 1; return 1 - t * t * t * t; }
  function eInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; }
  function eInOutQuart(t) { if (t < 0.5) return 8 * t * t * t * t; t -= 1; return 1 - 8 * t * t * t * t; }
  function eOutBack(t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function tween(t, start, end, ease) {
    if (t <= start) return 0;
    if (t >= end) return 1;
    return ease((t - start) / (end - start));
  }
  function enter(t, s, e) { return tween(t, s, e, eOutQuart); }   /* arrivée */
  function pop(t, s, e) { return tween(t, s, e, eOutBack); }      /* rebond  */
  function glide(t, s, e) { return tween(t, s, e, eInOutCubic); } /* glissé  */

  /* ── DOM ───────────────────────────────────────────────────────── */
  var NS = 'http://www.w3.org/2000/svg';
  function mk(tag, cls, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }
  function mkS(tag, parent, attrs) {
    var e = document.createElementNS(NS, tag), k;
    if (attrs) for (k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  /* Écritures paresseuses : une propriété inchangée n'est pas réécrite. */
  function st(el, k, v) { var c = el.__s || (el.__s = {}); if (c[k] !== v) { c[k] = v; el.style[k] = v; } }
  function at(el, k, v) { var c = el.__a || (el.__a = {}); if (c[k] !== v) { c[k] = v; el.setAttribute(k, v); } }
  function tx(el, v) { if (el.__t !== v) { el.__t = v; el.textContent = v; } }
  function px(n) { return n + 'px'; }
  function op(el, v) { st(el, 'opacity', v < 0.0005 ? '0' : (v > 0.9995 ? '' : String(Math.round(v * 1000) / 1000))); }

  /* ── contenu ───────────────────────────────────────────────────── */
  var PRODUCTS = [
    {
      key: 'Stator', initial: 'S', name: 'Stator-CRM', tag: 'CRM industriel · ventes & clients',
      question: 'Le devis envoyé il y a trois semaines, il en est où ?',
      answer: 'Clients, devis PDF, relances automatiques, tournées, SAV, parc machines — le CRM qui parle le langage de la vente de matériel.',
      price: '650 € / utilisateur / an',
      color: '#e84c2b', color2: '#ff8a68',
      rail: { x: 150, y: 986 }, net: { x: 1010, y: 600, r: 118 }
    },
    {
      key: 'Rotor', initial: 'R', name: 'Rotor-FSM', tag: 'Contrôles & interventions terrain',
      question: 'Votre dernière VGP, elle est dans quel classeur ?',
      answer: 'Vérifications sur tablette, fiches machines paramétrables, rapport PDF signé à votre marque, échéances suivies. Du terrain au rapport, sans ressaisie.',
      price: '390 € / utilisateur / an',
      color: '#3b82f6', color2: '#7dabff',
      rail: { x: 240, y: 986 }, net: { x: 1390, y: 372, r: 78 }
    },
    {
      key: 'Vector', initial: 'V', name: 'Vector-MOM', tag: 'Réunions & intelligence artificielle',
      question: 'Qui rédige le compte-rendu de la réunion de ce matin ?',
      answer: "L'IA transcrit, distingue qui parle et rédige le compte-rendu structuré — sur nos serveurs européens, jamais chez un géant du cloud.",
      price: '12 € / utilisateur / mois',
      color: '#a88cfa', color2: '#cfbcff',
      rail: { x: 330, y: 986 }, net: { x: 630, y: 372, r: 78 }
    },
    {
      key: 'Flux', initial: 'F', name: 'Flux-Link', tag: 'Communication LinkedIn',
      question: 'Votre savoir-faire, qui le voit en dehors de l’atelier ?',
      answer: "Dictez trois phrases, ajoutez les photos : l'IA rédige un post professionnel et le publie. Votre savoir-faire mérite d’être vu.",
      price: '12 € / utilisateur / mois',
      color: '#0ea5e9', color2: '#6bd3f7',
      rail: { x: 420, y: 986 }, net: { x: 1010, y: 852, r: 78 }
    }
  ];
  function endOf(i) { return i < 3 ? CUES[PRODUCTS[i + 1].key] : CUES.Suite; }

  /* Poussières en suspension — positions tirées d'un bruit déterministe,
     pour que le film soit identique à chaque lecture. */
  var PARTICLES = [];
  (function () {
    for (var i = 0; i < 46; i++) {
      var r = function (n) { return ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1; };
      PARTICLES.push({ x: r(1) * 1920, y: r(2) * 1080, s: 1.2 + r(3) * 2.6, sp: 8 + r(4) * 26, ph: r(5) * 10 });
    }
  })();

  var R = {}; /* références vers les nœuds animés */

  /* ══ construction ═════════════════════════════════════════════════ */
  function build() {
    var stage = mk('div', 'fx-stage', root);
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label',
      'Film de présentation : les quatre logiciels de la suite Indusiax — Stator-CRM, ' +
      'Rotor-FSM, Vector-MOM et Flux-Link — puis le réseau qu’ils forment autour de Stator-CRM.');
    R.stage = stage;
    var cam = mk('div', 'fx-cam', stage);
    R.cam = cam;

    /* — trame technique — */
    var grid = mkS('svg', cam, { viewBox: '0 0 1920 1080', 'class': 'fx-grid' });
    var defs = mkS('defs', grid);
    R.pattern = mkS('pattern', defs, {
      id: 'fx-grid-pattern', width: 60, height: 60, patternUnits: 'userSpaceOnUse'
    });
    mkS('path', R.pattern, { d: 'M60 0H0V60', fill: 'none', stroke: 'rgba(255,255,255,0.055)', 'stroke-width': 1 });
    mkS('rect', grid, { width: 1920, height: 1080, fill: 'url(#fx-grid-pattern)' });

    /* — halos et balayage — */
    R.glowA = mk('div', 'fx-glow-a', cam);
    mk('div', 'fx-glow-b', cam);
    R.sweep = mk('div', 'fx-sweep', cam);

    /* — poussières — */
    var dust = mkS('svg', cam, { viewBox: '0 0 1920 1080', 'class': 'fx-dust' });
    R.dust = [];
    for (var d = 0; d < PARTICLES.length; d++) {
      R.dust.push(mkS('circle', dust, { r: PARTICLES[d].s }));
    }

    /* — liens du réseau — */
    var net = mkS('svg', cam, { viewBox: '0 0 1920 1080', 'class': 'fx-net' });
    R.rail = mkS('line', net, {
      x1: 150, y1: 986, x2: 420, y2: 986,
      stroke: 'rgba(255,255,255,0.18)', 'stroke-width': 2, 'stroke-linecap': 'round'
    });
    R.links = [];
    for (var k = 1; k < PRODUCTS.length; k++) {
      var p = PRODUCTS[k];
      var g = mkS('g', net);
      R.links.push({
        g: g,
        halo: mkS('line', g, { stroke: p.color, 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-opacity': 0.14 }),
        core: mkS('line', g, { stroke: p.color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-opacity': 0.9 }),
        dot: mkS('circle', g, { r: 10, fill: p.color }),
        halo2: mkS('circle', g, { r: 22, fill: p.color })
      });
    }

    /* — pastilles produits — */
    R.pills = PRODUCTS.map(function (p) {
      var wrap = mk('div', 'fx-pill', cam);
      var disc = mk('div', 'fx-disc', wrap);
      disc.style.background = 'radial-gradient(circle at 34% 28%, ' + p.color + ', ' + p.color + 'bb)';
      var ini = mk('span', null, disc);
      ini.textContent = p.initial;
      var rings = [mk('div', 'fx-ring', wrap), mk('div', 'fx-ring', wrap)];
      rings[0].style.borderColor = rings[1].style.borderColor = p.color;
      var name = mk('div', 'fx-pname', wrap);
      name.textContent = p.name;
      return { wrap: wrap, disc: disc, ini: ini, rings: rings, name: name };
    });

    /* — balayage coloré au changement de produit — */
    R.swipes = PRODUCTS.map(function (p) {
      var s = mk('div', 'fx-swipe', cam);
      s.style.background = 'linear-gradient(90deg, transparent, ' + p.color + '22, ' + p.color2 + '33, transparent)';
      return s;
    });

    /* — ouverture — */
    var open = mk('div', 'fx-open', cam);
    R.open = open;
    mk('div', 'fx-eb', open).textContent = 'Suite Indusiax';
    var h1 = mk('div', 'fx-title', open);
    h1.appendChild(document.createTextNode('Quatre logiciels.'));
    mk('br', null, h1);
    mk('span', 'ac', h1).textContent = 'Une seule chaîne.';
    var lede = mk('p', 'fx-lede', open);
    lede.appendChild(document.createTextNode('Créés '));
    mk('b', null, lede).textContent = 'dans';
    lede.appendChild(document.createTextNode(' une PME industrielle française, '));
    mk('b', null, lede).textContent = 'pour';
    lede.appendChild(document.createTextNode(' les TPE & PME de l’industrie.'));

    /* — blocs produits — */
    R.prods = PRODUCTS.map(function (p, i) { return buildProduct(cam, p, i); });

    /* — la suite connectée — */
    var sTitle = mk('div', 'fx-suite-t', cam);
    R.suiteTitle = sTitle;
    mk('div', 'fx-k', sTitle).textContent = 'La suite connectée';
    var h2 = mk('div', 'fx-h2', sTitle);
    h2.appendChild(document.createTextNode('Stator-CRM au centre. '));
    mk('span', 'ac', h2).textContent = 'Le reste s’y branche.';

    var pts = mk('div', 'fx-suite-p', cam);
    R.suitePts = pts;
    R.suitePtRows = [
      ['Une seule connexion', '« Se connecter avec Stator »'],
      ['Fiches clients partagées', 'aucune double saisie'],
      ['Les données circulent', 'du terrain au CRM']
    ].map(function (row) {
      var w = mk('div', null, pts);
      mk('b', null, w).textContent = row[0];
      mk('i', null, w).textContent = row[1];
      return w;
    });

    var cta = mk('div', 'fx-suite-c', cam);
    R.suiteCta = cta;
    mk('span', 'fx-badge', cta).textContent = '1 connexion · 4 outils';
    mk('span', 'fx-note', cta).textContent = 'La suite complète — 990 € / utilisateur / an, 2 mois offerts';

    /* — signature — */
    buildSignature(cam);

    /* — habillage — */
    mk('div', 'fx-vignette', stage);
    R.fade = mk('div', 'fx-fade', stage);

    buildControl();
  }

  function buildProduct(cam, p, i) {
    var o = { p: p, i: i };
    var wrap = mk('div', 'fx-prod', cam);
    o.wrap = wrap;

    /* question */
    o.q = mk('div', 'fx-q', wrap);
    o.qhead = mk('div', 'fx-qhead', o.q);
    var num = mk('span', 'fx-qnum', o.qhead);
    num.textContent = '0' + (i + 1);
    num.style.color = p.color;
    o.qbar = mk('span', 'fx-qbar', o.qhead);
    o.qbar.style.background = p.color;
    mk('span', 'fx-qtag', o.qhead).textContent = p.tag;
    o.qmark = mk('div', 'fx-qmark', o.q);
    o.qmark.textContent = '?';
    o.qmark.style.color = p.color;
    o.qtext = mk('div', 'fx-qtext', o.q);
    o.qtext.textContent = '« ' + p.question + ' »';

    /* réponse */
    o.a = mk('div', 'fx-a', wrap);
    var nm = mk('div', 'fx-aname', o.a);
    nm.textContent = p.name;
    nm.style.color = p.color;
    mk('p', 'fx-atext', o.a).textContent = p.answer;
    var price = mk('div', 'fx-price', o.a);
    price.textContent = p.price;
    price.style.color = p.color;
    price.style.border = '1px solid ' + p.color + '77';
    price.style.background = p.color + '18';

    /* graphique */
    o.gwrap = mk('div', null, wrap);
    o.gwrap.style.position = 'absolute';
    o.gwrap.style.inset = '0';
    o.card = mk('div', 'fx-card', o.gwrap);
    o.card.style.setProperty('--fx-c', p.color);
    o.card.style.boxShadow =
      '0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 60px ' + p.color + '18';
    o.g = BUILDERS[p.key](o.card, p);
    return o;
  }

  /* ── graphiques produits ───────────────────────────────────────── */
  var BUILDERS = {};

  BUILDERS.Stator = function (card, p) {
    var g = { cols: [], bars: [] };
    mk('div', 'fx-ceb', card).textContent = 'Pipeline commercial';
    g.kpi = mk('div', 'fx-st-kpi', card);
    g.kpiN = document.createTextNode('0');
    g.kpi.appendChild(g.kpiN);
    mk('span', null, g.kpi).textContent = ' devis suivis';

    ['Devis', 'Relance', 'Négo', 'Gagné'].forEach(function (s, i) {
      var col = mk('div', 'fx-st-col', card);
      col.style.left = px(46 + i * 186);
      var lab = mk('div', 'fx-st-lab', col);
      lab.textContent = s;
      var box = mk('div', 'fx-st-box', col);
      var bars = [];
      for (var k = 0; k < 3; k++) bars.push(mk('div', 'fx-st-bar', box));
      g.cols.push({ col: col, lab: lab, box: box, bars: bars });
    });

    g.card = mk('div', 'fx-st-card', card);
    g.card.textContent = 'DEV-2418';
    g.card.style.background = p.color;
    g.card.style.boxShadow = '0 0 34px ' + p.color + '88';

    g.foot = mk('div', 'fx-st-foot', card);
    var chip = mk('span', 'fx-chip', g.foot);
    chip.textContent = 'Relance auto J+7';
    chip.style.color = p.color;
    chip.style.background = p.color + '22';
    chip.style.border = '1px solid ' + p.color + '66';
    mk('span', 'fx-note', g.foot).textContent = 'aucune affaire oubliée';
    return g;
  };

  BUILDERS.Rotor = function (card, p) {
    var g = { rows: [] };
    mk('div', 'fx-ceb', card).textContent = 'VGP — Pont roulant #12';
    mk('div', 'fx-ro-h', card).textContent = 'Contrôle sur tablette';

    ['Élingues — état', 'Crochet & linguet', 'Chaîne de levage', 'Freins de translation', 'Essai en charge']
      .forEach(function (label, i) {
        var row = mk('div', 'fx-ro-row', card);
        row.style.top = px(152 + i * 74);
        var box = mk('span', 'fx-ro-box', row);
        var check = mkS('svg', box, { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' });
        mkS('path', check, {
          d: 'M5 13l4 4L19 7', stroke: '#0b0d12', 'stroke-width': 3.4,
          'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        });
        var lab = mk('span', 'fx-ro-lab', row);
        lab.textContent = label;
        g.rows.push({ row: row, box: box, check: check, lab: lab });
      });

    g.foot = mk('div', 'fx-ro-foot', card);
    var pdf = mk('span', 'fx-ro-pdf', g.foot);
    pdf.textContent = 'RAPPORT PDF SIGNÉ';
    pdf.style.background = p.color;
    pdf.style.boxShadow = '0 0 34px ' + p.color + '77';
    mk('span', 'fx-note', g.foot).textContent = 'à votre marque · échéance J+365';
    return g;
  };

  BUILDERS.Vector = function (card, p) {
    var g = { bars: [], lines: [] };
    mk('div', 'fx-ceb', card).textContent = 'Réunion de production · 42 min';
    var wave = mk('div', 'fx-ve-wave', card);
    for (var i = 0; i < 46; i++) {
      var b = mk('i', null, wave);
      b.style.background = p.color;
      g.bars.push(b);
    }
    mk('div', 'fx-ve-rule', card);

    [['Atelier', 'Décision : lancer la série 400 en semaine 12.'],
     ['Achats', 'Relancer le fournisseur inox avant vendredi.'],
     ['Direction', 'Budget maintenance validé — 18 k€.']].forEach(function (ln, i) {
      var w = mk('div', 'fx-ve-line', card);
      w.style.top = px(240 + i * 108);
      var who = mk('div', 'fx-ve-who', w);
      var ini = mk('span', 'fx-ve-ini', who);
      ini.textContent = ln[0].charAt(0);
      ini.style.color = p.color;
      ini.style.background = p.color + '33';
      ini.style.border = '1px solid ' + p.color + '88';
      var nm = mk('span', 'fx-ve-name', who);
      nm.textContent = ln[0];
      nm.style.color = p.color;
      var clip = mk('div', 'fx-ve-clip', w);
      mk('div', 'fx-ve-txt', clip).textContent = ln[1];
      g.lines.push({ w: w, clip: clip });
    });

    g.foot = mk('div', 'fx-ve-foot', card);
    var chip = mk('span', 'fx-chip', g.foot);
    chip.textContent = 'Compte-rendu prêt';
    chip.style.color = p.color;
    chip.style.background = p.color + '22';
    chip.style.border = '1px solid ' + p.color + '66';
    mk('span', 'fx-eu', g.foot).textContent = 'Hébergé en Europe';
    return g;
  };

  BUILDERS.Flux = function (card, p) {
    var g = { bars: [] };
    g.text = 'Nouvelle ligne de soudure inox livrée cette semaine chez notre client agroalimentaire. '
           + 'Trois mois de conception, deux jours de montage.';
    var head = mk('div', 'fx-fl-head', card);
    var av = mk('div', 'fx-fl-av', head);
    av.textContent = 'IX';
    av.style.color = p.color;
    av.style.background = p.color + '22';
    av.style.border = '1px solid ' + p.color + '66';
    var who = mk('span', null, head);
    mk('span', 'fx-fl-who', who).textContent = 'Votre entreprise';
    mk('span', 'fx-fl-sub', who).textContent = 'Post LinkedIn · dicté en 20 s';

    g.wave = mk('div', 'fx-fl-wave', card);
    for (var i = 0; i < 40; i++) {
      var b = mk('i', null, g.wave);
      b.style.background = p.color;
      g.bars.push(b);
    }
    g.post = mk('div', 'fx-fl-post', card);
    g.postN = document.createTextNode('');
    g.post.appendChild(g.postN);
    g.caret = mk('span', null, g.post);
    g.caret.textContent = '|';
    g.caret.style.color = p.color;

    g.photo = mk('div', 'fx-fl-photo', card);
    g.photo.textContent = 'Photo atelier';
    g.photo.style.background = 'linear-gradient(135deg, ' + p.color + '33, #171b25)';

    g.foot = mk('div', 'fx-fl-foot', card);
    var pub = mk('span', 'fx-fl-pub', g.foot);
    pub.textContent = 'PUBLIÉ';
    pub.style.background = p.color;
    pub.style.boxShadow = '0 0 32px ' + p.color + '77';
    g.likes = mk('span', 'fx-fl-stat', g.foot);
    g.likesN = document.createTextNode('0');
    g.likes.appendChild(g.likesN);
    mk('span', null, g.likes).textContent = ' réactions';
    g.shares = mk('span', 'fx-fl-stat', g.foot);
    g.sharesN = document.createTextNode('0');
    g.shares.appendChild(g.sharesN);
    mk('span', null, g.shares).textContent = ' partages';
    return g;
  };

  function buildSignature(cam) {
    var sig = mk('div', 'fx-sig', cam);
    R.sig = sig;
    var dots = mk('div', 'fx-sig-dots', sig);
    R.sigDots = PRODUCTS.map(function (p) {
      var s = mk('span', null, dots);
      s.style.background = p.color;
      s.style.boxShadow = '0 0 24px ' + p.color + 'aa';
      return s;
    });
    var logo = mk('div', 'fx-logo', sig);
    R.logo = logo;
    mk('span', null, logo).textContent = 'Indus';
    var iw = mk('span', 'fx-i', logo);
    iw.appendChild(document.createTextNode('ı'));
    R.dotWhite = mk('i', null, iw);
    R.dotWhite.style.background = '#f2f4f8';
    R.dotAcc = mk('i', null, iw);
    R.dotAcc.style.background = '#e84c2b';
    R.dotRing = mk('i', null, iw);
    R.dotRing.style.border = '2px solid #e84c2b';
    mk('span', null, logo).textContent = 'a';
    mk('span', 'ac', logo).textContent = 'X';
    R.baseline = mk('div', 'fx-baseline', sig);
    R.baseline.textContent = 'by industry, for industry';
    R.rule = mk('div', 'fx-rule', sig);
  }

  /* ── commande lecture / pause ──────────────────────────────────── */
  function buildControl() {
    var btn = mk('button', 'fx-ctrl', root);
    btn.type = 'button';
    var icon = mkS('svg', btn, { viewBox: '0 0 12 12', 'aria-hidden': 'true' });
    var path = mkS('path', icon, {});
    var label = mk('span', null, btn);
    R.ctrl = { btn: btn, path: path, label: label };
    btn.addEventListener('click', function () {
      paused = !paused;
      syncControl();
      if (!paused && visible && !raf) { last = 0; raf = requestAnimationFrame(tick); }
    });
    syncControl();
  }
  function syncControl() {
    if (!R.ctrl) return;
    at(R.ctrl.path, 'd', paused ? 'M2 1l9 5-9 5z' : 'M2 1h3v10H2zm5 0h3v10H7z');
    tx(R.ctrl.label, paused ? 'Lire' : 'Pause');
    R.ctrl.btn.setAttribute('aria-label', paused ? 'Lire le film de présentation' : 'Mettre le film en pause');
  }

  /* ══ image ════════════════════════════════════════════════════════ */
  function frame(T) {
    /* — repères globaux — */
    var suiteT = glide(T, CUES.Suite - 0.5, CUES.Suite + 1.2);
    var suiteTextT = enter(T, CUES.Suite - 0.15, CUES.Suite + 1.1);
    var collapse = glide(T, CUES.Signature - 0.25, CUES.Signature + 1.1);
    var railFade = 1 - clamp((T - (CUES.Suite - 0.7)) / 0.7, 0, 1);
    var openIn = enter(T, 0.25, 1.6);
    var openOut = 1 - clamp((T - (CUES.Stator - 0.7)) / 0.7, 0, 1);
    var fadeIn = clamp(T / 0.55, 0, 1);
    var fadeOut = 1 - clamp((T - (AUTHORED - 0.55)) / 0.55, 0, 1);
    var sigOut = 1 - clamp((T - (CUES.Signature - 0.5)) / 0.5, 0, 1);

    var active = -1;
    for (var a = 0; a < PRODUCTS.length; a++) {
      if (T >= CUES[PRODUCTS[a].key] - 0.5 && T < endOf(a)) { active = a; break; }
    }
    var glowColor = active >= 0 ? PRODUCTS[active].color : '#e84c2b';

    /* — caméra — */
    var camScale = lerp(1.05, 1, clamp(T / 3.4, 0, 1))
      * lerp(1, 1.045, clamp((T - CUES.Suite) / 6.5, 0, 1) * (1 - collapse))
      * lerp(1, 1.05, collapse);
    var camY = lerp(16, 0, clamp(T / 3.4, 0, 1));
    st(R.cam, 'transform', 'translateY(' + camY.toFixed(2) + 'px) scale(' + camScale.toFixed(4) + ')');

    /* — trame, halo, balayage — */
    at(R.pattern, 'patternTransform', 'translate(' + ((T * 6) % 60).toFixed(2) + ' ' + ((T * 3) % 60).toFixed(2) + ')');
    st(R.glowA, 'background', 'radial-gradient(circle, ' + glowColor + '2e 0%, transparent 62%)');
    st(R.glowA, 'transform', 'translate(' + (suiteT * -320).toFixed(1) + 'px, ' + (suiteT * 120).toFixed(1) + 'px) scale('
      + lerp(0.95, 1.12, clamp(T / 12, 0, 1)).toFixed(3) + ')');
    st(R.sweep, 'left', px((((T * 190) % 3200) - 800).toFixed(1)));

    /* — poussières — */
    for (var d = 0; d < PARTICLES.length; d++) {
      var pt = PARTICLES[d], node = R.dust[d];
      var y = ((pt.y - T * pt.sp) % 1140 + 1140) % 1140 - 30;
      var twk = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(T * 1.6 + pt.ph));
      at(node, 'cx', (pt.x + Math.sin(T * 0.4 + pt.ph) * 14).toFixed(1));
      at(node, 'cy', y.toFixed(1));
      at(node, 'fill', glowColor);
      at(node, 'opacity', (twk * 0.55).toFixed(3));
    }

    /* — position des pastilles — */
    var N = PRODUCTS.map(function (p, i) {
      var off = [0, 0.3, 0.14, 0.42][i];
      var arrive = glide(T, CUES.Suite - 0.45 + off, CUES.Suite + 1.15 + off);
      var born = pop(T, 0.6 + i * 0.16, 1.6 + i * 0.16);
      var s = CUES[p.key], e = endOf(i);
      var act = clamp((T - (s - 0.35)) / 0.5, 0, 1) * (1 - clamp((T - (e - 0.45)) / 0.45, 0, 1));
      var x = lerp(p.rail.x, p.net.x, arrive);
      var y = lerp(p.rail.y, p.net.y, arrive);
      var r = lerp(lerp(30, 40, act), p.net.r, arrive) * born;
      x = lerp(x, 1010, collapse); y = lerp(y, 470, collapse);
      r = r * (1 - collapse * 0.92);
      return { x: x, y: y, r: r, arrive: arrive, act: act, op: 1 - collapse };
    });

    /* — liens — */
    at(R.rail, 'stroke-opacity', railFade.toFixed(3));
    for (var k = 0; k < R.links.length; k++) {
      var L = R.links[k], pk = PRODUCTS[k + 1], A = N[0], B = N[k + 1];
      var len = Math.hypot(B.x - A.x, B.y - A.y);
      var draw = glide(T, CUES.Suite + 1.1 + k * 0.24, CUES.Suite + 2.0 + k * 0.24);
      var pulse = ((T - (CUES.Suite + 2.0 + k * 0.33)) / 1.5) % 1;
      var pv = draw > 0.97 && pulse > 0 ? 1 : 0;
      at(L.g, 'opacity', ((1 - collapse) * draw).toFixed(3));
      if (draw > 0) {
        var x1 = A.x.toFixed(1), y1 = A.y.toFixed(1), x2 = B.x.toFixed(1), y2 = B.y.toFixed(1);
        var dash = len.toFixed(1), off2 = (len * (1 - draw)).toFixed(1);
        [L.halo, L.core].forEach(function (ln) {
          at(ln, 'x1', x1); at(ln, 'y1', y1); at(ln, 'x2', x2); at(ln, 'y2', y2);
          at(ln, 'stroke-dasharray', dash); at(ln, 'stroke-dashoffset', off2);
        });
        at(L.dot, 'cx', lerp(A.x, B.x, pulse).toFixed(1));
        at(L.dot, 'cy', lerp(A.y, B.y, pulse).toFixed(1));
        at(L.halo2, 'cx', lerp(A.x, B.x, pulse).toFixed(1));
        at(L.halo2, 'cy', lerp(A.y, B.y, pulse).toFixed(1));
        at(L.dot, 'opacity', String(pv));
        at(L.halo2, 'opacity', (pv * 0.22).toFixed(3));
      }
    }

    /* — pastilles — */
    for (var i2 = 0; i2 < PRODUCTS.length; i2++) {
      var P = PRODUCTS[i2], n = N[i2], U = R.pills[i2];
      op(U.wrap, n.op);
      if (n.op < 0.0005) continue;
      var d2 = px((n.r * 2).toFixed(1)), lx = px((n.x - n.r).toFixed(1)), ly = px((n.y - n.r).toFixed(1));
      st(U.disc, 'left', lx); st(U.disc, 'top', ly);
      st(U.disc, 'width', d2); st(U.disc, 'height', d2);
      st(U.disc, 'boxShadow', '0 0 ' + (26 + 46 * n.act + 60 * n.arrive).toFixed(0) + 'px ' + P.color
        + (n.act > 0.4 || n.arrive > 0.4 ? '88' : '33'));
      st(U.ini, 'fontSize', px(Math.max(9, n.r * 0.8).toFixed(1)));
      var ringOp = Math.max(n.act, n.arrive) * (1 - collapse) * 0.55;
      for (var rg = 0; rg < 2; rg++) {
        var v = (T * 0.75 + i2 * 0.31 + rg * 0.5) % 1;
        var ring = U.rings[rg];
        st(ring, 'left', lx); st(ring, 'top', ly);
        st(ring, 'width', d2); st(ring, 'height', d2);
        op(ring, ringOp * (1 - v));
        st(ring, 'transform', 'scale(' + (1 + v * 0.85).toFixed(3) + ')');
      }
      st(U.name, 'left', px((n.x - 200).toFixed(1)));
      st(U.name, 'top', px((n.y + n.r + 20).toFixed(1)));
      op(U.name, clamp((n.arrive - 0.88) / 0.12, 0, 1) * (1 - collapse));
    }

    /* — balayages colorés — */
    for (var w = 0; w < R.swipes.length; w++) {
      var sw = clamp((T - (CUES[PRODUCTS[w].key] - 0.45)) / 0.9, 0, 1);
      var on = sw > 0 && sw < 1;
      st(R.swipes[w], 'display', on ? '' : 'none');
      if (on) st(R.swipes[w], 'left', px(lerp(-700, 2100, eInOutQuart(sw)).toFixed(1)));
    }

    /* — ouverture — */
    var openOp = openIn * openOut;
    op(R.open, openOp);
    st(R.open, 'display', openOp < 0.0005 ? 'none' : '');
    if (openOp >= 0.0005) st(R.open, 'transform', 'translateY(' + lerp(36, 0, openIn).toFixed(1) + 'px)');

    /* — blocs produits — */
    for (var q = 0; q < R.prods.length; q++) updateProduct(R.prods[q], T);

    /* — la suite connectée — */
    var stOp = suiteTextT * sigOut;
    op(R.suiteTitle, stOp);
    st(R.suiteTitle, 'display', stOp < 0.0005 ? 'none' : '');
    if (stOp >= 0.0005) st(R.suiteTitle, 'transform', 'translateY(' + lerp(30, 0, suiteTextT).toFixed(1) + 'px)');

    var ptsOp = clamp((T - (CUES.Suite + 2.2)) / 0.8, 0, 1) * sigOut;
    op(R.suitePts, ptsOp);
    st(R.suitePts, 'display', ptsOp < 0.0005 ? 'none' : '');
    if (ptsOp >= 0.0005) {
      for (var pr = 0; pr < R.suitePtRows.length; pr++) {
        op(R.suitePtRows[pr], clamp((T - (CUES.Suite + 2.2 + pr * 0.3)) / 0.6, 0, 1));
      }
    }
    var ctaOp = clamp((T - (CUES.Suite + 2.6)) / 0.8, 0, 1) * sigOut;
    op(R.suiteCta, ctaOp);
    st(R.suiteCta, 'display', ctaOp < 0.0005 ? 'none' : '');

    /* — signature — */
    var sigOp = clamp((T - (CUES.Signature + 0.5)) / 0.7, 0, 1);
    op(R.sig, sigOp);
    st(R.sig, 'display', sigOp < 0.0005 ? 'none' : '');
    if (sigOp >= 0.0005) {
      for (var s2 = 0; s2 < R.sigDots.length; s2++) {
        st(R.sigDots[s2], 'transform', 'scale('
          + pop(T, CUES.Signature + 0.7 + s2 * 0.1, CUES.Signature + 1.45 + s2 * 0.1).toFixed(3) + ')');
      }
      st(R.logo, 'transform', 'scale('
        + lerp(1.07, 1, enter(T, CUES.Signature + 0.5, CUES.Signature + 2.0)).toFixed(4) + ')');

      var dotG = pop(T, CUES.Signature + 1.5, CUES.Signature + 2.15);
      var dotS = glide(T, CUES.Signature + 2.2, CUES.Signature + 2.9);
      var dotScale = 1 + 2.4 * (dotG - dotS);
      var dotOn = clamp((T - (CUES.Signature + 1.62)) / 0.35, 0, 1);
      var dotRing = clamp(1 - Math.abs((T - (CUES.Signature + 2.05)) / 0.7), 0, 1);
      var dotTr = 'translate(-50%, 0) scale(' + dotScale.toFixed(3) + ')';
      op(R.dotWhite, 1 - dotOn);
      st(R.dotWhite, 'transform', dotTr);
      op(R.dotAcc, dotOn);
      st(R.dotAcc, 'transform', dotTr);
      st(R.dotAcc, 'boxShadow', '0 0 ' + (28 + 70 * (dotScale - 1)).toFixed(0) + 'px rgba(232,76,43,'
        + (0.45 + 0.4 * (dotScale - 1)).toFixed(3) + ')');
      op(R.dotRing, dotRing * 0.7);
      st(R.dotRing, 'transform', 'translate(-50%, 0) scale(' + (1 + dotRing * 6).toFixed(3) + ')');

      op(R.baseline, clamp((T - (CUES.Signature + 1.4)) / 0.9, 0, 1));
      st(R.baseline, 'backgroundPosition',
        (140 - (Math.max(0, (T - (CUES.Signature + 1.9)) * 62) % 260)).toFixed(1) + '% 0');
      st(R.rule, 'width', px((640 * glide(T, CUES.Signature + 1.6, CUES.Signature + 3.0)).toFixed(1)));
    }

    /* — fondus d'ouverture et de fermeture — */
    var fade = (1 - fadeIn) + (1 - fadeOut);
    op(R.fade, fade);
    st(R.fade, 'display', fade < 0.0005 ? 'none' : '');
  }

  function updateProduct(o, T) {
    var p = o.p, i = o.i, s = CUES[p.key], e = endOf(i), l = T - s;
    var inA = enter(T, s - 0.3, s + 0.9);
    var out = 1 - clamp((T - (e - 0.3)) / 0.3, 0, 1);
    var o2 = inA * out;
    op(o.wrap, o2);
    st(o.wrap, 'display', o2 < 0.0005 ? 'none' : '');
    if (o2 < 0.0005) return;

    var qBig = 1 - clamp((l - 1.4) / 0.6, 0, 1);
    var rev = enter(T, s + 2.15, s + 3.1);

    st(o.q, 'top', px(lerp(190, 386, qBig).toFixed(1)));
    st(o.q, 'width', px(lerp(810, 1420, qBig).toFixed(1)));
    st(o.q, 'transform', 'translateY(' + lerp(30, 0, inA).toFixed(1) + 'px)');
    st(o.qhead, 'marginBottom', px(lerp(18, 30, qBig).toFixed(1)));
    st(o.qbar, 'width', px(lerp(40, 70, qBig).toFixed(1)));
    op(o.qmark, 0.09 * qBig);
    st(o.qmark, 'transform', 'translateY(' + lerp(40, 0, inA).toFixed(1) + 'px) scale(' + lerp(0.86, 1, inA).toFixed(3) + ')');
    st(o.qtext, 'fontSize', px(lerp(33, 78, qBig).toFixed(1)));
    st(o.qtext, 'color', qBig > 0.5 ? '#f2f4f8' : '#98a0b0');

    op(o.a, rev);
    st(o.a, 'transform', 'translateY(' + lerp(38, 0, rev).toFixed(1) + 'px)');
    op(o.gwrap, rev);
    st(o.gwrap, 'transform', 'translateX(' + lerp(50, 0, rev).toFixed(1) + 'px) translateY('
      + (Math.sin(l * 0.9) * 7).toFixed(2) + 'px)');
    if (rev > 0.0005) UPDATERS[p.key](o.g, l, p);
  }

  /* ── mise à jour des graphiques ────────────────────────────────── */
  var UPDATERS = {};

  UPDATERS.Stator = function (g, l, p) {
    var step = clamp((l - 2.6) / 2.6, 0, 1) * 3;
    var n = Math.round(lerp(0, 128, clamp((l - 2.2) / 2.2, 0, 1)));
    if (g.lastN !== n) { g.lastN = n; g.kpiN.nodeValue = n.toLocaleString('fr-FR'); }
    for (var i = 0; i < g.cols.length; i++) {
      var c = g.cols[i];
      var app = enter(l, 2.0 + i * 0.16, 2.8 + i * 0.16);
      var hot = clamp(1 - Math.abs(step - i) * 1.6, 0, 1);
      op(c.col, app);
      st(c.col, 'transform', 'translateY(' + lerp(24, 0, app).toFixed(1) + 'px)');
      st(c.lab, 'color', hot > 0.4 ? p.color : '#98a0b0');
      st(c.box, 'borderColor', hot > 0.4 ? p.color : 'rgba(255,255,255,0.09)');
      st(c.box, 'boxShadow', hot > 0.4 ? '0 0 ' + (28 * hot).toFixed(0) + 'px ' + p.color + '55' : 'none');
      op(c.bars[0], hot > 0.4 ? 0 : 1);
    }
    st(g.card, 'left', px((46 + step * 186 + 12).toFixed(1)));
    op(g.card, clamp((l - 2.4) / 0.5, 0, 1));
    op(g.foot, clamp((l - 4.4) / 0.6, 0, 1));
  };

  UPDATERS.Rotor = function (g, l, p) {
    for (var i = 0; i < g.rows.length; i++) {
      var r = g.rows[i];
      var app = enter(l, 2.0 + i * 0.14, 2.7 + i * 0.14);
      var check = pop(l, 2.7 + i * 0.28, 3.2 + i * 0.28);
      op(r.row, app);
      st(r.row, 'transform', 'translateX(' + lerp(30, 0, app).toFixed(1) + 'px)');
      st(r.row, 'borderColor', check > 0.5 ? p.color + '77' : 'rgba(255,255,255,0.09)');
      st(r.box, 'borderColor', check > 0.2 ? p.color : '#6b7280');
      st(r.box, 'background', check > 0.2 ? p.color : 'transparent');
      st(r.box, 'transform', 'scale(' + lerp(0.8, 1, check).toFixed(3) + ')');
      op(r.check, check);
      st(r.lab, 'color', check > 0.5 ? '#f2f4f8' : '#98a0b0');
    }
    var f = clamp((l - 4.4) / 0.6, 0, 1);
    op(g.foot, f);
    st(g.foot, 'transform', 'translateY(' + lerp(20, 0, f).toFixed(1) + 'px)');
  };

  UPDATERS.Vector = function (g, l) {
    for (var i = 0; i < g.bars.length; i++) {
      var on = clamp((l - 1.9 - i * 0.012) / 0.3, 0, 1);
      var h = 12 + Math.abs(Math.sin(i * 0.7 + l * 3.1)) * (18 + (i % 5) * 11);
      st(g.bars[i], 'height', px((h * on).toFixed(1)));
      st(g.bars[i], 'opacity', (0.35 + 0.65 * on).toFixed(3));
    }
    for (var k = 0; k < g.lines.length; k++) {
      var ln = g.lines[k];
      var app = enter(l, 2.4 + k * 0.6, 3.2 + k * 0.6);
      op(ln.w, app);
      st(ln.w, 'transform', 'translateY(' + lerp(18, 0, app).toFixed(1) + 'px)');
      st(ln.clip, 'width', (100 * clamp((l - (2.6 + k * 0.6)) / 0.7, 0, 1)).toFixed(1) + '%');
    }
    op(g.foot, clamp((l - 4.6) / 0.6, 0, 1));
  };

  UPDATERS.Flux = function (g, l) {
    var type = clamp((l - 2.3) / 1.4, 0, 1);
    var shown = g.text.slice(0, Math.round(g.text.length * type));
    if (g.postN.nodeValue !== shown) g.postN.nodeValue = shown;
    op(g.post, type);
    op(g.caret, type < 1 ? 1 : 0);
    op(g.wave, 1 - type);
    if (type < 1) {
      for (var i = 0; i < g.bars.length; i++) {
        st(g.bars[i], 'height', px((6 + Math.abs(Math.sin(i * 0.6 + l * 4)) * 30).toFixed(1)));
      }
    }
    var ph = clamp((l - 3.5) / 0.6, 0, 1);
    op(g.photo, ph);
    st(g.photo, 'transform', 'scale(' + lerp(0.94, 1, ph).toFixed(3) + ')');
    var likes = Math.round(lerp(0, 214, clamp((l - 4.3) / 1.4, 0, 1)));
    if (g.lastLikes !== likes) {
      g.lastLikes = likes;
      g.likesN.nodeValue = likes;
      g.sharesN.nodeValue = Math.round(likes / 7);
    }
    op(g.foot, clamp((l - 4.2) / 0.5, 0, 1));
  };

  /* ══ mise à l'échelle ═════════════════════════════════════════════ */
  function rescale() {
    var w = root.clientWidth;
    if (!w) return;
    var s = w / 1920;
    st(R.stage, 'transform', 'scale(' + s.toFixed(5) + ')');
    /* Le cadre est en 16/9 : la hauteur suit la largeur, rien à corriger. */
  }

  /* ══ lecture ══════════════════════════════════════════════════════ */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.matchMedia ? window.matchMedia('(min-width: 860px)') : null;
  var built = false, visible = false, paused = false, raf = 0, last = 0, clock = 0;

  function tick() {
    raf = 0;
    if (!built) return;
    var now = performance.now();
    var dt = last ? Math.min((now - last) / 1000, 0.1) : 0; /* un onglet qui revient ne saute pas 20 s */
    last = now;
    clock = (clock + dt) % PLAY;
    frame(clock / WARP);
    if (visible && !paused) raf = requestAnimationFrame(tick);
    else last = 0;
  }

  function mount() {
    if (built) return;
    built = true;
    build();
    /* Le cadre est masqué tant que .fx-ready n'est pas posée : il faut
       l'afficher AVANT de mesurer, sinon clientWidth vaut 0. */
    root.classList.add('fx-ready');
    rescale();
    window.addEventListener('resize', rescale);
    if (window.ResizeObserver) new ResizeObserver(rescale).observe(root);

    /* Mouvement réduit : une seule image, le réseau déjà formé. */
    if (reduce) { frame(STILL); return; }
    frame(0);

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !paused && !raf) { last = 0; raf = requestAnimationFrame(tick); }
      }, { threshold: 0.15 }).observe(root);
    } else {
      visible = true;
      raf = requestAnimationFrame(tick);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { last = 0; }
      else if (visible && !paused && !raf) raf = requestAnimationFrame(tick);
    });
  }

  function check() { if (!wide || wide.matches) mount(); }
  check();
  if (wide && !built) {
    if (wide.addEventListener) wide.addEventListener('change', check);
    else if (wide.addListener) wide.addListener(check);
  }
})();
