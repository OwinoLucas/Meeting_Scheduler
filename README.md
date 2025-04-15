# Meeting Scheduler

A simple web application that allows users to authenticate with Google SSO and create/schedule Google Meet meetings.

## Features

- Google SSO authentication using NextAuth.js
- Create instant Google Meet meetings
- Schedule future meetings
- Modern UI with Tailwind CSS
- State management with Redux

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- Google Cloud Platform account for OAuth credentials

## Setup

1. Clone the repository:
```bash
git clone https://github.com/OwinoLucas/meeting_scheduler.git
cd meeting-scheduler
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up Google OAuth credentials:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google Calendar API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - http://localhost:3000/api/auth/callback/google
     - https://your-production-domain.com/api/auth/callback/google

4. Create a `.env.local` file in the root directory with the following variables:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The application can be deployed to Netlify:

1. Push your code to a Git repository
2. Connect your repository to Netlify
3. Set up the environment variables in Netlify's dashboard
4. Deploy!

## Notes

- This is an MVP version without persistent storage
- Meeting links are currently mocked for demonstration purposes
- In a production environment, you would need to implement proper error handling and validation

## License

MIT
