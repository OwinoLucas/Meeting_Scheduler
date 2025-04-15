'use client';

import { Suspense } from 'react';
import ErrorPageContent from './ErrorPageContent';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading error message...</div>}>
      <ErrorPageContent />
    </Suspense>
  );
}
