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
          viewBox="0 0 38 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={`${iconClassName} text-foreground`}
        >
          {/* Thick, Rounded Waveform Profile (matching screenshot) */}
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
        <span className="font-extrabold tracking-tight text-sm font-sans text-foreground">
          Readify
        </span>
      )}
    </div>
  );
}
