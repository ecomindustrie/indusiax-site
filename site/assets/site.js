/* INDUSIAX — menu mobile + formulaires (essai / contact) */
(function () {
  var burger = document.getElementById('burger');
  var links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () { links.classList.toggle('open'); });
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
