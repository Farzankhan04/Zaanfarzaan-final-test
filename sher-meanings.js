/* sher-meanings.js (v72) — the meanings (shabdarth) of the hard words of a sher, for every place a sher is shown as a CARD
   (photo card, Explore, Ash'aar wall, home sher widgets, mood pages). The poem pages already have tap-a-word meanings; this brings the same glossary
   (lafz-data.js, ~635 words) to the cards.
   window.ZF_meaningsFor(lines, {max: 3, lang: 'hi'|'en'|'ur'}, callback)  ->  callback([{w, m, id}, ...])
     lines  = the sher's lines, best in Hindi script (that is how the glossary is keyed); Roman lines work too, Urdu-script lines do not (pass the Hindi source).
     w      = the word written for the reader's language (Hindi / Roman / Urdu), m = its meaning in that language (shortened for a card).
   At most `max` words are returned: the RARE ones (a word used in many shers is usually a common one) and, among equals, the longer ones, shown in reading order.
   The glossary and the search helper are loaded the first time they are needed. window.ZF_meaningText(list) -> "word — meaning" strings. */
(function(){
  if(window.ZF_meaningsFor) return;
  var ready = false, loading = false, waiting = [], idx = null, freq = {};
  function lang(){ var l = window.ZF_LANG; return (l === 'en' || l === 'ur') ? l : 'hi'; }
  function urT(s){ try{ return typeof window.ZF_UR_transliterateText === 'function' ? window.ZF_UR_transliterateText(s) : s; }catch(e){ return s; } }
  function loadScript(src, cb){ var s = document.createElement('script'); s.src = src; s.onload = function(){ cb(true); }; s.onerror = function(){ cb(false); }; document.head.appendChild(s); }
  function tokens(text){ return String(text).replace(/[-\u2010\u2011]/g, ' ').split(/[\s,;:!?\u0964\.\u2026"()\[\]]+/).filter(Boolean); }
  function build(){
    idx = {}; freq = {};
    window.ZF_LAFZ.forEach(function(e, n){ (e.k || []).concat(e.r || []).forEach(function(k){ var z = window.ZFS.norm(k); if(z && idx[z] === undefined) idx[z] = n; }); });
    var items = [];
    try{ if(typeof GHAZAL_ITEMS !== 'undefined') items = items.concat(GHAZAL_ITEMS); }catch(e){}
    try{ if(typeof NAZM_ITEMS !== 'undefined') items = items.concat(NAZM_ITEMS); }catch(e){}
    items.forEach(function(it){ (it.versesHtml || []).forEach(function(h){
      var seen = {}; tokens(h.replace(/<[^>]+>/g, ' ')).forEach(function(t){ var n = idx[window.ZFS.norm(t)]; if(n !== undefined && !seen[n]){ seen[n] = 1; freq[n] = (freq[n] || 0) + 1; } });
    }); });
  }
  function ensure(cb){
    if(ready) return cb(true);
    waiting.push(cb); if(loading) return; loading = true;
    var need = []; if(!window.ZF_LAFZ) need.push('lafz-data.js?v=1'); if(!window.ZFS) need.push('zf-find.js?v=2');
    var left = need.length, ok = true;
    function fin(){ loading = false; if(ok && window.ZF_LAFZ && window.ZFS){ try{ build(); ready = true; }catch(e){ ready = false; } } var w = waiting; waiting = []; w.forEach(function(f){ f(ready); }); }
    if(!left) fin(); else need.forEach(function(s){ loadScript(s, function(g){ ok = ok && g; if(--left <= 0) fin(); }); });
  }
  /* a card has room for a few words, not a paragraph: first sense only, trimmed */
  function short(m){
    m = String(m || '').replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    var parts = m.split(/\s*[,;\/]\s*/).filter(Boolean), out = parts[0] || m;
    if(out.length < 5 && parts[1]) out += ', ' + parts[1];
    return out.length > 30 ? out.slice(0, 29).replace(/\s+\S*$/, '') + '\u2026' : out;
  }
  window.ZF_meaningsFor = function(lines, opts, cb){
    opts = opts || {}; var max = opts.max || 3, l = opts.lang || lang();
    ensure(function(ok){
      if(!ok){ cb([]); return; }
      var found = [], seen = {}, pos = 0;
      tokens((lines || []).join(' ')).forEach(function(t){
        var n = idx[window.ZFS.norm(t)]; pos++;
        if(n !== undefined && !seen[n]){ seen[n] = 1; found.push({n: n, pos: pos}); }
      });
      found.sort(function(a, b){ return (freq[a.n] || 0) - (freq[b.n] || 0) || window.ZF_LAFZ[b.n].k[0].length - window.ZF_LAFZ[a.n].k[0].length; });
      var pick = found.slice(0, max).sort(function(a, b){ return a.pos - b.pos; });
      cb(pick.map(function(p){
        var e = window.ZF_LAFZ[p.n];
        return {id: p.n, w: l === 'en' ? (e.r && e.r[0]) || e.k[0] : (l === 'ur' ? urT(e.k[0]) : e.k[0]),
                m: short(l === 'en' ? (e.e || e.h) : (l === 'ur' ? urT(e.h || e.e) : (e.h || e.e)))};
      }));
    });
  };
  window.ZF_meaningText = function(list){ return (list || []).map(function(x){ return x.w + ' \u2014 ' + x.m; }); };
})();
