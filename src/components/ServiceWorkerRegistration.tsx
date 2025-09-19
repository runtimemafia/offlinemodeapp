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