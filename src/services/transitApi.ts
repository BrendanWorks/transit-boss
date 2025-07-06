import { ServiceAlert, AlertStats } from '../types/alerts';
import { routeService } from './routeService';

// Agency status tracking
interface AgencyStatus {
  name: string;
  hasLiveData: boolean;
  alertCount: number;
  error?: string;
}

class TransitApiService {
  private agencyStatuses: Record<string, AgencyStatus> = {
    'sound-transit': { name: 'Sound Transit', hasLiveData: false, alertCount: 0 },
    'king-county-metro': { name: 'King County Metro', hasLiveData: false, alertCount: 0 },
    'community-transit': { name: 'Community Transit', hasLiveData: false, alertCount: 0 },
    'washington-state-ferries': { name: 'WA State Ferries', hasLiveData: false, alertCount: 0 }
  };

  // GTFS-RT protobuf definitions for parsing
  private gtfsRtRoot: any = null;

  constructor() {
    // Load routes data on initialization
    this.initializeRoutes();
  }

  private async initializeRoutes() {
    try {
      await routeService.loadRoutes();
    } catch (error) {
      console.warn('Failed to load routes data:', error);
    }
  }

  private async initProtobuf() {
    if (this.gtfsRtRoot) return;
    
    try {
      const protobuf = await import('protobufjs');
      
      // Define GTFS-RT protobuf schema inline
      const gtfsRtProto = {
        "nested": {
          "transit_realtime": {
            "nested": {
              "FeedMessage": {
                "fields": {
                  "header": { "type": "FeedHeader", "id": 1 },
                  "entity": { "rule": "repeated", "type": "FeedEntity", "id": 2 }
                }
              },
              "FeedHeader": {
                "fields": {
                  "gtfs_realtime_version": { "type": "string", "id": 1 },
                  "timestamp": { "type": "uint64", "id": 3 }
                }
              },
              "FeedEntity": {
                "fields": {
                  "id": { "type": "string", "id": 1 },
                  "alert": { "type": "Alert", "id": 5 }
                }
              },
              "Alert": {
                "fields": {
                  "active_period": { "rule": "repeated", "type": "TimeRange", "id": 1 },
                  "informed_entity": { "rule": "repeated", "type": "EntitySelector", "id": 5 },
                  "cause": { "type": "Cause", "id": 6 },
                  "effect": { "type": "Effect", "id": 7 },
                  "url": { "type": "TranslatedString", "id": 8 },
                  "header_text": { "type": "TranslatedString", "id": 10 },
                  "description_text": { "type": "TranslatedString", "id": 11 }
                },
                "nested": {
                  "Cause": {
                    "values": {
                      "UNKNOWN_CAUSE": 1,
                      "OTHER_CAUSE": 2,
                      "TECHNICAL_PROBLEM": 3,
                      "STRIKE": 4,
                      "DEMONSTRATION": 5,
                      "ACCIDENT": 6,
                      "HOLIDAY": 7,
                      "WEATHER": 8,
                      "MAINTENANCE": 9,
                      "CONSTRUCTION": 10,
                      "POLICE_ACTIVITY": 11,
                      "MEDICAL_EMERGENCY": 12
                    }
                  },
                  "Effect": {
                    "values": {
                      "NO_SERVICE": 1,
                      "REDUCED_SERVICE": 2,
                      "SIGNIFICANT_DELAYS": 3,
                      "DETOUR": 4,
                      "ADDITIONAL_SERVICE": 5,
                      "MODIFIED_SERVICE": 6,
                      "OTHER_EFFECT": 7,
                      "UNKNOWN_EFFECT": 8,
                      "STOP_MOVED": 9
                    }
                  }
                }
              },
              "TimeRange": {
                "fields": {
                  "start": { "type": "uint64", "id": 1 },
                  "end": { "type": "uint64", "id": 2 }
                }
              },
              "EntitySelector": {
                "fields": {
                  "agency_id": { "type": "string", "id": 1 },
                  "route_id": { "type": "string", "id": 2 },
                  "route_type": { "type": "int32", "id": 3 },
                  "stop_id": { "type": "string", "id": 4 }
                }
              },
              "TranslatedString": {
                "fields": {
                  "translation": { "rule": "repeated", "type": "Translation", "id": 1 }
                },
                "nested": {
                  "Translation": {
                    "fields": {
                      "text": { "type": "string", "id": 1 },
                      "language": { "type": "string", "id": 2 }
                    }
                  }
                }
              }
            }
          }
        }
      };

      this.gtfsRtRoot = protobuf.Root.fromJSON(gtfsRtProto);
      console.log('GTFS-RT protobuf schema initialized');
    } catch (error) {
      console.error('Failed to initialize protobuf:', error);
    }
  }

  private parseTranslatedString(translatedString: any): string {
    if (!translatedString?.translation?.[0]?.text) return '';
    return translatedString.translation[0].text;
  }

  private getAgencyIdForGTFS(agencyId: string): string {
    // Map GTFS agency IDs to our internal agency IDs
    const agencyMap: Record<string, string> = {
      '1': 'king-county-metro',
      '40': 'sound-transit',
      '23': 'king-county-metro', // Seattle streetcars
      // Add more mappings as needed
    };
    
    return agencyMap[agencyId] || agencyId;
  }

  private mapGtfsAlertToServiceAlert(entity: any, agencyId: string): ServiceAlert | null {
    try {
      const alert = entity.alert;
      if (!alert) return null;

      const title = this.parseTranslatedString(alert.header_text) || 'Service Alert';
      const description = this.parseTranslatedString(alert.description_text) || title;
      
      // Map GTFS-RT cause to our alert type
      let alertType: ServiceAlert['alertType'] = 'incident';
      if (alert.cause) {
        switch (alert.cause) {
          case 9: alertType = 'maintenance'; break; // MAINTENANCE
          case 10: alertType = 'maintenance'; break; // CONSTRUCTION
          case 8: alertType = 'weather'; break; // WEATHER
          case 3: case 6: alertType = 'incident'; break; // TECHNICAL_PROBLEM, ACCIDENT
          default: alertType = 'incident';
        }
      }

      // Map GTFS-RT effect to severity and alert type
      let severity: ServiceAlert['severity'] = 'medium';
      if (alert.effect) {
        switch (alert.effect) {
          case 1: // NO_SERVICE
            severity = 'critical';
            alertType = 'cancellation';
            break;
          case 3: // SIGNIFICANT_DELAYS
            severity = 'high';
            alertType = 'delay';
            break;
          case 4: // DETOUR
            severity = 'medium';
            alertType = 'detour';
            break;
          case 2: // REDUCED_SERVICE
            severity = 'medium';
            break;
          default:
            severity = 'low';
        }
      }

      // Extract affected routes using GTFS routes data
      const affectedRoutes: string[] = [];
      const affectedServices: ServiceAlert['affectedServices'] = [];
      
      if (alert.informed_entity) {
        for (const entity of alert.informed_entity) {
          if (entity.route_id) {
            // Use route service to get proper route information
            const { shortName, route } = routeService.parseGTFSRouteId(entity.route_id);
            
            if (route) {
              // Use the proper route display name
              const displayName = routeService.formatRouteDisplay(route);
              if (!affectedRoutes.includes(displayName)) {
                affectedRoutes.push(displayName);
              }
            } else if (shortName) {
              // Fallback to parsed short name
              if (!affectedRoutes.includes(shortName)) {
                affectedRoutes.push(shortName);
              }
            }
          }
          
          // Determine service type based on route_type (GTFS route types)
          if (entity.route_type !== undefined) {
            let serviceType: ServiceAlert['affectedServices'][0];
            switch (entity.route_type) {
              case 0: serviceType = 'streetcar'; break; // Tram/Streetcar
              case 1: serviceType = 'light-rail'; break; // Subway/Metro
              case 2: serviceType = 'commuter-rail'; break; // Rail
              case 3: serviceType = 'bus'; break; // Bus
              case 4: serviceType = 'ferry'; break; // Ferry
              default: serviceType = 'bus';
            }
            if (!affectedServices.includes(serviceType)) {
              affectedServices.push(serviceType);
            }
          }
        }
      }

      // Default values if none found
      if (affectedRoutes.length === 0) affectedRoutes.push('Multiple Routes');
      if (affectedServices.length === 0) {
        // Default service type based on agency
        switch (agencyId) {
          case 'washington-state-ferries':
            affectedServices.push('ferry');
            break;
          case 'sound-transit':
            affectedServices.push('light-rail', 'commuter-rail', 'bus');
            break;
          default:
            affectedServices.push('bus');
        }
      }

      // Parse time ranges
      let startTime = new Date().toISOString();
      let endTime: string | undefined;
      
      if (alert.active_period?.[0]) {
        const period = alert.active_period[0];
        if (period.start) {
          startTime = new Date(Number(period.start) * 1000).toISOString();
        }
        if (period.end) {
          endTime = new Date(Number(period.end) * 1000).toISOString();
        }
      }

      const url = this.parseTranslatedString(alert.url) || this.getAgencyUrl(agencyId);

      return {
        id: `${agencyId}-${entity.id}`,
        title,
        description,
        severity,
        alertType,
        affectedRoutes,
        affectedServices,
        affectedAgencies: [agencyId as ServiceAlert['affectedAgencies'][0]],
        startTime,
        endTime,
        lastUpdated: new Date().toISOString(),
        url,
        isActive: true
      };
    } catch (error) {
      console.error('Error parsing GTFS alert:', error);
      return null;
    }
  }

  private safeParseDate(dateValue: any): string | undefined {
    if (!dateValue) return undefined;
    
    try {
      // Handle different date formats
      let date: Date;
      
      if (typeof dateValue === 'string') {
        // Try parsing as ISO string first
        date = new Date(dateValue);
        
        // If that fails, try other common formats
        if (isNaN(date.getTime())) {
          // Try parsing as a timestamp string
          const timestamp = parseInt(dateValue, 10);
          if (!isNaN(timestamp)) {
            date = new Date(timestamp);
          } else {
            return undefined;
          }
        }
      } else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      } else {
        return undefined;
      }
      
      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date value:', dateValue);
        return undefined;
      }
      
      // Check if date is reasonable (not too far in past or future)
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      if (date < oneYearAgo || date > oneYearFromNow) {
        console.warn('Date outside reasonable range:', dateValue, date);
        return undefined;
      }
      
      return date.toISOString();
    } catch (error) {
      console.warn('Error parsing date:', dateValue, error);
      return undefined;
    }
  }

  private parseWAFerriesBulletin(bulletin: any): ServiceAlert | null {
    try {
      if (!bulletin.BulletinText || !bulletin.BulletinFlag) return null;

      // Strip HTML tags from bulletin text
      const stripHtml = (html: string): string => {
        return html.replace(/<[^>]*>/g, ' ')
                  .replace(/&nbsp;/g, ' ')
                  .replace(/&/g, '&')
                  .replace(/</g, '<')
                  .replace(/>/g, '>')
                  .replace(/"/g, '"')
                  .replace(/\s+/g, ' ')
                  .trim();
      };

      const cleanText = stripHtml(bulletin.BulletinText);
      
      // Extract title (first sentence or first 100 characters)
      const sentences = cleanText.split(/[.!?]+/);
      let title = sentences[0]?.trim() || 'Ferry Service Alert';
      if (title.length > 100) {
        title = title.substring(0, 97) + '...';
      }

      // Use full text as description, but limit length
      let description = cleanText;
      if (description.length > 500) {
        description = description.substring(0, 497) + '...';
      }

      // Determine alert type and severity based on content
      const lowerText = cleanText.toLowerCase();
      let alertType: ServiceAlert['alertType'] = 'incident';
      let severity: ServiceAlert['severity'] = 'medium';

      if (lowerText.includes('cancel') || lowerText.includes('suspend') || lowerText.includes('no service')) {
        alertType = 'cancellation';
        severity = 'critical';
      } else if (lowerText.includes('delay') || lowerText.includes('late') || lowerText.includes('behind schedule')) {
        alertType = 'delay';
        severity = 'high';
      } else if (lowerText.includes('detour') || lowerText.includes('alternate') || lowerText.includes('reroute')) {
        alertType = 'detour';
        severity = 'medium';
      } else if (lowerText.includes('maintenance') || lowerText.includes('repair') || lowerText.includes('construction')) {
        alertType = 'maintenance';
        severity = 'medium';
      } else if (lowerText.includes('weather') || lowerText.includes('wind') || lowerText.includes('fog')) {
        alertType = 'weather';
        severity = 'medium';
      } else if (lowerText.includes('reminder') || lowerText.includes('notice') || lowerText.includes('information')) {
        alertType = 'incident';
        severity = 'low';
      }

      // Extract route information from text
      const affectedRoutes: string[] = [];
      
      // Common ferry route patterns
      const routePatterns = [
        /seattle[- ]?(?:to[- ]?)?bainbridge/i,
        /bainbridge[- ]?(?:to[- ]?)?seattle/i,
        /edmonds[- ]?(?:to[- ]?)?kingston/i,
        /kingston[- ]?(?:to[- ]?)?edmonds/i,
        /mukilteo[- ]?(?:to[- ]?)?clinton/i,
        /clinton[- ]?(?:to[- ]?)?mukilteo/i,
        /fauntleroy[- ]?(?:to[- ]?)?vashon/i,
        /vashon[- ]?(?:to[- ]?)?fauntleroy/i,
        /point[- ]?defiance[- ]?(?:to[- ]?)?tahlequah/i,
        /tahlequah[- ]?(?:to[- ]?)?point[- ]?defiance/i,
        /anacortes/i,
        /san[- ]?juan/i,
        /lopez/i,
        /orcas/i,
        /friday[- ]?harbor/i
      ];

      for (const pattern of routePatterns) {
        const match = cleanText.match(pattern);
        if (match) {
          const route = match[0].replace(/[- ]/g, ' ').replace(/\s+/g, ' ').trim();
          const formattedRoute = route.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
          if (!affectedRoutes.includes(formattedRoute)) {
            affectedRoutes.push(formattedRoute);
          }
        }
      }

      if (affectedRoutes.length === 0) {
        affectedRoutes.push('Ferry Routes');
      }

      // Parse dates safely with validation
      const startTime = this.safeParseDate(bulletin.PublishDate) || new Date().toISOString();
      const endTime = this.safeParseDate(bulletin.ExpireDate);

      return {
        id: `wa-ferries-${bulletin.BulletinID}`,
        title,
        description,
        severity,
        alertType,
        affectedRoutes,
        affectedServices: ['ferry'],
        affectedAgencies: ['washington-state-ferries'],
        startTime,
        endTime,
        lastUpdated: new Date().toISOString(),
        url: 'https://wsdot.wa.gov/travel/washington-state-ferries/service-alerts',
        isActive: true
      };
    } catch (error) {
      console.error('Error parsing WA Ferries bulletin:', error);
      return null;
    }
  }

  private getAgencyUrl(agencyId: string): string {
    switch (agencyId) {
      case 'sound-transit':
        return 'https://www.soundtransit.org/ride-with-us/service-alerts';
      case 'king-county-metro':
        return 'https://kingcounty.gov/en/dept/metro/travel-options/bus/alerts-advisories';
      case 'community-transit':
        return 'https://www.communitytransit.org/alerts';
      case 'washington-state-ferries':
        return 'https://wsdot.wa.gov/travel/washington-state-ferries/service-alerts';
      default:
        return '';
    }
  }

  private createNoAlertsPlaceholder(agencyId: string): ServiceAlert {
    const agencyNames = {
      'sound-transit': 'Sound Transit',
      'king-county-metro': 'King County Metro',
      'community-transit': 'Community Transit',
      'washington-state-ferries': 'Washington State Ferries'
    };

    const serviceTypes = {
      'sound-transit': ['light-rail', 'commuter-rail', 'bus'] as ServiceAlert['affectedServices'],
      'king-county-metro': ['bus'] as ServiceAlert['affectedServices'],
      'community-transit': ['bus'] as ServiceAlert['affectedServices'],
      'washington-state-ferries': ['ferry'] as ServiceAlert['affectedServices']
    };

    return {
      id: `no-alerts-${agencyId}`,
      title: `No ${agencyNames[agencyId as keyof typeof agencyNames]} Service Alerts`,
      description: `All ${agencyNames[agencyId as keyof typeof agencyNames]} services are currently operating normally with no active alerts.`,
      severity: 'low',
      alertType: 'incident',
      affectedRoutes: ['All Routes'],
      affectedServices: serviceTypes[agencyId as keyof typeof serviceTypes] || ['bus'],
      affectedAgencies: [agencyId as ServiceAlert['affectedAgencies'][0]],
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      url: this.getAgencyUrl(agencyId),
      isActive: true
    };
  }

  async fetchSoundTransitAlerts(): Promise<ServiceAlert[]> {
    try {
      console.log('Fetching Sound Transit alerts...');
      
      const response = await fetch('/.netlify/functions/proxy-sound-transit');
      
      if (!response.ok) {
        throw new Error(`Sound Transit proxy error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'Sound Transit API error');
      }
      
      console.log(`Sound Transit response received, ${data.entity?.length || 0} entities`);
      
      if (!data.entity || data.entity.length === 0) {
        this.agencyStatuses['sound-transit'] = {
          name: 'Sound Transit',
          hasLiveData: true,
          alertCount: 0
        };
        return [this.createNoAlertsPlaceholder('sound-transit')];
      }
      
      const alerts: ServiceAlert[] = [];
      
      for (const entity of data.entity) {
        if (entity.alert) {
          const alert = this.mapGtfsAlertToServiceAlert(entity, 'sound-transit');
          if (alert) {
            alerts.push(alert);
          }
        }
      }
      
      this.agencyStatuses['sound-transit'] = {
        name: 'Sound Transit',
        hasLiveData: true,
        alertCount: alerts.length
      };
      
      console.log(`Successfully parsed ${alerts.length} Sound Transit alerts`);
      return alerts.length > 0 ? alerts : [this.createNoAlertsPlaceholder('sound-transit')];
      
    } catch (error) {
      console.error('Error fetching Sound Transit alerts:', error);
      this.agencyStatuses['sound-transit'] = {
        name: 'Sound Transit',
        hasLiveData: false,
        alertCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return [this.createNoAlertsPlaceholder('sound-transit')];
    }
  }

  async fetchKingCountyMetroAlerts(): Promise<ServiceAlert[]> {
    try {
      await this.initProtobuf();
      
      if (!this.gtfsRtRoot) {
        throw new Error('Protobuf not initialized');
      }
      
      console.log('Fetching King County Metro alerts...');
      
      const response = await fetch('/.netlify/functions/proxy-king-county-metro');
      
      if (!response.ok) {
        throw new Error(`King County Metro proxy error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'King County Metro API error');
      }
      
      console.log('King County Metro protobuf data received, decoding...');
      
      // Decode base64 protobuf data
      const binaryData = Uint8Array.from(atob(data.data), c => c.charCodeAt(0));
      console.log(`King County Metro protobuf buffer size: ${binaryData.length}`);
      
      // Parse protobuf
      const FeedMessage = this.gtfsRtRoot.lookupType('transit_realtime.FeedMessage');
      const feedMessage = FeedMessage.decode(binaryData);
      const feedData = FeedMessage.toObject(feedMessage);
      
      console.log('King County Metro decoded feed data:', feedData);
      console.log(`Found ${feedData.entity?.length || 0} King County Metro entities`);
      
      if (!feedData.entity || feedData.entity.length === 0) {
        this.agencyStatuses['king-county-metro'] = {
          name: 'King County Metro',
          hasLiveData: true,
          alertCount: 0
        };
        return [this.createNoAlertsPlaceholder('king-county-metro')];
      }
      
      const alerts: ServiceAlert[] = [];
      
      feedData.entity.forEach((entity: any, index: number) => {
        console.log(`King County Metro entity ${index}:`, entity);
        if (entity.alert) {
          const alert = this.mapGtfsAlertToServiceAlert(entity, 'king-county-metro');
          if (alert) {
            alerts.push(alert);
          }
        }
      });
      
      this.agencyStatuses['king-county-metro'] = {
        name: 'King County Metro',
        hasLiveData: true,
        alertCount: alerts.length
      };
      
      console.log(`Successfully parsed ${alerts.length} King County Metro alerts`);
      return alerts.length > 0 ? alerts : [this.createNoAlertsPlaceholder('king-county-metro')];
      
    } catch (error) {
      console.error('Error fetching King County Metro alerts:', error);
      this.agencyStatuses['king-county-metro'] = {
        name: 'King County Metro',
        hasLiveData: false,
        alertCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return [this.createNoAlertsPlaceholder('king-county-metro')];
    }
  }

  async fetchCommunityTransitAlerts(): Promise<ServiceAlert[]> {
    try {
      await this.initProtobuf();
      
      if (!this.gtfsRtRoot) {
        throw new Error('Protobuf not initialized');
      }
      
      console.log('Fetching Community Transit alerts...');
      
      const response = await fetch('/.netlify/functions/proxy-community-transit');
      
      if (!response.ok) {
        throw new Error(`Community Transit proxy error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'Community Transit API error');
      }
      
      console.log('Community Transit protobuf data received, decoding...');
      
      // Decode base64 protobuf data
      const binaryData = Uint8Array.from(atob(data.data), c => c.charCodeAt(0));
      console.log(`Community Transit protobuf buffer size: ${binaryData.length}`);
      
      // Parse protobuf
      const FeedMessage = this.gtfsRtRoot.lookupType('transit_realtime.FeedMessage');
      const feedMessage = FeedMessage.decode(binaryData);
      const feedData = FeedMessage.toObject(feedMessage);
      
      console.log('Community Transit decoded feed data:', feedData);
      console.log(`Found ${feedData.entity?.length || 0} Community Transit entities`);
      
      if (!feedData.entity || feedData.entity.length === 0) {
        this.agencyStatuses['community-transit'] = {
          name: 'Community Transit',
          hasLiveData: true,
          alertCount: 0
        };
        return [this.createNoAlertsPlaceholder('community-transit')];
      }
      
      const alerts: ServiceAlert[] = [];
      
      feedData.entity.forEach((entity: any, index: number) => {
        console.log(`Community Transit entity ${index}:`, entity);
        if (entity.alert) {
          const alert = this.mapGtfsAlertToServiceAlert(entity, 'community-transit');
          if (alert) {
            alerts.push(alert);
          }
        }
      });
      
      this.agencyStatuses['community-transit'] = {
        name: 'Community Transit',
        hasLiveData: true,
        alertCount: alerts.length
      };
      
      console.log(`Successfully parsed ${alerts.length} Community Transit alerts`);
      return alerts.length > 0 ? alerts : [this.createNoAlertsPlaceholder('community-transit')];
      
    } catch (error) {
      console.error('Error fetching Community Transit alerts:', error);
      this.agencyStatuses['community-transit'] = {
        name: 'Community Transit',
        hasLiveData: false,
        alertCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return [this.createNoAlertsPlaceholder('community-transit')];
    }
  }

  async fetchWAFerriesAlerts(): Promise<ServiceAlert[]> {
    try {
      console.log('Fetching Washington State Ferries alerts...');
      
      const response = await fetch('/.netlify/functions/proxy-wa-ferries');
      
      if (!response.ok) {
        throw new Error(`WA Ferries proxy error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'WA Ferries API error');
      }
      
      console.log('WA Ferries API response:', data);
      
      // Parse the bulletin data
      if (!Array.isArray(data) || data.length === 0) {
        console.log('No WA Ferries bulletins found');
        this.agencyStatuses['washington-state-ferries'] = {
          name: 'Washington State Ferries',
          hasLiveData: true,
          alertCount: 0
        };
        return [this.createNoAlertsPlaceholder('washington-state-ferries')];
      }
      
      const alerts: ServiceAlert[] = [];
      
      for (const bulletin of data) {
        try {
          const alert = this.parseWAFerriesBulletin(bulletin);
          if (alert) {
            alerts.push(alert);
          }
        } catch (error) {
          console.error('Error parsing WA Ferries bulletin:', error);
          // Continue processing other bulletins
        }
      }
      
      this.agencyStatuses['washington-state-ferries'] = {
        name: 'Washington State Ferries',
        hasLiveData: true,
        alertCount: alerts.length
      };
      
      console.log(`Successfully parsed ${alerts.length} WA Ferries alerts from ${data.length} bulletins`);
      return alerts.length > 0 ? alerts : [this.createNoAlertsPlaceholder('washington-state-ferries')];
      
    } catch (error) {
      console.error('Error fetching WA Ferries alerts:', error);
      this.agencyStatuses['washington-state-ferries'] = {
        name: 'Washington State Ferries',
        hasLiveData: false,
        alertCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return [this.createNoAlertsPlaceholder('washington-state-ferries')];
    }
  }

  async fetchAllAlerts(): Promise<ServiceAlert[]> {
    console.log('Fetching all transit alerts...');
    
    // Ensure routes are loaded before processing alerts
    if (!routeService.isLoaded()) {
      await routeService.loadRoutes();
    }
    
    const allAlerts: ServiceAlert[] = [];
    
    // Fetch from all agencies in parallel
    const agencyPromises = [
      this.fetchSoundTransitAlerts(),
      this.fetchKingCountyMetroAlerts(),
      this.fetchCommunityTransitAlerts(),
      this.fetchWAFerriesAlerts()
    ];
    
    const results = await Promise.allSettled(agencyPromises);
    
    results.forEach((result, index) => {
      const agencyNames = ['Sound Transit', 'King County Metro', 'Community Transit', 'WA Ferries'];
      if (result.status === 'fulfilled') {
        allAlerts.push(...result.value);
        console.log(`${agencyNames[index]}: ${result.value.length} alerts loaded`);
      } else {
        console.error(`${agencyNames[index]} failed:`, result.reason);
      }
    });
    
    console.log(`Total alerts loaded: ${allAlerts.length}`);
    return allAlerts;
  }

  getAgencyStatuses(): Record<string, AgencyStatus> {
    return { ...this.agencyStatuses };
  }
}

export const transitApiService = new TransitApiService();