'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InvoicePage({ params }: { params: { invoiceid: string } }) {
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<{ id: string; data: string } | null>(null);
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
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/invoice/${params.invoiceid}`);
        const data = await response.json();
        
        if (response.ok) {
          setInvoiceData(data);
          setError(null);
        } else {
          throw new Error(data.error || 'Failed to fetch invoice');
        }
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice data');
        
        // Try to get cached data when offline
        if (!navigator.onLine) {
          try {
            const cache = await caches.open('offline-cache-v9');
            const cachedResponse = await cache.match(`/api/invoice/${params.invoiceid}`);
            if (cachedResponse) {
              const cachedData = await cachedResponse.json();
              setInvoiceData(cachedData);
              setError(null);
            }
          } catch (cacheErr) {
            console.error('Error reading from cache:', cacheErr);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.invoiceid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg 
              className="w-16 h-16 mx-auto text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go to Home
            </button>
          </div>
          
          {!isOnline && (
            <div className="mt-6 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              <p className="font-medium">Offline Mode</p>
              <p>You are currently offline. Some features may not be available.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Invoice Details</h1>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Invoice Information</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Invoice ID</p>
                    <p className="font-medium">{invoiceData?.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Random Data</p>
                    <p className="font-medium">{invoiceData?.data}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-8">
              <button 
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Back to Home
              </button>
              
              {!isOnline && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-yellow-400"></span>
                  Offline
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}