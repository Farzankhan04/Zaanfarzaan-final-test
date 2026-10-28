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

  /* Search brain (zf-find.js): finds any word/sher in any script and shows it highlighted in the results. Loaded as soon as the page opens. */
  let lastQuery = '';
  function loadFind(){
    if(window.ZFS){ window.ZFS.ready(function(){ if(searchInput && searchInput.value) renderList(searchInput.value); }); return; }
    const sc = document.createElement('script'); sc.src = 'zf-find.js?v=1';
    sc.onload = function(){ window.ZFS.ready(function(){ if(searchInput && searchInput.value) renderList(searchInput.value); }); };
    document.head.appendChild(sc);
  }
  loadFind();
  /* After a poem is opened from a search, mark the searched word inside it and scroll to it. */
  function markSearched(){
    if(!window.ZFS || !searchInput || !searchInput.value.trim()) return;
    window.ZFS.highlightIn(detailEl, window.ZFS.parse(searchInput.value));
  }

  function renderList(filter, animateEntrance){
    const q = (filter || '').trim().toLowerCase().normalize('NFC');
    listEl.innerHTML = '';
    let matches = 0, P0 = null;
    lastQuery = q;
    ITEMS.forEach(function(item){
      let snip = '', P = null;
      if(q !== ''){
        if(window.ZFS){
          P = P0 || (P0 = window.ZFS.parse(filter));
          const m = window.ZFS.match(item, P);
          if(!m) return;
          if(m.verses.length) snip = window.ZFS.snippets(item, m, P, lang(), 3);
        } else if(!itemHaystack(item).includes(q)) return;
      }
      const shownIndex = matches;
      matches++;
      const a = document.createElement('a');
      a.dataset.id = item.id;
      /* Real, crawlable href to the item's static SEO page when one exists
         (CONFIG.detailUrlPrefix), so search engines can follow/index it —
         e.g. ghazal-5.html. In-page clicks are still intercepted
         below and handled as an instant SPA-style detail open via #hash,
         so normal users never actually navigate there. */
      a.href = CONFIG.detailUrlPrefix ? (CONFIG.detailUrlPrefix + item.id + '.html') : ('#' + item.id);
      /* poem-item-enter (see style.css) gives the list a one-time cascading
         entrance. Only ever passed true for the page's very first render —
         see the plain renderList('') calls below — so typing in the search
         box or an i18n re-render never replays it mid-use. */
      a.className = 'poem-item' + (animateEntrance ? ' poem-item-enter' : '');
      if(animateEntrance) a.style.setProperty('--i', Math.min(shownIndex, 12));
      a.innerHTML =
        '<div class="poem-item-text">' +
          '<div class="poem-item-num">' + item.kind + '</div>' +
          '<div class="poem-item-line">' + (P ? window.ZFS.highlightHtml(itemLabel(item), P.vars) : itemLabel(item)) + '</div>' + snip +
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

  /* SHARE ROW — WhatsApp / Telegram / X / Facebook links under the open ghazal/nazm (the same row
     the stand-alone ghazal-N.html / nazm-N.html pages have). The link shared is that poem's own page,
     so the preview picture (share-<id>.jpg) shows up. Re-drawn on every language switch. */
  const SHARE_LABEL = {hi:'शेयर करें', en:'Share', ur:'شیئر کریں'};
  function injectShareCss(){
    if(document.getElementById('zf-share-css')) return;
    const st = document.createElement('style');
    st.id = 'zf-share-css';
    st.textContent =
      '.zf-share-row{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:.6rem .8rem;margin:1.6rem 0 0}' +
      '.zf-share-label{flex-basis:100%;text-align:center;color:var(--text-muted);font-size:.9rem;margin:0 0 .1rem}' +
      '.zf-share-row a{color:var(--gold-soft);border:1px solid rgba(220,220,214,.35);border-radius:999px;padding:.38rem .95rem;' +
        'font-size:.88rem;text-decoration:none;font-family:"Lora",sans-serif}' +
      '.zf-share-row a:hover{border-color:var(--gold-soft);background:rgba(255,255,255,.06)}';
    document.head.appendChild(st);
  }
  function plainLines(html){
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    const spans = tmp.querySelectorAll('.line');
    if(spans.length) return Array.prototype.map.call(spans, function(n){ return n.textContent.trim(); });
    return [tmp.textContent.trim()];
  }
  function shareRowHtml(item){
    injectShareCss();
    const l = lang();
    const url = 'https://zaanfarzaan.site/' + item.id + '.html';
    let msg;
    if(CONFIG.type === 'nazm'){
      msg = '\u2018' + itemLabel(item) + '\u2019';
    } else {
      const v0 = (item.versesHtml || [])[0] || '';
      const src = (l === 'en') ? (((item.versesHtmlEn || [])[0]) || v0) : (l === 'ur' ? urHtml(v0) : v0);
      msg = plainLines(src).slice(0, 2).join('\n');
    }
    const who = (l === 'hi') ? 'ज़ान फ़रज़ान' : 'Zaan Farzaan';
    const tag = (CONFIG.type === 'nazm' ? 'Nazm' : 'Ghazal') + ' #' + item.num;
    const text = msg + '\n\u2014 ' + who + ' (' + tag + ')';
    const q = encodeURIComponent;
    const links = [
      ['WhatsApp', 'https://wa.me/?text=' + q(text + '\n' + url)],
      ['Telegram', 'https://t.me/share/url?url=' + q(url) + '&amp;text=' + q(text)],
      ['X', 'https://twitter.com/intent/tweet?text=' + q(text) + '&amp;url=' + q(url)],
      ['Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + q(url)]
    ];
    return '<div class="zf-share-row"><span class="zf-share-label">' + SHARE_LABEL[l] + '</span>' +
      links.map(function(x){ return '<a href="' + x[1] + '" target="_blank" rel="noopener noreferrer">' + x[0] + '</a>'; }).join('') +
      '</div>';
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
      shareRowHtml(item);

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
    markSearched();
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

  /* If the list already has real, statically pre-rendered <a class="poem-item">
     items (baked in ahead of time so search engines and no-JS visitors see
     the full list immediately, instead of an empty div JS has to fill in),
     just wire up click behaviour on that existing markup instead of wiping
     it and rebuilding from scratch. Keeps the very first paint identical to
     what's actually sitting in the HTML, and avoids redoing work that's
     already correct. Falls back to a normal full render if no static items
     are present (e.g. a future page that isn't pre-baked yet). */
  function hydrateStaticList(){
    const existing = listEl.querySelectorAll('a.poem-item[data-id]');
    if(!existing.length) return false;
    existing.forEach(function(a){
      const id = a.dataset.id;
      if(findIndexById(id) === -1) return;
      a.addEventListener('click', function(e){
        e.preventDefault();
        openDetail(id);
      });
    });
    return true;
  }

  if(!hydrateStaticList()){
    renderList('', true);
  }

  const initialId = window.location.hash.replace('#', '');
  if(initialId && findIndexById(initialId) !== -1){
    openDetail(initialId);
  }
})();
