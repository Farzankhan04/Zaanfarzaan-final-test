/* nazm-audio.js — shows the audio player right under a nazm (and under every ghazal that has an audio): nazm-N / ghazal-N pages and the list detail views.
   Credits: nazms are recited by Zaan Farzaan; a ghazal's reciter comes from window.ZF_AUDIO_CREDIT (app.js).
   Loaded by the small loader in app.js. Audio count comes from window.ZF_AUDIO_COUNT (set in app.js). */
(function(){
  if(window.self !== window.top) return;            /* inside the audio page's reader frame the audio is already playing */
  if(window.__zfNazmAudio) return; window.__zfNazmAudio = true;
  var MAXN = window.ZF_AUDIO_COUNT || 10, GA = window.ZF_GHAZAL_AUDIOS || [];
  function lang(){ var l = window.ZF_LANG; return (l === 'en' || l === 'ur') ? l : 'hi'; }
  function tr(a, b, c){ var l = lang(); return l === 'en' ? b : (l === 'ur' ? c : a); }
  function css(){
    var s = document.createElement('style');
    s.textContent = '.zf-nzaudio{margin:1.2rem auto;max-width:640px;padding:1rem 1.1rem;border:1px solid rgba(220,220,214,.35);border-radius:10px;background:rgba(220,220,214,.07);color:#f2f1ec}' +
      '.zf-nzaudio .zf-nz-t{font-size:.95rem;margin-bottom:.3rem;font-weight:600}.zf-nzaudio .zf-nz-c{font-size:.85rem;opacity:.8;margin-bottom:.6rem}.zf-nzaudio audio{width:100%;height:42px}' +
      '.zf-nzaudio .zf-nz-l{display:flex;gap:1.2rem;flex-wrap:wrap;margin-top:.6rem;font-size:.9rem}.zf-nzaudio a{color:#f2f1ec;text-decoration:underline;text-underline-offset:3px}';
    document.head.appendChild(s);
  }
  function build(kind, n){
    var d = document.createElement('div'); d.className = 'zf-nzaudio'; d.setAttribute('data-n', kind + '-' + n);
    var t = document.createElement('div'); t.className = 'zf-nz-t';
    t.textContent = kind === 'ghazal' ? tr('🎧 इस ग़ज़ल को सुनिए', '🎧 Listen to this ghazal', '🎧 اس غزل کو سنیے') : tr('🎧 इस नज़्म को सुनिए', '🎧 Listen to this nazm', '🎧 اس نظم کو سنیے');
    var file = 'audio-' + kind + '-' + n + '.mp3';
    /* credit line: who recited it */
    var cr = document.createElement('div'); cr.className = 'zf-nz-c';
    var who = kind === 'ghazal' && window.ZF_AUDIO_CREDIT && window.ZF_AUDIO_CREDIT.ghazal && window.ZF_AUDIO_CREDIT.ghazal[n];
    cr.appendChild(document.createTextNode(tr('पाठ: ', 'Recited by ', 'آواز: ')));
    if(who){ var wa = document.createElement('a'); wa.href = who.url; wa.target = '_blank'; wa.rel = 'noopener'; wa.textContent = tr(who.name[0], who.name[1], who.name[2]); cr.appendChild(wa); }
    else cr.appendChild(document.createTextNode(tr('ज़ान फ़रज़ान', 'Zaan Farzaan', 'زان فرزان')));
    var a = document.createElement('audio'); a.controls = true; a.controlsList = 'nodownload'; a.preload = 'none'; a.src = file;
    var l = document.createElement('div'); l.className = 'zf-nz-l';
    var all = document.createElement('a'); all.href = (lang() === 'en' ? 'audios-en.html#' : (lang() === 'ur' ? 'audios-ur.html#' : 'audios.html#')) + kind + '-' + n; all.textContent = tr('सभी ऑडियो', 'All audios', 'تمام آڈیو');
    var sh = document.createElement('a'); sh.href = '#'; sh.textContent = tr('🔗 शेयर करें', '🔗 Share', '🔗 شیئر کریں');
    sh.addEventListener('click', function(e){
      e.preventDefault();
      var url = 'https://zaanfarzaan.site/' + kind + '-' + n + '.html';
      var h1 = document.querySelector('.poem-h1'), nm = h1 ? h1.textContent.split(':').pop().trim() : '';
      if(!nm){ var ln = document.querySelector('.card.manuscript .line, .card.manuscript .nazm-line'); nm = ln ? ln.textContent.trim() : ''; }
      var text = '🎧 ' + nm + '\n' + cr.textContent + '\n— Zaan Farzaan';
      if(navigator.share){ navigator.share({title: 'Zaan Farzaan', text: text, url: url}).catch(function(){}); return; }
      var done = function(){ sh.textContent = tr('✓ लिंक कॉपी हो गया', '✓ Link copied', '✓ لنک کاپی ہو گیا'); setTimeout(function(){ sh.textContent = tr('🔗 शेयर करें', '🔗 Share', '🔗 شیئر کریں'); }, 1800); };
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text + '\n' + url).then(done, function(){ window.prompt('', url); }); else window.prompt('', url);
    });
    l.appendChild(sh); l.appendChild(all); d.appendChild(t); d.appendChild(cr); d.appendChild(a); d.appendChild(l);
    return d;
  }
  var inited = false;
  function put(card){
    var m = /^(nazm|ghazal)-(\d{1,3})$/.exec(card.id || ''); if(!m) return;
    var kind = m[1], n = parseInt(m[2], 10);
    if(kind === 'nazm' ? (n < 1 || n > MAXN) : (GA.indexOf(n) < 0)) return;
    if(!inited){ css(); inited = true; }
    card.parentNode.insertBefore(build(kind, n), card.nextSibling);
  }
  var detail = document.getElementById('poem-detail');
  if(detail){
    var busy = false;
    function sync(){
      if(busy) return; busy = true;
      try{
        var card = detail.querySelector('.card.manuscript[id]'), cur = detail.querySelector('.zf-nzaudio');
        if(!card || !/^(nazm|ghazal)-\d+$/.test(card.id)){ if(cur) cur.remove(); return; }
        if(cur && cur.getAttribute('data-n') === card.id) return;
        if(cur) cur.remove(); put(card);
      } finally { busy = false; }
    }
    new MutationObserver(sync).observe(detail, {childList: true}); sync();
  } else {
    var card = document.querySelector('.card.manuscript[id^="nazm-"], .card.manuscript[id^="ghazal-"]'); if(card) put(card);
  }
})();
