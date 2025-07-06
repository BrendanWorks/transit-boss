import React from 'react';
import { AlertStats } from '../types/alerts';
import { 
  AlertTriangle, 
  Activity, 
  Bus, 
  Train, 
  Ship, 
  Zap,
  TrendingUp,
  Building2
} from 'lucide-react';

interface StatsCardProps {
  stats: AlertStats;
  onCardClick: (cardType: string) => void;
}

const serviceIconMap = {
  bus: Bus,
  'light-rail': Train,
  'commuter-rail': Train,
  ferry: Ship,
  streetcar: Zap
};

const severityColorMap = {
  low: 'text-ct-blue-500',
  medium: 'text-ct-orange-500',
  high: 'text-ct-orange-600',
  critical: 'text-red-600'
};

const formatAgencyName = (agency: string) => {
  return agency.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const StatsCard: React.FC<StatsCardProps> = ({ stats, onCardClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {/* Total Alerts */}
      <button 
        onClick={() => onCardClick('total')}
        className="ct-card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer text-left group focus:outline-none focus:ring-2 focus:ring-ct-blue-500 focus:ring-offset-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ct-gray-600 uppercase tracking-wide group-hover:text-ct-gray-700 transition-colors">Total Alerts</p>
            <p className="text-3xl font-bold text-ct-gray-900 font-display mt-1 group-hover:text-ct-blue-600 transition-colors">{stats.total}</p>
            <p className="text-xs text-ct-gray-500 mt-1 group-hover:text-ct-gray-600 transition-colors">Click to view all</p>
          </div>
          <div className="h-12 w-12 bg-ct-gray-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
        </div>
      </button>

      {/* Active Alerts */}
      <button 
        onClick={() => onCardClick('active')}
        className="ct-card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer text-left group focus:outline-none focus:ring-2 focus:ring-ct-green-500 focus:ring-offset-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ct-gray-600 uppercase tracking-wide group-hover:text-ct-gray-700 transition-colors">Active Now</p>
            <p className="text-3xl font-bold text-ct-green-500 font-display mt-1 group-hover:text-ct-green-600 transition-colors">{stats.active}</p>
            <p className="text-xs text-ct-gray-500 mt-1 group-hover:text-ct-gray-600 transition-colors">Click to view active</p>
          </div>
          <div className="h-12 w-12 bg-ct-gray-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <Activity className="h-6 w-6 text-white" />
          </div>
        </div>
      </button>

      {/* Most Affected Service */}
      <button 
        onClick={() => onCardClick('most-affected-service')}
        className="ct-card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer text-left group focus:outline-none focus:ring-2 focus:ring-ct-orange-500 focus:ring-offset-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ct-gray-600 uppercase tracking-wide group-hover:text-ct-gray-700 transition-colors">Most Affected</p>
            {Object.keys(stats.byService).length > 0 ? (
              <>
                <p className="text-lg font-bold text-ct-gray-900 capitalize font-display mt-1 group-hover:text-ct-orange-600 transition-colors">
                  {Object.entries(stats.byService)
                    .sort(([,a], [,b]) => b - a)[0]?.[0]?.replace('-', ' ') || 'None'}
                </p>
                <p className="text-sm text-ct-gray-500 font-medium group-hover:text-ct-gray-600 transition-colors">
                  {Object.entries(stats.byService).sort(([,a], [,b]) => b - a)[0]?.[1] || 0} alerts
                </p>
                <p className="text-xs text-ct-gray-500 mt-1 group-hover:text-ct-gray-600 transition-colors">Click to filter</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-ct-gray-900 font-display mt-1">None</p>
                <p className="text-xs text-ct-gray-500 mt-1">No data available</p>
              </>
            )}
          </div>
          <div className="h-12 w-12 bg-ct-gray-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
        </div>
      </button>

      {/* Most Affected Agency */}
      <button 
        onClick={() => onCardClick('most-affected-agency')}
        className="ct-card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer text-left group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ct-gray-600 uppercase tracking-wide group-hover:text-ct-gray-700 transition-colors">Top Agency</p>
            {Object.keys(stats.byAgency).length > 0 ? (
              <>
                <p className="text-lg font-bold text-ct-gray-900 font-display mt-1 group-hover:text-purple-600 transition-colors">
                  {formatAgencyName(Object.entries(stats.byAgency)
                    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none')}
                </p>
                <p className="text-sm text-ct-gray-500 font-medium group-hover:text-ct-gray-600 transition-colors">
                  {Object.entries(stats.byAgency).sort(([,a], [,b]) => b - a)[0]?.[1] || 0} alerts
                </p>
                <p className="text-xs text-ct-gray-500 mt-1 group-hover:text-ct-gray-600 transition-colors">Click to filter</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-ct-gray-900 font-display mt-1">None</p>
                <p className="text-xs text-ct-gray-500 mt-1">No data available</p>
              </>
            )}
          </div>
          <div className="h-12 w-12 bg-ct-gray-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <Building2 className="h-6 w-6 text-white" />
          </div>
        </div>
      </button>

      {/* Highest Severity */}
      <button 
        onClick={() => onCardClick('highest-severity')}
        className="ct-card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer text-left group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ct-gray-600 uppercase tracking-wide group-hover:text-ct-gray-700 transition-colors">Highest Severity</p>
            {Object.keys(stats.bySeverity).length > 0 ? (
              <>
                <p className="text-lg font-bold capitalize font-display mt-1 transition-colors">
                  <span className={`${severityColorMap[Object.entries(stats.bySeverity)
                    .sort(([a], [b]) => {
                      const order = ['critical', 'high', 'medium', 'low'];
                      return order.indexOf(a) - order.indexOf(b);
                    })[0]?.[0] as keyof typeof severityColorMap] || 'text-ct-gray-900'} group-hover:opacity-80`}>
                    {Object.entries(stats.bySeverity)
                      .sort(([a], [b]) => {
                        const order = ['critical', 'high', 'medium', 'low'];
                        return order.indexOf(a) - order.indexOf(b);
                      })[0]?.[0] || 'None'}
                  </span>
                </p>
                <p className="text-sm text-ct-gray-500 font-medium group-hover:text-ct-gray-600 transition-colors">
                  {Object.entries(stats.bySeverity)
                    .sort(([a], [b]) => {
                      const order = ['critical', 'high', 'medium', 'low'];
                      return order.indexOf(a) - order.indexOf(b);
                    })[0]?.[1] || 0} alerts
                </p>
                <p className="text-xs text-ct-gray-500 mt-1 group-hover:text-ct-gray-600 transition-colors">Click to filter</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-ct-gray-900 font-display mt-1">None</p>
                <p className="text-xs text-ct-gray-500 mt-1">No data available</p>
              </>
            )}
          </div>
          <div className="h-12 w-12 bg-ct-gray-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
        </div>
      </button>
    </div>
  );
};