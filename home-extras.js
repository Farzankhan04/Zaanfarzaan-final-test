/* HOME extras (v25): "Jahan chhoda tha" card, "Naya" audio strip with mini player,
   and "Readers' Voices" (latest approved comments from Supabase).
   To add a new audio later: change window.ZF_AUDIO_COUNT in app.js (and add its card on audios pages). */
(function(){
  var ZF_AUDIO_COUNT = window.ZF_AUDIO_COUNT || 10; /* set once in app.js (window.ZF_AUDIO_COUNT) */
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


  /* ---- 4. mood se sher: every sher is tagged one by one (I=ishq, J=judai, T=tanhai, U=umeed, Z=zindagi/iman).
     MOOD[ghazal number] = one letter per sher, in order. ---- */
  var MOOD = {"1": "ZZUZUUZJ", "2": "JIJJIJT", "3": "IJIJIIZ", "4": "JUJJIJ", "5": "ZZZZUJTT", "6": "IJIUJ", "7": "IJZZZIZZ", "8": "JIZIJ", "9": "JIJJTJJT", "10": "UIJIZTZ", "11": "JJJJTJTT", "12": "JJJJJTZZT", "13": "JJTUTTU", "14": "JZZZZTZZZ", "15": "ZZTTZZZZZTZZT", "16": "UZIZIIJUT", "17": "IIUIIIII", "18": "JJJJJJ", "19": "JZTZZZJZ", "20": "JTJZTJ", "21": "JJJTJIJ", "22": "ZJZIZZZZU", "23": "JJJJTTZUT", "24": "JJJTZZZZJ", "25": "TTZZZTZZZTT", "26": "ZITTIZZJUTJZ", "27": "IZIUUIZZZJITZ", "28": "ZTIZUTZIZ", "29": "ZZZZZZZZZZZZ", "30": "IZIIUZZIZ", "31": "TZZZITUIIZITIJJ", "32": "ZTJJJZUTJZZUJ", "33": "UJZUUIJJJJI", "34": "JJJJJJJJZU", "35": "ZZZZZZZZZ", "36": "TZZZZZZIZ", "37": "ZZIZUTJJZ", "38": "ZJZTIZZIZIII", "39": "ZZUZZZZZZJZZ", "40": "JJTJJJJ"};
  var MOODS = [
    ['I', 'इश्क़', 'Love', 'عشق'], ['J', 'जुदाई', 'Separation', 'جدائی'], ['T', 'तन्हाई', 'Loneliness', 'تنہائی'],
    ['U', 'उम्मीद', 'Hope', 'امید'], ['Z', 'ज़िंदगी · ईमान', 'Life & Faith', 'زندگی · ایمان']];
  var curMood = null, curPick = null;
  function lines(html){
    var doc = new DOMParser().parseFromString(html, 'text/html'), ls = doc.querySelectorAll('.line'), out = [];
    if(ls.length){ for(var i=0;i<ls.length;i++) out.push(ls[i].textContent); }
    else out.push(doc.body.textContent);
    return out;
  }
  function pickSher(code){
    var pool = [];
    if(typeof GHAZAL_ITEMS === 'undefined') return null;
    GHAZAL_ITEMS.forEach(function(g){ var m = MOOD[g.num]; if(!m) return; for(var i=0;i<m.length;i++) if(m.charAt(i) === code) pool.push([g, i]); });
    if(!pool.length) return null;
    var p; for(var k=0;k<6;k++){ p = pool[Math.floor(Math.random() * pool.length)]; if(!curPick || p[0] !== curPick[0] || p[1] !== curPick[1]) break; }
    return p;
  }
  function renderMood(){
    var box = document.getElementById('zf-mood'); if(!box) return;
    var l = lang(), idx = l === 'en' ? 2 : (l === 'ur' ? 3 : 1);
    box.textContent = '';
    box.appendChild(el('div', 'zf-k', 'Mood'));
    box.appendChild(el('h2', null, tr('आज मन कैसा है?', 'How are you feeling today?', 'آج دل کا کیا حال ہے؟')));
    var chips = el('div', 'zf-chips');
    MOODS.forEach(function(m){
      var b = el('button', 'zf-chip' + (curMood === m[0] ? ' on' : ''), m[idx]); b.type = 'button';
      b.addEventListener('click', function(){ curMood = m[0]; curPick = pickSher(m[0]); renderMood(); });
      chips.appendChild(b);
    });
    box.appendChild(chips);
    if(curMood && curPick){
      var g = curPick[0], i = curPick[1], src = (l === 'en' && g.versesHtmlEn && g.versesHtmlEn[i]) ? g.versesHtmlEn[i] : g.versesHtml[i];
      var card = el('div', 'zf-mood-card' + (l === 'ur' ? ' rtl' : ''));
      lines(src).forEach(function(t){ card.appendChild(el('div', 'zf-ml', l === 'ur' ? ur(t) : t)); });
      var row = el('div', 'zf-links');
      var more = el('button', 'zf-more', tr('एक और शेर', 'Another sher', 'ایک اور شعر')); more.type = 'button';
      more.addEventListener('click', function(){ curPick = pickSher(curMood); renderMood(); });
      row.appendChild(more);
      row.appendChild(link(g.id + '.html', null, tr('पूरी ग़ज़ल पढ़ें', 'Read the full ghazal', 'پوری غزل پڑھیں')));
      card.appendChild(row); box.appendChild(card);
    }
    box.hidden = false;
  }

  /* ---- 6. greeting by time of day ---- */
  var GREET = {
    morning: ['सुप्रभात ☀ — नई सुबह, नया शेर', 'Good morning ☀ — a new sher for a new day', 'صبح بخیر ☀ — نئی صبح، نیا شعر'],
    noon:    ['आदाब — दोपहर की फ़ुर्सत में कुछ पढ़िए', 'Good afternoon — a little poetry for your break', 'آداب — دوپہر کی فرصت میں کچھ پڑھیے'],
    evening: ['शुभ संध्या — शाम की चाय के साथ एक शेर', 'Good evening — a sher with your evening tea', 'شام بخیر — شام کی چائے کے ساتھ ایک شعر'],
    night:   ['शब-ब-ख़ैर 🌙 — रात की ख़ामुशी में कुछ सुनिए', 'Good night 🌙 — something to hear in the quiet of the night', 'شب بخیر 🌙 — رات کی خاموشی میں کچھ سنیے']
  };
  function renderGreet(){
    var g = document.getElementById('zf-greet'); if(!g) return;
    var h = new Date().getHours(), k = h >= 5 && h < 12 ? 'morning' : (h >= 12 && h < 17 ? 'noon' : (h >= 17 && h < 21 ? 'evening' : 'night'));
    g.textContent = tr(GREET[k][0], GREET[k][1], GREET[k][2]);
    g.hidden = false;
  }

  /* ---- 7. favourites on home ---- */
  function renderFavs(){
    var box = document.getElementById('zf-favs'); if(!box) return;
    var favs = []; try{ favs = JSON.parse(localStorage.getItem('zf-favorite-poems') || '[]'); }catch(e){}
    var items = [];
    for(var i = favs.length - 1; i >= 0 && items.length < 10; i--){ var t = poemTitle(favs[i]); if(t) items.push([favs[i], t]); }
    if(!items.length){ box.hidden = true; return; }
    box.textContent = '';
    box.appendChild(el('div', 'zf-k', 'Favourites'));
    box.appendChild(el('h2', null, tr('आपकी पसंद', 'Your favourites', 'آپ کی پسند')));
    var track = el('div', 'zf-fav-track');
    items.forEach(function(it){
      var a = link(it[0] + '.html', 'zf-fav');
      a.appendChild(el('span', 'zf-fk', it[0].indexOf('nazm') === 0 ? tr('नज़्म', 'Nazm', 'نظم') : tr('ग़ज़ल', 'Ghazal', 'غزل')));
      a.appendChild(el('span', 'zf-ft', it[1]));
      track.appendChild(a);
    });
    box.appendChild(track);
    box.appendChild(link(pg('favorites'), 'zf-fav-all', tr('सभी पसंद →', 'All favourites →', '← تمام پسند')));
    box.hidden = false;
  }

  /* ---- 8. game: complete the sher ---- */
  var GAME = null;   /* {g, i, seed, picks:[...], solved:bool, wrong:{}} */
  function sherLines(g, i){
    var l = lang(), src = (l === 'en' && g.versesHtmlEn && g.versesHtmlEn[i]) ? g.versesHtmlEn[i] : g.versesHtml[i], out = lines(src);
    return l === 'ur' ? out.map(ur) : out;
  }
  function clean(w){ return w.replace(/^[\s.,;:!?।'"‘’“”…\-—()]+|[\s.,;:!?।'"‘’“”…\-—()]+$/g, ''); }
  function tokens(s){ return s.split(/\s+/).map(clean).filter(function(x){ return x; }); }
  function pool(){
    var all = [];
    if(typeof GHAZAL_ITEMS === 'undefined') return all;
    GHAZAL_ITEMS.forEach(function(g){ for(var i = 0; i < g.versesHtml.length; i++) all.push([g, i]); });
    return all;
  }
  function endsOf(g){   /* last word of every sher in this ghazal, to detect the repeated radif */
    var c = {};
    for(var i = 0; i < g.versesHtml.length; i++){ var L = sherLines(g, i), t = tokens(L[L.length - 1]); var w = t[t.length - 1]; if(w) c[w] = (c[w] || 0) + 1; }
    return c;
  }
  function rnd(seed){ var x = Math.sin(seed) * 10000; return x - Math.floor(x); }
  function buildGame(seed){
    var all = pool(); if(!all.length) return null;
    for(var tries = 0; tries < 60; tries++){
      var p = all[Math.floor(rnd(seed + tries * 7.13) * all.length)], L = sherLines(p[0], p[1]);
      if(L.length < 2) continue;
      var last = L[L.length - 1], toks = tokens(last), first = L[0], ends = endsOf(p[0]);
      var cands = toks.filter(function(w){ return w.length >= 4 && first.indexOf(w) === -1 && !(ends[w] > 1); });
      if(!cands.length) continue;
      var ans = cands[Math.floor(rnd(seed + tries * 3.7) * cands.length)];
      var others = []; 
      for(var k = 0; k < 400 && others.length < 2; k++){
        var q = all[Math.floor(rnd(seed + tries * 11.3 + k * 1.91) * all.length)]; if(q[0] === p[0]) continue;
        var QL = sherLines(q[0], q[1]); var qt = tokens(QL[QL.length - 1]).filter(function(w){ return w.length >= 4 && Math.abs(w.length - ans.length) <= 2 && w !== ans && last.indexOf(w) === -1; });
        if(!qt.length) continue; var w2 = qt[Math.floor(rnd(seed + k * 5.1) * qt.length)];
        if(others.indexOf(w2) === -1) others.push(w2);
      }
      if(others.length < 2) continue;
      var opts = [ans, others[0], others[1]].map(function(w, ix){ return [w, rnd(seed + ix * 17.3 + tries)]; }).sort(function(a, b){ return a[1] - b[1]; }).map(function(x){ return x[0]; });
      return {g: p[0], i: p[1], seed: seed, lines: L, ans: ans, opts: opts, solved: false, wrong: {}};
    }
    return null;
  }
  function dailySeed(){ var d = new Date(); return d.getFullYear() * 400 + (d.getMonth() + 1) * 31 + d.getDate(); }
  function renderGame(){
    var box = document.getElementById('zf-game'); if(!box) return;
    if(typeof GHAZAL_ITEMS === 'undefined'){ return; }
    if(!GAME || GAME.lang !== lang()){ var s = GAME ? GAME.seed : dailySeed(); GAME = buildGame(s); if(GAME) GAME.lang = lang(); }
    if(!GAME){ box.hidden = true; return; }
    box.textContent = '';
    box.appendChild(el('div', 'zf-k', 'Game'));
    box.appendChild(el('h2', null, tr('शेर पूरा कीजिए', 'Complete the sher', 'شعر مکمل کیجیے')));
    var card = el('div', 'zf-game-card' + (lang() === 'ur' ? ' rtl' : ''));
    GAME.lines.forEach(function(t, idx){
      var row = el('div', 'zf-ml');
      if(idx === GAME.lines.length - 1){
        var at = t.lastIndexOf(GAME.ans);
        if(at < 0){ row.textContent = t; }
        else {
          row.appendChild(document.createTextNode(t.slice(0, at)));
          row.appendChild(el('span', GAME.solved ? 'zf-fill ok' : 'zf-fill', GAME.solved ? GAME.ans : '\u2003\u2003\u2003'));
          row.appendChild(document.createTextNode(t.slice(at + GAME.ans.length)));
        }
      } else row.textContent = t;
      card.appendChild(row);
    });
    if(!GAME.solved){
      var opts = el('div', 'zf-chips');
      GAME.opts.forEach(function(w){
        var b = el('button', 'zf-chip' + (GAME.wrong[w] ? ' bad' : ''), w); b.type = 'button'; b.disabled = !!GAME.wrong[w];
        b.addEventListener('click', function(){ if(w === GAME.ans) GAME.solved = true; else GAME.wrong[w] = true; renderGame(); });
        opts.appendChild(b);
      });
      card.appendChild(opts);
      if(Object.keys(GAME.wrong).length) card.appendChild(el('div', 'zf-hint', tr('अरे, फिर कोशिश कीजिए!', 'Oops, try again!', 'ارے، پھر کوشش کیجیے!')));
    } else {
      card.appendChild(el('div', 'zf-hint ok', tr('वाह! बिल्कुल सही 👏', 'Wah! Absolutely right 👏', 'واہ! بالکل صحیح 👏')));
    }
    var row2 = el('div', 'zf-links');
    var nx = el('button', 'zf-more', tr('नया सवाल', 'New question', 'نیا سوال')); nx.type = 'button';
    nx.addEventListener('click', function(){ GAME = buildGame(Math.floor(Math.random() * 1e6)); if(GAME) GAME.lang = lang(); renderGame(); });
    row2.appendChild(nx);
    if(GAME.solved) row2.appendChild(link(GAME.g.id + '.html', null, tr('पूरी ग़ज़ल पढ़ें', 'Read the full ghazal', 'پوری غزل پڑھیں')));
    card.appendChild(row2); box.appendChild(card); box.hidden = false;
  }

  /* ---- 5. audio count in stat strip (stat-strip counter reads data-count) ---- */
  var sa = document.getElementById('zf-stat-audio');
  if(sa) sa.setAttribute('data-count', String(ZF_AUDIO_COUNT));

  function all(){ renderGreet(); renderContinue(); renderNew(); renderMood(); renderGame(); renderFavs(); renderVoices(); }
  var prev = window.ZF_rerenderCollection;
  window.ZF_rerenderCollection = function(){ if(typeof prev === 'function') prev(); all(); };
  all(); loadVoices();
})();
