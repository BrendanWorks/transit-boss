import { useState, useEffect, useCallback } from 'react';
import { ServiceAlert, AlertStats } from '../types/alerts';
import { transitApiService } from '../services/transitApi';

export const useServiceAlerts = () => {
  const [alerts, setAlerts] = useState<ServiceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('live');

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching transit alerts...');
      
      const allAlerts = await transitApiService.fetchAllAlerts();
      setAlerts(allAlerts);
      setLastUpdated(new Date());
      
      // Check if we have any live data (excluding "no alerts" placeholders)
      const liveAlerts = allAlerts.filter(alert => !alert.id.startsWith('no-alerts-'));
      const agencyStatuses = transitApiService.getAgencyStatuses();
      
      // Determine data source based on whether we have live API connections
      const hasLiveConnections = Object.values(agencyStatuses).some(status => status.hasLiveData);
      
      if (hasLiveConnections) {
        setDataSource('live');
        console.log(`Successfully loaded ${allAlerts.length} alerts (${liveAlerts.length} live alerts, ${allAlerts.length - liveAlerts.length} status messages)`);
      } else {
        setDataSource('mock');
        console.log(`No live connections available, showing ${allAlerts.length} alerts`);
      }
      
      // Log agency status summary
      Object.entries(agencyStatuses).forEach(([agencyId, status]) => {
        if (status.hasLiveData) {
          console.log(`${status.name}: ${status.alertCount} alerts (live data)`);
        } else {
          console.log(`${status.name}: No connection${status.error ? ` (${status.error})` : ''}`);
        }
      });
      
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Unable to load transit alerts. Please try again later.');
      setDataSource('mock');
    } finally {
      setLoading(false);
    }
  }, []);

  const getAlertStats = useCallback((): AlertStats => {
    // Filter out "no alerts" placeholders from stats
    const realAlerts = alerts.filter(alert => !alert.id.startsWith('no-alerts-'));
    const active = realAlerts.filter(alert => alert.isActive);
    
    const byService = realAlerts.reduce((acc, alert) => {
      alert.affectedServices.forEach(service => {
        acc[service] = (acc[service] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = realAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byAgency = realAlerts.reduce((acc, alert) => {
      alert.affectedAgencies.forEach(agency => {
        acc[agency] = (acc[agency] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      total: realAlerts.length,
      active: active.length,
      byService,
      bySeverity,
      byAgency
    };
  }, [alerts]);

  useEffect(() => {
    fetchAlerts();
    
    // Set up auto-refresh every 3 minutes
    const interval = setInterval(fetchAlerts, 3 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    lastUpdated,
    fetchAlerts,
    stats: getAlertStats(),
    dataSource
  };
};