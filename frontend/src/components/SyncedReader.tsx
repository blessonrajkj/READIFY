"use client";

import React, { useEffect, useRef } from "react";
import { Play } from "lucide-react";

interface AudioChunk {
  chunk_id: string;
  text: string;
  chunk_index: number;
  page_number: number | null;
  audio_url: string | null;
  status: string;
  duration: number;
}

interface SyncedReaderProps {
  chunks: AudioChunk[];
  activeChunkIndex: number;
  onChunkClick?: (index: number) => void;
}

export default function SyncedReader({
  chunks,
  activeChunkIndex,
  onChunkClick
}: SyncedReaderProps) {
  const activeRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to keep active chunk in view
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [activeChunkIndex]);

  if (chunks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <p className="text-sm">No text available for this chapter.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-16 font-sans">
      <div className="flex flex-col gap-6 md:gap-8">
        {chunks.map((chunk, idx) => {
          const isActive = idx === activeChunkIndex;
          return (
            <div
              key={chunk.chunk_id}
              ref={isActive ? activeRef : null}
              onClick={() => onChunkClick && onChunkClick(idx)}
              className={`group relative rounded-2xl p-4 md:p-6 transition-premium cursor-pointer border ${
                isActive
                  ? "bg-primary/[0.03] border-primary/20 shadow-sm"
                  : "bg-transparent border-transparent hover:bg-muted/30"
              }`}
            >
              {/* Left Highlight Indicator */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-premium ${
                  isActive ? "bg-primary" : "bg-transparent"
                }`}
              ></div>

              {/* Page Number indicator */}
              {chunk.page_number !== null && (
                <span className="absolute right-4 top-2 text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-premium">
                  Page {chunk.page_number + 1}
                </span>
              )}

              {/* Action Button on Hover */}
              <button 
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-premium ${
                  isActive ? "pointer-events-none hidden" : ""
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
              </button>

              {/* Paragraph Text */}
              <p
                className={`text-sm md:text-base leading-relaxed tracking-normal font-sans transition-premium ${
                  isActive 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground/80 group-hover:text-foreground/90"
                } ${!isActive && "md:pl-4" /* Indent hover item slightly to fit play button space */}`}
              >
                {chunk.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
