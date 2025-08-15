// Service Worker for XGEN MRP PWA
// Bump the version to invalidate old caches when deploying a new build
const CACHE_VERSION = 'v3';
const CACHE_NAME = `xgen-mrp-${CACHE_VERSION}`;
const STATIC_CACHE_URLS = [
  '/',
  '/admin/login',
  '/worker/login',
  '/inspector/login',
  '/delivery/login',
  '/offline',
  '/manifest.json',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
  // Keep the new worker in waiting until explicitly told to activate,
  // so we can prompt the user and avoid mid-session swaps.
  // Do NOT call skipWaiting here; activation will be triggered via message.
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of open clients after activation
  self.clients.claim();
});

// Message handler to allow the page to tell the SW to activate immediately
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    // Activate the newly installed worker immediately
    self.skipWaiting();
  }
});

// Strategy:
// - For navigation requests (HTML), always go to network first to avoid stale app shell
//   and fall back to cache/offline page.
// - For other GET requests, network-first with cache fallback and background cache update.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) return;
  
  // Skip API requests for real-time data and non-GET methods
  if (request.url.includes('/api/') || request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // For navigation requests (HTML), avoid staleness
      if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
        try {
          const networkResponse = await fetch(request);
          // Optionally cache the latest shell
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          const cached = await cache.match(request);
          if (cached) return cached;
          return cache.match('/offline');
        }
      }

      // For other assets: network-first with cache fallback and background update
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw err;
      }
    })
  );
});

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Background sync triggered')
    );
  }
});

// Push Notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/images/icons/icon-192x192.png',
      badge: '/images/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Open App',
          icon: '/images/icons/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/images/icons/icon-192x192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});