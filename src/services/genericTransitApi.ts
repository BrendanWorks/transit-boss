import { ServiceAlert } from '../types/alerts';
import { AGENCIES, CITY_CONFIG } from '../config/agencies';
import { APP_CONFIG, getEnvironmentConfig } from '../config/app';

// Generic Transit API Service
// This service can be adapted for any city's transit APIs

interface AgencyStatus {
  name: string;
  hasLiveData: boolean;
  alertCount: number;
  error?: string;
}

class GenericTransitApiService {
  private agencyStatuses: Record<string, AgencyStatus> = {};
  private gtfsRtRoot: any = null;

  constructor() {
    // Initialize agency statuses
    Object.keys(AGENCIES).forEach(agencyId => {
      this.agencyStatuses[agencyId] = {
        name: AGENCIES[agencyId].name,
        hasLiveData: false,
        alertCount: 0
      };
    });
  }

  private async initProtobuf() {
    if (this.gtfsRtRoot) return;
    
    try {
      const protobuf = await import('protobufjs');
      
      // GTFS-RT protobuf schema (same as original)
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

  private mapGtfsAlertToServiceAlert(entity: any, agencyId: string): ServiceAlert | null {
    try {
      const alert = entity.alert;
      if (!alert) return null;

      const title = this.parseTranslatedString(alert.header_text) || 'Service Alert';
      const description = this.parseTranslatedString(alert.description_text) || title;
      
      // Map GTFS-RT cause to alert type
      let alertType: ServiceAlert['alertType'] = 'incident';
      if (alert.cause) {
        switch (alert.cause) {
          case 9: alertType = 'maintenance'; break;
          case 10: alertType = 'maintenance'; break;
          case 8: alertType = 'weather'; break;
          case 3: case 6: alertType = 'incident'; break;
          default: alertType = 'incident';
        }
      }

      // Map GTFS-RT effect to severity
      let severity: ServiceAlert['severity'] = 'medium';
      if (alert.effect) {
        switch (alert.effect) {
          case 1: severity = 'critical'; alertType = 'cancellation'; break;
          case 3: severity = 'high'; alertType = 'delay'; break;
          case 4: severity = 'medium'; alertType = 'detour'; break;
          case 2: severity = 'medium'; break;
          default: severity = 'low';
        }
      }

      // Extract routes and services
      const affectedRoutes: string[] = [];
      const affectedServices = [...AGENCIES[agencyId].services];
      
      if (alert.informed_entity) {
        for (const entity of alert.informed_entity) {
          if (entity.route_id) {
            const routeId = entity.route_id.replace(/^[^_]*_/, '');
            if (!affectedRoutes.includes(routeId)) {
              affectedRoutes.push(routeId);
            }
          }
        }
      }

      if (affectedRoutes.length === 0) affectedRoutes.push('Multiple Routes');

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

      const url = this.parseTranslatedString(alert.url) || AGENCIES[agencyId].alertsUrl;

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

  private createNoAlertsPlaceholder(agencyId: string): ServiceAlert {
    const agency = AGENCIES[agencyId];
    
    return {
      id: `no-alerts-${agencyId}`,
      title: `No ${agency.name} Service Alerts`,
      description: `All ${agency.name} services are currently operating normally with no active alerts.`,
      severity: 'low',
      alertType: 'incident',
      affectedRoutes: ['All Routes'],
      affectedServices: agency.services,
      affectedAgencies: [agencyId as ServiceAlert['affectedAgencies'][0]],
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      url: agency.alertsUrl,
      isActive: true
    };
  }

  // Generic method to fetch alerts from any agency
  async fetchAgencyAlerts(agencyId: string): Promise<ServiceAlert[]> {
    try {
      const agency = AGENCIES[agencyId];
      if (!agency) {
        throw new Error(`Unknown agency: ${agencyId}`);
      }

      console.log(`Fetching ${agency.name} alerts...`);
      
      // Try to fetch from Netlify function proxy
      const response = await fetch(`/.netlify/functions/proxy-${agencyId}`);
      
      if (!response.ok) {
        throw new Error(`${agency.name} proxy error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || `${agency.name} API error`);
      }
      
      let alerts: ServiceAlert[] = [];
      
      // Handle different data formats
      if (data.type === 'protobuf') {
        // GTFS-RT protobuf data
        await this.initProtobuf();
        if (this.gtfsRtRoot) {
          const binaryData = Uint8Array.from(atob(data.data), c => c.charCodeAt(0));
          const FeedMessage = this.gtfsRtRoot.lookupType('transit_realtime.FeedMessage');
          const feedMessage = FeedMessage.decode(binaryData);
          const feedData = FeedMessage.toObject(feedMessage);
          
          if (feedData.entity) {
            feedData.entity.forEach((entity: any) => {
              if (entity.alert) {
                const alert = this.mapGtfsAlertToServiceAlert(entity, agencyId);
                if (alert) alerts.push(alert);
              }
            });
          }
        }
      } else if (Array.isArray(data)) {
        // JSON array format
        alerts = data.map((item: any) => this.parseCustomAlert(item, agencyId)).filter(Boolean);
      } else if (data.entity) {
        // GTFS-RT JSON format
        alerts = data.entity.map((entity: any) => {
          if (entity.alert) {
            return this.mapGtfsAlertToServiceAlert(entity, agencyId);
          }
          return null;
        }).filter(Boolean);
      }
      
      this.agencyStatuses[agencyId] = {
        name: agency.name,
        hasLiveData: true,
        alertCount: alerts.length
      };
      
      console.log(`Successfully parsed ${alerts.length} ${agency.name} alerts`);
      return alerts.length > 0 ? alerts : [this.createNoAlertsPlaceholder(agencyId)];
      
    } catch (error) {
      console.error(`Error fetching ${agencyId} alerts:`, error);
      this.agencyStatuses[agencyId] = {
        name: AGENCIES[agencyId]?.name || agencyId,
        hasLiveData: false,
        alertCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return [this.createNoAlertsPlaceholder(agencyId)];
    }
  }

  // Parse custom alert formats (override this for your city's specific API)
  private parseCustomAlert(alertData: any, agencyId: string): ServiceAlert | null {
    // This is a generic parser - customize for your city's API format
    try {
      return {
        id: `${agencyId}-${alertData.id || Date.now()}`,
        title: alertData.title || alertData.summary || 'Service Alert',
        description: alertData.description || alertData.details || alertData.title,
        severity: this.mapSeverity(alertData.severity || alertData.priority),
        alertType: this.mapAlertType(alertData.type || alertData.category),
        affectedRoutes: alertData.routes || alertData.affectedRoutes || ['Multiple Routes'],
        affectedServices: AGENCIES[agencyId].services,
        affectedAgencies: [agencyId as ServiceAlert['affectedAgencies'][0]],
        startTime: alertData.startTime || alertData.created || new Date().toISOString(),
        endTime: alertData.endTime || alertData.expires,
        lastUpdated: alertData.updated || new Date().toISOString(),
        url: alertData.url || AGENCIES[agencyId].alertsUrl,
        isActive: alertData.active !== false
      };
    } catch (error) {
      console.error('Error parsing custom alert:', error);
      return null;
    }
  }

  private mapSeverity(severity: any): ServiceAlert['severity'] {
    if (typeof severity === 'string') {
      const s = severity.toLowerCase();
      if (s.includes('critical') || s.includes('emergency')) return 'critical';
      if (s.includes('high') || s.includes('major')) return 'high';
      if (s.includes('medium') || s.includes('moderate')) return 'medium';
      if (s.includes('low') || s.includes('minor')) return 'low';
    }
    return 'medium';
  }

  private mapAlertType(type: any): ServiceAlert['alertType'] {
    if (typeof type === 'string') {
      const t = type.toLowerCase();
      if (t.includes('delay')) return 'delay';
      if (t.includes('cancel')) return 'cancellation';
      if (t.includes('detour') || t.includes('reroute')) return 'detour';
      if (t.includes('maintenance') || t.includes('construction')) return 'maintenance';
      if (t.includes('weather')) return 'weather';
    }
    return 'incident';
  }

  // Fetch all alerts from all configured agencies
  async fetchAllAlerts(): Promise<ServiceAlert[]> {
    console.log(`Fetching all transit alerts for ${CITY_CONFIG.name}...`);
    
    const allAlerts: ServiceAlert[] = [];
    const agencyIds = Object.keys(AGENCIES);
    
    // Fetch from all agencies in parallel
    const agencyPromises = agencyIds.map(agencyId => this.fetchAgencyAlerts(agencyId));
    const results = await Promise.allSettled(agencyPromises);
    
    results.forEach((result, index) => {
      const agencyId = agencyIds[index];
      const agencyName = AGENCIES[agencyId].name;
      
      if (result.status === 'fulfilled') {
        allAlerts.push(...result.value);
        console.log(`${agencyName}: ${result.value.length} alerts loaded`);
      } else {
        console.error(`${agencyName} failed:`, result.reason);
      }
    });
    
    console.log(`Total alerts loaded: ${allAlerts.length}`);
    return allAlerts;
  }

  getAgencyStatuses(): Record<string, AgencyStatus> {
    return { ...this.agencyStatuses };
  }

  // Generate mock data for development/testing
  generateMockAlerts(): ServiceAlert[] {
    const mockAlerts: ServiceAlert[] = [];
    const agencyIds = Object.keys(AGENCIES);
    
    agencyIds.forEach(agencyId => {
      const agency = AGENCIES[agencyId];
      
      // Generate 1-3 mock alerts per agency
      const alertCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < alertCount; i++) {
        const severities: ServiceAlert['severity'][] = ['low', 'medium', 'high', 'critical'];
        const alertTypes: ServiceAlert['alertType'][] = ['delay', 'cancellation', 'detour', 'maintenance', 'weather', 'incident'];
        
        mockAlerts.push({
          id: `mock-${agencyId}-${i}`,
          title: `${agency.name} Service Alert ${i + 1}`,
          description: `This is a mock alert for ${agency.name}. In a real implementation, this would contain actual service disruption information.`,
          severity: severities[Math.floor(Math.random() * severities.length)],
          alertType: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          affectedRoutes: [`Route ${Math.floor(Math.random() * 100) + 1}`, `Route ${Math.floor(Math.random() * 100) + 1}`],
          affectedServices: agency.services,
          affectedAgencies: [agencyId as ServiceAlert['affectedAgencies'][0]],
          startTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          lastUpdated: new Date().toISOString(),
          url: agency.alertsUrl,
          isActive: true
        });
      }
    });
    
    return mockAlerts;
  }
}

export const genericTransitApiService = new GenericTransitApiService();