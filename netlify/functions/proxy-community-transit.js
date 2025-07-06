export const handler = async (event, context) => {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    console.log('Proxying Community Transit API request...');
    
    // Fetch from Community Transit API (protobuf format)
    const response = await fetch('https://s3.amazonaws.com/commtrans-realtime-prod/alerts.pb', {
      method: 'GET',
      headers: {
        'User-Agent': 'TransitBoss/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Community Transit API error: ${response.status}`);
    }

    // Get the response as ArrayBuffer since it's protobuf
    const buffer = await response.arrayBuffer();
    
    console.log(`Successfully proxied Community Transit API, got ${buffer.byteLength} bytes`);

    // Convert ArrayBuffer to base64 for JSON transport
    const uint8Array = new Uint8Array(buffer);
    const base64 = btoa(String.fromCharCode(...uint8Array));

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: base64,
        type: 'protobuf'
      }),
    };
  } catch (error) {
    console.error('Error proxying Community Transit API:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch Community Transit alerts',
        message: error.message 
      }),
    };
  }
};