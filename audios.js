/* audios.js — Audio page behaviour (audios.html / audios-en.html / audios-ur.html)
   1. Mode: play once / repeat (loop the same nazm) / auto-play next nazm. Saved in localStorage.
   2. "Now playing" indicator on the card + a bar fixed at the bottom (play/pause, read, close).
   3. "Read this nazm" opens the nazm page INSIDE this page (overlay), so the audio keeps playing while reading.
      Phone back button / "back" closes the reader. Ctrl/middle-click still opens the normal page.
   4. Lock-screen / notification controls (Media Session) with previous / next nazm.
   Everything is inside this one file (its CSS too). */
(function(){
  var list = document.querySelector('.audio-list');
  if(!list) return;
  var cards = [].slice.call(list.querySelectorAll('.audio-track'));
  if(!cards.length) return;

  var STR = {
    hi:{now:'अभी चल रहा है', read:'नज़्म पढ़ें', readG:'ग़ज़ल पढ़ें', back:'ऑडियो पर वापस', play:'चलाएँ', pause:'रोकें', close:'बंद करें', loading:'नज़्म खुल रही है…', playingHint:'ऑडियो चलता रहेगा'},
    en:{now:'Now playing', read:'Read this nazm', readG:'Read this ghazal', back:'Back to audio', play:'Play', pause:'Pause', close:'Close', loading:'Opening the nazm…', playingHint:'Audio keeps playing'},
    ur:{now:'ابھی چل رہا ہے', read:'یہ نظم پڑھیں', readG:'یہ غزل پڑھیں', back:'آڈیو پر واپس', play:'چلائیں', pause:'روکیں', close:'بند کریں', loading:'نظم کھل رہی ہے…', playingHint:'آڈیو چلتا رہے گا'}
  };
  function lang(){
    var c = document.body.classList;
    return c.contains('lang-ur') ? 'ur' : (c.contains('lang-en') ? 'en' : 'hi');
  }
  function T(k){ return STR[lang()][k]; }
  function store(k, v){ try{ if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){} return null; }

  /* ---------- CSS ---------- */
  var css = '\
.audio-credit{font-size:.88rem; color:var(--text-muted,#6f6f69); margin:.5rem 0 .2rem;}\
.audio-credit a{color:inherit; text-decoration:underline; text-underline-offset:3px; font-weight:600;}\
.audio-credit .audio-ig{font-weight:400; font-size:.8rem; margin-inline-start:.5rem; opacity:.85;}\
.audio-modes{display:flex; flex-wrap:wrap; justify-content:center; gap:.5rem; margin:0 0 1.5rem;}\
.audio-mode{font:inherit; font-size:.92rem; line-height:1.4; cursor:pointer; padding:.5rem 1.05rem; border-radius:999px; background:transparent; color:var(--text-muted,#9c9c95); border:1px solid rgba(220,220,214,.35); transition:background .2s,color .2s,border-color .2s;}\
.audio-mode:hover{border-color:rgba(220,220,214,.7); color:#f2f1ec;}\
.audio-mode[aria-pressed="true"]{background:#f2f1ec; color:#151515; border-color:#f2f1ec; font-weight:600;}\
.audio-track.is-playing{box-shadow:0 0 0 2px var(--gold-soft,#dcdcd6),0 4px 10px rgba(0,0,0,.18),0 18px 34px rgba(0,0,0,.28);}\
.zf-card-now{position:absolute; top:.9rem; inset-inline-end:1.1rem; display:none; align-items:center; gap:.45rem; font-size:.74rem; font-weight:600; color:#4a4a46;}\
.audio-track.is-playing .zf-card-now{display:flex;}\
.zf-eq{display:inline-flex; align-items:flex-end; gap:2px; height:14px;}\
.zf-eq i{display:block; width:3px; height:100%; background:currentColor; border-radius:1px; transform-origin:bottom; animation:zfEq 0.9s ease-in-out infinite;}\
.zf-eq i:nth-child(2){animation-delay:-.3s;} .zf-eq i:nth-child(3){animation-delay:-.6s;}\
.zf-eq.paused i{animation-play-state:paused; transform:scaleY(.35);}\
@keyframes zfEq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}\
@media (prefers-reduced-motion:reduce){.zf-eq i{animation:none; transform:scaleY(.6);}}\
.zf-bar{position:fixed; left:0; right:0; bottom:0; z-index:10000; display:none; align-items:center; gap:.8rem; padding:.55rem .9rem .75rem; background:#1b1b1b; color:#f2f1ec; border-top:1px solid rgba(220,220,214,.3); box-shadow:0 -8px 24px rgba(0,0,0,.45);}\
.zf-bar.on{display:flex;}\
.zf-bar .zf-eq{color:var(--gold-soft,#dcdcd6); height:18px; flex:none;}\
.zf-bar-text{flex:1; min-width:0; display:flex; flex-direction:column; line-height:1.35;}\
.zf-bar-text small{font-size:.68rem; color:var(--text-muted,#9c9c95);}\
.zf-bar-text strong{font-size:.95rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}\
.zf-bar button{font:inherit; cursor:pointer; color:#f2f1ec; background:transparent; border:1px solid rgba(220,220,214,.35); border-radius:999px; min-height:38px; padding:0 .85rem; font-size:.85rem; display:inline-flex; align-items:center; justify-content:center; flex:none;}\
.zf-bar button:hover{border-color:#f2f1ec;}\
.zf-bar .zf-bar-pp{width:42px; height:42px; padding:0; background:#f2f1ec; color:#151515; border-color:#f2f1ec;}\
.zf-bar .zf-bar-pp svg{width:18px; height:18px;}\
.zf-bar .zf-bar-x{width:38px; padding:0; font-size:1.15rem; line-height:1;}\
.zf-bar-prog{position:absolute; left:0; right:0; top:-1px; height:2px; background:rgba(220,220,214,.15);}\
.zf-bar-prog span{display:block; height:100%; width:0; background:var(--gold-soft,#dcdcd6);}\
html[dir="rtl"] .zf-bar-prog span{margin-inline-start:auto;}\
body.zf-bar-on{padding-bottom:78px;}\
.zf-reader{position:fixed; left:0; right:0; top:0; bottom:0; z-index:9990; display:none; flex-direction:column; background:#151515;}\
.zf-reader.on{display:flex;}\
.zf-reader.bar{bottom:var(--zf-bar-h,0px);}\
.zf-reader-head{display:flex; align-items:center; gap:.8rem; padding:.55rem .9rem; border-bottom:1px solid rgba(220,220,214,.2); background:#1b1b1b; color:#f2f1ec;}\
.zf-reader-head button{font:inherit; cursor:pointer; color:#f2f1ec; background:transparent; border:1px solid rgba(220,220,214,.35); border-radius:999px; min-height:38px; padding:0 1rem; font-size:.9rem;}\
.zf-reader-head button:hover{border-color:#f2f1ec;}\
.zf-reader-head span{font-size:.78rem; color:var(--text-muted,#9c9c95);}\
.zf-reader iframe{flex:1; width:100%; border:0; background:#151515; opacity:0; transition:opacity .25s;}\
.zf-reader iframe.ready{opacity:1;}\
.zf-reader-load{position:absolute; left:0; right:0; top:60px; text-align:center; color:var(--text-muted,#9c9c95); font-size:.95rem; pointer-events:none;}\
body.zf-reader-open{overflow:hidden;}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- per-card "now playing" badge ---------- */
  cards.forEach(function(c){
    var b = document.createElement('div'); b.className = 'zf-card-now';
    b.innerHTML = '<span class="zf-eq"><i></i><i></i><i></i></span><span class="zf-now-text"></span>';
    c.appendChild(b);
  });

  /* ---------- bottom bar ---------- */
  var ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  var bar = document.createElement('div'); bar.className = 'zf-bar';
  bar.innerHTML = '<div class="zf-bar-prog"><span></span></div>' +
    '<span class="zf-eq paused"><i></i><i></i><i></i></span>' +
    '<div class="zf-bar-text"><small class="zf-bar-now"></small><strong class="zf-bar-title"></strong></div>' +
    '<button type="button" class="zf-bar-read"></button>' +
    '<button type="button" class="zf-bar-pp"></button>' +
    '<button type="button" class="zf-bar-x" aria-label="Close">&times;</button>';
  document.body.appendChild(bar);
  var barEq = bar.querySelector('.zf-eq'), barTitle = bar.querySelector('.zf-bar-title'), barNow = bar.querySelector('.zf-bar-now'),
      barRead = bar.querySelector('.zf-bar-read'), barPP = bar.querySelector('.zf-bar-pp'), barX = bar.querySelector('.zf-bar-x'),
      barProg = bar.querySelector('.zf-bar-prog span');

  var cur = -1;                       // index of the card whose audio is the "current" one
  function audioOf(i){ return cards[i] ? cards[i].querySelector('audio') : null; }
  function numOf(i){ return cards[i].id; }   /* e.g. 'nazm-3' or 'ghazal-8' */
  function isGhazal(i){ return i >= 0 && /^ghazal-/.test(cards[i].id); }
  function titleOf(i){ var h = cards[i].querySelector('h3'); return h ? h.textContent.trim() : ''; }
  function isPlaying(a){ return a && !a.paused && !a.ended; }

  function refreshTexts(){
    cards.forEach(function(c){ c.querySelector('.zf-now-text').textContent = T('now'); });
    barNow.textContent = T('now');
    barRead.textContent = T(isGhazal(cur) ? 'readG' : 'read');
    barX.setAttribute('aria-label', T('close'));
    if(cur >= 0){
      barTitle.textContent = titleOf(cur);
      var a = audioOf(cur); var p = isPlaying(a);
      barPP.innerHTML = p ? ICON_PAUSE : ICON_PLAY;
      barPP.setAttribute('aria-label', p ? T('pause') : T('play'));
    }
    if(readerTitleEl && readerN) readerTitleEl.textContent = titleOf(readerIdx()) + ' · ' + T('playingHint');
    if(readerBack) readerBack.textContent = '← ' + T('back');
  }
  function refreshState(){
    cards.forEach(function(c, i){
      var a = c.querySelector('audio');
      c.classList.toggle('is-playing', isPlaying(a));
    });
    if(cur >= 0){
      var a = audioOf(cur), p = isPlaying(a);
      bar.classList.add('on'); document.body.classList.add('zf-bar-on');
      barEq.classList.toggle('paused', !p);
      barPP.innerHTML = p ? ICON_PAUSE : ICON_PLAY;
      barPP.setAttribute('aria-label', p ? T('pause') : T('play'));
      barTitle.textContent = titleOf(cur);
      barRead.textContent = T(isGhazal(cur) ? 'readG' : 'read');
      barRead.style.display = readerOpen ? 'none' : '';
      document.documentElement.style.setProperty('--zf-bar-h', bar.offsetHeight + 'px');
    }
    if('mediaSession' in navigator && cur >= 0){
      try{ navigator.mediaSession.playbackState = isPlaying(audioOf(cur)) ? 'playing' : 'paused'; }catch(e){}
    }
  }
  function setMeta(){
    if(!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined' || cur < 0) return;
    try{ navigator.mediaSession.metadata = new MediaMetadata({title: titleOf(cur), artist: isGhazal(cur) ? 'Farheen Nazar · Zaan Farzaan' : 'Zaan Farzaan', album: isGhazal(cur) ? 'Ghazals' : 'Nazms'}); }catch(e){}
  }

  /* ---------- modes: once / repeat / next ---------- */
  var modeBtns = [].slice.call(document.querySelectorAll('.audio-mode'));
  var mode = store('zf-audio-mode'); if(['once','repeat','next'].indexOf(mode) < 0) mode = 'once';
  function applyMode(m, save){
    mode = m; if(save) store('zf-audio-mode', m);
    modeBtns.forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-mode') === m ? 'true' : 'false'); });
    cards.forEach(function(c){ var a = c.querySelector('audio'); if(a) a.loop = (m === 'repeat'); });
  }
  modeBtns.forEach(function(b){ b.addEventListener('click', function(){ applyMode(b.getAttribute('data-mode'), true); }); });
  applyMode(mode, false);

  /* ---------- playback events (media events do not bubble -> capture) ---------- */
  function playIndex(i, scroll){
    var a = audioOf(i); if(!a) return;
    a.currentTime = 0;
    var pr = a.play(); if(pr && pr.catch) pr.catch(function(){});
    if(scroll && !readerOpen){ cards[i].scrollIntoView({behavior:'smooth', block:'center'}); }
  }
  document.addEventListener('play', function(e){
    if(e.target.tagName !== 'AUDIO') return;
    var i = cards.indexOf(e.target.closest('.audio-track')); if(i < 0) return;
    cards.forEach(function(c, j){ if(j !== i){ var o = c.querySelector('audio'); if(o && !o.paused) o.pause(); } });
    cur = i; setMeta(); refreshState();
  }, true);
  document.addEventListener('pause', function(e){ if(e.target.tagName === 'AUDIO') refreshState(); }, true);
  document.addEventListener('ended', function(e){
    if(e.target.tagName !== 'AUDIO') return;
    var i = cards.indexOf(e.target.closest('.audio-track')); if(i < 0) return;
    refreshState();
    if(mode === 'next' && i + 1 < cards.length){ playIndex(i + 1, true); }
  }, true);
  document.addEventListener('timeupdate', function(e){
    if(e.target.tagName !== 'AUDIO' || cards.indexOf(e.target.closest('.audio-track')) !== cur) return;
    var a = e.target; if(a.duration) barProg.style.width = (100 * a.currentTime / a.duration) + '%';
  }, true);

  barPP.addEventListener('click', function(){
    var a = audioOf(cur); if(!a) return;
    if(a.paused){ var pr = a.play(); if(pr && pr.catch) pr.catch(function(){}); } else { a.pause(); }
  });
  barX.addEventListener('click', function(){
    var a = audioOf(cur); if(a) a.pause();
    cur = -1; bar.classList.remove('on'); document.body.classList.remove('zf-bar-on'); reader && reader.classList.remove('bar');
    refreshState();
  });
  barRead.addEventListener('click', function(){ if(cur >= 0) openReader(numOf(cur)); });

  if('mediaSession' in navigator){
    try{
      navigator.mediaSession.setActionHandler('play', function(){ var a = audioOf(cur); if(a) a.play(); });
      navigator.mediaSession.setActionHandler('pause', function(){ var a = audioOf(cur); if(a) a.pause(); });
      navigator.mediaSession.setActionHandler('previoustrack', function(){ if(cur > 0) playIndex(cur - 1, true); });
      navigator.mediaSession.setActionHandler('nexttrack', function(){ if(cur >= 0 && cur + 1 < cards.length) playIndex(cur + 1, true); });
    }catch(e){}
  }

  /* ---------- reader overlay (nazm page inside this page, audio keeps playing) ---------- */
  var reader = null, readerFrame = null, readerTitleEl = null, readerBack = null, readerLoad = null, readerOpen = false, readerN = null, readerTimer = null;
  function readerIdx(){ for(var i = 0; i < cards.length; i++){ if(numOf(i) === String(readerN)) return i; } return 0; }
  function buildReader(){
    if(reader) return;
    reader = document.createElement('div'); reader.className = 'zf-reader';
    reader.innerHTML = '<div class="zf-reader-head"><button type="button" class="zf-reader-back"></button><span class="zf-reader-title"></span></div>' +
      '<div class="zf-reader-load"></div><iframe title="Nazm"></iframe>';
    document.body.appendChild(reader);
    readerFrame = reader.querySelector('iframe'); readerTitleEl = reader.querySelector('.zf-reader-title');
    readerBack = reader.querySelector('.zf-reader-back'); readerLoad = reader.querySelector('.zf-reader-load');
    readerBack.addEventListener('click', function(){ if(history.state && history.state.zfReader){ history.back(); } else { closeReader(); } });
    readerFrame.addEventListener('load', function(){ clearInterval(readerTimer); tidyFrame(); readerFrame.classList.add('ready'); readerLoad.textContent = ''; });
  }
  function tidyFrame(){
    try{
      var d = readerFrame.contentDocument; if(!d || !d.head || d.getElementById('zf-embed-css')) return;
      var s = d.createElement('style'); s.id = 'zf-embed-css';
      s.textContent = 'nav,footer.site-footer,.back-link,#zf-splash{display:none !important} html,body{overflow-x:hidden}';
      d.head.appendChild(s);
    }catch(e){}
  }
  function openReader(n, fromPop){
    buildReader();
    readerN = n; readerOpen = true;
    store('zf-lang', lang());                                  // the nazm page opens in the language chosen here
    readerFrame.classList.remove('ready'); readerLoad.textContent = T('loading');
    readerFrame.src = n + '.html';
    clearInterval(readerTimer);
    readerTimer = setInterval(tidyFrame, 25);                  // hide nav/splash as early as possible
    setTimeout(function(){ clearInterval(readerTimer); if(readerOpen) readerFrame.classList.add('ready'); }, 6000);
    reader.classList.add('on'); reader.classList.toggle('bar', bar.classList.contains('on'));
    document.body.classList.add('zf-reader-open');
    refreshTexts(); refreshState();
    reader.classList.toggle('bar', bar.classList.contains('on'));
    if(!fromPop){ try{ history.pushState({zfReader: n}, '', location.pathname + location.search + '#' + n); }catch(e){} }
  }
  function closeReader(){
    if(!reader || !readerOpen) return;
    readerOpen = false; reader.classList.remove('on'); document.body.classList.remove('zf-reader-open');
    clearInterval(readerTimer); readerFrame.src = 'about:blank'; readerFrame.classList.remove('ready');
    refreshState();
  }
  window.addEventListener('popstate', function(){ if(readerOpen) closeReader(); });

  list.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('.audio-track-read') : null;
    if(!a) return;
    if(e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    openReader(a.closest('.audio-track').id);
  });

  /* language toggle: refresh our own texts after i18n has swapped the page */
  document.addEventListener('click', function(e){
    if(e.target.closest && e.target.closest('#lang-toggle')) setTimeout(function(){ refreshTexts(); refreshState(); }, 120);
  });
  refreshTexts();
})();
