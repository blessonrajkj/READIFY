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
          {/* Circular frame (CD / Vinyl record) open at the bottom */}
          <path d="M 4.5 15 A 8 8 0 1 1 19.5 15" />
          
          {/* Open book pages bridging the bottom */}
          <path 
            d="M 4.5 15 C 7.5 17.2, 9.5 17.2, 12 15 C 14.5 17.2, 16.5 17.2, 19.5 15" 
            fill="currentColor" 
            fillOpacity="0.1" 
          />
          
          {/* Spine / Ribbon Bookmark extending down */}
          <line x1="12" y1="15" x2="12" y2="21" strokeWidth="2.5" />
          
          {/* Inner Audio Waves */}
          <line x1="9" y1="8" x2="9" y2="12" strokeWidth="2" />
          <line x1="12" y1="6" x2="12" y2="12" strokeWidth="2" />
          <line x1="15" y1="8" x2="15" y2="12" strokeWidth="2" />
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
