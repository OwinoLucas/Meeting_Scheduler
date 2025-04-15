import TestMeetingClient from './test-meeting-client';

// Force dynamic rendering - prevents static generation attempts
export const dynamic = 'force-dynamic';

// Metadata for the page
export const metadata = {
  title: 'Test Meeting - Meeting Scheduler',
  description: 'Create test meetings to verify the Google Calendar API integration',
};

// Server component that renders the client component
export default function TestMeetingPage() {
  return <TestMeetingClient />;
}
