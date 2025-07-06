// Route Service for loading and managing GTFS routes data
export interface GTFSRoute {
  route_id: string;
  agency_id: string;
  route_short_name: string;
  route_long_name: string;
  route_desc: string;
  route_type: string;
  route_url: string;
  route_color: string;
  route_text_color: string;
}

class RouteService {
  private routes: Map<string, GTFSRoute> = new Map();
  private routesByShortName: Map<string, GTFSRoute[]> = new Map();
  private loaded = false;

  async loadRoutes(): Promise<void> {
    if (this.loaded) return;

    try {
      console.log('Loading GTFS routes data...');
      const response = await fetch('/routes.txt');
      
      if (!response.ok) {
        throw new Error(`Failed to load routes.txt: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      
      if (lines.length < 2) {
        throw new Error('Invalid routes.txt format');
      }
      
      // Parse CSV header
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      
      // Parse each route
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = this.parseCSVLine(line);
        if (values.length < 9) continue; // Ensure we have enough columns
        
        const route: GTFSRoute = {
          route_id: values[1], // route_id is second column
          agency_id: values[0], // agency_id is first column
          route_short_name: values[2],
          route_long_name: values[3],
          route_desc: values[5],
          route_type: values[4],
          route_url: values[6],
          route_color: values[7],
          route_text_color: values[8]
        };
        
        // Store by route_id
        this.routes.set(route.route_id, route);
        
        // Store by short name for lookup
        const shortName = route.route_short_name;
        if (shortName) {
          if (!this.routesByShortName.has(shortName)) {
            this.routesByShortName.set(shortName, []);
          }
          this.routesByShortName.get(shortName)!.push(route);
        }
      }
      
      this.loaded = true;
      console.log(`Loaded ${this.routes.size} routes from GTFS data`);
      
    } catch (error) {
      console.error('Error loading routes data:', error);
      // Don't throw - allow app to continue without route data
    }
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  getRouteById(routeId: string): GTFSRoute | null {
    return this.routes.get(routeId) || null;
  }

  getRoutesByShortName(shortName: string): GTFSRoute[] {
    return this.routesByShortName.get(shortName) || [];
  }

  // Find route by short name and agency
  findRoute(shortName: string, agencyId?: string): GTFSRoute | null {
    const routes = this.getRoutesByShortName(shortName);
    
    if (routes.length === 0) return null;
    if (routes.length === 1) return routes[0];
    
    // If multiple routes with same short name, prefer by agency
    if (agencyId) {
      // Map our internal agency IDs to GTFS agency IDs
      const gtfsAgencyId = this.mapToGTFSAgencyId(agencyId);
      const agencyRoute = routes.find(r => r.agency_id === gtfsAgencyId);
      if (agencyRoute) return agencyRoute;
    }
    
    // Default to first route
    return routes[0];
  }

  // Map our internal agency IDs to GTFS agency IDs
  private mapToGTFSAgencyId(agencyId: string): string {
    const agencyMap: Record<string, string> = {
      'king-county-metro': '1',
      'sound-transit': '40',
      'community-transit': '29',
      'pierce-transit': '3',
      'kitsap-transit': '20',
      'intercity-transit': '19',
      'washington-state-ferries': '95',
      'seattle-streetcar': '23',
      'seattle-monorail': '96',
      'everett-transit': '97',
      'amtrak': '51'
    };
    
    return agencyMap[agencyId] || agencyId;
  }

  // Extract route information from GTFS-RT route_id
  parseGTFSRouteId(gtfsRouteId: string): { shortName: string; route: GTFSRoute | null } {
    // First try direct lookup by route_id
    const directRoute = this.getRouteById(gtfsRouteId);
    if (directRoute) {
      return {
        shortName: directRoute.route_short_name,
        route: directRoute
      };
    }
    
    // Try removing agency prefix (common pattern: agency_routeNumber)
    const withoutPrefix = gtfsRouteId.replace(/^[^_]*_/, '');
    const prefixRoute = this.getRouteById(withoutPrefix);
    if (prefixRoute) {
      return {
        shortName: prefixRoute.route_short_name,
        route: prefixRoute
      };
    }
    
    // Try finding by short name
    const byShortName = this.getRoutesByShortName(withoutPrefix);
    if (byShortName.length > 0) {
      return {
        shortName: byShortName[0].route_short_name,
        route: byShortName[0]
      };
    }
    
    // Fallback: return cleaned route ID as short name
    return {
      shortName: withoutPrefix || gtfsRouteId,
      route: null
    };
  }

  // Format route display name
  formatRouteDisplay(route: GTFSRoute): string {
    const shortName = route.route_short_name;
    const longName = route.route_long_name;
    
    // For special routes like streetcars, use the short name as-is
    if (shortName.toLowerCase().includes('streetcar') || 
        shortName.toLowerCase().includes('line') ||
        shortName.toLowerCase().includes('loop') ||
        shortName.toLowerCase().includes('swift') ||
        shortName.toLowerCase().includes('monorail')) {
      return shortName;
    }
    
    // For regular routes, just return the short name (route number)
    return shortName;
  }

  // Get route color for styling
  getRouteColor(route: GTFSRoute): { bg: string; text: string } {
    let bgColor = '#FDB71A'; // Default KCM orange
    let textColor = '#000000'; // Default black text
    
    // Use route-specific colors if available
    if (route.route_color && route.route_color.trim()) {
      bgColor = `#${route.route_color}`;
    } else {
      // Fallback to agency-specific colors
      switch (route.agency_id) {
        case '1': // King County Metro
          bgColor = '#FDB71A';
          textColor = '#000000';
          break;
        case '40': // Sound Transit
          bgColor = '#2B376E';
          textColor = '#FFFFFF';
          break;
        case '29': // Community Transit
          bgColor = '#0070C0';
          textColor = '#FFFFFF';
          break;
        case '3': // Pierce Transit
          bgColor = '#6cb33f';
          textColor = '#000000';
          break;
        case '20': // Kitsap Transit
          bgColor = '#c0504d';
          textColor = '#ffffff';
          break;
        case '19': // Intercity Transit
          bgColor = '#5A8400';
          textColor = '#ffffff';
          break;
        case '95': // WA State Ferries
          bgColor = '#0070c0';
          textColor = '#ffffff';
          break;
        case '23': // Seattle Streetcar
          bgColor = '#F47836';
          textColor = '#FFFFFF';
          break;
        default:
          bgColor = '#FDB71A';
          textColor = '#000000';
      }
    }
    
    if (route.route_text_color && route.route_text_color.trim()) {
      textColor = `#${route.route_text_color}`;
    }
    
    return {
      bg: bgColor,
      text: textColor
    };
  }

  // Check if routes are loaded
  isLoaded(): boolean {
    return this.loaded;
  }

  // Get all routes for an agency
  getRoutesByAgency(agencyId: string): GTFSRoute[] {
    const gtfsAgencyId = this.mapToGTFSAgencyId(agencyId);
    return Array.from(this.routes.values()).filter(route => route.agency_id === gtfsAgencyId);
  }
}

export const routeService = new RouteService();