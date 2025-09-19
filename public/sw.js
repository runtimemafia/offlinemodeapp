// Service Worker for offline functionality
const CACHE_NAME = 'offline-cache-v9';
const OFFLINE_URL = '/offline';

// Import the auto-generated asset list
importScripts('/asset-list.js');
const STATIC_ASSETS = ASSET_LIST;

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        // Activate the service worker immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches and claim clients
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
    }).then(() => {
      // Claim all clients immediately
      console.log('Claiming clients...');
      return self.clients.claim();
    })
  );
});

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLAIM_CLIENTS') {
    self.clients.claim();
  }
  
  // Handle caching of API data
  if (event.data && event.data.type === 'CACHE_API_DATA') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          const response = new Response(JSON.stringify(event.data.payload.data), {
            headers: { 'Content-Type': 'application/json' }
          });
          return cache.put(event.data.payload.url, response);
        })
    );
  }
});

// Fetch event - implement offline functionality
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests except for specific domains
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('devtunnel.970056.xyz')) {
    return;
  }
  
  // Handle API requests with network-first strategy
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(async () => {
          // If network fails, try to get from cache
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If no cache, return a fallback response
          return new Response(JSON.stringify({ 
            error: 'You are offline', 
            data: [],
            offline: true
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // For navigation requests, try network first, then cache, then offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the response for future offline use
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(async () => {
          // Try to get from cache
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Fallback to offline page for all navigation requests
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }
  
  // For other requests (assets), try cache first, then network
  // This will cache CSS, JS, images, and other assets as they are requested
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If we have a cached response, return it
        if (response) {
          return response;
        }
        
        // Otherwise, fetch from network and cache the response
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache the response for future use
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // If network fails and we don't have a cache, return nothing for non-critical assets
            // For critical assets, we might want to return a fallback
            return null;
          });
      })
  );
});