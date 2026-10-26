/* service-worker.js — makes the site installable and readable offline.
   WHAT IT DOES
   - Pages (HTML): network first (so a visitor always gets the newest version); if there is no network, the saved copy; if there is
     no saved copy either, offline.html.
   - css / js: network first too (your uploads show up at once). Images and fonts (incl. Google Fonts): saved copy shown at once, refreshed in the background.
   - Saved on install: home, ghazals, nazms, audio pages, all 40 ghazal + 10 nazm pages and their data/scripts, so poems read offline.
   WHAT IT NEVER TOUCHES: audio files (mp3 / range requests), Supabase (comments), Buttondown, the admin page, anything that is not GET.
   WHEN YOU CHANGE FILES: pages and files update by themselves while online. Only change CACHE below (zf-v1 -> zf-v2) if you also
   change the PRECACHE list or want every phone to throw away all saved copies. */
var CACHE = 'zf-v1';
var PRECACHE = ['/', '/index.html', '/index-en.html', '/index-ur.html', '/ghazals.html', '/ghazals-en.html', '/ghazals-ur.html',
  '/nazms.html', '/nazms-en.html', '/nazms-ur.html', '/audios.html', '/audios-en.html', '/audios-ur.html', '/about.html', '/offline.html',
  '/style.css', '/app.js', '/i18n.js', '/collection.js', '/search.js', '/home-features.js', '/home-carousel.js', '/home-extras.js', '/sher-image.js', '/audios.js', '/comments.js',
  '/ghazals-data.js', '/nazms-data.js', '/playfair-display-600.woff2', '/logo.png', '/favicon.ico', '/icon-192.png', '/manifest.json'];
for(var i = 1; i <= 40; i++) PRECACHE.push('/ghazal-' + i + '.html');
for(var j = 1; j <= 10; j++) PRECACHE.push('/nazm-' + j + '.html');

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    // one by one, so a missing file never breaks the whole install
    return Promise.all(PRECACHE.map(function(u){ return c.add(new Request(u, {cache: 'reload'})).catch(function(){}); }));
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

function isFontHost(u){ return u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com'; }

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  if(req.headers.has('range')) return;                                  // audio / video streaming: leave to the browser
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  if(!sameOrigin && !isFontHost(url)) return;                           // Supabase, Buttondown, Instagram ... untouched
  if(sameOrigin){
    if(/\.(mp3|mp4|m4a|wav|ogg)$/i.test(url.pathname)) return;           // never store audio
    if(url.pathname === '/admin-comments.html' || url.pathname === '/service-worker.js') return;
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
