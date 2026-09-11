/* Homepage "sher" experience — shows a deterministic "sher of the day" on
   load, or lets visitors ask for a fully random one, painted into the
   same #sher-card with a soft crossfade between changes. The sher pool
   itself is ghazals only (see fullPool below); GHAZAL_ITEMS/NAZM_ITEMS
   are shared with ghazals.html/nazms.html (loaded via ghazals-data.js /
   nazms-data.js) so there is one source of truth for the poems
   themselves, and the reading-progress badge below counts both. */
(function(){

  var btn, card, placeholder, content, linesEl, sourceLink, sourceLabel, todayBtn, readBadge;
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

  /* Ghazals only, by design — a "sher" here specifically means a ghazal
     couplet. NAZM_ITEMS is loaded on this page too (for search.js), but
     must stay out of this pool: nazms are longer continuous poems, not
     couplets, and mixing in a single nazm line as if it were a sher
     doesn't read right out of context. */
  function fullPool(){
    var pool = [];
    if(typeof GHAZAL_ITEMS !== 'undefined'){
      GHAZAL_ITEMS.forEach(function(g){
        for(var v=0; v<g.versesHtml.length; v++) pool.push({item:g, verseIdx:v, source:'ghazals.html', sourceEn:'ghazals-en.html', sourceUr:'ghazals-ur.html'});
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
      syncHomeFavoriteBtn();
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
  }

  function showRandomSher(){
    var pool = fullPool(), idx, tries = 0;
    if(!pool.length) return;
    do{
      idx = Math.floor(Math.random() * pool.length);
      tries++;
    }while(currentEntry && pool[idx].item === currentEntry.item && pool[idx].verseIdx === currentEntry.verseIdx && tries < 15);
    paintEntry(pool[idx]);
  }

  function syncHomeFavoriteBtn(){
    var favBtn = document.getElementById('sher-favorite-btn');
    if(!favBtn || !currentEntry || typeof window.ZF_isFavorite !== 'function') return;
    var on = window.ZF_isFavorite(currentEntry.item.id);
    favBtn.classList.toggle('active', on);
  }
  window.ZF_toggleHomeSherFavorite = function(btn){
    if(!currentEntry || typeof window.ZF_toggleFavorite !== 'function') return;
    var justFavorited = window.ZF_toggleFavorite(currentEntry.item.id);
    syncHomeFavoriteBtn();
    if(justFavorited && typeof window.ZF_sealPop === 'function') window.ZF_sealPop(btn);
  };

  /* Builds the same '.export-card' markup used for ghazal/nazm cards
     (see app.js buildExportCard), so a sher shared from the homepage
     looks identical to one shared from its own ghazal/nazm page. */
  function buildHomeExportCard(){
    var wrap = document.createElement('div');
    wrap.className = 'export-card';

    var body = document.createElement('div');
    body.className = 'export-body';
    var verseClone = linesEl.cloneNode(true);
    verseClone.className = 'export-verse';
    body.appendChild(verseClone);
    wrap.appendChild(body);

    var footer = document.createElement('div');
    footer.className = 'export-footer';
    var brandName = (typeof window.ZF_T === 'function') ? window.ZF_T('brandName') : 'Zaan Farzaan';
    footer.innerHTML = '<span class="export-brand">' + brandName + '</span><span class="export-site">zaanfarzaan.site</span>';
    wrap.appendChild(footer);

    return wrap;
  }

  function downloadHomeSher(btn){
    if(typeof html2canvas === 'undefined' || !currentEntry) return;
    if(btn) btn.classList.add('loading');
    var stage = document.createElement('div');
    stage.className = 'export-stage';
    var exportCard = buildHomeExportCard();
    stage.appendChild(exportCard);
    document.body.appendChild(stage);

    html2canvas(exportCard, {backgroundColor:'#f7f7f4', scale:2, useCORS:true, width:760, windowWidth:760}).then(function(canvas){
      document.body.removeChild(stage);
      if(btn) btn.classList.remove('loading');
      var link = document.createElement('a');
      link.download = 'zaan-farzaan-sher.png';
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).catch(function(){
      if(document.body.contains(stage)) document.body.removeChild(stage);
      if(btn) btn.classList.remove('loading');
      if(typeof showToast === 'function' && typeof window.ZF_T === 'function') showToast(window.ZF_T('downloadFailed'));
    });
  }

  function shareHomeSher(){
    if(!currentEntry) return;
    var url;
    try{ url = new URL(currentEntry.source + '#' + currentEntry.item.id, window.location.href).href; }
    catch(e){ url = window.location.href; }
    var titleText = sourceLabel ? sourceLabel.textContent.trim() : '';
    var brandName = (typeof window.ZF_T === 'function') ? window.ZF_T('brandName') : 'Zaan Farzaan';
    var prefix = (typeof window.ZF_T === 'function') ? window.ZF_T('shareTextPrefix') : '';
    var shareData = {title: brandName, text: (prefix || '') + titleText, url: url};
    if(navigator.share){
      navigator.share(shareData).catch(function(){});
    }else if(navigator.clipboard){
      navigator.clipboard.writeText(url).then(function(){
        if(typeof showToast === 'function' && typeof window.ZF_T === 'function') showToast(window.ZF_T('linkCopied'));
      }).catch(function(){ window.prompt((typeof window.ZF_T === 'function') ? window.ZF_T('copyPrompt') : 'Copy:', url); });
    }else{
      window.prompt((typeof window.ZF_T === 'function') ? window.ZF_T('copyPrompt') : 'Copy:', url);
    }
  }
  window.ZF_downloadHomeSher = downloadHomeSher;
  window.ZF_shareHomeSher = shareHomeSher;
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
    todayBtn = document.getElementById('sher-today-btn');
    readBadge = document.getElementById('read-progress-badge');

    if(!card || typeof GHAZAL_ITEMS === 'undefined' || !GHAZAL_ITEMS.length) return;

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
    if(currentEntry) paintEntry(currentEntry, {instant:true});
    renderReadBadge();
  };
})();
