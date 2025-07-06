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
    console.log('Proxying Sound Transit API request...');
    
    // Fetch from Sound Transit API
    const response = await fetch('https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json', {
      method: 'GET',
      headers: {
        'User-Agent': 'TransitBoss/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Sound Transit API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`Successfully proxied Sound Transit API, got ${data.entity?.length || 0} entities`);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error proxying Sound Transit API:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch Sound Transit alerts',
        message: error.message 
      }),
    };
  }
};