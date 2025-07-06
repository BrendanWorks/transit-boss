import React from 'react';
import { Building2, Bus, Train, Ship, Zap } from 'lucide-react';
import { AGENCIES } from '../config/agencies';

interface GenericAgencyLogoProps {
  agency: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

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

const serviceIcons = {
  bus: Bus,
  'light-rail': Train,
  'commuter-rail': Train,
  ferry: Ship,
  streetcar: Zap,
  subway: Train
};

export const GenericAgencyLogo: React.FC<GenericAgencyLogoProps> = ({ 
  agency, 
  size = 'md', 
  className = '' 
}) => {
  const config = AGENCIES[agency];
  const sizeStyles = sizeConfig[size];
  
  if (!config) {
    return (
      <div 
        className={`${sizeStyles.container} bg-gray-400 rounded-lg flex items-center justify-center ${className}`}
        title="Unknown Agency"
      >
        <Building2 className={`${sizeStyles.icon} text-white`} />
      </div>
    );
  }

  // Use icon if specified, otherwise use text
  if (config.useIcon && config.services.length > 0) {
    const IconComponent = serviceIcons[config.services[0]] || Bus;
    
    return (
      <div 
        className={`${sizeStyles.container} ${config.color} rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-shadow ${className}`}
        title={config.name}
      >
        <IconComponent className={`${sizeStyles.icon} ${config.textColor || 'text-white'}`} />
      </div>
    );
  }

  // Use text logo
  return (
    <div 
      className={`${sizeStyles.container} ${config.color} rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-shadow ${className}`}
      title={config.name}
    >
      <span className={`${sizeStyles.text} font-bold ${config.textColor || 'text-white'} tracking-tight`}>
        {config.logoText || config.shortName}
      </span>
    </div>
  );
};