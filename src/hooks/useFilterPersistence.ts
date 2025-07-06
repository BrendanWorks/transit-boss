import { useState, useEffect, useCallback } from 'react';
import { AlertFilters } from '../types/alerts';

const FILTERS_STORAGE_KEY = 'transit-alerts-filters';

const DEFAULT_FILTERS: AlertFilters = {
  severity: [],
  alertType: [],
  services: [],
  agencies: [],
  searchQuery: '',
  showOlderAlerts: false
};

export const useFilterPersistence = () => {
  const [filters, setFilters] = useState<AlertFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);

  // Load filters from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (stored) {
        const parsedFilters = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        setFilters({
          ...DEFAULT_FILTERS,
          ...parsedFilters
        });
      }
    } catch (error) {
      console.error('Error loading filter preferences:', error);
      // Use defaults if there's an error
      setFilters(DEFAULT_FILTERS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save filters to localStorage
  const saveFilters = useCallback((newFilters: AlertFilters) => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(newFilters));
      setFilters(newFilters);
    } catch (error) {
      console.error('Error saving filter preferences:', error);
      // Still update state even if saving fails
      setFilters(newFilters);
    }
  }, []);

  // Reset to defaults
  const resetFilters = useCallback(() => {
    try {
      localStorage.removeItem(FILTERS_STORAGE_KEY);
      setFilters(DEFAULT_FILTERS);
    } catch (error) {
      console.error('Error resetting filter preferences:', error);
      setFilters(DEFAULT_FILTERS);
    }
  }, []);

  // Check if filters have any active values
  const hasActiveFilters = useCallback(() => {
    return (
      filters.severity.length > 0 || 
      filters.alertType.length > 0 || 
      filters.services.length > 0 || 
      filters.agencies.length > 0 ||
      filters.searchQuery.length > 0 ||
      filters.showOlderAlerts !== DEFAULT_FILTERS.showOlderAlerts
    );
  }, [filters]);

  return {
    filters,
    loading,
    saveFilters,
    resetFilters,
    hasActiveFilters
  };
};