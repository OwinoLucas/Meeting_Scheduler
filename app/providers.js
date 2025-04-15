'use client';

import { Provider } from 'react-redux';
import { store } from './lib/store';
import { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';

// This ensures the providers only run on the client side
export default function Providers({ children }) {
  // Use client-side only mounting to prevent SSG issues
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Log environment info to help with debugging
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      isNetlify: typeof process.env.NETLIFY !== 'undefined'
    });
  }, []);

  // Show a loading state when not mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Critical: Auth provider must wrap the Redux provider to ensure contexts are properly available
  return (
    <SessionProvider>
      <Provider store={store}>
        {children}
      </Provider>
    </SessionProvider>
  );
}
