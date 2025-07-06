# Software Bill of Materials (SBOM)
## Transit Boss - Real-time Transit Alerts Dashboard

**Version:** 1.0.0  
**Generated:** January 27, 2025  
**Contact:** pugetsoundtransitboss@gmail.com  
**Website:** https://transitboss.org

---

## Application Overview

Transit Boss is a real-time transit alerts dashboard that aggregates service information from multiple Puget Sound regional transportation agencies. The application provides a unified interface for viewing bus, light rail, commuter rail, and ferry service disruptions.

## Runtime Dependencies

### Core Framework & Libraries
| Component | Version | License | Purpose |
|-----------|---------|---------|---------|
| React | 18.3.1 | MIT | UI framework |
| React DOM | 18.3.0 | MIT | DOM rendering |
| Lucide React | 0.344.0 | ISC | Icon library |
| ProtoBuf.js | 7.2.5 | BSD-3-Clause | GTFS-RT data parsing |

### Development Dependencies
| Component | Version | License | Purpose |
|-----------|---------|---------|---------|
| Vite | 5.4.2 | MIT | Build tool |
| TypeScript | 5.5.3 | Apache-2.0 | Type checking |
| Tailwind CSS | 3.4.1 | MIT | Styling framework |
| ESLint | 9.9.1 | MIT | Code linting |
| Autoprefixer | 10.4.18 | MIT | CSS vendor prefixes |
| PostCSS | 8.4.35 | MIT | CSS processing |
| Netlify CLI | 17.0.0 | MIT | Deployment tool |

## External Services & APIs

### Transit Data Sources
| Service | Provider | Authentication | Data Format |
|---------|----------|----------------|-------------|
| Sound Transit API | Sound Transit | None | GTFS-RT JSON |
| King County Metro API | King County Metro | None | GTFS-RT Protobuf |
| Community Transit API | Community Transit | None | GTFS-RT Protobuf |
| WA State Ferries API | WSDOT | API Key | Custom JSON |

### Infrastructure Services
| Service | Provider | Purpose |
|---------|----------|---------|
| Netlify Functions | Netlify | API proxying |
| Netlify CDN | Netlify | Static hosting |

## Data Flow & Security

### Trust Boundaries
1. **Client Application** → Netlify Functions (Internal)
2. **Netlify Functions** → External Transit APIs (External)
3. **Client Browser** → Netlify CDN (External)

### Data Processing
- All external API calls are proxied through Netlify Functions
- GTFS-RT protobuf data is decoded client-side
- No user data is collected or stored
- All transit data is public information

## File Structure

### Source Code
```
src/
├── components/          # React UI components
├── hooks/              # Custom React hooks
├── services/           # API and data services
├── types/              # TypeScript type definitions
├── config/             # Application configuration
└── utils/              # Utility functions
```

### Configuration Files
```
netlify/functions/      # Serverless function proxies
public/                 # Static assets
├── routes.txt         # GTFS routes data
└── *.png, *.svg       # Agency logos and icons
```

## Compliance & Licensing

### Open Source Licenses
- **MIT License**: React, Vite, Tailwind CSS, ESLint, PostCSS, Autoprefixer, Netlify CLI
- **ISC License**: Lucide React
- **BSD-3-Clause**: ProtoBuf.js
- **Apache-2.0**: TypeScript

### Data Sources
- All transit data is sourced from public APIs
- GTFS-RT feeds comply with Google Transit specifications
- No proprietary or confidential data is used

## Security Considerations

### API Security
- All external API calls are proxied to prevent CORS issues
- API keys are stored as environment variables in Netlify
- No sensitive data is exposed to the client

### Client Security
- No user authentication or data collection
- All data processing happens client-side
- Content Security Policy headers recommended for production

## Deployment Information

### Build Process
1. TypeScript compilation
2. Vite bundling and optimization
3. Tailwind CSS purging
4. Static asset optimization

### Runtime Environment
- **Platform**: Netlify (Jamstack)
- **Node.js Version**: 18.x (for functions)
- **Browser Support**: Modern browsers with ES2020 support

---

**Disclaimer**: This is a personal prototype not affiliated with any transit agency. For official transit information, please visit the respective agency websites.

**Copyright**: © 2025 Brendan Works