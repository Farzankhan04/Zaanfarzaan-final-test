/* service-worker.js — makes the site installable and readable offline.
   WHAT IT DOES
   - Pages (HTML): network first (so a visitor always gets the newest version); if there is no network, the saved copy; if there is
     no saved copy either, offline.html.
   - css / js: network first too (your uploads show up at once). Images and fonts (incl. Google Fonts): saved copy shown at once, refreshed in the background.
   - Saved on install: home, ghazals, nazms, audio pages, all 40 ghazal + 10 nazm pages and their data/scripts, so poems read offline.
   - AUDIO (v67): recordings the reader chose to "Save for offline" on the Audio page live in their own cache (AUDIO below, kept through updates). A saved mp3 is played from there,
     including the partial (Range) requests players make, so it works with no internet. Audio that was not saved goes straight to the network, exactly as before.
   WHAT IT NEVER TOUCHES: Supabase (comments, stats), Buttondown, the admin pages, anything that is not GET.
   WHEN YOU CHANGE FILES: pages and files update by themselves while online. Only change CACHE below (zf-v1 -> zf-v2) if you also
   change the PRECACHE list or want every phone to throw away all saved copies. */
var CACHE = 'zf-v3';
var AUDIO = 'zf-audio-v1';      /* saved-for-offline recordings (filled by audio-offline.js; never deleted by an update) */
/* v70 — FIRST VISIT STAYS LIGHT. Install only saves the ~25 things the app needs to open and to say "you are offline".
   Everything else (all 50 poem pages, the data / feature scripts) is saved LATER by warm(): the page asks for it ~6 s after it has finished loading (app.js),
   3 files at a time, skipped on slow / data-saver connections. Before this, ~95 files were downloaded at once on the first visit, in competition with the page itself. */
var PRECACHE = ['/', '/index.html', '/index-en.html', '/index-ur.html', '/ghazals.html', '/ghazals-en.html', '/ghazals-ur.html', '/nazms.html', '/nazms-en.html', '/nazms-ur.html',
  '/audios.html', '/audios-en.html', '/audios-ur.html', '/about.html', '/offline.html', '/style.css', '/app.js', '/i18n.js', '/logo.png', '/logo-dark.png', '/playfair-display-600.woff2',
  '/favicon.ico', '/icon-192.png', '/manifest.json'];
var WARM = ['/collection.js', '/search.js', '/home-features.js', '/home-carousel.js', '/home-extras.js', '/mood-data.js', '/sher-image.js', '/lafz.js', '/zf-find.js', '/lafz-data.js', '/lafz-today.js',
  '/audio-shell.js', '/reader-tools.js', '/related-data.js', '/ashaar.js', '/audios.js', '/audio-skin.js', '/audio-library.js', '/audio-offline.js', '/comments.js', '/ur-translit.js',
  '/ghazals-data.js', '/nazms-data.js'];
for(var i2 = 1; i2 <= 40; i2++) WARM.push('/ghazal-' + i2 + '.html');
for(var j2 = 1; j2 <= 10; j2++) WARM.push('/nazm-' + j2 + '.html');

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    // one by one, so a missing file never breaks the whole install
    return Promise.all(PRECACHE.map(function(u){ return c.add(new Request(u, {cache: 'reload'})).catch(function(){}); }));
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE && k !== AUDIO; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

function isFontHost(u){ return u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com'; }

var warming = false;
function warm(){
  if(warming) return Promise.resolve(); warming = true;
  return caches.open(CACHE).then(function(c){
    return c.keys().then(function(ks){
      var have = {}; ks.forEach(function(r){ have[new URL(r.url).pathname] = 1; });
      var todo = WARM.filter(function(u){ return !have[u]; }), k = 0;
      function next(){
        if(k >= todo.length) return;
        var batch = todo.slice(k, k + 3); k += 3;
        return Promise.all(batch.map(function(u){ return c.add(new Request(u, {cache: 'reload'})).catch(function(){}); }))
          .then(function(){ return new Promise(function(r){ setTimeout(r, 300); }); }).then(next);
      }
      return next();
    });
  }).then(function(){ warming = false; }, function(){ warming = false; });
}
self.addEventListener('message', function(e){ if(e.data && e.data.type === 'warm') e.waitUntil(warm()); });

/* A saved recording: answer from the audio cache (whole, or the byte range the player asked for). Not saved: ask the network, untouched. */
function serveAudio(req){
  return caches.open(AUDIO).then(function(c){ return c.match(req.url, {ignoreSearch: true}); }).then(function(hit){
    if(!hit) return fetch(req);
    var range = req.headers.get('range');
    if(!range) return hit;
    return hit.blob().then(function(blob){
      var size = blob.size, m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if(!m || (m[1] === '' && m[2] === '')) return hit;
      var start, end;
      if(m[1] === ''){ var n = parseInt(m[2], 10); start = Math.max(0, size - n); end = size - 1; }      // bytes=-500 : the last 500 bytes
      else { start = parseInt(m[1], 10); end = m[2] === '' ? size - 1 : Math.min(parseInt(m[2], 10), size - 1); }
      if(start >= size || start > end) return new Response(null, {status: 416, headers: {'Content-Range': 'bytes */' + size}});
      return new Response(blob.slice(start, end + 1), {status: 206, statusText: 'Partial Content', headers: {
        'Content-Type': hit.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
        'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes'}});
    });
  }).catch(function(){ return fetch(req); });
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  if(sameOrigin && /\.mp3$/i.test(url.pathname)){ e.respondWith(serveAudio(req)); return; }     // saved-for-offline audio, otherwise the network
  if(req.headers.has('range')) return;                                  // other streaming: leave to the browser
  if(!sameOrigin && !isFontHost(url)) return;                           // Supabase, Buttondown, Instagram ... untouched
  if(sameOrigin){
    if(/\.(mp4|m4a|wav|ogg)$/i.test(url.pathname)) return;
    if(url.pathname === '/admin-comments.html' || url.pathname === '/admin-insights.html' || url.pathname === '/service-worker.js') return;
  }

  var isPage = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1 || (sameOrigin && /(\.html|\/)$/i.test(url.pathname));
  var isCode = sameOrigin && /\.(css|js|json|xml)$/i.test(url.pathname);
  function store(res){ if(res && (res.ok || res.type === 'opaque')){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); } return res; }
  if(isPage || isCode){
    // pages and code: network first, so every change you upload shows up at once; saved copy only when offline
    e.respondWith(
      fetch(req).then(store).catch(function(){
        return caches.match(req, {ignoreSearch: true}).then(function(hit){ return hit || (isPage ? caches.match('/offline.html') : Response.error()); });
      })
    );
    return;
  }
  // images and fonts (they rarely change): saved copy at once, refreshed in the background
  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req).then(store).catch(function(){ return hit || caches.match(req, {ignoreSearch: true}); });
      return hit || net;
    })
  );
});
