'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'white' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ 
  className, 
  size = 'md', 
  showText = true, 
  variant = 'default' 
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14',
    md: 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24',
    lg: 'w-18 h-18 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32',
    xl: 'w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40'
  };

  const textSizeClasses = {
    sm: 'text-lg sm:text-xl md:text-2xl',
    md: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
    lg: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
    xl: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
  };

  const getColors = () => {
    switch (variant) {
      case 'white':
        return {
          primary: '#FFFFFF',
          secondary: '#F3F4F6',
          text: 'text-white'
        };
      case 'dark':
        return {
          primary: '#1F2937',
          secondary: '#374151',
          text: 'text-gray-900'
        };
      default:
        return {
          primary: '#2563EB',
          secondary: '#FB923C',
          text: 'text-blue-600'
        };
    }
  };

  const colors = getColors();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg
        className={cn('text-blue-600', sizeClasses[size])}
        viewBox="0 0 40 40"
        fill="currentColor"
        suppressHydrationWarning={true}
      >
        <path d="M20 0C8.95 0 0 8.95 0 20s8.95 20 20 20 20-8.95 20-20S31.05 0 20 0zm8 25h-6v6c0 1.1-.9 2-2 2s-2-.9-2-2v-6h-6c-1.1 0-2-.9-2-2s.9-2 2-2h6v-6c0-1.1.9-2 2-2s2 .9 2 2v6h6c1.1 0 2 .9 2 2s-.9 2-2 2z"/>
      </svg>
      {showText && (
        <span className={cn('font-bold tracking-tight', colors.text, textSizeClasses[size])}>
          Vendeu Online
        </span>
      )}
    </div>
  );
};

export default Logo;

// Componente apenas com o ícone
export const LogoIcon: React.FC<Omit<LogoProps, 'showText'>> = (props) => (
  <Logo {...props} showText={false} />
);

// Componente apenas com o texto
export const LogoText: React.FC<Pick<LogoProps, 'className' | 'size' | 'variant'>> = ({ 
  className, 
  size = 'md', 
  variant = 'default' 
}) => {
  const textSizeClasses = {
    sm: 'text-lg sm:text-xl md:text-2xl',
    md: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
    lg: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
    xl: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
  };

  const getTextColor = () => {
    switch (variant) {
      case 'white':
        return 'text-white';
      case 'dark':
        return 'text-gray-900';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className={cn('flex flex-col leading-tight', className)}>
      <span className={cn(
        'font-bold tracking-tight',
        textSizeClasses[size],
        getTextColor()
      )}>
        Vendeu
      </span>
      <span className={cn(
        'font-bold tracking-tight',
        textSizeClasses[size],
        getTextColor()
      )}>
        Online
      </span>
    </div>
  );
};