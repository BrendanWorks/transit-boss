// Application Configuration
// Customize these settings for your city

export const APP_CONFIG = {
  // App Identity
  name: 'Transit Boss',
  subtitle: 'City Transit Alerts Dashboard',
  description: 'Real-time service alerts for your city\'s public transportation',
  
  // Branding
  primaryColor: '#0066cc',
  secondaryColor: '#00aa44',
  
  // Features
  features: {
    autoRefresh: true,
    refreshInterval: 3 * 60 * 1000, // 3 minutes
    showOlderAlerts: true,
    maxOlderAlertsDays: 7,
    enableNotifications: false, // Future feature
    enableFavorites: false, // Future feature
  },
  
  // Data Sources
  dataSources: {
    gtfsRt: true,
    customApi: true,
    mockData: true // For development/fallback
  },
  
  // UI Settings
  ui: {
    defaultView: 'detailed', // 'detailed' | 'condensed'
    showAgencyLogos: true,
    showServiceIcons: true,
    enableDarkMode: false, // Future feature
    maxAlertsPerPage: 50
  },
  
  // Contact/Support
  contact: {
    email: 'support@transitboss.app',
    website: 'https://transitboss.app',
    github: 'https://github.com/yourusername/transit-boss'
  }
};

// Environment-specific settings
export const getEnvironmentConfig = () => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  return {
    isDevelopment,
    isProduction,
    apiBaseUrl: isDevelopment 
      ? 'http://localhost:8888/.netlify/functions'
      : '/.netlify/functions',
    enableDebugLogs: isDevelopment,
    enableMockData: isDevelopment
  };
};