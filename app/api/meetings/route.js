import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]/route';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    console.log('Starting meeting creation process...');
    
    // Get and validate session
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    
    if (!session?.accessToken) {
      console.error('No session or access token found');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Please sign in to create meetings'
      }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    console.log('Request body:', body);

    if (!body.startTime) {
      return NextResponse.json({ 
        error: 'Bad Request',
        message: 'Start time is required'
      }, { status: 400 });
    }

    // Setup Google OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    console.log('Setting OAuth2 credentials...');
    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken
    });

    // Create Calendar API client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Calculate meeting times
    const startTime = new Date(body.startTime);
    const endTime = new Date(startTime.getTime() + (body.duration || 60) * 60 * 1000);

    // Prepare event details
    const event = {
      summary: body.title || 'Google Meet Meeting',
      description: body.description || 'Meeting created via Meeting Scheduler',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: body.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: body.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      conferenceData: {
        createRequest: {
          requestId: `meeting-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    // Add attendees if provided
    if (body.attendees?.length > 0) {
      event.attendees = body.attendees.map(email => ({ email }));
    }

    console.log('Creating calendar event...');
    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
      sendUpdates: body.sendInvites ? 'all' : 'none'
    });

    if (!response.data) {
      throw new Error('Failed to create meeting: No response data');
    }

    console.log('Meeting created successfully');
    return NextResponse.json({
      success: true,
      meeting: {
        id: response.data.id,
        meetLink: response.data.hangoutLink,
        startTime: response.data.start.dateTime,
        endTime: response.data.end.dateTime,
        title: response.data.summary,
        description: response.data.description,
        attendees: response.data.attendees || []
      }
    });

  } catch (error) {
    console.error('Error creating meeting:', error);

    // Handle authentication errors
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return NextResponse.json({ 
        error: 'Authentication failed',
        message: 'Your session has expired. Please sign in again.',
        details: error.message 
      }, { status: 401 });
    }

    // Handle permission errors
    if (error.code === 403) {
      return NextResponse.json({ 
        error: 'Calendar access denied',
        message: 'Please check your calendar permissions.',
        details: error.message 
      }, { status: 403 });
    }

    // Handle all other errors
    return NextResponse.json({ 
      error: 'Failed to create meeting',
      message: 'An unexpected error occurred',
      details: error.message 
    }, { status: 500 });
  }
}

// GET method for fetching meetings
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Please sign in to view meetings'
      }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const { searchParams } = new URL(req.url);
    const maxResults = parseInt(searchParams.get('limit') || '10', 10);
    const timeMin = searchParams.get('timeMin') || new Date().toISOString();
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
      // Only fetch events that have Google Meet conferencing data
      q: 'hangoutsMeet'
    });

    const meetings = response.data.items
      .filter(event => event.conferenceData?.conferenceId)
      .map(event => ({
        id: event.id,
        title: event.summary,
        description: event.description,
        startTime: event.start.dateTime || event.start.date,
        endTime: event.end.dateTime || event.end.date,
        meetLink: event.conferenceData?.entryPoints?.[0]?.uri || event.hangoutLink,
        attendees: (event.attendees || []).map(attendee => ({
          email: attendee.email,
          responseStatus: attendee.responseStatus
        }))
      }));

    return NextResponse.json({
      success: true,
      meetings
    });

  } catch (error) {
    console.error('Error fetching meetings:', error);
    
    if (error.code === 401) {
      return NextResponse.json({ 
        error: 'Authentication expired',
        message: 'Your session has expired. Please sign in again.',
        details: error.message 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch meetings',
      message: 'An unexpected error occurred',
      details: error.message 
    }, { status: 500 });
  }
}
