/* Homepage "sher" experience — replaces the older random-sher.js with one
   unified system: shows a deterministic "sher of the day" on load, lets
   visitors filter by mood, or ask for a fully random one, all painted
   into the same #sher-card with a soft crossfade between changes.
   Shares GHAZAL_ITEMS/NAZM_ITEMS with ghazals.html/nazms.html (loaded via
   ghazals-data.js / nazms-data.js) so there is one source of truth for
   the poems themselves. Also runs the small private reading-progress
   badge (localStorage only, nothing sent anywhere). */
(function(){

  /* Each poem is tagged with a single dominant mood, arrived at by
     reading the full text of every ghazal and nazm. Numbers refer to
     GHAZAL_ITEMS[i].num / NAZM_ITEMS[i].num. */
  var MOOD_MAP = {
    ishq:     { hi:'इश्क़',   en:'Ishq',    ur:'عشق',    ghazals:[6,7,8,27,39],         nazms:[6,9] },
    judaai:   { hi:'जुदाई',   en:'Judaai',  ur:'جدائی',  ghazals:[1,4,11,14,20,21,38],  nazms:[7] },
    ummeed:   { hi:'उम्मीद',  en:'Ummeed',  ur:'امید',   ghazals:[10,15,16,19,28,29,30],nazms:[5,8] },
    tanhai:   { hi:'तन्हाई',  en:'Tanhai',  ur:'تنہائی', ghazals:[22,25,31,34,36,37],   nazms:[] },
    shikayat: { hi:'शिकायत',  en:'Shikayat',ur:'شکایت',  ghazals:[9,12,13,18,24,33,40], nazms:[3,4] },
    zindagi:  { hi:'ज़िंदगी', en:'Zindagi', ur:'زندگی',  ghazals:[2,3,5,17,23,26,32,35],nazms:[1,2,10] }
  };
  var MOOD_ORDER = ['ishq','judaai','ummeed','tanhai','shikayat','zindagi'];

  var btn, card, placeholder, content, linesEl, sourceLink, sourceLabel, moodRow, todayBtn, readBadge;
  var currentEntry = null;
  var spins = 0;

  function lang(){ return (window.ZF_LANG === 'en' || window.ZF_LANG === 'ur') ? window.ZF_LANG : 'hi'; }

  function findGhazal(num){
    if(typeof GHAZAL_ITEMS === 'undefined') return null;
    for(var i=0;i<GHAZAL_ITEMS.length;i++){ if(GHAZAL_ITEMS[i].num === num) return GHAZAL_ITEMS[i]; }
    return null;
  }
  function findNazm(num){
    if(typeof NAZM_ITEMS === 'undefined') return null;
    for(var i=0;i<NAZM_ITEMS.length;i++){ if(NAZM_ITEMS[i].num === num) return NAZM_ITEMS[i]; }
    return null;
  }

  function poolForMood(moodKey){
    var mood = MOOD_MAP[moodKey], pool = [];
    if(!mood) return pool;
    mood.ghazals.forEach(function(n){
      var g = findGhazal(n);
      if(g) for(var v=0; v<g.versesHtml.length; v++) pool.push({item:g, verseIdx:v, source:'ghazals.html', sourceEn:'ghazals-en.html', sourceUr:'ghazals-ur.html'});
    });
    mood.nazms.forEach(function(n){
      var g = findNazm(n);
      if(g) for(var v=0; v<g.versesHtml.length; v++) pool.push({item:g, verseIdx:v, source:'nazms.html', sourceEn:'nazms-en.html', sourceUr:'nazms-ur.html'});
    });
    return pool;
  }

  function fullPool(){
    var pool = [];
    if(typeof GHAZAL_ITEMS !== 'undefined'){
      GHAZAL_ITEMS.forEach(function(g){
        for(var v=0; v<g.versesHtml.length; v++) pool.push({item:g, verseIdx:v, source:'ghazals.html', sourceEn:'ghazals-en.html', sourceUr:'ghazals-ur.html'});
      });
    }
    if(typeof NAZM_ITEMS !== 'undefined'){
      NAZM_ITEMS.forEach(function(g){
        for(var v=0; v<g.versesHtml.length; v++) pool.push({item:g, verseIdx:v, source:'nazms.html', sourceEn:'nazms-en.html', sourceUr:'nazms-ur.html'});
      });
    }
    return pool;
  }

  function daySeed(){
    var d = new Date();
    return d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000);
  }
  function seededIndex(seed, max){
    var x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * max);
  }

  function setActiveMoodTag(moodKey){
    if(!moodRow) return;
    var tags = moodRow.querySelectorAll('.mood-tag');
    tags.forEach(function(t){ t.classList.toggle('active', t.getAttribute('data-mood') === moodKey); });
  }

  function paintEntry(entry, opts){
    if(!entry || !card) return;
    opts = opts || {};
    var l = lang();
    var item = entry.item;
    var verseHtml = item.versesHtml[entry.verseIdx];
    var firstLine = item.firstLine || item.title;
    if(l === 'en' && item.versesHtmlEn){
      verseHtml = item.versesHtmlEn[entry.verseIdx];
      firstLine = item.firstLineEn || item.titleEn || firstLine;
    }else if(l === 'ur' && typeof window.ZF_UR_transliterateHtml === 'function'){
      verseHtml = window.ZF_UR_transliterateHtml(verseHtml);
      firstLine = window.ZF_UR_transliterateText(firstLine);
    }

    function apply(){
      linesEl.innerHTML = verseHtml;
      sourceLabel.textContent = firstLine;
      sourceLink.href = entry.source;
      sourceLink.setAttribute('data-en-href', entry.sourceEn);
      sourceLink.setAttribute('data-ur-href', entry.sourceUr);
      placeholder.hidden = true;
      content.hidden = false;
      content.classList.remove('sher-fade-out');
      void content.offsetWidth;
      content.classList.add('sher-fade-in');
      window.setTimeout(function(){ content.classList.remove('sher-fade-in'); }, 320);
    }

    if(opts.instant || content.hidden){
      apply();
    }else{
      content.classList.add('sher-fade-out');
      window.setTimeout(apply, 180);
    }
    currentEntry = entry;
  }

  function showTodaysSher(instant){
    var pool = fullPool();
    if(!pool.length) return;
    var idx = seededIndex(daySeed(), pool.length);
    paintEntry(pool[idx], {instant: instant});
    setActiveMoodTag(null);
  }

  function showRandomSher(){
    var pool = fullPool(), idx, tries = 0;
    if(!pool.length) return;
    do{
      idx = Math.floor(Math.random() * pool.length);
      tries++;
    }while(currentEntry && pool[idx].item === currentEntry.item && pool[idx].verseIdx === currentEntry.verseIdx && tries < 15);
    paintEntry(pool[idx]);
    setActiveMoodTag(null);
  }

  function showMoodSher(moodKey){
    var pool = poolForMood(moodKey);
    if(!pool.length) return;
    var idx = Math.floor(Math.random() * pool.length);
    paintEntry(pool[idx]);
    setActiveMoodTag(moodKey);
  }

  /* ---- Reading-progress badge (private, localStorage only) ---- */
  var READ_KEY = 'zf-read-poems';
  function getReadSet(){
    try{ return JSON.parse(localStorage.getItem(READ_KEY) || '[]'); }catch(e){ return []; }
  }
  function renderReadBadge(){
    if(!readBadge) return;
    var read = getReadSet();
    var total = (typeof GHAZAL_ITEMS !== 'undefined' ? GHAZAL_ITEMS.length : 40) + (typeof NAZM_ITEMS !== 'undefined' ? NAZM_ITEMS.length : 10);
    if(read.length === 0){ readBadge.hidden = true; return; }
    readBadge.hidden = false;
    var l = lang();
    var text = l === 'en' ? (read.length + ' of ' + total + ' pieces read so far')
             : l === 'ur' ? (total + ' میں سے ' + read.length + ' تحریریں اب تک پڑھیں')
             : (total + ' में से ' + read.length + ' रचनाएँ अब तक पढ़ीं');
    var textEl = readBadge.querySelector('#read-badge-text');
    if(textEl) textEl.textContent = text;
    var fill = readBadge.querySelector('.read-badge-fill');
    if(fill) fill.style.width = Math.min(100, Math.round((read.length/total)*100)) + '%';
  }
  window.ZF_markPoemRead = function(id){
    var read = getReadSet();
    if(read.indexOf(id) === -1){
      read.push(id);
      try{ localStorage.setItem(READ_KEY, JSON.stringify(read)); }catch(e){}
    }
  };

  document.addEventListener('DOMContentLoaded', function(){
    btn = document.getElementById('sher-btn');
    card = document.getElementById('sher-card');
    placeholder = document.getElementById('sher-placeholder');
    content = document.getElementById('sher-content');
    linesEl = document.getElementById('sher-lines');
    sourceLink = document.getElementById('sher-source');
    sourceLabel = document.getElementById('sher-source-label');
    moodRow = document.getElementById('mood-tags');
    todayBtn = document.getElementById('sher-today-btn');
    readBadge = document.getElementById('read-progress-badge');

    if(!card || typeof GHAZAL_ITEMS === 'undefined' || !GHAZAL_ITEMS.length) return;

    if(moodRow){
      MOOD_ORDER.forEach(function(key){
        var mood = MOOD_MAP[key];
        var mbtn = document.createElement('button');
        mbtn.type = 'button';
        mbtn.className = 'mood-tag';
        mbtn.setAttribute('data-mood', key);
        mbtn.setAttribute('data-en', mood.en);
        mbtn.setAttribute('data-ur', mood.ur);
        var l0 = lang();
        mbtn.textContent = l0 === 'en' ? mood.en : (l0 === 'ur' ? mood.ur : mood.hi);
        mbtn.addEventListener('click', function(){ showMoodSher(key); });
        moodRow.appendChild(mbtn);
      });
    }

    if(btn){
      btn.addEventListener('click', function(){
        showRandomSher();
        spins += 1;
        var icon = btn.querySelector('svg');
        if(icon) icon.style.transform = 'rotate(' + (spins * 360) + 'deg)';
      });
    }
    if(todayBtn){ todayBtn.addEventListener('click', function(){ showTodaysSher(); }); }

    showTodaysSher(true);
    renderReadBadge();
  });

  window.ZF_rerenderCollection = function(){
    if(moodRow){
      moodRow.querySelectorAll('.mood-tag').forEach(function(t){
        var l = lang();
        t.textContent = l === 'en' ? t.getAttribute('data-en') : (l === 'ur' ? t.getAttribute('data-ur') : MOOD_MAP[t.getAttribute('data-mood')].hi);
      });
    }
    if(currentEntry) paintEntry(currentEntry, {instant:true});
    renderReadBadge();
  };
})();
