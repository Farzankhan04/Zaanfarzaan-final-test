/* Homepage "Five Daily Shers" gallery — a small image-style carousel that
   sits below the "Aaj Ka Sher" widget. Each of the 5 slides is a distinct
   CSS "card design" (ink & gold, rose manuscript, seal edition, minimal
   rule, vignette bloom — see the .sgc-1..5 rules in style.css) so the
   gallery reads as five different designed cards rather than five copies
   of the same layout. The five couplets themselves are picked from the
   same ghazal pool as home-features.js's "Aaj Ka Sher" widget, using a
   date-seeded pick so the set is stable for the whole day and changes
   the next day — "random" in feel, but reproducible for everyone looking
   at the site on the same day. This file only reads GHAZAL_ITEMS (via
   ghazals-data.js) and never writes to it. */
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
    var kind = item.kind || ('Ghazal · #' + item.num);
    if(l === 'en' && item.versesHtmlEn){
      verseHtml = item.versesHtmlEn[entry.verseIdx];
    }else if(l === 'ur' && typeof window.ZF_UR_transliterateHtml === 'function'){
      verseHtml = window.ZF_UR_transliterateHtml(verseHtml);
      kind = typeof window.ZF_UR_transliterateText === 'function' ? window.ZF_UR_transliterateText(kind) : kind;
    }
    var readLabel = l === 'en' ? "Read the full ghazal →" : l === 'ur' ? '← مکمل غزل پڑھیں' : 'पूरी ग़ज़ल पढ़ें →';
    return {verseHtml: verseHtml, kind: kind, readLabel: readLabel};
  }

  function buildSlide(entry, idx){
    var texts = slideText(entry);
    var a = document.createElement('a');
    a.className = 'sher-carousel-slide sgc-' + ((idx % 5) + 1);
    a.href = entry.source + '#' + entry.item.id;
    a.setAttribute('data-en-href', entry.sourceEn + '#' + entry.item.id);
    a.setAttribute('data-ur-href', entry.sourceUr + '#' + entry.item.id);
    a.setAttribute('data-idx', String(idx));

    var mark = document.createElement('span');
    mark.className = 'sgc-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '\u201C';

    var a2Wrap = document.createDocumentFragment();
    if((idx % 5) === 4){
      var bloom = document.createElement('span');
      bloom.className = 'sgc-5-bloom';
      bloom.setAttribute('aria-hidden', 'true');
      bloom.textContent = '\u2766';
      a2Wrap.appendChild(bloom);
    }

    var lines = document.createElement('div');
    lines.className = 'sgc-lines';
    lines.innerHTML = texts.verseHtml;

    var foot = document.createElement('div');
    foot.className = 'sgc-foot';
    var kindEl = document.createElement('span');
    kindEl.className = 'sgc-kind';
    kindEl.textContent = texts.kind;
    var readEl = document.createElement('span');
    readEl.className = 'sgc-read';
    readEl.textContent = texts.readLabel;
    foot.appendChild(kindEl);
    foot.appendChild(readEl);

    a.appendChild(mark);
    a.appendChild(a2Wrap);
    a.appendChild(lines);
    a.appendChild(foot);

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
