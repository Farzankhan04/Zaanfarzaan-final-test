/* ===================================================================
   ZAAN FARZAAN — TRILINGUAL TOGGLE ENGINE (i18n.js)
   Site chrome (nav, headings, about/contact prose etc.) is TRANSLATED
   into English or Urdu. Ghazals & Nazms (the actual poems) are
   TRANSLITERATED — the words stay Hindi/Urdu, only the script changes:
   Roman for English (item.*En fields in collection.js), Nastaliq/Urdu
   script for Urdu (computed live by ur-translit.js). This file only
   drives: language state, the toggle button, translating every
   [data-en]/[data-ur] element on the page, and a small shared string
   table for JS-generated UI text (toasts, share sheet, aria-labels).
   =================================================================== */

/* ---- language state --------------------------------------------- */
var ZF_LANGS = ['hi', 'en', 'ur'];
function zfGetLang(){
  if(ZF_LANGS.indexOf(window.ZF_FORCE_LANG) !== -1){
    try{ localStorage.setItem('zf-lang', window.ZF_FORCE_LANG); }catch(e){}
    return window.ZF_FORCE_LANG;
  }
  try{
    var l = localStorage.getItem('zf-lang');
    if(ZF_LANGS.indexOf(l) !== -1) return l;
  }catch(e){}
  return 'hi';
}
window.ZF_LANG = zfGetLang();

/* ---- language-aware share URL --------------------------------------
   Keeps the address bar (and therefore anything the user shares — the
   in-page Share button, or the browser/OS's own "share this page")
   pointing at a URL that matches whatever language is on screen: the
   plain canonical URL for Hindi (default, unchanged), and a sibling
   "-en" / "-ur" file for English/Urdu. Those sibling files carry no
   content of their own — they only exist so link-preview crawlers
   (WhatsApp, Facebook, iMessage, etc., none of which run this script)
   can read correct-language og:title/og:description; for a real
   visitor they just restore this exact page in the right language.
   Hash-based ghazal/nazm routing (#id) is untouched either way. ----- */
var ZF_CANONICAL_PATH = window.location.pathname;
function zfLangUrlFor(lang){
  if(lang !== 'en' && lang !== 'ur') return ZF_CANONICAL_PATH;
  var base = (ZF_CANONICAL_PATH === '/' || ZF_CANONICAL_PATH === '') ? '/index.html' : ZF_CANONICAL_PATH;
  return base.replace(/\.html$/, '-' + lang + '.html');
}
function zfSyncLangUrl(lang){
  try{
    if(!window.history || !window.history.replaceState) return;
    var target = zfLangUrlFor(lang);
    if(window.location.pathname === target) return;
    history.replaceState(history.state, '', target + window.location.search + window.location.hash);
  }catch(e){}
}

/* ---- shared UI string table (used by app.js / collection.js) ----- */
var ZF_UI_STRINGS = {
  brandName:        { hi: 'ज़ान फ़रज़ान', en: 'Zaan Farzaan', ur: 'زان فرزاں' },
  defaultKind:       { hi: 'रचना', en: 'this piece', ur: 'تحریر' },
  shareTextPrefix:   { hi: 'ज़ान फ़रज़ान की यह रचना पढ़ें — ', en: 'Read this piece by Zaan Farzaan — ', ur: 'زان فرزاں کی یہ تحریر پڑھیں — ' },
  linkCopied:        { hi: 'लिंक कॉपी हो गया', en: 'Link copied', ur: 'لنک کاپی ہو گیا' },
  copyPrompt:        { hi: 'इस लिंक को कॉपी करें:', en: 'Copy this link:', ur: 'اس لنک کو کاپی کریں:' },
  downloadFailed:    { hi: 'डाउनलोड नहीं हो पाया, दोबारा कोशिश करें', en: 'Download failed, please try again', ur: 'ڈاؤن لوڈ نہیں ہو پایا، دوبارہ کوشش کریں' },
  shareAria:         { hi: 'यह रचना साझा करें', en: 'Share this piece', ur: 'یہ تحریر شیئر کریں' },
  downloadAria:      { hi: 'यह रचना इमेज के रूप में डाउनलोड करें', en: 'Download this piece as an image', ur: 'یہ تحریر تصویر کی صورت میں ڈاؤن لوڈ کریں' },
  upiIdCopied:       { hi: 'UPI ID कॉपी हो गई', en: 'UPI ID copied', ur: 'UPI ID کاپی ہو گئی' }
};
window.ZF_T = function(key){
  var entry = ZF_UI_STRINGS[key];
  if(!entry) return '';
  return entry[window.ZF_LANG] || entry.hi || '';
};

/* ---- apply translations to every static [data-en]/[data-ur] element */
function zfApplyStaticTranslations(lang){
  document.querySelectorAll('[data-en]').forEach(function(el){
    if(el.getAttribute('data-hi') === null){
      el.setAttribute('data-hi', el.innerHTML);
    }
    if(lang === 'en'){
      el.innerHTML = el.getAttribute('data-en');
    }else if(lang === 'ur' && el.getAttribute('data-ur') !== null){
      el.innerHTML = el.getAttribute('data-ur');
    }else{
      el.innerHTML = el.getAttribute('data-hi');
    }
  });
  document.querySelectorAll('[data-en-placeholder]').forEach(function(el){
    if(el.getAttribute('data-hi-placeholder') === null){
      el.setAttribute('data-hi-placeholder', el.getAttribute('placeholder') || '');
    }
    if(lang === 'en'){
      el.setAttribute('placeholder', el.getAttribute('data-en-placeholder'));
    }else if(lang === 'ur' && el.getAttribute('data-ur-placeholder') !== null){
      el.setAttribute('placeholder', el.getAttribute('data-ur-placeholder'));
    }else{
      el.setAttribute('placeholder', el.getAttribute('data-hi-placeholder'));
    }
  });
  document.querySelectorAll('[data-en-aria-label]').forEach(function(el){
    if(el.getAttribute('data-hi-aria-label') === null){
      el.setAttribute('data-hi-aria-label', el.getAttribute('aria-label') || '');
    }
    if(lang === 'en'){
      el.setAttribute('aria-label', el.getAttribute('data-en-aria-label'));
    }else if(lang === 'ur' && el.getAttribute('data-ur-aria-label') !== null){
      el.setAttribute('aria-label', el.getAttribute('data-ur-aria-label'));
    }else{
      el.setAttribute('aria-label', el.getAttribute('data-hi-aria-label'));
    }
  });
  /* internal nav / in-page links: keep them pointed at the sibling page
     in whichever language is currently on screen (index.html <-> index-en.html
     <-> index-ur.html etc.), so clicking around the site — and a search
     engine crawling the rendered page — never gets bounced back to the
     Hindi page from an English/Urdu one. */
  document.querySelectorAll('[data-en-href]').forEach(function(el){
    if(el.getAttribute('data-hi-href') === null){
      el.setAttribute('data-hi-href', el.getAttribute('href') || '');
    }
    if(lang === 'en'){
      el.setAttribute('href', el.getAttribute('data-en-href'));
    }else if(lang === 'ur' && el.getAttribute('data-ur-href') !== null){
      el.setAttribute('href', el.getAttribute('data-ur-href'));
    }else{
      el.setAttribute('href', el.getAttribute('data-hi-href'));
    }
  });
}

var ZF_LANG_LABELS = {
  hi: 'हिंदी में बदलें',
  en: 'Switch to English',
  ur: 'اردو میں بدلیں'
};

function zfUpdateToggleUI(lang){
  var btn = document.getElementById('lang-toggle');
  if(!btn) return;
  btn.classList.remove('is-en', 'is-ur', 'is-hi');
  btn.classList.add('is-' + lang);
  var idx = ZF_LANGS.indexOf(lang);
  var nextLang = ZF_LANGS[(idx + 1) % ZF_LANGS.length];
  btn.setAttribute('aria-label', (ZF_LANG_LABELS[nextLang] || '') + ' / ' + (ZF_LANG_LABELS[lang] || ''));
  btn.querySelectorAll('.lang-opt').forEach(function(opt){
    var isActive = opt.getAttribute('data-lang-option') === lang;
    opt.classList.toggle('active', isActive);
    opt.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function zfApplyLang(lang){
  zfApplyStaticTranslations(lang);
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
  document.body.classList.toggle('lang-en', lang === 'en');
  document.body.classList.toggle('lang-ur', lang === 'ur');
  zfUpdateToggleUI(lang);
  if(typeof window.ZF_rerenderCollection === 'function'){
    window.ZF_rerenderCollection();
  }
  zfSyncLangUrl(lang);
}

function zfSetLang(lang){
  try{ localStorage.setItem('zf-lang', lang); }catch(e){}
  window.ZF_LANG = lang;
  zfApplyLang(lang);
}

function zfNextLang(){
  var idx = ZF_LANGS.indexOf(window.ZF_LANG);
  return ZF_LANGS[(idx + 1) % ZF_LANGS.length];
}

/* ---- init: runs immediately (script sits at the end of body, so
   the whole page is already parsed by the time this executes) ----- */
(function zfInit(){
  zfApplyLang(window.ZF_LANG);

  var btn = document.getElementById('lang-toggle');
  if(btn){
    btn.addEventListener('click', function(){
      zfSetLang(zfNextLang());
    });
    btn.querySelectorAll('.lang-opt').forEach(function(opt){
      opt.addEventListener('click', function(e){
        e.stopPropagation();
        var chosen = opt.getAttribute('data-lang-option');
        if(chosen) zfSetLang(chosen);
      });
    });
  }

  /* reveal body now that the correct language is painted (avoids a
     flash of Hindi content when English/Urdu was the saved preference) */
  document.documentElement.classList.remove('zf-en-init');
  document.documentElement.classList.remove('zf-ur-init');
})();
