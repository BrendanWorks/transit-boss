import React from 'react';
import { RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react';
import { TransitBossIcon } from './TransitBossIcon';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: Date | null;
  dataSource?: 'live' | 'mock';
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isLoading, lastUpdated, dataSource }) => {
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
    <header className="bg-white shadow-sm border-b border-ct-gray-200 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <TransitBossIcon size="md" />
              <h1 className="text-xl sm:text-2xl font-avenir-bold text-black">
                Transit Boss
              </h1>
            </div>
            <p className="text-sm text-ct-gray-600 font-medium">
              Puget Sound Service Alerts
            </p>
            
            {/* Data source indicator */}
            {dataSource && (
              <div className="flex items-center justify-center space-x-1 mt-2">
                {dataSource === 'live' ? (
                  <>
                    <div className="relative">
                      <Wifi className="h-3 w-3 text-ct-green-500" />
                      {/* Radar beam animation */}
                      <div className="absolute inset-0 h-3 w-3">
                        <div className="absolute inset-0 border border-ct-green-400 rounded-full animate-ping opacity-30"></div>
                        <div className="absolute inset-0 border border-ct-green-300 rounded-full animate-pulse opacity-20"></div>
                      </div>
                    </div>
                    <span className="text-xs text-ct-green-600 font-medium">Live Data</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-ct-orange-500" />
                    <span className="text-xs text-ct-orange-600 font-medium">Sample Data</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            {lastUpdated && (
              <div className="flex items-center space-x-2 text-xs text-ct-gray-600 bg-ct-gray-50 px-3 py-2 rounded-lg border border-ct-gray-200">
                <Clock className="h-3 w-3" />
                <span className="font-medium">Updated {formatLastUpdated(lastUpdated)}</span>
              </div>
            )}
            
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="ct-button-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm px-3 py-2"
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
              <TransitBossIcon size="lg" />
              <div>
                <h1 className="text-2xl font-avenir-bold text-black">
                  Transit Boss
                </h1>
                <p className="text-sm text-ct-gray-600 font-medium">
                  Puget Sound Service Alerts
                </p>
              </div>
              
              {/* Data source indicator */}
              {dataSource && (
                <div className="flex items-center space-x-1 ml-4">
                  {dataSource === 'live' ? (
                    <>
                      <div className="relative">
                        <Wifi className="h-4 w-4 text-ct-green-500" />
                        {/* Radar beam animation */}
                        <div className="absolute inset-0 h-4 w-4">
                          <div className="absolute inset-0 border border-ct-green-400 rounded-full animate-ping opacity-30"></div>
                          <div className="absolute inset-0 border border-ct-green-300 rounded-full animate-pulse opacity-20"></div>
                        </div>
                      </div>
                      <span className="text-sm text-ct-green-600 font-medium">Live Data</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-ct-orange-500" />
                      <span className="text-sm text-ct-orange-600 font-medium">Sample Data</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <div className="flex items-center space-x-2 text-sm text-ct-gray-600 bg-ct-gray-50 px-4 py-2 rounded-lg border border-ct-gray-200">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Updated {formatLastUpdated(lastUpdated)}</span>
              </div>
            )}
            
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="ct-button-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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