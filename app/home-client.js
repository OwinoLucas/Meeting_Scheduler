'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from './lib/store/hooks';
import {
  setInstantMeeting,
  setScheduledMeeting,
  setError,
  setCreatingInstantMeeting,
  setCreatingScheduledMeeting,
} from './lib/store/slices/meetingsSlice';
import { setUser } from './lib/store/slices/authSlice';

// Helper function to format dates consistently
const formatDateTime = (dateString) => {
  if (!dateString) return 'Invalid date';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    
    // Format date with time and timezone information
    return new Intl.DateTimeFormat('default', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date format';
  }
};

// Helper to get user-friendly timezone name
const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return 'Unknown timezone';
  }
};
export default function HomeClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const {
    instantMeeting,
    scheduledMeeting,
    error,
    isCreatingInstantMeeting,
    isCreatingScheduledMeeting,
  } = useAppSelector((state) => state.meetings);

  console.log("time:", scheduledMeeting.time)

  useEffect(() => {
    // Test Redux is working
    console.log('Redux state:', {
      instantMeeting,
      scheduledMeeting,
      error,
      isCreatingInstantMeeting,
      isCreatingScheduledMeeting
    });
  }, [instantMeeting, scheduledMeeting, error, isCreatingInstantMeeting, isCreatingScheduledMeeting]);

  useEffect(() => {
    if (status === 'loading') return;
  
    if (!session) {
      router.push('/auth/signin');
    } else if (session.user) {
      // Only dispatch if session.user exists
      dispatch(setUser({
        name: session.user.name || 'Unknown User',
        email: session.user.email || 'No Email'
      }));
    }
  }, [session, status, router, dispatch]);
  

  const createInstantMeeting = async () => {
    if (isCreatingInstantMeeting) return;
    
    try {
      dispatch(setCreatingInstantMeeting(true));
      dispatch(setError(''));
      
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startTime: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create meeting');
      }

      const data = await response.json();
      
      // Validate meeting data
      if (data.meeting) {
        // Validate date formats
        const startTime = new Date(data.meeting.startTime);
        const endTime = new Date(data.meeting.endTime);
        
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.warn('Received invalid date format from API:', {
            startTime: data.meeting.startTime,
            endTime: data.meeting.endTime
          });
        }
      }
      
      dispatch(setInstantMeeting({
        link: data.meeting.meetLink,
        time: formatDateTime(new Date()) // Use current time formatted consistently
      }));
    } catch (err) {
      dispatch(setError(err.message || 'Failed to create meeting. Please try again.'));
      console.error(err);
    } finally {
      dispatch(setCreatingInstantMeeting(false));
    }
  };

  const scheduleMeeting = async (e) => {
    e.preventDefault();
    if (isCreatingScheduledMeeting) return;
    
    try {
      dispatch(setCreatingScheduledMeeting(true));
      dispatch(setError(''));
      
      const formData = new FormData(e.target);
      const dateTime = formData.get('datetime');
      
      if (!dateTime) {
        dispatch(setError('Please select a date and time'));
        return;
      }

      // Convert the datetime-local input to ISO string
      const isoDateTime = new Date(dateTime).toISOString();
      
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          startTime: isoDateTime
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule meeting');
      }

      const data = await response.json();
      
      // Validate meeting data
      if (data.meeting) {
        // Validate date formats
        const startTime = new Date(data.meeting.startTime);
        const endTime = new Date(data.meeting.endTime);
        
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.warn('Received invalid date format from API:', {
            startTime: data.meeting.startTime,
            endTime: data.meeting.endTime
          });
        }
      }
      
      dispatch(setScheduledMeeting({
        link: data.meeting.meetLink,
        time: formatDateTime(data.meeting.startTime) // Use meeting's start time with proper formatting
      }));
    } catch (err) {
      dispatch(setError(err.message || 'Failed to schedule meeting. Please try again.'));
      console.error(err);
    } finally {
      dispatch(setCreatingScheduledMeeting(false));
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
      <div className="min-h-screen flex flex-col items-center justify-center">
        <a
          href="/auth/signin"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Sign in to continue
        </a>
      </div>
    );
  }

  // Make sure session and session.user exist before rendering
  if (!session || !session.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meeting Scheduler</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-gray-900 font-medium">{session.user.name || 'Unknown User'}</p>
              <p className="text-sm text-gray-600">{session.user.email || 'No Email'}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign out
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-900 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Instant Meeting */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Instant Meeting</h2>
            <div className='mt-12'>
              <div className="pt-8">
                <button
                  onClick={createInstantMeeting}
                  disabled={isCreatingInstantMeeting}
                  className={`w-full px-4 py-2 ${
                    isCreatingInstantMeeting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white rounded`}
                >
                  {isCreatingInstantMeeting ? 'Creating...' : 'Create Instant Meeting'}
                </button>
              </div>
            </div>
          </div>

          {/* Scheduled Meeting */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Schedule Meeting</h2>
            <form onSubmit={scheduleMeeting} className="space-y-4">
              <div>
                <label htmlFor="datetime" className="block text-sm font-medium text-gray-900">
                  Date and Time
                </label>
                <input
                  type="datetime-local"
                  id="datetime"
                  name="datetime"
                  required
                  disabled={isCreatingScheduledMeeting}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-1 block w-full rounded-md border-gray-300 text-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <button
                type="submit"
                disabled={isCreatingScheduledMeeting}
                className={`w-full px-4 py-2 ${
                  isCreatingScheduledMeeting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white rounded`}
              >
                {isCreatingScheduledMeeting ? 'Scheduling...' : 'Schedule Meeting'}
              </button>
            </form>
          </div>
        </div>

        {/* Meeting Details Section */}
        {(instantMeeting.link || scheduledMeeting.link) && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Meeting Details</h2>
            <p className="text-sm text-gray-600 mb-4">All times shown in your local timezone ({getUserTimezone()})</p>
            
            {instantMeeting.link && (
              <div className="mb-6 p-4 bg-gray-50 rounded">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Instant Meeting</h3>
                <p className="text-gray-900">Created at: {instantMeeting.time}</p>
                <a
                  href={instantMeeting.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline break-all"
                >
                  {instantMeeting.link}
                </a>
              </div>
            )}
            {scheduledMeeting.link && (
              <div className="p-4 bg-gray-50 rounded">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Scheduled Meeting</h3>
                <p className="text-gray-900">Scheduled for: {scheduledMeeting.time}</p>
                <a
                  href={scheduledMeeting.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline break-all"
                >
                  {scheduledMeeting.link}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
