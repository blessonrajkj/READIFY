import React from "react";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
}

export default function Logo({ className = "flex items-center gap-2 group", iconClassName = "w-10 h-6", showText = true }: LogoProps) {
  return (
    <div className={className}>
      {/* Icon Wrapper - Transparent without background or outline */}
      <div className="w-14 h-9 p-1 flex items-center justify-center transition-premium group-hover:scale-105 active:scale-95">
        <svg
          viewBox="0 0 50 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={`${iconClassName} text-foreground`}
        >
          {/* Dynamic 7-Bar Audio Waveform */}
          <line x1="3" y1="8" x2="3" y2="16" />
          <line x1="7" y1="3" x2="7" y2="21" />
          <line x1="11" y1="5" x2="11" y2="19" />
          <line x1="15" y1="7" x2="15" y2="17" />
          <line x1="19" y1="2" x2="19" y2="22" />
          <line x1="23" y1="6" x2="23" y2="18" />
          <line x1="27" y1="10" x2="27" y2="14" />
          <line x1="31" y1="11" x2="31" y2="13" />
          <line x1="35" y1="11.5" x2="35" y2="12.5" />
        </svg>
      </div>
      
      {showText && (
        <svg
          viewBox="0 0 98 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[15px] w-auto text-foreground ml-1.5 select-none"
        >
          {/* R - Stencil cut at top-left corner */}
          <path d="M 2 7.5 L 2 20" />
          <path d="M 4.5 4 H 10 C 11.5 4, 12 5.5, 12 7 V 9 C 12 10.5, 11.5 12, 10 12 H 2" />
          <path d="M 8 12 L 12 20" />
          
          {/* E - Stencil cuts at top-left and bottom-left corners */}
          <path d="M 17 7.5 L 17 16.5" />
          <path d="M 19.5 4 H 27" />
          <path d="M 17 12 H 25" />
          <path d="M 19.5 20 H 27" />
          
          {/* A - Futuristic chevron style */}
          <path d="M 32 20 L 37 5 C 37.3 4, 37.7 4, 38 5 L 43 20" />
          
          {/* D - Stencil cut at top-left corner */}
          <path d="M 48 7.5 L 48 20" />
          <path d="M 50.5 4 H 55 C 58.5 4, 60.5 6, 60.5 9.5 V 14.5 C 60.5 18, 58.5 20, 55 20 H 48" />
          
          {/* I - Stencil cut at top-left corner */}
          <path d="M 65.5 7.5 L 65.5 20" />
          <path d="M 65.5 4 V 5" />
          
          {/* F - Stencil cut at top-left corner */}
          <path d="M 71 7.5 L 71 20" />
          <path d="M 73.5 4 H 79" />
          <path d="M 71 12 H 77" />
          
          {/* Y - Stylized split branches */}
          <path d="M 84 4 L 89.5 11.5" />
          <path d="M 95 4 L 89.5 11.5" />
          <path d="M 89.5 11.5 V 20" />
        </svg>
      )}
    </div>
  );
}
