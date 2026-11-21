/* backup.js (v66) — "Backup & Restore" card on the Favourites and Explore pages.
   Everything the site remembers about a reader (favourites, what was read, visit days / streak, game wins, audios heard, script + theme + language choice)
   lives only in that phone's browser. This card lets the reader save it as a small file or a text code and put it back on another phone / after clearing the browser.
   - Nothing is sent anywhere: the file / code is made and read on the device.
   - RESTORE MERGES, it never wipes: favourites / read / heard / visit days are joined, best streak / wins keep the higher number, "where you left off" keeps the newer one,
     and preferences (theme, language, script, name) are only filled in when this device has none.
   - Only the keys in ALLOW can ever be written, and every value is checked first — a pasted code cannot put anything else into the browser.
   - The admin session key is never included. */
(function(){
  var page = document.body && document.body.getAttribute('data-page');
  if(page !== 'favorites' && page !== 'play') return;
  var main = document.getElementById('main-content'); if(!main) return;

  var ALLOW = {
    'zf-favorite-poems': 'list', 'zf-read-poems': 'list', 'zf-heard-audio': 'list', 'zf-visit-days': 'list', 'zf-lafz-known': 'list',
    'zf-best-streak': 'max', 'zf-game-wins': 'max', 'zf-star-best': 'max', 'zf-lafz-best': 'max',
    'zf-last-read': 'last',
    'zf-poem-script': 'pref', 'zf-theme': 'pref', 'zf-lang': 'pref', 'zf-cname': 'pref'
  };
  var APP = 'zaanfarzaan.site', MAX_BYTES = 200000;

  var lang = function(){ var l = window.ZF_LANG; return (l === 'en' || l === 'ur') ? l : 'hi'; };
  var T = {
    title:   {hi: 'बैकअप और रिस्टोर', en: 'Backup & Restore', ur: 'بیک اپ اور ریسٹور'},
    intro:   {hi: 'आपकी पसंद, पढ़ी हुई सूची और स्ट्रीक सिर्फ़ इसी फ़ोन में रहते हैं। फ़ोन बदलें या ब्राउज़र साफ़ करें तो ये चले जाते हैं — इसलिए इन्हें सहेज कर रख लीजिए। कुछ भी कहीं भेजा नहीं जाता।',
              en: 'Your favourites, read list and streak live only in this phone\'s browser — if you change phone or clear the browser they are gone. Save them here and put them back any time. Nothing is sent anywhere.',
              ur: 'آپ کی پسند، پڑھی ہوئی فہرست اور اسٹریک صرف اسی فون میں رہتے ہیں۔ فون بدلیں یا براؤزر صاف کریں تو یہ چلے جاتے ہیں — اس لیے انہیں محفوظ کر لیجیے۔ کچھ بھی کہیں بھیجا نہیں جاتا۔'},
    have:    {hi: 'अभी इस फ़ोन में:', en: 'Right now on this phone:', ur: 'ابھی اس فون میں:'},
    fav:     {hi: 'पसंद', en: 'favourites', ur: 'پسند'},
    read:    {hi: 'पढ़ी हुई', en: 'read', ur: 'پڑھی ہوئی'},
    days:    {hi: 'दिन आए', en: 'visit days', ur: 'دن آئے'},
    file:    {hi: 'फ़ाइल सहेजें', en: 'Save as file', ur: 'فائل محفوظ کریں'},
    copy:    {hi: 'कोड कॉपी करें', en: 'Copy code', ur: 'کوڈ کاپی کریں'},
    restore: {hi: 'वापस लाएँ', en: 'Restore', ur: 'واپس لائیں'},
    paste:   {hi: 'बैकअप का कोड यहाँ चिपकाइए', en: 'Paste your backup code here', ur: 'بیک اپ کا کوڈ یہاں چسپاں کیجیے'},
    orFile:  {hi: 'या बैकअप फ़ाइल चुनिए', en: 'or choose the backup file', ur: 'یا بیک اپ فائل چنیے'},
    apply:   {hi: 'मिलाकर वापस लाएँ', en: 'Restore now', ur: 'ملا کر واپس لائیں'},
    note:    {hi: 'वापस लाने पर पुराना कुछ मिटता नहीं — दोनों जुड़ जाते हैं।', en: 'Restoring never deletes anything — the two are joined together.', ur: 'واپس لانے پر پرانا کچھ مٹتا نہیں — دونوں جڑ جاتے ہیں۔'},
    copied:  {hi: 'कोड कॉपी हो गया ✓ — इसे अपने पास (जैसे WhatsApp पर खुद को) रख लीजिए।', en: 'Code copied ✓ — keep it somewhere safe (for example send it to yourself on WhatsApp).', ur: 'کوڈ کاپی ہو گیا ✓ — اسے اپنے پاس محفوظ رکھیے (مثلاً واٹس ایپ پر خود کو بھیج دیں)۔'},
    saved:   {hi: 'फ़ाइल सहेज ली गई ✓', en: 'File saved ✓', ur: 'فائل محفوظ ہو گئی ✓'},
    empty:   {hi: 'अभी सहेजने लायक़ कुछ नहीं है — पहले कोई शेर पसंद कीजिए या कुछ पढ़िए।', en: 'There is nothing to save yet — like a sher or read something first.', ur: 'ابھی محفوظ کرنے کے لیے کچھ نہیں — پہلے کوئی شعر پسند کیجیے یا کچھ پڑھیے۔'},
    bad:     {hi: 'ये बैकअप पहचाना नहीं गया। पूरा कोड चिपकाइए या वही फ़ाइल चुनिए जो यहीं से सहेजी थी।', en: 'That backup was not recognised. Paste the whole code, or choose the file saved from here.', ur: 'یہ بیک اپ پہچانا نہیں گیا۔ پورا کوڈ چسپاں کیجیے یا وہی فائل چنیے جو یہیں سے محفوظ کی تھی۔'},
    stats:   {hi: 'मेरे इस्तेमाल को गुमनाम गिनती में शामिल रखिए (कौन-सा शेर या ऑडियो पसंद आ रहा है) — नाम, ईमेल या कोई पहचान नहीं ली जाती।',
              en: 'Count my visit anonymously (which sher or audio is popular) — no name, e-mail or ID is ever taken.',
              ur: 'میرے استعمال کو گمنام گنتی میں شامل رکھیے (کون سا شعر یا آڈیو پسند آ رہا ہے) — نام، ای میل یا کوئی شناخت نہیں لی جاتی۔'},
    statsDnt:{hi: 'आपके ब्राउज़र में “Do Not Track” चालू है, इसलिए कुछ भी गिना नहीं जा रहा।', en: 'Your browser has “Do Not Track” on, so nothing is counted.', ur: 'آپ کے براؤزر میں “Do Not Track” چالو ہے، اس لیے کچھ بھی گنا نہیں جا رہا۔'},
    none:    {hi: 'कुछ नया जुड़ने को नहीं मिला — सब पहले से यहाँ है।', en: 'Nothing new to add — everything was already here.', ur: 'کچھ نیا جوڑنے کو نہیں ملا — سب پہلے سے یہاں ہے۔'}
  };
  function tr(k){ return T[k][lang()]; }
  function msgAdded(r){
    var l = lang(), p = [];
    if(r.fav)  p.push(r.fav + ' ' + tr('fav'));
    if(r.read) p.push(r.read + ' ' + tr('read'));
    if(r.days) p.push(r.days + ' ' + tr('days'));
    var head = {hi: 'वापस आ गया ✓ — जुड़ा: ', en: 'Restored ✓ — added: ', ur: 'واپس آ گیا ✓ — جڑا: '}[l];
    return head + (p.length ? p.join(' · ') : '…');
  }

  /* ---------- storage helpers ---------- */
  function get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function set(k, v){ try{ localStorage.setItem(k, v); return true; }catch(e){ return false; } }
  function arr(k){ try{ var a = JSON.parse(get(k) || '[]'); return Array.isArray(a) ? a : []; }catch(e){ return []; } }

  function collect(){
    var data = {};
    Object.keys(ALLOW).forEach(function(k){ var v = get(k); if(v !== null && v !== '') data[k] = v; });
    return data;
  }
  /* worth saving only if there is something a reader actually made: favourites, read pieces, audios heard, game wins, or visits on 2+ days */
  function hasAnything(d){
    return arr('zf-favorite-poems').length > 0 || arr('zf-read-poems').length > 0 || arr('zf-heard-audio').length > 0 ||
           (cleanNum(get('zf-game-wins')) || 0) > 0 || arr('zf-visit-days').length > 1;
  }
  function stamp(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function toPayload(){ return JSON.stringify({app: APP, v: 1, t: new Date().toISOString(), data: collect()}); }
  function enc(s){ return 'ZF1.' + btoa(unescape(encodeURIComponent(s))); }
  function dec(s){ return decodeURIComponent(escape(atob(s))); }

  /* ---------- reading + checking a backup ---------- */
  function parse(text){
    text = String(text || '').replace(/^\uFEFF/, '').trim();
    if(!text || text.length > MAX_BYTES) return null;
    try{
      var j = text;
      var m = /^ZF1\.([A-Za-z0-9+\/=_-]+)$/.exec(text.replace(/\s+/g, ''));
      if(m) j = dec(m[1].replace(/-/g, '+').replace(/_/g, '/'));
      var o = JSON.parse(j);
      if(!o || o.app !== APP || !o.data || typeof o.data !== 'object') return null;
      return o.data;
    }catch(e){ return null; }
  }
  var ID = /^[A-Za-z0-9:._#-]{1,60}$/, DAY = /^\d{4}-\d{2}-\d{2}$/;
  function cleanList(k, raw){
    var a; try{ a = JSON.parse(raw); }catch(e){ return null; }
    if(!Array.isArray(a)) return null;
    a = a.slice(0, 3000).filter(function(x){
      if(k === 'zf-heard-audio') return typeof x === 'number' && x >= 0 && x < 1000 && x % 1 === 0;
      if(k === 'zf-visit-days') return typeof x === 'string' && DAY.test(x);
      return typeof x === 'string' && ID.test(x);
    });
    return a;
  }
  function cleanNum(raw){ var n = parseInt(raw, 10); return (isFinite(n) && n >= 0 && n < 1000000) ? n : null; }
  function cleanLast(raw){ try{ var o = JSON.parse(raw); if(o && /^(ghazal|nazm)-\d{1,3}$/.test(o.id || '') && typeof o.t === 'number') return {id: o.id, t: o.t}; }catch(e){} return null; }
  function cleanPref(k, raw){
    raw = String(raw);
    if(k === 'zf-theme') return (raw === 'light' || raw === 'dark') ? raw : null;
    if(k === 'zf-lang' || k === 'zf-poem-script') return (raw === 'hi' || raw === 'en' || raw === 'ur') ? raw : null;
    raw = raw.replace(/[\u0000-\u001F<>]/g, '').slice(0, 60);
    return raw || null;
  }

  /* merge a checked backup into this device; returns how much was added */
  function apply(data){
    var added = {fav: 0, read: 0, days: 0}, changedAny = false;
    Object.keys(data).forEach(function(k){
      var kind = ALLOW[k]; if(!kind || typeof data[k] !== 'string') return;
      var raw = data[k];
      if(kind === 'list'){
        var inc = cleanList(k, raw); if(!inc) return;
        var cur = arr(k), seen = {}; cur.forEach(function(x){ seen[x] = 1; });
        var n = 0; inc.forEach(function(x){ if(!seen[x]){ seen[x] = 1; cur.push(x); n++; } });
        if(!n) return;
        if(k === 'zf-visit-days'){ cur.sort(); if(cur.length > 800) cur = cur.slice(-800); added.days += n; }
        if(k === 'zf-favorite-poems') added.fav += n;
        if(k === 'zf-read-poems') added.read += n;
        if(set(k, JSON.stringify(cur))) changedAny = true;
      } else if(kind === 'max'){
        var v = cleanNum(raw), c = cleanNum(get(k)) || 0;
        if(v !== null && v > c && set(k, String(v))) changedAny = true;
      } else if(kind === 'last'){
        var o = cleanLast(raw), cl = null; try{ cl = JSON.parse(get(k) || 'null'); }catch(e){}
        if(o && (!cl || !(cl.t >= o.t)) && set(k, JSON.stringify(o))) changedAny = true;
      } else if(kind === 'pref'){
        if(get(k)) return;
        var p = cleanPref(k, raw); if(p && set(k, p)) changedAny = true;
      }
    });
    added.any = changedAny;
    return added;
  }

  /* ---------- the card ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.zf-bk{box-sizing:border-box;width:calc(100% - 12vw);max-width:840px;margin:2.4rem auto 4rem;padding:1.4rem 1.4rem 1.2rem;border:1px solid rgba(var(--zf-rgb),.3);border-radius:6px;background:rgba(var(--zf-rgb),.04);text-align:start}' +
    '.zf-bk h2{margin:0 0 .5rem;font-size:1.25rem;color:var(--gold-soft)}' +
    '.zf-bk p{margin:.3rem 0;font-size:.92rem;line-height:1.7;color:var(--text-muted)}' +
    '.zf-bk .zf-bk-have{font-size:.84rem;margin:.7rem 0 1rem}' +
    '.zf-bk-row{display:flex;flex-wrap:wrap;gap:.6rem}' +
    '.zf-bk button,.zf-bk .zf-bk-pick{font:inherit;font-size:.9rem;line-height:1.4;padding:.55rem 1.05rem;border-radius:999px;border:1px solid rgba(var(--zf-rgb),.45);background:rgba(var(--zf-rgb),.06);color:var(--text-light);cursor:pointer;min-height:40px;transition:background .2s,border-color .2s}' +
    '.zf-bk button:hover,.zf-bk .zf-bk-pick:hover{background:rgba(var(--zf-rgb),.14);border-color:var(--gold)}' +
    '.zf-bk button.zf-bk-go{background:var(--gold-soft);color:var(--ink);border-color:var(--gold-soft)}' +
    '.zf-bk button:focus-visible,.zf-bk textarea:focus-visible,.zf-bk .zf-bk-pick:focus-within{outline:2px solid var(--gold);outline-offset:2px}' +
    '.zf-bk-restore{margin-top:1rem}.zf-bk-restore[hidden]{display:none}' +
    '.zf-bk textarea{width:100%;box-sizing:border-box;min-height:84px;padding:.6rem .7rem;border-radius:4px;border:1px solid rgba(var(--zf-rgb),.35);background:var(--ink-deep,#0a0a0a);color:var(--text-light);font:.8rem/1.5 monospace;direction:ltr}' +
    '.zf-bk-actions{display:flex;flex-wrap:wrap;align-items:center;gap:.7rem;margin-top:.6rem}' +
    '.zf-bk .zf-bk-pick{position:relative;display:inline-flex;align-items:center}.zf-bk .zf-bk-pick input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}' +
    '.zf-bk .zf-bk-stat{display:flex;gap:.55rem;align-items:flex-start;margin-top:1.1rem;font-size:.8rem;line-height:1.6;color:var(--text-muted);cursor:pointer}.zf-bk .zf-bk-stat input{margin-top:.25rem;flex:none}' +
    '.zf-bk .zf-bk-msg{margin-top:.9rem;font-size:.88rem;color:var(--gold-soft);min-height:1.2em}.zf-bk .zf-bk-msg.bad{color:#d98a8a}';
  document.head.appendChild(css);

  var box = document.createElement('section'); box.className = 'zf-bk'; box.id = 'zf-backup'; box.setAttribute('aria-labelledby', 'zf-bk-t');
  main.appendChild(box);
  var open = false, msg = '', bad = false;

  function dnt(){ return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1' || navigator.globalPrivacyControl === true; }
  function statsOn(){ return !dnt() && get('zf-no-stats') !== '1'; }
  function counts(){
    var f = arr('zf-favorite-poems').length, r = arr('zf-read-poems').length, d = arr('zf-visit-days').length;
    return f + ' ' + tr('fav') + ' · ' + r + ' ' + tr('read') + ' · ' + d + ' ' + tr('days');
  }
  function render(){
    box.innerHTML =
      '<h2 id="zf-bk-t">' + tr('title') + '</h2><p>' + tr('intro') + '</p>' +
      '<p class="zf-bk-have">' + tr('have') + ' <b>' + counts() + '</b></p>' +
      '<div class="zf-bk-row"><button type="button" data-a="file">\u2B07 ' + tr('file') + '</button><button type="button" data-a="copy">\u29C9 ' + tr('copy') + '</button><button type="button" data-a="toggle" aria-expanded="' + open + '">\u2B06 ' + tr('restore') + '</button></div>' +
      '<div class="zf-bk-restore"' + (open ? '' : ' hidden') + '><label for="zf-bk-code" style="display:block;font-size:.85rem;margin-bottom:.35rem">' + tr('paste') + '</label>' +
        '<textarea id="zf-bk-code" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea>' +
        '<div class="zf-bk-actions"><button type="button" class="zf-bk-go" data-a="apply">' + tr('apply') + '</button>' +
        '<label class="zf-bk-pick">' + tr('orFile') + '<input type="file" id="zf-bk-file" accept=".json,.txt,application/json,text/plain"></label></div>' +
        '<p>' + tr('note') + '</p></div>' +
      '<label class="zf-bk-stat"><input type="checkbox" id="zf-bk-stats"' + (statsOn() ? ' checked' : '') + (dnt() ? ' disabled' : '') + '> <span>' + (dnt() ? tr('statsDnt') : tr('stats')) + '</span></label>' +
      '<p class="zf-bk-msg' + (bad ? ' bad' : '') + '" role="status" aria-live="polite">' + msg + '</p>';
    wire();
  }
  function say(m, isBad){ msg = m; bad = !!isBad; var el = box.querySelector('.zf-bk-msg'); if(el){ el.textContent = m; el.className = 'zf-bk-msg' + (isBad ? ' bad' : ''); } }

  function finish(data){
    var d = parse(data);
    if(!d) return say(tr('bad'), true);
    var r = apply(d);
    if(!r.any) return say(tr('none'));
    say(msgAdded(r));
    setTimeout(function(){ location.reload(); }, 1600);      /* so favourites / streak on this page show the restored data */
  }
  function wire(){
    var st = box.querySelector('#zf-bk-stats');
    if(st) st.addEventListener('change', function(){ try{ if(st.checked) localStorage.removeItem('zf-no-stats'); else localStorage.setItem('zf-no-stats', '1'); }catch(e){} });
    box.querySelector('[data-a=file]').addEventListener('click', function(){
      var d = collect(); if(!hasAnything(d)) return say(tr('empty'), true);
      try{
        var blob = new Blob([toPayload()], {type: 'application/json'}), a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'zaanfarzaan-backup-' + stamp() + '.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
        say(tr('saved'));
      }catch(e){ say(tr('bad'), true); }
    });
    box.querySelector('[data-a=copy]').addEventListener('click', function(){
      var d = collect(); if(!hasAnything(d)) return say(tr('empty'), true);
      var code = enc(toPayload());
      var ok = function(){ say(tr('copied')); };
      if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(code).then(ok, function(){ legacy(code); ok(); }); }
      else { legacy(code); ok(); }
    });
    box.querySelector('[data-a=toggle]').addEventListener('click', function(){ open = !open; msg = ''; render(); if(open){ var t = document.getElementById('zf-bk-code'); if(t) t.focus(); } });
    box.querySelector('[data-a=apply]').addEventListener('click', function(){ finish(document.getElementById('zf-bk-code').value); });
    box.querySelector('#zf-bk-file').addEventListener('change', function(e){
      var f = e.target.files && e.target.files[0]; if(!f) return;
      if(f.size > MAX_BYTES) return say(tr('bad'), true);
      var rd = new FileReader(); rd.onload = function(){ finish(String(rd.result || '')); }; rd.onerror = function(){ say(tr('bad'), true); }; rd.readAsText(f);
    });
  }
  function legacy(text){ var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); }catch(x){} document.body.removeChild(ta); }

  render();
  var prev = window.ZF_rerenderCollection;
  window.ZF_rerenderCollection = function(){ if(typeof prev === 'function') prev.apply(this, arguments); msg = msg ? msg : ''; render(); };
})();
