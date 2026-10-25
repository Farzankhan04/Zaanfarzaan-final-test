/* nazm-audio.js — shows the nazm's audio player right under the nazm text (nazm-N pages and the nazms.html detail view).
   Loaded by the small loader in app.js. Audio count comes from window.ZF_AUDIO_COUNT (set in app.js). */
(function(){
  if(window.self !== window.top) return;            /* inside the audio page's reader frame the audio is already playing */
  if(window.__zfNazmAudio) return; window.__zfNazmAudio = true;
  var MAXN = window.ZF_AUDIO_COUNT || 10;
  function lang(){ var l = window.ZF_LANG; return (l === 'en' || l === 'ur') ? l : 'hi'; }
  function tr(a, b, c){ var l = lang(); return l === 'en' ? b : (l === 'ur' ? c : a); }
  function css(){
    var s = document.createElement('style');
    s.textContent = '.zf-nzaudio{margin:1.2rem auto;max-width:640px;padding:1rem 1.1rem;border:1px solid rgba(220,220,214,.35);border-radius:10px;background:rgba(220,220,214,.07);color:#f2f1ec}' +
      '.zf-nzaudio .zf-nz-t{font-size:.95rem;margin-bottom:.6rem;font-weight:600}.zf-nzaudio audio{width:100%;height:42px}' +
      '.zf-nzaudio .zf-nz-l{display:flex;gap:1.2rem;flex-wrap:wrap;margin-top:.6rem;font-size:.9rem}.zf-nzaudio a{color:#f2f1ec;text-decoration:underline;text-underline-offset:3px}';
    document.head.appendChild(s);
  }
  function build(n){
    var d = document.createElement('div'); d.className = 'zf-nzaudio'; d.setAttribute('data-n', n);
    var t = document.createElement('div'); t.className = 'zf-nz-t'; t.textContent = tr('🎧 इस नज़्म को सुनिए', '🎧 Listen to this nazm', '🎧 اس نظم کو سنیے');
    var a = document.createElement('audio'); a.controls = true; a.preload = 'none'; a.src = 'audio-nazm-' + n + '.mp3';
    var l = document.createElement('div'); l.className = 'zf-nz-l';
    var dl = document.createElement('a'); dl.href = 'audio-nazm-' + n + '.mp3'; dl.setAttribute('download', ''); dl.textContent = tr('डाउनलोड', 'Download', 'ڈاؤن لوڈ');
    var all = document.createElement('a'); all.href = lang() === 'en' ? 'audios-en.html#nazm-' + n : (lang() === 'ur' ? 'audios-ur.html#nazm-' + n : 'audios.html#nazm-' + n); all.textContent = tr('सभी ऑडियो', 'All audios', 'تمام آڈیو');
    l.appendChild(dl); l.appendChild(all); d.appendChild(t); d.appendChild(a); d.appendChild(l);
    return d;
  }
  var inited = false;
  function put(card){
    var m = /^nazm-(\d{1,3})$/.exec(card.id || ''); if(!m) return;
    var n = parseInt(m[1], 10); if(n < 1 || n > MAXN) return;
    if(!inited){ css(); inited = true; }
    card.parentNode.insertBefore(build(n), card.nextSibling);
  }
  var detail = document.getElementById('poem-detail');
  if(detail){
    var busy = false;
    function sync(){
      if(busy) return; busy = true;
      try{
        var card = detail.querySelector('.card.manuscript[id]'), cur = detail.querySelector('.zf-nzaudio');
        if(!card || !/^nazm-\d+$/.test(card.id)){ if(cur) cur.remove(); return; }
        if(cur && cur.getAttribute('data-n') === card.id.replace('nazm-', '')) return;
        if(cur) cur.remove(); put(card);
      } finally { busy = false; }
    }
    new MutationObserver(sync).observe(detail, {childList: true}); sync();
  } else {
    var card = document.querySelector('.card.manuscript[id^="nazm-"]'); if(card) put(card);
  }
})();
