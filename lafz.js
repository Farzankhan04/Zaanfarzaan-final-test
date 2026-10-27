/* lafz.js — "Lafz-o-Matlab" (Beta): tap an underlined hard word in a ghazal/nazm to see its meaning. Works in Hindi, English and Urdu. */
(function(){
  'use strict';
  var D = window.ZF_LAFZ; if(!D || !D.length) return;
  var NUK = /़/g, APOS = /['’ʼʻ]/g;
  function nh(s){ return s.normalize('NFD').replace(NUK,'').replace(APOS,'').normalize('NFC').replace(/ँ/g,'ं'); }
  function nr(s){ return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,''); }
  function nu(s){ return s.replace(/[ً-ٰٟـ‌‍‎‏۔ۀ]/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/ہ/g,'ہ').replace(/ۂ/g,'ہ'); }
  var HI = {}, EN = {}, UR = null;
  D.forEach(function(e,i){ e.k.forEach(function(k){ HI[nh(k)] = i; }); (e.r||[]).forEach(function(r){ if(!(r in EN)) EN[r] = i; }); });
  function lang(){ return window.ZF_LANG || 'hi'; }
  function buildUr(){
    UR = {}; var t = window.ZF_UR_transliterateText; if(!t) return;
    D.forEach(function(e,i){ e.k.forEach(function(k){ try{ var u = nu(t(k)); if(u) UR[u] = i; }catch(x){} }); });
  }
  /* CSS */
  var st = document.createElement('style');
  st.textContent = '.lz{border-bottom:1.5px dotted currentColor;cursor:pointer;-webkit-tap-highlight-color:transparent}'+
    '.lz:hover{opacity:.75}'+
    '.lz-hint{margin-top:.7rem;font-size:.78rem;opacity:.62;text-align:center}'+
    '.lz-hint b,.lz-pop .lz-beta{font-weight:700;font-size:.62rem;letter-spacing:.08em;padding:.08rem .38rem;border:1px solid currentColor;border-radius:.6rem;vertical-align:middle;opacity:.85}'+
    '.lz-pop{position:absolute;z-index:9999;max-width:min(82vw,300px);min-width:180px;background:#111;color:#f0f0ec;border:1px solid #3a3a38;border-radius:12px;padding:.7rem .85rem .6rem;box-shadow:0 10px 30px rgba(0,0,0,.45);font-size:.95rem;line-height:1.5;text-align:start;animation:lzIn .16s ease-out}'+
    '@keyframes lzIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}'+
    '.lz-pop .lz-w{font-weight:700;font-size:1.05rem;margin-bottom:.2rem;display:flex;gap:.5rem;align-items:center;justify-content:space-between}'+
    '.lz-pop .lz-m{margin:.1rem 0}.lz-pop .lz-e{opacity:.72;font-size:.85rem}'+
    '.lz-pop .lz-f{margin-top:.45rem;font-size:.74rem;opacity:.7}.lz-pop .lz-f a{color:inherit;text-decoration:underline}'+
    '.lz-pop .lz-x{background:none;border:0;color:inherit;font-size:1.05rem;cursor:pointer;opacity:.6;padding:0 .1rem;line-height:1}'+
    '@media(prefers-reduced-motion:reduce){.lz-pop{animation:none}}';
  document.head.appendChild(st);

  function matchIdx(tok, l){
    if(l === 'en') return EN[nr(tok)];
    if(l === 'ur'){ if(!UR) buildUr(); return UR[nu(tok)]; }
    return HI[nh(tok)];
  }
  var TOK = { hi: /[ऀ-ॿ'’ʼ]+/g, en: /[A-Za-z'’]+/g, ur: /[؀-ۿ‌]+/g };

  function wrapNode(tn, l){
    var txt = tn.nodeValue, re = new RegExp(TOK[l].source, 'g'), m, last = 0, frag = null;
    while((m = re.exec(txt))){
      var idx = matchIdx(m[0], l);
      if(idx === undefined) continue;
      if(!frag) frag = document.createDocumentFragment();
      if(m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
      var s = document.createElement('span'); s.className = 'lz'; s.setAttribute('data-lz', idx); s.setAttribute('role','button'); s.setAttribute('tabindex','0');
      s.textContent = m[0]; frag.appendChild(s); last = m.index + m[0].length;
    }
    if(frag){ if(last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last))); tn.parentNode.replaceChild(frag, tn); return true; }
    return false;
  }
  function scan(){
    var l = lang(), els = document.querySelectorAll('.card.manuscript .line, .card.manuscript .nazm-line, .poem-detail .line, .poem-detail .nazm-line'), cards = [];
    for(var i = 0; i < els.length; i++){
      var el = els[i], tx = el.textContent, sc = /[\u0900-\u097F]/.test(tx) ? 'hi' : /[\u0600-\u06FF]/.test(tx) ? 'ur' : 'en';
      if(el.getAttribute('data-lz-done') === sc) continue;
      el.setAttribute('data-lz-done', sc);
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), nodes = [], n;
      while((n = w.nextNode())) if(!n.parentNode.classList || !n.parentNode.classList.contains('lz')) nodes.push(n);
      nodes.forEach(function(t){ wrapNode(t, sc); });
      var c = el.closest('.card.manuscript') || el.closest('.poem-detail'); if(c && cards.indexOf(c) < 0) cards.push(c);
    }
    cards.forEach(function(c){
      if(c.querySelector('.lz') && !c.querySelector('.lz-hint')){
        var h = document.createElement('div'); h.className = 'lz-hint';
        var L = lang();
        h.innerHTML = (L === 'en' ? 'Tap an underlined word for its meaning' : L === 'ur' ? 'خط کشیدہ لفظ پر ٹیپ کریں، مطلب دیکھیں' : 'रेखांकित शब्द पर टैप करें, मतलब देखें') + ' <b>BETA</b>';
        c.appendChild(h);
      }
    });
  }

  var pop = null;
  function close(){ if(pop){ pop.remove(); pop = null; } }
  function urT(s){ try{ return window.ZF_UR_transliterateText ? window.ZF_UR_transliterateText(s) : s; }catch(e){ return s; } }
  function open(span){
    close();
    var e = D[+span.getAttribute('data-lz')], L = lang(), p = document.createElement('div');
    p.className = 'lz-pop'; p.setAttribute('role','dialog');
    var main, sub;
    if(L === 'en'){ main = e.e; sub = e.h; }
    else if(L === 'ur'){ main = urT(e.h); sub = e.e; }
    else { main = e.h; sub = e.e; }
    var fb = L === 'en' ? 'feedback-en.html' : L === 'ur' ? 'feedback-ur.html' : 'feedback.html';
    var wrong = L === 'en' ? 'Looks wrong? Tell me' : L === 'ur' ? 'غلط لگا؟ بتائیں' : 'ग़लत लगा? बताएँ';
    p.innerHTML = '<div class="lz-w"><span></span><span><span class="lz-beta">BETA</span> <button class="lz-x" aria-label="close">×</button></span></div><div class="lz-m"></div>' + (L === 'en' ? '' : '<div class="lz-e"></div>') + '<div class="lz-f"><a href="' + fb + '"></a></div>';
    p.querySelector('.lz-w span').textContent = span.textContent;
    p.querySelector('.lz-m').textContent = main;
    var se = p.querySelector('.lz-e'); if(se) se.textContent = sub;
    p.querySelector('.lz-f a').textContent = wrong;
    if(L === 'ur'){ p.setAttribute('dir','rtl'); p.style.fontFamily = getComputedStyle(span).fontFamily; }
    document.body.appendChild(p); pop = p;
    var r = span.getBoundingClientRect(), sx = window.pageXOffset, sy = window.pageYOffset, pw = p.offsetWidth, ph = p.offsetHeight;
    var left = r.left + sx + r.width / 2 - pw / 2; left = Math.max(sx + 8, Math.min(left, sx + document.documentElement.clientWidth - pw - 8));
    var top = r.bottom + sy + 8; if(r.bottom + ph + 16 > window.innerHeight && r.top > ph + 16) top = r.top + sy - ph - 8;
    p.style.left = left + 'px'; p.style.top = top + 'px';
    p.querySelector('.lz-x').addEventListener('click', close);
  }
  document.addEventListener('click', function(ev){
    var s = ev.target.closest && ev.target.closest('.lz');
    if(s){ ev.preventDefault(); ev.stopPropagation(); open(s); return; }
    if(pop && !ev.target.closest('.lz-pop')) close();
  }, true);
  document.addEventListener('keydown', function(ev){
    if(ev.key === 'Escape') close();
    if((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('lz')){ ev.preventDefault(); open(ev.target); }
  });
  window.addEventListener('scroll', function(){ if(pop) close(); }, {passive:true});

  var t = null;
  function sched(){ clearTimeout(t); t = setTimeout(function(){ try{ scan(); }catch(e){} }, 60); }
  new MutationObserver(sched).observe(document.body, {childList:true, subtree:true});
  scan();
})();
