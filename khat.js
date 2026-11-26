/* khat.js (v72) — KHAT: send a sher as a LETTER.
   Compose: pick a sher (random, by mood, or by searching), write who it is for / from and a few lines, choose a paper -> a link.
   View (the link): a sealed envelope; tap it and it opens, the letter slides out, the sher is read in the reader's own script, with the meanings of its hard words.
   EVERYTHING travels inside the link, after the "#" — the part of an address that is never sent to any server. Nothing is stored anywhere.
   Link:  khat.html#k=<url-safe base64 of {v:1, s:'g4.2' | t:[lines], to, f, m, p, d}>   (s = ghazal 4, sher 3; p = paper 0/1/2; d = date written)
   New letter with a sher already chosen:  khat.html#new=g4.2   (or  #new=t<base64 of the lines>), used by the "Send as a letter" button on the photo card.
   Safety: every text from the link is shown with textContent only (no HTML, no clickable links) and cut to a fixed length; a sher id that does not exist shows a friendly error. */
(function(){
  var root = document.getElementById('kh-root'); if(!root) return;
  var G = (typeof GHAZAL_ITEMS !== 'undefined') ? GHAZAL_ITEMS : [], Z = (typeof NAZM_ITEMS !== 'undefined') ? NAZM_ITEMS : [];
  var MOODS = window.ZF_MOODS || [], MOOD = window.ZF_MOOD || {};
  var li = function(){ var l = window.ZF_LANG; return l === 'en' ? 1 : (l === 'ur' ? 2 : 0); };
  function tr(o){ return o[li()]; }
  function urT(s){ try{ return typeof window.ZF_UR_transliterateText === 'function' ? window.ZF_UR_transliterateText(s) : s; }catch(e){ return s; } }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  var LIM = {to: 40, f: 40, m: 280};
  function clean(s, n){ return String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F<>]/g, ' ').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').trim().slice(0, n); }
  function enc(o){ return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function dec(b){ b = String(b).replace(/-/g, '+').replace(/_/g, '/'); while(b.length % 4) b += '='; return JSON.parse(decodeURIComponent(escape(atob(b)))); }
  function linesOf(h){ var out = [], re = /<span class="line"[^>]*>([\s\S]*?)<\/span>/g, m; while((m = re.exec(h))){ out.push(m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").trim()); } return out; }

  var T = {
    title: ['ख़त', 'Khat — a sher as a letter', 'خط'],
    intro: ['अपना पसंदीदा शेर चुनिए, दो पंक्तियाँ लिखिए, और उसे एक ख़त की तरह लिफ़ाफ़े में बंद करके किसी अपने को भेज दीजिए। खोलने वाले के सामने लिफ़ाफ़ा खुलेगा, और शेर के मुश्किल लफ़्ज़ों के मायने भी मिलेंगे।',
            'Pick a sher you love, write a few lines, and seal it in an envelope for someone dear. When they open the link the envelope opens, and the meanings of the hard words are there too.',
            'اپنا پسندیدہ شعر چنیے، دو سطریں لکھیے، اور اسے خط کی طرح لفافے میں بند کر کے کسی اپنے کو بھیج دیجیے۔ کھولنے والے کے سامنے لفافہ کھلے گا، اور شعر کے مشکل لفظوں کے معنی بھی ملیں گے۔'],
    s1: ['१. शेर चुनिए', '1. Choose the sher', '۱۔ شعر چنیے'], other: ['दूसरा शेर', 'Another sher', 'دوسرا شعر'], search: ['शेर या लफ़्ज़ खोजिए…', 'Search a sher or word…', 'شعر یا لفظ تلاش کیجیے…'],
    byMood: ['मूड से', 'By mood', 'موڈ سے'], s2: ['२. ख़त लिखिए', '2. Write the letter', '۲۔ خط لکھیے'],
    to: ['किसके नाम', 'For (name)', 'کس کے نام'], from: ['आपका नाम (चाहें तो)', 'Your name (optional)', 'آپ کا نام (چاہیں تو)'], msg: ['दो पंक्तियाँ (चाहें तो)', 'A few lines (optional)', 'چند سطریں (چاہیں تو)'],
    paper: ['काग़ज़', 'Paper', 'کاغذ'], p0: ['पुराना काग़ज़', 'Old paper', 'پرانا کاغذ'], p1: ['रात', 'Night', 'رات'], p2: ['गुलाबी', 'Rose', 'گلابی'],
    make: ['लिंक बनाइए', 'Make the link', 'لنک بنائیے'], copy: ['लिंक कॉपी करें', 'Copy link', 'لنک کاپی کریں'], share: ['भेजिए', 'Send', 'بھیجیے'], see: ['खोलकर देखिए', 'Open it', 'کھول کر دیکھیے'], copied: ['कॉपी हो गया ✓', 'Copied ✓', 'کاپی ہو گیا ✓'],
    private: ['आपका लिखा सिर्फ़ इस लिंक के अंदर रहता है — हमारे सर्वर पर कुछ नहीं जाता।', 'What you write stays inside this link — nothing is sent to our server.', 'آپ کا لکھا صرف اس لنک کے اندر رہتا ہے — ہمارے سرور پر کچھ نہیں جاتا۔'],
    preview: ['ऐसा दिखेगा', 'Preview', 'ایسا دکھے گا'], tap: ['खोलने के लिए छुइए', 'Tap to open', 'کھولنے کے لیے چھوئیے'],
    dear: ['प्रिय {n},', 'Dear {n},', '{n} کے نام،'], dearX: ['प्रिय दोस्त,', 'Dear friend,', 'پیارے دوست،'], to2: ['के नाम', 'To', 'کے نام'],
    meanings: ['मायने', 'Meanings', 'معنی'], readFull: ['पूरी ग़ज़ल पढ़ें', 'Read the full ghazal', 'پوری غزل پڑھیں'], photo: ['फ़ोटो कार्ड', 'Photo card', 'فوٹو کارڈ'], writeOwn: ['अपना ख़त लिखिए', 'Write your own letter', 'اپنا خط لکھیے'],
    again: ['फिर से खोलिए', 'Open again', 'پھر سے کھولیے'], note: ['यह ख़त किसी ने इस लिंक से बनाया है; शेर ज़ान फ़रज़ान का है।', 'This letter was made by someone with this link; the sher is Zaan Farzaan’s.', 'یہ خط کسی نے اس لنک سے بنایا ہے؛ شعر زان فرزان کا ہے۔'],
    bad: ['यह ख़त खुल नहीं पाया — लिंक अधूरा या टूटा हुआ लगता है।', 'This letter could not be opened — the link looks incomplete or broken.', 'یہ خط کھل نہیں سکا — لنک ادھورا یا ٹوٹا ہوا لگتا ہے۔'],
    ghazal: ['ग़ज़ल', 'Ghazal', 'غزل'], shareText: ['आपके लिए एक ख़त है ✉', 'There is a letter for you ✉', 'آپ کے لیے ایک خط ہے ✉'], from2: ['से', 'From', 'کی طرف سے'],
    none: ['कुछ नहीं मिला', 'Nothing found', 'کچھ نہیں ملا']
  };
  var MONTHS = {hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ur: ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر']};
  function dateText(d){ var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); if(!m) return ''; var L = ['hi', 'en', 'ur'][li()]; return (+m[3]) + ' ' + MONTHS[L][+m[2] - 1] + ' ' + m[1]; }
  function today(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  /* ---------- a sher: by id (g4.2) or by its lines ---------- */
  var SPEC = /^([gn])(\d{1,3})\.(\d{1,3})$/;
  function resolve(s, t){
    if(s){
      var m = SPEC.exec(String(s)); if(!m) return null;
      var items = m[1] === 'g' ? G : Z, item = items.filter(function(x){ return x.num === +m[2]; })[0], i = +m[3];
      if(!item || !item.versesHtml[i]) return null;
      var hi = linesOf(item.versesHtml[i]), en = item.versesHtmlEn && item.versesHtmlEn[i] ? linesOf(item.versesHtmlEn[i]) : hi;
      if(m[1] === 'n' && item.versesHtml[i + 1]){ hi = hi.concat(linesOf(item.versesHtml[i + 1])); en = en.concat(item.versesHtmlEn && item.versesHtmlEn[i + 1] ? linesOf(item.versesHtmlEn[i + 1]) : linesOf(item.versesHtml[i + 1])); }
      return {id: item.id, num: item.num, kind: m[1] === 'g' ? 'ghazal' : 'nazm', spec: String(s), hi: hi, en: en, mood: m[1] === 'g' ? (MOOD[item.num] || '').charAt(i) : ''};
    }
    if(t && t.length){ var tt = t.slice(0, 4).map(function(x){ return clean(x, 90); }).filter(Boolean); if(tt.length) return {id: null, hi: tt, en: tt, text: tt}; }
    return null;
  }
  function linesFor(sh){ var l = li(); if(sh.text) return sh.text; if(l === 1) return sh.en; if(l === 2) return sh.hi.map(urT); return sh.hi; }
  function allShers(){ var out = []; G.forEach(function(g){ g.versesHtml.forEach(function(h, i){ out.push('g' + g.num + '.' + i); }); }); return out; }
  var POOL = allShers();
  function randomSher(mood){
    var pool = POOL; if(mood){ pool = POOL.filter(function(s){ var m = SPEC.exec(s); return (MOOD[+m[2]] || '').charAt(+m[3]) === mood; }); if(!pool.length) pool = POOL; }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ---------- style ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.kh-page{box-sizing:border-box;width:100%;min-width:0;max-width:760px;margin:0 auto;padding:.6rem 5vw 4rem;text-align:center}.kh-page h1{margin:.4rem 0 .6rem}.kh-intro{color:var(--text-muted);line-height:1.8;margin:0 auto 1.4rem;max-width:34rem}' +
    '.kh-sec{text-align:start;margin:1.4rem 0}.kh-sec h2{font-size:1.05rem;color:var(--gold-soft);margin:0 0 .7rem}.lang-ur .kh-sec,.lang-ur .kh-sec h2{text-align:start}' +
    '.kh-row{display:flex;flex-wrap:wrap;gap:.55rem;align-items:center;margin:.5rem 0}.kh-btn{font:inherit;font-size:.95rem;line-height:1.4;padding:.55rem 1.15rem;border-radius:999px;border:1px solid rgba(var(--zf-rgb),.5);background:rgba(var(--zf-rgb),.07);color:var(--text-light);cursor:pointer;min-height:44px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}' +
    '.kh-btn:hover{background:rgba(var(--zf-rgb),.15);border-color:var(--gold)}.kh-btn.go{background:var(--gold-soft);color:var(--ink);border-color:var(--gold-soft);font-weight:600}.kh-btn:disabled{opacity:.5}.kh-btn:focus-visible,.kh-in:focus-visible{outline:2px solid var(--gold);outline-offset:2px}' +
    '.kh-in{width:100%;box-sizing:border-box;font:inherit;font-size:1rem;padding:.65rem .8rem;border-radius:8px;border:1px solid rgba(var(--zf-rgb),.4);background:var(--ink-deep,#0c0c0c);color:var(--text-light);margin:.25rem 0 .7rem}textarea.kh-in{min-height:96px;resize:vertical;line-height:1.6}' +
    '.kh-lab{display:block;font-size:.82rem;color:var(--text-muted)}.kh-count{font-size:.74rem;color:var(--text-muted);text-align:end;margin:-.5rem 0 .6rem}' +
    '.kh-chip{font:inherit;font-size:.86rem;padding:.35rem .9rem;border-radius:999px;border:1px solid rgba(var(--zf-rgb),.4);background:transparent;color:var(--text-light);cursor:pointer;min-height:38px}.kh-chip[aria-pressed="true"]{background:var(--gold-soft);color:var(--ink);border-color:var(--gold-soft)}' +
    '.kh-found{display:grid;gap:.45rem;margin:.3rem 0 .6rem}.kh-found button{font:inherit;text-align:start;padding:.55rem .8rem;border-radius:8px;border:1px solid rgba(var(--zf-rgb),.3);background:rgba(var(--zf-rgb),.05);color:var(--text-light);cursor:pointer;line-height:1.6}.kh-found button:hover{border-color:var(--gold)}' +
    '.kh-link{display:flex;gap:.5rem;flex-wrap:wrap;margin:.6rem 0}.kh-link input{flex:1 1 220px;min-width:0;margin:0;direction:ltr;font-size:.82rem}' +
    /* paper */
    '.kh-paper{--pp:#f3ead6;--pk:#4a3a26;--pa:#8e2a2a;position:relative;background:var(--pp);color:var(--pk);border-radius:6px;padding:2.1rem 1.6rem 1.6rem;margin:1rem auto;max-width:520px;box-shadow:0 14px 34px rgba(0,0,0,.28),inset 0 0 60px rgba(120,90,40,.12);text-align:center;' +
      'background-image:repeating-linear-gradient(0deg,transparent 0 31px,rgba(120,90,40,.10) 31px 32px)}' +
    '.kh-paper.p1{--pp:#14182a;--pk:#e8d9a8;--pa:#d9b45a;background-image:radial-gradient(circle at 20% 15%,rgba(255,255,255,.06) 0 1px,transparent 2px),radial-gradient(circle at 70% 60%,rgba(255,255,255,.05) 0 1px,transparent 2px);background-size:90px 90px}' +
    '.kh-paper.p2{--pp:#f8e3e6;--pk:#5a2a3a;--pa:#a23a58}' +
    '.kh-date{position:absolute;top:.7rem;inset-inline-end:1rem;font-size:.74rem;opacity:.7;letter-spacing:.04em}.kh-dear{text-align:start;font-size:1.15rem;margin:.2rem 0 .9rem;font-family:"Cormorant Garamond","Lora",Georgia,serif;font-style:italic}.lang-hi .kh-dear,.lang-ur .kh-dear{font-style:normal}' +
    '.kh-m{text-align:start;white-space:pre-wrap;word-break:break-word;line-height:1.85;font-size:1.02rem;margin:0 0 1.1rem}' +
    '.kh-sher{margin:1.1rem 0;padding:1rem .4rem;border-top:1px solid rgba(var(--zf-rgb),.0);position:relative}.kh-sher:before,.kh-sher:after{content:"\u2766";display:block;font-size:1rem;opacity:.55;color:var(--pa)}.kh-sher:before{margin-bottom:.5rem}.kh-sher:after{margin-top:.5rem}' +
    '.kh-sher div{font-size:1.35rem;line-height:1.75;text-wrap:balance}.kh-sher.rtl{direction:rtl}.kh-sher.rtl div{line-height:2.1;font-size:1.45rem}' +
    '.kh-mean{font-size:.84rem;line-height:1.7;opacity:.82;margin:.2rem 0 .6rem;border-top:1px dashed rgba(120,90,40,.35);padding-top:.5rem}.kh-mean:empty{display:none}.kh-sign{text-align:end;font-style:italic;margin-top:.8rem;font-size:1.05rem}' +
    '.kh-src{font-size:.8rem;opacity:.75;margin-top:.3rem}.kh-src a{color:inherit}.kh-note{font-size:.72rem;opacity:.6;margin-top:1rem;line-height:1.5}' +
    /* envelope */
    '.kh-stage{position:relative;max-width:420px;margin:1.5rem auto 1rem;perspective:1100px}.kh-env{position:relative;width:100%;aspect-ratio:1.5;cursor:pointer;transition:transform .8s ease,opacity .6s ease}' +
    '.kh-env *{pointer-events:none}.kh-envb{position:absolute;inset:0;background:#cdb88c;border-radius:6px;box-shadow:0 18px 40px rgba(0,0,0,.35)}.kh-envf{position:absolute;inset:0;border-radius:6px;overflow:hidden;clip-path:polygon(0 0,50% 58%,100% 0,100% 100%,0 100%);background:#d9c7a1}' +
    '.kh-envf:before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.18),rgba(0,0,0,.08))}' +
    '.kh-flap{position:absolute;left:0;right:0;top:0;height:58%;background:#c3ab7c;clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:top center;transition:transform .8s ease;border-radius:6px 6px 0 0;z-index:3}' +
    '.kh-env.open .kh-flap{transform:rotateX(180deg);z-index:0}.kh-ltr{position:absolute;left:7%;right:7%;top:8%;height:80%;background:#f6eed9;border-radius:4px;transform:translateY(0);transition:transform .8s ease .45s;box-shadow:0 2px 8px rgba(0,0,0,.2)}.kh-env.open .kh-ltr{transform:translateY(-46%)}' +
    '.kh-seal{position:absolute;left:50%;top:50%;width:66px;height:66px;margin:-33px 0 0 -33px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#c0453f,#8e2a2a 62%,#6d1d1d);color:#f3d7a0;display:flex;align-items:center;justify-content:center;font:700 1.15rem/1 "Playfair Display",Georgia,serif;letter-spacing:.04em;box-shadow:0 4px 10px rgba(0,0,0,.4),inset 0 0 0 3px rgba(243,215,160,.28);z-index:4;transition:transform .45s ease,opacity .45s ease}' +
    '.kh-env.open .kh-seal{transform:scale(1.6) rotate(25deg);opacity:0}' +
    '.kh-addr{position:absolute;left:50%;top:64%;transform:translateX(-50%);width:70%;text-align:center;color:#4a3a26;font-size:1.05rem;font-style:italic;font-family:"Cormorant Garamond","Lora",Georgia,serif;z-index:2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.kh-stamp{position:absolute;top:10%;inset-inline-end:7%;width:44px;height:54px;border:2px dashed #8e2a2a;color:#8e2a2a;display:flex;align-items:center;justify-content:center;font:700 .8rem "Playfair Display",Georgia,serif;transform:rotate(4deg);z-index:2;background:rgba(255,255,255,.18)}' +
    '.kh-pm{white-space:pre-line;position:absolute;top:8%;inset-inline-end:17%;width:62px;height:62px;border:2px solid rgba(74,58,38,.45);border-radius:50%;color:rgba(74,58,38,.55);font-size:.5rem;text-align:center;display:flex;align-items:center;justify-content:center;line-height:1.25;transform:rotate(-12deg);z-index:2}' +
    '.kh-env.gone{opacity:0;transform:translateY(40px) scale(.96);pointer-events:none}.kh-hint{color:var(--text-muted);font-size:.9rem;margin-top:.6rem;animation:khPulse 2s ease-in-out infinite}@keyframes khPulse{50%{opacity:.45}}' +
    '.kh-paper.enter{animation:khRise .8s ease both}@keyframes khRise{from{opacity:0;transform:translateY(60px) scale(.9)}to{opacity:1;transform:none}}' +
    '@media (prefers-reduced-motion:reduce){.kh-env,.kh-flap,.kh-ltr,.kh-seal,.kh-paper.enter{transition:none !important;animation:none !important}.kh-hint{animation:none}}';
  document.head.appendChild(css);

  /* ---------- the letter paper (used by the preview and by the opened letter) ---------- */
  function paperEl(d, sh, withMeanings){
    var p = el('article', 'kh-paper p' + (d.p || 0)); p.setAttribute('dir', li() === 2 ? 'rtl' : 'ltr');
    var dt = dateText(d.d); if(dt) p.appendChild(el('div', 'kh-date', dt));
    p.appendChild(el('div', 'kh-dear', d.to ? tr(T.dear).replace('{n}', d.to) : tr(T.dearX)));
    if(d.m) p.appendChild(el('p', 'kh-m', d.m));
    var box = el('div', 'kh-sher' + (li() === 2 && !sh.text ? ' rtl' : '')); linesFor(sh).forEach(function(s){ box.appendChild(el('div', null, s)); }); p.appendChild(box);
    var mean = el('div', 'kh-mean'); p.appendChild(mean);
    if(withMeanings && typeof window.ZF_meaningsFor === 'function'){ window.ZF_meaningsFor(sh.hi, {max: 3}, function(list){ window.ZF_meaningText(list).forEach(function(t){ mean.appendChild(el('div', null, t)); }); }); }
    if(d.f) p.appendChild(el('div', 'kh-sign', '\u2014 ' + d.f));
    if(sh.id){ var src = el('div', 'kh-src'); src.appendChild(document.createTextNode('\u2014 Zaan Farzaan \u00B7 ')); var a = el('a', null, tr(T[sh.kind || 'ghazal']) + ' ' + sh.num); a.href = sh.id + '.html'; src.appendChild(a); p.appendChild(src); }
    return p;
  }

  /* ---------- VIEW: the envelope and the opened letter ---------- */
  var opened = false;
  function renderView(d){
    root.textContent = '';
    var sh = resolve(d.s, d.t); if(!sh){ return renderBad(); }
    var h = el('h1', null, tr(T.title)); h.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)'; root.appendChild(h);
    var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var stage = el('div', 'kh-stage'), holder = el('div');
    function showLetter(animate){
      var p = paperEl(d, sh, true); if(animate) p.classList.add('enter');
      holder.textContent = ''; holder.appendChild(p);
      var row = el('div', 'kh-row'); row.style.justifyContent = 'center';
      if(sh.id){ var rf = el('a', 'kh-btn', tr(T.readFull)); rf.href = sh.id + '.html'; row.appendChild(rf); }
      var ph = el('button', 'kh-btn', tr(T.photo)); ph.type = 'button'; ph.addEventListener('click', function(){ if(typeof window.ZF_openPhotoCard === 'function') window.ZF_openPhotoCard([linesFor(sh)], {src: [sh.hi], sher: sh.spec ? [{g: sh.num, i: +SPEC.exec(sh.spec)[3], n: SPEC.exec(sh.spec)[1] === 'n' ? 1 : 0}] : undefined}); }); row.appendChild(ph);
      var wo = el('a', 'kh-btn go', tr(T.writeOwn)); wo.href = 'khat.html'; row.appendChild(wo);
      holder.appendChild(row); holder.appendChild(el('p', 'kh-note', tr(T.note)));
      var rp = el('button', 'kh-btn', tr(T.again)); rp.type = 'button'; rp.style.marginTop = '.4rem'; rp.addEventListener('click', function(){ opened = false; renderView(d); }); holder.appendChild(rp);
    }
    if(opened || calm){ opened = true; root.appendChild(holder); showLetter(false); return; }
    var env = el('div', 'kh-env'); env.setAttribute('role', 'button'); env.tabIndex = 0; env.setAttribute('aria-label', tr(T.tap));
    env.appendChild(el('div', 'kh-envb')); env.appendChild(el('div', 'kh-ltr')); env.appendChild(el('div', 'kh-envf')); env.appendChild(el('div', 'kh-flap'));
    env.appendChild(el('div', 'kh-addr', (d.to ? d.to : tr(T.dearX).replace(/[,،]$/, '')))); env.appendChild(el('div', 'kh-stamp', 'ZF'));
    env.appendChild(el('div', 'kh-pm', 'ZAAN FARZAAN\n' + (dateText(d.d) || '')));
    env.appendChild(el('div', 'kh-seal', 'ZF'));
    stage.appendChild(env); root.appendChild(stage); root.appendChild(el('p', 'kh-hint', tr(T.tap))); root.appendChild(holder);
    function open(){
      if(opened) return; opened = true; env.classList.add('open'); root.querySelector('.kh-hint').style.display = 'none';
      setTimeout(function(){ env.classList.add('gone'); showLetter(true); setTimeout(function(){ stage.style.display = 'none'; holder.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 650); }, 1450);
    }
    env.addEventListener('click', open); env.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
  }
  function renderBad(){
    root.textContent = ''; root.appendChild(el('p', 'kh-intro', tr(T.bad)));
    var a = el('a', 'kh-btn go', tr(T.writeOwn)); a.href = 'khat.html'; var r = el('div', 'kh-row'); r.style.justifyContent = 'center'; r.appendChild(a); root.appendChild(r);
  }

  /* ---------- COMPOSE ---------- */
  var st = {s: null, t: null, to: '', f: '', m: '', p: 0, mood: ''};
  function composeInit(pre){
    if(pre && pre.s && resolve(pre.s)) st.s = pre.s; else if(pre && pre.t && resolve(null, pre.t)) st.t = pre.t; else st.s = randomSher('');
  }
  function curSher(){ return st.s ? resolve(st.s) : resolve(null, st.t); }
  var found = [], linkText = '';
  function renderCompose(){
    var keepFocus = document.activeElement && root.contains(document.activeElement) ? document.activeElement.id : '';
    root.textContent = '';
    root.appendChild(el('h1', null, tr(T.title))); root.appendChild(el('p', 'kh-intro', tr(T.intro)));
    /* 1. the sher */
    var s1 = el('section', 'kh-sec'); s1.appendChild(el('h2', null, tr(T.s1)));
    var sh = curSher(); var box = el('div', 'kh-sher' + (li() === 2 && !sh.text ? ' rtl' : '')); box.style.textAlign = 'center'; linesFor(sh).forEach(function(s){ box.appendChild(el('div', null, s)); }); s1.appendChild(box);
    var row = el('div', 'kh-row'); row.style.justifyContent = 'center';
    var ob = el('button', 'kh-btn', '\u21BB ' + tr(T.other)); ob.type = 'button'; ob.addEventListener('click', function(){ st.s = randomSher(st.mood); st.t = null; linkText = ''; renderCompose(); }); row.appendChild(ob); s1.appendChild(row);
    var mrow = el('div', 'kh-row'); mrow.style.justifyContent = 'center';
    MOODS.forEach(function(m){ var c = el('button', 'kh-chip', m[li() === 1 ? 2 : (li() === 2 ? 3 : 1)]); c.type = 'button'; c.setAttribute('aria-pressed', st.mood === m[0] ? 'true' : 'false');
      c.addEventListener('click', function(){ st.mood = st.mood === m[0] ? '' : m[0]; if(st.mood){ st.s = randomSher(st.mood); st.t = null; } linkText = ''; renderCompose(); }); mrow.appendChild(c); });
    s1.appendChild(mrow);
    var q = el('input', 'kh-in'); q.type = 'search'; q.id = 'kh-q'; q.placeholder = tr(T.search); q.setAttribute('aria-label', tr(T.search)); q.autocomplete = 'off'; q.style.marginTop = '.8rem'; s1.appendChild(q);
    var fl = el('div', 'kh-found'); s1.appendChild(fl);
    function showFound(){ fl.textContent = ''; found.forEach(function(f){ var b = el('button', null); b.type = 'button'; f.lines.forEach(function(x){ b.appendChild(el('div', null, x)); }); b.addEventListener('click', function(){ st.s = f.spec; st.t = null; found = []; linkText = ''; renderCompose(); }); fl.appendChild(b); }); }
    var tm = null;
    q.addEventListener('input', function(){ clearTimeout(tm); tm = setTimeout(function(){ doSearch(q.value, function(){ showFound(); }); }, 250); });
    showFound(); root.appendChild(s1);
    /* 2. the letter */
    var s2 = el('section', 'kh-sec'); s2.appendChild(el('h2', null, tr(T.s2)));
    function field(label, key, max, multi){
      var l = el('label', 'kh-lab', label); l.setAttribute('for', 'kh-' + key); s2.appendChild(l);
      var f = multi ? el('textarea', 'kh-in') : el('input', 'kh-in'); f.id = 'kh-' + key; if(!multi) f.type = 'text'; f.maxLength = max; f.value = st[key]; f.autocomplete = 'off';
      var cnt = multi ? el('div', 'kh-count', st[key].length + ' / ' + max) : null;
      f.addEventListener('input', function(){ st[key] = clean(f.value, max); linkText = ''; if(cnt) cnt.textContent = f.value.length + ' / ' + max; updatePreview(); });
      s2.appendChild(f); if(cnt) s2.appendChild(cnt);
    }
    field(tr(T.to), 'to', LIM.to); field(tr(T.from), 'f', LIM.f); field(tr(T.msg), 'm', LIM.m, true);
    s2.appendChild(el('span', 'kh-lab', tr(T.paper)));
    var pr = el('div', 'kh-row'); [0, 1, 2].forEach(function(n){ var c = el('button', 'kh-chip', tr(T['p' + n])); c.type = 'button'; c.setAttribute('aria-pressed', st.p === n ? 'true' : 'false'); c.addEventListener('click', function(){ st.p = n; linkText = ''; [].forEach.call(pr.children, function(x, i){ x.setAttribute('aria-pressed', i === n ? 'true' : 'false'); }); updatePreview(); }); pr.appendChild(c); });
    s2.appendChild(pr); root.appendChild(s2);
    /* preview + link */
    var sp = el('section', 'kh-sec'); sp.appendChild(el('h2', null, tr(T.preview))); var pv = el('div'); pv.id = 'kh-pv'; sp.appendChild(pv); root.appendChild(sp);
    function updatePreview(){ var d = {to: st.to, f: st.f, m: st.m, p: st.p, d: today()}, s = curSher(); d.s = st.s; var pvEl = document.getElementById('kh-pv'); if(!pvEl) return; pvEl.textContent = ''; pvEl.appendChild(paperEl(d, s, false)); }
    updatePreview();
    var s3 = el('section', 'kh-sec'); s3.style.textAlign = 'center';
    var make = el('button', 'kh-btn go', '\u2709 ' + tr(T.make)); make.type = 'button'; make.id = 'kh-make'; s3.appendChild(make);
    var out = el('div'); s3.appendChild(out);
    function showLink(){
      out.textContent = ''; if(!linkText) return;
      var lk = el('div', 'kh-link'), inp = el('input', 'kh-in'); inp.readOnly = true; inp.value = linkText; inp.id = 'kh-linkv'; inp.setAttribute('aria-label', 'link'); lk.appendChild(inp); out.appendChild(lk);
      var r = el('div', 'kh-row'); r.style.justifyContent = 'center';
      var cp = el('button', 'kh-btn', tr(T.copy)); cp.type = 'button'; cp.addEventListener('click', function(){ var ok = function(){ cp.textContent = tr(T.copied); }; if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(linkText).then(ok, function(){ inp.select(); try{ document.execCommand('copy'); ok(); }catch(e){} }); } else { inp.select(); try{ document.execCommand('copy'); ok(); }catch(e){} } }); r.appendChild(cp);
      if(navigator.share){ var sb = el('button', 'kh-btn', tr(T.share)); sb.type = 'button'; sb.addEventListener('click', function(){ navigator.share({text: tr(T.shareText), url: linkText}).catch(function(){}); }); r.appendChild(sb); }
      var op = el('a', 'kh-btn', tr(T.see)); op.href = linkText; op.target = '_blank'; op.rel = 'noopener'; r.appendChild(op);
      out.appendChild(r);
    }
    make.addEventListener('click', function(){
      var d = {v: 1, to: clean(st.to, LIM.to), f: clean(st.f, LIM.f), m: clean(st.m, LIM.m), p: st.p, d: today()};
      if(st.s) d.s = st.s; else d.t = st.t;
      Object.keys(d).forEach(function(k){ if(d[k] === '' ) delete d[k]; });
      linkText = location.origin + location.pathname.replace(/[^\/]*$/, '') + 'khat.html#k=' + enc(d); showLink();
      var f = document.getElementById('kh-linkv'); if(f) f.scrollIntoView({block: 'center', behavior: 'smooth'});
    });
    showLink();
    root.appendChild(s3); root.appendChild(el('p', 'kh-note', tr(T.private)));
    if(keepFocus){ var f2 = document.getElementById(keepFocus); if(f2 && f2.focus) try{ f2.focus({preventScroll: true}); }catch(e){} }
  }
  /* search: any word or sher (zf-find.js, loaded the first time) */
  function doSearch(text, cb){
    text = String(text || '').trim(); if(text.length < 2){ found = []; cb(); return; }
    function run(){
      var P = window.ZFS.parse(text), out = [];
      for(var a = 0; a < G.length && out.length < 6; a++){
        var m = window.ZFS.match(G[a], P); if(!m) continue;
        m.verses.slice(0, 2).forEach(function(i){ if(out.length < 6) out.push({spec: 'g' + G[a].num + '.' + i, lines: linesFor({hi: linesOf(G[a].versesHtml[i]), en: G[a].versesHtmlEn && G[a].versesHtmlEn[i] ? linesOf(G[a].versesHtmlEn[i]) : linesOf(G[a].versesHtml[i])})}); });
      }
      found = out; cb();
    }
    if(window.ZFS) run(); else { var s = document.createElement('script'); s.src = 'zf-find.js?v=2'; s.onload = run; s.onerror = function(){ found = []; cb(); }; document.head.appendChild(s); }
  }

  /* ---------- start ---------- */
  var viewData = null;
  function boot(){
    var h = location.hash || '';
    if(/^#k=/.test(h)){
      try{ var d = dec(h.slice(3)); viewData = {s: d.s && typeof d.s === 'string' ? d.s : null, t: Array.isArray(d.t) ? d.t.slice(0, 4).map(function(x){ return clean(x, 90); }) : null,
        to: clean(d.to, LIM.to), f: clean(d.f, LIM.f), m: clean(d.m, LIM.m), p: (d.p === 1 || d.p === 2) ? d.p : 0, d: /^\d{4}-\d{2}-\d{2}$/.test(d.d || '') ? d.d : ''};
        if(!viewData.s && !(viewData.t && viewData.t.length)) throw 0; }
      catch(e){ viewData = null; renderBad(); return; }
      renderView(viewData); return;
    }
    var pre = null, m = /^#new=(.+)$/.exec(h);
    if(m){ var v = m[1]; if(v.charAt(0) === 't'){ try{ pre = {t: dec(v.slice(1))}; }catch(e){} } else pre = {s: v}; }
    composeInit(pre); renderCompose();
  }
  window.addEventListener('hashchange', function(){ opened = false; boot(); });
  boot();
  var prev = window.ZF_rerenderCollection;
  window.ZF_rerenderCollection = function(){ if(typeof prev === 'function') prev.apply(this, arguments); if(viewData) renderView(viewData); else renderCompose(); };
})();
