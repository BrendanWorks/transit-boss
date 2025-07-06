import React from 'react';
import { X, Settings, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { usePreferences } from '../hooks/usePreferences';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const agencyOptions = [
  { value: 'king-county-metro', label: 'King County Metro', color: 'bg-kcm-navy-800 text-kcm-orange-500' },
  { value: 'sound-transit', label: 'Sound Transit', color: 'bg-st-blue-800 text-white' },
  { value: 'community-transit', label: 'Community Transit', color: 'bg-ct-blue-500 text-white' },
  { value: 'washington-state-ferries', label: 'WA State Ferries', color: 'bg-wsf-green-800 text-white' }
];

export const PreferencesModal: React.FC<PreferencesModalProps> = ({ isOpen, onClose }) => {
  const { preferences, updateAgencyVisibility, resetPreferences, getVisibleAgencies } = usePreferences();

  if (!isOpen) return null;

  const visibleAgencies = getVisibleAgencies();

  const handleAgencyToggle = (agencyId: string) => {
    const isCurrentlyVisible = visibleAgencies.includes(agencyId);
    updateAgencyVisibility(agencyId, !isCurrentlyVisible);
  };

  const handleReset = () => {
    resetPreferences();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ct-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-ct-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-ct-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ct-gray-900 font-display">Filter Preferences</h2>
              <p className="text-sm text-ct-gray-600 font-medium">Customize which agencies appear in filters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-ct-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-ct-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-ct-gray-900 mb-3 font-display uppercase tracking-wide">
              Transit Agencies
            </h3>
            <p className="text-sm text-ct-gray-600 mb-4 font-medium">
              Select which agencies should appear in the filter options. Hidden agencies will not show up in the filters, 
              but their alerts may still appear if they match other filter criteria.
            </p>
          </div>

          <div className="space-y-3">
            {agencyOptions.map((agency) => {
              const isVisible = visibleAgencies.includes(agency.value);
              
              return (
                <div
                  key={agency.value}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-sm ${
                    isVisible 
                      ? 'border-ct-blue-200 bg-ct-blue-50' 
                      : 'border-ct-gray-200 bg-ct-gray-50'
                  }`}
                  onClick={() => handleAgencyToggle(agency.value)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                      isVisible ? 'bg-ct-blue-100' : 'bg-ct-gray-200'
                    }`}>
                      {isVisible ? (
                        <Eye className={`h-4 w-4 ${isVisible ? 'text-ct-blue-600' : 'text-ct-gray-500'}`} />
                      ) : (
                        <EyeOff className="h-4 w-4 text-ct-gray-500" />
                      )}
                    </div>
                    <div>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${agency.color}`}>
                        {agency.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      isVisible 
                        ? 'bg-ct-green-100 text-ct-green-700' 
                        : 'bg-ct-gray-200 text-ct-gray-600'
                    }`}>
                      {isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-ct-gray-50 rounded-lg border border-ct-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-ct-gray-700">
                Visible Agencies: {visibleAgencies.length} of {agencyOptions.length}
              </span>
              <span className="font-semibold text-ct-gray-700">
                Hidden: {agencyOptions.length - visibleAgencies.length}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-ct-gray-200 bg-ct-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 text-sm text-ct-gray-600 hover:text-ct-gray-800 transition-colors font-semibold"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset to Defaults</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="ct-button-secondary text-sm px-4 py-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};