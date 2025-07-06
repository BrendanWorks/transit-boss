# Transit Boss Customization Guide

This guide will help you adapt Transit Boss for your city's transit system.

## Quick Start Checklist

### 1. Configure Your City's Agencies

Edit `src/config/agencies.ts`:

```typescript
export const AGENCIES: Record<string, AgencyConfig> = {
  'your-metro': {
    name: 'Your City Metro',
    shortName: 'Metro',
    color: 'bg-blue-600',
    textColor: 'text-white',
    services: ['bus', 'light-rail'],
    websiteUrl: 'https://yourcitymetro.gov',
    alertsUrl: 'https://yourcitymetro.gov/alerts',
    logoText: 'METRO'
  },
  // Add more agencies...
};

export const CITY_CONFIG = {
  name: 'Your City',
  region: 'Metropolitan Area',
  timezone: 'America/Your_Timezone'
};
```

### 2. Update App Configuration

Edit `src/config/app.ts`:

```typescript
export const APP_CONFIG = {
  name: 'Your City Transit Boss',
  subtitle: 'Your City Transit Alerts Dashboard',
  description: 'Real-time service alerts for Your City public transportation',
  // ... other settings
};
```

### 3. Create API Proxy Functions

For each agency, create a Netlify function in `netlify/functions/`:

1. Copy `netlify/functions/proxy-generic-agency.js`
2. Rename to `proxy-your-agency-id.js`
3. Update the API_URL and other settings
4. Set environment variables in Netlify dashboard

### 4. Update Branding

- Replace `public/favicon.ico` with your city's favicon
- Update `index.html` title and meta tags
- Customize colors in `tailwind.config.js`

### 5. Test and Deploy

```bash
npm install
npm run dev  # Test locally
npm run build  # Build for production
```

## Detailed Customization

### Agency Configuration

Each agency in `AGENCIES` supports:

- `name`: Full agency name
- `shortName`: Abbreviated name
- `color`: Tailwind CSS background color class
- `textColor`: Tailwind CSS text color class
- `services`: Array of service types
- `websiteUrl`: Agency website
- `alertsUrl`: Direct link to agency alerts page
- `logoText`: Text to display in logo
- `useIcon`: Whether to use service icon instead of text

### API Integration

The app supports multiple API formats:

#### GTFS-RT Protobuf
```javascript
// In your Netlify function
const response = await fetch('https://api.agency.gov/gtfs-rt/alerts.pb');
const buffer = await response.arrayBuffer();
// Return as base64 with type: 'protobuf'
```

#### GTFS-RT JSON
```javascript
// Return JSON directly
const data = await response.json();
return { statusCode: 200, body: JSON.stringify(data) };
```

#### Custom JSON Format
The `parseCustomAlert` method in `genericTransitApi.ts` can be customized for your API format.

### Color Customization

Update `tailwind.config.js` to match your city's brand colors:

```javascript
theme: {
  extend: {
    colors: {
      'city-primary': {
        50: '#f0f9ff',
        500: '#0ea5e9',
        900: '#0c4a6e',
      },
      // Add more color scales
    }
  }
}
```

### Service Types

Add new service types in `src/config/agencies.ts`:

```typescript
export const SERVICE_TYPES = {
  bus: { name: 'Bus', icon: 'Bus' },
  'light-rail': { name: 'Light Rail', icon: 'Train' },
  'your-service': { name: 'Your Service', icon: 'YourIcon' },
};
```

### Environment Variables

Set these in your Netlify dashboard:

- `YOUR_AGENCY_API_KEY`: API key for your transit agency
- `ANOTHER_AGENCY_TOKEN`: Token for another agency
- Any other API credentials needed

### Mock Data for Development

The app includes mock data generation. Customize `generateMockAlerts()` in `genericTransitApi.ts` for realistic test data.

## Common API Patterns

### Pattern 1: GTFS-RT with API Key
```javascript
const response = await fetch(`${API_URL}?api_key=${API_KEY}`);
```

### Pattern 2: Bearer Token Authentication
```javascript
const response = await fetch(API_URL, {
  headers: { 'Authorization': `Bearer ${TOKEN}` }
});
```

### Pattern 3: Custom Headers
```javascript
const response = await fetch(API_URL, {
  headers: { 
    'X-API-Key': API_KEY,
    'User-Agent': 'YourApp/1.0'
  }
});
```

## Deployment

### Netlify (Recommended)
1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy

### Other Platforms
The app is a standard Vite React app and can be deployed to:
- Vercel
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting service

Note: You'll need to adapt the Netlify Functions to your platform's serverless functions.

## Troubleshooting

### CORS Issues
Make sure your Netlify functions include proper CORS headers.

### API Rate Limits
Implement caching and respect rate limits in your proxy functions.

### Protobuf Parsing
Ensure your GTFS-RT feeds follow the standard specification.

### Missing Alerts
Check browser console for API errors and verify your proxy functions are working.

## Support

- Check the GitHub issues for common problems
- Review the original Transit Boss implementation for examples
- Test with mock data first before connecting live APIs

## Contributing

If you create a successful implementation for your city, consider:
- Sharing your configuration as an example
- Contributing improvements back to the main project
- Documenting any unique API patterns you encountered