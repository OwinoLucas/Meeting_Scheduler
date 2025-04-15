import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]/route';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    console.log('Starting meeting creation process...');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    
    if (!session) {
      console.error('No session found');
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    const body = await req.json();
    const { startTime } = body;
    console.log('Request body:', { startTime });

    if (!startTime) {
      return NextResponse.json({ error: 'Start time is required' }, { status: 400 });
    }

    // Validate the start time
    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // For instant meetings (current time), we don't need to check if it's in the future
    const isInstantMeeting = Math.abs(new Date().getTime() - startDate.getTime()) < 60000; // Within 1 minute
    if (!isInstantMeeting && startDate < new Date()) {
      return NextResponse.json({ error: 'Meeting time must be in the future' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    console.log('Setting OAuth2 credentials...');
    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: 'Google Meet Meeting',
      description: 'Meeting created via Meeting Scheduler',
      start: {
        dateTime: startTime,
        timeZone: 'Africa/Nairobi',
      },
      end: {
        dateTime: new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'Africa/Nairobi',
      },
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(7),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    console.log('Creating calendar event...');
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'none',
    });

    console.log('Meeting created successfully');
    return NextResponse.json({
      meetLink: response.data.hangoutLink,
      eventId: response.data.id,
      startTime: response.data.start.dateTime,
    });
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
    });
    
    if (error.code === 401) {
      return NextResponse.json({ 
        error: 'Authentication failed. Please sign in again.',
        details: error.message 
      }, { status: 401 });
    }
    if (error.code === 403) {
      return NextResponse.json({ 
        error: 'Calendar access denied. Please check your permissions.',
        details: error.message 
      }, { status: 403 });
    }
    return NextResponse.json({ 
      error: 'Failed to create meeting',
      details: error.message 
    }, { status: 500 });
  }
}
