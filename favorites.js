/* Renders the "My Favourites" page from whatever is saved in
   localStorage (see zfToggleFavorite/zfIsFavorite in app.js). Needs
   GHAZAL_ITEMS and NAZM_ITEMS (ghazals-data.js / nazms-data.js) loaded
   first to look up the full text for each saved id. */
(function(){
  function lang(){ return (window.ZF_LANG === 'en' || window.ZF_LANG === 'ur') ? window.ZF_LANG : 'hi'; }
  function urHtml(s){ return (s && typeof window.ZF_UR_transliterateHtml === 'function') ? window.ZF_UR_transliterateHtml(s) : s; }

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

  function cardHtml(id){
    var found = findItem(id);
    if(!found) return '';
    var item = found.item, l = lang();
    var kind = item.kind;
    var verses = item.versesHtml;
    var title = item.title;
    if(l === 'en'){
      verses = item.versesHtmlEn || item.versesHtml;
      title = item.titleEn || item.title;
    }else if(l === 'ur'){
      verses = item.versesHtml.map(urHtml);
      title = title ? window.ZF_UR_transliterateText(title) : title;
    }
    var titleHtml = title ? ('<h3>' + title + '</h3>') : '';
    return '<div class="card manuscript" id="' + item.id + '"><div class="kind">' + kind + '</div>' + titleHtml + verses.join('') + '</div>';
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
      return;
    }
    if(empty) empty.hidden = true;
    list.hidden = false;
    list.innerHTML = ids.map(cardHtml).join('');
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
