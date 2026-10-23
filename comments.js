/* comments.js — reader comments (shown only after the poet approves them in admin-comments.html).
   Where: every ghazal-N / nazm-N page (box under the share row) and every audio card on the audio pages.
   Loaded by a tiny loader at the end of app.js, so no page needs to be edited.
   Backend: Supabase REST (table "comments", see supabase-setup.sql). Only the PUBLISHABLE key is used here (it is meant to be public);
   what a visitor can do (add a pending comment / read approved ones) is enforced in the database (Row Level Security), not here.
   Text is always inserted with textContent, never as HTML. */
(function(){
  var SB_URL = 'https://silqtikgdywjzebdehai.supabase.co';
  var SB_KEY = 'sb_publishable_2GYkJE2I5Qtl2eSbDFcDvg_JI9Ha4t5';
  if(window.__zfComments) return; window.__zfComments = true;

  var T = {
    h:       {hi:'पाठकों की टिप्पणियाँ', en:'Readers’ comments', ur:'قارئین کے تاثرات'},
    none:    {hi:'अभी कोई टिप्पणी नहीं। पहली टिप्पणी आप लिखिए।', en:'No comments yet. Be the first to write one.', ur:'ابھی کوئی تبصرہ نہیں۔ پہلا تبصرہ آپ لکھیے۔'},
    name:    {hi:'आपका नाम (चाहें तो ख़ाली छोड़ें)', en:'Your name (optional)', ur:'آپ کا نام (چاہیں تو خالی چھوڑیں)'},
    text:    {hi:'अपनी टिप्पणी लिखिए…', en:'Write your comment…', ur:'اپنا تبصرہ لکھیے…'},
    send:    {hi:'टिप्पणी भेजें', en:'Post comment', ur:'تبصرہ بھیجیں'},
    sending: {hi:'भेज रहे हैं…', en:'Sending…', ur:'بھیج رہے ہیں…'},
    thanks:  {hi:'शुक्रिया! आपकी टिप्पणी मिल गई है। शायर की मंज़ूरी के बाद यहाँ दिखेगी।', en:'Thank you! Your comment has been received. It will appear here once the poet approves it.', ur:'شکریہ! آپ کا تبصرہ مل گیا ہے۔ شاعر کی منظوری کے بعد یہاں نظر آئے گا۔'},
    err:     {hi:'माफ़ कीजिए, टिप्पणी नहीं जा सकी। थोड़ी देर बाद फिर कोशिश कीजिए।', en:'Sorry, the comment could not be sent. Please try again in a little while.', ur:'معذرت، تبصرہ نہیں جا سکا۔ تھوڑی دیر بعد دوبارہ کوشش کیجیے۔'},
    wait:    {hi:'कृपया थोड़ा रुककर दूसरी टिप्पणी भेजिए।', en:'Please wait a little before sending another comment.', ur:'براہِ کرم تھوڑا رک کر دوسرا تبصرہ بھیجیے۔'},
    short:   {hi:'टिप्पणी बहुत छोटी है।', en:'The comment is too short.', ur:'تبصرہ بہت چھوٹا ہے۔'},
    note:    {hi:'टिप्पणियाँ शायर की मंज़ूरी के बाद दिखती हैं। कृपया शालीन भाषा रखें।', en:'Comments appear after the poet approves them. Please keep it respectful.', ur:'تبصرے شاعر کی منظوری کے بعد نظر آتے ہیں۔ براہِ کرم شائستہ زبان رکھیں۔'},
    anon:    {hi:'पाठक', en:'Reader', ur:'قاری'},
    open:    {hi:'टिप्पणियाँ', en:'Comments', ur:'تبصرے'},
    close:   {hi:'टिप्पणियाँ छिपाएँ', en:'Hide comments', ur:'تبصرے چھپائیں'},
    loading: {hi:'लोड हो रहा है…', en:'Loading…', ur:'لوڈ ہو رہا ہے…'},
    loaderr: {hi:'टिप्पणियाँ अभी नहीं खुल पाईं।', en:'Could not load comments right now.', ur:'تبصرے ابھی نہیں کھل سکے۔'}
  };
  function lang(){
    var l = window.ZF_LANG;
    if(l !== 'en' && l !== 'ur'){ var c = document.body.classList; l = c.contains('lang-ur') ? 'ur' : (c.contains('lang-en') ? 'en' : 'hi'); }
    return l;
  }
  function tx(k){ return T[k][lang()]; }
  function d(k){ return 'data-en="' + T[k].en.replace(/"/g,'&quot;') + '" data-ur="' + T[k].ur.replace(/"/g,'&quot;') + '"'; }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
  function applyLang(root){ if(typeof zfApplyStaticTranslations === 'function') try{ zfApplyStaticTranslations(window.ZF_LANG); }catch(e){} }

  /* ---------- Supabase REST ---------- */
  function headers(extra){ var h = {'apikey': SB_KEY}; for(var k in (extra||{})) h[k] = extra[k]; return h; }
  function fetchApproved(page){
    var u = SB_URL + '/rest/v1/comments?select=id,created_at,name,body&approved=eq.true&page=eq.' + encodeURIComponent(page) + '&order=created_at.asc&limit=200';
    return fetch(u, {headers: headers()}).then(function(r){ if(!r.ok) throw new Error('load'); return r.json(); });
  }
  function fetchCounts(prefix){
    var u = SB_URL + '/rest/v1/comments?select=page&approved=eq.true&page=like.' + encodeURIComponent(prefix + '*') + '&limit=1000';
    return fetch(u, {headers: headers()}).then(function(r){ if(!r.ok) throw new Error('load'); return r.json(); });
  }
  function postComment(page, name, body){
    return fetch(SB_URL + '/rest/v1/comments', {
      method: 'POST',
      headers: headers({'Content-Type': 'application/json', 'Prefer': 'return=minimal'}),
      body: JSON.stringify({page: page, name: name, body: body})
    }).then(function(r){ if(!r.ok) throw new Error(r.status === 400 || r.status === 429 ? 'rate' : 'send'); });
  }

  /* ---------- CSS ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.zf-comments [hidden],.zf-comments[hidden]{display:none !important;}' +
    '.zf-comments{max-width:640px;margin:2.4rem auto 0;padding:0;text-align:start;}' +
    '.zf-cm-box{border:1px solid rgba(220,220,214,.28);border-radius:10px;padding:1.6rem 1.3rem;background:linear-gradient(160deg,rgba(255,255,255,.045),rgba(255,255,255,.015));}' +
    '.zf-comments h2,.zf-cm-title{color:var(--gold-soft);font-size:clamp(1.2rem,3.4vw,1.5rem);font-weight:700;margin:0 0 1rem;font-family:"Cormorant Garamond","Noto Serif Devanagari",serif;}' +
    'body.lang-ur .zf-comments h2{font-family:"Noto Nastaliq Urdu",serif;line-height:1.9;}' +
    '.zf-cm-list{display:flex;flex-direction:column;gap:.8rem;margin:0 0 1.2rem;}' +
    '.zf-cm-item{border-inline-start:2px solid rgba(220,220,214,.35);padding:.2rem .9rem;}' +
    '.zf-cm-name{font-weight:600;color:var(--gold-soft);font-size:.95rem;}' +
    '.zf-cm-date{color:var(--text-muted);font-size:.75rem;margin-inline-start:.6rem;font-weight:400;}' +
    '.zf-cm-body{color:var(--text-light);font-size:1rem;line-height:1.75;margin-top:.15rem;white-space:pre-wrap;word-wrap:break-word;}' +
    '.zf-cm-empty,.zf-cm-msg{color:var(--text-muted);font-size:.95rem;line-height:1.7;margin:0 0 1rem;}' +
    '.zf-cm-form{display:flex;flex-direction:column;gap:.6rem;}' +
    '.zf-cm-form input[type=text],.zf-cm-form textarea{width:100%;box-sizing:border-box;padding:.7rem .9rem;border-radius:8px;border:1px solid rgba(220,220,214,.35);background:var(--ink-deep,#101010);color:var(--text-light,#f2f1ec);font-size:1rem;font-family:inherit;}' +
    '.zf-cm-form textarea{min-height:96px;resize:vertical;line-height:1.6;}' +
    '.zf-cm-form input:focus,.zf-cm-form textarea:focus{outline:2px solid var(--gold,#cfcfc8);outline-offset:1px;}' +
    '.zf-cm-form button{align-self:flex-start;padding:.7rem 1.4rem;border-radius:8px;border:0;cursor:pointer;background:var(--gold-soft,#dcdcd6);color:var(--ink,#151515);font-weight:700;font-size:.95rem;font-family:inherit;}' +
    '.zf-cm-form button:hover{background:#fff;} .zf-cm-form button:disabled{opacity:.6;cursor:default;}' +
    '.zf-cm-hp{position:absolute !important;left:-9999px !important;width:1px;height:1px;opacity:0;}' +
    '.zf-cm-note{font-size:.78rem;color:var(--text-muted);margin:.7rem 0 0;opacity:.85;}' +
    '.zf-cm-thanks{color:var(--gold-soft);line-height:1.7;margin:.2rem 0 0;}' +
    '.zf-cm-err{color:#e3a0a0;font-size:.9rem;margin:0;}' +
    /* audio cards */
    '.zf-cm-toggle{display:inline-block;margin-top:.9rem;margin-inline-end:1.4rem;font:inherit;font-size:.95rem;cursor:pointer;color:#4a4a46;background:none;border:0;border-bottom:1px solid rgba(74,74,70,.4);padding:0 0 1px;}' +
    '.zf-cm-toggle:hover{color:#000;border-bottom-color:#000;}' +
    '.audio-track .zf-comments{margin:1rem 0 0;max-width:none;}' +
    '.audio-track .zf-cm-box{background:rgba(0,0,0,.04);border-color:rgba(74,74,70,.25);padding:1.1rem 1rem;}' +
    '.audio-track .zf-cm-name{color:#2a2a28;} .audio-track .zf-cm-date,.audio-track .zf-cm-empty,.audio-track .zf-cm-msg,.audio-track .zf-cm-note{color:#6b6b66;}' +
    '.audio-track .zf-cm-body{color:#222220;} .audio-track .zf-cm-item{border-color:rgba(74,74,70,.4);}' +
    '.audio-track .zf-cm-thanks{color:#2a2a28;} .audio-track .zf-cm-err{color:#a03030;}' +
    '.audio-track .zf-cm-form input[type=text],.audio-track .zf-cm-form textarea{background:#fff;color:#1d1d1b;border-color:rgba(74,74,70,.4);}' +
    '.audio-track .zf-cm-form button{background:#1d1d1b;color:#f2f1ec;} .audio-track .zf-cm-form button:hover{background:#000;}';
  document.head.appendChild(css);

  /* ---------- one comment block (list + form) for a page key ---------- */
  var shownAt = Date.now();
  function fmtDate(iso){
    try{ return new Date(iso).toLocaleDateString({hi:'hi-IN', en:'en-IN', ur:'ur-PK'}[lang()], {day:'numeric', month:'short', year:'numeric'}); }catch(e){ return ''; }
  }
  function build(key, withHeading){
    var sec = document.createElement('section'); sec.className = 'zf-comments'; sec.setAttribute('data-key', key);
    sec.innerHTML =
      '<div class="zf-cm-box">' +
        (withHeading ? '<h2 ' + d('h') + '>' + esc(T.h.hi) + '</h2>' : '') +
        '<div class="zf-cm-list" aria-live="polite"></div>' +
        '<form class="zf-cm-form" novalidate>' +
          '<input class="zf-cm-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<input type="text" name="name" maxlength="60" autocomplete="nickname" placeholder="' + esc(T.name.hi) + '" data-en-placeholder="' + esc(T.name.en) + '" data-ur-placeholder="' + esc(T.name.ur) + '" aria-label="' + esc(T.name.hi) + '" data-en-aria-label="' + esc(T.name.en) + '" data-ur-aria-label="' + esc(T.name.ur) + '">' +
          '<textarea name="body" maxlength="1000" dir="auto" placeholder="' + esc(T.text.hi) + '" data-en-placeholder="' + esc(T.text.en) + '" data-ur-placeholder="' + esc(T.text.ur) + '" aria-label="' + esc(T.text.hi) + '" data-en-aria-label="' + esc(T.text.en) + '" data-ur-aria-label="' + esc(T.text.ur) + '"></textarea>' +
          '<p class="zf-cm-err" hidden></p>' +
          '<button type="submit" ' + d('send') + '>' + esc(T.send.hi) + '</button>' +
        '</form>' +
        '<p class="zf-cm-thanks" hidden ' + d('thanks') + '>' + esc(T.thanks.hi) + '</p>' +
        '<p class="zf-cm-note" ' + d('note') + '>' + esc(T.note.hi) + '</p>' +
      '</div>';
    var listEl = sec.querySelector('.zf-cm-list'), form = sec.querySelector('form'), errEl = sec.querySelector('.zf-cm-err'),
        thanks = sec.querySelector('.zf-cm-thanks'), btn = sec.querySelector('button[type=submit]');

    function render(rows){
      listEl.innerHTML = '';
      if(!rows.length){
        var p = document.createElement('p'); p.className = 'zf-cm-empty'; p.setAttribute('data-en', T.none.en); p.setAttribute('data-ur', T.none.ur); p.textContent = T.none.hi; listEl.appendChild(p); return;
      }
      rows.forEach(function(r){
        var it = document.createElement('div'); it.className = 'zf-cm-item';
        var head = document.createElement('div');
        var nm = document.createElement('span'); nm.className = 'zf-cm-name'; nm.setAttribute('dir', 'auto'); nm.textContent = r.name;
        var dt = document.createElement('span'); dt.className = 'zf-cm-date'; dt.textContent = fmtDate(r.created_at);
        head.appendChild(nm); head.appendChild(dt);
        var bd = document.createElement('div'); bd.className = 'zf-cm-body'; bd.setAttribute('dir', 'auto'); bd.textContent = r.body;
        it.appendChild(head); it.appendChild(bd); listEl.appendChild(it);
      });
    }
    function load(){
      var l = document.createElement('p'); l.className = 'zf-cm-msg'; l.textContent = tx('loading'); listEl.innerHTML = ''; listEl.appendChild(l);
      fetchApproved(key).then(function(rows){ render(rows); applyLang(); })
        .catch(function(){ listEl.innerHTML = ''; var p = document.createElement('p'); p.className = 'zf-cm-msg'; p.textContent = tx('loaderr'); listEl.appendChild(p); });
    }
    function showErr(k){ errEl.textContent = tx(k); errEl.hidden = false; }

    form.addEventListener('submit', function(ev){
      ev.preventDefault(); errEl.hidden = true;
      if(form.website.value) return;                                         // honeypot: bots fill it
      var name = form.name.value.trim().slice(0, 60) || tx('anon'), body = form.body.value.trim();
      if(body.length < 2){ showErr('short'); return; }
      var last = 0; try{ last = parseInt(localStorage.getItem('zf-cm-last') || '0', 10); }catch(e){}
      if(Date.now() - last < 20000 || Date.now() - shownAt < 3000){ showErr('wait'); return; }
      btn.disabled = true; btn.textContent = tx('sending');
      postComment(key, name, body).then(function(){
        try{ localStorage.setItem('zf-cm-last', String(Date.now())); }catch(e){}
        form.hidden = true; thanks.hidden = false;
      }).catch(function(e){
        btn.disabled = false; btn.textContent = tx('send'); showErr(e && e.message === 'rate' ? 'wait' : 'err');
      });
    });
    load();
    return sec;
  }

  /* ---------- poem pages ---------- */
  var m = location.pathname.match(/\/(ghazal|nazm)-(\d{1,3})(?:\.html)?$/);
  if(m){
    var host = document.querySelector('.poem-detail') || document.querySelector('main');
    if(host){
      var key = m[1] + '-' + m[2], anchor = host.querySelector('.zf-share-row');
      var sec = build(key, true);
      if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(sec, anchor.nextSibling); else host.appendChild(sec);
      applyLang();
    }
  }

  /* ---------- ghazals / nazms collection pages (tap a poem -> it opens in #poem-detail) ---------- */
  var detail = document.getElementById('poem-detail');
  if(detail && !m){
    var syncing = false;
    function syncDetail(){
      if(syncing) return; syncing = true;
      try{
        var card = detail.querySelector('.card.manuscript[id]'), row = detail.querySelector('.zf-share-row');
        var cur = detail.querySelector('.zf-comments');
        if(!card || !row || !/^(ghazal|nazm)-\d{1,3}$/.test(card.id)){ if(cur) cur.remove(); return; }
        if(cur && cur.getAttribute('data-key') === card.id) return;
        if(cur) cur.remove();
        row.parentNode.insertBefore(build(card.id, true), row.nextSibling);
        applyLang();
      } finally { syncing = false; }
    }
    new MutationObserver(syncDetail).observe(detail, {childList: true});
    syncDetail();
  }

  /* ---------- audio pages: a "Comments" toggle on each card ---------- */
  var cards = document.querySelectorAll('.audio-track');
  if(cards.length){
    var counts = {};
    function label(b, n){
      var base = tx('open');
      b.querySelector('.zf-cm-t').textContent = base + (n ? ' (' + n + ')' : '');
    }
    cards.forEach(function(card){
      var num = card.id.replace('nazm-', ''), key = 'audio-nazm-' + num;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'zf-cm-toggle'; b.setAttribute('aria-expanded', 'false');
      b.innerHTML = '<span class="zf-cm-t"></span>'; label(b, 0);
      card.appendChild(b);
      var sec = null;
      b.addEventListener('click', function(){
        if(!sec){ sec = build(key, false); card.appendChild(sec); applyLang(); b.setAttribute('aria-expanded', 'true'); b.querySelector('.zf-cm-t').textContent = tx('close'); return; }
        var open = sec.hidden; sec.hidden = !open; b.setAttribute('aria-expanded', open ? 'true' : 'false');
        if(open) b.querySelector('.zf-cm-t').textContent = tx('close'); else label(b, counts[num] || 0);
      });
      card.__zfCmBtn = b; card.__zfCmNum = num;
    });
    fetchCounts('audio-nazm-').then(function(rows){
      rows.forEach(function(r){ var n = r.page.replace('audio-nazm-', ''); counts[n] = (counts[n] || 0) + 1; });
      cards.forEach(function(c){ var s = c.querySelector('.zf-comments'); if(!s || s.hidden) label(c.__zfCmBtn, counts[c.__zfCmNum] || 0); });
    }).catch(function(){});
    // keep our labels in the right language when the visitor switches language
    document.addEventListener('click', function(e){
      if(e.target.closest && e.target.closest('#lang-toggle')) setTimeout(function(){
        cards.forEach(function(c){ var s = c.querySelector('.zf-comments'); var b = c.__zfCmBtn;
          if(s && !s.hidden) b.querySelector('.zf-cm-t').textContent = tx('close'); else label(b, counts[c.__zfCmNum] || 0); });
      }, 150);
    });
  }
})();
