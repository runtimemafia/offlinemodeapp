'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function InvoiceTestPage() {
  const [invoiceId, setInvoiceId] = useState('');

  const generateRandomId = () => {
    const randomId = Math.floor(Math.random() * 1000000).toString();
    setInvoiceId(randomId);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Invoice Test</h1>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Generate Invoice</h2>
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  placeholder="Enter invoice ID"
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={generateRandomId}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Random
                </button>
              </div>
              
              {invoiceId && (
                <Link 
                  href={`/invoice/${invoiceId}`}
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  View Invoice #{invoiceId}
                </Link>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">How it works:</h3>
              <ul className="list-disc pl-5 text-blue-700 space-y-1">
                <li>Enter an invoice ID or generate a random one</li>
                <li>Click &quot;View Invoice&quot; to see the dynamic page</li>
                <li>The page will fetch data from the API</li>
                <li>API responses are automatically cached for offline use</li>
                <li>Try going offline after viewing an invoice - it should still work!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}