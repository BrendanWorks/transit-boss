import React from 'react';
import { Building2, Bus, Train, Ship, Zap } from 'lucide-react';

interface AgencyLogoProps {
  agency: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const agencyConfig = {
  'sound-transit': {
    name: 'Sound Transit',
    color: 'bg-blue-600',
    textColor: 'text-white',
    icon: Train,
    logoText: 'ST',
    useText: true
  },
  'community-transit': {
    name: 'Community Transit',
    color: 'bg-ct-blue-500',
    textColor: 'text-white',
    icon: Bus,
    logoText: 'CT',
    useText: true
  },
  'king-county-metro': {
    name: 'King County Metro',
    color: 'bg-kcm-navy-800',
    textColor: 'text-white',
    icon: Bus,
    logoText: 'KCM',
    useText: true
  },
  'link-light-rail': {
    name: 'Link Light Rail',
    color: 'bg-ct-green-500',
    textColor: 'text-white',
    icon: Train,
    logoText: 'LINK',
    useText: false // Use icon for Link
  },
  'everett-transit': {
    name: 'Everett Transit',
    color: 'bg-emerald-600',
    textColor: 'text-white',
    icon: Bus,
    logoText: 'ET',
    useText: true
  },
  'washington-state-ferries': {
    name: 'WA State Ferries',
    color: 'bg-teal-700',
    textColor: 'text-white',
    icon: Ship,
    logoText: 'WSF',
    useText: false // Use ship icon for ferries
  }
};

const sizeConfig = {
  sm: {
    container: 'h-8 w-8',
    text: 'text-xs',
    icon: 'h-3 w-3'
  },
  md: {
    container: 'h-10 w-10',
    text: 'text-sm',
    icon: 'h-4 w-4'
  },
  lg: {
    container: 'h-12 w-12',
    text: 'text-base',
    icon: 'h-5 w-5'
  }
};

export const AgencyLogo: React.FC<AgencyLogoProps> = ({ 
  agency, 
  size = 'md', 
  className = '' 
}) => {
  const config = agencyConfig[agency as keyof typeof agencyConfig];
  const sizeStyles = sizeConfig[size];
  
  if (!config) {
    return (
      <div 
        className={`${sizeStyles.container} bg-ct-gray-400 rounded-lg flex items-center justify-center ${className}`}
        title="Unknown Agency"
      >
        <Building2 className={`${sizeStyles.icon} text-white`} />
      </div>
    );
  }

  const IconComponent = config.icon;

  return (
    <div 
      className={`${sizeStyles.container} ${config.color} rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-shadow ${className}`}
      title={config.name}
    >
      {config.useText ? (
        <span className={`${sizeStyles.text} font-bold ${config.textColor} tracking-tight`}>
          {config.logoText}
        </span>
      ) : (
        <IconComponent className={`${sizeStyles.icon} ${config.textColor}`} />
      )}
    </div>
  );
};