'use client';

import { useState, useEffect } from 'react';

interface Item {
  id: number;
  title: string;
  description: string;
}

export default function DataFetcher() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    fetchData();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      const data = await response.json();
      
      setItems(data.data);
      setError(null);
      
      // Cache the data in service worker when online
      if (navigator.onLine && 'serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CACHE_API_DATA',
          payload: {
            url: '/api/items',
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
          const cachedResponse = await cache.match('/api/items');
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

  const refreshData = () => {
    fetchData();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Data Items</h2>
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
          You are currently offline. Showing cached data.
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="p-4 border rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}