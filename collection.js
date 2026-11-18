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


  /* v47: tiny "N couplets - ~M min" line under each list row */
  function itemMeta(item){
    try{
      var L = lang();
      var h = (L === 'en' && item.versesHtmlEn) ? item.versesHtmlEn : item.versesHtml;
      if(Array.isArray(h)) h = h.join('');
      if(!h) return '';
      var lines = (h.match(/class="line"/g) || []).length + (h.match(/nazm-line/g) || []).length;
      var verses = (h.match(/class="verse"/g) || []).length;
      var txt = h.replace(/<[^>]*>/g, ' ').trim();
      var words = txt ? txt.split(/\s+/).length : 0;
      var mins = Math.max(1, Math.round(words / 110));
      var isNazm = /^nazm/.test(String(item.id));
      var n = isNazm ? lines : verses;
      if(!n) return '';
      var unit = isNazm ? (L === 'en' ? 'lines' : (L === 'ur' ? 'مصرعے' : 'पंक्तियाँ'))
                        : (L === 'en' ? 'couplets' : (L === 'ur' ? 'اشعار' : 'अश्आर'));
      var tm = L === 'en' ? ('~' + mins + ' min read') : (L === 'ur' ? ('~' + mins + ' منٹ') : ('~' + mins + ' मिनट'));
      return '<div class="poem-item-meta">' + n + ' ' + unit + ' · ' + tm + '</div>';
    }catch(e){ if(window.console) console.log('itemMeta', e); return ''; }
  }


  /* =====================================================================================================
     v64 — AUDIO BADGE + FILTER & SORT for the ghazal / nazm list pages
     - Audio badge on every row that has an audio. Source of truth: app.js (window.ZF_GHAZAL_AUDIOS for ghazals,
       window.ZF_AUDIO_COUNT for nazms) — the same lists the Audio page and the home page use, so a new audio shows its badge automatically.
     - Filter: with audio, length (couplets / lines), Urdu level, my favourites.  Sort: number, most commented, longest, shortest, more/less Urdu, audio first.
     - "Urdu level" = share of Persian/Arabic-origin words in the piece (nukta letters, -e-/-o- izafat, ayn/hamza marks and the Lafz glossary words),
       computed live from the poem text in ghazals-data.js / nazms-data.js, then ranked inside the collection (top third = more Urdu, bottom third = simpler).
     - "Most commented" = number of approved reader comments (Supabase, same public read the comments box uses), fetched only when that sort is chosen.
     There is no site-wide like / read counter (favourites and "read" live only in each reader's own browser), so those cannot be ranked across readers.
     ===================================================================================================== */
  const LT_SB_URL = 'https://silqtikgdywjzebdehai.supabase.co';
  const LT_SB_KEY = 'sb_publishable_2GYkJE2I5Qtl2eSbDFcDvg_JI9Ha4t5';
  const IS_NAZM = CONFIG.type === 'nazm';
  const LEN_CUT = IS_NAZM ? {s: 18, l: 27} : {s: 7, l: 10};     /* short <= s ; long >= l ; else medium */
  const LT_T = {
    btn:    {hi:'फ़िल्टर और क्रम', en:'Filter & sort', ur:'فلٹر اور ترتیب'},
    sort:   {hi:'क्रम', en:'Sort by', ur:'ترتیب'},
    show:   {hi:'सिर्फ़ दिखाएँ', en:'Show only', ur:'صرف دکھائیں'},
    lang:   {hi:'ज़बान', en:'Language style', ur:'زبان'},
    langn:  {hi:'हर रचना में फ़ारसी-अरबी लफ़्ज़ों के अनुपात से तय होता है।', en:'Based on how many Persian/Arabic-origin words a piece uses.', ur:'ہر تخلیق میں فارسی عربی الفاظ کے تناسب سے طے ہوتا ہے۔'},
    audio:  {hi:'ऑडियो वाली', en:'With audio', ur:'آڈیو والی'},
    fav:    {hi:'मेरी पसंद', en:'My favourites', ur:'میری پسند'},
    s:      {hi:'छोटी', en:'Short', ur:'مختصر'},
    m:      {hi:'मध्यम', en:'Medium', ur:'درمیانی'},
    l:      {hi:'लंबी', en:'Long', ur:'طویل'},
    more:   {hi:'ज़्यादा उर्दू', en:'More Urdu', ur:'زیادہ اردو'},
    simple: {hi:'आसान ज़बान', en:'Simpler', ur:'آسان زبان'},
    clear:  {hi:'सब हटाएँ', en:'Clear all', ur:'سب ہٹائیں'},
    badge:  {hi:'ऑडियो', en:'Audio', ur:'آڈیو'},
    badgeT: {hi:'इसका ऑडियो मौजूद है', en:'Audio available', ur:'اس کا آڈیو موجود ہے'},
    ccErr:  {hi:'टिप्पणियों की गिनती अभी नहीं आ सकी।', en:'Could not load comment counts right now.', ur:'تبصروں کی گنتی ابھی نہیں آ سکی۔'},
    ccNone: {hi:'अभी किसी पर मंज़ूर टिप्पणी नहीं है, इसलिए क्रम वही रहा।', en:'No approved comments yet, so the usual order is kept.', ur:'ابھی کسی پر منظور شدہ تبصرہ نہیں، اس لیے ترتیب وہی رہی۔'},
    wait:   {hi:'लोड हो रहा है…', en:'Loading…', ur:'لوڈ ہو رہا ہے…'}
  };
  const LT_SORTS = [
    ['num',      {hi:'क्रमांक (पहले जैसा)', en:'Default order', ur:'معمول کی ترتیب'}],
    ['comments', {hi:'सबसे ज़्यादा टिप्पणियाँ', en:'Most commented', ur:'سب سے زیادہ تبصرے'}],
    ['long',     {hi:'सबसे लंबी पहले', en:'Longest first', ur:'سب سے طویل پہلے'}],
    ['short',    {hi:'सबसे छोटी पहले', en:'Shortest first', ur:'سب سے مختصر پہلے'}],
    ['urdu',     {hi:'ज़्यादा उर्दू पहले', en:'More Urdu first', ur:'زیادہ اردو پہلے'}],
    ['simple',   {hi:'आसान ज़बान पहले', en:'Simpler language first', ur:'آسان زبان پہلے'}],
    ['audio',    {hi:'ऑडियो वाली पहले', en:'With audio first', ur:'آڈیو والی پہلے'}]
  ];
  const LT_NOUN = IS_NAZM ? {hi:'नज़्में', en:'nazms', ur:'نظمیں'} : {hi:'ग़ज़लें', en:'ghazals', ur:'غزلیں'};
  const LT_UNIT = IS_NAZM ? {hi:'पंक्तियाँ', en:'lines', ur:'مصرعے'} : {hi:'अश्आर', en:'couplets', ur:'اشعار'};
  function ltT(k){ const v = LT_T[k]; return v ? v[lang()] : ''; }
  function ltRange(k){
    if(k === 's') return (lang() === 'en' ? 'up to ' : '') + LEN_CUT.s + (lang() === 'en' ? '' : (lang() === 'ur' ? ' تک' : ' तक'));
    if(k === 'l') return LEN_CUT.l + '+';
    return (LEN_CUT.s + 1) + '–' + (LEN_CUT.l - 1);
  }
  function ltCountText(shown, total){
    const n = LT_NOUN[lang()];
    const obl = IS_NAZM ? {hi:'नज़्मों', ur:'نظموں'} : {hi:'ग़ज़लों', ur:'غزلوں'};    /* "in the ghazals" needs the oblique plural in Hindi / Urdu */
    if(lang() === 'en') return 'Showing ' + shown + ' of ' + total + ' ' + n;
    if(lang() === 'ur') return total + ' ' + obl.ur + ' میں سے ' + shown;
    return total + ' ' + obl.hi + ' में से ' + shown;
  }
  function ltNone(){
    const n = LT_NOUN[lang()];
    if(lang() === 'en') return 'No ' + n + ' match these filters.';
    if(lang() === 'ur') return 'ان فلٹرز سے کوئی چیز نہیں ملی۔';
    return 'इन फ़िल्टर से कुछ नहीं मिला।';
  }

  const LT = (function(){
    const st = {audio:false, fav:false, len:'', urdu:'', sort:'num', open:false};
    let counts = null, countsErr = false, countsBusy = false, urReady = false, urLoading = false, bar = null;

    function hasAudio(item){
      if(IS_NAZM) return item.num >= 1 && item.num <= (window.ZF_AUDIO_COUNT || 0);
      return (window.ZF_GHAZAL_AUDIOS || []).indexOf(item.num) !== -1;
    }
    function isFav(item){ return typeof window.ZF_isFavorite === 'function' && window.ZF_isFavorite(item.id); }
    function count(item){ return (item.versesHtml || []).length; }
    function lenKey(item){ const n = count(item); return n <= LEN_CUT.s ? 's' : (n >= LEN_CUT.l ? 'l' : 'm'); }

    /* ---- Urdu level ---- */
    const TAKHALLUS = '\u091C\u093C\u093E\u0928';   /* ज़ान */
    const NUKTA = /[\u0958\u0959\u095A\u095B\u095E]|[\u0915\u0916\u0917\u091C\u092B]\u093C/;
    function plain(item){ return (item.versesHtml || []).join(' ').replace(/<[^>]*>/g, ' '); }
    function urduScore(item, gl){
      const toks = plain(item).split(/[\s,;:!?\u0964\.\u2026"\u201C\u201D()\[\]]+/).filter(Boolean);
      if(!toks.length) return 0;
      let u = 0;
      toks.forEach(function(raw){
        const w = raw.normalize('NFC');
        const c = w.replace(/^['\u2018\u2019]+|['\u2018\u2019]+$/g, '');
        if(!c || c === TAKHALLUS) return;      /* the poet's pen-name in the last sher is not a measure of language */
        let hit = NUKTA.test(c) || /['\u2019]/.test(w) || /-(\u090F|\u0913|\u0935)-/.test(c) || /^(\u090F|\u0913)$/.test(c);
        if(!hit && gl){
          if(gl.has(c)) hit = true;
          else if(c.indexOf('-') > -1){ c.split('-').forEach(function(part){ if(part.length > 1 && gl.has(part)) hit = true; }); }
        }
        if(hit) u++;
      });
      return u / toks.length;
    }
    function computeUrdu(){
      const gl = new Set();
      (window.ZF_LAFZ || []).forEach(function(e){ (e.k || []).forEach(function(k){ gl.add(String(k).normalize('NFC')); }); });
      ITEMS.forEach(function(it){ it._zfUr = urduScore(it, gl); });
      const ranked = ITEMS.slice().sort(function(a, b){ return b._zfUr - a._zfUr || a.num - b.num; });
      const third = Math.ceil(ITEMS.length / 3);
      ranked.forEach(function(it, i){ it._zfUrL = i < third ? 'more' : (i >= ITEMS.length - third ? 'simple' : 'mid'); });
      urReady = true;
    }
    function ensureUrdu(cb){
      if(urReady) return cb();
      if(window.ZF_LAFZ){ computeUrdu(); return cb(); }
      if(urLoading){ return setTimeout(function(){ ensureUrdu(cb); }, 150); }
      urLoading = true;
      const sc = document.createElement('script'); sc.src = 'lafz-data.js';
      sc.onload = function(){ urLoading = false; computeUrdu(); cb(); };
      sc.onerror = function(){ urLoading = false; computeUrdu(); cb(); };   /* still works from nukta / izafat / ayn marks alone */
      document.head.appendChild(sc);
    }

    /* ---- comment counts (Supabase, approved only) ---- */
    function ensureCounts(cb){
      if(counts){ return cb(); }
      if(countsBusy){ return setTimeout(function(){ ensureCounts(cb); }, 200); }
      countsBusy = true;
      const u = LT_SB_URL + '/rest/v1/comments?select=page&approved=eq.true&page=like.*' + CONFIG.type + '-*&limit=1000';
      fetch(u, {headers: {apikey: LT_SB_KEY}})
        .then(function(r){ if(!r.ok) throw new Error('x'); return r.json(); })
        .then(function(rows){
          counts = {};
          (rows || []).forEach(function(r){ const m = /(?:^|-)(ghazal|nazm)-(\d+)$/.exec(r.page || ''); if(m && m[1] === CONFIG.type){ const id = CONFIG.type + '-' + m[2]; counts[id] = (counts[id] || 0) + 1; } });
          countsErr = false; countsBusy = false; cb();
        })
        .catch(function(){ counts = {}; countsErr = true; countsBusy = false; cb(); });
    }
    function cc(item){ return (counts && counts[item.id]) || 0; }

    /* ---- filter + sort ---- */
    function active(){ return (st.audio ? 1 : 0) + (st.fav ? 1 : 0) + (st.len ? 1 : 0) + (st.urdu ? 1 : 0); }
    function pass(item){
      if(st.audio && !hasAudio(item)) return false;
      if(st.fav && !isFav(item)) return false;
      if(st.len && lenKey(item) !== st.len) return false;
      if(st.urdu && urReady && item._zfUrL !== st.urdu) return false;
      return true;
    }
    function sortRows(rows){
      const k = st.sort;
      if(k === 'num') return rows;
      const by = {
        comments: function(a, b){ return cc(b.item) - cc(a.item) || a.item.num - b.item.num; },
        long:     function(a, b){ return count(b.item) - count(a.item) || a.item.num - b.item.num; },
        short:    function(a, b){ return count(a.item) - count(b.item) || a.item.num - b.item.num; },
        urdu:     function(a, b){ return (b.item._zfUr || 0) - (a.item._zfUr || 0) || a.item.num - b.item.num; },
        simple:   function(a, b){ return (a.item._zfUr || 0) - (b.item._zfUr || 0) || a.item.num - b.item.num; },
        audio:    function(a, b){ return (hasAudio(b.item) ? 1 : 0) - (hasAudio(a.item) ? 1 : 0) || a.item.num - b.item.num; }
      }[k];
      return by ? rows.slice().sort(by) : rows;
    }

    /* ---- row decorations ---- */
    function badgeHtml(item){
      if(!hasAudio(item)) return '';
      return '<span class="zf-abadge" title="' + ltT('badgeT') + '"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4.5" height="7" rx="1.6" fill="currentColor"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.6" fill="currentColor"/></svg>' + ltT('badge') + '</span>';
    }
    function extraMeta(item){
      if(st.sort !== 'comments' || !counts) return '';
      const n = cc(item); if(!n) return '';
      return '<div class="poem-item-meta zf-cc">' + n + (lang() === 'en' ? (n === 1 ? ' comment' : ' comments') : (lang() === 'ur' ? ' تبصرے' : ' टिप्पणियाँ')) + '</div>';
    }

    /* ---- UI ---- */
    function injectCss(){
      if(document.getElementById('zf-lt-css')) return;
      const el = document.createElement('style'); el.id = 'zf-lt-css';
      el.textContent =
        '.zf-abadge{display:inline-flex;align-items:center;gap:.32rem;margin-inline-start:.7rem;padding:.08rem .55rem;border:1px solid rgba(var(--zf-rgb),.5);border-radius:999px;' +
          'font-size:.66rem;line-height:1.5;letter-spacing:.04em;text-transform:none;font-weight:600;color:var(--gold);background:rgba(var(--zf-rgb),.08);vertical-align:middle;white-space:nowrap}' +
        '.lang-ur .zf-abadge{font-size:.78rem;letter-spacing:0}' +
        '.zf-lt{max-width:820px;margin:-1.4rem auto 1.6rem;padding:0 6vw;text-align:start}' +
        '.zf-lt-top{display:flex;align-items:center;justify-content:space-between;gap:.8rem;flex-wrap:wrap}' +
        '.zf-lt-btn{display:inline-flex;align-items:center;gap:.5rem;background:rgba(var(--zf-rgb2),.05);border:1px solid rgba(var(--zf-rgb),.35);color:var(--text-light);' +
          'padding:.5rem 1rem;border-radius:999px;font:inherit;font-size:.88rem;line-height:1.5;cursor:pointer;transition:background .2s,border-color .2s}' +
        '.lang-ur .zf-lt-btn{font-size:.95rem}' +
        '.zf-lt-btn:hover,.zf-lt-btn[aria-expanded="true"]{background:rgba(var(--zf-rgb),.12);border-color:var(--gold)}' +
        '.zf-lt-btn svg{flex:none}' +
        '.zf-lt-n{min-width:1.35rem;height:1.35rem;padding:0 .35rem;border-radius:999px;background:var(--gold-soft);color:var(--ink);font-size:.74rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;line-height:1}' +
        '.zf-lt-count{font-size:.8rem;color:var(--text-muted);letter-spacing:.02em}' +
        '.lang-ur .zf-lt-count{font-size:.88rem}' +
        '.zf-lt-panel{margin-top:.9rem;padding:1.1rem 1.2rem 1rem;border:1px solid rgba(var(--zf-rgb),.25);border-radius:6px;background:rgba(var(--zf-rgb2),.04)}' +
        '.zf-lt-panel[hidden]{display:none}' +
        '.zf-lt-g{margin:0 0 1rem}.zf-lt-g:last-child{margin-bottom:0}' +
        '.zf-lt-k{display:block;font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;color:var(--rose);font-weight:600;margin:0 0 .45rem}' +
        '.lang-ur .zf-lt-k,.lang-hi .zf-lt-k{letter-spacing:.02em;text-transform:none;font-size:.82rem}' +
        '.zf-lt-chips{display:flex;flex-wrap:wrap;gap:.45rem}' +
        '.zf-lt-chip{background:rgba(var(--zf-rgb),.035);border:1px solid rgba(var(--zf-rgb),.35);color:var(--text-light);padding:.38rem .85rem;border-radius:999px;font:inherit;font-size:.85rem;line-height:1.5;cursor:pointer;min-height:36px;transition:background .2s,border-color .2s,color .2s}' +
        '.lang-ur .zf-lt-chip{font-size:.92rem}' +
        '.zf-lt-chip:hover{background:rgba(var(--zf-rgb),.14);border-color:rgba(var(--zf-rgb),.6)}' +
        '.zf-lt-chip[aria-pressed="true"]{background:var(--gold-soft);color:var(--ink);border-color:var(--gold-soft)}' +
        '.zf-lt-chip small{opacity:.7;margin-inline-start:.3rem;font-size:.75em}' +
        '.zf-lt-sel{width:100%;max-width:340px;background:var(--ink-deep,#0a0a0a);color:var(--text-light);border:1px solid rgba(var(--zf-rgb),.35);border-radius:4px;padding:.55rem .7rem;font:inherit;font-size:.9rem;line-height:1.5}' +
        '.zf-lt-sel:focus-visible,.zf-lt-chip:focus-visible,.zf-lt-btn:focus-visible,.zf-lt-clear:focus-visible{outline:2px solid var(--gold);outline-offset:2px}' +
        '.zf-lt-hint{margin:.5rem 0 0;font-size:.74rem;color:var(--text-muted);line-height:1.6}' +
        '.zf-lt-foot{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:1rem;padding-top:.8rem;border-top:1px solid rgba(var(--zf-rgb),.15)}' +
        '.zf-lt-clear{background:none;border:0;padding:.2rem 0;color:var(--gold-soft);font:inherit;font-size:.86rem;text-decoration:underline;text-underline-offset:3px;cursor:pointer}' +
        '.zf-lt-clear[hidden]{display:none}' +
        '.zf-lt-note{font-size:.8rem;color:var(--text-muted);margin:.7rem 0 0;line-height:1.6}' +
        '.zf-lt-none{text-align:center;color:var(--text-muted);font-style:italic;padding:1.4rem 6vw .6rem}' +
        '.zf-lt-none button{display:block;margin:.6rem auto 0;font-style:normal}' +
        '.poem-item-meta.zf-cc{margin-top:.15rem;color:var(--gold)}' +
        '@media (max-width:520px){.zf-lt{margin-top:-1.8rem}.zf-lt-sel{max-width:none}}';
      document.head.appendChild(el);
    }
    function chip(key, label, on, n){
      return '<button type="button" class="zf-lt-chip" data-k="' + key + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + label + (n != null ? '<small>' + n + '</small>' : '') + '</button>';
    }
    function nCount(fn){ let n = 0; ITEMS.forEach(function(it){ if(fn(it)) n++; }); return n; }
    function render(shown){
      if(!bar) return;
      const total = ITEMS.length, a = active();
      const sortOpts = LT_SORTS.map(function(o){ return '<option value="' + o[0] + '"' + (st.sort === o[0] ? ' selected' : '') + '>' + o[1][lang()] + '</option>'; }).join('');
      const lens = ['s', 'm', 'l'].map(function(k){ return chip('len-' + k, ltT(k) + ' (' + ltRange(k) + ')', st.len === k, nCount(function(it){ return lenKey(it) === k; })); }).join('');
      const filtersOn = a > 0, nothing = shown === 0 && filtersOn;
      const ae = document.activeElement, fk = ae && bar.contains(ae) ? (ae.id || ae.getAttribute('data-k') || '') : '';
      bar.innerHTML =
        '<div class="zf-lt-top">' +
          '<button type="button" class="zf-lt-btn" id="zf-lt-btn" aria-expanded="' + (st.open ? 'true' : 'false') + '" aria-controls="zf-lt-panel">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>' +
            '<span>' + ltT('btn') + '</span>' + (a ? '<span class="zf-lt-n">' + a + '</span>' : '') +
          '</button>' +
          '<span class="zf-lt-count" aria-live="polite">' + ((a || st.sort !== 'num' || (searchInput && searchInput.value.trim())) ? ltCountText(shown, total) : '') + '</span>' +
        '</div>' +
        '<div class="zf-lt-panel" id="zf-lt-panel"' + (st.open ? '' : ' hidden') + '>' +
          '<div class="zf-lt-g"><label class="zf-lt-k" for="zf-lt-sort">' + ltT('sort') + '</label><select class="zf-lt-sel" id="zf-lt-sort">' + sortOpts + '</select></div>' +
          '<div class="zf-lt-g"><span class="zf-lt-k">' + ltT('show') + '</span><div class="zf-lt-chips">' +
            chip('audio', ltT('audio'), st.audio, nCount(hasAudio)) + chip('fav', '\u2665 ' + ltT('fav'), st.fav, nCount(isFav)) + '</div></div>' +
          '<div class="zf-lt-g"><span class="zf-lt-k">' + (lang() === 'en' ? 'Length' : (lang() === 'ur' ? 'طوالت' : 'लंबाई')) + ' (' + LT_UNIT[lang()] + ')</span><div class="zf-lt-chips">' + lens + '</div></div>' +
          '<div class="zf-lt-g"><span class="zf-lt-k">' + ltT('lang') + '</span><div class="zf-lt-chips">' +
            chip('urdu-more', ltT('more'), st.urdu === 'more', urReady ? nCount(function(it){ return it._zfUrL === 'more'; }) : null) +
            chip('urdu-simple', ltT('simple'), st.urdu === 'simple', urReady ? nCount(function(it){ return it._zfUrL === 'simple'; }) : null) +
          '</div><p class="zf-lt-hint">' + ltT('langn') + '</p></div>' +
          ((st.sort === 'comments' && (countsBusy || countsErr || (counts && !Object.keys(counts).length))) ? '<p class="zf-lt-note">' + (countsBusy ? ltT('wait') : (countsErr ? ltT('ccErr') : ltT('ccNone'))) + '</p>' : '') +
          ((filtersOn || st.sort !== 'num') ? '<div class="zf-lt-foot"><button type="button" class="zf-lt-clear" id="zf-lt-clear">' + ltT('clear') + '</button></div>' : '') +
        '</div>' +
        (nothing ? '<div class="zf-lt-none">' + ltNone() + '<button type="button" class="zf-lt-clear" id="zf-lt-clear2">' + ltT('clear') + '</button></div>' : '');
      wire();
      if(fk){ const t = document.getElementById(fk) || bar.querySelector('[data-k="' + fk + '"]'); if(t && t.focus) t.focus({preventScroll: true}); }
    }
    function reset(){ st.audio = st.fav = false; st.len = st.urdu = ''; st.sort = 'num'; changed(); }
    function wire(){
      const btn = document.getElementById('zf-lt-btn');
      btn.addEventListener('click', function(){
        st.open = !st.open;
        document.getElementById('zf-lt-panel').hidden = !st.open; btn.setAttribute('aria-expanded', st.open ? 'true' : 'false');
        if(st.open && !urReady) ensureUrdu(function(){ render(lastShown); });
      });
      const sel = document.getElementById('zf-lt-sort');
      sel.addEventListener('change', function(){
        const v = sel.value;
        const go = function(){ st.sort = v; changed(); };
        if(v === 'comments') { st.sort = v; ensureCounts(function(){ changed(); }); changed(); }
        else if(v === 'urdu' || v === 'simple') ensureUrdu(go);
        else go();
      });
      [].forEach.call(bar.querySelectorAll('.zf-lt-chip'), function(c){
        c.addEventListener('click', function(){
          const k = c.getAttribute('data-k');
          if(k === 'audio') st.audio = !st.audio;
          else if(k === 'fav') st.fav = !st.fav;
          else if(k.indexOf('len-') === 0){ const v = k.slice(4); st.len = (st.len === v ? '' : v); }
          else if(k.indexOf('urdu-') === 0){
            const v = k.slice(5); const nv = (st.urdu === v ? '' : v);
            if(nv && !urReady){ ensureUrdu(function(){ st.urdu = nv; changed(); }); return; }
            st.urdu = nv;
          }
          changed();
        });
      });
      const c1 = document.getElementById('zf-lt-clear'), c2 = document.getElementById('zf-lt-clear2');
      if(c1) c1.addEventListener('click', reset);
      if(c2) c2.addEventListener('click', reset);
    }
    let lastShown = ITEMS.length;
    function changed(){ if(LT.onChange) LT.onChange(); }

    return {
      st: st, hasAudio: hasAudio, badgeHtml: badgeHtml, extraMeta: extraMeta, pass: pass, sortRows: sortRows, active: active,
      mount: function(){
        injectCss();
        const anchor = document.querySelector('.collection-search');
        if(!anchor || document.getElementById('zf-lt')) return;
        bar = document.createElement('div'); bar.id = 'zf-lt'; bar.className = 'zf-lt';
        anchor.parentNode.insertBefore(bar, anchor.nextSibling);
        render(ITEMS.length);
      },
      afterRender: function(shown){ lastShown = shown; render(shown); },
      relabel: function(){ render(lastShown); }
    };
  })();

  function renderList(filter, animateEntrance){
    const q = (filter || '').trim().toLowerCase().normalize('NFC');
    listEl.innerHTML = '';
    let P0 = null;
    lastQuery = q;
    const rows = [];
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
      if(!LT.pass(item)) return;       /* v64: filters */
      rows.push({item: item, snip: snip, P: P});
    });
    LT.sortRows(rows).forEach(function(row, shownIndex){   /* v64: sort */
      const item = row.item, snip = row.snip, P = row.P;
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
          '<div class="poem-item-num">' + item.kind + LT.badgeHtml(item) + '</div>' +
          '<div class="poem-item-line">' + (P ? window.ZFS.highlightHtml(itemLabel(item), P.vars) : itemLabel(item)) + '</div>' + itemMeta(item) + LT.extraMeta(item) + snip +
        '</div>' +
        '<div class="poem-item-go">' + arrow('forward') + '</div>';
      a.addEventListener('click', function(e){
        e.preventDefault();
        openDetail(item.id);
      });
      listEl.appendChild(a);
    });
    noResultsEl.classList.toggle('show', q !== '' && rows.length === 0 && !LT.active());
    LT.afterRender(rows.length);
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
      '.zf-share-row a{color:var(--gold-soft);border:1.5px solid rgba(var(--zf-rgb),.5);border-radius:999px;padding:.38rem .95rem;' +
        'font-size:.88rem;text-decoration:none;font-family:"Lora",sans-serif}' +
      '.zf-share-row a:hover{border-color:var(--gold-soft);background:rgba(var(--zf-rgb),.12)}';
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
      var ix = findIndexById(id);
      if(ix === -1) return;
      var numEl = a.querySelector('.poem-item-num');
      if(numEl && !numEl.querySelector('.zf-abadge')){ numEl.insertAdjacentHTML('beforeend', LT.badgeHtml(ITEMS[ix])); }   /* v64: audio badge */
      if(!a.querySelector('.poem-item-meta')){
        var m = itemMeta(ITEMS[ix]), ln = a.querySelector('.poem-item-line');
        if(m && ln){ ln.insertAdjacentHTML('afterend', m); }
      }
      a.addEventListener('click', function(e){
        e.preventDefault();
        openDetail(id);
      });
    });
    return true;
  }

  LT.onChange = function(){ renderList(searchInput ? searchInput.value : ''); };
  LT.mount();
  if(!hydrateStaticList()){
    renderList('', true);
  }

  const initialId = window.location.hash.replace('#', '');
  if(initialId && findIndexById(initialId) !== -1){
    openDetail(initialId);
  }
})();
