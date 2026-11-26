/* explore-feed.js (v69) — EXPLORE: an Instagram-style discovery feed, made to be READ and LISTENED to.
   Top: the global search (search.js, same as the home page). Then mood "stories", filter chips and an endless feed that mixes
   · SHER CARDS — big readable sher on one of the night photos (tap, or the camera button, = make a photo card),
   · AUDIO CARDS — a proper player in the feed: big play button, title, seek bar and time (one audio at a time),
   · GHAZAL and NAZM CARDS — the opening couplet, a clear "Read" button, a heart to favourite, an audio badge when a recording exists.
   Phones get ONE large card per row (like the Instagram feed); tablets two; wide screens three.
   Everything comes from the data the site already has (ghazals-data.js, nazms-data.js, mood-data.js, ZF_AUDIOS in app.js), so new content shows up by itself.
   The order is shuffled on every visit and keeps loading as you scroll. Nothing is sent anywhere. */
(function(){
  var feed = document.getElementById('xf-feed'); if(!feed) return;
  var body = document.getElementById('xf-body'), storiesEl = document.getElementById('xf-stories'), chipsEl = document.getElementById('xf-chips'),
      sentinel = document.getElementById('xf-sentinel'), endEl = document.getElementById('xf-end'), input = document.getElementById('site-search-input');

  var G = (typeof GHAZAL_ITEMS !== 'undefined') ? GHAZAL_ITEMS : [], Z = (typeof NAZM_ITEMS !== 'undefined') ? NAZM_ITEMS : [];
  var MOODS = window.ZF_MOODS || [], MOOD = window.ZF_MOOD || {}, AUD = window.ZF_AUDIOS || [];
  var PHOTOS = ['sher-1.jpg', 'sher-2.jpg', 'sher-3.jpg', 'sher-4.jpg', 'sher-5.jpg'];
  var SLUG = {I: 'ishq', J: 'judai', T: 'tanhai', U: 'umeed', Z: 'zindagi'};
  var GAP = 16, BATCH = 8, FIRST = 10;

  var li = function(){ var l = window.ZF_LANG; return l === 'en' ? 1 : (l === 'ur' ? 2 : 0); };           /* 0 hi, 1 en, 2 ur */
  var suf = function(){ return ['', '-en', '-ur'][li()]; };
  function tr(o){ return o[li()]; }
  function urT(s){ try{ return typeof window.ZF_UR_transliterateText === 'function' ? window.ZF_UR_transliterateText(s) : s; }catch(e){ return s; } }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function mmss(t){ if(!isFinite(t) || t < 0) t = 0; t = Math.floor(t); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); }
  function linesOf(h){
    var out = [], re = /<span class="line"[^>]*>([\s\S]*?)<\/span>/g, m;
    while((m = re.exec(h))){ out.push(m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").trim()); }
    if(!out.length){ var d = document.createElement('div'); d.innerHTML = h; out = (d.textContent || '').split(/\n+/).map(function(x){ return x.trim(); }).filter(Boolean); }
    return out;
  }
  function sherLines(g, i){
    var l = li(), src = (l === 1 && g.versesHtmlEn && g.versesHtmlEn[i]) ? g.versesHtmlEn[i] : g.versesHtml[i], out = linesOf(src);
    return l === 2 ? out.map(urT) : out;
  }
  function gTitle(g){ var l = li(); return l === 1 ? (g.firstLineEn || g.firstLine) : (l === 2 ? urT(g.firstLine) : g.firstLine); }
  function zTitle(z){ var l = li(); return l === 1 ? (z.titleEn || z.title) : (l === 2 ? urT(z.title) : z.title); }
  function openPhoto(L, meta){ if(typeof window.ZF_openPhotoCard === 'function') window.ZF_openPhotoCard([L], meta); }

  var T = {
    all:   ['सब', 'All', 'سب'], shers: ['शेर', 'Shers', 'اشعار'], audio: ['ऑडियो', 'Audio', 'آڈیو'], ghazals: ['ग़ज़लें', 'Ghazals', 'غزلیں'], nazms: ['नज़्में', 'Nazms', 'نظمیں'],
    readG: ['पूरी ग़ज़ल पढ़ें', 'Read full ghazal', 'پوری غزل پڑھیں'], readN: ['पूरी नज़्म पढ़ें', 'Read full nazm', 'پوری نظم پڑھیں'], readA: ['ग़ज़ल पढ़ें', 'Read the text', 'متن پڑھیں'],
    ghazal: ['ग़ज़ल', 'Ghazal', 'غزل'], nazm: ['नज़्म', 'Nazm', 'نظم'], couplets: ['अश्आर', 'couplets', 'اشعار'], lines: ['पंक्तियाँ', 'lines', 'مصرعے'],
    recited: ['पाठ: ज़ान फ़रज़ान', 'Recited by Zaan Farzaan', 'آواز: زان فرزان'], play: ['चलाएँ', 'Play', 'چلائیں'], pause: ['रोकें', 'Pause', 'روکیں'], seek: ['आगे-पीछे', 'Seek', 'آگے پیچھے'],
    fav: ['पसंद में जोड़ें', 'Add to favourites', 'پسند میں شامل کریں'], badge: ['ऑडियो', 'Audio', 'آڈیو'], photo: ['फ़ोटो कार्ड बनाएँ', 'Make a photo card', 'فوٹو کارڈ بنائیں'],
    end: ['बस, इतना ही — फिर से फेंटकर देखिए', 'That is everything — shuffle to see it again', 'بس اتنا ہی — دوبارہ پھینٹ کر دیکھیے'], shuffle: ['फिर से फेंटें', 'Shuffle again', 'دوبارہ پھینٹیں'],
    wall: ["अश'आर", "Ash'aar", 'اشعار'], khat: ['ख़त', 'Letter', 'خط'], quiz: ['लफ़्ज़', 'Words', 'لفظ'], aud: ['ऑडियो', 'Audio', 'آڈیو']
  };

  /* ---------- style ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.xf-page{box-sizing:border-box;width:100%;min-width:0;max-width:980px;margin:0 auto;padding:.4rem 4vw 3rem;overflow-x:clip}#xf-body{min-width:0;max-width:100%}.xf-stories,.xf-chips{max-width:100%}' +
    '.xf-page .site-search-section{margin:.3rem 0 .5rem;padding:0;min-height:0}.xf-page .collection-search{max-width:none;width:100%;margin:0 0 .2rem}.xf-page .collection-search input{width:100%}.xf-page .poem-list:empty{display:none}.xf-page .site-search-section .poem-list{margin-top:.4rem}' +
    '.xf-stories{display:flex;gap:1rem;overflow-x:auto;padding:.6rem .3rem .9rem;margin:0 -.3rem;scrollbar-width:none;-webkit-overflow-scrolling:touch}.xf-stories::-webkit-scrollbar{display:none}' +
    '.xf-st{flex:none;width:76px;text-align:center;text-decoration:none;color:var(--text-light)}' +
    '.xf-st i{display:flex;align-items:center;justify-content:center;width:68px;height:68px;border-radius:50%;margin:0 auto;font-style:normal;font-size:1.65rem;color:var(--text-light);' +
      'background:linear-gradient(var(--ink-deep,#111),var(--ink-deep,#111)) padding-box,conic-gradient(from 210deg,var(--gold-soft),rgba(var(--zf-rgb),.25),var(--gold-soft)) border-box;border:2.5px solid transparent;transition:transform .2s}' +
    '.xf-st:hover i,.xf-st:focus-visible i{transform:scale(1.06)}.xf-st span{display:block;margin-top:.4rem;font-size:.8rem;line-height:1.3;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.xf-st:focus-visible{outline:2px solid var(--gold);outline-offset:3px;border-radius:10px}' +
    '.xf-chips{display:flex;gap:.55rem;overflow-x:auto;padding:.1rem .1rem 1rem;scrollbar-width:none}.xf-chips::-webkit-scrollbar{display:none}' +
    '.xf-chip{flex:none;font:inherit;font-size:.98rem;line-height:1.4;padding:.5rem 1.15rem;border-radius:999px;border:1px solid rgba(var(--zf-rgb),.4);background:rgba(var(--zf-rgb),.05);color:var(--text-light);cursor:pointer;min-height:44px}' +
    '.xf-chip[aria-selected="true"]{background:var(--gold-soft);color:var(--ink);border-color:var(--gold-soft);font-weight:600}.xf-chip:focus-visible{outline:2px solid var(--gold);outline-offset:2px}' +
    '.xf-feed{display:flex;gap:' + GAP + 'px;align-items:flex-start}.xf-col{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:' + GAP + 'px}' +
    '.xf-t{position:relative;width:100%;border-radius:14px;overflow:hidden;box-sizing:border-box;animation:xfIn .45s ease both;box-shadow:0 6px 22px rgba(0,0,0,.14)}' +
    '@keyframes xfIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.xf-t{animation:none}}' +
    /* ---- sher card ---- */
    '.xf-sher{aspect-ratio:var(--r,1);background-size:cover;background-position:center;color:#f6f4ee;cursor:pointer;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:2.4rem 1.5rem 3.2rem;text-align:center}' +
    '.xf-sher:focus-visible{outline:3px solid var(--gold);outline-offset:2px}.xf-sher .xf-tx{width:100%;line-height:1.6;text-wrap:balance;word-break:break-word;text-shadow:0 1px 10px rgba(0,0,0,.5)}.xf-sher .xf-tx div{margin:.1rem 0}.xf-sher.rtl .xf-tx{direction:rtl;line-height:2.1}' +
    '.xf-mean{width:100%;margin-top:.9rem;padding-top:.7rem;border-top:1px solid rgba(246,244,238,.25);font-size:.86rem;line-height:1.55;opacity:.9;text-shadow:0 1px 6px rgba(0,0,0,.5)}.xf-mean:empty{display:none}.xf-sher.rtl .xf-mean{direction:rtl}' +
    '.xf-cam{position:absolute;top:.7rem;inset-inline-end:.7rem;width:42px;height:42px;border-radius:50%;border:0;background:rgba(10,10,10,.45);color:#f6f4ee;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;backdrop-filter:blur(4px)}' +
    '.xf-cam svg{width:22px;height:22px;display:block;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.xf-cam:focus-visible{outline:2px solid var(--gold);outline-offset:2px}' +
    '.xf-sher .xf-cap{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:center;gap:.6rem;padding:.9rem 1.1rem;font-size:.84rem;letter-spacing:.03em;background:linear-gradient(0deg,rgba(10,10,10,.55),transparent)}' +
    '.xf-sher .xf-cap a{color:inherit;text-decoration:none;border-bottom:1px solid rgba(246,244,238,.55);padding:.2rem 0}.lang-ur .xf-sher .xf-cap{font-size:.95rem;letter-spacing:0}' +
    /* ---- audio card ---- */
    '.xf-audio{color:#f6f4ee;padding:1.3rem 1.3rem 1.1rem;background-size:cover;background-position:center;display:flex;flex-direction:column;gap:1rem}' +
    '.xf-ah{display:flex;align-items:center;gap:1rem}.xf-ainfo{min-width:0;flex:1;text-align:start}' +
    '.xf-play{flex:none;width:68px;height:68px;border-radius:50%;border:0;background:#f6f4ee;color:#161615;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;box-shadow:0 4px 16px rgba(0,0,0,.35)}' +
    '.xf-play:focus-visible{outline:3px solid var(--gold);outline-offset:3px}.xf-play svg{width:30px;height:30px;display:block;fill:currentColor}' +
    '.xf-audio .xf-at{font-size:1.2rem;line-height:1.5;text-wrap:balance;font-weight:600;text-shadow:0 1px 8px rgba(0,0,0,.5)}.xf-audio.rtl .xf-at{line-height:1.9}.xf-audio .xf-as{font-size:.84rem;opacity:.8;margin-top:.15rem}' +
    '.xf-prog{position:relative;height:8px;border-radius:8px;background:rgba(246,244,238,.28);cursor:pointer;touch-action:none}.xf-prog i{display:block;height:100%;width:0;background:#f6f4ee;border-radius:8px}' +
    '.xf-prog:before{content:"";position:absolute;inset:-14px 0}.xf-prog:focus-visible{outline:2px solid var(--gold);outline-offset:4px}' +
    '.xf-times{display:flex;justify-content:space-between;font-size:.78rem;opacity:.8;font-variant-numeric:tabular-nums;direction:ltr;margin-top:-.4rem}' +
    '.xf-aft{display:flex;align-items:center;justify-content:space-between;gap:.8rem}' +
    '.xf-eq{display:flex;gap:4px;align-items:flex-end;height:22px;opacity:.5}.xf-eq b{width:4px;height:30%;background:#f6f4ee;border-radius:2px}' +
    '.xf-audio.on .xf-eq{opacity:1}.xf-audio.on .xf-eq b{animation:xfEq .9s ease-in-out infinite}.xf-audio.on .xf-eq b:nth-child(2){animation-delay:.15s}.xf-audio.on .xf-eq b:nth-child(3){animation-delay:.3s}.xf-audio.on .xf-eq b:nth-child(4){animation-delay:.45s}.xf-audio.on .xf-eq b:nth-child(5){animation-delay:.6s}' +
    '@keyframes xfEq{0%,100%{height:25%}50%{height:100%}}@media (prefers-reduced-motion:reduce){.xf-audio.on .xf-eq b{animation:none;height:70%}}' +
    '.xf-audio .xf-rd{font-size:.9rem;color:#f6f4ee;text-decoration:none;border:1px solid rgba(246,244,238,.55);border-radius:999px;padding:.45rem 1rem;min-height:40px;display:inline-flex;align-items:center}.xf-audio .xf-rd:hover{background:rgba(246,244,238,.14)}' +
    /* ---- ghazal / nazm card ---- */
    '.xf-poem{overflow:visible;background:rgba(var(--zf-rgb),.07);border:1px solid rgba(var(--zf-rgb),.3);display:flex;flex-direction:column;gap:.7rem;padding:1.3rem 1.3rem 1.1rem;box-shadow:none}' +
    '.xf-poem .xf-k{font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:var(--rose);display:flex;align-items:center;gap:.55rem;flex-wrap:wrap}.lang-hi .xf-poem .xf-k,.lang-ur .xf-poem .xf-k{letter-spacing:.02em;text-transform:none;font-size:.92rem}' +
    '.xf-ab{display:inline-flex;align-items:center;gap:.3rem;padding:.1rem .6rem;border:1px solid rgba(var(--zf-rgb),.5);border-radius:999px;font-size:.74rem;letter-spacing:.03em;text-transform:none;color:var(--gold)}' +
    '.xf-poem a.xf-open{display:block;color:var(--text-light);text-decoration:none}.xf-poem .xf-pt{font-size:1.3rem;line-height:1.7;text-wrap:balance;word-break:break-word}.xf-poem .xf-pt div{margin:.05rem 0}.xf-poem.rtl .xf-pt{direction:rtl;line-height:2.15;font-size:1.4rem}' +
    '.xf-poem .xf-meta{font-size:.84rem;color:var(--text-muted);margin-top:.5rem}' +
    '.xf-poem .xf-foot{display:flex;justify-content:space-between;align-items:center;gap:.8rem;margin-top:.2rem}' +
    '.xf-poem .xf-go{line-height:1.3;font-size:.95rem;color:var(--ink);background:var(--gold-soft);text-decoration:none;border-radius:999px;padding:.55rem 1.2rem;min-height:44px;display:inline-flex;align-items:center;font-weight:600}.xf-poem .xf-go:hover{filter:brightness(1.08)}.xf-poem .xf-go:focus-visible{outline:2px solid var(--gold);outline-offset:3px}' +
    '.xf-heart{width:46px;height:46px;border-radius:50%;border:0;background:transparent;color:var(--text-light);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}.xf-heart svg{width:27px;height:27px;fill:none;stroke:currentColor;stroke-width:1.8;display:block}' +
    '.xf-heart[aria-pressed="true"]{color:#d96b7a}.xf-heart[aria-pressed="true"] svg{fill:currentColor}.xf-heart:focus-visible{outline:2px solid var(--gold);outline-offset:2px}' +
    '.xf-heart.pop svg{animation:xfPop .35s ease}@keyframes xfPop{50%{transform:scale(1.35)}}' +
    '.xf-end{text-align:center;color:var(--text-muted);font-size:1rem;margin:1.8rem 0 .5rem}.xf-end button{display:block;margin:.9rem auto 0;font:inherit;font-size:1rem;padding:.65rem 1.5rem;border-radius:999px;border:1px solid var(--gold);background:var(--gold-soft);color:var(--ink);cursor:pointer;min-height:46px}' +
    '.xf-hide{display:none !important}' +
    '@media (min-width:600px){.xf-page{padding-inline:3vw}.xf-sher{padding:2.2rem 1.3rem 3rem}}';
  document.head.appendChild(css);

  /* ---------- data pools ---------- */
  function pools(){
    var shers = [], gh = [], nz = [], au = [];
    G.forEach(function(g){
      gh.push({t: 'g', g: g});
      g.versesHtml.forEach(function(h, i){ shers.push({t: 's', g: g, i: i, m: (MOOD[g.num] || '').charAt(i)}); });
    });
    Z.forEach(function(z){ nz.push({t: 'n', z: z}); });
    AUD.forEach(function(a){
      var item = (a.k === 'nazm' ? Z : G).filter(function(x){ return x.num === a.n; })[0];
      if(item) au.push({t: 'a', k: a.k, n: a.n, item: item});
    });
    return {s: shers, g: gh, n: nz, a: au};
  }
  var PATTERN = ['s', 'g', 's', 'a', 's', 's', 'n', 's', 'g', 's', 'a', 's', 's', 'g', 's', 'n', 's', 'a', 's', 's'];
  var filter = 'all', queue = [], shown = 0, P = null;
  function buildQueue(){
    P = pools(); var q = [];
    var s = shuffle(P.s), a = shuffle(P.a), g = shuffle(P.g), n = shuffle(P.n), src = {s: s, a: a, g: g, n: n}, pos = {s: 0, a: 0, g: 0, n: 0};
    if(filter !== 'all'){ var key = {shers: 's', audio: 'a', ghazals: 'g', nazms: 'n'}[filter]; q = src[key].slice(); }
    else {
      var left = s.length + a.length + g.length + n.length, pi = 0, guard = 0;
      while(left > 0 && guard++ < 5000){
        var k = PATTERN[pi++ % PATTERN.length];
        if(pos[k] < src[k].length){ q.push(src[k][pos[k]++]); left--; }
        else { for(var kk in src){ if(pos[kk] < src[kk].length){ q.push(src[kk][pos[kk]++]); left--; break; } } }
      }
    }
    queue = q; shown = 0;
  }

  /* ---------- cards ---------- */
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4S3.6 15.1 3.6 9.2a4.6 4.6 0 0 1 8.4-2.6A4.6 4.6 0 0 1 20.4 9.2c0 5.9-8.4 11.2-8.4 11.2z"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>', PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  var CAM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.6"/></svg>';
  var HEAD = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4.5" height="7" rx="1.6" fill="currentColor"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.6" fill="currentColor"/></svg>';
  var ARROW = function(){ return li() === 2 ? ' \u2190' : ' \u2192'; };
  function hasAudio(kind, n){ return AUD.some(function(a){ return a.k === kind && a.n === n; }); }
  function colW(){ return (feed.clientWidth - GAP * (colCount - 1)) / colCount || 340; }
  var DARK = 'linear-gradient(180deg,rgba(12,12,12,.60),rgba(12,12,12,.78))';

  function sherTile(x){
    var L = sherLines(x.g, x.i), total = 0; L.forEach(function(s){ total += s.length; });
    var ratio = total < 80 ? 1 : (total < 122 ? 0.9 : 0.8), scale = Math.max(.82, Math.min(1.14, colW() / 350));
    var base = total < 70 ? 27 : (total < 100 ? 24 : (total < 135 ? 21.5 : 19.5)), fs = Math.round(base * scale * 2) / 2;
    var t = el('div', 'xf-t xf-sher' + (li() === 2 ? ' rtl' : '')); t.style.setProperty('--r', ratio); t.tabIndex = 0; t.setAttribute('role', 'button'); t.setAttribute('aria-label', tr(T.photo));
    t.style.backgroundImage = DARK + ',url(' + PHOTOS[(x.g.num * 7 + x.i) % PHOTOS.length] + ')';
    var tx = el('div', 'xf-tx'); tx.style.fontSize = fs + 'px'; L.forEach(function(s){ tx.appendChild(el('div', null, s)); }); t.appendChild(tx);
    var cam = el('button', 'xf-cam'); cam.type = 'button'; cam.innerHTML = CAM; cam.setAttribute('aria-label', tr(T.photo)); t.appendChild(cam);
    var mean = el('div', 'xf-mean'); t.appendChild(mean);            /* v72: meanings of the hard words, filled in as soon as the glossary is ready */
    var hiSrc = linesOf(x.g.versesHtml[x.i]);
    var cap = el('div', 'xf-cap'), mm = MOODS.filter(function(m){ return m[0] === x.m; })[0];
    cap.appendChild(el('span', null, mm ? mm[li() === 1 ? 2 : (li() === 2 ? 3 : 1)] : ''));
    var a = el('a', null, tr(T.ghazal) + ' ' + x.g.num + ARROW()); a.href = x.g.id + '.html'; a.addEventListener('click', function(e){ e.stopPropagation(); });
    cap.appendChild(a); t.appendChild(cap);
    function open(){ openPhoto(L, {src: [hiSrc], sher: [{g: x.g.num, i: x.i}]}); }
    cam.addEventListener('click', function(e){ e.stopPropagation(); open(); });
    t.addEventListener('click', open); t.addEventListener('keydown', function(e){ if(e.target === t && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); open(); } });
    /* after it is in the page: shrink the text if it would not fit the card */
    function fit(){ var f = parseFloat(tx.style.fontSize) || fs; var room = t.clientHeight - 96 - (mean.offsetHeight || 0); while(f > 13 && tx.scrollHeight > room){ f -= 1; tx.style.fontSize = f + 'px'; } }
    if(typeof window.ZF_meaningsFor === 'function'){
      window.ZF_meaningsFor(hiSrc, {max: 3}, function(list){ if(!list.length || !t.isConnected && !t.parentNode) return; window.ZF_meaningText(list).forEach(function(s){ mean.appendChild(el('div', null, s)); }); fit(); });
    } else { var tries = 0, iv = setInterval(function(){ if(typeof window.ZF_meaningsFor === 'function' || ++tries > 20){ clearInterval(iv); if(typeof window.ZF_meaningsFor === 'function') window.ZF_meaningsFor(hiSrc, {max: 3}, function(list){ if(!list.length) return; window.ZF_meaningText(list).forEach(function(s){ mean.appendChild(el('div', null, s)); }); fit(); }); } }, 400); }
    return {node: t, fit: fit};
  }

  function audioTile(x){
    var title = x.k === 'nazm' ? zTitle(x.item) : gTitle(x.item), id = x.k + '-' + x.n;
    var t = el('div', 'xf-t xf-audio' + (li() === 2 ? ' rtl' : '')); t.style.backgroundImage = DARK + ',url(' + PHOTOS[(x.n * 3 + (x.k === 'nazm' ? 2 : 0)) % PHOTOS.length] + ')';
    var a = document.createElement('audio'); a.preload = 'metadata'; a.src = 'audio-' + id + '.mp3'; t.appendChild(a);
    var head = el('div', 'xf-ah'); var b = el('button', 'xf-play'); b.type = 'button'; b.innerHTML = PLAY; b.setAttribute('aria-label', tr(T.play) + ': ' + title); head.appendChild(b);
    var info = el('div', 'xf-ainfo'); info.appendChild(el('div', 'xf-at', title)); info.appendChild(el('div', 'xf-as', tr(T.recited))); head.appendChild(info); t.appendChild(head);
    var pr = el('div', 'xf-prog'), pf = document.createElement('i'); pr.appendChild(pf); pr.tabIndex = 0; pr.setAttribute('role', 'slider'); pr.setAttribute('aria-label', tr(T.seek)); pr.setAttribute('aria-valuemin', '0'); pr.setAttribute('aria-valuemax', '100'); pr.setAttribute('aria-valuenow', '0'); t.appendChild(pr);
    var times = el('div', 'xf-times'), cur = el('span', null, '0:00'), dur = el('span', null, '--:--'); times.appendChild(cur); times.appendChild(dur); t.appendChild(times);
    var foot = el('div', 'xf-aft'), eq = el('div', 'xf-eq'); for(var q = 0; q < 5; q++) eq.appendChild(document.createElement('b')); foot.appendChild(eq);
    var rd = el('a', 'xf-rd', tr(x.k === 'nazm' ? T.readN : T.readA) + ARROW()); rd.href = id + '.html'; foot.appendChild(rd); t.appendChild(foot);
    b.addEventListener('click', function(){ if(a.paused){ var pm = a.play(); if(pm && pm.catch) pm.catch(function(){}); } else a.pause(); });
    a.addEventListener('play', function(){ t.classList.add('on'); b.innerHTML = PAUSE; b.setAttribute('aria-label', tr(T.pause) + ': ' + title); });
    a.addEventListener('pause', function(){ t.classList.remove('on'); b.innerHTML = PLAY; b.setAttribute('aria-label', tr(T.play) + ': ' + title); });
    a.addEventListener('ended', function(){ t.classList.remove('on'); b.innerHTML = PLAY; pf.style.width = '0'; cur.textContent = '0:00'; pr.setAttribute('aria-valuenow', '0'); });
    a.addEventListener('loadedmetadata', function(){ if(isFinite(a.duration)) dur.textContent = mmss(a.duration); });
    a.addEventListener('timeupdate', function(){ if(a.duration > 0){ var p = Math.min(100, 100 * a.currentTime / a.duration); pf.style.width = p + '%'; pr.setAttribute('aria-valuenow', String(Math.round(p))); } cur.textContent = mmss(a.currentTime); });
    function seekTo(clientX){ var r = pr.getBoundingClientRect(); if(a.duration > 0 && r.width){ var f = (clientX - r.left) / r.width; if(document.dir === 'rtl' || li() === 2 && false) f = 1 - f; a.currentTime = Math.max(0, Math.min(1, f)) * a.duration; } }
    pr.addEventListener('click', function(e){ seekTo(e.clientX); });
    pr.addEventListener('keydown', function(e){ if(e.key === 'ArrowRight'){ a.currentTime = Math.min(a.duration || 0, a.currentTime + 5); e.preventDefault(); } else if(e.key === 'ArrowLeft'){ a.currentTime = Math.max(0, a.currentTime - 5); e.preventDefault(); } });
    return {node: t};
  }

  function poemTile(x){
    var isN = x.t === 'n', it = isN ? x.z : x.g, id = it.id, kind = isN ? 'nazm' : 'ghazal';
    var vs = isN ? it.versesHtml.slice(0, 2) : it.versesHtml.slice(0, 1);
    var lines = []; vs.forEach(function(h, i){ var src = (li() === 1 && it.versesHtmlEn && it.versesHtmlEn[i]) ? it.versesHtmlEn[i] : h, ls = linesOf(src); lines = lines.concat(li() === 2 ? ls.map(urT) : ls); });
    var t = el('div', 'xf-t xf-poem' + (li() === 2 ? ' rtl' : ''));
    var k = el('div', 'xf-k'); k.appendChild(document.createTextNode(tr(T[kind]) + ' \u00B7 ' + it.num));
    if(hasAudio(kind, it.num)){ var ab = el('span', 'xf-ab'); ab.innerHTML = HEAD + ' '; ab.appendChild(document.createTextNode(tr(T.badge))); k.appendChild(ab); }
    t.appendChild(k);
    var open = el('a', 'xf-open'); open.href = id + '.html';
    var pt = el('div', 'xf-pt'); lines.slice(0, 3).forEach(function(s){ pt.appendChild(el('div', null, s)); }); open.appendChild(pt);
    var n = it.versesHtml.length; open.appendChild(el('div', 'xf-meta', n + ' ' + tr(isN ? T.lines : T.couplets)));
    t.appendChild(open);
    var foot = el('div', 'xf-foot'), go = el('a', 'xf-go', tr(isN ? T.readN : T.readG) + ARROW()); go.href = id + '.html';
    var h = el('button', 'xf-heart'); h.type = 'button'; h.innerHTML = HEART; h.setAttribute('aria-label', tr(T.fav));
    function sync(){ var on = typeof window.ZF_isFavorite === 'function' && window.ZF_isFavorite(id); h.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    h.addEventListener('click', function(){
      if(typeof window.ZF_toggleFavorite !== 'function') return;
      var was = typeof window.ZF_isFavorite === 'function' && window.ZF_isFavorite(id);
      window.ZF_toggleFavorite(id); sync(); h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop');
      if(!was && typeof window.ZF_stat === 'function') window.ZF_stat('fav', id);
    });
    sync(); foot.appendChild(go); foot.appendChild(h); t.appendChild(foot);
    return {node: t};
  }
  function makeTile(x){ return x.t === 's' ? sherTile(x) : (x.t === 'a' ? audioTile(x) : poemTile(x)); }

  /* ---------- feed layout: 1 column on phones, 2 on tablets, 3 on wide screens (shortest column gets the next card) ---------- */
  var cols = [], heights = [], colCount = 1;
  function wantCols(){ var w = feed.parentNode ? feed.parentNode.clientWidth : window.innerWidth; return w < 600 ? 1 : (w < 900 ? 2 : 3); }
  function resetCols(n){
    feed.textContent = ''; cols = []; heights = []; colCount = n;
    for(var i = 0; i < n; i++){ var c = el('div', 'xf-col'); feed.appendChild(c); cols.push(c); heights.push(0); }
  }
  function place(tile){
    var m = 0;
    for(var i = 1; i < heights.length; i++){ if(heights[i] < heights[m] - 0.5) m = i; }
    cols[m].appendChild(tile.node);
    if(tile.fit) tile.fit();
    heights[m] += tile.node.getBoundingClientRect().height + GAP;
  }
  function loadMore(n){
    var end = Math.min(shown + n, queue.length);
    for(; shown < end; shown++){ place(makeTile(queue[shown])); }
    var done = shown >= queue.length;
    endEl.textContent = '';
    if(done){
      endEl.appendChild(document.createTextNode(tr(T.end)));
      var b = el('button', null, tr(T.shuffle)); b.type = 'button'; b.addEventListener('click', function(){ rebuild(true); window.scrollTo({top: Math.max(0, feed.getBoundingClientRect().top + window.scrollY - 160), behavior: 'smooth'}); });
      endEl.appendChild(b);
    }
    return done;
  }
  var io = null;
  function watch(){
    if(io) io.disconnect();
    if(!('IntersectionObserver' in window)){ while(!loadMore(BATCH)){} return; }
    io = new IntersectionObserver(function(es){ if(es[0].isIntersecting && shown < queue.length){ loadMore(BATCH); } }, {rootMargin: '1200px 0px'});
    io.observe(sentinel);
  }
  function rebuild(reshuffle){
    if(reshuffle || !queue.length) buildQueue(); else shown = 0;
    resetCols(wantCols()); loadMore(FIRST); watch();
  }
  var rzT = null;
  window.addEventListener('resize', function(){
    clearTimeout(rzT); rzT = setTimeout(function(){
      if(wantCols() !== colCount){ var upto = shown; shown = 0; resetCols(wantCols()); for(; shown < upto; shown++){ place(makeTile(queue[shown])); } }
    }, 150);
  });

  /* ---------- stories + chips ---------- */
  function renderStories(){
    storiesEl.textContent = '';
    var base = [
      {g: '\u2726', l: T.wall, h: 'ashaar' + suf() + '.html'}, {g: '\u2709', l: T.khat, h: 'khat.html'}, {g: '\u266B', l: T.aud, h: 'audios' + suf() + '.html'}, {g: '\u0905', l: T.quiz, h: 'play' + suf() + '.html#zf-lafz'}
    ], glyph = {I: '\u2661', J: '\u263E', T: '\u2727', U: '\u2600', Z: '\u2766'};
    base.forEach(function(s){ add(s.g, tr(s.l), s.h); });
    MOODS.forEach(function(m){ if(SLUG[m[0]]) add(glyph[m[0]] || '\u2726', m[li() === 1 ? 2 : (li() === 2 ? 3 : 1)], 'mood-' + SLUG[m[0]] + '.html'); });
    function add(g, label, href){ var a = el('a', 'xf-st'); a.href = href; var i = el('i', null, g); i.setAttribute('aria-hidden', 'true'); a.appendChild(i); a.appendChild(el('span', null, label)); storiesEl.appendChild(a); }
  }
  function renderChips(){
    chipsEl.textContent = ''; chipsEl.setAttribute('role', 'tablist');
    [['all', T.all], ['shers', T.shers], ['audio', T.audio], ['ghazals', T.ghazals], ['nazms', T.nazms]].forEach(function(c){
      var b = el('button', 'xf-chip', tr(c[1])); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', filter === c[0] ? 'true' : 'false');
      b.addEventListener('click', function(){ if(filter === c[0]) return; filter = c[0]; renderChips(); rebuild(true); });
      chipsEl.appendChild(b);
    });
  }

  /* one audio at a time, wherever it was started */
  document.addEventListener('play', function(e){ var a = e.target; if(!a || a.tagName !== 'AUDIO') return; [].forEach.call(document.querySelectorAll('audio'), function(o){ if(o !== a && !o.paused) o.pause(); }); }, true);

  /* the global search owns the screen while something is typed */
  function syncSearch(){ var on = input && input.value.trim() !== ''; body.classList.toggle('xf-hide', !!on); }
  if(input){ input.addEventListener('input', syncSearch); input.addEventListener('search', syncSearch); syncSearch(); }

  renderStories(); renderChips(); rebuild(true);
  var prev = window.ZF_rerenderCollection;
  window.ZF_rerenderCollection = function(){ if(typeof prev === 'function') prev.apply(this, arguments); renderStories(); renderChips(); rebuild(true); };
})();
