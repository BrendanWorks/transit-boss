const { Buffer } = require('buffer');

// Generic Netlify Function Template for Transit API Proxying
// Copy and customize this file for each of your city's transit agencies

exports.handler = async (event, context) => {
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
    // CUSTOMIZE THESE VALUES FOR YOUR AGENCY
    const AGENCY_NAME = 'Your Transit Agency';
    const API_URL = 'https://api.yourtransit.gov/gtfs-rt/alerts'; // Replace with actual API URL
    const API_KEY = process.env.YOUR_AGENCY_API_KEY; // Set in Netlify environment variables
    
    console.log(`Proxying ${AGENCY_NAME} API request...`);
    
    // Build request headers
    const headers = {
      'User-Agent': 'TransitBoss/1.0',
    };
    
    // Add API key if required
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
      // Or use query parameter: API_URL += `?api_key=${API_KEY}`;
    }
    
    const response = await fetch(API_URL, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`${AGENCY_NAME} API error: ${response.status}`);
    }

    // Determine response type
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-protobuf') || contentType.includes('application/octet-stream')) {
      // Handle protobuf response
      const buffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      const base64 = Buffer.from(uint8Array).toString('base64');

      console.log(`Successfully proxied ${AGENCY_NAME} protobuf API, got ${buffer.byteLength} bytes`);

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
    } else {
      // Handle JSON response
      const data = await response.json();
      
      console.log(`Successfully proxied ${AGENCY_NAME} JSON API, got ${Array.isArray(data) ? data.length : 'object'} items`);

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      };
    }
  } catch (error) {
    console.error(`Error proxying ${AGENCY_NAME || 'agency'} API:`, error);
    
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: `Failed to fetch ${AGENCY_NAME || 'agency'} alerts`,
        message: error.message 
      }),
    };
  }
};