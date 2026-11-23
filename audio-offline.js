/* audio-offline.js (v67) — "Listen offline" on the Audio page.
   The reader can save recordings INSIDE the site's own storage (Cache API, cache "zf-audio-v1"): no file is downloaded to the phone, nothing appears in Downloads,
   and the recording only plays through this site's player. service-worker.js plays a saved recording from that storage when there is no internet.
   Controls: Save all / Remove all, and a short list to save or remove one recording at a time, with the space used. */
(function(){
  var list = document.querySelector('.audio-list'); if(!list) return;
  var cards = [].slice.call(list.querySelectorAll('.audio-track')); if(!cards.length) return;
  if(!('caches' in window) || !('serviceWorker' in navigator)) return;        /* needs https / localhost and a modern browser; otherwise the section simply does not appear */
  var CACHE = 'zf-audio-v1';

  var lang = function(){ var l = window.ZF_LANG; return (l === 'en' || l === 'ur') ? l : 'hi'; };
  var T = {
    title:  {hi: 'ऑफ़लाइन सुनिए', en: 'Listen offline', ur: 'آف لائن سنیے'},
    intro:  {hi: 'चुनी हुई रिकॉर्डिंग इसी साइट के अंदर सहेज लीजिए — बिना इंटरनेट भी चलेंगी। कोई फ़ाइल फ़ोन में डाउनलोड नहीं होती।',
             en: 'Save recordings inside this site so they play even without internet. No file is downloaded to your phone.',
             ur: 'چنی ہوئی ریکارڈنگ اسی سائٹ کے اندر محفوظ کر لیجیے — بغیر انٹرنیٹ بھی چلیں گی۔ کوئی فائل فون میں ڈاؤن لوڈ نہیں ہوتی۔'},
    status: {hi: '{a} में से {b} सहेजी हुई · {s}', en: '{b} of {a} saved · {s}', ur: '{a} میں سے {b} محفوظ · {s}'},
    saveAll:{hi: 'सब सहेजें', en: 'Save all', ur: 'سب محفوظ کریں'},
    rmAll:  {hi: 'सब हटाएँ', en: 'Remove all', ur: 'سب ہٹائیں'},
    choose: {hi: 'एक-एक चुनिए', en: 'Choose one by one', ur: 'ایک ایک چنیے'},
    save:   {hi: 'सहेजें', en: 'Save', ur: 'محفوظ کریں'},
    saved:  {hi: 'सहेजी हुई ✓', en: 'Saved ✓', ur: 'محفوظ ✓'},
    remove: {hi: 'हटाएँ', en: 'Remove', ur: 'ہٹائیں'},
    saving: {hi: 'सहेज रहे हैं… ', en: 'Saving… ', ur: 'محفوظ ہو رہا ہے… '},
    fail:   {hi: 'सहेजा नहीं जा सका — इंटरनेट या जगह देखिए।', en: 'Could not save — check your connection or free space.', ur: 'محفوظ نہیں ہو سکا — انٹرنیٹ یا جگہ دیکھیے۔'},
    done:   {hi: 'हो गया ✓ — अब ये बिना इंटरनेट भी चलेंगी।', en: 'Done ✓ — these now play without internet.', ur: 'ہو گیا ✓ — اب یہ بغیر انٹرنیٹ بھی چلیں گی۔'},
    wait:   {hi: 'ऐप तैयार हो रहा है — कुछ सेकंड बाद दोबारा दबाइए।', en: 'Getting ready — press again in a few seconds.', ur: 'ایپ تیار ہو رہی ہے — چند سیکنڈ بعد دوبارہ دبائیں۔'}
  };
  function tr(k){ return T[k][lang()]; }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }

  /* ---- the recordings on this page ---- */
  var items = cards.map(function(c){
    var a = c.querySelector('audio'), h = c.querySelector('h3'), src = a && (a.currentSrc || a.getAttribute('src'));
    if(!src) return null;
    return {id: c.id, url: new URL(a.getAttribute('src'), location.href).href.split('?')[0], card: c, title: function(){ var x = c.querySelector('h3'); return x ? x.textContent.trim() : c.id; }};
  }).filter(Boolean);
  if(!items.length) return;

  var saved = {};          /* url -> bytes */
  var busy = false, msg = '', progress = '';

  function fmt(b){ if(!b) return '0 MB'; return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function readSaved(){
    return caches.open(CACHE).then(function(c){ return c.keys().then(function(reqs){
      var p = reqs.map(function(r){ return c.match(r).then(function(res){ if(res) saved[r.url] = parseInt(res.headers.get('Content-Length') || '0', 10) || 0; }); });
      saved = {}; return Promise.all(p);
    }); }).catch(function(){});
  }
  function totalBytes(){ var n = 0; items.forEach(function(it){ n += saved[it.url] || 0; }); return n; }
  function countSaved(){ return items.filter(function(it){ return saved[it.url] !== undefined; }).length; }

  /* ---- save / remove ---- */
  function waitSW(){ return navigator.serviceWorker.getRegistration().then(function(r){ return !!(r && (r.active || navigator.serviceWorker.controller)); }).catch(function(){ return false; }); }
  function saveOne(it, onPart){
    return fetch(it.url, {cache: 'no-store'}).then(function(res){
      if(!res.ok || res.status !== 200) throw new Error('http');
      var total = parseInt(res.headers.get('Content-Length') || '0', 10), type = res.headers.get('Content-Type') || 'audio/mpeg';
      if(!res.body || !res.body.getReader){ return res.blob().then(function(b){ return {b: b, type: type}; }); }
      var reader = res.body.getReader(), chunks = [], got = 0;
      function pump(){ return reader.read().then(function(r){ if(r.done) return {b: new Blob(chunks, {type: type}), type: type}; chunks.push(r.value); got += r.value.length; if(onPart && total) onPart(got / total); return pump(); }); }
      return pump();
    }).then(function(o){
      if(!o.b.size) throw new Error('empty');
      var resp = new Response(o.b, {status: 200, headers: {'Content-Type': o.type, 'Content-Length': String(o.b.size)}});
      return caches.open(CACHE).then(function(c){ return c.put(it.url, resp); }).then(function(){ saved[it.url] = o.b.size; });
    });
  }
  function removeOne(it){ return caches.open(CACHE).then(function(c){ return c.delete(it.url); }).then(function(){ delete saved[it.url]; }); }
  function run(targets, label){
    if(busy) return; busy = true; msg = ''; var k = 0, failed = false;
    waitSW().then(function(ok){
      if(!ok){ busy = false; msg = tr('wait'); render(); return; }
      if(navigator.storage && navigator.storage.persist){ try{ navigator.storage.persist(); }catch(e){} }
      (function next(){
        if(k >= targets.length){ busy = false; progress = ''; msg = failed ? tr('fail') : tr('done'); render(); return; }
        var it = targets[k]; progress = tr('saving') + (k + 1) + '/' + targets.length + '  ·  ' + it.title(); render();
        saveOne(it, null).then(function(){ if(typeof window.ZF_stat === 'function') window.ZF_stat('offline_save', it.id); }).catch(function(){ failed = true; }).then(function(){ k++; next(); });
      })();
    });
  }

  /* ---- UI ---- */
  var css = document.createElement('style');
  css.textContent =
    '.zl-off{box-sizing:border-box;width:calc(100% - 12vw);max-width:760px;margin:0 auto 1.4rem;padding:1.1rem 1.2rem;border:1px solid rgba(var(--zf-rgb),.3);border-radius:8px;background:rgba(var(--zf-rgb),.04);text-align:start}' +
    '.zl-off h3{margin:0 0 .35rem;font-size:1.1rem;color:var(--gold-soft)}.zl-off p{margin:.25rem 0;font-size:.9rem;line-height:1.7;color:var(--text-muted)}' +
    '.zl-off .zl-off-st{font-size:.88rem;color:var(--text-light);margin:.6rem 0}' +
    '.zl-off-row{display:flex;flex-wrap:wrap;gap:.55rem;margin-top:.5rem}' +
    '.zl-off button{font:inherit;font-size:.88rem;line-height:1.4;padding:.5rem 1rem;border-radius:999px;border:1px solid rgba(var(--zf-rgb),.45);background:rgba(var(--zf-rgb),.06);color:var(--text-light);cursor:pointer;min-height:40px}' +
    '.zl-off button:hover:not(:disabled){background:rgba(var(--zf-rgb),.14);border-color:var(--gold)}.zl-off button.go{background:var(--gold-soft);color:var(--ink);border-color:var(--gold-soft)}.zl-off button:disabled{opacity:.5;cursor:default}' +
    '.zl-off button:focus-visible,.zl-off summary:focus-visible{outline:2px solid var(--gold);outline-offset:2px}' +
    '.zl-off details{margin-top:.8rem}.zl-off summary{cursor:pointer;font-size:.88rem;color:var(--gold-soft)}' +
    '.zl-off ul{list-style:none;margin:.6rem 0 0;padding:0;display:grid;grid-template-columns:minmax(0,1fr);gap:.4rem}.zl-off li{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:.6rem;font-size:.88rem;padding:.35rem 0;border-bottom:1px solid rgba(var(--zf-rgb),.12)}' +
    '.zl-off li span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zl-off li button{flex:none;padding:.3rem .8rem;min-height:34px;font-size:.82rem}' +
    '.zl-off .zl-off-msg{font-size:.86rem;color:var(--gold-soft);min-height:1.2em;margin-top:.5rem}';
  css.textContent += '.audio-list .audio-more{margin-bottom:1.6rem}';
  document.head.appendChild(css);

  var box = el('section', 'zl-off'); box.setAttribute('aria-labelledby', 'zl-off-t');
  /* below the recordings (and their "more audios are coming" note), never above them */
  var ui = list.querySelector('.zl-lib-ui'), more = list.querySelector('.audio-more');
  if(more) more.parentNode.insertBefore(box, more.nextSibling); else if(ui) ui.parentNode.insertBefore(box, ui.nextSibling); else list.appendChild(box);
  var detailsOpen = false;

  function render(){
    var n = items.length, c = countSaved();
    box.textContent = '';
    var h = el('h3', null, tr('title')); h.id = 'zl-off-t'; box.appendChild(h);
    box.appendChild(el('p', null, tr('intro')));
    box.appendChild(el('div', 'zl-off-st', tr('status').replace('{a}', n).replace('{b}', c).replace('{s}', fmt(totalBytes()))));
    var row = el('div', 'zl-off-row');
    var b1 = el('button', 'go', tr('saveAll')); b1.type = 'button'; b1.disabled = busy || c === n; b1.addEventListener('click', function(){ run(items.filter(function(it){ return saved[it.url] === undefined; })); });
    var b2 = el('button', null, tr('rmAll')); b2.type = 'button'; b2.disabled = busy || c === 0; b2.addEventListener('click', function(){ Promise.all(items.map(function(it){ return saved[it.url] !== undefined ? removeOne(it) : null; })).then(function(){ msg = ''; render(); }); });
    row.appendChild(b1); row.appendChild(b2); box.appendChild(row);
    var d = el('details'); d.open = detailsOpen; d.addEventListener('toggle', function(){ detailsOpen = d.open; });
    d.appendChild(el('summary', null, tr('choose')));
    var ul = el('ul');
    items.forEach(function(it){
      var li = el('li'), sp = el('span', null, it.title() + (saved[it.url] !== undefined ? '  ·  ' + fmt(saved[it.url]) : ''));
      var b = el('button', null, saved[it.url] !== undefined ? tr('remove') : tr('save')); b.type = 'button'; b.disabled = busy;
      b.addEventListener('click', function(){ if(saved[it.url] !== undefined) removeOne(it).then(function(){ msg = ''; render(); }); else run([it]); });
      if(saved[it.url] !== undefined){ sp.textContent = '✓ ' + sp.textContent; }
      li.appendChild(sp); li.appendChild(b); ul.appendChild(li);
    });
    d.appendChild(ul); box.appendChild(d);
    box.appendChild(el('div', 'zl-off-msg', progress || msg));
    box.setAttribute('aria-busy', busy ? 'true' : 'false');
  }
  render();
  readSaved().then(render);
  var prev = window.ZF_rerenderCollection;
  window.ZF_rerenderCollection = function(){ if(typeof prev === 'function') prev.apply(this, arguments); render(); };
})();
