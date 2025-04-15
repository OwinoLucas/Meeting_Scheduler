'use client';

export const dynamic = 'force-dynamic';

import ErrorPageContent from './ErrorPageContent';
import { Suspense } from 'react';

// Loading component for suspense fallback
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ErrorPageContent />
    </Suspense>
  );
}
