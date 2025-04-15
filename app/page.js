import HomeClient from './home-client';

// Force dynamic rendering - prevents static generation attempts
export const dynamic = 'force-dynamic';

// Metadata for the page
export const metadata = {
  title: 'Meeting Scheduler',
  description: 'Create and schedule Google Meet meetings with ease',
};

// Server component that renders the client component
export default function HomePage() {
  return (
    <HomeClient />
  );
}
