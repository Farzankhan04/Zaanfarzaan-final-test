/* NEWSLETTER SWITCH — put your Buttondown username between the quotes (the last part of
   buttondown.com/<username>) and upload this file. Until it is filled in, no newsletter box
   is shown anywhere, so nobody ever sees a form that does not work. */
window.ZF_NEWSLETTER_USERNAME = 'Zaanfarzaan';

/* SPLASH CLEANUP — the opening "Zaan Farzaan" splash (see #zf-splash in
   style.css and the top of <body> on every page) shows and hides itself
   on a pure CSS animation, so the page works even if this script is
   blocked. This just removes the element once that animation ends, so
   it isn't left sitting invisibly in the DOM. */
(function(){
  var splash = document.getElementById('zf-splash');
  if(!splash) return;
  splash.addEventListener('animationend', function(){
    if(splash.parentNode) splash.parentNode.removeChild(splash);
  });
})();

/* SCROLL PERF FLAG — adds .is-scrolling to <html> while the page is
   actively being scrolled and removes it ~200ms after scrolling stops.
   style.css uses this to pause the nav's backdrop-blur and the
   poem-card background drift (see "Smooth-scroll perf" there), which is
   what was making scroll feel stuttery, especially on ghazal/nazm pages.
   Passive + a single trailing timeout, so this adds no real cost of its
   own on the scroll path. */
(function(){
  var root = document.documentElement, t = null;
  window.addEventListener('scroll', function(){
    if(!root.classList.contains('is-scrolling')) root.classList.add('is-scrolling');
    clearTimeout(t);
    t = setTimeout(function(){ root.classList.remove('is-scrolling'); }, 200);
  }, {passive:true});
})();

/* SIGNATURE FLOURISH — a small pen-nib traces the stroke beneath the
   poet's name on the homepage hero, then stops and stays right where
   the line ends (see .signature-flourish/.sig-line/.sig-pen in
   style.css). Driven by requestAnimationFrame rather than a plain CSS
   animation so the pen's position + rotation and the line's own
   reveal are always computed from the exact same "how far along the
   path" number, frame by frame — a separate CSS animation on each
   couldn't guarantee they'd stay perfectly in step. Runs once; skipped
   under prefers-reduced-motion, where the CSS above already shows the
   finished line with the pen parked at the end, no animation. */
(function(){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var svg = document.querySelector('.signature-flourish');
  if(!svg) return;
  var line = svg.querySelector('.sig-line');
  var pen = svg.querySelector('.sig-pen');
  if(!line || !pen) return;

  var total = line.getTotalLength();
  line.style.strokeDasharray = total;
  line.style.strokeDashoffset = total;

  var DURATION = 1150, DELAY = 1000, startTime = null;
  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  function frame(ts){
    if(startTime === null) startTime = ts;
    var elapsed = ts - startTime - DELAY;
    if(elapsed < 0){ requestAnimationFrame(frame); return; }
    var t = Math.min(elapsed / DURATION, 1);
    var dist = easeOutCubic(t) * total;
    line.style.strokeDashoffset = total - dist;
    pen.style.opacity = 1;
    var pt = line.getPointAtLength(dist);
    var behind = line.getPointAtLength(Math.max(0, dist - 0.6));
    var angle = Math.atan2(pt.y - behind.y, pt.x - behind.x) * 180 / Math.PI;
    pen.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ') rotate(' + angle + ')');
    if(t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* NAV: mobile toggle + active link highlight */
(function(){
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if(toggle && links){
    toggle.addEventListener('click', function(){
      links.classList.toggle('open');
    });
  }
  const here = document.body.getAttribute('data-page');
  document.querySelectorAll('.navlinks a').forEach(function(a){
    if(a.getAttribute('data-page') === here) a.classList.add('active');
  });
})();

/* REVEAL ON SCROLL — .reveal covers the original home page elements;
   the extra selectors extend the exact same fade-up-once-visible
   treatment to the rest of the site (about/contact/support pages, the
   footer) without needing that class added to every page by hand. */
(function(){
  const revealEls = document.querySelectorAll('.reveal, .about-page, .contact-page, .support-page, footer.site-footer');
  const io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, {threshold:0.1});
  revealEls.forEach(function(el){ io.observe(el); });
})();

/* TOAST */
function showToast(msg){
  let toast = document.getElementById('site-toast');
  if(!toast){
    toast = document.createElement('div');
    toast.id = 'site-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function(){ toast.classList.remove('show'); }, 2200);
}

/* SHARE LINKS - by default a shared ghazal/nazm points at that poem's own page
   (ghazal-N.html / nazm-N.html): WhatsApp/Instagram previews then show the poem itself,
   and the link counts for that page in Google. Set ZF_SHARE_STANDALONE to false to go
   back to the old behaviour (a #hash link that opens the poem inside the list page). */
window.ZF_SHARE_STANDALONE = true;
window.zfStandaloneUrl = function(id){
  if(window.ZF_SHARE_STANDALONE && /^(ghazal|nazm)-\d+$/.test(id)){
    return window.location.origin + '/' + id + '.html';
  }
  return null;
};

/* SHARE */
function shareCard(card){
  const kindEl = card.querySelector('.kind');
  const kindText = kindEl ? kindEl.textContent.trim() : window.ZF_T('defaultKind');
  const url = window.zfStandaloneUrl(card.id) || (window.location.origin + window.location.pathname + '#' + card.id);
  const shareData = { title: window.ZF_T('brandName') + ' — ' + kindText, text: window.ZF_T('shareTextPrefix') + kindText, url: url };
  if(navigator.share){
    navigator.share(shareData).catch(function(){});
  } else if(navigator.clipboard){
    navigator.clipboard.writeText(url).then(function(){ showToast(window.ZF_T('linkCopied')); }).catch(function(){ window.prompt(window.ZF_T('copyPrompt'), url); });
  } else {
    window.prompt(window.ZF_T('copyPrompt'), url);
  }
}

/* DOWNLOAD AS IMAGE */
const shareIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><line x1="8.3" y1="10.6" x2="15.6" y2="6.4"/><line x1="8.3" y1="13.4" x2="15.6" y2="17.6"/></svg>';
const downloadIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/></svg>';
const heartIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
const copyIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="1.5"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>';

/* COPY AS TEXT — pulls the plain-text lines out of a .manuscript card
   (same verse source buildExportCard reads) and puts them on the
   clipboard, signed the same way a shared link is. Same fallback chain
   as shareCard/copyUpiId for browsers without the Clipboard API. */
function cardPlainText(card){
  const verses = card.querySelectorAll('.verse');
  const lines = [];
  /* A nazm's verses are plain '.verse.nazm-line' blocks (one line each, no '.line' spans),
     and the nazm title sits in an <h3>. A ghazal's verses are couplets made of '.line' spans. */
  const isNazm = card.querySelector('.nazm-line') !== null;
  const titleEl = card.querySelector('h3');
  if(isNazm && titleEl){ lines.push(titleEl.textContent.trim()); lines.push(''); }
  verses.forEach(function(v, i){
    const spans = v.querySelectorAll('.line');
    if(spans.length){
      if(i > 0) lines.push('');
      spans.forEach(function(l){ lines.push(l.textContent.trim()); });
    } else {
      lines.push(v.textContent.trim());
    }
  });
  const brandName = window.ZF_T('brandName');
  return lines.join('\n') + '\n\n— ' + brandName + '\nzaanfarzaan.site';
}
/* Clipboard helper: modern Clipboard API first; if the browser refuses it (some in-app
   browsers / WebViews do) fall back to the old select-and-copy trick, and only then to a
   prompt box. Used by the poem 'Copy text' button and the homepage sher 'Copy text' button. */
window.zfCopyText = function(text, done){
  function legacyCopy(){
    try{
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
      document.body.appendChild(ta);
      ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
      const okCopy = document.execCommand('copy');
      document.body.removeChild(ta);
      return okCopy;
    }catch(e){ return false; }
  }
  function fallback(){
    if(legacyCopy()) done();
    else window.prompt(window.ZF_T('copyPrompt'), text);
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
};
function copyCardText(card, btn){
  const text = cardPlainText(card);
  function done(){
    showToast(window.ZF_T('copiedToClipboard'));
    if(btn){ btn.classList.add('copied'); setTimeout(function(){ btn.classList.remove('copied'); }, 1600); }
  }
  window.zfCopyText(text, done);
}

/* FAVORITES — a private "पसंद" list, stored only on this device. Shared
   key/format with the reading-progress tracker's id style ('ghazal-5',
   'nazm-3'), so the My Favorites page can look each id straight up in
   GHAZAL_ITEMS / NAZM_ITEMS. */
var ZF_FAV_KEY = 'zf-favorite-poems';
function zfGetFavorites(){
  try{ return JSON.parse(localStorage.getItem(ZF_FAV_KEY) || '[]'); }catch(e){ return []; }
}
function zfIsFavorite(id){ return zfGetFavorites().indexOf(id) !== -1; }
function zfToggleFavorite(id){
  var favs = zfGetFavorites();
  var idx = favs.indexOf(id);
  if(idx === -1) favs.push(id); else favs.splice(idx, 1);
  try{ localStorage.setItem(ZF_FAV_KEY, JSON.stringify(favs)); }catch(e){}
  if(typeof window.ZF_onFavoriteToggled === 'function') window.ZF_onFavoriteToggled(id);
  return idx === -1; /* true if it just became a favorite */
}
window.ZF_isFavorite = zfIsFavorite;
window.ZF_toggleFavorite = zfToggleFavorite;

/* INK-SEAL POP — a small ripple played once on a favorite button right
   when a poem is freshly favorited (see style.css .seal-pop). Removing
   then re-adding the class (with a reflow in between) lets it replay
   on repeated favorite/unfavorite/favorite clicks, not just the first. */
function zfSealPop(btn){
  if(!btn) return;
  btn.classList.remove('seal-pop');
  void btn.offsetWidth;
  btn.classList.add('seal-pop');
}
window.ZF_sealPop = zfSealPop;

function buildExportCard(card){
  const kindEl = card.querySelector('.kind');
  const titleEl = card.querySelector('h3');
  const verses = card.querySelectorAll('.verse');

  const wrap = document.createElement('div');
  wrap.className = 'export-card';

  const kindDiv = document.createElement('div');
  kindDiv.className = 'export-kind';
  /* "Ghazal · #12" -> "Ghazal" — drop the catalog number for the
     shared image, keep it on the live page (untouched above). */
  kindDiv.textContent = kindEl ? kindEl.textContent.trim().split('·')[0].trim() : '';
  wrap.appendChild(kindDiv);

  if(titleEl){
    const h = document.createElement('div');
    h.className = 'export-title';
    h.textContent = titleEl.textContent.trim();
    wrap.appendChild(h);
  }

  const body = document.createElement('div');
  body.className = 'export-body';
  verses.forEach(function(v){
    const clone = v.cloneNode(true);
    clone.className = 'export-verse' + (v.classList.contains('nazm-line') ? ' nazm-line' : '');
    body.appendChild(clone);
  });
  wrap.appendChild(body);

  const footer = document.createElement('div');
  footer.className = 'export-footer';
  footer.innerHTML = '<span class="export-brand">' + window.ZF_T('brandName') + '</span><span class="export-site">zaanfarzaan.site</span>';
  wrap.appendChild(footer);

  return wrap;
}

function downloadCard(card, btn){
  /* html2canvas is loaded async (so it can never block the page); if someone taps
     Download before it has arrived, fail politely instead of throwing. */
  if(typeof html2canvas === 'undefined'){ showToast(window.ZF_T('downloadFailed')); return; }
  if(btn) btn.classList.add('loading');

  const stage = document.createElement('div');
  stage.className = 'export-stage';
  const exportCard = buildExportCard(card);
  stage.appendChild(exportCard);
  document.body.appendChild(stage);

  html2canvas(exportCard, { backgroundColor: '#f7f7f4', scale: 2, useCORS: true, width: 760, windowWidth: 760 }).then(function(canvas){
    document.body.removeChild(stage);
    if(btn) btn.classList.remove('loading');

    const kindEl = card.querySelector('.kind');
    const titleEl = card.querySelector('h3');
    let baseName = titleEl ? titleEl.textContent.trim() : (kindEl ? kindEl.textContent.trim() : 'zaan-farzaan');
    baseName = baseName.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-');

    const link = document.createElement('a');
    link.download = 'zaan-farzaan-' + baseName + '.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }).catch(function(){
    if(document.body.contains(stage)) document.body.removeChild(stage);
    if(btn) btn.classList.remove('loading');
    showToast(window.ZF_T('downloadFailed'));
  });
}

/* SUPPORT PAGE — copy UPI ID to clipboard (same fallback chain as shareCard) */
function copyUpiId(upiId, btn){
  function done(){
    showToast(window.ZF_T('upiIdCopied'));
    if(btn){ btn.classList.add('copied'); setTimeout(function(){ btn.classList.remove('copied'); }, 1600); }
  }
  if(navigator.clipboard){
    navigator.clipboard.writeText(upiId).then(done).catch(function(){ window.prompt(window.ZF_T('copyPrompt'), upiId); });
  } else {
    window.prompt(window.ZF_T('copyPrompt'), upiId);
  }
}

/* SUPPORT PAGE — click-to-reveal QR. Toggles a max-height class on the
   panel and an "active" class on the button; the two label spans inside
   the button (qr-show-label / qr-hide-label) are shown/hidden purely by
   that "active" class in CSS, never by touching their innerHTML — so the
   language engine's own data-en/data-ur swap on each span keeps working
   regardless of which one is currently visible. */
function toggleQr(btn){
  const panel = document.getElementById('qr-reveal');
  if(!panel) return;
  const isOpen = panel.classList.toggle('open');
  btn.classList.toggle('active', isOpen);
  btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

/* Attach share + download buttons to every .manuscript card found on the page */
function attachCardActions(root){
  (root || document).querySelectorAll('.manuscript').forEach(function(card){
    if(card.querySelector('.share-btn')) return; // already attached
    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'share-btn';
    shareBtn.setAttribute('aria-label', window.ZF_T('shareAria'));
    shareBtn.innerHTML = shareIconSvg;
    shareBtn.addEventListener('click', function(e){ e.stopPropagation(); shareCard(card); });
    card.appendChild(shareBtn);

    const dlBtn = document.createElement('button');
    dlBtn.type = 'button';
    dlBtn.className = 'download-btn';
    dlBtn.setAttribute('aria-label', window.ZF_T('downloadAria'));
    dlBtn.innerHTML = downloadIconSvg;
    dlBtn.addEventListener('click', function(e){ e.stopPropagation(); downloadCard(card, dlBtn); });
    card.appendChild(dlBtn);

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.setAttribute('aria-label', window.ZF_T('copyAria'));
    copyBtn.innerHTML = copyIconSvg;
    copyBtn.addEventListener('click', function(e){ e.stopPropagation(); copyCardText(card, copyBtn); });
    card.appendChild(copyBtn);

    if(card.id){
      const favBtn = document.createElement('button');
      favBtn.type = 'button';
      favBtn.className = 'favorite-btn';
      favBtn.innerHTML = heartIconSvg;
      function syncFavBtn(){
        var on = zfIsFavorite(card.id);
        favBtn.classList.toggle('active', on);
        favBtn.setAttribute('aria-label', window.ZF_T(on ? 'unfavoriteAria' : 'favoriteAria'));
      }
      syncFavBtn();
      favBtn.addEventListener('click', function(e){
        e.stopPropagation();
        var justFavorited = zfToggleFavorite(card.id);
        syncFavBtn();
        if(justFavorited) zfSealPop(favBtn);
      });
      card.appendChild(favBtn);
    }
  });
}

/* READING PROGRESS — mark a ghazal/nazm detail page as "read" the moment
   someone opens it. Storage-only here (shared on every page via app.js);
   the home page's badge that DISPLAYS the count lives in home-features.js
   and reads the same 'zf-read-poems' key. Nothing is sent anywhere. */
(function(){
  var m = window.location.pathname.match(/\/(?:(?:ghazals|nazms)\/)?(ghazal|nazm)-(\d+)\.html$/);
  if(!m) return;
  var id = m[1] + '-' + m[2];
  try{
    var read = JSON.parse(localStorage.getItem('zf-read-poems') || '[]');
    if(read.indexOf(id) === -1){
      read.push(id);
      localStorage.setItem('zf-read-poems', JSON.stringify(read));
    }
  }catch(e){}
})();

/* PAGE TRANSITIONS — a soft fade when moving between pages on this site,
   instead of the usual hard cut. Only intercepts plain left-clicks on
   same-origin links that will actually navigate the whole page (not
   "#anchor" jumps, not new-tab/modifier clicks, not links the site
   already treats specially like the lang-toggle options, which swap
   content in place rather than navigating). */
(function(){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('click', function(e){
    if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href]');
    if(!a || a.target === '_blank' || a.hasAttribute('download')) return;
    if(a.classList.contains('lang-opt')) return;
    var href = a.getAttribute('href') || '';
    if(!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0 || href.indexOf('upi:') === 0) return;
    var url;
    try{ url = new URL(href, window.location.href); }catch(err){ return; }
    if(url.origin !== window.location.origin) return;
    if(url.pathname === window.location.pathname && url.hash) return;
    e.preventDefault();
    document.documentElement.classList.add('zf-transitioning');
    window.setTimeout(function(){ window.location.href = url.href; }, 200);
  });
  window.addEventListener('pageshow', function(e){
    if(e.persisted){
      document.documentElement.classList.remove('zf-transitioning');
      var s = document.getElementById('zf-splash');
      if(s && s.parentNode) s.parentNode.removeChild(s);
    }
  });
})();

/* NAV CARDS — gentle tilt toward the cursor, desktop/mouse only. */
(function(){
  if(!window.matchMedia || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  document.querySelectorAll('.nav-card').forEach(function(card){
    card.addEventListener('mousemove', function(e){
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(700px) rotateX(' + (py * -6) + 'deg) rotateY(' + (px * 6) + 'deg) translateY(-2px)';
    });
    card.addEventListener('mouseleave', function(){ card.style.transform = ''; });
  });
})();

/* COUNT-UP — animates any [data-count] number upward once it scrolls
   into view (used by the homepage stat strip). */
(function(){
  var els = document.querySelectorAll('.stat-num[data-count]');
  if(!els.length) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting) return;
      io.unobserve(entry.target);
      var target = parseInt(entry.target.getAttribute('data-count'), 10) || 0;
      var start = null;
      var duration = 1100;
      function step(ts){
        if(start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        entry.target.textContent = Math.round(eased * target);
        if(progress < 1) requestAnimationFrame(step);
        else entry.target.textContent = target;
      }
      requestAnimationFrame(step);
    });
  }, {threshold:0.4});
  els.forEach(function(el){ io.observe(el); });
})();

/* QUILL TRAIL — a soft trail of ink-blot marks follows the cursor as it
   moves, like a dipped quill dragged lightly across the page (see
   style.css .ink-trail-dot). Desktop/mouse only — same gate as the
   nav-card tilt effect above — and skipped entirely under
   prefers-reduced-motion, so the listener is never even attached on
   touch devices or when motion is turned down. A new dot only spawns
   once the cursor has actually moved a small distance, so the trail's
   density follows how fast someone is moving the mouse rather than
   how often the browser fires the event. */
(function(){
  if(!window.matchMedia || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var lastX = null, lastY = null, liveDots = 0;
  var MIN_DIST = 24, MAX_DOTS = 16;

  function spawnDot(x, y, size){
    if(liveDots >= MAX_DOTS) return;
    liveDots++;
    var dot = document.createElement('div');
    dot.className = 'ink-trail-dot';
    dot.setAttribute('aria-hidden', 'true');
    dot.style.left = x + 'px';
    dot.style.top = y + 'px';
    dot.style.width = size + 'px';
    dot.style.height = size + 'px';
    document.body.appendChild(dot);
    dot.addEventListener('animationend', function(){
      if(dot.parentNode) dot.parentNode.removeChild(dot);
      liveDots--;
    });
  }

  document.addEventListener('mousemove', function(e){
    if(lastX === null){ lastX = e.clientX; lastY = e.clientY; return; }
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    if((dx*dx + dy*dy) < MIN_DIST*MIN_DIST) return;
    lastX = e.clientX; lastY = e.clientY;
    spawnDot(e.clientX, e.clientY, 6 + Math.random()*7);
  });
})();


/* NEWSLETTER — "new ghazal/nazm in your inbox" box. Uses Buttondown's plain HTML form endpoint
   (no tracking script, no API key). Shown on: home, about, ghazals, nazms, ebook and every
   ghazal-N / nazm-N page. It needs window.ZF_NEWSLETTER_USERNAME (top of this file); with it
   empty nothing is added. Text follows the site language via the same data-en/data-ur
   mechanism as the rest of the site (i18n.js). */
(function(){
  var USER = String(window.ZF_NEWSLETTER_USERNAME || '').trim();
  if(!/^[A-Za-z0-9._-]+$/.test(USER)) return;
  var page = document.body && document.body.getAttribute('data-page');
  if(['home','about','ghazals','nazms','ebook'].indexOf(page) === -1) return;
  var main = document.querySelector('main');
  if(!main || document.getElementById('zf-newsletter')) return;

  var T = {
    tag:   {hi:"Newsletter", en:"Newsletter", ur:"Newsletter"},
    h2:    {hi:"नई ग़ज़लें, नज़्में और ऑडियो सीधे इनबॉक्स में", en:"New Ghazals, Nazms & Audios, in Your Inbox", ur:"نئی غزلیں، نظمیں اور آڈیو، سیدھے ان باکس میں"},
    p:     {hi:"जब भी कोई नई ग़ज़ल, नज़्म या ऑडियो आए, सबसे पहले ईमेल पर पाएँ। कोई स्पैम नहीं।", en:"Get every new ghazal, nazm or audio by email as soon as it is published. No spam.", ur:"جب بھی کوئی نئی غزل، نظم یا آڈیو آئے، سب سے پہلے ای میل پر پائیں۔ کوئی اسپیم نہیں۔"},
    ph:    {hi:"आपका ईमेल", en:"Your email", ur:"آپ کا ای میل"},
    btn:   {hi:"सब्सक्राइब करें", en:"Subscribe", ur:"سبسکرائب کریں"},
    note:  {hi:"आपका ईमेल सिर्फ़ नई रचनाओं और ऑडियो की सूचना भेजने के लिए इस्तेमाल होगा। जब चाहें अनसब्सक्राइब कर सकते हैं।", en:"Your email is used only to tell you about new poems and audios. Unsubscribe any time.", ur:"آپ کا ای میل صرف نئی تخلیقات اور آڈیو کی اطلاع بھیجنے کے لیے استعمال ہوگا۔ جب چاہیں ان سبسکرائب کر سکتے ہیں۔"},
    share: {hi:"WhatsApp पर शेयर करें", en:"Share on WhatsApp", ur:"WhatsApp پر شیئر کریں"},
    msg:   {hi:"नमस्ते! मेरी नई ग़ज़लें, नज़्में और ऑडियो अब सीधे आपके ईमेल पर भी। जैसे ही कुछ नया आए, सबसे पहले आपको मिलेगा। यहाँ से सब्सक्राइब करें:", en:"Hello! My new ghazals, nazms and audios now also reach you directly by email. As soon as something new is out, you get it first. Subscribe here:", ur:"السلام علیکم! میری نئی غزلیں، نظمیں اور آڈیو اب سیدھے آپ کے ای میل پر بھی۔ جیسے ہی کچھ نیا آئے، سب سے پہلے آپ کو ملے گا۔ یہاں سے سبسکرائب کریں:"},
    thanks:{hi:"शुक्रिया! पुष्टि के लिए अपने ईमेल में भेजे गए लिंक पर क्लिक कर दें।", en:"Thank you! Please click the link we just emailed you to confirm.", ur:"شکریہ! تصدیق کے لیے اپنے ای میل میں بھیجے گئے لنک پر کلک کر دیں۔"}
  };
  function d(k){ return 'data-en="'+T[k].en+'" data-ur="'+T[k].ur+'"'; }

  var css = document.createElement('style');
  css.textContent =
    '.zf-newsletter{max-width:640px;margin:4vh auto 6vh;padding:0 6vw;}' +
    '.zf-nl-box{border:1px solid rgba(220,220,214,.28);border-radius:10px;padding:2.2rem 1.8rem;text-align:center;' +
      'background:linear-gradient(160deg,rgba(255,255,255,.045),rgba(255,255,255,.015));box-shadow:0 14px 34px rgba(0,0,0,.35);}' +
    '.zf-nl-tag{color:var(--rose);text-transform:uppercase;letter-spacing:.3em;font-size:.72rem;font-family:"Lora",serif;font-weight:600;margin-bottom:.5rem;}' +
    '.zf-nl-box h2{color:var(--gold-soft);font-size:clamp(1.35rem,3.6vw,1.75rem);font-weight:700;line-height:1.45;margin-bottom:.6rem;' +
      'font-family:"Cormorant Garamond","Noto Serif Devanagari",serif;}' +
    'body.lang-ur .zf-nl-box h2{font-family:"Noto Nastaliq Urdu",serif;line-height:1.9;}' +
    '.zf-nl-box p{color:var(--text-muted);font-size:.98rem;line-height:1.7;margin:0 auto 1.2rem;max-width:480px;}' +
    '.zf-nl-form{display:flex;gap:.6rem;max-width:480px;margin:0 auto;}' +
    '.zf-nl-form input[type=email]{flex:1;min-width:0;padding:.75rem .95rem;border-radius:8px;border:1px solid rgba(220,220,214,.35);' +
      'background:var(--ink-deep);color:var(--text-light);font-size:1rem;font-family:inherit;}' +
    '.zf-nl-form input[type=email]:focus{outline:2px solid var(--gold);outline-offset:1px;}' +
    '.zf-nl-form button{padding:.75rem 1.3rem;border-radius:8px;border:0;cursor:pointer;background:var(--gold-soft);color:var(--ink);' +
      'font-weight:700;font-size:.95rem;font-family:inherit;white-space:nowrap;}' +
    '.zf-nl-form button:hover{background:#fff;}' +
    '.zf-nl-box .zf-nl-note{font-size:.8rem;color:var(--text-muted);margin:.9rem auto 0;opacity:.85;}' +
    '.zf-nl-thanks{color:var(--gold-soft);font-size:1.05rem;line-height:1.7;margin:.4rem auto 0;}' +
    '.zf-nl-share{display:inline-block;margin-top:.9rem;color:var(--gold-soft);font-size:.88rem;text-decoration:none;border:1px solid rgba(220,220,214,.35);border-radius:999px;padding:.38rem 1rem;}' +
    '.zf-nl-share:hover{border-color:var(--gold-soft);background:rgba(255,255,255,.06);}' +
    '@media (max-width:520px){.zf-nl-form{flex-direction:column;}.zf-nl-box{padding:1.8rem 1.2rem;}}';
  document.head.appendChild(css);

  var sec = document.createElement('section');
  sec.id = 'zf-newsletter';
  sec.className = 'zf-newsletter';
  sec.innerHTML =
    '<div class="zf-nl-box">' +
      '<div class="zf-nl-tag">Newsletter</div>' +
      '<h2 '+d('h2')+'>'+T.h2.hi+'</h2>' +
      '<p '+d('p')+'>'+T.p.hi+'</p>' +
      '<form class="zf-nl-form" action="https://buttondown.com/api/emails/embed-subscribe/'+USER+'" method="post" target="_blank">' +
        '<input type="email" name="email" required autocomplete="email" placeholder="'+T.ph.hi+'" ' +
          'data-en-placeholder="'+T.ph.en+'" data-ur-placeholder="'+T.ph.ur+'" ' +
          'aria-label="'+T.ph.hi+'" data-en-aria-label="'+T.ph.en+'" data-ur-aria-label="'+T.ph.ur+'">' +
        '<input type="hidden" name="embed" value="1">' +
        '<button type="submit" '+d('btn')+'>'+T.btn.hi+'</button>' +
      '</form>' +
      '<div class="zf-nl-thanks" hidden '+d('thanks')+'>'+T.thanks.hi+'</div>' +
      '<p class="zf-nl-note" '+d('note')+'>'+T.note.hi+'</p>' +
      '<a class="zf-nl-share" href="#" rel="noopener" '+d('share')+'>'+T.share.hi+'</a>' +
    '</div>';

  var anchor = main.querySelector('.meet-poet');   // home: sit just above "Meet the Poet"
  if(anchor) main.insertBefore(sec, anchor); else main.appendChild(sec);

  var form = sec.querySelector('.zf-nl-form'), thanks = sec.querySelector('.zf-nl-thanks');
  form.addEventListener('submit', function(){
    // the browser still posts the form to Buttondown (new tab); we just swap in the thank-you
    setTimeout(function(){ form.hidden = true; thanks.hidden = false; }, 400);
  });

  // "Share on WhatsApp": opens WhatsApp with a ready message + the Buttondown sign-up page of this newsletter
  var shareLink = sec.querySelector('.zf-nl-share');
  shareLink.addEventListener('click', function(ev){
    ev.preventDefault();
    var l = (window.ZF_LANG === 'en' || window.ZF_LANG === 'ur') ? window.ZF_LANG : 'hi';
    var text = T.msg[l] + '\nhttps://buttondown.com/' + USER;
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });

  if(typeof zfApplyStaticTranslations === 'function') zfApplyStaticTranslations(window.ZF_LANG);
})();


/* FIT-A-COUPLET — makes every sher sit on exactly two lines (one per misra), in any language and on any
   screen. For each sher ("unit") it measures the natural width of its longest misra and sets the unit's
   font-size so that misra just fits the available width. The font only ever GROWS if the caller asks for it
   (opts.grow, used by the home photo carousel) and is always kept between opts.minPx and opts.maxPx; only if a
   misra still cannot fit at minPx does that one sher fall back to normal wrapping, so nothing is ever cut off.
   Used by home-carousel.js ONLY (ghazal pages keep one fixed font size, like the original design).
   ZF_fitCouplets(root, unitSelector, opts) fits now AND remembers (root, selector, opts) so a window resize /
   web-font load / language switch re-fits it. */
(function(){
  var REG = [];

  function fitUnit(u, o){
    var lines = Array.prototype.slice.call(u.querySelectorAll('.line'));
    if(!lines.length) return;
    u.style.fontSize = ''; u.style.wordSpacing = ''; u.style.letterSpacing = '';   // back to the stylesheet look
    lines.forEach(function(l){ l.style.whiteSpace = 'nowrap'; l.style.textWrapStyle = ''; });
    var avail = u.clientWidth;
    if(avail <= 0) return;                                   // hidden right now — fitted later
    var base = parseFloat(getComputedStyle(u).fontSize) || 16;
    function widest(){
      var m = 0;
      lines.forEach(function(l){
        var d = l.style.display;
        l.style.display = 'inline-block';                    // natural text width, not the box width
        var w = l.offsetWidth + 1;                           // layout width: unaffected by entry animations (scale)
        l.style.display = d;
        if(w > m) m = w;
      });
      return m;
    }
    var w0 = widest();
    if(w0 <= 0) return;
    function val(x, dflt){ return typeof x === 'function' ? x() : (x || dflt); }
    var minPx = val(o.minPx, 9.5), maxPx = val(o.maxPx, 0);
    var size = base * (avail * 0.985) / w0;
    // a long misra would come out small: first tighten the gaps between words a little,
    // which buys back ~6-8% width, then work out the size again
    var tight = false;
    if(size < (o.tightBelowPx || 14)){
      u.style.wordSpacing = '-0.12em';                       // word gaps only: letters are never touched (Urdu joins, Devanagari conjuncts)
      var w1t = widest();
      if(w1t > 0 && w1t < w0){ tight = true; w0 = w1t; size = base * (avail * 0.985) / w0; }
      else { u.style.wordSpacing = ''; u.style.letterSpacing = ''; }
    }
    if(!o.grow && size > base) size = base;                  // never bigger than the stylesheet size
    if(maxPx && size > maxPx) size = maxPx;
    var wrap = false;
    if(size < minPx){                                        // cannot fit on one line at a readable size:
      wrap = true;                                           // let this one sher wrap, at a comfortable size
      u.style.wordSpacing = ''; u.style.letterSpacing = '';
      size = val(o.wrapPx, 0) || Math.max(minPx, base * 0.85);
    }
    u.style.fontSize = size + 'px';
    // font hinting is not perfectly linear: verify, and trim a little more if it still spills over
    for(var i = 0; i < 3 && !wrap; i++){
      var w1 = widest();
      if(w1 <= avail) break;
      size = size * (avail * 0.985) / w1;
      if(size < minPx){ wrap = true; u.style.wordSpacing = ''; u.style.letterSpacing = ''; size = val(o.wrapPx, 0) || Math.max(minPx, base * 0.85); u.style.fontSize = size + 'px'; break; }
      u.style.fontSize = size + 'px';
    }
    if(wrap) lines.forEach(function(l){ l.style.whiteSpace = 'normal'; l.style.textWrapStyle = 'balance'; });   // rare: breaks into two even halves
  }

  function run(entry){
    if(!document.documentElement.contains(entry.root)) return;
    Array.prototype.slice.call(entry.root.querySelectorAll(entry.sel)).forEach(function(u){ fitUnit(u, entry.opts); });
  }

  window.ZF_fitCouplets = function(root, sel, opts){
    if(!root) return;
    opts = opts || {};
    var found = null;
    REG.forEach(function(e){ if(e.root === root && e.sel === sel) found = e; });
    if(found) found.opts = opts; else { found = {root:root, sel:sel, opts:opts}; REG.push(found); }
    run(found);
    // once more after layout settles (an element that was display:none a moment ago, late fonts)
    window.requestAnimationFrame(function(){ window.requestAnimationFrame(function(){ run(found); }); });
  };

  function refitAll(){ REG = REG.filter(function(e){ return document.documentElement.contains(e.root); }); REG.forEach(run); }
  var t = null;
  window.addEventListener('resize', function(){ window.clearTimeout(t); t = window.setTimeout(refitAll, 120); });
  window.addEventListener('orientationchange', function(){ window.setTimeout(refitAll, 250); });
  if(document.fonts){
    if(document.fonts.ready) document.fonts.ready.then(refitAll);
    // fonts that start downloading later (Hindi / Urdu / Roman subsets) swap in after the first fit:
    // every time one finishes, measure again with the REAL glyph widths
    if(document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function(){ window.setTimeout(refitAll, 30); });
  }
  [700, 2000, 4500].forEach(function(ms){ window.setTimeout(refitAll, ms); });   // safety net on slow networks
  window.addEventListener('load', function(){ window.setTimeout(refitAll, 60); });
})();
