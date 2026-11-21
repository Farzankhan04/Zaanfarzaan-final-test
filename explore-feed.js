/* explore-feed.js (v68) — EXPLORE: an Instagram-style discovery feed.
   Search at the top (search.js — the same global search as the home page), a row of mood "stories", filter chips, and an endless masonry feed that mixes
   · SHER PHOTO TILES (same night-photo cards as the Ash'aar wall — tap to make a photo card, Dedicate / share lives there),
   · AUDIO TILES (play right in the feed, one at a time),
   · GHAZAL and NAZM TILES (a taste of the poem, a heart to favourite it, audio badge when a recording exists).
   Everything comes from the data the site already has (ghazals-data.js, nazms-data.js, mood-data.js, ZF_AUDIOS in app.js), so a new poem / audio / sher shows up here by itself.
   The order is shuffled on every visit and keeps loading as you scroll. Nothing is sent anywhere. */
(function(){
  var feed = document.getElementById('xf-feed'); if(!feed) return;
  var body = document.getElementById('xf-body'), storiesEl = document.getElementById('xf-stories'), chipsEl = document.getElementById('xf-chips'),
      sentinel = document.getElementById('xf-sentinel'), endEl = document.getElementById('xf-end'), input = document.getElementById('site-search-input');

  var G = (typeof GHAZAL_ITEMS !== 'undefined') ? GHAZAL_ITEMS : [], Z = (typeof NAZM_ITEMS !== 'undefined') ? NAZM_ITEMS : [];
  var MOODS = window.ZF_MOODS || [], MOOD = window.ZF_MOOD || {}, AUD = window.ZF_AUDIOS || [];
  var PHOTOS = ['sher-1.jpg', 'sher-2.jpg', 'sher-3.jpg', 'sher-4.jpg', 'sher-5.jpg'];
  var SLUG = {I: 'ishq', J: 'judai', T: 'tanhai', U: 'umeed', Z: 'zindagi'};
  var GAP = 8, BATCH = 12, FIRST = 18;

  var li = function(){ var l = window.ZF_LANG; return l === 'en' ? 1 : (l === 'ur' ? 2 : 0); };           /* 0 hi, 1 en, 2 ur */
  var lang = function(){ return ['hi', 'en', 'ur'][li()]; };
  var suf = function(){ return ['', '-en', '-ur'][li()]; };
  function tr(o){ return o[li()]; }
  function urT(s){ try{ return typeof window.ZF_UR_transliterateText === 'function' ? window.ZF_UR_transliterateText(s) : s; }catch(e){ return s; } }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
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
  function openPhoto(L, dedicate){ if(typeof window.ZF_openPhotoCard === 'function') window.ZF_openPhotoCard([L], dedicate ? {dedicate: true} : undefined); }

  var T = {
    all:   ['सब', 'All', 'سب'], shers: ['शेर', 'Shers', 'اشعار'], audio: ['ऑडियो', 'Audio', 'آڈیو'], ghazals: ['ग़ज़लें', 'Ghazals', 'غزلیں'], nazms: ['नज़्में', 'Nazms', 'نظمیں'],
    read:  ['पढ़ें', 'Read', 'پڑھیں'], ghazal: ['ग़ज़ल', 'Ghazal', 'غزل'], nazm: ['नज़्म', 'Nazm', 'نظم'], couplets: ['अश्आर', 'couplets', 'اشعار'], lines: ['पंक्तियाँ', 'lines', 'مصرعے'],
    recited: ['पाठ: ज़ान फ़रज़ान', 'Recited by Zaan Farzaan', 'آواز: زان فرزان'], play: ['चलाएँ', 'Play', 'چلائیں'], pause: ['रोकें', 'Pause', 'روکیں'],
    fav: ['पसंद में जोड़ें', 'Add to favourites', 'پسند میں شامل کریں'], badge: ['ऑडियो', 'Audio', 'آڈیو'],
    end: ['बस, इतना ही — फिर से फेंटकर देखिए', 'That is everything — shuffle to see it again', 'بس اتنا ہی — دوبارہ پھینٹ کر دیکھیے'], shuffle: ['फिर से फेंटें', 'Shuffle again', 'دوبارہ پھینٹیں'],
    wall: ["अश'आर", "Ash'aar", 'اشعار'], quiz: ['लफ़्ज़', 'Words', 'لفظ'], aud: ['ऑडियो', 'Audio', 'آڈیو'], moods: ['मूड', 'Moods', 'موڈ']
  };

  /* ---------- style ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.xf-page{box-sizing:border-box;width:100%;min-width:0;max-width:980px;margin:0 auto;padding:.4rem 3vw 3rem;overflow-x:clip}#xf-body{min-width:0;max-width:100%}.xf-stories,.xf-chips{max-width:100%}' +
    '.xf-page .site-search-section{margin:.3rem 0 .4rem;padding:0;min-height:0}.xf-page .collection-search{max-width:none;width:100%;margin:0 0 .2rem}.xf-page .collection-search input{width:100%}.xf-page .poem-list:empty{display:none}.xf-page .site-search-section .poem-list{margin-top:.4rem}' +
    '.xf-stories{display:flex;gap:.9rem;overflow-x:auto;padding:.5rem .3rem .8rem;margin:0 -.3rem;scrollbar-width:none;-webkit-overflow-scrolling:touch}.xf-stories::-webkit-scrollbar{display:none}' +
    '.xf-st{flex:none;width:66px;text-align:center;text-decoration:none;color:var(--text-light)}' +
    '.xf-st i{display:flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:50%;margin:0 auto;font-style:normal;font-size:1.5rem;color:var(--text-light);' +
      'background:linear-gradient(var(--ink-deep,#111),var(--ink-deep,#111)) padding-box,conic-gradient(from 210deg,var(--gold-soft),rgba(var(--zf-rgb),.25),var(--gold-soft)) border-box;border:2.5px solid transparent;transition:transform .2s}' +
    '.xf-st:hover i,.xf-st:focus-visible i{transform:scale(1.06)}.xf-st span{display:block;margin-top:.35rem;font-size:.72rem;line-height:1.25;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.xf-st:focus-visible{outline:2px solid var(--gold);outline-offset:3px;border-radius:10px}' +
    '.xf-chips{display:flex;gap:.5rem;overflow-x:auto;padding:.1rem .1rem .8rem;scrollbar-width:none}.xf-chips::-webkit-scrollbar{display:none}' +
    '.xf-chip{flex:none;font:inherit;font-size:.88rem;line-height:1.4;padding:.42rem 1rem;border-radius:999px;border:1px solid rgba(var(--zf-rgb),.4);background:rgba(var(--zf-rgb),.05);color:var(--text-light);cursor:pointer;min-height:38px}' +
    '.xf-chip[aria-selected="true"]{background:var(--gold-soft);color:var(--ink);border-color:var(--gold-soft);font-weight:600}.xf-chip:focus-visible{outline:2px solid var(--gold);outline-offset:2px}' +
    '.xf-feed{display:flex;gap:' + GAP + 'px;align-items:flex-start}.xf-col{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:' + GAP + 'px}' +
    '.xf-t{position:relative;width:100%;aspect-ratio:var(--r,1);border-radius:8px;overflow:hidden;box-sizing:border-box;animation:xfIn .45s ease both}' +
    '@keyframes xfIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.xf-t{animation:none}}' +
    /* sher */
    '.xf-sher{background-size:cover;background-position:center;color:#f3f1ea;cursor:pointer;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:.9rem .8rem 2rem;text-align:center}' +
    '.xf-sher:focus-visible{outline:2px solid var(--gold);outline-offset:2px}.xf-sher .xf-tx{line-height:1.55;text-wrap:balance;word-break:break-word}.xf-sher .xf-tx div{margin:.05rem 0}.xf-sher.rtl .xf-tx{direction:rtl;line-height:1.95}' +
    '.xf-sher .xf-cap{position:absolute;left:0;right:0;bottom:.55rem;display:flex;justify-content:space-between;gap:.4rem;padding:0 .7rem;font-size:.66rem;letter-spacing:.04em;opacity:.85}' +
    '.xf-sher .xf-cap a{color:inherit;text-decoration:none;border-bottom:1px solid rgba(243,241,234,.5)}.lang-ur .xf-sher .xf-cap{font-size:.78rem;letter-spacing:0}' +
    /* audio */
    '.xf-audio{background:linear-gradient(155deg,#2b2a27,#121211);color:#f3f1ea;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:.9rem .8rem;text-align:center;gap:.5rem}' +
    '.xf-audio .xf-eq{display:flex;gap:3px;align-items:flex-end;height:18px;opacity:.55}.xf-audio .xf-eq b{width:3px;height:30%;background:#f3f1ea;border-radius:2px}' +
    '.xf-audio.on .xf-eq{opacity:1}.xf-audio.on .xf-eq b{animation:xfEq .9s ease-in-out infinite}.xf-audio.on .xf-eq b:nth-child(2){animation-delay:.15s}.xf-audio.on .xf-eq b:nth-child(3){animation-delay:.3s}.xf-audio.on .xf-eq b:nth-child(4){animation-delay:.45s}' +
    '@keyframes xfEq{0%,100%{height:25%}50%{height:100%}}@media (prefers-reduced-motion:reduce){.xf-audio.on .xf-eq b{animation:none;height:70%}}' +
    '.xf-play{width:54px;height:54px;border-radius:50%;border:0;background:#f3f1ea;color:#161615;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}.xf-play:focus-visible{outline:2px solid var(--gold);outline-offset:3px}.xf-play svg{width:24px;height:24px;display:block;fill:currentColor}' +
    '.xf-audio .xf-at{font-size:.86rem;line-height:1.5;max-height:3.3em;overflow:hidden;text-wrap:balance;padding-bottom:.1em}.xf-audio .xf-as{font-size:.68rem;opacity:.7;letter-spacing:.03em}' +
    '.xf-prog{width:76%;height:3px;border-radius:3px;background:rgba(243,241,234,.25);overflow:hidden}.xf-prog i{display:block;height:100%;width:0;background:#f3f1ea}' +
    '.xf-audio .xf-rd{font-size:.72rem;color:inherit;text-decoration:none;border-bottom:1px solid rgba(243,241,234,.5)}' +
    /* poem */
    '.xf-poem{overflow:visible;background:rgba(var(--zf-rgb),.07);border:1px solid rgba(var(--zf-rgb),.28);display:flex;flex-direction:column;gap:.35rem;padding:.85rem .8rem .7rem}' +
    '.xf-poem .xf-k{font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:var(--rose);display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}.lang-hi .xf-poem .xf-k,.lang-ur .xf-poem .xf-k{letter-spacing:.02em;text-transform:none;font-size:.78rem}' +
    '.xf-ab{display:inline-flex;align-items:center;gap:.25rem;padding:.02rem .42rem;border:1px solid rgba(var(--zf-rgb),.5);border-radius:999px;font-size:.6rem;letter-spacing:.03em;text-transform:none;color:var(--gold)}' +
    '.xf-poem a.xf-open{flex:1;display:flex;flex-direction:column;justify-content:center;color:var(--text-light);text-decoration:none;min-height:0}.xf-poem .xf-pt{line-height:1.6;text-wrap:balance;word-break:break-word}.xf-poem.rtl .xf-pt{direction:rtl;line-height:2}' +
    '.xf-poem .xf-meta{font-size:.7rem;color:var(--text-muted);margin-top:.35rem}' +
    '.xf-poem .xf-foot{display:flex;justify-content:space-between;align-items:center;margin-top:.4rem}.xf-poem .xf-go{font-size:.78rem;color:var(--gold-soft);text-decoration:underline;text-underline-offset:3px}' +
    '.xf-heart{width:34px;height:34px;border-radius:50%;border:0;background:transparent;color:var(--text-light);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}.xf-heart svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;display:block}' +
    '.xf-heart[aria-pressed="true"]{color:#d96b7a}.xf-heart[aria-pressed="true"] svg{fill:currentColor}.xf-heart:focus-visible{outline:2px solid var(--gold);outline-offset:2px}' +
    '.xf-heart.pop svg{animation:xfPop .35s ease}@keyframes xfPop{50%{transform:scale(1.35)}}' +
    '.xf-end{text-align:center;color:var(--text-muted);font-size:.9rem;margin:1.6rem 0 .5rem}.xf-end button{display:block;margin:.8rem auto 0;font:inherit;font-size:.92rem;padding:.55rem 1.3rem;border-radius:999px;border:1px solid var(--gold);background:var(--gold-soft);color:var(--ink);cursor:pointer;min-height:42px}' +
    '.xf-hide{display:none !important}';
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
  var PATTERN = ['s', 's', 'a', 's', 'g', 's', 's', 'n', 's', 'a', 's', 'g', 's', 's', 'n', 's', 'a', 's', 'g', 's'];
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
        else if(!(pos.s < s.length || pos.a < a.length || pos.g < g.length || pos.n < n.length)) break;
        else { /* this type is used up: take the next type that still has something */ for(var kk in src){ if(pos[kk] < src[kk].length){ q.push(src[kk][pos[kk]++]); left--; break; } } }
      }
    }
    queue = q; shown = 0;
  }

  /* ---------- tiles ---------- */
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4S3.6 15.1 3.6 9.2a4.6 4.6 0 0 1 8.4-2.6A4.6 4.6 0 0 1 20.4 9.2c0 5.9-8.4 11.2-8.4 11.2z"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>', PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  var HEAD = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4.5" height="7" rx="1.6" fill="currentColor"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.6" fill="currentColor"/></svg>';
  function hasAudio(kind, n){ return AUD.some(function(a){ return a.k === kind && a.n === n; }); }

  function sherTile(x){
    var L = sherLines(x.g, x.i), total = 0; L.forEach(function(s){ total += s.length; });
    var ratio = total < 80 ? 1 : (total < 122 ? 0.85 : 0.72), fs = total < 70 ? 16.5 : (total < 100 ? 15 : (total < 135 ? 13.5 : 12.5));
    var t = el('div', 'xf-t xf-sher' + (li() === 2 ? ' rtl' : '')); t.style.setProperty('--r', ratio); t.tabIndex = 0; t.setAttribute('role', 'button');
    t.style.backgroundImage = 'linear-gradient(180deg,rgba(14,14,14,.58),rgba(14,14,14,.74)),url(' + PHOTOS[(x.g.num * 7 + x.i) % PHOTOS.length] + ')';
    var tx = el('div', 'xf-tx'); tx.style.fontSize = fs + 'px'; L.forEach(function(s){ tx.appendChild(el('div', null, s)); }); t.appendChild(tx);
    var cap = el('div', 'xf-cap'), mm = MOODS.filter(function(m){ return m[0] === x.m; })[0];
    cap.appendChild(el('span', null, mm ? mm[li() === 1 ? 2 : (li() === 2 ? 3 : 1)] : ''));
    var a = el('a', null, tr(T.ghazal) + ' ' + x.g.num + (li() === 2 ? ' \u2190' : ' \u2192')); a.href = x.g.id + '.html'; a.addEventListener('click', function(e){ e.stopPropagation(); });
    cap.appendChild(a); t.appendChild(cap);
    function open(){ openPhoto(L); }
    t.addEventListener('click', open); t.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
    return {node: t, ratio: ratio};
  }

  function audioTile(x){
    var title = x.k === 'nazm' ? zTitle(x.item) : gTitle(x.item), id = x.k + '-' + x.n, href = id + '.html';
    var t = el('div', 'xf-t xf-audio'); t.style.setProperty('--r', 1);
    var eq = el('div', 'xf-eq'); for(var q = 0; q < 4; q++) eq.appendChild(document.createElement('b')); t.appendChild(eq);
    var a = document.createElement('audio'); a.preload = 'none'; a.src = 'audio-' + id + '.mp3'; t.appendChild(a);
    var b = el('button', 'xf-play'); b.type = 'button'; b.innerHTML = PLAY; b.setAttribute('aria-label', tr(T.play) + ': ' + title); t.appendChild(b);
    t.appendChild(el('div', 'xf-at', title)); t.appendChild(el('div', 'xf-as', tr(T.recited)));
    var pr = el('div', 'xf-prog'), pf = document.createElement('i'); pr.appendChild(pf); t.appendChild(pr);
    var rd = el('a', 'xf-rd', tr(T.read) + (li() === 2 ? ' \u2190' : ' \u2192')); rd.href = href; t.appendChild(rd);
    b.addEventListener('click', function(){ if(a.paused){ var pm = a.play(); if(pm && pm.catch) pm.catch(function(){}); } else a.pause(); });
    a.addEventListener('play', function(){ t.classList.add('on'); b.innerHTML = PAUSE; b.setAttribute('aria-label', tr(T.pause) + ': ' + title); });
    a.addEventListener('pause', function(){ t.classList.remove('on'); b.innerHTML = PLAY; b.setAttribute('aria-label', tr(T.play) + ': ' + title); });
    a.addEventListener('ended', function(){ t.classList.remove('on'); b.innerHTML = PLAY; pf.style.width = '0'; });
    a.addEventListener('timeupdate', function(){ if(a.duration > 0) pf.style.width = Math.min(100, 100 * a.currentTime / a.duration) + '%'; });
    return {node: t, ratio: 1};
  }

  function poemTile(x){
    var isN = x.t === 'n', it = isN ? x.z : x.g, id = it.id, kind = isN ? 'nazm' : 'ghazal';
    var vs = isN ? it.versesHtml.slice(0, 2) : it.versesHtml.slice(0, 1);
    var lines = []; vs.forEach(function(h, i){ var src = (li() === 1 && it.versesHtmlEn && it.versesHtmlEn[i]) ? it.versesHtmlEn[i] : h, ls = linesOf(src); lines = lines.concat(li() === 2 ? ls.map(urT) : ls); });
    var t = el('div', 'xf-t xf-poem' + (li() === 2 ? ' rtl' : '')); t.style.setProperty('--r', 0.8);
    var k = el('div', 'xf-k'); k.appendChild(document.createTextNode(tr(T[kind]) + ' \u00B7 ' + it.num));
    if(hasAudio(kind, it.num)){ var ab = el('span', 'xf-ab'); ab.innerHTML = HEAD + ' '; ab.appendChild(document.createTextNode(tr(T.badge))); k.appendChild(ab); }
    t.appendChild(k);
    var open = el('a', 'xf-open'); open.href = id + '.html';
    var pt = el('div', 'xf-pt'); pt.style.fontSize = '14.5px'; lines.slice(0, 3).forEach(function(s){ pt.appendChild(el('div', null, s)); }); open.appendChild(pt);
    var n = it.versesHtml.length; open.appendChild(el('div', 'xf-meta', n + ' ' + tr(isN ? T.lines : T.couplets)));
    t.appendChild(open);
    var foot = el('div', 'xf-foot'), go = el('a', 'xf-go', tr(T.read) + (li() === 2 ? ' \u2190' : ' \u2192')); go.href = id + '.html';
    var h = el('button', 'xf-heart'); h.type = 'button'; h.innerHTML = HEART; h.setAttribute('aria-label', tr(T.fav));
    function sync(){ var on = typeof window.ZF_isFavorite === 'function' && window.ZF_isFavorite(id); h.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    h.addEventListener('click', function(){
      if(typeof window.ZF_toggleFavorite !== 'function') return;
      var was = typeof window.ZF_isFavorite === 'function' && window.ZF_isFavorite(id);
      window.ZF_toggleFavorite(id); sync(); h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop');
      if(!was && typeof window.ZF_stat === 'function') window.ZF_stat('fav', id);
    });
    sync(); foot.appendChild(go); foot.appendChild(h); t.appendChild(foot);
    return {node: t, ratio: 0.8};
  }
  function makeTile(x){ return x.t === 's' ? sherTile(x) : (x.t === 'a' ? audioTile(x) : poemTile(x)); }

  /* ---------- masonry ---------- */
  var cols = [], heights = [], placed = [], colCount = 0;
  function wantCols(){ return feed.clientWidth >= 700 ? 3 : 2; }
  function resetCols(n){
    feed.textContent = ''; cols = []; heights = []; colCount = n;
    for(var i = 0; i < n; i++){ var c = el('div', 'xf-col'); feed.appendChild(c); cols.push(c); heights.push(0); }
  }
  function place(tile){
    var m = 0;
    for(var i = 1; i < heights.length; i++){ if(heights[i] < heights[m] - 0.5) m = i; }
    cols[m].appendChild(tile.node);
    heights[m] += tile.node.getBoundingClientRect().height + GAP;        /* the real height (a poem tile grows with its text), so the columns stay level */
  }
  function loadMore(n){
    var end = Math.min(shown + n, queue.length);
    for(; shown < end; shown++){ var t = makeTile(queue[shown]); placed.push(t); place(t); }
    var done = shown >= queue.length;
    endEl.textContent = '';
    if(done){
      endEl.appendChild(document.createTextNode(tr(T.end)));
      var b = el('button', null, tr(T.shuffle)); b.type = 'button'; b.addEventListener('click', function(){ rebuild(true); window.scrollTo({top: Math.max(0, feed.getBoundingClientRect().top + window.scrollY - 140), behavior: 'smooth'}); });
      endEl.appendChild(b);
    }
    return done;
  }
  var io = null;
  function watch(){
    if(io) io.disconnect();
    if(!('IntersectionObserver' in window)){ while(!loadMore(BATCH)){} return; }
    io = new IntersectionObserver(function(es){ if(es[0].isIntersecting && shown < queue.length){ loadMore(BATCH); } }, {rootMargin: '900px 0px'});
    io.observe(sentinel);
  }
  function rebuild(reshuffle){
    if(reshuffle || !queue.length) buildQueue(); else shown = 0;
    placed = []; resetCols(wantCols()); loadMore(FIRST); watch();
  }
  window.addEventListener('resize', function(){
    if(wantCols() !== colCount){ var upto = shown; shown = 0; placed = []; resetCols(wantCols()); var keep = queue; for(; shown < upto; shown++){ var t = makeTile(keep[shown]); placed.push(t); place(t); } }
  });

  /* ---------- stories + chips ---------- */
  function renderStories(){
    storiesEl.textContent = '';
    var base = [
      {g: '\u2726', l: T.wall, h: 'ashaar' + suf() + '.html'}, {g: '\u266B', l: T.aud, h: 'audios' + suf() + '.html'}, {g: '\u0905', l: T.quiz, h: 'play' + suf() + '.html#zf-lafz'}
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
