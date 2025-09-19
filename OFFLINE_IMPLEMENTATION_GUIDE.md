# Complete Guide to Offline-First Implementation in Next.js

This guide provides a comprehensive walkthrough of implementing offline functionality in a Next.js application using service workers. The implementation covers caching strategies, asset management, and graceful offline experiences.

## Table of Contents
1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Service Worker Implementation](#service-worker-implementation)
4. [Asset Management](#asset-management)
5. [Client-Side Integration](#client-side-integration)
6. [Offline Page Implementation](#offline-page-implementation)
7. [API Handling](#api-handling)
8. [Customization Guide](#customization-guide)
9. [Troubleshooting](#troubleshooting)
10. [Deployment Considerations](#deployment-considerations)

## Overview

The offline implementation uses a service worker to cache essential assets and provide a seamless offline experience. The approach follows these principles:

1. **Progressive Enhancement**: The app works online first, then enhances to support offline
2. **Graceful Degradation**: When offline, users get meaningful feedback instead of errors
3. **Efficient Caching**: Only essential assets are cached to minimize storage usage
4. **User Control**: Users are informed about their connection status

## Core Components

### 1. Service Worker (`public/sw.js`)

The service worker is the backbone of the offline functionality. It handles:
- Asset caching during installation
- Request interception and response handling
- Cache management and updates

### 2. Asset List Generator (`scripts/generate-asset-list.js`)

This script automatically discovers and lists all Next.js build assets that need to be cached for offline use.

### 3. Service Worker Registration (`components/ServiceWorkerRegistration.tsx`)

A React component that registers the service worker and provides UI feedback about connection status.

### 4. Offline Page (`app/offline/page.tsx`)

A dedicated page that users see when they're offline and try to access uncached content.

### 5. Manifest File (`public/manifest.json`)

A web app manifest that enables installation as a PWA.

## Service Worker Implementation

### Installation Phase

```javascript
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
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});
```

During installation, the service worker:
1. Opens a cache with a specific name
2. Adds all static assets to the cache
3. Skips the waiting phase to activate immediately

### Activation Phase

```javascript
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
      console.log('Claiming clients...');
      return self.clients.claim();
    })
  );
});
```

During activation, the service worker:
1. Cleans up old caches to prevent storage bloat
2. Claims all clients to take control immediately

### Fetch Handling

The service worker intercepts all fetch requests and applies different strategies based on the request type:

#### API Requests (Network-First Strategy)

```javascript
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
```

API requests use a network-first strategy:
1. Try to fetch from the network
2. If successful, cache the response
3. If network fails, try to serve from cache
4. If nothing is cached, return a fallback response

#### Navigation Requests (Network-First with Offline Fallback)

```javascript
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
      .catch(async (error) => {
        // Try to get from cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Special case: if user is trying to navigate to the offline page itself
        if (event.request.url.endsWith('/offline')) {
          const offlinePage = await caches.match('/offline');
          if (offlinePage) {
            return offlinePage;
          }
          // If offline page is not cached, return a basic offline response
          return new Response(/* ... */);
        }
        
        // For all other navigation requests when offline, redirect to the offline page
        const offlinePage = await caches.match(OFFLINE_URL);
        if (offlinePage) {
          return offlinePage;
        }
        
        // If offline page is not cached, return a basic offline response
        return new Response(/* ... */);
      })
  );
  return;
}
```

Navigation requests use a network-first strategy with offline fallback:
1. Try to fetch from the network
2. If successful, cache the response
3. If network fails, try to serve from cache
4. If nothing is cached, redirect to the offline page

#### Asset Requests (Cache-First Strategy)

```javascript
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
          return null;
        });
    })
);
```

Asset requests use a cache-first strategy:
1. Try to serve from cache
2. If not in cache, fetch from network
3. Cache the network response for future use
4. If both fail, return null for non-critical assets

## Asset Management

### Automatic Asset Discovery

The `scripts/generate-asset-list.js` script automatically discovers all Next.js build assets:

```javascript
// This script generates a list of all Next.js build assets to cache for offline use
async function generateAssetList() {
  const assetList = [
    '/',
    '/offline',
    '/docs',
    '/favicon.ico',
    '/manifest',
    '/next.svg',
    '/vercel.svg',
    '/file.svg',
    '/window.svg',
    '/globe.svg',
  ];

  try {
    // Read the .next/static directory to find all build assets
    const staticDir = join(process.cwd(), '.next', 'static');
    
    // Function to recursively find all files in a directory
    async function getFiles(dir) {
      const dirents = await fs.readdir(dir, { withFileTypes: true });
      const files = await Promise.all(dirents.map((dirent) => {
        const res = join(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
      }));
      return Array.prototype.concat(...files);
    }

    // Get all files in the static directory
    const files = await getFiles(staticDir);
    
    // Add relevant files to asset list
    files.forEach(file => {
      // Only include specific file types
      if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.woff2')) {
        // Convert absolute path to relative path
        const relativePath = file.replace(join(process.cwd(), '.next'), '/_next');
        assetList.push(relativePath);
      }
    });

    // Write the asset list to a file for the service worker to use
    const outputPath = join(process.cwd(), 'public', 'asset-list.js');
    const content = `// Auto-generated asset list for offline caching
const ASSET_LIST = ${JSON.stringify(assetList, null, 2)};
`;
    
    await fs.writeFile(outputPath, content);
    console.log('Asset list generated successfully!');
    console.log(`Found ${assetList.length} assets to cache`);
  } catch (error) {
    console.error('Error generating asset list:', error);
  }
}
```

This script:
1. Starts with a base list of essential assets
2. Recursively scans the `.next/static` directory
3. Adds all JavaScript, CSS, and WOFF2 files to the asset list
4. Writes the list to `public/asset-list.js` for the service worker to import

### Build Integration

The asset list generation is integrated into the build process:

```json
{
  "scripts": {
    "build": "node scripts/generate-asset-list.js && next build --turbopack"
  }
}
```

This ensures that the asset list is always up-to-date with the latest build.

## Client-Side Integration

### Service Worker Registration

The `ServiceWorkerRegistration` component registers the service worker and provides UI feedback:

```jsx
'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegistration() {
  const [isOnline, setIsOnline] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          console.log('Attempting to register service worker...');
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered with scope:', registration.scope);
          setIsRegistered(true);
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New content is available; please refresh.');
                  } else {
                    console.log('Content is cached for offline use.');
                  }
                }
              });
            }
          });
          
          // Claim clients immediately
          if (registration.active) {
            registration.active.postMessage({ type: 'CLAIM_CLIENTS' });
          }
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      } else {
        console.log('Service Worker not supported in this browser');
      }
    };
    
    // Register service worker when component mounts
    registerServiceWorker();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
        isOnline 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isOnline ? 'Online' : 'Offline'}
      </div>
      {isRegistered && (
        <div className="mt-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          Offline Ready
        </div>
      )}
    </div>
  );
}
```

This component:
1. Registers the service worker on mount
2. Listens for online/offline events
3. Provides visual feedback about connection status
4. Handles service worker updates

### Root Layout Integration

The service worker registration component is added to the root layout:

```jsx
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest" />
        <link rel="apple-touch-icon" href="/next.svg" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
```

## Offline Page Implementation

The offline page provides a user-friendly experience when offline:

```jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // If we're offline and trying to navigate to another page, 
    // prevent default navigation and show a message
    if (!navigator.onLine && href !== '/') {
      e.preventDefault();
      alert('You are currently offline. Please reconnect to access other pages.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Image
              className="dark:invert"
              src="/next.svg"
              alt="Next.js logo"
              width={100}
              height={24}
              priority
            />
            <h1 className="text-xl font-bold ml-4">Offline Mode App</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <span className={`mr-1.5 h-2 w-2 rounded-full ${
                isOnline ? 'bg-green-400' : 'bg-red-400'
              }`}></span>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg 
              className="w-16 h-16 mx-auto text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">You're Offline</h1>
          <p className="text-gray-600 mb-6">
            This page is not available without an internet connection. 
            Please check your connection and try again.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Retry Connection
            </button>
            <Link 
              href="/"
              onClick={(e) => handleNavigation(e, '/')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go to Home
            </Link>
          </div>
          
          {!isOnline && (
            <div className="mt-6 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              <p className="font-medium">Offline Mode</p>
              <p>Some pages may not be accessible while offline. Please reconnect to access all features.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Offline Mode App - All content is cached for offline use
          </p>
        </div>
      </footer>
    </div>
  );
}
```

Key features of the offline page:
1. Shows current connection status
2. Provides a retry button to check connection
3. Allows navigation to the home page (which is pre-cached)
4. Prevents navigation to other pages when offline
5. Provides informative messaging about offline mode

## API Handling

API requests are handled with a network-first strategy that falls back to cached responses:

```javascript
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
```

Client-side components can also handle offline API requests:

```jsx
const fetchData = async () => {
  try {
    setLoading(true);
    const response = await fetch('/api/data');
    const data = await response.json();
    
    setItems(data.data);
    setError(null);
    
    // Cache the data in service worker when online
    if (navigator.onLine && 'serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'CACHE_API_DATA',
        payload: {
          url: '/api/data',
          data: data
        }
      });
    }
  } catch (err) {
    setError('Failed to fetch data');
    console.error('Error fetching data:', err);
    
    // Try to get cached data when offline
    if (!navigator.onLine && 'serviceWorker' in navigator) {
      try {
        const cache = await caches.open('offline-cache-v1');
        const cachedResponse = await cache.match('/api/data');
        if (cachedResponse) {
          const cachedData = await cachedResponse.json();
          setItems(cachedData.data);
        }
      } catch (cacheErr) {
        console.error('Error reading from cache:', cacheErr);
      }
    }
  } finally {
    setLoading(false);
  }
};
```

## Customization Guide

### Changing Cache Strategy

To change the caching strategy for different types of requests, modify the fetch event handler in `sw.js`:

```javascript
// For cache-first strategy (assets)
event.respondWith(
  caches.match(event.request)
    .then((response) => {
      return response || fetch(event.request);
    })
);

// For network-first strategy (API)
event.respondWith(
  fetch(event.request)
    .catch(() => caches.match(event.request))
);
```

### Adding New Assets to Cache

To add new assets to the cache:

1. Add them to the base asset list in `scripts/generate-asset-list.js`:
```javascript
const assetList = [
  '/',
  '/offline',
  '/docs',
  // Add new assets here
  '/new-asset',
];
```

2. Or add file extensions to the automatic discovery:
```javascript
if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.woff2') || file.endsWith('.png')) {
  // Include PNG files in the asset list
}
```

### Customizing Offline Page

To customize the offline page:

1. Modify `app/offline/page.tsx` with your desired content
2. Update the styling to match your app's design
3. Add additional functionality as needed

### Changing Cache Name

To change the cache name (useful for versioning):

```javascript
const CACHE_NAME = 'offline-cache-v10'; // Change version number
```

Remember to update the cache name when you want to force a cache refresh for all users.

### Adding Runtime Caching

To cache API responses at runtime:

```javascript
// In your client-side components
if (navigator.onLine && 'serviceWorker' in navigator) {
  navigator.serviceWorker.controller?.postMessage({
    type: 'CACHE_API_DATA',
    payload: {
      url: '/api/endpoint',
      data: apiResponse
    }
  });
}
```

And handle the message in the service worker:

```javascript
self.addEventListener('message', (event) => {
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
```

## Troubleshooting

### Service Worker Not Registering

1. Check browser console for errors
2. Ensure the service worker file exists at `/sw.js`
3. Verify that you're serving over HTTPS (required for service workers in production)
4. Check that the browser supports service workers

### Assets Not Caching

1. Verify that assets are listed in `public/asset-list.js`
2. Check that the build process is generating the asset list
3. Ensure the service worker is activating properly
4. Check browser dev tools Application tab for cache contents

### Offline Page Loop

1. Ensure the offline page itself is cached during installation
2. Check that navigation requests to `/offline` are handled correctly
3. Verify there are no redirects causing loops

### API Requests Failing Offline

1. Ensure API responses are being cached
2. Check that the network-first strategy is implemented correctly
3. Verify that fallback responses are provided

## Deployment Considerations

### HTTPS Requirement

Service workers require HTTPS in production. Ensure your deployment environment supports HTTPS.

### Cache Headers

Configure appropriate cache headers for the service worker file:

```javascript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ];
  },
};
```

### Testing Offline Mode

To test offline functionality:

1. Use browser dev tools Network tab to disable network
2. Test navigation to cached and uncached pages
3. Verify API requests work offline when cached
4. Check that the offline page displays correctly

### Performance Considerations

1. Only cache essential assets to minimize storage usage
2. Use appropriate cache expiration strategies
3. Monitor cache sizes to prevent storage bloat
4. Consider implementing cache versioning for updates

## Conclusion

This implementation provides a robust offline experience for Next.js applications. By following the patterns described in this guide, you can create apps that work seamlessly both online and offline, providing a better user experience regardless of network conditions.

The key principles are:
1. Cache essential assets during installation
2. Use appropriate caching strategies for different request types
3. Provide meaningful feedback to users when offline
4. Handle edge cases gracefully
5. Continuously test and refine the implementation

With these patterns, your Next.js app will be ready for offline use while maintaining a great user experience.