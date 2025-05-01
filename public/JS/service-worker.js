const CACHE_NAME = 'blog-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/home.html',
  '/blog.html',
  '/editor.html',
  '/login.html',
  '/profile.html',
  '/about.html',
  '/css/home.css',
  '/css/blog.css',
  '/css/editor.css',
  '/css/login.css',
  '/css/profile.css',
  '/css/about.css',
  '/js/home.js',
  '/js/blog.js',
  '/js/editor.js',
  '/js/login.js',
  '/js/nav.js',
  '/js/firebase.js',
  '/js/profile.js',
  '/img/logo.png',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          ASSETS_TO_CACHE.map(url => {
            return fetch(url)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to cache ${url}`);
                }
                return cache.put(url, response);
              })
              .catch(error => {
                console.warn(`Failed to cache ${url}:`, error);
              });
          })
        );
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip Firebase API and upload requests
  if (event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('firebase-storage') ||
      event.request.url.includes('/upload') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // Only cache successful same-origin responses
            if (response.status === 200 && response.type === 'basic') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return response;
          });
      })
      .catch(() => {
        // Return a fallback response for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/404.html');
        }
        return new Response('Network error occurred', {
          status: 504,
          statusText: 'Network Error'
        });
      })
  );
});