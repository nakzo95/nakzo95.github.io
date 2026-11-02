"use strict";
(function () {
  var reel = document.getElementById('reel');
  function step(d) { var f = reel.querySelector('figure'); var w = f ? f.getBoundingClientRect().width + 18 : 400; reel.scrollBy({ left: d * w, behavior: 'smooth' }); }
  document.getElementById('rprev').addEventListener('click', function () { step(-1); });
  document.getElementById('rnext').addEventListener('click', function () { step(1); });
  /* güncel sürüm bilgisi; okunamazsa sayfadakiler kalır */
  if (!window.fetch) return;
  fetch('https://raw.githubusercontent.com/nakzo95/linsol-surum/main/guncelleme.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j || !j.d || !j.d.v) return;
      var d = j.d, mb = d.size ? Math.round(d.size / 1048576) + ' MB' : null;
      function set(s, t) { document.querySelectorAll(s).forEach(function (e) { e.textContent = t; }); }
      set('.v-ver', 'Sürüm ' + d.v); set('.v-ver2', d.v); set('.v-ver3', 'Sürüm ' + d.v);
      if (mb) { set('.v-size', mb); set('.v-size2', mb); }
      if (d.sha256) set('.v-hash', d.sha256);
    }).catch(function () {});
})();
