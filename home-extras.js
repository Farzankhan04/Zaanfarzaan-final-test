/* HOME extras (v25): "Jahan chhoda tha" card, "Naya" audio strip with mini player,
   and "Readers' Voices" (latest approved comments from Supabase).
   To add a new audio later: change ZF_AUDIO_COUNT below (and add its card on audios pages). */
(function(){
  var ZF_AUDIO_COUNT = 10;                         /* newest audio = audio-nazm-<this number> */
  var SB_URL = 'https://silqtikgdywjzebdehai.supabase.co';
  var SB_KEY = 'sb_publishable_2GYkJE2I5Qtl2eSbDFcDvg_JI9Ha4t5';
  var UR_NAZM = {1:'غرض',2:'جگہ',3:'میں لاپرواہ ابھی بھی ہوں',4:'کمال آدمی ہو',5:'سن میرے اے پیارے رب',6:'عادت',7:'وہ وعدے',8:'اچھا سوچیں گے',9:'آنکھوں کی خاطر',10:'نفع و نقصان'};
  var voices = null;

  function lang(){ return (window.ZF_LANG === 'en' || window.ZF_LANG === 'ur') ? window.ZF_LANG : 'hi'; }
  function tr(hi,en,ur){ var l = lang(); return l === 'en' ? en : (l === 'ur' ? ur : hi); }
  function pg(base){ var l = lang(); return base + (l === 'en' ? '-en' : (l === 'ur' ? '-ur' : '')) + '.html'; }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function link(href, cls, text){ var a = el('a', cls, text); a.setAttribute('href', href); return a; }
  function ur(s){ return (typeof window.ZF_UR_transliterateText === 'function') ? window.ZF_UR_transliterateText(s) : s; }

  function find(list, id){ if(typeof list === 'undefined') return null; for(var i=0;i<list.length;i++) if(list[i].id === id) return list[i]; return null; }
  function nazmTitle(n){
    var it = find(typeof NAZM_ITEMS === 'undefined' ? undefined : NAZM_ITEMS, 'nazm-' + n), l = lang();
    if(l === 'ur') return UR_NAZM[n] || (it ? it.title : 'Nazm ' + n);
    if(l === 'en') return it && it.titleEn ? it.titleEn : 'Nazm ' + n;
    return it ? it.title : 'Nazm ' + n;
  }
  function poemTitle(id){
    var m = /^(ghazal|nazm)-(\d+)$/.exec(id || ''); if(!m) return null;
    if(m[1] === 'nazm') return nazmTitle(parseInt(m[2], 10));
    var it = find(typeof GHAZAL_ITEMS === 'undefined' ? undefined : GHAZAL_ITEMS, id), l = lang();
    if(!it) return null;
    if(l === 'en') return it.firstLineEn || it.firstLine;
    if(l === 'ur') return ur(it.firstLine);
    return it.firstLine;
  }

  /* ---- 1. continue reading ---- */
  function renderContinue(){
    var box = document.getElementById('zf-continue'); if(!box) return;
    var last = null; try{ last = JSON.parse(localStorage.getItem('zf-last-read') || 'null'); }catch(e){}
    var t = last && poemTitle(last.id);
    if(!t){ box.hidden = true; return; }
    box.textContent = '';
    var a = link(last.id + '.html', 'zf-cont-card');
    var left = el('div'); left.appendChild(el('div', 'zf-k', tr('जहाँ छोड़ा था','Where you left off','جہاں چھوڑا تھا')));
    left.appendChild(el('div', 'zf-t', t));
    a.appendChild(left); a.appendChild(el('span', 'zf-go', tr('जारी रखें →','Continue →','← جاری رکھیں')));
    box.appendChild(a); box.hidden = false;
  }

  /* ---- 2. newest audio ---- */
  var audioEl = null;
  function renderNew(){
    var box = document.getElementById('zf-new'); if(!box) return;
    var n = ZF_AUDIO_COUNT;
    if(!audioEl){ audioEl = document.createElement('audio'); audioEl.controls = true; audioEl.preload = 'none'; audioEl.src = 'audio-nazm-' + n + '.mp3'; }
    box.textContent = '';
    var card = el('div', 'zf-new-card');
    card.appendChild(el('div', 'zf-k', tr('नया ऑडियो','New audio','نیا آڈیو')));
    card.appendChild(el('div', 'zf-t', nazmTitle(n)));
    card.appendChild(audioEl);
    var links = el('div', 'zf-links');
    links.appendChild(link('nazm-' + n + '.html', null, tr('नज़्म पढ़ें','Read the nazm','نظم پڑھیں')));
    links.appendChild(link(pg('audios'), null, tr('सभी ऑडियो','All audios','تمام آڈیو')));
    card.appendChild(links); box.appendChild(card); box.hidden = false;
  }

  /* ---- 3. readers' voices ---- */
  function voiceLink(page){
    var m = /^(audio-)?(ghazal|nazm)-(\d+)$/.exec(page || ''); if(!m) return null;
    if(m[1]) return {href: 'audios.html#nazm-' + m[3], label: 'Audio · Nazm ' + m[3]};
    return {href: m[2] + '-' + m[3] + '.html', label: (m[2] === 'nazm' ? 'Nazm ' : 'Ghazal ') + m[3]};
  }
  function renderVoices(){
    var sec = document.getElementById('zf-voices'), track = document.getElementById('zf-voices-track');
    if(!sec || !track || !voices || !voices.length) return;
    track.textContent = '';
    voices.forEach(function(c){
      var card = el('div', 'zf-voice');
      var q = el('q', null, c.body); card.appendChild(q);
      var by = el('div', 'zf-by', '— ' + c.name);
      var vl = voiceLink(c.page);
      if(vl){ by.appendChild(document.createTextNode(' · ')); by.appendChild(link(vl.href, null, vl.label)); }
      card.appendChild(by); track.appendChild(card);
    });
    sec.hidden = false;
  }
  function loadVoices(){
    if(!document.getElementById('zf-voices') || !window.fetch) return;
    fetch(SB_URL + '/rest/v1/comments?select=page,name,body,created_at&approved=eq.true&order=created_at.desc&limit=8', {headers: {apikey: SB_KEY}})
      .then(function(r){ if(!r.ok) throw new Error('x'); return r.json(); })
      .then(function(rows){ if(Array.isArray(rows)){ voices = rows; renderVoices(); } })
      .catch(function(){});
  }

  /* ---- 4. audio count in stat strip (stat-strip counter reads data-count) ---- */
  var sa = document.getElementById('zf-stat-audio');
  if(sa) sa.setAttribute('data-count', String(ZF_AUDIO_COUNT));

  function all(){ renderContinue(); renderNew(); renderVoices(); }
  var prev = window.ZF_rerenderCollection;
  window.ZF_rerenderCollection = function(){ if(typeof prev === 'function') prev(); all(); };
  all(); loadVoices();
})();
