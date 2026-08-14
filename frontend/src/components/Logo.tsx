import React from "react";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
}

export default function Logo({ className = "flex items-center gap-3 group", iconClassName = "w-12 h-6", showText = true }: LogoProps) {
  return (
    <div className={className}>
      {/* Double Bezel Icon Wrapper - Horizontal Pill */}
      <div className="w-16 h-9 rounded-xl bg-black/5 dark:bg-white/5 p-1 ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center transition-premium group-hover:scale-105 active:scale-95 shadow-sm">
        <svg
          viewBox="0 0 50 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className={`${iconClassName} text-foreground`}
        >
          {/* Detailed Audio Waveform Signature (matching screenshot peaks) */}
          <line x1="3" y1="11.5" x2="3" y2="12.5" />
          <line x1="5" y1="11" x2="5" y2="13" />
          <line x1="7" y1="11" x2="7" y2="13" />
          <line x1="9" y1="10" x2="9" y2="14" />
          <line x1="11" y1="8" x2="11" y2="16" />
          {/* Main double peaks */}
          <line x1="13" y1="2" x2="13" y2="22" className="stroke-[2px]" />
          <line x1="15" y1="3.5" x2="15" y2="20.5" className="stroke-[2px]" />
          {/* Mid section valley */}
          <line x1="17" y1="10" x2="17" y2="14" />
          <line x1="19" y1="10.5" x2="19" y2="13.5" />
          <line x1="21" y1="11" x2="21" y2="13" />
          <line x1="23" y1="10.5" x2="23" y2="13.5" />
          <line x1="25" y1="10" x2="25" y2="14" />
          <line x1="27" y1="10.5" x2="27" y2="13.5" />
          <line x1="29" y1="11" x2="29" y2="13" />
          <line x1="31" y1="10" x2="31" y2="14" />
          {/* Secondary peaks */}
          <line x1="33" y1="7" x2="33" y2="17" />
          <line x1="35" y1="5.5" x2="35" y2="18.5" />
          <line x1="37" y1="7" x2="37" y2="17" />
          {/* Mid valley 2 */}
          <line x1="39" y1="11" x2="39" y2="13" />
          <line x1="41" y1="11" x2="41" y2="13" />
          {/* Third small peak */}
          <line x1="43" y1="7.5" x2="43" y2="16.5" />
          <line x1="45" y1="7.5" x2="45" y2="16.5" />
          <line x1="47" y1="11.5" x2="47" y2="12.5" />
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
