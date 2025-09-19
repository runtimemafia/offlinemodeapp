'use client';

import { useState, useEffect } from 'react';

interface DataItem {
  id: number;
  title: string;
  description: string;
}

export default function OfflineDataDemo() {
  const [items, setItems] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ title: '', description: '' });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setItems([...items, data.data]);
        setNewItem({ title: '', description: '' });
      }
    } catch (err) {
      setError('Failed to add item');
      console.error('Error adding item:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Offline Data Demo</h2>
        
        <div className="mb-4 flex items-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <span className={`mr-2 h-2 w-2 rounded-full ${
              isOnline ? 'bg-green-400' : 'bg-red-400'
            }`}></span>
            {isOnline ? 'Online Mode' : 'Offline Mode'}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="ml-4 px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            Refresh Data
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data List */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Stored Items</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2">Loading data...</p>
              </div>
            ) : items.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No items found</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-2">ID: {item.id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Add New Item Form */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Add New Item</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={!isOnline}
                className={`w-full px-4 py-2 rounded-md text-white ${
                  isOnline 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isOnline ? 'Add Item' : 'Cannot Add Offline'}
              </button>
            </form>
            
            {!isOnline && (
              <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                <p className="font-medium">Offline Mode</p>
                <p>You can view cached data, but cannot add new items while offline.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}