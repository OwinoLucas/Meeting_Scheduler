'use client';

import { Suspense } from 'react';
import SignInForm from './signIn';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading sign-in page...</div>}>
      <SignInForm />
    </Suspense>
  );
}
