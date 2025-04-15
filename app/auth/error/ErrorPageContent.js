'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

// Loading component for suspense fallback
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Inner component that uses searchParams
function ErrorContentInner() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Verification':
        return 'The verification link is no longer valid.';
      case 'OAuthSignin':
        return 'There was a problem initiating the sign in process.';
      case 'OAuthCallback':
        return 'There was a problem processing the sign in callback.';
      case 'OAuthCreateAccount':
        return 'There was a problem creating your account.';
      case 'EmailCreateAccount':
        return 'There was a problem creating your account with email.';
      case 'Callback':
        return 'There was a problem with the authentication callback.';
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account.';
      case 'SessionRequired':
        return 'You must be signed in to access this page.';
      default:
        return 'An error occurred during sign in.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <Link
            href="/auth/signin"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main component that wraps the inner component with Suspense
export default function ErrorPageContent() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ErrorContentInner />
    </Suspense>
  );
}

