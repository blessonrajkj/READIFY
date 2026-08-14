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
          strokeWidth="3"
          strokeLinecap="round"
          className={`${iconClassName} text-foreground`}
        >
          {/* Dynamic 7-Bar Audio Waveform */}
          <line x1="3" y1="10" x2="3" y2="14" />
          <line x1="6" y1="7" x2="6" y2="17" />
          <line x1="9" y1="4" x2="9" y2="20" />
          <line x1="12" y1="9" x2="12" y2="15" />
          <line x1="15" y1="3" x2="15" y2="21" />
          <line x1="18" y1="7" x2="18" y2="17" />
          <line x1="21" y1="10" x2="21" y2="14" />
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
