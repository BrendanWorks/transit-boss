// Transit Agency Configuration
// Customize this file for your city's transit system

export interface AgencyConfig {
  name: string;
  shortName: string;
  color: string;
  textColor?: string;
  services: ('bus' | 'light-rail' | 'commuter-rail' | 'ferry' | 'streetcar' | 'subway')[];
  apiUrl?: string;
  websiteUrl: string;
  alertsUrl: string;
  logoText?: string;
  useIcon?: boolean;
}

// Example configuration - Replace with your city's agencies
export const AGENCIES: Record<string, AgencyConfig> = {
  'city-metro': {
    name: 'City Metro Transit',
    shortName: 'Metro',
    color: 'bg-blue-600',
    textColor: 'text-white',
    services: ['bus', 'light-rail'],
    websiteUrl: 'https://citymetro.gov',
    alertsUrl: 'https://citymetro.gov/alerts',
    logoText: 'METRO',
    useIcon: false
  },
  'regional-rail': {
    name: 'Regional Rail Authority',
    shortName: 'Rail',
    color: 'bg-green-600',
    textColor: 'text-white',
    services: ['commuter-rail', 'light-rail'],
    websiteUrl: 'https://regionalrail.gov',
    alertsUrl: 'https://regionalrail.gov/service-alerts',
    logoText: 'RAIL',
    useIcon: false
  },
  'city-bus': {
    name: 'City Bus System',
    shortName: 'Bus',
    color: 'bg-orange-600',
    textColor: 'text-white',
    services: ['bus'],
    websiteUrl: 'https://citybus.gov',
    alertsUrl: 'https://citybus.gov/alerts',
    logoText: 'BUS',
    useIcon: false
  }
};

// City Configuration
export const CITY_CONFIG = {
  name: 'Your City',
  region: 'Metropolitan Area',
  timezone: 'America/New_York', // Update to your timezone
  defaultAgencies: Object.keys(AGENCIES)
};

// Service Type Configuration
export const SERVICE_TYPES = {
  bus: { name: 'Bus', icon: 'Bus' },
  'light-rail': { name: 'Light Rail', icon: 'Train' },
  'commuter-rail': { name: 'Commuter Rail', icon: 'Train' },
  ferry: { name: 'Ferry', icon: 'Ship' },
  streetcar: { name: 'Streetcar', icon: 'Zap' },
  subway: { name: 'Subway', icon: 'Train' }
};

// Alert Type Configuration
export const ALERT_TYPES = {
  delay: { name: 'Delays', severity: 'medium' },
  cancellation: { name: 'Cancellations', severity: 'high' },
  detour: { name: 'Detours', severity: 'medium' },
  maintenance: { name: 'Maintenance', severity: 'low' },
  weather: { name: 'Weather', severity: 'medium' },
  incident: { name: 'Incidents', severity: 'high' },
  'service-change': { name: 'Service Changes', severity: 'low' }
};

// Severity Configuration
export const SEVERITY_CONFIG = {
  low: {
    name: 'Low',
    color: 'green',
    bgColor: 'bg-green-50 border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600',
    badgeColor: 'bg-green-100 text-green-800'
  },
  medium: {
    name: 'Medium',
    color: 'yellow',
    bgColor: 'bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
    badgeColor: 'bg-yellow-100 text-yellow-800'
  },
  high: {
    name: 'High',
    color: 'red',
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
    badgeColor: 'bg-red-100 text-red-800'
  },
  critical: {
    name: 'Critical',
    color: 'red',
    bgColor: 'bg-red-50 border-red-300',
    textColor: 'text-red-900',
    iconColor: 'text-red-700',
    badgeColor: 'bg-red-200 text-red-900'
  }
};