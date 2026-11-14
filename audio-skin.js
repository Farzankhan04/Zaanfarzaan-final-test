/* audio-skin.js (v62) — the look and feel of the audio page players.
   Replaces the browser's plain <audio controls> bar with: a turning "record" disc, a waveform-style seek bar, a big play button,
   -10 / +15 second buttons and a speed button. The real <audio> element stays in the page (hidden), so everything in audios.js
   (play modes, sleep timer, "now playing" bar, lock-screen controls, share, comments) keeps working untouched. */
(function(){
  var list = document.querySelector('.audio-list'); if(!list) return;
  var cards = [].slice.call(list.querySelectorAll('.audio-track')); if(!cards.length) return;

  var DISCS = ['sher-2.jpg','sher-4.jpg','sher-1.jpg','sher-5.jpg','sher-3.jpg'];
  var SPEEDS = [1, 1.25, 1.5, 0.85];
  var BARS = 56;
  var STR = {
    play:  {hi:'चलाएँ', en:'Play', ur:'چلائیں'},
    pause: {hi:'रोकें', en:'Pause', ur:'روکیں'},
    back:  {hi:'10 सेकंड पीछे', en:'Back 10 seconds', ur:'10 سیکنڈ پیچھے'},
    fwd:   {hi:'15 सेकंड आगे', en:'Forward 15 seconds', ur:'15 سیکنڈ آگے'},
    speed: {hi:'चलने की गति', en:'Playback speed', ur:'چلنے کی رفتار'},
    seek:  {hi:'आवाज़ में आगे-पीछे जाएँ', en:'Seek', ur:'آگے پیچھے جائیں'}
  };
  function lang(){ var c = document.body.classList; return c.contains('lang-ur') ? 'ur' : (c.contains('lang-en') ? 'en' : 'hi'); }
  function T(k){ return STR[k][lang()]; }
  function fmt(t){ if(!isFinite(t) || t < 0) return '–:––'; t = Math.floor(t); var m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function hash(str){ var h = 2166136261; for(var i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  var ICON = {
    play:  '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z"/></svg>',
    pause: '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.8" width="4.4" height="14.4" rx="1.2"/><rect x="13.6" y="4.8" width="4.4" height="14.4" rx="1.2"/></svg>'
  };

  cards.forEach(function(card, idx){
    var audio = card.querySelector('audio'); if(!audio || card.querySelector('.zf-pl')) return;
    audio.removeAttribute('controls'); audio.hidden = true;

    /* --- header: spinning disc next to the title --- */
    var top = card.querySelector('.audio-track-top');
    var head = document.createElement('div'); head.className = 'zf-head';
    var disc = document.createElement('div'); disc.className = 'zf-disc'; disc.setAttribute('aria-hidden', 'true');
    disc.style.backgroundImage = 'url(' + DISCS[idx % DISCS.length] + ')';
    card.insertBefore(head, top); head.appendChild(disc); head.appendChild(top);

    /* --- waveform bars (a deterministic "voice-like" shape per recording) --- */
    var seed = hash(card.id || String(idx)), ph1 = (seed % 628) / 100, ph2 = ((seed >> 5) % 628) / 100, bars = '';
    for(var i = 0; i < BARS; i++){
      var base = Math.abs(Math.sin(i * 0.42 + ph1) * Math.cos(i * 0.13 + ph2));
      var noise = ((hash(card.id + ':' + i) % 100) / 100);
      var h = Math.min(1, 0.18 + base * 0.62 + noise * 0.28);
      bars += '<i style="--h:' + Math.round(22 + h * 78) + '%"></i>';
    }

    var pl = document.createElement('div'); pl.className = 'zf-pl';
    pl.innerHTML =
      '<button type="button" class="zf-play" aria-label="' + T('play') + '">' + ICON.play + ICON.pause + '</button>' +
      '<div class="zf-wave" role="slider" tabindex="0" aria-label="' + T('seek') + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' + bars + '</div>' +
      '<div class="zf-meta"><span class="zf-time"><b class="zf-cur">0:00</b> / <span class="zf-dur">–:––</span></span>' +
      '<span class="zf-extra"><button type="button" class="zf-skip" data-d="-10" aria-label="' + T('back') + '">−10</button>' +
      '<button type="button" class="zf-skip" data-d="15" aria-label="' + T('fwd') + '">+15</button>' +
      '<button type="button" class="zf-speed" aria-label="' + T('speed') + '">1×</button></span></div>';
    card.insertBefore(pl, audio);

    var playBtn = pl.querySelector('.zf-play'), wave = pl.querySelector('.zf-wave'), bs = wave.children,
        cur = pl.querySelector('.zf-cur'), dur = pl.querySelector('.zf-dur'), speedBtn = pl.querySelector('.zf-speed'),
        lastOn = 0, speedI = 0, pending = null;

    function paint(){
      var d = audio.duration, p = (isFinite(d) && d > 0) ? audio.currentTime / d : 0, on = Math.round(p * BARS);
      if(on !== lastOn){ for(var i = Math.min(on, lastOn); i < Math.max(on, lastOn); i++) bs[i].classList.toggle('on', i < on); lastOn = on; }
      cur.textContent = fmt(audio.currentTime); wave.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    }
    function setDur(){ dur.textContent = fmt(audio.duration); }
    function setPlaying(v){
      pl.classList.toggle('playing', v); card.classList.toggle('zf-on', v);
      playBtn.setAttribute('aria-label', v ? T('pause') : T('play'));
    }
    ['loadedmetadata','durationchange'].forEach(function(ev){ audio.addEventListener(ev, function(){ setDur(); paint(); if(pending !== null && isFinite(audio.duration)){ audio.currentTime = pending * audio.duration; pending = null; } }); });
    audio.addEventListener('timeupdate', paint);
    audio.addEventListener('play', function(){ setPlaying(true); });
    audio.addEventListener('pause', function(){ setPlaying(false); });
    audio.addEventListener('ended', function(){ setPlaying(false); paint(); });
    audio.addEventListener('seeked', paint);

    playBtn.addEventListener('click', function(){
      if(audio.paused){ var r = audio.play(); if(r && r.catch) r.catch(function(){}); } else { audio.pause(); }
    });
    [].forEach.call(pl.querySelectorAll('.zf-skip'), function(b){
      b.addEventListener('click', function(){
        var d = audio.duration, t = audio.currentTime + parseFloat(b.getAttribute('data-d'));
        audio.currentTime = Math.max(0, isFinite(d) ? Math.min(d - 0.1, t) : t);
      });
    });
    speedBtn.addEventListener('click', function(){
      speedI = (speedI + 1) % SPEEDS.length; audio.playbackRate = SPEEDS[speedI];
      speedBtn.textContent = (SPEEDS[speedI] + '').replace('.0', '') + '×';
    });

    /* --- seeking: tap or drag on the waveform, or use the arrow keys --- */
    function seekTo(clientX){
      var r = wave.getBoundingClientRect(), ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      if(isFinite(audio.duration) && audio.duration > 0){ audio.currentTime = ratio * audio.duration; }
      else { pending = ratio; audio.preload = 'metadata'; audio.load(); }
    }
    var dragging = false;
    wave.addEventListener('pointerdown', function(e){ dragging = true; try{ wave.setPointerCapture(e.pointerId); }catch(x){} seekTo(e.clientX); });
    wave.addEventListener('pointermove', function(e){ if(dragging) seekTo(e.clientX); });
    ['pointerup','pointercancel'].forEach(function(ev){ wave.addEventListener(ev, function(){ dragging = false; }); });
    wave.addEventListener('keydown', function(e){
      var d = audio.duration; if(!isFinite(d)) return;
      if(e.key === 'ArrowRight' || e.key === 'ArrowUp'){ audio.currentTime = Math.min(d - 0.1, audio.currentTime + 5); e.preventDefault(); }
      else if(e.key === 'ArrowLeft' || e.key === 'ArrowDown'){ audio.currentTime = Math.max(0, audio.currentTime - 5); e.preventDefault(); }
      else if(e.key === 'Home'){ audio.currentTime = 0; e.preventDefault(); }
      else if(e.key === 'End'){ audio.currentTime = Math.max(0, d - 0.5); e.preventDefault(); }
    });

    /* durations: ask for metadata only when the card scrolls into view (keeps data use small) */
    card._zfSkin = { setDur: setDur, audio: audio };
    if(!audio.paused){ setPlaying(true); }
    setDur(); paint();
  });

  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return; io.unobserve(en.target);
        var a = en.target.querySelector('audio');
        if(a && a.readyState === 0 && a.preload === 'none'){ a.preload = 'metadata'; try{ a.load(); }catch(e){} }
      });
    }, {rootMargin:'200px'});
    cards.forEach(function(c){ io.observe(c); });
  }

  /* labels follow the language toggle */
  document.addEventListener('click', function(e){
    if(!e.target.closest || !e.target.closest('#lang-toggle')) return;
    setTimeout(function(){ cards.forEach(function(c){
      var p = c.querySelector('.zf-pl'); if(!p) return;
      p.querySelector('.zf-play').setAttribute('aria-label', p.classList.contains('playing') ? T('pause') : T('play'));
      p.querySelector('.zf-wave').setAttribute('aria-label', T('seek'));
      p.querySelector('.zf-skip[data-d="-10"]').setAttribute('aria-label', T('back'));
      p.querySelector('.zf-skip[data-d="15"]').setAttribute('aria-label', T('fwd'));
      p.querySelector('.zf-speed').setAttribute('aria-label', T('speed'));
    }); }, 50);
  });
})();
