import React from 'react';
import { RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react';
import { APP_CONFIG } from '../config/app';
import { CITY_CONFIG } from '../config/agencies';

interface GenericHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: Date | null;
  dataSource?: 'live' | 'mock';
}

export const GenericHeader: React.FC<GenericHeaderProps> = ({ 
  onRefresh, 
  isLoading, 
  lastUpdated, 
  dataSource 
}) => {
  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-black">
                {APP_CONFIG.name}
              </h1>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              {CITY_CONFIG.name} {CITY_CONFIG.region} Transit Alerts
            </p>
            
            {/* Data source indicator */}
            {dataSource && (
              <div className="flex items-center justify-center space-x-1 mt-2">
                {dataSource === 'live' ? (
                  <>
                    <div className="relative">
                      <Wifi className="h-3 w-3 text-green-500" />
                      <div className="absolute inset-0 h-3 w-3">
                        <div className="absolute inset-0 border border-green-400 rounded-full animate-ping opacity-30"></div>
                        <div className="absolute inset-0 border border-green-300 rounded-full animate-pulse opacity-20"></div>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Live Data</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-orange-500" />
                    <span className="text-xs text-orange-600 font-medium">Sample Data</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            {lastUpdated && (
              <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <Clock className="h-3 w-3" />
                <span className="font-medium">Updated {formatLastUpdated(lastUpdated)}</span>
              </div>
            )}
            
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  {APP_CONFIG.name}
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  {CITY_CONFIG.name} {CITY_CONFIG.region} Transit Alerts
                </p>
              </div>
              
              {/* Data source indicator */}
              {dataSource && (
                <div className="flex items-center space-x-1 ml-4">
                  {dataSource === 'live' ? (
                    <>
                      <div className="relative">
                        <Wifi className="h-4 w-4 text-green-500" />
                        <div className="absolute inset-0 h-4 w-4">
                          <div className="absolute inset-0 border border-green-400 rounded-full animate-ping opacity-30"></div>
                          <div className="absolute inset-0 border border-green-300 rounded-full animate-pulse opacity-20"></div>
                        </div>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Live Data</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-600 font-medium">Sample Data</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Updated {formatLastUpdated(lastUpdated)}</span>
              </div>
            )}
            
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};