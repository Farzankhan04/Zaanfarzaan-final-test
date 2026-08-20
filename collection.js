/* Generic controller for a "collection" page (ghazals.html / nazms.html)
   Expects a global ITEMS array and CONFIG object to be defined before this runs.
   Bilingual: reads window.ZF_LANG ('hi' | 'en') set up by i18n.js.
   'hi' shows the original Hindi/Urdu (Devanagari) text.
   'en' shows the Roman-script transliteration (item.*En fields) —
   the words stay Hindi/Urdu, only the script changes. */
(function(){
  const listEl = document.getElementById('poem-list');
  const noResultsEl = document.getElementById('no-results');
  const listWrapEl = document.getElementById('list-wrap');
  const detailEl = document.getElementById('poem-detail');
  const searchInput = document.getElementById('search-input');

  let currentDetailId = null;

  function lang(){ return (window.ZF_LANG === 'en' || window.ZF_LANG === 'ur') ? window.ZF_LANG : 'hi'; }

  function urText(s){
    return (s && typeof window.ZF_UR_transliterateText === 'function') ? window.ZF_UR_transliterateText(s) : s;
  }
  function urHtml(s){
    return (s && typeof window.ZF_UR_transliterateHtml === 'function') ? window.ZF_UR_transliterateHtml(s) : s;
  }

  function configLabel(key){
    const val = CONFIG[key];
    if(val && typeof val === 'object') return val[lang()] || val.hi || '';
    return val || '';
  }

  function itemLabel(item){
    const l = lang();
    if(CONFIG.type === 'nazm'){
      if(l === 'en') return item.titleEn || item.title;
      if(l === 'ur') return urText(item.title);
      return item.title;
    }
    if(l === 'en') return item.firstLineEn || item.firstLine;
    if(l === 'ur') return urText(item.firstLine);
    return item.firstLine;
  }

  function itemTitleHtml(item){
    if(!item.title) return '';
    const l = lang();
    let t = item.title;
    if(l === 'en') t = item.titleEn || item.title;
    else if(l === 'ur') t = urText(item.title);
    return '<h3>' + t + '</h3>';
  }

  function itemVerses(item){
    const l = lang();
    if(l === 'en' && item.versesHtmlEn) return item.versesHtmlEn;
    if(l === 'ur') return item.versesHtml.map(urHtml);
    return item.versesHtml;
  }

  function arrow(dir){
    /* dir: 'back'|'forward' — in RTL (Urdu) "forward" points left */
    const isRtl = lang() === 'ur';
    if(dir === 'forward') return isRtl ? '&larr;' : '&rarr;';
    return isRtl ? '&rarr;' : '&larr;';
  }

  /* Search index for one item, in every script the site can display it in:
     Devanagari (Hindi, the source data), Roman (the *En fields), and Urdu
     (Nastaliq — computed live via ur-translit.js, same as what's shown on
     screen in Urdu mode). Without the Urdu-script text here, someone typing
     an Urdu-script query in Urdu mode would never match anything, since the
     underlying data is only ever stored in Devanagari/Roman. Cached on the
     item itself since none of this changes between renders. */
  function itemHaystack(item){
    if(item._zfHaystack) return item._zfHaystack;
    const haystack = (
      item.kind + ' ' +
      (item.title || '') + ' ' + (item.titleEn || '') + ' ' + urText(item.title || '') + ' ' +
      (item.firstLine || '') + ' ' + (item.firstLineEn || '') + ' ' + urText(item.firstLine || '') + ' ' +
      item.versesHtml.join(' ') + ' ' +
      (item.versesHtmlEn ? item.versesHtmlEn.join(' ') : '') + ' ' +
      item.versesHtml.map(urHtml).join(' ')
    ).toLowerCase().normalize('NFC');
    item._zfHaystack = haystack;
    return haystack;
  }

  function renderList(filter){
    const q = (filter || '').trim().toLowerCase().normalize('NFC');
    listEl.innerHTML = '';
    let matches = 0;
    ITEMS.forEach(function(item){
      const haystack = itemHaystack(item);
      if(q !== '' && !haystack.includes(q)) return;
      matches++;
      const a = document.createElement('a');
      /* Real, crawlable href to the item's static SEO page when one exists
         (CONFIG.detailUrlPrefix), so search engines can follow/index it —
         e.g. ghazals/ghazal-5.html. In-page clicks are still intercepted
         below and handled as an instant SPA-style detail open via #hash,
         so normal users never actually navigate there. */
      a.href = CONFIG.detailUrlPrefix ? (CONFIG.detailUrlPrefix + item.id + '.html') : ('#' + item.id);
      a.className = 'poem-item';
      a.innerHTML =
        '<div class="poem-item-text">' +
          '<div class="poem-item-num">' + item.kind + '</div>' +
          '<div class="poem-item-line">' + itemLabel(item) + '</div>' +
        '</div>' +
        '<div class="poem-item-go">' + arrow('forward') + '</div>';
      a.addEventListener('click', function(e){
        e.preventDefault();
        openDetail(item.id);
      });
      listEl.appendChild(a);
    });
    noResultsEl.classList.toggle('show', q !== '' && matches === 0);
  }

  function findIndexById(id){
    for(let i = 0; i < ITEMS.length; i++){ if(ITEMS[i].id === id) return i; }
    return -1;
  }

  function supportUrl(){
    const l = lang();
    if(l === 'en') return 'support-en.html';
    if(l === 'ur') return 'support-ur.html';
    return 'support.html';
  }

  function renderDetail(item, idx){
    const prevItem = ITEMS[idx - 1];
    const nextItem = ITEMS[idx + 1];
    detailEl.innerHTML =
      '<a href="' + CONFIG.listUrl + '" class="back-link" id="back-link">' + arrow('back') + ' ' + configLabel('backLabel') + '</a>' +
      '<div class="card manuscript reveal in" id="' + item.id + '">' +
        '<div class="kind">' + item.kind + '</div>' +
        itemTitleHtml(item) +
        itemVerses(item).join('') +
      '</div>' +
      '<div class="poem-nav-buttons">' +
        (prevItem ? ('<a href="#' + prevItem.id + '" id="prev-link">' + arrow('back') + ' ' + configLabel('prevLabel') + '</a>') : '<span class="disabled"></span>') +
        (nextItem ? ('<a href="#' + nextItem.id + '" id="next-link">' + configLabel('nextLabel') + ' ' + arrow('forward') + '</a>') : '<span class="disabled"></span>') +
      '</div>' +
      '<div class="support-cta">' +
        '<a href="' + supportUrl() + '">&#10084; ' + (window.ZF_T ? window.ZF_T('supportCta') : '') + '</a>' +
      '</div>';

    const backLink = document.getElementById('back-link');
    if(backLink) backLink.addEventListener('click', function(e){ e.preventDefault(); closeDetail(); });
    const prevLink = document.getElementById('prev-link');
    if(prevLink) prevLink.addEventListener('click', function(e){ e.preventDefault(); openDetail(prevItem.id); });
    const nextLink = document.getElementById('next-link');
    if(nextLink) nextLink.addEventListener('click', function(e){ e.preventDefault(); openDetail(nextItem.id); });

    attachCardActions(detailEl);
  }

  function openDetail(id){
    const idx = findIndexById(id);
    if(idx === -1) return;
    currentDetailId = id;
    renderDetail(ITEMS[idx], idx);
    listWrapEl.classList.add('hidden');
    detailEl.classList.add('open');
    if(window.location.hash !== '#' + id) history.pushState({id:id}, '', '#' + id);
    window.scrollTo({top:0, behavior:'instant' in window ? 'instant' : 'auto'});
  }

  function closeDetail(){
    currentDetailId = null;
    detailEl.classList.remove('open');
    listWrapEl.classList.remove('hidden');
    detailEl.innerHTML = '';
    if(window.location.hash) history.pushState({}, '', window.location.pathname);
  }

  if(searchInput){
    searchInput.addEventListener('input', function(e){ renderList(e.target.value); });
  }

  window.addEventListener('popstate', function(){
    const id = window.location.hash.replace('#', '');
    if(id && findIndexById(id) !== -1){ openDetail(id); }
    else { closeDetail(); }
  });

  /* Called by i18n.js right after the language flips, so the list/detail
     currently on screen re-paints in the new script without a page reload
     and without losing which ghazal/nazm was open. */
  window.ZF_rerenderCollection = function(){
    renderList(searchInput ? searchInput.value : '');
    if(currentDetailId){
      const idx = findIndexById(currentDetailId);
      if(idx !== -1) renderDetail(ITEMS[idx], idx);
    }
  };

  renderList('');

  const initialId = window.location.hash.replace('#', '');
  if(initialId && findIndexById(initialId) !== -1){
    openDetail(initialId);
  }
})();
