/* audio-library.js (v63) — the Audio page as a small music library (Spotify style).
   • Two tabs: Ghazals / Nazms. Each shows compact rows: cover, name, "Zaan Farzaan", length.
   • Tap a row -> a full-screen "now playing" view of that recording: big turning disc, waveform player, previous / play / next,
     then (scroll) credit, Share, "Read this ghazal / nazm", Comments, playback settings, and "More to listen".
   • Closing the view (chevron, Esc, phone back) keeps the audio playing; the "Now playing" bar from audios.js stays at the bottom,
     and tapping its title brings the view back.
   The articles (.audio-track) with their real <audio> elements stay in the page; audios.js (modes, now-playing bar, reader overlay,
   lock-screen controls, sleep timer link-up), audio-skin.js (the player) and comments.js keep working on them untouched. */
(function(){
  var list = document.querySelector('.audio-list'); if(!list) return;
  var cards = [].slice.call(list.querySelectorAll('.audio-track')); if(!cards.length) return;
  var root = document.documentElement;

  var byId = {}; cards.forEach(function(c){ byId[c.id] = c; c.classList.add('in'); });
  var NEW = (window.ZF_NEW_AUDIOS || []).map(function(o){ return o.kind + '-' + o.n; });
  var COVERS = ['sher-2.jpg','sher-4.jpg','sher-1.jpg','sher-5.jpg','sher-3.jpg'];
  var groups = { ghazal: [], nazm: [] };
  cards.forEach(function(c){ var t = /^ghazal-/.test(c.id) ? 'ghazal' : 'nazm'; groups[t].push(c); });
  function typeOf(c){ return /^ghazal-/.test(c.id) ? 'ghazal' : 'nazm'; }
  function coverOf(c){ return COVERS[cards.indexOf(c) % COVERS.length]; }
  function audioOf(c){ return c.querySelector('audio'); }
  function titleOf(c){ var h = c.querySelector('h3'); return h ? h.textContent.trim() : c.id; }

  var STR = {
    ghazal:   {hi:'ग़ज़लें', en:'Ghazals', ur:'غزلیں'},
    nazm:     {hi:'नज़्में', en:'Nazms', ur:'نظمیں'},
    count:    {hi:function(n){ return n + ' पाठ'; }, en:function(n){ return n + (n === 1 ? ' recitation' : ' recitations'); }, ur:function(n){ return n + ' آڈیو'; }},
    playAll:  {hi:'सब चलाएँ', en:'Play all', ur:'سب چلائیں'},
    isNew:    {hi:'नया', en:'New', ur:'نیا'},
    artist:   {hi:'ज़ान फ़रज़ान', en:'Zaan Farzaan', ur:'زان فرزان'},
    now:      {hi:'अब चल रहा है', en:'Now playing', ur:'اب چل رہا ہے'},
    more:     {hi:'और सुनिए', en:'More to listen', ur:'مزید سنیے'},
    prev:     {hi:'पिछला', en:'Previous', ur:'پچھلا'},
    next:     {hi:'अगला', en:'Next', ur:'اگلا'},
    close:    {hi:'प्लेयर बंद करें', en:'Close player', ur:'پلیئر بند کریں'},
    settings: {hi:'सुनने की सेटिंग', en:'Playback settings', ur:'سننے کی ترتیب'},
    settingsH:{hi:'सुनने की सेटिंग', en:'Playback', ur:'سننے کی ترتیب'}
  };
  function lang(){ var c = document.body.classList; return c.contains('lang-ur') ? 'ur' : (c.contains('lang-en') ? 'en' : 'hi'); }
  function S(k, n){ var v = STR[k][lang()]; return typeof v === 'function' ? v(n) : v; }
  function store(k, v){ try{ if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){} return null; }
  function fmt(t){ if(!isFinite(t) || t < 0) return '–:––'; t = Math.floor(t); var m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }

  var ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="2.6" height="14" rx="1"/><path d="M19 6.2v11.6a1 1 0 0 1-1.55.84l-8.2-5.8a1 1 0 0 1 0-1.68l8.2-5.8A1 1 0 0 1 19 6.2z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="16.4" y="5" width="2.6" height="14" rx="1"/><path d="M5 6.2v11.6a1 1 0 0 0 1.55.84l8.2-5.8a1 1 0 0 0 0-1.68l-8.2-5.8A1 1 0 0 0 5 6.2z"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
  };

  /* ---------------------------------------------------------------- library (tabs + rows) */
  var ui = document.createElement('div'); ui.className = 'zl-lib-ui';
  var tabsEl = document.createElement('div'); tabsEl.className = 'zl-tabs'; tabsEl.setAttribute('role', 'tablist');
  ui.appendChild(tabsEl);
  var panes = {}, rows = {}, tabBtns = {};

  ['ghazal', 'nazm'].forEach(function(t){
    if(!groups[t].length) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'zl-tab'; b.setAttribute('role', 'tab'); b.setAttribute('data-t', t);
    tabsEl.appendChild(b); tabBtns[t] = b;
    b.addEventListener('click', function(){ showTab(t); });

    var pane = document.createElement('section'); pane.className = 'zl-pane'; pane.setAttribute('role', 'tabpanel'); pane.hidden = true;
    pane.innerHTML = '<div class="zl-pane-head"><button type="button" class="zl-playall"></button><div><h2></h2><p></p></div></div><ul class="zl-rows"></ul>';
    ui.appendChild(pane); panes[t] = pane;
    pane.querySelector('.zl-playall').innerHTML = ICON.play;
    pane.querySelector('.zl-playall').addEventListener('click', function(){
      var nextBtn = document.querySelector('.audio-mode[data-mode="next"]');
      if(nextBtn && nextBtn.getAttribute('aria-pressed') !== 'true') nextBtn.click();
      openView(groups[t][0].id, {play: true});
    });
    var ul = pane.querySelector('.zl-rows');
    groups[t].forEach(function(c){
      var li = document.createElement('li'), r = document.createElement('button'); r.type = 'button'; r.className = 'zl-row'; r.setAttribute('data-id', c.id);
      r.innerHTML = '<span class="zl-cv"></span><span class="zl-rt"><span class="zl-r-t"></span><span class="zl-r-s"></span></span>' +
                    '<span class="zl-r-end"><span class="zf-eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="zl-r-d">–:––</span></span>';
      r.querySelector('.zl-cv').style.backgroundImage = 'url(' + coverOf(c) + ')';
      r.addEventListener('click', function(){ openView(c.id, {play: true}); });
      li.appendChild(r); ul.appendChild(li); rows[c.id] = r;
    });
  });

  /* page-level playback settings (play once / repeat / auto-play next, sleep timer) live in a collapsible block under the lists */
  var settings = document.createElement('details'); settings.className = 'zl-settings';
  settings.innerHTML = '<summary></summary><div class="zl-settings-body"></div>';
  ui.appendChild(settings);
  var settingsBody = settings.querySelector('.zl-settings-body');

  list.classList.add('zl-lib-on');
  list.insertBefore(ui, cards[0]);

  function showTab(t, noSave){
    Object.keys(panes).forEach(function(k){ panes[k].hidden = (k !== t); tabBtns[k].classList.toggle('on', k === t); tabBtns[k].setAttribute('aria-selected', k === t ? 'true' : 'false'); });
    if(!noSave) store('zf-audio-tab', t);
    watchRows(t);
  }

  function syncTexts(){
    Object.keys(tabBtns).forEach(function(t){
      tabBtns[t].innerHTML = S(t) + '<small>' + groups[t].length + '</small>';
      var p = panes[t];
      p.querySelector('h2').textContent = S(t);
      p.querySelector('p').textContent = S('count', groups[t].length);
      p.querySelector('.zl-playall').setAttribute('aria-label', S('playAll') + ' — ' + S(t));
    });
    cards.forEach(function(c){
      var r = rows[c.id]; if(!r) return;
      r.querySelector('.zl-r-t').textContent = titleOf(c);
      var sub = r.querySelector('.zl-r-s'); sub.textContent = '';
      if(NEW.indexOf(c.id) >= 0){ var em = document.createElement('em'); em.className = 'zl-newtag'; em.textContent = S('isNew'); sub.appendChild(em); }
      sub.appendChild(document.createTextNode(S('artist')));
    });
    settings.querySelector('summary').textContent = S('settings');
    if(openCard) fillView(openCard);
  }

  /* durations (loaded when a row scrolls into view — keeps data use small) */
  function setDur(c){
    var r = rows[c.id], a = audioOf(c); if(!r || !a) return;
    r.querySelector('.zl-r-d').textContent = fmt(a.duration);
  }
  cards.forEach(function(c){
    var a = audioOf(c); if(!a) return;
    ['loadedmetadata','durationchange'].forEach(function(ev){ a.addEventListener(ev, function(){ setDur(c); }); });
    if(a.readyState > 0) setDur(c);
  });
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting) return; io.unobserve(en.target);
      var c = byId[en.target.getAttribute('data-id')], a = c && audioOf(c);
      if(a && a.readyState === 0 && a.paused){ a.preload = 'metadata'; try{ a.load(); }catch(e){} }
    });
  }, {rootMargin: '150px'}) : null;
  var watched = {};
  function watchRows(t){ if(!io || watched[t]) return; watched[t] = true; groups[t].forEach(function(c){ io.observe(rows[c.id]); }); }

  function syncRows(){
    cards.forEach(function(c){
      var r = rows[c.id]; if(!r) return;
      var a = audioOf(c), playing = a && !a.paused && !a.ended;
      r.classList.toggle('playing', !!playing); r.classList.toggle('current', c === openCard || !!playing);
    });
  }

  /* ---------------------------------------------------------------- settings blocks (moved into the open view and back) */
  function modesNode(){ return list.querySelector('.audio-modes') || (settingsBody.querySelector('.audio-modes')) || document.querySelector('.audio-modes'); }
  function sleepNode(){ return document.querySelector('.zf-sleep'); }
  function mountSettings(slot){ [modesNode(), sleepNode()].forEach(function(n){ if(n) slot.appendChild(n); }); }
  function homeSettings(){ mountSettings(settingsBody); }
  [300, 900, 2200].forEach(function(ms){ setTimeout(function(){ if(!openCard) homeSettings(); else mountSettings(openCard.querySelector('.zl-view-settings')); }, ms); });
  homeSettings();

  /* ---------------------------------------------------------------- the now-playing view */
  var openCard = null;
  var built = {};

  function buildView(c){
    if(built[c.id]) return; built[c.id] = true;
    var top = document.createElement('div'); top.className = 'zl-view-top';
    top.innerHTML = '<button type="button" class="zl-view-close"></button><div class="zl-view-ctx"><small></small><b></b></div><span class="zl-view-sp"></span>';
    top.querySelector('.zl-view-close').innerHTML = ICON.down;
    top.querySelector('.zl-view-close').addEventListener('click', function(){ closeView(); });
    c.insertBefore(top, c.firstChild);

    var pl = c.querySelector('.zf-pl');
    if(pl){
      var pv = document.createElement('button'); pv.type = 'button'; pv.className = 'zl-prev'; pv.innerHTML = ICON.prev;
      var nx = document.createElement('button'); nx.type = 'button'; nx.className = 'zl-next'; nx.innerHTML = ICON.next;
      pl.appendChild(pv); pl.appendChild(nx);
      pv.addEventListener('click', function(){ var a = audioOf(c); if(a && a.currentTime > 3){ a.currentTime = 0; } else { step(c, -1); } });
      nx.addEventListener('click', function(){ step(c, 1); });
    }
    var slot = document.createElement('div'); slot.className = 'zl-view-settings'; slot.innerHTML = '<h4></h4>';
    c.appendChild(slot);
    var more = document.createElement('div'); more.className = 'zl-more-audios'; c.appendChild(more);
  }

  function fillView(c){
    var top = c.querySelector('.zl-view-top'); if(!top) return;
    top.querySelector('.zl-view-close').setAttribute('aria-label', S('close'));
    top.querySelector('small').textContent = S('now');
    top.querySelector('b').textContent = S(typeOf(c));
    var pv = c.querySelector('.zl-prev'), nx = c.querySelector('.zl-next');
    if(pv) pv.setAttribute('aria-label', S('prev')); if(nx) nx.setAttribute('aria-label', S('next'));
    c.querySelector('.zl-view-settings h4').textContent = S('settingsH');
    buildMore(c);
  }

  function buildMore(c){
    var host = c.querySelector('.zl-more-audios'); if(!host) return;
    var t = typeOf(c), other = t === 'ghazal' ? 'nazm' : 'ghazal';
    var g = groups[t], i = g.indexOf(c);
    var order = g.slice(i + 1).concat(g.slice(0, i)).concat(groups[other]).slice(0, 10);
    host.innerHTML = '<h3></h3><div class="zl-more-track"></div>';
    host.querySelector('h3').textContent = S('more');
    var track = host.querySelector('.zl-more-track');
    order.forEach(function(o){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'zl-mini';
      b.innerHTML = '<span class="zl-mini-cv"></span><span class="zl-mini-t"></span><span class="zl-mini-s"></span>';
      b.querySelector('.zl-mini-cv').style.backgroundImage = 'url(' + coverOf(o) + ')';
      b.querySelector('.zl-mini-t').textContent = titleOf(o);
      b.querySelector('.zl-mini-s').textContent = S('artist');
      b.addEventListener('click', function(){ openView(o.id, {swap: true, play: true}); });
      track.appendChild(b);
    });
  }

  function step(c, dir){
    var g = groups[typeOf(c)], i = g.indexOf(c), n = g[(i + dir + g.length) % g.length];
    var a = audioOf(n); if(a){ a.currentTime = 0; }
    openView(n.id, {swap: true, play: true});
  }

  function openView(id, opts){
    opts = opts || {};
    var c = byId[id]; if(!c) return;
    if(openCard && openCard !== c) closeView(true);
    var same = (openCard === c);
    openCard = c; buildView(c);
    c.style.setProperty('--zf-cover', 'url(' + coverOf(c) + ')');
    c.classList.add('zl-open'); root.classList.add('zl-view-open');
    fillView(c); mountSettings(c.querySelector('.zl-view-settings'));
    if(!same) c.scrollTop = 0;
    if(!opts.fromPop){
      try{
        if(opts.swap && history.state && history.state.zfView) history.replaceState({zfView: id}, '', location.pathname + location.search + '#' + id);
        else history.pushState({zfView: id}, '', location.pathname + location.search + '#' + id);
      }catch(e){}
    }
    if(opts.play){ var a = audioOf(c); if(a && a.paused){ var pr = a.play(); if(pr && pr.catch) pr.catch(function(){}); } }
    syncRows();
  }

  function closeView(silent){
    if(!openCard) return;
    var c = openCard; openCard = null;
    c.classList.remove('zl-open'); root.classList.remove('zl-view-open');
    homeSettings(); syncRows();
    if(!silent && history.state && history.state.zfView){ try{ history.back(); }catch(e){} }
  }

  function playingCard(){
    for(var i = 0; i < cards.length; i++){ var a = audioOf(cards[i]); if(a && !a.paused && !a.ended) return cards[i]; }
    return lastCard;
  }
  var lastCard = null;

  /* ---------------------------------------------------------------- wiring */
  document.addEventListener('play', function(e){
    if(e.target.tagName !== 'AUDIO') return;
    var c = e.target.closest('.audio-track'); if(!c) return;
    lastCard = c;
    if(openCard && openCard !== c) openView(c.id, {swap: true});     // e.g. "auto-play next" moved on: the view follows
    syncRows();
  }, true);
  document.addEventListener('pause', function(e){ if(e.target.tagName === 'AUDIO') syncRows(); }, true);
  document.addEventListener('ended', function(e){ if(e.target.tagName === 'AUDIO') setTimeout(syncRows, 30); }, true);

  /* "Read this ghazal / nazm": step out of the view first so the reader (audios.js) is visible; Back brings the view back */
  list.addEventListener('click', function(e){ if(e.target.closest && e.target.closest('.audio-track-read')) closeView(true); }, true);

  window.addEventListener('popstate', function(e){
    var st = e.state;
    if(st && st.zfView){ openView(st.zfView, {fromPop: true}); }
    else { closeView(true); }
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && openCard && !document.querySelector('.zf-reader.on')) closeView(); });

  /* tapping the "Now playing" bar title reopens the player view */
  var barText = document.querySelector('.zf-bar-text');
  if(barText){ barText.style.cursor = 'pointer'; barText.addEventListener('click', function(){ var c = playingCard(); if(c) openView(c.id); }); }

  document.addEventListener('click', function(e){ if(e.target.closest && e.target.closest('#lang-toggle')) setTimeout(function(){ syncTexts(); syncRows(); }, 220); });

  /* initial state: which tab, and a #ghazal-8 / #nazm-3 link opens that recording */
  var hashId = (location.hash || '').replace('#', '');
  var startTab = store('zf-audio-tab'); if(!panes[startTab]) startTab = 'ghazal'; if(!panes[startTab]) startTab = 'nazm';
  if(byId[hashId]) startTab = typeOf(byId[hashId]);
  syncTexts(); showTab(startTab, true); syncRows();
  if(byId[hashId]){
    try{ history.replaceState(null, '', location.pathname + location.search); }catch(e){}
    openView(hashId);
  }
})();
