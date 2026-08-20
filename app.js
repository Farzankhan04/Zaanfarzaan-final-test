/* NAV: mobile toggle + active link highlight */
(function(){
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if(toggle && links){
    toggle.addEventListener('click', function(){
      links.classList.toggle('open');
    });
  }
  const here = document.body.getAttribute('data-page');
  document.querySelectorAll('.navlinks a').forEach(function(a){
    if(a.getAttribute('data-page') === here) a.classList.add('active');
  });
})();

/* REVEAL ON SCROLL */
(function(){
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, {threshold:0.1});
  revealEls.forEach(function(el){ io.observe(el); });
})();

/* TOAST */
function showToast(msg){
  let toast = document.getElementById('site-toast');
  if(!toast){
    toast = document.createElement('div');
    toast.id = 'site-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function(){ toast.classList.remove('show'); }, 2200);
}

/* SHARE */
function shareCard(card){
  const kindEl = card.querySelector('.kind');
  const kindText = kindEl ? kindEl.textContent.trim() : window.ZF_T('defaultKind');
  const url = window.location.origin + window.location.pathname + '#' + card.id;
  const shareData = { title: window.ZF_T('brandName') + ' — ' + kindText, text: window.ZF_T('shareTextPrefix') + kindText, url: url };
  if(navigator.share){
    navigator.share(shareData).catch(function(){});
  } else if(navigator.clipboard){
    navigator.clipboard.writeText(url).then(function(){ showToast(window.ZF_T('linkCopied')); }).catch(function(){ window.prompt(window.ZF_T('copyPrompt'), url); });
  } else {
    window.prompt(window.ZF_T('copyPrompt'), url);
  }
}

/* DOWNLOAD AS IMAGE */
const shareIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><line x1="8.3" y1="10.6" x2="15.6" y2="6.4"/><line x1="8.3" y1="13.4" x2="15.6" y2="17.6"/></svg>';
const downloadIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/></svg>';

function buildExportCard(card){
  const kindEl = card.querySelector('.kind');
  const titleEl = card.querySelector('h3');
  const verses = card.querySelectorAll('.verse');

  const wrap = document.createElement('div');
  wrap.className = 'export-card';

  const kindDiv = document.createElement('div');
  kindDiv.className = 'export-kind';
  kindDiv.textContent = kindEl ? kindEl.textContent.trim() : '';
  wrap.appendChild(kindDiv);

  if(titleEl){
    const h = document.createElement('div');
    h.className = 'export-title';
    h.textContent = titleEl.textContent.trim();
    wrap.appendChild(h);
  }

  const body = document.createElement('div');
  body.className = 'export-body';
  verses.forEach(function(v){
    const clone = v.cloneNode(true);
    clone.className = 'export-verse' + (v.classList.contains('nazm-line') ? ' nazm-line' : '');
    body.appendChild(clone);
  });
  wrap.appendChild(body);

  const footer = document.createElement('div');
  footer.className = 'export-footer';
  footer.innerHTML = '<span class="export-brand">' + window.ZF_T('brandName') + '</span><span class="export-tag">Shaayar &middot; Poet</span>';
  wrap.appendChild(footer);

  return wrap;
}

function downloadCard(card, btn){
  if(btn) btn.classList.add('loading');

  const stage = document.createElement('div');
  stage.className = 'export-stage';
  const exportCard = buildExportCard(card);
  stage.appendChild(exportCard);
  document.body.appendChild(stage);

  html2canvas(exportCard, { backgroundColor: '#f3ecdd', scale: 2, useCORS: true, width: 760, windowWidth: 760 }).then(function(canvas){
    document.body.removeChild(stage);
    if(btn) btn.classList.remove('loading');

    const kindEl = card.querySelector('.kind');
    const titleEl = card.querySelector('h3');
    let baseName = titleEl ? titleEl.textContent.trim() : (kindEl ? kindEl.textContent.trim() : 'zaan-farzaan');
    baseName = baseName.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-');

    const link = document.createElement('a');
    link.download = 'zaan-farzaan-' + baseName + '.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }).catch(function(){
    if(document.body.contains(stage)) document.body.removeChild(stage);
    if(btn) btn.classList.remove('loading');
    showToast(window.ZF_T('downloadFailed'));
  });
}

/* SUPPORT PAGE — copy UPI ID to clipboard (same fallback chain as shareCard) */
function copyUpiId(upiId, btn){
  function done(){
    showToast(window.ZF_T('upiIdCopied'));
    if(btn){ btn.classList.add('copied'); setTimeout(function(){ btn.classList.remove('copied'); }, 1600); }
  }
  if(navigator.clipboard){
    navigator.clipboard.writeText(upiId).then(done).catch(function(){ window.prompt(window.ZF_T('copyPrompt'), upiId); });
  } else {
    window.prompt(window.ZF_T('copyPrompt'), upiId);
  }
}

/* SUPPORT PAGE — click-to-reveal QR. Toggles a max-height class on the
   panel and an "active" class on the button; the two label spans inside
   the button (qr-show-label / qr-hide-label) are shown/hidden purely by
   that "active" class in CSS, never by touching their innerHTML — so the
   language engine's own data-en/data-ur swap on each span keeps working
   regardless of which one is currently visible. */
function toggleQr(btn){
  const panel = document.getElementById('qr-reveal');
  if(!panel) return;
  const isOpen = panel.classList.toggle('open');
  btn.classList.toggle('active', isOpen);
  btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

/* Attach share + download buttons to every .manuscript card found on the page */
function attachCardActions(root){
  (root || document).querySelectorAll('.manuscript').forEach(function(card){
    if(card.querySelector('.share-btn')) return; // already attached
    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'share-btn';
    shareBtn.setAttribute('aria-label', window.ZF_T('shareAria'));
    shareBtn.innerHTML = shareIconSvg;
    shareBtn.addEventListener('click', function(e){ e.stopPropagation(); shareCard(card); });
    card.appendChild(shareBtn);

    const dlBtn = document.createElement('button');
    dlBtn.type = 'button';
    dlBtn.className = 'download-btn';
    dlBtn.setAttribute('aria-label', window.ZF_T('downloadAria'));
    dlBtn.innerHTML = downloadIconSvg;
    dlBtn.addEventListener('click', function(e){ e.stopPropagation(); downloadCard(card, dlBtn); });
    card.appendChild(dlBtn);
  });
}
