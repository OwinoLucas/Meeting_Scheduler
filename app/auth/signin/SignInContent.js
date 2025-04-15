'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense, useState } from 'react';

// Loading component for suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Component that handles the Google sign-in button
// This doesn't use searchParams so doesn't need to be wrapped in Suspense
function GoogleSignInButton({ callbackUrl }) {
  return (
    <div className="mt-8 space-y-6">
      <button
        onClick={() => signIn('google', { 
          callbackUrl,
          redirect: true,
          httpOptions: {
            timeout: 10000, // 10 seconds timeout
            retry: 3, // Retry 3 times
            retryDelay: attempt => Math.pow(2, attempt) * 1000 // Exponential backoff
          }
        })}
        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
          <svg 
            className="h-5 w-5 text-blue-500 group-hover:text-blue-400"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
          </svg>
        </span>
        Sign in with Google
      </button>
    </div>
  );
}

// Component that uses searchParams - properly isolated with Suspense
function SearchParamsComponent() {
  // This is the component that uses useSearchParams() and must be
  // directly wrapped in Suspense
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  return { error, callbackUrl };
}

// Wrapper that handles the Suspense boundary
function SearchParamsWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SearchParamsConsumer />
    </Suspense>
  );
}

// Consumer that uses the params without directly calling the hook
function SearchParamsConsumer() {
  const { error, callbackUrl } = SearchParamsComponent();
  
  return (
    <>
      {error && (
        <div className="mt-2 p-3 bg-red-50 text-red-500 rounded-md text-sm">
          {error === 'OAuthSignin' 
            ? 'An error occurred during sign in. Please try again.' 
            : `Error: ${error}`}
        </div>
      )}
      <GoogleSignInButton callbackUrl={callbackUrl} />
    </>
  );
}

// Component that handles the session state
function SessionHandler() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Handle redirection when user is already signed in
  useEffect(() => {
    if (session && isMounted) {
      // We need searchParams here, but in a safe way that doesn't
      // trigger the need for Suspense during static generation
      const url = new URL(window.location.href);
      const callbackUrl = url.searchParams.get('callbackUrl') || '/';
      router.push(callbackUrl);
    }
  }, [session, router, isMounted]);

  if (status === 'loading' || !isMounted) {
    return <LoadingSpinner />;
  }

  return <SearchParamsWrapper />;
}

// Main exported component
export default function SignInContent() {
  return <SessionHandler />;
}
