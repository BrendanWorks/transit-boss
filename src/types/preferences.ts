export interface AgencyPreferences {
  visibleAgencies: string[];
  hiddenAgencies: string[];
}

export interface UserPreferences {
  agencies: AgencyPreferences;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  agencies: {
    visibleAgencies: [
      'king-county-metro',
      'sound-transit',
      'community-transit',
      'washington-state-ferries'
    ],
    hiddenAgencies: []
  }
};