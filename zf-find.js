/* zf-find.js — shared search brain for the site (home search box, Ghazals/Nazms search, and the highlight on a poem page).
   Finds a word or a whole sher anywhere in every ghazal and nazm, in Hindi, Roman (English) or Urdu spelling, ignoring nukta, apostrophes
   and hyphens ("ग़म" = "गम", "ma'ni" = "mani"). Returns the matching shers/lines with the matched word highlighted.
   It also understands meanings from the Lafz-o-Matlab glossary: typing "separation" or "जुदाई" also finds हिज्र / फ़िराक़ shers. */
(function(){
  'use strict';
  if(window.ZFS) return;
  var STRIP = /[़ً-ٰٟـ‌‍‎‏]/;
  var PUNCT = /[,.;:!?"“”‘’'`()\[\]{}।॥—–\-\/|]/;
  function nc(c){
    /* normalise ONE character -> '' (dropped), ' ' (separator) or a string */
    if(c === '’' || c === 'ʼ' || c === 'ʻ' || c === "'" || c === '`' || c === '-') return '';
    if(PUNCT.test(c) || /\s/.test(c)) return ' ';
    var d = c.normalize('NFD'), o = '', i;
    for(i = 0; i < d.length; i++){
      var x = d[i];
      if(STRIP.test(x) || /[̀-ͯ]/.test(x)) continue;
      o += x;
    }
    o = o.toLowerCase();
    if(o === 'ي') o = 'ی'; else if(o === 'ك') o = 'ک'; else if(o === 'ۃ' || o === 'ۂ') o = 'ہ';
    if(o === 'ँ') o = 'ं';
    return o;
  }
  function norm(s){
    var out = '', last = ' ';
    s = String(s == null ? '' : s);
    for(var i = 0; i < s.length; i++){
      var r = nc(s[i]);
      if(r === ' '){ if(last !== ' '){ out += ' '; last = ' '; } }
      else if(r){ out += r; last = r.slice(-1); }
    }
    return out.trim();
  }
  function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function strip(h){ var d = document.createElement('div'); d.innerHTML = h || ''; return d; }
  function urT(s){ try{ return window.ZF_UR_transliterateText ? window.ZF_UR_transliterateText(s) : ''; }catch(e){ return ''; } }

  /* ---- glossary (meanings) ---- */
  var gloss = null, glossLoading = false, waiting = [];
  function buildGloss(){
    gloss = (window.ZF_LAFZ || []).map(function(e){
      var vars = [];
      e.k.forEach(function(k){ var n = norm(k); if(n && vars.indexOf(n) < 0) vars.push(n); });
      (e.r || []).forEach(function(r){ var n = norm(r); if(n && vars.indexOf(n) < 0) vars.push(n); });
      return {e: e, vars: vars, eTok: norm(e.e).split(' '), hTok: norm(e.h).split(' ')};
    });
  }
  function ready(cb){
    if(gloss){ cb && cb(); return; }
    if(window.ZF_LAFZ){ buildGloss(); cb && cb(); return; }
    if(cb) waiting.push(cb);
    if(glossLoading) return; glossLoading = true;
    var s = document.createElement('script'); s.src = 'lafz-data.js?v=1';
    s.onload = s.onerror = function(){ if(!gloss) buildGloss(); var w = waiting; waiting = []; w.forEach(function(f){ try{ f(); }catch(e){} }); };
    document.head.appendChild(s);
  }

  /* ---- query ---- */
  function parse(q){
    var qn = norm(q), vars = qn ? [qn] : [], g = [];
    if(qn && gloss && qn.length >= 3){
      gloss.forEach(function(x){
        var hit = false;
        if(qn.length >= 4) hit = x.eTok.some(function(t){ return t.indexOf(qn) === 0; });
        if(!hit) hit = x.hTok.some(function(t){ return t === qn || (qn.length >= 3 && t.indexOf(qn) === 0); });
        if(hit){ g.push(x.e); x.vars.forEach(function(v){ if(v.length >= 2 && vars.indexOf(v) < 0) vars.push(v); }); }
      });
    }
    return {qn: qn, vars: vars, gloss: g, raw: q};
  }
  function hasAny(text, vars){ for(var i = 0; i < vars.length; i++) if(text.indexOf(vars[i]) !== -1) return true; return false; }

  /* ---- highlight: wrap matches in <mark>; map positions in the normalised text back to the original ---- */
  function highlightHtml(text, vars){
    text = String(text == null ? '' : text);
    if(!vars || !vars.length) return esc(text);
    var norm_ = '', map = [], last = ' ', i;
    for(i = 0; i < text.length; i++){
      var r = nc(text[i]);
      if(r === ' '){ if(last !== ' '){ norm_ += ' '; map.push(i); last = ' '; } }
      else if(r){ for(var k = 0; k < r.length; k++){ norm_ += r[k]; map.push(i); } last = r.slice(-1); }
    }
    var ranges = [];
    vars.forEach(function(v){
      if(!v) return; var from = 0, p;
      while((p = norm_.indexOf(v, from)) !== -1){
        var s = map[p], e = map[p + v.length - 1] + 1;
        while(e < text.length && nc(text[e]) === '' && text[e] !== '-' && text[e] !== "'" && text[e] !== '’') e++;
        ranges.push([s, e]); from = p + v.length;
      }
    });
    if(!ranges.length) return esc(text);
    ranges.sort(function(a, b){ return a[0] - b[0] || b[1] - a[1]; });
    var merged = [ranges[0].slice()];
    for(i = 1; i < ranges.length; i++){ var m = merged[merged.length - 1]; if(ranges[i][0] <= m[1]) m[1] = Math.max(m[1], ranges[i][1]); else merged.push(ranges[i].slice()); }
    var out = '', pos = 0;
    merged.forEach(function(m){ out += esc(text.slice(pos, m[0])) + '<mark class="zf-hit">' + esc(text.slice(m[0], m[1])) + '</mark>'; pos = m[1]; });
    return out + esc(text.slice(pos));
  }

  /* ---- per-item cache ---- */
  function linesOf(html){
    var d = strip(html), sp = d.querySelectorAll('.line');
    if(sp.length) return [].map.call(sp, function(n){ return n.textContent.trim(); });
    var t = d.textContent.trim(); return t ? [t] : [];
  }
  function cache(item){
    if(item._zfs) return item._zfs;
    var isNazm = item.title != null && item.firstLine == null;
    var c = {title: norm([item.kind, item.title, item.titleEn, urT(item.title || ''), item.firstLine, item.firstLineEn, urT(item.firstLine || '')].join(' ')), verses: [], nazm: isNazm};
    (item.versesHtml || []).forEach(function(vh, i){
      var hi = linesOf(vh), en = item.versesHtmlEn && item.versesHtmlEn[i] ? linesOf(item.versesHtmlEn[i]) : [], ur = hi.map(urT);
      c.verses.push({L: {hi: hi, en: en, ur: ur}, N: {hi: norm(hi.join(' ')), en: norm(en.join(' ')), ur: norm(ur.join(' '))}});
    });
    item._zfs = c; return c;
  }

  /* Does this poem match? Returns null, or {title:Boolean, verses:[indexes]} */
  function match(item, P){
    if(!P.qn) return null;
    var c = cache(item), titleHit = hasAny(c.title, P.vars), vs = [];
    c.verses.forEach(function(v, i){ if(hasAny(v.N.hi, P.vars) || hasAny(v.N.en, P.vars) || hasAny(v.N.ur, P.vars)) vs.push(i); });
    if(!titleHit && !vs.length) return null;
    return {title: titleHit, verses: vs};
  }

  /* HTML for the matching shers (or lines, for a nazm), matched words highlighted. */
  function snippets(item, m, P, lang, max){
    var c = cache(item), order = lang === 'en' ? ['en', 'hi', 'ur'] : (lang === 'ur' ? ['ur', 'hi', 'en'] : ['hi', 'en', 'ur']), html = '', shown = 0;
    max = max || 2;
    m.verses.slice(0, max).forEach(function(i){
      var v = c.verses[i], sc = order.filter(function(s){ return v.N[s] && hasAny(v.N[s], P.vars); })[0] || order[0], L = v.L[sc].length ? v.L[sc] : v.L.hi;
      var lines = L;
      if(c.nazm && i + 1 < c.verses.length){ var nx = c.verses[i + 1].L[sc]; if(nx && nx.length) lines = L.concat(nx.slice(0, 1)); }
      var ltr = sc === 'en' ? ' dir="ltr"' : (sc === 'ur' ? ' dir="rtl"' : '');
      html += '<div class="zf-snip"' + ltr + '>' + lines.map(function(l){ return '<span>' + highlightHtml(l, P.vars) + '</span>'; }).join('') + '</div>';
      shown++;
    });
    var more = m.verses.length - shown;
    if(more > 0){
      var T = lang === 'en' ? '+' + more + ' more' : (lang === 'ur' ? more + '+ اور' : '+' + more + ' और');
      html += '<div class="zf-snip-more">' + T + '</div>';
    }
    if(P.gloss.length){
      var g = P.gloss[0];
      html += '<div class="zf-snip-gl">' + esc(g.k[0]) + ' = ' + esc(lang === 'en' ? g.e : g.h) + '</div>';
    }
    return html;
  }

  /* ---- highlight inside a live poem (detail view or a poem page); scrolls to the first match ---- */
  function highlightIn(root, P, scroll, vIdx){
    if(!root || !P || !P.vars.length) return 0;
    [].forEach.call(root.querySelectorAll('mark.zf-hit'), function(mk){ var p = mk.parentNode; p.replaceChild(document.createTextNode(mk.textContent), mk); p.normalize(); });
    var els = root.querySelectorAll('.line, .nazm-line'), count = 0;
    [].forEach.call(els, function(el){
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), nodes = [], n;
      while((n = w.nextNode())) nodes.push(n);
      nodes.forEach(function(tn){
        var h = highlightHtml(tn.nodeValue, P.vars);
        if(h.indexOf('zf-hit') < 0) return;
        var sp = document.createElement('span'); sp.innerHTML = h;
        var f = document.createDocumentFragment(); while(sp.firstChild) f.appendChild(sp.firstChild);
        tn.parentNode.replaceChild(f, tn); count++;
      });
    });
    if(!count && vIdx != null && vIdx >= 0){
      /* the word is spelt in a script this page doesn't show (e.g. a Roman search on a Hindi page): mark the whole matching sher instead */
      var vs = root.querySelectorAll('.verse'), ve = vs[vIdx];
      if(ve){ ve.classList.add('zf-hit-verse'); if(scroll !== false) setTimeout(function(){ try{ ve.scrollIntoView({behavior: 'smooth', block: 'center'}); }catch(e){ ve.scrollIntoView(); } }, 250); return 1; }
    }
    if(scroll !== false){
      var first = [].filter.call(root.querySelectorAll('mark.zf-hit'), function(m){ return m.offsetParent !== null; })[0];
      if(first) setTimeout(function(){ try{ first.scrollIntoView({behavior: 'smooth', block: 'center'}); }catch(e){ first.scrollIntoView(); } }, 250);
    }
    return count;
  }

  /* shared look */
  var st = document.createElement('style');
  st.textContent =
    'mark.zf-hit{background:rgba(242,241,236,.24);color:inherit;border-radius:3px;padding:0 .12em;box-shadow:0 0 0 1px rgba(242,241,236,.12)}' +
    '.zf-snip{margin-top:.45rem;font-size:.86rem;line-height:1.6;opacity:.88;padding-inline-start:.65rem;border-inline-start:2px solid rgba(220,220,214,.28)}' +
    '.zf-snip span{display:block}' +
    '.zf-hit-verse{background:rgba(242,241,236,.10);border-radius:8px;box-shadow:0 0 0 6px rgba(242,241,236,.10)}' +
    '.zf-snip-more,.zf-snip-gl{margin-top:.3rem;font-size:.76rem;opacity:.6}';
  document.head.appendChild(st);

  window.ZFS = {norm: norm, parse: parse, match: match, snippets: snippets, highlightHtml: highlightHtml, highlightIn: highlightIn, ready: ready, cache: cache};
})();
