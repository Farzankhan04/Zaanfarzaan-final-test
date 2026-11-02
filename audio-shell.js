/* audio-shell.js — keeps audio playing while you move around the site.
   When an audio is playing and you tap a link to another page of this site, that page opens in a full-screen frame ABOVE the current page
   (which stays alive underneath and keeps playing), with a small player bar at the bottom: back / title / play-pause / stop.
   If you start another audio inside the frame and then move on, it is handed over to the bar's own player so it keeps going too.
   Phone back button closes the frame (or goes back inside it first). */
(function(){
  'use strict';
  if(window.__zfShell) return; window.__zfShell = true;
  if(window.self !== window.top) return;
  if(/admin-comments/.test(location.pathname)) return;

  var cur = null;            /* the audio element the bar controls */
  var seen = null;           /* last audio that started in this page */
  var P = null;              /* the bar's own audio element (used when something is handed over) */
  var shell = null, frame = null, bar = null, open = false;

  function lang(){ return (window.ZF_LANG === 'en' || window.ZF_LANG === 'ur') ? window.ZF_LANG : 'hi'; }
  var TX = {
    hi:{back:'← वापस', play:'चलाएँ', pause:'रोकें', stop:'बंद करें'},
    en:{back:'← Back', play:'Play', pause:'Pause', stop:'Stop'},
    ur:{back:'← واپس', play:'چلائیں', pause:'روکیں', stop:'بند کریں'}
  };
  function T(k){ return TX[lang()][k]; }
  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

  function titleFor(a){
    try{
      var d = a.ownerDocument, c, t;
      if((c = a.closest('.audio-track')) && (t = c.querySelector('h3'))) return t.textContent.trim();
      if((c = a.closest('.zf-nzaudio')) && (t = c.querySelector('.zf-nz-t'))) return t.textContent.trim();
      if((c = a.closest('.zf-new-card')) && (t = c.querySelector('.zf-t'))) return t.textContent.trim();
      return (d.title || '').split(/ [—|\-] /)[0].trim() || 'Audio';
    }catch(e){ return 'Audio'; }
  }
  function playing(a){ return !!a && !a.paused && !a.ended; }

  document.addEventListener('play', function(e){
    if(e.target && e.target.tagName === 'AUDIO'){ seen = e.target; if(open){ cur = seen; bind(); refresh(); } }
  }, true);

  function css(){
    if(document.getElementById('zf-shell-css')) return;
    var s = document.createElement('style'); s.id = 'zf-shell-css';
    s.textContent = '.zf-shell{position:fixed;left:0;right:0;top:0;bottom:var(--zf-shell-h,62px);z-index:9985;background:#151515}'+
      '.zf-shell iframe{width:100%;height:100%;border:0;background:#151515;display:block}'+
      '.zf-shellbar{position:fixed;left:0;right:0;bottom:0;z-index:10001;display:flex;align-items:center;gap:.6rem;padding:.5rem .8rem .65rem;background:#1b1b1b;color:#f2f1ec;border-top:1px solid rgba(220,220,214,.3);box-sizing:border-box}'+
      '.zf-shellbar .t{flex:1;min-width:0;font-size:.92rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
      '.zf-shellbar .p{height:3px;position:absolute;left:0;top:-1px;background:var(--gold-soft,#dcdcd6);width:0}'+
      '.zf-shellbar button{font:inherit;cursor:pointer;color:#f2f1ec;background:transparent;border:1px solid rgba(220,220,214,.35);border-radius:999px;min-height:38px;padding:0 .8rem;font-size:.85rem;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap}'+
      '.zf-shellbar .pp{width:42px;height:42px;padding:0;background:#f2f1ec;color:#151515;border-color:#f2f1ec}'+
      '.zf-shellbar .x{width:38px;padding:0;font-size:1.15rem}'+
      'body.zf-shell-open{overflow:hidden} body.zf-shell-open .zf-bar{display:none !important}';
    document.head.appendChild(s);
  }

  function bind(){
    if(!cur || cur.__zfShellBound) return;
    cur.__zfShellBound = true;
    ['play','pause','ended','timeupdate'].forEach(function(ev){ cur.addEventListener(ev, function(){ if(open) refresh(); }); });
  }
  function refresh(){
    if(!bar || !cur) return;
    bar.querySelector('.t').textContent = cur.__zfTitle || titleFor(cur);
    var pp = bar.querySelector('.pp'), p = playing(cur);
    pp.innerHTML = p ? ICON_PAUSE : ICON_PLAY; pp.setAttribute('aria-label', p ? T('pause') : T('play'));
    bar.querySelector('.p').style.width = (cur.duration ? Math.min(100, cur.currentTime / cur.duration * 100) : 0) + '%';
    bar.querySelector('.bk').textContent = T('back');
    document.documentElement.style.setProperty('--zf-shell-h', bar.offsetHeight + 'px');
  }

  function handOver(a){       /* an audio inside the frame is about to be unloaded: carry on in the bar's own player */
    try{
      if(!playing(a) || !a.currentSrc) return;
      if(!P){ P = new Audio(); P.preload = 'auto'; }
      var t = a.currentTime, title = titleFor(a);
      P.src = a.currentSrc; P.__zfTitle = title;
      var go = function(){ try{ P.currentTime = t; }catch(e){} var pr = P.play(); if(pr && pr.catch) pr.catch(function(){}); };
      if(P.readyState >= 1) go(); else P.addEventListener('loadedmetadata', function f(){ P.removeEventListener('loadedmetadata', f); go(); });
      P.load();
      try{ a.pause(); }catch(e){}
      if(cur && cur !== P && playing(cur)) cur.pause();
      cur = P; bind(); setTimeout(refresh, 50);
    }catch(e){}
  }

  function onFrameLoad(){
    var w, d;
    try{ w = frame.contentWindow; d = frame.contentDocument; }catch(e){ return; }
    if(!d) return;
    try{
      d.addEventListener('play', function(e){
        if(e.target && e.target.tagName === 'AUDIO' && cur && cur !== e.target && playing(cur)) cur.pause();   /* one sound at a time */
      }, true);
      w.addEventListener('pagehide', function(){
        var list = d.querySelectorAll('audio');
        for(var i = 0; i < list.length; i++){ if(playing(list[i])){ handOver(list[i]); break; } }
      });
    }catch(e){}
    refresh();
  }
  function tidy(){
    try{
      var d = frame.contentDocument; if(!d || !d.head || d.getElementById('zf-shell-embed')) return;
      var s = d.createElement('style'); s.id = 'zf-shell-embed';
      s.textContent = 'html::before,html::after{display:none !important} #zf-splash{display:none !important}';
      d.head.appendChild(s);
    }catch(e){}
  }

  function openShell(url){
    css();
    if(!shell){
      shell = document.createElement('div'); shell.className = 'zf-shell';
      frame = document.createElement('iframe'); frame.title = 'page';
      shell.appendChild(frame);
      bar = document.createElement('div'); bar.className = 'zf-shellbar';
      bar.innerHTML = '<div class="p"></div><button type="button" class="bk"></button><div class="t"></div><button type="button" class="pp"></button><button type="button" class="x" aria-label="stop">&times;</button>';
      bar.querySelector('.bk').addEventListener('click', function(){ if(history.state && history.state.zfShell) history.back(); else closeShell(); });
      bar.querySelector('.pp').addEventListener('click', function(){
        if(!cur) return;
        if(playing(cur)) cur.pause(); else { try{ var d = frame.contentDocument; [].forEach.call(d.querySelectorAll('audio'), function(a){ if(a !== cur) a.pause(); }); }catch(e){} var pr = cur.play(); if(pr && pr.catch) pr.catch(function(){}); }
        refresh();
      });
      bar.querySelector('.x').addEventListener('click', function(){ if(cur) cur.pause(); bar.style.display = 'none'; shell.style.bottom = '0'; });
      frame.addEventListener('load', function(){ tidy(); onFrameLoad(); });
    }
    cur = seen; bind();
    document.body.appendChild(shell); document.body.appendChild(bar);
    bar.style.display = ''; shell.style.bottom = '';
    document.body.classList.add('zf-shell-open'); open = true;
    frame.src = url;
    var iv = setInterval(tidy, 25); setTimeout(function(){ clearInterval(iv); }, 3000);
    refresh();
    try{ history.pushState({zfShell: 1}, '', location.href); }catch(e){}
  }
  function closeShell(){
    if(!open) return;
    open = false;
    if(P && cur === P){ P.pause(); }
    cur = seen;
    if(shell && shell.parentNode) shell.remove(); if(bar && bar.parentNode) bar.remove();
    if(frame) frame.src = 'about:blank';
    document.body.classList.remove('zf-shell-open');
  }
  window.addEventListener('popstate', function(){ if(open) closeShell(); });
  window.addEventListener('zf-sleep', function(){ try{ if(P){ P.pause(); P.volume = 1; } }catch(e){} });

  document.addEventListener('click', function(e){
    if(e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]'); if(!a) return;
    if(!playing(seen) || open) return;
    if(a.target && a.target !== '_self') return;
    if(a.hasAttribute('download') || a.closest('#lang-toggle') || a.classList.contains('lang-opt') || a.classList.contains('audio-track-read')) return;
    var href = a.getAttribute('href') || '';
    if(!href || href.charAt(0) === '#' || /^(javascript|mailto|tel|whatsapp|intent):/i.test(href)) return;
    var u; try{ u = new URL(a.href, location.href); }catch(x){ return; }
    if(u.origin !== location.origin) return;
    if(!/(\.html|\/)$/i.test(u.pathname)) return;
    if(/admin-comments|offline\.html/.test(u.pathname)) return;
    if(u.pathname === location.pathname && !u.search) return;
    e.preventDefault();
    openShell(u.pathname.replace(/^\//, '') + u.search + u.hash);
  }, true);   /* capture: runs before the page-fade handler in app.js */
})();
