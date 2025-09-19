import React from 'react';
import Link from 'next/link';

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold">Offline Mode App</h1>
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Offline Functionality Documentation</h1>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold mt-8 mb-4">How Offline Mode Works</h2>
            <p>
              This Next.js application implements comprehensive offline functionality similar to YouTube{`'`}s approach. 
              It uses a service worker to cache essential resources and API responses, enabling users to continue 
              using the app even when disconnected from the internet.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Key Features</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>App Shell Caching</strong> - Core UI components are cached for instant loading</li>
              <li><strong>API Response Caching</strong> - Data from API endpoints is cached for offline access</li>
              <li><strong>Network-First Strategy</strong> - Always tries to fetch fresh data when online</li>
              <li><strong>Graceful Offline Fallback</strong> - Shows cached data when offline</li>
              <li><strong>Connection Status Indicators</strong> - Visual indicators show online/offline status</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Service Worker Implementation</h3>
            <p>
              The service worker (<code>public/sw.js</code>) implements the following caching strategies:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>App Shell</strong> - Caches essential static assets and pages</li>
              <li><strong>API Requests</strong> - Uses network-first strategy with cache fallback</li>
              <li><strong>Navigation Requests</strong> - Falls back to cached pages or offline page</li>
              <li><strong>Assets</strong> - Images, styles, and scripts are cached on first access</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Testing Offline Mode</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Load the application in your browser</li>
              <li>View some data to populate the cache</li>
              <li>Open DevTools and go to the Application tab</li>
              <li>Check {`"`}Offline{`"`} in the Service Workers section</li>
              <li>Refresh the page to see the offline functionality</li>
              <li>Try adding new items (this will be disabled when offline)</li>
            </ol>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Technical Details</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cache Name</strong>: <code>offline-cache-v1</code></li>
              <li><strong>Offline Page</strong>: <code>/offline</code></li>
              <li><strong>Service Worker</strong>: <code>/sw.js</code></li>
              <li><strong>Manifest</strong>: <code>/manifest</code></li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Similarities to YouTube{`'`}s Implementation</h3>
            <p>
              Like YouTube, this implementation:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Uses service workers for resource caching</li>
              <li>Implements network-first strategy for fresh content</li>
              <li>Provides graceful degradation when offline</li>
              <li>Caches API responses for offline data access</li>
              <li>Shows visual indicators for connection status</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Offline Mode App - Built with Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}