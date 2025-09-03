// Service Worker for XGEN MRP PWA
// Bump the version to invalidate old caches when deploying a new build
const CACHE_VERSION = 'v4'; // Bumped version to clear old cache
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
        // Cache each URL individually to prevent one failure from breaking the whole install
        const cachePromises = STATIC_CACHE_URLS.map(url => 
          cache.add(url).catch(error => {
            console.warn(`Failed to cache ${url}:`, error);
            // Continue with other URLs even if one fails
            return Promise.resolve();
          })
        );
        return Promise.all(cachePromises);
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
  
  // Skip font requests that might fail (let them fail naturally)
  if (request.url.includes('/fonts/Geist')) {
    console.warn('Skipping font request:', request.url);
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // For navigation requests (HTML), avoid staleness
      if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
        try {
          // Create timeout for navigation requests too
          const navController = new AbortController();
          const navTimeoutId = setTimeout(() => navController.abort(), 8000); // 8 second timeout for navigation
          
          const networkResponse = await fetch(request, {
            signal: navController.signal,
          });
          
          clearTimeout(navTimeoutId);
          
          // Optionally cache the latest shell
          if (networkResponse.status === 200) {
            try {
              cache.put(request, networkResponse.clone());
            } catch (cacheError) {
              console.warn('Failed to cache navigation response:', cacheError);
            }
          }
          return networkResponse;
        } catch (err) {
          console.warn('Navigation request failed:', request.url, err);
          const cached = await cache.match(request);
          if (cached) return cached;
          // Fallback to offline page
          const offlinePage = await cache.match('/offline');
          if (offlinePage) return offlinePage;
          // Last resort: create a simple offline response
          return new Response('Application offline', { 
            status: 503, 
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html' }
          });
        }
      }

      // For other assets: network-first with cache fallback and background update
      try {
        // Create a timeout controller for better error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const networkResponse = await fetch(request, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        if (networkResponse.status === 200) {
          // Only cache successful responses
          try {
            cache.put(request, networkResponse.clone());
          } catch (cacheError) {
            console.warn('Failed to cache response:', cacheError);
          }
        }
        return networkResponse;
      } catch (err) {
        console.warn('Network request failed:', request.url, err);
        const cached = await cache.match(request);
        if (cached) {
          console.log('Serving from cache:', request.url);
          return cached;
        }
        // Don't throw the error, return a basic response to prevent connection closed errors
        return new Response('Resource not available', { 
          status: 503, 
          statusText: 'Service Unavailable'
        });
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