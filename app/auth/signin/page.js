import SignInContent from './SignInContent';

export default function SignInPage() {
  // This is now a server component that renders the client component
  // The static shell allows for proper pre-rendering
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Static content that can be pre-rendered */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Meeting Scheduler
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create and schedule Google Meet meetings with ease
          </p>
        </div>
        
        {/* Client component handles all dynamic content and interactions */}
        <SignInContent />
      </div>
    </div>
  );
}
