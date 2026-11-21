/* lafz-quiz.js (v67) — "Lafz ki parakh": a quiz and flashcards on the Explore page, built from the Lafz-o-Matlab glossary (lafz-data.js, ~635 words).
   - Quiz: 10 words, pick the meaning out of 4. After each answer the reader sees a real sher by Zaan Farzaan that uses the word (found live in ghazals-data / nazms-data).
   - Flashcards: word on the front, meaning + a sher on the back; "Knew it" / "Again".
   - What the reader knows is kept on the device only: zf-lafz-known (list of words), zf-lafz-best (best quiz score) — both are part of the Backup & Restore card.
   The glossary and the search helper (zf-find.js) are loaded only when the reader presses Start, so the Explore page stays light. */
(function(){
  var page = document.body && document.body.getAttribute('data-page');
  if(page !== 'play') return;
  var main = document.getElementById('main-content'); if(!main) return;

  var KNOWN = 'zf-lafz-known', BEST = 'zf-lafz-best', QN = 10;
  var lang = function(){ var l = window.ZF_LANG; return (l === 'en' || l === 'ur') ? l : 'hi'; };
  var T = {
    k:      {hi: 'खेल · लफ़्ज़', en: 'Game · Words', ur: 'کھیل · لفظ'},
    title:  {hi: 'लफ़्ज़ की परख', en: 'Test your Urdu words', ur: 'لفظ کی پرکھ'},
    sub:    {hi: 'ग़ज़लों और नज़्मों में आए उर्दू के {n} लफ़्ज़ — मतलब पहचानिए, और हर जवाब के बाद उसी लफ़्ज़ का असली शेर पढ़िए।',
             en: '{n} Urdu words from the ghazals and nazms — guess the meaning, then read a real sher that uses the word.',
             ur: 'غزلوں اور نظموں میں آئے اردو کے {n} لفظ — معنی پہچانیے، اور ہر جواب کے بعد اسی لفظ کا اصل شعر پڑھیے۔'},
    know:   {hi: 'आप जानते हैं: ', en: 'You know: ', ur: 'آپ جانتے ہیں: '},
    best:   {hi: 'सबसे अच्छा स्कोर: ', en: 'Best score: ', ur: 'بہترین اسکور: '},
    start:  {hi: 'क्विज़ शुरू करें (10 लफ़्ज़)', en: 'Start quiz (10 words)', ur: 'کوئز شروع کریں (10 لفظ)'},
    flash:  {hi: 'फ़्लैशकार्ड', en: 'Flashcards', ur: 'فلیش کارڈ'},
    loading:{hi: 'लोड हो रहा है…', en: 'Loading…', ur: 'لوڈ ہو رہا ہے…'},
    fail:   {hi: 'अभी लोड नहीं हो सका। इंटरनेट देखकर दोबारा कोशिश कीजिए।', en: 'Could not load right now. Check your connection and try again.', ur: 'ابھی لوڈ نہیں ہو سکا۔ انٹرنیٹ دیکھ کر دوبارہ کوشش کیجیے۔'},
    q:      {hi: 'इसका मतलब क्या है?', en: 'What does it mean?', ur: 'اس کا مطلب کیا ہے؟'},
    right:  {hi: 'सही ✓', en: 'Correct ✓', ur: 'درست ✓'},
    wrong:  {hi: 'सही जवाब: ', en: 'Answer: ', ur: 'صحیح جواب: '},
    next:   {hi: 'आगे →', en: 'Next →', ur: 'آگے ←'},
    finish: {hi: 'नतीजा देखें', en: 'See result', ur: 'نتیجہ دیکھیں'},
    score:  {hi: 'आपका स्कोर', en: 'Your score', ur: 'آپ کا اسکور'},
    again:  {hi: 'फिर खेलिए', en: 'Play again', ur: 'پھر کھیلیے'},
    share:  {hi: 'नतीजा शेयर करें', en: 'Share result', ur: 'نتیجہ شیئر کریں'},
    back:   {hi: '← वापस', en: '← Back', ur: 'واپس →'},
    flip:   {hi: 'पलटने के लिए टैप कीजिए', en: 'Tap to flip', ur: 'پلٹنے کے لیے ٹیپ کیجیے'},
    knew:   {hi: 'जानता था ✓', en: 'Knew it ✓', ur: 'جانتا تھا ✓'},
    redo:   {hi: 'फिर से ↻', en: 'Again ↻', ur: 'پھر سے ↻'},
    reset:  {hi: 'प्रगति मिटाएँ', en: 'Reset progress', ur: 'پیش رفت مٹائیں'},
    sher:   {hi: 'ज़ान फ़रज़ान के शेर में', en: 'In a sher by Zaan Farzaan', ur: 'زان فرزان کے شعر میں'},
    read:   {hi: 'पूरी रचना पढ़ें', en: 'Read the full piece', ur: 'پوری تخلیق پڑھیں'},
    copied: {hi: 'कॉपी हो गया ✓', en: 'Copied ✓', ur: 'کاپی ہو گیا ✓'},
    done:   {hi: 'वाह! सारे लफ़्ज़ आपको आ गए। प्रगति मिटाकर फिर से शुरू कर सकते हैं।', en: 'Wow — you know every word. You can reset your progress and go again.', ur: 'واہ! سارے لفظ آپ کو آ گئے۔ پیش رفت مٹا کر پھر شروع کر سکتے ہیں۔'}
  };
  function tr(k, n){ return T[k][lang()].replace('{n}', n == null ? '' : n); }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; if(cls && cls.indexOf('zl-count') === 0) e.setAttribute('dir', 'ltr'); return e; }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function urT(s){ try{ return typeof window.ZF_UR_transliterateText === 'function' ? window.ZF_UR_transliterateText(s) : s; }catch(e){ return s; } }

  /* ---- device storage ---- */
  function getKnown(){ try{ var a = JSON.parse(localStorage.getItem(KNOWN) || '[]'); return Array.isArray(a) ? a : []; }catch(e){ return []; } }
  function setKnown(a){ try{ localStorage.setItem(KNOWN, JSON.stringify(a.slice(0, 1500))); }catch(e){} }
  function markKnown(id){ var a = getKnown(); if(a.indexOf(id) < 0){ a.push(id); setKnown(a); } }
  function getBest(){ var n = parseInt(localStorage.getItem(BEST) || '0', 10); return isFinite(n) ? n : 0; }
  function setBest(n){ try{ if(n > getBest()) localStorage.setItem(BEST, String(n)); }catch(e){} }

  /* ---- section ---- */
  var css = document.createElement('style');
  css.textContent =
    '.zf-lafz{max-width:760px;margin:0 auto 2.2rem;padding:0 6vw;text-align:center}' +
    '.zf-lafz .zf-k{font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--rose)}.lang-hi .zf-lafz .zf-k,.lang-ur .zf-lafz .zf-k{letter-spacing:.02em;text-transform:none;font-size:.85rem}' +
    '.zf-lafz h2{margin:.35rem 0 .6rem}.zf-lafz .zl-sub{color:var(--text-muted);font-size:.95rem;line-height:1.7;margin:0 0 1rem}' +
    '.zl-bar{height:6px;border-radius:6px;background:rgba(var(--zf-rgb),.18);overflow:hidden;max-width:360px;margin:.4rem auto .5rem}.zl-bar i{display:block;height:100%;background:var(--gold-soft);border-radius:6px}' +
    '.zl-stat{font-size:.85rem;color:var(--text-muted);margin:.2rem 0 1.1rem}' +
    '.zl-row{display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center}' +
    '.zl-btn{font:inherit;font-size:.95rem;line-height:1.4;padding:.62rem 1.2rem;border-radius:999px;border:1px solid rgba(var(--zf-rgb),.5);background:rgba(var(--zf-rgb),.07);color:var(--text-light);cursor:pointer;min-height:44px;transition:background .2s,border-color .2s}' +
    '.zl-btn:hover{background:rgba(var(--zf-rgb),.15);border-color:var(--gold)}.zl-btn.go{background:var(--gold-soft);color:var(--ink);border-color:var(--gold-soft)}.zl-btn:disabled{opacity:.45;cursor:default}' +
    '.zl-btn:focus-visible,.zl-card:focus-visible,.zl-opt:focus-visible{outline:2px solid var(--gold);outline-offset:3px}' +
    '.zl-link{background:none;border:0;padding:.3rem;font:inherit;font-size:.85rem;color:var(--text-muted);text-decoration:underline;text-underline-offset:3px;cursor:pointer}' +
    '.zl-word{font-size:2.3rem;line-height:1.5;margin:.3rem 0 .1rem}.zl-rom{font-size:1rem;color:var(--text-muted);letter-spacing:.04em}.zl-q{font-size:.9rem;color:var(--text-muted);margin:.7rem 0 .9rem}' +
    '.zl-opts{display:grid;gap:.55rem;max-width:460px;margin:0 auto}' +
    '.zl-opt{font:inherit;font-size:1rem;line-height:1.5;padding:.7rem 1rem;border-radius:8px;border:1px solid rgba(var(--zf-rgb),.4);background:rgba(var(--zf-rgb),.05);color:var(--text-light);cursor:pointer;min-height:46px;text-align:center}' +
    '.zl-opt:hover:not(:disabled){background:rgba(var(--zf-rgb),.14)}.zl-opt.ok{background:rgba(88,150,98,.3);border-color:#6fae7a}.zl-opt.no{background:rgba(190,80,80,.25);border-color:#c36a6a}.zl-opt:disabled{cursor:default}' +
    '.zl-card{display:block;width:100%;max-width:460px;margin:.4rem auto 1rem;padding:1.6rem 1.2rem;min-height:190px;border-radius:10px;border:1px solid rgba(var(--zf-rgb),.4);background:rgba(var(--zf-rgb),.06);color:var(--text-light);font:inherit;cursor:pointer;text-align:center}' +
    '.zl-card .zl-mean{font-size:1.25rem;line-height:1.6;margin:.4rem 0}.zl-hint{font-size:.8rem;color:var(--text-muted);margin-top:.9rem}' +
    '.zl-sher{max-width:460px;margin:1.1rem auto 0;padding:.2rem .9rem;border-inline-start:2px solid rgba(var(--zf-rgb),.4);text-align:start}' +
    '.zl-sher .zl-sk{font-size:.72rem;color:var(--text-muted);margin:.3rem 0}.zl-sher .zl-ln{font-size:1rem;line-height:1.8}.zl-sher a{font-size:.82rem;color:var(--gold-soft);text-decoration:underline;text-underline-offset:3px}' +
    '.zl-sher mark.zf-hit{background:rgba(var(--zf-rgb),.3)}' +
    '.zl-count{font-size:.82rem;color:var(--text-muted);margin:.2rem 0 .6rem}.zl-score{font-size:2.6rem;margin:.3rem 0}' +
    '.zf-lafz.rtl .zl-sher{text-align:start}';
  document.head.appendChild(css);

  var box = el('section', 'zf-game zf-lafz'); box.id = 'zf-lafz'; box.setAttribute('aria-labelledby', 'zl-title');
  var anchor = document.getElementById('zf-badges') || document.getElementById('zf-favs');
  if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor); else main.appendChild(box);

  /* ---- data ---- */
  var LAFZ = null, loadState = 'idle', mode = 'menu', QS = null, qi = 0, score = 0, answered = null, deck = null, di = 0, flipped = false, example = {};
  function loadScript(src, cb){ var s = document.createElement('script'); s.src = src; s.onload = function(){ cb(true); }; s.onerror = function(){ cb(false); }; document.head.appendChild(s); }
  function ensureData(cb){
    if(LAFZ && window.ZFS) return cb(true);
    loadState = 'loading'; render();
    var need = [];
    if(!window.ZF_LAFZ) need.push('lafz-data.js?v=1');
    if(!window.ZFS) need.push('zf-find.js?v=2');
    var left = need.length, ok = true;
    function one(g){ ok = ok && g; if(--left <= 0) finish(); }
    function finish(){ if(ok && window.ZF_LAFZ){ LAFZ = window.ZF_LAFZ.filter(function(e){ return e && e.k && e.k.length && e.r && e.r.length && (e.h || e.e); }); loadState = 'ready'; cb(true); } else { loadState = 'fail'; render(); cb(false); } }
    if(!left) finish(); else need.forEach(function(s){ loadScript(s, one); });
  }
  function id(e){ return e.r[0]; }
  function meaning(e){ var l = lang(); return l === 'en' ? (e.e || e.h) : (l === 'ur' ? urT(e.h || e.e) : (e.h || e.e)); }
  function wordMain(e){ var l = lang(); return l === 'en' ? e.r[0] : (l === 'ur' ? urT(e.k[0]) : e.k[0]); }
  function wordSub(e){ var l = lang(); return l === 'hi' ? e.r[0] : (l === 'en' ? e.k[0] : e.r[0]); }

  /* a real sher that uses the word (whole word, ignoring nukta / apostrophes) — looked up only when needed, then remembered */
  function findSher(e){
    var key = id(e); if(example[key] !== undefined) return example[key];
    var keys = e.k.map(function(k){ return window.ZFS.norm(k); }).filter(Boolean), found = null;
    var items = [];
    try{ if(typeof GHAZAL_ITEMS !== 'undefined') items = items.concat(GHAZAL_ITEMS); }catch(x){}
    try{ if(typeof NAZM_ITEMS !== 'undefined') items = items.concat(NAZM_ITEMS); }catch(x){}
    for(var a = 0; a < items.length && !found; a++){
      var c = window.ZFS.cache(items[a]);
      for(var i = 0; i < c.verses.length && !found; i++){
        var hay = ' ' + c.verses[i].N.hi + ' ';
        for(var j = 0; j < keys.length; j++){ if(hay.indexOf(' ' + keys[j] + ' ') >= 0){ found = {item: items[a], c: c, i: i, k: keys[j]}; break; } }
      }
    }
    example[key] = found; return found;
  }
  function sherBlock(e){
    var f = findSher(e); if(!f) return null;
    var l = lang(), L = f.c.verses[f.i].L, lines = (l === 'en' && L.en.length) ? L.en : (l === 'ur' && L.ur.length ? L.ur : L.hi);
    var wrap = el('div', 'zl-sher'); wrap.setAttribute('dir', l === 'ur' ? 'rtl' : 'ltr');
    wrap.appendChild(el('div', 'zl-sk', tr('sher')));
    lines.forEach(function(t){ var d = el('div', 'zl-ln'); if(lines === L.hi) d.innerHTML = window.ZFS.highlightHtml(t, [f.k]); else d.textContent = t; wrap.appendChild(d); });
    var a = el('a', null, tr('read') + ' →'); a.href = f.item.id + '.html'; wrap.appendChild(a);
    return wrap;
  }

  /* ---- quiz ---- */
  function startQuiz(){
    var known = getKnown(), pool = LAFZ.filter(function(e){ return known.indexOf(id(e)) < 0; });
    if(pool.length < QN) pool = LAFZ.slice();
    QS = shuffle(pool).slice(0, QN).map(function(e){
      var ans = meaning(e), firstW = function(s){ return String(s).split(/[\s,;(]+/).filter(Boolean)[0]; }, seen = {}, others = [];
      seen[ans] = 1; seen[firstW(ans)] = 1;
      shuffle(LAFZ).forEach(function(o){
        if(others.length >= 3 || o === e) return; var m = meaning(o), f = firstW(m);
        if(!m || seen[m] || seen[f]) return; seen[m] = 1; seen[f] = 1; others.push(m);
      });
      return {e: e, ans: ans, opts: shuffle([ans].concat(others))};
    });
    qi = 0; score = 0; answered = null; mode = 'quiz'; render();
  }
  function startFlash(){
    var known = getKnown(), unk = shuffle(LAFZ.filter(function(e){ return known.indexOf(id(e)) < 0; })), kn = shuffle(LAFZ.filter(function(e){ return known.indexOf(id(e)) >= 0; }));
    deck = unk.concat(kn); di = 0; flipped = false; mode = 'flash'; render();
  }

  /* ---- render ---- */
  function render(){
    box.textContent = ''; box.classList.toggle('rtl', lang() === 'ur'); box.setAttribute('dir', lang() === 'ur' ? 'rtl' : 'ltr');
    box.appendChild(el('div', 'zf-k', tr('k')));
    var h = el('h2', null, tr('title')); h.id = 'zl-title'; box.appendChild(h);
    if(loadState === 'loading'){ box.appendChild(el('p', 'zl-sub', tr('loading'))); return; }
    if(loadState === 'fail'){ box.appendChild(el('p', 'zl-sub', tr('fail'))); var b0 = el('button', 'zl-btn', tr('back')); b0.type = 'button'; b0.addEventListener('click', function(){ loadState = 'idle'; mode = 'menu'; render(); }); box.appendChild(b0); return; }
    if(mode === 'menu') return renderMenu();
    if(mode === 'quiz') return renderQuiz();
    if(mode === 'flash') return renderFlash();
  }
  function btn(label, cls, fn){ var b = el('button', 'zl-btn' + (cls ? ' ' + cls : ''), label); b.type = 'button'; b.addEventListener('click', fn); return b; }
  function renderMenu(){
    var total = LAFZ ? LAFZ.length : 635, kn = Math.min(getKnown().length, total), best = getBest();
    box.appendChild(el('p', 'zl-sub', tr('sub', total)));
    var bar = el('div', 'zl-bar'), fill = el('i'); fill.style.width = Math.round(100 * kn / total) + '%'; bar.appendChild(fill); box.appendChild(bar);
    box.appendChild(el('div', 'zl-stat', tr('know') + kn + ' / ' + total + (best ? '  ·  ' + tr('best') + best + '/' + QN : '')));
    var row = el('div', 'zl-row');
    row.appendChild(btn(tr('start'), 'go', function(){ ensureData(function(ok){ if(ok) startQuiz(); }); }));
    row.appendChild(btn(tr('flash'), '', function(){ ensureData(function(ok){ if(ok) startFlash(); }); }));
    box.appendChild(row);
  }
  function renderQuiz(){
    if(qi >= QN) return renderResult();
    var q = QS[qi];
    box.appendChild(el('div', 'zl-count', (qi + 1) + ' / ' + QN));
    box.appendChild(el('div', 'zl-word', wordMain(q.e)));
    box.appendChild(el('div', 'zl-rom', wordSub(q.e)));
    box.appendChild(el('div', 'zl-q', tr('q')));
    var opts = el('div', 'zl-opts');
    q.opts.forEach(function(m){
      var b = el('button', 'zl-opt', m); b.type = 'button';
      if(answered !== null){ b.disabled = true; if(m === q.ans) b.classList.add('ok'); else if(m === answered) b.classList.add('no'); }
      b.addEventListener('click', function(){
        if(answered !== null) return; answered = m;
        if(m === q.ans){ score++; markKnown(id(q.e)); }
        render();
      });
      opts.appendChild(b);
    });
    box.appendChild(opts);
    if(answered !== null){
      var verdict = el('div', 'zl-q', answered === q.ans ? tr('right') : tr('wrong') + q.ans); box.appendChild(verdict);
      var sb = sherBlock(q.e); if(sb) box.appendChild(sb);
      var row = el('div', 'zl-row'); row.style.marginTop = '1rem';
      row.appendChild(btn(qi + 1 >= QN ? tr('finish') : tr('next'), 'go', function(){ qi++; answered = null; render(); }));
      box.appendChild(row);
    }
  }
  function renderResult(){
    setBest(score);
    if(typeof window.ZF_stat === 'function') window.ZF_stat('quiz_done', score + '/' + QN);
    box.appendChild(el('div', 'zl-q', tr('score')));
    box.appendChild(el('div', 'zl-score', score + ' / ' + QN));
    var row = el('div', 'zl-row');
    row.appendChild(btn(tr('again'), 'go', startQuiz));
    var share = btn(tr('share'), '', function(){
      var url = location.origin + '/play.html', msg = {hi: 'मैंने ज़ान फ़रज़ान के लफ़्ज़ क्विज़ में ' + score + '/' + QN + ' लिए — आप भी आज़माइए: ', en: 'I scored ' + score + '/' + QN + ' on the Zaan Farzaan word quiz — try it: ', ur: 'میں نے زان فرزان کے لفظ کوئز میں ' + score + '/' + QN + ' لیے — آپ بھی آزمائیے: '}[lang()];
      if(navigator.share){ navigator.share({text: msg + url}).catch(function(){}); }
      else { try{ navigator.clipboard.writeText(msg + url); share.textContent = tr('copied'); }catch(x){} }
    });
    row.appendChild(share); row.appendChild(btn(tr('back'), '', function(){ mode = 'menu'; render(); }));
    box.appendChild(row);
  }
  function renderFlash(){
    var e = deck[di % deck.length], known = getKnown(), total = LAFZ.length;
    if(known.length >= total){ box.appendChild(el('p', 'zl-sub', tr('done'))); }
    box.appendChild(el('div', 'zl-count', (di + 1) + '  ·  ' + tr('know') + known.length + ' / ' + total));
    var card = el('button', 'zl-card'); card.type = 'button'; card.setAttribute('aria-label', tr('flip'));
    if(!flipped){ card.appendChild(el('div', 'zl-word', wordMain(e))); card.appendChild(el('div', 'zl-rom', wordSub(e))); card.appendChild(el('div', 'zl-hint', tr('flip'))); }
    else { card.appendChild(el('div', 'zl-rom', wordMain(e) + '  ·  ' + wordSub(e))); card.appendChild(el('div', 'zl-mean', meaning(e))); }
    card.addEventListener('click', function(){ flipped = !flipped; render(); });
    box.appendChild(card);
    if(flipped){ var sb = sherBlock(e); if(sb) box.appendChild(sb); }
    var row = el('div', 'zl-row'); row.style.marginTop = '1rem';
    row.appendChild(btn(tr('redo'), '', function(){ di++; flipped = false; render(); }));
    row.appendChild(btn(tr('knew'), 'go', function(){ markKnown(id(e)); di++; flipped = false; render(); }));
    box.appendChild(row);
    var foot = el('div', 'zl-row'); foot.style.marginTop = '.8rem';
    var back = el('button', 'zl-link', tr('back')); back.type = 'button'; back.addEventListener('click', function(){ mode = 'menu'; render(); });
    var rs = el('button', 'zl-link', tr('reset')); rs.type = 'button'; rs.addEventListener('click', function(){ setKnown([]); startFlash(); });
    foot.appendChild(back); foot.appendChild(rs); box.appendChild(foot);
  }

  render();
  var prev = window.ZF_rerenderCollection;
  window.ZF_rerenderCollection = function(){ if(typeof prev === 'function') prev.apply(this, arguments);
    if(mode === 'quiz'){ mode = 'menu'; answered = null; }      /* the options are written in one language, so a language change goes back to the menu */
    render(); };
})();
