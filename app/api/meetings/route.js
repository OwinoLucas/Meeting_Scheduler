import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]/route';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

/**
 * Helper function to create a consistent JSON response with proper headers
 * @param {Object} data - The data to return in the response
 * @param {number} status - HTTP status code (default: 200)
 * @returns {NextResponse} - Next.js response object with proper headers
 */
function createJsonResponse(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, must-revalidate, max-age=0',
    }
  });
}
export async function POST(req) {
  console.log('POST /api/meetings: Request received');
  try {
    console.log('Starting meeting creation process...');
    
    // Get and validate session
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    
    if (!session) {
      console.error('No session found');
      return createJsonResponse({ 
        error: 'Unauthorized',
        message: 'Please sign in to create meetings'
      }, 401);
    }
    
    if (!session.accessToken) {
      console.error('No access token found in session');
      return createJsonResponse({ 
        error: 'Unauthorized',
        message: 'Invalid session - missing access token. Please sign in again.'
      }, 401);
    }
    
    if (session.error === 'RefreshAccessTokenError') {
      console.error('Token refresh error detected in session');
      return createJsonResponse({ 
        error: 'TokenRefreshError',
        message: 'Your session has expired. Please sign in again.'
      }, 401);
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
      console.log('Request body received:', JSON.stringify(body));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return createJsonResponse({ 
        error: 'BadRequest',
        message: 'Invalid JSON in request body'
      }, 400);
    }
    
    if (!body.startTime) {
      console.error('Missing required field: startTime');
      return createJsonResponse({ 
        error: 'BadRequest',
        message: 'Start time is required'
      }, 400);
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

    console.log('Meeting created successfully with ID:', response.data.id);
    
    // Validate response data before sending
    const meetingData = {
      success: true,
      meeting: {
        id: response.data.id || '',
        meetLink: response.data.hangoutLink || '',
        startTime: response.data.start?.dateTime || '',
        endTime: response.data.end?.dateTime || '',
        title: response.data.summary || 'Untitled Meeting',
        description: response.data.description || '',
        attendees: response.data.attendees || []
      }
    };
    
    return createJsonResponse(meetingData);

  } catch (error) {
    console.error('Error creating meeting:', error);

    // Handle authentication errors
    // Handle authentication errors
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      console.error('Authentication error when creating meeting:', error);
      return createJsonResponse({ 
        error: 'AuthenticationFailed',
        message: 'Your session has expired. Please sign in again.',
        details: error.message 
      }, 401);
    }

    // Handle permission errors
    if (error.code === 403) {
      console.error('Permission error when creating meeting:', error);
      return createJsonResponse({ 
        error: 'AccessDenied',
        message: 'Please check your calendar permissions.',
        details: error.message 
      }, 403);
    }
    
    // Handle rate limit errors
    if (error.code === 429 || error.message?.includes('rate limit')) {
      console.error('Rate limit exceeded when creating meeting:', error);
      return createJsonResponse({ 
        error: 'RateLimitExceeded',
        message: 'Too many requests. Please try again later.',
        details: error.message 
      }, 429);
    }

    // Handle all other errors
    console.error('Unexpected error when creating meeting:', error);
    return createJsonResponse({ 
      error: 'FailedToCreateMeeting',
      message: 'An unexpected error occurred',
      details: error.message || 'Unknown error'
    }, 500);
  }
}

// GET method for fetching meetings
export async function GET(req) {
  console.log('GET /api/meetings: Request received');
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.error('No session found');
      return createJsonResponse({ 
        error: 'Unauthorized',
        message: 'Please sign in to view meetings'
      }, 401);
    }
    
    if (!session.accessToken) {
      console.error('No access token found in session');
      return createJsonResponse({ 
        error: 'Unauthorized',
        message: 'Invalid session - missing access token. Please sign in again.'
      }, 401);
    }
    
    if (session.error === 'RefreshAccessTokenError') {
      console.error('Token refresh error detected in session');
      return createJsonResponse({ 
        error: 'TokenRefreshError',
        message: 'Your session has expired. Please sign in again.'
      }, 401);
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
    
    console.log(`Fetching meetings: limit=${maxResults}, timeMin=${timeMin}`);
    
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

    console.log(`Successfully fetched ${meetings.length} meetings`);
    return createJsonResponse({
      success: true,
      meetings
    });

  } catch (error) {
    console.error('Error fetching meetings:', error);
    
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      console.error('Authentication error when fetching meetings:', error);
      return createJsonResponse({ 
        error: 'AuthenticationExpired',
        message: 'Your session has expired. Please sign in again.',
        details: error.message 
      }, 401);
    }
    
    if (error.code === 403) {
      console.error('Permission error when fetching meetings:', error);
      return createJsonResponse({ 
        error: 'AccessDenied',
        message: 'Please check your calendar permissions.',
        details: error.message 
      }, 403);
    }
    
    if (error.code === 429) {
      console.error('Rate limit exceeded when fetching meetings:', error);
      return createJsonResponse({ 
        error: 'RateLimitExceeded',
        message: 'Too many requests. Please try again later.',
        details: error.message 
      }, 429);
    }
    
    console.error('Unexpected error when fetching meetings:', error);
    return createJsonResponse({ 
      error: 'FailedToFetchMeetings',
      message: 'An unexpected error occurred',
      details: error.message || 'Unknown error'
    }, 500);
  }
}

// CORS preflight handler
export async function OPTIONS(req) {
  return createJsonResponse({}, 200);
}
