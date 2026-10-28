/* ashaar.js — Sher Wall: every sher as a photo card, scroll forever, filter by mood. Tap a card -> photo-card maker (download / share). */
(function(){
  var grid = document.getElementById('ashaar-grid'), chipsBox = document.getElementById('ashaar-chips'), more = document.getElementById('ashaar-more'), count = document.getElementById('ashaar-count');
  if(!grid || typeof GHAZAL_ITEMS === 'undefined') return;
  var PHOTOS = ['sher-1.jpg', 'sher-2.jpg', 'sher-3.jpg', 'sher-4.jpg', 'sher-5.jpg'];
  var MOODS = window.ZF_MOODS || [], MOOD = window.ZF_MOOD || {};
  var T = {ded: ['💌 समर्पित करें', '💌 Dedicate', '💌 منسوب کریں'], all: ['सब', 'All', 'سب'], shuffle: ['🔀 फेंटें', '🔀 Shuffle', '🔀 پھینٹیں'], of: ['शेर', 'shers', 'اشعار'], gh: ['ग़ज़ल', 'Ghazal', 'غزل'],
           end: ['बस, इतने ही — फिर से फेंटकर देखिए', 'That is all — shuffle to see them again', 'بس اتنے ہی — دوبارہ پھینٹ کر دیکھیے']};
  function lang(){ var l = window.ZF_LANG; return l === 'en' ? 1 : (l === 'ur' ? 2 : 0); }
  function tr(k){ return T[k][lang()]; }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function ur(s){ return (typeof window.ZF_UR_transliterateText === 'function') ? window.ZF_UR_transliterateText(s) : s; }
  function lines(html){
    var doc = new DOMParser().parseFromString(html, 'text/html'), ls = doc.querySelectorAll('.line'), out = [];
    if(ls.length){ for(var i = 0; i < ls.length; i++) out.push(ls[i].textContent.trim()); } else out.push(doc.body.textContent.trim());
    return out.filter(function(x){ return x; });
  }
  function sherLines(g, i){
    var l = lang(), src = (l === 1 && g.versesHtmlEn && g.versesHtmlEn[i]) ? g.versesHtmlEn[i] : g.versesHtml[i], out = lines(src);
    return l === 2 ? out.map(ur) : out;
  }
  /* all shers: [ghazal, index, mood letter] */
  var ALL = [];
  GHAZAL_ITEMS.forEach(function(g){ for(var i = 0; i < g.versesHtml.length; i++) ALL.push({g: g, i: i, m: (MOOD[g.num] || '').charAt(i), n: ALL.length}); });
  var filter = 'ALL', order = [], shown = 0, BATCH = 18;
  function seeded(seed){ var s = seed; return function(){ s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function shuffle(seed){
    var arr = ALL.filter(function(x){ return filter === 'ALL' || x.m === filter; }), r = seeded(seed);
    for(var i = arr.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  }
  function dailySeed(){ var d = new Date(); return d.getFullYear() * 400 + (d.getMonth() + 1) * 31 + d.getDate(); }
  var seed = dailySeed();
  (function(){ var st = document.createElement('style'); st.textContent = '.ashaar-ded{font:inherit;font-size:.76rem;cursor:pointer;color:#f2f1ec;background:rgba(255,255,255,.1);border:1px solid rgba(242,241,236,.4);border-radius:999px;padding:.28rem .7rem;min-height:30px}.ashaar-ded:hover{background:rgba(255,255,255,.2)}.ashaar-foot{gap:.5rem}'; document.head.appendChild(st); })();
  function card(x){
    var L = sherLines(x.g, x.i), a = el('div', 'ashaar-card'); a.tabIndex = 0; a.setAttribute('role', 'button');
    a.style.backgroundImage = 'linear-gradient(180deg,rgba(14,14,14,.6),rgba(14,14,14,.72)),url(' + PHOTOS[x.n % PHOTOS.length] + ')';
    var maxLen = 0; L.forEach(function(s){ maxLen = Math.max(maxLen, s.length); });
    var fs = Math.max(13, Math.min(21, Math.round(620 / Math.max(maxLen, 20)))); 
    var body = el('div', 'ashaar-text' + (lang() === 2 ? ' rtl' : '')); body.style.fontSize = fs + 'px';
    L.forEach(function(s){ body.appendChild(el('div', null, s)); });
    a.appendChild(body);
    var foot = el('div', 'ashaar-foot'), lnk = el('a', null, tr('gh') + ' ' + x.g.num + ' →'); lnk.href = x.g.id + '.html';
    lnk.addEventListener('click', function(e){ e.stopPropagation(); });
    var mm = MOODS.filter(function(m){ return m[0] === x.m; })[0];
    if(mm) foot.appendChild(el('span', 'ashaar-mood', mm[lang() === 1 ? 2 : (lang() === 2 ? 3 : 1)]));
    var db = el('button', 'ashaar-ded', tr('ded')); db.type = 'button';
    db.addEventListener('click', function(e){ e.stopPropagation(); if(typeof window.ZF_openPhotoCard === 'function') window.ZF_openPhotoCard([L], {dedicate: true}); });
    db.addEventListener('keydown', function(e){ e.stopPropagation(); });
    foot.appendChild(db); foot.appendChild(lnk); a.appendChild(foot);
    function open(){ if(typeof window.ZF_openPhotoCard === 'function') window.ZF_openPhotoCard([L]); }
    a.addEventListener('click', open); a.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
    return a;
  }
  function loadMore(){
    var end = Math.min(shown + BATCH, order.length);
    for(; shown < end; shown++) grid.appendChild(card(order[shown]));
    more.textContent = shown >= order.length ? tr('end') : '';
    more.className = shown >= order.length ? 'ashaar-end' : 'ashaar-more';
  }
  function rebuild(){
    grid.textContent = ''; shown = 0; order = shuffle(seed);
    count.textContent = order.length + ' ' + tr('of');
    loadMore();
  }
  function chips(){
    chipsBox.textContent = '';
    var defs = [['ALL', tr('all')]].concat(MOODS.map(function(m){ return [m[0], m[lang() === 1 ? 2 : (lang() === 2 ? 3 : 1)]]; }));
    defs.forEach(function(d){
      var b = el('button', 'zf-chip' + (filter === d[0] ? ' on' : ''), d[1]); b.type = 'button';
      b.addEventListener('click', function(){ filter = d[0]; chips(); rebuild(); window.scrollTo({top: 0}); });
      chipsBox.appendChild(b);
    });
    var sh = el('button', 'zf-chip', tr('shuffle')); sh.type = 'button';
    sh.addEventListener('click', function(){ seed = Math.floor(Math.random() * 1e6); rebuild(); });
    chipsBox.appendChild(sh);
  }
  chips(); rebuild();
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(es){ if(es[0].isIntersecting && shown < order.length) loadMore(); }, {rootMargin: '600px'}) : null;
  if(io) io.observe(more); else window.addEventListener('scroll', function(){ if(shown < order.length && more.getBoundingClientRect().top < innerHeight + 600) loadMore(); });
  var prev = window.ZF_rerenderCollection;
  window.ZF_rerenderCollection = function(){ if(typeof prev === 'function') prev(); chips(); var keep = shown; rebuild(); while(shown < keep && shown < order.length) loadMore(); };
})();
