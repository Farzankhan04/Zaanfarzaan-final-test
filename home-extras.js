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
  var MOOD = window.ZF_MOOD || {};
  var MOODS = window.ZF_MOODS || [];
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
    morning: ['☀️ सुप्रभात', '☀️ Good morning', '☀️ صبح بخیر'],
    noon:    ['🌤️ आदाब', '🌤️ Good afternoon', '🌤️ آداب'],
    evening: ['🌆 शुभ संध्या', '🌆 Good evening', '🌆 شام بخیر'],
    night:   ['🌙 शब-ब-ख़ैर', '🌙 Good night', '🌙 شب بخیر']
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
        b.addEventListener('click', function(){ if(w === GAME.ans){ GAME.solved = true; try{ localStorage.setItem('zf-game-wins', String((parseInt(localStorage.getItem('zf-game-wins') || '0', 10) || 0) + 1)); }catch(e){} } else GAME.wrong[w] = true; renderGame(); renderBadges(); });
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

  /* ---- 9. streak + badges (all stored on this device only) ---- */
  function jget(k){ try{ return JSON.parse(localStorage.getItem(k) || '[]') || []; }catch(e){ return []; } }
  function dayKey(d){ return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function streak(){
    var days = jget('zf-visit-days'), set = {}; days.forEach(function(x){ set[x] = 1; });
    var d = new Date(), n = 0;
    if(!set[dayKey(d)]) d.setDate(d.getDate() - 1);          /* not counted yet today: still show yesterday's streak */
    while(set[dayKey(d)]){ n++; d.setDate(d.getDate() - 1); }
    var best = 0; try{ best = parseInt(localStorage.getItem('zf-best-streak') || '0', 10) || 0; }catch(e){}
    if(n > best){ best = n; try{ localStorage.setItem('zf-best-streak', String(best)); }catch(e){} }
    return {now: n, best: best};
  }
  function stats(){
    var read = jget('zf-read-poems'), g = 0, n = 0;
    read.forEach(function(id){ if(id.indexOf('ghazal-') === 0) g++; else if(id.indexOf('nazm-') === 0) n++; });
    var wins = 0; try{ wins = parseInt(localStorage.getItem('zf-game-wins') || '0', 10) || 0; }catch(e){}
    var gTotal = (typeof GHAZAL_ITEMS !== 'undefined') ? GHAZAL_ITEMS.length : 40, nTotal = (typeof NAZM_ITEMS !== 'undefined') ? NAZM_ITEMS.length : 10;
    return {g: g, n: n, gTotal: gTotal, nTotal: nTotal, heard: jget('zf-heard-audio').length, aTotal: ZF_AUDIO_COUNT, favs: jget('zf-favorite-poems').length, wins: wins, best: streak().best};
  }
  function badgeList(s){
    return [
      ['📖', ['पहला पन्ना','First page','پہلا صفحہ'], s.g + s.n, 1],
      ['🌹', ['ग़ज़ल-प्रेमी','Ghazal lover','غزل کے دلدادہ'], s.g, 10],
      ['👑', ['ग़ज़ल-उस्ताद','Ghazal master','غزل کے استاد'], s.g, s.gTotal],
      ['🌙', ['नज़्म-प्रेमी','Nazm lover','نظم کے دلدادہ'], s.n, 5],
      ['🏅', ['नज़्म-उस्ताद','Nazm master','نظم کے استاد'], s.n, s.nTotal],
      ['🎧', ['सुनने वाला','Listener','سننے والا'], s.heard, 1],
      ['🎶', ['पूरा श्रोता','Full listener','مکمل سامع'], s.heard, s.aTotal],
      ['❤️', ['दिल से','From the heart','دل سے'], s.favs, 5],
      ['🎯', ['शेर-शनास','Sher-connoisseur','شعر شناس'], s.wins, 3],
      ['🔥', ['3 दिन','3-day streak','3 دن'], s.best, 3],
      ['🔥', ['7 दिन','7-day streak','7 دن'], s.best, 7],
      ['🔥', ['30 दिन','30-day streak','30 دن'], s.best, 30]
    ];
  }
  function renderBadges(){
    var box = document.getElementById('zf-badges'); if(!box) return;
    var st = streak(), s = stats(), list = badgeList(s), got = 0;
    list.forEach(function(b){ if(b[2] >= b[3]) got++; });
    box.textContent = '';
    box.appendChild(el('div', 'zf-k', 'Badges'));
    box.appendChild(el('h2', null, tr('आपके बैज', 'Your badges', 'آپ کے بیج')));
    if(st.now >= 1){
      box.appendChild(el('div', 'zf-streak', '🔥 ' + tr(st.now + ' दिन लगातार', st.now + (st.now === 1 ? '-day streak' : '-day streak'), st.now + ' دن مسلسل') + (st.best > st.now ? '  ·  ' + tr('सबसे लंबी: ', 'Best: ', 'سب سے طویل: ') + st.best : '')));
    }
    box.appendChild(el('div', 'zf-bcount', got + ' / ' + list.length));
    var grid = el('div', 'zf-bgrid');
    list.forEach(function(b){
      var done = b[2] >= b[3], t = el('div', 'zf-badge' + (done ? ' on' : ''));
      t.appendChild(el('div', 'zf-be', b[0])); t.appendChild(el('div', 'zf-bn', b[1][lang() === 'en' ? 1 : (lang() === 'ur' ? 2 : 0)]));
      t.appendChild(el('div', 'zf-bp', done ? '✓' : Math.min(b[2], b[3]) + '/' + b[3])); grid.appendChild(t);
    });
    box.appendChild(grid); box.hidden = false;
    /* streak chip next to the greeting */
    var g = document.getElementById('zf-greet');
    if(g && st.now >= 2 && g.textContent.indexOf('🔥') === -1) g.textContent += '  🔥' + st.now;
  }

  /* ---- 10. "apna khayaal do": readers send a feeling / idea for a future poem (stored in Supabase table "ideas", only the poet can read it) ---- */
  var IDEA = {
    h:   ['आपका ख़याल', 'Your thought', 'آپ کا خیال'],
    p:   ['अपना एहसास या ख़याल लिखिए — जिसे आप शेर में देखना चाहते हैं। हो सकता है अगली ग़ज़ल या नज़्म उसी से बने।',
          'Write a feeling or a thought you would like to see turned into a sher. The next ghazal or nazm may begin from it.',
          'اپنا احساس یا خیال لکھیے — جسے آپ شعر میں دیکھنا چاہتے ہیں۔ ہو سکتا ہے اگلی غزل یا نظم اسی سے بنے۔'],
    ta:  ['यहाँ अपना ख़याल लिखिए…', 'Write your thought here…', 'یہاں اپنا خیال لکھیے…'],
    nm:  ['आपका नाम (ज़रूरी नहीं)', 'Your name (optional)', 'آپ کا نام (ضروری نہیں)'],
    go:  ['ख़याल भेजें', 'Send my thought', 'خیال بھیجیں'],
    ok:  ['शुक्रिया! आपका ख़याल पहुँच गया 🙏', 'Thank you! Your thought has reached me 🙏', 'شکریہ! آپ کا خیال پہنچ گیا 🙏'],
    bad: ['नहीं जा सका, थोड़ी देर बाद फिर कोशिश कीजिए।', 'Could not send, please try again in a little while.', 'نہیں جا سکا، تھوڑی دیر بعد دوبارہ کوشش کیجیے۔'],
    short: ['कृपया कम से कम कुछ शब्द लिखिए।', 'Please write at least a few words.', 'براہ کرم کم از کم چند الفاظ لکھیے۔'],
    note:['आपका ख़याल सिर्फ़ शायर को दिखता है, सबके सामने नहीं छपता।', 'Your thought is seen only by the poet; it is not shown publicly.', 'آپ کا خیال صرف شاعر کو نظر آتا ہے، سب کے سامنے نہیں چھپتا۔']
  };
  function ti(k){ return tr(IDEA[k][0], IDEA[k][1], IDEA[k][2]); }
  var ideaState = {text: '', name: '', done: false};
  function renderIdea(){
    var box = document.getElementById('zf-idea'); if(!box) return;
    box.textContent = '';
    box.appendChild(el('div', 'zf-k', 'Idea'));
    box.appendChild(el('h2', null, ti('h')));
    box.appendChild(el('p', 'zf-idea-p', ti('p')));
    var card = el('div', 'zf-idea-card');
    if(ideaState.done){ card.appendChild(el('div', 'zf-hint ok', ti('ok'))); box.appendChild(card); box.hidden = false; return; }
    var ta = el('textarea'); ta.maxLength = 700; ta.rows = 4; ta.placeholder = ti('ta'); ta.setAttribute('dir', 'auto'); ta.value = ideaState.text;
    ta.setAttribute('aria-label', ti('h'));
    var nm = el('input'); nm.type = 'text'; nm.maxLength = 60; nm.placeholder = ti('nm'); nm.setAttribute('dir', 'auto'); nm.value = ideaState.name; nm.autocomplete = 'off';
    var hp = el('input'); hp.type = 'text'; hp.name = 'website'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true'); hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    var go = el('button', 'zf-chip on', ti('go')); go.type = 'button';
    var msg = el('div', 'zf-hint');
    ta.addEventListener('input', function(){ ideaState.text = ta.value; }); nm.addEventListener('input', function(){ ideaState.name = nm.value; });
    go.addEventListener('click', function(){
      var body = ta.value.trim(); msg.className = 'zf-hint';
      if(body.length < 3){ msg.textContent = ti('short'); return; }
      if(hp.value){ ideaState.done = true; renderIdea(); return; }         /* bots: pretend it worked */
      go.disabled = true;
      fetch(SB_URL + '/rest/v1/ideas', {method: 'POST', headers: {apikey: SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal'},
        body: JSON.stringify({name: nm.value.trim() || null, body: body})})
        .then(function(r){ if(!r.ok) throw new Error('x'); ideaState = {text: '', name: '', done: true}; renderIdea(); })
        .catch(function(){ go.disabled = false; msg.className = 'zf-hint'; msg.textContent = ti('bad'); });
    });
    card.appendChild(ta); card.appendChild(nm); card.appendChild(hp); card.appendChild(go); card.appendChild(msg);
    card.appendChild(el('div', 'zf-idea-note', ti('note')));
    box.appendChild(card); box.hidden = false;
  }

  /* ---- 5. audio count in stat strip (stat-strip counter reads data-count) ---- */
  var sa = document.getElementById('zf-stat-audio');
  if(sa) sa.setAttribute('data-count', String(ZF_AUDIO_COUNT));

  function all(){ renderGreet(); renderContinue(); renderNew(); renderMood(); renderGame(); renderFavs(); renderBadges(); renderIdea(); renderVoices(); }
  var prev = window.ZF_rerenderCollection;
  window.ZF_rerenderCollection = function(){ if(typeof prev === 'function') prev(); all(); };
  all(); loadVoices();
})();
