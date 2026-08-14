import React from "react";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
}

export default function Logo({ className = "flex items-center gap-2.5 group", iconClassName = "w-4 h-4", showText = true }: LogoProps) {
  return (
    <div className={className}>
      {/* Double Bezel Icon Wrapper */}
      <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 p-1 ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center transition-premium group-hover:scale-105 active:scale-95 shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${iconClassName} text-foreground`}
        >
          {/* Headphone Headband */}
          <path d="M 3.5 13 A 8.5 8.5 0 0 1 20.5 13" />
          
          {/* Left Page (with subtle transparency fill) */}
          <path 
            d="M 12 13 C 10 11.5, 7.5 11.5, 5 13 L 5 19 C 7.5 17.5, 10 17.5, 12 19 Z" 
            fill="currentColor" 
            fillOpacity="0.1" 
          />
          
          {/* Right Page (with subtle transparency fill) */}
          <path 
            d="M 12 13 C 14 11.5, 16.5 11.5, 19 13 L 19 19 C 16.5 17.5, 14 17.5, 12 19 Z" 
            fill="currentColor" 
            fillOpacity="0.1" 
          />
          
          {/* Minimalist Earcups */}
          <rect x="2" y="12" width="1.5" height="4" rx="0.75" fill="currentColor" stroke="none" />
          <rect x="20.5" y="12" width="1.5" height="4" rx="0.75" fill="currentColor" stroke="none" />
        </svg>
      </div>
      
      {showText && (
        <span className="font-extrabold tracking-tight text-sm font-sans text-foreground">
          Readify
        </span>
      )}
    </div>
  );
}
