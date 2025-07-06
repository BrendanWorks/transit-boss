import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { StatsCard } from './components/StatsCard';
import { AlertFilters } from './components/AlertFilters';
import { AlertCard } from './components/AlertCard';
// import { PreferencesModal } from './components/PreferencesModal';
import { useServiceAlerts } from './hooks/useServiceAlerts';
import { usePreferences } from './hooks/usePreferences';
import { useFilterPersistence } from './hooks/useFilterPersistence';
import { AlertFilters as AlertFiltersType, ServiceAlert } from './types/alerts';
import { LayoutGrid, List } from 'lucide-react';

// Helper function to calculate alert duration in hours
const getAlertDurationHours = (startTime: string): number => {
  const start = new Date(startTime);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60));
};

function App() {
  const { alerts, loading, error, lastUpdated, fetchAlerts, stats, dataSource } = useServiceAlerts();
  const { getVisibleAgencies } = usePreferences();
  const { filters, loading: filtersLoading, saveFilters, resetFilters, hasActiveFilters } = useFilterPersistence();
  const [isSummaryView, setIsSummaryView] = useState(true); // Changed from false to true
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  // const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);

  const filteredAlerts = useMemo(() => {
    const visibleAgencies = getVisibleAgencies();
    
    return alerts.filter(alert => {
      // First, filter out older alerts unless showOlderAlerts is enabled
      if (!filters.showOlderAlerts) {
        const durationHours = getAlertDurationHours(alert.startTime);
        if (durationHours > 168) { // 168 hours = 7 days
          return false;
        }
      }

      // Then, filter out alerts from hidden agencies (unless specifically filtered for)
      if (filters.agencies.length === 0) {
        // If no specific agency filter is applied, only show alerts from visible agencies
        const hasVisibleAgency = alert.affectedAgencies.some(agency => 
          visibleAgencies.includes(agency)
        );
        if (!hasVisibleAgency) return false;
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch = 
          alert.title.toLowerCase().includes(query) ||
          alert.description.toLowerCase().includes(query) ||
          alert.affectedRoutes.some(route => route.toLowerCase().includes(query)) ||
          alert.affectedAgencies.some(agency => agency.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      // Severity filter
      if (filters.severity.length > 0 && !filters.severity.includes(alert.severity)) {
        return false;
      }

      // Alert type filter
      if (filters.alertType.length > 0 && !filters.alertType.includes(alert.alertType)) {
        return false;
      }

      // Service filter
      if (filters.services.length > 0) {
        const hasMatchingService = alert.affectedServices.some(service => 
          filters.services.includes(service)
        );
        if (!hasMatchingService) return false;
      }

      // Agency filter (only apply if specific agencies are selected)
      if (filters.agencies.length > 0) {
        const hasMatchingAgency = alert.affectedAgencies.some(agency => 
          filters.agencies.includes(agency)
        );
        if (!hasMatchingAgency) return false;
      }

      return true;
    });
  }, [alerts, filters, getVisibleAgencies]);

  const sortedAlerts = useMemo(() => {
    return [...filteredAlerts].sort((a, b) => {
      // Sort by severity first (critical > high > medium > low)
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by start time (newest first)
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });
  }, [filteredAlerts]);

  const handleStatsCardClick = (cardType: string) => {
    const visibleAgencies = getVisibleAgencies();
    
    switch (cardType) {
      case 'total':
        // Show all alerts - clear all filters
        saveFilters({
          severity: [],
          alertType: [],
          services: [],
          agencies: [],
          searchQuery: '',
          showOlderAlerts: filters.showOlderAlerts // Preserve the older alerts setting
        });
        break;
      
      case 'active':
        // This would require adding an isActive filter to our filter system
        // For now, we'll clear filters to show all (since our mock data shows all as active)
        saveFilters({
          severity: [],
          alertType: [],
          services: [],
          agencies: [],
          searchQuery: '',
          showOlderAlerts: filters.showOlderAlerts // Preserve the older alerts setting
        });
        break;
      
      case 'most-affected-service':
        // Filter by the most affected service
        const topService = Object.entries(stats.byService)
          .sort(([,a], [,b]) => b - a)[0]?.[0];
        if (topService) {
          saveFilters({
            severity: [],
            alertType: [],
            services: [topService],
            agencies: [],
            searchQuery: '',
            showOlderAlerts: filters.showOlderAlerts // Preserve the older alerts setting
          });
        }
        break;
      
      case 'most-affected-agency':
        // Filter by the most affected agency (only if it's visible)
        const topAgency = Object.entries(stats.byAgency)
          .sort(([,a], [,b]) => b - a)[0]?.[0];
        if (topAgency && visibleAgencies.includes(topAgency)) {
          saveFilters({
            severity: [],
            alertType: [],
            services: [],
            agencies: [topAgency],
            searchQuery: '',
            showOlderAlerts: filters.showOlderAlerts // Preserve the older alerts setting
          });
        }
        break;
      
      case 'highest-severity':
        // Filter by the highest severity level
        const highestSeverity = Object.entries(stats.bySeverity)
          .sort(([a], [b]) => {
            const order = ['critical', 'high', 'medium', 'low'];
            return order.indexOf(a) - order.indexOf(b);
          })[0]?.[0];
        if (highestSeverity) {
          saveFilters({
            severity: [highestSeverity],
            alertType: [],
            services: [],
            agencies: [],
            searchQuery: '',
            showOlderAlerts: filters.showOlderAlerts // Preserve the older alerts setting
          });
        }
        break;
    }
  };

  const handleAlertToggle = (alertId: string) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const activeFilters = hasActiveFilters();

  // Count older alerts for display
  const olderAlertsCount = useMemo(() => {
    return alerts.filter(alert => {
      const durationHours = getAlertDurationHours(alert.startTime);
      return durationHours > 168;
    }).length;
  }, [alerts]);

  // Show loading state while filters are being loaded
  if (filtersLoading) {
    return (
      <div className="min-h-screen bg-ct-gray-50 flex items-center justify-center">
        <div className="ct-card p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="h-12 w-12 bg-ct-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-ct-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-ct-gray-900 mb-2">Loading Transit Boss</h3>
            <p className="text-ct-gray-600 font-medium">Preparing your personalized dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && alerts.length === 0) {
    return (
      <div className="min-h-screen bg-ct-gray-50 flex items-center justify-center">
        <div className="ct-card p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-ct-gray-900 mb-2">Connection Error</h3>
            <p className="text-ct-gray-600 mb-4 font-medium">{error}</p>
            <button
              onClick={fetchAlerts}
              className="ct-button-primary w-full"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ct-gray-50">
      <Header 
        onRefresh={fetchAlerts} 
        isLoading={loading} 
        lastUpdated={lastUpdated}
        dataSource={dataSource}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Show error banner if there's an error but we have fallback data */}
        {error && alerts.length > 0 && (
          <div className="bg-ct-orange-50 border border-ct-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <svg className="h-5 w-5 text-ct-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-ct-orange-800">{error}</p>
                <p className="text-xs text-ct-orange-600 mt-1">Displaying sample data for demonstration purposes.</p>
              </div>
            </div>
          </div>
        )}
        
        <StatsCard stats={stats} onCardClick={handleStatsCardClick} />
        
        {/* Quick filter indicator when filters are active */}
        {activeFilters && (
          <div className="mb-6 flex items-center justify-between bg-ct-blue-50 border border-ct-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-ct-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-ct-blue-800">
                Showing {filteredAlerts.length} of {alerts.length} alerts
              </span>
              <span className="text-xs text-ct-blue-600 font-medium">
                (Filters active)
              </span>
              {!filters.showOlderAlerts && olderAlertsCount > 0 && (
                <span className="text-xs text-ct-blue-600 font-medium">
                  • {olderAlertsCount} older alerts hidden
                </span>
              )}
            </div>
            <button
              onClick={resetFilters}
              className="text-sm text-ct-blue-600 hover:text-ct-blue-800 font-semibold hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Show older alerts indicator when they're hidden */}
        {!filters.showOlderAlerts && olderAlertsCount > 0 && !activeFilters && (
          <div className="mb-6 flex items-center justify-between bg-ct-gray-50 border border-ct-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <svg className="h-5 w-5 text-ct-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-ct-gray-700">
                {olderAlertsCount} older alerts (7+ days) are hidden
              </span>
            </div>
            <button
              onClick={() => saveFilters({ ...filters, showOlderAlerts: true })}
              className="text-sm text-ct-gray-600 hover:text-ct-gray-800 font-semibold hover:underline"
            >
              Show Older Alerts
            </button>
          </div>
        )}

        {/* View Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-ct-gray-700">View:</span>
            <div className="flex items-center bg-ct-gray-100 rounded-lg p-1">
              <button
                onClick={() => setIsSummaryView(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  !isSummaryView 
                    ? 'bg-white text-ct-gray-900 shadow-sm' 
                    : 'text-ct-gray-600 hover:text-ct-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
                <span>Detailed</span>
              </button>
              <button
                onClick={() => setIsSummaryView(true)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isSummaryView 
                    ? 'bg-white text-ct-gray-900 shadow-sm' 
                    : 'text-ct-gray-600 hover:text-ct-gray-900'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Summary</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {loading && alerts.length === 0 ? (
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="ct-card p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 bg-ct-gray-200 rounded"></div>
                    <div className="flex space-x-2">
                      <div className="h-6 w-16 bg-ct-gray-200 rounded-full"></div>
                      <div className="h-6 w-20 bg-ct-gray-200 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-4 w-4 bg-ct-gray-200 rounded"></div>
                </div>
                
                <div className="h-6 bg-ct-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-ct-gray-200 rounded mb-4 w-full"></div>
                <div className="h-4 bg-ct-gray-200 rounded mb-4 w-2/3"></div>
                
                <div className="flex space-x-2 mb-4">
                  <div className="h-6 w-16 bg-ct-gray-200 rounded"></div>
                  <div className="h-6 w-20 bg-ct-gray-200 rounded"></div>
                </div>
                
                <div className="flex justify-between">
                  <div className="h-3 w-32 bg-ct-gray-200 rounded"></div>
                  <div className="h-3 w-20 bg-ct-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedAlerts.length === 0 && !loading ? (
          <div className="ct-card p-12 text-center">
            <div className="h-16 w-16 bg-ct-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-ct-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-ct-gray-900 mb-2">
              {activeFilters ? 
                'No alerts match your filters' : 
                'No active service alerts'
              }
            </h3>
            <p className="text-ct-gray-600 mb-4 font-medium">
              {activeFilters ? 
                'Try adjusting your filter criteria to see more results.' : 
                'All Puget Sound regional transit services are currently running normally.'
              }
            </p>
            {activeFilters && (
              <button
                onClick={resetFilters}
                className="ct-button-primary"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className={isSummaryView ? "space-y-3" : "space-y-6"}>
            {sortedAlerts.map((alert) => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                isCondensed={isSummaryView}
                isExpanded={expandedAlerts.has(alert.id)}
                onToggle={() => handleAlertToggle(alert.id)}
              />
            ))}
          </div>
        )}

        {/* Filters Panel - Now positioned below alerts */}
        <div className="mt-12">
          <AlertFilters 
            filters={filters}
            onFiltersChange={saveFilters}
            alertCount={filteredAlerts.length}
            olderAlertsCount={olderAlertsCount}
            // onOpenPreferences={() => setPreferencesModalOpen(true)}
          />
        </div>

        {/* Legal Footer */}
        <div className="mt-8 pt-8 border-t border-ct-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-ct-gray-500 mb-2">
              <span className="font-medium">© 2025 Brendan Works</span>
            </div>
            <p className="text-xs text-ct-gray-400 font-medium">
              Personal prototype not affiliated with any transit agency.
            </p>
            <p className="text-xs text-ct-gray-400 font-medium mt-1">
              <a href="mailto:pugetsoundtransitboss@gmail.com" className="hover:text-ct-gray-600 transition-colors">
                pugetsoundtransitboss@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Preferences Modal - Commented out */}
      {/* <PreferencesModal 
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
      /> */}
    </div>
  );
}

export default App;