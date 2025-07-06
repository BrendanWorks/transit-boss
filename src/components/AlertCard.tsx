import React, { useState, useRef, useEffect } from 'react';
import { ServiceAlert } from '../types/alerts';
import { routeService } from '../services/routeService';
import { 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  Bus, 
  Train, 
  Ship,
  Zap,
  Calendar,
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AgencyLogo } from './AgencyLogo';

interface AlertCardProps {
  alert: ServiceAlert;
  isCondensed?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const severityConfig = {
  low: {
    bgColor: 'bg-green-50 border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600',
    badgeColor: 'bg-green-100 text-green-800',
    condensedBg: 'bg-green-100',
    condensedBorder: 'border-green-300'
  },
  medium: {
    bgColor: 'bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    condensedBg: 'bg-yellow-100',
    condensedBorder: 'border-yellow-300'
  },
  high: {
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
    badgeColor: 'bg-red-100 text-red-800',
    condensedBg: 'bg-red-100',
    condensedBorder: 'border-red-300'
  },
  critical: {
    bgColor: 'bg-red-50 border-red-300',
    textColor: 'text-red-900',
    iconColor: 'text-red-700',
    badgeColor: 'bg-red-200 text-red-900',
    condensedBg: 'bg-red-200',
    condensedBorder: 'border-red-400'
  }
};

const serviceIcons = {
  bus: Bus,
  'light-rail': Train,
  'commuter-rail': Train,
  ferry: Ship,
  streetcar: Zap
};

const agencyColors = {
  'community-transit': 'bg-ct-blue-500 text-white',
  'king-county-metro': 'bg-kcm-navy-800 text-kcm-orange-500',
  'link-light-rail': 'bg-ct-green-100 text-ct-green-800',
  'sound-transit': 'bg-st-blue-800 text-white',
  'everett-transit': 'bg-et-red-500 text-black',
  'washington-state-ferries': 'bg-wsf-green-800 text-white'
};

// Updated agency URLs to point to correct alert centers
const agencyUrls = {
  'community-transit': 'https://www.communitytransit.org/alerts',
  'king-county-metro': 'https://kingcounty.gov/en/dept/metro/travel-options/bus/alerts-advisories',
  'sound-transit': 'https://www.soundtransit.org/ride-with-us/service-alerts',
  'everett-transit': 'https://www.everetttransit.org/alertcenter.aspx',
  'washington-state-ferries': 'https://wsdot.wa.gov/travel/washington-state-ferries/service-alerts'
};

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatDuration = (startTime: string, endTime?: string) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Less than 1 hour';
  if (diffHours === 1) return '1 hour';
  return `${diffHours} hours`;
};

const formatAgencyName = (agency: string) => {
  return agency.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const getAlertUrl = (alert: ServiceAlert): string => {
  // If the alert has a specific URL, use it
  if (alert.url && alert.url.trim() !== '') {
    return alert.url;
  }
  
  // Otherwise, use the agency's alert center URL
  // Use the first affected agency as the primary one
  const primaryAgency = alert.affectedAgencies[0];
  return agencyUrls[primaryAgency as keyof typeof agencyUrls] || agencyUrls['king-county-metro'];
};

// Enhanced route badge component with GTFS data
const RouteBadge: React.FC<{ routeName: string; agencyId?: string }> = ({ routeName, agencyId }) => {
  // Try to find the route in GTFS data for better styling
  const route = routeService.findRoute(routeName, agencyId);
  
  if (route) {
    const colors = routeService.getRouteColor(route);
    const displayName = routeService.formatRouteDisplay(route);
    
    return (
      <span
        className="text-xs font-bold px-2 py-0.5 rounded border text-center min-w-[2rem] inline-block"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          borderColor: colors.text + '40' // Add some transparency to border
        }}
        title={route.route_long_name || displayName}
      >
        {displayName}
      </span>
    );
  }
  
  // Fallback styling for routes not found in GTFS data
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 bg-white rounded border border-ct-gray-300 text-ct-gray-700"
      title={routeName}
    >
      {routeName.replace('Route ', '')}
    </span>
  );
};

export const AlertCard: React.FC<AlertCardProps> = ({ 
  alert, 
  isCondensed = false, 
  isExpanded = false, 
  onToggle 
}) => {
  const config = severityConfig[alert.severity];
  const alertUrl = getAlertUrl(alert);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  
  // Check if this is a "no alerts" placeholder
  const isNoAlertsPlaceholder = alert.id.startsWith('no-alerts-');

  // Check if description exceeds 3 lines on desktop
  useEffect(() => {
    const checkLineCount = () => {
      if (descriptionRef.current && !isNoAlertsPlaceholder && !isCondensed) {
        const element = descriptionRef.current;
        const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
        const height = element.scrollHeight;
        const lines = Math.round(height / lineHeight);
        
        // Only show toggle on desktop (lg breakpoint and above) and if more than 3 lines
        const isDesktop = window.innerWidth >= 1024;
        setShouldShowToggle(isDesktop && lines > 3);
      }
    };

    // Check on mount and resize
    checkLineCount();
    window.addEventListener('resize', checkLineCount);
    
    return () => window.removeEventListener('resize', checkLineCount);
  }, [alert.description, isNoAlertsPlaceholder, isCondensed]);

  // Condensed view for regular alerts
  if (isCondensed && !isNoAlertsPlaceholder) {
    return (
      <div className={`border-2 rounded-lg transition-all duration-300 hover:shadow-md ${config.condensedBg} ${config.condensedBorder}`}>
        {/* Condensed Header - Always visible */}
        <div 
          className="p-3 cursor-pointer"
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Agency Logo */}
              <AgencyLogo agency={alert.affectedAgencies[0]} size="sm" />
              
              {/* Agency Name and Routes */}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-ct-gray-900">
                  {formatAgencyName(alert.affectedAgencies[0])}
                </span>
                <div className="flex items-center space-x-2">
                  {/* Routes with enhanced styling */}
                  <div className="flex flex-wrap gap-1">
                    {alert.affectedRoutes.slice(0, 3).map((route, index) => (
                      <RouteBadge 
                        key={route} 
                        routeName={route} 
                        agencyId={alert.affectedAgencies[0]} 
                      />
                    ))}
                    {alert.affectedRoutes.length > 3 && (
                      <span className="text-xs font-bold px-2 py-0.5 bg-ct-gray-100 rounded border border-ct-gray-300 text-ct-gray-600">
                        +{alert.affectedRoutes.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Severity indicator */}
              <div className={`h-3 w-3 rounded-full ${
                alert.severity === 'critical' ? 'bg-red-500' :
                alert.severity === 'high' ? 'bg-red-400' :
                alert.severity === 'medium' ? 'bg-yellow-400' :
                'bg-green-400'
              }`} title={`${alert.severity} severity`}></div>
              
              {/* Service icons */}
              <div className="flex space-x-1">
                {alert.affectedServices.slice(0, 2).map((service) => {
                  const IconComponent = serviceIcons[service];
                  return (
                    <IconComponent 
                      key={service} 
                      className="h-4 w-4 text-ct-gray-600"
                      title={service.replace('-', ' ')}
                    />
                  );
                })}
              </div>
              
              {/* Expand/Collapse indicator */}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-ct-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-ct-gray-500" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Content - Only visible when expanded */}
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-ct-gray-200 bg-white bg-opacity-50">
            <div className="pt-3">
              {/* Alert Title */}
              <h3 className={`text-sm font-bold mb-2 ${config.textColor} font-display`}>
                {alert.title}
              </h3>
              
              {/* Alert Description */}
              <p className={`text-xs mb-3 ${config.textColor} opacity-90 leading-relaxed font-medium`}>
                {alert.description}
              </p>
              
              {/* Badges */}
              <div className="flex items-center space-x-2 mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.badgeColor} uppercase tracking-wide`}>
                  {alert.severity}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-ct-gray-100 text-ct-gray-700 uppercase tracking-wide`}>
                  {alert.alertType.replace('-', ' ')}
                </span>
              </div>
              
              {/* Transit Agencies */}
              <div className="flex flex-wrap gap-2 mb-3">
                {alert.affectedAgencies.map((agency) => (
                  <span key={agency} className={`text-xs font-bold px-2 py-1 rounded-full ${agencyColors[agency]}`}>
                    {formatAgencyName(agency)}
                  </span>
                ))}
              </div>
              
              {/* Footer */}
              <div className={`flex items-center justify-between text-xs ${config.textColor} opacity-75`}>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-semibold">Started {formatTime(alert.startTime)}</span>
                </div>
                
                <a
                  href={alertUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center space-x-1 hover:underline ${config.textColor} font-semibold transition-colors hover:opacity-100`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Details</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Condensed view for "no alerts" placeholder
  if (isCondensed && isNoAlertsPlaceholder) {
    return (
      <div 
        className="border-2 rounded-lg transition-all duration-300 hover:shadow-md bg-green-100 border-green-300 cursor-pointer"
        onClick={onToggle}
      >
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AgencyLogo agency={alert.affectedAgencies[0]} size="sm" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-green-800">
                  {formatAgencyName(alert.affectedAgencies[0])}
                </span>
                <span className="text-xs text-green-600 font-medium">No active alerts</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-green-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-green-600" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Content for "no alerts" */}
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-green-200 bg-white bg-opacity-50">
            <div className="pt-3">
              <p className="text-sm text-green-800 opacity-90 leading-relaxed font-medium mb-3">
                {alert.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-green-800 opacity-75">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-semibold">Updated {formatTime(alert.lastUpdated)}</span>
                </div>
                
                <a
                  href={alertUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:underline text-green-800 font-semibold transition-colors hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>View Agency Alerts</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Full view for "no alerts" placeholder
  if (isNoAlertsPlaceholder) {
    return (
      <div className="border rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 bg-green-50 border-green-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800 uppercase tracking-wide">
                All Clear
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {alert.affectedServices.map((service) => {
              const IconComponent = serviceIcons[service];
              return (
                <IconComponent 
                  key={service} 
                  className="h-5 w-5 sm:h-6 sm:w-6 text-green-600"
                  title={service.replace('-', ' ')}
                />
              );
            })}
          </div>
        </div>
        
        <h3 className="text-lg font-bold mb-3 text-green-800 font-display">
          {alert.title}
        </h3>
        
        <p className="text-sm mb-4 text-green-800 opacity-90 leading-relaxed font-medium">
          {alert.description}
        </p>
        
        {/* Transit Agencies */}
        <div className="flex flex-wrap gap-3 mb-4">
          {alert.affectedAgencies.map((agency) => (
            <span key={agency} className={`text-xs font-bold px-3 py-1 rounded-full ${agencyColors[agency]}`}>
              {formatAgencyName(agency)}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-xs text-green-800 opacity-75">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span className="font-semibold">Updated {formatTime(alert.lastUpdated)}</span>
          </div>
          
          <a
            href={alertUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:underline text-green-800 font-semibold transition-colors hover:opacity-100"
          >
            <span>View Agency Alerts</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }
  
  // Full view for regular alerts
  return (
    <div className={`border rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${config.bgColor}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className={`h-5 w-5 ${config.iconColor}`} />
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${config.badgeColor} uppercase tracking-wide`}>
              {alert.severity}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full bg-ct-gray-100 text-ct-gray-700 uppercase tracking-wide`}>
              {alert.alertType.replace('-', ' ')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {alert.affectedServices.map((service) => {
            const IconComponent = serviceIcons[service];
            return (
              <IconComponent 
                key={service} 
                className={`h-5 w-5 sm:h-6 sm:w-6 ${config.iconColor}`}
                title={service.replace('-', ' ')}
              />
            );
          })}
        </div>
      </div>
      
      <h3 className={`text-lg font-bold mb-3 ${config.textColor} font-display`}>
        {alert.title}
      </h3>
      
      <div className="relative">
        <p 
          ref={descriptionRef}
          className={`text-sm mb-4 ${config.textColor} opacity-90 leading-relaxed font-medium transition-all duration-300 ${
            shouldShowToggle && !isDetailExpanded 
              ? 'lg:line-clamp-3 lg:overflow-hidden' 
              : ''
          }`}
          style={{
            display: shouldShowToggle && !isDetailExpanded ? '-webkit-box' : 'block',
            WebkitLineClamp: shouldShowToggle && !isDetailExpanded ? 3 : 'unset',
            WebkitBoxOrient: shouldShowToggle && !isDetailExpanded ? 'vertical' : 'unset',
          }}
        >
          {alert.description}
        </p>
        
        {/* Expand/Collapse button - only shown on desktop when needed */}
        {shouldShowToggle && (
          <button
            onClick={() => setIsDetailExpanded(!isDetailExpanded)}
            className={`hidden lg:flex items-center space-x-1 text-xs font-semibold ${config.textColor} hover:opacity-100 opacity-75 transition-opacity mb-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded-md px-2 py-1 -ml-2`}
          >
            {isDetailExpanded ? (
              <>
                <span>Show less</span>
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                <span>Show more</span>
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Enhanced route display with GTFS data */}
      <div className="flex flex-wrap gap-2 mb-4">
        {alert.affectedRoutes.map((route) => (
          <RouteBadge 
            key={route} 
            routeName={route} 
            agencyId={alert.affectedAgencies[0]} 
          />
        ))}
      </div>

      {/* Transit Agencies */}
      <div className="flex flex-wrap gap-3 mb-4">
        {alert.affectedAgencies.map((agency) => (
          <span key={agency} className={`text-xs font-bold px-3 py-1 rounded-full ${agencyColors[agency]}`}>
            {formatAgencyName(agency)}
          </span>
        ))}
      </div>
      
      <div className={`flex items-center justify-between text-xs ${config.textColor} opacity-75`}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span className="font-semibold">Started {formatTime(alert.startTime)}</span>
          </div>
          {alert.endTime && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span className="font-semibold">Ends {formatTime(alert.endTime)}</span>
            </div>
          )}
        </div>
        
        <a
          href={alertUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center space-x-1 hover:underline ${config.textColor} font-semibold transition-colors hover:opacity-100`}
        >
          <span>Details</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      
      <div className={`mt-3 pt-3 border-t border-ct-gray-200 flex items-center justify-between text-xs ${config.textColor} opacity-60`}>
        <span className="font-semibold">Duration: {formatDuration(alert.startTime, alert.endTime)}</span>
        <span className="font-semibold">Updated {formatTime(alert.lastUpdated)}</span>
      </div>
    </div>
  );
};