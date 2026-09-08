/* Renders the "My Favourites" page from whatever is saved in
   localStorage (see zfToggleFavorite/zfIsFavorite in app.js). Needs
   GHAZAL_ITEMS and NAZM_ITEMS (ghazals-data.js / nazms-data.js) loaded
   first to look up the full text for each saved id.

   Mirrors the list -> detail pattern used on ghazals.html/nazms.html
   (see collection.js): each favourite first shows as a compact
   first-line preview, and tapping it swaps just that entry for the
   full manuscript card (verses + share/download/heart, heart shown
   active since everything here is already a favourite). Tapping the
   open card again — or opening a different favourite — collapses it
   back to a preview. */
(function(){
  function lang(){ return (window.ZF_LANG === 'en' || window.ZF_LANG === 'ur') ? window.ZF_LANG : 'hi'; }
  function urHtml(s){ return (s && typeof window.ZF_UR_transliterateHtml === 'function') ? window.ZF_UR_transliterateHtml(s) : s; }
  function urText(s){ return (s && typeof window.ZF_UR_transliterateText === 'function') ? window.ZF_UR_transliterateText(s) : s; }

  var openId = null; /* id of the one favourite currently expanded, if any */
  /* True once the list has rendered at least once with items in it — lets
     render() give only its very first paint the poem-item-enter cascade
     (see style.css), so toggling a favourite or expanding a card later
     never replays it and flickers the rest of the list. */
  var mounted = false;

  function findItem(id){
    if(id.indexOf('ghazal-') === 0 && typeof GHAZAL_ITEMS !== 'undefined'){
      var num = parseInt(id.replace('ghazal-',''), 10);
      for(var i=0;i<GHAZAL_ITEMS.length;i++){ if(GHAZAL_ITEMS[i].num === num) return {item:GHAZAL_ITEMS[i], type:'ghazal'}; }
    }else if(id.indexOf('nazm-') === 0 && typeof NAZM_ITEMS !== 'undefined'){
      var num2 = parseInt(id.replace('nazm-',''), 10);
      for(var j=0;j<NAZM_ITEMS.length;j++){ if(NAZM_ITEMS[j].num === num2) return {item:NAZM_ITEMS[j], type:'nazm'}; }
    }
    return null;
  }

  /* Same "what represents this piece in one line" logic as
     collection.js's itemLabel(): a nazm shows its title, a ghazal
     shows its opening line. */
  function previewLabel(item, type){
    var l = lang();
    if(type === 'nazm'){
      if(l === 'en') return item.titleEn || item.title;
      if(l === 'ur') return urText(item.title);
      return item.title;
    }
    if(l === 'en') return item.firstLineEn || item.firstLine;
    if(l === 'ur') return urText(item.firstLine);
    return item.firstLine;
  }

  function previewHtml(id, found, index, animate){
    var item = found.item;
    var prefix = found.type === 'ghazal' ? 'ghazals/' : 'nazms/';
    var cls = 'poem-item' + (animate ? ' poem-item-enter' : '');
    var style = animate ? (' style="--i:' + Math.min(index, 12) + '"') : '';
    return '<a href="' + prefix + id + '.html" class="' + cls + '" data-fav-id="' + id + '"' + style + '>' +
        '<div class="poem-item-text">' +
          '<div class="poem-item-num">' + item.kind + '</div>' +
          '<div class="poem-item-line">' + previewLabel(item, found.type) + '</div>' +
        '</div>' +
        '<div class="poem-item-go">&rarr;</div>' +
      '</a>';
  }

  function fullCardHtml(id, found){
    var item = found.item, l = lang();
    var kind = item.kind;
    var verses = item.versesHtml;
    var title = item.title;
    if(l === 'en'){
      verses = item.versesHtmlEn || item.versesHtml;
      title = item.titleEn || item.title;
    }else if(l === 'ur'){
      verses = item.versesHtml.map(urHtml);
      title = title ? urText(title) : title;
    }
    var titleHtml = title ? ('<h3>' + title + '</h3>') : '';
    return '<div class="card manuscript" id="' + item.id + '" data-fav-id="' + id + '">' +
      '<div class="kind">' + kind + '</div>' + titleHtml + verses.join('') +
    '</div>';
  }

  function entryHtml(id, index, animate){
    var found = findItem(id);
    if(!found) return '';
    return id === openId ? fullCardHtml(id, found) : previewHtml(id, found, index, animate);
  }

  function render(){
    var list = document.getElementById('favorites-list');
    var empty = document.getElementById('favorites-empty');
    if(!list) return;
    var ids = [];
    try{ ids = JSON.parse(localStorage.getItem('zf-favorite-poems') || '[]'); }catch(e){}
    if(!ids.length){
      list.hidden = true;
      if(empty) empty.hidden = false;
      openId = null;
      return;
    }
    if(openId && ids.indexOf(openId) === -1) openId = null; /* unfavourited elsewhere */
    if(empty) empty.hidden = true;
    list.hidden = false;
    var animate = !mounted && !openId;
    list.innerHTML = ids.map(function(id, i){ return entryHtml(id, i, animate); }).join('');
    mounted = true;

    list.querySelectorAll('.poem-item[data-fav-id]').forEach(function(a){
      a.addEventListener('click', function(e){
        e.preventDefault();
        openId = a.getAttribute('data-fav-id');
        render();
      });
    });
    var openCard = list.querySelector('.card.manuscript[data-fav-id]');
    if(openCard){
      openCard.addEventListener('click', function(){
        openId = null;
        render();
      });
    }

    if(typeof attachCardActions === 'function') attachCardActions(list);
  }

  document.addEventListener('DOMContentLoaded', render);
  var prevRerender = window.ZF_rerenderCollection;
  window.ZF_rerenderCollection = function(){
    if(typeof prevRerender === 'function') prevRerender();
    render();
  };
  var prevToggleHook = window.ZF_onFavoriteToggled;
  window.ZF_onFavoriteToggled = function(id){
    if(typeof prevToggleHook === 'function') prevToggleHook(id);
    if(document.getElementById('favorites-list')) render();
  };
})();
