import React from 'react';
import { Bus, MapPin } from 'lucide-react';

interface TransitBossIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'h-8 w-8',
    bus: 'h-4 w-4',
    circle: 'h-6 w-6',
    map: 'h-3 w-3'
  },
  md: {
    container: 'h-10 w-10',
    bus: 'h-5 w-5',
    circle: 'h-8 w-8',
    map: 'h-4 w-4'
  },
  lg: {
    container: 'h-12 w-12',
    bus: 'h-6 w-6',
    circle: 'h-10 w-10',
    map: 'h-5 w-5'
  }
};

export const TransitBossIcon: React.FC<TransitBossIconProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const styles = sizeConfig[size];

  return (
    <div className={`${styles.container} relative flex items-center justify-center ${className}`}>
      {/* Background circle with gradient */}
      <div className={`${styles.circle} bg-gradient-to-br from-ct-blue-500 to-ct-green-500 rounded-full flex items-center justify-center shadow-lg`}>
        {/* White "T" letter */}
        <span className="text-white font-bold text-lg leading-none">T</span>
      </div>
      
      {/* Bus icon positioned to the left */}
      <div className="absolute -left-1 top-0 bg-ct-gray-800 rounded-md p-1 shadow-md">
        <Bus className={`${styles.bus} text-white`} />
      </div>
      
      {/* Small map indicator */}
      <div className="absolute -bottom-1 -right-1 bg-ct-green-500 rounded-full p-0.5 shadow-sm">
        <MapPin className={`${styles.map} text-white`} />
      </div>
    </div>
  );
};