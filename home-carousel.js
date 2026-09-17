/* Homepage "Five Daily Shers" gallery — a horizontal photo carousel that
   sits below the "Aaj Ka Sher" widget. Each of the 5 slides uses one of
   5 fixed background photos (assets/gallery/sher-1..5.jpg, wired up in
   style.css via .sgc-1..sgc-5) with the couplet set in white over it, so
   the gallery reads as five distinct photo cards. The five couplets
   themselves are picked from the same ghazal pool as home-features.js's
   "Aaj Ka Sher" widget, using a date-seeded pick so the set is stable for
   the whole day and changes the next day — "random" in feel, but
   reproducible for everyone looking at the site on the same day. This
   file only reads GHAZAL_ITEMS (via ghazals-data.js) and never writes to
   it. */
(function(){

  var track, dotsWrap, prevBtn, nextBtn, section;
  var slidesData = [];
  var current = 0;
  var autoTimer = null;
  var AUTOPLAY_MS = 6500;

  function lang(){ return (window.ZF_LANG === 'en' || window.ZF_LANG === 'ur') ? window.ZF_LANG : 'hi'; }

  /* Same pool shape as home-features.js's fullPool — ghazal couplets only. */
  function fullPool(){
    var pool = [];
    if(typeof GHAZAL_ITEMS !== 'undefined'){
      GHAZAL_ITEMS.forEach(function(g){
        for(var v=0; v<g.versesHtml.length; v++) pool.push({item:g, verseIdx:v, source:'ghazals.html', sourceEn:'ghazals-en.html', sourceUr:'ghazals-ur.html'});
      });
    }
    return pool;
  }

  /* A different day-seed base than home-features.js's daySeed() (extra
     multiplier + offset) so the gallery's picks don't just mirror
     whatever "Aaj Ka Sher" already shows above it. */
  function daySeedBase(){
    var d = new Date();
    var doy = Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000);
    return (d.getFullYear() * 1000 + doy) * 97 + 13;
  }
  function seededFrac(seed){
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function pickDailyFive(pool){
    if(!pool.length) return [];
    var base = daySeedBase();
    var want = Math.min(5, pool.length);
    var picks = [], used = {}, offset = 0, tries = 0;
    while(picks.length < want && tries < 300){
      var seed = base + offset * 7919;
      var idx = Math.floor(seededFrac(seed) * pool.length);
      offset++; tries++;
      if(used[idx]) continue;
      used[idx] = true;
      picks.push(pool[idx]);
    }
    return picks;
  }

  function slideText(entry){
    var l = lang();
    var item = entry.item;
    var verseHtml = item.versesHtml[entry.verseIdx];
    if(l === 'en' && item.versesHtmlEn){
      verseHtml = item.versesHtmlEn[entry.verseIdx];
    }else if(l === 'ur' && typeof window.ZF_UR_transliterateHtml === 'function'){
      verseHtml = window.ZF_UR_transliterateHtml(verseHtml);
    }
    var readLabel = l === 'en' ? 'Read full ghazal →' : l === 'ur' ? '← مکمل غزل پڑھیں' : 'ग़ज़ल पढ़िए →';
    return {verseHtml: verseHtml, readLabel: readLabel};
  }

  function buildSlide(entry, idx){
    var texts = slideText(entry);
    var a = document.createElement('a');
    a.className = 'sher-carousel-slide sgc-' + ((idx % 5) + 1);
    a.href = entry.source + '#' + entry.item.id;
    a.setAttribute('data-en-href', entry.sourceEn + '#' + entry.item.id);
    a.setAttribute('data-ur-href', entry.sourceUr + '#' + entry.item.id);
    a.setAttribute('data-idx', String(idx));

    var body = document.createElement('div');
    body.className = 'sgc-body';

    var lines = document.createElement('div');
    lines.className = 'sgc-lines';
    lines.innerHTML = texts.verseHtml;

    var readEl = document.createElement('span');
    readEl.className = 'sgc-read';
    readEl.textContent = texts.readLabel;

    body.appendChild(lines);
    body.appendChild(readEl);
    a.appendChild(body);

    /* Reading (or clicking into) a gallery slide counts the same as
       reading it from anywhere else on the site — keeps the home
       "X of Y pieces read" badge in sync. */
    a.addEventListener('click', function(){
      if(typeof window.ZF_markPoemRead === 'function') window.ZF_markPoemRead(entry.item.id);
    });

    return a;
  }

  function renderDots(){
    if(!dotsWrap) return;
    dotsWrap.innerHTML = '';
    slidesData.forEach(function(_, i){
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'sher-carousel-dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', 'Glimpse ' + (i + 1));
      dot.addEventListener('click', function(){ goTo(i); restartAutoplay(); });
      dotsWrap.appendChild(dot);
    });
  }

  function syncDots(){
    if(!dotsWrap) return;
    var dots = dotsWrap.querySelectorAll('.sher-carousel-dot');
    dots.forEach(function(d, i){ d.classList.toggle('active', i === current); });
  }

  function updateTrackPosition(){
    if(!track) return;
    var rtl = document.body.classList.contains('lang-ur');
    var pct = current * 100 * (rtl ? 1 : -1);
    track.style.transform = 'translateX(' + pct + '%)';
  }

  function goTo(idx){
    if(!slidesData.length) return;
    current = ((idx % slidesData.length) + slidesData.length) % slidesData.length;
    updateTrackPosition();
    syncDots();
  }

  function renderSlides(){
    if(!track) return;
    track.innerHTML = '';
    slidesData.forEach(function(entry, i){
      track.appendChild(buildSlide(entry, i));
    });
    updateTrackPosition();
  }

  function restartAutoplay(){
    if(autoTimer) window.clearInterval(autoTimer);
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if(!slidesData.length || slidesData.length < 2) return;
    autoTimer = window.setInterval(function(){ goTo(current + 1); }, AUTOPLAY_MS);
  }
  function pauseAutoplay(){ if(autoTimer){ window.clearInterval(autoTimer); autoTimer = null; } }

  function init(){
    section = document.querySelector('.sher-gallery');
    track = document.getElementById('sher-carousel-track');
    dotsWrap = document.getElementById('sher-carousel-dots');
    prevBtn = document.getElementById('sher-carousel-prev');
    nextBtn = document.getElementById('sher-carousel-next');
    if(!track || typeof GHAZAL_ITEMS === 'undefined' || !GHAZAL_ITEMS.length) return;

    var pool = fullPool();
    slidesData = pickDailyFive(pool);
    if(!slidesData.length){ if(section) section.hidden = true; return; }

    renderSlides();
    renderDots();

    if(prevBtn) prevBtn.addEventListener('click', function(){ goTo(current - 1); restartAutoplay(); });
    if(nextBtn) nextBtn.addEventListener('click', function(){ goTo(current + 1); restartAutoplay(); });

    if(section){
      section.addEventListener('mouseenter', pauseAutoplay);
      section.addEventListener('mouseleave', restartAutoplay);
      section.addEventListener('touchstart', pauseAutoplay, {passive:true});
      section.addEventListener('focusin', pauseAutoplay);
      section.addEventListener('focusout', restartAutoplay);

      /* Simple swipe support for touch screens. */
      var touchStartX = null;
      section.addEventListener('touchstart', function(e){ touchStartX = e.touches[0].clientX; }, {passive:true});
      section.addEventListener('touchend', function(e){
        if(touchStartX === null) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        var rtl = document.body.classList.contains('lang-ur');
        if(Math.abs(dx) > 40){
          var forward = dx < 0;
          if(rtl) forward = !forward;
          goTo(current + (forward ? 1 : -1));
          restartAutoplay();
        }
        touchStartX = null;
      });
    }

    restartAutoplay();
  }

  document.addEventListener('DOMContentLoaded', init);

  /* Chain onto home-features.js's rerender hook (do NOT overwrite it —
     the "Aaj Ka Sher" widget above relies on the same global) so a
     language toggle re-paints both the sher widget and this gallery. */
  var prevRerender = window.ZF_rerenderCollection;
  window.ZF_rerenderCollection = function(){
    if(typeof prevRerender === 'function') prevRerender();
    if(track && slidesData.length){ renderSlides(); }
  };
})();
