import { useState, useEffect, useCallback } from 'react';
import { UserPreferences, DEFAULT_PREFERENCES } from '../types/preferences';

const PREFERENCES_STORAGE_KEY = 'transit-alerts-preferences';

export const usePreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsedPreferences,
          agencies: {
            ...DEFAULT_PREFERENCES.agencies,
            ...parsedPreferences.agencies
          }
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Use defaults if there's an error
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: UserPreferences) => {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, []);

  // Update agency visibility
  const updateAgencyVisibility = useCallback((agencyId: string, visible: boolean) => {
    const newPreferences = { ...preferences };
    
    if (visible) {
      // Add to visible, remove from hidden
      if (!newPreferences.agencies.visibleAgencies.includes(agencyId)) {
        newPreferences.agencies.visibleAgencies.push(agencyId);
      }
      newPreferences.agencies.hiddenAgencies = newPreferences.agencies.hiddenAgencies.filter(
        id => id !== agencyId
      );
    } else {
      // Add to hidden, remove from visible
      if (!newPreferences.agencies.hiddenAgencies.includes(agencyId)) {
        newPreferences.agencies.hiddenAgencies.push(agencyId);
      }
      newPreferences.agencies.visibleAgencies = newPreferences.agencies.visibleAgencies.filter(
        id => id !== agencyId
      );
    }
    
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  // Get visible agencies (those not in hidden list)
  const getVisibleAgencies = useCallback(() => {
    return preferences.agencies.visibleAgencies.filter(
      agencyId => !preferences.agencies.hiddenAgencies.includes(agencyId)
    );
  }, [preferences]);

  return {
    preferences,
    loading,
    updateAgencyVisibility,
    resetPreferences,
    getVisibleAgencies,
    savePreferences
  };
};