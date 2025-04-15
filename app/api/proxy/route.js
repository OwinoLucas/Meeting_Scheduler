// API route to serve as a CORS proxy for Google OAuth requests that might be blocked
// This can help with network connectivity issues by proxying the requests through our server

export async function POST(request) {
  try {
    const { url, options } = await request.json();
    
    // Only allow proxying to Google domains for security
    if (!url.includes('google.com') && !url.includes('googleapis.com')) {
      return Response.json(
        { error: 'Only Google API requests are supported' }, 
        { status: 400 }
      );
    }
    
    console.log(`Proxying request to: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const fetchOptions = {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
    
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json(
      { error: error.message || 'Failed to proxy request' }, 
      { status: 500 }
    );
  }
}

