/* SITE-WIDE SEARCH — home page only. One box that searches every
   ghazal, every nazm, and a short hand-picked list of the site's other
   pages (About, Contact, Ebook, etc.), all at once. This is a home-page
   "jump to anything" box, not a browsing page, so unlike the
   per-collection search on ghazals.html/nazms.html (see collection.js)
   it shows nothing until you type, caps how many results it shows, and
   every result is a plain link straight to the real page — there's no
   in-page detail view here. Reuses the .collection-search/.poem-list/
   .poem-item/.no-results classes from style.css so results look
   identical to the search results on the Ghazals/Nazms pages. */
(function(){
  var input = document.getElementById('site-search-input');
  var resultsEl = document.getElementById('site-search-results');
  var noResultsEl = document.getElementById('site-search-no-results');
  if(!input || !resultsEl) return;

  var MAX_RESULTS = 10;

  /* Hand-picked, not auto-generated — these are the pages worth jumping
     to from a search box (skips Terms/Refund Policy; nobody searches
     for those). kw holds a few extra Roman-script synonyms so e.g.
     "kitab" or "donate" also finds the right page. */
  var PAGES = [
    { title:{hi:'परिचय', en:'About', ur:'تعارف'}, url:{hi:'about.html', en:'about-en.html', ur:'about-ur.html'}, kw:'about parichay' },
    { title:{hi:'संपर्क करें', en:'Contact', ur:'رابطہ'}, url:{hi:'contact.html', en:'contact-en.html', ur:'contact-ur.html'}, kw:'contact email instagram sampark' },
    { title:{hi:'एहसासात — ई-बुक', en:'Ehsasaat — eBook', ur:'احساسات — ای بک'}, url:{hi:'ebook.html', en:'ebook-en.html', ur:'ebook-ur.html'}, kw:'ebook book kitab buy khareed ehsasaat' },
    { title:{hi:'मेरी पसंद', en:'My Favourites', ur:'میری پسند'}, url:{hi:'favorites.html', en:'favorites-en.html', ur:'favorites-ur.html'}, kw:'favourites favorites pasand saved liked' },
    { title:{hi:'फ़ीडबैक', en:'Feedback', ur:'فیڈبیک'}, url:{hi:'feedback.html', en:'feedback-en.html', ur:'feedback-ur.html'}, kw:'feedback suggestion sujhav' },
    { title:{hi:'अन्य प्रोफ़ाइल', en:'Other Profiles', ur:'دیگر پروفائل'}, url:{hi:'profiles.html', en:'profiles-en.html', ur:'profiles-ur.html'}, kw:'profiles rekhta poetistic' },
    { title:{hi:'नज़राना पेश करें', en:'Nazrana', ur:'نذرانہ'}, url:{hi:'support.html', en:'support-en.html', ur:'support-ur.html'}, kw:'nazrana donate support upi payment daan' },
    { title:{hi:'सभी ग़ज़लें', en:'All Ghazals', ur:'تمام غزلیں'}, url:{hi:'ghazals.html', en:'ghazals-en.html', ur:'ghazals-ur.html'}, kw:'ghazals ghazal list' },
    { title:{hi:'सभी नज़्में', en:'All Nazms', ur:'تمام نظمیں'}, url:{hi:'nazms.html', en:'nazms-en.html', ur:'nazms-ur.html'}, kw:'nazms nazm list' }
  ];
  var PAGE_KIND = { hi:'पेज', en:'Page', ur:'صفحہ' };

  function lang(){ return (window.ZF_LANG === 'en' || window.ZF_LANG === 'ur') ? window.ZF_LANG : 'hi'; }
  function urText(s){ return (s && typeof window.ZF_UR_transliterateText === 'function') ? window.ZF_UR_transliterateText(s) : s; }
  function arrow(){ return lang() === 'ur' ? '&larr;' : '&rarr;'; }

  function stripHtml(html){
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent || '';
  }

  /* Two haystacks per poem: title/first-line alone (so a match there
     can rank above a match buried in the verses) and everything
     combined. Both cached on the item itself — same idea as
     itemHaystack in collection.js, kept independent since this script
     runs on a page collection.js never loads. */
  function ghazalTitleHay(item){
    if(item._zfHaySearchTitle) return item._zfHaySearchTitle;
    var h = (item.firstLine + ' ' + (item.firstLineEn||'') + ' ' + urText(item.firstLine)).toLowerCase().normalize('NFC');
    item._zfHaySearchTitle = h;
    return h;
  }
  function ghazalFullHay(item){
    if(item._zfHaySearch) return item._zfHaySearch;
    var body = item.versesHtml.map(stripHtml).join(' ');
    var h = (ghazalTitleHay(item) + ' ' + body).toLowerCase().normalize('NFC');
    item._zfHaySearch = h;
    return h;
  }
  function nazmTitleHay(item){
    if(item._zfHaySearchTitle) return item._zfHaySearchTitle;
    var h = (item.title + ' ' + (item.titleEn||'') + ' ' + urText(item.title)).toLowerCase().normalize('NFC');
    item._zfHaySearchTitle = h;
    return h;
  }
  function nazmFullHay(item){
    if(item._zfHaySearch) return item._zfHaySearch;
    var body = item.versesHtml.map(stripHtml).join(' ');
    var h = (nazmTitleHay(item) + ' ' + body).toLowerCase().normalize('NFC');
    item._zfHaySearch = h;
    return h;
  }
  function pageHay(p){
    if(p._zfHaySearch) return p._zfHaySearch;
    var h = (p.title.hi + ' ' + p.title.en + ' ' + urText(p.title.hi) + ' ' + p.kw).toLowerCase().normalize('NFC');
    p._zfHaySearch = h;
    return h;
  }

  function ghazalLabel(item){
    var l = lang();
    if(l === 'en') return item.firstLineEn || item.firstLine;
    if(l === 'ur') return urText(item.firstLine);
    return item.firstLine;
  }
  function nazmLabel(item){
    var l = lang();
    if(l === 'en') return item.titleEn || item.title;
    if(l === 'ur') return urText(item.title);
    return item.title;
  }
  function pageLabel(p){ var l = lang(); return l === 'en' ? p.title.en : (l === 'ur' ? p.title.ur : p.title.hi); }
  function pageUrl(p){ var l = lang(); return l === 'en' ? p.url.en : (l === 'ur' ? p.url.ur : p.url.hi); }

  function resultRow(kindLabel, label, url){
    var a = document.createElement('a');
    a.href = url;
    a.className = 'poem-item';
    a.innerHTML =
      '<div class="poem-item-text">' +
        '<div class="poem-item-num">' + kindLabel + '</div>' +
        '<div class="poem-item-line">' + label + '</div>' +
      '</div>' +
      '<div class="poem-item-go">' + arrow() + '</div>';
    return a;
  }

  function render(query){
    var q = (query || '').trim().toLowerCase().normalize('NFC');
    resultsEl.innerHTML = '';
    if(q === ''){
      noResultsEl.classList.remove('show');
      return;
    }

    /* Pages rank first (typing "contact" should jump straight to the
       Contact page, not wait behind a coincidental verse match), then
       poems matched in the title/first line, then poems only matched
       somewhere in the verses. */
    var pageHits = [], titleHits = [], bodyHits = [];

    PAGES.forEach(function(p){
      if(pageHay(p).indexOf(q) !== -1){
        pageHits.push(resultRow(PAGE_KIND[lang()], pageLabel(p), pageUrl(p)));
      }
    });

    if(typeof GHAZAL_ITEMS !== 'undefined'){
      GHAZAL_ITEMS.forEach(function(item){
        var url = 'ghazals/' + item.id + '.html';
        if(ghazalTitleHay(item).indexOf(q) !== -1){
          titleHits.push(resultRow(item.kind, ghazalLabel(item), url));
        }else if(ghazalFullHay(item).indexOf(q) !== -1){
          bodyHits.push(resultRow(item.kind, ghazalLabel(item), url));
        }
      });
    }
    if(typeof NAZM_ITEMS !== 'undefined'){
      NAZM_ITEMS.forEach(function(item){
        var url = 'nazms/' + item.id + '.html';
        if(nazmTitleHay(item).indexOf(q) !== -1){
          titleHits.push(resultRow(item.kind, nazmLabel(item), url));
        }else if(nazmFullHay(item).indexOf(q) !== -1){
          bodyHits.push(resultRow(item.kind, nazmLabel(item), url));
        }
      });
    }

    var all = pageHits.concat(titleHits, bodyHits).slice(0, MAX_RESULTS);
    all.forEach(function(row){ resultsEl.appendChild(row); });
    noResultsEl.classList.toggle('show', all.length === 0);
  }

  input.addEventListener('input', function(e){ render(e.target.value); });

  /* Enter jumps straight to the top result, same as pressing it. */
  input.addEventListener('keydown', function(e){
    if(e.key !== 'Enter') return;
    var first = resultsEl.querySelector('.poem-item');
    if(first){ e.preventDefault(); window.location.href = first.getAttribute('href'); }
  });

  /* Re-run with whatever's currently typed when the language toggle
     flips (see i18n.js -> zfApplyLang). home-features.js sets this same
     hook first (to repaint the "Today's Sher" widget), so this CHAINS
     onto whatever was already there instead of replacing it — same
     pattern favorites.js uses for the same reason. Overwriting it
     outright previously broke the sher widget's language switching,
     since this script loads after home-features.js. */
  var prevRerender = window.ZF_rerenderCollection;
  window.ZF_rerenderCollection = function(){
    if(typeof prevRerender === 'function') prevRerender();
    render(input.value);
  };
})();
