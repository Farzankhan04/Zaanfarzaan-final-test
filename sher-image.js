/* sher-image.js — "Photo card": turns a sher (or a few lines of a nazm) into a shareable image with one of the site's
   night photos behind it. Opens from a "Photo card" button under every ghazal/nazm (share row) and on the home "Aaj ka sher".
   Drawn with the canvas API (no extra library). The old light "Download" button is unchanged. */
(function(){
  if(window.self !== window.top) return;
  if(window.__zfSherImage) return; window.__zfSherImage = true;

  var BGS = ['sher-1.jpg', 'sher-2.jpg', 'sher-3.jpg', 'sher-4.jpg', 'sher-5.jpg', null];
  var FMT = {post: [1080, 1350], story: [1080, 1920]};
  var T = {
    btn:   ['🖼 फ़ोटो कार्ड', '🖼 Photo card', '🖼 فوٹو کارڈ'],
    title: ['फ़ोटो कार्ड', 'Photo card', 'فوٹو کارڈ'],
    post:  ['पोस्ट', 'Post', 'پوسٹ'], story: ['स्टोरी', 'Story', 'اسٹوری'],
    dl:    ['⬇ डाउनलोड', '⬇ Download', '⬇ ڈاؤن لوڈ'], share: ['शेयर करें', 'Share', 'شیئر کریں'],
    close: ['बंद करें', 'Close', 'بند کریں'], bg: ['पीछे की तस्वीर', 'Background', 'پس منظر'],
    plain: ['सादा', 'Plain', 'سادہ'],
    dbtn:  ['💌 समर्पित करें', '💌 Dedicate', '💌 منسوب کریں'],
    dtitle: ['समर्पण कार्ड', 'Dedication card', 'منسوب کارڈ'],
    dh:    ['किसी अपने के नाम', 'For someone you love', 'کسی اپنے کے نام'],
    dsg:   ['इस ग़ज़ल का कोई भी शेर चुनिए, नाम लिखिए और कार्ड भेज दीजिए।', 'Pick any sher from this ghazal, write a name, and send the card.', 'اس غزل کا کوئی بھی شعر چنیے، نام لکھیے اور کارڈ بھیج دیجیے۔'],
    dsn:   ['इस नज़्म के कुछ मिसरे चुनिए, नाम लिखिए और कार्ड भेज दीजिए।', 'Pick a few lines of this nazm, write a name, and send the card.', 'اس نظم کے کچھ مصرعے چنیے، نام لکھیے اور کارڈ بھیج دیجیے۔'],
    dph:   ['किसके नाम? (जैसे: अम्मी, दोस्त)', 'Whose name? (e.g. Ammi, my friend)', 'کس کے نام؟ (جیسے: امی، دوست)'],
    dnm:   ['नाम (वैकल्पिक)', 'Name (optional)', 'نام (اختیاری)'], fail: ['नहीं बन पाया, फिर कोशिश कीजिए', 'Could not make it, please try again', 'نہیں بن سکا، دوبارہ کوشش کیجیے']
  };
  function lang(){ var l = window.ZF_LANG; return l === 'en' ? 1 : (l === 'ur' ? 2 : 0); }
  function t(k){ return T[k][lang()]; }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }

  /* ---------- reading the poem from the page ---------- */
  function pagesFromCard(card){
    var verses = card.querySelectorAll('.verse'), items = [], isNazm = false;
    [].forEach.call(verses, function(v){
      var spans = v.querySelectorAll('.line'), L = [];
      if(spans.length) [].forEach.call(spans, function(s){ var x = s.textContent.trim(); if(x) L.push(x); });
      else { var x = v.textContent.trim(); if(x) L.push(x); }
      if(v.classList.contains('nazm-line')) isNazm = true;
      if(L.length) items.push(L);
    });
    var pages = [];
    if(isNazm){ var flat = []; items.forEach(function(L){ flat = flat.concat(L); }); for(var i = 0; i < flat.length; i += 4) pages.push(flat.slice(i, i + 4)); }
    else pages = items;
    return pages;
  }

  /* ---------- drawing ---------- */
  var imgs = {};
  function getImg(src, cb){
    if(!src){ cb(null); return; }
    if(imgs[src] && imgs[src].complete){ cb(imgs[src]); return; }
    var i = imgs[src] || new Image(); imgs[src] = i; i.onload = function(){ cb(i); }; i.onerror = function(){ cb(null); }; if(!i.src) i.src = src; else if(i.complete) cb(i);
  }
  function fontFor(text){
    if(/[؀-ۿ]/.test(text)) return {fam: '"Noto Nastaliq Urdu","Noto Naskh Arabic",serif', rtl: true, lh: 2.1, style: ''};
    if(/[ऀ-ॿ]/.test(text)) return {fam: '"Noto Serif Devanagari","Tiro Devanagari Hindi",serif', rtl: false, lh: 1.75, style: ''};
    return {fam: '"Lora","Cormorant Garamond",Georgia,serif', rtl: false, lh: 1.7, style: 'italic '};
  }
  function draw(canvas, lines, bgSrc, fmt, cb, name){
    var d = FMT[fmt], W = d[0], H = d[1]; canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d'), sample = lines.join(' '), F = fontFor(sample);
    function go(img){
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#151515'; ctx.fillRect(0, 0, W, H);
      if(img){
        var s = Math.max(W / img.width, H / img.height), w = img.width * s, h = img.height * s;
        ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
        var g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, 'rgba(14,14,14,.62)'); g.addColorStop(.5, 'rgba(14,14,14,.55)'); g.addColorStop(1, 'rgba(14,14,14,.82)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      } else {
        var g2 = ctx.createRadialGradient(W / 2, H * .4, 60, W / 2, H * .4, H * .8);
        g2.addColorStop(0, '#2a2a2a'); g2.addColorStop(1, '#101010'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
      }
      /* frame */
      ctx.strokeStyle = 'rgba(242,241,236,.35)'; ctx.lineWidth = 2; ctx.strokeRect(36, 36, W - 72, H - 72);
      /* text fit */
      var maxW = W - 220, availH = H - (name ? 700 : 560), size = 74, widest;
      for(; size > 28; size -= 2){
        ctx.font = F.style + size + 'px ' + F.fam; widest = 0;
        lines.forEach(function(l){ widest = Math.max(widest, ctx.measureText(l).width); });
        if(widest <= maxW && lines.length * size * F.lh <= availH) break;
      }
      ctx.font = F.style + size + 'px ' + F.fam; ctx.fillStyle = '#f5f4ee'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.direction = F.rtl ? 'rtl' : 'ltr';
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 14;
      var lh = size * F.lh, total = lines.length * lh, y0 = H / 2 - total / 2 + lh / 2 - 20;
      lines.forEach(function(l, i){ ctx.fillText(l, W / 2, y0 + i * lh); });
      ctx.shadowBlur = 0; ctx.direction = 'ltr';
      /* ornament + brand */
      ctx.strokeStyle = 'rgba(242,241,236,.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W / 2 - 70, y0 - lh * .8 - 30); ctx.lineTo(W / 2 + 70, y0 - lh * .8 - 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W / 2 - 70, y0 + (lines.length - .2) * lh + 10); ctx.lineTo(W / 2 + 70, y0 + (lines.length - .2) * lh + 10); ctx.stroke();
      if(name){
        var lab = F.rtl ? (name + ' \u06a9\u06d2 \u0644\u06cc\u06d2') : (/[\u0900-\u097F]/.test(sample) ? (name + ' \u0915\u0947 \u0932\u093f\u090f') : ('For ' + name));
        var NF = fontFor(lab + ' ' + sample), ny = Math.max(150, y0 - lh * .8 - 110), ns = 54;
        ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.direction = NF.rtl ? 'rtl' : 'ltr';
        for(; ns > 28; ns -= 2){ ctx.font = (NF.rtl || /[\u0900-\u097F]/.test(lab) ? '' : 'italic ') + ns + 'px ' + NF.fam; if(ctx.measureText('\u2661  ' + lab).width <= W - 240) break; }
        ctx.fillStyle = '#e9e7de'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 12;
        ctx.fillText('\u2661  ' + lab, W / 2, ny); ctx.shadowBlur = 0; ctx.direction = 'ltr';
      }
      ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#f5f4ee';
      ctx.font = 'italic 54px "Lora",Georgia,serif'; ctx.fillText('Zaan Farzaan', W / 2, H - 150);
      ctx.font = '30px "Lora",Georgia,serif'; ctx.fillStyle = 'rgba(245,244,238,.75)'; ctx.fillText('zaanfarzaan.site', W / 2, H - 100);
      cb && cb();
    }
    var fams = ['"Noto Nastaliq Urdu"', '"Noto Serif Devanagari"', '"Lora"'];
    var p = (document.fonts && document.fonts.load) ? Promise.all([
        document.fonts.load((F.style + '40px ' + F.fam), sample), document.fonts.load('italic 54px "Lora"', 'Zaan Farzaan')].concat(name ? [document.fonts.load('40px ' + fontFor(name + sample).fam, name + ' \u0915\u0947 \u0932\u093f\u090f')] : [])).catch(function(){}) : Promise.resolve();
    p.then(function(){ getImg(bgSrc, go); });
  }

  /* ---------- overlay ---------- */
  var css = false;
  function addCss(){
    if(css) return; css = true;
    var s = el('style'); s.textContent =
      '.zf-pic-ov{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.86);display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto}' +
      '.zf-pic-box{width:100%;max-width:440px;background:#1b1b1b;border:1px solid rgba(220,220,214,.3);border-radius:14px;padding:14px;color:#f2f1ec;max-height:100%;overflow:auto}' +
      '.zf-pic-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-weight:700}' +
      '.zf-pic-x{font:inherit;background:transparent;border:1px solid rgba(220,220,214,.4);color:#f2f1ec;border-radius:8px;min-height:38px;padding:0 .8rem;cursor:pointer}' +
      '.zf-pic-cv{display:block;width:100%;max-height:52vh;object-fit:contain;border-radius:8px;background:#000}' +
      '.zf-pic-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:10px}' +
      '.zf-pic-b{font:inherit;cursor:pointer;min-height:40px;padding:0 .95rem;border-radius:999px;border:1px solid rgba(220,220,214,.5);background:transparent;color:#f2f1ec}' +
      '.zf-pic-b.on{background:#f2f1ec;color:#151515;font-weight:700}.zf-pic-b.go{background:#f2f1ec;color:#151515;font-weight:700;border-color:#f2f1ec}' +
      '.zf-pic-th{width:48px;height:48px;border-radius:8px;border:2px solid transparent;padding:0;overflow:hidden;cursor:pointer;background:#333;color:#f2f1ec;font-size:.7rem}' +
      '.zf-pic-th.on{border-color:#f2f1ec}.zf-pic-th img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.zf-pic-pn{font-size:.9rem;color:#b4b4ad;min-width:3em;text-align:center;direction:ltr}' +
      '.zf-pic-lab{width:100%;text-align:center;font-size:.8rem;color:#b4b4ad}' +
      '.zf-pic-name{margin:0 0 10px}.zf-pic-in{width:100%;font:inherit;font-size:1rem;color:#f2f1ec;background:#111;border:1px solid rgba(220,220,214,.4);border-radius:10px;padding:.6rem .8rem;min-height:42px;text-align:center}' +
      '.zf-pic-in:focus{outline:none;border-color:#f2f1ec}' +
      '.zf-dedicate{margin:1.6rem auto 0;max-width:520px;text-align:center;border:1px solid rgba(220,220,214,.3);border-radius:14px;padding:1.2rem 1.1rem 1.3rem;background:rgba(255,255,255,.03)}' +
      '.zf-ded-h{font-size:1.15rem;font-weight:600;margin:.2rem 0 .35rem}.zf-ded-s{font-size:.9rem;opacity:.75;line-height:1.55;margin:0 0 .9rem}' +
      '.zf-ded-b{font:inherit;cursor:pointer;min-height:44px;padding:0 1.3rem;border-radius:999px;border:1px solid #f2f1ec;background:#f2f1ec;color:#151515;font-weight:700}';
    document.head.appendChild(s);
  }
  function openPic(pages, opts){
    if(!pages || !pages.length) return;
    opts = opts || {};
    addCss();
    var st = {p: 0, bg: 1, fmt: 'post', name: ''};
    var ov = el('div', 'zf-pic-ov'), box = el('div', 'zf-pic-box'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    var top = el('div', 'zf-pic-top'); top.appendChild(el('span', null, t(opts.dedicate ? 'dtitle' : 'title')));
    var x = el('button', 'zf-pic-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', t('close')); top.appendChild(x);
    var nameRow = el('div', 'zf-pic-row zf-pic-name'), nameIn = el('input', 'zf-pic-in');
    nameIn.type = 'text'; nameIn.maxLength = 28; nameIn.placeholder = t(opts.dedicate ? 'dph' : 'dnm'); nameIn.setAttribute('autocomplete', 'off'); nameIn.setAttribute('aria-label', t('dnm'));
    nameRow.appendChild(nameIn);
    var nt = null; nameIn.addEventListener('input', function(){ clearTimeout(nt); nt = setTimeout(function(){ st.name = nameIn.value.trim(); sync(); }, 180); });
    var cv = el('canvas', 'zf-pic-cv');
    var rowF = el('div', 'zf-pic-row'), rowP = el('div', 'zf-pic-row'), rowB = el('div', 'zf-pic-row'), rowA = el('div', 'zf-pic-row');
    var fb = {};
    ['post', 'story'].forEach(function(k){ var b = el('button', 'zf-pic-b', t(k)); b.type = 'button'; b.addEventListener('click', function(){ st.fmt = k; sync(); }); fb[k] = b; rowF.appendChild(b); });
    var pn = el('span', 'zf-pic-pn'); var prev = el('button', 'zf-pic-b', '◀'), next = el('button', 'zf-pic-b', '▶'); prev.type = next.type = 'button';
    prev.addEventListener('click', function(){ st.p = (st.p - 1 + pages.length) % pages.length; sync(); });
    next.addEventListener('click', function(){ st.p = (st.p + 1) % pages.length; sync(); });
    if(pages.length > 1){ rowP.appendChild(prev); rowP.appendChild(pn); rowP.appendChild(next); }
    rowB.appendChild(el('div', 'zf-pic-lab', t('bg')));
    var th = [];
    BGS.forEach(function(src, i){
      var b = el('button', 'zf-pic-th'); b.type = 'button';
      if(src){ var im = el('img'); im.src = src; im.alt = ''; im.loading = 'lazy'; b.appendChild(im); } else b.textContent = t('plain');
      b.addEventListener('click', function(){ st.bg = i; sync(); }); th.push(b); rowB.appendChild(b);
    });
    var dl = el('button', 'zf-pic-b go', t('dl')); dl.type = 'button'; rowA.appendChild(dl);
    var sh = null;
    function blobOf(cb){ cv.toBlob(function(b){ cb(b); }, 'image/png'); }
    dl.addEventListener('click', function(){
      blobOf(function(b){
        if(!b){ alert(t('fail')); return; }
        var a = document.createElement('a'), u = URL.createObjectURL(b); a.href = u; a.download = (st.name ? 'for-' + st.name.replace(/[^\w\u0900-\u097F\u0600-\u06FF]+/g, '-') + '-' : '') + 'zaan-farzaan-sher.png'; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function(){ URL.revokeObjectURL(u); }, 4000);
      });
    });
    if(navigator.canShare && navigator.share){
      sh = el('button', 'zf-pic-b', t('share')); sh.type = 'button'; rowA.appendChild(sh);
      sh.addEventListener('click', function(){
        blobOf(function(b){
          if(!b) return;
          var f = new File([b], 'zaan-farzaan-sher.png', {type: 'image/png'});
          if(navigator.canShare({files: [f]})) navigator.share({files: [f], title: 'Zaan Farzaan'}).catch(function(){});
          else dl.click();
        });
      });
    }
    function sync(){
      ['post', 'story'].forEach(function(k){ fb[k].className = 'zf-pic-b' + (st.fmt === k ? ' on' : ''); });
      th.forEach(function(b, i){ b.className = 'zf-pic-th' + (st.bg === i ? ' on' : ''); });
      pn.textContent = (st.p + 1) + ' / ' + pages.length;
      draw(cv, pages[st.p], BGS[st.bg], st.fmt, null, st.name);
    }
    [top, nameRow, cv, rowF, rowP, rowB, rowA].forEach(function(n){ box.appendChild(n); });
    ov.appendChild(box); document.body.appendChild(ov);
    function close(){ ov.remove(); document.removeEventListener('keydown', key); document.body.style.overflow = ''; }
    function key(e){ if(e.key === 'Escape') close(); }
    document.addEventListener('keydown', key); document.body.style.overflow = 'hidden';
    x.addEventListener('click', close); ov.addEventListener('click', function(e){ if(e.target === ov) close(); });
    sync(); (opts.dedicate ? nameIn : x).focus();
  }

  window.ZF_openPhotoCard = openPic;   /* used by the Sher Wall */

  /* ---------- entry buttons ---------- */
  function addToRow(row){
    if(row.querySelector('.zf-share-pic')) return;
    /* nazms are one continuous poem, not couplets: no photo card for them */
    var scope0 = row.closest('.poem-detail') || document, card0 = scope0.querySelector('.card.manuscript') || document.querySelector('.card.manuscript');
    if(!card0 || /^nazm-/.test(card0.id || '') || card0.querySelector('.nazm-line')) return;
    var a = el('a', 'zf-share-pic', t('btn')); a.href = '#'; a.setAttribute('role', 'button');
    a.addEventListener('click', function(e){
      e.preventDefault();
      var scope = row.closest('.poem-detail') || document, card = scope.querySelector('.card.manuscript') || document.querySelector('.card.manuscript');
      if(card) openPic(pagesFromCard(card));
    });
    row.insertBefore(a, row.children[1] || null);
  }
  /* "Dedicate" card under every ghazal and nazm: pick any sher (or a few nazm lines), write a name, send the card */
  function addDedicate(row){
    var scope = row.closest('.poem-detail') || document, card = scope.querySelector('.card.manuscript') || document.querySelector('.card.manuscript');
    if(!card) return;
    if(row.parentNode.querySelector('.zf-dedicate')) return;
    addCss();
    var isNazm = /^nazm-/.test(card.id || '') || !!card.querySelector('.nazm-line');
    var box = el('div', 'zf-dedicate'); box.setAttribute('data-nazm', isNazm ? '1' : '0');
    box.appendChild(el('div', 'zf-ded-h', t('dh'))); box.appendChild(el('p', 'zf-ded-s', t(isNazm ? 'dsn' : 'dsg')));
    var b = el('button', 'zf-ded-b', t('dbtn')); b.type = 'button'; box.appendChild(b);
    b.addEventListener('click', function(){
      var sc = row.closest('.poem-detail') || document, c = sc.querySelector('.card.manuscript') || document.querySelector('.card.manuscript');
      if(c) openPic(pagesFromCard(c), {dedicate: true});
    });
    row.parentNode.insertBefore(box, row.nextSibling);
  }
  function addHome(){
    var bar = document.querySelector('.sher-actions'); if(!bar || bar.querySelector('.zf-home-pic')) return;
    var b = el('button', 'sher-today-btn zf-home-pic', t('btn')); b.type = 'button';
    b.addEventListener('click', function(){
      var ls = document.querySelectorAll('#sher-lines .line'), L = [];
      [].forEach.call(ls, function(s){ var x = s.textContent.trim(); if(x) L.push(x); });
      if(L.length) openPic([L]);
    });
    bar.appendChild(b);
  }
  function scan(){ [].forEach.call(document.querySelectorAll('.zf-share-row'), function(r){ addToRow(r); addDedicate(r); }); addHome(); }
  scan();
  var tm = null;
  new MutationObserver(function(){ clearTimeout(tm); tm = setTimeout(scan, 40); }).observe(document.body, {childList: true, subtree: true});
  var prev = window.ZF_rerenderCollection;
  window.ZF_rerenderCollection = function(){ if(typeof prev === 'function') prev(); [].forEach.call(document.querySelectorAll('.zf-share-pic,.zf-home-pic'), function(n){ n.textContent = t('btn'); }); [].forEach.call(document.querySelectorAll('.zf-dedicate'), function(n){ n.remove(); }); scan(); };
})();
