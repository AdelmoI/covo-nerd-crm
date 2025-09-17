// src/components/ui/Logo.tsx
'use client';

import { useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'small';
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-16',
  xl: 'h-20'
};

export default function Logo({ 
  size = 'md', 
  variant = 'default', 
  showText = true,
  className = '' 
}: LogoProps) {
  const [imageError, setImageError] = useState(false);

  const getImageSrc = () => {
    switch (variant) {
      case 'white':
        return '/images/logo-white.png';
      case 'small':
        return '/images/logo-small.png';
      default:
        return '/images/logo.png';
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`flex items-center ${className}`}>
      {!imageError ? (
        <img 
          src={getImageSrc()}
          alt="Il Covo del Nerd Logo" 
          className={`w-auto ${sizeClasses[size]} object-contain`}
          onError={handleImageError}
        />
      ) : (
        // Fallback quando l'immagine non è disponibile
        <div 
          className={`${sizeClasses[size]} w-auto flex items-center justify-center rounded bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm px-3`}
          style={{ backgroundColor: '#1D70B3' }}
        >
          <span>COVO</span>
        </div>
      )}
      
      {showText && (
        <div className="ml-3">
          <h1 className="font-bold text-lg leading-tight" style={{ color: '#1D70B3' }}>
            Il Covo del Nerd
          </h1>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            CRM System
          </p>
        </div>
      )}
    </div>
  );
}