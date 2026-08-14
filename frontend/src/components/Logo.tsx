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
      <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center transition-premium group-hover:scale-105 active:scale-95 shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={`${iconClassName} text-foreground`}
        >
          {/* Central Book Spine / Peak Soundwave */}
          <line x1="12" y1="3" x2="12" y2="21" className="stroke-[3px]" />
          
          {/* Left Page (Text lines of a book merging into audio bars) */}
          <line x1="5" y1="7" x2="9" y2="7" />
          <line x1="3" y1="12" x2="9" y2="12" className="stroke-[2.8px]" />
          <line x1="6" y1="17" x2="9" y2="17" />
          
          {/* Right Page (Text lines of a book merging into audio bars) */}
          <line x1="15" y1="7" x2="19" y2="7" />
          <line x1="15" y1="12" x2="21" y2="12" className="stroke-[2.8px]" />
          <line x1="15" y1="17" x2="18" y2="17" />
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
