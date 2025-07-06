import React from 'react';
import { AlertFilters as AlertFiltersType } from '../types/alerts';
import { Search, Filter, X, Clock, Eye, EyeOff } from 'lucide-react';
import { usePreferences } from '../hooks/usePreferences';

interface AlertFiltersProps {
  filters: AlertFiltersType;
  onFiltersChange: (filters: AlertFiltersType) => void;
  alertCount: number;
  olderAlertsCount: number;
  // onOpenPreferences: () => void;
}

const severityOptions = [
  { value: 'critical', label: 'Critical', color: 'bg-red-200 text-red-900' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' }
];

const alertTypeOptions = [
  { value: 'delay', label: 'Delays' },
  { value: 'cancellation', label: 'Cancellations' },
  { value: 'detour', label: 'Detours' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'weather', label: 'Weather' },
  { value: 'incident', label: 'Incidents' }
];

const serviceOptions = [
  { value: 'bus', label: 'Bus' },
  { value: 'light-rail', label: 'Light Rail' },
  { value: 'commuter-rail', label: 'Commuter Rail' },
  { value: 'ferry', label: 'Ferry' },
  { value: 'streetcar', label: 'Streetcar' }
];

const allAgencyOptions = [
  { value: 'king-county-metro', label: 'King County Metro', color: 'bg-kcm-navy-800 text-kcm-orange-500' },
  { value: 'sound-transit', label: 'Sound Transit', color: 'bg-st-blue-800 text-white' },
  { value: 'community-transit', label: 'Community Transit', color: 'bg-ct-blue-500 text-white' },
  { value: 'washington-state-ferries', label: 'WA State Ferries', color: 'bg-wsf-green-800 text-white' }
];

export const AlertFilters: React.FC<AlertFiltersProps> = ({
  filters,
  onFiltersChange,
  alertCount,
  olderAlertsCount,
  // onOpenPreferences
}) => {
  const { getVisibleAgencies } = usePreferences();
  const visibleAgencies = getVisibleAgencies();
  
  // Filter agency options based on user preferences
  const agencyOptions = allAgencyOptions.filter(agency => 
    visibleAgencies.includes(agency.value)
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      searchQuery: e.target.value
    });
  };

  const handleFilterToggle = (category: keyof Omit<AlertFiltersType, 'searchQuery' | 'showOlderAlerts'>, value: string) => {
    const currentValues = filters[category];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({
      ...filters,
      [category]: newValues
    });
  };

  const handleShowOlderAlertsToggle = () => {
    onFiltersChange({
      ...filters,
      showOlderAlerts: !filters.showOlderAlerts
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      severity: [],
      alertType: [],
      services: [],
      agencies: [],
      searchQuery: '',
      showOlderAlerts: false
    });
  };

  const hasActiveFilters = 
    filters.severity.length > 0 || 
    filters.alertType.length > 0 || 
    filters.services.length > 0 || 
    filters.agencies.length > 0 ||
    filters.searchQuery.length > 0 ||
    filters.showOlderAlerts;

  return (
    <div className="ct-card p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Filter className="h-5 w-5 text-ct-blue-500" />
          <h2 className="text-lg font-bold text-ct-gray-900 font-display">Filters</h2>
          <span className="bg-ct-blue-100 text-ct-blue-800 text-sm font-bold px-3 py-1 rounded-full">
            {alertCount} alerts
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Preferences button commented out */}
          {/* <button
            onClick={onOpenPreferences}
            className="flex items-center space-x-2 text-sm text-ct-gray-600 hover:text-ct-gray-800 transition-colors font-semibold px-3 py-2 rounded-lg hover:bg-ct-gray-100"
            title="Configure which agencies appear in filters"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </button> */}
          
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-1 text-sm text-ct-gray-600 hover:text-ct-gray-800 transition-colors font-semibold"
            >
              <X className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ct-gray-400" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
            className="ct-input pl-10 font-medium"
          />
        </div>
      </div>

      {/* Show Older Alerts Toggle */}
      <div className="mb-6 p-4 bg-ct-gray-50 rounded-lg border border-ct-gray-200">
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-ct-gray-500" />
            <div>
              <span className="text-sm font-semibold text-ct-gray-900 group-hover:text-ct-gray-700 transition-colors">
                Show older alerts (7+ days)
              </span>
              {olderAlertsCount > 0 && (
                <p className="text-xs text-ct-gray-600 mt-1">
                  {olderAlertsCount} older alerts available
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="checkbox"
                checked={filters.showOlderAlerts}
                onChange={handleShowOlderAlertsToggle}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                filters.showOlderAlerts ? 'bg-ct-blue-500' : 'bg-ct-gray-300'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                  filters.showOlderAlerts ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`}></div>
              </div>
            </div>
            
            {filters.showOlderAlerts ? (
              <Eye className="h-4 w-4 text-ct-blue-500" />
            ) : (
              <EyeOff className="h-4 w-4 text-ct-gray-400" />
            )}
          </div>
        </label>
      </div>

      {/* Mobile-first layout: Transit Agencies first, then other filters */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-6">
        {/* Transit Agencies Filter - First on mobile */}
        <div className="lg:order-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-ct-gray-900 font-display uppercase tracking-wide">
              Transit Agencies
            </h3>
            {/* Removed hidden agencies indicator since preferences are disabled */}
          </div>
          
          <div className="space-y-3">
            {agencyOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.agencies.includes(option.value)}
                  onChange={() => handleFilterToggle('agencies', option.value)}
                  className="rounded border-ct-gray-300 text-ct-blue-500 focus:ring-ct-blue-500 h-4 w-4"
                />
                <span className={`text-xs font-bold px-3 py-1 rounded-full transition-colors group-hover:opacity-80 ${option.color}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Severity Filter */}
        <div className="lg:order-1">
          <h3 className="text-sm font-bold text-ct-gray-900 mb-3 font-display uppercase tracking-wide">Severity</h3>
          <div className="space-y-3">
            {severityOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.severity.includes(option.value)}
                  onChange={() => handleFilterToggle('severity', option.value)}
                  className="rounded border-ct-gray-300 text-ct-blue-500 focus:ring-ct-blue-500 h-4 w-4"
                />
                <span className={`text-xs font-bold px-3 py-1 rounded-full transition-colors group-hover:opacity-80 ${option.color} uppercase tracking-wide`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Alert Type Filter */}
        <div className="lg:order-2">
          <h3 className="text-sm font-bold text-ct-gray-900 mb-3 font-display uppercase tracking-wide">Alert Type</h3>
          <div className="space-y-3">
            {alertTypeOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.alertType.includes(option.value)}
                  onChange={() => handleFilterToggle('alertType', option.value)}
                  className="rounded border-ct-gray-300 text-ct-blue-500 focus:ring-ct-blue-500 h-4 w-4"
                />
                <span className="text-sm text-ct-gray-700 font-semibold group-hover:text-ct-gray-900 transition-colors">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Service Filter */}
        <div className="lg:order-3">
          <h3 className="text-sm font-bold text-ct-gray-900 mb-3 font-display uppercase tracking-wide">Services</h3>
          <div className="space-y-3">
            {serviceOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.services.includes(option.value)}
                  onChange={() => handleFilterToggle('services', option.value)}
                  className="rounded border-ct-gray-300 text-ct-blue-500 focus:ring-ct-blue-500 h-4 w-4"
                />
                <span className="text-sm text-ct-gray-700 font-semibold group-hover:text-ct-gray-900 transition-colors">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};