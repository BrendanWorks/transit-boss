# Transit Boss - Generic City Transit Alerts Dashboard

A customizable transit alerts dashboard that can be adapted for any city's public transportation system.

## Features

- Real-time service alerts from multiple transit agencies
- Responsive design optimized for mobile and desktop
- Advanced filtering and search capabilities
- Customizable agency branding and colors
- GTFS-RT and custom API support
- Netlify Functions for API proxying

## Quick Setup for Your City

### 1. Configure Transit Agencies

Edit `src/config/agencies.ts` to define your city's transit agencies:

```typescript
export const AGENCIES = {
  'your-metro': {
    name: 'Your City Metro',
    color: 'bg-blue-600 text-white',
    services: ['bus', 'light-rail'],
    apiUrl: 'https://api.yourcity.gov/gtfs-rt/alerts',
    websiteUrl: 'https://yourcity.gov/transit/alerts'
  },
  // Add more agencies...
};
```

### 2. Update API Endpoints

Create Netlify functions in `netlify/functions/` for each agency's API.

### 3. Customize Branding

- Replace favicon and logo files in `public/`
- Update colors in `tailwind.config.js`
- Modify app title in `index.html`

### 4. Deploy

```bash
npm run build
# Deploy to Netlify or your preferred platform
```

## Development

```bash
npm install
npm run dev
```

## API Integration

The app supports:
- GTFS-RT protobuf feeds
- JSON REST APIs
- Custom data formats

See `src/services/transitApi.ts` for implementation examples.

## License

MIT License - Feel free to adapt for your city's needs.