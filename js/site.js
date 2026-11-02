"use strict";
(function () {
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  var T = EN ? {
    short: 'Please describe it in a few words.', mail: 'The email address looks invalid.', many: 'You can add up to 3 images.', notimg: 'Only PNG, JPEG or WebP images can be added.',
    big: 'This image is too large.', wait: 'Please wait a moment before sending.', rate: 'You have sent several messages recently. Please try again in an hour.',
    sending: 'Sending…', ok: 'Thank you, your message has been sent.', fail: 'Could not send. Check your connection and try again.', off: 'Feedback is not available right now. Please try again later.',
    rm: 'Remove', send: 'Send'
  } : {
    short: 'Lütfen birkaç sözcükle anlatın.', mail: 'E-posta adresi geçersiz görünüyor.', many: 'En çok 3 görsel eklenebilir.', notimg: 'Yalnız PNG, JPEG ya da WebP görsel eklenebilir.',
    big: 'Bu görsel çok büyük.', wait: 'Göndermeden önce bir an bekleyin.', rate: 'Kısa sürede birkaç mesaj gönderdiniz. Bir saat sonra yeniden deneyin.',
    sending: 'Gönderiliyor…', ok: 'Teşekkürler, mesajınız gönderildi.', fail: 'Gönderilemedi. Bağlantınızı denetleyip yeniden deneyin.', off: 'Geri bildirim şu an kullanılamıyor. Biraz sonra yeniden deneyin.',
    rm: 'Kaldır', send: 'Gönder'
  };

  /* render şeridi düğmeleri */
  var reel = document.getElementById('reel');
  function step(d) { var f = reel && reel.querySelector('figure'); var w = f ? f.getBoundingClientRect().width + 18 : 400; reel.scrollBy({ left: d * w, behavior: 'smooth' }); }
  var rp = document.getElementById('rprev'), rn = document.getElementById('rnext');
  if (reel && rp && rn) { rp.addEventListener('click', function () { step(-1); }); rn.addEventListener('click', function () { step(1); }); }

  var LIST = 'https://raw.githubusercontent.com/nakzo95/linsol-lisans/main/lisans.json';
  var GB_API = 'https://api.github.com/repos/nakzo95/linsol-geribildirim';
  function set(s, t) { document.querySelectorAll(s).forEach(function (e) { e.textContent = t; }); }

  /* güncel sürüm bilgisi; okunamazsa sayfadakiler kalır */
  if (window.fetch) fetch('https://raw.githubusercontent.com/nakzo95/linsol-surum/main/guncelleme.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j || !j.d || !j.d.v) return;
      var d = j.d, mb = d.size ? Math.round(d.size / 1048576) + ' MB' : null, V = EN ? 'Version ' : 'Sürüm ';
      set('.v-ver', V + d.v); set('.v-ver2', d.v); set('.v-ver3', V + d.v);
      if (mb) { set('.v-size', mb); set('.v-size2', mb); }
      if (d.sha256) set('.v-hash', d.sha256);
    }).catch(function () { });

  /* ---------- geri bildirim ----------
     Mesaj, LinSol'ün kullanıcılara dağıttığı bildirim anahtarıyla gizli geri bildirim deposuna kayıt olarak gönderilir.
     Anahtar sayfada yazılı değildir; gönderim anında imzalı lisans listesinden okunur. Görseller tarayıcıda küçültülüp
     JPEG'e çevrilir ve parça parça eklenir. Ekrana yalnız düz metin yazılır. */
  var form = document.getElementById('gbf'); if (!form) return;
  var imgs = [], t0 = Date.now(), st = document.getElementById('gbst'), th = document.getElementById('gbth'), btn = document.getElementById('gbsend');
  function say(m, k) { st.textContent = m || ''; st.className = 'st' + (k ? ' ' + k : ''); }
  function thumbs() {
    th.textContent = '';
    imgs.forEach(function (d, i) {
      var sp = document.createElement('span'), im = document.createElement('img'), b = document.createElement('button');
      im.src = 'data:image/jpeg;base64,' + d; im.alt = ''; b.type = 'button'; b.textContent = '✕'; b.title = T.rm; b.setAttribute('aria-label', T.rm);
      b.addEventListener('click', function () { imgs.splice(i, 1); thumbs(); }); sp.appendChild(im); sp.appendChild(b); th.appendChild(sp);
    });
  }
  function shrink(file) {
    return new Promise(function (res, rej) {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type || '')) return rej(new Error(T.notimg));
      if (file.size > 25e6) return rej(new Error(T.big));
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        try {
          var k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
          var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h);
          var q = 0.82, d = c.toDataURL('image/jpeg', q); while (d.length > 880000 && q > 0.4) { q -= 0.12; d = c.toDataURL('image/jpeg', q); }
          res(d.slice(d.indexOf(',') + 1));
        } catch (e) { rej(e); } finally { URL.revokeObjectURL(u); }
      };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error(T.notimg)); }; im.src = u;
    });
  }
  function add(files) {
    [].slice.call(files || []).forEach(function (f) {
      if (imgs.length >= 3) return say(T.many, 'err');
      shrink(f).then(function (d) { if (imgs.length < 3) { imgs.push(d); thumbs(); } }).catch(function (e) { say(e.message, 'err'); });
    });
  }
  document.getElementById('gbfile').addEventListener('change', function (e) { add(e.target.files); e.target.value = ''; });
  form.addEventListener('paste', function (e) { var it = [].slice.call((e.clipboardData && e.clipboardData.items) || []).filter(function (x) { return x.kind === 'file' && /^image\//.test(x.type); }); if (it.length) { e.preventDefault(); add(it.map(function (x) { return x.getAsFile(); })); } });

  function tokenOf(j) {
    var s = (j && j.d && j.d.akt && j.d.akt.j) || ''; if (!s) return '';
    s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    var raw = atob(s), b = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) b[i] = raw.charCodeAt(i) ^ ((0x5a + i * 7) & 255);
    return new TextDecoder().decode(b);
  }
  function rateOk() { try { var a = JSON.parse(localStorage.getItem('linsol.gb') || '[]').filter(function (t) { return Date.now() - t < 3600e3; }); return a.length < 3 ? a : null; } catch (e) { return []; } }
  function rateAdd(a) { try { a.push(Date.now()); localStorage.setItem('linsol.gb', JSON.stringify(a)); } catch (e) { } }

  form.addEventListener('submit', function (e) {
    e.preventDefault(); if (btn.disabled) return;
    var msg = document.getElementById('gbmsg').value.trim(), mail = document.getElementById('gbmail').value.trim(), tur = document.getElementById('gbtur').value;
    if (document.getElementById('gbweb').value) return say(T.ok, 'ok'); // otomatik doldurulan tuzak alan: sessizce yok say
    if (msg.length < 3) return say(T.short, 'err');
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return say(T.mail, 'err');
    if (Date.now() - t0 < 3000) return say(T.wait, 'err');
    var lg = rateOk(); if (!lg) return say(T.rate, 'err');
    btn.disabled = true; btn.textContent = T.sending; say('');
    var tok = '', body = { k: 'gb', v: 1, tur: tur, msg: msg.slice(0, 4000), mail: mail.slice(0, 120), src: 'site', lang: EN ? 'en' : 'tr', page: location.pathname.slice(0, 120), n: imgs.length, t: Date.now() };
    var H = function () { return { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }; };
    fetch(LIST + '?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { tok = tokenOf(j); if (!tok) throw new Error(T.off);
        return fetch(GB_API + '/issues', { method: 'POST', headers: H(), body: JSON.stringify({ title: 'Geri bildirim · ' + tur + ' · site', body: JSON.stringify(body) }) }); })
      .then(function (r) { if (r.status !== 201) throw new Error(T.fail); return r.json(); })
      .then(function (is) {
        var jobs = [], CH = 60000;
        imgs.forEach(function (d, i) { var m = Math.ceil(d.length / CH); for (var p = 0; p < m; p++) jobs.push({ k: 'gbimg', i: i, p: p, m: m, d: d.slice(p * CH, (p + 1) * CH) }); });
        return jobs.reduce(function (pr, c) { return pr.then(function () { return fetch(GB_API + '/issues/' + is.number + '/comments', { method: 'POST', headers: H(), body: JSON.stringify({ body: JSON.stringify(c) }) }).catch(function () { }); }); }, Promise.resolve());
      })
      .then(function () { rateAdd(lg); form.reset(); imgs = []; thumbs(); say(T.ok, 'ok'); })
      .catch(function (er) { say((er && er.message) || T.fail, 'err'); })
      .then(function () { tok = ''; btn.disabled = false; btn.textContent = T.send; });
  });
})();
