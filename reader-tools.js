/* reader-tools.js (v47)
   1) Padhne ke options: A- / A+ (text size) and line spacing on every ghazal / nazm card. Remembered.
   2) "Ye bhi padhein": 3 similar poems after each poem (data: related-data.js).
   3) Sleep timer: chips on the Audio page; the timer itself runs on every page (localStorage 'zf-sleep-end'). */
(function(){
  if(window.__zfRT) return; window.__zfRT = true;
  var doc = document, root = doc.documentElement;
  function lang(){ return (window.ZF_LANG === 'en' || window.ZF_LANG === 'ur') ? window.ZF_LANG : 'hi'; }
  function T(o){ return o[lang()] || o.hi; }
  function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k, v){ try{ if(v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} }

  /* ---------- styles ---------- */
  var css =
  'html .card.manuscript .verse{zoom:var(--zf-ps,1)}' +
  'html[data-zf-ls="1"] .card.manuscript .verse{line-height:1.6}' +
  'html[data-zf-ls="3"] .card.manuscript .verse{line-height:2.7}' +
  'html[data-zf-ls="1"] body.lang-ur .card.manuscript .verse{line-height:2}' +
  'html[data-zf-ls="3"] body.lang-ur .card.manuscript .verse{line-height:3.2}' +
  '.zf-rt{display:flex;justify-content:flex-end;align-items:center;gap:.4rem;max-width:840px;margin:0 auto .6rem;padding:0 .2rem}' +
  '.zf-rt button{font:inherit;cursor:pointer;min-width:38px;height:34px;padding:0 .6rem;border-radius:999px;border:1px solid rgba(var(--zf-rgb),.35);background:transparent;color:var(--gold-soft);font-size:.85rem;line-height:1;display:inline-flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent}' +
  '.zf-rt button:hover,.zf-rt button:focus-visible{background:rgba(var(--zf-rgb),.12);border-color:var(--gold)}' +
  '.zf-rt button[disabled]{opacity:.35;cursor:default}' +
  '.zf-rt .zf-rt-a{font-family:"Lora",serif}.zf-rt .zf-rt-ap{font-size:1.05rem}.zf-rt svg{width:17px;height:17px}' +
  '.zf-rel{max-width:840px;margin:1.6rem auto 0;padding:0 .2rem}' +
  '.zf-rel h3{font-size:.8rem;letter-spacing:.22em;text-transform:uppercase;color:var(--rose);font-family:"Lora",serif;font-weight:600;margin-bottom:.7rem;text-align:center}' +
  'body:not(.lang-en) .zf-rel h3{letter-spacing:.04em;text-transform:none;font-size:1rem}' +
  '.zf-rel a{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.85rem 1.1rem;margin-bottom:.6rem;border:1px solid rgba(var(--zf-rgb),.22);border-left:3px solid var(--gold);background:rgba(var(--zf-rgb),.05);color:var(--text-light);text-decoration:none;border-radius:2px;line-height:1.5}' +
  '.zf-rel a:hover{background:rgba(var(--zf-rgb),.11)}' +
  '.zf-rel .zf-rel-k{display:block;font-size:.68rem;letter-spacing:.18em;text-transform:uppercase;color:var(--text-muted);font-family:"Lora",serif}' +
  'body:not(.lang-en) .zf-rel .zf-rel-k{letter-spacing:.03em;text-transform:none}' +
  '.zf-rel .zf-rel-t{display:block;font-size:1.02rem}' +
  '.zf-rel .zf-rel-go{flex:none;color:var(--text-muted)}' +
  /* sleep timer chips */
  '.zf-sleep{max-width:760px;margin:1rem auto 0;padding:0 6vw;text-align:center}' +
  '.zf-sleep-lab{display:block;font-size:.9rem;color:var(--text-muted);margin-bottom:.5rem}' +
  '.zf-sleep button{font:inherit;cursor:pointer;margin:.15rem;padding:.4rem .95rem;min-height:38px;border-radius:999px;border:1px solid rgba(var(--zf-rgb),.4);background:transparent;color:var(--gold-soft);font-size:.9rem}' +
  '.zf-sleep button.on{background:var(--gold-soft);color:var(--ink);border-color:var(--gold-soft);font-weight:700}' +
  '.zf-sleep-left{display:block;margin-top:.4rem;font-size:.85rem;color:var(--text-muted);min-height:1.2em}';
  var st = doc.createElement('style'); st.id = 'zf-rt-css'; st.textContent = css; (doc.head || root).appendChild(st);

  /* ---------- 1) reading options ---------- */
  var SCALES = [.88, .94, 1, 1.1, 1.22, 1.36];
  function getSi(){ var v = parseInt(lsGet('zf-read-size'), 10); return (v >= 0 && v < SCALES.length) ? v : 2; }
  function getLs(){ var v = parseInt(lsGet('zf-read-ls'), 10); return (v >= 1 && v <= 3) ? v : 2; }
  function applyRead(){
    var si = getSi(), ls = getLs();
    if(si === 2) root.style.removeProperty('--zf-ps'); else root.style.setProperty('--zf-ps', String(SCALES[si]));
    if(ls === 2) root.removeAttribute('data-zf-ls'); else root.setAttribute('data-zf-ls', String(ls));
  }
  applyRead();
  var LBL = {
    sm:{hi:'अक्षर छोटे करें',en:'Smaller text',ur:'حروف چھوٹے کریں'},
    lg:{hi:'अक्षर बड़े करें',en:'Larger text',ur:'حروف بڑے کریں'},
    sp:{hi:'पंक्तियों के बीच जगह बदलें',en:'Change line spacing',ur:'سطروں کا فاصلہ بدلیں'}
  };
  var SPACE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h12M8 12h12M8 20h12M4 7V4M4 20v-3M4 4l-1.6 1.8M4 4l1.6 1.8M4 20l-1.6-1.8M4 20l1.6-1.8"/></svg>';
  function buildBar(){
    var bar = doc.createElement('div'); bar.className = 'zf-rt'; bar.setAttribute('role', 'group');
    bar.innerHTML = '<button type="button" class="zf-rt-a" data-k="sm"><span>A</span><small>−</small></button>' +
                    '<button type="button" class="zf-rt-a zf-rt-ap" data-k="lg"><span>A</span><small>+</small></button>' +
                    '<button type="button" data-k="sp">' + SPACE + '</button>';
    function paint(){
      var l = lang();
      [].forEach.call(bar.querySelectorAll('button'), function(b){ var t = LBL[b.getAttribute('data-k')][l]; b.setAttribute('aria-label', t); b.title = t; });
      bar.querySelector('[data-k="sm"]').disabled = getSi() === 0;
      bar.querySelector('[data-k="lg"]').disabled = getSi() === SCALES.length - 1;
    }
    bar.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('button'); if(!b || b.disabled) return;
      var k = b.getAttribute('data-k');
      if(k === 'sm') lsSet('zf-read-size', String(Math.max(0, getSi() - 1)));
      else if(k === 'lg') lsSet('zf-read-size', String(Math.min(SCALES.length - 1, getSi() + 1)));
      else lsSet('zf-read-ls', String(getLs() === 3 ? 1 : getLs() + 1));
      applyRead();
      [].forEach.call(doc.querySelectorAll('.zf-rt'), function(x){ if(x._paint) x._paint(); });
    });
    bar._paint = paint; paint(); return bar;
  }

  /* ---------- 2) related poems ---------- */
  var REL = null, relLoading = false;
  function loadRel(cb){
    if(window.ZF_REL){ REL = window.ZF_REL; return cb(); }
    if(relLoading) return; relLoading = true;
    var s = doc.createElement('script'); s.src = 'related-data.js?v=1';
    s.onload = function(){ REL = window.ZF_REL; cb(); }; (doc.head || root).appendChild(s);
  }
  function urT(s){ return (typeof window.ZF_UR_transliterateText === 'function') ? window.ZF_UR_transliterateText(s) : s; }
  function relHtml(id){
    var list = REL && REL[id]; if(!list || !list.length) return '';
    var l = lang(), h = '';
    list.forEach(function(r){
      var nz = /^nazm/.test(r[0]), num = r[0].replace(/\D/g, '');
      var base = nz ? (l === 'en' ? 'nazms-en.html' : (l === 'ur' ? 'nazms-ur.html' : 'nazms.html'))
                    : (l === 'en' ? 'ghazals-en.html' : (l === 'ur' ? 'ghazals-ur.html' : 'ghazals.html'));
      var kind = nz ? T({hi:'नज़्म',en:'Nazm',ur:'نظم'}) : T({hi:'ग़ज़ल',en:'Ghazal',ur:'غزل'});
      var title = l === 'en' ? (r[2] || r[1]) : (l === 'ur' ? urT(r[1]) : r[1]);
      var arrow = l === 'ur' ? '←' : '→';
      h += '<a href="' + base + '#' + r[0] + '"><span><span class="zf-rel-k">' + kind + ' · #' + num + '</span><span class="zf-rel-t">' + title.replace(/</g, '&lt;') + '</span></span><span class="zf-rel-go">' + arrow + '</span></a>';
    });
    return '<h3>' + T({hi:'ये भी पढ़ें',en:'You may also like',ur:'یہ بھی پڑھیں'}) + '</h3>' + h;
  }

  /* ---------- scan: add bar + related to every poem card ---------- */
  var busy = false;
  function scan(){
    if(busy) return; busy = true;
    try{
      var cards = doc.querySelectorAll('.card.manuscript[id]');
      [].forEach.call(cards, function(c){
        var par = c.parentNode;
        if(!par.querySelector(':scope > .zf-rt')){ par.insertBefore(buildBar(), par.querySelector(':scope > .card.manuscript[id]')); }
      });
      /* related: once per container, after the last poem/meanings card */
      var seen = [];
      [].forEach.call(cards, function(c){
        var par = c.parentNode; if(seen.indexOf(par) !== -1) return; seen.push(par);
        var first = par.querySelector(':scope > .card.manuscript[id]'); var id = first.id;
        var old = par.querySelector(':scope > .zf-rel');
        if(old && old.getAttribute('data-k') === lang() + ':' + id) return;
        if(old) old.remove();
        loadRel(function(){
          var html = relHtml(id); if(!html) return;
          var w = doc.createElement('div'); w.className = 'zf-rel'; w.setAttribute('data-k', lang() + ':' + id); w.innerHTML = html;
          var anchor = first, n = first.nextElementSibling;
          while(n && (n.classList.contains('manuscript') || n.classList.contains('zf-meanings'))){ anchor = n; n = n.nextElementSibling; }
          anchor.parentNode.insertBefore(w, anchor.nextSibling);
        });
      });
    }catch(e){}
    busy = false;
  }
  function init(){
    scan();
    if(window.MutationObserver){
      var t = null;
      new MutationObserver(function(muts){
        for(var i = 0; i < muts.length; i++){ var m = muts[i]; if(m.target && m.target.closest && m.target.closest('.zf-rt, .zf-rel')) continue; clearTimeout(t); t = setTimeout(scan, 80); break; }
      }).observe(doc.body, {childList:true, subtree:true});
    }
    doc.addEventListener('click', function(e){ if(e.target.closest && e.target.closest('.lang-opt, .zf-sc')) setTimeout(function(){ scan(); [].forEach.call(doc.querySelectorAll('.zf-rt'), function(x){ if(x._paint) x._paint(); }); }, 400); });
  }

  /* ---------- 3) sleep timer ---------- */
  var KEY = 'zf-sleep-end', tick = null;
  function endAt(){ var v = parseInt(lsGet(KEY), 10); return v > Date.now() - 1000 ? v : 0; }
  function stopAll(){
    [].forEach.call(doc.querySelectorAll('audio'), function(a){ try{ a.pause(); a.volume = 1; }catch(e){} });
    try{ window.dispatchEvent(new CustomEvent('zf-sleep')); }catch(e){}
  }
  function fmt(ms){ var s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60); s = s % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function sleepLoop(){
    var e = endAt(), left = e - Date.now();
    var el = doc.querySelector('.zf-sleep-left');
    if(!e){ if(tick){ clearInterval(tick); tick = null; } if(el) el.textContent = ''; return; }
    if(left <= 0){ lsSet(KEY, null); stopAll(); if(tick){ clearInterval(tick); tick = null; } paintChips(); if(el) el.textContent = ''; return; }
    if(left < 10000){ var v = Math.max(0, left / 10000); [].forEach.call(doc.querySelectorAll('audio'), function(a){ try{ if(!a.paused) a.volume = v; }catch(x){} }); }
    if(el) el.textContent = T({hi:'बंद होने में: ',en:'Stops in ',ur:'بند ہونے میں: '}) + fmt(left);
  }
  function startLoop(){ if(!tick) tick = setInterval(sleepLoop, 1000); sleepLoop(); }
  function paintChips(){
    var box = doc.querySelector('.zf-sleep'); if(!box) return;
    var e = endAt(), sel = box.getAttribute('data-sel') || '0';
    [].forEach.call(box.querySelectorAll('button'), function(b){ b.classList.toggle('on', e ? b.getAttribute('data-m') === sel : b.getAttribute('data-m') === '0'); });
  }
  function buildSleep(){
    if(doc.querySelector('.zf-sleep')) return;
    var anchor = doc.querySelector('.audio-list') || doc.querySelector('.audio-cards'); if(!anchor) return;
    var box = doc.createElement('div'); box.className = 'zf-sleep';
    function render(){
      var l = lang();
      box.innerHTML = '<span class="zf-sleep-lab">' + T({hi:'नींद टाइमर — इतनी देर बाद ऑडियो अपने आप बंद हो जाएगा',en:'Sleep timer — audio stops by itself after',ur:'نیند ٹائمر — اتنی دیر بعد آڈیو خود بند ہو جائے گا'}) + '</span>' +
        '<button type="button" data-m="0">' + T({hi:'बंद',en:'Off',ur:'بند'}) + '</button>' +
        [15, 30, 60].map(function(m){ return '<button type="button" data-m="' + m + '">' + m + ' ' + T({hi:'मिनट',en:'min',ur:'منٹ'}) + '</button>'; }).join('') +
        '<span class="zf-sleep-left" aria-live="polite"></span>';
      paintChips(); sleepLoop();
    }
    box.addEventListener('click', function(ev){
      var b = ev.target.closest && ev.target.closest('button[data-m]'); if(!b) return;
      var m = parseInt(b.getAttribute('data-m'), 10);
      [].forEach.call(doc.querySelectorAll('audio'), function(a){ try{ a.volume = 1; }catch(e){} });
      if(!m){ lsSet(KEY, null); box.setAttribute('data-sel', '0'); }
      else { lsSet(KEY, String(Date.now() + m * 60000)); box.setAttribute('data-sel', String(m)); startLoop(); }
      paintChips(); sleepLoop();
    });
    anchor.parentNode.insertBefore(box, anchor);
    render();
    doc.addEventListener('click', function(e){ if(e.target.closest && e.target.closest('.lang-opt')) setTimeout(render, 350); });
  }

  function boot(){ init(); buildSleep(); if(endAt()) startLoop(); }
  if(doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
