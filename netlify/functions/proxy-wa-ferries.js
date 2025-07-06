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
    console.log('Proxying Washington State Ferries API request...');
    
    // Use the access code to call the actual alerts endpoint
    const apiAccessCode = '53228bb9-1eed-498f-a3c1-0f039e452bd8';
    const apiUrl = `https://www.wsdot.wa.gov/ferries/api/schedule/rest/alerts?apiaccesscode=${apiAccessCode}`;
    
    console.log('Calling WA Ferries API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'TransitBoss/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`WA Ferries API error: ${response.status} ${response.statusText}`);
      throw new Error(`WA Ferries API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('WA Ferries API response received:', {
      type: typeof data,
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : 'N/A',
      keys: typeof data === 'object' ? Object.keys(data) : 'N/A'
    });
    
    // Log the first few items to understand the structure
    if (Array.isArray(data) && data.length > 0) {
      console.log('First WA Ferries alert:', data[0]);
    } else if (typeof data === 'object') {
      console.log('WA Ferries response structure:', data);
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error proxying WA Ferries API:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch WA Ferries alerts',
        message: error.message 
      }),
    };
  }
};