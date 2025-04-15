'use client';

import { Provider } from 'react-redux';
import { store } from './lib/store';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import SessionProvider to avoid it running during static generation
const AuthProvider = dynamic(
  () => import('./auth-provider').then(mod => mod.AuthProvider),
  { 
    ssr: false, // Critical: Don't render on server
    loading: () => <div style={{ visibility: 'hidden' }}>{null}</div> 
  }
);

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

  // During static generation, this component won't run hooks
  // When in the browser, we'll render the providers
  return (
    <Provider store={store}>
      {mounted ? (
        <AuthProvider>
          {children}
        </AuthProvider>
      ) : (
        // Provide a hidden fallback while loading
        <div style={{ visibility: 'hidden' }}>{children}</div>
      )}
    </Provider>
  );
}
