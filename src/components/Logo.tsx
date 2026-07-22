import React from 'react';
interface LogoProps {
  className?: string;
  showText?: boolean;
  horizontal?: boolean;
  light?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ 
  className = '', 
  showText = true, 
  horizontal = false, 
  light = false,
  size = 'md'
}: LogoProps) {

  const imgSizes = {
    sm: 'h-8 w-16',
    md: 'h-12 w-24',
    lg: 'h-[90px] w-[180px] sm:h-[100px] sm:w-[200px]'
  };

  const titleSizes = {
    sm: 'text-xs font-bold',
    md: 'text-sm font-extrabold',
    lg: 'text-3xl sm:text-[36px] lg:text-[38px] font-bold'
  };

  const subtitleSizes = {
    sm: 'text-[7px]',
    md: 'text-[9px]',
    lg: 'text-sm sm:text-base lg:text-[18px] font-medium'
  };

  const containerClasses = horizontal
    ? size === 'lg'
      ? 'flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left'
      : 'flex flex-row items-center gap-3 text-left'
    : 'flex flex-col items-center justify-center text-center';

  return (
    <div className={`${containerClasses} ${className}`}>
      {showText && (
        <div className={horizontal && size === 'lg' ? 'text-center sm:text-left' : horizontal ? 'text-left' : 'mt-2'}>
          <p className={`${titleSizes[size]} tracking-tight leading-none ${light ? 'text-primary-foreground' : 'text-foreground'}`}>FIFC</p>
          {size === 'lg' && (
            <p className={`${subtitleSizes[size]} leading-tight mt-2 ${light ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              Procurement Management System
            </p>
          )}
        </div>
      )}
    </div>
  );
}
