var dataCacheName = 'weatherData-v1';
var cacheName = 'weatherPWA-step-6-1';
var filesToCache = [
  '/',
  '/index.html',
  '/scripts/app.js',
  '/styles/inline.css',
  '/images/clear.png',
  '/images/cloudy-scattered-showers.png',
  '/images/cloudy.png',
  '/images/fog.png',
  '/images/ic_add_white_24px.svg',
  '/images/ic_refresh_white_24px.svg',
  '/images/partly-cloudy.png',
  '/images/rain.png',
  '/images/scattered-showers.png',
  '/images/sleet.png',
  '/images/snow.png',
  '/images/thunderstorm.png',
  '/images/wind.png'
];

/* Install the service worker, and add all of the files that we should cache */
self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

/* Clean out all of the old caches that is not the currently active one */
self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
});

/* 
caches.match() evaluates the web request that triggered the fetch event, 
and checks to see if it's available in the cache. It then either responds 
with the cached version, or uses fetch to get a copy from the network. 
The response is passed back to the web page with e.respondWith(). 
*/
self.addEventListener('fetch', function(e) {
  console.log('[ServiceWorker] Fetch', e.request.url);

  /* Handle the data requests for weather separately from everything else */
  var dataUrl = 'https://publicdata-weather.firebaseio.com/';
  if (e.request.url.indexOf(dataUrl) === 0) {

  	/* 
  	fetch it, open the cache, clone the response into the cache, then
	return the response. We want to try and update the cache with the
	updated weather information if possible. app.js will be responsible
	for having the async call to retrieve it from the cache for speed
	purposes.
	*/
  	e.respondWith(
      fetch(e.request)
        .then(function(response) {
          return caches.open(dataCacheName).then(function(cache) {
            cache.put(e.request.url, response.clone());
            console.log('[ServiceWorker] Fetched&Cached Data');
            return response;
          });
        })
    );

  /* To handle all of the artifacts that we own ourselves. */
  } else {
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  }
});

/*
Beware of the edge cases
As previously mentioned, this code must not be used in production because 
of the many unhandled edge cases.

Cache depends on updating the cache key for every change
For example this caching method requires you to update the cache key every 
time content is changed, otherwise, the cache will not be updated, and the 
old content will be served. So be sure to change the cache key with every 
change as you're working on your project!

Requires everything to be redownloaded for every change
Another downside is that the entire cache is invalidated and needs to be 
re-downloaded every time a file changes. That means fixing a simple single 
character spelling mistake will invalidate the cache and require everything 
to be downloaded again. Not exactly efficient.

Browser cache may prevent the service worker cache from updating
There's another important caveat here. It's crucial that the HTTPS request 
made during the install handler goes directly to the network and doesn't 
return a response from the browser's cache. Otherwise the browser may return 
the old, cached version, resulting in the service worker cache never actually 
updating!

Beware of cache-first strategies in production
Our app uses a cache-first strategy, which results in a copy of any cached 
content being returned without consulting the network. While a cache-first 
strategy is easy to implement, it can cause challenges in the future. Once 
the copy of the host page and service worker registration is cached, it can 
be extremely difficult to change the configuration of the service worker (since 
the configuration depends on where it was defined), and you could find yourself 
deploying sites that are extremely difficult to update!

How do I avoid these edge cases?
So how do we avoid these edge cases? Use a library like sw-precache, which 
provides fine control over what gets expired, ensures requests go directly 
to the network and handles all of the hard work for you.
*/