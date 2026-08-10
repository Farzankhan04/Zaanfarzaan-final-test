/* HOME PAGE — "Ek Sher Ho Jaaye?" widget.
   Picks a random sher (one couplet) from a random ghazal in GHAZAL_ITEMS
   (shared with ghazals.html via ghazals-data.js — see that file) and links
   through to the full ghazal on ghazals.html. Bilingual: reads the current
   language the same way collection.js does, and repaints the sher already
   on screen if the language is toggled mid-way (via the same
   window.ZF_rerenderCollection hook i18n.js already calls). */
(function(){
  const btn = document.getElementById('sher-btn');
  const card = document.getElementById('sher-card');
  const placeholder = document.getElementById('sher-placeholder');
  const content = document.getElementById('sher-content');
  const linesEl = document.getElementById('sher-lines');
  const sourceLink = document.getElementById('sher-source');
  const sourceLabel = document.getElementById('sher-source-label');

  if(!btn || !card || typeof GHAZAL_ITEMS === 'undefined' || !GHAZAL_ITEMS.length) return;

  let current = null; /* { itemIdx, verseIdx } of the sher currently shown */
  let spins = 0;

  function lang(){ return (window.ZF_LANG === 'en' || window.ZF_LANG === 'ur') ? window.ZF_LANG : 'hi'; }

  /* Picks a random (ghazal, verse) pair, avoiding an immediate repeat of
     whatever is already on screen. */
  function pickNext(){
    let itemIdx, verseIdx, tries = 0;
    do{
      itemIdx = Math.floor(Math.random() * GHAZAL_ITEMS.length);
      verseIdx = Math.floor(Math.random() * GHAZAL_ITEMS[itemIdx].versesHtml.length);
      tries++;
    } while(current && itemIdx === current.itemIdx && verseIdx === current.verseIdx && tries < 15);
    current = { itemIdx: itemIdx, verseIdx: verseIdx };
  }

  function paint(){
    if(!current) return;
    const item = GHAZAL_ITEMS[current.itemIdx];
    const l = lang();
    let verseHtml = item.versesHtml[current.verseIdx];
    let firstLine = item.firstLine;
    if(l === 'en' && item.versesHtmlEn){
      verseHtml = item.versesHtmlEn[current.verseIdx];
      firstLine = item.firstLineEn || item.firstLine;
    }else if(l === 'ur' && typeof window.ZF_UR_transliterateHtml === 'function'){
      verseHtml = window.ZF_UR_transliterateHtml(verseHtml);
      firstLine = window.ZF_UR_transliterateText(firstLine);
    }

    linesEl.innerHTML = verseHtml;
    sourceLabel.textContent = firstLine;
    sourceLink.href = 'ghazals.html#' + item.id;

    placeholder.hidden = true;
    content.hidden = false;
    content.classList.remove('pop');
    void content.offsetWidth; /* restart the reveal animation on every pick, not just the first */
    content.classList.add('pop');
  }

  btn.addEventListener('click', function(){
    pickNext();
    paint();
    spins += 1;
    const icon = btn.querySelector('svg');
    if(icon) icon.style.transform = 'rotate(' + (spins * 360) + 'deg)';
  });

  /* i18n.js calls this (if defined) right after every language switch. */
  window.ZF_rerenderCollection = function(){
    if(current) paint();
  };
})();
