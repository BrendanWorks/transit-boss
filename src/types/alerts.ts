export interface ServiceAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  alertType: 'delay' | 'cancellation' | 'detour' | 'maintenance' | 'weather' | 'incident';
  affectedRoutes: string[];
  affectedServices: ('bus' | 'light-rail' | 'commuter-rail' | 'ferry' | 'streetcar')[];
  affectedAgencies: ('community-transit' | 'king-county-metro' | 'link-light-rail' | 'sound-transit' | 'washington-state-ferries')[];
  startTime: string;
  endTime?: string;
  lastUpdated: string;
  url?: string;
  isActive: boolean;
}

export interface AlertFilters {
  severity: string[];
  alertType: string[];
  services: string[];
  agencies: string[];
  searchQuery: string;
  showOlderAlerts: boolean;
}

export interface AlertStats {
  total: number;
  active: number;
  byService: Record<string, number>;
  bySeverity: Record<string, number>;
  byAgency: Record<string, number>;
}