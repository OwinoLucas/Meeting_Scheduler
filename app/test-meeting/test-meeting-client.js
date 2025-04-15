'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

export default function TestMeetingClient() {
  const { data: session, status } = useSession();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const createMeeting = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Check if session is valid
      if (!session) {
        throw new Error('Authentication required. Please sign in to create meetings.');
      }

      // Check for token expiration
      if (session.error === 'RefreshAccessTokenError') {
        throw new Error('Your session has expired. Please sign in again.');
      }

      // Create a meeting 5 minutes from now
      const startTime = new Date(Date.now() + 5 * 60000).toISOString();
      
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startTime,
          title: 'Test Meeting',
          description: 'This is a test meeting created to verify the Calendar API integration',
          duration: 30, // 30 minutes
        }),
      });
      
      // Check content type to ensure it's JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If the server returns HTML instead of JSON, this avoids the parsing error
        const text = await response.text();
        console.error('Received non-JSON response:', text.substring(0, 200) + '...');
        throw new Error(
          'Server returned an invalid response format. This may indicate a server error or authentication issue.'
        );
      }

      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          // Unauthorized - session might be expired
          if (data.message?.includes('expired')) {
            throw new Error('Your session has expired. Please sign in again.');
          } else {
            throw new Error('Authentication failed. Please sign in again.');
          }
        } else if (response.status === 403) {
          throw new Error('Calendar access denied. Please check your Google Calendar permissions.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        } else {
          throw new Error(data.message || data.error || 'Failed to create meeting');
        }
      }

      setResult(data);
    } catch (err) {
      console.error('Error creating meeting:', err);
      
      // Handle auth-related errors by redirecting to sign in
      if (
        err.message?.includes('authentication') || 
        err.message?.includes('sign in') || 
        err.message?.includes('session has expired')
      ) {
        setError(`${err.message} Redirecting to sign in page...`);
        // Set a timeout to allow the user to see the error before redirecting
        setTimeout(() => {
          signIn('google', { callbackUrl: window.location.href });
        }, 2000);
      } else {
        setError(err.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-4">Please sign in to create meetings</p>
        <Link 
          href="/auth/signin" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Test Meeting Creation</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Signed in as:</h2>
        <p><strong>Name:</strong> {session.user?.name}</p>
        <p><strong>Email:</strong> {session.user?.email}</p>
      </div>
      
      <div className="mb-6">
        <button
          onClick={createMeeting}
          disabled={loading}
          className={`${
            loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-700'
          } text-white font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center`}
        >
          {loading ? (
            <>
              <span className="mr-2 animate-spin">⟳</span>
              Creating...
            </>
          ) : (
            'Create Test Meeting (5 min from now)'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
          <h2 className="font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="p-6 bg-green-50 text-green-700 rounded-lg border border-green-200">
          <h2 className="font-bold text-xl mb-4">Meeting Created Successfully!</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Meeting ID:</p>
              <p className="mb-2 text-sm">{result.meeting.id}</p>
              
              <p className="font-medium">Title:</p>
              <p className="mb-2">{result.meeting.title}</p>
              
              <p className="font-medium">Description:</p>
              <p className="mb-2">{result.meeting.description}</p>
            </div>
            
            <div>
              <p className="font-medium">Start Time:</p>
              <p className="mb-2">{new Date(result.meeting.startTime).toLocaleString()}</p>
              
              <p className="font-medium">End Time:</p>
              <p className="mb-2">{new Date(result.meeting.endTime).toLocaleString()}</p>
              
              <p className="font-medium">Google Meet Link:</p>
              <a 
                href={result.meeting.meetLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block mb-2 text-blue-500 hover:text-blue-700 underline"
              >
                {result.meeting.meetLink}
              </a>
              
              <a 
                href={result.meeting.meetLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-block mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded-lg"
              >
                Join Meeting
              </a>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <Link 
          href="/" 
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
